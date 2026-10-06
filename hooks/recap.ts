// Clawd's day: what he and Claude got up to today, kept per local date across
// sessions and projects, and drawn as a card to look back on or to share: the
// figures with a pixel icon each, where the day went room by room, the week,
// and how many days in a row there has been work.

import type { Day, Pose, RoomId, Theme } from '../types'
import { say, type Lang } from './i18n'
import { clawdArt } from './svg'

export type { Day }

const DAY_MS = 86_400_000

export const ROOM_IDS: readonly RoomId[] = ['library', 'codelab', 'terminal', 'web', 'game']

export function emptyDay(date: string): Day {
  return {
    date,
    turns: 0,
    workMs: 0,
    longestMs: 0,
    tools: 0,
    edits: 0,
    runs: 0,
    rooms: { library: 0, codelab: 0, terminal: 0, web: 0, game: 0 },
    testsPassed: 0,
    testsFailed: 0,
    commits: 0,
    pushes: 0,
    prsOpened: 0,
    prsMerged: 0,
    compactions: 0,
    helpers: 0,
    pets: 0,
  }
}

/** The person's local date, '2026-10-06'. */
export function dateOf(now: number, offset: number): string {
  return new Date(now + offset * 60_000).toISOString().slice(0, 10)
}

export function dayBefore(date: string): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10)
}

const hasWork = (day: Day | undefined): boolean => day !== undefined && day.turns + day.tools > 0

/** Days in a row with work, today first; a day not started yet doesn't break it. */
export function streakOf(days: readonly (Day | undefined)[]): number {
  const [today, ...before] = days
  let streak = hasWork(today) ? 1 : 0
  for (const day of before) {
    if (!hasWork(day)) break
    streak++
  }
  return streak
}

/** How Clawd sums the day up. */
export function poseOf(day: Day): Pose {
  if (!hasWork(day)) return 'sleep'
  if (day.prsMerged > 0 || day.testsPassed > day.testsFailed) return 'cheer'
  if (day.commits > 0 || day.pushes > 0) return 'itemget'
  if (day.testsFailed > 0) return 'oops'
  return 'type'
}

/** The room Clawd went to most, if he went anywhere. */
export function favoriteRoom(day: Day): RoomId | undefined {
  const [best] = [...ROOM_IDS].sort((a, b) => day.rooms[b] - day.rooms[a])
  return best === undefined || day.rooms[best] === 0 ? undefined : best
}

export function duration(ms: number, lang: Lang): string {
  const minutes = Math.round(ms / 60_000)
  return say(lang).recapDuration(Math.floor(minutes / 60), minutes % 60)
}

/** The day in one line, for the command's answer. */
export function recapLine(day: Day, streak: number, lang: Lang): string {
  const w = say(lang)
  if (!hasWork(day)) return w.recapQuiet
  return w.recapLine({
    turns: day.turns,
    work: duration(day.workMs, lang),
    tools: day.tools,
    edits: day.edits,
    passed: day.testsPassed,
    failed: day.testsFailed,
    commits: day.commits,
    pushes: day.pushes,
    streak,
  })
}

// ── The card ─────────────────────────────────────────────────────────────

const ROOM_COLOR: Record<RoomId, string> = { library: '#C8873F', codelab: '#4D8DF6', terminal: '#4CB363', web: '#8ECDF5', game: '#A98BF5' }

type Icon = { art: readonly string[]; key: Readonly<Record<string, string>> }

