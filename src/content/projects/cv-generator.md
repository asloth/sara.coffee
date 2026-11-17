---
title: CV Generator AI
summary: A Spanish CLI that interviews you and writes a Markdown CV, with cost tracking.
year: 2026
role: Creator, design and development
stack: [Python, OpenAI API, Pydantic, uv]
links:
  - { label: GitHub, href: "https://github.com/asloth/cv_generator_ai" }
order: 7
---

A command-line script that interviews you in Spanish for contact details, education and work experience, then writes a complete CV in Markdown. Every answer goes through a moderation model.

A small model (gpt-5-nano) validates the answers against a Pydantic schema and asks for whatever is missing. A larger model (gpt-5) writes the final CV only once the data is complete. The script saves the structured data as JSON and logs token usage and estimated cost per model.
