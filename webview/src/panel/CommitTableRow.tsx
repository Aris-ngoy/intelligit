import type { MouseEvent } from 'react';

import type { CommitDto } from '../shared/types';
import { COMMIT_ROW_HEIGHT, GraphCell } from './GraphCell';

interface CommitTableRowProps {
	commit: CommitDto;
	nextCommit?: CommitDto;
	maxLane: number;
	selected: boolean;
	onSelect: () => void;
	onContextMenu: (e: MouseEvent) => void;
	dateLabel: string;
}

export function CommitTableRow({
	commit,
	nextCommit,
	maxLane,
	selected,
	onSelect,
	onContextMenu,
	dateLabel,
}: CommitTableRowProps) {
	return (
		<div
			role="button"
			tabIndex={0}
			className={`selectable-row grid grid-cols-[auto_1fr_minmax(100px,140px)_minmax(120px,160px)] items-center border-b border-[var(--color-border)]/40 px-1 ${selected ? 'selected' : ''}`}
			style={{ minHeight: COMMIT_ROW_HEIGHT }}
			onClick={onSelect}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					onSelect();
				}
			}}
			onContextMenu={onContextMenu}
		>
			<div className="overflow-hidden py-0.5 pl-0.5">
				<GraphCell commit={commit} nextCommit={nextCommit} maxLane={maxLane} />
			</div>
			<div className="min-w-0 truncate py-1 pr-2 text-xs">
				<span>{commit.subject}</span>
				{commit.refs.length > 0 && (
					<span className="ml-1.5 text-[10px] text-[var(--color-muted)]">
						{commit.refs.join(', ')}
					</span>
				)}
			</div>
			<div className="truncate py-1 pr-2 text-[11px] text-[var(--color-muted)]">
				{commit.author}
			</div>
			<div className="truncate py-1 pr-2 text-[11px] tabular-nums text-[var(--color-muted)]">
				{dateLabel}
			</div>
		</div>
	);
}
