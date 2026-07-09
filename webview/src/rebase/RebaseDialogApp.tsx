import { useEffect, useState } from 'react';

import {
	ArchiveIcon,
	ArrowDownIcon,
	CheckIcon,
	GitBranchIcon,
	PinIcon,
} from '../shared/icons';
import {
	Card,
	Chip,
	ErrorStrip,
	LoadingState,
	PrimaryButton,
	ReassuranceLine,
	StepBadge,
} from '../shared/ui';
import { useRebaseDialogStore } from './store';

const FLAG_OPTIONS = [
	{ id: '--autostash', label: 'Auto-stash', help: 'Tuck away unsaved changes first, then bring them back after.' },
	{ id: '--no-verify', label: 'Skip checks', help: 'Don’t run the pre-commit hooks while moving.' },
	{ id: '--keep-empty', label: 'Keep empty commits', help: 'Don’t throw away commits that change nothing.' },
	{ id: '--autosquash', label: 'Auto-squash', help: 'Automatically fold in commits marked “fixup!”.' },
] as const;

interface RebaseDialogAppProps {
	initialFromHash?: string;
}

export function RebaseDialogApp({ initialFromHash = '' }: RebaseDialogAppProps) {
	const loading = useRebaseDialogStore((s) => s.loading);
	const error = useRebaseDialogStore((s) => s.error);
	const refs = useRebaseDialogStore((s) => s.refs);
	const currentBranch = useRebaseDialogStore((s) => s.currentBranch);
	const fromHash = useRebaseDialogStore((s) => s.fromHash);
	const fromLabel = useRebaseDialogStore((s) => s.fromLabel);
	const commitCount = useRebaseDialogStore((s) => s.commitCount);
	const onto = useRebaseDialogStore((s) => s.onto);
	const flags = useRebaseDialogStore((s) => s.flags);
	const submitting = useRebaseDialogStore((s) => s.submitting);
	const load = useRebaseDialogStore((s) => s.load);
	const setOnto = useRebaseDialogStore((s) => s.setOnto);
	const toggleFlag = useRebaseDialogStore((s) => s.toggleFlag);
	const submit = useRebaseDialogStore((s) => s.submit);

	const [showAdvanced, setShowAdvanced] = useState(false);

	useEffect(() => {
		void load(initialFromHash);
	}, [load, initialFromHash]);

	if (loading) {
		return <LoadingState message="Loading…" />;
	}

	const targets = refs.filter((ref) => ref !== currentBranch);
	const fromCommit = Boolean(fromHash);

	return (
		<div className="mx-auto flex h-full w-full max-w-xl flex-col overflow-y-auto p-6">
			<header className="mb-5 flex flex-col gap-1">
				<h1 className="flex items-center gap-2 text-lg font-semibold">
					<span className="text-[var(--color-accent)]" aria-hidden>
						<ArchiveIcon size={20} />
					</span>
					Move my work
				</h1>
				<p className="text-sm leading-relaxed text-[var(--color-muted)]">
					This takes everything you’ve been working on and stacks it neatly on top of
					another branch.
				</p>
			</header>

			<Card className="mb-3">
				<div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[var(--color-muted)]">
					<StepBadge n={1} /> What I’m moving
				</div>
				{fromCommit ? (
					<div className="flex flex-col gap-2">
						<div className="flex flex-wrap items-center gap-2">
							<span aria-hidden className="text-[var(--color-muted)]">
								<PinIcon size={18} />
							</span>
							<span className="rounded-lg border border-[var(--color-border)] bg-[var(--color-input-bg)] px-3 py-1.5 font-mono text-sm font-medium">
								{fromLabel || fromHash.slice(0, 7)}
							</span>
							{commitCount > 0 && (
								<Chip variant="branch" className="max-w-none">
									{commitCount} commit{commitCount === 1 ? '' : 's'}
								</Chip>
							)}
						</div>
						<p className="text-xs text-[var(--color-muted)]">
							Everything from this point through your latest changes on{' '}
							<strong>{currentBranch || 'your branch'}</strong>.
						</p>
					</div>
				) : (
					<div className="flex flex-col gap-2">
						<div className="flex flex-wrap items-center gap-2">
							<span aria-hidden className="text-[var(--color-muted)]">
								<GitBranchIcon size={18} />
							</span>
							<span className="rounded-lg border border-[var(--color-border)] bg-[var(--color-input-bg)] px-3 py-1.5 font-mono text-sm font-medium">
								{currentBranch || 'your branch'}
							</span>
							<span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
								CURRENT
							</span>
						</div>
						<p className="text-xs text-[var(--color-muted)]">
							(all your latest changes)
						</p>
					</div>
				)}
			</Card>

			<div className="mb-3 flex justify-center" aria-hidden>
				<span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-input-bg)] text-[var(--color-muted)]">
					<ArrowDownIcon size={18} />
				</span>
			</div>

			<Card className="mb-4">
				<div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[var(--color-muted)]">
					<StepBadge n={2} /> Put it on top of…
				</div>
				<select
					className="w-full rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 py-2.5 text-sm text-[var(--color-input-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
					value={onto}
					onChange={(e) => setOnto(e.target.value)}
					aria-label="Choose target branch"
				>
					<option value="" disabled>
						Choose a branch…
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
			</Card>

			{error && <ErrorStrip>{error}</ErrorStrip>}

			<div className="mb-4">
				<button
					type="button"
					className="text-xs text-[var(--color-muted)] underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
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
				<PrimaryButton disabled={submitting || !onto} onClick={() => void submit()}>
					{submitting ? (
						'Moving your work…'
					) : onto ? (
						<span className="inline-flex items-center justify-center gap-2">
							<CheckIcon size={16} />
							Move it onto “{onto}”
						</span>
					) : (
						'Pick a branch first'
					)}
				</PrimaryButton>
				<ReassuranceLine />
				<p className="text-center text-[10px] text-[var(--color-muted)]">
					IntelliGit is rewriting your history locally. No changes will be sent to the
					remote server until you decide to sync.
				</p>
			</div>
		</div>
	);
}
