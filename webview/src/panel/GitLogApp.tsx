import { Allotment } from "allotment";
import { useEffect } from "react";
import { AlertTriangleIcon } from "../shared/icons";
import { useGitLogStore } from "../shared/store";
import { EmptyState } from "../shared/ui";
import { BranchTree } from "./BranchTree";
import { CommitContextMenu } from "./CommitContextMenu";
import { CommitTable } from "./CommitTable";
import { DetailPanel } from "./DetailPanel";
import { GitLogFooter } from "./GitLogFooter";
import { RebaseInProgressBanner } from "./RebaseInProgressBanner";
import { Toolbar } from "./Toolbar";

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
		window.addEventListener("click", onClick);
		return () => window.removeEventListener("click", onClick);
	}, [closeContextMenu]);

	if (error && commits.length === 0) {
		return (
			<EmptyState
				icon={<AlertTriangleIcon size={32} />}
				title="Couldn't load history"
				description={error}
			/>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<RebaseInProgressBanner />
			<Toolbar />
			<div className="min-h-0 flex-1">
				<Allotment defaultSizes={[18, 47, 35]}>
					<Allotment.Pane minSize={140} preferredSize="18%">
						<BranchTree />
					</Allotment.Pane>
					<Allotment.Pane minSize={280}>
						{loading && commits.length === 0 ? (
							<EmptyState
								title="Loading commit history…"
								description="Fetching branches and recent commits from your repository."
							/>
						) : (
							<CommitTable />
						)}
					</Allotment.Pane>
					<Allotment.Pane minSize={220} preferredSize="35%">
						<DetailPanel />
					</Allotment.Pane>
				</Allotment>
			</div>
			<GitLogFooter />
			<CommitContextMenu />
		</div>
	);
}
