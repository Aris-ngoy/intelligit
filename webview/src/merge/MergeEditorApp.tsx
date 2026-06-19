import { Allotment } from 'allotment';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { bridge } from '../shared/bridge';
import type { FileVersionsDto } from './types';
import { useMergeStore } from './store';

interface MergeEditorAppProps {
	filePath: string;
}

export function MergeEditorApp({ filePath }: MergeEditorAppProps) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [applying, setApplying] = useState(false);

	const blocks = useMergeStore((s) => s.blocks);
	const setFile = useMergeStore((s) => s.setFile);
	const acceptLeft = useMergeStore((s) => s.acceptLeft);
	const acceptRight = useMergeStore((s) => s.acceptRight);
	const ignoreBlock = useMergeStore((s) => s.ignoreBlock);
	const acceptAllLeft = useMergeStore((s) => s.acceptAllLeft);
	const acceptAllRight = useMergeStore((s) => s.acceptAllRight);
	const updateResult = useMergeStore((s) => s.updateResult);
	const getResultText = useMergeStore((s) => s.getResultText);
	const getConflictCount = useMergeStore((s) => s.getConflictCount);
	const allResolved = useMergeStore((s) => s.allResolved);

	const conflictCount = useMemo(() => getConflictCount(), [blocks, getConflictCount]);
	const canApply = allResolved() && conflictCount === 0;

	useEffect(() => {
		let cancelled = false;
		void (async () => {
			try {
				const versions = await bridge.request<FileVersionsDto>('getFileVersions', {
					filePath,
				});
				if (cancelled) {
					return;
				}
				setFile(filePath, versions.base, versions.ours, versions.theirs);
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : String(err));
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [filePath, setFile]);

	const handleApply = useCallback(async () => {
		if (!canApply) {
			return;
		}
		setApplying(true);
		setError(null);
		try {
			await bridge.request('saveMergedContent', {
				filePath,
				content: getResultText(),
			});
			await bridge.request('stageFile', { filePath });
			await bridge.request('closeMergeEditor', { filePath });

			const remaining = await bridge.request<string[]>('getConflictFiles');
			if (remaining.length === 0) {
				await bridge.request('continueOperation', {});
			} else {
				await bridge.request('openConflicts', {});
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setApplying(false);
		}
	}, [canApply, filePath, getResultText]);

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center text-[var(--color-muted)]">
				Loading merge editor…
			</div>
		);
	}

	if (error && blocks.length === 0) {
		return (
			<div className="flex h-full items-center justify-center p-4 text-[var(--color-error)]">
				{error}
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
				<span className="truncate font-mono text-xs">{filePath}</span>
				<span className="shrink-0 text-xs text-[var(--color-muted)]">
					{conflictCount} conflict{conflictCount === 1 ? '' : 's'} remaining
				</span>
			</div>

			<div className="min-h-0 flex-1">
				<Allotment defaultSizes={[33, 34, 33]}>
					<Allotment.Pane minSize={120}>
						<Column title="Local (Yours)" readOnly>
							{blocks.map((block) => (
								<BlockLines
									key={`left-${block.id}`}
									lines={block.leftLines}
									kind={block.state === 'conflict' && !block.isResolved ? 'conflict-left' : 'normal'}
								/>
							))}
						</Column>
					</Allotment.Pane>
					<Allotment.Pane minSize={120}>
						<Column title="Result" readOnly={false}>
							{blocks.map((block) => (
								<div key={`center-${block.id}`} className="group relative border-b border-[var(--color-border)]/30">
									<GutterButton
										side="left"
										label=">>"
										onClick={() => acceptLeft(block.id)}
									/>
									<GutterButton
										side="right"
										label="<<"
										onClick={() => acceptRight(block.id)}
									/>
									<GutterButton
										side="right"
										label="×"
										extraClass="right-8"
										onClick={() => ignoreBlock(block.id)}
									/>
									<textarea
										className="block w-full resize-none border-0 bg-transparent px-8 py-1 font-mono text-[11px] leading-5 outline-none"
										rows={Math.max(1, block.resultLines.length)}
										value={block.resultLines.join('\n')}
										onChange={(e) => updateResult(block.id, e.target.value)}
									/>
								</div>
							))}
						</Column>
					</Allotment.Pane>
					<Allotment.Pane minSize={120}>
						<Column title="Incoming (Theirs)" readOnly>
							{blocks.map((block) => (
								<BlockLines
									key={`right-${block.id}`}
									lines={block.rightLines}
									kind={block.state === 'conflict' && !block.isResolved ? 'conflict-right' : 'normal'}
								/>
							))}
						</Column>
					</Allotment.Pane>
				</Allotment>
			</div>

			{error && (
				<div className="border-t border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-error)]">
					{error}
				</div>
			)}

			<div className="flex items-center justify-between border-t border-[var(--color-border)] px-3 py-2">
				<div className="flex gap-2">
					<ActionButton label="Accept Left" onClick={acceptAllLeft} />
					<ActionButton label="Accept Right" onClick={acceptAllRight} />
				</div>
				<div className="flex gap-2">
					<ActionButton
						label="Cancel"
						onClick={() => void bridge.request('closeMergeEditor', { filePath })}
					/>
					<button
						type="button"
						disabled={!canApply || applying}
						className="rounded bg-[var(--color-accent)] px-4 py-1.5 text-xs text-white disabled:opacity-40"
						onClick={() => void handleApply()}
					>
						{applying ? 'Applying…' : 'Apply'}
					</button>
				</div>
			</div>
		</div>
	);
}

function Column({
	title,
	readOnly,
	children,
}: {
	title: string;
	readOnly: boolean;
	children: ReactNode;
}) {
	return (
		<div className="flex h-full flex-col">
			<div className="shrink-0 border-b border-[var(--color-border)] px-2 py-1.5 text-[11px] font-semibold">
				{title}
				{readOnly && (
					<span className="ml-1 font-normal text-[var(--color-muted)]">(read-only)</span>
				)}
			</div>
			<div className="min-h-0 flex-1 overflow-auto font-mono text-[11px] leading-5">
				{children}
			</div>
		</div>
	);
}

function BlockLines({
	lines,
	kind,
}: {
	lines: string[];
	kind: 'normal' | 'conflict-left' | 'conflict-right';
}) {
	const bg =
		kind === 'conflict-left'
			? 'bg-red-500/10'
			: kind === 'conflict-right'
				? 'bg-green-500/10'
				: '';
	return (
		<pre className={`whitespace-pre-wrap border-b border-[var(--color-border)]/30 px-2 py-1 ${bg}`}>
			{lines.join('\n')}
		</pre>
	);
}

function GutterButton({
	side,
	label,
	onClick,
	extraClass = '',
}: {
	side: 'left' | 'right';
	label: string;
	onClick: () => void;
	extraClass?: string;
}) {
	return (
		<button
			type="button"
			className={`absolute top-1 ${side === 'left' ? 'left-1' : 'right-1'} z-10 hidden rounded border border-[var(--color-border)] bg-[var(--color-input-bg)] px-1 text-[10px] group-hover:block ${extraClass}`}
			onClick={onClick}
		>
			{label}
		</button>
	);
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
	return (
		<button
			type="button"
			className="rounded border border-[var(--color-border)] bg-[var(--color-input-bg)] px-3 py-1 text-xs hover:bg-[var(--color-hover)]"
			onClick={onClick}
		>
			{label}
		</button>
	);
}
