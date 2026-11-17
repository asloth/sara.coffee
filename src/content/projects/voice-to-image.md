---
title: Retrato Hablado
summary: A Spanish voice CLI that turns a spoken description into a generated portrait.
year: 2026
role: Creator, design and development
cover: /work/voice-to-image.webp
stack: [Python, OpenAI API, Pydantic, sounddevice]
links:
  - { label: GitHub, href: "https://github.com/asloth/image_audio_generation_portrait" }
order: 5
---

A command-line tool that records your voice, transcribes it, and collects facial characteristics into a Pydantic schema. When fields are missing, it asks follow-up questions in Spanish through text-to-speech, and once the description is complete it generates a portrait image.

Each input passes a moderation check, and the tool tracks usage and estimated cost for transcription, text, speech, image generation and moderation. It is a small script of about 16 KB of Python. The README has a safety section, because the same flow could be used for witness-style portraits.
