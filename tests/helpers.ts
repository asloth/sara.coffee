import type { Page } from '@playwright/test';

/** Scroll so the journey's station coordinate is `x` (0 Departure ... 4 Last stop). */
export async function rideTo(page: Page, x: number) {
  await page.evaluate((x) => {
    const mids = [...document.querySelectorAll<HTMLElement>('section[data-station]')].map(
      (s) => s.offsetTop + (s.offsetHeight - innerHeight) / 2,
    );
    const i = Math.min(Math.floor(x), mids.length - 2);
    window.scrollTo(0, mids[i]! + (mids[i + 1]! - mids[i]!) * (x - i));
  }, x);
  // two frames for the journey loop to read the scroll and write the scene
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  // the door slides at its own pace and the scene only changes behind it once it is shut
  await page.waitForFunction(() => !document.querySelector('[data-stage]')?.hasAttribute('data-door-moving'));
}

/** The journey state as the debug overlay reports it. */
export async function journeyState(page: Page) {
  const text = (await page.textContent('pre')) ?? '';
  const num = (k: string) => Number(new RegExp(`${k} ([\\d.]+)`).exec(text)?.[1]);
  return { x: num('x'), station: num('station'), shut: num('shut'), pan: num('pan') };
}
