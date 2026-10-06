// What this session changed: every file Claude edited or wrote, with the
// lines it added and removed, and the commands it ran and how they ended.
// Counted from the tools' own patches and inputs; nothing is read from disk.

import type { Changes, CommandRun, FileChange } from '../types'

export type { Changes, CommandRun, FileChange }

export const NO_CHANGES: Changes = { files: [], commands: [], turn: 0 }

/** The most commands the list keeps, newest first. */
const COMMANDS_KEPT = 40

const str = (value: unknown): string => (typeof value === 'string' ? value : '')

/** Lines added and removed in a tool's `structuredPatch`, if it has one. */
export function patchCounts(patch: unknown): { added: number; removed: number } | undefined {
  if (!Array.isArray(patch)) return undefined
  let added = 0
  let removed = 0
  for (const hunk of patch as { lines?: unknown }[]) {
    for (const line of Array.isArray(hunk.lines) ? (hunk.lines as unknown[]) : []) {
      if (typeof line !== 'string') continue
      if (line.startsWith('+')) added++
      else if (line.startsWith('-')) removed++
    }
  }
  return { added, removed }
}

/** Lines in `after` that `before` lacks, and the other way: a rough diff when no patch came back. */
function lineDiff(before: string, after: string): { added: number; removed: number } {
  const count = (text: string): Map<string, number> => {
    const lines = new Map<string, number>()
    for (const line of text === '' ? [] : text.split('\n')) lines.set(line, (lines.get(line) ?? 0) + 1)
    return lines
  }
  const was = count(before)
  const now = count(after)
  let added = 0
  let removed = 0
  for (const [line, n] of now) added += Math.max(0, n - (was.get(line) ?? 0))
  for (const [line, n] of was) removed += Math.max(0, n - (now.get(line) ?? 0))
  return { added, removed }
}

export const EDITING = new Set(['Edit', 'MultiEdit', 'Write', 'NotebookEdit'])

/** The change an editing tool made: from its result's patch, else from its input. */
export function fileChangeOf(tool: string, input: Record<string, unknown>, result: unknown): { path: string; added: number; removed: number; isNew: boolean } | undefined {
  if (!EDITING.has(tool)) return undefined
  const record = (typeof result === 'object' && result !== null ? result : {}) as Record<string, unknown>
  const path = str(record.filePath) || str(input.file_path) || str(input.notebook_path)
  if (path === '') return undefined
  const isNew = record.type === 'create'
  const patched = patchCounts(record.structuredPatch)
  if (patched !== undefined && (patched.added > 0 || patched.removed > 0)) return { path, ...patched, isNew }
  if (tool === 'Write') return { path, added: str(input.content).split('\n').length, removed: 0, isNew }
  if (tool === 'Edit') return { path, ...lineDiff(str(input.old_string), str(input.new_string)), isNew }
  if (tool === 'MultiEdit' && Array.isArray(input.edits)) {
    let added = 0
    let removed = 0
    for (const one of input.edits as Record<string, unknown>[]) {
      const d = lineDiff(str(one.old_string), str(one.new_string))
      added += d.added
      removed += d.removed
    }
    return { path, added, removed, isNew }
  }
  return { path, added: 0, removed: 0, isNew }
}

/** `changes` with one more edit to a file, the file brought to the top. */
export function recordFile(changes: Changes, change: { path: string; added: number; removed: number; isNew: boolean }, at: number): Changes {
  const was = changes.files.find(f => f.path === change.path)
  const file: FileChange = {
    path: change.path,
    edits: (was?.edits ?? 0) + 1,
    added: (was?.added ?? 0) + change.added,
    removed: (was?.removed ?? 0) + change.removed,
    isNew: (was?.isNew ?? false) || change.isNew,
    turn: changes.turn,
    at,
  }
  return { ...changes, files: [file, ...changes.files.filter(f => f.path !== change.path)] }
}

export function recordCommand(changes: Changes, run: Omit<CommandRun, 'turn'>): Changes {
  return { ...changes, commands: [{ ...run, turn: changes.turn }, ...changes.commands].slice(0, COMMANDS_KEPT) }
}

/** `path` from the project's root when it is inside it. */
export function relativePath(path: string, root: string): string {
  const base = root.endsWith('/') ? root : `${root}/`
  return path.startsWith(base) ? path.slice(base.length) : path
}

export function totals(changes: Changes): { files: number; added: number; removed: number; commands: number; failed: number } {
  return {
    files: changes.files.length,
    added: changes.files.reduce((sum, f) => sum + f.added, 0),
    removed: changes.files.reduce((sum, f) => sum + f.removed, 0),
    commands: changes.commands.length,
    failed: changes.commands.filter(c => !c.isOk).length,
  }
}
