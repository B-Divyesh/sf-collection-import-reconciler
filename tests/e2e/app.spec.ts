import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');

test('example completes a real reconciliation and exports safely', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await page.getByRole('button', { name: 'Try a safe example' }).click();
  await page.getByRole('button', { name: /Map identifiers/ }).click();
  await page.getByRole('button', { name: /Review differences/ }).click();
  await expect(page.getByText('Review before you import')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show Collision rows' }).getByText('2')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export reviewed CSV' }).click();
  expect((await download).suggestedFilename()).toBe('homebox-import-reviewed.csv');
  expect(consoleErrors).toEqual([]);
});

test('home and legal pages have no serious accessibility violations', async ({ page }) => {
  for (const path of ['/', '/privacy', '/terms']) {
    await page.goto(path);
    await page.addScriptTag({ path: axePath });
    const results = await page.evaluate(async () => {
      const axe = (window as unknown as { axe: { run: (options: unknown) => Promise<{ violations: Array<{ impact: string | null; id: string }> }> } }).axe;
      return axe.run({ runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
    });
    const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
    expect(serious, serious.map((item) => item.id).join(', ')).toEqual([]);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
  }
});

test('keyboard path reaches the primary file controls on mobile', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Check my files/ }).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.locator('#current-file')).toBeFocused();
  await expect(page.locator('body')).toHaveCSS('overflow-x', 'visible');
});
