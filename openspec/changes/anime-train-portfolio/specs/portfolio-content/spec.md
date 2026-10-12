# Spec Delta

## Purpose

Defines what owner content the portfolio shows (about, projects, experience, contact) and how it appears inside the journey. The owner can add or edit content without touching layout or animation.

## ADDED Requirements

### Requirement: Content is data, separate from layout
All owner content (name, title, bio, projects, experience entries, skills, contact links, resume file) SHALL come from editable content files. Adding a project or job SHALL NOT require editing layout or animation code.

#### Scenario: Owner adds a project
- **WHEN** the owner adds a new project entry to the projects content
- **THEN** after a rebuild the project appears as a poster in the Work station, with no other file changed

### Requirement: Placeholder state
Before the owner has filled in content, every station SHALL show clearly marked placeholder content. The build SHALL succeed with placeholders.

#### Scenario: Empty projects list
- **WHEN** the projects content has no real entries
- **THEN** the Work station shows placeholder posters labelled as placeholders, and the build succeeds

### Requirement: Projects as posters with detail views
Each project SHALL appear in the Work station as an ad-poster style card showing its title, a one-line summary and a cover image. Opening a poster SHALL show the project's detail: description, role, stack, links and images. The detail view SHALL have a shareable URL.

#### Scenario: Opening a project
- **WHEN** a visitor clicks a project poster
- **THEN** the project's detail opens with its description, role, stack and links, and the address changes to that project's URL

#### Scenario: Closing a project
- **WHEN** the visitor closes the detail view or presses Escape
- **THEN** they are back in the Work station at the same scroll position, with focus returned to the poster they opened

### Requirement: Experience as route-map stops
Experience entries SHALL appear in the Experience station as a timeline styled as a line map. Each job or school is a stop showing its organisation, role, dates and a short summary.

#### Scenario: Reading the timeline
- **WHEN** a visitor is at the Experience station
- **THEN** each experience entry is visible as a stop in date order, with organisation, role and dates readable

### Requirement: Contact at the last stop
The Last stop station SHALL present the owner's contact options, styled as a train ticket. The options are email, plus any of GitHub, LinkedIn and others that are configured. Each option SHALL be a working link.

#### Scenario: Contacting the owner
- **WHEN** a visitor at Last stop activates the email option
- **THEN** their mail client opens with the owner's address filled in

### Requirement: Content stays readable over art
Text SHALL meet WCAG AA contrast against its background at every time of day. Text SHALL be real, selectable HTML, not baked into images.

#### Scenario: Night station
- **WHEN** the Last stop is shown at night
- **THEN** the contact text has at least 4.5:1 contrast against its background and can be selected and copied
