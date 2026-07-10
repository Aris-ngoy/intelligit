import { ColumnResizeHandle } from "./ColumnResizeHandle";
import type { CommitTableColumnWidths } from "./commitTableLayout";
import { MIN_AUTHOR_WIDTH, MIN_DATE_WIDTH } from "./commitTableLayout";

interface CommitTableHeaderProps {
	widths: CommitTableColumnWidths;
	graphMinWidth: number;
	onWidthsChange: (widths: CommitTableColumnWidths) => void;
}

export function CommitTableHeader({
	widths,
	graphMinWidth,
	onWidthsChange,
}: CommitTableHeaderProps) {
	const resizeGraph = (delta: number) => {
		onWidthsChange({
			...widths,
			graph: Math.max(graphMinWidth, widths.graph + delta),
		});
	};

	const resizeAuthor = (delta: number) => {
		onWidthsChange({
			...widths,
			author: Math.max(MIN_AUTHOR_WIDTH, widths.author + delta),
		});
	};

	const resizeDate = (delta: number) => {
		onWidthsChange({
			...widths,
			date: Math.max(MIN_DATE_WIDTH, widths.date + delta),
		});
	};

	return (
		<div
			className="sticky top-0 z-10 flex shrink-0 border-b border-[var(--color-border)] bg-[var(--color-app-bg)] px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]"
			data-testid="commit-table-header"
		>
			<div
				className="relative shrink-0 pr-3"
				style={{ width: widths.graph }}
				data-testid="commit-table-column-graph"
			>
				Graph
				<ColumnResizeHandle onResize={resizeGraph} />
			</div>
			<div
				className="relative min-w-0 flex-1 pr-3"
				data-testid="commit-table-column-message"
			>
				Message
				<ColumnResizeHandle onResize={resizeAuthor} />
			</div>
			<div
				className="relative shrink-0 pr-3"
				style={{ width: widths.author }}
				data-testid="commit-table-column-author"
			>
				Author
				<ColumnResizeHandle onResize={resizeDate} />
			</div>
			<div
				className="relative shrink-0"
				style={{ width: widths.date }}
				data-testid="commit-table-column-date"
			>
				Date
			</div>
		</div>
	);
}
