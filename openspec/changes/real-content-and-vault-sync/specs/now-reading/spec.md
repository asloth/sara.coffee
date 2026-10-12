# Spec Delta

## Purpose

Shows the book the owner is reading right now as a small object in the About scene, so the page feels current and changing books takes one edit.

## ADDED Requirements

### Requirement: Current book on the bench
When a current book is configured, the About station SHALL show a paperback beside the passenger with the book's title readable on it. It SHALL be drawn with code rather than an illustrated asset, so it needs no art rebuild when the book changes.

#### Scenario: Book configured
- **WHEN** the current book is "The Pragmatic Programmer" by David Thomas and Andrew Hunt
- **THEN** a paperback sits on the bench in the About station and its spine shows that title

#### Scenario: No book configured
- **WHEN** no current book is set
- **THEN** no paperback is shown and the About station is otherwise unchanged

### Requirement: Book card
Activating the paperback SHALL open a card showing the title, the author, and the owner's one-line note if present. If a cover image was fetched, the card SHALL show that too. The card SHALL be reachable and closable by keyboard, and closing it SHALL return focus to the paperback.

#### Scenario: Opening the card by keyboard
- **WHEN** a visitor tabs to the paperback and presses Enter
- **THEN** the card opens showing title and author, and Escape closes it with focus back on the paperback

### Requirement: Readable without JavaScript
Without JavaScript the title and author SHALL still be present as text in the About station.

#### Scenario: Scripts disabled
- **WHEN** the page loads with JavaScript off
- **THEN** "Now reading: <title> by <author>" is present as text in the About station

### Requirement: Cover lookup sends only the ISBN
If the book has an ISBN, its cover MAY be fetched from a public book-cover service during sync. Only the ISBN SHALL be sent. A failed lookup SHALL NOT fail the sync, and the book then shows without a cover.

#### Scenario: Cover service unavailable
- **WHEN** the cover lookup fails during sync
- **THEN** the sync succeeds and the card shows title and author without a cover
