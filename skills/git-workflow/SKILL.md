---
name: git-workflow
description: Handle guarded Git and source-control workflows. MUST be used before any commit, branch creation, push, merge, rebase, or pull request. Use when inspecting repository status/history/diffs, matching repository commit and branch conventions, or when cleanup/reporting needs source-control evidence. Never performs mutating Git actions unless explicitly requested.
---
# Git Workflow

## Safe Default
Only commit, push, create/switch branches, merge, submit pull requests, amend, rebase, rewrite history, force-push, or skip hooks when the user explicitly requests the relevant action.

## Inspect Before Acting
Before a requested commit or source-control change:
- Inspect `git status`.
- Inspect relevant `git diff` (staged and unstaged as applicable).
- Inspect recent history to match repository conventions.
- Understand what belongs to the logical change.

## Branches
- Inspect the repository's existing branches to detect its naming convention.
- If the repository has its own format, follow it and continue its sequence.
- If it has no format, use `<project-initials>-<zero-padded-increment>-<description>` (for example `GJ-01-changes-in-here`, `GJ-02-changes-in-here`).
- Show the exact branch name and ask for explicit approval before creating, committing on, or pushing it. If the user rejects the name, use the name they provide.
- Never push directly to `main`, `development`, `production`, or another protected or shared branch.
- The `/git-push` command implements this workflow end to end.

## Commits
Create one focused commit per logical unit. Prefer a short imperative subject, blank line, and concise body explaining why when useful. Match existing repository commit style when present.

Never commit secrets, credentials, environment files, or generated artifacts that should not be versioned.

## Knowledge Sync
After meaningful work, ensure relevant WIP/vault knowledge reflects what is being committed. Do not claim source-control state without checking it.
