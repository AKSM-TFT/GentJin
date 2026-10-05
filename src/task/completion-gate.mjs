import taskRecordSchema from "../../schemas/task-record.schema.json" with { type: "json" }
import { validate } from "../schema/validate.mjs"

const FAILING = new Set(["fail", "not_run"])

export function evaluateCompletion(record, options = {}) {
  const reasons = []
  const notes = []
  const blocking = []

  const finish = (schemaValid) => ({
    eligible: reasons.length === 0 && blocking.length === 0,
    reasons,
    notes,
    blocking_criteria: [...new Set(blocking)],
    schema_valid: schemaValid,
  })

  const structural = validate(record, taskRecordSchema)
  if (!structural.valid) {
    for (const error of structural.errors) {
      reasons.push(`schema violation at ${error.path || "/"}: ${error.message}`)
    }
    return finish(false)
  }

  if (record.state === "completed" || record.outcome.result === "success") {
    for (const criterion of record.acceptance_criteria) {
      const mandatory = criterion.mandatory ?? true
      if (criterion.status === "pass") continue

      if (criterion.status === "not_applicable") {
        if (!criterion.not_applicable_reason) {
          reasons.push(`criterion "${criterion.id}" is not_applicable with no reason given`)
          if (mandatory) blocking.push(criterion.id)
          continue
        }
        notes.push(
          `criterion "${criterion.id}" is not_applicable: ${criterion.not_applicable_reason}`,
        )
        if (mandatory) {
          reasons.push(
            `mandatory criterion "${criterion.id}" cannot be waived; it is not_applicable`,
          )
          blocking.push(criterion.id)
        }
        continue
      }

      if (!mandatory) {
        notes.push(`non-mandatory criterion "${criterion.id}" is ${criterion.status}`)
        continue
      }

      blocking.push(criterion.id)
      reasons.push(
        `mandatory criterion "${criterion.id}" is ${criterion.status}` +
          (criterion.remaining_check ? `; remaining check: ${criterion.remaining_check}` : ""),
      )
    }
  }

  if (record.state === "completed") {
    for (const criterion of record.acceptance_criteria) {
      if (criterion.status !== "pass") continue
      const refs = criterion.evidence ?? []
      const unbacked = refs.filter((ref) => {
        const match = record.verification.evidence.find((e) => e.reference === ref)
        return !match || match.source !== "observed"
      })
      if (unbacked.length > 0) {
        blocking.push(criterion.id)
        reasons.push(
          `criterion "${criterion.id}" claims pass but evidence is not observed: ${unbacked.join(", ")}`,
        )
      }
      if (refs.length === 0) {
        blocking.push(criterion.id)
        reasons.push(`criterion "${criterion.id}" claims pass with no evidence reference`)
      }
    }
  }

  const requiredChecks = options.requiredChecks ?? record.verification.checks_required ?? 0
  const runChecks = options.requiredChecks === undefined ? record.verification.checks_run ?? 0 : options.requiredChecks
  if (record.state === "completed" && requiredChecks > 0 && runChecks < requiredChecks) {
    reasons.push(
      `completed with ${runChecks} of ${requiredChecks} required checks executed; an unexecuted check cannot count as success`,
    )
    blocking.push("__verification_coverage__")
  }

  const blockingBlockers = record.blockers.filter((b) => b.blocking)
  if (record.state === "completed" && blockingBlockers.length > 0) {
    reasons.push(
      `completed while ${blockingBlockers.length} unresolved blocking issue(s) remain: ` +
        blockingBlockers.map((b) => b.description).join("; "),
    )
    blocking.push("__blockers__")
  }

  if (record.scope.allow_code_changes === false) {
    const changed = record.file_changes ?? []
    const violations = changed.filter((c) => !isWithinScope(c.path, record.scope.allowed_paths))
    if (violations.length > 0) {
      reasons.push(
        `scope violation: review-only task changed ${violations.length} file(s) outside scope: ` +
          violations.map((v) => v.path).join(", "),
      )
      blocking.push("__scope__")
    }
  }

  if (record.state === "completed" && record.routing?.basis === "observed" && !options.routingObserved) {
    reasons.push("routing basis claims 'observed' but skill selection fires no hook; must be 'inferred'")
    blocking.push("__routing_basis__")
  }

  return finish(true)
}

export function isWithinScope(path, allowedPaths) {
  if (!Array.isArray(allowedPaths) || allowedPaths.length === 0) return true
  const normalized = String(path).replace(/\\/g, "/")
  return allowedPaths.some((allowed) => {
    const prefix = String(allowed).replace(/\\/g, "/").replace(/\/$/, "")
    return normalized === prefix || normalized.startsWith(`${prefix}/`)
  })
}

export function assertCompleted(record, options = {}) {
  const result = evaluateCompletion(record, options)
  if (result.eligible) return record

  if (record.state === "completed" || record.outcome?.result === "success") {
    const downgraded = {
      ...record,
      state: record.verification.checks_run > 0 ? "needs_verification" : "in_progress",
      outcome: {
        ...record.outcome,
        result: "partial",
        summary:
          `Completion rejected by the validator. ${result.reasons.join(" | ")}` +
          (options.nextAction ? ` Next: ${options.nextAction}` : ""),
      },
      validation: {
        eligible: false,
        reasons: result.reasons,
        blocking_criteria: result.blocking_criteria,
        evaluated_at: new Date().toISOString(),
      },
    }
    return downgraded
  }

  return { ...record, validation: { ...(record.validation ?? {}), eligible: false, reasons: result.reasons } }
}

export const __testing = { FAILING }