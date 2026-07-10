import { GitBranchPlusIcon } from "../shared/icons";
import { useGitLogStore } from "../shared/store";

export function ShowBranchPicker() {
	const repoInfo = useGitLogStore((s) => s.repoInfo);
	const filters = useGitLogStore((s) => s.filters);
	const addExtraBranch = useGitLogStore((s) => s.addExtraBranch);

	if (!repoInfo) {
		return null;
	}

	const included = new Set<string>([
		filters.branchScope === "current"
			? repoInfo.currentBranch
			: filters.branchScope,
		...(filters.additionalBranches ?? []),
	]);

	const available = repoInfo.branches.filter(
		(b) => !b.remote && !included.has(b.name),
	);

	if (available.length === 0) {
		return null;
	}

	return (
		<div className="border-t border-[var(--color-border)] p-2">
			<label className="mb-1 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
				<GitBranchPlusIcon size={12} />
				Show branch
			</label>
			<select
				className="w-full rounded-md border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 py-1.5 text-xs text-[var(--color-input-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
				defaultValue=""
				onChange={(e) => {
					const value = e.target.value;
					if (value) {
						addExtraBranch(value);
						e.target.value = "";
					}
				}}
				aria-label="Add branch to graph"
			>
				<option value="">+ Add branch lane…</option>
				{available.map((b) => (
					<option key={b.name} value={b.name}>
						{b.name}
					</option>
				))}
			</select>
		</div>
	);
}
