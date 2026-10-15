---
description: Negative case. A plain question about the code must not start the SDD workflow.
expected_outcome: A direct answer (an empty array). No sdd-engineering agent runs and no spec or plan file is created.
tags: [smoke, negative]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
max_turns: 10
timeout_seconds: 300
allowed_tools: [Read, Glob, Grep, Agent, Skill]
---
What does `list()` in src/todo.js return when there are no todos yet?
