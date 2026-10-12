# Spec Delta

## Purpose

Lets the owner keep chosen parts of the site (projects, the current book, her setup) in her Obsidian vault and pull them into the site on demand, without anything private leaving her machine.

## ADDED Requirements

### Requirement: Publishing is opt-in per note
The sync SHALL consider a vault note only if its frontmatter property `web` is true (the checkbox value `true` or the text `"true"`, as Obsidian may save either). Notes without `web`, or with any other value, SHALL be ignored entirely.

#### Scenario: Private note in the vault
- **WHEN** the vault has a note without a `web` property (e.g. a visa or client note)
- **THEN** the sync output contains nothing derived from that note

#### Scenario: Publishing is switched off
- **WHEN** a previously synced note has its `web` property unchecked or removed
- **THEN** the next sync removes the content file it had produced

### Requirement: Only web- properties are read
For an opted-in note the sync SHALL copy only flat frontmatter properties whose names start with `web-`. The note body, its other properties and its file name SHALL NOT appear in the site.

#### Scenario: Spanish working notes stay private
- **WHEN** an opted-in note's body and its non-`web-` properties (e.g. `status: en desarrollo`) hold private notes
- **THEN** none of that body text appears in the generated content files or the built site

### Requirement: Freshness date from the project log
For an opted-in project with a `Bitacora` folder beside its note, the sync SHALL record the date of the newest dated log file as the project's last-worked-on date. It SHALL read file names only, never log contents.

#### Scenario: Recent work shows on the poster
- **WHEN** the project's newest log file is named `2026-10-12.md`
- **THEN** the project's poster shows it was last worked on 2026-10-12, expressed relative to the build date

#### Scenario: No log folder
- **WHEN** an opted-in project has no `Bitacora` folder
- **THEN** the poster shows no freshness line and the sync succeeds

### Requirement: Sync is manual and reviewable
The sync SHALL run only when the owner invokes it locally. It SHALL write ordinary files into the repository, so its result appears as a diff for the owner to review before committing. The site build and deploy SHALL NOT read the vault.

#### Scenario: Building without the vault
- **WHEN** the site is built on a machine with no vault
- **THEN** the build succeeds using the content files last committed

### Requirement: Invalid web properties fail loudly
If an opted-in note is missing a required field or has a wrong type, the sync SHALL stop with an error naming the note and the field. It SHALL leave all content files unchanged.

#### Scenario: Missing summary
- **WHEN** an opted-in project note has no `web-summary` property
- **THEN** the sync exits non-zero naming that note and `web-summary`, and no content file is modified

### Requirement: Hand-written content is never overwritten
The sync SHALL only create, update or delete files it generated itself, which are marked as generated. Content files written by hand SHALL be left untouched.

#### Scenario: Hand-written project alongside synced ones
- **WHEN** `projects/` contains a hand-written project and synced ones
- **THEN** a sync leaves the hand-written file byte-for-byte unchanged
