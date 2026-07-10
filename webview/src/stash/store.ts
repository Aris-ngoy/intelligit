import { create } from "zustand";

import { bridge } from "../shared/bridge";
import type { StashEntryDto } from "../shared/types";

interface StashStore {
	loading: boolean;
	error: string | null;
	stashes: StashEntryDto[];
	searchQuery: string;
	busyIndex: number | null;
	busyAction: "apply" | "drop" | "clear" | null;

	load: () => Promise<void>;
	setSearchQuery: (query: string) => void;
	applyStash: (index: number) => Promise<void>;
	dropStash: (index: number) => Promise<void>;
	clearAll: () => Promise<void>;
}

export const useStashStore = create<StashStore>((set, get) => ({
	loading: true,
	error: null,
	stashes: [],
	searchQuery: "",
	busyIndex: null,
	busyAction: null,

	async load() {
		set({ loading: true, error: null });
		try {
			const stashes = await bridge.request<
				StashEntryDto[] | { status: string }
			>("getStashes");
			if ("status" in stashes) {
				set({ loading: false, stashes: [] });
				return;
			}
			set({ loading: false, stashes });
		} catch (err) {
			set({
				loading: false,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	},

	setSearchQuery(query) {
		set({ searchQuery: query });
	},

	async applyStash(index) {
		set({ busyIndex: index, busyAction: "apply", error: null });
		try {
			await bridge.request("applyStash", { index });
			await get().load();
		} catch (err) {
			set({ error: err instanceof Error ? err.message : String(err) });
		} finally {
			set({ busyIndex: null, busyAction: null });
		}
	},

	async dropStash(index) {
		set({ busyIndex: index, busyAction: "drop", error: null });
		try {
			const result = await bridge.request<{ cancelled?: boolean }>(
				"dropStash",
				{
					index,
				},
			);
			if (result?.cancelled) {
				return;
			}
			await get().load();
		} catch (err) {
			set({ error: err instanceof Error ? err.message : String(err) });
		} finally {
			set({ busyIndex: null, busyAction: null });
		}
	},

	async clearAll() {
		set({ busyAction: "clear", error: null });
		try {
			const result = await bridge.request<{ cancelled?: boolean }>(
				"clearStashes",
			);
			if (result?.cancelled) {
				return;
			}
			await get().load();
		} catch (err) {
			set({ error: err instanceof Error ? err.message : String(err) });
		} finally {
			set({ busyAction: null });
		}
	},
}));

bridge.onEvent((event) => {
	if (event === "gitStateChanged") {
		void useStashStore.getState().load();
	}
});

export function filterStashes(
	stashes: StashEntryDto[],
	searchQuery: string,
): StashEntryDto[] {
	const query = searchQuery.trim().toLowerCase();
	if (!query) {
		return stashes;
	}
	return stashes.filter((stash) => {
		const haystack = [stash.message, stash.branch, stash.ref, stash.commitHash]
			.filter(Boolean)
			.join(" ")
			.toLowerCase();
		return haystack.includes(query);
	});
}
