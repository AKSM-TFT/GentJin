import { createHash, randomBytes } from "node:crypto"

export const SCHEMA_VERSION = 1

export const STATES = ["in_progress", "blocked", "needs_verification", "completed", "failed", "abandoned"]
export const PHASES = ["observe", "retrieve", "plan", "act", "verify", "reflect", "store"]

const ALLOWED_TRANSITIONS = {
  in_progress: ["in_progress", "blocked", "needs_verification", "completed", "failed", "abandoned"],
  blocked: ["blocked", "in_progress", "failed", "abandoned"],
  needs_verification: ["needs_verification", "in_progress", "completed", "failed", "abandoned"],
  completed: ["completed", "in_progress", "needs_verification"],
  failed: ["failed", "in_progress", "abandoned"],
  abandoned: ["abandoned", "in_progress"],
}

export function newTaskId() {
  return `task-${randomBytes(6).toString("hex")}`
}

export function newEventId() {
  return `evt-${randomBytes(6).toString("hex")}`
}

export function attemptFingerprint(attempt) {
  const normalized = {
    summary: String(attempt.summary ?? "").trim().toLowerCase().replace(/\s+/g, " "),
    files: [...(attempt.files_touched ?? [])].map((f) => String(f).replace(/\\/g, "/")).sort(),
    verification: [...(attempt.verification ?? [])].map((v) => String(v).trim().toLowerCase()).sort(),
  }
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex").slice(0, 16)
}

export function canTransition(from, to) {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to)
}

export function assertTransition(from, to) {
  if (!STATES.includes(to)) throw new Error(`unknown state: ${to}`)
  if (!canTransition(from, to)) throw new Error(`illegal transition: ${from} -> ${to}`)
  return to
}

export function makeTaskRecord(input = {}) {
  const now = input.created_at ?? new Date().toISOString()
  return {
    schema_version: SCHEMA_VERSION,
    task_id: input.task_id ?? newTaskId(),
    project_id: input.projectId ?? "unknown",
    parent_task_id: input.parent_task_id ?? null,
    created_at: now,
    updated_at: now,
    state: input.state ?? "in_progress",
    phase: input.phase ?? "observe",
    request: input.request ?? "",
    scope: input.scope ?? {
      allowed_paths: input.allowed_paths ?? [],
      allowed_skills: [],
      allow_code_changes: input.allow_code_changes ?? true,
      description: input.scope_description ?? null,
    },
    acceptance_criteria: (input.criteria ?? []).map((c) => ({
      mandatory: true,
      evidence: [],
      not_applicable_reason: null,
      remaining_check: null,
      ...c,
    })),
    selected_skills: input.selected_skills ?? [],
    routing: input.routing ?? null,
    memory_references: input.memory_references ?? [],
    plan: input.plan ?? [],
    attempts: (input.attempts ?? []).map((a, index) => ({
      id: a.id ?? `attempt-${index + 1}`,
      fingerprint: a.fingerprint ?? attemptFingerprint(a),
      ...a,
    })),
    actions: (input.actions ?? []).map((a, index) => normalizeAction(a, index)),
    file_changes: input.file_changes ?? [],
    verification: input.verification ?? { evidence: [], checks_run: 0, checks_required: 0, notes: null },
    blockers: input.blockers ?? [],
    reconciliation: input.reconciliation ?? [],
    outcome: input.outcome ?? { result: "pending", summary: null, evaluated_at: null },
    ...(input.validation ? { validation: input.validation } : {}),
  }
}

export function normalizeAction(action, index = 0) {
  if (action.source === undefined) {
    throw new Error(
      "action.source is required: an executed action must state whether it was observed or asserted",
    )
  }
  if (!["observed", "asserted"].includes(action.source)) {
    throw new Error(`action.source must be 'observed' or 'asserted', got ${action.source}`)
  }
  return {
    id: action.id ?? `action-${index + 1}`,
    kind: action.kind ?? "other",
    description: action.description ?? "",
    executed: action.executed ?? true,
    source: action.source,
    tool: action.tool ?? null,
    exit_code: action.exit_code ?? null,
    error_category: action.error_category ?? null,
    event_id: action.event_id ?? null,
  }
}

