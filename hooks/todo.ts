// The human's half: what Claude's replies leave for the person to do.

import type { Todo } from '../types'

/**
 * Cheap gate before any model call: a reply that never addresses the person
 * or names a hand-off is skipped. Misses cost nothing but a later `/todo add`.
 */
const HANDOFF =
  /你需要|你得|需要你|請你|請先|請到|請在|你要|您需要|由你|你自己|自行|手動|記得|你來|你這邊|交給你|要你|你可以先|上傳|報名|登入|申請|金鑰|簽署|付款|you(?:'ll| will)? need to|you must|you should|please|manually|on your (?:end|side)|yourself|action required|api key|sign (?:up|in)|log ?in|upload|submit/i

export function shouldExtract(answer: string): boolean {
  return answer.trim().length >= 20 && HANDOFF.test(answer)
}

export function extractPrompt(answer: string): string {
  const tail = answer.length > 6000 ? answer.slice(-6000) : answer
  return [
    'Below is the final message an AI coding assistant just sent to its user.',
    'List ONLY concrete actions the HUMAN user has to do personally, outside the assistant\'s reach:',
    'creating an account or API key, signing up, logging in, uploading or submitting something,',
    'paying, writing something in their own words, approving, deciding, testing on a real device.',
    'Do NOT list what the assistant did or will do, optional ideas, or questions it asked.',
    'Reply with a JSON array of strings only, each a short imperative under 24 characters,',
    'in the message\'s language (Traditional Chinese when the message is Chinese). Reply [] when there are none.',
    '',
    '<message>',
    tail,
    '</message>',
  ].join('\n')
}

/** The strings of the first JSON array in `text`, cleaned; [] when there is none. */
export function parseList(text: string): string[] {
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start < 0 || end <= start) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(text.slice(start, end + 1))
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  return parsed
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.replace(/\s+/g, ' ').trim())
    .filter(item => item.length >= 2 && item.length <= 60)
    .slice(0, 5)
}

const normal = (text: string): string => text.toLowerCase().replace(/[\s\p{P}]/gu, '')

/** Whether `text` says what an open todo already says. */
export function isDuplicate(todos: readonly Todo[], text: string): boolean {
  const n = normal(text)
  if (n.length === 0) return true
  return todos.some(todo => {
    if (todo.isDone) return false
    const m = normal(todo.text)
    return m === n || (Math.min(m.length, n.length) >= 4 && (m.includes(n) || n.includes(m)))
  })
}

/** Open todos, this project's first, oldest first within each. */
export function ordered(todos: readonly Todo[], project: string): Todo[] {
  return todos
    .filter(todo => !todo.isDone)
    .sort((a, b) => Number(b.project === project) - Number(a.project === project) || a.createdAt - b.createdAt)
}

export function newId(now: number, salt: string): string {
  return `${now.toString(36)}${(Math.abs(hash(salt)) % 1296).toString(36)}`
}

function hash(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (Math.imul(h, 31) + text.charCodeAt(i)) | 0
  return h
}
