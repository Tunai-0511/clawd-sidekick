// Trophies: goals from a first commit to a hundred days in a row, most in
// four tiers (bronze, silver, gold, legendary), kept for good once reached.
// Every tier reached hangs a medal under the game room's bunting; some bring
// the main Clawd a hat, a pal who walks the floor, or a golden seal on
// commits and pushes. Progress is measured against `Life`, every day's work
// added up.

import type { Day, Hat, Life, Pal, Tier, Trophies } from '../types'

export const TIERS: readonly Tier[] = ['bronze', 'silver', 'gold', 'legend']

export type Reward = { hat: Hat } | { pal: Pal } | { golden: 'stamp' | 'seal' }

export type FamilyId =
  | 'streak'
  | 'days'
  | 'commits'
  | 'pushes'
  | 'tests'
  | 'green'
  | 'tools'
  | 'edits'
  | 'tidy'
  | 'helpers'
  | 'night'
  | 'dawn'
  | 'marathon'
  | 'longTurn'
  | 'busyDay'
  | 'pets'
  | 'prs'
  | 'scenes'
  | 'holidays'
  | 'comeback'
  | 'todos'

/** How a family's progress reads: a count, days, or time in hours or minutes. */
export type Unit = 'count' | 'days' | 'hours' | 'minutes'

export type Family = {
  id: FamilyId
  unit: Unit
  tiers: readonly { tier: Tier; target: number; reward?: Reward }[]
  progress: (life: Life) => number
}

const HOUR = 3_600_000
const MINUTE = 60_000

