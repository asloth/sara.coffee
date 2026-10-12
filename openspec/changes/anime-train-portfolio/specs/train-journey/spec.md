# Spec Delta

## Purpose

The scroll-driven train ride is the portfolio's main presentation. Scrolling moves the visitor through five stations while the day turns into night.

## ADDED Requirements

### Requirement: Five stations in fixed order
The journey SHALL present exactly five stations in this order: Departure (hero), About, Work, Experience, Last stop (contact). Each station SHALL show its name the way a station sign would.

#### Scenario: Scrolling from top to bottom
- **WHEN** a visitor scrolls from the top of the page to the bottom
- **THEN** they pass Departure, About, Work, Experience and Last stop, in that order, and each one's name is visible while it is the current station

#### Scenario: Loading the page
- **WHEN** the page first loads with no URL fragment
- **THEN** the current station is Departure and the visitor's name and title are visible without scrolling

### Requirement: Scroll position drives the journey
Train movement SHALL be tied to scroll position, not to time. Scrolling backwards SHALL play the journey backwards, and stopping SHALL stop the movement between stations.

#### Scenario: Scrolling back up
- **WHEN** a visitor at Experience scrolls back up
- **THEN** the scene returns through Work toward About with the same visuals it showed on the way down

#### Scenario: Stopping mid-way
- **WHEN** a visitor stops scrolling between two stations
- **THEN** the scene holds still. Only ambient motion continues: the passenger's idle animation, passing scenery and flickering lights

### Requirement: Continuous day-to-night lighting
The time of day SHALL be a continuous function of journey progress. It goes from morning at Departure, through noon, afternoon and sunset (Experience), to night at Last stop, with no hard cut between stations.

#### Scenario: Between About and Work
- **WHEN** the visitor is halfway between About and Work
- **THEN** the lighting is a blend of the noon and afternoon looks, not either one alone

#### Scenario: Arriving at the last stop
- **WHEN** the visitor reaches Last stop
- **THEN** the scene is at night, with lit interior lights and neon outside the windows

### Requirement: Desktop presentation walks through the cars
On viewports at least 1024 px wide, the journey SHALL move the camera sideways through connected train cars, with each station's content placed inside the car or on the platform for that station.

#### Scenario: Wide desktop
- **WHEN** the viewport is 1440 × 900 and the visitor scrolls from About to Work
- **THEN** the camera moves sideways into the next car, and the door between the cars visibly opens as it passes

### Requirement: Mobile presentation stays in one car
On viewports narrower than 1024 px, the journey SHALL use one portrait view of a single car. The stations change outside the window, and each station's content panel rises into view.

#### Scenario: Phone in portrait
- **WHEN** the viewport is 390 × 844 and the visitor scrolls from Departure to About
- **THEN** the window view changes to the About station, the lighting moves toward noon, and the About content panel slides up without the page scrolling sideways

### Requirement: Reduced motion keeps all content
When the visitor's system asks for reduced motion, the journey SHALL drop camera movement and parallax and SHALL change stations with a fade. All content and the lighting change SHALL stay available.

#### Scenario: Reduced motion enabled
- **WHEN** `prefers-reduced-motion: reduce` is set and the visitor scrolls from Work to Experience
- **THEN** the scene cross-fades to the Experience station, with no sideways camera movement and no parallax, and the Experience content is fully readable

### Requirement: Performance budget
The journey SHALL stay responsive on mid-range hardware. Above-the-fold content SHALL render before heavy art finishes loading.

#### Scenario: First paint on a slow connection
- **WHEN** the page loads on a throttled "Fast 4G" connection
- **THEN** the Departure station name, the visitor's name and the navigation are readable within 2.5 s (LCP), even though later station art is still loading

#### Scenario: Smooth scrolling
- **WHEN** a visitor scrolls the whole journey on a mid-range laptop
- **THEN** scroll-driven animation holds about 60 fps without long tasks over 100 ms during scrolling
