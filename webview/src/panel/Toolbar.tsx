import { useGitLogStore } from '../shared/store';
import { FilterSelect, IconButton } from '../shared/ui';
import { RefreshIcon } from '../shared/icons';

const BRANCH_OPTIONS = [
	{ value: 'all', label: 'All branches' },
	{ value: 'local', label: 'Local only' },
	{ value: 'remote', label: 'Remote only' },
] as const;

const DATE_OPTIONS = [
	{ value: '', label: 'Anytime' },
	{ value: 'today', label: 'Today' },
	{ value: 'yesterday', label: 'Yesterday' },
	{ value: 'last-week', label: 'Last week' },
] as const;

export function Toolbar() {
	const repoInfo = useGitLogStore((s) => s.repoInfo);
	const authors = useGitLogStore((s) => s.authors);
	const filters = useGitLogStore((s) => s.filters);
	const setFilters = useGitLogStore((s) => s.setFilters);
	const fetchAll = useGitLogStore((s) => s.fetchAll);
	const openExternal = useGitLogStore((s) => s.openExternal);

	return (
		<div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-3 py-1.5">
			<FilterSelect
				label="Branch filter"
				value={filters.branchScope}
				onChange={(value) => setFilters({ branchScope: value })}
			>
				{BRANCH_OPTIONS.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
				{repoInfo?.branches
					.filter((b) => !b.remote)
					.map((b) => (
						<option key={b.name} value={b.name}>
							{b.name}
						</option>
					))}
			</FilterSelect>

			<FilterSelect
				label="Author filter"
				value={filters.author ?? ''}
				onChange={(value) => setFilters({ author: value || undefined })}
			>
				<option value="">All Authors</option>
				{authors.map((a) => (
					<option key={a} value={a}>
						{a}
					</option>
				))}
			</FilterSelect>

			<FilterSelect
				label="Date filter"
				value={filters.datePreset ?? ''}
				onChange={(value) =>
					setFilters({
						datePreset: (value || undefined) as typeof filters.datePreset,
					})
				}
			>
				{DATE_OPTIONS.map((o) => (
					<option key={o.value || 'any'} value={o.value}>
						{o.label}
					</option>
				))}
			</FilterSelect>

			<input
				type="search"
				placeholder="Search path or message…"
				className="min-w-[140px] flex-1 rounded-md border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 py-1 text-xs text-[var(--color-input-fg)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
				value={filters.path ?? ''}
				onChange={(e) => setFilters({ path: e.target.value || undefined })}
				aria-label="Search path or message"
			/>

			<div className="ml-auto flex items-center gap-0.5">
				<IconButton label="Refresh" onClick={() => void fetchAll()}>
					<RefreshIcon size={14} />
				</IconButton>
				<IconButton
					label="Documentation"
					onClick={() =>
						void openExternal('https://github.com/Aris-ngoy/intelligit#readme')
					}
				>
					<HelpIcon />
				</IconButton>
			</div>
		</div>
	);
}

function HelpIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
			<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
			<path
				d="M9.5 9.5a2.5 2.5 0 1 1 4.2 1.8c-.8.6-1.2 1.2-1.2 2.2"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<circle cx="12" cy="17" r="1" fill="currentColor" />
		</svg>
	);
}
