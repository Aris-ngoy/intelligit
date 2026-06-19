import { useEffect, useState } from 'react';

import { formatRelativeDate } from '../shared/format';
import type { InteractiveRebaseCommitDto } from '../shared/types';
import {
	ErrorStrip,
	LoadingState,
	PrimaryButton,
	ReassuranceLine,
	SegmentedActionButton,
	TaskHeader,
} from '../shared/ui';
import { useInteractiveRebaseStore } from './store';

type RebaseAction = InteractiveRebaseCommitDto['action'];

interface FriendlyAction {
	action: RebaseAction;
	label: string;
	icon: string;
	help: string;
	active: string;
}

const ACTIONS: FriendlyAction[] = [
	{
		action: 'pick',
		label: 'Keep',
		icon: '✅',
		help: 'Leave this change exactly as it is.',
		active: 'bg-green-600 text-white border-green-600',
	},
	{
		action: 'reword',
		label: 'Rename',
		icon: '✏️',
		help: 'Keep the change but give it a new description.',
		active: 'bg-blue-600 text-white border-blue-600',
	},
	{
		action: 'fixup',
		label: 'Combine',
		icon: '🔗',
		help: 'Glue this into the box above it, like they were always one.',
		active: 'bg-purple-600 text-white border-purple-600',
	},
	{
		action: 'drop',
		label: 'Delete',
		icon: '🗑️',
		help: 'Throw this change away completely.',
		active: 'bg-red-600 text-white border-red-600',
	},
];

interface InteractiveRebaseAppProps {
	initialFromHash: string;
}

function combineTargetMessage(
	commits: InteractiveRebaseCommitDto[],
	index: number,
): string | null {
	if (index === 0) {
		return null;
	}
	const commit = commits[index];
	if (!commit || (commit.action !== 'fixup' && commit.action !== 'squash')) {
		return null;
	}
	for (let i = index - 1; i >= 0; i--) {
		const prev = commits[i];
		if (prev && prev.action !== 'drop') {
			return prev.message;
		}
	}
	return null;
}

