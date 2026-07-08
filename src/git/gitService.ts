import { execFile } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { promisify } from 'node:util';

import {
	datePresetToGitArgs,
	GIT_LOG_PRETTY_FORMAT,
	parseGitLog,
} from './logParser';
import type {
	CommitFile,
	FileVersions,
	GitBranch,
	GitExecResult,
	GitLogFilters,
	GitLogOptions,
	GitRepositoryInfo,
	MergeOperationState,
	ParsedGitLog,
} from './types';

const execFileAsync = promisify(execFile);

export class GitService {
	/**
	 * Run a git command in the given repository root.
	 * Throws on non-zero exit unless `allowFailure` is true.
	 */
	async exec(
		repoRoot: string,
		args: string[],
		options: {
			allowFailure?: boolean;
			maxBuffer?: number;
			env?: Record<string, string | undefined>;
		} = {},
	): Promise<GitExecResult> {
		const { allowFailure = false, maxBuffer = 10 * 1024 * 1024, env } = options;

		try {
			const { stdout, stderr } = await execFileAsync('git', args, {
				cwd: repoRoot,
				maxBuffer,
				encoding: 'utf8',
				env: { ...process.env, GIT_TERMINAL_PROMPT: '0', ...env },
			});
			return {
				stdout: stdout ?? '',
				stderr: stderr ?? '',
				exitCode: 0,
			};
		} catch (error: unknown) {
			const execError = error as NodeJS.ErrnoException & {
				stdout?: string;
				stderr?: string;
				code?: number;
			};
			const result: GitExecResult = {
				stdout: execError.stdout ?? '',
				stderr: execError.stderr ?? '',
				exitCode: typeof execError.code === 'number' ? execError.code : 1,
			};
			if (!allowFailure) {
				const msg = result.stderr.trim() || result.stdout.trim() || 'Git command failed';
				throw new Error(`git ${args.join(' ')}: ${msg}`);
			}
			return result;
		}
	}

	/** Verify that `dir` is inside a git work tree and return the repo root. */
	async findRepositoryRoot(startDir: string): Promise<string | undefined> {
		const result = await this.exec(startDir, ['rev-parse', '--show-toplevel'], {
			allowFailure: true,
		});
		if (result.exitCode !== 0) {
			return undefined;
		}
		return result.stdout.trim();
	}

	async getRepositoryInfo(repoRoot: string): Promise<GitRepositoryInfo> {
		const [branchResult, branches] = await Promise.all([
			this.exec(repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD'], {
				allowFailure: true,
			}),
			this.listBranches(repoRoot),
		]);

		const [rebaseMerge, rebaseApply, mergeHead] = await Promise.all([
			this.pathExists(path.join(repoRoot, '.git', 'rebase-merge')),
			this.pathExists(path.join(repoRoot, '.git', 'rebase-apply')),
			this.pathExists(path.join(repoRoot, '.git', 'MERGE_HEAD')),
		]);

