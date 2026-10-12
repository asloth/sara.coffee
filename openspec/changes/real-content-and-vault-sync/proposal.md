# Proposal

## Why

sara.coffee is live, but three of its five stations still show placeholder text. That makes it hard to share while Sara is aiming for a job at Hugging Face. She also wants two things that change often, the book she's reading and her agent setup, plus her projects to keep in step with her Obsidian vault without hand-copying them into the repo.

## What Changes

- **Real content** in every station, taken from her current CV (`AI_CV_ENG_SaraBenel.pdf`):
  - Title: "Software Engineer · AI & Data".
  - BBVA is named, and About's "a bank" wording is updated to match.
  - Experience gets five stops: Santo Toribio, BBVA ×2, PUC Chile, Valere.
  - Contact uses `hello@sara.coffee`, GitHub, LinkedIn and a Hugging Face profile link.
  - A real resume PDF replaces the placeholder.
- **Projects** in Work become real: OpenRoutine plus the CV's AI projects (Agent Researcher, Agentic API Tests, MLOps Recipes, Voice-to-Image).
- **Now reading**: a paperback drawn in CSS on the About bench. It shows the current book and opens a small card. It does not use Rive: her Rive subscription ends 2026-10-15, so the rig stays as shipped.
- **Setup**: a bag on the luggage rack in the Work car links to a new `/uses` page listing her setup. The setup covers agents (Claude Code, Hermes, herdr, Cursor and opencode as reviewers), the machine (Arch, bspwm, kitty, Neovim), notes (Obsidian) and making tools.
- **Vault sync**: a local `npm run sync` script reads `~/TheVault` and writes content files into the repo.
  - It reads only notes that opt in with the Obsidian property `web: true`, and from those only the flat properties named `web-*`.
  - From each opted-in project's Bitácora it reads the date of the newest entry and nothing else.
  - The output is a normal diff that Sara reviews and commits before deploying. Nothing publishes automatically.
- **Email**: `hello@sara.coffee` forwards to her Gmail through Cloudflare Email Routing. She set this up on 2026-10-12.

## Capabilities

### New Capabilities
- `vault-sync`: how vault notes opt in, what the sync may read and write, and how it fails safely.
- `now-reading`: the current book on the About bench and its card, fed from the vault.
- `uses-page`: the setup page and the luggage-rack entry point to it.

### Modified Capabilities
- None. `portfolio-content` (introduced by `anime-train-portfolio`) already says content is data and stations show it. That change has not been archived yet, so `openspec/specs/` is empty. Filling in real entries changes data, not requirements.

## Impact

- **Content:** `src/content/site.json`, `experience.yaml` and `projects/*.md` get rewritten. `public/resume.pdf` is replaced. New content files are added for the book and the setup.
- **Code:** `src/content.config.ts` gets new collections. `About.astro` gets the book and `Work.astro` gets the bag. `src/pages/uses.astro` is new, and so is `scripts/sync-vault.ts`.
- **Vault:** `web` and `web-*` properties are added to Sara's chosen notes (OpenRoutine's `Contexto.md`, a book note, a setup note). Her existing frontmatter stays untouched.
- **Tests:** Playwright coverage for the book, the bag, `/uses`, and the sync's opt-in filtering. The existing content tests stop expecting placeholders.
- **Dependencies:** probably a small YAML/frontmatter parser for the sync script (dev only).
