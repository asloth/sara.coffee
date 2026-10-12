// The passenger's live rig. Everything Rive goes through here, so a runtime upgrade touches one
// file, and the page keeps working on the static stills if the runtime never loads.

export interface PassengerControl {
  setStation(n: number): void;
  setStill(still: boolean): void;
  poke(): void;
  resize(): void;
}

const POKE_MS = 1500; // the glasses beat is 1.4 s; hold `poking` a touch longer so it always lands

export function createPassenger(button: HTMLButtonElement): PassengerControl {
  const still = button.querySelector<HTMLImageElement>('[data-still]')!;
  const canvas = button.querySelector<HTMLCanvasElement>('[data-live]')!;
  let station = 0;
  let quiet = false;
  let vm: { setStation(n: number): void; setStill(b: boolean): void; poke(): void; resize(): void } | null = null;

  const showStill = (n: number) => {
    const src = `/rive/pose-${n}.webp`;
    if (still.getAttribute('src') === src) return;
    still.srcset = `/rive/pose-${n}-sm.webp 448w, ${src} 896w`;
    still.src = src;
  };

  const load = async () => {
    try {
      const { Rive, RuntimeLoader, Layout, Fit, Alignment } = await import('@rive-app/canvas');
      RuntimeLoader.setWasmUrl('/rive/rive.wasm');
      const rive = new Rive({
        src: '/rive/passenger.riv',
        canvas,
        autoplay: true,
        autoBind: true,
        stateMachine: 'Main',
        layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
        onLoad: () => {
          rive.resizeDrawingSurfaceToCanvas();
          const vmi = rive.viewModelInstance;
          if (!vmi) return;
          const stationProp = vmi.number('station');
          const pokingProp = vmi.boolean('poking');
          const stillProp = vmi.boolean('still');
          let pokeTimer = 0;
          vm = {
            setStation: (n) => {
              if (stationProp) stationProp.value = n;
            },
            setStill: (b) => {
              if (stillProp) stillProp.value = b;
            },
            poke: () => {
              if (!pokingProp) return;
              pokingProp.value = true;
              clearTimeout(pokeTimer);
              pokeTimer = window.setTimeout(() => (pokingProp.value = false), POKE_MS);
            },
            resize: () => rive.resizeDrawingSurfaceToCanvas(),
          };
          // she is drawn at different sizes per scene (and per window size): keep the canvas's
          // backing store at its displayed size x device pixels, or the browser stretches it soft
          let pending = 0;
          new ResizeObserver(() => {
            cancelAnimationFrame(pending);
            pending = requestAnimationFrame(() => rive.resizeDrawingSurfaceToCanvas());
          }).observe(canvas);
          vm.setStation(station);
          vm.setStill(quiet);
          button.dataset.liveReady = '';
        },
        onLoadError: () => {
          // the still stays; nothing else depends on the rig
        },
      });
    } catch {
      // runtime blocked or unsupported: the still stays
    }
  };

  // She is not on the critical path: the runtime is ~2 MB of wasm and its start-up takes ~100 ms of
  // main thread. Wake her when the visitor first does anything (or a few seconds after load), but
  // only once scrolling has been quiet for a moment, so the start-up never lands mid-ride.
  // Until then the still pose stands in.
  const QUIET_MS = 450;
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
  let wanted = false;
  let started = false;
  let lastScroll = 0;
  let timer = 0;
  const tryStart = () => {
    if (started || !wanted) return;
    const wait = lastScroll + QUIET_MS - performance.now();
    clearTimeout(timer);
    if (wait > 0) {
      timer = window.setTimeout(tryStart, wait);
      return;
    }
    const go = () => {
      if (started || performance.now() - lastScroll < QUIET_MS) return void tryStart();
      started = true;
      void load();
    };
    if (idle) idle(go, { timeout: 1000 });
    else go();
  };
  const want = () => {
    wanted = true;
    tryStart();
  };
  window.addEventListener('scroll', () => {
    lastScroll = performance.now();
    want();
  }, { passive: true });
  (['pointermove', 'pointerdown', 'keydown', 'touchstart'] as const).forEach((ev) =>
    window.addEventListener(ev, want, { passive: true, once: true }),
  );
  window.addEventListener('load', () => setTimeout(want, 3500), { once: true });

  button.addEventListener('click', () => vm?.poke());

  return {
    setStation(n) {
      if (n === station) return;
      station = n;
      showStill(n);
      vm?.setStation(n);
    },
    setStill(b) {
      quiet = b;
      vm?.setStill(b);
    },
    poke() {
      vm?.poke();
    },
    resize() {
      vm?.resize();
    },
  };
}
