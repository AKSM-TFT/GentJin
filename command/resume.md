---
description: Reload the active WIP and relevant knowledge, verify them against current source, and continue from the recorded next action.
---

Resume previously paused work per the `work-in-progress` skill. This is the deterministic manual control for the resume behavior; the same thing must happen when the user says continue, resume, or revisit in natural language.

Do this before acting:

1. Load and follow `work-in-progress`.
2. Locate the relevant active WIP. If several match, ask which one instead of guessing.
3. Read only the necessary context: goal, current state, completed and remaining work, decisions, rejected approaches, blockers, verification status, related knowledge, and the next action.
4. Inspect current source code and reconcile it with the stored state. Current source wins whenever they disagree, and correct the stale note rather than propagating the contradiction.
5. Reassess applicable skills and delegation now that the work is active again.
6. Continue from the recorded next action when it is still valid; if it is not, say why and state the correct next action.

Do not restart earlier investigation that the WIP and knowledge already settle, and do not ask the user to restate decisions that are already recorded.
