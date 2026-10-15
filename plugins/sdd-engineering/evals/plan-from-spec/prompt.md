---
description: The planner builds from the approved spec in the repo instead of inventing requirements.
expected_outcome: implementation-planner reads SPEC-01 and writes .context/specs/2026-10-15-list-json-output.plan.md with tasks mapped to AC-1..AC-4 and nothing out of scope. spec-creator is not involved.
tags: [smoke]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
max_turns: 40
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Agent, Skill, TodoWrite, Write, Edit]
---
SPEC-01 is approved. Write the implementation plan for it. Don't start building.
