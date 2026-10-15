---
description: The fixed SDD scenario and the cost baseline. A small feature goes from request to a spec and a plan, through the plugin's own agents.
expected_outcome: spec-creator writes a spec with AC-n criteria under .context/specs/, then implementation-planner writes a .plan.md beside it whose tasks cite those criteria. Nothing is implemented.
tags: [smoke, cost-baseline]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
max_turns: 60
timeout_seconds: 1500
allowed_tools: [Read, Glob, Grep, Agent, Skill, TodoWrite, Write, Edit]
---
Add a `--json` flag to `todo list` that prints the todos as JSON. Write the spec for it, then the implementation plan. Don't build anything yet, and don't wait for me: where something is unclear, make a reasonable assumption and record it in the spec.
