# Proposal

## Why

The portfolio is being rebuilt from scratch. The previous direction (a pixel-art room with CRT TVs) was dropped. The new concept is an anime train ride drawn in Evangelion-era cel style: scrolling is the journey, the day turns into night, and the visitor rides with a passenger who is an anime version of the owner (cat-eye tortoiseshell glasses as the key likeness). The goal is a portfolio that is memorable and recognisably hers, while a recruiter can still reach the resume in one click.

## What Changes

- New Astro site that replaces whatever portfolio code ships today. There is no committed code in this repo yet; the old `proto/` folder is a scratch prototype and is not carried over.
- A scroll-driven train journey across five stations: Departure (hero), About, Work, Experience, Last stop (contact).
- Time of day blends continuously with scroll progress, from morning to night, rather than jumping per section.
- Desktop: layered 2D parallax that side-scrolls through the train cars. Mobile: one fixed portrait car view where the stations change outside the window and content panels rise into view.
- A route map that doubles as the site navigation. A resume PDF link that is always reachable.
- A Rive passenger, already prototyped in `rive/passenger`, who reacts to the current station and to clicks.
- A reduced-motion presentation that keeps every piece of content and drops the camera motion.
- Content (bio, projects, experience, contact) lives in data files with placeholders, so the owner can fill it in later without touching layout code.
- Generated art: backgrounds, window views, posters and props in the approved Eva cel style. The references are `design/phase0/gpt-sunset-car.png` and `nb-sunset-car-v2.png`.

## Capabilities

### New Capabilities
- `train-journey`: the scroll-driven ride. Covers the stations, their order, the day-to-night lighting, and the desktop and mobile presentations, including reduced motion.
- `route-navigation`: moving around the site without riding the whole way. Covers the route-map navigation, jumping to a station, the always-available resume link, and keyboard and screen-reader access.
- `passenger-character`: the animated passenger. Covers what she does at each station, the reaction when clicked, idle life, and the fallback when Rive cannot run.
- `portfolio-content`: the owner's content and how it is shown. Covers the about, projects, experience and contact data, the per-project detail view, and placeholder behaviour while the content is empty.

### Modified Capabilities
<!-- none: no specs exist yet -->

## Impact

- **New code:** an Astro project at the repo root. Dependencies: GSAP plus ScrollTrigger, Lenis, and `@rive-app/canvas` (or `webgl2`) for the Rive web runtime.
- **Existing assets reused:**
  - `rive/passenger` (scene.rml, gen.py, prep.py, art/), compiled to `passenger.riv` and controlled through its `Passenger` view model (`station`, `poking`).
  - `design/phase0` and `design/poses` as art references.
- **External services:**
  - Higgsfield (starter plan, about 2 concurrent jobs, credits are limited) for generated art.
  - The Rive account for a clean, signed export while the paid plan is active (until 2026-10-15).
- **Hosting:** a static build. Cloudflare Pages is assumed and is not decided yet.
- **Not in scope:** writing the owner's real content, a blog, or CMS integration.
