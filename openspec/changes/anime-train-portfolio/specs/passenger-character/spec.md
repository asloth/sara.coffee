# Spec Delta

## Purpose

The animated passenger is an anime version of the site owner who rides the train with the visitor. She reacts to where the visitor is and to being clicked, and gives the journey its personality.

## ADDED Requirements

### Requirement: Likeness anchors
The passenger SHALL always wear cat-eye frames in tortoiseshell that is dark burgundy-brown on top fading to honey-amber at the bottom. She SHALL have long straight black hair and warm light-tan skin, in every pose and at every station.

#### Scenario: Any pose
- **WHEN** the passenger is shown in any pose (reading, looking up, smiling, pushing her glasses up, book closed)
- **THEN** the cat-eye tortoiseshell glasses, long black hair and skin tone match the approved design

### Requirement: Pose follows the current station
The passenger SHALL take a pose set by the current station:
- Departure: reading
- About: looking at the visitor and smiling
- Work: reading
- Experience: looking up at the route map
- Last stop: book closed, smiling at the visitor

Pose changes SHALL be quick cuts, in the style of limited anime animation.

#### Scenario: Reaching About
- **WHEN** the current station changes from Departure to About
- **THEN** within 200 ms the passenger cuts from reading to looking at the visitor with a smile

#### Scenario: Reaching the last stop
- **WHEN** the visitor reaches Last stop
- **THEN** the passenger has closed her book and is smiling at the visitor

### Requirement: Idle life
While shown, the passenger SHALL keep a subtle idle loop: breathing, swaying with the train's motion, small head and hair movement, and blinking every few seconds. Her legs and seat SHALL stay still.

#### Scenario: Visitor stops scrolling
- **WHEN** the visitor stays at one station for 10 seconds
- **THEN** the passenger blinks at least once and her upper body visibly sways with the train, while her legs do not move

### Requirement: Reaction when clicked
Clicking or tapping the passenger SHALL play a short beat where she pushes her glasses up. She SHALL then return to the current station's pose. The reaction SHALL also be triggerable from the keyboard.

#### Scenario: Click
- **WHEN** a visitor clicks the passenger at the Work station
- **THEN** she pushes her glasses up for about 1.4 s and then goes back to reading

#### Scenario: Keyboard activation
- **WHEN** the passenger has keyboard focus and the visitor presses Enter or Space
- **THEN** the same glasses reaction plays

### Requirement: Graceful fallback
If the animation runtime fails to load or the browser cannot run it, the passenger SHALL appear as a static image of the current station's pose. Nothing else on the page SHALL break.

#### Scenario: Runtime blocked
- **WHEN** the animation runtime script fails to load
- **THEN** a static image of the reading pose appears where the passenger would be, and the journey, navigation and content all keep working

### Requirement: Reduced motion
When reduced motion is requested, the passenger SHALL hold still in each station's pose. There SHALL be no sway or breathing, and only blinking may remain.

#### Scenario: Reduced motion
- **WHEN** `prefers-reduced-motion: reduce` is set
- **THEN** the passenger changes pose per station but does not sway or bob
