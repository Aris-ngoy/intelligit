import * as vscode from 'vscode';

import { gitService } from './git';
import { createRebaseService } from './git/rebaseService';
import type { GitLogFilters, InteractiveRebaseCommit, RebaseFlag } from './git/types';
import { MessageRouter } from './messages/messageRouter';
import { NOT_GIT_REPO } from './messages/protocol';
import { GitWatcher } from './watchers/gitWatcher';
import {
	GitContentProvider,
	INTELLIGIT_GIT_SCHEME,
	openCommitFileDiff,
} from './views/gitContentProvider';
import { GitLogViewProvider } from './views/gitLogViewProvider';
import {
	ConflictsManager,
	GitLogPanelManager,
	InteractiveRebaseManager,
	MergeEditorManager,
	RebaseDialogManager,
	StashManager,
} from './views/panelManagers';

let outputChannel: vscode.OutputChannel;
let interactiveRebaseManager: InteractiveRebaseManager;
let rebaseDialogManager: RebaseDialogManager;
let conflictsManager: ConflictsManager;
let mergeEditorManager: MergeEditorManager;
let gitLogPanelManager: GitLogPanelManager;
let stashManager: StashManager;

const rebaseService = createRebaseService(gitService);

async function getActiveRepository(): Promise<string | undefined> {
	const folder = vscode.workspace.workspaceFolders?.[0];
	if (!folder) {
		return undefined;
	}
	return gitService.findRepositoryRoot(folder.uri.fsPath);
}

function parseLogFilters(params: Record<string, unknown>): GitLogFilters {
	return {
		branchScope:
			(params.branchScope as GitLogFilters['branchScope']) ?? 'all',
		author: params.author as string | undefined,
		datePreset: params.datePreset as GitLogFilters['datePreset'],
		since: params.since as string | undefined,
		until: params.until as string | undefined,
		path: params.path as string | undefined,
	};
}

