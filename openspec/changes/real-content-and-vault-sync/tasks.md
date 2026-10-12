# Tasks

## 1. Schemas and collections

- [ ] 1.1 Move the zod schemas into `src/content/schemas.ts` and import them from `content.config.ts`. Verify: `npm run build` passes unchanged.
- [ ] 1.2 Add a `source` (`hand` | `vault`) field and an optional `lastWorked` date to the project schema. Verify: `astro check` passes with the existing placeholders.
- [ ] 1.3 Add a `reading` collection (title, author, optional note, optional isbn/cover) and a `uses` collection (sections → items with name, line, optional href). Both are optional files. Verify: the build passes with neither file present.

## 2. Vault sync

- [ ] 2.1 Add the `yaml` dev dependency and a fixture vault under `tests/fixtures/vault`. It needs one opted-in project with a Bitacora, one private note, one note with `web` unchecked, one note saving `web` as text `"true"`, and reading and uses notes. Verify: `npm install` succeeds.
- [ ] 2.2 Write `scripts/sync-vault.ts`: walk the vault (skipping `.obsidian`/`.trash`), read frontmatter only, filter on `web` being true (boolean or `"true"`), map `web-*` properties to fields (labels from link domains, `web-<section>` lists into uses sections), and dispatch on `web-kind`. Validate with the shared schemas, stage all outputs in memory, then write. Verify: the `node --test` cases in 2.4 pass.
- [ ] 2.3 Implement the ownership rules: only `vault-*` files carrying `source: vault` get created or deleted, and a hand-written `reading.json`/`uses.json` stops the sync with an error. Add `lastWorked` from the newest `Bitacora/YYYY-MM-DD.md` name. Add the Open Library cover fetch, where failure is only a warning. Verify: the tests in 2.4 pass.
- [ ] 2.4 Write `tests/sync.test.ts` (`node --test`) covering every vault-sync scenario:
  - a private note is ignored
  - an unchecked `web` removes the generated file
  - body text and non-`web-` properties never appear in the output
  - `lastWorked` is taken from the log, and a missing log folder is fine
  - an invalid block exits non-zero and leaves files unchanged
  - hand-written files are untouched
  - a cover failure still succeeds

  Add `npm run sync` and `npm run test:sync` scripts. Verify: `npm run test:sync` passes.
- [ ] 2.5 Document the opt-in and the `web-*` properties for each kind (with an Obsidian screenshot of a filled-in project) and the sync → review → commit → deploy flow in `README.md`. Verify: the README example properties pass the sync when pasted into the fixture vault.

## 3. Now reading

- [ ] 3.1 Add the CSS paperback `<button>` to `About.astro`, on the bench at desktop and at the poster's foot on phones, with the spine title and a visually hidden "Now reading: … by …". Render nothing without a reading entry. Verify: screenshots at 390, 768 and 1440 px show the book without covering her face.
- [ ] 3.2 Add the library-card `<dialog>` (title, author, note, cover). It opens on activate, closes on Esc or the close button, and returns focus to the button. Verify: a Playwright test of keyboard open/close and focus return, a no-JS test that the text is present, and axe clean.

## 4. Setup bag and /uses

- [ ] 4.1 Create `src/pages/uses.astro` with the `/work/[slug]` shell, a packing-list layout from the `uses` collection, and a back link to `/#work`. Verify: a Playwright test that `/uses` renders every section and item from the fixture content, and axe clean.
- [ ] 4.2 Add the SVG duffel `<a href="/uses">` on the first Work panel's luggage rack, with `aria-label="Open Sara's setup"`. Verify: a Playwright test that the link exists with that name and navigates, plus screenshots at the three widths.

## 5. Real content

- [ ] 5.1 Update `site.json`:
  - title "Software Engineer · AI & Data"
  - bio naming BBVA
  - email `hello@sara.coffee`
  - GitHub (asloth) and LinkedIn (sbenelramirez) links
  - `placeholder: false`

  Then re-check that the phone bio's first paragraph keeps her face visible. Verify: a phone screenshot of the About station.
- [ ] 5.2 Rewrite `experience.yaml` with the five CV stops (Santo Toribio, BBVA Software Architect / Data Engineer, BBVA IPA Architect, PUC Chile diploma, Valere). Verify: the Experience station shows five stops in date order with no placeholder labels.
- [ ] 5.3 Replace `projects/placeholder-*.md` with hand-written Agent Researcher, Agentic API Tests, MLOps Recipes and Voice-to-Image. Verify: the Work station shows them, and each `/work/<slug>` page builds.
- [ ] 5.4 Sara fills in the `web-*` properties on `Projects/openroutine/Contexto.md` (it already has `web: true`), and opts in a book note and a setup note, then runs `npm run sync`. Review the diff with her. Verify: `vault-openroutine.md`, `reading.json` and `uses.json` are generated and nothing else changed.
- [ ] 5.5 Replace `public/resume.pdf` with the CV version she chooses. Verify: the Resume link opens it.
- [ ] 5.6 Update `tests/content.spec.ts`, which now expects no placeholders anywhere. Verify: `npm test` passes.

## 6. Email and release

- [x] 6.1 Email Routing for hello@sara.coffee (Sara did this herself on 2026-10-12; MX and SPF records are live).
- [ ] 6.1a Send a test mail to hello@sara.coffee. Verify: it lands in her Gmail and not in spam.
- [ ] 6.2 Run the integration check: `npm run build`, `npm test`, `npm run test:sync`, and `npm run test:perf` in system Chromium (Lighthouse should not regress below mobile 94 / desktop 100 / a11y 100). Verify: all pass.
- [ ] 6.3 Commit, then `npm run deploy`, and walk every station plus `/uses` on sara.coffee with Sara. Verify: she signs off.

## Workflow follow-up

- Archive `anime-train-portfolio` first (once 7.3/8.3 are signed off) so that `portfolio-content` exists in `openspec/specs/`, then archive this change.
