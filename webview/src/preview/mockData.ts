import type { FileVersionsDto, MergeOperationStateDto } from '../merge/types';
import type {
	InteractiveRebaseCommitDto,
	RepositoryInfoDto,
} from '../shared/types';
import {
	previewAuthors,
	previewCommitFiles,
	previewCommits,
	previewRepoInfo,
} from './mockGitLogData';

export { previewAuthors, previewCommitFiles, previewCommits, previewRepoInfo };

export const previewRebaseRefs = [
	'main',
	'develop',
	'feature/ui-refresh',
	'origin/main',
	'origin/develop',
];

export const previewInteractiveCommits: InteractiveRebaseCommitDto[] = [
	{
		hash: '8f2a9c4',
		shortHash: '8f2a9c4',
		message: 'feat: implement initial drag-and-drop logic',
		action: 'pick',
		timestamp: Math.floor(Date.now() / 1000) - 120,
	},
	{
		hash: '3b4d1e2',
		shortHash: '3b4d1e2',
		message: 'fix: typo in dnd handler',
		action: 'fixup',
		timestamp: Math.floor(Date.now() / 1000) - 300,
	},
	{
		hash: 'a1f5c3e',
		shortHash: 'a1f5c3e',
		message: "WIP: testing some ideas that didn't work",
		action: 'drop',
		timestamp: Math.floor(Date.now() / 1000) - 3600,
	},
	{
		hash: 'e2a4b9d',
		shortHash: 'e2a4b9d',
		message: 'docs: updated readme with better examples',
		action: 'reword',
		timestamp: Math.floor(Date.now() / 1000) - 7200,
	},
];

export const previewConflictFiles = [
	'src/components/SideNavBar.tsx',
	'src/styles/global.css',
	'package.json',
];

export const previewMergeOperation: MergeOperationStateDto = {
	type: 'merge',
	message: 'Merging feature/new-header into main',
	isRebaseInProgress: false,
	isMergeInProgress: true,
};

export const previewMergeFile = 'src/components/Navigation.tsx';

export const previewMergeVersions: FileVersionsDto = {
	base: `import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';

export const Nav = ({ user, theme }) => {
  return (
    <nav className="flex gap-4">
      <Button>Home</Button>
    </nav>
  );
};`,
	ours: `import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';

export const Nav = ({ user, theme }) => {
  return (
    <nav className="flex gap-4">
      <Button>Home</Button>
    </nav>
  );
};`,
	theirs: `import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';

export const NavigationBar = ({ context }) => {
  return (
    <nav className="flex gap-4">
      <Button>Home</Button>
    </nav>
  );
};`,
	working: '',
};

export const previewMergeRepoInfo: RepositoryInfoDto = {
	root: '/preview/repo',
	currentBranch: 'main',
	branches: [
		{ name: 'main', remote: false, current: true },
		{ name: 'feature/new-header', remote: false, current: false },
	],
	isRebaseInProgress: false,
	isMergeInProgress: true,
};
