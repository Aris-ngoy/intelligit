import * as vscode from 'vscode';

import type { MessageRouter } from '../messages/messageRouter';
import { getWebviewHtml } from './html';

export class InteractiveRebaseManager {
	private panel: vscode.WebviewPanel | undefined;

	constructor(
		private readonly extensionUri: vscode.Uri,
		private readonly messageRouter: MessageRouter,
	) {}

	open(fromCommitHash: string): void {
		if (this.panel) {
			this.panel.reveal(vscode.ViewColumn.One);
			this.messageRouter.broadcastEvent('openInteractiveRebase', { fromCommitHash });
			return;
		}

		this.panel = vscode.window.createWebviewPanel(
			'intelligit.interactiveRebase',
			'Interactive Rebase',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'dist')],
			},
		);

		this.panel.webview.html = getWebviewHtml(this.panel.webview, this.extensionUri, {
			mode: 'interactiveRebase',
			fromHash: fromCommitHash,
		});

		const routerDisposable = this.messageRouter.registerWebview(this.panel.webview);

		this.panel.onDidDispose(() => {
			routerDisposable.dispose();
			this.panel = undefined;
		});

		void this.panel.webview.postMessage({
			type: 'event',
			event: 'openInteractiveRebase',
			data: { fromCommitHash },
		});
	}
}

export class RebaseDialogManager {
	private panel: vscode.WebviewPanel | undefined;

	constructor(
		private readonly extensionUri: vscode.Uri,
		private readonly messageRouter: MessageRouter,
	) {}

	open(): void {
		if (this.panel) {
			this.panel.reveal(vscode.ViewColumn.Active);
			return;
		}

		this.panel = vscode.window.createWebviewPanel(
			'intelligit.rebaseDialog',
			'Rebase',
			vscode.ViewColumn.Active,
			{
				enableScripts: true,
				retainContextWhenHidden: false,
				localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'dist')],
			},
		);

		this.panel.webview.html = getWebviewHtml(this.panel.webview, this.extensionUri, {
			mode: 'rebaseDialog',
		});

		const routerDisposable = this.messageRouter.registerWebview(this.panel.webview);

		this.panel.onDidDispose(() => {
			routerDisposable.dispose();
			this.panel = undefined;
		});
	}

	close(): void {
		this.panel?.dispose();
	}
}

export class ConflictsManager {
	private panel: vscode.WebviewPanel | undefined;

	constructor(
		private readonly extensionUri: vscode.Uri,
		private readonly messageRouter: MessageRouter,
	) {}

	open(): void {
		if (this.panel) {
			this.panel.reveal(vscode.ViewColumn.One);
			this.messageRouter.broadcastEvent('mergeStateChanged', {});
			return;
		}

		this.panel = vscode.window.createWebviewPanel(
			'intelligit.conflicts',
			'Conflicts',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'dist')],
			},
		);

		this.panel.webview.html = getWebviewHtml(this.panel.webview, this.extensionUri, {
			mode: 'conflicts',
		});

		const routerDisposable = this.messageRouter.registerWebview(this.panel.webview);
		this.panel.onDidDispose(() => {
			routerDisposable.dispose();
			this.panel = undefined;
		});
	}
}

export class MergeEditorManager {
	private panels = new Map<string, vscode.WebviewPanel>();

	constructor(
		private readonly extensionUri: vscode.Uri,
		private readonly messageRouter: MessageRouter,
	) {}

	open(filePath: string): void {
		const existing = this.panels.get(filePath);
		if (existing) {
			existing.reveal(vscode.ViewColumn.One);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			'intelligit.mergeEditor',
			`Merge: ${pathBasename(filePath)}`,
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'dist')],
			},
		);

		panel.webview.html = getWebviewHtml(panel.webview, this.extensionUri, {
			mode: 'merge',
			file: filePath,
		});

		const routerDisposable = this.messageRouter.registerWebview(panel.webview);
		this.panels.set(filePath, panel);

		panel.onDidDispose(() => {
			routerDisposable.dispose();
			this.panels.delete(filePath);
		});
	}

	close(filePath: string): void {
		this.panels.get(filePath)?.dispose();
	}
}

function pathBasename(filePath: string): string {
	const idx = filePath.lastIndexOf('/');
	return idx >= 0 ? filePath.slice(idx + 1) : filePath;
}
