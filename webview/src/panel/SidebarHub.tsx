import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { bridge } from "../shared/bridge";
import {
	AlertTriangleIcon,
	ArchiveIcon,
	ArrowDownIcon,
	ArrowUpIcon,
	GitBranchIcon,
	GitBranchPlusIcon,
	GitCommitIcon,
	GitMergeIcon,
	HistoryIcon,
	LoaderIcon,
	RadioIcon,
	RefreshIcon,
	SwordsIcon,
} from "../shared/icons";
import type { RepositoryInfoDto } from "../shared/types";
import { EmptyState, SectionHeader } from "../shared/ui";

interface ActionItem {
	id: string;
	icon: ReactNode;
	label: string;
	description: string;
	command: string;
	params?: Record<string, unknown>;
	highlight?: boolean;
}

const HISTORY_ACTIONS: ActionItem[] = [
	{
		id: "git-log",
		icon: <HistoryIcon size={16} />,
		label: "Git History",
		description: "Visual commit graph and branch tree",
		command: "openGitLogPanel",
		highlight: true,
	},
	{
		id: "refresh",
		icon: <RefreshIcon size={16} />,
		label: "Refresh",
		description: "Reload branches and commits",
		command: "refreshGitLog",
	},
];

const SYNC_ACTIONS: ActionItem[] = [
	{
		id: "pull",
		icon: <ArrowDownIcon size={16} />,
		label: "Pull",
		description: "Download changes from remote",
		command: "gitPull",
	},
	{
		id: "push",
		icon: <ArrowUpIcon size={16} />,
		label: "Push",
		description: "Upload commits to remote",
		command: "gitPush",
	},
	{
		id: "fetch",
		icon: <RadioIcon size={16} />,
		label: "Fetch",
		description: "Update remote refs without merging",
		command: "gitFetch",
	},
];

const WORKSPACE_ACTIONS: ActionItem[] = [
	{
		id: "commit",
		icon: <GitCommitIcon size={16} />,
		label: "Commit…",
		description: "Write a message and save staged changes",
		command: "openCommit",
		highlight: true,
	},
	{
		id: "stashes",
		icon: <ArchiveIcon size={16} />,
		label: "Stashes",
		description: "Set changes aside temporarily without committing",
		command: "openStashes",
	},
];

const BRANCH_ACTIONS: ActionItem[] = [
	{
		id: "switch-branch",
		icon: <GitBranchIcon size={16} />,
		label: "Switch Branch…",
		description: "Jump to another branch",
		command: "gitSwitchBranch",
	},
	{
		id: "new-branch",
		icon: <GitBranchPlusIcon size={16} />,
		label: "New Branch…",
		description: "Start a new line of work",
		command: "gitCreateBranch",
	},
];

const DEFAULT_REBASE_ACTION: ActionItem = {
	id: "rebase",
	icon: <GitMergeIcon size={16} />,
	label: "Rebase…",
	description: "Move your branch onto another",
	command: "openRebaseDialog",
};

function buildRebaseActions(repoInfo: RepositoryInfoDto): ActionItem[] {
	const operationInProgress =
		repoInfo.isRebaseInProgress || repoInfo.isMergeInProgress;
	const hasConflicts = repoInfo.conflictFileCount > 0;

	if (!operationInProgress && !hasConflicts) {
		return [DEFAULT_REBASE_ACTION];
	}

	const actions: ActionItem[] = [];

	if (repoInfo.isRebaseInProgress) {
		const remaining = repoInfo.rebaseCommitsRemaining;
		const remainingLabel =
			remaining === undefined
				? "Pick up where you left off"
				: `${remaining} commit${remaining === 1 ? "" : "s"} remaining`;

		actions.push({
			id: "continue-rebase",
			icon: <GitMergeIcon size={16} />,
			label: "Continue Rebase",
			description: remainingLabel,
			command: "continueOperation",
			highlight: !hasConflicts,
		});
	} else if (repoInfo.isMergeInProgress) {
		actions.push({
			id: "continue-merge",
			icon: <GitMergeIcon size={16} />,
			label: "Continue Merge",
			description: "Finish merging once conflicts are resolved",
			command: "continueOperation",
			highlight: !hasConflicts,
		});
	}

	if (hasConflicts) {
		const count = repoInfo.conflictFileCount;
		actions.push({
			id: "conflicts",
			icon: <SwordsIcon size={16} />,
			label: `Resolve conflicts (${count} file${count === 1 ? "" : "s"})`,
			description: "Side-by-side conflict resolution",
			command: "openConflicts",
			highlight: true,
		});
	}

	if (actions.length === 0) {
		return [DEFAULT_REBASE_ACTION];
	}

	return actions;
}

