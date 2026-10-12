# Spec Delta

## Purpose

Lets visitors, especially recruiters in a hurry, reach any station or the resume directly without riding the whole journey. Works by mouse, keyboard and screen reader.

## ADDED Requirements

### Requirement: Route map is the navigation
The site SHALL show a route map with one stop per station. It SHALL mark the current station and the visitor's progress between stops.

#### Scenario: Progress shown on the map
- **WHEN** the visitor is between Work and Experience
- **THEN** the route map highlights the segment between those two stops, and Work stays marked as the last station passed

### Requirement: Jump to a station
Choosing a stop on the route map SHALL take the visitor to that station. The URL SHALL update to a fragment that names the station.

#### Scenario: Clicking a stop
- **WHEN** a visitor at Departure clicks the Experience stop
- **THEN** the journey moves to Experience, the URL ends in `#experience`, and focus moves to the Experience content heading

#### Scenario: Opening a deep link
- **WHEN** a visitor opens the site at `/#work`
- **THEN** the page loads already at the Work station, without playing the journey from Departure

### Requirement: Resume always reachable
A link to the resume PDF SHALL be visible at every station and on every viewport. It SHALL open the PDF without leaving the current page.

#### Scenario: Recruiter on mobile
- **WHEN** a visitor on a 390 px wide viewport is at any station
- **THEN** a "Resume" control is visible without scrolling, and activating it opens the PDF in a new tab

### Requirement: Keyboard and screen reader access
Every navigation control SHALL be reachable and usable by keyboard with a visible focus indicator. The route map SHALL be exposed as a navigation landmark, with the current station announced as the current location.

#### Scenario: Keyboard only
- **WHEN** a visitor presses Tab from page load
- **THEN** focus reaches a "Skip to content" link, then the route map stops in station order, then the Resume link, each with a visible focus ring

#### Scenario: Screen reader
- **WHEN** a screen reader user lands on the route map
- **THEN** it is announced as navigation, with five stops, and the current stop is marked as the current location
