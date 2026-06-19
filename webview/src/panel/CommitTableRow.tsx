import type { MouseEvent } from 'react';

import { refChipVariant, refDisplayLabel } from '../shared/format';
import type { CommitDto } from '../shared/types';
import { Chip } from '../shared/ui';
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
			className={`selectable-row grid grid-cols-[auto_1fr_minmax(88px,112px)_minmax(72px,96px)] items-center border-b border-[var(--color-border)]/30 px-2 transition ${
				selected ? 'selected' : ''
			}`}
			style={{ minHeight: COMMIT_ROW_HEIGHT }}
			onClick={onSelect}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onSelect();
				}
			}}
			onContextMenu={onContextMenu}
		>
			<div className="overflow-hidden py-0.5">
				<GraphCell commit={commit} nextCommit={nextCommit} maxLane={maxLane} selected={selected} />
			</div>
			<div className="flex min-w-0 items-center gap-1.5 py-1 pr-2">
				{commit.refs.map((ref) => (
					<Chip key={ref} variant={refChipVariant(ref)}>
						{refDisplayLabel(ref)}
					</Chip>
				))}
				<span className="truncate text-xs">{commit.subject}</span>
			</div>
			<div className="truncate py-1 pr-2 text-[11px] text-[var(--color-muted)]">{commit.author}</div>
			<div className="truncate py-1 pr-2 text-[11px] tabular-nums text-[var(--color-muted)]">
				{dateLabel}
			</div>
		</div>
	);
}
