import * as vscode from 'vscode';

export type WebviewMode =
	| 'panel'
	| 'sidebar'
	| 'interactiveRebase'
	| 'rebaseDialog'
	| 'conflicts'
	| 'merge'
	| 'stash'
	| 'commit';

export interface WebviewHtmlOptions {
	mode?: WebviewMode;
	fromHash?: string;
	file?: string;
	rebaseFromHash?: string;
}

export function getWebviewHtml(
	webview: vscode.Webview,
	extensionUri: vscode.Uri,
	options: WebviewHtmlOptions = {},
): string {
	const distUri = vscode.Uri.joinPath(extensionUri, 'dist', 'webview');
	const scriptUri = webview.asWebviewUri(
		vscode.Uri.joinPath(distUri, 'assets', 'main.js'),
	);
	const styleUri = webview.asWebviewUri(
		vscode.Uri.joinPath(distUri, 'assets', 'style.css'),
	);
	const nonce = getNonce();
	const mode = options.mode ?? 'panel';
	const fromHash = options.fromHash ?? '';
	const file = options.file ?? '';
	const rebaseFromHash = options.rebaseFromHash ?? '';

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${styleUri}">
  <title>IntelliGit</title>
</head>
<body>
  <div id="root" data-mode="${mode}" data-from-hash="${escapeAttr(fromHash)}" data-file="${escapeAttr(file)}" data-rebase-from-hash="${escapeAttr(rebaseFromHash)}"></div>
  <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce(): string {
	const chars =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < 32; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

function escapeAttr(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;');
}
