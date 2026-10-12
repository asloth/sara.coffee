# Spec Delta

## Purpose

Gives the owner's working setup (agents, machine, notes, making tools) its own shareable page, reached from a bag on the luggage rack in the Work car.

## ADDED Requirements

### Requirement: Setup page at /uses
The site SHALL serve a `/uses` page listing the owner's setup, grouped into sections. Each item SHALL have a name and a short line on how she uses it, plus an optional link. The page SHALL work as a standalone page with a way back to the journey.

#### Scenario: Visiting /uses directly
- **WHEN** a visitor opens sara.coffee/uses
- **THEN** they see the setup grouped by section, each item with its name and usage line, and a link back to the train

### Requirement: Bag on the luggage rack
The Work station SHALL show a bag on the overhead luggage rack that links to `/uses`. It SHALL have an accessible name that says it opens the setup.

#### Scenario: Opening the bag
- **WHEN** a visitor activates the bag in the Work car
- **THEN** they arrive at the setup page

#### Scenario: Screen reader
- **WHEN** a screen reader reaches the bag
- **THEN** it is announced as a link whose name says it opens the owner's setup

### Requirement: Setup content is data
Setup sections and items SHALL come from a content file that the vault sync can generate. Adding an item SHALL NOT require editing layout code.

#### Scenario: Adding a tool
- **WHEN** the owner adds an item to her setup content and rebuilds
- **THEN** it appears in its section on /uses with no other file changed
