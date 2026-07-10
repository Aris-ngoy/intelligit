import type {
	GitCommit,
	GitLogEntry,
	GitLogFilters,
	ParsedGitLog,
} from "./types";

/** Field separator (%x1f) and record separator (%x1e) used in git log format strings. */
export const GIT_LOG_FIELD_SEP = "\x1f";
export const GIT_LOG_RECORD_SEP = "\x1e";

/**
 * Pretty-format string for `git log`.
 * Fields: hash, shortHash, parents, author, email, timestamp, subject, refs, body
 */
export const GIT_LOG_PRETTY_FORMAT =
	`%H${GIT_LOG_FIELD_SEP}%h${GIT_LOG_FIELD_SEP}%P${GIT_LOG_FIELD_SEP}` +
	`%an${GIT_LOG_FIELD_SEP}%ae${GIT_LOG_FIELD_SEP}%at${GIT_LOG_FIELD_SEP}` +
	`%s${GIT_LOG_FIELD_SEP}%D${GIT_LOG_FIELD_SEP}%b${GIT_LOG_RECORD_SEP}`;

const FIELD_COUNT = 9;

/**
 * Parse raw `git log` output produced with {@link GIT_LOG_PRETTY_FORMAT}.
 */
export function parseGitLog(raw: string, defaultBranch?: string): ParsedGitLog {
	const commits: GitLogEntry[] = [];
	const authorSet = new Set<string>();
	const refSet = new Set<string>();

	const records = raw
		.split(GIT_LOG_RECORD_SEP)
		.filter((r) => r.trim().length > 0);

	for (const record of records) {
		const commit = parseCommitRecord(record);
		if (!commit) {
			continue;
		}
		authorSet.add(commit.author);
		for (const ref of commit.refs) {
			refSet.add(ref);
		}
		commits.push(commit);
	}

	assignGraphLanes(commits, defaultBranch);

	return {
		commits,
		authors: [...authorSet].sort((a, b) => a.localeCompare(b)),
		refs: [...refSet].sort((a, b) => a.localeCompare(b)),
	};
}

function parseCommitRecord(record: string): GitCommit | undefined {
	const fields = record.split(GIT_LOG_FIELD_SEP);
	if (fields.length < FIELD_COUNT) {
		return undefined;
	}

	const [
		hash,
		shortHash,
		parentsRaw,
		author,
		authorEmail,
		timestampRaw,
		subject,
		refsRaw,
		body,
	] = fields;

	if (!hash || hash.length < 7) {
		return undefined;
	}

	const timestamp = Number.parseInt(timestampRaw ?? "0", 10);
	if (Number.isNaN(timestamp)) {
		return undefined;
	}

	return {
		hash,
		shortHash: shortHash ?? hash.slice(0, 7),
		parentHashes: parseParents(parentsRaw ?? ""),
		author: author ?? "Unknown",
		authorEmail: authorEmail ?? "",
		timestamp,
		subject: subject ?? "",
		body: (body ?? "").trimEnd(),
		refs: parseRefs(refsRaw ?? ""),
	};
}

function parseParents(parentsRaw: string): string[] {
	return parentsRaw.trim().split(/\s+/).filter(Boolean);
}

/** Parse `%D` ref list: `HEAD -> main, origin/main, tag: v1.0` */
export function parseRefs(refsRaw: string): string[] {
	if (!refsRaw.trim()) {
		return [];
	}

	return refsRaw
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean)
		.map(normalizeRef);
}

function normalizeRef(ref: string): string {
	// Strip "HEAD -> " prefix
	const headArrow = ref.match(/^HEAD\s*->\s*(.+)$/);
	if (headArrow) {
		return headArrow[1]?.trim();
	}
	// Strip "tag: " prefix but keep tag name
	const tagMatch = ref.match(/^tag:\s*(.+)$/);
	if (tagMatch) {
		return tagMatch[1]?.trim();
	}
	return ref;
}

function isLocalBranchRef(ref: string): boolean {
	return (
		!ref.startsWith("origin/") &&
		!ref.startsWith("remotes/") &&
		!/^v?\d/.test(ref)
	);
}

function branchRefOnCommit(commit: GitLogEntry, branchName: string): boolean {
	return commit.refs.some(
		(ref) =>
			ref === branchName ||
			ref === `origin/${branchName}` ||
			ref.endsWith(`/${branchName}`),
	);
}

/**
 * Assign horizontal lanes for branch graph rendering.
 * Processes commits newest-first (git log order).
 */
