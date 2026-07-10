import type { ReactNode } from "react";

import {
	AlertTriangleIcon,
	ArchiveIcon,
	BookmarkIcon,
	BrushIcon,
	CherryIcon,
	ClipboardIcon,
	GitBranchIcon,
	TagIcon,
	UndoIcon,
} from "../shared/icons";
import { useGitLogStore } from "../shared/store";

const MENU_GROUPS: Array<
	Array<{ id: string; label: string; icon: ReactNode; disabled?: boolean }>
> = [
	[
		{
			id: "interactiveRebase",
			label: "Tidy up from here…",
			icon: <BrushIcon size={14} />,
		},
		{
			id: "rebase",
			label: "Move my work from here…",
			icon: <ArchiveIcon size={14} />,
		},
		{ id: "cherryPick", label: "Cherry-pick", icon: <CherryIcon size={14} /> },
		{
			id: "checkout",
			label: "Check out this version",
			icon: <BookmarkIcon size={14} />,
		},
	],
	[
		{
			id: "copyHash",
			label: "Copy commit hash",
			icon: <ClipboardIcon size={14} />,
		},
		{
			id: "newTag",
			label: "New tag…",
			icon: <TagIcon size={14} />,
			disabled: true,
		},
		{
			id: "newBranch",
			label: "New branch…",
			icon: <GitBranchIcon size={14} />,
			disabled: true,
		},
	],
	[
		{
			id: "resetSoft",
			label: "Reset branch here (keep changes)",
			icon: <UndoIcon size={14} />,
			disabled: true,
		},
		{
			id: "resetMixed",
			label: "Reset branch here (unstage)",
			icon: <UndoIcon size={14} />,
			disabled: true,
		},
		{
			id: "resetHard",
			label: "Reset branch here (discard)",
			icon: <AlertTriangleIcon size={14} />,
			disabled: true,
		},
	],
];

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
				<div key={group[0]?.id ?? group.map((item) => item.id).join("-")}>
					{groupIndex > 0 && (
						<div
							className="my-1 border-t border-[var(--color-border)]/60"
							role="separator"
						/>
					)}
					{group.map((item) => (
						<button
							key={item.id}
							type="button"
							disabled={item.disabled}
							className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition hover:bg-[var(--color-hover)] focus:bg-[var(--color-hover)] focus:outline-none disabled:cursor-default disabled:opacity-40"
							onClick={() => void runContextAction(item.id)}
							role="menuitem"
						>
							<span
								aria-hidden
								className="flex w-4 shrink-0 items-center justify-center text-[var(--color-muted)]"
							>
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
