import { type CSSProperties, type ReactElement, useMemo } from "react";

import { laneColor, refDisplayLabel } from "../shared/format";
import type { CommitDto } from "../shared/types";
import {
	COMMIT_ROW_HEIGHT,
	computeGraphHeight,
	computeGraphWidth,
	computeMaxLane,
	LANE_PADDING,
	LANE_WIDTH,
	NODE_RADIUS,
	PILL_HEIGHT,
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

interface LaneLabel {
	label: string;
	commitIndex: number;
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

/** Branch labels at each lane tip (newest commit on the lane with a local branch ref). */
function computeLaneLabels(commits: CommitDto[]): Map<number, LaneLabel> {
	const labels = new Map<number, LaneLabel>();
	for (let i = 0; i < commits.length; i++) {
		const commit = commits[i];
		if (!commit) {
			continue;
		}
		const lane = commit.graphLane ?? 0;
		if (labels.has(lane)) {
			continue;
		}
		const branchRef = commit.refs.find(isLocalBranchRef);
		if (branchRef) {
			labels.set(lane, {
				label: refDisplayLabel(branchRef),
				commitIndex: i,
			});
		}
	}
	return labels;
}

function laneDimmed(lane: number, highlightedLane: number | null): boolean {
	return highlightedLane !== null && lane !== highlightedLane;
}

/** Git-style elbow routing between child (above) and parent (below). */
function linkPath(
	childX: number,
	childY: number,
	parentX: number,
	parentY: number,
	sameLane: boolean,
): string {
	if (sameLane) {
		return `M ${childX} ${childY} L ${parentX} ${parentY}`;
	}
	const midY = (childY + parentY) / 2;
	return `M ${childX} ${childY} L ${childX} ${midY} L ${parentX} ${midY} L ${parentX} ${parentY}`;
}

function pillWidth(label: string): number {
	return Math.min(88, Math.max(36, label.length * 5.5 + 14));
}

function pillYForNode(nodeY: number): number {
	return nodeY - NODE_RADIUS - PILL_HEIGHT - 5;
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
	const height = computeGraphHeight(commits.length);

	const hashIndex = useMemo(() => buildHashIndex(commits), [commits]);
	const laneLabels = useMemo(() => computeLaneLabels(commits), [commits]);
	const labeledCommitIndices = useMemo(
		() => new Set([...laneLabels.values()].map((entry) => entry.commitIndex)),
		[laneLabels],
	);

	const elements = useMemo(() => {
		const items: ReactElement[] = [];

		for (let lane = 0; lane <= maxLane; lane++) {
			const cx = laneCenterX(lane);
			const dimmed = laneDimmed(lane, highlightedLane);
			const color = laneColor(lane);
			items.push(
				<line
					key={`track-${lane}`}
					x1={cx}
					y1={0}
					x2={cx}
					y2={height}
					stroke={color}
					strokeWidth={1}
					opacity={dimmed ? 0.06 : 0.14}
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
				const sameLane = lane === parentLane;
				const strokeColor = laneColor(isMergeParent ? parentLane : lane);

				items.push(
					<path
						key={`link-${commit.hash}-${parentHash}`}
						d={linkPath(cx, y, px, py, sameLane)}
						fill="none"
						stroke={strokeColor}
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
						opacity={dimmed ? 0.2 : 0.95}
					/>,
				);
			}
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
			const hasBranchLabel = labeledCommitIndices.has(i);
			const dimmed = laneDimmed(lane, highlightedLane);

			if (isMerge) {
				items.push(
					<circle
						key={`node-${commit.hash}`}
						cx={cx}
						cy={y}
						r={NODE_RADIUS + 1}
						fill="var(--color-app-bg)"
						stroke={color}
						strokeWidth={2}
						opacity={dimmed ? 0.35 : 1}
						style={{ pointerEvents: "none" }}
					/>,
				);
				if (selected) {
					items.push(
						<circle
							key={`sel-${commit.hash}`}
							cx={cx}
							cy={y}
							r={NODE_RADIUS + 3}
							fill="none"
							stroke="var(--color-accent)"
							strokeWidth={1.5}
							opacity={dimmed ? 0.4 : 1}
						/>,
					);
				}
				continue;
			}

			if (isHead && !hasBranchLabel) {
				items.push(
					<circle
						key={`head-ring-${commit.hash}`}
						cx={cx}
						cy={y}
						r={NODE_RADIUS + 3}
						fill="none"
						stroke={color}
						strokeWidth={1.5}
						strokeDasharray="3 2"
						opacity={dimmed ? 0.35 : 0.85}
					/>,
				);
			}

			items.push(
				<circle
					key={`node-${commit.hash}`}
					cx={cx}
					cy={y}
					r={selected ? NODE_RADIUS + 0.5 : NODE_RADIUS}
					fill={color}
					stroke={selected ? "var(--color-accent)" : "none"}
					strokeWidth={selected ? 2 : 0}
					opacity={dimmed ? 0.35 : 1}
					style={{ pointerEvents: "none" }}
				/>,
			);
		}

		for (const [lane, { label, commitIndex }] of laneLabels) {
			const cx = laneCenterX(lane);
			const color = laneColor(lane);
			const pillW = pillWidth(label);
			const nodeY = commitY(commitIndex);
			const pillY = pillYForNode(nodeY);
			const dimmed = laneDimmed(lane, highlightedLane);
			const pillStyle = {
				"--graph-lane-color": color,
			} as CSSProperties;

			items.push(
				<foreignObject
					key={`label-${lane}-${label}`}
					x={Math.max(2, cx - pillW / 2)}
					y={pillY}
					width={pillW}
					height={PILL_HEIGHT}
					opacity={dimmed ? 0.45 : 1}
				>
					<button
						type="button"
						className="graph-branch-pill"
						style={pillStyle}
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

		return items;
	}, [
		commits,
		hashIndex,
		height,
		maxLane,
		highlightedLane,
		laneLabels,
		labeledCommitIndices,
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
			className="block shrink-0 overflow-visible"
			data-testid="swimlane-graph"
			aria-hidden
		>
			{elements}
		</svg>
	);
}
