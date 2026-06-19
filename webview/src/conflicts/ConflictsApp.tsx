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
				Looking for disagreements…
			</div>
		);
	}

	if (files.length === 0 && !loading) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
				<div className="text-4xl" aria-hidden>🎉</div>
				<p className="text-base font-semibold">All sorted!</p>
				<p className="max-w-xs text-sm text-[var(--color-muted)]">
					Every file agrees now. There’s nothing left to fix.
				</p>
				{operation?.isRebaseInProgress && (
					<button
						type="button"
						className="rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white"
						onClick={() => void continueOp()}
					>
						✅ Finish up
					</button>
				)}
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<header className="flex flex-col gap-1 border-b border-[var(--color-border)] px-4 py-3">
				<h1 className="flex items-center gap-2 text-base font-semibold">
					<span aria-hidden>🤝</span> Two versions don’t agree
				</h1>
				<p className="text-xs text-[var(--color-muted)]">
					The same thing was changed in two places. For each file, pick which version to
					keep — or open the side-by-side helper to mix them together.
				</p>
			</header>

			{operation && operation.type !== 'none' && operation.message && (
				<div className="border-b border-[var(--color-border)] bg-[var(--color-input-bg)]/40 px-4 py-2 text-xs text-[var(--color-muted)]">
					ℹ️ {operation.message}
				</div>
			)}

			{error && (
				<div className="border-b border-[var(--color-border)] bg-[var(--color-error)]/10 px-4 py-2 text-xs text-[var(--color-error)]">
					⚠️ {error}
				</div>
			)}

			<div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
				<p className="px-1 text-[11px] font-medium text-[var(--color-muted)]">
					{files.length} file{files.length === 1 ? '' : 's'} need your help
				</p>
				{files.map((file) => {
					const name = file.split('/').pop() ?? file;
					const folder = file.slice(0, file.length - name.length);
					return (
						<div
							key={file}
							className="rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)]/20 p-3"
						>
							<div className="mb-2 flex items-center gap-2">
								<span aria-hidden className="text-base">📄</span>
								<span className="min-w-0 flex-1 truncate font-mono text-xs" title={file}>
									{folder && <span className="text-[var(--color-muted)]">{folder}</span>}
									<span className="font-semibold">{name}</span>
								</span>
							</div>
							<div className="grid grid-cols-3 gap-1.5">
								<ChoiceButton
									icon="🙋"
									label="Keep mine"
									onClick={() => void acceptOurs(file)}
								/>
								<ChoiceButton
									icon="👥"
									label="Keep theirs"
									onClick={() => void acceptTheirs(file)}
								/>
								<ChoiceButton
									icon="🔍"
									label="Compare…"
									primary
									onClick={() => void openMerge(file)}
								/>
							</div>
						</div>
					);
				})}
			</div>

			<footer className="flex items-center gap-2 border-t border-[var(--color-border)] px-4 py-3">
				<button
					type="button"
					className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs hover:bg-[var(--color-hover)]"
					onClick={() => void abortOp()}
				>
					✖ Cancel everything
				</button>
				<button
					type="button"
					className="ml-auto rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
					disabled={files.length > 0}
					onClick={() => void continueOp()}
				>
					{files.length > 0
						? `Fix all ${files.length} first ☝️`
						: '✅ Finish up'}
				</button>
			</footer>
		</div>
	);
}

function ChoiceButton({
	icon,
	label,
	onClick,
	primary = false,
}: {
	icon: string;
	label: string;
	onClick: () => void;
	primary?: boolean;
}) {
	return (
		<button
			type="button"
			className={`flex flex-col items-center gap-0.5 rounded-lg border px-1 py-2 text-[11px] font-medium transition ${
				primary
					? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
					: 'border-[var(--color-border)] hover:bg-[var(--color-hover)]'
			}`}
			onClick={onClick}
		>
			<span aria-hidden className="text-sm">{icon}</span>
			{label}
		</button>
	);
}
