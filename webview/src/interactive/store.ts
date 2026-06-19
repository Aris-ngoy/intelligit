import { create } from 'zustand';

import { bridge } from '../shared/bridge';
import type { InteractiveRebaseCommitDto, RebaseFlagDto } from '../shared/types';

interface InteractiveRebaseStore {
	loading: boolean;
	error: string | null;
	fromHash: string;
	currentBranch: string;
	repoRoot: string;
	commits: InteractiveRebaseCommitDto[];
	flags: RebaseFlagDto[];
	rebasing: boolean;

	init: (fromHash: string) => Promise<void>;
	setAction: (index: number, action: InteractiveRebaseCommitDto['action']) => void;
	setMessage: (index: number, message: string) => void;
	moveUp: (index: number) => void;
	moveDown: (index: number) => void;
	reorder: (from: number, to: number) => void;
	applyToolbarAction: (
		action: 'reword' | 'squash' | 'fixup' | 'drop',
		selectedIndex: number,
	) => void;
	toggleFlag: (flag: RebaseFlagDto) => void;
	startRebase: () => Promise<void>;
}

export const useInteractiveRebaseStore = create<InteractiveRebaseStore>((set, get) => ({
	loading: true,
	error: null,
	fromHash: '',
	currentBranch: '',
	repoRoot: '',
	commits: [],
	flags: [],
	rebasing: false,

	async init(fromHash) {
		set({ loading: true, error: null, fromHash });
		try {
			const data = await bridge.request<{
				commits: InteractiveRebaseCommitDto[];
				currentBranch: string;
				root: string;
				fromHash: string;
			} | { status: string }>('getInteractiveRebaseCommits', { fromHash });

			if ('status' in data) {
				set({ loading: false, error: 'No Git repository found.' });
				return;
			}

			set({
				loading: false,
				commits: data.commits,
				currentBranch: data.currentBranch,
				repoRoot: data.root,
				fromHash: data.fromHash,
			});
		} catch (err) {
			set({
				loading: false,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	},

	setAction(index, action) {
		const commits = [...get().commits];
		const row = commits[index];
		if (!row) {
			return;
		}
		commits[index] = { ...row, action };
		set({ commits });
	},

	setMessage(index, message) {
		const commits = [...get().commits];
		const row = commits[index];
		if (!row) {
			return;
		}
		commits[index] = { ...row, message };
		set({ commits });
	},

	moveUp(index) {
		if (index <= 0) {
			return;
		}
		const commits = [...get().commits];
		const prev = commits[index - 1];
		const curr = commits[index];
		if (!prev || !curr) {
			return;
		}
		commits[index - 1] = curr;
		commits[index] = prev;
		set({ commits });
	},

	moveDown(index) {
		const commits = [...get().commits];
		if (index >= commits.length - 1) {
			return;
		}
		const curr = commits[index];
		const next = commits[index + 1];
		if (!curr || !next) {
			return;
		}
		commits[index] = next;
		commits[index + 1] = curr;
		set({ commits });
	},

	reorder(from, to) {
		const commits = [...get().commits];
		if (
			from === to ||
			from < 0 ||
			to < 0 ||
			from >= commits.length ||
			to >= commits.length
		) {
			return;
		}
		const [moved] = commits.splice(from, 1);
		if (!moved) {
			return;
		}
		commits.splice(to, 0, moved);
		set({ commits });
	},

	applyToolbarAction(action, selectedIndex) {
		if (selectedIndex < 0) {
			return;
		}
		if (action === 'reword') {
			get().setAction(selectedIndex, 'reword');
			return;
		}
		if (action === 'drop') {
			get().setAction(selectedIndex, 'drop');
			return;
		}
		if (action === 'squash' || action === 'fixup') {
			if (selectedIndex === 0) {
				return;
			}
			get().setAction(selectedIndex, action);
		}
	},

	toggleFlag(flag) {
		const flags = get().flags;
		set({
			flags: flags.includes(flag)
				? flags.filter((f) => f !== flag)
				: [...flags, flag],
		});
	},

	async startRebase() {
		const { fromHash, commits, flags } = get();
		set({ rebasing: true, error: null });
		try {
			await bridge.request('startInteractiveRebase', {
				fromHash,
				commits,
				flags,
			});
		} catch (err) {
			set({
				error: err instanceof Error ? err.message : String(err),
			});
		} finally {
			set({ rebasing: false });
		}
	},
}));

bridge.onEvent((event, data) => {
	if (event === 'openInteractiveRebase') {
		const payload = data as { fromCommitHash?: string };
		if (payload.fromCommitHash) {
			void useInteractiveRebaseStore.getState().init(payload.fromCommitHash);
		}
	}
});
