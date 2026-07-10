import type { CommitDto } from "../shared/types";

export const COMMIT_ROW_HEIGHT = 28;
export const LANE_WIDTH = 16;
export const LANE_PADDING = 8;
/** Extra space above first row for branch tip labels. */
export const GRAPH_TOP_PADDING = 16;
export const NODE_RADIUS = 4;
export const PILL_HEIGHT = 14;

export function computeGraphWidth(maxLane: number): number {
	return (maxLane + 1) * LANE_WIDTH + LANE_PADDING * 2;
}

export function computeGraphHeight(commitCount: number): number {
	if (commitCount === 0) {
		return 0;
	}
	return commitCount * COMMIT_ROW_HEIGHT + 4;
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