/** Every goal there is, in the order the trophy pane lists them. */
export const FAMILIES: readonly Family[] = [
  {
    id: 'streak',
    unit: 'days',
    progress: l => l.bestStreak,
    tiers: [
      { tier: 'bronze', target: 3 },
      { tier: 'silver', target: 7, reward: { hat: 'party' } },
      { tier: 'gold', target: 30, reward: { hat: 'crown' } },
      { tier: 'legend', target: 100, reward: { pal: 'cat' } },
    ],
  },
  {
    id: 'days',
    unit: 'days',
    progress: l => l.days,
    tiers: [
      { tier: 'bronze', target: 10 },
      { tier: 'silver', target: 50 },
      { tier: 'gold', target: 200 },
      { tier: 'legend', target: 365, reward: { hat: 'halo' } },
    ],
  },
  {
    id: 'commits',
    unit: 'count',
    progress: l => l.commits,
    tiers: [
      { tier: 'bronze', target: 1 },
      { tier: 'silver', target: 100 },
      { tier: 'gold', target: 1000, reward: { golden: 'stamp' } },
      { tier: 'legend', target: 5000 },
    ],
  },
  {
    id: 'pushes',
    unit: 'count',
    progress: l => l.pushes,
    tiers: [
      { tier: 'bronze', target: 1 },
      { tier: 'silver', target: 50 },
      { tier: 'gold', target: 500, reward: { golden: 'seal' } },
      { tier: 'legend', target: 2000 },
    ],
  },
  {
    id: 'tests',
    unit: 'count',
    progress: l => l.testsPassed,
    tiers: [
      { tier: 'bronze', target: 1 },
      { tier: 'silver', target: 100 },
      { tier: 'gold', target: 1000, reward: { hat: 'graduation' } },
      { tier: 'legend', target: 10000 },
    ],
  },
  {
    id: 'green',
    unit: 'count',
    progress: l => l.bestGreenRun,
    tiers: [
      { tier: 'bronze', target: 5 },
      { tier: 'silver', target: 25 },
      { tier: 'gold', target: 100 },
      { tier: 'legend', target: 500 },
    ],
  },
  {
    id: 'tools',
    unit: 'count',
    progress: l => l.tools,
    tiers: [
      { tier: 'bronze', target: 1000 },
      { tier: 'silver', target: 10000 },
      { tier: 'gold', target: 100000, reward: { hat: 'headphones' } },
      { tier: 'legend', target: 1000000 },
    ],
  },
  {
    id: 'edits',
    unit: 'count',
    progress: l => l.edits,
    tiers: [
      { tier: 'bronze', target: 100 },
      { tier: 'silver', target: 1000 },
      { tier: 'gold', target: 10000 },
      { tier: 'legend', target: 50000 },
    ],
  },
  {
    id: 'tidy',
    unit: 'count',
    progress: l => l.compactions,
    tiers: [
      { tier: 'bronze', target: 1 },
      { tier: 'silver', target: 10 },
      { tier: 'gold', target: 50, reward: { hat: 'wizard' } },
      { tier: 'legend', target: 200 },
    ],
  },
  {
    id: 'helpers',
    unit: 'count',
    progress: l => l.helpers,
    tiers: [
      { tier: 'bronze', target: 10 },
      { tier: 'silver', target: 100 },
      { tier: 'gold', target: 1000, reward: { hat: 'captain' } },
      { tier: 'legend', target: 5000 },
    ],
  },
  {
    id: 'night',
    unit: 'count',
    progress: l => l.nightTurns,
    tiers: [
      { tier: 'bronze', target: 1 },
      { tier: 'silver', target: 25 },
      { tier: 'gold', target: 100, reward: { pal: 'owl' } },
      { tier: 'legend', target: 500 },
    ],
  },
  {
    id: 'dawn',
    unit: 'count',
    progress: l => l.dawnTurns,
    tiers: [
      { tier: 'bronze', target: 1 },
      { tier: 'silver', target: 25 },
      { tier: 'gold', target: 100, reward: { hat: 'flower' } },
      { tier: 'legend', target: 300 },
    ],
  },
  {
    id: 'marathon',
    unit: 'hours',
    progress: l => l.bestDayMs / HOUR,
    tiers: [
      { tier: 'bronze', target: 4 },
      { tier: 'silver', target: 8 },
      { tier: 'gold', target: 12 },
      { tier: 'legend', target: 16 },
    ],
  },
  {
    id: 'longTurn',
    unit: 'minutes',
    progress: l => l.longestTurnMs / MINUTE,
    tiers: [
      { tier: 'bronze', target: 10 },
      { tier: 'silver', target: 30 },
      { tier: 'gold', target: 60 },
      { tier: 'legend', target: 180 },
    ],
  },
  {
    id: 'busyDay',
    unit: 'count',
    progress: l => l.bestDayTools,
    tiers: [
      { tier: 'bronze', target: 300 },
      { tier: 'silver', target: 1000 },
      { tier: 'gold', target: 3000 },
      { tier: 'legend', target: 10000 },
    ],
  },
  {
    id: 'pets',
    unit: 'count',
    progress: l => l.pets,
    tiers: [
      { tier: 'bronze', target: 10 },
      { tier: 'silver', target: 100 },
      { tier: 'gold', target: 1000, reward: { pal: 'crab' } },
      { tier: 'legend', target: 10000 },
    ],
  },
  {
    id: 'prs',
    unit: 'count',
    progress: l => l.prsMerged,
    tiers: [
      { tier: 'bronze', target: 1 },
      { tier: 'silver', target: 25 },
      { tier: 'gold', target: 100 },
      { tier: 'legend', target: 500 },
    ],
  },
  { id: 'scenes', unit: 'count', progress: l => l.scenes.length, tiers: [{ tier: 'silver', target: 4, reward: { hat: 'explorer' } }] },
  {
    id: 'holidays',
    unit: 'count',
    progress: l => l.holidays.length,
    tiers: [
      { tier: 'bronze', target: 1 },
      { tier: 'silver', target: 2 },
      { tier: 'gold', target: 3 },
    ],
  },
  {
    id: 'comeback',
    unit: 'count',
    progress: l => l.comebacks,
    tiers: [
      { tier: 'bronze', target: 1 },
      { tier: 'silver', target: 10 },
      { tier: 'gold', target: 50 },
    ],
  },
  {
    id: 'todos',
    unit: 'count',
    progress: l => l.todosDone,
    tiers: [
      { tier: 'bronze', target: 10 },
      { tier: 'silver', target: 100 },
      { tier: 'gold', target: 500 },
      { tier: 'legend', target: 2000 },
    ],
  },
]

export const TROPHY_TOTAL = FAMILIES.reduce((sum, f) => sum + f.tiers.length, 0)

export const trophyId = (family: FamilyId, tier: Tier): string => `${family}:${tier}`

export function emptyLife(): Life {
  return {
    turns: 0,
    workMs: 0,
    tools: 0,
    edits: 0,
    runs: 0,
    testsPassed: 0,
    testsFailed: 0,
    commits: 0,
    pushes: 0,
    prsOpened: 0,
    prsMerged: 0,
    compactions: 0,
    helpers: 0,
    pets: 0,
    days: 0,
    streak: 0,
    bestStreak: 0,
    lastDay: '',
    greenRun: 0,
    bestGreenRun: 0,
    failRun: 0,
    comebacks: 0,
    nightTurns: 0,
    dawnTurns: 0,
    longestTurnMs: 0,
    bestDayMs: 0,
    bestDayTools: 0,
    scenes: [],
    holidays: [],
    todosDone: 0,
  }
}

