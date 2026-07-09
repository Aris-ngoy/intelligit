const STORAGE_KEY = 'intelligit.commitTable.columnWidths';

export interface CommitTableColumnWidths {
	graph: number;
	author: number;
	date: number;
}

export const DEFAULT_AUTHOR_WIDTH = 120;
export const DEFAULT_DATE_WIDTH = 80;
export const MIN_AUTHOR_WIDTH = 72;
export const MIN_DATE_WIDTH = 64;

export function loadStoredColumnWidths(): Partial<CommitTableColumnWidths> {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return {};
		}
		const parsed = JSON.parse(raw) as Partial<CommitTableColumnWidths>;
		return {
			author: typeof parsed.author === 'number' ? parsed.author : undefined,
			date: typeof parsed.date === 'number' ? parsed.date : undefined,
			graph: typeof parsed.graph === 'number' ? parsed.graph : undefined,
		};
	} catch {
		return {};
	}
}

export function saveColumnWidths(widths: CommitTableColumnWidths): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
	} catch {
		// Ignore quota / private mode errors.
	}
}

export function resolveColumnWidths(
	graphMinWidth: number,
	stored: Partial<CommitTableColumnWidths>,
): CommitTableColumnWidths {
	return {
		graph: Math.max(graphMinWidth, stored.graph ?? graphMinWidth),
		author: Math.max(MIN_AUTHOR_WIDTH, stored.author ?? DEFAULT_AUTHOR_WIDTH),
		date: Math.max(MIN_DATE_WIDTH, stored.date ?? DEFAULT_DATE_WIDTH),
	};
}
