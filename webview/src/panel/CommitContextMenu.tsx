import { useGitLogStore } from '../shared/store';

const MENU_GROUPS = [
	[
		{ id: 'interactiveRebase', label: 'Tidy up from here…', icon: '🧹' },
		{ id: 'rebase', label: 'Move my work from here…', icon: '📦' },
		{ id: 'cherryPick', label: 'Cherry-pick', icon: '🍒' },
		{ id: 'checkout', label: 'Check out this version', icon: '🔖' },
	],
	[
		{ id: 'copyHash', label: 'Copy commit hash', icon: '📋' },
		{ id: 'newTag', label: 'New tag…', icon: '🏷️', disabled: true },
		{ id: 'newBranch', label: 'New branch…', icon: '🌿', disabled: true },
	],
	[
		{ id: 'resetSoft', label: 'Reset branch here (keep changes)', icon: '↩️', disabled: true },
		{ id: 'resetMixed', label: 'Reset branch here (unstage)', icon: '↩️', disabled: true },
		{ id: 'resetHard', label: 'Reset branch here (discard)', icon: '⚠️', disabled: true },
	],
] as const;

export function CommitContextMenu() {
	const contextMenu = useGitLogStore((s) => s.contextMenu);
	const runContextAction = useGitLogStore((s) => s.runContextAction);

	if (!contextMenu) {
		return null;
	}

	return (
		<div
			className="fixed z-50 min-w-[260px] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)] py-1 shadow-lg"
			style={{ left: contextMenu.x, top: contextMenu.y }}
			onClick={(e) => e.stopPropagation()}
			onKeyDown={(e) => e.stopPropagation()}
			role="menu"
		>
			{MENU_GROUPS.map((group, groupIndex) => (
				<div key={groupIndex}>
					{groupIndex > 0 && (
						<div className="my-1 border-t border-[var(--color-border)]/60" role="separator" />
					)}
					{group.map((item) => (
						<button
							key={item.id}
							type="button"
							disabled={'disabled' in item && item.disabled}
							className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition hover:bg-[var(--color-hover)] focus:bg-[var(--color-hover)] focus:outline-none disabled:cursor-default disabled:opacity-40"
							onClick={() => void runContextAction(item.id)}
							role="menuitem"
						>
							<span aria-hidden className="w-4 shrink-0 text-center text-sm">
								{item.icon}
							</span>
							{item.label}
						</button>
					))}
				</div>
			))}
		</div>
	);
}
