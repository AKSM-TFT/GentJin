---
name: refactoring
description: Split mixed-responsibility code into framework-native structure without changing behavior. Use when a file mixes rendering, data fetching, business rules, or validation, when reusable logic is trapped in one place, or when the user asks to refactor, split, or reorganize code into components, hooks, services, utils, or similar.
---
# Refactoring

## Principle
Behavior-preserving splits only. Prefer the smallest split that gives each extracted unit one clear responsibility. Do not change features, fix unrelated bugs, or redesign working architecture during a refactor.

## When Not To Use
- A large file with one clear responsibility can stay; split by responsibility, not by line count.
- Do not refactor code the request does not touch.
- Do not move everything into a global shared directory prematurely.
- For a structural redesign, migration path, or new subsystem, use `architecture-review` first.

## Inspect
Apply `project-conventions` before touching code:
- Learn the target project's framework, runtime, folder layout, and naming, import/export, and testing conventions.
- Locate where similar components, hooks, services, queries, schemas, types, and utilities already live.
- Identify each responsibility inside the target file: rendering, data fetching, mutations, validation, transformations, business rules, types, configuration.
- Search for an existing implementation before extracting anything new.
- Note all callers, imports, and tests that the split will affect.

## Structure Snapshot (ARCHITECTURE.md)

Before moving any code, ensure `<project-root>/ARCHITECTURE.md` exists and is
current for the target area:

- If it is missing, create it: current folder layout, what lives where, and a
  category mapping (hooks directory, components directory, types home, utils
  home, services home, tests location).
- If it exists but no longer matches the repository (renamed/moved folders,
  new categories), refresh the stale parts first.
- Resolve every responsibility's destination from this mapping, never from the
  source file's folder. A hook extracted from a component folder still belongs
  in the hooks directory (for example `src/hooks/<feature>/<hook>`).
- Create only feature subfolders. Never invent a new top-level category; reuse
  the closest existing one the snapshot records.

## Plan
Present the recommended split before moving code when the change is structural:
- Target location for each responsibility, reusing existing directories.
- What stays, what moves, and what becomes shared.
- New files only when no suitable home exists; every new file or folder needs a real responsibility.
- Rejected alternatives with reasons.

Prefer framework-native placement over a generic folder template. Resolve locations through `ARCHITECTURE.md`; typical mapping, adapted to the project:
- Reusable UI -> shared or feature components.
- Stateful reusable behavior -> hooks or composables.
- Business rules and external integrations -> focused services behind narrow interfaces.
- Data access -> existing repository, query, or server-function path; never duplicate queries per page.
- Validation and schemas -> alongside the feature or centralized only when genuinely shared.
- Domain shapes -> existing types location.
- Cross-cutting pure helpers -> `lib` or `utils`.
- Configuration -> separate from behavior.

For medium or growing applications, prefer feature-oriented grouping such as `features/<name>/{components,hooks,services,schemas,types}`, with genuinely shared pieces under `components/shared`.

## Split Rules
- One responsibility per extracted unit; keep functions small and focused.
- Keep responsibilities where the project already keeps them.
- Extract reusable units only when the pattern genuinely repeats or reuse is realistically expected.
- Isolate provider-specific logic; do not duplicate business rules across UI and backend.
- Update all imports, callers, and barrel files in the same change.
- Do not add layers, interfaces, or abstractions without a demonstrated need.
- Never copy insecure, broken, or deprecated patterns into the new structure.

## Verify
- Preserve behavior: no feature changes, no API contract changes, no data-semantics changes.
- Use `test-strategy` to decide what the split needs verified, then run the project's real typecheck, lint, test, and build commands. Never claim a check passed unless it ran.
- If a regression appears, load and follow `systematic-debugging` before continuing.
- Re-check the diff: confirm every moved piece still has exactly one owner and no caller was missed.
