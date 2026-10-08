/**
 * Makes GENTJIN capabilities loadable and enforceable at runtime.
 *
 * Registers `gentjin_capability`, which returns the complete canonical body of a skill or
 * command; a `tool.execute.before` hook that refuses workflow-owned commands until those
 * instructions are loaded; and an `event` hook that checks adherence when the turn ends.
 *
 * Verified against OpenCode 1.18.35 by probe, not documentation:
 *   - plugin tools are callable by the model
 *   - throwing from tool.execute.before blocks the command
 *   - `event` receives session.idle when the assistant finishes a turn
 *   - no hook exists that can retract or block an already-emitted message, so the completion
 *     check can only surface non-adherence, never prevent the claim
 *
 * OpenCode discovers .js and .ts and invokes only an inline default export, so this file
 * exports nothing else.
 */
import { appendFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createLoader, type CapabilityLoader } from "../src/capabilities/loader.mjs"
import {
  beginSession,
  createDiscoveryState,
  declareScope,
  evaluateGate,
  noteRead,
  noteReadFailure,
  readinessFor,
  recordFor,
  recordMemory,
  type DiscoveryState,
} from "../src/discovery/gate.mjs"
import { resolveProject } from "../src/discovery/resolve.mjs"
import { createGateTracer } from "../src/discovery/gate-trace.mjs"
import type { GateTracer } from "../src/discovery/gate-trace.mjs"

interface PluginInput {
  id?: string
  kind?: string
  action?: string
  paths?: string[]
  notes_read?: string[]
  no_relevant_notes?: boolean
  searched?: string[]
  failed?: boolean
  reason?: string
}

interface GuardOwner {
  capability: { id: string }
}

interface GuardVerdict {
  guarded: boolean
  owners?: GuardOwner[]
}

interface PluginEvent {
  event?: { type?: string }
}

interface ToolArgs {
  filePath?: string
}

function resolveOpenCodeRoot(): string {
  if (process.env.GENTJIN_ROOT) return process.env.GENTJIN_ROOT
  const here = dirname(fileURLToPath(import.meta.url))
  return resolve(here, "..")
}

