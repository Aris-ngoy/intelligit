import { useEffect } from 'react';

import { useConflictsStore } from './store';

export function ConflictsApp() {
	const loading = useConflictsStore((s) => s.loading);
	const error = useConflictsStore((s) => s.error);
	const operation = useConflictsStore((s) => s.operation);
	const files = useConflictsStore((s) => s.files);
	const load = useConflictsStore((s) => s.load);
	const acceptOurs = useConflictsStore((s) => s.acceptOurs);
	const acceptTheirs = useConflictsStore((s) => s.acceptTheirs);
	const openMerge = useConflictsStore((s) => s.openMerge);
	const continueOp = useConflictsStore((s) => s.continueOperation);
	const abortOp = useConflictsStore((s) => s.abortOperation);

	useEffect(() => {
		void load();
	}, [load]);

	if (loading && files.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-[var(--color-muted)]">
				Loading conflicts…
			</div>
		);
	}

	if (files.length === 0 && !loading) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-[var(--color-muted)]">
				<p>No merge conflicts detected.</p>
				{operation?.isRebaseInProgress && (
					<button
						type="button"
						className="rounded bg-[var(--color-accent)] px-3 py-1 text-xs text-white"
						onClick={() => void continueOp()}
					>
						Continue Rebase
					</button>
				)}
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col p-3">
			{operation && operation.type !== 'none' && (
				<div className="mb-3 rounded border border-[var(--color-border)] bg-[var(--color-input-bg)] px-3 py-2 text-xs">
					{operation.message}
				</div>
			)}

			{error && <div className="mb-2 text-xs text-[var(--color-error)]">{error}</div>}

			<div className="mb-2 text-[11px] font-medium text-[var(--color-muted)]">
				Conflict files ({files.length})
			</div>

			<ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
				{files.map((file) => (
					<li
						key={file}
						className="flex items-center gap-2 rounded border border-[var(--color-border)]/50 px-2 py-2"
					>
						<span className="min-w-0 flex-1 truncate font-mono text-xs">{file}</span>
						<button
							type="button"
							className="shrink-0 rounded border border-[var(--color-border)] px-2 py-0.5 text-[10px] hover:bg-[var(--color-hover)]"
							onClick={() => void acceptOurs(file)}
						>
							Accept Yours
						</button>
						<button
							type="button"
							className="shrink-0 rounded border border-[var(--color-border)] px-2 py-0.5 text-[10px] hover:bg-[var(--color-hover)]"
							onClick={() => void acceptTheirs(file)}
						>
							Accept Theirs
						</button>
						<button
							type="button"
							className="shrink-0 rounded bg-[var(--color-accent)] px-2 py-0.5 text-[10px] text-white"
							onClick={() => void openMerge(file)}
						>
							Merge…
						</button>
					</li>
				))}
			</ul>

			<div className="mt-3 flex gap-2 border-t border-[var(--color-border)] pt-3">
				<button
					type="button"
					className="rounded border border-[var(--color-border)] px-3 py-1 text-xs hover:bg-[var(--color-hover)]"
					onClick={() => void abortOp()}
				>
					Abort
				</button>
				<button
					type="button"
					className="ml-auto rounded bg-[var(--color-accent)] px-4 py-1 text-xs text-white disabled:opacity-40"
					disabled={files.length > 0}
					onClick={() => void continueOp()}
				>
					{operation?.isRebaseInProgress ? 'Continue Rebase' : 'Continue Merge'}
				</button>
			</div>
		</div>
	);
}
