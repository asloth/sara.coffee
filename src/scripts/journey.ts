// The ride. Scroll position becomes one continuous station coordinate `x` (0 = Departure ... 4 =
// Last stop, 1.5 = halfway between About and Work), and everything on screen is a function of it:
// which painting shows, the gangway door that hides each cut, the walk along the Work car, where the
// passenger sits and how she is lit, the route map, the URL fragment.
import Lenis from 'lenis';
import { LIGHT, POSE_ASPECT, POSE_HIP, STATIONS, type Light } from '../lib/stations';
import { createPassenger } from './passenger';

const DESKTOP = '(min-width: 1024px)';
const REDUCED = '(prefers-reduced-motion: reduce)';
const WORK = STATIONS.findIndex((s) => s.id === 'work');
const LAST = STATIONS.length - 1;

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (e0: number, e1: number, v: number) => {
  const t = clamp((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function lightAt(x: number): Light {
  const i = Math.min(Math.floor(x), LAST - 1);
  const t = clamp(x - i);
  const a = LIGHT[STATIONS[i]!.time];
  const b = LIGHT[STATIONS[i + 1]!.time];
  const each = (u: number[], v: number[]) => u.map((c, k) => mix(c, v[k]!, t)) as [number, number, number];
  return {
    brightness: mix(a.brightness, b.brightness, t),
    saturate: mix(a.saturate, b.saturate, t),
    gain: each(a.gain, b.gain),
    wash: each(a.wash, b.wash),
    washAlpha: mix(a.washAlpha, b.washAlpha, t),
  };
}

/** feColorMatrix values for: saturate(s), then scale each channel by brightness x gain. */
function litMatrix(L: Light): string {
  const s = L.saturate;
  // the SVG saturate matrix (Rec. 709 luma weights)
  const sat = [
    [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s],
    [0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s],
    [0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s],
  ];
  const rows = sat.map((r, k) => [...r.map((v) => v * L.brightness * L.gain[k]!), 0, 0]);
  return [...rows.flat(), 0, 0, 0, 1, 0].map((v) => v.toFixed(4)).join(' ');
}

export function startJourney(): void {
  const root = document.documentElement;
  const stage = document.querySelector<HTMLElement>('[data-stage]')!;
  const scenes = [...document.querySelectorAll<HTMLElement>('[data-scene]')];
  const sections = [...document.querySelectorAll<HTMLElement>('section[data-station]')];
  const stops = [...document.querySelectorAll<HTMLAnchorElement>('[data-stop]')];
  const route = document.querySelector<HTMLElement>('.route')!;
  const door = stage.querySelector<HTMLElement>('.door')!;
  const posters = document.querySelector<HTMLElement>('[data-posters]');
  const herButton = document.querySelector<HTMLButtonElement>('[data-passenger]')!;
  const litFilter = document.querySelector<SVGFEColorMatrixElement>('[data-lit]');
  const passenger = createPassenger(herButton);
  const debug = new URLSearchParams(location.search).has('debug') ? makeDebug() : null;

  const desktopMq = matchMedia(DESKTOP);
  const reducedMq = matchMedia(REDUCED);
  let desktop = desktopMq.matches;
  let reduced = reducedMq.matches;

  // ------------------------------------------------------------------ geometry
  // A station is "arrived" when its section's middle sits in the middle of the viewport.
  let mids: number[] = [];
  let walkMax = 0;
  // the painting's size as CSS actually lays it out (--P x --Ph), and the stage's. Not innerHeight:
  // on phones that grows and shrinks as the browser bars hide, while 100vh holds still, and she
  // would change size against the bench she sits on.
  const panel = stage.querySelector<HTMLElement>('.panel')!;
  let P = 0;
  let Ph = 0;
  let stageW = 0;
  let stageH = 0;
  const measure = () => {
    const vh = innerHeight;
    mids = sections.map((s) => s.offsetTop + (s.offsetHeight - vh) / 2);
    walkMax = posters ? Math.max(0, posters.scrollWidth - innerWidth) : 0;
    P = panel.offsetWidth;
    Ph = panel.offsetHeight;
    stageW = stage.clientWidth;
    stageH = stage.clientHeight;
    passenger.resize();
  };

  const coord = (y: number) => {
    if (y <= mids[0]!) return 0;
    for (let i = 0; i < LAST; i++) {
      if (y < mids[i + 1]!) return i + (y - mids[i]!) / (mids[i + 1]! - mids[i]!);
    }
    return LAST;
  };

  // ------------------------------------------------------------------ smooth wheel (desktop only)
  let lenis: Lenis | null = null;
  const setupLenis = () => {
    const want = desktop && !reduced && matchMedia('(pointer: fine)').matches;
    if (want && !lenis) lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 0.9 });
    if (!want && lenis) {
      lenis.destroy();
      lenis = null;
    }
  };

  // ------------------------------------------------------------------ deep links and the route map
  /** Ride to station i; resolves once the train is in. */
  const scrollToStation = (i: number, smoothly: boolean) =>
    new Promise<void>((arrived) => {
      const y = mids[i]!;
      // a ride across the map keeps the door shut until the train is in, so the stations in between
      // never flash past; the door opens on arrival
      const ride = ++rides;
      riding = smoothly && !reduced;
      const done = () => {
        if (ride === rides) {
          riding = false;
          lastX = Number.NaN;
        }
        arrived();
      };
      if (lenis && smoothly) {
        lenis.scrollTo(y, { duration: 1.6, onComplete: () => done() });
        return;
      }
      // instant jumps go native: Lenis re-syncs from the scroll event, whereas its own immediate
      // scrollTo is a no-op when it believes it is already there (it can be wrong after the
      // browser's own #fragment jump)
      const animate = smoothly && !reduced && Math.abs(window.scrollY - y) > 2;
      window.scrollTo({ top: y, behavior: animate ? 'smooth' : 'auto' });
      // a jump arrives at once: no door to watch close on a scene nobody rode to
      if (!animate) {
        snap = true;
        return done();
      }
      const finish = () => {
        clearTimeout(timer);
        window.removeEventListener('scrollend', finish);
        done();
      };
      const timer = window.setTimeout(finish, 2000);
      window.addEventListener('scrollend', finish, { once: true });
    });

  const focusStation = (i: number) => {
    const heading = document.getElementById(`${STATIONS[i]!.id}-title`);
    if (!heading) return;
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  };

  stops.forEach((a, i) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      history.pushState(null, '', `#${STATIONS[i]!.id}`);
      // the station's content is hidden until the train is in, so focus it on arrival
      void scrollToStation(i, true).then(() => focusStation(i));
    }),
  );

  document.querySelector<HTMLAnchorElement>('.skip-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    void scrollToStation(0, false).then(() => focusStation(0));
  });

  const fromHash = () => STATIONS.findIndex((s) => `#${s.id}` === location.hash);
  window.addEventListener('popstate', () => {
    // coming back from a project dialog: the visitor never left, so stay exactly where they are
    if (root.dataset.keepScroll) {
      delete root.dataset.keepScroll;
      return;
    }
    const i = fromHash();
    if (i >= 0) void scrollToStation(i, true);
  });

  // ------------------------------------------------------------------ art, as the train nears it
  const primed = new Set<number>([0]);
  const prime = (i: number) => {
    const scene = scenes[i];
    if (!scene || primed.has(i)) return;
    primed.add(i);
    scene.querySelectorAll<HTMLElement>('[data-srcset]').forEach((el) => {
      el.setAttribute('srcset', el.dataset.srcset!);
      el.removeAttribute('data-srcset');
    });
    scene.querySelectorAll<HTMLImageElement>('img[data-src]').forEach((img) => {
      img.src = img.dataset.src!;
      img.removeAttribute('data-src');
    });
    const px = innerWidth * devicePixelRatio;
    const w = px > 2200 ? 2752 : px > 1400 ? 1920 : 960;
    scene.querySelectorAll<HTMLElement>('[data-view]').forEach((v) => {
      const n = v.dataset.view!;
      v.style.setProperty('--img', `image-set(url(/art/${n}-${w}.avif) type('image/avif'), url(/art/${n}-${w}.webp) type('image/webp'))`);
    });
  };

  // ------------------------------------------------------------------ the frame
  let station = -1;
  let lastX = Number.NaN;
  let dirty = true;

  // The gangway door is a real door, not a scroll indicator: it follows the scroll to where it should
  // be, but never faster than a door slides, and the scene behind it only changes once it is shut.
  // So a hard flick on a phone still gets a whole, unhurried close and open instead of a slam.
  const DOOR_HOLD = 0.04; // station units either side of the cut where the door stays fully shut
  const DOOR_SWING = 0.3; // station units over which it opens again past that
  const DOOR_SWEEP = 0.4; // seconds, at the least, for a full close (or open)
  let shown = -1; // the scene on screen: lags `now` while the door is still closing on the cut
  let leaf = 0; // how shut the door is, 0..1, before easing
  let snap = true; // jump straight to the scene without the door (first frame, instant jumps)
  let riding = false; // a route-map ride is under way
  let rides = 0;
  let seated = -1;

  /** Draws the frame; returns whether the door is still on its way somewhere. */
  const render = (x: number, dt: number) => {
    const t0 = debug ? performance.now() : 0;
    const now = Math.round(x);

    // content: each station fades in as the train pulls in and out as it leaves
    sections.forEach((s, i) => {
      const show = 1 - smooth(0.3, 0.46, Math.abs(x - i));
      s.style.setProperty('--show', show.toFixed(3));
      s.style.setProperty('--vis', show < 0.01 ? 'hidden' : 'visible');
    });

    // the door art, once the ride has started
    if (x > 0.05) door.toggleAttribute('data-armed', true);

    // load the scene ahead (and behind, for visitors riding backwards) before the door opens on it
    prime(Math.floor(x));
    prime(Math.ceil(x) + (x - Math.floor(x) > 0.2 ? 1 : 0));
    prime(now);

    // scenes: cut behind the shut door (or cross-fade, with reduced motion)
    const boundary = Math.floor(x) + 0.5;
    const target = 1 - clamp((Math.abs(x - boundary) - DOOR_HOLD) / DOOR_SWING);
    if (reduced || snap) {
      snap = false;
      shown = now;
      leaf = reduced ? 0 : target;
    } else {
      // the cut waits for the door: until it is shut, it keeps closing whatever the scroll says
      const want = shown === now && !riding ? target : 1;
      const step = dt / DOOR_SWEEP;
      leaf = want > leaf ? Math.min(want, leaf + step) : Math.max(want, leaf - step);
      if (shown !== now && leaf >= 1) shown = now;
    }
    const shut = leaf * leaf * (3 - 2 * leaf);
    door.style.setProperty('--shut', shut.toFixed(3));
    scenes.forEach((sc, i) => {
      sc.toggleAttribute('data-active', i === shown);
      if (reduced) {
        const near = Math.abs(x - i);
        const o = 1 - smooth(0.35, 0.65, near);
        sc.toggleAttribute('data-fade', o > 0.001);
        sc.style.opacity = o.toFixed(3);
      } else {
        sc.removeAttribute('data-fade');
        sc.style.opacity = '';
      }
    });

    // the Work car is two panels long: walk along it, posters hanging overhead
    // reduced motion: no walk, the camera stands mid-car (where her seat and the wrapped posters are)
    const pan = !desktop ? 0 : reduced ? (now === WORK ? 0.5 : 0) : smooth(WORK - 0.4, WORK + 0.4, x);
    scenes[WORK]?.style.setProperty('--pan', pan.toFixed(4));
    posters?.style.setProperty('--walk', (pan * walkMax).toFixed(1));

    // the passenger, seated on the bench of whichever scene is showing
    const seat = STATIONS[shown]!.seat;
    const focus = seat.x + 0.08;
    const panelLeft = desktop ? stageW / 2 - P / 2 - (shown === WORK ? pan * P : 0) : stageW / 2 - focus * P;
    const herH = seat.h * Ph;
    herButton.style.setProperty('--her-h', herH.toFixed(1));
    herButton.style.setProperty('--her-x', (panelLeft + seat.x * P - (herH * POSE_ASPECT) / 2).toFixed(1));
    herButton.style.setProperty('--her-y', (stageH / 2 - Ph / 2 + seat.y * Ph - POSE_HIP * herH).toFixed(1));
    if (shown !== seated) {
      seated = shown;
      passenger.setStation(shown);
    }

    // light: her grade and the wash over the stage blend continuously between stations
    const L = lightAt(x);
    litFilter?.setAttribute('values', litMatrix(L));
    stage.style.setProperty('--wash', L.wash.map((c) => Math.round(c)).join(' '));
    stage.style.setProperty('--wash-a', L.washAlpha.toFixed(3));

    // route map
    route.style.setProperty('--ridden', (x / LAST).toFixed(4));

    if (now !== station) {
      const first = station === -1;
      station = now;
      stops.forEach((a, i) => {
        if (i === now) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
        a.toggleAttribute('data-passed', i < now);
      });
      root.dataset.at = STATIONS[now]!.id;
      // only on the ride itself, never over a project's own address
      if ((!first || location.hash) && location.pathname === '/') history.replaceState(null, '', `#${STATIONS[now]!.id}`);
    }

    debug?.(x, now, shut, pan, performance.now() - t0);
    return shown !== now || leaf !== (reduced ? 0 : target);
  };

  let lastTime = 0;
  let moving = true;
  const frame = (time: number) => {
    lenis?.raf(time);
    // a long gap (a background tab) is not a door's worth of time
    const dt = Math.min(0.1, (time - (lastTime || time)) / 1000);
    lastTime = time;
    if (dirty) {
      measure();
      dirty = false;
      lastX = Number.NaN;
    }
    const x = coord(window.scrollY);
    if (x !== lastX || moving || snap) {
      lastX = x;
      const was = moving;
      moving = render(x, dt);
      // for the tests: the scene is settled once the door has finished its swing
      if (moving !== was) stage.toggleAttribute('data-door-moving', moving);
    }
    requestAnimationFrame(frame);
  };

  // ------------------------------------------------------------------ start
  const onMedia = () => {
    desktop = desktopMq.matches;
    reduced = reducedMq.matches;
    passenger.setStill(reduced);
    setupLenis();
    dirty = true;
  };
  desktopMq.addEventListener('change', onMedia);
  reducedMq.addEventListener('change', onMedia);
  window.addEventListener('resize', () => (dirty = true));
  // late-loading fonts and images change section heights
  window.addEventListener('load', () => (dirty = true));

  history.scrollRestoration = 'manual';
  measure();
  onMedia();
  // a deep link opens at its station. The browser also jumps to the #fragment, to the section's top
  // and after this script has run, so the station is taken again once the page has loaded.
  const start = fromHash();
  if (start > 0) {
    void scrollToStation(start, false);
    window.addEventListener('load', () => requestAnimationFrame(() => {
      measure();
      void scrollToStation(start, false);
    }), { once: true });
  }
  requestAnimationFrame(frame);
}

function makeDebug() {
  const box = document.createElement('pre');
  box.setAttribute('aria-hidden', 'true');
  box.style.cssText =
    'position:fixed;right:8px;bottom:8px;z-index:99;margin:0;padding:6px 8px;font:12px/1.3 ui-monospace,monospace;background:#000c;color:#8be03c;pointer-events:none';
  document.body.append(box);
  let worst = 0;
  return (x: number, station: number, shut: number, pan: number, ms: number) => {
    worst = Math.max(worst, ms);
    box.textContent = `x ${x.toFixed(3)}  station ${station}\nshut ${shut.toFixed(2)}  pan ${pan.toFixed(2)}\nrender ${ms.toFixed(1)} ms (worst ${worst.toFixed(1)})`;
  };
}
