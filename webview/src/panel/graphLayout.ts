import type { CommitDto } from "../shared/types";

export const COMMIT_ROW_HEIGHT = 28;
export const LANE_WIDTH = 14;
export const LANE_PADDING = 4;

export function computeGraphWidth(maxLane: number): number {
	return (maxLane + 1) * LANE_WIDTH + LANE_PADDING * 2;
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
