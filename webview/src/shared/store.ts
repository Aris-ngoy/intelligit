import { create } from "zustand";

import { bridge } from "./bridge";
import type {
	CommitDto,
	CommitFileDto,
	LogFiltersDto,
	ParsedLogDto,
	RepositoryInfoDto,
} from "./types";

/** Default number of commits loaded per page in the graph view. */
export const HISTORY_PAGE_SIZE = 75;

interface GitLogStore {
	loading: boolean;
	loadingMore: boolean;
	hasMore: boolean;
	error: string | null;
	repoInfo: RepositoryInfoDto | null;
	commits: CommitDto[];
	authors: string[];
	selectedHash: string | null;
	commitFiles: CommitFileDto[];
	contextMenu: { x: number; y: number; hash: string } | null;
	filters: LogFiltersDto;
	highlightedLane: number | null;

	fetchAll: () => Promise<void>;
	loadMore: () => Promise<void>;
	setFilters: (partial: Partial<LogFiltersDto>) => void;
	addExtraBranch: (branchName: string) => void;
	setHighlightedLane: (lane: number | null) => void;
	selectCommit: (hash: string) => Promise<void>;
	closeContextMenu: () => void;
	openContextMenu: (x: number, y: number, hash: string) => void;
	runContextAction: (action: string) => Promise<void>;
	openDiffEditor: (commitHash: string, filePath: string) => Promise<void>;
	revertCommit: (hash: string) => Promise<void>;
	copyHash: (hash: string) => Promise<void>;
	openExternal: (url: string) => Promise<void>;
}

export const useGitLogStore = create<GitLogStore>((set, get) => ({
	loading: true,
	loadingMore: false,
	hasMore: true,
	error: null,
	repoInfo: null,
	commits: [],
	authors: [],
	selectedHash: null,
	commitFiles: [],
	contextMenu: null,
	filters: { branchScope: "current", additionalBranches: [] },
	highlightedLane: null,

	async fetchAll() {
		set({ loading: true, error: null, hasMore: true });
		try {
			const [repoInfo, log] = await Promise.all([
				bridge.request<RepositoryInfoDto | { status: string }>(
					"getRepositoryInfo",
				),
				bridge.request<ParsedLogDto | { status: string }>("getLog", {
					maxCount: HISTORY_PAGE_SIZE,
					skip: 0,
					filters: get().filters,
				}),
			]);

			if ("status" in repoInfo || "status" in log) {
				set({
					loading: false,
					error: "No Git repository found in workspace.",
					repoInfo: null,
					commits: [],
					authors: [],
					hasMore: false,
				});
				return;
			}

			const prevSelected = get().selectedHash;
			const first = log.commits[0]?.hash ?? null;
			const selectedHash =
				prevSelected && log.commits.some((c) => c.hash === prevSelected)
					? prevSelected
					: first;
			set({
				loading: false,
				repoInfo,
				commits: log.commits,
				authors: log.authors,
				selectedHash,
				hasMore: log.commits.length >= HISTORY_PAGE_SIZE,
			});

			if (selectedHash) {
				await get().selectCommit(selectedHash);
			}
		} catch (err) {
			set({
				loading: false,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	},

	async loadMore() {
		const { commits, loadingMore, hasMore, filters } = get();
		if (loadingMore || !hasMore || commits.length === 0) {
			return;
		}

		const nextCount = commits.length + HISTORY_PAGE_SIZE;
		set({ loadingMore: true });
		try {
			const log = await bridge.request<ParsedLogDto | { status: string }>(
				"getLog",
				{
					maxCount: nextCount,
					skip: 0,
					filters,
				},
			);

			if ("status" in log) {
				set({ loadingMore: false, hasMore: false });
				return;
			}

			set({
				loadingMore: false,
				commits: log.commits,
				hasMore: log.commits.length >= nextCount,
			});
		} catch (err) {
			set({
				loadingMore: false,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	},

	setFilters(partial) {
		const filters = { ...get().filters, ...partial };
		set({ filters });
		void get().fetchAll();
	},

	addExtraBranch(branchName) {
		const current = get().filters.additionalBranches ?? [];
		if (current.includes(branchName)) {
			return;
		}
		get().setFilters({
			additionalBranches: [...current, branchName],
		});
	},

	setHighlightedLane(lane) {
		set({ highlightedLane: lane });
	},

	async selectCommit(hash) {
		set({ selectedHash: hash, commitFiles: [] });
		try {
			const files = await bridge.request<CommitFileDto[] | { status: string }>(
				"getCommitFiles",
				{ hash },
			);
			if (!("status" in files)) {
				set({ commitFiles: files });
			}
		} catch {
			set({ commitFiles: [] });
		}
	},

	closeContextMenu() {
		set({ contextMenu: null });
	},

	openContextMenu(x, y, hash) {
		set({ contextMenu: { x, y, hash } });
	},

	async runContextAction(action) {
		const { contextMenu } = get();
		if (!contextMenu) {
			return;
		}
		const hash = contextMenu.hash;
		set({ contextMenu: null });

		try {
			switch (action) {
				case "interactiveRebase":
					await bridge.request("interactiveRebaseFromHere", { hash });
					break;
				case "rebase":
					await bridge.request("openRebaseDialog", { fromHash: hash });
					break;
				case "copyHash":
					await get().copyHash(hash);
					break;
				case "cherryPick":
					await bridge.request("cherryPick", { hash });
					break;
				case "checkout":
					await bridge.request("checkoutRevision", { hash });
					break;
				default:
					break;
			}
			await get().fetchAll();
		} catch (err) {
			set({ error: err instanceof Error ? err.message : String(err) });
		}
	},

	async openDiffEditor(commitHash, filePath) {
		try {
			await bridge.request("openDiffEditor", { commit: commitHash, filePath });
		} catch (err) {
			set({ error: err instanceof Error ? err.message : String(err) });
		}
	},

	async revertCommit(hash) {
		try {
			await bridge.request("revertCommit", { hash });
			await get().fetchAll();
		} catch (err) {
			set({ error: err instanceof Error ? err.message : String(err) });
		}
	},

	async copyHash(hash) {
		try {
			await bridge.request("copyToClipboard", { text: hash });
		} catch {
			try {
				await navigator.clipboard.writeText(hash);
			} catch {
				// Clipboard unavailable in this webview context.
			}
		}
	},

	async openExternal(url) {
		try {
			await bridge.request("openExternal", { url });
		} catch {
			window.open(url, "_blank", "noopener,noreferrer");
		}
	},
}));

bridge.onEvent((event) => {
	if (event === "gitStateChanged") {
		void useGitLogStore.getState().fetchAll();
	}
});
