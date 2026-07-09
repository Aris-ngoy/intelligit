import type { ReactElement } from 'react';

import type { CommitDto } from '../shared/types';
import { laneColor } from '../shared/format';

const ROW_HEIGHT = 28;
const LANE_WIDTH = 14;
const PADDING = 4;

interface GraphCellProps {
	commit: CommitDto;
	nextCommit?: CommitDto;
	maxLane: number;
	selected?: boolean;
}

export function GraphCell({ commit, nextCommit, maxLane, selected }: GraphCellProps) {
	const lane = commit.graphLane ?? 0;
	const width = (maxLane + 1) * LANE_WIDTH + PADDING * 2;
	const cx = PADDING + lane * LANE_WIDTH + LANE_WIDTH / 2;
	const color = laneColor(lane);

	const lines: ReactElement[] = [];

	// Vertical lane tracks for visual continuity
	for (let i = 0; i <= maxLane; i++) {
		const trackCx = PADDING + i * LANE_WIDTH + LANE_WIDTH / 2;
		lines.push(
			<line
				key={`track-${i}`}
				x1={trackCx}
				y1={0}
				x2={trackCx}
				y2={ROW_HEIGHT}
				stroke={laneColor(i)}
				strokeWidth={1}
				opacity={0.15}
			/>,
		);
	}

	if (nextCommit) {
		const nextLane = nextCommit.graphLane ?? 0;
		const nextCx = PADDING + nextLane * LANE_WIDTH + LANE_WIDTH / 2;
		lines.push(
			<line
				key="main"
				x1={cx}
				y1={ROW_HEIGHT / 2}
				x2={nextCx}
				y2={ROW_HEIGHT + ROW_HEIGHT / 2}
				stroke={laneColor(nextLane)}
				strokeWidth={2}
			/>,
		);
	}

	for (const conn of commit.graphConnections ?? []) {
		if (conn.type === 'merge') {
			const toCx = PADDING + conn.toLane * LANE_WIDTH + LANE_WIDTH / 2;
			lines.push(
				<path
					key={`merge-${conn.toLane}`}
					d={`M ${cx} ${ROW_HEIGHT / 2} C ${cx} ${ROW_HEIGHT}, ${toCx} 0, ${toCx} ${ROW_HEIGHT / 2}`}
					fill="none"
					stroke={laneColor(conn.toLane)}
					strokeWidth={2}
				/>,
			);
		}
	}

	return (
		<svg width={width} height={ROW_HEIGHT} className="block shrink-0" aria-hidden>
			{lines}
			<circle
				cx={cx}
				cy={ROW_HEIGHT / 2}
				r={selected ? 5 : 4}
				fill={color}
				stroke={selected ? 'var(--color-accent)' : 'none'}
				strokeWidth={selected ? 2 : 0}
			/>
		</svg>
	);
}

export function computeGraphWidth(maxLane: number): number {
	return (maxLane + 1) * LANE_WIDTH + PADDING * 2;
}

export function computeMaxLane(commits: CommitDto[]): number {
	let max = 0;
	for (const c of commits) {
		max = Math.max(max, c.graphLane ?? 0);
		for (const conn of c.graphConnections ?? []) {
			max = Math.max(max, conn.toLane, conn.fromLane);
		}
	}
	return max;
}

export const COMMIT_ROW_HEIGHT = ROW_HEIGHT;
