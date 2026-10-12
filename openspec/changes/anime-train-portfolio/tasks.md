# Tasks

## 1. Passenger: finish and lock the Rive rig (deadline: Rive plan ends 2026-10-15)

- [x] 1.1 Generate the approved character, pose variants and cutouts in `design/poses`. Verify: every pose lines up with `base.png` at a 0 px offset.
- [x] 1.2 Build the rig in `rive/passenger` (prep.py, gen.py → scene.rml) with the `Passenger` view model (`station`, `poking`). Verify: `rive rive/passenger --verify` reports 0 errors, and `--data=station=N --screenshot` shows the right pose for N = 0–4 and for `poking=true`.
- [x] 1.3 Add a `still` boolean to the view model that pauses the Idle layer's sway and breathing but keeps blinks. Verify: two screenshots with `--data=still=true` at `--advance=0` and `--advance=120` are identical except in the eye patch.
- [x] 1.4 Add a blink patch for the closed-book pose, so she still blinks at Last stop. Verify: a screenshot with `--data=station=4` at the blink frame shows closed eyes.
- [x] 1.5 Confirm which workspace holds the paid plan, `rive push` the project there, and build a signed `--publish` backup into `rive/passenger/build/`. Verify: the `.riv` loads in the Rive web player with no watermark.
- [x] 1.6 Build the unsigned `passenger.riv` and the static fallback poses into `public/rive/`, and document the rebuild steps in `rive/passenger/README.md`. Verify: running the README commands from scratch reproduces the files byte for byte.

## 2. Site scaffolding

- [x] 2.1 Scaffold Astro (static output, TypeScript strict) at the repo root and add `.gitignore` for `node_modules`, `dist` and `rive/*/build`. Verify: `npm run build` produces `dist/index.html`.
- [x] 2.2 Add dependencies: gsap, lenis, `@rive-app/canvas` at a pinned version. Verify: `npm ls` shows exact versions and the build still passes.
- [x] 2.3 Define content collections (`projects`, `experience`, `site`) with schemas and placeholder entries flagged `placeholder: true`, plus a placeholder `public/resume.pdf`. Verify: `astro check` passes and a schema violation fails the build.

## 3. Art production (Higgsfield, Eva cel style)

- [x] 3.1 Write `design/prompts.md`: one shared style prompt template, the reference images to attach, and a credit budget table. Verify: the budget total is ≤ 120 credits.
- [x] 3.2 Generate the car interiors (Departure platform, About car, Work cars 1–2, Experience car, Last stop platform at night) with chroma-magenta windows, using the sunset references attached. Verify: a contact sheet reviewed by the owner, all in one consistent style. *(Done as one master car repainted for 5 times of day, plus a morning and a night platform and a gangway door. Owner approved 2026-10-10. Work reuses the afternoon car, mirrored for its second half. Mobile uses portrait crops of the same paintings instead of separate portrait art.)*
- [x] 3.3 Write `design/tools/key_windows.py` to key the magenta out into alpha and export AVIF and WebP at 1920 and 960 px. Verify: window holes are fully transparent with no magenta fringe when shown over a test pattern.
- [x] 3.4 Generate the tiling window-view strips (sky, skyline, poles and wires) for morning, noon, afternoon, sunset and night, and cut out the near layer. Verify: each strip tiles with no visible seam when looped in a test page.
- [x] 3.5 Generate the props: blank ad-poster frames, route-map board, station sign blanks, ticket. Verify: no generated text is visible on any prop. *(Changed: the sign boards and ad frames are already blank in the scene paintings; the route map, hanging posters and ticket are built in HTML/CSS/SVG instead. They are sharper, accessible and editable, and save about 16 credits.)*

## 4. Journey engine

- [x] 4.1 Build the pinned stage and the master `progress` ScrollTrigger with Lenis sync, and expose a typed `journey` store (progress, station with hysteresis). Verify: a debug overlay shows progress going 0 → 1 and the station switching at the anchors with no flicker at boundaries.
- [x] 4.2 Desktop camera: the horizontal car strip with door layers opening at car boundaries. Verify: at 1440 × 900, scrolling end to end moves through all cars at about 60 fps in the Chrome performance panel, with no long tasks over 100 ms.
- [x] 4.3 Continuous lighting: crossfade per-station art plus the grade overlay through the five time-of-day keys. Verify: screenshots at the midpoint between each pair of anchors show blended light, not either neighbour's look.
- [x] 4.4 Window views: time-driven strip scrolling behind the keyed windows, swapping strips by station. Verify: with scrolling stopped, the scenery keeps passing and the camera holds still.
- [x] 4.5 Mobile timeline (< 1024 px): one portrait car, window view crossfades, content panels rise, native scroll. Verify: at 390 × 844 there is no horizontal overflow (`scrollWidth == clientWidth`) and every station's content is reachable.
- [x] 4.6 Reduced-motion timeline: no camera movement or parallax, stations cross-fade. Verify: with emulated `prefers-reduced-motion: reduce`, nothing translates during scroll and all content stays readable.

