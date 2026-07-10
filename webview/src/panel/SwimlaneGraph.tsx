import { type ReactElement, useMemo } from "react";

import { laneColor, refDisplayLabel } from "../shared/format";
import type { CommitDto } from "../shared/types";
import {
	COMMIT_ROW_HEIGHT,
	computeGraphWidth,
	computeMaxLane,
	LANE_PADDING,
	LANE_WIDTH,
} from "./graphLayout";

export {
	COMMIT_ROW_HEIGHT,
	computeGraphWidth,
	computeMaxLane,
} from "./graphLayout";

interface SwimlaneGraphProps {
	commits: CommitDto[];
	selectedHash: string | null;
	headHash: string | null;
	highlightedLane: number | null;
	onLaneHover: (lane: number | null) => void;
	onBranchAction?: (branchName: string, action: "checkout") => void;
}

function laneCenterX(lane: number): number {
	return LANE_PADDING + lane * LANE_WIDTH + LANE_WIDTH / 2;
}

function commitY(index: number): number {
	return index * COMMIT_ROW_HEIGHT + COMMIT_ROW_HEIGHT / 2;
}

function isLocalBranchRef(ref: string): boolean {
	const label = refDisplayLabel(ref);
	return (
		!label.startsWith("origin/") &&
		!label.startsWith("remotes/") &&
		!/^v?\d/.test(label)
	);
}

function buildHashIndex(commits: CommitDto[]): Map<string, number> {
	const map = new Map<string, number>();
	for (let i = 0; i < commits.length; i++) {
		const commit = commits[i];
		if (commit) {
			map.set(commit.hash, i);
		}
	}
	return map;
}

function computeLaneLabels(commits: CommitDto[]): Map<number, string> {
	const labels = new Map<number, string>();
	for (const commit of commits) {
		const lane = commit.graphLane ?? 0;
		if (labels.has(lane)) {
			continue;
		}
		const branchRef = commit.refs.find(isLocalBranchRef);
		if (branchRef) {
			labels.set(lane, refDisplayLabel(branchRef));
		}
	}
	return labels;
}

function laneDimmed(lane: number, highlightedLane: number | null): boolean {
	return highlightedLane !== null && lane !== highlightedLane;
}

