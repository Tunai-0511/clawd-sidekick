// Deadline radar: parsing "/deadline add 12/24 Report" and saying how close it is.
//
// Times are kept as UTC milliseconds; `offset` is the person's zone in
// minutes east of UTC, read from the host once (the module may run in UTC).

import { say, type Lang } from './i18n'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export type ParsedDeadline = { due: number; title: string } | { error: string }

/** "+0800" → 480. */
export function parseOffset(zone: string): number | undefined {
  const m = zone.trim().match(/^([+-])(\d{2}):?(\d{2})$/)
  if (m === null) return undefined
  const minutes = Number(m[2]) * 60 + Number(m[3])
  return m[1] === '-' ? -minutes : minutes
}

/** The local calendar day of `ms`: year, month (1-12), day. */
function localDay(ms: number, offset: number): { y: number; mo: number; d: number } {
  const local = new Date(ms + offset * MINUTE)
  return { y: local.getUTCFullYear(), mo: local.getUTCMonth() + 1, d: local.getUTCDate() }
}

const toUtc = (y: number, mo: number, d: number, hh: number, mm: number, offset: number): number =>
  Date.UTC(y, mo - 1, d, hh, mm) - offset * MINUTE

const RELATIVE: Record<string, number> = { 今天: 0, 明天: 1, 後天: 2, today: 0, tomorrow: 1 }

export function parseDeadline(input: string, now: number, offset: number, lang: Lang): ParsedDeadline {
  const text = input.trim()
  const words = say(lang)
  const relative = text.match(/^(今天|明天|後天|today|tomorrow|\+(\d{1,3})d)(?:\s+(\d{1,2}):(\d{2}))?\s+(.+)$/i)
  if (relative !== null) {
    const days = RELATIVE[relative[1]!.toLowerCase()] ?? Number(relative[2])
    const today = localDay(now, offset)
    const hh = relative[3] === undefined ? 23 : Number(relative[3])
    const mm = relative[4] === undefined ? 59 : Number(relative[4])
    return { due: toUtc(today.y, today.mo, today.d + days, hh, mm, offset), title: relative[5]!.trim() }
  }
  const m = text.match(/^(?:(\d{4})[-/.])?(\d{1,2})[-/.](\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?\s+(.+)$/)
  if (m === null) return { error: words.usage }
  const mo = Number(m[2])
  const d = Number(m[3])
  const hh = m[4] === undefined ? 23 : Number(m[4])
  const mm = m[5] === undefined ? 59 : Number(m[5])
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || hh > 23 || mm > 59) return { error: `${words.badDate} ${words.usage}` }
  let y = m[1] === undefined ? localDay(now, offset).y : Number(m[1])
  let due = toUtc(y, mo, d, hh, mm, offset)
  if (m[1] === undefined && due < now - DAY) {
    y += 1
    due = toUtc(y, mo, d, hh, mm, offset)
  }
  return { due, title: m[6]!.trim() }
}

export type Urgency = 'far' | 'near' | 'urgent' | 'over'

export function urgency(due: number, now: number): Urgency {
  const left = due - now
  if (left < 0) return 'over'
  if (left < DAY) return 'urgent'
  if (left < 3 * DAY) return 'near'
  return 'far'
}

/** "剩 5 天" / "5 days left", "剩 6 小時 20 分" / "6 h 20 min left", "過了 2 天" / "2 days ago". */
export function countdown(due: number, now: number, lang: Lang): string {
  const words = say(lang)
  const left = due - now
  const abs = Math.abs(left)
  const days = Math.floor(abs / DAY)
  const hours = Math.floor((abs % DAY) / HOUR)
  const minutes = Math.floor((abs % HOUR) / MINUTE)
  if (left < 0) return days > 0 ? words.ago.days(days) : words.ago.hours(hours)
  if (days >= 2) return words.left.days(days)
  if (days === 1) return words.left.dayHours(hours)
  if (hours >= 1) return words.left.hoursMinutes(hours, minutes)
  return words.left.minutes(minutes)
}

/** "12/24 23:59" in the person's zone. */
export function formatDue(due: number, offset: number): string {
  const local = new Date(due + offset * MINUTE)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${local.getUTCMonth() + 1}/${local.getUTCDate()} ${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`
}

export const URGENCY_COLOR: Record<Urgency, string> = {
  far: '#8A8F98',
  near: '#F5C542',
  urgent: '#E5484D',
  over: '#5C6068',
}
