import { useEffect, useState } from 'react';

import { useRebaseDialogStore } from './store';

const FLAG_OPTIONS = [
	{ id: '--autostash', label: 'Auto-stash', help: 'Tuck away unsaved changes first, then bring them back after.' },
	{ id: '--no-verify', label: 'Skip checks', help: 'Don’t run the pre-commit hooks while moving.' },
	{ id: '--keep-empty', label: 'Keep empty commits', help: 'Don’t throw away commits that change nothing.' },
	{ id: '--autosquash', label: 'Auto-squash', help: 'Automatically fold in commits marked “fixup!”.' },
] as const;

export function RebaseDialogApp() {
	const loading = useRebaseDialogStore((s) => s.loading);
	const error = useRebaseDialogStore((s) => s.error);
	const refs = useRebaseDialogStore((s) => s.refs);
	const currentBranch = useRebaseDialogStore((s) => s.currentBranch);
	const onto = useRebaseDialogStore((s) => s.onto);
	const flags = useRebaseDialogStore((s) => s.flags);
	const submitting = useRebaseDialogStore((s) => s.submitting);
	const load = useRebaseDialogStore((s) => s.load);
	const setOnto = useRebaseDialogStore((s) => s.setOnto);
	const toggleFlag = useRebaseDialogStore((s) => s.toggleFlag);
	const submit = useRebaseDialogStore((s) => s.submit);

	const [showAdvanced, setShowAdvanced] = useState(false);

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

	const targets = refs.filter((ref) => ref !== currentBranch);

	return (
		<div className="mx-auto flex h-full w-full max-w-xl flex-col gap-5 overflow-y-auto p-6">
			<header className="flex flex-col gap-1">
				<h1 className="flex items-center gap-2 text-lg font-semibold">
					<span aria-hidden>📦</span> Move my work
				</h1>
				<p className="text-sm text-[var(--color-muted)]">
					This takes everything you’ve been working on and stacks it neatly on top of
					another branch. Just pick where it should go.
				</p>
			</header>

			{/* Step 1 — what we're moving */}
			<section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)]/40 p-4">
				<div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--color-muted)]">
					<StepBadge n={1} /> What I’m moving
				</div>
				<div className="flex items-center gap-2">
					<span aria-hidden className="text-base">🌿</span>
					<span className="rounded-lg bg-[var(--color-selected)] px-3 py-1.5 text-sm font-medium text-[var(--color-selected-fg)]">
						{currentBranch || 'your branch'}
					</span>
					<span className="text-sm text-[var(--color-muted)]">(all your latest changes)</span>
				</div>
			</section>

			<div className="flex justify-center text-2xl text-[var(--color-muted)]" aria-hidden>
				⬇️
			</div>

			{/* Step 2 — where it goes */}
			<section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)]/40 p-4">
				<div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--color-muted)]">
					<StepBadge n={2} /> Put it on top of…
				</div>
				<select
					className="w-full rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 py-2.5 text-sm text-[var(--color-input-fg)]"
					value={onto}
					onChange={(e) => setOnto(e.target.value)}
				>
					<option value="" disabled>
						👉 Choose a branch…
					</option>
					{targets.map((ref) => (
						<option key={ref} value={ref}>
							{ref}
						</option>
					))}
				</select>
				<p className="mt-2 text-xs text-[var(--color-muted)]">
					Pick the branch you want to build on — usually <strong>main</strong>.
				</p>
			</section>

			{error && (
				<div className="rounded-lg border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]">
					⚠️ {error}
				</div>
			)}

			{/* Advanced (hidden by default) */}
			<div>
				<button
					type="button"
					className="text-xs text-[var(--color-muted)] underline-offset-2 hover:underline"
					onClick={() => setShowAdvanced((v) => !v)}
				>
					{showAdvanced ? '▾ Hide extra options' : '▸ Show extra options (for grown-ups)'}
				</button>
				{showAdvanced && (
					<div className="mt-2 flex flex-col gap-2 rounded-lg border border-[var(--color-border)] p-3">
						{FLAG_OPTIONS.map((f) => (
							<label key={f.id} className="flex items-start gap-2 text-xs">
								<input
									type="checkbox"
									className="mt-0.5"
									checked={flags.includes(f.id)}
									onChange={() => toggleFlag(f.id)}
								/>
								<span>
									<span className="font-medium">{f.label}</span>
									<span className="block text-[var(--color-muted)]">{f.help}</span>
								</span>
							</label>
						))}
					</div>
				)}
			</div>

			<div className="mt-auto flex flex-col gap-2 pt-2">
				<button
					type="button"
					className="w-full rounded-xl bg-[var(--color-accent)] px-4 py-3 text-base font-semibold text-white shadow-sm transition disabled:opacity-40"
					disabled={submitting || !onto}
					onClick={() => void submit()}
				>
					{submitting ? 'Moving your work…' : onto ? `✅ Move it onto “${onto}”` : 'Pick a branch first ☝️'}
				</button>
				<p className="text-center text-xs text-[var(--color-muted)]">
					Don’t worry — if something looks wrong, you can always undo it.
				</p>
			</div>
		</div>
	);
}

function StepBadge({ n }: { n: number }) {
	return (
		<span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-white">
			{n}
		</span>
	);
}