const W = '#FFFFFF'
const ICONS: Record<'turn' | 'tool' | 'edit' | 'run' | 'test' | 'commit' | 'push' | 'tidy' | 'coin', Icon> = {
  turn: { art: ['.#####.', '#######', '#.#.#.#', '#######', '.#####.', '.##....', '#......'], key: { '#': W, '.': '' } },
  tool: { art: ['....#.#', '....###', '...###.', '..###..', '.###...', '###....', '.#.....'], key: { '#': '#C9CDD3' } },
  edit: { art: ['#####..', '#...##.', '#.##..#', '#.....#', '#.###.#', '#.....#', '#######'], key: { '#': W } },
  run: { art: ['#######', '#.....#', '#g....#', '#.g...#', '#g.gg.#', '#.....#', '#######'], key: { '#': '#8A8F98', g: '#6EE7A0' } },
  test: { art: ['......g', '.....gg', 'g...gg.', 'gg.gg..', '.ggg...', '..g....', '.......'], key: { g: '#4CB363' } },
  commit: { art: ['..www..', '..www..', '...w...', '.rrrrr.', 'rrrrrrr', '.......', '.rr.rr.'], key: { w: '#9C6238', r: '#E5484D' } },
  push: { art: ['#######', '##...##', '#.#.#.#', '#..#..#', '#..r..#', '#######', '.......'], key: { '#': W, r: '#E5484D' } },
  tidy: { art: ['rrrrrr.', '.bbbbbb', 'gggggg.', '.yyyyy.', 'rrrrrr.', '.......', '.......'], key: { r: '#E5484D', b: '#4D8DF6', g: '#4CB363', y: '#F5C542' } },
  coin: { art: ['..yyy..', '.yyyyy.', 'yyoyyyy', 'yyoyyyy', 'yyyyyyy', '.yyyyy.', '..yyy..'], key: { y: '#F5C542', o: '#FFF1B8' } },
}

function icon(which: keyof typeof ICONS, x: number, y: number): string {
  const { art, key } = ICONS[which]
  const runs = new Map<string, string>()
  art.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const color = key[row[i] ?? '.']
      if (color) runs.set(color, `${runs.get(color) ?? ''}M${x + i} ${y + j}h1v1h-1z`)
    }
  })
  return [...runs].map(([color, d]) => `<path fill="${color}" d="${d}"/>`).join('')
}

const escape = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const FONT = "font-family=\"'PingFang TC','Noto Sans TC','Microsoft JhengHei',system-ui,sans-serif\""

/** Roughly how wide `text` sets at `size`: CJK a full em, the rest six tenths. */
function textWidth(text: string, size: number): number {
  let em = 0
  for (const ch of text) em += (ch.codePointAt(0) ?? 0) > 0x2e80 ? 1 : 0.6
  return em * size
}