export function recordAction(record, action) {
  const entry = normalizeAction(action, record.actions.length)
  return { ...record, actions: [...record.actions, entry], updated_at: new Date().toISOString() }
}

export function recordEvidence(record, evidence) {
  if (!["observed", "asserted"].includes(evidence.source)) {
    throw new Error("evidence.source must be 'observed' or 'asserted'")
  }
  return {
    ...record,
    verification: {
      ...record.verification,
      evidence: [
        ...record.verification.evidence,
        { captured_at: new Date().toISOString(), ...evidence },
      ],
      checks_run: record.verification.checks_run + (evidence.source === "observed" ? 1 : 0),
    },
    updated_at: new Date().toISOString(),
  }
}

export function recordAttempt(record, attempt) {
  const entry = {
    id: attempt.id ?? `attempt-${record.attempts.length + 1}`,
    fingerprint: attempt.fingerprint ?? attemptFingerprint(attempt),
    summary: attempt.summary ?? "",
    files_touched: attempt.files_touched ?? [],
    verification: attempt.verification ?? [],
    observed_outcome: attempt.observed_outcome ?? "unverified",
    evidence: attempt.evidence ?? [],
    next_investigation: attempt.next_investigation ?? null,
  }
  return { ...record, attempts: [...record.attempts, entry], updated_at: new Date().toISOString() }
}

export function setState(record, nextState, patch = {}) {
  assertTransition(record.state, nextState)
  return {
    ...record,
    ...patch,
    state: nextState,
    updated_at: new Date().toISOString(),
  }
}

export function setPhase(record, phase) {
  if (!PHASES.includes(phase)) throw new Error(`unknown phase: ${phase}`)
  return { ...record, phase, updated_at: new Date().toISOString() }
}
const RECONCILIATION_TRIGGERS = ["guard_blocked", "hook_blocked", "bypass_detected", "manual"]

export function markReconciliation(record, entry) {
  const checks = Array.isArray(entry.checks_needed) ? entry.checks_needed.filter(Boolean) : []
  if (checks.length === 0) {
    throw new Error("reconciliation.checks_needed must name at least one check that is still needed")
  }
  if (!RECONCILIATION_TRIGGERS.includes(entry.trigger)) {
    throw new Error(`reconciliation.trigger must be one of ${RECONCILIATION_TRIGGERS.join(", ")}`)
  }
  if (!entry.capability) {
    throw new Error("reconciliation.capability must name the workflow that was bypassed")
  }

  return {
    ...record,
    reconciliation: [
      ...(record.reconciliation ?? []),
      {
        trigger: entry.trigger,
        capability: entry.capability,
        detected_at: entry.detected_at ?? new Date().toISOString(),
        checks_needed: checks,
        resolved_at: null,
        resolution_evidence: [],
      },
    ],
    updated_at: new Date().toISOString(),
  }
}

export function resolveReconciliation(record, capability, evidence = []) {
  const open = (record.reconciliation ?? []).filter(
    (r) => r.capability === capability && r.resolved_at === null,
  )
  if (open.length === 0) {
    throw new Error(`no open reconciliation for "${capability}"`)
  }
  if (!Array.isArray(evidence) || evidence.length === 0) {
    throw new Error("resolving a reconciliation requires evidence that the listed checks were run")
  }

  const at = new Date().toISOString()
  return {
    ...record,
    reconciliation: (record.reconciliation ?? []).map((r) =>
      r.capability === capability && r.resolved_at === null
        ? { ...r, resolved_at: at, resolution_evidence: evidence }
        : r,
    ),
    updated_at: at,
  }
}

export function openReconciliations(record) {
  return (record.reconciliation ?? []).filter((r) => r.resolved_at === null)
}
