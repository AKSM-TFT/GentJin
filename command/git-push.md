---
description: Commit and push the current changes on a new branch, detecting the repository's branch naming format first, proposing a name, deriving the Jira backlog title, and asking for approval (with the option to type your own).
---

Run the guarded push workflow for the current repository's pending changes, following the `## GitHub Pushes` rule in the global instructions.

1. Inspect the current state first: `git status`, the relevant `git diff` (staged and unstaged), and recent commit style so the branch name and commit message match repository conventions.

2. Check the current branch. If it is `main`, `development`, `production`, or another protected/shared branch, do not push there directly; create a new branch first.

3. Detect the repository's branch naming format before naming anything. List the existing branches (`git branch -a` or `git for-each-ref`) and look for a pattern such as `GJ-01-<description>`, `ABC-123-<description>`, or `feature/<name>`. If the repository has its own format, follow it and derive the next name (for example, increment the next free number).

4. If the repository has no recognisable branch format, propose the default `<project-initials>-<zero-padded-increment>-<description>` using initials derived from the project name and a zero-padded sequence (for example GentJin → `GJ-01-changes-in-here`, `GJ-02-changes-in-here`). Increment beyond the highest existing number, if any.

5. Show the user the exact branch name you plan to create and ask for explicit approval before creating it, committing on it, or pushing. If the user does not want the proposed name, let them type their own preferred branch name and use that instead.

6. After approval, create the branch, stage only the files that belong to the logical change, and make one focused commit with a subject matching the repository's commit style. Never stage secrets, credentials, environment files, or generated artifacts. Before staging, run the QA Artifact Check below: any seed, test fixture, or QA scaffolding that was created only to exercise the change must be removed or converted into a real test before it is staged. Nothing meant only for automatic QA may be pushed.

7. Push with upstream tracking (`git push -u origin <branch>`), then report the branch name, the derived Jira backlog title, the commit reference, and a pull-request link when the remote provides one (`git push` output usually includes it).

## QA Artifact Check

Before anything is staged for commit, scan the pending file list for artifacts that exist only to support automatic verification of the change rather than to ship. These must not be pushed.

Watch for:

- Seed files and seed scripts (for example `seed.*`, `seeds/`, `*.seed.*`, database reset scripts) created to populate local test data.
- Temporary test scaffolding created to exercise the change by hand and then forgotten: throwaway fixtures, sample payloads, scratch test routes, and one-off scripts.
- Mock or stub data, fixtures, or fake services added only for local QA of the change.
- Ad-hoc verification scripts that were not added to the project's real test suite or documented as tests.
- Large generated artifacts, snapshot dumps, or output files produced while testing.

For each match, decide: is this part of the project's real test or seed system that should ship and be maintained, or was it created only for automatic QA of this change? The second kind must be removed before staging, or moved out of the repository's tracked files. Do not stage it.

If a real seed or test system is being added deliberately, say so explicitly and stage it; the rule targets QA scaffolding, not legitimate test infrastructure. When unsure whether a file qualifies, ask the user rather than guessing.

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

Stop and wait whenever the push target is unclear, the scope is ambiguous, the branch naming convention is uncertain, or a new file would expose sensitive information. Never rewrite history, force-push, or remove files while doing this.