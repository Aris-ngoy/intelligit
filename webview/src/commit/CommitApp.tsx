import { type ReactNode, useEffect, useRef } from "react";
import { fileStatusTone, statusLabel } from "../shared/format";
import { GitCommitIcon, PencilIcon, PlusIcon } from "../shared/icons";
import {
	EmptyState,
	ErrorStrip,
	InfoStrip,
	LoadingState,
	PrimaryButton,
	ReassuranceLine,
	SecondaryButton,
	SegmentedActionButton,
	StatusBadge,
	TaskFooter,
	TaskHeader,
} from "../shared/ui";
import { useCommitStore } from "./store";

const APPEND_SNIPPETS = [
	{ label: "Co-authored-by", text: "Co-authored-by: Name <email@example.com>" },
	{ label: "Fixes issue", text: "Fixes #" },
	{ label: "See also", text: "See also: " },
] as const;

export function CommitApp() {
	const loading = useCommitStore((s) => s.loading);
	const error = useCommitStore((s) => s.error);
	const status = useCommitStore((s) => s.status);
	const message = useCommitStore((s) => s.message);
	const mode = useCommitStore((s) => s.mode);
	const busy = useCommitStore((s) => s.busy);
	const load = useCommitStore((s) => s.load);
	const setMessage = useCommitStore((s) => s.setMessage);
	const setMode = useCommitStore((s) => s.setMode);
	const appendText = useCommitStore((s) => s.appendText);
	const replaceWithLastMessage = useCommitStore(
		(s) => s.replaceWithLastMessage,
	);
	const appendLastMessage = useCommitStore((s) => s.appendLastMessage);
	const commit = useCommitStore((s) => s.commit);

	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		void load();
	}, [load]);

	const canCommit =
		message.trim().length > 0 &&
		(mode === "amend" ? status?.canAmend : status?.hasStagedChanges) &&
		!busy;

	if (loading && !status) {
		return <LoadingState message="Loading staged changes…" />;
	}

	if (!status) {
		return (
			<EmptyState
				title="No Git repository"
				description="Open a folder with a Git repository to commit changes."
			/>
		);
	}

	const commitLabel =
		mode === "amend"
			? busy
				? "Updating…"
				: "Update last commit"
			: busy
				? "Saving…"
				: "Save changes";

	return (
		<div className="flex h-full flex-col">
			<TaskHeader
				icon={<GitCommitIcon size={18} />}
				title="Describe your changes"
				description="Write a message for what's staged. You can save a new commit or update the last one."
			/>

			{mode === "new" && !status.hasStagedChanges && (
				<InfoStrip>
					Nothing staged yet — stage files in Source Control, then come back
					here.
				</InfoStrip>
			)}

			{mode === "amend" && status.lastCommitLikelyPushed && (
				<InfoStrip>
					The last commit may already be on the remote. Updating it rewrites
					history.
				</InfoStrip>
			)}

			{error && <ErrorStrip>{error}</ErrorStrip>}

			<div className="min-h-0 flex-1 overflow-y-auto p-4">
				<div className="mb-3 flex flex-wrap items-center gap-2">
					<span className="text-[11px] font-medium text-[var(--color-muted)]">
						{status.branch}
					</span>
					{status.lastCommitHash && (
						<span className="font-mono text-[10px] text-[var(--color-muted)]">
							HEAD {status.lastCommitHash.slice(0, 7)}
						</span>
					)}
				</div>

				<div className="mb-4 grid grid-cols-2 gap-2">
					<SegmentedActionButton
						icon={<GitCommitIcon size={16} />}
						label="New commit"
						active={mode === "new"}
						activeClass="border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
						disabled={busy}
						onClick={() => setMode("new")}
					/>
					<SegmentedActionButton
						icon={<PencilIcon size={16} />}
						label="Amend last"
						active={mode === "amend"}
						activeClass="border-orange-500/60 bg-orange-500/15 text-orange-300"
						disabled={busy || !status.canAmend}
						title={
							status.canAmend
								? "Replace or extend the last commit message"
								: "No commits to amend yet"
						}
						onClick={() => setMode("amend")}
					/>
				</div>

				<label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
					Commit message
				</label>
				<textarea
					ref={textareaRef}
					value={message}
					onChange={(event) => setMessage(event.target.value)}
					placeholder={
						mode === "amend"
							? "Edit the last commit message…"
							: "Short summary on the first line, details below…"
					}
					rows={8}
					disabled={busy}
					className="mb-3 w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)] px-3 py-2.5 font-mono text-xs leading-relaxed outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 disabled:opacity-60"
				/>

				<div className="mb-4 flex flex-wrap gap-1.5">
					{status.lastCommitMessage && (
						<>
							<MessageActionButton
								disabled={busy}
								onClick={replaceWithLastMessage}
							>
								Use last message
							</MessageActionButton>
							<MessageActionButton disabled={busy} onClick={appendLastMessage}>
								Append last message
							</MessageActionButton>
						</>
					)}
					{APPEND_SNIPPETS.map((snippet) => (
						<MessageActionButton
							key={snippet.label}
							disabled={busy}
							onClick={() => appendText(snippet.text)}
						>
							<span className="inline-flex items-center gap-1">
								<PlusIcon size={12} />
								{snippet.label}
							</span>
						</MessageActionButton>
					))}
				</div>

				<section>
					<h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
						Staged ({status.staged.length})
					</h2>
					{status.staged.length === 0 ? (
						<p className="rounded-lg border border-dashed border-[var(--color-border)] px-3 py-4 text-center text-xs text-[var(--color-muted)]">
							No staged files. Stage changes in the Source Control view.
						</p>
					) : (
						<ul className="space-y-1">
							{status.staged.map((file) => (
								<li
									key={`${file.status}:${file.path}`}
									className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-input-bg)]/20 px-2.5 py-1.5"
								>
									<StatusBadge
										tone={fileStatusTone(file.status)}
										label={statusLabel(file.status)}
									/>
									<span
										className="min-w-0 truncate font-mono text-[11px]"
										title={file.path}
									>
										{file.path}
									</span>
								</li>
							))}
						</ul>
					)}
				</section>

				{status.unstaged.length > 0 && (
					<section className="mt-4">
						<h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
							Not staged ({status.unstaged.length})
						</h2>
						<ul className="space-y-1 opacity-80">
							{status.unstaged.slice(0, 8).map((file) => (
								<li
									key={`unstaged:${file.status}:${file.path}`}
									className="flex items-center gap-2 rounded-lg px-2.5 py-1"
								>
									<StatusBadge
										tone={fileStatusTone(file.status)}
										label={statusLabel(file.status)}
									/>
									<span
										className="min-w-0 truncate font-mono text-[11px] text-[var(--color-muted)]"
										title={file.path}
									>
										{file.path}
									</span>
								</li>
							))}
							{status.unstaged.length > 8 && (
								<li className="px-2.5 text-[10px] text-[var(--color-muted)]">
									+{status.unstaged.length - 8} more unstaged files
								</li>
							)}
						</ul>
					</section>
				)}
			</div>

			<TaskFooter
				summary={<ReassuranceLine />}
				left={
					<SecondaryButton
						disabled={busy || loading}
						onClick={() => void load()}
					>
						Refresh
					</SecondaryButton>
				}
				right={
					<PrimaryButton
						className="!w-auto px-5"
						disabled={!canCommit}
						onClick={() => void commit()}
					>
						{commitLabel}
					</PrimaryButton>
				}
			/>
		</div>
	);
}

function MessageActionButton({
	children,
	disabled,
	onClick,
}: {
	children: ReactNode;
	disabled?: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-[10px] font-medium transition hover:bg-[var(--color-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 disabled:opacity-40"
		>
			{children}
		</button>
	);
}
