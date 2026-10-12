import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { journeyState, rideTo } from './helpers';

const IDS = ['departure', 'about', 'work', 'experience', 'contact'];

test('the route map is an accessible navigation landmark', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const nav = page.getByRole('navigation', { name: 'Route map' });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link')).toHaveCount(5);
  await expect(nav.locator('[aria-current="location"]')).toHaveCount(1);
  for (let i = 0; i <= 4; i++) {
    await rideTo(page, i);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
  }
});

test('clicking a stop rides there, updates the address and focuses the station', async ({ page }) => {
  await page.goto('/?debug');
  await page.waitForLoadState('networkidle');
  await page.getByRole('navigation', { name: 'Route map' }).getByRole('link', { name: /Experience/ }).click();
  await expect(page).toHaveURL(/#experience$/);
  await expect.poll(async () => (await journeyState(page)).station, { timeout: 5000 }).toBe(3);
  await expect.poll(async () => Math.abs((await journeyState(page)).x - 3), { timeout: 5000 }).toBeLessThan(0.02);
  await expect(page.locator('#experience-title')).toBeFocused();
});

test('a deep link opens at its station without riding from the start', async ({ page }) => {
  await page.goto('/?debug#work');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  const s = await journeyState(page);
  expect(s.station).toBe(2);
  expect(Math.abs(s.x - 2)).toBeLessThan(0.02);
  await expect(page.locator('#work-title')).toBeInViewport();
});

test('the address follows the station while scrolling', async ({ page }) => {
  await page.goto('/?debug');
  await page.waitForLoadState('networkidle');
  for (let i = 1; i <= 4; i++) {
    await rideTo(page, i);
    await expect(page).toHaveURL(new RegExp(`#${IDS[i]}$`));
  }
  await rideTo(page, 0);
  await expect(page).toHaveURL(/#departure$/);
});

test('resume is one tap away at every station', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const resume = page.locator('.routebar .resume');
  for (let i = 0; i <= 4; i++) {
    await rideTo(page, i);
    await expect(resume).toBeInViewport({ ratio: 1 });
  }
  await expect(resume).toHaveAttribute('href', '/resume.pdf');
  await expect(resume).toHaveAttribute('target', '_blank');
  const res = await page.request.get('/resume.pdf');
  expect(res.ok()).toBe(true);
  expect(res.headers()['content-type']).toContain('pdf');
});

test('keyboard order: skip link, the five stops, then resume', async ({ page }, info) => {
  test.skip(info.project.name === 'phone', 'touch device');
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const order: string[] = [];
  for (let k = 0; k < 7; k++) {
    await page.keyboard.press('Tab');
    order.push(
      await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const style = getComputedStyle(el);
        const ring = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
        return `${el.textContent?.trim().split('\n')[0]}${ring ? '' : ' (NO FOCUS RING)'}`;
      }),
    );
  }
  expect(order[0]).toBe('Skip to content');
  // each stop's text is its name followed by the decorative kanji (hidden from assistive tech)
  ['Departure', 'About', 'Work', 'Experience', 'Last stop'].forEach((name, k) => expect(order[k + 1]).toMatch(new RegExp(`^${name}`)));
  expect(order[6]).toMatch(/^Resume/);
  expect(order.filter((t) => t.includes('NO FOCUS RING'))).toEqual([]);
});
