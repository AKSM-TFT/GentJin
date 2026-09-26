---
name: systematic-debugging
description: Find the root cause of a defect with a disciplined reproduce-to-evidence-to-hypothesis-to-fix workflow. Use when something is broken, behavior is unexpected, a build or test suddenly fails, a regression is reported, data reaches the wrong process/session/component, the user asks "why is this happening?", or several attempted fixes have already failed.
---
# Systematic Debugging

## Rule

Evidence before edits. Do not start with random code changes, and do not repeatedly patch symptoms.

## Workflow

1. Reproduce the failure deterministically, or state clearly that it cannot be reproduced yet and what evidence is missing.
2. Gather evidence: the exact error or wrong output, the first bad commit or change when known, logs, the failing command, and the actual vs expected result.
3. Trace execution and data flow across the real path: entry point, boundaries, callers, persistence, async hops, and process/session ownership. Read the code that runs instead of assuming it does.
4. State one falsifiable hypothesis that explains every symptom.
5. Verify the hypothesis with the smallest check that can disprove it. Discard hypotheses that fail.
6. Identify the root cause and separate it from secondary symptoms and masking effects.
7. Plan the fix at the root cause, preserving existing architecture.
8. Implement only when implementation is requested or authorized; stay read-only for review-only tasks.
9. Re-verify with regression verification: rerun the original reproduction, then the related checks.

## Rules

- Do not weaken, delete, or bypass a failing check to make the symptom disappear.
- Do not assume the newest change is the cause; confirm with Git history or evidence.
- Distinguish root cause from secondary effects such as stale cache, wrong session, or duplicated state.
- If several fixes have failed, stop patching and return to evidence gathering.
- Keep the preserved evidence (commands run, files inspected, hypothesis tested) for the final report.

## Reporting

State the root cause, the evidence that proves it, the fix applied, and the verification that was actually run. Distinguish confirmed causes from remaining uncertainties. Never claim the issue is resolved without rerunning the reproduction.
