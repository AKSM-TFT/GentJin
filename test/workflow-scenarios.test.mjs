import { test } from "node:test"
import assert from "node:assert/strict"
import { runAll, scenarios } from "../evals/workflow-scenarios.mjs"

test("the roadmap's fourteen required scenarios are all defined", () => {
  assert.equal(scenarios.length, 14)
  const ids = scenarios.map((s) => s.id)
  assert.deepEqual(ids, Array.from({ length: 14 }, (_, i) => i + 1))
})

test("every required scenario passes", async () => {
  for (const result of await runAll()) {
    assert.equal(result.pass, true, `scenario ${result.id} failed: ${result.detail}`)
  }
})

test("every scenario records its expectation so a failure is diagnosable", () => {
  for (const scenario of scenarios) {
    assert.ok(scenario.expect.length > 10, `scenario ${scenario.id} needs an expectation`)
    assert.ok(scenario.name.length > 10, `scenario ${scenario.id} needs a descriptive name`)
  }
})