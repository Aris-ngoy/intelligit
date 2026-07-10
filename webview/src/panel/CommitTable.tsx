import { useCallback, useEffect, useMemo, useState } from "react";
import { formatRelativeDate } from "../shared/format";
import { SearchIcon } from "../shared/icons";
import { useGitLogStore } from "../shared/store";
import { EmptyState } from "../shared/ui";
import { CommitTableHeader } from "./CommitTableHeader";
import { CommitTableRow } from "./CommitTableRow";
import {
	type CommitTableColumnWidths,
	loadStoredColumnWidths,
	resolveColumnWidths,
	saveColumnWidths,
} from "./commitTableLayout";
import { computeGraphWidth, computeMaxLane } from "./GraphCell";

export function CommitTable() {
	const commits = useGitLogStore((s) => s.commits);
	const selectedHash = useGitLogStore((s) => s.selectedHash);
	const selectCommit = useGitLogStore((s) => s.selectCommit);
	const openContextMenu = useGitLogStore((s) => s.openContextMenu);

	const maxLane = computeMaxLane(commits);
	const graphMinWidth = computeGraphWidth(maxLane);

	const [columnWidths, setColumnWidths] = useState<CommitTableColumnWidths>(
		() => resolveColumnWidths(graphMinWidth, loadStoredColumnWidths()),
	);

	useEffect(() => {
		setColumnWidths((current) => ({
			...current,
			graph: Math.max(graphMinWidth, current.graph),
		}));
	}, [graphMinWidth]);

	const handleWidthsChange = useCallback((widths: CommitTableColumnWidths) => {
		setColumnWidths(widths);
		saveColumnWidths(widths);
	}, []);

	const rows = useMemo(
		() =>
			commits.map((commit, index) => (
				<CommitTableRow
					key={commit.hash}
					commit={commit}
					nextCommit={commits[index + 1]}
					maxLane={maxLane}
					columnWidths={columnWidths}
					selected={commit.hash === selectedHash}
					onSelect={() => void selectCommit(commit.hash)}
					onContextMenu={(e) => {
						e.preventDefault();
						openContextMenu(e.clientX, e.clientY, commit.hash);
					}}
					dateLabel={formatRelativeDate(commit.timestamp)}
				/>
			)),
		[
			commits,
			maxLane,
			columnWidths,
			selectedHash,
			selectCommit,
			openContextMenu,
		],
	);

	if (commits.length === 0) {
		return (
			<EmptyState
				icon={<SearchIcon size={32} />}
				title="No commits found"
				description="Try changing your branch, author, or date filters."
			/>
		);
	}

	return (
		<div
			className="flex h-full flex-col overflow-hidden"
			data-testid="commit-table"
		>
			<CommitTableHeader
				widths={columnWidths}
				graphMinWidth={graphMinWidth}
				onWidthsChange={handleWidthsChange}
			/>
			<div className="min-h-0 flex-1 overflow-y-auto">{rows}</div>
		</div>
	);
}
