import * as assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { GitService, createRebaseService } from '../git';
import type { InteractiveRebaseCommit } from '../git';

const git = new GitService();
const rebaseService = createRebaseService(git);

async function makeRepo(): Promise<string> {
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'intelligit-e2e-'));
	await git.exec(dir, ['init', '-b', 'main']);
	await git.exec(dir, ['config', 'user.email', 'e2e@test.dev']);
	await git.exec(dir, ['config', 'user.name', 'E2E Tester']);
	await git.exec(dir, ['config', 'commit.gpgsign', 'false']);
	return dir;
}

async function writeAndCommit(
	dir: string,
	file: string,
	content: string,
	message: string,
): Promise<string> {
	await fs.writeFile(path.join(dir, file), content, 'utf8');
	await git.exec(dir, ['add', '--', file]);
	await git.exec(dir, ['commit', '-m', message]);
	const head = await git.exec(dir, ['rev-parse', 'HEAD']);
	return head.stdout.trim();
}

/** Commit subjects, newest first. */
async function subjects(dir: string): Promise<string[]> {
	const result = await git.exec(dir, ['log', '--pretty=format:%s']);
	return result.stdout.split('\n').filter(Boolean);
}

async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

suite('Rebase & Conflicts E2E (real git)', () => {
	test('standard rebase: detect conflict, expose 3-way versions, resolve via merge-apply path, continue', async () => {
		const dir = await makeRepo();
		try {
			await writeAndCommit(dir, 'file.txt', 'line1\nline2\nline3\n', 'base');

			await git.exec(dir, ['checkout', '-b', 'feature']);
			await writeAndCommit(dir, 'file.txt', 'line1\nFEATURE\nline3\n', 'feature edit');

			await git.exec(dir, ['checkout', 'main']);
			await writeAndCommit(dir, 'file.txt', 'line1\nMAIN\nline3\n', 'main edit');

			await git.exec(dir, ['checkout', 'feature']);

			// Rebasing feature onto main must conflict on file.txt.
			await assert.rejects(
				rebaseService.runStandardRebase(dir, { onto: 'main', flags: [] }),
			);

			const state = await git.getMergeOperationState(dir);
			assert.equal(state.isRebaseInProgress, true);
			assert.equal(state.type, 'rebase');

			const conflicts = await git.getConflictFiles(dir);
			assert.deepEqual(conflicts, ['file.txt']);

			// The merge editor reads these stages; both sides must be present and differ.
			const versions = await git.getFileVersions(dir, 'file.txt');
			assert.ok(versions.ours.length > 0, 'ours stage should be populated');
			assert.ok(versions.theirs.length > 0, 'theirs stage should be populated');
			assert.notEqual(versions.ours, versions.theirs);

			// Resolve exactly how the merge editor "Apply" does it.
			await git.saveMergedContent(dir, 'file.txt', 'line1\nMERGED\nline3\n');
			await git.stageFile(dir, 'file.txt');
			assert.deepEqual(await git.getConflictFiles(dir), []);

			await git.rebaseContinue(dir);

			const after = await git.getMergeOperationState(dir);
			assert.equal(after.isRebaseInProgress, false);
			assert.equal(after.type, 'none');

			const history = await subjects(dir);
			assert.ok(history.includes('feature edit'), 'feature commit replayed');
			assert.ok(history.includes('main edit'), 'main commit is now ancestor');

			const finalContent = await git.readWorkingFile(dir, 'file.txt');
			assert.equal(finalContent, 'line1\nMERGED\nline3\n');
		} finally {
			await fs.rm(dir, { recursive: true, force: true });
		}
	});

	test('standard rebase: abort restores clean state', async () => {
		const dir = await makeRepo();
		try {
			await writeAndCommit(dir, 'file.txt', 'a\nb\nc\n', 'base');
			await git.exec(dir, ['checkout', '-b', 'feature']);
			await writeAndCommit(dir, 'file.txt', 'a\nFEATURE\nc\n', 'feature edit');
			await git.exec(dir, ['checkout', 'main']);
			await writeAndCommit(dir, 'file.txt', 'a\nMAIN\nc\n', 'main edit');
			await git.exec(dir, ['checkout', 'feature']);

			await assert.rejects(
				rebaseService.runStandardRebase(dir, { onto: 'main', flags: [] }),
			);
			assert.equal((await git.getMergeOperationState(dir)).isRebaseInProgress, true);

			await rebaseService.abortRebase(dir);

			assert.equal((await git.getMergeOperationState(dir)).isRebaseInProgress, false);
			assert.deepEqual(await git.getConflictFiles(dir), []);
			// Feature commit is intact after abort.
			assert.deepEqual(await subjects(dir), ['feature edit', 'base']);
		} finally {
			await fs.rm(dir, { recursive: true, force: true });
		}
	});

	test('interactive rebase: fixup folds a commit and drop removes one', async () => {
		const dir = await makeRepo();
		try {
			await writeAndCommit(dir, 'a.txt', 'A\n', 'commit A');
			const bHash = await writeAndCommit(dir, 'b.txt', 'B\n', 'commit B');
			await writeAndCommit(dir, 'c.txt', 'C\n', 'commit C');
			await writeAndCommit(dir, 'd.txt', 'D\n', 'commit D');

			const loaded = await rebaseService.loadInteractiveCommits(dir, bHash);
			assert.deepEqual(
				loaded.map((c) => c.message),
				['commit B', 'commit C', 'commit D'],
			);

			const plan: InteractiveRebaseCommit[] = loaded.map((c) => {
				if (c.message === 'commit C') {
					return { ...c, action: 'fixup' };
				}
				if (c.message === 'commit D') {
					return { ...c, action: 'drop' };
				}
				return c;
			});

			await rebaseService.runInteractiveRebase(dir, bHash, plan, []);

			// D dropped, C folded into B (message discarded by fixup).
			assert.deepEqual(await subjects(dir), ['commit B', 'commit A']);
			// fixup keeps C's file changes; drop removes D's file.
			assert.equal(await fileExists(path.join(dir, 'c.txt')), true);
			assert.equal(await fileExists(path.join(dir, 'd.txt')), false);
		} finally {
			await fs.rm(dir, { recursive: true, force: true });
		}
	});

	test('interactive rebase: rename (reword) applies the new message without blocking', async () => {
		const dir = await makeRepo();
		try {
			await writeAndCommit(dir, 'a.txt', 'A\n', 'commit A');
			const bHash = await writeAndCommit(dir, 'b.txt', 'B\n', 'commit B');
			await writeAndCommit(dir, 'c.txt', 'C\n', 'commit C');

			const loaded = await rebaseService.loadInteractiveCommits(dir, bHash);
			const plan: InteractiveRebaseCommit[] = loaded.map((c) =>
				c.message === 'commit B'
					? { ...c, action: 'reword', message: 'commit B (renamed)' }
					: c,
			);

			// Must complete on its own — no interactive editor may block here.
			await rebaseService.runInteractiveRebase(dir, bHash, plan, []);

			assert.deepEqual(await subjects(dir), [
				'commit C',
				'commit B (renamed)',
				'commit A',
			]);
		} finally {
			await fs.rm(dir, { recursive: true, force: true });
		}
	});

	test('interactive rebase: reordering commits is applied', async () => {
		const dir = await makeRepo();
		try {
			await writeAndCommit(dir, 'a.txt', 'A\n', 'commit A');
			const bHash = await writeAndCommit(dir, 'b.txt', 'B\n', 'commit B');
			await writeAndCommit(dir, 'c.txt', 'C\n', 'commit C');

			const loaded = await rebaseService.loadInteractiveCommits(dir, bHash);
			assert.equal(loaded.length, 2);
			const [first, second] = loaded;
			assert.ok(first && second);

			// Swap order: apply C before B.
			await rebaseService.runInteractiveRebase(dir, bHash, [second, first], []);

			assert.deepEqual(await subjects(dir), ['commit B', 'commit C', 'commit A']);
		} finally {
			await fs.rm(dir, { recursive: true, force: true });
		}
	});
});
