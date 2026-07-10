import type { MouseEvent } from "react";

import { refChipVariant, refDisplayLabel } from "../shared/format";
import type { CommitDto } from "../shared/types";
import { Chip } from "../shared/ui";
import type { CommitTableColumnWidths } from "./commitTableLayout";
import { COMMIT_ROW_HEIGHT, GraphCell } from "./GraphCell";

interface CommitTableRowProps {
	commit: CommitDto;
	nextCommit?: CommitDto;
	maxLane: number;
	columnWidths: CommitTableColumnWidths;
	selected: boolean;
	onSelect: () => void;
	onContextMenu: (e: MouseEvent) => void;
	dateLabel: string;
}

export function CommitTableRow({
	commit,
	nextCommit,
	maxLane,
	columnWidths,
	selected,
	onSelect,
	onContextMenu,
	dateLabel,
}: CommitTableRowProps) {
	return (
		<div
			role="button"
			tabIndex={0}
			className={`selectable-row flex items-start border-b border-[var(--color-border)]/30 px-2 transition ${
				selected ? "selected" : ""
			}`}
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
		>
			<div
				className="shrink-0 overflow-hidden py-0.5 pr-3"
				style={{ width: columnWidths.graph }}
			>
				<GraphCell
					commit={commit}
					nextCommit={nextCommit}
					maxLane={maxLane}
					selected={selected}
				/>
			</div>
			<div className="flex min-w-0 flex-1 items-center gap-1.5 py-1 pr-3">
				{commit.refs.map((ref) => (
					<Chip key={ref} variant={refChipVariant(ref)}>
						{refDisplayLabel(ref)}
					</Chip>
				))}
				<span className="truncate text-xs">{commit.subject}</span>
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
