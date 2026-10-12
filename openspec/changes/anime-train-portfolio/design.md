# Design

## Context

The repo has no committed code. `proto/` is an old scratch prototype and is ignored. Two pieces of this change already exist:

- **The passenger rig:** `rive/passenger`.
  - `prep.py` turns the Higgsfield poses in `design/poses` into `art/*.webp`.
  - `gen.py` writes `scene.rml`.
  - It exposes a `Passenger` view model: `station` (number 0–4) and `poking` (boolean).
  - It has no Luau scripts, so an unsigned `rive --once` build loads in web runtimes.
- **The style references:**
  - `design/phase0/gpt-sunset-car.png` and `nb-sunset-car-v2.png`: Evangelion-era cel look, orange key light, teal-blue shadow, power lines.
  - `glasses-ref.png`: the likeness anchor.

Constraints:
- **Higgsfield starter plan:** about 190 credits; `nano_banana_pro` costs 2 per image, background removal is cheap. Only about 2 jobs can run at once; extra submissions fail with a misleading "out of credits" error.
- **Rive paid plan:** ends 2026-10-15. A clean signed export needs `rive push` to a paid workspace before then.

See proposal.md for why, and `specs/` for the required behaviour.

## Goals / Non-Goals

**Goals:**
- One static page, with JavaScript only where motion needs it.
- A single source of truth for journey progress (0 → 1). Lighting, camera, route map, passenger station and URL fragment are all derived from it.
- Generated art produced as separable layers, so parallax and the day-to-night grade work without repainting each scene for every time of day.

**Non-Goals:**
- Real 3D. Depth comes only from 2D layers.
- A CMS, analytics, or i18n. Content stays in English for now; the owner can add Spanish later.
- Per-frame hand animation of backgrounds. Ambient motion is procedural: scrolling strips, flicker, sway.

## Decisions

### Astro, static output, vanilla TypeScript islands
Astro renders all content as real HTML at build time, which meets the spec for selectable text, deep links and fast first paint. The journey is one client script plus a Rive island.
- **Rejected: Next.js or React.** Hydration cost for a mostly static page, with no benefit.
- **Rejected: a single hand-written HTML file.** Loses content collections and per-project routes.

### One master progress value, GSAP ScrollTrigger and Lenis
A pinned stage holds the scene. One ScrollTrigger with `scrub` maps page scroll to `progress ∈ [0,1]`. Each station has an anchor:

| Station | Anchor |
|---|---|
| Departure | 0 |
| About | 0.22 |
| Work | 0.48 |
| Experience | 0.74 |
| Last stop | 1 |

Work gets a wider span because it holds the posters. Everything else subscribes to `progress`:
- camera transform
- lighting blend
- route-map highlight
- `station` = nearest anchor passed, with hysteresis so it doesn't flicker at boundaries
- `history.replaceState` for the hash

Lenis smooths the wheel and is synced through `ScrollTrigger.update`. `gsap.matchMedia()` builds three variants from the same anchors: desktop (≥1024 px), mobile, and reduced motion.
- **Rejected: CSS scroll-driven animations alone.** Uneven browser support, and the passenger and URL still need JavaScript.

### Desktop camera: a horizontal strip of cars inside a pinned stage
The cars sit side by side on a long horizontal strip, and progress translates the strip (GPU transform only). Each station's content is absolutely placed inside its car. Door panels between cars are separate layers that slide open over the 4% of progress around each car boundary.

### Mobile: the same DOM, a different timeline
- The strip is hidden.
- One portrait car interior is shown, with the window as a mask.
- The station view behind the window crossfades by progress.
- Content panels are normal flow sections that translate up into place.

There is no horizontal scroll at any width.

### Lighting: art painted per time of day, plus a continuous grade
Each station's art is generated in its own time of day: morning, noon, afternoon, sunset, night. Neighbouring stations crossfade across the span between their anchors. On top, a grade layer interpolates continuously through the same five keys. It is a CSS gradient overlay using `mix-blend-mode: multiply` or `soft-light`, plus an additive light-beam layer.