const text = (x: number, y: number, size: number, fill: string, body: string, extra = ''): string =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${FONT} ${extra}>${body}</text>`

/**
 * The day as a 240 × 140 card: the title and date, Clawd in the day's pose
 * with how long he worked and where, eight figures with their icons, the
 * rooms as one bar, the week's tool calls, the streak, and where to get him.
 */
export function recapSvg(day: Day, week: readonly (Day | undefined)[], streak: number, lang: Lang, theme: Theme, name?: string): string {
  const w = say(lang)
  const isQuiet = !hasWork(day)
  let out = ''
  out += '<rect x="0.5" y="0.5" width="239" height="139" rx="6" fill="#262624" stroke="#D97757" stroke-width="1"/>'
  out += text(10, 17, 10, '#D97757', escape(name === undefined ? w.recapTitle : w.recapTitleOf(name)), 'font-weight="700"')
  out += text(230, 17, 6.5, '#A8A29E', escape(w.recapDate(day.date)), 'text-anchor="end"')
  // Clawd and his day in words
  out += `<svg x="8" y="24" width="84" height="29.4" viewBox="0 0 40 14" shape-rendering="crispEdges">${clawdArt(poseOf(day))}</svg>`
  const favorite = favoriteRoom(day)
  if (isQuiet) {
    out += text(10, 66, 7, '#F3E3C3', escape(w.recapQuiet), 'font-weight="700"')
  } else {
    out += text(10, 60, 5.2, '#A8A29E', escape(w.recapWorkedLead))
    out += text(10, 70.5, 9.5, '#F3E3C3', escape(duration(day.workMs, lang)), 'font-weight="700"')
  }
  if (favorite !== undefined) out += text(10, 79, 5, '#A8A29E', escape(w.recapFavorite(w.rooms[theme][favorite])))
  // Eight figures, two columns
  const sent = day.pushes + day.prsOpened
  const figures: [keyof typeof ICONS, string, string][] = [
    ['turn', String(day.turns), w.recapTurns(day.turns)],
    ['tool', String(day.tools), w.recapTools(day.tools)],
    ['edit', String(day.edits), w.recapEdits(day.edits)],
    ['run', String(day.runs), w.recapRuns(day.runs)],
    ['test', `${day.testsPassed}/${day.testsPassed + day.testsFailed}`, w.recapTests],
    ['commit', String(day.commits), w.recapCommits(day.commits)],
    ['push', String(sent), w.recapPushes(sent)],
    ['tidy', String(day.compactions), w.recapTidies(day.compactions)],
  ]
  figures.forEach(([which, value, label], i) => {
    const x = 100 + (i % 2) * 66
    const y = 25 + Math.floor(i / 2) * 12
    out += icon(which, x, y)
    out += text(x + 10, y + 6.4, 7.5, '#FFFFFF', `${escape(value)}<tspan font-size="5.2" fill="#A8A29E" dx="2">${escape(label)}</tspan>`, 'font-weight="700"')
  })
  // Where the day went
  out += text(10, 88, 5.2, '#A8A29E', escape(w.recapWhere))
  const total = ROOM_IDS.reduce((sum, id) => sum + day.rooms[id], 0)
  if (total === 0) {
    out += '<rect x="10" y="91" width="220" height="6" rx="1" fill="#3A3F47"/>'
  } else {
    let x = 10
    let legend = 10
    for (const id of ROOM_IDS) {
      if (day.rooms[id] === 0) continue
      const width = (220 * day.rooms[id]) / total
      out += `<rect x="${x.toFixed(2)}" y="91" width="${width.toFixed(2)}" height="6" fill="${ROOM_COLOR[id]}"/>`
      x += width
      const name = `${w.rooms[theme][id]} ${Math.round((100 * day.rooms[id]) / total)}%`
      if (legend + textWidth(name, 4.6) + 5 <= 232) {
        out += `<rect x="${legend}" y="100.5" width="3" height="3" fill="${ROOM_COLOR[id]}"/>`
        out += text(legend + 4.5, 103.6, 4.6, '#C9CDD3', escape(name))
        legend += textWidth(name, 4.6) + 9
      }
    }
  }
  // The week, oldest first, and the streak
  out += text(10, 118, 5.2, '#A8A29E', escape(w.recapWeek))
  const most = Math.max(1, ...week.map(d => d?.tools ?? 0))
  week.forEach((d, i) => {
    const height = Math.max(1, Math.round((14 * (d?.tools ?? 0)) / most))
    const isToday = i === week.length - 1
    out += `<rect x="${36 + i * 10}" y="${127 - height}" width="7" height="${height}" fill="${isToday ? '#D97757' : '#7A5546'}"/>`
  })
  out += text(230, 125, 8, '#D97757', escape(w.recapStreak(streak)), 'text-anchor="end" font-weight="700"')
  out += text(120, 135.5, 4.2, '#7D7873', 'clawd-sidekick · github.com/Tunai-0511/clawd-sidekick', 'text-anchor="middle"')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140" width="100%" height="100%"><style>:root{color-scheme:light dark;background:transparent}</style>${out}</svg>`
}

// ── The session's summary ────────────────────────────────────────────────

export type SessionSummary = {
  totals: Day
  /** When the session began, and the person's clock: minutes east of UTC. */
  startedAt: number
  offset: number
  files: readonly { path: string; added: number; removed: number }[]
  added: number
  removed: number
  failed: number
  usd: number | null
}

/** The session in one line, for a toast. */
export function sessionLine(d: SessionSummary, lang: Lang): string {
  const w = say(lang)
  if (!hasWork(d.totals)) return w.sessionQuiet
  return w.sessionLine({
    work: duration(d.totals.workMs, lang),
    turns: d.totals.turns,
    tools: d.totals.tools,
    files: d.files.length,
    added: d.added,
    removed: d.removed,
    runs: d.totals.runs,
    failed: d.failed,
    commits: d.totals.commits,
    pushes: d.totals.pushes,
    usd: d.usd === null ? null : d.usd.toFixed(2),
  })
}