export function InteractiveRebaseApp({ initialFromHash }: InteractiveRebaseAppProps) {
	const loading = useInteractiveRebaseStore((s) => s.loading);
	const error = useInteractiveRebaseStore((s) => s.error);
	const commits = useInteractiveRebaseStore((s) => s.commits);
	const currentBranch = useInteractiveRebaseStore((s) => s.currentBranch);
	const rebasing = useInteractiveRebaseStore((s) => s.rebasing);
	const init = useInteractiveRebaseStore((s) => s.init);
	const setAction = useInteractiveRebaseStore((s) => s.setAction);
	const setMessage = useInteractiveRebaseStore((s) => s.setMessage);
	const moveUp = useInteractiveRebaseStore((s) => s.moveUp);
	const moveDown = useInteractiveRebaseStore((s) => s.moveDown);
	const reorder = useInteractiveRebaseStore((s) => s.reorder);
	const startRebase = useInteractiveRebaseStore((s) => s.startRebase);

	const [selectedIndex, setSelectedIndex] = useState(0);
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

	useEffect(() => {
		if (initialFromHash) {
			void init(initialFromHash);
		}
	}, [initialFromHash, init]);

	if (loading) {
		return <LoadingState message="Loading your changes…" />;
	}

	const keptCount = commits.filter(
		(c) => c.action !== 'drop' && c.action !== 'fixup' && c.action !== 'squash',
	).length;

	return (
		<div className="flex h-full flex-col">
			{currentBranch && (
				<div className="flex shrink-0 items-center gap-2 border-b border-[var(--color-border)] px-4 py-2 text-xs">
					<span className="rounded-full border border-[var(--color-border)] bg-[var(--color-input-bg)] px-2.5 py-0.5 font-mono">
						{currentBranch}
					</span>
					{rebasing && (
						<span className="italic text-[var(--color-muted)]">Working on it…</span>
					)}
				</div>
			)}

			<TaskHeader
				icon="🧹"
				title="Tidy up my changes"
				description={`Each box below is something you saved on ${currentBranch || 'your branch'}. Choose what to do with each one. Drag a box (or use the arrows) to change the order.`}
			/>

			{error && <ErrorStrip>{error}</ErrorStrip>}

			<div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
				{commits.map((commit, index) => {
					const isSelected = selectedIndex === index;
					const isDropped = commit.action === 'drop';
					const isWip = /^wip:/i.test(commit.message.trim());
					const chosen = ACTIONS.find((a) => a.action === commit.action) ?? ACTIONS[0]!;
					const isDragOver = dragOverIndex === index && dragIndex !== index;
					const combineTarget = combineTargetMessage(commits, index);

					return (
						<div
							key={commit.hash}
							className={`rounded-xl border p-3 transition ${
								isSelected
									? 'border-[var(--color-accent)] bg-[var(--color-input-bg)]/60'
									: 'border-[var(--color-border)] bg-[var(--color-input-bg)]/20'
							} ${isDropped ? 'opacity-50' : ''} ${
								isDragOver ? 'ring-2 ring-[var(--color-accent)]' : ''
							} ${dragIndex === index ? 'opacity-40' : ''}`}
							onClick={() => setSelectedIndex(index)}
							onDragOver={(e) => {
								if (dragIndex !== null) {
									e.preventDefault();
									setDragOverIndex(index);
								}
							}}
							onDrop={(e) => {
								e.preventDefault();
								if (dragIndex !== null && dragIndex !== index) {
									reorder(dragIndex, index);
									setSelectedIndex(index);
								}
								setDragIndex(null);
								setDragOverIndex(null);
							}}
						>
							<div className="flex items-start gap-2">
								<span
									draggable
									role="button"
									aria-label="Drag to reorder"
									title="Drag to reorder"
									className="mt-0.5 cursor-grab select-none px-1 text-[var(--color-muted)] active:cursor-grabbing"
									onDragStart={() => {
										setDragIndex(index);
										setSelectedIndex(index);
									}}
									onDragEnd={() => {
										setDragIndex(null);
										setDragOverIndex(null);
									}}
									onClick={(e) => e.stopPropagation()}
								>
									⠿
								</span>
								<span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-border)] text-[11px] font-bold">
									{index + 1}
								</span>

								<div className="min-w-0 flex-1">
									<div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] text-[var(--color-muted)]">
										<span className="font-mono">{commit.shortHash}</span>
										{commit.timestamp !== undefined && (
											<span>{formatRelativeDate(commit.timestamp)}</span>
										)}
									</div>

									{commit.action === 'reword' ? (
										<input
											autoFocus
											className="w-full rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
											value={commit.message}
											onChange={(e) => setMessage(index, e.target.value)}
											onClick={(e) => e.stopPropagation()}
											placeholder="Type a new description…"
										/>
									) : (
										<p
											className={`truncate text-sm font-medium ${
												isDropped ? 'line-through' : ''
											} ${isWip ? 'italic text-[var(--color-muted)]' : ''}`}
											title={commit.message}
										>
											{commit.message}
										</p>
									)}

									{combineTarget ? (
										<p className="mt-1 text-[11px] italic text-purple-400">
											Will be squashed into: {combineTarget}
										</p>
									) : (
										<p className="mt-0.5 text-[11px] text-[var(--color-muted)]">
											{chosen.icon} {chosen.help}
										</p>
									)}
								</div>

								<div className="flex shrink-0 flex-col gap-1">
									<ArrowButton
										label="Move up"
										glyph="↑"
										disabled={index === 0}
										onClick={(e) => {
											e.stopPropagation();
											moveUp(index);
											setSelectedIndex(Math.max(0, index - 1));
										}}
									/>
									<ArrowButton
										label="Move down"
										glyph="↓"
										disabled={index === commits.length - 1}
										onClick={(e) => {
											e.stopPropagation();
											moveDown(index);
											setSelectedIndex(Math.min(commits.length - 1, index + 1));
										}}
									/>
								</div>
							</div>

							<div className="mt-3 grid grid-cols-4 gap-1.5">
								{ACTIONS.map((a) => {
									const isActive = commit.action === a.action;
									const disabled = a.action === 'fixup' && index === 0;
									return (
										<SegmentedActionButton
											key={a.action}
											icon={a.icon}
											label={a.label}
											active={isActive}
											activeClass={a.active}
											disabled={disabled}
											title={disabled ? 'Nothing above to combine with' : a.help}
											onClick={(e) => {
												e.stopPropagation();
												setAction(index, a.action);
											}}
										/>
									);
								})}
							</div>
						</div>
					);
				})}
			</div>

			<footer className="flex shrink-0 flex-col gap-2 border-t border-[var(--color-border)] px-4 py-3">
				<p className="text-center text-xs text-[var(--color-muted)]">
					You’ll end up with{' '}
					<strong className="text-[var(--color-app-fg)]">{keptCount}</strong> change
					{keptCount === 1 ? '' : 's'} when you’re done.
				</p>
				<PrimaryButton
					disabled={rebasing || commits.length === 0}
					onClick={() => void startRebase()}
				>
					{rebasing ? 'Working on it…' : '🎉 All done — apply my changes'}
				</PrimaryButton>
				<ReassuranceLine />
			</footer>
		</div>
	);
}

function ArrowButton({
	label,
	glyph,
	disabled,
	onClick,
}: {
	label: string;
	glyph: string;
	disabled: boolean;
	onClick: (e: React.MouseEvent) => void;
}) {
	return (
		<button
			type="button"
			aria-label={label}
			title={label}
			disabled={disabled}
			className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--color-border)] text-xs hover:bg-[var(--color-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 disabled:opacity-30"
			onClick={onClick}
		>
			{glyph}
		</button>
	);
}