export function SidebarHub() {
	const [repoInfo, setRepoInfo] = useState<RepositoryInfoDto | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busyAction, setBusyAction] = useState<string | null>(null);
	const [branchFlash, setBranchFlash] = useState(false);
	const prevBranchRef = useRef<string | undefined>(undefined);

	const loadRepo = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const info = await bridge.request<RepositoryInfoDto | { status: string }>(
				"getRepositoryInfo",
			);
			if ("status" in info) {
				setRepoInfo(null);
				setError("No Git repository found in workspace.");
			} else {
				setRepoInfo(info);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadRepo();
	}, [loadRepo]);

	useEffect(() => {
		return bridge.onEvent((event) => {
			if (event === "gitStateChanged" || event === "mergeStateChanged") {
				void loadRepo();
			}
		});
	}, [loadRepo]);

	useEffect(() => {
		const currentBranch = repoInfo?.currentBranch;
		if (
			currentBranch &&
			prevBranchRef.current &&
			currentBranch !== prevBranchRef.current
		) {
			setBranchFlash(true);
			const timer = window.setTimeout(() => setBranchFlash(false), 1200);
			prevBranchRef.current = currentBranch;
			return () => window.clearTimeout(timer);
		}
		prevBranchRef.current = currentBranch;
	}, [repoInfo?.currentBranch]);

	const rebaseActions = useMemo(
		() => (repoInfo ? buildRebaseActions(repoInfo) : [DEFAULT_REBASE_ACTION]),
		[repoInfo],
	);

	async function runAction(action: ActionItem) {
		setBusyAction(action.id);
		setError(null);
		try {
			if (action.command === "refreshGitLog") {
				await bridge.request("getLog", { maxCount: 1 });
				await loadRepo();
			} else {
				const result = await bridge.request<{
					success?: boolean;
					cancelled?: boolean;
				}>(action.command, action.params ?? {});
				if (
					(action.command === "gitSwitchBranch" ||
						action.command === "gitCreateBranch") &&
					result.success
				) {
					await loadRepo();
				}
				if (
					action.command === "continueOperation" ||
					action.command === "openConflicts"
				) {
					await loadRepo();
				}
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setBusyAction(null);
		}
	}

	if (loading && !repoInfo) {
		return <EmptyState title="Loading repository…" />;
	}

	if (error && !repoInfo) {
		return (
			<EmptyState
				icon={<AlertTriangleIcon size={32} />}
				title="No Git repository"
				description={error}
			/>
		);
	}

	const hasConflicts = (repoInfo?.conflictFileCount ?? 0) > 0;
	const operationInProgress =
		repoInfo?.isRebaseInProgress || repoInfo?.isMergeInProgress;

	return (
		<div className="flex h-full flex-col overflow-hidden">
			<header className="flex shrink-0 items-center gap-2 border-b border-[var(--color-border)] px-3 py-2.5">
				<span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-accent)] text-[11px] font-bold text-white">
					IG
				</span>
				<div className="min-w-0 flex-1">
					<div className="font-semibold leading-tight">IntelliGit</div>
					{repoInfo && (
						<div className="flex items-center gap-1.5 text-[11px] text-[var(--color-muted)]">
							<span
								className={`h-1.5 w-1.5 shrink-0 rounded-full bg-green-500 ${
									branchFlash ? "branch-dot-flash" : ""
								}`}
								aria-hidden
							/>
							<span className="min-w-0 break-words leading-snug">
								{repoInfo.currentBranch}
							</span>
						</div>
					)}
				</div>
			</header>

			{hasConflicts && (
				<div
					className="shrink-0 border-b border-[var(--color-error)]/40 bg-[var(--color-error)]/10 px-3 py-2.5 text-[11px]"
					role="status"
				>
					<div className="flex items-start justify-between gap-2">
						<div>
							<strong className="text-[var(--color-error)]">
								Unresolved conflicts
							</strong>
							<p className="mt-0.5 text-[var(--color-muted)]">
								{repoInfo?.conflictFileCount} file
								{repoInfo?.conflictFileCount === 1 ? "" : "s"} need your
								attention before you can continue.
							</p>
						</div>
						<button
							type="button"
							className="shrink-0 rounded-md border border-[var(--color-error)]/50 bg-[var(--color-error)]/15 px-2 py-1 text-[10px] font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/25 focus:outline-none focus:ring-2 focus:ring-[var(--color-error)]/40"
							onClick={() => void bridge.request("openConflicts")}
						>
							Resolve
						</button>
					</div>
				</div>
			)}

			{operationInProgress && !hasConflicts && (
				<div className="shrink-0 border-b border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-3 py-2 text-[11px]">
					<strong>
						{repoInfo?.isRebaseInProgress ? "Rebase" : "Merge"} in progress
					</strong>
					<span className="ml-1 text-[var(--color-muted)]">
						— use Continue below when you&apos;re ready.
					</span>
				</div>
			)}

			{error && (
				<div className="shrink-0 border-b border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-3 py-2 text-[11px] text-[var(--color-error)]">
					{error}
				</div>
			)}

			<div className="min-h-0 flex-1 overflow-y-auto py-2">
				<ActionSection
					title="History"
					actions={HISTORY_ACTIONS}
					busyAction={busyAction}
					onRun={runAction}
				/>
				<ActionSection
					title="Sync"
					actions={SYNC_ACTIONS}
					busyAction={busyAction}
					onRun={runAction}
				/>
				<ActionSection
					title="Workspace"
					actions={WORKSPACE_ACTIONS}
					busyAction={busyAction}
					onRun={runAction}
				/>
				<ActionSection
					title="Branches"
					actions={BRANCH_ACTIONS}
					busyAction={busyAction}
					onRun={runAction}
				/>
				<ActionSection
					title="Rebase & merge"
					actions={rebaseActions}
					busyAction={busyAction}
					onRun={runAction}
				/>
			</div>

			<footer className="shrink-0 border-t border-[var(--color-border)] px-3 py-2 text-[10px] text-[var(--color-muted)]">
				<p className="mb-2">Everything safe. You can always undo.</p>
				<div className="flex gap-3">
					<button
						type="button"
						className="hover:text-[var(--color-app-fg)] hover:underline"
						onClick={() =>
							void bridge.request("openExternal", {
								url: "https://github.com/Aris-ngoy/intelligit#readme",
							})
						}
					>
						Documentation
					</button>
					<button
						type="button"
						className="hover:text-[var(--color-app-fg)] hover:underline"
						onClick={() =>
							void bridge.request("openExternal", {
								url: "https://github.com/Aris-ngoy/intelligit/issues",
							})
						}
					>
						Support
					</button>
				</div>
			</footer>
		</div>
	);
}

