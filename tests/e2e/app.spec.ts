import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');

test('one-click demo opens a populated, resettable review', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page).toHaveTitle('Demo — Catalog Reconciler');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Review before you import' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show Collision rows' }).getByText('2')).toBeVisible();

  await page.getByRole('button', { name: 'Show Added rows' }).click();
  await expect(page.getByRole('rowheader', { name: 'HB-004' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('button', { name: 'Show Collision rows' }).getByText('2')).toBeVisible();

  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toHaveCount(0);
  await expect(page.getByText('Current catalog')).toBeVisible();
});

test('invalid input explains the repair and accepts a replacement', async ({ page }) => {
  await page.goto('/');
  await page.locator('#current-file').setInputFiles({ name: 'broken.csv', mimeType: 'text/csv', buffer: Buffer.from('id,name\n') });
  await expect(page.getByRole('alert')).toContainText('header row and at least one item row');
  await page.locator('#current-file').setInputFiles({ name: 'current.csv', mimeType: 'text/csv', buffer: Buffer.from('id,name\n1,Vase') });
  await expect(page.getByText('current.csv')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('routes have titles, focus restoration, and a designed not-found screen', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Privacy' }).first().click();
  await expect(page).toHaveTitle('Privacy — Catalog Reconciler');
  await expect(page.locator('h1')).toBeFocused();
  await page.goBack();
  await expect(page).toHaveTitle('Catalog Reconciler — compare catalog imports');
  await expect(page.locator('h1')).toBeFocused();
  await page.goto('/not-a-real-page');
  await expect(page).toHaveTitle('Page not found — Catalog Reconciler');
  await expect(page.getByRole('heading', { level: 1, name: 'Return to your catalog check' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Check my files/ })).toBeVisible();
});

test('route metadata and original image assets resolve with the declared sizes', async ({ page, request }) => {
  const routes = [
    ['/', 'https://collection-import-reconciler.sociobot.in/'],
    ['/demo', 'https://collection-import-reconciler.sociobot.in/demo'],
    ['/privacy', 'https://collection-import-reconciler.sociobot.in/privacy'],
    ['/terms', 'https://collection-import-reconciler.sociobot.in/terms'],
  ] as const;
  for (const [path, canonical] of routes) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', await page.title());
    await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', /\S+/);
  }
  const social = await request.get('/assets/catalog-reconciler-social.jpg');
  const touch = await request.get('/apple-touch-icon.png');
  expect(social.ok()).toBe(true);
  expect(touch.ok()).toBe(true);
  const sizes = await page.evaluate(async () => {
    const load = (src: string) => new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = reject;
      image.src = src;
    });
    return { social: await load('/assets/catalog-reconciler-social.jpg'), touch: await load('/apple-touch-icon.png') };
  });
  expect(sizes.social).toEqual({ width: 1200, height: 630 });
  expect(sizes.touch).toEqual({ width: 180, height: 180 });
});

test('all public routes have no serious accessibility violations', async ({ page }) => {
  for (const path of ['/', '/demo', '/privacy', '/terms', '/404', '/404.html']) {
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

test('keyboard and reduced-motion paths work on a narrow screen', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('link', { name: /Check my files/ }).first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#workspace')).toBeInViewport();
  for (let index = 0; index < 12 && !(await page.locator('#current-file').evaluate((element) => element === document.activeElement)); index += 1) {
    await page.keyboard.press('Tab');
  }
  await expect(page.locator('#current-file')).toBeFocused();
  const transitionSeconds = await page.locator('.button').first().evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration));
  expect(transitionSeconds).toBeLessThan(0.001);
  const width = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  expect(width.content).toBe(width.viewport);
});
