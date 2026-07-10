import * as assert from "node:assert/strict";

import type * as vscode from "vscode";

import { MessageRouter } from "../messages/messageRouter";
import type { RequestMessage } from "../messages/protocol";

interface FakeWebview {
	webview: vscode.Webview;
	posted: Array<Record<string, unknown>>;
	fire: (msg: unknown) => void;
}

function createFakeWebview(): FakeWebview {
	const posted: Array<Record<string, unknown>> = [];
	let receive: ((msg: unknown) => void) | undefined;

	const webview = {
		postMessage(msg: Record<string, unknown>) {
			posted.push(msg);
			return Promise.resolve(true);
		},
		onDidReceiveMessage(cb: (msg: unknown) => void) {
			receive = cb;
			return { dispose() {} };
		},
	} as unknown as vscode.Webview;

	return {
		webview,
		posted,
		fire: (msg) => receive?.(msg),
	};
}

/** Let queued microtasks (async handlers) settle. */
function flush(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

function request(
	command: string,
	params: Record<string, unknown> = {},
): RequestMessage {
	return { type: "request", id: "req-1", command: command as never, params };
}

suite("MessageRouter", () => {
	test("routes a request to its handler and posts a success response", async () => {
		const router = new MessageRouter();
		router.handle("echo", async (params) => ({ got: params.value }));

		const fake = createFakeWebview();
		router.registerWebview(fake.webview);
		fake.fire(request("echo", { value: 42 }));
		await flush();

		assert.equal(fake.posted.length, 1);
		assert.deepEqual(fake.posted[0], {
			type: "response",
			id: "req-1",
			success: true,
			data: { got: 42 },
			error: undefined,
		});
	});

	test("responds with an error for an unknown command", async () => {
		const router = new MessageRouter();
		const fake = createFakeWebview();
		router.registerWebview(fake.webview);

		fake.fire(request("doesNotExist"));
		await flush();

		const msg = fake.posted[0];
		assert.ok(msg);
		assert.equal(msg.success, false);
		const error = msg.error as { code: string; message: string };
		assert.equal(error.code, "UNKNOWN");
		assert.match(error.message, /doesNotExist/);
	});

	test("converts a thrown handler error into an error response", async () => {
		const router = new MessageRouter();
		router.handle("boom", async () => {
			throw new Error("kaboom");
		});
		const fake = createFakeWebview();
		router.registerWebview(fake.webview);

		fake.fire(request("boom"));
		await flush();

		const msg = fake.posted[0];
		assert.ok(msg);
		assert.equal(msg.success, false);
		assert.equal((msg.error as { message: string }).message, "kaboom");
	});

	test("ignores non-request messages", async () => {
		const router = new MessageRouter();
		const fake = createFakeWebview();
		router.registerWebview(fake.webview);

		fake.fire({ type: "response", id: "x", success: true });
		await flush();

		assert.equal(fake.posted.length, 0);
	});

	test("broadcastEvent posts to every registered webview", () => {
		const router = new MessageRouter();
		const a = createFakeWebview();
		const b = createFakeWebview();
		router.registerWebview(a.webview);
		router.registerWebview(b.webview);

		router.broadcastEvent("themeChanged", { dark: true });

		for (const fake of [a, b]) {
			assert.equal(fake.posted.length, 1);
			assert.deepEqual(fake.posted[0], {
				type: "event",
				event: "themeChanged",
				data: { dark: true },
			});
		}
	});

	test("disposing a webview registration stops further events", () => {
		const router = new MessageRouter();
		const fake = createFakeWebview();
		const disposable = router.registerWebview(fake.webview);

		disposable.dispose();
		router.broadcastEvent("gitStateChanged", {});

		assert.equal(fake.posted.length, 0);
	});
});
