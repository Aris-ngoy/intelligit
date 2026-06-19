import type { ReactNode } from 'react';

import { useGitLogStore } from '../shared/store';
import type { GitBranchDto } from '../shared/types';

function groupBranches(branches: GitBranchDto[]) {
	const current = branches.filter((b) => b.current);
	const local = branches.filter((b) => !b.remote && !b.current);
	const remote = branches.filter((b) => b.remote);
	return { current, local, remote };
}

export function BranchTree() {
	const repoInfo = useGitLogStore((s) => s.repoInfo);
	const filters = useGitLogStore((s) => s.filters);
	const setFilters = useGitLogStore((s) => s.setFilters);

	if (!repoInfo) {
		return null;
	}

	const { current, local, remote } = groupBranches(repoInfo.branches);
	const selected = filters.branchScope;

	return (
		<div className="flex h-full flex-col overflow-y-auto p-2 text-xs">
			<Section title="All">
				<BranchItem
					name="All branches"
					value="all"
					selected={selected === 'all'}
					onSelect={() => setFilters({ branchScope: 'all' })}
				/>
				<BranchItem
					name="Local"
					value="local"
					selected={selected === 'local'}
					onSelect={() => setFilters({ branchScope: 'local' })}
				/>
				<BranchItem
					name="Remote"
					value="remote"
					selected={selected === 'remote'}
					onSelect={() => setFilters({ branchScope: 'remote' })}
				/>
			</Section>

			{current.length > 0 && (
				<Section title="Current">
					{current.map((b) => (
						<BranchItem
							key={b.name}
							name={b.name}
							value={b.name}
							selected={selected === b.name}
							onSelect={() => setFilters({ branchScope: b.name })}
							bold
						/>
					))}
				</Section>
			)}

			<Section title="Local">
				{local.map((b) => (
					<BranchItem
						key={b.name}
						name={b.name}
						value={b.name}
						selected={selected === b.name}
						onSelect={() => setFilters({ branchScope: b.name })}
					/>
				))}
			</Section>

			<Section title="Remote">
				{remote.map((b) => (
					<BranchItem
						key={b.name}
						name={b.name}
						value={b.name}
						selected={selected === b.name}
						onSelect={() => setFilters({ branchScope: b.name })}
					/>
				))}
			</Section>
		</div>
	);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<div className="mb-3">
			<div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
				{title}
			</div>
			<div className="space-y-0.5">{children}</div>
		</div>
	);
}

function BranchItem({
	name,
	selected,
	onSelect,
	bold,
}: {
	name: string;
	value: string;
	selected: boolean;
	onSelect: () => void;
	bold?: boolean;
}) {
	return (
		<button
			type="button"
			className={`block w-full truncate rounded px-2 py-1 text-left hover:bg-[var(--color-hover)] ${selected ? 'bg-[var(--color-selected)] text-[var(--color-selected-fg)]' : ''} ${bold ? 'font-semibold' : ''}`}
			onClick={onSelect}
			title={name}
		>
			{name}
		</button>
	);
}
