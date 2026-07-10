import type { MouseEvent } from "react";

import { refChipVariant, refDisplayLabel } from "../shared/format";
import type { CommitDto } from "../shared/types";
import { Chip } from "../shared/ui";
import type { CommitTableColumnWidths } from "./commitTableLayout";
import { COMMIT_ROW_HEIGHT } from "./graphLayout";

interface CommitTableRowProps {
	commit: CommitDto;
	columnWidths: CommitTableColumnWidths;
	selected: boolean;
	laneHighlighted: boolean;
	onSelect: () => void;
	onLaneHover: (lane: number | null) => void;
	onContextMenu: (e: MouseEvent) => void;
	dateLabel: string;
	messageLabel: string;
}

export function CommitTableRow({
	commit,
	columnWidths,
	selected,
	laneHighlighted,
	onSelect,
	onLaneHover,
	onContextMenu,
	dateLabel,
	messageLabel,
}: CommitTableRowProps) {
	const lane = commit.graphLane ?? 0;
	const isMerge = commit.parentHashes.length > 1;

	return (
		<div
			role="button"
			tabIndex={0}
			className={`selectable-row flex items-start border-b border-[var(--color-border)]/30 px-2 transition ${
				selected ? "selected" : ""
			} ${laneHighlighted ? "graph-lane-highlight" : ""}`}
			style={{ minHeight: COMMIT_ROW_HEIGHT }}
			data-testid="commit-table-row"
			onClick={onSelect}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onSelect();
				}
			}}
			onContextMenu={onContextMenu}
			onMouseEnter={() => onLaneHover(lane)}
			onMouseLeave={() => onLaneHover(null)}
		>
			<div className="flex min-w-0 flex-1 items-center gap-1.5 py-1 pr-3">
				{commit.refs.map((ref) => (
					<Chip key={ref} variant={refChipVariant(ref)}>
						{refDisplayLabel(ref)}
					</Chip>
				))}
				<span
					className="truncate text-xs"
					title={commit.subject}
					data-testid="commit-message"
				>
					{isMerge && (
						<span className="mr-1 text-[10px] font-semibold uppercase text-[var(--color-muted)]">
							merge
						</span>
					)}
					{messageLabel}
				</span>
			</div>
			<div
				className="flex min-w-0 shrink-0 flex-col justify-center gap-0.5 py-1 pr-3"
				style={{ width: columnWidths.author }}
				data-testid="commit-table-author-cell"
			>
				<span className="truncate text-[11px] leading-tight text-[var(--color-app-fg)]">
					{commit.author}
				</span>
				<span className="truncate text-[10px] leading-tight text-[var(--color-muted)]">
					{commit.authorEmail}
				</span>
			</div>
			<div
				className="shrink-0 truncate py-1 text-[11px] tabular-nums text-[var(--color-muted)]"
				style={{ width: columnWidths.date }}
			>
				{dateLabel}
			</div>
		</div>
	);
}