function ActionSection({
	title,
	actions,
	busyAction,
	onRun,
}: {
	title: string;
	actions: ActionItem[];
	busyAction: string | null;
	onRun: (action: ActionItem) => Promise<void>;
}) {
	return (
		<section className="mb-3">
			<SectionHeader>{title}</SectionHeader>
			<div className="space-y-0.5 px-1">
				{actions.map((action) => (
					<ActionButton
						key={action.id}
						action={action}
						busy={busyAction === action.id}
						disabled={busyAction !== null && busyAction !== action.id}
						onRun={() => void onRun(action)}
					/>
				))}
			</div>
		</section>
	);
}

function ActionButton({
	action,
	busy,
	disabled,
	onRun,
}: {
	action: ActionItem;
	busy: boolean;
	disabled: boolean;
	onRun: () => void;
}) {
	return (
		<button
			type="button"
			disabled={disabled || busy}
			className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 disabled:opacity-50 ${
				action.highlight
					? "bg-[var(--color-selected)] text-[var(--color-selected-fg)]"
					: "hover:bg-[var(--color-hover)]"
			}`}
			onClick={onRun}
			title={action.description}
		>
			<span className="mt-0.5 shrink-0 text-[var(--color-muted)]" aria-hidden>
				{busy ? <LoaderIcon size={16} /> : action.icon}
			</span>
			<span className="min-w-0">
				<span className="block text-xs font-medium leading-tight">
					{action.label}
				</span>
				<span
					className={`mt-0.5 block text-[10px] leading-snug ${
						action.highlight
							? "text-[var(--color-selected-fg)]/75"
							: "text-[var(--color-muted)]"
					}`}
				>
					{action.description}
				</span>
			</span>
		</button>
	);
}
