import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

import { ConflictsApp } from './conflicts/ConflictsApp';
import { InteractiveRebaseApp } from './interactive/InteractiveRebaseApp';
import { MergeEditorApp } from './merge/MergeEditorApp';
import { GitLogApp } from './panel/GitLogApp';
import { RebaseDialogApp } from './rebase/RebaseDialogApp';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
	throw new Error('Root element not found');
}

const mode = (rootEl.dataset.mode ?? 'panel') as
	| 'panel'
	| 'interactiveRebase'
	| 'rebaseDialog'
	| 'conflicts'
	| 'merge';
const fromHash = rootEl.dataset.fromHash ?? '';
const file = rootEl.dataset.file ?? '';

function renderApp(): ReactNode {
	switch (mode) {
		case 'interactiveRebase':
			return <InteractiveRebaseApp initialFromHash={fromHash} />;
		case 'rebaseDialog':
			return <RebaseDialogApp />;
		case 'conflicts':
			return <ConflictsApp />;
		case 'merge':
			return <MergeEditorApp filePath={file} />;
		default:
			return <GitLogApp />;
	}
}

createRoot(rootEl).render(<StrictMode>{renderApp()}</StrictMode>);