		return {
			root: repoRoot,
			currentBranch:
				branchResult.exitCode === 0 ? branchResult.stdout.trim() : 'HEAD',
			branches,
			isRebaseInProgress: rebaseMerge || rebaseApply,
			isMergeInProgress: mergeHead,
		};
	}

	async listBranches(repoRoot: string): Promise<GitBranch[]> {
		const result = await this.exec(repoRoot, [
			'branch',
			'-a',
			'--format=%(refname:short)|%(upstream:short)|%(HEAD)',
		]);

		const branches: GitBranch[] = [];
		for (const line of result.stdout.split('\n')) {
			const trimmed = line.trim();
			if (!trimmed) {
				continue;
			}
			const [name, upstream, head] = trimmed.split('|');
			if (!name) {
				continue;
			}
			branches.push({
				name,
				remote: name.includes('/') && !name.startsWith('HEAD'),
				current: head === '*',
				upstream: upstream || undefined,
			});
		}
		return branches;
	}

	/**
	 * Fetch structured commit history with optional filters.
	 * Uses a custom pretty-format parsed by {@link parseGitLog}.
	 */
	async getLog(repoRoot: string, options: GitLogOptions = {}): Promise<ParsedGitLog> {
		const args = this.buildLogArgs(options);
		const result = await this.exec(repoRoot, args);
		return parseGitLog(result.stdout);
	}

	buildLogArgs(options: GitLogOptions): string[] {
		const { maxCount = 500, filters } = options;
		const args: string[] = ['log', `--pretty=format:${GIT_LOG_PRETTY_FORMAT}`, '--date-order'];

		if (maxCount > 0) {
			args.push(`-n`, String(maxCount));
		}

		if (filters) {
			this.applyLogFilters(args, filters);
		} else {
			args.push('--all');
		}

		return args;
	}

	private applyLogFilters(args: string[], filters: GitLogFilters): void {
		const { branchScope, author, datePreset, since, until, path: pathFilter } =
			filters;

		switch (branchScope) {
			case 'local':
				args.push('--branches');
				break;
			case 'remote':
				args.push('--remotes');
				break;
			case 'all':
				args.push('--all');
				break;
			default:
				if (branchScope) {
					args.push(branchScope);
				} else {
					args.push('--all');
				}
				break;
		}

		if (author) {
			args.push(`--author=${author}`);
		}

		const presetDates = datePresetToGitArgs(datePreset);
		if (since ?? presetDates.since) {
			args.push(`--since=${since ?? presetDates.since}`);
		}
		if (until ?? presetDates.until) {
			args.push(`--until=${until ?? presetDates.until}`);
		}

		if (pathFilter) {
			args.push('--', pathFilter);
		}
	}

	async resolveRevision(repoRoot: string, ref: string): Promise<string | undefined> {
		const result = await this.exec(
			repoRoot,
			['rev-parse', '--verify', ref],
			{ allowFailure: true },
		);
		if (result.exitCode !== 0) {
			return undefined;
		}
		return result.stdout.trim();
	}

	/** Commits from `fromHash` through HEAD (inclusive), oldest first. */
	async getRebaseCommitRange(
		repoRoot: string,
		fromHash: string,
	): Promise<{ hash: string; shortHash: string; message: string; timestamp: number }[]> {
		const result = await this.exec(repoRoot, [
			'log',
			'--reverse',
			'--pretty=format:%H|%h|%at|%s',
			`${fromHash}^..HEAD`,
		], { allowFailure: true });

		if (result.exitCode !== 0) {
			// Root commit — only the selected commit may be reachable
			const single = await this.exec(repoRoot, [
				'log',
				'-1',
				'--pretty=format:%H|%h|%at|%s',
				fromHash,
			]);
			return parseCommitRangeLines(single.stdout);
		}

		return parseCommitRangeLines(result.stdout);
	}

	async getCommitParent(repoRoot: string, hash: string): Promise<string | undefined> {
		const result = await this.exec(
			repoRoot,
			['rev-parse', `${hash}^`],
			{ allowFailure: true },
		);
		if (result.exitCode !== 0) {
			return undefined;
		}
		return result.stdout.trim();
	}

	async getFileContent(
		repoRoot: string,
		ref: string,
		filePath: string,
	): Promise<string> {
		if (ref === '0000000000000000000000000000000000000000') {
			return '';
		}
		const result = await this.exec(
			repoRoot,
			['show', `${ref}:${filePath}`],
			{ allowFailure: true },
		);
		if (result.exitCode !== 0) {
			return '';
		}
		return result.stdout;
	}

	async listRebaseRefs(repoRoot: string): Promise<string[]> {
		const [branches, tags] = await Promise.all([
			this.exec(repoRoot, ['branch', '-a', '--format=%(refname:short)']),
			this.exec(repoRoot, ['tag', '-l'], { allowFailure: true }),
		]);
		const names = new Set<string>();
		for (const line of branches.stdout.split('\n')) {
			const name = line.trim();
			if (name && name !== 'HEAD') {
				names.add(name);
			}
		}
		for (const line of tags.stdout.split('\n')) {
			const name = line.trim();
			if (name) {
				names.add(name);
			}
		}
		return [...names].sort((a, b) => a.localeCompare(b));
	}

	/** Files changed in a single commit. */
	async getCommitFiles(repoRoot: string, hash: string): Promise<CommitFile[]> {
		const result = await this.exec(repoRoot, [
			'diff-tree',
			'--no-commit-id',
			'--name-status',
			'-r',
			hash,
		]);

		return result.stdout
			.split('\n')
			.filter(Boolean)
			.map(parseNameStatusLine)
			.filter((f): f is CommitFile => f !== undefined);
	}

	async checkoutRevision(repoRoot: string, hash: string): Promise<void> {
		await this.exec(repoRoot, ['checkout', hash]);
	}

	async cherryPick(repoRoot: string, hash: string): Promise<void> {
		await this.exec(repoRoot, ['cherry-pick', hash]);
	}

	async revertCommit(repoRoot: string, hash: string): Promise<void> {
		await this.exec(repoRoot, ['revert', '--no-edit', hash]);
	}

	async getMergeOperationState(repoRoot: string): Promise<MergeOperationState> {
		const gitDir = path.join(repoRoot, '.git');
		const [rebaseMerge, rebaseApply, mergeHead] = await Promise.all([
			this.pathExists(path.join(gitDir, 'rebase-merge')),
			this.pathExists(path.join(gitDir, 'rebase-apply')),
			this.pathExists(path.join(gitDir, 'MERGE_HEAD')),
		]);

		let message = '';
		if (rebaseMerge) {
			try {
				const num = await this.readGitFile(gitDir, 'rebase-merge', 'msgnum');
				const total = await this.readGitFile(gitDir, 'rebase-merge', 'end');
				message = `Rebasing (${num}/${total})`;
			} catch {
				message = 'Rebase in progress';
			}
		} else if (rebaseApply) {
			message = 'Rebase in progress';
		} else if (mergeHead) {
			message = (await this.readGitFile(gitDir, 'MERGE_MSG')) || 'Merge in progress';
		}

		return {
			type: rebaseMerge || rebaseApply ? 'rebase' : mergeHead ? 'merge' : 'none',
			message,
			isRebaseInProgress: rebaseMerge || rebaseApply,
			isMergeInProgress: mergeHead,
		};
	}

	async getConflictFiles(repoRoot: string): Promise<string[]> {
		const result = await this.exec(
			repoRoot,
			['diff', '--name-only', '--diff-filter=U'],
			{ allowFailure: true },
		);
		if (result.exitCode !== 0) {
			return [];
		}
		return result.stdout.trim().split('\n').filter(Boolean);
	}

	async getFileVersions(repoRoot: string, filePath: string): Promise<FileVersions> {
		const [base, ours, theirs, working] = await Promise.all([
			this.getIndexStageContent(repoRoot, ':1', filePath),
			this.getIndexStageContent(repoRoot, ':2', filePath),
			this.getIndexStageContent(repoRoot, ':3', filePath),
			this.readWorkingFile(repoRoot, filePath),
		]);
		return { base, ours, theirs, working };
	}

	async getIndexStageContent(
		repoRoot: string,
		stage: ':1' | ':2' | ':3',
		filePath: string,
	): Promise<string> {
		const result = await this.exec(
			repoRoot,
			['show', `${stage}:${filePath}`],
			{ allowFailure: true },
		);
		return result.exitCode === 0 ? result.stdout : '';
	}

	async readWorkingFile(repoRoot: string, filePath: string): Promise<string> {
		try {
			return await fs.readFile(path.join(repoRoot, filePath), 'utf8');
		} catch {
			return '';
		}
	}

	async saveMergedContent(
		repoRoot: string,
		filePath: string,
		content: string,
	): Promise<void> {
		await fs.writeFile(path.join(repoRoot, filePath), content, 'utf8');
	}

	async stageFile(repoRoot: string, filePath: string): Promise<void> {
		await this.exec(repoRoot, ['add', '--', filePath]);
	}

	async acceptOurs(repoRoot: string, filePath: string): Promise<void> {
		await this.exec(repoRoot, ['checkout', '--ours', '--', filePath]);
		await this.stageFile(repoRoot, filePath);
	}

	async acceptTheirs(repoRoot: string, filePath: string): Promise<void> {
		await this.exec(repoRoot, ['checkout', '--theirs', '--', filePath]);
		await this.stageFile(repoRoot, filePath);
	}

	async rebaseContinue(repoRoot: string): Promise<void> {
		await this.exec(repoRoot, ['rebase', '--continue'], {
			env: { GIT_EDITOR: 'true' },
		});
	}

	async rebaseAbort(repoRoot: string): Promise<void> {
		await this.exec(repoRoot, ['rebase', '--abort'], { allowFailure: true });
	}

	async mergeContinue(repoRoot: string): Promise<void> {
		await this.exec(repoRoot, ['commit', '--no-edit']);
	}

	async pull(repoRoot: string): Promise<string> {
		const result = await this.exec(repoRoot, ['pull']);
		return result.stdout.trim() || result.stderr.trim() || 'Pull completed.';
	}

	async push(repoRoot: string): Promise<string> {
		const result = await this.exec(repoRoot, ['push']);
		return result.stdout.trim() || result.stderr.trim() || 'Push completed.';
	}

	async fetch(repoRoot: string): Promise<string> {
		const result = await this.exec(repoRoot, ['fetch', '--all', '--prune']);
		return result.stdout.trim() || result.stderr.trim() || 'Fetch completed.';
	}

	private async readGitFile(
		gitDir: string,
		...parts: string[]
	): Promise<string> {
		return (await fs.readFile(path.join(gitDir, ...parts), 'utf8')).trim();
	}

	private async pathExists(filePath: string): Promise<boolean> {
		try {
			await fs.access(filePath);
			return true;
		} catch {
			return false;
		}
	}
}

