import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';

const url = process.argv[2];
const browser = await chromium.launch();
const context = await browser.newContext({ bypassCSP: true });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(String(error)));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

const response = await page.goto(url, { waitUntil: 'networkidle' });
const require = createRequire(import.meta.url);
await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
const report = await page.evaluate(async () => {
  const result = await window.axe.run({ runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
  return {
    title: document.title,
    lang: document.documentElement.lang,
    h1: document.querySelectorAll('h1').length,
    main: document.querySelectorAll('main').length,
    imagesMissingAlt: [...document.images].filter((image) => !image.hasAttribute('alt')).length,
    seriousAxeFindings: result.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')).map((item) => item.id),
  };
});

const result = { url, status: response?.status(), errors, ...report };
console.log(JSON.stringify(result, null, 2));
await browser.close();

if (result.status !== 200 || !result.title || !result.lang || result.h1 !== 1 || result.main !== 1 || result.imagesMissingAlt || result.seriousAxeFindings.length || errors.length) {
  process.exit(1);
}
