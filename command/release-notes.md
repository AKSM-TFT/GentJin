---
description: Prepare paste-ready release notes for the changes accumulated since the previous release, save them in the Knowledge Vault, and never publish anything.
---

Prepare release notes for the current repository with the `gentjin_release_notes` tool, which the running OpenCode plugin provides. Use action `collect` to read the target, the previous boundary, the collected changes and a proposed version, then write accurate prose, then use action `render` to render and save. Never read the release modules as files from another project: the tool exists so this needs no external-directory permission.

Publishing stays entirely manual. Do not create a release, a draft, a tag, or a pull request, do
not modify remote releases or tags, do not auto-merge, and do not treat this workflow as
publication authorization.

## Collect

1. Resolve the repository, the release branch, and the pinned full target commit SHA. Never work
   from a moving ref.
2. Determine the previous release boundary from verified tag metadata. Keep two facts separate: the
   boundary may be selected and verified as an ancestor of the target, and the release for that
   boundary is a separate question with state unknown. A tag proves a code boundary and is never
   evidence that a GitHub release was published.
3. Only accept a boundary that is a verified ancestor of the target. Keep stable and prerelease
   lines separate. Report the boundary as selected and verified, and report publication separately as
   unknown, because a tag is not evidence of a published release.
4. If no verified boundary exists, ask for the previous tag or commit, or for an explicit
   first-release baseline. Label a provisional candidate accurately. Never invent release history.
5. Collect the changes reachable from the target only. Aggregate commits into logical changes,
   group by pull request when one exists, and mark reverted work rather than presenting it as new.
6. Propose a version only from verified repository conventions. Show it as proposed until the user
   selects it. Never derive a version from push counts or from an unrelated package version.
7. If there are no eligible changes, report that and produce no release notes.

## Render

Provide separately:

- the proposed release title and version, marked provisional;
- the proposed tag, target branch and SHA, previous boundary and whether it was verified, and the
  manual release creation link;
- the complete copyable Markdown body.

Use this shape:

```markdown
# <Project> — <Theme Based on Included Changes>

<One or two short paragraphs introducing this specific update.>

## What's New

1. **<Feature or Fix>** — <Concrete user-facing change.>
2. **<Feature or Fix>** — <Concrete user-facing change.>

## Why This Matters

<Practical value of this release's changes.>

## Project

Repository: [<repository URL>](<repository URL>)

<Verified project context, when useful.>
```

Keep the numbered format and use as many items as the evidence supports. Never pad the list or
carry claims from one release into another. Add a short Limitations or Breaking Changes section
when accuracy requires it. Keep test inventories, console output, branch tracking, and audit
metadata out of the copyable body. Map each substantive claim to source, history, or a verified
change note in the saved metadata.

## Save

1. Action `render` saves the exact body to `<project-knowledge-root>/reports/releases/<candidate-or-version>.md`
   with separate metadata recording the repository, proposed version, target SHA, previous
   boundary and its publication state, date, evidence, and status. Report the returned path. If the
   save reports a failure, state it plainly rather than claiming the notes were captured.
2. Record status as prepared and `published: false`. Generating or accepting notes must never mark
   changes released or advance the published boundary.
3. Search before writing. Update the same candidate on repeated generation instead of creating a
   duplicate note.
4. Link the note from relevant change notes, the daily session, and the memory index when useful,
   and keep WIP accurate if anything is still pending.
5. If the user later says the release was published, verify the tag, commit, and URL through
   read-only access where available. Otherwise record that publication was reported by the user
   and not independently verified.
6. If the save fails, still hand over the complete notes and state the failure plainly. Never claim
   capture succeeded.

Never advance the published boundary, create a tag, or create a release while preparing notes.

Finish by stating that the notes are prepared and not published.
