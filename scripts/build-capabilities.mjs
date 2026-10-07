import { writeFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { buildCapabilityRegistry, validateCapabilityRegistry } from "../src/capabilities/registry.mjs"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const registry = buildCapabilityRegistry(repoRoot)
const result = validateCapabilityRegistry(registry)

mkdirSync(join(repoRoot, "registry"), { recursive: true })
writeFileSync(join(repoRoot, "registry", "capabilities.json"), `${JSON.stringify(registry, null, 2)}\n`, "utf8")

const skills = registry.capabilities.filter((c) => c.kind === "skill").length
const commands = registry.capabilities.filter((c) => c.kind === "command").length
console.log(`wrote ${registry.capabilities.length} capabilities (${skills} skills, ${commands} commands) to registry/capabilities.json`)
if (!result.valid) {
  for (const e of result.errors) console.log(`  INVALID ${e.path}: ${e.message}`)
  process.exitCode = 1
}
