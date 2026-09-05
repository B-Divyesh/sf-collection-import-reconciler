import { expect, test, type Download, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sample = (name: string) => path.join(root, 'public', 'samples', name);

async function openDemo(page: Page): Promise<void> {
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Review before you import' })).toBeVisible();
}

async function returnToFiles(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Adjust mapping' }).click();
  await page.getByRole('button', { name: 'Back to files' }).click();
}

async function loadPair(page: Page, current: string, incoming: string): Promise<void> {
  await returnToFiles(page);
  await page.locator('#current-file').setInputFiles(sample(current));
  await page.locator('#incoming-file').setInputFiles(sample(incoming));
  await page.getByRole('button', { name: /Map identifiers/ }).click();
  await page.getByRole('button', { name: /Review differences/ }).click();
}

async function downloadText(download: Download): Promise<string> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

test('@claim:csv-input reads CSV catalog files and compares their rows', async ({ page }) => {
  await openDemo(page);
  await loadPair(page, 'current-catalog.csv', 'incoming-catalog.csv');
  await expect(page.getByRole('button', { name: 'Show Changed rows' }).getByText('1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show Collision rows' }).getByText('2')).toBeVisible();
});

test('@claim:json-input reads JSON catalog files and compares their rows', async ({ page }) => {
  await openDemo(page);
  await loadPair(page, 'current-catalog.json', 'incoming-catalog.json');
  await expect(page.getByRole('button', { name: 'Show Added rows' }).getByText('1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show Missing rows' }).getByText('1')).toBeVisible();
});

test('@claim:identifier-normalization supports exact, case-folded, and numeric matching without changing export values', async ({ page }) => {
  await openDemo(page);
  await returnToFiles(page);
  await page.locator('#current-file').setInputFiles(sample('normalization-current.csv'));
  await page.locator('#incoming-file').setInputFiles(sample('normalization-incoming.csv'));
  await page.getByRole('button', { name: /Map identifiers/ }).click();

  await page.getByRole('radio', { name: /Exact/ }).check();
  await page.getByRole('button', { name: /Review differences/ }).click();
  await expect(page.getByRole('button', { name: 'Show Added rows' }).getByText('2')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show Missing rows' }).getByText('2')).toBeVisible();

  await page.getByRole('button', { name: 'Adjust mapping' }).click();
  await page.getByRole('radio', { name: /Trim \+ case-fold/ }).check();
  await page.getByRole('button', { name: /Review differences/ }).click();
  await expect(page.getByRole('button', { name: 'Show Added rows' }).getByText('1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show Missing rows' }).getByText('1')).toBeVisible();

  await page.getByRole('button', { name: 'Adjust mapping' }).click();
  await page.getByRole('radio', { name: /Numeric/ }).check();
  await page.getByRole('button', { name: /Review differences/ }).click();
  await expect(page.getByRole('button', { name: 'Show Added rows' }).getByText('0')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show Missing rows' }).getByText('0')).toBeVisible();
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export reviewed CSV' }).click();
  const csv = await downloadText(await event);
  expect(csv).toContain(' abc ,Blue vase');
  expect(csv).toContain('12,Film camera');
});

test('@claim:local-processing keeps the complete demo flow on the product origin', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openDemo(page);
  await page.getByRole('button', { name: 'Show Changed rows' }).click();
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export reviewed CSV' }).click();
  await event;
  const productOrigin = new URL(page.url()).origin;
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every((url) => new URL(url).origin === productOrigin)).toBe(true);
});

test('@claim:offline-reload reloads the populated demo without a network connection', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await openDemo(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
  });
  await page.waitForFunction(async () => {
    if (navigator.serviceWorker.controller?.state !== 'activated') return false;
    const cachedRequests = (await Promise.all((await caches.keys()).map(async (key) => (await caches.open(key)).keys()))).flat();
    return cachedRequests.some((request) => request.url.endsWith('.js')) && cachedRequests.some((request) => request.url.endsWith('.css'));
  });
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show Collision rows' }).getByText('2')).toBeVisible();
  await context.close();
});

test('@claim:risk-report reports collisions, changes, missing items, blank IDs, and field loss', async ({ page }) => {
  await openDemo(page);
  await expect(page.getByRole('button', { name: 'Show Added rows' }).getByText('1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show Changed rows' }).getByText('1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show Missing rows' }).getByText('1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show Collision rows' }).getByText('2')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show Needs ID rows' }).getByText('1')).toBeVisible();
  await expect(page.getByText('1 current field is not mapped')).toBeVisible();
});

test('@claim:reviewed-export exports safe rows and excludes blocked or missing rows', async ({ page }) => {
  await openDemo(page);
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export reviewed CSV' }).click();
  const download = await event;
  expect(download.suggestedFilename()).toBe('homebox-import-reviewed.csv');
  const csv = await downloadText(download);
  const rows = csv.trim().split(/\r?\n/);
  expect(rows).toHaveLength(3);
  expect(csv).toContain('hb-001,Blue vase,Living room');
  expect(csv).toContain('HB-004,Brass compass,Desk');
  expect(csv).not.toContain('Duplicate row');
  expect(csv).not.toContain('Unnumbered print');
  expect(csv).not.toContain('HB-003');
});

test('@claim:formula-neutralization neutralizes formula prefixes in the downloaded CSV', async ({ page }) => {
  await openDemo(page);
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export reviewed CSV' }).click();
  const csv = await downloadText(await event);
  expect(csv).toContain("'=2+2");
  expect(csv).not.toMatch(/,=2\+2(?:\r?\n|$)/);
});

test('@claim:free-core completes comparison and export without a license gate', async ({ page }) => {
  await openDemo(page);
  await expect(page.getByText(/license|payment|checkout/i)).toHaveCount(0);
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export reviewed CSV' }).click();
  expect((await event).suggestedFilename()).toBe('homebox-import-reviewed.csv');
});

test('@claim:no-account completes the demo in a fresh browser context without signing in', async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await openDemo(page);
  await expect(page.getByRole('button', { name: 'Export reviewed CSV' })).toBeEnabled();
  await expect(page.getByRole('link', { name: /sign|log in|account/i })).toHaveCount(0);
  await context.close();
});

test('@claim:demo-isolation resets sample changes and leaves real storage untouched', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cr:real-catalog-marker', 'keep'));
  await openDemo(page);
  const before = await page.evaluate(() => ({ ...localStorage }));
  await page.getByRole('button', { name: 'Show Added rows' }).click();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('button', { name: 'Show Collision rows' }).getByText('2')).toBeVisible();
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(before);
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page.getByText('Current catalog')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('cr:real-catalog-marker'))).toBe('keep');
});

test('@claim:memory-reset clears an active real comparison on reload', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('link', { name: 'Start for real' }).click();
  await page.locator('#current-file').setInputFiles(sample('current-catalog.csv'));
  await page.locator('#incoming-file').setInputFiles(sample('incoming-catalog.csv'));
  await expect(page.getByText('current-catalog.csv')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Current catalog')).toBeVisible();
  await expect(page.getByText('current-catalog.csv')).toHaveCount(0);
});

test('@claim:file-size-limit rejects a file over 25 MB and recovers with a valid file', async ({ page }) => {
  await openDemo(page);
  await returnToFiles(page);
  await page.locator('#current-file').setInputFiles({ name: 'too-large.csv', mimeType: 'text/csv', buffer: Buffer.alloc(25 * 1024 * 1024 + 1, 65) });
  await expect(page.getByRole('alert')).toContainText('over 25 MB');
  await page.locator('#current-file').setInputFiles(sample('current-catalog.csv'));
  await expect(page.getByText('current-catalog.csv')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