export function assignGraphLanes(
	commits: GitLogEntry[],
	defaultBranch?: string,
): void {
	const hashToIndex = new Map<string, number>();
	for (let i = 0; i < commits.length; i++) {
		const entry = commits[i];
		if (entry) {
			hashToIndex.set(entry.hash, i);
		}
	}

	const activeLanes = new Map<number, string>();
	let nextFreeLane = 0;

	for (let i = 0; i < commits.length; i++) {
		const commit = commits[i];
		if (!commit) {
			continue;
		}

		let lane = findLaneForCommit(activeLanes, commit.hash);
		if (lane === undefined) {
			lane = nextFreeLane;
			nextFreeLane++;
		}

		commit.graphLane = lane;
		commit.graphConnections = [];
		activeLanes.delete(lane);

		const parents = commit.parentHashes;
		if (parents.length === 0) {
			continue;
		}

		const firstParent = parents[0];
		if (!firstParent) {
			continue;
		}

		let firstParentLane = findLaneByHash(activeLanes, firstParent);
		if (firstParentLane === undefined) {
			firstParentLane = lane;
		}
		activeLanes.set(firstParentLane, firstParent);
		if (firstParentLane !== lane) {
			commit.graphConnections.push({
				fromLane: lane,
				toLane: firstParentLane,
				type: "normal",
			});
		} else {
			commit.graphConnections.push({
				fromLane: lane,
				toLane: lane,
				type: "normal",
			});
		}

		for (let p = 1; p < parents.length; p++) {
			const parentHash = parents[p];
			if (!parentHash) {
				continue;
			}
			let parentLane = findLaneByHash(activeLanes, parentHash);
			if (parentLane === undefined) {
				parentLane = nextFreeLane;
				nextFreeLane++;
			}
			activeLanes.set(parentLane, parentHash);
			commit.graphConnections.push({
				fromLane: lane,
				toLane: parentLane,
				type: "merge",
			});
		}
	}

	if (defaultBranch) {
		normalizeDefaultBranchLane(commits, defaultBranch);
	}
}

function normalizeDefaultBranchLane(
	commits: GitLogEntry[],
	defaultBranch: string,
): void {
	const tip = commits.find((c) => branchRefOnCommit(c, defaultBranch));
	if (tip?.graphLane === undefined || tip.graphLane === 0) {
		return;
	}

	const mainLane = tip.graphLane;
	const swap = (lane: number): number => {
		if (lane === mainLane) {
			return 0;
		}
		if (lane === 0) {
			return mainLane;
		}
		return lane;
	};

	for (const commit of commits) {
		if (commit.graphLane !== undefined) {
			commit.graphLane = swap(commit.graphLane);
		}
		for (const conn of commit.graphConnections ?? []) {
			conn.fromLane = swap(conn.fromLane);
			conn.toLane = swap(conn.toLane);
		}
	}
}

function findLaneForCommit(
	activeLanes: Map<number, string>,
	hash: string,
): number | undefined {
	for (const [lane, tipHash] of activeLanes) {
		if (tipHash === hash) {
			return lane;
		}
	}
	return undefined;
}

function findLaneByHash(
	activeLanes: Map<number, string>,
	hash: string,
): number | undefined {
	for (const [lane, tipHash] of activeLanes) {
		if (tipHash === hash) {
			return lane;
		}
	}
	return undefined;
}

/** Branch labels keyed by lane index (first local branch ref on that lane). */
export function laneBranchLabels(commits: GitLogEntry[]): Map<number, string> {
	const labels = new Map<number, string>();
	for (const commit of commits) {
		const lane = commit.graphLane;
		if (lane === undefined || labels.has(lane)) {
			continue;
		}
		const branchRef = commit.refs.find(isLocalBranchRef);
		if (branchRef) {
			labels.set(lane, branchRef);
		}
	}
	return labels;
}

/**
 * Format commit date in WebStorm style:
 * - "Today, HH:MM" for today
 * - "Yesterday, HH:MM" for yesterday
 * - "DD.MM.YYYY HH:MM" otherwise
 */
export function formatCommitDate(
	timestampSeconds: number,
	now: Date = new Date(),
): string {
	const date = new Date(timestampSeconds * 1000);
	const time = formatTime(date);

	const todayStart = startOfDay(now);
	const yesterdayStart = new Date(todayStart);
	yesterdayStart.setDate(yesterdayStart.getDate() - 1);
	const commitDay = startOfDay(date);

	if (commitDay.getTime() === todayStart.getTime()) {
		return `Today, ${time}`;
	}
	if (commitDay.getTime() === yesterdayStart.getTime()) {
		return `Yesterday, ${time}`;
	}

	const day = pad2(date.getDate());
	const month = pad2(date.getMonth() + 1);
	const year = date.getFullYear();
	return `${day}.${month}.${year} ${time}`;
}

function startOfDay(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatTime(d: Date): string {
	return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function pad2(n: number): string {
	return n.toString().padStart(2, "0");
}

/** Build `--since` / `--until` git args from filter preset. */
export function datePresetToGitArgs(
	preset: GitLogFilters["datePreset"],
	now: Date = new Date(),
): { since?: string; until?: string } {
	switch (preset) {
		case "today": {
			const start = startOfDay(now);
			return { since: start.toISOString() };
		}
		case "yesterday": {
			const todayStart = startOfDay(now);
			const yesterdayStart = new Date(todayStart);
			yesterdayStart.setDate(yesterdayStart.getDate() - 1);
			return {
				since: yesterdayStart.toISOString(),
				until: todayStart.toISOString(),
			};
		}
		case "last-week": {
			const weekAgo = new Date(now);
			weekAgo.setDate(weekAgo.getDate() - 7);
			return { since: weekAgo.toISOString() };
		}
		default:
			return {};
	}
}
