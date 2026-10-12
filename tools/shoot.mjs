// Screenshot the ride at chosen station coordinates.
//   node tools/shoot.mjs <out-dir> <width>x<height> <x> [<x> ...] [--reduced] [--url=http://localhost:4321/]
// x is the station coordinate (0 Departure ... 4 Last stop; 1.5 = halfway About -> Work).
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('--'));
const [out, size, ...xs] = args.filter((a) => !a.startsWith('--'));
const [width, height] = size.split('x').map(Number);
const url = flags.find((f) => f.startsWith('--url='))?.slice(6) ?? 'http://localhost:4321/';
const reduced = flags.includes('--reduced');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(url + '?debug', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
for (const x of xs.map(Number)) {
  // scroll so that the station coordinate is x: interpolate between section middles
  await page.evaluate((x) => {
    const secs = [...document.querySelectorAll('section[data-station]')];
    const mids = secs.map((s) => s.offsetTop + (s.offsetHeight - innerHeight) / 2);
    const i = Math.min(Math.floor(x), mids.length - 2);
    const y = mids[i] + (mids[i + 1] - mids[i]) * (x - i);
    window.scrollTo(0, y);
  }, x);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/x${x.toFixed(2)}-${width}x${height}${reduced ? '-rm' : ''}.png` });
  console.log(x, JSON.stringify(await page.textContent('pre')));
}
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page errors');
await browser.close();
