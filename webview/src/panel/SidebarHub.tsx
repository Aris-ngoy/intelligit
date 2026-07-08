import { useCallback, useEffect, useState } from 'react';

import { bridge } from '../shared/bridge';
import type { RepositoryInfoDto } from '../shared/types';
import { EmptyState, SectionHeader } from '../shared/ui';

interface ActionItem {
	id: string;
	icon: string;
	label: string;
	description: string;
	command: string;
	params?: Record<string, unknown>;
	highlight?: boolean;
}

const HISTORY_ACTIONS: ActionItem[] = [
	{
		id: 'git-log',
		icon: '📊',
		label: 'Git History',
		description: 'Visual commit graph and branch tree',
		command: 'openGitLogPanel',
		highlight: true,
	},
	{
		id: 'refresh',
		icon: '🔄',
		label: 'Refresh',
		description: 'Reload branches and commits',
		command: 'refreshGitLog',
	},
];

const SYNC_ACTIONS: ActionItem[] = [
	{
		id: 'pull',
		icon: '⬇️',
		label: 'Pull',
		description: 'Download changes from remote',
		command: 'gitPull',
	},
	{
		id: 'push',
		icon: '⬆️',
		label: 'Push',
		description: 'Upload commits to remote',
		command: 'gitPush',
	},
	{
		id: 'fetch',
		icon: '📡',
		label: 'Fetch',
		description: 'Update remote refs without merging',
		command: 'gitFetch',
	},
];

const REBASE_ACTIONS: ActionItem[] = [
	{
		id: 'rebase',
		icon: '🔀',
		label: 'Rebase…',
		description: 'Move your branch onto another',
		command: 'openRebaseDialog',
	},
	{
		id: 'interactive-rebase',
		icon: '✨',
		label: 'Tidy up changes',
		description: 'Interactive rebase with plain language',
		command: 'interactiveRebaseFromHere',
	},
	{
		id: 'conflicts',
		icon: '⚔️',
		label: 'Resolve conflicts',
		description: 'Side-by-side conflict resolution',
		command: 'openConflicts',
	},
];

export function SidebarHub() {
	const [repoInfo, setRepoInfo] = useState<RepositoryInfoDto | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busyAction, setBusyAction] = useState<string | null>(null);

	const loadRepo = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const info = await bridge.request<RepositoryInfoDto | { status: string }>(
				'getRepositoryInfo',
			);
			if ('status' in info) {
				setRepoInfo(null);
				setError('No Git repository found in workspace.');
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
			if (event === 'gitStateChanged') {
				void loadRepo();
			}
		});
	}, [loadRepo]);

	async function runAction(action: ActionItem) {
		setBusyAction(action.id);
		setError(null);
		try {
			if (action.command === 'refreshGitLog') {
				await bridge.request('getLog', { maxCount: 1 });
				await loadRepo();
			} else {
				await bridge.request(action.command, action.params ?? {});
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
				icon="⚠️"
				title="No Git repository"
				description={error}
			/>
		);
	}

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
						<div className="flex items-center gap-1.5 truncate text-[11px] text-[var(--color-muted)]">
							<span
								className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500"
								aria-hidden
							/>
							<span className="truncate">{repoInfo.currentBranch}</span>
						</div>
					)}
				</div>
			</header>

			{operationInProgress && (
				<div className="shrink-0 border-b border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-3 py-2 text-[11px]">
					<strong>
						{repoInfo?.isRebaseInProgress ? 'Rebase' : 'Merge'} in progress
					</strong>
					<span className="ml-1 text-[var(--color-muted)]">
						— open conflicts to continue.
					</span>
				</div>
			)}

			{error && (
				<div className="shrink-0 border-b border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-3 py-2 text-[11px] text-[var(--color-error)]">
					{error}
				</div>
			)}

			<div className="min-h-0 flex-1 overflow-y-auto py-2">
				<ActionSection title="History" actions={HISTORY_ACTIONS} busyAction={busyAction} onRun={runAction} />
				<ActionSection title="Sync" actions={SYNC_ACTIONS} busyAction={busyAction} onRun={runAction} />
				<ActionSection title="Rebase & merge" actions={REBASE_ACTIONS} busyAction={busyAction} onRun={runAction} />
			</div>

			<footer className="shrink-0 border-t border-[var(--color-border)] px-3 py-2 text-[10px] text-[var(--color-muted)]">
				<p className="mb-2">Everything safe. You can always undo.</p>
				<div className="flex gap-3">
					<button
						type="button"
						className="hover:text-[var(--color-app-fg)] hover:underline"
						onClick={() =>
							void bridge.request('openExternal', {
								url: 'https://github.com/Aris-ngoy/intelligit#readme',
							})
						}
					>
						Documentation
					</button>
					<button
						type="button"
						className="hover:text-[var(--color-app-fg)] hover:underline"
						onClick={() =>
							void bridge.request('openExternal', {
								url: 'https://github.com/Aris-ngoy/intelligit/issues',
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
					? 'bg-[var(--color-selected)] text-[var(--color-selected-fg)]'
					: 'hover:bg-[var(--color-hover)]'
			}`}
			onClick={onRun}
			title={action.description}
		>
			<span className="mt-0.5 shrink-0 text-base leading-none" aria-hidden>
				{busy ? '⏳' : action.icon}
			</span>
			<span className="min-w-0">
				<span className="block text-xs font-medium leading-tight">{action.label}</span>
				<span
					className={`mt-0.5 block truncate text-[10px] leading-snug ${
						action.highlight
							? 'text-[var(--color-selected-fg)]/75'
							: 'text-[var(--color-muted)]'
					}`}
				>
					{action.description}
				</span>
			</span>
		</button>
	);
}
