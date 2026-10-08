# Discovery enforcement boundary

Measured against OpenCode 1.18.35 on this machine, by probe. Every claim below was observed,
not read from documentation. Probes were temporary files under the system temp root and were
removed; the installation manifest was re-verified afterwards.

## What is enforced at runtime today

| Path | Interceptable | Enforced today |
| --- | --- | --- |
| `bash` | yes | yes, by `tool.execute.before` for three guarded capabilities |
| `write` | yes | **no** |
| `edit` | yes | **no** |
| `read`, `grep`, `glob`, `list` | yes | not applicable, read-only |

## Probe 1 — which tools reach the hook

A temporary plugin logged every `tool.execute.before` and `tool.execute.after` while a live
session performed one `write`, one `edit`, one `read`, and one `bash`.

```
1 BEFORE tool=write keys=filePath|content
1 BEFORE tool=edit  keys=filePath|oldString|newString
1 BEFORE tool=read  keys=filePath
3 BEFORE tool=bash  keys=command
```

Every tool call reaches `tool.execute.before`, and the hook receives the call arguments,
including the target `filePath` for file tools.

## Probe 2 — can those tools actually be blocked

The same plugin threw from `tool.execute.before` when `tool` was `write` or `edit`.

```
Error: BLOCKED_BY_PROBE tool=write
Error: BLOCKED_BY_PROBE tool=edit
```

Resulting directory contents: `demo.txt` unchanged, `blocked.txt` never created, while a
`bash` write in the same session still succeeded. Blocking is per tool, so an interceptable
mutation can be refused without freezing the rest of the session.

## Conclusion

Native `write` and `edit` are interceptable and blockable. This is the load-bearing finding:
discovery readiness can be enforced on the mutation paths that matter, rather than only
described in prose.

## Known bypasses, stated rather than hidden

- A command or tool the hook never observes. Only tools that emit a `tool.execute.before`
  event are covered.
- `write` and `edit` are the observed file mutators. Any additional mutating tool introduced by
  a future OpenCode release is unguarded until probed, and must be added explicitly.
- Enforcement is per OpenCode process. Two processes are independent by construction, not by a
  shared lock.
- The guard is a workflow gate, not a security boundary. It prevents an in-session shortcut; it
  does not stop a user or another process from editing files directly.

## Instruction-level behavior, separately from enforcement

These are documented expectations with no runtime enforcement:

- Project root, identity, and vault resolution precedence in `AGENTS.md` and
  `skills/knowledge-vault/SKILL.md`. Before this work these existed only as prose; the only
  executable project identity resolution was `resolveProjectId` in the trace plugin, which reads
  runtime context and an environment variable and implements none of the documented precedence.
- `.project-agent.md` overrides were referenced by four documents and read by no code.
- The discovery and retrieval pipeline in the knowledge-vault skill.

## Not yet enforced

Discovery readiness before a project edit. That is the work this finding enables.