/** Shared singleton used by the extension host. */
export const gitService = new GitService();

function parseNameStatusLine(line: string): CommitFile | undefined {
	const tab = line.indexOf('\t');
	if (tab === -1) {
		return undefined;
	}
	const statusPart = line.slice(0, tab);
	const pathsPart = line.slice(tab + 1);
	const status = statusPart.charAt(0);
	if (!status) {
		return undefined;
	}

	const paths = pathsPart.split('\t');
	if (status === 'R' || status === 'C') {
		const [oldPath, newPath] = paths;
		if (!newPath) {
			return undefined;
		}
		return { path: newPath, status, oldPath };
	}

	const path = paths[0];
	if (!path) {
		return undefined;
	}
	return { path, status };
}

function parseCommitRangeLines(stdout: string): {
	hash: string;
	shortHash: string;
	message: string;
	timestamp: number;
}[] {
	return stdout
		.split('\n')
		.filter(Boolean)
		.map((line) => {
			const [hash, shortHash, timestampRaw, ...messageParts] = line.split('|');
			const timestamp = Number.parseInt(timestampRaw ?? '0', 10);
			return {
				hash: hash ?? '',
				shortHash: shortHash ?? '',
				message: messageParts.join('|'),
				timestamp: Number.isNaN(timestamp) ? 0 : timestamp,
			};
		})
		.filter((c) => c.hash.length > 0);
}
