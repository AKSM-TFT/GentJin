const BANNED_SECTIONS = [
  "Root Cause",
  "Implementation",
  "Testing",
  "Notes",
  "Documentation",
  "Verification",
  "Investigation",
  "Root cause",
  "Detailed",
]

const PATH_LIKE = /(^|[\s(])((?:[\w.-]+\/)+[\w.-]+\.[a-z]{1,5})\b/g
const SYMBOL_LIKE = /\b[A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*\(/g
const EXTENSIONS = /\.(?:js|mjs|cjs|ts|tsx|jsx|json|jsonc|yaml|yml|sh|ps1|py|css|html)\b/g
const TEST_COUNTS = /\b\d+\s+(tests?|scenarios?|checks?|files?|passed?|passing)\b/i
const HEDGE_CLAIM = /\b(all|every)\s+\d+\s+(tests?|checks?)\s+(pass|passed)\b/i
const STACK = /at\s+\w+\s*\(|:\d+:\d+|Error:\s|Traceback/

export function splitBody(body) {
  const lines = String(body ?? "").split(/\r?\n/)
  const numbered = []
  const prose = []
  for (const line of lines) {
    if (/^\s*\d+\.\s+\S/.test(line)) numbered.push(line.trim())
    else if (line.trim()) prose.push(line.trim())
  }
  return { numbered, prose }
}

function proseBlocks(body) {
  const lines = String(body ?? "").split(/\r?\n/)
  const blocks = []
  let current = []
  for (const line of lines) {
    if (/^\s*\d+\.\s+\S/.test(line)) {
      if (current.length) blocks.push(current.join(" "))
      current = []
      continue
    }
    if (line.trim()) current.push(line.trim())
    else if (current.length) {
      blocks.push(current.join(" "))
      current = []
    }
  }
  if (current.length) blocks.push(current.join(" "))
  return blocks
}

export function checkChangeDescription(body, options = {}) {
  const text = String(body ?? "")
  const findings = []
  const { numbered, prose } = splitBody(text)

  if (numbered.length === 0) {
    findings.push("no numbered change list")
    return { ok: false, findings, items: numbered.length, proseLines: prose.length }
  }

  const afterList = proseBlocks(text)
  const longParagraphs = afterList.filter((b) => b.split(/\s+/).length > 45)
  if (longParagraphs.length > 0) {
    findings.push(
      `${longParagraphs.length} prose block(s) after the list exceed 45 words; a numbered list followed by a long technical paragraph fails the format`,
    )
  }

  const sectionHeadings = [
    ...(text.match(/^[A-Z][A-Za-z ]{2,20}:\s*$/gm) ?? []),
    ...(text.match(/^\s*(Notes|Documentation|Testing|Root Cause|Implementation|Verification|Investigation)\s*$/gm) ?? []),
  ].map((h) => h.trim())
  const banned = sectionHeadings.filter((h) => BANNED_SECTIONS.includes(h.replace(/:\s*$/, "")))
  if (banned.length > 0) findings.push(`audit-style section(s) present: ${[...new Set(banned)].join(", ")}`)

  if (!options.allowPaths) {
    const paths = [...text.matchAll(PATH_LIKE)]
      .map((m) => m[2])
      .filter((p) => EXTENSIONS.test(p))
    if (paths.length > 0) findings.push(`file path(s) present: ${[...new Set(paths)].join(", ")}`)

    const exts = [...text.matchAll(EXTENSIONS)].map((m) => m[0])
    if (exts.length > 0) findings.push(`implementation extension(s) present: ${[...new Set(exts)].join(", ")}`)

    const symbols = [...text.matchAll(SYMBOL_LIKE)].map((m) => m[0])
    if (symbols.length > 0) findings.push(`symbol call(s) present: ${[...new Set(symbols)].join(", ")}`)
  }

  const inventoryAllowed = options.allowTestCounts === true || options.evidenceProvided === true
  if (!inventoryAllowed && TEST_COUNTS.test(text)) {
    findings.push("test or file inventory present")
  }

  if (STACK.test(text)) findings.push("stack-trace-like content present")

  if (HEDGE_CLAIM.test(text) && options.evidenceProvided !== true) {
    findings.push("claims every check passed without supplied evidence")
  }

  const wordyItems = numbered.filter((l) => l.split(/\s+/).length > 32)
  if (wordyItems.length > 0) {
    findings.push(`${wordyItems.length} numbered item(s) exceed roughly 30 words`)
  }

  return {
    ok: findings.length === 0,
    findings,
    items: numbered.length,
    proseLines: prose.length,
    longestParagraph: Math.max(0, ...afterList.map((l) => l.split(/\s+/).length)),
  }
}

const INVENTORY_SENTENCE = /^(?:Verification|Testing|Results|Coverage|Defects|Notes)\b[^.]*\.\s*/i

function clauseIsImplementationDetail(clause) {
  return EXTENSIONS.test(clause) || PATH_LIKE.test(clause) || SYMBOL_LIKE.test(clause) || TEST_COUNTS.test(clause)
}

export function sanitizeItem(item) {
  const sentences = String(item)
    .replace(/\s+/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(INVENTORY_SENTENCE, "")
    .trim()

  const kept = sentences
    .split(/(?<=[.!?])\s+|,\s+/)
    .map((clause) => clause.trim())
    .filter((clause) => clause.length > 0 && !clauseIsImplementationDetail(clause))
    .map((clause) => clause.replace(EXTENSIONS, "").replace(SYMBOL_LIKE, "").trim())
    .map((clause) => clause.replace(PATH_LIKE, (_m, lead, path) => `${lead}${path.replace(/\.[a-z]+$/, "")}`))

  let text = kept.join(" ").replace(/\s{2,}/g, " ").replace(/\s+([,.])/g, "$1").trim()
  text = text.replace(/^[\s,.;:-]+/, "").replace(/[\s,;:-]+$/, "")
  if (text && !/[.!?]$/.test(text)) text += "."
  return text.replace(/^[a-z]/, (c) => c.toUpperCase())
}

export function isUsableItem(item) {
  const words = item.split(/\s+/).filter(Boolean)
  if (words.length < 4) return false
  if (!/[.!?)]$/.test(item) && item.split(/\s+/).length < 8) return false
  if (!/[aeiouAEIOU]/.test(item.replace(/[^a-zA-Z]/g, ""))) return false
  return true
}

export function convertNarrativeToConcise(narrative) {
  const candidates = String(narrative ?? "")
    .split(/\n\s*\n/)
    .flatMap((block) => block.split(/\n(?=\s*[-*]\s)/))
    .map((b) => b.replace(/^\s*[-*]\s+/, "").trim())
    .filter((b) => b.length > 25 && !/^(Not verified|Limitations|Defects)/i.test(b))

  const picked = []
  const seen = new Set()

  for (const block of candidates) {
    const firstSentence = block.split(/(?<=\.)\s+/)[0]
    const cleaned = sanitizeItem(firstSentence)
    if (!isUsableItem(cleaned)) continue
    const key = cleaned.toLowerCase().slice(0, 40)
    if (seen.has(key)) continue
    seen.add(key)
    picked.push(cleaned.slice(0, 200))
    if (picked.length >= 8) break
  }

  return picked
}

export function renderChangeDescription(items, summary) {
  const lines = []
  if (summary) lines.push(summary, "")
  items.forEach((item, index) => lines.push(`${index + 1}. ${item}`))
  return lines.join("\n")
}

export function renderManualPrBlock(title, body) {
  return [
    "--- ready-to-paste pull request ---",
    "Title:",
    title,
    "",
    "Description:",
    body,
    "--- end ---",
  ].join("\n")
}

export function extractCopyablePrBlock(report) {
  const start = report.indexOf("--- ready-to-paste pull request ---")
  const end = report.indexOf("--- end ---")
  if (start === -1 || end === -1) return null
  return report.slice(start, end + "--- end ---".length)
}

export function reportKeepsAuditOutsideBlock(report) {
  const block = extractCopyablePrBlock(report)
  if (!block) return { ok: false, reason: "no copyable block present" }
  const body = block.slice(block.indexOf("--- ready-to-paste pull request ---"))
  const hasNotes = /\nNotes\n/.test(body)
  const hasDocumentation = /\nDocumentation\n/.test(body)
  return {
    ok: !hasNotes && !hasDocumentation,
    reason: hasNotes || hasDocumentation ? "console Notes/Documentation leaked into the copyable block" : "clean",
  }
}