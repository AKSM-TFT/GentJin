---
description: Review the current changes and their impact radius, report evidence-based findings, and suggest fixes without modifying the project until you approve them.
---

Perform a comprehensive review of the user's current work per the `review-orchestrator` skill. Follow this rule:

> **Analyze first. Suggest second. Implement only after explicit user approval.**

The user requested the review by invoking this command, so start immediately without asking for confirmation.

## Scope

Start from the current Git state:

- staged changes;
- unstaged changes;
- new or untracked source files when relevant;
- branch changes when needed to understand the work.

Resolve the project, then load the relevant project memory (`project/overview.md`, `project/structure.md`, and the architecture or module notes for the changed area) before inspecting the diff. Project memory supplies context for the review: existing architecture, module conventions, expected data flow, known patterns, and recorded decisions. Verify it against current source, and treat current source as authoritative when they disagree.

Then determine the impact radius. Do not inspect only changed lines. When a changed file depends on or affects another component, inspect enough surrounding code to verify the integration. For example, a change to a create action may also affect its schema, service, table, aggregation, authorization rules, and tests.

If the directory is not a Git repository, state that the Git-based scope was skipped and review the current work instead.

Keep the review scoped to the current changes. Do not turn it into a full project review; use `/project-review` for that.

## Read-only analysis

You may inspect files, inspect Git diff/status/history, search the repository, read related modules, run safe tests, run lint/typecheck/build when appropriate, and run non-destructive diagnostics.

You must NOT edit files, create fixes, delete files, format files, upgrade dependencies, change configuration, commit, push, merge, deploy, or mutate databases.

Delegate to the specialized skills that the detected code actually needs, and load only those.

## Output

Produce one unified report with:

- Critical findings
- High-priority findings
- Medium findings
- Improvements
- Passed/reviewed areas
- a suggested fix for every actionable finding
- recommended implementation steps
- exact evidence and file references where possible

Use this structure:

```text
# CHANGES REVIEW

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

Base every finding on inspected code or an executed check. Distinguish confirmed issues from risks needing verification and label those `Needs verification`. Avoid arbitrary numeric quality scores and vague findings.

## Approval gate

Stop after the report and wait. Never implement automatically. Valid approvals include `Fix finding #2.`, `Implement critical findings only.`, `Fix #1 and #4.`, or `Proceed with all recommended safe fixes.` Do not treat `okay`, `interesting`, `I see`, or `explain this` as approval. If the scope is unclear, ask which findings to implement.

## Implementation after approval

After explicit approval:

1. implement only the approved findings;
2. preserve unrelated user changes;
3. do not expand scope silently;
4. use the relevant specialized skills;
5. run appropriate verification;
6. re-check the original finding;
7. report whether it is resolved.

If implementation reveals a new destructive or high-risk action, stop and request additional approval.

## Follow-up report

```text
# REVIEW FOLLOW-UP

## IMPLEMENTED
- ...

## VALIDATION
- ...

## RESOLVED
- ...

## REMAINING FINDINGS
- ...

## RESULT
...
```

Never claim a finding is resolved without verification.

## Related commands

`/project-review` is the broader optional audit of the whole project. `/cleanup` finishes and cleans the implementation work itself. `/deployment-check` answers whether the project is ready and safe to deploy. Do not merge them into this command.
