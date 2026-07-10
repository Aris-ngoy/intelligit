import type { MouseEvent, ReactNode } from "react";

import type { FileStatusTone } from "./format";
import { AlertTriangleIcon, InfoIcon, UndoIcon } from "./icons";

export function Chip({
	children,
	variant = "default",
	className = "",
}: {
	children: ReactNode;
	variant?: "default" | "branch" | "remote" | "tag";
	className?: string;
}) {
	const styles = {
		default: "bg-[var(--color-input-bg)] text-[var(--color-app-fg)]",
		branch: "bg-[var(--color-accent)] text-white",
		remote:
			"bg-[var(--color-input-bg)] text-[var(--color-muted)] border border-[var(--color-border)]",
		tag: "bg-orange-500/25 text-orange-200",
	};
	return (
		<span
			className={`inline-flex max-w-[120px] shrink-0 items-center truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${styles[variant]} ${className}`}
		>
			{children}
		</span>
	);
}

export function StatusBadge({
	tone,
	label,
}: {
	tone: FileStatusTone;
	label: string;
}) {
	const styles: Record<FileStatusTone, string> = {
		added: "bg-green-500/20 text-green-400",
		modified: "bg-blue-500/20 text-blue-300",
		deleted: "bg-red-500/20 text-red-400",
		other: "bg-[var(--color-input-bg)] text-[var(--color-muted)]",
	};
	return (
		<span
			className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${styles[tone]}`}
		>
			{label}
		</span>
	);
}

export function AuthorAvatar({ name }: { name: string }) {
	const initials = name
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.map((p) => p[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
	return (
		<span
			className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/30 text-[11px] font-bold text-[var(--color-accent)]"
			aria-hidden
		>
			{initials || "?"}
		</span>
	);
}

export function SectionHeader({ children }: { children: ReactNode }) {
	return (
		<div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
			{children}
		</div>
	);
}

export function EmptyState({
	icon,
	title,
	description,
}: {
	icon?: ReactNode;
	title: string;
	description?: string;
}) {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
			{icon && (
				<span
					className="flex text-[var(--color-muted)] [&_svg]:h-8 [&_svg]:w-8"
					aria-hidden
				>
					{icon}
				</span>
			)}
			<p className="text-sm font-medium">{title}</p>
			{description && (
				<p className="max-w-xs text-xs text-[var(--color-muted)]">
					{description}
				</p>
			)}
		</div>
	);
}

export function FilterSelect({
	label,
	value,
	onChange,
	children,
	className = "",
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	children: ReactNode;
	className?: string;
}) {
	return (
		<label className={`flex items-center ${className}`}>
			<span className="sr-only">{label}</span>
			<select
				className="rounded-md border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-2 py-1 text-xs text-[var(--color-input-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				aria-label={label}
			>
				{children}
			</select>
		</label>
	);
}

export function IconButton({
	label,
	onClick,
	children,
}: {
	label: string;
	onClick?: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-muted)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-app-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
			onClick={onClick}
			aria-label={label}
			title={label}
		>
			{children}
		</button>
	);
}

export function Card({
	children,
	className = "",
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-input-bg)]/40 p-4 ${className}`}
		>
			{children}
		</div>
	);
}

export function StepBadge({ n }: { n: number }) {
	return (
		<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-white">
			{n}
		</span>
	);
}

export function TaskHeader({
	icon,
	title,
	description,
}: {
	icon: ReactNode;
	title: string;
	description: string;
}) {
	return (
		<header className="flex shrink-0 flex-col gap-1 border-b border-[var(--color-border)] px-4 py-3">
			<h1 className="flex items-center gap-2 text-base font-semibold">
				<span className="text-[var(--color-accent)]" aria-hidden>
					{icon}
				</span>
				{title}
			</h1>
			<p className="text-xs leading-relaxed text-[var(--color-muted)]">
				{description}
			</p>
		</header>
	);
}

export function InfoStrip({ children }: { children: ReactNode }) {
	return (
		<div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-input-bg)]/40 px-4 py-2 text-xs text-[var(--color-muted)]">
			<span className="inline-flex items-center gap-1.5">
				<InfoIcon size={14} />
				{children}
			</span>
		</div>
	);
}

export function ErrorStrip({ children }: { children: ReactNode }) {
	return (
		<div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-error)]/10 px-4 py-2 text-xs text-[var(--color-error)]">
			<span className="inline-flex items-center gap-1.5">
				<AlertTriangleIcon size={14} />
				{children}
			</span>
		</div>
	);
}

export function ReassuranceLine({ className = "" }: { className?: string }) {
	return (
		<p
			className={`inline-flex items-center justify-center gap-1.5 text-center text-xs italic text-[var(--color-muted)] ${className}`}
		>
			<UndoIcon size={14} />
			Everything safe. You can always undo.
		</p>
	);
}

export function LoadingState({ message }: { message: string }) {
	return (
		<div className="flex h-full items-center justify-center p-6 text-sm text-[var(--color-muted)]">
			{message}
		</div>
	);
}

export function PrimaryButton({
	children,
	disabled,
	onClick,
	className = "",
}: {
	children: ReactNode;
	disabled?: boolean;
	onClick?: () => void;
	className?: string;
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			className={`w-full rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
			onClick={onClick}
		>
			{children}
		</button>
	);
}

export function SecondaryButton({
	children,
	disabled,
	onClick,
	className = "",
}: {
	children: ReactNode;
	disabled?: boolean;
	onClick?: () => void;
	className?: string;
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			className={`rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs transition hover:bg-[var(--color-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
			onClick={onClick}
		>
			{children}
		</button>
	);
}

export function TaskFooter({
	left,
	right,
	summary,
}: {
	left?: ReactNode;
	right: ReactNode;
	summary?: ReactNode;
}) {
	return (
		<footer className="flex shrink-0 flex-col gap-2 border-t border-[var(--color-border)] px-4 py-3">
			{summary}
			<div className="flex items-center gap-2">
				{left}
				<div className="ml-auto flex items-center gap-3">{right}</div>
			</div>
		</footer>
	);
}

export function TagBadge({
	label,
	tone = "default",
}: {
	label: string;
	tone?: "default" | "error" | "info";
}) {
	const styles = {
		default: "bg-[var(--color-input-bg)] text-[var(--color-muted)]",
		error: "bg-red-500/20 text-red-400",
		info: "bg-blue-500/20 text-blue-300",
	};
	return (
		<span
			className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${styles[tone]}`}
		>
			{label}
		</span>
	);
}

export function SegmentedActionButton({
	icon,
	label,
	active,
	activeClass,
	disabled,
	title,
	onClick,
}: {
	icon: ReactNode;
	label: string;
	active: boolean;
	activeClass: string;
	disabled?: boolean;
	title?: string;
	onClick: (e: MouseEvent) => void;
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			title={title}
			className={`flex flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 text-[11px] font-medium transition focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 disabled:opacity-30 ${
				active
					? activeClass
					: "border-[var(--color-border)] hover:bg-[var(--color-hover)]"
			}`}
			onClick={onClick}
		>
			<span aria-hidden className="text-[var(--color-muted)]">
				{icon}
			</span>
			{label}
		</button>
	);
}