const clockOf = (at: number, offset: number): string => new Date(at + offset * 60_000).toISOString().slice(11, 16)

/**
 * The session as a 240 × 140 card, in the day card's dress: the project and
 * when it began, Clawd in the session's pose with how long he worked, eight
 * figures, and the files changed most.
 */
export function sessionSvg(d: SessionSummary, lang: Lang, project: string): string {
  const w = say(lang)
  const t = d.totals
  let out = ''
  out += '<rect x="0.5" y="0.5" width="239" height="139" rx="6" fill="#262624" stroke="#D97757" stroke-width="1"/>'
  out += text(10, 17, 10, '#D97757', escape(project === '' ? w.sessionTitle : `${w.sessionTitle} · ${project}`), 'font-weight="700"')
  out += text(230, 17, 6.5, '#A8A29E', escape(w.sessionSince(clockOf(d.startedAt, d.offset))), 'text-anchor="end"')
  out += `<svg x="8" y="24" width="84" height="29.4" viewBox="0 0 40 14" shape-rendering="crispEdges">${clawdArt(poseOf(t))}</svg>`
  if (!hasWork(t)) {
    out += text(10, 66, 7, '#F3E3C3', escape(w.sessionQuiet), 'font-weight="700"')
  } else {
    out += text(10, 60, 5.2, '#A8A29E', escape(w.recapWorkedLead))
    out += text(10, 70.5, 9.5, '#F3E3C3', escape(duration(t.workMs, lang)), 'font-weight="700"')
  }
  const figures: [keyof typeof ICONS, string, string][] = [
    ['turn', String(t.turns), w.sessionReplies(t.turns)],
    ['tool', String(t.tools), w.recapTools(t.tools)],
    ['edit', `${d.files.length}`, `${w.sessionFiles(d.files.length)} +${d.added} −${d.removed}`],
    ['run', String(t.runs), d.failed > 0 ? `${w.sessionCommands(t.runs)} · ${w.sessionFailed(d.failed)}` : w.sessionCommands(t.runs)],
    ['test', `${t.testsPassed}/${t.testsPassed + t.testsFailed}`, w.recapTests],
    ['commit', String(t.commits), w.recapCommits(t.commits)],
    ['push', String(t.pushes + t.prsOpened), w.recapPushes(t.pushes + t.prsOpened)],
    ['coin', d.usd === null ? '–' : `$${d.usd.toFixed(2)}`, w.sessionCost],
  ]
  figures.forEach(([which, value, label], i) => {
    const x = 100 + (i % 2) * 66
    const y = 25 + Math.floor(i / 2) * 12
    out += icon(which, x, y)
    out += text(x + 10, y + 6.4, 7.5, '#FFFFFF', `${escape(value)}<tspan font-size="5.2" fill="#A8A29E" dx="2">${escape(label)}</tspan>`, 'font-weight="700"')
  })
  out += text(10, 88, 5.2, '#A8A29E', escape(w.sessionTop))
  const top = [...d.files].sort((a, b) => b.added + b.removed - (a.added + a.removed)).slice(0, 4)
  top.forEach((f, i) => {
    const y = 97 + i * 8
    const name = f.path.length > 46 ? `…${f.path.slice(-45)}` : f.path
    out += text(10, y, 5.4, '#E7E5E4', escape(name))
    out += text(230, y, 5.4, '#4CB363', `+${f.added}<tspan fill="#E5484D" dx="3">−${f.removed}</tspan>`, 'text-anchor="end"')
  })
  if (top.length === 0) out += text(10, 97, 5.4, '#7D7873', '–')
  out += text(120, 135.5, 4.2, '#7D7873', 'clawd-sidekick · github.com/Tunai-0511/clawd-sidekick', 'text-anchor="middle"')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140" width="100%" height="100%"><style>:root{color-scheme:light dark;background:transparent}</style>${out}</svg>`
}
