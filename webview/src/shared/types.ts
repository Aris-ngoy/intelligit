export interface CommitDto {
	hash: string;
	shortHash: string;
	parentHashes: string[];
	author: string;
	authorEmail: string;
	timestamp: number;
	subject: string;
	body: string;
	refs: string[];
	graphLane?: number;
	graphConnections?: GraphConnectionDto[];
}

export interface GraphConnectionDto {
	fromLane: number;
	toLane: number;
	type: "merge" | "normal";
}

export interface CommitFileDto {
	path: string;
	status: string;
	oldPath?: string;
}

export interface GitBranchDto {
	name: string;
	remote: boolean;
	current: boolean;
	upstream?: string;
}

export interface RepositoryInfoDto {
	root: string;
	currentBranch: string;
	branches: GitBranchDto[];
	isRebaseInProgress: boolean;
	isMergeInProgress: boolean;
	conflictFileCount: number;
	rebaseCommitsRemaining?: number;
}

export interface ParsedLogDto {
	commits: CommitDto[];
	authors: string[];
	refs: string[];
}

export interface LogFiltersDto {
	branchScope: "all" | "local" | "remote" | "current" | string;
	additionalBranches?: string[];
	author?: string;
	datePreset?: "today" | "yesterday" | "last-week" | "custom";
	since?: string;
	until?: string;
	path?: string;
}

export type RebaseFlagDto =
	| "--no-verify"
	| "--keep-empty"
	| "--autosquash"
	| "--autostash";

export interface InteractiveRebaseCommitDto {
	hash: string;
	shortHash: string;
	message: string;
	action: "pick" | "reword" | "edit" | "squash" | "fixup" | "drop";
	timestamp?: number;
}

export type ContextMenuAction =
	| "interactiveRebase"
	| "rebase"
	| "cherryPick"
	| "checkout"
	| "copyHash"
	| "newTag"
	| "newBranch"
	| "resetSoft"
	| "resetMixed"
	| "resetHard";

export interface StashEntryDto {
	index: number;
	ref: string;
	message: string;
	branch?: string;
	commitHash?: string;
	timestamp?: number;
}

export interface WorkingTreeFileDto {
	path: string;
	status: string;
	oldPath?: string;
}

export interface WorkingTreeStatusDto {
	branch: string;
	staged: WorkingTreeFileDto[];
	unstaged: WorkingTreeFileDto[];
	hasStagedChanges: boolean;
	lastCommitMessage: string;
	lastCommitHash: string;
	canAmend: boolean;
	lastCommitLikelyPushed: boolean;
}