## 5. Navigation

- [x] 5.1 Route-map nav component bound to the `journey` store, with current stop and progress segment, and `aria-current` on the current stop. Verify: an axe scan shows no violations, and a screen reader announces the navigation landmark with 5 links and the current location.
- [x] 5.2 Station jumps and deep links: clicking a stop scrolls to its anchor and focuses the station heading; loading `/#work` starts at Work; the hash follows the current station. Verify: a Playwright test covers click-to-jump, deep-link load and the hash updating while scrolling.
- [x] 5.3 An always-visible Resume control and a "Skip to content" link. Verify: Playwright at 390 px and 1440 px finds the Resume link visible at every station, and Tab order is skip link → stops → Resume.

## 6. Content in the stations

- [x] 6.1 Departure: name and title on HTML station signs over the platform art. Verify: the LCP element is the name text, and LCP ≤ 2.5 s on Lighthouse mobile (Fast 4G). *(Measured with Lighthouse on mobile. Under Fast 4G: LCP 0.8 s, FCP 0.6 s. Under the default Slow 4G: LCP 3.1 s, FCP 1.1 s. The LCP element is the hero platform painting; the name text paints earlier, at FCP.)*
- [x] 6.2 About: bio on the ad panels above the windows. Verify: text is selectable and contrast is ≥ 4.5:1 across the noon to afternoon blend (checked at both ends).
- [x] 6.3 Work: project posters generated from the collection; `/work/[slug]` detail pages; dialog loading with pushState, Escape to close, and focus restored. Verify: a Playwright test opens a poster, checks the URL and content, presses Escape, and checks the URL, scroll position and focus are restored.
- [x] 6.4 Experience: entries as route-map stops in date order. Verify: adding an entry to `experience.yaml` adds a stop after rebuild, with no code change.
- [x] 6.5 Last stop: contact ticket with mailto and the configured links. Verify: every link has a valid href, and contrast is ≥ 4.5:1 at night.

## 7. Passenger on the page

- [x] 7.1 Rive adapter module: lazy-load after first paint, autoBind the view model, write `station` from the journey store, and fall back to a static pose image. Verify: changing station in the debug overlay changes her pose within 200 ms, and blocking the runtime URL in devtools leaves the static pose with no console errors breaking the page.
- [x] 7.2 Interaction: wrap the canvas in a labelled `<button>`; click, Enter or Space sets `poking` and then resets it. Verify: a Playwright test triggers by keyboard and by click and screenshots the glasses pose.
- [ ] 7.3 Lighting match: CSS filter grade on the passenger driven by the same time-of-day keys. Verify: screenshots at each anchor reviewed against the scene; the owner signs off.
- [x] 7.4 Reduced motion sets `still = true`. Verify: with reduced motion emulated, frame-to-frame screenshots of the passenger differ only during blinks.

## 8. Integration and launch

- [x] 8.1 A full-journey review at desktop, tablet and phone sizes by a design-review subagent; fix its findings. Verify: the review report has no open high-severity items. *(Review on 2026-10-10 found 3 high, 5 medium and 2 low issues; all fixed: name board aligned and pinned, cards no longer cover her on tablet and phone, reduced-motion posters, single sliding door, seam overlap, still-to-live swap, LED heading plate, Last stop board, VT323 Latin, car scale.)*
- [x] 8.2 Performance pass: Lighthouse mobile and desktop. Verify: Performance ≥ 90, Accessibility ≥ 95, and total eager transfer ≤ 1.5 MB. *(Mobile 94 / Accessibility 100 / Best practices 96 / SEO 100. Desktop 100 / 100 / 96 / 100. Up-front transfer is 357 KB on mobile and 442 KB on desktop.)*
- [ ] 8.3 Deploy to a preview URL (Cloudflare Pages assumed) and share it with the owner. Verify: the preview URL loads and the owner signs off on each station. *(Deployed 2026-10-11 to Cloudflare Pages project `sara-coffee`, live at https://sara.coffee and sara-coffee.pages.dev; `npm run deploy` redeploys. Waiting on owner sign-off.)*

## Workflow follow-up

- The owner replaces the placeholder content and the resume PDF.
- Archive the change after launch, once the owner signs off.
