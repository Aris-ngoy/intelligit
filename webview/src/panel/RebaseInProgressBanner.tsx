import { bridge } from '../shared/bridge';
import { useGitLogStore } from '../shared/store';

export function RebaseInProgressBanner() {
	const repoInfo = useGitLogStore((s) => s.repoInfo);

	if (!repoInfo?.isRebaseInProgress && !repoInfo?.isMergeInProgress) {
		return null;
	}

	const label = repoInfo.isRebaseInProgress
		? 'Rebase in progress'
		: 'Merge in progress';

	return (
		<div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-2 text-xs">
			<span>
				<span aria-hidden className="mr-1.5">
					⏳
				</span>
				<strong className="text-[var(--color-app-fg)]">{label}</strong>
				<span className="ml-1.5 text-[var(--color-muted)]">
					— some files may need your help before you can finish.
				</span>
			</span>
			<button
				type="button"
				className="shrink-0 rounded-lg border border-[var(--color-accent)] bg-[var(--color-accent)] px-3 py-1 text-[11px] font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
				onClick={() => void bridge.request('openConflicts')}
			>
				Open conflicts
			</button>
		</div>
	);
}
