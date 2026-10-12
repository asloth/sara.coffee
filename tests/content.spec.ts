import { expect, test } from '@playwright/test';
import { rideTo } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test('departure: the name is real text on the first screen', async ({ page }) => {
  const name = page.locator('#departure-title');
  await expect(name).toBeInViewport({ ratio: 1 });
  expect((await name.textContent())?.trim().length).toBeGreaterThan(0);
  await expect(page.locator('#departure .role')).toBeVisible();
});

test('about: the bio is selectable text', async ({ page }) => {
  await rideTo(page, 1);
  const para = page.locator('#about .poster p:not(.kicker)').first();
  await expect(para).toBeInViewport();
  const selected = await para.evaluate((p) => {
    const r = document.createRange();
    r.selectNodeContents(p);
    const sel = getSelection()!;
    sel.removeAllRanges();
    sel.addRange(r);
    return sel.toString();
  });
  expect(selected.length).toBeGreaterThan(10);
  expect(await para.evaluate((p) => getComputedStyle(p).userSelect)).not.toBe('none');
});

test('work: a poster opens its project over the train and closing puts everything back', async ({ page }) => {
  await rideTo(page, 2);
  const scrollBefore = await page.evaluate(() => scrollY);
  const poster = page.locator('a[data-project]').first();
  const href = await poster.getAttribute('href');
  // the posters sway on their straps, so they never count as "stable" for a normal click
  await poster.click({ force: true });
  const dialog = page.locator('[data-project-dialog]');
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(dialog.locator('#project-title')).toHaveText(/Placeholder project/);
  await expect(dialog.locator('.facts')).toContainText('Role');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/#work$/);
  await expect(poster).toBeFocused();
  await page.waitForTimeout(300);
  expect(Math.abs((await page.evaluate(() => scrollY)) - scrollBefore)).toBeLessThan(2);
});

test('work: the back button closes the project', async ({ page }) => {
  await rideTo(page, 2);
  await page.locator('a[data-project]').first().click({ force: true });
  await expect(page.locator('[data-project-dialog]')).toBeVisible();
  await page.goBack();
  await expect(page.locator('[data-project-dialog]')).toBeHidden();
  await expect(page).toHaveURL(/\/#work$/);
});

test('work: every project has its own page', async ({ page }) => {
  const hrefs = await page.locator('a[data-project]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    await page.goto(href);
    await expect(page.locator('#project-title')).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to the train/ })).toHaveAttribute('href', '/#work');
  }
});

test('experience: stops are in date order', async ({ page }) => {
  await rideTo(page, 3);
  const starts = await page.locator('#experience .stop time:first-of-type').evaluateAll((ts) => ts.map((t) => t.getAttribute('datetime')!));
  expect(starts.length).toBeGreaterThan(0);
  expect([...starts].sort()).toEqual(starts);
});

test('last stop: every contact link goes somewhere real', async ({ page }) => {
  await rideTo(page, 4);
  const links = await page.locator('#contact a').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
  expect(links.some((h) => h.startsWith('mailto:') && h.includes('@'))).toBe(true);
  for (const h of links) expect(h).toMatch(/^(mailto:\S+@\S+|https:\/\/\S+|\/\S+)/);
  await expect(page.locator('#contact .mail')).toBeInViewport();
});
