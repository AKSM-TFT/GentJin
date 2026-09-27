---
description: Bring the active WIP current, flush outstanding durable knowledge, record one next action, and verify persistence before stopping work.
---

Pause the current work per the `work-in-progress` skill. This is the deterministic manual control for the pause behavior; the same thing must happen when the user says pause, hold, stop for now, continue later, or equivalent in natural language.

Do this before replying:

1. Load and follow `work-in-progress`.
2. Find the relevant WIP, or create one when there is meaningful unfinished work. If there is no meaningful unfinished work, say so and do not create artificial WIP.
3. Bring it current: goal, current state, work completed, remaining work, important findings, decisions made, rejected approaches, files, blockers, and actual verification status.
4. Flush outstanding durable knowledge through `knowledge-vault` while it is still fresh, so WIP can reference it instead of reconstructing it.
5. Record exactly one specific immediate `Next Action`.
6. Preserve worthwhile unresolved investigations under `questions/`.
7. Verify the persistence actually succeeded by confirming the files exist and contain the state you claimed.

Never claim state was saved when persistence failed. Say what failed and what remains unrecorded.

Do not run unrelated cleanup, Git, deployment, database, or reporting workflows as part of a pause.
