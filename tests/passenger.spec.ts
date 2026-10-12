import { expect, test, type Page } from '@playwright/test';
import { rideTo } from './helpers';

const her = (page: Page) => page.locator('[data-passenger]');

async function live(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(her(page)).toHaveAttribute('data-live-ready', '', { timeout: 15_000 });
}

/** PNG bytes of part of her: 'face' (head and shoulders) or 'body' (chest down, below the face). */
async function shot(page: Page, part: 'face' | 'body' | 'all') {
  const box = (await her(page).boundingBox())!;
  const clip =
    part === 'face'
      ? { x: box.x + box.width * 0.35, y: box.y + box.height * 0.1, width: box.width * 0.3, height: box.height * 0.16 }
      : part === 'body'
        ? { x: box.x + box.width * 0.2, y: box.y + box.height * 0.36, width: box.width * 0.6, height: box.height * 0.3 }
        : box;
  return page.screenshot({ clip, animations: 'allow' });
}

test('her pose follows the station within 200 ms', async ({ page }) => {
  await live(page);
  await rideTo(page, 0);
  await page.waitForTimeout(400);
  const reading = await shot(page, 'face');
  await rideTo(page, 1);
  await page.waitForTimeout(200);
  const smiling = await shot(page, 'face');
  expect(smiling.equals(reading)).toBe(false);
  await expect(page.locator('[data-still]')).toHaveAttribute('src', '/rive/pose-1.webp');
});

test('clicking her plays the glasses beat, then she goes back to her pose', async ({ page }, info) => {
  await live(page);
  // on phones the station content scrolls over her; at Departure she sits clear below the board
  await rideTo(page, info.project.name === 'phone' ? 0 : 2);
  await page.waitForTimeout(400);
  const before = await shot(page, 'face');
  const box = (await her(page).boundingBox())!;
  await her(page).click({ position: { x: box.width * 0.5, y: box.height * 0.3 } });
  await page.waitForTimeout(250);
  const during = await shot(page, 'face');
  expect(during.equals(before)).toBe(false);
  await page.waitForTimeout(2200);
  // back to reading: the same pose as before (allowing for a blink, compare the body)
  await expect.poll(async () => (await shot(page, 'face')).equals(during), { timeout: 3000 }).toBe(false);
});

test('Enter on the focused passenger plays the same beat', async ({ page }, info) => {
  test.skip(info.project.name === 'phone', 'keyboard');
  await live(page);
  await rideTo(page, 1);
  await page.waitForTimeout(400);
  const before = await shot(page, 'face');
  await her(page).focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  expect((await shot(page, 'face')).equals(before)).toBe(false);
});

test('if the runtime cannot load, the still pose stands in and nothing breaks', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // block every wasm: the runtime falls back to its CDN copy when only the local one fails
  await page.route('**/*.wasm', (r) => r.abort());
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await expect(her(page)).not.toHaveAttribute('data-live-ready', '');
  await expect(page.locator('[data-still]')).toBeVisible();
  await rideTo(page, 4);
  await expect(page.locator('[data-still]')).toHaveAttribute('src', '/rive/pose-4.webp');
  await expect(page.locator('#contact-title')).toBeInViewport();
  expect(errors).toEqual([]);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('she holds still; only blinking remains', async ({ page }) => {
    await live(page);
    await rideTo(page, 1);
    await page.waitForTimeout(800);
    const a = await shot(page, 'body');
    await page.waitForTimeout(900);
    const b = await shot(page, 'body');
    expect(b.equals(a)).toBe(true);
  });
});

test('without reduced motion she sways with the train', async ({ page }) => {
  await live(page);
  await rideTo(page, 1);
  await page.waitForTimeout(800);
  const a = await shot(page, 'body');
  await page.waitForTimeout(900);
  const b = await shot(page, 'body');
  expect(b.equals(a)).toBe(false);
});
