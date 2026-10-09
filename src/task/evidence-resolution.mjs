import { existsSync, readFileSync } from "node:fs"

export const RESOLUTION = {
  VERIFIED: "verified",
  REJECTED: "rejected",
  PENDING: "pending",
}

const SUPPORTING_EVENT_TYPES = new Set([
  "action.executed",
  "file.changed",
  "verification.evidence",
  "validation.evaluated",
  "attempt.recorded",
  "task.finished",
])

export function loadTraceEvents(paths) {
  const events = []
  for (const path of paths ?? []) {
    if (!existsSync(path)) continue
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        events.push(JSON.parse(trimmed))
      } catch {
        continue
      }
    }
  }
  return events
}

function eventSupports(event, support) {
  if (support.event_type !== undefined && event.event_type !== support.event_type) {
    return `event_type is ${event.event_type}, not ${support.event_type}`
  }
  if (support.tool !== undefined && (event.tool ?? null) !== support.tool) {
    return `tool is ${event.tool ?? "null"}, not ${support.tool}`
  }
  if (support.exit_code !== undefined && (event.exit_code ?? null) !== support.exit_code) {
    return `exit_code is ${event.exit_code ?? "null"}, not ${support.exit_code}`
  }
  if (support.outcome !== undefined && event.outcome !== support.outcome) {
    return `outcome is ${event.outcome}, not ${support.outcome}`
  }
  if (support.event_type === undefined && !SUPPORTING_EVENT_TYPES.has(event.event_type)) {
    return `event_type ${event.event_type} cannot support a claimed step`
  }
  return null
}

/**
 * Resolves every observed evidence entry against events the runtime actually recorded.
 * A supplied source label is never trusted on its own: the referenced event must exist,
 * belong to this task and session, have succeeded, and match the claim it is said to support.
 */
export function resolveEvidence({ record, events, sessionId = null }) {
  const observed = (record.verification?.evidence ?? []).filter((e) => e.source === "observed")

  if (observed.length === 0) {
    return { status: RESOLUTION.VERIFIED, checked: 0, findings: [] }
  }

  if (!Array.isArray(events) || events.length === 0) {
    return {
      status: RESOLUTION.PENDING,
      checked: observed.length,
      findings: observed.map((e) => ({
        reference: e.reference,
        ok: false,
        reason: "verification pending: no recorded runtime events are available to resolve this reference",
      })),
    }
  }

  const byId = new Map(events.map((e) => [e.event_id, e]))
  const findings = []
  let rejected = false

  for (const item of observed) {
    const event = byId.get(item.reference)

    if (!event) {
      findings.push({ reference: item.reference, ok: false, reason: "no recorded event has this id" })
      rejected = true
      continue
    }

    if (event.task_id !== record.task_id) {
      findings.push({
        reference: item.reference,
        ok: false,
        reason: `event belongs to task ${event.task_id}, not ${record.task_id}`,
      })
      rejected = true
      continue
    }

    if (sessionId && event.session_id && event.session_id !== sessionId) {
      findings.push({
        reference: item.reference,
        ok: false,
        reason: `event belongs to session ${event.session_id}, not ${sessionId}`,
      })
      rejected = true
      continue
    }

    if (event.source !== "observed") {
      findings.push({ reference: item.reference, ok: false, reason: "the recorded event is itself an assertion" })
      rejected = true
      continue
    }

    if (event.outcome !== "ok") {
      findings.push({ reference: item.reference, ok: false, reason: `event outcome is ${event.outcome}` })
      rejected = true
      continue
    }

    if (!item.supports || typeof item.supports !== "object") {
      findings.push({
        reference: item.reference,
        ok: false,
        reason: "evidence states no claim about what it supports, so support cannot be verified",
      })
      rejected = true
      continue
    }

    const mismatch = eventSupports(event, item.supports)
    if (mismatch) {
      findings.push({ reference: item.reference, ok: false, reason: `event does not support the claim: ${mismatch}` })
      rejected = true
      continue
    }

    findings.push({ reference: item.reference, ok: true, reason: `resolved to ${event.event_id} (${event.event_type})` })
  }

  return {
    status: rejected ? RESOLUTION.REJECTED : RESOLUTION.VERIFIED,
    checked: observed.length,
    findings,
  }
}