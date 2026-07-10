export interface RequestMessage {
	type: "request";
	id: string;
	command: CommandType;
	params: Record<string, unknown>;
}

export interface ResponseMessage {
	type: "response";
	id: string;
	success: boolean;
	data?: unknown;
	error?: {
		code: ErrorCode;
		message: string;
	};
}

export interface EventMessage {
	type: "event";
	event: EventType;
	data: unknown;
}

export type Message = RequestMessage | ResponseMessage | EventMessage;

export type CommandType =
	| "getLog"
	| "getRepositoryInfo"
	| "getCommitFiles"
	| "getRebaseRefs"
	| "getInteractiveRebaseCommits"
	| "startInteractiveRebase"
	| "startStandardRebase"
	| "openDiffEditor"
	| "interactiveRebaseFromHere"
	| "checkoutRevision"
	| "cherryPick"
	| "revertCommit"
	| "copyToClipboard"
	| "openExternal"
	| "getMergeState"
	| "getConflictFiles"
	| "getFileVersions"
	| "saveMergedContent"
	| "stageFile"
	| "acceptOurs"
	| "acceptTheirs"
	| "openMergeEditor"
	| "closeMergeEditor"
	| "continueOperation"
	| "abortOperation"
	| "openConflicts"
	| "openRebaseDialog"
	| "openGitLogPanel"
	| "gitPull"
	| "gitPush"
	| "gitFetch"
	| "getStashes"
	| "applyStash"
	| "dropStash"
	| "clearStashes"
	| "openStashes"
	| "getWorkingTreeStatus"
	| "createCommit"
	| "openCommit";

export type EventType =
	| "gitStateChanged"
	| "themeChanged"
	| "openInteractiveRebase"
	| "openRebaseDialog"
	| "closeRebaseDialog"
	| "mergeStateChanged";

export enum ErrorCode {
	GIT_NOT_FOUND = "GIT_NOT_FOUND",
	GIT_COMMAND_FAILED = "GIT_COMMAND_FAILED",
	NOT_A_GIT_REPO = "NOT_A_GIT_REPO",
	INVALID_REF = "INVALID_REF",
	UNKNOWN = "UNKNOWN",
}

export const NOT_GIT_REPO = { status: "not_git_repo" as const, data: null };