export default async (ctx: { directory?: string; sessionID?: string }) => {
  const loader: CapabilityLoader = createLoader({ opencodeRoot: resolveOpenCodeRoot() })
  const discovery: DiscoveryState = createDiscoveryState()
  const sessionId = ctx?.sessionID ?? "default"
  const resolution = resolveProject(ctx?.directory ?? process.cwd())
  beginSession(discovery, sessionId, resolution)
  const tracer: GateTracer = createGateTracer()

  return {
    event: async ({ event }: PluginEvent): Promise<void> => {
      if (event?.type !== "session.idle") return
      const report = loader.completionReport()
      if (report.findings.length === 0) return
      try {
        appendFileSync(join(tmpdir(), "gentjin-adherence.log"), `${JSON.stringify(report)}\n`)
      } catch {
        // A session-end finding must never break the session.
      }
    },

    tool: {
      gentjin_capability: {
        description:
          "Load the complete canonical instructions for a GENTJIN skill or command before performing any action it governs. " +
          "Use this whenever a GENTJIN workflow applies and you need its full body rather than its summary. " +
          "Examples: id update-gentjin, install-gentjin, git-push, systematic-debugging. " +
          "Pass kind as command or skill when you know it.",
        args: {
          id: { type: "string", description: "Capability id, for example update-gentjin or systematic-debugging" },
          kind: { type: "string", description: "Optional: command or skill" },
        },
        async execute(args: PluginInput): Promise<string> {
          const result = loader.load(args?.id, args?.kind)
          if (!result.ok) return `CAPABILITY_UNAVAILABLE: ${result.reason}`
          const header = `# ${result.id} (${result.kind}) - canonical instructions loaded from ${result.path}`
          return [header, "", result.instructions].join("\n")
        },
      },

      gentjin_discovery: {
        description:
          "Record and inspect verified project discovery for this session. Actions: " +
          "'resolve' returns the resolved project root, identity and knowledge root; " +
          "'scope' declares the files the task intends to change; " +
          "'memory' records the memory retrieval result (notes_read, or no_relevant_notes); " +
          "'status' reports current readiness. Project edits are blocked until readiness is ready.",
        args: {
          action: { type: "string", description: "resolve | scope | memory | status" },
          paths: { type: "array", description: "Files the task intends to change, for action scope" },
          notes_read: { type: "array", description: "Memory notes actually read, for action memory" },
          no_relevant_notes: { type: "boolean", description: "True when no note applies, for action memory" },
          searched: { type: "array", description: "Vault areas actually searched this session, required with no_relevant_notes" },
          failed: { type: "boolean", description: "True when retrieval genuinely failed, for action memory" },
          reason: { type: "string", description: "Why retrieval failed, only when failed is true" },
        },
        async execute(args: PluginInput): Promise<string> {
          const action = args?.action ?? "status"
          const record = recordFor(discovery, sessionId)

          if (action === "resolve") {
            return JSON.stringify(record, null, 2)
          }

          if (action === "scope") {
            const paths = declareScope(discovery, sessionId, args?.paths ?? [])
            const active = recordFor(discovery, sessionId)
            if (active) active.source_areas = paths.map((p: string) => dirname(p))
            return JSON.stringify({ intended_paths: paths })
          }

          if (action === "memory") {
            const result = recordMemory(discovery, sessionId, {
              status: args?.failed ? "error" : "ok",
              notes_read: args?.notes_read ?? [],
              no_relevant_notes: args?.no_relevant_notes === true,
              searched: args?.searched ?? [],
              reason: args?.failed ? (args?.reason ?? "memory retrieval failed") : null,
            })
            return JSON.stringify(result)
          }

          return JSON.stringify(readinessFor(discovery, sessionId), null, 2)
        },
      },
    },

    "tool.execute.after": async (input: { tool?: string }, output: { args?: ToolArgs }) => {
      const failed =
        Boolean((output as { error?: unknown } | undefined)?.error) ||
        (output as { exitCode?: number } | undefined)?.exitCode === 0
      if (input?.tool === "read" && output?.args?.filePath && failed) {
        noteReadFailure(discovery, sessionId, output.args.filePath)
      }
    },

    "tool.execute.before": async (
      input: { tool?: string },
      output: { args?: ToolArgs },
    ): Promise<void> => {
      const tool = input?.tool
      const filePath = output?.args?.filePath

      if (tool === "read" && filePath) {
        noteRead(discovery, sessionId, filePath)
        return
      }

      if (filePath && (tool === "grep" || tool === "glob" || tool === "list")) {
        return
      }

      if (tool === "bash") {
        const command = (output?.args as { command?: string } | undefined)?.command
        if (typeof command !== "string") return

        const verdict: GuardVerdict = loader.checkCommand(command)
        if (!verdict.guarded) return

        const unloaded = (verdict.owners ?? []).filter((owner) => !loader.isLoaded(owner.capability.id))
        if (unloaded.length === 0) return

        tracer.record({
          tool,
          projectRoot: recordFor(discovery, sessionId)?.project_root ?? resolution.project_root,
          allowed: false,
          status: "workflow_guard",
          reasons: unloaded.map((owner) => `${owner.capability.id} not loaded`),
          sessionId,
        })

        const names = unloaded.map((owner) => `"${owner.capability.id}"`).join(" or ")
        const possessive = unloaded.length === 1 ? "its" : "their"

        throw new Error(
          [
            `Blocked: ${names} owns this action and ${possessive} instructions were not loaded in this session.`,
            `Call the gentjin_capability tool with that id first, then follow those instructions.`,
            "Do not substitute a remembered procedure, a summary, or a custom script for the canonical workflow.",
          ].join("\n"),
        )
      }

      const gate = evaluateGate({ state: discovery, sessionId, tool: tool ?? "", filePath })
      if (gate.reason) {
        tracer.record({
          tool: tool ?? "",
          filePath,
          projectRoot: recordFor(discovery, sessionId)?.project_root ?? resolution.project_root,
          allowed: gate.allowed,
          status: gate.status ?? null,
          reasons: [gate.reason.slice(0, 160)],
          sessionId,
        })
      }
      if (!gate.allowed) throw new Error(gate.reason ?? "Blocked by discovery readiness.")
    },
  }
}