---
description: Report the current branch, pending changes, active WIP notes, and open questions.
---

Resolve the project identity and knowledge root with `gentjin_discovery` action `resolve`, which implements the precedence in the global instructions (`## Project Discovery` and `## Knowledge`). Then run `git status` and `git log --oneline -5`, scan `work-in-progress/` for active WIP notes, and scan `issues/questions/` for open questions.

Report concisely:

1. Current branch and pending changes (git status).
2. Recent work (last 5 commits).
3. Active WIP notes.
4. Open questions.
5. Current discovery readiness (`gentjin_discovery` action `status`) and, if not ready, the unmet requirement.

If the directory is not a Git repository, state that git steps were skipped and continue.