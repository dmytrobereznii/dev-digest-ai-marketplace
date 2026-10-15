---
type: tool_order
before: { tool: Agent, input_match: '"subagent_type":"[^"]*architecture-reviewer"' }
after: { tool: Agent, input_match: '"subagent_type":"[^"]*plan-verifier"' }
arm: with-only
---