The passenger canvas gets a matching CSS `filter` grade (brightness, saturate, sepia, hue) driven by the same keys, so she sits in the scene's light.
- **Rejected: one neutral scene with only a grade.** It can't produce Eva's hard sunset beams.
- **Rejected: five fully separate scenes with hard cuts.** Breaks the continuous-lighting requirement.

### Art pipeline: Higgsfield with style references and chroma windows
Every scene is generated with `nano_banana_pro`, with the sunset car references attached so the style stays consistent. Car interiors are generated with the windows filled in flat chroma magenta. A local script keys that colour out, so the window becomes a hole that shows the window-view layers behind it.

Window views are made as wide strips that tile horizontally:
- far: sky and skyline
- mid: buildings
- near: utility poles and wires, cut out with remove_background

They scroll on time, not on scroll, to suggest the train moving.

Signs, posters and ticket text are always HTML over blank art. Generated text is unreliable and can't be translated.

Art is exported as AVIF with WebP fallback, at two widths (1920 and 960), and lazy-loaded per station after Departure.

### Passenger runtime
- `@rive-app/canvas` (the smaller bundle) loads after first paint. It plays `passenger.riv`, built with `rive rive/passenger --once` and copied into `public/`.
- `autoBind: true` exposes the default view model instance. The page writes `station` when it changes, and on click, Enter or Space sets `poking = true`, then resets it after 1.5 s.
- The canvas sits inside a `<button>` labelled for screen readers.
- The fallback is a static `<img>` of the station pose (`art/body_*.webp`), swapped by the same station value. It shows until Rive reports loaded, and stays if Rive fails.
- Under reduced motion the page does not advance the idle layer. The rig needs a `still` boolean that the Idle layer obeys (task 2.x).
- **Rejected: a sprite sheet or video.** No runtime pose switching, and heavier.

### Content as Astro content collections
- `src/content/projects/*.md`: frontmatter for title, summary, cover, role, stack and links; the body is the description.
- `src/content/experience.yaml` and `src/content/site.json`: name, title, bio, contact, resume path.
- Seeded with entries marked `placeholder: true`.

Project detail is a real page at `/work/[slug]`, so it works without JavaScript and can be shared. With JavaScript, opening a poster loads that page into a `<dialog>` over the train and pushes its URL. Closing restores the URL and scroll position.

### Rive export before the plan ends
Before 2026-10-15:
1. `rive workspace` → choose the paid workspace (the owner confirms which one).
2. `rive push rive/passenger` to bind the file.
3. `rive rive/passenger --publish` to get a clean signed `.riv`, kept as a backup.

Day to day, the unsigned `--once` build is enough because the rig has no scripts.

## Risks / Trade-offs

- **Generated scenes drift in style from car to car.** → Always attach the two sunset references and the previous car as image references, keep one prompt template, and grade globally.
- **Higgsfield credits run out (about 190).** → Budget about 60 images total (around 120 credits). Make backgrounds once per car and reuse window strips across stations.
- **Asset weight hurts LCP.** → Departure art is the only eager image set. Everything else is lazy, the passenger is deferred, and AVIF is capped at about 250 KB per layer at 1920 px.
- **Pinned scroll plus Lenis feels wrong on touch devices.** → Mobile uses native scroll with Lenis turned off, and the mobile timeline has no pinning-heavy effects.
- **The CSS filter grade on the canvas looks flat compared with the painted light.** → Acceptable for v1. Later: per-station rim-light overlays made in Rive.
- **The Rive view model API changes between runtime versions.** → Pin the runtime version and wrap all calls in one adapter module with a static-image fallback.

## Migration Plan

This is a new site with no existing deployment to migrate.
1. Build locally.
2. Deploy to a preview URL.
3. The owner reviews each station.
4. Point the domain at the build.

Rollback means redeploying the previous build.

## Open Questions

- Hosting target and domain (Cloudflare Pages is assumed). Deferrable, since the output is static anyway.
- Which Rive workspace (`saras-84JMW` or `sabera`) holds the paid plan. Needed only for the clean export.
- The real content and the resume PDF. The owner fills these in later, and placeholders stand in until then.
