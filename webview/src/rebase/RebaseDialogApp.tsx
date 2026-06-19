import { useEffect } from 'react';

import { useRebaseDialogStore } from './store';

const FLAG_OPTIONS = [
	{ id: '--no-verify', label: '--no-verify' },
	{ id: '--keep-empty', label: '--keep-empty' },
	{ id: '--autosquash', label: '--autosquash' },
	{ id: '--autostash', label: '--autostash' },
] as const;

export function RebaseDialogApp() {
	const loading = useRebaseDialogStore((s) => s.loading);
	const error = useRebaseDialogStore((s) => s.error);
	const refs = useRebaseDialogStore((s) => s.refs);
	const currentBranch = useRebaseDialogStore((s) => s.currentBranch);
	const repoRoot = useRebaseDialogStore((s) => s.repoRoot);
	const onto = useRebaseDialogStore((s) => s.onto);
	const from = useRebaseDialogStore((s) => s.from);
	const flags = useRebaseDialogStore((s) => s.flags);
	const submitting = useRebaseDialogStore((s) => s.submitting);
	const load = useRebaseDialogStore((s) => s.load);
	const setOnto = useRebaseDialogStore((s) => s.setOnto);
	const setFrom = useRebaseDialogStore((s) => s.setFrom);
	const toggleFlag = useRebaseDialogStore((s) => s.toggleFlag);
	const submit = useRebaseDialogStore((s) => s.submit);

	useEffect(() => {
		void load();
	}, [load]);

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center p-6 text-[var(--color-muted)]">
				Loading…
			</div>
		);
	}

	return (
		<div className="mx-auto flex h-full max-w-lg flex-col gap-4 p-6">
			<h1 className="text-base font-semibold">Rebase</h1>

			<label className="flex flex-col gap-1 text-xs">
				<span className="text-[var(--color-muted)]">Git Root</span>
				<input
					className="rounded border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 py-1.5 text-[var(--color-input-fg)]"
					value={repoRoot}
					readOnly
				/>
			</label>

			<label className="flex flex-col gap-1 text-xs">
				<span className="text-[var(--color-muted)]">Current Branch</span>
				<input
					className="rounded border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 py-1.5 text-[var(--color-input-fg)]"
					value={currentBranch}
					readOnly
				/>
			</label>

			<label className="flex flex-col gap-1 text-xs">
				<span className="text-[var(--color-muted)]">Onto</span>
				<input
					list="rebase-refs"
					className="rounded border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 py-1.5 text-[var(--color-input-fg)]"
					value={onto}
					onChange={(e) => setOnto(e.target.value)}
					placeholder="branch, tag, or revision"
				/>
			</label>

			<label className="flex flex-col gap-1 text-xs">
				<span className="text-[var(--color-muted)]">From</span>
				<input
					list="rebase-refs"
					className="rounded border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 py-1.5 text-[var(--color-input-fg)]"
					value={from}
					onChange={(e) => setFrom(e.target.value)}
					placeholder="defaults to current branch"
				/>
			</label>

			<datalist id="rebase-refs">
				{refs.map((ref) => (
					<option key={ref} value={ref} />
				))}
			</datalist>

			<div className="text-xs">
				<div className="mb-1 text-[var(--color-muted)]">Modify Options</div>
				<div className="flex flex-col gap-1">
					{FLAG_OPTIONS.map((f) => (
						<label key={f.id} className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={flags.includes(f.id)}
								onChange={() => toggleFlag(f.id)}
							/>
							{f.label}
						</label>
					))}
				</div>
			</div>

			{error && <div className="text-xs text-[var(--color-error)]">{error}</div>}

			<div className="mt-auto flex justify-end gap-2">
				<button
					type="button"
					className="rounded bg-[var(--color-accent)] px-4 py-1.5 text-xs text-white disabled:opacity-40"
					disabled={submitting}
					onClick={() => void submit()}
				>
					{submitting ? 'Rebasing…' : 'Rebase'}
				</button>
			</div>
		</div>
	);
}
