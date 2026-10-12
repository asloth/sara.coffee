import { expect, test } from '@playwright/test';
import { journeyState, rideTo } from './helpers';

const isDesktop = (w: number) => w >= 1024;

test.beforeEach(async ({ page }) => {
  await page.goto('/?debug');
  await page.waitForLoadState('networkidle');
});

test('stations arrive in order and switch only behind the shut door', async ({ page, viewport }) => {
  for (let i = 0; i <= 4; i++) {
    await rideTo(page, i);
    const s = await journeyState(page);
    expect(s.station).toBe(i);
    expect(await page.getAttribute('[data-stop][aria-current="location"]', 'data-stop')).toBe(String(i));
  }
  for (let i = 0; i < 4; i++) {
    await rideTo(page, i + 0.47);
    expect((await journeyState(page)).station).toBe(i);
    await rideTo(page, i + 0.53);
    expect((await journeyState(page)).station).toBe(i + 1);
    if (isDesktop(viewport!.width)) {
      await rideTo(page, i + 0.5);
      expect((await journeyState(page)).shut).toBeGreaterThan(0.99);
    }
  }
});

test('light blends continuously between stations', async ({ page }) => {
  const read = async (x: number) => {
    await rideTo(page, x);
    return page.evaluate(() => ({
      matrix: document.querySelector('[data-lit]')!.getAttribute('values')!,
      wash: getComputedStyle(document.querySelector('[data-stage]')!).getPropertyValue('--wash-a'),
    }));
  };
  const about = await read(1);
  const between = await read(1.5);
  const work = await read(2);
  expect(between.matrix).not.toBe(about.matrix);
  expect(between.matrix).not.toBe(work.matrix);
  const [a, m, w] = [about, between, work].map((r) => Number(r.wash));
  expect(m).toBeGreaterThan(Math.min(a!, w!));
  expect(m).toBeLessThan(Math.max(a!, w!) + 1e-9);
});

test('the city keeps passing while the visitor holds still', async ({ page }) => {
  await rideTo(page, 1);
  const sample = () =>
    page.evaluate(() => {
      const scene = document.querySelector('[data-scene][data-active]')!;
      return {
        view: getComputedStyle(scene.querySelector('.view-far')!).transform,
        track: getComputedStyle(scene.querySelector('.track')!).transform,
      };
    });
  const before = await sample();
  await page.waitForTimeout(800);
  const after = await sample();
  expect(after.view).not.toBe(before.view);
  expect(after.track).toBe(before.track);
});

test('no sideways scrolling at any station', async ({ page }) => {
  for (let i = 0; i <= 4; i++) {
    await rideTo(page, i);
    const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(sw).toBe(cw);
  }
});

test('every station heading is on screen at its station', async ({ page }) => {
  for (const [i, id] of ['departure', 'about', 'work', 'experience', 'contact'].entries()) {
    await rideTo(page, i);
    await expect(page.locator(`#${id}-title`)).toBeInViewport();
  }
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no camera movement, no door, scenes cross-fade', async ({ page }) => {
    const camera = () =>
      page.evaluate(() => ({
        tracks: [...document.querySelectorAll('.track')].map((t) => getComputedStyle(t).transform).join('|'),
        anim: getComputedStyle(document.querySelector('.view-far')!).animationName,
        shut: getComputedStyle(document.querySelector('.door')!).getPropertyValue('--shut'),
      }));
    await rideTo(page, 1.8);
    const a = await camera();
    await rideTo(page, 2.3);
    const b = await camera();
    expect(a.tracks).toBe(b.tracks);
    expect(a.anim).toBe('none');
    expect(Number(a.shut)).toBe(0);
    await rideTo(page, 2.5);
    const fading = await page.$$eval('[data-scene][data-fade]', (els) => els.length);
    expect(fading).toBe(2);
  });
});
