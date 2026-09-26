---
name: architecture-review
description: Analyze significant structural changes before implementing them. Use when adding a subsystem, redesigning a major flow, changing authentication architecture, introducing workers/queues/background services, integrating an external provider, creating shared infrastructure, changing module communication, or when the user asks how something should be built.
---
# Architecture Review

## Principle

Prefer the smallest architecture change that solves the real problem. Do not introduce unnecessary abstraction.

## Inspect

- Current architecture and module boundaries.
- Affected modules and their responsibilities.
- Ownership boundaries: who owns a responsibility, and where it must not leak.
- Data flow across the change, including persistence and external calls.
- Dependency direction; flag cycles and inverted dependencies.
- Failure boundaries: what happens when each dependency fails, times out, or returns partial results.
- Lifecycle and process ownership, especially for long-running work such as workers, queues, schedulers, and background services.
- Compatibility with existing conventions, patterns, and naming.

## Evaluate

- Alternatives with their tradeoffs, including doing nothing.
- Migration path from the current structure, and whether it can be incremental.
- Rollback and coexistence during rollout.
- Operational cost: observability, failure modes, and new failure surfaces.

## Output

Present the recommended structure, why it fits this codebase, the rejected alternatives with reasons, the migration steps, and the risks with mitigations. Then ask for approval before implementing a structural change.

## Rules

- Do not redesign working code that the request does not touch.
- Do not add layers, interfaces, or abstractions without a demonstrated need.
- Keep responsibilities where the project already keeps them.
- Do not implement structural changes without explicit approval.
