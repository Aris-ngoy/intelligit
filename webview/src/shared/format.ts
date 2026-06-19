const LANE_COLORS = [
	'#6aab73',
	'#6897bb',
	'#9876aa',
	'#cc7832',
	'#ffc66d',
	'#808080',
];

export function laneColor(lane: number): string {
	return LANE_COLORS[lane % LANE_COLORS.length] ?? '#808080';
}

export function formatCommitDate(timestampSeconds: number, now = new Date()): string {
	const date = new Date(timestampSeconds * 1000);
	const pad = (n: number) => n.toString().padStart(2, '0');
	const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

	const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
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

export function statusLabel(status: string): string {
	switch (status) {
		case 'A':
			return 'Added';
		case 'M':
			return 'Modified';
		case 'D':
			return 'Deleted';
		case 'R':
			return 'Renamed';
		case 'C':
			return 'Copied';
		default:
			return status;
	}
}
