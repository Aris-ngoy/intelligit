import { Allotment } from 'allotment';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { bridge } from '../shared/bridge';
import { AlertTriangleIcon } from '../shared/icons';
import type { RepositoryInfoDto } from '../shared/types';
import { EmptyState, LoadingState, PrimaryButton, SecondaryButton } from '../shared/ui';
import type { FileVersionsDto } from './types';
import type { MergeBlock } from './types';
import { useMergeStore } from './store';

interface MergeEditorAppProps {
	filePath: string;
}

export function MergeEditorApp({ filePath }: MergeEditorAppProps) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [applying, setApplying] = useState(false);
	const [repoInfo, setRepoInfo] = useState<RepositoryInfoDto | null>(null);
	const [focusedConflictIndex, setFocusedConflictIndex] = useState(0);
	const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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

	const conflictBlocks = useMemo(
		() => blocks.filter((b) => b.state === 'conflict'),
		[blocks],
	);
	const unresolvedConflicts = useMemo(
		() => conflictBlocks.filter((b) => !b.isResolved),
		[conflictBlocks],
	);

	const conflictCount = useMemo(() => getConflictCount(), [blocks, getConflictCount]);
	const canApply = allResolved() && conflictCount === 0;

	const oursBranch = repoInfo?.currentBranch ?? 'yours';
	const theirsBranch = 'incoming';

	useEffect(() => {
		let cancelled = false;
		void (async () => {
			try {
				const [versions, repo] = await Promise.all([
					bridge.request<FileVersionsDto>('getFileVersions', { filePath }),
					bridge.request<RepositoryInfoDto | { status: string }>('getRepositoryInfo'),
				]);
				if (cancelled) {
					return;
				}
				setFile(filePath, versions.base, versions.ours, versions.theirs);
				if (!('status' in repo)) {
					setRepoInfo(repo);
				}
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

	const scrollToConflict = useCallback(
		(index: number) => {
			const block = unresolvedConflicts[index];
			if (!block) {
				return;
			}
			setFocusedConflictIndex(index);
			blockRefs.current.get(block.id)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
		},
		[unresolvedConflicts],
	);

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
		return <LoadingState message="Loading merge editor…" />;
	}

	if (error && blocks.length === 0) {
		return (
			<EmptyState icon={<AlertTriangleIcon size={32} />} title="Couldn't load merge editor" description={error} />
		);
	}

	return (
		<div className="flex h-full flex-col">
			<div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-2">
				<span className="min-w-0 truncate font-mono text-xs">{filePath}</span>
				<div className="flex items-center gap-2">
					{unresolvedConflicts.length > 0 && (
						<div className="flex items-center gap-1">
							<SecondaryButton
								className="!px-2 !py-1"
								onClick={() =>
									scrollToConflict(
										(focusedConflictIndex - 1 + unresolvedConflicts.length) %
											unresolvedConflicts.length,
									)
								}
							>
								← Prev
							</SecondaryButton>
							<SecondaryButton
								className="!px-2 !py-1"
								onClick={() =>
									scrollToConflict((focusedConflictIndex + 1) % unresolvedConflicts.length)
								}
							>
								Next →
							</SecondaryButton>
						</div>
					)}
					<span
						className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
							conflictCount > 0
								? 'bg-[var(--color-error)]/20 text-[var(--color-error)]'
								: 'bg-green-500/20 text-green-400'
						}`}
					>
						{conflictCount} conflict{conflictCount === 1 ? '' : 's'} remaining
					</span>
				</div>
			</div>

			<div className="min-h-0 flex-1">
				<Allotment defaultSizes={[33, 34, 33]}>
					<Allotment.Pane minSize={120}>
						<Column title="Local (Yours)" branch={oursBranch} readOnly>
							{blocks.map((block, blockIndex) => (
								<SideBlock
									key={`left-${block.id}`}
									block={block}
									lines={block.leftLines}
									side="left"
									startLine={lineOffset(blocks, blockIndex)}
									showArrow={block.state === 'conflict' && !block.isResolved}
								/>
							))}
						</Column>
					</Allotment.Pane>
					<Allotment.Pane minSize={120}>
						<Column title="Result" readOnly={false}>
							{blocks.map((block) => (
								<ResultBlock
									key={`center-${block.id}`}
									block={block}
									blockRef={(el) => {
										if (el) {
											blockRefs.current.set(block.id, el);
										} else {
											blockRefs.current.delete(block.id);
										}
									}}
									onAcceptLeft={() => acceptLeft(block.id)}
									onAcceptRight={() => acceptRight(block.id)}
									onIgnore={() => ignoreBlock(block.id)}
									onChange={(text) => updateResult(block.id, text)}
								/>
							))}
						</Column>
					</Allotment.Pane>
					<Allotment.Pane minSize={120}>
						<Column title="Incoming (Theirs)" branch={theirsBranch} readOnly>
							{blocks.map((block, blockIndex) => (
								<SideBlock
									key={`right-${block.id}`}
									block={block}
									lines={block.rightLines}
									side="right"
									startLine={lineOffset(blocks, blockIndex)}
									showArrow={block.state === 'conflict' && !block.isResolved}
								/>
							))}
						</Column>
					</Allotment.Pane>
				</Allotment>
			</div>

			{error && (
				<div className="shrink-0 border-t border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-error)]">
					{error}
				</div>
			)}

			<div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] px-3 py-2">
				<div className="flex gap-2">
					<SecondaryButton onClick={acceptAllLeft}>Accept All Left</SecondaryButton>
					<SecondaryButton onClick={acceptAllRight}>Accept All Right</SecondaryButton>
				</div>
				<div className="flex gap-2">
					<SecondaryButton
						onClick={() => void bridge.request('closeMergeEditor', { filePath })}
					>
						Cancel
					</SecondaryButton>
					<PrimaryButton
						className="!w-auto px-5"
						disabled={!canApply || applying}
						onClick={() => void handleApply()}
					>
						{applying ? 'Applying…' : 'Apply & Save'}
					</PrimaryButton>
				</div>
			</div>
		</div>
	);
}

function lineOffset(blocks: MergeBlock[], blockIndex: number): number {
	let offset = 1;
	for (let i = 0; i < blockIndex; i++) {
		const b = blocks[i];
		if (b) {
			offset += Math.max(b.leftLines.length, b.rightLines.length, b.resultLines.length, 1);
		}
	}
	return offset;
}

function Column({
	title,
	branch,
	readOnly,
	children,
}: {
	title: string;
	branch?: string;
	readOnly: boolean;
	children: ReactNode;
}) {
	return (
		<div className="flex h-full flex-col">
			<div className="flex shrink-0 items-center gap-2 border-b border-[var(--color-border)] px-2 py-1.5 text-[11px] font-semibold">
				<span>{title}</span>
				{readOnly && (
					<span className="font-normal text-[var(--color-muted)]">(read-only)</span>
				)}
				{branch && (
					<span className="ml-auto truncate rounded bg-[var(--color-input-bg)] px-1.5 py-0.5 font-mono text-[10px] font-normal text-[var(--color-muted)]">
						{branch}
					</span>
				)}
			</div>
			<div className="min-h-0 flex-1 overflow-auto font-mono text-[11px] leading-5">
				{children}
			</div>
		</div>
	);
}

function SideBlock({
	block,
	lines,
	side,
	startLine,
	showArrow,
}: {
	block: MergeBlock;
	lines: string[];
	side: 'left' | 'right';
	startLine: number;
	showArrow: boolean;
}) {
	const isConflict = block.state === 'conflict' && !block.isResolved;
	const bg =
		isConflict && side === 'left'
			? 'bg-red-500/10'
			: isConflict && side === 'right'
				? 'bg-green-500/10'
				: '';

	return (
		<div className={`relative border-b border-[var(--color-border)]/30 ${bg}`}>
			{showArrow && (
				<span
					className={`absolute top-1 ${side === 'left' ? 'right-1 text-red-400' : 'left-1 text-green-400'} text-xs font-bold`}
					aria-hidden
				>
					{side === 'left' ? '⇒' : '⇐'}
				</span>
			)}
			{lines.length === 0 ? (
				<div className="px-2 py-1 text-[var(--color-muted)]">&nbsp;</div>
			) : (
				lines.map((line, i) => (
					<div key={i} className="flex">
						<span className="w-8 shrink-0 select-none pr-1 text-right text-[var(--color-muted)]">
							{startLine + i}
						</span>
						<span className="min-w-0 flex-1 whitespace-pre-wrap px-1 py-0.5">{line}</span>
					</div>
				))
			)}
		</div>
	);
}

function ResultBlock({
	block,
	blockRef,
	onAcceptLeft,
	onAcceptRight,
	onIgnore,
	onChange,
}: {
	block: MergeBlock;
	blockRef: (el: HTMLDivElement | null) => void;
	onAcceptLeft: () => void;
	onAcceptRight: () => void;
	onIgnore: () => void;
	onChange: (text: string) => void;
}) {
	const isConflict = block.state === 'conflict' && !block.isResolved;
	const displayText = isConflict
		? [
				'/* CONFLICT START */',
				...block.leftLines,
				'/* ======= */',
				...block.rightLines,
				'/* CONFLICT END */',
			].join('\n')
		: block.resultLines.join('\n');

	return (
		<div
			ref={blockRef}
			className={`group relative border-b border-[var(--color-border)]/30 ${
				isConflict ? 'bg-purple-500/10' : ''
			}`}
		>
			{isConflict && (
				<>
					<GutterButton side="left" label=">>" onClick={onAcceptLeft} />
					<GutterButton side="right" label="<<" onClick={onAcceptRight} />
					<GutterButton side="right" label="×" extraClass="right-8" onClick={onIgnore} />
				</>
			)}
			{isConflict ? (
				<pre className="whitespace-pre-wrap px-8 py-1">{displayText}</pre>
			) : (
				<textarea
					className="block w-full resize-none border-0 bg-transparent px-8 py-1 font-mono text-[11px] leading-5 outline-none focus:ring-1 focus:ring-[var(--color-accent)]/30"
					rows={Math.max(1, block.resultLines.length)}
					value={block.resultLines.join('\n')}
					onChange={(e) => onChange(e.target.value)}
				/>
			)}
		</div>
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
			aria-label={label}
		>
			{label}
		</button>
	);
}
