import type {
	CommitDto,
	CommitFileDto,
	RepositoryInfoDto,
} from "../shared/types";

const now = Math.floor(Date.now() / 1000);

export const previewRepoInfo: RepositoryInfoDto = {
	root: "/Users/demo/intelligit",
	currentBranch: "main",
	isRebaseInProgress: false,
	isMergeInProgress: false,
	conflictFileCount: 0,
	branches: [
		{ name: "main", remote: false, current: true },
		{ name: "feature/login", remote: false, current: false },
		{ name: "origin/main", remote: true, current: false },
	],
};

/** Classic main + feature branch merge scenario (matches reference graph layout). */
export const previewCommits: CommitDto[] = [
	{
		hash: "aaa1111111111111111111111111111111111111111",
		shortHash: "aaa1111",
		parentHashes: ["bbb2222222222222222222222222222222222222222"],
		author: "Alex Rivera",
		authorEmail: "alex.r@intelligit.dev",
		timestamp: now - 120,
		subject: "Update readme",
		body: "",
		refs: ["main", "origin/main"],
		graphLane: 0,
	},
	{
		hash: "bbb2222222222222222222222222222222222222222",
		shortHash: "bbb2222",
		parentHashes: [
			"ccc3333333333333333333333333333333333333333",
			"fff6666666666666666666666666666666666666666",
		],
		author: "Sarah Chen",
		authorEmail: "sarah.c@intelligit.dev",
		timestamp: now - 3600,
		subject: "Merge feature/login",
		body: "",
		refs: [],
		graphLane: 0,
		graphConnections: [{ fromLane: 0, toLane: 1, type: "merge" }],
	},
	{
		hash: "fff6666666666666666666666666666666666666666",
		shortHash: "fff6666",
		parentHashes: ["eee5555555555555555555555555555555555555555"],
		author: "Sarah Chen",
		authorEmail: "sarah.c@intelligit.dev",
		timestamp: now - 7200,
		subject: "Fix validation",
		body: "",
		refs: ["feature/login"],
		graphLane: 1,
	},
	{
		hash: "eee5555555555555555555555555555555555555555",
		shortHash: "eee5555",
		parentHashes: ["ddd4444444444444444444444444444444444444444"],
		author: "Sarah Chen",
		authorEmail: "sarah.c@intelligit.dev",
		timestamp: now - 10800,
		subject: "Add login form",
		body: "",
		refs: [],
		graphLane: 1,
	},
	{
		hash: "ddd4444444444444444444444444444444444444444",
		shortHash: "ddd4444",
		parentHashes: ["ccc3333333333333333333333333333333333333333"],
		author: "Alex Rivera",
		authorEmail: "alex.r@intelligit.dev",
		timestamp: now - 86400,
		subject: "Branch created",
		body: "",
		refs: [],
		graphLane: 0,
		graphConnections: [{ fromLane: 0, toLane: 1, type: "normal" }],
	},
	{
		hash: "ccc3333333333333333333333333333333333333333",
		shortHash: "ccc3333",
		parentHashes: [],
		author: "Alex Rivera",
		authorEmail: "alex.r@intelligit.dev",
		timestamp: now - 172800,
		subject: "Initial commit",
		body: "",
		refs: [],
		graphLane: 0,
	},
];

export const previewCommitFiles: Record<string, CommitFileDto[]> = {
	aaa1111111111111111111111111111111111111111: [
		{ path: "README.md", status: "M" },
	],
};

export const previewAuthors = ["Alex Rivera", "Sarah Chen"];