export const NO_TROPHIES: Trophies = { unlocked: {}, hat: 'auto', pal: 'auto' }

/** Every trophy `life` has reached. */
export function reached(life: Life): string[] {
  return FAMILIES.flatMap(f => {
    const value = f.progress(life)
    return f.tiers.filter(t => value >= t.target).map(t => trophyId(f.id, t.tier))
  })
}

/** A family's tier reached last and the one after it. */
export function standing(family: Family, unlocked: Readonly<Record<string, number>>): { tier: Tier | null; next: Family['tiers'][number] | null } {
  const got = family.tiers.filter(t => unlocked[trophyId(family.id, t.tier)] !== undefined)
  const next = family.tiers.find(t => unlocked[trophyId(family.id, t.tier)] === undefined) ?? null
  return { tier: got[got.length - 1]?.tier ?? null, next }
}

/** Each family's best medal, best tier first: what hangs in the game room. */
export function medalsOf(unlocked: Readonly<Record<string, number>>, limit = 10): Tier[] {
  return FAMILIES.map(f => standing(f, unlocked).tier)
    .filter((tier): tier is Tier => tier !== null)
    .sort((a, b) => TIERS.indexOf(b) - TIERS.indexOf(a))
    .slice(0, limit)
}

function rewardsOf(unlocked: Readonly<Record<string, number>>): Reward[] {
  return FAMILIES.flatMap(f => f.tiers.filter(t => t.reward !== undefined && unlocked[trophyId(f.id, t.tier)] !== undefined).map(t => t.reward!))
}

/** The hats reached, the finest first. */
export function hatsOf(unlocked: Readonly<Record<string, number>>): Hat[] {
  const order: readonly Hat[] = ['halo', 'crown', 'wizard', 'captain', 'headphones', 'graduation', 'explorer', 'flower', 'party']
  const got = new Set(rewardsOf(unlocked).flatMap(r => ('hat' in r ? [r.hat] : [])))
  return order.filter(hat => got.has(hat))
}

export function palsOf(unlocked: Readonly<Record<string, number>>): Pal[] {
  const order: readonly Pal[] = ['cat', 'owl', 'crab']
  const got = new Set(rewardsOf(unlocked).flatMap(r => ('pal' in r ? [r.pal] : [])))
  return order.filter(pal => got.has(pal))
}

export function goldenOf(unlocked: Readonly<Record<string, number>>): { stamp: boolean; seal: boolean } {
  const golden = rewardsOf(unlocked).flatMap(r => ('golden' in r ? [r.golden] : []))
  return { stamp: golden.includes('stamp'), seal: golden.includes('seal') }
}

/** What the main Clawd wears: the hat picked, if reached, else the finest. */
export function hatFor(trophies: Trophies): Hat | null {
  const hats = hatsOf(trophies.unlocked)
  if (trophies.hat === 'none') return null
  if (trophies.hat !== 'auto' && hats.includes(trophies.hat)) return trophies.hat
  return hats[0] ?? null
}

export function palFor(trophies: Trophies): Pal | null {
  const pals = palsOf(trophies.unlocked)
  if (trophies.pal === 'none') return null
  if (trophies.pal !== 'auto' && pals.includes(trophies.pal)) return trophies.pal
  return pals[0] ?? null
}

/** Rebuilds the totals from the days kept so far, for those who had them before trophies. */
export function lifeFromDays(days: readonly Day[]): Life {
  const life = emptyLife()
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))
  let previous = ''
  for (const day of sorted) {
    const keys = ['turns', 'workMs', 'tools', 'edits', 'runs', 'testsPassed', 'testsFailed', 'commits', 'pushes', 'prsOpened', 'prsMerged', 'compactions', 'helpers'] as const
    for (const key of keys) life[key] += day[key]
    life.longestTurnMs = Math.max(life.longestTurnMs, day.longestMs)
    life.bestDayMs = Math.max(life.bestDayMs, day.workMs)
    life.bestDayTools = Math.max(life.bestDayTools, day.tools)
    if (day.turns + day.tools === 0) continue
    life.days++
    life.streak = previous !== '' && nextDate(previous) === day.date ? life.streak + 1 : 1
    life.bestStreak = Math.max(life.bestStreak, life.streak)
    life.lastDay = day.date
    previous = day.date
  }
  return life
}

const nextDate = (date: string): string => new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)
