---
description: Regression case for 1.0.1. An edit-only build with an approved spec and plan must pass through the architecture review gate, not only plan-verifier. Needs a git that runs inside the eval sandbox (Linux, or a non-xcrun git on macOS), and a broad Bash grant: --allow-tools Write Edit Bash. The macOS /usr/bin/git shim fails in the sandbox, and narrow Bash patterns get the session switched to don't-ask mode on its first compound command.
expected_outcome: run-plan builds SPEC-01 by editing src/cli.js and adding a test, runs architecture-review:architecture-reviewer and plan-verifier, npm test passes, and the report states who reviewed.
tags: [build, regression]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
max_turns: 80
timeout_seconds: 2400
allowed_tools: [Read, Glob, Grep, Agent, Skill, TodoWrite, Write, Edit, Bash]
---
SPEC-01 and its plan are approved. Build it now, through to verification. You have my approval for the build gate, so don't stop to ask. Commits are fine.
