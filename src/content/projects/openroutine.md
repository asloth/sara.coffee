---
title: OpenRoutine
summary: A local-first routine app. Your routines live in your own Drive, readable by any agent.
year: 2026
role: Creator, design and development
stack: [Flutter, Dart, Google Drive API, JSON Schema]
links:
  - { label: GitHub, href: "https://github.com/asloth/openroutine" }
order: 1
---

An open-source routine and visual-timer app for iOS and Android. There is no backend: routines are plain JSON files in a folder of your own Google Drive, so the app is only a client and costs nothing to run.

That also makes it agent-friendly. The JSON schema is open and versioned, so any AI agent with access to your Drive (Claude, Codex or others) can read your routines and completion history, spot the steps you keep skipping, and propose or apply changes you confirm.

It already has the routine timer, import and export, and optional Drive sync, and I'm polishing it for a first store release. I build it in the open.
