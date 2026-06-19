import { Allotment } from 'allotment';
import { useEffect } from 'react';

import { useGitLogStore } from '../shared/store';
import { BranchTree } from './BranchTree';
import { CommitContextMenu } from './CommitContextMenu';
import { CommitTable } from './CommitTable';
import { DetailPanel } from './DetailPanel';
import { Toolbar } from './Toolbar';

export function GitLogApp() {
	const loading = useGitLogStore((s) => s.loading);
	const error = useGitLogStore((s) => s.error);
	const commits = useGitLogStore((s) => s.commits);
	const fetchAll = useGitLogStore((s) => s.fetchAll);
	const closeContextMenu = useGitLogStore((s) => s.closeContextMenu);

	useEffect(() => {
		void fetchAll();
	}, [fetchAll]);

	useEffect(() => {
		const onClick = () => closeContextMenu();
		window.addEventListener('click', onClick);
		return () => window.removeEventListener('click', onClick);
	}, [closeContextMenu]);

	if (error && commits.length === 0) {
		return (
			<div className="flex h-full items-center justify-center p-4 text-[var(--color-error)]">
				{error}
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<Toolbar />
			<div className="min-h-0 flex-1">
				<Allotment defaultSizes={[15, 50, 35]}>
					<Allotment.Pane minSize={120} preferredSize="15%">
						<BranchTree />
					</Allotment.Pane>
					<Allotment.Pane minSize={280}>
						{loading && commits.length === 0 ? (
							<div className="flex h-full items-center justify-center text-[var(--color-muted)]">
								Loading commit history…
							</div>
						) : (
							<CommitTable />
						)}
					</Allotment.Pane>
					<Allotment.Pane minSize={200} preferredSize="30%">
						<DetailPanel />
					</Allotment.Pane>
				</Allotment>
			</div>
			<CommitContextMenu />
		</div>
	);
}
