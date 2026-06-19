import type { CommitDto, CommitFileDto, RepositoryInfoDto } from '../shared/types';

const now = Math.floor(Date.now() / 1000);

export const previewRepoInfo: RepositoryInfoDto = {
	root: '/Users/demo/intelligit',
	currentBranch: 'main',
	isRebaseInProgress: false,
	isMergeInProgress: false,
	branches: [
		{ name: 'main', remote: false, current: true },
		{ name: 'feature/auth-provider', remote: false, current: false },
		{ name: 'bugfix/ui-layout', remote: false, current: false },
		{ name: 'origin/main', remote: true, current: false },
		{ name: 'origin/staging', remote: true, current: false },
	],
};

export const previewCommits: CommitDto[] = [
	{
		hash: '7f3a2c81a1b2c3d4e5f678901234567890123456',
		shortHash: '7f3a2c81',
		parentHashes: ['abc123'],
		author: 'Alex Rivera',
		authorEmail: 'alex.r@intelligit.dev',
		timestamp: now - 120,
		subject: 'feat: implement bento grid layout for dashboard',
		body: '',
		refs: ['main', 'origin/main'],
		graphLane: 0,
	},
	{
		hash: 'a1b2c3d4e5f6789012345678901234567890abcd',
		shortHash: 'a1b2c3d',
		parentHashes: ['def456'],
		author: 'Alex Rivera',
		authorEmail: 'alex.r@intelligit.dev',
		timestamp: now - 2700,
		subject: 'fix: resolve css variable collision in dark mode',
		body: '',
		refs: [],
		graphLane: 0,
	},
	{
		hash: 'b2c3d4e5f6789012345678901234567890abcdef1',
		shortHash: 'b2c3d4e',
		parentHashes: ['ghi789'],
		author: 'Sarah Chen',
		authorEmail: 'sarah.c@intelligit.dev',
		timestamp: now - 7200,
		subject: 'merge: pull request #12 from bugfix/ui-layout',
		body: '',
		refs: [],
		graphLane: 0,
		graphConnections: [{ fromLane: 1, toLane: 0, type: 'merge' }],
	},
	{
		hash: 'c3d4e5f6789012345678901234567890abcdef1234',
		shortHash: 'c3d4e5f',
		parentHashes: ['jkl012'],
		author: 'Sarah Chen',
		authorEmail: 'sarah.c@intelligit.dev',
		timestamp: now - 10800,
		subject: 'chore: update dependency versions',
		body: '',
		refs: ['feature/auth'],
		graphLane: 1,
	},
	{
		hash: 'd4e5f6789012345678901234567890abcdef123456',
		shortHash: 'd4e5f67',
		parentHashes: ['mno345'],
		author: 'Alex Rivera',
		authorEmail: 'alex.r@intelligit.dev',
		timestamp: now - 86400,
		subject: 'docs: update readme with installation guide',
		body: '',
		refs: [],
		graphLane: 0,
	},
];

export const previewCommitFiles: Record<string, CommitFileDto[]> = {
	'7f3a2c81a1b2c3d4e5f678901234567890123456': [
		{ path: 'src/components/DashboardGrid.tsx', status: 'A' },
		{ path: 'src/styles/grid.css', status: 'M' },
		{ path: 'src/App.tsx', status: 'M' },
		{ path: 'src/legacy/OldLayout.tsx', status: 'D' },
	],
};

export const previewAuthors = ['Alex Rivera', 'Sarah Chen'];
