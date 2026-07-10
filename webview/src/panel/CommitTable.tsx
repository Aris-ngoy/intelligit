import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { bridge } from "../shared/bridge";
import { formatRelativeDate, truncateMessage } from "../shared/format";
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
import {
	COMMIT_ROW_HEIGHT,
	computeGraphWidth,
	computeMaxLane,
	GRAPH_TOP_PADDING,
} from "./graphLayout";
import { SwimlaneGraph } from "./SwimlaneGraph";

export function CommitTable() {
	const commits = useGitLogStore((s) => s.commits);
	const selectedHash = useGitLogStore((s) => s.selectedHash);
	const repoInfo = useGitLogStore((s) => s.repoInfo);
	const highlightedLane = useGitLogStore((s) => s.highlightedLane);
	const loadingMore = useGitLogStore((s) => s.loadingMore);
	const hasMore = useGitLogStore((s) => s.hasMore);
	const selectCommit = useGitLogStore((s) => s.selectCommit);
	const openContextMenu = useGitLogStore((s) => s.openContextMenu);
	const setHighlightedLane = useGitLogStore((s) => s.setHighlightedLane);
	const loadMore = useGitLogStore((s) => s.loadMore);
	const fetchAll = useGitLogStore((s) => s.fetchAll);

	const maxLane = computeMaxLane(commits);
	const graphMinWidth = computeGraphWidth(maxLane);
	const headHash = useMemo(() => {
		if (!repoInfo) {
			return commits[0]?.hash ?? null;
		}
		const current = repoInfo.currentBranch;
		const match = commits.find((c) =>
			c.refs.some(
				(ref) =>
					ref === current ||
					ref === `origin/${current}` ||
					ref.endsWith(`/${current}`),
			),
		);
		return match?.hash ?? commits[0]?.hash ?? null;
	}, [commits, repoInfo]);

	const [columnWidths, setColumnWidths] = useState<CommitTableColumnWidths>(
		() => resolveColumnWidths(graphMinWidth, loadStoredColumnWidths()),
	);

	const scrollRef = useRef<HTMLDivElement>(null);
	const loadMoreRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setColumnWidths((current) => ({
			...current,
			graph: Math.max(graphMinWidth, current.graph),
		}));
	}, [graphMinWidth]);

	useEffect(() => {
		const sentinel = loadMoreRef.current;
		const root = scrollRef.current;
		if (!sentinel || !root || !hasMore) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && !loadingMore) {
					void loadMore();
				}
			},
			{ root, rootMargin: "120px" },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [hasMore, loadingMore, loadMore]);

	const handleWidthsChange = useCallback((widths: CommitTableColumnWidths) => {
		setColumnWidths(widths);
		saveColumnWidths(widths);
	}, []);

	const handleBranchCheckout = useCallback(
		async (branchName: string) => {
			try {
				await bridge.request("gitCheckoutBranch", { branchName });
				await fetchAll();
			} catch {
				// Errors surface via store on next fetch if needed.
			}
		},
		[fetchAll],
	);

	const rows = useMemo(
		() =>
			commits.map((commit) => (
				<CommitTableRow
					key={commit.hash}
					commit={commit}
					columnWidths={columnWidths}
					selected={commit.hash === selectedHash}
					laneHighlighted={
						highlightedLane !== null &&
						(commit.graphLane ?? 0) === highlightedLane
					}
					onSelect={() => void selectCommit(commit.hash)}
					onLaneHover={setHighlightedLane}
					onContextMenu={(e) => {
						e.preventDefault();
						openContextMenu(e.clientX, e.clientY, commit.hash);
					}}
					dateLabel={formatRelativeDate(commit.timestamp)}
					messageLabel={truncateMessage(commit.subject)}
				/>
			)),
		[
			commits,
			columnWidths,
			selectedHash,
			highlightedLane,
			selectCommit,
			openContextMenu,
			setHighlightedLane,
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
			<div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
				<div
					className="flex min-h-full"
					style={{ paddingTop: GRAPH_TOP_PADDING }}
				>
					<div
						className="sticky left-0 shrink-0 self-start bg-[var(--color-app-bg)]"
						style={{ width: columnWidths.graph }}
					>
						<SwimlaneGraph
							commits={commits}
							selectedHash={selectedHash}
							headHash={headHash}
							highlightedLane={highlightedLane}
							onLaneHover={setHighlightedLane}
							onBranchAction={(branch) => void handleBranchCheckout(branch)}
						/>
					</div>
					<div className="min-w-0 flex-1">{rows}</div>
				</div>
				<div
					ref={loadMoreRef}
					className="flex items-center justify-center py-3 text-[11px] text-[var(--color-muted)]"
					style={{ minHeight: COMMIT_ROW_HEIGHT }}
				>
					{loadingMore
						? "Loading older commits…"
						: hasMore
							? "Scroll for more history"
							: "End of history"}
				</div>
			</div>
		</div>
	);
}
