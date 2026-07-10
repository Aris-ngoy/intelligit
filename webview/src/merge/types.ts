export type MergeBlockState =
	| "equal"
	| "conflict"
	| "modified_left"
	| "modified_right"
	| "modified_both";

export interface MergeBlock {
	id: string;
	state: MergeBlockState;
	baseLines: string[];
	leftLines: string[];
	rightLines: string[];
	resultLines: string[];
	isResolved: boolean;
}

export interface FileVersionsDto {
	base: string;
	ours: string;
	theirs: string;
	working: string;
}

export interface MergeOperationStateDto {
	type: "none" | "merge" | "rebase" | "cherry-pick";
	message: string;
	isRebaseInProgress: boolean;
	isMergeInProgress: boolean;
}
