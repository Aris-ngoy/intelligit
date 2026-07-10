import * as assert from "node:assert/strict";

import * as vscode from "vscode";

import { MessageRouter } from "../messages/messageRouter";
import { GitLogViewProvider } from "../views/gitLogViewProvider";
import { getWebviewHtml } from "../views/html";

function fakeWebview(posted?: Array<Record<string, unknown>>): vscode.Webview {
	return {
		asWebviewUri: (uri: vscode.Uri) => uri,
		cspSource: "vscode-resource:",
		onDidReceiveMessage: () => ({ dispose() {} }),
		postMessage: (msg: Record<string, unknown>) => {
			posted?.push(msg);
			return Promise.resolve(true);
		},
	} as unknown as vscode.Webview;
}

suite("getWebviewHtml", () => {
	const extUri = vscode.Uri.file("/ext");

	test("renders the requested mode and asset references", () => {
		const html = getWebviewHtml(fakeWebview(), extUri, { mode: "conflicts" });
		assert.match(html, /data-mode="conflicts"/);
		assert.match(html, /assets\/main\.js/);
		assert.match(html, /assets\/style\.css/);
	});

	test("applies a matching nonce to the CSP and the script tag", () => {
		const html = getWebviewHtml(fakeWebview(), extUri, { mode: "panel" });
		const cspNonce = html.match(/script-src 'nonce-([A-Za-z0-9]+)'/);
		const tagNonce = html.match(/<script[^>]*nonce="([A-Za-z0-9]+)"/);
		assert.ok(cspNonce, "CSP nonce present");
		assert.ok(tagNonce, "script nonce present");
		assert.equal(cspNonce?.[1], tagNonce?.[1]);
	});

	test("escapes attribute values to prevent injection", () => {
		const html = getWebviewHtml(fakeWebview(), extUri, {
			mode: "merge",
			file: 'a"><img src=x>&.ts',
		});
		assert.doesNotMatch(html, /data-file="a"><img/);
		assert.match(html, /&quot;/);
		assert.match(html, /&lt;img/);
		assert.match(html, /&amp;/);
	});

	test("defaults to panel mode when none is given", () => {
		const html = getWebviewHtml(fakeWebview(), extUri, {});
		assert.match(html, /data-mode="panel"/);
	});
});

suite("GitLogViewProvider", () => {
	test("viewType matches the contributed view id", () => {
		assert.equal(GitLogViewProvider.viewType, "intelligit.gitLog");
	});

	test("resolveWebviewView sets panel HTML and registers the webview", () => {
		const router = new MessageRouter();
		const provider = new GitLogViewProvider(vscode.Uri.file("/ext"), router);

		const posted: Array<Record<string, unknown>> = [];
		const webview = fakeWebview(posted);

		const view = {
			webview,
			visible: false,
			onDidDispose: () => ({ dispose() {} }),
		} as unknown as vscode.WebviewView;

		provider.resolveWebviewView(
			view,
			{} as vscode.WebviewViewResolveContext,
			{ isCancellationRequested: false } as vscode.CancellationToken,
		);

		assert.match(webview.html, /data-mode="sidebar"/);

		// Registered with the router: broadcasts now reach this webview.
		router.broadcastEvent("gitStateChanged", { ok: true });
		assert.equal(posted.length, 1);
		assert.equal((posted[0] as { event: string }).event, "gitStateChanged");
	});
});