export function SwimlaneGraph({
	commits,
	selectedHash,
	headHash,
	highlightedLane,
	onLaneHover,
	onBranchAction,
}: SwimlaneGraphProps) {
	const maxLane = computeMaxLane(commits);
	const width = computeGraphWidth(maxLane);
	const height = commits.length * COMMIT_ROW_HEIGHT;

	const hashIndex = useMemo(() => buildHashIndex(commits), [commits]);
	const laneLabels = useMemo(() => computeLaneLabels(commits), [commits]);

	const elements = useMemo(() => {
		const items: ReactElement[] = [];

		for (let lane = 0; lane <= maxLane; lane++) {
			const cx = laneCenterX(lane);
			const dimmed = laneDimmed(lane, highlightedLane);
			items.push(
				<line
					key={`track-${lane}`}
					x1={cx}
					y1={0}
					x2={cx}
					y2={height}
					stroke={laneColor(lane)}
					strokeWidth={1}
					opacity={dimmed ? 0.06 : 0.15}
				/>,
			);
		}

		for (let i = 0; i < commits.length; i++) {
			const commit = commits[i];
			if (!commit) {
				continue;
			}
			const lane = commit.graphLane ?? 0;
			const cx = laneCenterX(lane);
			const y = commitY(i);
			const color = laneColor(lane);
			const dimmed = laneDimmed(lane, highlightedLane);

			for (const parentHash of commit.parentHashes) {
				const parentIndex = hashIndex.get(parentHash);
				if (parentIndex === undefined) {
					continue;
				}
				const parent = commits[parentIndex];
				const parentLane = parent?.graphLane ?? 0;
				const px = laneCenterX(parentLane);
				const py = commitY(parentIndex);
				const isMergeParent =
					commit.parentHashes.length > 1 &&
					parentHash !== commit.parentHashes[0];
				const midY = (y + py) / 2;

				if (lane === parentLane) {
					items.push(
						<line
							key={`link-${commit.hash}-${parentHash}`}
							x1={cx}
							y1={y}
							x2={px}
							y2={py}
							stroke={color}
							strokeWidth={2}
							opacity={dimmed ? 0.25 : 1}
						/>,
					);
				} else {
					items.push(
						<path
							key={`link-${commit.hash}-${parentHash}`}
							d={`M ${cx} ${y} C ${cx} ${midY}, ${px} ${midY}, ${px} ${py}`}
							fill="none"
							stroke={laneColor(isMergeParent ? parentLane : lane)}
							strokeWidth={2}
							opacity={dimmed ? 0.25 : 1}
						/>,
					);
				}
			}
		}

		for (const [lane, label] of laneLabels) {
			const firstIndex = commits.findIndex((c) => (c.graphLane ?? 0) === lane);
			if (firstIndex < 0) {
				continue;
			}
			const cx = laneCenterX(lane);
			const y = commitY(firstIndex) - COMMIT_ROW_HEIGHT / 2 + 2;
			const dimmed = laneDimmed(lane, highlightedLane);
			items.push(
				<foreignObject
					key={`label-${lane}-${label}`}
					x={Math.max(0, cx - 36)}
					y={Math.max(0, y)}
					width={72}
					height={16}
					opacity={dimmed ? 0.4 : 1}
				>
					<button
						type="button"
						className="graph-branch-pill"
						title={`${label} — click to checkout`}
						onClick={(e) => {
							e.stopPropagation();
							onBranchAction?.(label, "checkout");
						}}
						onMouseEnter={() => onLaneHover(lane)}
						onMouseLeave={() => onLaneHover(null)}
					>
						{label}
					</button>
				</foreignObject>,
			);
		}

		for (let i = 0; i < commits.length; i++) {
			const commit = commits[i];
			if (!commit) {
				continue;
			}
			const lane = commit.graphLane ?? 0;
			const cx = laneCenterX(lane);
			const y = commitY(i);
			const color = laneColor(lane);
			const selected = commit.hash === selectedHash;
			const isHead = commit.hash === headHash;
			const isMerge = commit.parentHashes.length > 1;
			const dimmed = laneDimmed(lane, highlightedLane);
			const radius = isMerge ? 5 : 4;

			if (isHead) {
				items.push(
					<circle
						key={`head-ring-${commit.hash}`}
						cx={cx}
						cy={y}
						r={8}
						fill="none"
						stroke="var(--color-accent)"
						strokeWidth={1.5}
						strokeDasharray="3 2"
						opacity={dimmed ? 0.4 : 1}
					/>,
				);
			}

			if (isMerge) {
				items.push(
					<circle
						key={`merge-ring-${commit.hash}`}
						cx={cx}
						cy={y}
						r={radius + 2}
						fill="none"
						stroke={color}
						strokeWidth={1.5}
						opacity={dimmed ? 0.35 : 0.85}
					/>,
				);
			}

			items.push(
				<circle
					key={`node-${commit.hash}`}
					cx={cx}
					cy={y}
					r={selected ? radius + 1 : radius}
					fill={color}
					stroke={
						selected
							? "var(--color-accent)"
							: isHead
								? "var(--color-accent)"
								: "none"
					}
					strokeWidth={selected || isHead ? 2 : 0}
					opacity={dimmed ? 0.35 : 1}
					style={{ pointerEvents: "none" }}
				/>,
			);
		}

		return items;
	}, [
		commits,
		hashIndex,
		height,
		maxLane,
		highlightedLane,
		laneLabels,
		selectedHash,
		headHash,
		onBranchAction,
		onLaneHover,
	]);

	if (commits.length === 0) {
		return null;
	}

	return (
		<svg
			width={width}
			height={height}
			className="block shrink-0"
			data-testid="swimlane-graph"
			aria-hidden
		>
			{elements}
		</svg>
	);
}
