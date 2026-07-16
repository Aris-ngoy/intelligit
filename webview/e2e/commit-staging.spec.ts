import { expect, test } from "@playwright/test";

async function openCommitPreview(page: import("@playwright/test").Page) {
	await page.goto("/?preview=commit");
	await page.setViewportSize({ width: 900, height: 900 });
	await expect(page.getByText("Describe your changes")).toBeVisible();
}

test.describe("Commit panel staging", () => {
	test.beforeEach(async ({ page }) => {
		await openCommitPreview(page);
	});

	test("shows staged and unstaged files with bulk actions", async ({
		page,
	}) => {
		await expect(page.getByText("Staged (3)")).toBeVisible();
		await expect(page.getByText("Not staged (2)")).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Stage all", exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Unstage all", exact: true }),
		).toBeVisible();
	});

	test("stage all moves unstaged files into staged list", async ({ page }) => {
		await page.getByRole("button", { name: "Stage all", exact: true }).click();
		await expect(page.getByText("Staged (5)")).toBeVisible();
		await expect(page.getByText("Not staged (2)")).not.toBeVisible();
	});

	test("unstage all clears staged files", async ({ page }) => {
		await page
			.getByRole("button", { name: "Unstage all", exact: true })
			.click();
		await expect(page.getByText("Staged (0)")).toBeVisible();
		await expect(page.getByText("Not staged (5)")).toBeVisible();
	});

	test("stage and unstage a single file", async ({ page }) => {
		await page
			.getByRole("button", { name: "Stage file", exact: true })
			.first()
			.click();
		await expect(page.getByText("Staged (4)")).toBeVisible();
		await expect(page.getByText("Not staged (1)")).toBeVisible();

		await page
			.getByRole("button", { name: "Unstage file", exact: true })
			.last()
			.click();
		await expect(page.getByText("Staged (3)")).toBeVisible();
		await expect(page.getByText("Not staged (2)")).toBeVisible();
	});

	test("clicking a file requests a diff without error", async ({ page }) => {
		await page
			.getByRole("button", { name: /View staged diff for/ })
			.first()
			.click();
		await expect(page.getByText("Describe your changes")).toBeVisible();
	});

	test("commit shows live pre-commit hook output", async ({ page }) => {
		await page
			.getByPlaceholder(/Short summary on the first line/)
			.fill("feat: preview commit with hooks");
		await page.getByRole("button", { name: "Save changes" }).click();

		await expect(page.getByText("Git output")).toBeVisible();
		await expect(
			page.getByText(/Running commit \(including pre-commit hooks\)/),
		).toBeVisible();
		await expect(page.getByText(/husky - pre-commit/)).toBeVisible();
		await expect(page.getByText(/lint-staged passed/)).toBeVisible();
		await expect(page.getByText("Staged (0)")).toBeVisible({
			timeout: 5_000,
		});
	});
});