export function activate(context: vscode.ExtensionContext): void {
	outputChannel = vscode.window.createOutputChannel('IntelliGit');
	context.subscriptions.push(outputChannel);

	const messageRouter = new MessageRouter();
	interactiveRebaseManager = new InteractiveRebaseManager(
		context.extensionUri,
		messageRouter,
	);
	rebaseDialogManager = new RebaseDialogManager(context.extensionUri, messageRouter);
	conflictsManager = new ConflictsManager(context.extensionUri, messageRouter);
	mergeEditorManager = new MergeEditorManager(context.extensionUri, messageRouter);
	gitLogPanelManager = new GitLogPanelManager(context.extensionUri, messageRouter);
	stashManager = new StashManager(context.extensionUri, messageRouter);

	const logProvider = new GitLogViewProvider(
		context.extensionUri,
		messageRouter,
	);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			GitLogViewProvider.viewType,
			logProvider,
			{ webviewOptions: { retainContextWhenHidden: true } },
		),
	);

	context.subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider(
			INTELLIGIT_GIT_SCHEME,
			new GitContentProvider(gitService),
		),
	);

	registerMessageHandlers(messageRouter);

	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	if (workspaceRoot) {
		void gitService.findRepositoryRoot(workspaceRoot).then((repoRoot) => {
			if (repoRoot) {
				context.subscriptions.push(
					new GitWatcher(repoRoot, messageRouter, () => {
						conflictsManager.open();
						void vscode.window.showWarningMessage(
							'Merge conflicts detected. Open the Conflicts panel to resolve them.',
							'Open Conflicts',
						).then((choice) => {
							if (choice === 'Open Conflicts') {
								conflictsManager.open();
							}
						});
					}),
				);
			}
		});
	}

	context.subscriptions.push(
		vscode.commands.registerCommand('intelligit.openGitLog', () => {
			gitLogPanelManager.open();
		}),

		vscode.commands.registerCommand('intelligit.openGitLogInEditor', () => {
			gitLogPanelManager.open();
		}),

		vscode.commands.registerCommand('intelligit.refreshGitLog', () => {
			messageRouter.broadcastEvent('gitStateChanged', { scope: 'all' });
		}),

		vscode.commands.registerCommand('intelligit.rebase', () => {
			rebaseDialogManager.open();
		}),

		vscode.commands.registerCommand('intelligit.openConflicts', () => {
			conflictsManager.open();
		}),

		vscode.commands.registerCommand('intelligit.openStashes', () => {
			stashManager.open();
		}),

		vscode.commands.registerCommand('intelligit.openMergeEditor', (filePath?: string) => {
			if (filePath) {
				mergeEditorManager.open(filePath);
			}
		}),

		vscode.commands.registerCommand(
			'intelligit.interactiveRebaseFromHere',
			async (fromHash?: string) => {
				if (!fromHash) {
					const repoRoot = await getActiveRepository();
					if (!repoRoot) {
						void vscode.window.showWarningMessage('No Git repository found.');
						return;
					}
					const log = await gitService.getLog(repoRoot, { maxCount: 1 });
					fromHash = log.commits[0]?.hash;
					if (!fromHash) {
						void vscode.window.showWarningMessage('No commits to rebase.');
						return;
					}
				}
				interactiveRebaseManager.open(fromHash);
			},
		),

		vscode.commands.registerCommand('intelligit.showCommitInOutput', () => {
			void dumpGitLogToOutput();
		}),

		vscode.commands.registerCommand('intelligit.pull', async () => {
			const repoRoot = await getActiveRepository();
			if (!repoRoot) {
				void vscode.window.showWarningMessage('No Git repository found.');
				return;
			}
			try {
				const output = await gitService.pull(repoRoot);
				messageRouter.broadcastEvent('gitStateChanged', { scope: 'all' });
				void vscode.window.showInformationMessage(output || 'Pull completed.');
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				void vscode.window.showErrorMessage(`Pull failed: ${message}`);
			}
		}),

		vscode.commands.registerCommand('intelligit.push', async () => {
			const repoRoot = await getActiveRepository();
			if (!repoRoot) {
				void vscode.window.showWarningMessage('No Git repository found.');
				return;
			}
			try {
				const output = await gitService.push(repoRoot);
				messageRouter.broadcastEvent('gitStateChanged', { scope: 'all' });
				void vscode.window.showInformationMessage(output || 'Push completed.');
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				void vscode.window.showErrorMessage(`Push failed: ${message}`);
			}
		}),

		vscode.commands.registerCommand('intelligit.fetch', async () => {
			const repoRoot = await getActiveRepository();
			if (!repoRoot) {
				void vscode.window.showWarningMessage('No Git repository found.');
				return;
			}
			try {
				const output = await gitService.fetch(repoRoot);
				messageRouter.broadcastEvent('gitStateChanged', { scope: 'all' });
				void vscode.window.showInformationMessage(output || 'Fetch completed.');
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				void vscode.window.showErrorMessage(`Fetch failed: ${message}`);
			}
		}),
	);
}

