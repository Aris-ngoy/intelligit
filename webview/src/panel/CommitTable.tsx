import { useGitLogStore } from '../shared/store';
import { formatRelativeDate } from '../shared/format';
import { EmptyState } from '../shared/ui';
import { CommitTableRow } from './CommitTableRow';
import { computeMaxLane } from './GraphCell';

export function CommitTable() {
	const commits = useGitLogStore((s) => s.commits);
	const selectedHash = useGitLogStore((s) => s.selectedHash);
	const selectCommit = useGitLogStore((s) => s.selectCommit);
	const openContextMenu = useGitLogStore((s) => s.openContextMenu);

	const maxLane = computeMaxLane(commits);

	if (commits.length === 0) {
		return (
			<EmptyState
				icon="🔍"
				title="No commits found"
				description="Try changing your branch, author, or date filters."
			/>
		);
	}

	return (
		<div className="flex h-full flex-col overflow-hidden">
			<div className="sticky top-0 z-10 grid shrink-0 grid-cols-[auto_1fr_minmax(88px,112px)_minmax(72px,96px)] border-b border-[var(--color-border)] bg-[var(--color-app-bg)] px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
				<span>Graph</span>
				<span>Message</span>
				<span>Author</span>
				<span>Date</span>
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto">
				{commits.map((commit, index) => (
					<CommitTableRow
						key={commit.hash}
						commit={commit}
						nextCommit={commits[index + 1]}
						maxLane={maxLane}
						selected={commit.hash === selectedHash}
						onSelect={() => void selectCommit(commit.hash)}
						onContextMenu={(e) => {
							e.preventDefault();
							openContextMenu(e.clientX, e.clientY, commit.hash);
						}}
						dateLabel={formatRelativeDate(commit.timestamp)}
					/>
				))}
			</div>
		</div>
	);
}
