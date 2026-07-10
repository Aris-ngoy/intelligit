import * as vscode from "vscode";

import { gitService } from "../git";
import type { MessageRouter } from "../messages/messageRouter";

export class GitWatcher implements vscode.Disposable {
	private disposables: vscode.Disposable[] = [];
	private debounceTimer: ReturnType<typeof setTimeout> | undefined;
	private lastHadConflicts = false;

	constructor(
		private readonly repoRoot: string,
		private readonly messageRouter: MessageRouter,
		private readonly onConflictsDetected: () => void,
	) {
		this.setupWatchers();
		void this.checkInitialConflicts();
	}

	private setupWatchers(): void {
		const gitBase = vscode.Uri.file(`${this.repoRoot}/.git`);
		const patterns = [
			"HEAD",
			"index",
			"MERGE_HEAD",
			"rebase-merge/**",
			"rebase-apply/**",
		];

		for (const pattern of patterns) {
			const watcher = vscode.workspace.createFileSystemWatcher(
				new vscode.RelativePattern(gitBase, pattern),
			);
			const notify = () => this.debouncedNotify();
			watcher.onDidChange(notify);
			watcher.onDidCreate(notify);
			watcher.onDidDelete(notify);
			this.disposables.push(watcher);
		}

		this.disposables.push(
			vscode.workspace.onDidSaveTextDocument(() => this.debouncedNotify()),
		);
	}

	private debouncedNotify(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}
		this.debounceTimer = setTimeout(() => {
			this.debounceTimer = undefined;
			this.messageRouter.broadcastEvent("mergeStateChanged", {});
			this.messageRouter.broadcastEvent("gitStateChanged", {
				scope: "workingTree",
			});
			void this.checkConflicts();
		}, 300);
	}

	private async checkInitialConflicts(): Promise<void> {
		await this.checkConflicts();
	}

	private async checkConflicts(): Promise<void> {
		const conflicts = await gitService.getConflictFiles(this.repoRoot);
		const hasConflicts = conflicts.length > 0;

		if (hasConflicts && !this.lastHadConflicts) {
			this.onConflictsDetected();
		}
		this.lastHadConflicts = hasConflicts;
	}

	dispose(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}
		for (const d of this.disposables) {
			d.dispose();
		}
		this.disposables = [];
	}
}
