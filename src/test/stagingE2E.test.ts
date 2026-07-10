import * as assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { GitService } from "../git";

const git = new GitService();

async function makeRepo(): Promise<string> {
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), "intelligit-staging-"));
	await git.exec(dir, ["init", "-b", "main"]);
	await git.exec(dir, ["config", "user.email", "e2e@test.dev"]);
	await git.exec(dir, ["config", "user.name", "E2E Tester"]);
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

suite("Staging E2E (real git)", () => {
	test("stage one, stage all, unstage one, unstage all", async () => {
		const dir = await makeRepo();
		try {
			await writeAndCommit(dir, "one.txt", "one\n", "add one");
			await writeAndCommit(dir, "two.txt", "two\n", "add two");
			await writeAndCommit(dir, "three.txt", "three\n", "add three");

			await fs.writeFile(path.join(dir, "one.txt"), "one\nchanged\n", "utf8");
			await fs.writeFile(path.join(dir, "two.txt"), "two\nchanged\n", "utf8");
			await fs.writeFile(
				path.join(dir, "three.txt"),
				"three\nchanged\n",
				"utf8",
			);

			await git.stageFile(dir, "one.txt");
			let status = await git.getWorkingTreeStatus(dir);
			assert.deepEqual(
				status.staged.map((file) => file.path),
				["one.txt"],
			);
			assert.deepEqual(status.unstaged.map((file) => file.path).sort(), [
				"three.txt",
				"two.txt",
			]);

			await git.stageAll(dir);
			status = await git.getWorkingTreeStatus(dir);
			assert.equal(status.staged.length, 3);
			assert.equal(status.unstaged.length, 0);
			assert.equal(status.hasStagedChanges, true);

			await git.unstageFile(dir, "two.txt");
			status = await git.getWorkingTreeStatus(dir);
			assert.deepEqual(status.staged.map((file) => file.path).sort(), [
				"one.txt",
				"three.txt",
			]);
			assert.deepEqual(
				status.unstaged.map((file) => file.path),
				["two.txt"],
			);

			await git.unstageAll(dir);
			status = await git.getWorkingTreeStatus(dir);
			assert.equal(status.staged.length, 0);
			assert.equal(status.unstaged.length, 3);
			assert.equal(status.hasStagedChanges, false);
		} finally {
			await fs.rm(dir, { recursive: true, force: true });
		}
	});
});
