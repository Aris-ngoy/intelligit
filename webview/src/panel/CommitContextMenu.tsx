import { useGitLogStore } from '../shared/store';

const MENU_ITEMS = [
	{ id: 'interactiveRebase', label: 'Interactively Rebase from Here…' },
	{ id: 'cherryPick', label: 'Cherry-Pick' },
	{ id: 'checkout', label: 'Checkout Revision' },
	{ id: 'newTag', label: 'New Tag…', disabled: true },
	{ id: 'newBranch', label: 'New Branch…', disabled: true },
	{ id: 'resetSoft', label: 'Reset Current Branch to Here (Soft)…', disabled: true },
	{ id: 'resetMixed', label: 'Reset Current Branch to Here (Mixed)…', disabled: true },
	{ id: 'resetHard', label: 'Reset Current Branch to Here (Hard)…', disabled: true },
] as const;

export function CommitContextMenu() {
	const contextMenu = useGitLogStore((s) => s.contextMenu);
	const runContextAction = useGitLogStore((s) => s.runContextAction);

	if (!contextMenu) {
		return null;
	}

	return (
		<div
			className="fixed z-50 min-w-[240px] rounded border border-[var(--color-border)] bg-[var(--color-input-bg)] py-1 shadow-lg"
			style={{ left: contextMenu.x, top: contextMenu.y }}
			onClick={(e) => e.stopPropagation()}
			onKeyDown={(e) => e.stopPropagation()}
			role="menu"
		>
			{MENU_ITEMS.map((item) => (
				<button
					key={item.id}
					type="button"
					disabled={'disabled' in item && item.disabled}
					className="block w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--color-hover)] disabled:cursor-default disabled:opacity-40"
					onClick={() => void runContextAction(item.id)}
					role="menuitem"
				>
					{item.label}
				</button>
			))}
		</div>
	);
}
