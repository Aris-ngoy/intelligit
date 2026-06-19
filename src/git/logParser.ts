import type { GitCommit, GitLogEntry, GitLogFilters, ParsedGitLog } from './types';

/** Field separator (%x1f) and record separator (%x1e) used in git log format strings. */
export const GIT_LOG_FIELD_SEP = '\x1f';
export const GIT_LOG_RECORD_SEP = '\x1e';

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
export function parseGitLog(raw: string): ParsedGitLog {
	const commits: GitLogEntry[] = [];
	const authorSet = new Set<string>();
	const refSet = new Set<string>();

	const records = raw.split(GIT_LOG_RECORD_SEP).filter((r) => r.trim().length > 0);

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

	assignGraphLanes(commits);

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

	const timestamp = Number.parseInt(timestampRaw ?? '0', 10);
	if (Number.isNaN(timestamp)) {
		return undefined;
	}

	return {
		hash,
		shortHash: shortHash ?? hash.slice(0, 7),
		parentHashes: parseParents(parentsRaw ?? ''),
		author: author ?? 'Unknown',
		authorEmail: authorEmail ?? '',
		timestamp,
		subject: subject ?? '',
		body: (body ?? '').trimEnd(),
		refs: parseRefs(refsRaw ?? ''),
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
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean)
		.map(normalizeRef);
}

function normalizeRef(ref: string): string {
	// Strip "HEAD -> " prefix
	const headArrow = ref.match(/^HEAD\s*->\s*(.+)$/);
	if (headArrow) {
		return headArrow[1]!.trim();
	}
	// Strip "tag: " prefix but keep tag name
	const tagMatch = ref.match(/^tag:\s*(.+)$/);
	if (tagMatch) {
		return tagMatch[1]!.trim();
	}
	return ref;
}

/**
 * Assign horizontal lanes for branch graph rendering.
 * Uses a simplified lane-assignment algorithm based on parent links.
 */
export function assignGraphLanes(commits: GitLogEntry[]): void {
	const hashToIndex = new Map<string, number>();
	commits.forEach((c, i) => hashToIndex.set(c.hash, i));

	const activeLanes = new Map<number, string>(); // lane -> commit hash at tip
	let nextFreeLane = 0;

	for (let i = 0; i < commits.length; i++) {
		const commit = commits[i]!;
		let lane = findLaneForCommit(activeLanes, commit.hash);

		if (lane === undefined) {
			lane = nextFreeLane;
			nextFreeLane++;
		}

		commit.graphLane = lane;
		commit.graphConnections = [];

		// Release this lane; parents may occupy lanes below
		activeLanes.delete(lane);

		const parents = commit.parentHashes;
		if (parents.length === 0) {
			continue;
		}

		// First parent continues in same lane
		const firstParent = parents[0]!;
		activeLanes.set(lane, firstParent);
		commit.graphConnections.push({
			fromLane: lane,
			toLane: lane,
			type: 'normal',
		});

		// Merge parents get new lanes
		for (let p = 1; p < parents.length; p++) {
			const parentHash = parents[p]!;
			let parentLane = findLaneByHash(activeLanes, parentHash);
			if (parentLane === undefined) {
				parentLane = nextFreeLane;
				nextFreeLane++;
			}
			activeLanes.set(parentLane, parentHash);
			commit.graphConnections.push({
				fromLane: lane,
				toLane: parentLane,
				type: 'merge',
			});
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
	return n.toString().padStart(2, '0');
}

/** Build `--since` / `--until` git args from filter preset. */
export function datePresetToGitArgs(
	preset: GitLogFilters['datePreset'],
	now: Date = new Date(),
): { since?: string; until?: string } {
	switch (preset) {
		case 'today': {
			const start = startOfDay(now);
			return { since: start.toISOString() };
		}
		case 'yesterday': {
			const todayStart = startOfDay(now);
			const yesterdayStart = new Date(todayStart);
			yesterdayStart.setDate(yesterdayStart.getDate() - 1);
			return {
				since: yesterdayStart.toISOString(),
				until: todayStart.toISOString(),
			};
		}
		case 'last-week': {
			const weekAgo = new Date(now);
			weekAgo.setDate(weekAgo.getDate() - 7);
			return { since: weekAgo.toISOString() };
		}
		default:
			return {};
	}
}
