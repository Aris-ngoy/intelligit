import * as path from "node:path";
import * as vscode from "vscode";

import type { GitService } from "../git/gitService";

export const INTELLIGIT_GIT_SCHEME = "intelligit-git";

/** Virtual document provider: `intelligit-git://{ref}/{filePath}` */
export class GitContentProvider implements vscode.TextDocumentContentProvider {
	constructor(private readonly gitService: GitService) {}

	async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
		const ref = uri.authority;
		const filePath = uri.path.replace(/^\//, "");
		const folder = vscode.workspace.workspaceFolders?.[0];
		if (!folder || !ref || !filePath) {
			return "";
		}
		const repoRoot = await this.gitService.findRepositoryRoot(
			folder.uri.fsPath,
		);
		if (!repoRoot) {
			return "";
		}
		return this.gitService.getFileContent(repoRoot, ref, filePath);
	}
}

export function gitContentUri(ref: string, filePath: string): vscode.Uri {
	return vscode.Uri.parse(`${INTELLIGIT_GIT_SCHEME}://${ref}/${filePath}`);
}

export async function openCommitFileDiff(
	gitService: GitService,
	repoRoot: string,
	commitHash: string,
	filePath: string,
): Promise<void> {
	const parent = await gitService.getCommitParent(repoRoot, commitHash);
	const parentRef = parent ?? "0000000000000000000000000000000000000000";

	const left = gitContentUri(parentRef, filePath);
	const right = gitContentUri(commitHash, filePath);
	const title = `${filePath} (${commitHash.slice(0, 7)})`;

	await vscode.commands.executeCommand("vscode.diff", left, right, title, {
		preview: true,
	});
}

export async function openWorkingTreeFileDiff(
	repoRoot: string,
	filePath: string,
	kind: "staged" | "unstaged",
): Promise<void> {
	const workingUri = vscode.Uri.file(path.join(repoRoot, filePath));

	if (kind === "staged") {
		const left = gitContentUri("HEAD", filePath);
		const right = gitContentUri("index", filePath);
		await vscode.commands.executeCommand(
			"vscode.diff",
			left,
			right,
			`${filePath} (staged)`,
			{ preview: true },
		);
		return;
	}

	const left = gitContentUri("index", filePath);
	await vscode.commands.executeCommand(
		"vscode.diff",
		left,
		workingUri,
		`${filePath} (working tree)`,
		{ preview: true },
	);
}
