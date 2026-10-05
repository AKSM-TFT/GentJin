---
description: Commit and push the current changes on a new branch, detecting the repository's branch naming format first, proposing a name, deriving the Jira backlog title, and asking for approval (with the option to type your own).
---

Run the guarded push workflow for the current repository's pending changes, following the `## GitHub Pushes` rule in the global instructions.

1. Inspect the current state first: `git status`, the relevant `git diff` (staged and unstaged), and recent commit style so the branch name and commit message match repository conventions.

2. Check the current branch. If it is `main`, `development`, `production`, or another protected/shared branch, do not push there directly; create a new branch first.

3. Detect the repository's branch naming format before naming anything. List the existing branches (`git branch -a` or `git for-each-ref`) and look for a pattern such as `GJ-01-<description>`, `ABC-123-<description>`, or `feature/<name>`. If the repository has its own format, follow it and derive the next name (for example, increment the next free number).

4. If the repository has no recognisable branch format, propose the default `<project-initials>-<zero-padded-increment>-<description>` using initials derived from the project name and a zero-padded sequence (for example GentJin → `GJ-01-changes-in-here`, `GJ-02-changes-in-here`). Increment beyond the highest existing number, if any.

5. Show the user the exact branch name you plan to create and ask for explicit approval before creating it, committing on it, or pushing. If the user does not want the proposed name, let them type their own preferred branch name and use that instead.

6. After approval, create the branch, stage only the files that belong to the logical change, and make one focused commit with a subject matching the repository's commit style. Never stage secrets, credentials, environment files, or generated artifacts. Before staging, run the Pre-Push Cleanup Gate below: any seed, test fixture, or QA scaffolding that was created only to exercise the change must be removed or converted into a real test before it is staged. Nothing meant only for automatic QA may be pushed.

7. Push with upstream tracking (`git push -u origin <branch>`), then report the branch name, the derived Jira backlog title, the commit reference, and a pull-request link when the remote provides one (`git push` output usually includes it).

## Pre-Push Cleanup Gate

This is a non-negotiable rule. On every push, inspect `git status` for staged, unstaged, and untracked files, inspect the complete diff, and compare it against the active WIP's Temporary Artifact Ledger. Anything created solely to support automatic QA of the change — QA, TEST, DEBUG, SEEDING, mocks, fixtures, temporary local verification, or development investigation — must not be pushed unless the user explicitly requires it as permanent.

Watch for:

- Seed files and seed scripts (for example `seed.*`, `seeds/`, `*.seed.*`, database reset scripts) created to populate local test data.
- Temporary test scaffolding created to exercise the change by hand and then forgotten: throwaway fixtures, sample payloads, scratch test routes, and one-off scripts.
- Mock or stub data, fixtures, or fake services added only for local QA of the change.
- Ad-hoc verification scripts that were not added to the project's real test suite or documented as tests.
- Large generated artifacts, snapshot dumps, or output files produced while testing.

Inside modified production files, also look for temporary development code introduced only for this task: `console.log`/`console.debug`, temporary print statements, temporary debug panels, hardcoded IDs or users, temporary mock responses, bypassed authentication or authorization, disabled validation, temporary feature flags, forced success responses, temporary routes, commented-out replacement logic, TODO/FIXME notes added only for the session, local-only URLs or localhost overrides, temporary database values, temporary API keys or tokens, artificial delays, debug UI labels, test buttons, manually injected QA data.

Decision rule for each match: did this exist before the current task, and was it created solely to help QA, TEST, DEBUG, SEED, mock, or investigate? If yes, remove it or revert it before staging. If it is part of the project's permanent test or seed infrastructure, keep it and say so explicitly. Never delete pre-existing permanent tests, tracked fixtures, required migrations, or application seed infrastructure just because the filename contains `test`, `seed`, or `debug`. When unsure, ask the user rather than guessing.

Cleanup procedure, in order:

1. Inspect `git status` and the full diff.
2. Compare the diff against the WIP Temporary Artifact Ledger.
3. Remove task-created temporary artifacts from the working tree and untrack them.
4. Revert temporary modifications made only for testing or debugging inside production files.
5. Run the appropriate build, typecheck, lint, and verification AFTER cleanup, not before.
6. Re-inspect `git status` and the final diff to confirm nothing temporary remains and no permanent behavior was altered by the cleanup.
7. Update the change audit's Temporary Development Artifacts and Cleanup Result sections with what was removed.
8. If cleanup changed production behavior or verification now fails, STOP. Do not push. Investigate first.

Report what was removed, what was retained and why, the verification result after cleanup, and the change audit path. Do not silently remove files.

This gate never grades on a filename pattern alone. It is task-aware and provenance-aware.

## Derive the Jira Backlog Title

Once the branch name is approved, derive the Jira backlog title from it so the ticket can be created or linked without retyping.

Rule:

1. Match the branch against `^[A-Z]+-\d+-(.+)$`. The part after the number is the description.
2. Split the description on `-`.
3. For each word: if it is two characters or fewer, uppercase it; otherwise capitalize the first letter and lowercase the rest.
4. Join the words with single spaces.

Example:

```text
GX-33-be-fix-sales-journey-medicare-admission-count
  → BE Fix Sales Journey Medicare Admission Count
```

If the branch does not match the pattern, say so and do not invent a title. Never derive a title from a protected branch name such as `main` or `development`.

Show the derived title in the report and ask the user to confirm or correct it before it is used anywhere.

## Branch Description

The GitHub branch / PR description must be a concise numbered list of meaningful, user-visible changes. It is a reader-facing summary, not a technical log.

Rules:

- Use a numbered list, 3–10 items by default. One concrete change per item.
- Describe the outcome in plain language. Prefer behavior and result over implementation detail.
- Mention the affected area or page when useful.
- Skip implementation specifics: no file paths, no function names, no long paragraphs, no exhaustive QA document dumped into the description.
- Group tightly related internal edits into one item that reflects the single user-visible change. Keep changes separate when they affect clearly different behavior.
- Do not invent changes that are not in the final branch, and do not omit a real one just to make the list cleaner.
- Do not describe temporary or deleted development artifacts as shipped changes.
- Derive the items from the current task/WIP, the durable change audit, and the actual final diff. Do not trust memory or commit messages alone.

If the user explicitly asks for a technical or detailed description, that is allowed. Otherwise the numbered summary is the default.

The detailed technical record lives in the durable change audit and the vault, not in the PR body.

Stop and wait whenever the push target is unclear, the scope is ambiguous, the branch naming convention is uncertain, or a new file would expose sensitive information. Never rewrite history, force-push, or remove files while doing this.