---
name: git-workflow
description: Handle guarded Git and source-control workflows. MUST be used before any commit, branch creation, push, merge, rebase, or pull request. Use when inspecting repository status/history/diffs, matching repository commit and branch conventions, or when cleanup/reporting needs source-control evidence. Never performs mutating Git actions unless explicitly requested.
---
# Git Workflow

## Inspect Before Acting
Before a requested commit or source-control change:
- Inspect `git status`.
- Inspect relevant `git diff` (staged and unstaged as applicable).
- Inspect recent history to match repository conventions.
- Understand what belongs to the logical change.

## Repository Conventions
Detect and follow the repository's own branch naming format rather than inventing one. If it has none, use the default from the global `## GitHub Pushes` rules and continue its sequence. Stage only the files belonging to the logical change.

## QA Artifact Check

Before staging for commit, scan the pending file list for artifacts that exist only to support automatic verification of the change rather than to ship. Seeds, throwaway fixtures, scratch test routes, mock or stub data added only for local QA, ad-hoc verification scripts, and generated test output must be removed or converted into real tests before they are staged. Nothing meant only for automatic QA may be pushed. Legitimate test infrastructure and deliberate seed systems are fine to stage; when unsure, ask.

## Branch Description

The GitHub branch / PR description is a concise numbered list of meaningful, user-visible changes, not a technical log. Use 3–10 items by default, one concrete change per item, in plain language, preferring behavior over implementation detail. Derive the items from the active WIP, the durable change audit, and the actual final diff. Do not include file paths, function names, or a QA document in the branch description; that detail belongs in the change audit. Never invent a change not in the final diff.

## Jira Backlog Title
When the branch name matches `^[A-Z]+-\d+-(.+)$`, derive the Jira title from the description: split on `-`, uppercase any word of two characters or fewer, capitalize the rest, and join with spaces.

```text
GX-33-be-fix-sales-journey-medicare-admission-count
  → BE Fix Sales Journey Medicare Admission Count
```

Do not derive a title from a branch that does not match, or from a protected branch. Always show the derived title and let the user confirm or correct it before it is used.

The `/git-push` command implements this workflow end to end.

## Commits
Create one focused commit per logical unit. Prefer a short imperative subject, blank line, and concise body explaining why when useful. Match existing repository commit style when present.

## Knowledge Sync
After meaningful work, ensure relevant WIP/vault knowledge reflects what is being committed. Do not claim source-control state without checking it.
