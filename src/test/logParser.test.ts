import * as assert from "node:assert/strict";

import {
	formatCommitDate,
	GIT_LOG_FIELD_SEP,
	GIT_LOG_RECORD_SEP,
	parseGitLog,
	parseRefs,
} from "../git/logParser";

suite("Git Log Parser", () => {
	test("parses a single commit record", () => {
		const record = [
			"abc123def4567890123456789012345678901234",
			"abc123d",
			"parent1 parent2",
			"Jane Doe",
			"jane@example.com",
			"1700000000",
			"Fix login bug",
			"HEAD -> main, origin/main",
			"Detailed body line",
		].join(GIT_LOG_FIELD_SEP);

		const raw = record + GIT_LOG_RECORD_SEP;
		const result = parseGitLog(raw);

		assert.equal(result.commits.length, 1);
		const commit = result.commits[0];
		assert.ok(commit);
		assert.equal(commit.hash, "abc123def4567890123456789012345678901234");
		assert.equal(commit.shortHash, "abc123d");
		assert.deepEqual(commit.parentHashes, ["parent1", "parent2"]);
		assert.equal(commit.author, "Jane Doe");
		assert.equal(commit.subject, "Fix login bug");
		assert.equal(commit.body, "Detailed body line");
		assert.deepEqual(commit.refs, ["main", "origin/main"]);
		assert.equal(result.authors[0], "Jane Doe");
	});

	test("parseRefs normalizes HEAD and tag prefixes", () => {
		assert.deepEqual(parseRefs("HEAD -> feature/x, tag: v2.0"), [
			"feature/x",
			"v2.0",
		]);
	});

	test("assigns graph lanes for linear history", () => {
		const makeRecord = (hash: string, parent: string) =>
			[
				hash,
				hash.slice(0, 7),
				parent,
				"A",
				"a@b.c",
				"1700000000",
				"msg",
				"",
				"",
			].join(GIT_LOG_FIELD_SEP) + GIT_LOG_RECORD_SEP;

		const raw =
			makeRecord(
				"cccccccccccccccccccccccccccccccccccccccc",
				"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
			) +
			makeRecord(
				"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
				"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			) +
			makeRecord("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "");

		const { commits } = parseGitLog(raw);
		assert.equal(commits[0]?.graphLane, 0);
		assert.equal(commits[1]?.graphLane, 0);
		assert.equal(commits[2]?.graphLane, 0);
	});

	test("keeps default branch on the leftmost lane", () => {
		const makeRecord = (hash: string, parent: string, refs: string) =>
			[
				hash,
				hash.slice(0, 7),
				parent,
				"A",
				"a@b.c",
				"1700000000",
				"msg",
				refs,
				"",
			].join(GIT_LOG_FIELD_SEP) + GIT_LOG_RECORD_SEP;

		const raw =
			makeRecord(
				"cccccccccccccccccccccccccccccccccccccccc",
				"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
				"HEAD -> main",
			) +
			makeRecord(
				"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
				"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
				"feature/x",
			) +
			makeRecord("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "", "");

		const { commits } = parseGitLog(raw, "main");
		const mainTip = commits.find((c) => c.refs.includes("main"));
		assert.ok(mainTip);
		assert.equal(mainTip?.graphLane, 0);
	});

	test("formatCommitDate uses Today for same-day commits", () => {
		const now = new Date(2026, 5, 19, 15, 30, 0); // June 19, 2026
		const todayTs = Math.floor(
			new Date(2026, 5, 19, 9, 15, 0).getTime() / 1000,
		);
		assert.equal(formatCommitDate(todayTs, now), "Today, 09:15");
	});

	test("formatCommitDate uses DD.MM.YYYY for older commits", () => {
		const now = new Date(2026, 5, 19, 15, 30, 0);
		const oldTs = Math.floor(new Date(2025, 0, 5, 14, 45, 0).getTime() / 1000);
		assert.equal(formatCommitDate(oldTs, now), "05.01.2025 14:45");
	});
});
