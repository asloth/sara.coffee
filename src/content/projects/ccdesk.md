---
title: ccdesk
summary: An MCP server that lets several AI agents use my Linux desktop while I keep working.
year: 2026
role: Creator, design and development
cover: /work/ccdesk.webp
stack: [Python, MCP, AT-SPI, X11, Xvfb]
links:
  - { label: GitHub, href: "https://github.com/asloth/ccdesk" }
order: 1
---

An open-source MCP server that lets several AI agents work on my Linux desktop at the same time while I keep using it. Each agent gets its own pointer and keyboard, so my mouse and focus stay where I left them, and each one shows up on screen as a cursor in its colour with its name. It can also give agents a private screen with `--headless`.

Agents read a window's accessibility tree as text, act, and get back only what changed. It works with Claude Code, Codex and opencode, with any model, and ships a computer-use skill that teaches the agent to look, act once and verify.

Agents that share one screen take turns one action at a time, so their input never mixes. In a test with two agents typing into two windows at once, both finished in 7.4 seconds instead of 14.4, each with its own text intact.
