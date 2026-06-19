import * as vscode from 'vscode';

import type { MessageRouter } from '../messages/messageRouter';
import { getWebviewHtml } from './html';

export class GitLogViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'intelligit.gitLog';

	private hasAutoOpened = false;

	constructor(
		private readonly extensionUri: vscode.Uri,
		private readonly messageRouter: MessageRouter,
		/** Opens the full-screen Git Log editor panel. */
		private readonly openFullScreen: () => void,
	) {}

	resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	): void {
		const webview = webviewView.webview;

		webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'dist')],
		};

		webview.html = getWebviewHtml(webview, this.extensionUri, { mode: 'panel' });

		const routerDisposable = this.messageRouter.registerWebview(webview);
		webviewView.onDidDispose(() => routerDisposable.dispose());

		// Opening the activity-bar view promotes the full-screen editor panel once
		// per session so users land in the roomy layout instead of the narrow rail.
		const maybeAutoOpen = () => {
			if (webviewView.visible && !this.hasAutoOpened) {
				this.hasAutoOpened = true;
				this.openFullScreen();
			}
		};
		webviewView.onDidChangeVisibility(maybeAutoOpen);
		maybeAutoOpen();
	}
}
