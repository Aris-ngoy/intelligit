import type { ReactNode } from "react";

import { SettingsIcon } from "../shared/icons";
import { useGitLogStore } from "../shared/store";
import type { GitBranchDto } from "../shared/types";
import { SectionHeader } from "../shared/ui";
import { ShowBranchPicker } from "./ShowBranchPicker";

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
	const openExternal = useGitLogStore((s) => s.openExternal);

	if (!repoInfo) {
		return null;
	}

	const { current, local, remote } = groupBranches(repoInfo.branches);
	const selected = filters.branchScope;
	const currentBranch = repoInfo.currentBranch;

	return (
		<div className="flex h-full flex-col border-r border-[var(--color-border)] text-xs">
			<div className="flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-2.5">
				<span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-accent)] text-[10px] font-bold text-white">
					IG
				</span>
				<span className="font-semibold">IntelliGit</span>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto py-2">
				<Section title="Scope">
					<BranchItem
						name={`Current (${currentBranch})`}
						selected={selected === "current"}
						onSelect={() =>
							setFilters({ branchScope: "current", additionalBranches: [] })
						}
						current
					/>
					<BranchItem
						name="All History"
						selected={selected === "all"}
						onSelect={() =>
							setFilters({ branchScope: "all", additionalBranches: [] })
						}
					/>
				</Section>

				{current.length > 0 && (
					<Section title="Current">
						{current.map((b) => (
							<BranchItem
								key={b.name}
								name={b.name}
								selected={selected === b.name}
								onSelect={() =>
									setFilters({ branchScope: b.name, additionalBranches: [] })
								}
								current
							/>
						))}
					</Section>
				)}

				{local.length > 0 && (
					<Section title="Local">
						{local.map((b) => (
							<BranchItem
								key={b.name}
								name={b.name}
								selected={selected === b.name}
								onSelect={() =>
									setFilters({ branchScope: b.name, additionalBranches: [] })
								}
							/>
						))}
					</Section>
				)}

				{remote.length > 0 && (
					<Section title="Remote">
						{remote.map((b) => (
							<BranchItem
								key={b.name}
								name={b.name}
								selected={selected === b.name}
								onSelect={() =>
									setFilters({ branchScope: b.name, additionalBranches: [] })
								}
							/>
						))}
					</Section>
				)}
			</div>

			<ShowBranchPicker />

			<div className="border-t border-[var(--color-border)] p-2">
				<button
					type="button"
					className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[var(--color-muted)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-app-fg)]"
					onClick={() =>
						void openExternal("https://github.com/Aris-ngoy/intelligit#readme")
					}
				>
					<SettingsIcon size={14} />
					Settings
				</button>
			</div>
		</div>
	);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<div className="mb-3">
			<SectionHeader>{title}</SectionHeader>
			<div className="space-y-0.5 px-1">{children}</div>
		</div>
	);
}

function BranchItem({
	name,
	selected,
	onSelect,
	current,
}: {
	name: string;
	selected: boolean;
	onSelect: () => void;
	current?: boolean;
}) {
	return (
		<button
			type="button"
			className={`flex w-full items-center gap-2 truncate rounded-lg px-2 py-1.5 text-left transition focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 ${
				selected
					? "bg-[var(--color-selected)] font-medium text-[var(--color-selected-fg)]"
					: "hover:bg-[var(--color-hover)]"
			}`}
			onClick={onSelect}
			title={name}
		>
			{current && (
				<span
					className="h-2 w-2 shrink-0 rounded-full bg-green-500"
					aria-label="Current branch"
				/>
			)}
			<span className="min-w-0 truncate">{name}</span>
		</button>
	);
}
