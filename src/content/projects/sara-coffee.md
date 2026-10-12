---
title: sara.coffee
summary: This site, an anime train ride from morning to night, one station per section.
year: 2026
role: Concept, art direction and development
stack: [Astro, TypeScript, Rive, GSAP, Playwright]
links:
  - { label: GitHub, href: "https://github.com/asloth/sara.coffee" }
order: 3
---

My portfolio as an Evangelion-style train ride: scrolling is the journey, the light goes from morning to night, and a gangway door slides across between stations. The passenger on the bench is me, as a Rive rig with a pose for each station.

It's a static Astro site with no framework runtime. The scenes are layered paintings, and the motion respects reduced-motion settings. Playwright tests cover the journey, the navigation, accessibility (axe) and performance budgets.

I planned it spec-first with OpenSpec and built it with Claude Code.
