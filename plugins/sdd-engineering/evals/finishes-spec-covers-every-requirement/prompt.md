---
description: 1.1.0 behaviour. A draft spec states a goal no acceptance criterion covers; finishing the spec must cover it or explicitly drop it, and record a requirement coverage table.
expected_outcome: spec-creator edits SPEC-02, adds an AC for printing the completed todo's text, and adds a Requirement coverage table in which every requirement maps to an AC.
tags: [smoke, "1.1.0"]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
max_turns: 40
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Agent, Skill, TodoWrite, Write, Edit]
---
SPEC-02 is still a draft. Finish it so it is ready for planning. Don't ask me anything: where something is unclear, make a reasonable assumption and record it. Don't plan or build.
