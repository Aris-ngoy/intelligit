import { useGitLogStore } from '../shared/store';
import { statusLabel } from '../shared/format';

export function DetailPanel() {
	const commits = useGitLogStore((s) => s.commits);
	const selectedHash = useGitLogStore((s) => s.selectedHash);
	const commitFiles = useGitLogStore((s) => s.commitFiles);
	const openDiffEditor = useGitLogStore((s) => s.openDiffEditor);

	const commit = commits.find((c) => c.hash === selectedHash);

	if (!commit) {
		return (
			<div className="flex h-full items-center justify-center p-4 text-[var(--color-muted)]">
				Select a commit to view details
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col overflow-hidden p-3">
			<div className="mb-3 shrink-0">
				<div className="mb-1 font-mono text-[11px] text-[var(--color-muted)]">
					{commit.shortHash}
				</div>
				<h2 className="text-sm font-semibold leading-snug">{commit.subject}</h2>
				{commit.body && (
					<pre className="mt-2 whitespace-pre-wrap text-xs text-[var(--color-muted)]">
						{commit.body}
					</pre>
				)}
				<div className="mt-2 text-[11px] text-[var(--color-muted)]">
					{commit.author} &lt;{commit.authorEmail}&gt;
				</div>
				{commit.refs.length > 0 && (
					<div className="mt-1 flex flex-wrap gap-1">
						{commit.refs.map((ref) => (
							<span
								key={ref}
								className="rounded bg-[var(--color-input-bg)] px-1.5 py-0.5 text-[10px]"
							>
								{ref}
							</span>
						))}
					</div>
				)}
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto border-t border-[var(--color-border)] pt-2">
				<div className="mb-1 text-[11px] font-medium text-[var(--color-muted)]">
					Changed files ({commitFiles.length})
				</div>
				<ul className="space-y-0.5">
					{commitFiles.map((file) => (
						<li key={`${file.status}-${file.path}`}>
							<button
								type="button"
								className="flex w-full items-start gap-2 rounded px-1 py-0.5 text-left text-xs hover:bg-[var(--color-hover)]"
								onClick={() => void openDiffEditor(commit.hash, file.path)}
							>
								<span className="w-14 shrink-0 text-[10px] text-[var(--color-muted)]">
									{statusLabel(file.status)}
								</span>
								<span className="min-w-0 break-all font-mono">{file.path}</span>
							</button>
						</li>
					))}
					{commitFiles.length === 0 && (
						<li className="text-xs text-[var(--color-muted)]">No file changes</li>
					)}
				</ul>
			</div>
		</div>
	);
}
