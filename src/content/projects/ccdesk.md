---
title: ccdesk
summary: An MCP server that lets a coding agent read and operate Linux desktop apps.
year: 2026
role: Creator, design and development
cover: /work/ccdesk.webp
stack: [Python, MCP, AT-SPI, X11, Xvfb]
links:
  - { label: GitHub, href: "https://github.com/asloth/ccdesk" }
order: 1
---

An open-source MCP server that gives a coding agent eyes and hands on Linux. It reads a window's accessibility tree as text, takes screenshots, fills forms, clicks controls, and reports what changed after each action. It installs into Claude Code and opencode, and ships a computer-use skill that teaches the agent to look, act once and verify.

It can run on your own screen or on a private Xvfb screen with `--headless`, so the agent works while you keep using your PC. An optional Firefox integration lets it act inside a page without touching your mouse.

I benchmarked it on one GTK signup form with Claude Code, three runs per arm. Reading the tree and the change reports cut input tokens by 37% compared with no ccdesk (89,456 to 56,681) and median time from 30 to 15 seconds. The benchmark scripts and raw numbers are in the repo.
