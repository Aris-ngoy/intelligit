import type { LucideIcon, LucideProps } from 'lucide-react';
import {
	Archive,
	ArrowDown,
	ArrowUp,
	Bookmark,
	Brush,
	Check,
	Cherry,
	CircleCheck,
	CircleHelp,
	Clipboard,
	Copy,
	File,
	FileText,
	GitBranch,
	GitMerge,
	GripVertical,
	Handshake,
	History,
	Info,
	Link,
	Loader2,
	Pencil,
	Pin,
	Radio,
	RefreshCw,
	Search,
	Settings,
	Sparkles,
	Swords,
	Tag,
	Trash2,
	TriangleAlert,
	Undo2,
	User,
	Users,
	X,
} from 'lucide-react';

export type IconProps = LucideProps & {
	size?: number;
};

function createIcon(Icon: LucideIcon) {
	const WrappedIcon = ({ size = 16, ...props }: IconProps) => (
		<Icon size={size} aria-hidden {...props} />
	);
	WrappedIcon.displayName = Icon.displayName ?? Icon.name;
	return WrappedIcon;
}

export const AlertTriangleIcon = createIcon(TriangleAlert);
export const ArchiveIcon = createIcon(Archive);
export const ArrowDownIcon = createIcon(ArrowDown);
export const ArrowUpIcon = createIcon(ArrowUp);
export const BookmarkIcon = createIcon(Bookmark);
export const BrushIcon = createIcon(Brush);
export const CheckIcon = createIcon(Check);
export const CheckCircleIcon = createIcon(CircleCheck);
export const CherryIcon = createIcon(Cherry);
export const ClipboardIcon = createIcon(Clipboard);
export const CopyIcon = createIcon(Copy);
export const FileIcon = createIcon(File);
export const FileTextIcon = createIcon(FileText);
export const GitBranchIcon = createIcon(GitBranch);
export const GitMergeIcon = createIcon(GitMerge);
export const GripVerticalIcon = createIcon(GripVertical);
export const HandshakeIcon = createIcon(Handshake);
export const HelpIcon = createIcon(CircleHelp);
export const HistoryIcon = createIcon(History);
export const InfoIcon = createIcon(Info);
export const LinkIcon = createIcon(Link);
export const PencilIcon = createIcon(Pencil);
export const PinIcon = createIcon(Pin);
export const RadioIcon = createIcon(Radio);
export const RefreshIcon = createIcon(RefreshCw);
export const SearchIcon = createIcon(Search);
export const SettingsIcon = createIcon(Settings);
export const SparklesIcon = createIcon(Sparkles);
export const SwordsIcon = createIcon(Swords);
export const TagIcon = createIcon(Tag);
export const TrashIcon = createIcon(Trash2);
export const UndoIcon = createIcon(Undo2);
export const UserIcon = createIcon(User);
export const UsersIcon = createIcon(Users);
export const XIcon = createIcon(X);

export function LoaderIcon({ size = 16, className = '', ...props }: IconProps) {
	return (
		<Loader2
			size={size}
			className={`animate-spin ${className}`.trim()}
			aria-hidden
			{...props}
		/>
	);
}
