import { useEffect, useState } from 'react';

import type { InteractiveRebaseCommitDto } from '../shared/types';
import { useInteractiveRebaseStore } from './store';

type RebaseAction = InteractiveRebaseCommitDto['action'];

interface FriendlyAction {
	action: RebaseAction;
	label: string;
	icon: string;
	help: string;
	/** Tailwind classes for the active (selected) state. */
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
		return (
			<div className="flex h-full items-center justify-center text-[var(--color-muted)]">
				Loading your changes…
			</div>
		);
	}

	// "Combine" (fixup/squash) folds into the change above, so it doesn't add
	// a separate result; "Delete" (drop) removes it entirely.
	const keptCount = commits.filter(
		(c) => c.action !== 'drop' && c.action !== 'fixup' && c.action !== 'squash',
	).length;

	return (
		<div className="flex h-full flex-col">
			<header className="flex flex-col gap-1 border-b border-[var(--color-border)] px-4 py-3">
				<h1 className="flex items-center gap-2 text-base font-semibold">
					<span aria-hidden>🧹</span> Tidy up my changes
				</h1>
				<p className="text-xs text-[var(--color-muted)]">
					Each box below is something you saved on{' '}
					<strong className="text-[var(--color-app-fg)]">{currentBranch || 'your branch'}</strong>.
					Choose what to do with each one. Drag a box (or use the arrows) to change the
					order.
				</p>
			</header>

			{error && (
				<div className="border-b border-[var(--color-border)] bg-[var(--color-error)]/10 px-4 py-2 text-xs text-[var(--color-error)]">
					⚠️ {error}
				</div>
			)}

			<div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
				{commits.map((commit, index) => {
					const isSelected = selectedIndex === index;
					const isDropped = commit.action === 'drop';
					const chosen = ACTIONS.find((a) => a.action === commit.action) ?? ACTIONS[0]!;
					const isDragOver = dragOverIndex === index && dragIndex !== index;
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
									{commit.action === 'reword' ? (
										<input
											autoFocus
											className="w-full rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 py-1.5 text-sm"
											value={commit.message}
											onChange={(e) => setMessage(index, e.target.value)}
											onClick={(e) => e.stopPropagation()}
											placeholder="Type a new description…"
										/>
									) : (
										<p
											className={`truncate text-sm font-medium ${isDropped ? 'line-through' : ''}`}
											title={commit.message}
										>
											{commit.message}
										</p>
									)}
									<p className="mt-0.5 text-[11px] text-[var(--color-muted)]">
										{chosen.icon} {chosen.help}
									</p>
								</div>

								{/* Reorder arrows */}
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

							{/* Friendly action chooser */}
							<div className="mt-3 grid grid-cols-4 gap-1.5">
								{ACTIONS.map((a) => {
									const isActive = commit.action === a.action;
									// "Combine" needs a box above it to merge into.
									const disabled = a.action === 'fixup' && index === 0;
									return (
										<button
											key={a.action}
											type="button"
											disabled={disabled}
											title={disabled ? 'Nothing above to combine with' : a.help}
											className={`flex flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 text-[11px] font-medium transition disabled:opacity-30 ${
												isActive
													? a.active
													: 'border-[var(--color-border)] hover:bg-[var(--color-hover)]'
											}`}
											onClick={(e) => {
												e.stopPropagation();
												setAction(index, a.action);
											}}
										>
											<span aria-hidden className="text-sm">{a.icon}</span>
											{a.label}
										</button>
									);
								})}
							</div>
						</div>
					);
				})}
			</div>

			<footer className="flex flex-col gap-2 border-t border-[var(--color-border)] px-4 py-3">
				<p className="text-center text-xs text-[var(--color-muted)]">
					You’ll end up with <strong className="text-[var(--color-app-fg)]">{keptCount}</strong>{' '}
					change{keptCount === 1 ? '' : 's'} when you’re done.
				</p>
				<button
					type="button"
					className="w-full rounded-xl bg-[var(--color-accent)] px-4 py-3 text-base font-semibold text-white disabled:opacity-40"
					disabled={rebasing || commits.length === 0}
					onClick={() => void startRebase()}
				>
					{rebasing ? 'Working on it…' : '🎉 All done — apply my changes'}
				</button>
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
			className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--color-border)] text-xs hover:bg-[var(--color-hover)] disabled:opacity-30"
			onClick={onClick}
		>
			{glyph}
		</button>
	);
}
