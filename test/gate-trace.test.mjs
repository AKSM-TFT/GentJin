import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createGateTracer, readGateTrace } from "../src/discovery/gate-trace.mjs"

test("a refusal is recorded with its reason and no absolute path", () => {
  const dir = mkdtempSync(join(tmpdir(), "gentjin-gt-"))
  const file = join(dir, "gate.jsonl")
  try {
    const tracer = createGateTracer({ file })
    const entry = tracer.record({
      tool: "edit",
      filePath: join(dir, "project", "src", "app.js"),
      projectRoot: join(dir, "project"),
      allowed: false,
      status: "in_progress",
      reasons: ["no recorded read in this session touched app.js"],
      sessionId: "session-secret-value",
    })

    assert.equal(entry.decision, "refused")
    assert.equal(entry.path, "src/app.js")
    assert.equal(entry.readiness, "in_progress")
    assert.notEqual(entry.session, "session-secret-value")
    assert.match(entry.session, /^[0-9a-f]{12}$/)

    const raw = readGateTrace(file)[0]
    assert.equal(raw.decision, "refused")
    assert.equal(raw.path, "src/app.js")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("an allowance is recorded too, so refusals are not the only visible outcome", () => {
  const dir = mkdtempSync(join(tmpdir(), "gentjin-gt-"))
  const file = join(dir, "gate.jsonl")
  try {
    const tracer = createGateTracer({ file })
    tracer.record({ tool: "write", filePath: join(dir, "project", "a.js"), projectRoot: join(dir, "project"), allowed: true, status: "ready" })
    assert.equal(readGateTrace(file)[0].decision, "allowed")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("a disabled tracer writes nothing", () => {
  const dir = mkdtempSync(join(tmpdir(), "gentjin-gt-"))
  const file = join(dir, "gate.jsonl")
  try {
    const tracer = createGateTracer({ file })
    tracer.disable()
    assert.equal(tracer.record({ tool: "edit", filePath: "x", allowed: false }), null)
    assert.equal(readGateTrace(file).length, 0)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("the trace never stores file content or command text", () => {
  const dir = mkdtempSync(join(tmpdir(), "gentjin-gt-"))
  const file = join(dir, "gate.jsonl")
  try {
    const tracer = createGateTracer({ file })
    const entry = tracer.record({
      tool: "write",
      filePath: join(dir, "project", "secret.txt"),
      projectRoot: join(dir, "project"),
      allowed: false,
      status: "in_progress",
      reasons: ["readiness incomplete"],
      sessionId: "s",
    })
    const serialized = JSON.stringify(entry)
    assert.equal(serialized.includes("secret"), true)
    assert.equal(serialized.includes("content"), false)
    assert.equal(serialized.includes("command"), false)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
