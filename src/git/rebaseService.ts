import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import type { GitService } from './gitService';
import type { InteractiveRebaseCommit, RebaseFlag, RebaseOptions } from './types';

export class RebaseService {
	constructor(private readonly git: GitService) {}

	/** Parent revision used as upstream for `git rebase -i`. */
	async resolveRebaseUpstream(
		repoRoot: string,
		fromCommitHash: string,
	): Promise<string> {
		const result = await this.git.exec(
			repoRoot,
			['rev-parse', `${fromCommitHash}^`],
			{ allowFailure: true },
		);
		if (result.exitCode === 0) {
			return result.stdout.trim();
		}
		// Root commit — rebase onto empty tree
		return '--root';
	}

	async loadInteractiveCommits(
		repoRoot: string,
		fromCommitHash: string,
	): Promise<InteractiveRebaseCommit[]> {
		const range = await this.git.getRebaseCommitRange(repoRoot, fromCommitHash);
		return range.map((c) => ({
			hash: c.hash,
			shortHash: c.shortHash,
			message: c.message,
			action: 'pick' as const,
		}));
	}

	async runInteractiveRebase(
		repoRoot: string,
		fromCommitHash: string,
		commits: InteractiveRebaseCommit[],
		flags: RebaseFlag[] = [],
	): Promise<void> {
		const upstream = await this.resolveRebaseUpstream(repoRoot, fromCommitHash);
		const todoBody = buildTodoFile(commits);
		const editorScript = await writeSequenceEditorScript(todoBody);

		try {
			const args = ['rebase', '-i', ...rebaseFlagsToArgs(flags), upstream];
			await this.git.exec(repoRoot, args, {
				env: {
					GIT_SEQUENCE_EDITOR: editorScript,
				},
			});
		} finally {
			await fs.unlink(editorScript).catch(() => undefined);
		}
	}

	async runStandardRebase(
		repoRoot: string,
		options: RebaseOptions,
	): Promise<void> {
		const onto = options.onto.trim();
		if (!onto) {
			throw new Error('Onto branch or revision is required');
		}

		const flags = rebaseFlagsToArgs(options.flags);
		const from = options.from?.trim();

		let args: string[];
		if (from && from.length > 0) {
			// git rebase [flags] --onto newbase upstream [branch]
			args = ['rebase', ...flags, '--onto', onto, from, 'HEAD'];
		} else {
			args = ['rebase', ...flags, onto];
		}

		await this.git.exec(repoRoot, args);
	}

	async abortRebase(repoRoot: string): Promise<void> {
		await this.git.exec(repoRoot, ['rebase', '--abort'], { allowFailure: true });
	}
}

function buildTodoFile(commits: InteractiveRebaseCommit[]): string {
	const lines = commits
		.filter((c) => c.action !== 'drop')
		.map((c) => {
			const action = c.action === 'pick' ? 'pick' : c.action;
			const subject = c.message.split('\n')[0]?.replace(/\s+/g, ' ').trim() ?? '';
			return `${action} ${c.hash} ${subject}`;
		});

	if (lines.length === 0) {
		throw new Error('No commits selected for rebase');
	}

	return `${lines.join('\n')}\n`;
}

async function writeSequenceEditorScript(todoBody: string): Promise<string> {
	const scriptPath = path.join(
		os.tmpdir(),
		`intelligit-seq-editor-${process.pid}-${Date.now()}.js`,
	);

	const script = `#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const todoPath = process.argv[2];
if (!todoPath) {
  process.exit(1);
}
fs.writeFileSync(todoPath, ${JSON.stringify(todoBody)}, 'utf8');
`;

	await fs.writeFile(scriptPath, script, { mode: 0o755 });
	return scriptPath;
}

function rebaseFlagsToArgs(flags: RebaseFlag[]): string[] {
	const args: string[] = [];
	for (const flag of flags) {
		if (flag === '--onto') {
			continue;
		}
		args.push(flag);
	}
	return args;
}

export function createRebaseService(git: GitService): RebaseService {
	return new RebaseService(git);
}
