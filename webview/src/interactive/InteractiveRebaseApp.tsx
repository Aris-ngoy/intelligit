import { useEffect, useState } from 'react';

import { useInteractiveRebaseStore } from './store';

const ACTION_OPTIONS = [
	'pick',
	'reword',
	'edit',
	'squash',
	'fixup',
	'drop',
] as const;

const FLAG_OPTIONS = [
	{ id: '--no-verify', label: '--no-verify' },
	{ id: '--keep-empty', label: '--keep-empty' },
	{ id: '--autosquash', label: '--autosquash' },
	{ id: '--autostash', label: '--autostash' },
] as const;

interface InteractiveRebaseAppProps {
	initialFromHash: string;
}

export function InteractiveRebaseApp({ initialFromHash }: InteractiveRebaseAppProps) {
	const loading = useInteractiveRebaseStore((s) => s.loading);
	const error = useInteractiveRebaseStore((s) => s.error);
	const commits = useInteractiveRebaseStore((s) => s.commits);
	const currentBranch = useInteractiveRebaseStore((s) => s.currentBranch);
	const flags = useInteractiveRebaseStore((s) => s.flags);
	const rebasing = useInteractiveRebaseStore((s) => s.rebasing);
	const init = useInteractiveRebaseStore((s) => s.init);
	const setAction = useInteractiveRebaseStore((s) => s.setAction);
	const setMessage = useInteractiveRebaseStore((s) => s.setMessage);
	const moveUp = useInteractiveRebaseStore((s) => s.moveUp);
	const moveDown = useInteractiveRebaseStore((s) => s.moveDown);
	const applyToolbarAction = useInteractiveRebaseStore((s) => s.applyToolbarAction);
	const toggleFlag = useInteractiveRebaseStore((s) => s.toggleFlag);
	const startRebase = useInteractiveRebaseStore((s) => s.startRebase);

	const [selectedIndex, setSelectedIndex] = useState(0);

	useEffect(() => {
		if (initialFromHash) {
			void init(initialFromHash);
		}
	}, [initialFromHash, init]);

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center text-[var(--color-muted)]">
				Loading commits…
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-3 py-2">
				<span className="text-xs text-[var(--color-muted)]">
					Branch: <strong className="text-[var(--color-app-fg)]">{currentBranch}</strong>
				</span>
				<div className="ml-auto flex flex-wrap gap-1">
					<ToolbarButton label="Reword" onClick={() => applyToolbarAction('reword', selectedIndex)} />
					<ToolbarButton label="Squash" onClick={() => applyToolbarAction('squash', selectedIndex)} />
					<ToolbarButton label="Fixup" onClick={() => applyToolbarAction('fixup', selectedIndex)} />
					<ToolbarButton label="Drop" onClick={() => applyToolbarAction('drop', selectedIndex)} />
					<ToolbarButton label="↑" onClick={() => moveUp(selectedIndex)} />
					<ToolbarButton label="↓" onClick={() => moveDown(selectedIndex)} />
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] px-3 py-1.5 text-xs">
				<span className="text-[var(--color-muted)]">Modify options:</span>
				{FLAG_OPTIONS.map((f) => (
					<label key={f.id} className="flex items-center gap-1">
						<input
							type="checkbox"
							checked={flags.includes(f.id)}
							onChange={() => toggleFlag(f.id)}
						/>
						{f.label}
					</label>
				))}
			</div>

			{error && (
				<div className="border-b border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-error)]">
					{error}
				</div>
			)}

			<div className="min-h-0 flex-1 overflow-y-auto">
				<table className="w-full border-collapse text-xs">
					<thead className="sticky top-0 bg-[var(--color-app-bg)]">
						<tr className="border-b border-[var(--color-border)] text-[var(--color-muted)]">
							<th className="w-24 px-2 py-1 text-left">Action</th>
							<th className="w-20 px-2 py-1 text-left">Hash</th>
							<th className="px-2 py-1 text-left">Message</th>
							<th className="w-16 px-2 py-1" />
						</tr>
					</thead>
					<tbody>
						{commits.map((commit, index) => (
							<tr
								key={commit.hash}
								className={`border-b border-[var(--color-border)]/40 ${selectedIndex === index ? 'bg-[var(--color-selected)] text-[var(--color-selected-fg)]' : 'hover:bg-[var(--color-hover)]'} ${commit.action === 'drop' ? 'opacity-50 line-through' : ''}`}
								onClick={() => setSelectedIndex(index)}
							>
								<td className="px-2 py-1">
									<select
										className="w-full rounded border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-1 py-0.5 text-[var(--color-input-fg)]"
										value={commit.action}
										onChange={(e) =>
											setAction(index, e.target.value as typeof commit.action)
										}
										onClick={(e) => e.stopPropagation()}
									>
										{ACTION_OPTIONS.map((a) => (
											<option key={a} value={a}>
												{a}
											</option>
										))}
									</select>
								</td>
								<td className="px-2 py-1 font-mono">{commit.shortHash}</td>
								<td className="px-2 py-1">
									{commit.action === 'reword' ? (
										<input
											className="w-full rounded border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-1 py-0.5"
											value={commit.message}
											onChange={(e) => setMessage(index, e.target.value)}
											onClick={(e) => e.stopPropagation()}
										/>
									) : (
										commit.message
									)}
								</td>
								<td className="px-2 py-1 text-[var(--color-muted)]">{index + 1}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="flex justify-end gap-2 border-t border-[var(--color-border)] px-3 py-2">
				<button
					type="button"
					className="rounded bg-[var(--color-accent)] px-4 py-1.5 text-xs text-white disabled:opacity-40"
					disabled={rebasing || commits.length === 0}
					onClick={() => void startRebase()}
				>
					{rebasing ? 'Rebasing…' : 'Start Rebasing'}
				</button>
			</div>
		</div>
	);
}

function ToolbarButton({
	label,
	onClick,
}: {
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			className="rounded border border-[var(--color-border)] bg-[var(--color-input-bg)] px-2 py-0.5 text-xs hover:bg-[var(--color-hover)]"
			onClick={onClick}
		>
			{label}
		</button>
	);
}
