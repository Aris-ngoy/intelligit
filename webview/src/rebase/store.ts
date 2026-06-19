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
	flags: RebaseFlagDto[];
	submitting: boolean;

	load: () => Promise<void>;
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
	flags: [],
	submitting: false,

	async load() {
		set({ loading: true, error: null });
		try {
			const data = await bridge.request<{
				refs: string[];
				currentBranch: string;
				root: string;
			} | { status: string }>('getRebaseRefs');

			if ('status' in data) {
				set({ loading: false, error: 'No Git repository found.' });
				return;
			}

			set({
				loading: false,
				refs: data.refs,
				currentBranch: data.currentBranch,
				repoRoot: data.root,
				from: data.currentBranch,
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
		const { onto, from, flags } = get();
		if (!onto.trim()) {
			set({ error: 'Onto is required.' });
			return;
		}
		set({ submitting: true, error: null });
		try {
			await bridge.request('startStandardRebase', { onto, from, flags });
		} catch (err) {
			set({ error: err instanceof Error ? err.message : String(err) });
		} finally {
			set({ submitting: false });
		}
	},
}));
