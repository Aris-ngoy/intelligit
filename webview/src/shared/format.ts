const LANE_COLORS = [
	"#6aab73",
	"#6897bb",
	"#9876aa",
	"#cc7832",
	"#ffc66d",
	"#808080",
];

export function laneColor(lane: number): string {
	return LANE_COLORS[lane % LANE_COLORS.length] ?? "#808080";
}

function startOfDay(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function pad(n: number): string {
	return n.toString().padStart(2, "0");
}

/** Relative label for the commit table — e.g. "2 mins ago", "Yesterday". */
export function formatRelativeDate(
	timestampSeconds: number,
	now = new Date(),
): string {
	const date = new Date(timestampSeconds * 1000);
	const diffMs = now.getTime() - date.getTime();
	const diffSec = Math.max(0, Math.floor(diffMs / 1000));
	const diffMin = Math.floor(diffSec / 60);
	const diffHour = Math.floor(diffMin / 60);

	if (diffMin < 1) {
		return "Just now";
	}
	if (diffMin < 60) {
		return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
	}
	if (
		diffHour < 24 &&
		startOfDay(date).getTime() === startOfDay(now).getTime()
	) {
		return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
	}

	const today = startOfDay(now);
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	const commitDay = startOfDay(date);

	if (commitDay.getTime() === yesterday.getTime()) {
		return "Yesterday";
	}

	return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/** Detailed label for the commit detail panel — e.g. "Today, 2:45 PM". */
export function formatCommitDate(
	timestampSeconds: number,
	now = new Date(),
): string {
	const date = new Date(timestampSeconds * 1000);
	const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

	const today = startOfDay(now);
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	const commitDay = startOfDay(date);

	if (commitDay.getTime() === today.getTime()) {
		return `Today, ${time}`;
	}
	if (commitDay.getTime() === yesterday.getTime()) {
		return `Yesterday, ${time}`;
	}

	return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${time}`;
}

export function authorInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) {
		return "?";
	}
	if (parts.length === 1) {
		return parts[0]?.slice(0, 2).toUpperCase();
	}
	return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

export function refChipVariant(
	ref: string,
): "branch" | "remote" | "tag" | "default" {
	const normalized = ref.replace(/^tag:\s*/, "");
	if (/^v?\d/.test(normalized) || normalized.includes("tag")) {
		return "tag";
	}
	if (
		ref.includes("origin/") ||
		ref.includes("remotes/") ||
		ref.startsWith("origin")
	) {
		return "remote";
	}
	if (
		ref === "HEAD" ||
		ref.startsWith("HEAD ->") ||
		(!ref.includes("/") && !ref.includes("~"))
	) {
		return "branch";
	}
	return "default";
}

export function refDisplayLabel(ref: string): string {
	return ref.replace(/^tag:\s*/, "").replace(/^HEAD ->\s*/, "");
}

/** Truncate long commit subjects; full text available via tooltip. */
export function truncateMessage(message: string, maxLen = 72): string {
	if (message.length <= maxLen) {
		return message;
	}
	return `${message.slice(0, maxLen - 1)}…`;
}

export function statusLabel(status: string): string {
	switch (status) {
		case "A":
			return "Added";
		case "M":
			return "Modified";
		case "D":
			return "Deleted";
		case "R":
			return "Renamed";
		case "C":
			return "Copied";
		default:
			return status;
	}
}

export type FileStatusTone = "added" | "modified" | "deleted" | "other";

export function fileStatusTone(status: string): FileStatusTone {
	switch (status) {
		case "A":
			return "added";
		case "M":
			return "modified";
		case "D":
			return "deleted";
		default:
			return "other";
	}
}
