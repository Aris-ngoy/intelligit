import { create } from 'zustand';

import { bridge } from '../shared/bridge';
import type { RebaseFlagDto } from '../shared/types';

interface RebaseDialogStore {
	loading: boolean;
	error: string | null;
	refs: string[];
	currentBranch: string;
	repoRoot: string;
	onto: string;
	from: string;
	fromHash: string;
	fromLabel: string;
	commitCount: number;
	flags: RebaseFlagDto[];
	submitting: boolean;

	load: (fromHash?: string) => Promise<void>;
	setOnto: (value: string) => void;
	setFrom: (value: string) => void;
	toggleFlag: (flag: RebaseFlagDto) => void;
	submit: () => Promise<void>;
}

export const useRebaseDialogStore = create<RebaseDialogStore>((set, get) => ({
	loading: true,
	error: null,
	refs: [],
	currentBranch: '',
	repoRoot: '',
	onto: '',
	from: '',
	fromHash: '',
	fromLabel: '',
	commitCount: 0,
	flags: [],
	submitting: false,

	async load(fromHash = '') {
		set({ loading: true, error: null, fromHash });
		try {
			const data = await bridge.request<{
				refs: string[];
				currentBranch: string;
				root: string;
				fromHash?: string;
				rebaseFrom?: string;
				rebaseFromLabel?: string;
				commitCount?: number;
			} | { status: string }>('getRebaseRefs', fromHash ? { fromHash } : {});

			if ('status' in data) {
				set({ loading: false, error: 'No Git repository found.' });
				return;
			}

			const resolvedFromHash = data.fromHash ?? fromHash;
			const rebaseFrom = data.rebaseFrom ?? data.currentBranch;

			set({
				loading: false,
				refs: data.refs,
				currentBranch: data.currentBranch,
				repoRoot: data.root,
				from: rebaseFrom,
				fromHash: resolvedFromHash,
				fromLabel: data.rebaseFromLabel ?? '',
				commitCount: data.commitCount ?? 0,
			});
		} catch (err) {
			set({
				loading: false,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	},

	setOnto(value) {
		set({ onto: value });
	},

	setFrom(value) {
		set({ from: value });
	},

	toggleFlag(flag) {
		const flags = get().flags;
		set({
			flags: flags.includes(flag) ? flags.filter((f) => f !== flag) : [...flags, flag],
		});
	},

	async submit() {
		const { onto, from, fromHash, flags } = get();
		if (!onto.trim()) {
			set({ error: 'Onto is required.' });
			return;
		}
		set({ submitting: true, error: null });
		try {
			await bridge.request('startStandardRebase', {
				onto,
				from: fromHash ? from : undefined,
				flags,
			});
		} catch (err) {
			set({ error: err instanceof Error ? err.message : String(err) });
		} finally {
			set({ submitting: false });
		}
	},
}));

bridge.onEvent((event, data) => {
	if (event === 'openRebaseDialog') {
		const payload = data as { fromHash?: string };
		void useRebaseDialogStore.getState().load(payload.fromHash ?? '');
	}
	if (event === 'closeRebaseDialog') {
		useRebaseDialogStore.setState({ submitting: false, error: null });
	}
});
