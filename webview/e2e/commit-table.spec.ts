import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.resolve(__dirname, '../../media/screenshots');

test.describe('Git log commit table', () => {
	test('renders separate resizable columns with stacked author info', async ({ page }) => {
		await page.goto('/?preview=gitlog');
		await page.setViewportSize({ width: 1280, height: 800 });

		const header = page.getByTestId('commit-table-header');
		await expect(header).toBeVisible();

		await expect(page.getByTestId('commit-table-column-graph')).toContainText('Graph');
		await expect(page.getByTestId('commit-table-column-message')).toContainText('Message');
		await expect(page.getByTestId('commit-table-column-author')).toContainText('Author');
		await expect(page.getByTestId('commit-table-column-date')).toContainText('Date');

		await expect(
			page.getByTestId('commit-table-row').first().getByText(
				'feat: implement bento grid layout for dashboard',
			),
		).toBeVisible();

		const authorCell = page.getByTestId('commit-table-author-cell').first();
		await expect(authorCell).toContainText('Alex Rivera');
		await expect(authorCell).toContainText('alex.r@intelligit.dev');

		const graphBox = await page.getByTestId('commit-table-column-graph').boundingBox();
		const messageBox = await page.getByTestId('commit-table-column-message').boundingBox();
		const authorBox = await page.getByTestId('commit-table-column-author').boundingBox();
		const dateBox = await page.getByTestId('commit-table-column-date').boundingBox();

		expect(graphBox).not.toBeNull();
		expect(messageBox).not.toBeNull();
		expect(authorBox).not.toBeNull();
		expect(dateBox).not.toBeNull();

		// Columns must be left-to-right without overlapping.
		expect(graphBox!.x + graphBox!.width).toBeLessThanOrEqual(messageBox!.x + 2);
		expect(messageBox!.x + messageBox!.width).toBeLessThanOrEqual(authorBox!.x + 2);
		expect(authorBox!.x + authorBox!.width).toBeLessThanOrEqual(dateBox!.x + 2);

		const authorWidthBefore = authorBox!.width;
		const authorResizeHandle = page.getByRole('separator').nth(1);
		const handleBox = await authorResizeHandle.boundingBox();
		expect(handleBox).not.toBeNull();

		await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
		await page.mouse.down();
		await page.mouse.move(handleBox!.x + handleBox!.width / 2 + 40, handleBox!.y + handleBox!.height / 2);
		await page.mouse.up();

		const authorWidthAfter = (await page.getByTestId('commit-table-column-author').boundingBox())!
			.width;
		expect(authorWidthAfter).toBeGreaterThan(authorWidthBefore);

		const commitTable = page.getByTestId('commit-table');
		await commitTable.screenshot({
			path: path.join(screenshotDir, 'git-log-commit-table.png'),
		});

		await page.screenshot({
			path: path.join(screenshotDir, 'git-log-full.png'),
			fullPage: true,
		});
	});
});
