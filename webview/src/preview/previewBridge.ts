import type { Bridge } from "../shared/bridge";
import {
	previewAuthors,
	previewCommitFiles,
	previewCommits,
	previewConflictFiles,
	previewInteractiveCommits,
	previewMergeFile,
	previewMergeOperation,
	previewMergeRepoInfo,
	previewMergeVersions,
	previewRebaseRefs,
	previewRepoInfo,
	previewStashes,
	previewWorkingTreeStatus,
} from "./mockData";

export type PreviewScreen =
	| "gitlog"
	| "rebase"
	| "tidy"
	| "conflicts"
	| "merge"
	| "stash"
	| "commit";

export function getPreviewScreen(): PreviewScreen | null {
	const value = new URLSearchParams(window.location.search).get("preview");
	if (
		value === "gitlog" ||
		value === "rebase" ||
		value === "tidy" ||
		value === "conflicts" ||
		value === "merge" ||
		value === "stash" ||
		value === "commit"
	) {
		return value;
	}
	return null;
}

export function isPreviewMode(): boolean {
	return getPreviewScreen() !== null;
}

export function createPreviewBridge(): Bridge {
	return {
		async request<T>(
			command: string,
			params: Record<string, unknown> = {},
		): Promise<T> {
			await new Promise((r) => setTimeout(r, 80));
			switch (command) {
				case "getRepositoryInfo":
					return previewRepoInfo as T;
				case "getLog":
					return {
						commits: previewCommits,
						authors: previewAuthors,
						refs: [],
					} as T;
				case "getCommitFiles": {
					const hash = params.hash as string;
					return (previewCommitFiles[hash] ?? []) as T;
				}
				case "getRebaseRefs":
					return {
						refs: previewRebaseRefs,
						currentBranch: "feature/ui-refresh",
						root: "/preview/repo",
					} as T;
				case "getInteractiveRebaseCommits":
					return {
						commits: previewInteractiveCommits,
						currentBranch: "feature/onboarding-ux",
						root: "/preview/repo",
						fromHash: previewInteractiveCommits[0]?.hash ?? "",
					} as T;
				case "getMergeState":
					return previewMergeOperation as T;
				case "getConflictFiles":
					return previewConflictFiles as T;
				case "getStashes":
					return previewStashes as T;
				case "getWorkingTreeStatus":
					return previewWorkingTreeStatus as T;
				case "getFileVersions":
					return previewMergeVersions as T;
				case "copyToClipboard":
				case "openExternal":
				case "revertCommit":
				case "openDiffEditor":
				case "acceptOurs":
				case "acceptTheirs":
				case "openMergeEditor":
				case "continueOperation":
				case "abortOperation":
				case "saveMergedContent":
				case "stageFile":
				case "closeMergeEditor":
				case "startInteractiveRebase":
				case "startStandardRebase":
				case "openRebaseDialog":
				case "openConflicts":
				case "openStashes":
				case "openCommit":
				case "createCommit":
				case "openGitLogPanel":
				case "gitPull":
				case "gitPush":
				case "gitFetch":
				case "applyStash":
				case "dropStash":
				case "clearStashes":
				case "interactiveRebaseFromHere":
					return { success: true } as T;
				default:
					return { success: true } as T;
			}
		},
		onEvent() {
			return () => {};
		},
	};
}

/** @deprecated Use isPreviewMode() */
export function isGitLogPreviewMode(): boolean {
	return getPreviewScreen() === "gitlog";
}

export { previewMergeFile, previewMergeRepoInfo };
