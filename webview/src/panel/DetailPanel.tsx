import { useState } from 'react';

import {
	fileStatusTone,
	formatCommitDate,
	refChipVariant,
	refDisplayLabel,
	statusLabel,
} from '../shared/format';
import { useGitLogStore } from '../shared/store';
import { AuthorAvatar, Chip, EmptyState, IconButton, StatusBadge } from '../shared/ui';

export function DetailPanel() {
	const commits = useGitLogStore((s) => s.commits);
	const selectedHash = useGitLogStore((s) => s.selectedHash);
	const commitFiles = useGitLogStore((s) => s.commitFiles);
	const openDiffEditor = useGitLogStore((s) => s.openDiffEditor);
	const revertCommit = useGitLogStore((s) => s.revertCommit);
	const copyHash = useGitLogStore((s) => s.copyHash);
	const [reverting, setReverting] = useState(false);

	const commit = commits.find((c) => c.hash === selectedHash);

	if (!commit) {
		return (
			<EmptyState
				title="Select a commit to view details"
				description="Click any row in the list to see its message, author, and changed files."
			/>
		);
	}

	return (
		<div className="flex h-full flex-col overflow-hidden border-l border-[var(--color-border)]">
			<div className="min-h-0 flex-1 overflow-y-auto p-4">
				<div className="mb-1 flex items-center gap-1">
					<span className="font-mono text-[11px] text-[var(--color-muted)]">
						{commit.shortHash}
					</span>
					<IconButton label="Copy hash" onClick={() => void copyHash(commit.hash)}>
						<CopyIcon />
					</IconButton>
				</div>

				<h2 className="mb-3 text-base font-semibold leading-snug">{commit.subject}</h2>

				<div className="mb-4 flex items-start gap-3 rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-input-bg)]/30 p-3">
					<AuthorAvatar name={commit.author} />
					<div className="min-w-0">
						<div className="text-sm font-medium">{commit.author}</div>
						<div className="text-[11px] text-[var(--color-muted)]">
							{formatCommitDate(commit.timestamp)}
						</div>
						<div className="truncate text-[11px] text-[var(--color-muted)]">
							{commit.authorEmail}
						</div>
					</div>
				</div>

				{commit.body && (
					<pre className="mb-4 whitespace-pre-wrap text-xs leading-relaxed text-[var(--color-muted)]">
						{commit.body}
					</pre>
				)}

				{commit.refs.length > 0 && (
					<div className="mb-4 flex flex-wrap gap-1">
						{commit.refs.map((ref) => (
							<Chip key={ref} variant={refChipVariant(ref)}>
								{refDisplayLabel(ref)}
							</Chip>
						))}
					</div>
				)}

				<div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
					Changed files ({commitFiles.length})
				</div>

				{commitFiles.length === 0 ? (
					<p className="text-xs text-[var(--color-muted)]">No file changes in this commit.</p>
				) : (
					<ul className="space-y-1">
						{commitFiles.map((file) => {
							const tone = fileStatusTone(file.status);
							const deleted = tone === 'deleted';
							return (
								<li key={`${file.status}-${file.path}`}>
									<button
										type="button"
										className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left transition hover:bg-[var(--color-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
										onClick={() => void openDiffEditor(commit.hash, file.path)}
									>
										<FileIcon />
										<span
											className={`min-w-0 flex-1 truncate font-mono text-xs ${deleted ? 'text-[var(--color-muted)] line-through' : ''}`}
										>
											{file.path}
										</span>
										<StatusBadge tone={tone} label={statusLabel(file.status)} />
									</button>
								</li>
							);
						})}
					</ul>
				)}
			</div>

			<div className="shrink-0 border-t border-[var(--color-border)] p-4">
				<button
					type="button"
					className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
					disabled={reverting}
					onClick={async () => {
						setReverting(true);
						try {
							await revertCommit(commit.hash);
						} finally {
							setReverting(false);
						}
					}}
				>
					{reverting ? 'Reverting…' : 'Revert this commit'}
				</button>
			</div>
		</div>
	);
}

function CopyIcon() {
	return (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
			<rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
			<path
				d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
				stroke="currentColor"
				strokeWidth="2"
			/>
		</svg>
	);
}

function FileIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			className="shrink-0 text-[var(--color-muted)]"
			aria-hidden
		>
			<path
				d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinejoin="round"
			/>
			<path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
		</svg>
	);
}
