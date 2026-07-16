import { createPreviewBridge, isPreviewMode } from "../preview/previewBridge";

export interface RequestMessage {
	type: "request";
	id: string;
	command: string;
	params: Record<string, unknown>;
}

export interface ResponseMessage {
	type: "response";
	id: string;
	success: boolean;
	data?: unknown;
	error?: { code: string; message: string };
}

export interface EventMessage {
	type: "event";
	event: string;
	data: unknown;
}

export interface Bridge {
	request<T = unknown>(
		command: string,
		params?: Record<string, unknown>,
	): Promise<T>;
	onEvent(handler: (event: string, data: unknown) => void): () => void;
}

/** Default RPC wait; short UI reads stay snappy. */
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

/**
 * Commits (hooks), network git, and rebase can exceed 30s.
 * Without a longer window the webview shows "timed out" while git keeps running.
 */
const LONG_RUNNING_REQUEST_TIMEOUT_MS = 15 * 60_000;

const LONG_RUNNING_COMMANDS = new Set([
	"createCommit",
	"gitPush",
	"gitPull",
	"gitFetch",
	"startInteractiveRebase",
	"startStandardRebase",
	"continueOperation",
]);

function requestTimeoutMs(command: string): number {
	return LONG_RUNNING_COMMANDS.has(command)
		? LONG_RUNNING_REQUEST_TIMEOUT_MS
		: DEFAULT_REQUEST_TIMEOUT_MS;
}

declare function acquireVsCodeApi(): {
	postMessage(msg: unknown): void;
};

function createVSCodeBridge(): Bridge {
	const vscode = acquireVsCodeApi();
	const pendingRequests = new Map<
		string,
		{ resolve: (v: unknown) => void; reject: (e: Error) => void }
	>();
	const eventHandlers = new Set<(event: string, data: unknown) => void>();

	window.addEventListener("message", (e: MessageEvent) => {
		const msg = e.data as ResponseMessage | EventMessage;
		if (msg.type === "response") {
			const pending = pendingRequests.get(msg.id);
			if (pending) {
				pendingRequests.delete(msg.id);
				if (msg.success) {
					pending.resolve(msg.data);
				} else {
					pending.reject(new Error(msg.error?.message ?? "Unknown error"));
				}
			}
		} else if (msg.type === "event") {
			for (const h of eventHandlers) {
				h(msg.event, msg.data);
			}
		}
	});

	return {
		request<T>(
			command: string,
			params: Record<string, unknown> = {},
		): Promise<T> {
			return new Promise<T>((resolve, reject) => {
				const id = crypto.randomUUID();
				const timeoutMs = requestTimeoutMs(command);
				const timeout = setTimeout(() => {
					pendingRequests.delete(id);
					const minutes = Math.round(timeoutMs / 60_000);
					reject(
						new Error(
							LONG_RUNNING_COMMANDS.has(command)
								? `Request '${command}' timed out after ${minutes} minutes. Check Git output — hooks or network may still be running.`
								: `Request '${command}' timed out`,
						),
					);
				}, timeoutMs);

				pendingRequests.set(id, {
					resolve: (v) => {
						clearTimeout(timeout);
						resolve(v as T);
					},
					reject: (err) => {
						clearTimeout(timeout);
						reject(err);
					},
				});

				const message: RequestMessage = {
					type: "request",
					id,
					command,
					params,
				};
				vscode.postMessage(message);
			});
		},
		onEvent(handler) {
			eventHandlers.add(handler);
			return () => eventHandlers.delete(handler);
		},
	};
}

export const bridge: Bridge = isPreviewMode()
	? createPreviewBridge()
	: createVSCodeBridge();
