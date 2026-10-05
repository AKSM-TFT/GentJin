import { mkdirSync, existsSync } from "node:fs"
import { randomBytes } from "node:crypto"
import { homedir } from "node:os"
import { join } from "node:path"
export const PLUGIN_NAME = "gentjin-trace"

function writerSpecifier() {
  if (process.env.GENTJIN_TRACE_WRITER) return process.env.GENTJIN_TRACE_WRITER
  return new URL("../src/trace/writer.mjs", import.meta.url).href
}

function resolveTraceDir() {
  if (process.env.GENTJIN_TRACE_DIR) return process.env.GENTJIN_TRACE_DIR
  return join(homedir(), ".local", "state", "gentjin", "traces")
}

function resolveProjectId(ctx) {
  return ctx?.project?.id ?? ctx?.project?.name ?? process.env.GENTJIN_PROJECT_ID ?? "unknown"
}

export const GENTJIN_TRACE_PLUGIN = async (ctx) => {
  const traceDir = resolveTraceDir()
  mkdirSync(traceDir, { recursive: true })

  let trace = null
  let loadError = null

  const ensureTrace = async () => {
    if (trace) return trace
    if (loadError) return null
    try {
      const { TraceWriter } = await import(writerSpecifier())
      const file = join(traceDir, `${Date.now()}-${randomBytes(4).toString("hex")}.jsonl`)
      trace = new TraceWriter({
        taskId: process.env.GENTJIN_TASK_ID ?? `task-${randomBytes(6).toString("hex")}`,
        projectId: resolveProjectId(ctx),
        sessionId: ctx?.sessionID ?? null,
        file,
      })
      return trace
    } catch (error) {
      loadError = error
      await log(ctx, "error", `trace writer unavailable: ${error.message}`)
      return null
    }
  }

  const spans = new Map()

  return {
    "tool.execute.before": async (input, output) => {
      const writer = await ensureTrace()
      if (!writer) return
      const spanId = `span-${Date.now()}-${Math.abs(hashString(JSON.stringify(input?.tool ?? "")))}`
      spans.set(spanId, Date.now())
      writer.onToolExecuteBefore(input, output)
    },

    "tool.execute.after": async (input, output) => {
      const writer = await ensureTrace()
      if (!writer) return
      const spanId = [...spans.keys()].pop()
      const startedAt = spanId ? spans.get(spanId) : Date.now()
      if (spanId) spans.delete(spanId)
      writer.onToolExecuteAfter(input, output, spanId, startedAt)
    },

    event: async ({ event }) => {
      const writer = await ensureTrace()
      if (!writer || !event) return
      if (!event.type) return
      writer.append({
        event_id: `evt-${randomHex()}`,
        timestamp: new Date().toISOString(),
        phase: "act",
        event_type: "runtime.event",
        source: "observed",
        outcome: "unknown",
        payload: { runtime_event_type: event.type, properties: event.properties ?? null },
        instrumentation: {
          hook: "event",
          captured_fields: ["type", "properties"],
          missing_fields: ["model_reasoning"],
        },
      })
    },

    "chat.message": async (_input, output) => {
      const writer = await ensureTrace()
      if (!writer) return
      writer.append({
        event_id: `evt-${randomHex()}`,
        timestamp: new Date().toISOString(),
        phase: "observe",
        event_type: "task.started",
        source: "observed",
        outcome: "ok",
        payload: {
          message_count: Array.isArray(output?.messages) ? output.messages.length : null,
        },
        instrumentation: {
          hook: "chat.message",
          captured_fields: ["message_count"],
          missing_fields: ["message_text"],
        },
      })
    },

    "permission.ask": async (input, output) => {
      const writer = await ensureTrace()
      if (!writer) return
      writer.append({
        event_id: `evt-${randomHex()}`,
        timestamp: new Date().toISOString(),
        phase: "act",
        event_type: "action.executed",
        source: "observed",
        outcome: "ok",
        payload: {
          permission: input?.permission ?? null,
          pattern: input?.patterns ?? null,
        },
        instrumentation: {
          hook: "permission.ask",
          captured_fields: ["permission", "patterns"],
          missing_fields: [],
        },
      })
    },
  }

  function randomHex() {
    return Math.abs(hashString(`${Date.now()}-${Math.random()}`)).toString(16).padStart(12, "0").slice(0, 12)
  }
}

async function log(ctx, level, message) {
  try {
    await ctx?.client?.app?.log({
      body: { service: PLUGIN_NAME, level, message },
    })
  } catch {
    // Logging must never break the session.
  }
}

function hashString(value) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return hash
}

export const pluginManifest = {
  name: PLUGIN_NAME,
  description:
    "Records GENTJIN task traces from real OpenCode hooks. Installs into ~/.config/opencode/plugins/.",
  location: "~/.config/opencode/plugins/gentjin-trace.mjs",
  required_hooks: ["tool.execute.before", "tool.execute.after", "event", "chat.message", "permission.ask"],
  trace_location: process.env.GENTJIN_TRACE_DIR ?? "~/.local/state/gentjin/traces",
  coverage_note:
    "Skill selection is not observable through any hook. Routing recorded alongside traces is inferred and must be labeled as such.",
}

export function traceDirIsOutsideRepo(repoRoot) {
  const dir = resolveTraceDir().replace(/\\/g, "/")
  const root = repoRoot.replace(/\\/g, "/")
  return !dir.startsWith(root)
}

export function pluginIsInstalled(opencodeRoot) {
  return existsSync(join(opencodeRoot, "plugins", `${PLUGIN_NAME}.mjs`))
}