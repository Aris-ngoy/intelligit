/** Structured representation of a single Git commit. */
export interface GitCommit {
	hash: string;
	shortHash: string;
	parentHashes: string[];
	author: string;
	authorEmail: string;
	/** Unix timestamp in seconds (from git %at). */
	timestamp: number;
	subject: string;
	body: string;
	/** Branch and tag refs pointing at this commit (from git %D). */
	refs: string[];
}

/** Filters supported by the Git Log toolbar. */
export interface GitLogFilters {
	branchScope: 'all' | 'local' | 'remote' | string;
	author?: string;
	datePreset?: 'today' | 'yesterday' | 'last-week' | 'custom';
	since?: string;
	until?: string;
	path?: string;
}

/** Options passed to {@link GitService.getLog}. */
export interface GitLogOptions {
	maxCount?: number;
	filters?: GitLogFilters;
	all?: boolean;
}

/** Commit enriched with graph metadata (computed client-side). */
export interface GitLogEntry extends GitCommit {
	/** Lane index for branch graph rendering. */
	graphLane?: number;
	/** Connection hints for drawing graph lines to parents. */
	graphConnections?: GraphConnection[];
}

export interface GraphConnection {
	fromLane: number;
	toLane: number;
	type: 'merge' | 'normal';
}

/** Result of parsing `git log` output. */
export interface ParsedGitLog {
	commits: GitLogEntry[];
	authors: string[];
	refs: string[];
}

export interface GitBranch {
	name: string;
	remote: boolean;
	current: boolean;
	upstream?: string;
}

export interface GitRepositoryInfo {
	root: string;
	currentBranch: string;
	branches: GitBranch[];
	isRebaseInProgress: boolean;
	isMergeInProgress: boolean;
}

export interface GitExecResult {
	stdout: string;
	stderr: string;
	exitCode: number;
}

/** Interactive rebase action for a commit row. */
export type RebaseAction = 'pick' | 'reword' | 'edit' | 'squash' | 'fixup' | 'drop';

export interface InteractiveRebaseCommit {
	hash: string;
	shortHash: string;
	message: string;
	action: RebaseAction;
}

export interface RebaseOptions {
	onto: string;
	from?: string;
	flags: RebaseFlag[];
}

export type RebaseFlag =
	| '--onto'
	| '--no-verify'
	| '--keep-empty'
	| '--autosquash'
	| '--autostash';

/** Changed file in a commit (from git diff-tree --name-status). */
export interface CommitFile {
	path: string;
	status: string;
	oldPath?: string;
}

export interface MergeOperationState {
	type: 'none' | 'merge' | 'rebase' | 'cherry-pick';
	message: string;
	isRebaseInProgress: boolean;
	isMergeInProgress: boolean;
}

export interface ConflictFileInfo {
	path: string;
	oursModified: boolean;
	theirsModified: boolean;
}

export interface FileVersions {
	base: string;
	ours: string;
	theirs: string;
	working: string;
}

/** A changed file in the working tree or index. */
export interface WorkingTreeFile {
	path: string;
	status: string;
	oldPath?: string;
}

/** Snapshot of staged/unstaged changes for the commit UI. */
export interface WorkingTreeStatus {
	branch: string;
	staged: WorkingTreeFile[];
	unstaged: WorkingTreeFile[];
	hasStagedChanges: boolean;
	lastCommitMessage: string;
	lastCommitHash: string;
	canAmend: boolean;
	/** True when the current branch tracks a remote and has no unpushed commits. */
	lastCommitLikelyPushed: boolean;
}

export interface CreateCommitOptions {
	amend?: boolean;
	noVerify?: boolean;
}

/** A single entry from `git stash list`. */
export interface GitStashEntry {
	/** 0-based index matching `stash@{n}`. */
	index: number;
	ref: string;
	message: string;
	branch?: string;
	commitHash?: string;
	/** Unix timestamp in seconds. */
	timestamp?: number;
}
