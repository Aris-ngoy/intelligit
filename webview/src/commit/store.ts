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

	load: () => Promise<void>;
	setMessage: (message: string) => void;
	setMode: (mode: CommitMode) => void;
	appendText: (text: string) => void;
	replaceWithLastMessage: () => void;
	appendLastMessage: () => void;
	commit: () => Promise<boolean>;
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

export const useCommitStore = create<CommitStore>((set, get) => ({
	loading: true,
	error: null,
	status: null,
	message: "",
	mode: "new",
	busy: false,
	messageDirty: false,

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

		set({ busy: true, error: null });
		try {
			const result = await bridge.request<{ cancelled?: boolean }>(
				"createCommit",
				{
					message,
					amend,
				},
			);
			if (result?.cancelled) {
				return false;
			}
			set({ message: "", messageDirty: false, mode: "new" });
			await get().load();
			return true;
		} catch (err) {
			set({ error: err instanceof Error ? err.message : String(err) });
			return false;
		} finally {
			set({ busy: false });
		}
	},
}));

bridge.onEvent((event) => {
	if (event === "gitStateChanged") {
		void useCommitStore.getState().load();
	}
});
