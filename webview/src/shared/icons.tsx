import type { ReactNode, SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement> & {
	size?: number;
};

function SvgIcon({
	size = 16,
	children,
	...props
}: IconProps & { children: ReactNode }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden
			{...props}
		>
			{children}
		</svg>
	);
}

export function AlertTriangleIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<path
				d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</SvgIcon>
	);
}

export function ArchiveIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<rect x="3" y="4" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
			<path
				d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</SvgIcon>
	);
}

export function ArrowDownIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<path
				d="M12 5v14m0 0 7-7m-7 7-7-7"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</SvgIcon>
	);
}

export function ArrowUpIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<path
				d="M12 19V5m0 0-7 7m7-7 7 7"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</SvgIcon>
	);
}

export function BookmarkIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<path
				d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</SvgIcon>
	);
}

export function BrushIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<path
				d="m9 11-6 6v3h3l6-6M20 4l-4 4-2-2 4-4a2.8 2.8 0 0 1 4 4Z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</SvgIcon>
	);
}

export function CheckIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<path
				d="M20 6 9 17l-5-5"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</SvgIcon>
	);
}

export function CheckCircleIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
			<path
				d="M8 12.5 10.5 15 16 9"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</SvgIcon>
	);
}

export function CherryIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<path
				d="M8 8c0-2.2 1.8-4 4-4 1.1 0 2.1.45 2.8 1.2M12 4V2M6 14c0 3.3 2.7 6 6 6s6-2.7 6-6"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<circle cx="9" cy="14" r="2" fill="currentColor" />
			<circle cx="15" cy="14" r="2" fill="currentColor" />
		</SvgIcon>
	);
}

export function ClipboardIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<rect x="8" y="4" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
			<path
				d="M8 8H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</SvgIcon>
	);
}

export function FileTextIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<path
				d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path d="M14 3v5h5M9 13h6M9 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</SvgIcon>
	);
}

export function GitBranchIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="2" />
			<circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
			<path
				d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v3"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</SvgIcon>
	);
}

export function GitMergeIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
			<circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="2" />
			<path
				d="M6 9v3a3 3 0 0 0 3 3h3M18 15V9a3 3 0 0 0-3-3h-3"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</SvgIcon>
	);
}

export function GripVerticalIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<circle cx="9" cy="6" r="1.5" fill="currentColor" />
			<circle cx="15" cy="6" r="1.5" fill="currentColor" />
			<circle cx="9" cy="12" r="1.5" fill="currentColor" />
			<circle cx="15" cy="12" r="1.5" fill="currentColor" />
			<circle cx="9" cy="18" r="1.5" fill="currentColor" />
			<circle cx="15" cy="18" r="1.5" fill="currentColor" />
		</SvgIcon>
	);
}

export function HandshakeIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<path
				d="M7 11V8a2 2 0 0 1 2-2h2M17 11V8a2 2 0 0 0-2-2h-2M8 14l2 2 2-2 2 2 2-2"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</SvgIcon>
	);
}

export function HistoryIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<path
				d="M3 12a9 9 0 1 0 3-6.7M3 3v6h6"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</SvgIcon>
	);
}

export function InfoIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
			<path d="M12 10v6M12 7h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</SvgIcon>
	);
}

export function LinkIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<path
				d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 6M14 11a5 5 0 0 0-7.07 0L5.52 12.4a5 5 0 0 0 7.07 7.07L14 18"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</SvgIcon>
	);
}

export function LoaderIcon({ size = 16, className = '', ...props }: IconProps) {
	return (
		<SvgIcon size={size} className={`animate-spin ${className}`} {...props}>
			<path
				d="M12 3a9 9 0 1 0 9 9"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</SvgIcon>
	);
}

export function PencilIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<path
				d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</SvgIcon>
	);
}

export function PinIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<path
				d="M12 17v5M9 3h6l1 7 4 2-1.5 3H5.5L4 12l4-2 1-7Z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</SvgIcon>
	);
}

export function RadioIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
			<path
				d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 7.76a6 6 0 0 0 0 8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</SvgIcon>
	);
}

export function RefreshIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<path
				d="M21 12a9 9 0 1 1-2.64-6.36"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d="M21 3v6h-6"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</SvgIcon>
	);
}

export function SearchIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
			<path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</SvgIcon>
	);
}

export function SparklesIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<path
				d="M12 3v2m0 14v2M5 12H3m18 0h-2M7.05 7.05 5.64 5.64m12.72 12.72-1.41-1.41M7.05 16.95l-1.41 1.41M18.36 5.64l-1.41 1.41"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d="M12 8l1.2 3.6L17 12.8l-3.8 1.2L12 17.6l-1.2-3.6L7 12.8l3.8-1.2L12 8Z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinejoin="round"
			/>
		</SvgIcon>
	);
}

export function SwordsIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<path
				d="m14.5 9.5-5 5M9.5 9.5l5 5M8 4 4 8l4 4M16 4l4 4-4 4"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</SvgIcon>
	);
}

export function TagIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<path
				d="M20 12V8a2 2 0 0 0-2-2h-4L4 16l4 4 8-8Z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
		</SvgIcon>
	);
}

export function TrashIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<path
				d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</SvgIcon>
	);
}

export function UndoIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<path
				d="M9 7H4v5M20 18a8 8 0 0 0-12-6.7L4 12"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</SvgIcon>
	);
}

export function UserIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
			<path
				d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</SvgIcon>
	);
}

export function UsersIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
			<path
				d="M2 20c0-3.3 3.1-6 7-6M15 11a3 3 0 1 1 0-6M22 20c0-3.3-3.1-6-7-6"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</SvgIcon>
	);
}

export function XIcon({ size = 16, ...props }: IconProps) {
	return (
		<SvgIcon size={size} {...props}>
			<path
				d="M18 6 6 18M6 6l12 12"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</SvgIcon>
	);
}
