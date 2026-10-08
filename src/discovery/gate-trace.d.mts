export interface GateTraceEntry {
  at: string
  tool: string | null
  decision: "allowed" | "refused"
  readiness: string | null
  path: string | null
  reasons: string[]
  session: string | null
  task: string | null
}

export interface GateTracer {
  readonly file: string
  disable(): void
  record(entry: {
    tool?: string
    filePath?: string
    projectRoot?: string | null
    allowed: boolean
    status?: string | null
    reasons?: string[]
    sessionId?: string | null
    taskId?: string | null
  }): GateTraceEntry | null
}

export function createGateTracer(options?: { file?: string }): GateTracer
export function readGateTrace(file?: string): GateTraceEntry[]