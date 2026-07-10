import { type ReactNode, useEffect, useMemo } from "react";

import {
	ArchiveIcon,
	SearchIcon,
	SparklesIcon,
	TrashIcon,
	UndoIcon,
} from "../shared/icons";
import {
	EmptyState,
	ErrorStrip,
	LoadingState,
	PrimaryButton,
	SecondaryButton,
	TagBadge,
	TaskFooter,
	TaskHeader,
} from "../shared/ui";
import { filterStashes, useStashStore } from "./store";

function formatStashDate(timestamp?: number): string | undefined {
	if (!timestamp) {
		return undefined;
	}
	return new Date(timestamp * 1000).toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

export function StashApp() {
	const loading = useStashStore((s) => s.loading);
	const error = useStashStore((s) => s.error);
	const stashes = useStashStore((s) => s.stashes);
	const searchQuery = useStashStore((s) => s.searchQuery);
	const busyIndex = useStashStore((s) => s.busyIndex);
	const busyAction = useStashStore((s) => s.busyAction);
	const load = useStashStore((s) => s.load);
	const setSearchQuery = useStashStore((s) => s.setSearchQuery);
	const applyStash = useStashStore((s) => s.applyStash);
	const dropStash = useStashStore((s) => s.dropStash);
	const clearAll = useStashStore((s) => s.clearAll);

	useEffect(() => {
		void load();
	}, [load]);

	const filteredStashes = useMemo(
		() => filterStashes(stashes, searchQuery),
		[stashes, searchQuery],
	);

	if (loading && stashes.length === 0) {
		return <LoadingState message="Loading saved changes…" />;
	}

	return (
		<div className="flex h-full flex-col">
			<TaskHeader
				icon={<ArchiveIcon size={18} />}
				title="Saved changes"
				description="Stashes you set aside. Apply them back to your working tree or delete ones you no longer need."
			/>

			<div className="shrink-0 border-b border-[var(--color-border)] px-3 py-2">
				<label className="sr-only" htmlFor="stash-search">
					Search stashes
				</label>
				<input
					id="stash-search"
					type="search"
					placeholder="Search by message, branch, or hash…"
					value={searchQuery}
					onChange={(event) => setSearchQuery(event.target.value)}
					className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input-bg)] px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
				/>
			</div>

			{error && <ErrorStrip>{error}</ErrorStrip>}

			<div className="min-h-0 flex-1 overflow-y-auto p-3">
				{stashes.length === 0 ? (
					<EmptyState
						icon={<SparklesIcon size={32} />}
						title="No stashes yet"
						description="When you stash changes in Git, they’ll show up here so you can apply or delete them."
					/>
				) : filteredStashes.length === 0 ? (
					<EmptyState
						icon={<SearchIcon size={32} />}
						title="No matches"
						description={`Nothing matched “${searchQuery.trim()}”. Try a different search.`}
					/>
				) : (
					<>
						<p className="mb-2 px-1 text-[11px] font-medium text-[var(--color-muted)]">
							{filteredStashes.length} stash
							{filteredStashes.length === 1 ? "" : "es"}
							{searchQuery.trim() ? " matching search" : ""}
						</p>
						<div className="space-y-2">
							{filteredStashes.map((stash) => {
								const dateLabel = formatStashDate(stash.timestamp);
								const isBusy = busyIndex === stash.index;
								return (
									<div
										key={stash.ref}
										className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)]/20 p-3"
									>
										<span aria-hidden className="text-[var(--color-muted)]">
											<ArchiveIcon size={20} />
										</span>
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<span
													className="min-w-0 text-xs font-medium text-[var(--color-app-fg)]"
													title={stash.message}
												>
													{stash.message}
												</span>
												{stash.branch && (
													<TagBadge label={stash.branch} tone="info" />
												)}
											</div>
											<div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[var(--color-muted)]">
												<span>{stash.ref}</span>
												{stash.commitHash && (
													<span className="font-mono">
														{stash.commitHash.slice(0, 7)}
													</span>
												)}
												{dateLabel && <span>{dateLabel}</span>}
											</div>
										</div>
										<div className="flex shrink-0 flex-wrap items-center gap-1.5">
											<ChoiceButton
												icon={<UndoIcon size={14} />}
												label={
													isBusy && busyAction === "apply"
														? "Applying…"
														: "Apply"
												}
												primary
												disabled={busyAction !== null}
												onClick={() => void applyStash(stash.index)}
											/>
											<ChoiceButton
												icon={<TrashIcon size={14} />}
												label={
													isBusy && busyAction === "drop"
														? "Deleting…"
														: "Delete"
												}
												disabled={busyAction !== null}
												onClick={() => void dropStash(stash.index)}
											/>
										</div>
									</div>
								);
							})}
						</div>
					</>
				)}
			</div>

			<TaskFooter
				left={
					<SecondaryButton
						disabled={stashes.length === 0 || busyAction !== null}
						onClick={() => void clearAll()}
					>
						{busyAction === "clear" ? "Clearing…" : "Clear all stashes"}
					</SecondaryButton>
				}
				right={
					<PrimaryButton
						className="!w-auto px-5"
						disabled={loading || busyAction !== null}
						onClick={() => void load()}
					>
						Refresh
					</PrimaryButton>
				}
			/>
		</div>
	);
}

function ChoiceButton({
	icon,
	label,
	onClick,
	primary = false,
	disabled = false,
}: {
	icon: ReactNode;
	label: string;
	onClick: () => void;
	primary?: boolean;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 disabled:opacity-50 ${
				primary
					? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
					: "border-[var(--color-border)] hover:bg-[var(--color-hover)]"
			}`}
			onClick={onClick}
		>
			<span aria-hidden>{icon}</span>
			{label}
		</button>
	);
}
