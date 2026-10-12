# Design

## Context

- The site is static Astro 7. Content comes from collections defined in `src/content.config.ts`: `site.json`, `projects/*.md` and `experience.yaml`.
- Every station already renders whatever is in those collections, with placeholder labels where entries are drafts.
- Deploys run from Sara's machine through `npm run deploy`, after a commit (house rule).
- Her vault lives at `~/TheVault`. Notes are in Spanish with YAML frontmatter, e.g. `Projects/openroutine/OpenRoutine.md` has `tags`, `proyecto` and `status`. Some projects keep a dated log at `Projects/<p>/Bitacora/YYYY-MM-DD.md`.
- The vault also holds private material (visa, scholarships, client work), so whatever the sync reads has to be tightly limited.
- Placement in the painted scenes uses painting-relative CSS units (`--P`, `--Ph`), as in `Contact.astro`'s `.last-board`.
- The project dialog (`ProjectDialog.astro`) shows the pattern for a native `<dialog>` that is keyboard-safe.
- The Rive rig is frozen after 2026-10-15 (see proposal).

## Goals / Non-Goals

**Goals:**
- One vault edit followed by `npm run sync` updates the book, the setup, or an opted-in project.
- The build never depends on the vault or the network.

**Non-Goals:**
- Auto-publishing on save, watching the vault, or running the sync in CI.
- Publishing note bodies or Bitácora text.
- New Rive poses or new painted art. The book and bag are drawn with CSS/SVG.
- Translating anything. Only the English `web-*` properties go out.

## Decisions

### Discovery and note format: flat Obsidian properties
- **Opt-in:** a note opts in with the property `web: true`, either as a checkbox or as text `"true"`. Sara's first opt-in (`Projects/openroutine/Contexto.md`) was saved as text.
- **Data:** everything published comes from flat properties named `web-*`. Obsidian's property editor can't edit nested YAML, so a `web:` block would force her out of the UI. Properties per kind:

  | Kind | Properties |
  |---|---|
  | `web-kind` | `project` (default), `reading` or `uses` |
  | project | `web-title`, `web-summary` (≤90 chars), `web-year`, `web-role`, `web-stack` (list), `web-links` (list of URLs, labelled from the domain: github.com → GitHub), `web-description` (optional list, one item per paragraph: Obsidian text properties are single-line), `web-slug` (optional, keeps the `/work/<slug>` URL stable), `web-order` (optional number) |
  | reading | `web-title`, `web-author`, `web-note` (optional), `web-isbn` (optional) |
  | uses | each list property `web-<section>` becomes a section, and each item is `Name — how I use it`, with an optional trailing URL |

- **Scan:** the sync walks every `.md` file under the vault, skipping `.obsidian/` and `.trash/`, and reads only the frontmatter. The body is split off at the closing `---` fence and never reaches the output.
- *Alternative:* fixed paths. That breaks when she moves a note in Obsidian.
- *Alternative:* a nested `web:` block (the first draft). Rejected because Obsidian's property editor can't edit nested YAML.
- The freshness date comes from the `Bitacora/` folder next to the opted-in note. `Contexto.md` sits right beside it, which makes it the natural note to opt in.

### Shared schemas between the build and the sync
- The zod schemas move into `src/content/schemas.ts`, imported from `astro/zod`. Both `content.config.ts` and the sync script use them.
- The sync validates each note's `web-*` properties, mapped to fields, against the same schema the build will enforce. A bad property therefore fails at sync time with the note's path, not later at build time.

### Outputs and ownership markers
- **Projects:** each becomes `src/content/projects/vault-<slug>.md`, where `<slug>` comes from `web-slug` or else the title.
  - The frontmatter carries `source: vault` and `lastWorked`.
  - The body comes from an optional `web-description` property (English markdown).
- **Reading:** becomes `src/content/reading.json`. **Uses:** becomes `src/content/uses.json`. Each carries `"source": "vault"`.
- The sync deletes only files whose names start with `vault-` and that carry `source: vault`. If `reading.json` or `uses.json` exists without that marker, the sync treats it as hand-written and stops with an error rather than overwrite it.
- *Alternative:* a separate `generated/` directory. It would need a second glob per collection and makes hand-written and synced projects harder to order together.

