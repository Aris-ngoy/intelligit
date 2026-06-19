import { create } from 'zustand';

import { blocksToText, countUnresolvedConflicts, parseMergeBlocks } from './mergeLogic';
import type { MergeBlock } from './types';

interface MergeStore {
	blocks: MergeBlock[];
	filePath: string;
	isDirty: boolean;

	setFile: (filePath: string, base: string, ours: string, theirs: string) => void;
	acceptLeft: (blockId: string) => void;
	acceptRight: (blockId: string) => void;
	ignoreBlock: (blockId: string) => void;
	acceptAllLeft: () => void;
	acceptAllRight: () => void;
	updateResult: (blockId: string, text: string) => void;
	getResultText: () => string;
	getConflictCount: () => number;
	allResolved: () => boolean;
}

export const useMergeStore = create<MergeStore>((set, get) => ({
	blocks: [],
	filePath: '',
	isDirty: false,

	setFile(filePath, base, ours, theirs) {
		const blocks = parseMergeBlocks(base, ours, theirs);
		set({ filePath, blocks, isDirty: false });
	},

	acceptLeft(blockId) {
		set({
			isDirty: true,
			blocks: get().blocks.map((b) =>
				b.id === blockId
					? { ...b, resultLines: [...b.leftLines], isResolved: true }
					: b,
			),
		});
	},

	acceptRight(blockId) {
		set({
			isDirty: true,
			blocks: get().blocks.map((b) =>
				b.id === blockId
					? { ...b, resultLines: [...b.rightLines], isResolved: true }
					: b,
			),
		});
	},

	ignoreBlock(blockId) {
		set({
			isDirty: true,
			blocks: get().blocks.map((b) =>
				b.id === blockId
					? { ...b, resultLines: [...b.baseLines], isResolved: true }
					: b,
			),
		});
	},

	acceptAllLeft() {
		set({
			isDirty: true,
			blocks: get().blocks.map((b) => ({
				...b,
				resultLines: [...b.leftLines],
				isResolved: true,
			})),
		});
	},

	acceptAllRight() {
		set({
			isDirty: true,
			blocks: get().blocks.map((b) => ({
				...b,
				resultLines: [...b.rightLines],
				isResolved: true,
			})),
		});
	},

	updateResult(blockId, text) {
		set({
			isDirty: true,
			blocks: get().blocks.map((b) =>
				b.id === blockId
					? {
							...b,
							resultLines: text.split('\n'),
							isResolved: b.state !== 'conflict',
						}
					: b,
			),
		});
	},

	getResultText() {
		return blocksToText(get().blocks);
	},

	getConflictCount() {
		return countUnresolvedConflicts(get().blocks);
	},

	allResolved() {
		const blocks = get().blocks;
		return blocks.every((b) => b.state === 'equal' || b.isResolved);
	},
}));
