---
title: Agent Researcher
summary: A LangGraph research agent that plans, searches in parallel and answers with citations.
year: 2026
role: Creator, design and development
cover: /work/agent-researcher.webp
stack: [Python, LangGraph, FastAPI, React, LanceDB, MCP]
links:
  - { label: GitHub, href: "https://github.com/asloth/agent-researcher" }
order: 3
---

An autonomous research agent with an orchestrator-workers design, based on Anthropic's "Building Effective Agents". A planner splits a question into 3 to 5 research angles, or answers directly when no research is needed. Each angle goes to a parallel worker agent with tool access, capped at 6 tool-call loops, and a synthesizer writes a cited answer in Spanish.

Memory runs through an MCP server over stdio, backed by an embedded LanceDB store that holds saved facts and indexed PDF chunks. The FastAPI backend streams answers to a React 19 frontend over SSE, with views for projects, chat, memory, documents and chunks.
