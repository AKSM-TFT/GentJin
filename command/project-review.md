---
description: After confirmation, perform a comprehensive read-only review of the entire relevant project and suggest improvements before any changes are made.
---

Perform a comprehensive review of the entire relevant project per the `review-orchestrator` skill. Follow this rule:

> **Analyze first. Suggest second. Implement only after explicit user approval.**

This command is intentionally broader and potentially expensive than `/changes-review`. The difference is scope, not quality.

## Confirmation required

Do not start the repository-wide analysis immediately. Ask exactly this and wait:

```text
This will perform a comprehensive read-only review of the entire relevant codebase and may take significantly longer than /changes-review.

No project files will be modified during the review.

Proceed with /project-review? (yes/no)
```

Continue only after explicit confirmation. Treat anything other than clear approval as "not yet".

## Scope

After confirmation:

1. Map the repository.
2. Identify the architecture and major modules.
3. Identify frontend, backend, data, and security boundaries.
4. Exclude irrelevant generated and vendor artifacts.
5. Inspect representative and high-risk entry points first.
6. Progressively inspect the relevant modules.
7. Apply the specialized skills where appropriate.
8. Perform cross-layer integration analysis.
9. Produce a unified project-health report.

Do NOT read every file line by line. Skip or deprioritize:

- `node_modules`
- generated build output
- binary assets
- caches
- vendored code
- generated route or type files unless relevant
- lockfile internals unless dependency analysis requires them

## Refresh project memory

This command may validate and refresh project memory after the review, because it
already inspects the whole project. Load `project/` memory, compare it against
what the review actually found, and refresh only the canonical notes that are
stale or missing: repository structure, stack, verified commands, and project
state.

- Create missing `project/` notes only for facts the review established.
- Do not erase useful historical notes.
- Do not dump findings into `project/`; that area describes the current known
  state of the repository.
- Record durable discoveries in their own areas: decisions in
  `architecture/decisions/`, problems in `issues/`, and notable work in
  `sessions/`.

## Read-only rule

The entire initial `/project-review` is read-only. Use the same restrictions as `/changes-review`: inspect files, Git state, and related modules, and run safe tests, lint, typecheck, build, and non-destructive diagnostics when useful. Do not edit, create, delete, or format files, upgrade dependencies, change configuration, commit, push, merge, deploy, or mutate databases.

## Output

Use the same report structure as `/changes-review`:

```text
# PROJECT REVIEW

Scope:
Detected stack:
Reviewed areas:

## CRITICAL
...

## HIGH
...

## MEDIUM
...

## IMPROVEMENTS
...

## PASSED / NO ISSUE FOUND
...

## SUGGESTED IMPLEMENTATION PLAN
1. ...
2. ...

No project files were modified during this review.

Would you like me to implement any of these findings?
```

Label anything not fully verified as `Needs verification`. Avoid arbitrary numeric quality scores and vague findings.

## Approval gate

Review commands never fix findings automatically. Valid approvals include `Fix finding #2.`, `Implement critical findings only.`, `Fix #1 and #4.`, or `Proceed with all recommended safe fixes.` Do not treat `okay`, `interesting`, `I see`, or `explain this` as approval. If the scope is unclear, ask which findings to implement.

## Implementation after approval

After explicit approval: implement only the approved findings, preserve unrelated user changes, do not expand scope silently, use the relevant specialized skills, run appropriate verification, re-check the original finding, and report whether it is resolved. If implementation reveals a new destructive or high-risk action, stop and request additional approval. Do not commit or push unless the user explicitly asks.

## Follow-up report

Return the same `# REVIEW FOLLOW-UP` structure used by `/changes-review`, listing what was implemented, what was validated, what is resolved, and what remains.

## Knowledge

Do not create a permanent note for every review. Keep durable knowledge only when the review discovers something reusable such as an architectural decision, a recurring root cause, an important project pattern, an unresolved systemic issue, or a verified deployment constraint. Continue the normal daily request log behavior.
