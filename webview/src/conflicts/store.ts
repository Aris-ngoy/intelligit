import { create } from 'zustand';

import { bridge } from '../shared/bridge';
import type { MergeOperationStateDto } from '../merge/types';

interface ConflictsStore {
	loading: boolean;
	error: string | null;
	operation: MergeOperationStateDto | null;
	files: string[];

	load: () => Promise<void>;
	acceptOurs: (filePath: string) => Promise<void>;
	acceptTheirs: (filePath: string) => Promise<void>;
	openMerge: (filePath: string) => Promise<void>;
	continueOperation: () => Promise<void>;
	abortOperation: () => Promise<void>;
}

export const useConflictsStore = create<ConflictsStore>((set, get) => ({
	loading: true,
	error: null,
	operation: null,
	files: [],

	async load() {
		set({ loading: true, error: null });
		try {
			const [operation, files] = await Promise.all([
				bridge.request<MergeOperationStateDto | { status: string }>('getMergeState'),
				bridge.request<string[] | { status: string }>('getConflictFiles'),
			]);

			if ('status' in operation || 'status' in files) {
				set({ loading: false, operation: null, files: [] });
				return;
			}

			set({ loading: false, operation, files });
		} catch (err) {
			set({
				loading: false,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	},

	async acceptOurs(filePath) {
		await bridge.request('acceptOurs', { filePath });
		await get().load();
	},

	async acceptTheirs(filePath) {
		await bridge.request('acceptTheirs', { filePath });
		await get().load();
	},

	async openMerge(filePath) {
		await bridge.request('openMergeEditor', { filePath });
	},

	async continueOperation() {
		try {
			await bridge.request('continueOperation', {});
			await get().load();
		} catch (err) {
			set({ error: err instanceof Error ? err.message : String(err) });
		}
	},

	async abortOperation() {
		try {
			await bridge.request('abortOperation', {});
			await get().load();
		} catch (err) {
			set({ error: err instanceof Error ? err.message : String(err) });
		}
	},
}));

bridge.onEvent((event) => {
	if (event === 'mergeStateChanged') {
		void useConflictsStore.getState().load();
	}
});
