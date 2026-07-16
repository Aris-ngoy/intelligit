import { create } from "zustand";
import { bridge } from "../shared/bridge";
import type { WorkingTreeStatusDto } from "../shared/types";

export type CommitMode = "new" | "amend";

interface CommitStore {
	loading: boolean;
	error: string | null;
	status: WorkingTreeStatusDto | null;
	message: string;
	mode: CommitMode;
	busy: boolean;
	messageDirty: boolean;
	/** Live stdout/stderr from git commit / hooks. */
	commitOutput: string;
	/** Status line while commit runs (e.g. running hooks). */
	commitPhase: string | null;

	load: () => Promise<void>;
	setMessage: (message: string) => void;
	setMode: (mode: CommitMode) => void;
	appendText: (text: string) => void;
	replaceWithLastMessage: () => void;
	appendLastMessage: () => void;
	stageFile: (filePath: string) => Promise<void>;
	unstageFile: (filePath: string) => Promise<void>;
	stageAll: () => Promise<void>;
	unstageAll: () => Promise<void>;
	openDiff: (filePath: string, kind: "staged" | "unstaged") => Promise<void>;
	commit: () => Promise<boolean>;
	appendCommitOutput: (chunk: string) => void;
	setCommitPhase: (phase: string | null) => void;
	clearCommitOutput: () => void;
}

function joinMessage(current: string, addition: string): string {
	const trimmedCurrent = current.trimEnd();
	const trimmedAddition = addition.trim();
	if (!trimmedCurrent) {
		return trimmedAddition;
	}
	if (!trimmedAddition) {
		return trimmedCurrent;
	}
	return `${trimmedCurrent}\n\n${trimmedAddition}`;
}

const MAX_COMMIT_OUTPUT_CHARS = 200_000;

export const useCommitStore = create<CommitStore>((set, get) => ({
	loading: true,
	error: null,
	status: null,
	message: "",
	mode: "new",
	busy: false,
	messageDirty: false,
	commitOutput: "",
	commitPhase: null,

	async load() {
		set({ loading: true, error: null });
		try {
			const status = await bridge.request<
				WorkingTreeStatusDto | { status: string }
			>("getWorkingTreeStatus");
			if ("status" in status) {
				set({ loading: false, status: null });
				return;
			}

			const { messageDirty, mode } = get();
			const updates: Partial<CommitStore> = {
				loading: false,
				status,
			};

			if (!messageDirty) {
				updates.message =
					mode === "amend" && status.lastCommitMessage
						? status.lastCommitMessage
						: "";
			}

			set(updates);
		} catch (err) {
			set({
				loading: false,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	},

	setMessage(message) {
		set({ message, messageDirty: true });
	},

	setMode(mode) {
		const { status, messageDirty } = get();
		set({ mode });
		if (!messageDirty && status) {
			set({
				message:
					mode === "amend" && status.lastCommitMessage
						? status.lastCommitMessage
						: "",
			});
		}
	},

	appendText(text) {
		const { message } = get();
		set({ message: joinMessage(message, text), messageDirty: true });
	},

	replaceWithLastMessage() {
		const { status } = get();
		if (status?.lastCommitMessage) {
			set({ message: status.lastCommitMessage, messageDirty: true });
		}
	},

	appendLastMessage() {
		const { status, message } = get();
		if (status?.lastCommitMessage) {
			set({
				message: joinMessage(message, status.lastCommitMessage),
				messageDirty: true,
			});
		}
	},

	async stageFile(filePath) {
		set({ busy: true, error: null });
		try {
			await bridge.request("stageFile", { filePath });
			await get().load();
		} catch (err) {
			set({ error: err instanceof Error ? err.message : String(err) });
		} finally {
			set({ busy: false });
		}
	},

	async unstageFile(filePath) {
		set({ busy: true, error: null });
		try {
			await bridge.request("unstageFile", { filePath });
			await get().load();
		} catch (err) {
			set({ error: err instanceof Error ? err.message : String(err) });
		} finally {
			set({ busy: false });
		}
	},

	async stageAll() {
		set({ busy: true, error: null });
		try {
			await bridge.request("stageAll");
			await get().load();
		} catch (err) {
			set({ error: err instanceof Error ? err.message : String(err) });
		} finally {
			set({ busy: false });
		}
	},

	async unstageAll() {
		set({ busy: true, error: null });
		try {
			await bridge.request("unstageAll");
			await get().load();
		} catch (err) {
			set({ error: err instanceof Error ? err.message : String(err) });
		} finally {
			set({ busy: false });
		}
	},

	async openDiff(filePath, kind) {
		try {
			await bridge.request("openWorkingTreeDiff", { filePath, kind });
		} catch (err) {
			set({ error: err instanceof Error ? err.message : String(err) });
		}
	},

	appendCommitOutput(chunk) {
		set((state) => {
			const next = state.commitOutput + chunk;
			return {
				commitOutput:
					next.length > MAX_COMMIT_OUTPUT_CHARS
						? next.slice(next.length - MAX_COMMIT_OUTPUT_CHARS)
						: next,
			};
		});
	},

	setCommitPhase(phase) {
		set({ commitPhase: phase });
	},

	clearCommitOutput() {
		set({ commitOutput: "", commitPhase: null });
	},

	async commit() {
		const { message, mode, status } = get();
		if (!message.trim()) {
			set({ error: "Write a commit message first." });
			return false;
		}

		const amend = mode === "amend";
		if (!amend && !status?.hasStagedChanges) {
			set({ error: "Stage some changes before committing." });
			return false;
		}
		if (amend && !status?.canAmend) {
			set({ error: "Nothing to amend on this branch." });
			return false;
		}

		set({
			busy: true,
			error: null,
			commitOutput: "",
			commitPhase: amend ? "Updating last commit…" : "Starting commit…",
		});
		try {
			const result = await bridge.request<{ cancelled?: boolean }>(
				"createCommit",
				{
					message,
					amend,
				},
			);
			if (result?.cancelled) {
				set({ commitPhase: null });
				return false;
			}
			set({
				message: "",
				messageDirty: false,
				mode: "new",
				commitPhase: null,
			});
			await get().load();
			return true;
		} catch (err) {
			set({
				error: err instanceof Error ? err.message : String(err),
				commitPhase: "Commit failed — see output below.",
			});
			return false;
		} finally {
			set({ busy: false });
		}
	},
}));

bridge.onEvent((event, data) => {
	if (event === "gitStateChanged") {
		// Avoid flashing the panel while commit/hooks are still running.
		if (!useCommitStore.getState().busy) {
			void useCommitStore.getState().load();
		}
	}

	if (event === "gitCommandOutput") {
		const payload = data as { command?: string; chunk?: string };
		if (
			payload.command === "createCommit" &&
			typeof payload.chunk === "string"
		) {
			useCommitStore.getState().appendCommitOutput(payload.chunk);
		}
	}

	if (event === "gitCommandProgress") {
		const payload = data as {
			command?: string;
			message?: string;
			phase?: string;
		};
		if (payload.command !== "createCommit") {
			return;
		}
		if (typeof payload.message === "string") {
			useCommitStore.getState().setCommitPhase(payload.message);
		}
		if (payload.phase === "done") {
			// Keep phase briefly; commit() clears it on success.
		}
	}
});
