import { diffArrays } from "diff";
import { diff3MergeRegions, type IRegion } from "node-diff3";

import type { MergeBlock, MergeBlockState } from "./types";

function blockId(index: number, prefix: string): string {
	return `block-${prefix}-${index}-${Math.random().toString(36).slice(2, 9)}`;
}

function refineConflictBlock(
	block: MergeBlock,
	blockIndex: number,
): MergeBlock[] {
	const changes = diffArrays(block.leftLines, block.rightLines);
	const subBlocks: MergeBlock[] = [];
	let subIdx = 0;
	let i = 0;

	while (i < changes.length) {
		const change = changes[i];
		if (!change) {
			i++;
			continue;
		}
		if (!change.added && !change.removed) {
			const lines = change.value;
			subBlocks.push({
				id: blockId(blockIndex * 1000 + subIdx++, "equal"),
				state: "equal",
				baseLines: lines,
				leftLines: lines,
				rightLines: lines,
				resultLines: [...lines],
				isResolved: true,
			});
			i++;
			continue;
		}

		let leftLines: string[] = [];
		let rightLines: string[] = [];
		if (change.removed) {
			leftLines = change.value;
			i++;
			if (i < changes.length && changes[i]?.added) {
				rightLines = changes[i]?.value;
				i++;
			}
		} else if (change.added) {
			rightLines = change.value;
			i++;
		}

		subBlocks.push({
			id: blockId(blockIndex * 1000 + subIdx++, "conflict"),
			state: "conflict",
			baseLines: [],
			leftLines,
			rightLines,
			resultLines: [],
			isResolved: false,
		});
	}

	return subBlocks;
}

/** Left = Local (ours), Right = Incoming (theirs). */
export function parseMergeBlocks(
	base: string,
	ours: string,
	theirs: string,
): MergeBlock[] {
	const baseLines = base.split("\n");
	const leftLines = ours.split("\n");
	const rightLines = theirs.split("\n");
	const regions = diff3MergeRegions(leftLines, baseLines, rightLines);
	const blocks: MergeBlock[] = [];

	regions.forEach((region: IRegion, index: number) => {
		if (region.stable) {
			const content = region.bufferContent ?? [];
			blocks.push({
				id: blockId(index, "equal"),
				state: "equal",
				baseLines: content,
				leftLines: content,
				rightLines: content,
				resultLines: [...content],
				isResolved: true,
			});
			return;
		}

		const bLines = region.oContent ?? [];
		const lLines = region.aContent ?? [];
		const rLines = region.bContent ?? [];

		const leftChanged = JSON.stringify(bLines) !== JSON.stringify(lLines);
		const rightChanged = JSON.stringify(bLines) !== JSON.stringify(rLines);
		const bothSame =
			leftChanged &&
			rightChanged &&
			JSON.stringify(lLines) === JSON.stringify(rLines);

		let state: MergeBlockState = "conflict";
		if (bothSame) {
			state = "modified_both";
		} else if (leftChanged && !rightChanged) {
			state = "modified_left";
		} else if (!leftChanged && rightChanged) {
			state = "modified_right";
		}

		let resultLines = [...bLines];
		let isResolved = false;
		if (state === "modified_left" || state === "modified_both") {
			resultLines = [...lLines];
			isResolved = true;
		} else if (state === "modified_right") {
			resultLines = [...rLines];
			isResolved = true;
		}

		const block: MergeBlock = {
			id: blockId(index, state),
			state,
			baseLines: bLines,
			leftLines: lLines,
			rightLines: rLines,
			resultLines,
			isResolved,
		};

		if (state === "conflict") {
			blocks.push(...refineConflictBlock(block, index));
		} else {
			blocks.push(block);
		}
	});

	return blocks;
}

export function blocksToText(blocks: MergeBlock[]): string {
	return blocks.map((b) => b.resultLines.join("\n")).join("\n");
}

export function countUnresolvedConflicts(blocks: MergeBlock[]): number {
	return blocks.filter((b) => b.state === "conflict" && !b.isResolved).length;
}
