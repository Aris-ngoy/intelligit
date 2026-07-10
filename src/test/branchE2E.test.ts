import * as assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { GitService } from "../git";

const git = new GitService();

async function makeRepo(): Promise<string> {
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), "intelligit-branch-"));
	await git.exec(dir, ["init", "-b", "main"]);
	await git.exec(dir, ["config", "user.email", "branch@test.dev"]);
	await git.exec(dir, ["config", "user.name", "Branch Tester"]);
	await git.exec(dir, ["config", "commit.gpgsign", "false"]);
	return dir;
}

async function writeAndCommit(
	dir: string,
	file: string,
	content: string,
	message: string,
): Promise<void> {
	await fs.writeFile(path.join(dir, file), content, "utf8");
	await git.exec(dir, ["add", "--", file]);
	await git.exec(dir, ["commit", "-m", message]);
}

suite("Branch operations E2E (real git)", () => {
	test("createBranch checks out new branch by default", async () => {
		const dir = await makeRepo();
		try {
			await writeAndCommit(dir, "readme.txt", "hello\n", "initial");

			await git.createBranch(dir, "feature/ui", { checkout: true });

			const info = await git.getRepositoryInfo(dir);
			assert.equal(info.currentBranch, "feature/ui");
			assert.ok(info.branches.some((branch) => branch.name === "feature/ui"));
		} finally {
			await fs.rm(dir, { recursive: true, force: true });
		}
	});

	test("createBranch without checkout keeps current branch", async () => {
		const dir = await makeRepo();
		try {
			await writeAndCommit(dir, "readme.txt", "hello\n", "initial");

			await git.createBranch(dir, "feature/docs", { checkout: false });

			const info = await git.getRepositoryInfo(dir);
			assert.equal(info.currentBranch, "main");
			assert.ok(info.branches.some((branch) => branch.name === "feature/docs"));
		} finally {
			await fs.rm(dir, { recursive: true, force: true });
		}
	});

	test("checkoutBranch switches between local branches", async () => {
		const dir = await makeRepo();
		try {
			await writeAndCommit(dir, "readme.txt", "hello\n", "initial");
			await git.createBranch(dir, "feature/auth", { checkout: true });
			await writeAndCommit(dir, "auth.txt", "token\n", "auth work");

			const branches = (await git.getRepositoryInfo(dir)).branches;
			await git.checkoutBranch(dir, "main", branches);

			const info = await git.getRepositoryInfo(dir);
			assert.equal(info.currentBranch, "main");
		} finally {
			await fs.rm(dir, { recursive: true, force: true });
		}
	});

	test("wouldCheckoutOverwriteChanges detects conflicting local edits", async () => {
		const dir = await makeRepo();
		try {
			await writeAndCommit(dir, "shared.txt", "base\n", "initial");
			await git.createBranch(dir, "feature/a", { checkout: true });
			await writeAndCommit(dir, "shared.txt", "feature\n", "feature edit");
			await git.exec(dir, ["checkout", "main"]);
			await writeAndCommit(dir, "shared.txt", "main\n", "main edit");
			await git.exec(dir, ["checkout", "feature/a"]);

			await fs.writeFile(path.join(dir, "shared.txt"), "local edit\n", "utf8");

			const wouldOverwrite = await git.wouldCheckoutOverwriteChanges(
				dir,
				"main",
			);
			assert.equal(wouldOverwrite, true);
		} finally {
			await fs.rm(dir, { recursive: true, force: true });
		}
	});

	test("stashPush allows switching after stashing conflicting edits", async () => {
		const dir = await makeRepo();
		try {
			await writeAndCommit(dir, "shared.txt", "base\n", "initial");
			await git.createBranch(dir, "feature/b", { checkout: true });
			await writeAndCommit(dir, "shared.txt", "feature\n", "feature edit");
			await git.exec(dir, ["checkout", "main"]);
			await writeAndCommit(dir, "shared.txt", "main\n", "main edit");
			await git.exec(dir, ["checkout", "feature/b"]);

			await fs.writeFile(path.join(dir, "shared.txt"), "local edit\n", "utf8");
			await git.stashPush(dir, "before switch");

			const branches = (await git.getRepositoryInfo(dir)).branches;
			await git.checkoutBranch(dir, "main", branches);

			const info = await git.getRepositoryInfo(dir);
			assert.equal(info.currentBranch, "main");
			const stashes = await git.listStashes(dir);
			assert.equal(stashes.length, 1);
		} finally {
			await fs.rm(dir, { recursive: true, force: true });
		}
	});
});
