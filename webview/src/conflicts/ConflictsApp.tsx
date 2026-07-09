import { useEffect, type ReactNode } from 'react';

import {
	CheckCircleIcon,
	CheckIcon,
	FileTextIcon,
	HandshakeIcon,
	SearchIcon,
	UserIcon,
	UsersIcon,
	XIcon,
} from '../shared/icons';
import {
	EmptyState,
	ErrorStrip,
	InfoStrip,
	LoadingState,
	PrimaryButton,
	ReassuranceLine,
	SecondaryButton,
	TagBadge,
	TaskFooter,
	TaskHeader,
} from '../shared/ui';
import { useConflictsStore } from './store';
import { getConflictFileMeta, splitFilePath } from './utils';

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
		return <LoadingState message="Looking for disagreements…" />;
	}

	if (files.length === 0 && !loading) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
				<EmptyState
					icon={<CheckCircleIcon size={32} />}
					title="All sorted!"
					description="Every file agrees now. There’s nothing left to fix."
				/>
				{operation?.isRebaseInProgress && (
					<PrimaryButton
						className="!w-auto px-6"
						onClick={() => void continueOp()}
					>
						<span className="inline-flex items-center gap-2">
							<CheckIcon size={16} />
							Finish up
						</span>
					</PrimaryButton>
				)}
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<TaskHeader
				icon={<HandshakeIcon size={18} />}
				title="Two versions don’t agree"
				description="Your changes and theirs touch the same lines. Pick which version to keep or combine them."
			/>

			{operation && operation.type !== 'none' && operation.message && (
				<InfoStrip>{operation.message}</InfoStrip>
			)}

			{error && <ErrorStrip>{error}</ErrorStrip>}

			<div className="min-h-0 flex-1 overflow-y-auto p-3">
				<p className="mb-2 px-1 text-[11px] font-medium text-[var(--color-muted)]">
					{files.length} file{files.length === 1 ? '' : 's'} need your help
				</p>
				<div className="space-y-2">
					{files.map((file) => {
						const { folder, name } = splitFilePath(file);
						const meta = getConflictFileMeta(file);
						return (
							<div
								key={file}
								className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)]/20 p-3"
							>
								<span aria-hidden className="text-[var(--color-muted)]">
									<FileTextIcon size={20} />
								</span>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<span className="min-w-0 truncate font-mono text-xs" title={file}>
											{folder && (
												<span className="text-[var(--color-muted)]">{folder}</span>
											)}
											<span className="font-semibold text-[var(--color-app-fg)]">
												{name}
											</span>
										</span>
										{meta.tag && (
											<TagBadge label={meta.tag.label} tone={meta.tag.tone} />
										)}
									</div>
								</div>
								<div className="flex shrink-0 flex-wrap items-center gap-1.5">
									<ChoiceButton
										icon={<UserIcon size={14} />}
										label="Keep mine"
										onClick={() => void acceptOurs(file)}
									/>
									<ChoiceButton
										icon={<UsersIcon size={14} />}
										label="Keep theirs"
										onClick={() => void acceptTheirs(file)}
									/>
									<ChoiceButton
										icon={<SearchIcon size={14} />}
										label="Compare…"
										primary
										onClick={() => void openMerge(file)}
									/>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			<TaskFooter
				left={
					<SecondaryButton onClick={() => void abortOp()}>
						<span className="inline-flex items-center gap-1.5">
							<XIcon size={14} />
							Cancel everything
						</span>
					</SecondaryButton>
				}
				right={
					<>
						<ReassuranceLine className="!text-left !not-italic" />
						<PrimaryButton
							className="!w-auto whitespace-nowrap px-5"
							disabled={files.length > 0}
							onClick={() => void continueOp()}
						>
							{files.length > 0 ? (
								`Fix all ${files.length} first`
							) : (
								<span className="inline-flex items-center gap-2">
									<CheckIcon size={16} />
									Finish up
								</span>
							)}
						</PrimaryButton>
					</>
				}
			/>
		</div>
	);
}

function ChoiceButton({
	icon,
	label,
	onClick,
	primary = false,
}: {
	icon: ReactNode;
	label: string;
	onClick: () => void;
	primary?: boolean;
}) {
	return (
		<button
			type="button"
			className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 ${
				primary
					? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
					: 'border-[var(--color-border)] hover:bg-[var(--color-hover)]'
			}`}
			onClick={onClick}
		>
			<span aria-hidden>{icon}</span>
			{label}
		</button>
	);
}
