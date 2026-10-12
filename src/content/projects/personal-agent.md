---
title: My personal agent
summary: A self-hosted Hermes Agent on my own server, reached from Telegram and my phone.
year: 2026
role: Setup, operations and skills
stack: [Hermes Agent, Claude Code, Tailscale, Syncthing, Linux]
links:
  - { label: Hermes Agent, href: "https://github.com/NousResearch/hermes-agent" }
order: 2
---

I run [Hermes Agent](https://github.com/NousResearch/hermes-agent) on my own VPS as a personal assistant I talk to from Telegram, the desktop app or my phone.

- **Private by default.** The server is only reachable over Tailscale, the agent runs as an unprivileged user, and root is a temporary, self-expiring switch.
- **It shares my notes.** Syncthing keeps my Obsidian vault in sync with the server, so the agent reads and writes the same notes I do, while anything work-related never leaves my machine.
- **Skills I wrote for it** cover how to write in my notes and how to contribute to Hermes itself, and it delegates coding to Claude Code in git worktrees, leaving branches for me to review.
- **Profiles and notifications.** Separate profiles for development, coaching and finance all report back through one Telegram notification queue.

Running it every day is also how I found the friction I'm now turning into contributions to Hermes upstream.