function registerMessageHandlers(messageRouter: MessageRouter): void {
	messageRouter.handle('getRepositoryInfo', async () => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		return gitService.getRepositoryInfo(repoRoot);
	});

	messageRouter.handle('getLog', async (params) => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		const maxCount = (params.maxCount as number) ?? 300;
		const filters = params.filters
			? parseLogFilters(params.filters as Record<string, unknown>)
			: undefined;
		return gitService.getLog(repoRoot, { maxCount, filters });
	});

	messageRouter.handle('getCommitFiles', async (params) => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		return gitService.getCommitFiles(repoRoot, params.hash as string);
	});

	messageRouter.handle('getRebaseRefs', async (params) => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		const info = await gitService.getRepositoryInfo(repoRoot);
		const refs = await gitService.listRebaseRefs(repoRoot);

		const fromHash = params.fromHash as string | undefined;
		let rebaseFrom: string | undefined;
		let rebaseFromLabel: string | undefined;
		let commitCount: number | undefined;

		if (fromHash) {
			rebaseFrom = await rebaseService.resolveRebaseUpstream(repoRoot, fromHash);
			const range = await gitService.getRebaseCommitRange(repoRoot, fromHash);
			commitCount = range.length;
			const first = range[0];
			if (first) {
				rebaseFromLabel = `${first.shortHash} — ${first.message}`;
			}
		}

		return {
			refs,
			currentBranch: info.currentBranch,
			root: info.root,
			fromHash: fromHash ?? '',
			rebaseFrom,
			rebaseFromLabel,
			commitCount,
		};
	});

	messageRouter.handle('getInteractiveRebaseCommits', async (params) => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		const fromHash = params.fromHash as string;
		const commits = await rebaseService.loadInteractiveCommits(repoRoot, fromHash);
		const info = await gitService.getRepositoryInfo(repoRoot);
		return { commits, currentBranch: info.currentBranch, root: info.root, fromHash };
	});

	messageRouter.handle('startInteractiveRebase', async (params) => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		const fromHash = params.fromHash as string;
		const commits = params.commits as InteractiveRebaseCommit[];
		const flags = (params.flags as RebaseFlag[]) ?? [];

		try {
			await rebaseService.runInteractiveRebase(repoRoot, fromHash, commits, flags);
			interactiveRebaseManager.close();
			messageRouter.broadcastEvent('gitStateChanged', { scope: 'all' });
			void vscode.window.showInformationMessage('Rebase completed successfully.');
			return { success: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			const info = await gitService.getRepositoryInfo(repoRoot);
			if (info.isRebaseInProgress) {
				conflictsManager.open();
				void vscode.window.showWarningMessage(
					`Rebase paused with conflicts. ${message}`,
				);
			} else {
				void vscode.window.showErrorMessage(`Rebase failed: ${message}`);
			}
			throw err;
		}
	});

	messageRouter.handle('startStandardRebase', async (params) => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		try {
			await rebaseService.runStandardRebase(repoRoot, {
				onto: params.onto as string,
				from: params.from as string | undefined,
				flags: (params.flags as RebaseFlag[]) ?? [],
			});
			rebaseDialogManager.close();
			messageRouter.broadcastEvent('gitStateChanged', { scope: 'all' });
			messageRouter.broadcastEvent('closeRebaseDialog', {});
			void vscode.window.showInformationMessage('Rebase completed successfully.');
			return { success: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			const info = await gitService.getRepositoryInfo(repoRoot);
			if (info.isRebaseInProgress) {
				conflictsManager.open();
			}
			void vscode.window.showErrorMessage(`Rebase failed: ${message}`);
			throw err;
		}
	});

	messageRouter.handle('openDiffEditor', async (params) => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		await openCommitFileDiff(
			gitService,
			repoRoot,
			params.commit as string,
			params.filePath as string,
		);
		return { success: true };
	});

	messageRouter.handle('getMergeState', async () => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		return gitService.getMergeOperationState(repoRoot);
	});

	messageRouter.handle('getConflictFiles', async () => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		return gitService.getConflictFiles(repoRoot);
	});

	messageRouter.handle('getFileVersions', async (params) => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		return gitService.getFileVersions(repoRoot, params.filePath as string);
	});

	messageRouter.handle('saveMergedContent', async (params) => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		await gitService.saveMergedContent(
			repoRoot,
			params.filePath as string,
			params.content as string,
		);
		return { success: true };
	});

	messageRouter.handle('stageFile', async (params) => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		await gitService.stageFile(repoRoot, params.filePath as string);
		messageRouter.broadcastEvent('mergeStateChanged', {});
		return { success: true };
	});

	messageRouter.handle('acceptOurs', async (params) => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		await gitService.acceptOurs(repoRoot, params.filePath as string);
		messageRouter.broadcastEvent('mergeStateChanged', {});
		return { success: true };
	});

	messageRouter.handle('acceptTheirs', async (params) => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		await gitService.acceptTheirs(repoRoot, params.filePath as string);
		messageRouter.broadcastEvent('mergeStateChanged', {});
		return { success: true };
	});

	messageRouter.handle('openMergeEditor', async (params) => {
		const filePath = params.filePath as string;
		mergeEditorManager.open(filePath);
		return { success: true };
	});

	messageRouter.handle('openConflicts', async () => {
		conflictsManager.open();
		return { success: true };
	});

	messageRouter.handle('closeMergeEditor', async (params) => {
		mergeEditorManager.close(params.filePath as string);
		return { success: true };
	});

	messageRouter.handle('continueOperation', async () => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		const conflicts = await gitService.getConflictFiles(repoRoot);
		if (conflicts.length > 0) {
			throw new Error(`${conflicts.length} conflict(s) still unresolved.`);
		}
		const state = await gitService.getMergeOperationState(repoRoot);
		if (state.isRebaseInProgress) {
			await gitService.rebaseContinue(repoRoot);
		} else if (state.isMergeInProgress) {
			await gitService.mergeContinue(repoRoot);
		}
		messageRouter.broadcastEvent('gitStateChanged', { scope: 'all' });
		messageRouter.broadcastEvent('mergeStateChanged', {});
		return { success: true };
	});

	messageRouter.handle('abortOperation', async () => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		const state = await gitService.getMergeOperationState(repoRoot);
		if (state.isRebaseInProgress) {
			await gitService.rebaseAbort(repoRoot);
		} else {
			await gitService.exec(repoRoot, ['merge', '--abort'], { allowFailure: true });
		}
		messageRouter.broadcastEvent('gitStateChanged', { scope: 'all' });
		messageRouter.broadcastEvent('mergeStateChanged', {});
		return { success: true };
	});

	messageRouter.handle('checkoutRevision', async (params) => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		const hash = params.hash as string;
		const choice = await vscode.window.showWarningMessage(
			`Checkout ${hash.slice(0, 7)}? This may detach HEAD.`,
			{ modal: true },
			'Checkout',
		);
		if (choice !== 'Checkout') {
			return { cancelled: true };
		}
		await gitService.checkoutRevision(repoRoot, hash);
		messageRouter.broadcastEvent('gitStateChanged', { scope: 'all' });
		return { success: true };
	});

	messageRouter.handle('cherryPick', async (params) => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		await gitService.cherryPick(repoRoot, params.hash as string);
		messageRouter.broadcastEvent('gitStateChanged', { scope: 'all' });
		return { success: true };
	});

	messageRouter.handle('revertCommit', async (params) => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		const hash = params.hash as string;
		const choice = await vscode.window.showWarningMessage(
			`Revert commit ${hash.slice(0, 7)}? This creates a new commit that undoes those changes.`,
			{ modal: true },
			'Revert',
		);
		if (choice !== 'Revert') {
			return { cancelled: true };
		}
		await gitService.revertCommit(repoRoot, hash);
		messageRouter.broadcastEvent('gitStateChanged', { scope: 'all' });
		void vscode.window.showInformationMessage('Commit reverted successfully.');
		return { success: true };
	});

	messageRouter.handle('copyToClipboard', async (params) => {
		await vscode.env.clipboard.writeText(params.text as string);
		return { success: true };
	});

	messageRouter.handle('openExternal', async (params) => {
		const url = params.url as string;
		await vscode.env.openExternal(vscode.Uri.parse(url));
		return { success: true };
	});

	messageRouter.handle('interactiveRebaseFromHere', async (params) => {
		const hash = params.hash as string | undefined;
		await vscode.commands.executeCommand('intelligit.interactiveRebaseFromHere', hash);
		return { success: true };
	});

	messageRouter.handle('openRebaseDialog', async (params) => {
		const fromHash = params.fromHash as string | undefined;
		rebaseDialogManager.open(fromHash ? { fromHash } : {});
		return { success: true };
	});

	messageRouter.handle('openGitLogPanel', async () => {
		gitLogPanelManager.open();
		return { success: true };
	});

	messageRouter.handle('gitPull', async () => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		const output = await gitService.pull(repoRoot);
		messageRouter.broadcastEvent('gitStateChanged', { scope: 'all' });
		void vscode.window.showInformationMessage(
			output.length > 120 ? `${output.slice(0, 120)}…` : output || 'Pull completed.',
		);
		return { success: true, output };
	});

	messageRouter.handle('gitPush', async () => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		const output = await gitService.push(repoRoot);
		messageRouter.broadcastEvent('gitStateChanged', { scope: 'all' });
		void vscode.window.showInformationMessage(
			output.length > 120 ? `${output.slice(0, 120)}…` : output || 'Push completed.',
		);
		return { success: true, output };
	});

	messageRouter.handle('gitFetch', async () => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		const output = await gitService.fetch(repoRoot);
		messageRouter.broadcastEvent('gitStateChanged', { scope: 'all' });
		void vscode.window.showInformationMessage(
			output.length > 120 ? `${output.slice(0, 120)}…` : output || 'Fetch completed.',
		);
		return { success: true, output };
	});

	messageRouter.handle('getStashes', async () => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		return gitService.listStashes(repoRoot);
	});

	messageRouter.handle('applyStash', async (params) => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		await gitService.applyStash(repoRoot, params.index as number);
		messageRouter.broadcastEvent('gitStateChanged', { scope: 'all' });
		void vscode.window.showInformationMessage('Stash applied to your working tree.');
		return { success: true };
	});

	messageRouter.handle('dropStash', async (params) => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		const index = params.index as number;
		const choice = await vscode.window.showWarningMessage(
			`Delete stash@{${index}}? This cannot be undone.`,
			{ modal: true },
			'Delete',
		);
		if (choice !== 'Delete') {
			return { cancelled: true };
		}
		await gitService.dropStash(repoRoot, index);
		messageRouter.broadcastEvent('gitStateChanged', { scope: 'stashes' });
		return { success: true };
	});

	messageRouter.handle('clearStashes', async () => {
		const repoRoot = await getActiveRepository();
		if (!repoRoot) {
			return NOT_GIT_REPO;
		}
		const choice = await vscode.window.showWarningMessage(
			'Delete all stashes? This cannot be undone.',
			{ modal: true },
			'Clear all',
		);
		if (choice !== 'Clear all') {
			return { cancelled: true };
		}
		await gitService.clearStashes(repoRoot);
		messageRouter.broadcastEvent('gitStateChanged', { scope: 'stashes' });
		void vscode.window.showInformationMessage('All stashes cleared.');
		return { success: true };
	});

	messageRouter.handle('openStashes', async () => {
		stashManager.open();
		return { success: true };
	});
}

async function dumpGitLogToOutput(): Promise<void> {
	const repoRoot = await getActiveRepository();
	if (!repoRoot) {
		void vscode.window.showWarningMessage('No Git repository found in workspace.');
		return;
	}

	try {
		const log = await gitService.getLog(repoRoot, { maxCount: 20 });
		outputChannel.clear();
		outputChannel.appendLine(`Repository: ${repoRoot}`);
		outputChannel.appendLine(`Commits: ${log.commits.length}`);
		outputChannel.appendLine('---');
		for (const c of log.commits) {
			outputChannel.appendLine(`${c.shortHash} | ${c.author} | ${c.subject}`);
		}
		outputChannel.show(true);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		void vscode.window.showErrorMessage(`Git log failed: ${message}`);
	}
}

export function deactivate(): void {}
