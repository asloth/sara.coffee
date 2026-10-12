import { existsSync } from 'node:fs';
import { chromium, expect, test } from '@playwright/test';

// The frame budget only means something with a GPU: the headless test browser rasterises in
// software. So this drives the system Chromium in a real window when one is available.
const SYSTEM_CHROMIUM = '/usr/bin/chromium';
const canRun = existsSync(SYSTEM_CHROMIUM) && !!process.env['DISPLAY'];

test('desktop scroll holds 60 fps with no long tasks @perf', async ({ baseURL }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop budget');
  test.skip(!canRun, 'needs a GPU browser in a display session');
  const browser = await chromium.launch({ executablePath: SYSTEM_CHROMIUM, headless: false });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(baseURL!, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    const w = window as Window & { __long?: number[]; __frames?: number[] };
    w.__long = [];
    w.__frames = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => w.__long!.push(e.duration))).observe({ type: 'longtask' });
    let last = performance.now();
    const tick = (t: number) => {
      w.__frames!.push(t - last);
      last = t;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.mouse.move(700, 450);
  for (let k = 0; k < 90; k++) {
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(1200);
  const { long, frames } = await page.evaluate(() => {
    const w = window as Window & { __long?: number[]; __frames?: number[] };
    return { long: w.__long!, frames: w.__frames!.slice(5).sort((a, b) => a - b) };
  });
  await browser.close();
  const p90 = frames[Math.floor(frames.length * 0.9)]!;
  console.log(`frames ${frames.length}, median ${frames[frames.length >> 1]!.toFixed(1)} ms, p90 ${p90.toFixed(1)} ms, long tasks ${JSON.stringify(long.map(Math.round))}`);
  expect(long.filter((d) => d > 100)).toHaveLength(0);
  expect(p90).toBeLessThan(20);
});
