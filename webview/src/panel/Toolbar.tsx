import { useGitLogStore } from '../shared/store';

const BRANCH_OPTIONS = [
	{ value: 'all', label: 'All' },
	{ value: 'local', label: 'Local' },
	{ value: 'remote', label: 'Remote' },
] as const;

const DATE_OPTIONS = [
	{ value: '', label: 'Any time' },
	{ value: 'today', label: 'Today' },
	{ value: 'yesterday', label: 'Yesterday' },
	{ value: 'last-week', label: 'Last week' },
] as const;

export function Toolbar() {
	const repoInfo = useGitLogStore((s) => s.repoInfo);
	const authors = useGitLogStore((s) => s.authors);
	const filters = useGitLogStore((s) => s.filters);
	const setFilters = useGitLogStore((s) => s.setFilters);

	return (
		<div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-2 py-1.5">
			<span className="text-xs font-semibold text-[var(--color-muted)]">
				{repoInfo?.currentBranch ?? '—'}
			</span>

			<select
				className="rounded border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 py-0.5 text-xs text-[var(--color-input-fg)]"
				value={filters.branchScope}
				onChange={(e) => setFilters({ branchScope: e.target.value })}
				aria-label="Branch filter"
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
			</select>

			<select
				className="rounded border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 py-0.5 text-xs text-[var(--color-input-fg)]"
				value={filters.author ?? ''}
				onChange={(e) => setFilters({ author: e.target.value || undefined })}
				aria-label="Author filter"
			>
				<option value="">All authors</option>
				{authors.map((a) => (
					<option key={a} value={a}>
						{a}
					</option>
				))}
			</select>

			<select
				className="rounded border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 py-0.5 text-xs text-[var(--color-input-fg)]"
				value={filters.datePreset ?? ''}
				onChange={(e) =>
					setFilters({
						datePreset: (e.target.value || undefined) as typeof filters.datePreset,
					})
				}
				aria-label="Date filter"
			>
				{DATE_OPTIONS.map((o) => (
					<option key={o.value || 'any'} value={o.value}>
						{o.label}
					</option>
				))}
			</select>

			<input
				type="text"
				placeholder="Path filter…"
				className="min-w-[120px] flex-1 rounded border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 py-0.5 text-xs text-[var(--color-input-fg)]"
				value={filters.path ?? ''}
				onChange={(e) => setFilters({ path: e.target.value || undefined })}
			/>
		</div>
	);
}
