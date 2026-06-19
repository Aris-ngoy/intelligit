import { useGitLogStore } from '../shared/store';
import { formatCommitDate } from '../shared/format';
import { CommitTableRow } from './CommitTableRow';
import { computeMaxLane } from './GraphCell';

export function CommitTable() {
	const commits = useGitLogStore((s) => s.commits);
	const selectedHash = useGitLogStore((s) => s.selectedHash);
	const selectCommit = useGitLogStore((s) => s.selectCommit);
	const openContextMenu = useGitLogStore((s) => s.openContextMenu);

	const maxLane = computeMaxLane(commits);

	return (
		<div className="flex h-full flex-col overflow-hidden">
			<div className="grid shrink-0 grid-cols-[auto_1fr_minmax(100px,140px)_minmax(120px,160px)] border-b border-[var(--color-border)] px-1 py-1 text-[11px] text-[var(--color-muted)]">
				<span className="px-1">Graph</span>
				<span>Commit</span>
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
						dateLabel={formatCommitDate(commit.timestamp)}
					/>
				))}
			</div>
		</div>
	);
}
