import { type ReactNode, StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { CommitApp } from "./commit/CommitApp";
import { ConflictsApp } from "./conflicts/ConflictsApp";
import { InteractiveRebaseApp } from "./interactive/InteractiveRebaseApp";
import { MergeEditorApp } from "./merge/MergeEditorApp";
import { GitLogApp } from "./panel/GitLogApp";
import { SidebarHub } from "./panel/SidebarHub";
import {
	previewInteractiveCommits,
	previewMergeFile,
} from "./preview/mockData";
import { getPreviewScreen } from "./preview/previewBridge";
import { RebaseDialogApp } from "./rebase/RebaseDialogApp";
import { StashApp } from "./stash/StashApp";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
	throw new Error("Root element not found");
}

const preview = getPreviewScreen();
const mode = (
	preview
		? preview === "gitlog"
			? "panel"
			: preview === "rebase"
				? "rebaseDialog"
				: preview === "tidy"
					? "interactiveRebase"
					: preview
		: (rootEl.dataset.mode ?? "panel")
) as
	| "panel"
	| "sidebar"
	| "interactiveRebase"
	| "rebaseDialog"
	| "conflicts"
	| "merge"
	| "stash"
	| "commit";

const fromHash =
	rootEl.dataset.fromHash ?? previewInteractiveCommits[0]?.hash ?? "";
const rebaseFromHash = rootEl.dataset.rebaseFromHash ?? "";
const file =
	rootEl.dataset.file ?? (preview === "merge" ? previewMergeFile : "");

function renderApp(): ReactNode {
	switch (mode) {
		case "interactiveRebase":
			return <InteractiveRebaseApp initialFromHash={fromHash} />;
		case "rebaseDialog":
			return <RebaseDialogApp initialFromHash={rebaseFromHash} />;
		case "conflicts":
			return <ConflictsApp />;
		case "stash":
			return <StashApp />;
		case "commit":
			return <CommitApp />;
		case "merge":
			return <MergeEditorApp filePath={file} />;
		case "sidebar":
			return <SidebarHub />;
		default:
			return <GitLogApp />;
	}
}

createRoot(rootEl).render(<StrictMode>{renderApp()}</StrictMode>);