### Freshness is a date, rendered relative at build
- The sync stores `lastWorked: YYYY-MM-DD`, taken from the newest file name in a sibling `Bitacora/` folder.
- The poster shows "worked on this week / N weeks ago", computed at build time. The phrase is therefore only as fresh as the last deploy, which is acceptable because she deploys after syncing anyway.

### Running the script
- `scripts/sync-vault.ts` runs with Node 24's built-in type stripping (`node scripts/sync-vault.ts`), so no build step or `tsx` dependency is needed.
- The vault path comes from the `VAULT` environment variable, defaulting to `~/TheVault`.
- New dev dependency: `yaml`, for parsing frontmatter.

### Book cover
- When `web-isbn` is set, the sync fetches `https://covers.openlibrary.org/b/isbn/<isbn>-M.jpg?default=false`. The image is saved as `public/reading/<isbn>.jpg`, and stale covers are removed.
- On failure it logs a warning and continues (spec: now-reading).
- The cover is committed like any other asset, so builds stay offline.

### Paperback and card
- The paperback is a `<button>` in `About.astro`, positioned on the bench in painting units at desktop width. On phones it sits at the poster's foot so it doesn't cover the passenger.
- The button's text, "Now reading: Title by Author", is visually hidden behind the spine and remains the fallback without JavaScript.
- The card is a small native `<dialog>`, styled like a library card and following the `ProjectDialog` focus pattern.
- *Alternative:* a line inside the poster. It is cheaper, but loses the object-in-the-scene charm she chose.

### Bag and `/uses`
- An SVG duffel sits on the luggage rack of the first Work panel. It is an `<a href="/uses">` with `aria-label="Open Sara's setup"`.
- `src/pages/uses.astro` reuses the `/work/[slug]` page shell: a back link, the paper sheet, and the afternoon car backdrop. Sections render as a packing list.
- *Alternative:* a dialog over the train. A real page is shareable and is the `/uses` convention people expect.

### Real content (hand-written)
- `site.json`:
  - title "Software Engineer · AI & Data"
  - About bio with "BBVA" in place of "a bank"
  - email `hello@sara.coffee`
  - links GitHub, LinkedIn and Hugging Face
  - `placeholder: false`
- `experience.yaml` gets five stops from the CV. The Delegated Solution Architect training (Jan 2026) goes into the IPA Architect stop's summary rather than becoming a stop of its own.
- Hand-written CV projects (`agent-researcher.md` and the others) stay as normal content files. Only OpenRoutine is vault-synced at first, to prove the path.

### Email routing
- Sara set up Cloudflare Email Routing herself on 2026-10-12. The sara.coffee MX records point to route{1,2,3}.mx.cloudflare.net, and SPF includes `_spf.mx.cloudflare.net`.
- What's left is checking that a test mail reaches her Gmail.

## Risks / Trade-offs

- **A stray `web: true` leaks a note's `web-*` properties.** Mitigation: only `web-*` properties are ever read. The sync prints a summary of what it published, and she reviews the diff before committing.
- **Frontmatter typo in the vault breaks the sync.** Mitigation: the sync errors with the note path and field, and writes nothing (atomic: all outputs are staged in memory first).
- **Relative freshness goes stale between deploys.** Accepted. If it matters later, the phrase could be computed client-side.
- **Bench/rack coordinates drift if the scene art is ever repainted.** Mitigation: positions live in one CSS block per object, and Playwright screenshot checks at each breakpoint.

## Migration Plan

1. Land the shared schemas, content collections and the sync with fixture tests.
2. Sara adds `web-*` properties to OpenRoutine's `Contexto.md` (already opted in) and opts in a book note and a setup note. Run the sync, review the diff, commit.
3. Hand-write the CV content. Commit.
4. Verify that a test mail to hello@sara.coffee arrives.
5. Deploy. Rollback is to redeploy the previous commit.

## Open Questions

- Her Hugging Face profile URL and X handle. Each link is added once she gives it, and omitted until then.
- Whether `public/resume.pdf` should be the CV as-is, which shows her Gmail, or a version with `hello@sara.coffee`. This is content only, and either works with the plan.
