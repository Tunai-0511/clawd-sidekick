// Clawd 副駕 (clawd-sidekick): the human's half of pairing with Claude.
//
// Above the prompt is Clawd's house: the main Clawd walks to the room of
// whatever Claude is doing, and a crew of three plays in the game room
// (volleyball while Claude works, something else while it waits, asleep at
// night) until a subagent calls one of them to work. Under it, the figures
// the status line knows. Clawd keeps the list of things only you can do
// (read off Claude's replies) and frets as your deadlines close in.

import { atom, read, update } from 'claude-code'
import type { Elements, EngineInterface, Register, RenderElement } from 'claude-code'

import type { Activity, Changes, Day, Deadline, Doing, Egg, Game, GitState, Hat, Holiday, Life, Neighbor, Pal, Pose, RoomId, SceneActor, SceneProps, Season, Theme, Tier, TimeOfDay, Trophies, Usage } from '../types'
import { countdown, formatDue, newId, parseDeadline, parseOffset, urgency, URGENCY_COLOR } from './deadline'
import { langOf, say, type Lang } from './i18n'
import { actorTip, actorX, eggOf, layoutFor, ROOMS, SH, SPOT_X, STEP, SW, type Spot } from './scene'
import { actorHoverSvg, doneClawdSvg, miniClawdSvg, roomHoverSvg, sceneSvg, squashClawdSvg } from './scene-svg'
import { cameraOf, HOUSE_ROWS, houseCells, signsLine } from './raster'
import { isSwitched, roomSpans } from './light'
import { H, W } from './sprite'
import { THEME_ORDER, THEMES } from './themes'
import { clawdSvg } from './svg'
import { EDITING, fileChangeOf, NO_CHANGES, recordCommand, recordFile, relativePath, totals } from './changes'
import { isTestRun, momentOf, type GitOperation } from './events'
import { gitColor, isDirty, needsCommit, parseStatus } from './git'
import { dateOf, dayBefore, duration, emptyDay, favoriteRoom, poseOf, recapLine, recapSvg, ROOM_IDS, sessionLine, sessionSvg, streakOf, type SessionSummary } from './recap'
import { holidayOf, seasonOf, zoneOf } from './seasons'
import {
  emptyLife,
  FAMILIES,
  goldenOf,
  hatFor,
  hatsOf,
  lifeFromDays,
  medalsOf,
  NO_TROPHIES,
  palFor,
  palsOf,
  reached,
  standing,
  TROPHY_TOTAL,
  type FamilyId,
} from './trophies'

type Engine = EngineInterface

const PANE = 'clawd'
const RECAP = 'clawd-recap'
const CHANGES_PANE = 'clawd-changes'
const TROPHY_PANE = 'clawd-trophies'
const SESSION_PANE = 'clawd-session'

/** What the spinner says the turn is doing: in English whatever Clawd speaks, beside Claude Code's own `Working…`. */
const MODE_WORDS = { requesting: 'requesting', responding: 'responding', thinking: 'thinking', 'tool-input': 'preparing a tool', 'tool-use': 'using tools' } as const
const ORANGE = '#D97757'
/** CSS pixels a desktop cell is taken to be, to size the house's frame. */
const CELL_PX = 8

const activity = atom({ plugin: 'clawd-sidekick', key: 'activity' } as const, { pose: 'idle', label: '', since: 0 })
const deadlinesAtom = atom({ plugin: 'clawd-sidekick', key: 'deadlines' } as const, [])
const collapsedAtom = atom({ plugin: 'clawd-sidekick', key: 'isCollapsed' } as const, false)
const petsAtom = atom({ plugin: 'clawd-sidekick', key: 'pets' } as const, 0)
const nowAtom = atom({ plugin: 'clawd-sidekick', key: 'now' } as const, 0)
const offsetAtom = atom({ plugin: 'clawd-sidekick', key: 'offset' } as const, 480)
const projectAtom = atom({ plugin: 'clawd-sidekick', key: 'project' } as const, '')
const gameAtom = atom({ plugin: 'clawd-sidekick', key: 'game' } as const, 'pong')
const langAtom = atom({ plugin: 'clawd-sidekick', key: 'lang' } as const, 'en')
const themeAtom = atom({ plugin: 'clawd-sidekick', key: 'theme' } as const, 'house')
const zoneAtom = atom({ plugin: 'clawd-sidekick', key: 'zone' } as const, '')
const todayAtom = atom({ plugin: 'clawd-sidekick', key: 'today' } as const, null)
const trophiesAtom = atom({ plugin: 'clawd-sidekick', key: 'trophies' } as const, NO_TROPHIES)
const neighborsAtom = atom({ plugin: 'clawd-sidekick', key: 'neighbors' } as const, [])
const eggAtom = atom({ plugin: 'clawd-sidekick', key: 'egg' } as const, null)
const birthdayAtom = atom({ plugin: 'clawd-sidekick', key: 'birthday' } as const, '')
const namesAtom = atom({ plugin: 'clawd-sidekick', key: 'names' } as const, {})
const gitAtom = atom({ plugin: 'clawd-sidekick', key: 'git' } as const, null)
const changesAtom = atom({ plugin: 'clawd-sidekick', key: 'changes' } as const, NO_CHANGES)
const openRowsAtom = atom({ plugin: 'clawd-sidekick', key: 'openRows' } as const, [])
const compactingAtom = atom({ plugin: 'clawd-sidekick', key: 'compacting' } as const, false)
const seasonPickAtom = atom({ plugin: 'clawd-sidekick', key: 'seasonPick' } as const, 'auto')
const holidayPickAtom = atom({ plugin: 'clawd-sidekick', key: 'holidayPick' } as const, 'auto')
const darkRoomsAtom = atom({ plugin: 'clawd-sidekick', key: 'darkRooms' } as const, [])
const sessionAtom = atom({ plugin: 'clawd-sidekick', key: 'session' } as const, { startedAt: 0, totals: emptyDay('') })

/**
 * What features since removed kept on this machine: the sound and band
 * setting, the to-do list, the weather and the place it was for. Nothing
 * reads them any more, so they are deleted when a session starts.
 */
const RETIRED_KEYS = ['band', 'todos', 'weather', 'weatherNoticed'] as const

const home = (id: string, cap: string | null, x: number, doing: Doing): SceneActor => ({ id, cap, fromX: x, toX: x, departAt: 0, doing, label: '' })

const HOUSE: SceneActor[] = [
  home('main', null, SPOT_X.library, 'read'),
  home('c1', 'blue', SPOT_X.arcade, 'arcade'),
  home('c2', 'green', SPOT_X.pongL, 'pong'),
  home('c3', 'purple', SPOT_X.pongR, 'pong'),
]

const actorsAtom = atom({ plugin: 'clawd-sidekick', key: 'actors' } as const, HOUSE)
const usageAtom = atom({ plugin: 'clawd-sidekick', key: 'usage' } as const, {
  model: '',
  contextPercent: null,
  fiveHour: null,
  sevenDay: null,
  fiveHourResetsAt: null,
  sevenDayResetsAt: null,
  usd: null,
  turnStartedAt: 0,
  tools: 0,
  edits: 0,
  runs: 0,
})

/** Where each of Clawd's poses takes him in the house; null stays put. */
const PLACE: Record<Pose, { spot: Spot | null; doing: Doing }> = {
  idle: { spot: 'library', doing: 'read' },
  think: { spot: 'code', doing: 'think' },
  type: { spot: 'bash', doing: 'type' },
  write: { spot: 'code', doing: 'code' },
  read: { spot: 'library', doing: 'read' },
  search: { spot: 'library', doing: 'read' },
  web: { spot: 'web', doing: 'web' },
  agent: { spot: 'code', doing: 'think' },
  wait: { spot: null, doing: 'wait' },
  cheer: { spot: null, doing: 'cheer' },
  panic: { spot: null, doing: 'panic' },
  oops: { spot: null, doing: 'oops' },
  sleep: { spot: 'library', doing: 'sleep' },
  itemget: { spot: 'board', doing: 'pin' },
  love: { spot: null, doing: 'love' },
  ask: { spot: null, doing: 'ask' },
  stamp: { spot: null, doing: 'stamp' },
  mail: { spot: null, doing: 'mail' },
  tidy: { spot: 'library', doing: 'tidy' },
  stretch: { spot: null, doing: 'stretch' },
}

const str = (value: unknown): string => (typeof value === 'string' ? value : '')
const baseName = (path: string): string => path.split('/').filter(Boolean).pop() ?? path
const clip = (text: string, size: number): string => (text.length > size ? `${text.slice(0, size - 1)}…` : text)

/** What a tool call looks like to Clawd: his pose and his line. */
function describe(tool: string, input: Record<string, unknown>): { pose: Pose; label: string } {
  const w = say(lang)
  const path = str(input.file_path) || str(input.notebook_path) || str(input.path)
  switch (tool) {
    case 'Bash':
      // Claude says what a command is for; that reads better than the command itself.
      return { pose: 'type', label: str(input.description) !== '' ? clip(str(input.description), 28) : w.run(clip(str(input.command).split('\n')[0] ?? '', 28)) }
    case 'Edit':
    case 'MultiEdit':
    case 'Write':
    case 'NotebookEdit':
      return { pose: 'write', label: w.edit(baseName(path)) }
    case 'Read':
      return { pose: 'read', label: w.read(baseName(path)) }
    case 'Grep':
    case 'Glob':
      return { pose: 'search', label: w.find(clip(str(input.pattern), 24)) }
    case 'WebSearch':
      return { pose: 'web', label: w.search(clip(str(input.query), 24)) }
    case 'WebFetch':
      return { pose: 'web', label: w.fetch(str(input.url).replace(/^https?:\/\//, '').split('/')[0] ?? '') }
    case 'Agent':
    case 'Task':
      return { pose: 'agent', label: w.dispatch(clip(str(input.description), 20)) }
    case 'AskUserQuestion':
      return { pose: 'wait', label: w.asks }
    case 'ExitPlanMode':
      return { pose: 'wait', label: w.plan }
    default: {
      const short = tool.startsWith('mcp__') ? (tool.split('__').pop() ?? tool) : tool
      return { pose: 'think', label: w.use(clip(short, 24)) }
    }
  }
}

const EDIT_TOOLS = new Set(['Edit', 'MultiEdit', 'Write', 'NotebookEdit'])

/** A crew member stands a little aside from the main Clawd, inside the same room. */
function crewX(id: string, spot: Spot): number {
  const x = SPOT_X[spot] + ({ c1: 9, c2: -9, c3: 5 }[id] ?? 0)
  const room = ROOMS.find(r => SPOT_X[spot] >= r.x && SPOT_X[spot] < r.x + r.w)
  return room === undefined ? x : Math.max(room.x, Math.min(room.x + room.w - 16, x))
}

/** `a` heading for `toX` (null: where he is going already) to do `doing` there. */
function moveActor(a: SceneActor, toX: number | null, doing: Doing, label: string, now: number): SceneActor {
  const target = toX ?? a.toX
  if (target === a.toX) return { ...a, doing, label }
  return { ...a, fromX: actorX(a, now), toX: target, departAt: now, doing, label }
}

/** "claude-opus-5-5[1m]" → "Opus 5.5". */
function modelName(model: string): string {
  const m = model.match(/(opus|sonnet|haiku|fable)[- ]?(\d+)(?:[-.](\d+))?/i)
  if (m === null) return model
  const name = m[1]!.charAt(0).toUpperCase() + m[1]!.slice(1).toLowerCase()
  return `${name} ${m[2]}${m[3] ? `.${m[3]}` : ''}`
}

/** The person's hour of the day. */
const hourOf = (now: number, offset: number): number => new Date(now + offset * 60_000).getUTCHours()

function timeOfDay(now: number, offset: number): TimeOfDay {
  const hour = hourOf(now, offset)
  if (hour >= 7 && hour < 17) return 'day'
  if (hour >= 17 && hour < 19) return 'dusk'
  return 'night'
}

/** Volleyball while Claude works; asleep late at night; otherwise a new game every ninety seconds. */
function chooseGame(now: number, offset: number): Game {
  const hour = hourOf(now, offset)
  const minute = new Date(now + offset * 60_000).getUTCMinutes()
  // The crew keeps its own day: lunch at noon, tea at three, whatever Claude is up to.
  if (hour === 12) return 'lunch'
  if (hour === 15 && minute < 30) return 'tea'
  if (isWorking) return 'volley'
  if (hour >= 23 || hour < 7) return 'sleep'
  return (['pong', 'rope', 'tower'] as const)[Math.floor(now / 90_000) % 3] ?? 'pong'
}

// Module state: what a reload may forget.

let settings = { language: 'auto' }
let lang: Lang = 'en'
let isWorking = false
let lastUsageAt = 0
let lastTurnMs = 0
let ticks = 0
/** When the run of work began (turns less than five minutes apart), when the last turn ended, and the last stretch. */
let busySince = 0
let lastTurnEndAt = 0
let lastStretchAt = 0
/** When the tree last went from clean to dirty (0 while clean), the last git read, and the last nudge to commit. */
let dirtySince = 0
let lastGitAt = 0
let lastNudgeAt = 0
const BUSY_GAP = 5 * 60_000
const BREAK_AFTER = 50 * 60_000
const STRETCH_EVERY = 10 * 60_000
/** This session's id, under which it tells the others what it is up to. */
let sessionId = ''
/** Where the terminal house is drawn, for the timer that paints its next frame; unset once it is gone. */
let rasterSite: { requestId: string; columns: number; props: SceneProps } | undefined
let rasterFrame = 0
let blits: { cancel: () => void } | undefined
let sharedAs = ''
let sharedAt = 0
/** When each tool call still running began, for its row's clock. */
const toolStarted = new Map<string, number>()

/** What a running tool's row says it is doing: in English, like the desktop's own rows. */
const TOOL_WORDS: Readonly<Record<string, string>> = {
  Bash: 'Running a command',
  Read: 'Reading a file',
  Edit: 'Editing a file',
  MultiEdit: 'Editing a file',
  Write: 'Writing a file',
  NotebookEdit: 'Editing a notebook',
  Grep: 'Searching',
  Glob: 'Finding files',
  WebFetch: 'Fetching a page',
  WebSearch: 'Searching the web',
  Agent: 'Running a subagent',
  Task: 'Running a subagent',
}

// ── Clawd and his crew ──────────────────────────────────────────────────

async function act($: Engine, pose: Pose, label: string): Promise<number> {
  const since = await $.clock.now()
  await update($, activity, () => ({ pose, label, since }))
  const place = PLACE[pose]
  await update($, actorsAtom, actors =>
    actors.map(a => (a.cap === null ? moveActor(a, place.spot === null ? null : SPOT_X[place.spot], place.doing, label, since) : a)),
  )
  return since
}

/** A pose for `ms`, then back to `after` unless something else took over meanwhile. */
async function flash($: Engine, pose: Pose, label: string, ms: number, after: () => Promise<Activity>): Promise<void> {
  const since = await act($, pose, label)
  $.clock.after(ms, () => {
    void (async () => {
      if ((await read($, activity)).since !== since) return
      const next = await after()
      await act($, next.pose, next.label)
    })()
  })
}

async function settle($: Engine): Promise<Activity> {
  const w = say(lang)
  return isWorking ? { pose: 'think', label: w.thinking, since: 0 } : { pose: 'wait', label: w.yourTurn, since: 0 }
}

/** Puts every free crew member at his place in the game of the moment. */
async function arrangeCrew($: Engine): Promise<void> {
  const now = await $.clock.now()
  const game = chooseGame(now, await read($, offsetAtom))
  await update($, gameAtom, () => game)
  await update($, actorsAtom, actors => {
    const free = actors.filter(a => a.cap !== null && a.agentKey === undefined && a.neighbor === undefined).sort((p, q) => p.id.localeCompare(q.id))
    const { slots } = layoutFor(game, free.length)
    return actors.map(a => {
      const slot = slots[free.indexOf(a)]
      if (slot === undefined || (a.toX === slot.x && a.doing === slot.doing)) return a
      return moveActor(a, slot.x, slot.doing, '', now)
    })
  })
}

/** A subagent borrows the first free player from the game room. */
async function assignCrew($: Engine, agentKey: string, label: string): Promise<void> {
  const now = await $.clock.now()
  await update($, actorsAtom, actors => {
    const free = actors.filter(a => a.cap !== null && a.agentKey === undefined && a.neighbor === undefined).sort((p, q) => p.id.localeCompare(q.id))[0]
    if (free === undefined) return actors
    return actors.map(a => (a.id === free.id ? { ...moveActor(a, crewX(a.id, 'code'), 'think', label, now), agentKey } : a))
  })
  await arrangeCrew($)
}

/** A subagent's tool call walks its crew member to that room. */
async function routeCrew($: Engine, agentId: string, pose: Pose, label: string): Promise<void> {
  const now = await $.clock.now()
  await update($, actorsAtom, actors => {
    const mine = actors.find(a => a.agentId === agentId) ?? actors.find(a => a.agentKey !== undefined && a.agentId === undefined)
    if (mine === undefined) return actors
    const place = PLACE[pose]
    const spot = place.spot ?? 'code'
    const doing = place.doing === 'wait' ? 'think' : place.doing
    return actors.map(a => (a.id === mine.id ? { ...moveActor(a, crewX(a.id, spot), doing, clip(label, 14), now), agentId } : a))
  })
}

/** The subagent is done: its player goes back to the game. */
async function releaseCrew($: Engine, agentKey: string): Promise<void> {
  await update($, actorsAtom, actors =>
    actors.map(a => {
      if (a.agentKey !== agentKey) return a
      const { agentKey: _key, agentId: _id, ...rest } = { ...a, label: '' }
      return rest
    }),
  )
  await arrangeCrew($)
}

/** A pat on the head: hearts, and back to what he was doing. */
// ── The day, for /clawd recap ───────────────────────────────────────────

const ROOM_OF_SPOT: Partial<Record<Spot, RoomId>> = { library: 'library', board: 'codelab', code: 'codelab', bash: 'terminal', web: 'web', arcade: 'game' }

const COUNTERS = ['turns', 'workMs', 'tools', 'edits', 'runs', 'testsPassed', 'testsFailed', 'commits', 'pushes', 'prsOpened', 'prsMerged', 'compactions', 'helpers', 'pets'] as const

/**
 * Today's record from the store (another session's work counts too),
 * changed and kept; what it adds goes to the lifetime totals too, with
 * anything only those keep (`lifeChange`), and the trophies are checked.
 */
async function logDay($: Engine, change: (day: Day) => void, lifeChange?: (life: Life) => void): Promise<void> {
  const date = dateOf(await $.clock.now(), await read($, offsetAtom))
  const kept = (await $.store.get(`day:${date}`)) as Day | undefined
  const day: Day = kept === undefined ? emptyDay(date) : { ...emptyDay(date), ...kept, rooms: { ...emptyDay(date).rooms, ...kept.rooms } }
  const before = { ...day }
  change(day)
  await $.store.set(`day:${date}`, day)
  await update($, todayAtom, () => day)
  // This session keeps the same figures, for its summary.
  await update($, sessionAtom, s => {
    const totals: Day = { ...s.totals, rooms: { ...s.totals.rooms } }
    change(totals)
    return { ...s, totals }
  })
  await changeLife($, life => {
    for (const key of COUNTERS) life[key] += day[key] - before[key]
    if (before.turns + before.tools === 0 && day.turns + day.tools > 0 && life.lastDay !== date) {
      life.days++
      life.streak = life.lastDay === dayBefore(date) ? life.streak + 1 : 1
      life.bestStreak = Math.max(life.bestStreak, life.streak)
      life.lastDay = date
    }
    life.bestDayMs = Math.max(life.bestDayMs, day.workMs)
    life.bestDayTools = Math.max(life.bestDayTools, day.tools)
    life.longestTurnMs = Math.max(life.longestTurnMs, day.longestMs)
    lifeChange?.(life)
  })
}

// ── Trophies ────────────────────────────────────────────────────────────

/** The lifetime totals; the first time, rebuilt from the days kept so far. */
async function loadLife($: Engine): Promise<Life> {
  const kept = (await $.store.get('life')) as Life | undefined
  if (kept !== undefined) return { ...emptyLife(), ...kept }
  const days: Day[] = []
  for (const key of await $.store.keys()) {
    if (!key.startsWith('day:')) continue
    const day = (await $.store.get(key)) as Day | undefined
    if (day !== undefined) days.push({ ...emptyDay(key.slice(4)), ...day })
  }
  const life = lifeFromDays(days)
  life.pets = Number((await $.store.get('pets')) ?? 0)
  life.scenes = [await read($, themeAtom)]
  await $.store.set('life', life)
  return life
}

/** Changes the lifetime totals from what the store holds now, then sees what that reached. */
async function changeLife($: Engine, change: (life: Life) => void): Promise<void> {
  const life = await loadLife($)
  change(life)
  await $.store.set('life', life)
  await checkTrophies($, life)
}

/** Keeps every trophy `life` newly reached, says so, and has Clawd cheer. */
async function checkTrophies($: Engine, life: Life): Promise<void> {
  const kept = ((await $.store.get('trophies')) as Trophies | undefined) ?? (await read($, trophiesAtom))
  const fresh = reached(life).filter(id => kept.unlocked[id] === undefined)
  if (fresh.length === 0) {
    await update($, trophiesAtom, () => kept)
    return
  }
  const now = await $.clock.now()
  const next: Trophies = { ...kept, unlocked: { ...kept.unlocked } }
  for (const id of fresh) next.unlocked[id] = now
  await $.store.set('trophies', next)
  await update($, trophiesAtom, () => next)
  const w = say(lang)
  if (fresh.length > 1) {
    $.ui.toast(w.unlockedMany(fresh.length), { timeoutMs: 8000 })
    return
  }
  const [family, tier] = (fresh[0] ?? '').split(':') as [FamilyId, Tier]
  const kind = FAMILIES.find(f => f.id === family)
  const spec = kind?.tiers.find(t => t.tier === tier)
  const reward = spec?.reward === undefined ? null : 'hat' in spec.reward ? w.hats[spec.reward.hat] : 'pal' in spec.reward ? w.pals[spec.reward.pal] : w.goldens[spec.reward.golden]
  const name = `${w.families[family]}・${w.tiers[tier]}`
  const what = kind === undefined || spec === undefined ? '' : w.familyWhat[family](w.amountLong(kind.unit, spec.target))
  $.ui.toast(w.unlockedWhat(name, what, reward), { timeoutMs: 10_000 })
  await flash($, 'cheer', `🏆 ${name}`, 3500, () => settle($))
}

/** A hat or a pal by its name in either language, or `auto` / `none`. */
function pickOf<T extends string>(text: string, names: readonly Record<T, string>[]): T | 'auto' | 'none' | undefined {
  const wanted = text.trim().toLowerCase()
  if (wanted === 'auto' || wanted === '') return 'auto'
  if (wanted === 'none' || wanted === 'off') return 'none'
  for (const table of names) {
    for (const [id, name] of Object.entries(table) as [T, string][]) if (id.toLowerCase() === wanted || name.toLowerCase() === wanted) return id
  }
  return undefined
}

async function setTrophyPick($: Engine, change: (t: Trophies) => Trophies): Promise<Trophies> {
  const kept = ((await $.store.get('trophies')) as Trophies | undefined) ?? (await read($, trophiesAtom))
  const next = change(kept)
  await $.store.set('trophies', next)
  await update($, trophiesAtom, () => next)
  return next
}

/** Today's figures as the store has them, for the idle line, without writing anything. */
async function loadToday($: Engine): Promise<void> {
  const date = dateOf(await $.clock.now(), await read($, offsetAtom))
  const kept = (await $.store.get(`day:${date}`)) as Day | undefined
  await update($, todayAtom, () => (kept === undefined ? null : { ...emptyDay(date), ...kept, rooms: { ...emptyDay(date).rooms, ...kept.rooms } }))
}

/** Today and the six days before it, oldest first, and the streak of days with work. */
async function readWeek($: Engine): Promise<{ today: Day; week: (Day | undefined)[]; streak: number }> {
  const date = dateOf(await $.clock.now(), await read($, offsetAtom))
  const days: (Day | undefined)[] = []
  let at = date
  for (let i = 0; i < 60; i++) {
    const day = (await $.store.get(`day:${at}`)) as Day | undefined
    days.push(day === undefined ? undefined : { ...emptyDay(at), ...day, rooms: { ...emptyDay(at).rooms, ...day.rooms } })
    if (i >= 7 && (day === undefined || day.turns + day.tools === 0)) break
    at = dayBefore(at)
  }
  return { today: days[0] ?? emptyDay(date), week: days.slice(0, 7).reverse(), streak: streakOf(days) }
}

function onPet($: Engine, id: string): void {
  void (async () => {
    const pets = await update($, petsAtom, n => n + 1)
    await $.store.set('pets', pets)
    await logDay($, day => {
      day.pets++
    })
    if (id !== 'main') {
      await update($, actorsAtom, actors => actors.map(a => (a.id === id && a.agentKey === undefined ? { ...a, doing: 'love' } : a)))
      if (id.startsWith('n:')) return
      $.clock.after(2000, () => void arrangeCrew($))
      return
    }
    const lines = say(lang).petLines(pets)
    const current = await read($, activity)
    await flash($, 'love', lines[pets % lines.length] ?? '♥', 2000, async () => current)
  })()
}

// ── The status line figures ─────────────────────────────────────────────

async function refreshUsage($: Engine, isForced = false): Promise<void> {
  const now = await $.clock.now()
  if (!isForced && now - lastUsageAt < 5000) return
  lastUsageAt = now
  try {
    const usage = await $.session.usage()
    const model = await $.session.model()
    const window = (kind: string): number | null => usage.rateLimits.find(r => r.kind === kind)?.percentUsed ?? null
    const resets = (kind: string): number | null => {
      const at = Date.parse(usage.rateLimits.find(r => r.kind === kind)?.resetsAt ?? '')
      return Number.isNaN(at) ? null : at
    }
    const next = await update($, usageAtom, (u): Usage => ({
      ...u,
      model: modelName(model),
      contextPercent: usage.context.percent ?? null,
      fiveHour: window('five_hour'),
      sevenDay: window('seven_day'),
      fiveHourResetsAt: resets('five_hour'),
      sevenDayResetsAt: resets('seven_day'),
      usd: usage.cost?.usd ?? null,
    }))
    await guardUsage($, next)
  } catch {
    // The figures wait for the next tick.
  }
}

// ── The plan's limits ────────────────────────────────────────────────────

/** Where a window's use earns a word from Clawd: most of it gone, nearly all, all. */
const LIMIT_STEPS = [100, 95, 80] as const

/**
 * Past 80%, 95% and 100% of the 5-hour or the 7-day window, Clawd says so
 * once (in a toast, and on his bubble): how much is gone, when it starts
 * over and, nearly out with work uncommitted, to commit first. Once a window
 * across every session: each step's word is kept in the store by window.
 */
async function guardUsage($: Engine, usage: Usage): Promise<void> {
  const windows = [
    ['five_hour', usage.fiveHour, usage.fiveHourResetsAt],
    ['seven_day', usage.sevenDay, usage.sevenDayResetsAt],
  ] as const
  for (const [window, percent, resetsAt] of windows) {
    if (percent === null) continue
    const step = LIMIT_STEPS.find(s => percent >= s)
    if (step === undefined) continue
    const key = `${window}:${resetsAt ?? 'unknown'}:${step}`
    const warned = ((await $.store.get('usageWarned')) as string[] | undefined) ?? []
    if (warned.includes(key)) continue
    await $.store.set('usageWarned', [...warned, key].slice(-20))
    const now = await $.clock.now()
    const offset = await read($, offsetAtom)
    const git = await read($, gitAtom)
    const w = say(lang)
    const left = resetsAt === null ? '?' : w.span(Math.max(1, Math.round((resetsAt - now) / 60_000)))
    const at = resetsAt === null ? '?' : formatClock(resetsAt, offset, now)
    $.ui.toast(w.usageWarn(window, step, left, at, git !== null && isDirty(git)), { timeoutMs: 10_000 })
    await flash($, step >= 95 ? 'panic' : 'oops', w.usageBubble(window, step), 6000, () => settle($))
  }
}

/** A moment by the person's clock: '15:40', with the date when it is not today. */
function formatClock(at: number, offset: number, now: number): string {
  const local = new Date(at + offset * 60_000)
  const clock = local.toISOString().slice(11, 16)
  const isToday = local.toISOString().slice(0, 10) === new Date(now + offset * 60_000).toISOString().slice(0, 10)
  return isToday ? clock : `${local.getUTCMonth() + 1}/${local.getUTCDate()} ${clock}`
}

/** How long until a window starts over, for the band: shown once most of it is gone. */
function resetNote(percent: number | null, resetsAt: number | null, now: number, talk: Lang): string {
  if (percent === null || percent < 70 || resetsAt === null || resetsAt <= now) return ''
  const w = say(talk)
  return ` · ${w.resetsIn(w.span(Math.round((resetsAt - now) / 60_000)))}`
}

async function count($: Engine, field: 'tools' | 'edits' | 'runs'): Promise<void> {
  await update($, usageAtom, (u): Usage => ({ ...u, [field]: u[field] + 1 }))
}

// ── Persistence: $.store outlives the session, $.state draws ─────────────

async function load($: Engine): Promise<void> {
  const stored = async <T,>(key: string, fallback: T): Promise<T> => ((await $.store.get(key)) as T | undefined) ?? fallback
  const deadlines = await stored<Deadline[]>('deadlines', [])
  const isCollapsed = await stored<boolean>('isCollapsed', false)
  const pets = await stored<number>('pets', 0)
  const theme = await stored<string>('theme', 'house')
  const seasonPick = await stored<Season | 'auto'>('seasonPick', 'auto')
  const holidayPick = await stored<Holiday | 'auto'>('holidayPick', 'auto')
  await update($, seasonPickAtom, () => seasonPick)
  await update($, holidayPickAtom, () => holidayPick)
  await update($, themeAtom, (): Theme => (THEME_ORDER as readonly string[]).includes(theme) ? (theme as Theme) : 'house')
  await update($, deadlinesAtom, () => deadlines)
  await update($, collapsedAtom, () => isCollapsed)
  await update($, petsAtom, () => pets)
  const dark = ((await $.store.get('darkRooms')) as RoomId[] | undefined) ?? []
  await update($, darkRoomsAtom, () => dark.filter(id => (ROOM_IDS as readonly string[]).includes(id)))
  const names = ((await $.store.get('names')) as Record<string, string> | undefined) ?? {}
  const birthday = String((await $.store.get('birthday')) ?? '')
  await update($, namesAtom, () => ({ ...names }))
  await update($, birthdayAtom, () => birthday)
  await paintCaps($)
}

// ── Making the Clawds the person's own ─────────────────────────────────

/** The beanie colours a crew member can wear. */
const CAP_COLORS = ['blue', 'green', 'purple', 'red', 'yellow', 'teal', 'pink'] as const
const CREW_IDS = ['c1', 'c2', 'c3'] as const

/** What a finished call's row opens to: its command or file, then the first lines of what came back. */
function rowDetail(tool: string, input: Record<string, unknown>, output: unknown, words: ReturnType<typeof say>): string[] {
  const lines: string[] = []
  const command = str(input.command)
  if (command !== '') lines.push(`$ ${command.split('\n')[0] ?? ''}`)
  const path = str(input.file_path) || str(input.notebook_path) || str(input.path) || str(input.url) || str(input.pattern) || str(input.query)
  if (command === '' && path !== '') lines.push(path)
  const record = (typeof output === 'object' && output !== null ? output : {}) as Record<string, unknown>
  const change = fileChangeOf(tool, input, output)
  if (change !== undefined) lines.push(`+${change.added} −${change.removed}`)
  const text = typeof output === 'string' ? output : [str(record.stdout), str(record.stderr)].filter(t => t !== '').join('\n')
  if (text !== '') lines.push(...text.split('\n').slice(0, 12).map(line => clip(line, 160)))
  else if (change === undefined) lines.push(words.rowNoOutput)
  return lines
}

/** Opens or closes a finished tool row. */
async function toggleRow($: Engine, id: string): Promise<void> {
  await update($, openRowsAtom, rows => (rows.includes(id) ? rows.filter(r => r !== id) : [...rows, id].slice(-50)))
}

/** Puts the caps the person chose on the crew. */
async function paintCaps($: Engine): Promise<void> {
  const caps = ((await $.store.get('caps')) as Record<string, string> | undefined) ?? {}
  await update($, actorsAtom, actors => actors.map(a => (caps[a.id] !== undefined && a.neighbor === undefined && a.cap !== null ? { ...a, cap: caps[a.id]! } : a)))
}

/** Which Clawd a word names: '' or 'main' the main one, 1–3 or a cap colour a crew member. */
async function whoOf($: Engine, word: string): Promise<string | undefined> {
  const w = word.toLowerCase()
  if (w === '' || w === 'main' || w === '主') return 'main'
  if (/^[123]$/.test(w)) return `c${w}`
  const actors = await read($, actorsAtom)
  return actors.find(a => a.cap === w && a.neighbor === undefined && CREW_IDS.includes(a.id as 'c1'))?.id
}

/** The scene each project last chose, else the one chosen last anywhere. */
async function sceneFor($: Engine, project: string): Promise<Theme> {
  const scenes = ((await $.store.get('scenes')) as Record<string, string> | undefined) ?? {}
  const fallback = String((await $.store.get('theme')) ?? 'house')
  const theme = scenes[project] ?? fallback
  return (THEME_ORDER as readonly string[]).includes(theme) ? (theme as Theme) : 'house'
}

async function changeDeadlines($: Engine, change: (deadlines: Deadline[]) => Deadline[]): Promise<Deadline[]> {
  const current = ((await $.store.get('deadlines')) as Deadline[] | undefined) ?? (await read($, deadlinesAtom))
  const next = change(current.map(deadline => ({ ...deadline }))).sort((a, b) => a.due - b.due)
  await $.store.set('deadlines', next)
  await update($, deadlinesAtom, () => next)
  return next
}

async function setCollapsed($: Engine, isCollapsed: boolean): Promise<void> {
  await $.store.set('isCollapsed', isCollapsed)
  await update($, collapsedAtom, () => isCollapsed)
}

// ── Where on Earth: the time zone, for which way the seasons run ─────────

/** The system's IANA time zone: TZ, the /etc/localtime link, or Debian's /etc/timezone. */
async function systemZone($: Engine): Promise<string | undefined> {
  const tz = await $.env.get('TZ')
  if (tz !== undefined && zoneOf(tz) !== undefined) return zoneOf(tz)
  try {
    const link = await $.process.run(['readlink', '/etc/localtime'], { timeoutMs: 3000 })
    if (link.exitCode === 0 && zoneOf(link.stdout) !== undefined) return zoneOf(link.stdout)
  } catch {
    // No readlink here: try the file Debian keeps.
  }
  try {
    return zoneOf(await $.fs.read('/etc/timezone'))
  } catch {
    return undefined
  }
}

/** Moves the Clawds to another scene; `next` takes the one after the current. */
// ── What the pointer finds over the Desktop house ─────────────────────────

/**
 * Drawn by the band itself, so nothing in the picture reloads: over each
 * room an unseen strip that, under the pointer, lights the room up and shows
 * a card (what the room is for, what it holds now, its light switch), and
 * over each Clawd standing still a strip with hearts and his card (what he
 * is doing, and a pat). The band lays out in columns of eight pixels; the
 * picture spans them all, so a scene pixel is `width / SW` columns.
 */
function houseZones($: Engine, ui: Elements['vscode'], s: SceneProps, o: { width: number; height: number; now: number; git: GitState | null }): RenderElement[] {
  const { Box, Text, Button, Svg } = ui
  const w = say(s.lang)
  const art = THEMES[s.theme]
  const cells = (x: number): number => Math.max(0, Math.min(o.width, Math.round((x * o.width) / SW)))
  const pixels = (cell: number): number => (cell * SW) / o.width
  const card = (lines: RenderElement[], buttons: RenderElement[], left: number, zoneWidth: number): RenderElement => {
    const cardWidth = Math.min(o.width, Math.max(zoneWidth, 40))
    // A card stays inside the band: anchored left, unless that would run off the right edge.
    const side = left + cardWidth > o.width ? { right: 0 } : { left: 0 }
    return (
      <Box position="absolute" top={0} {...side} width={cardWidth} display="none" hover={{ display: 'flex' }} flexDirection="column" backgroundColor="#1F1E1D" borderStyle="round" borderColor={ORANGE} paddingX={1}>
        {lines}
        {buttons.length === 0 ? null : (
          <Box flexDirection="row" gap={1}>
            {buttons}
          </Box>
        )}
      </Box>
    )
  }
  const glow = (source: string, zoneWidth: number): RenderElement => (
    <Box position="absolute" top={0} left={0} display="none" hover={{ display: 'flex' }}>
      <Svg source={source} alt="" width={zoneWidth * CELL_PX} height={o.height} />
    </Box>
  )
  const zones: RenderElement[] = []
  for (const span of roomSpans()) {
    const left = cells(span.x0)
    const zoneWidth = cells(span.x1) - left
    if (zoneWidth <= 0) continue
    const name = w.rooms[s.theme][span.id]
    const info: Record<RoomId, string> = {
      library: w.memoryTip(s.theme, s.memory),
      codelab: s.notes.length === 0 ? w.calendarEmpty : w.boardTitle(s.notes.slice(0, 4).map(n => n.text)),
      terminal: o.git === null ? '' : w.gitLine(o.git.branch, o.git.ahead, o.git.behind, o.git.changed + o.git.untracked),
      web: s.theme === 'space' ? w.outsideSpace : w.outside[s.time],
      game: s.medals.length === 0 ? w.toys[s.theme] : `${w.toys[s.theme]}\n${w.medalsTip(s.trophyCount[0], s.trophyCount[1])}`,
    }
    const isDark = s.dark.includes(span.id)
    const hasSwitch = art.glows.some(g => g.room === span.id && isSwitched(g))
    const lines = [
      <Text color={ORANGE} bold>
        {name}
      </Text>,
      <Text dimColor wrap="wrap">
        {w.roomPurpose[span.id]}
      </Text>,
      ...(info[span.id] === '' ? [] : [<Text wrap="wrap">{info[span.id]}</Text>]),
    ]
    const buttons = hasSwitch ? [<Button key={`light-${span.id}`} label={isDark ? w.lightOn : w.lightOff} onPress={() => toggleLight($, span.id)} />] : []
    zones.push(
      <Box key={`room-${span.id}`} position="absolute" top={0} bottom={0} left={left} width={zoneWidth}>
        {glow(roomHoverSvg(s, pixels(left), pixels(zoneWidth)), zoneWidth)}
        {card(lines, buttons, left, zoneWidth)}
      </Box>,
    )
  }
  // A Clawd on his way somewhere has his strip where he is going.
  for (const a of s.actors) {
    const left = cells(a.toX - 4)
    const zoneWidth = cells(a.toX + 20) - left
    if (zoneWidth <= 0) continue
    const lines = [<Text wrap="wrap">{actorTip(a, s)}</Text>]
    const buttons = a.neighbor === undefined ? [<Button key={`pet-${a.id}`} label={w.pet} onPress={() => onPet($, a.id)} />] : []
    zones.push(
      <Box key={`clawd-${a.id}`} position="absolute" top={0} bottom={0} left={left} width={zoneWidth}>
        {glow(actorHoverSvg(a.toX, pixels(left), pixels(zoneWidth)), zoneWidth)}
        {card(lines, buttons, left, zoneWidth)}
      </Box>,
    )
  }
  return zones
}

/** The terminal house's next frame, painted in place; nothing to do while no terminal shows it. */
async function blitHouse($: Engine): Promise<void> {
  const site = rasterSite
  if (site === undefined) return
  rasterFrame++
  try {
    const result = await $.ui.blit({ requestId: site.requestId, key: 'house', cells: houseCells(site.props, rasterFrame, await $.clock.now(), site.columns) })
    if (result.deny !== undefined && rasterSite === site) stopHouse()
  } catch {
    if (rasterSite === site) stopHouse()
  }
}

/** Nothing shows the terminal house: no more frames until it is drawn again. */
function stopHouse(): void {
  rasterSite = undefined
  blits?.cancel()
  blits = undefined
}

// ── Lights ───────────────────────────────────────────────────────────────

/** Switches rooms' lights on or off, in every scene, and keeps it. */
async function setLights($: Engine, rooms: readonly RoomId[], isOn: boolean): Promise<void> {
  const dark = await update($, darkRoomsAtom, list => (isOn ? list.filter(id => !rooms.includes(id)) : [...new Set([...list, ...rooms])]))
  await $.store.set('darkRooms', dark)
}

async function toggleLight($: Engine, room: RoomId): Promise<void> {
  await setLights($, [room], (await read($, darkRoomsAtom)).includes(room))
}

// ── The session's summary ────────────────────────────────────────────────

/** This session so far: its figures, the files it changed and the commands that failed, and its cost. */
async function summaryOf($: Engine): Promise<SessionSummary> {
  const [session, changes, usage, offset] = await Promise.all([read($, sessionAtom), read($, changesAtom), read($, usageAtom), read($, offsetAtom)])
  const root = await $.session.root()
  const sum = totals(changes)
  return {
    totals: session.totals,
    startedAt: session.startedAt,
    offset,
    files: changes.files.map(f => ({ path: relativePath(f.path, root), added: f.added, removed: f.removed })),
    added: sum.added,
    removed: sum.removed,
    failed: sum.failed,
    usd: usage.usd,
  }
}

async function setTheme($: Engine, choice: Theme | 'next'): Promise<Theme> {
  const current = await read($, themeAtom)
  const theme = choice === 'next' ? (THEME_ORDER[(THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length] ?? 'house') : choice
  await $.store.set('theme', theme)
  const project = await read($, projectAtom)
  if (project !== '') {
    const scenes = ((await $.store.get('scenes')) as Record<string, string> | undefined) ?? {}
    await $.store.set('scenes', { ...scenes, [project]: theme })
  }
  await update($, themeAtom, () => theme)
  await changeLife($, life => {
    if (!life.scenes.includes(theme)) life.scenes.push(theme)
  })
  return theme
}

// ── The clock: deadlines, dozing off, the game rotation ─────────────────

async function checkClock($: Engine): Promise<void> {
  const now = await $.clock.now()
  await update($, nowAtom, () => now)
  await arrangeCrew($)
  await lookUp($, now)
  await greetBirthday($, now)
  await readGit($)
  await nudgeCommit($, now)
  if (isWorking && busySince > 0 && now - busySince >= BREAK_AFTER && now - lastStretchAt >= STRETCH_EVERY) {
    if (lastStretchAt < busySince) $.ui.toast(say(lang).breakToast(Math.floor((now - busySince) / 60_000)), { timeoutMs: 10_000 })
    lastStretchAt = now
    await flash($, 'stretch', say(lang).takeBreak, 8000, () => settle($))
  }
  const deadlines = await read($, deadlinesAtom)
  const due = deadlines.find(d => !d.hasAlarmed && urgency(d.due, now) === 'urgent')
  if (due !== undefined) {
    await changeDeadlines($, list => list.map(d => (d.id === due.id ? { ...d, hasAlarmed: true } : d)))
    $.ui.toast(say(lang).alarm(due.title, countdown(due.due, now, lang)), { timeoutMs: 8000 })
    await flash($, 'panic', say(lang).alarm(clip(due.title, 12), countdown(due.due, now, lang)), 5000, () => settle($))
    return
  }
  if (isWorking) return
  const current = await read($, activity)
  if (current.pose === 'wait' && now - current.since > 90_000) await act($, 'idle', '')
  else if (current.pose === 'idle' && now - current.since > 240_000) await act($, 'sleep', say(lang).sleepy)
}

/**
 * A command's answer as a toast rather than a transcript line: a line would
 * stay in the conversation for the model to read on every later turn.
 */
function answer($: Engine, text: string): { text?: string } {
  $.ui.toast(text, { timeoutMs: 6000 })
  return {}
}

// ── The git safety net ───────────────────────────────────────────────────

/** Reads the project's git state, at most every five seconds unless forced; null outside a repository. */
async function readGit($: Engine, isForced = false): Promise<GitState | null> {
  const now = await $.clock.now()
  if (!isForced && now - lastGitAt < 5_000) return read($, gitAtom)
  lastGitAt = now
  let git: GitState | null = null
  try {
    const cwd = await $.session.root()
    const status = await $.process.run(['git', 'status', '--porcelain=v1', '-b', '--untracked-files=normal'], { cwd, timeoutMs: 3000 })
    const parsed = status.exitCode === 0 ? parseStatus(status.stdout) : undefined
    if (parsed !== undefined) {
      const last = await $.process.run(['git', 'log', '-1', '--format=%ct'], { cwd, timeoutMs: 3000 })
      git = { ...parsed, lastCommitAt: last.exitCode === 0 ? Number(last.stdout.trim()) * 1000 || 0 : 0 }
    }
  } catch {
    git = null
  }
  if (git === null || !isDirty(git)) dirtySince = 0
  else if (dirtySince === 0) dirtySince = now
  if (JSON.stringify(git) !== JSON.stringify(await read($, gitAtom))) await update($, gitAtom, () => git)
  return git
}

/** Between turns: an hour's edits not committed brings Clawd's stamp and a word, at most once an hour. */
async function nudgeCommit($: Engine, now: number): Promise<void> {
  const git = await read($, gitAtom)
  const changes = await read($, changesAtom)
  if (isWorking || git === null || changes.files.length === 0 || !needsCommit(git, dirtySince, now) || now - lastNudgeAt < 60 * 60_000) return
  lastNudgeAt = now
  const minutes = Math.floor((now - Math.max(dirtySince, git.lastCommitAt)) / 60_000)
  $.ui.toast(say(lang).commitNudge(git.changed + git.untracked, minutes, git.ahead), { timeoutMs: 10_000 })
  await flash($, 'stamp', say(lang).commitLabel, 5000, () => settle($))
}

// ── Rare sights and birthdays ────────────────────────────────────────────

/** Shows the rare sight of the moment, if there is one, says so once, and counts it seen. */
async function lookUp($: Engine, now: number): Promise<void> {
  const [offset, theme, current] = await Promise.all([read($, offsetAtom), read($, themeAtom), read($, eggAtom)])
  const egg: Egg | null = eggOf(now, timeOfDay(now, offset), theme)
  if (egg === current) return
  await update($, eggAtom, () => egg)
  if (egg === null) return
  const w = say(lang)
  $.ui.toast(egg === 'star' ? w.eggStar : w.eggCritter[theme], { timeoutMs: 8000 })
  const seen = egg === 'star' ? 'star' : `critter:${theme}`
  await changeLife($, life => {
    if (!life.eggs.includes(seen)) life.eggs.push(seen)
  })
}

const monthDay = (now: number, offset: number): string => dateOf(now, offset).slice(5)

/** On the person's birthday, once a day: party hats on, and a word to say so. */
async function greetBirthday($: Engine, now: number): Promise<void> {
  const [birthday, offset, names] = await Promise.all([read($, birthdayAtom), read($, offsetAtom), read($, namesAtom)])
  if (birthday === '' || monthDay(now, offset) !== birthday) return
  const today = dateOf(now, offset)
  if ((await $.store.get('birthdayGreeted')) === today) return
  await $.store.set('birthdayGreeted', today)
  $.ui.toast(say(lang).birthdayToast(names.main ?? 'Clawd'), { timeoutMs: 10_000 })
}

// ── Neighbors: the other sessions on this machine ────────────────────────

type Presence = Neighbor & { at: number }

/** How long a session's word holds before it counts as gone, and before its record is cleared. */
const HEARD_MS = 45_000
const GONE_MS = 10 * 60_000
const VISITOR_CAPS = ['red', 'yellow', 'teal', 'pink'] as const
const WORK_SPOTS: readonly Spot[] = ['library', 'board', 'code', 'bash', 'web']

/** Tells the other sessions what this one is up to: when it changes, and every 15 seconds. */
async function sharePresence($: Engine): Promise<void> {
  if (sessionId === '') return
  const [doing, project] = await Promise.all([read($, activity), read($, projectAtom)])
  const now = await $.clock.now()
  const me: Presence = { id: sessionId, project, pose: doing.pose, label: doing.label, isWorking, at: now }
  const said = JSON.stringify({ ...me, at: 0 })
  if (said === sharedAs && now - sharedAt < 15_000) return
  sharedAs = said
  sharedAt = now
  await $.store.set(`presence:${sessionId}`, me)
}

/** Hears from the other sessions, clears the long-gone, and has the busy ones visit. */
async function lookAround($: Engine): Promise<void> {
  if (sessionId === '') return
  const now = await $.clock.now()
  const heard: Neighbor[] = []
  for (const key of await $.store.keys()) {
    if (!key.startsWith('presence:') || key === `presence:${sessionId}`) continue
    const p = (await $.store.get(key)) as Presence | undefined
    if (p === undefined) continue
    if (now - p.at > GONE_MS) await $.store.delete(key)
    else if (now - p.at <= HEARD_MS) heard.push({ id: p.id, project: p.project, pose: p.pose, label: p.label, isWorking: p.isWorking })
  }
  heard.sort((a, b) => a.id.localeCompare(b.id))
  if (JSON.stringify(heard) !== JSON.stringify(await read($, neighborsAtom))) await update($, neighborsAtom, () => heard)
  await placeVisitors($, heard)
}

/** The free work spot nearest `x`, clear of everyone already standing at one. */
function freeSpot(x: number, taken: readonly number[]): number {
  const spots = WORK_SPOTS.map(spot => SPOT_X[spot]).sort((a, b) => Math.abs(a - x) - Math.abs(b - x))
  return spots.find(spot => taken.every(t => Math.abs(t - spot) >= 14)) ?? x
}

/** A visitor's cap: one of the visitors' colours the crew is not wearing. */
function capOf(id: string, worn: readonly (string | null)[]): string {
  const free = VISITOR_CAPS.filter(cap => !worn.includes(cap))
  const choices = free.length > 0 ? free : VISITOR_CAPS
  return choices[[...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % choices.length] ?? 'red'
}

/**
 * Up to two busy neighbors walk in from the right to the room of what they
 * are doing (another if it is taken), their project on their bubble; when
 * they stop, or their session ends, they walk back out.
 */
async function placeVisitors($: Engine, heard: readonly Neighbor[]): Promise<void> {
  const now = await $.clock.now()
  const busy = heard.filter(n => n.isWorking).slice(0, 2)
  const words = say(lang)
  const current = await read($, actorsAtom)
  const next = (() => {
    const locals = current.filter(a => a.neighbor === undefined)
    const taken = locals.filter(a => a.cap === null || a.agentKey !== undefined).map(a => a.toX)
    const visitors: SceneActor[] = []
    for (const n of busy) {
      const id = `n:${n.id}`
      const place = PLACE[n.pose]
      const x = freeSpot(SPOT_X[place.spot ?? 'code'], taken)
      taken.push(x)
      const label = clip(`${n.project}・${n.label || words.doings[place.doing]}`, 18)
      const was = current.find(a => a.id === id)
      visitors.push(was === undefined ? { id, cap: capOf(n.id, locals.map(a => a.cap)), fromX: SW + 2, toX: x, departAt: now, doing: place.doing, label, neighbor: n.project } : moveActor(was, x, place.doing, label, now))
    }
    for (const was of current.filter(a => a.neighbor !== undefined && !visitors.some(v => v.id === a.id))) {
      if (was.toX < SW) visitors.push(moveActor(was, SW + 2, 'idle', '', now))
      else if (actorX(was, now) < SW) visitors.push(was)
    }
    return [...locals, ...visitors]
  })()
  if (JSON.stringify(next) !== JSON.stringify(current)) await update($, actorsAtom, () => next)
}

/** Every five seconds: the neighbors, the turn clock while working, the rest every thirty. */
async function tickClock($: Engine): Promise<void> {
  ticks += 1
  await sharePresence($)
  await lookAround($)
  if (ticks % 6 === 0) await checkClock($)
  else if (isWorking) await update($, nowAtom, () => Date.now())
  if (isWorking || ticks % 6 === 0) await refreshUsage($)
}

/** The nearest deadline still ahead says how Clawd feels. */
function isNervous(deadlines: readonly Deadline[], now: number): boolean {
  return deadlines.some(d => ['near', 'urgent'].includes(urgency(d.due, now)))
}

// ── Language ────────────────────────────────────────────────────────────

/** What the system asks for: the locale variables, then macOS's preferred languages. */
async function systemLang($: Engine): Promise<Lang> {
  const vars = [await $.env.get('LC_ALL'), await $.env.get('LC_MESSAGES'), await $.env.get('LANG')]
  const set = vars.filter((v): v is string => v !== undefined && v !== '' && !/^(c|posix)(\.|$)/i.test(v))
  if (set.length > 0) return langOf(set)
  try {
    const { exitCode, stdout } = await $.process.run(['/usr/bin/defaults', 'read', '-g', 'AppleLanguages'], { timeoutMs: 3000 })
    if (exitCode === 0) return langOf(stdout.replace(/[()"\s]/g, ' ').split(/[ ,]+/))
  } catch {
    // Not a Mac: English.
  }
  return 'en'
}

/** The person's choice (/clawd lang), else the setting, else the system. */
async function chooseLang($: Engine): Promise<Lang> {
  let chosen = (await $.store.get('lang')) as string | undefined
  if (chosen === undefined && ((await $.store.get('todos')) !== undefined || (await $.store.get('pets')) !== undefined)) {
    // Clawd spoke only Chinese before 0.4: keep him so for those who met him then.
    chosen = 'zh'
    await $.store.set('lang', chosen)
  }
  const wanted = chosen ?? settings.language
  if (wanted === 'zh' || wanted === 'zh-TW') return 'zh'
  if (wanted === 'en') return 'en'
  return systemLang($)
}

async function setLang($: Engine, choice: 'zh' | 'en' | 'auto'): Promise<Lang> {
  await $.store.set('lang', choice)
  lang = await chooseLang($)
  await update($, langAtom, () => lang)
  const next = await settle($)
  await act($, next.pose, next.label)
  return lang
}

export const register: Register = (on, options) => {
  settings = {
    language: typeof options.language === 'string' ? options.language : 'auto',
  }

  // ── Drawing ─────────────────────────────────────────────────────────────

  on('ui.message', async ($, e, next) => {
    const data = (e.data ?? {}) as { type?: string; id?: string }
    if (data.type === 'pet') onPet($, data.id ?? 'main')
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const [doing, deadlines, isCollapsed, actors, usage, game, offset, talk, theme, zone, seasonPick, holidayPick, trophies, neighbors, egg, birthday, names, git, dark] = await Promise.all([
      read($, activity),
      read($, deadlinesAtom),
      read($, collapsedAtom),
      read($, actorsAtom),
      read($, usageAtom),
      read($, gameAtom),
      read($, offsetAtom),
      read($, langAtom),
      read($, themeAtom),
      read($, zoneAtom),
      read($, seasonPickAtom),
      read($, holidayPickAtom),
      read($, trophiesAtom),
      read($, neighborsAtom),
      read($, eggAtom),
      read($, birthdayAtom),
      read($, namesAtom),
      read($, gitAtom),
      read($, darkRoomsAtom),
      read($, nowAtom),
    ])
    const w = say(talk)
    const now = await $.clock.now()
    const ahead = deadlines.filter(d => d.due > now - 86_400_000)
    const nearest = ahead[0]
    const { Box, Text, Button } = $.ui.resolve(e)
    const width = e.props.bodyColumns

    const level = (percent: number | null): string | undefined =>
      percent === null ? undefined : percent >= 80 ? '#E5484D' : percent >= 50 ? '#F5C542' : '#4CB363'
    const bar = (percent: number): string => {
      const filled = Math.round(percent / 20)
      return '▰'.repeat(filled) + '▱'.repeat(5 - filled)
    }
    const stat = (label: string, value: string, color?: string): RenderElement => (
      <Text>
        <Text dimColor>{`${label} `}</Text>
        <Text color={color}>{value}</Text>
      </Text>
    )
    const elapsed = isWorking ? now - usage.turnStartedAt : lastTurnMs
    const clockText = `${Math.floor(elapsed / 60_000)}:${String(Math.floor((elapsed % 60_000) / 1000)).padStart(2, '0')}`
    // Before the first reply there is nothing to time.
    const hasReply = isWorking || lastTurnMs > 0
    const limit = (label: string, percent: number | null, resetsAt: number | null): RenderElement | null =>
      percent === null ? null : stat(label, `${Math.round(percent)}%${resetNote(percent, resetsAt, now, talk)}`, level(percent))
    const gitText = git === null ? null : (
      <Text color={gitColor(git, dirtySince, now)} dimColor={gitColor(git, dirtySince, now) === undefined}>
        {w.gitLine(git.branch, git.ahead, git.behind, git.changed + git.untracked)}
      </Text>
    )
    const deadlineText =
      nearest === undefined ? null : (
        <Text color={URGENCY_COLOR[urgency(nearest.due, now)]} wrap="truncate-end">
          {w.due(clip(nearest.title, 10), countdown(nearest.due, now, talk))}
        </Text>
      )

    // The terminal folds the band when the house cannot fit; the desktop scales it instead.
    const isCramped = e.surface === 'terminal' && (width < 70 || e.props.maxRows < SH / 2 + 3)
    const main = actors.find(a => a.cap === null)
    const langButton = <Button key="lang" label={w.otherLanguage} onPress={() => setLang($, talk === 'zh' ? 'en' : 'zh')} />
    if (isCollapsed || isCramped) {
      const now_ = doing.label && doing.label !== w.sleepy ? doing.label : w.doings[main?.doing ?? 'idle']
      let face: RenderElement
      if (e.surface === 'terminal') {
        face = <Text color={ORANGE}>▐▛███▜▌</Text>
      } else {
        const { Svg } = $.ui.resolve(e)
        face = <Svg source={miniClawdSvg(main?.doing ?? 'idle')} alt="Clawd" width={36} height={24} />
      }
      // Folded, the band keeps what matters at a glance: what he's doing, the context and the plan, this reply, git, the next deadline.
      return (
        <Box flexDirection="row" columnGap={2} alignItems="center" flexWrap="wrap">
          {face}
          <Text color={ORANGE} bold wrap="truncate-end">{`${names.main ?? 'Clawd'} · ${now_}`}</Text>
          {usage.contextPercent === null ? null : stat('ctx', `${Math.round(usage.contextPercent)}%`, level(usage.contextPercent))}
          {limit('5h', usage.fiveHour, usage.fiveHourResetsAt)}
          {hasReply ? stat(isWorking ? w.turn : w.lastTurn, clockText) : null}
          {gitText}
          {deadlineText}
          <Box flexGrow={1} />
          {isCollapsed ? <Button key="expand" label={w.expand} variant="primary" onPress={() => setCollapsed($, false)} /> : null}
          {e.surface === 'terminal' ? null : langButton}
        </Box>
      )
    }

    const holiday = holidayPick !== 'auto' ? holidayPick : holidayOf(now, offset)
    const scene: SceneProps = {
      actors,
      // The board pins every deadline ahead, nearest first; the hour is fine enough.
      notes: ahead.slice(0, 8).map(d => ({ text: `${d.title} · ${countdown(d.due, now, talk, true)}`, urgency: urgency(d.due, now) })),
      days: nearest === undefined ? null : Math.max(0, Math.floor((nearest.due - now) / 86_400_000)),
      urgency: nearest === undefined ? 'none' : urgency(nearest.due, now),
      game,
      time: timeOfDay(now, offset),
      // To the hour only: a minute's change would redraw the desktop house and start its loops over.
      deadline: nearest === undefined ? '' : `${nearest.title} · ${formatDue(nearest.due, offset)} · ${countdown(nearest.due, now, talk, true)}`,
      lang: talk,
      theme,
      memory: usage.contextPercent === null ? null : Math.min(10, Math.floor(usage.contextPercent / 10)),
      isTired: (usage.fiveHour ?? 0) >= 80,
      season: seasonPick !== 'auto' ? seasonPick : seasonOf(now, offset, zone),
      holiday,
      medals: medalsOf(trophies.unlocked),
      trophyCount: [Object.keys(trophies.unlocked).length, TROPHY_TOTAL],
      // A holiday's hat stands in for the trophy hat, unless one was picked by hand.
      hat: trophies.hat === 'auto' && (holiday === 'christmas' || holiday === 'halloween') ? null : hatFor(trophies),
      pal: palFor(trophies),
      golden: goldenOf(trophies.unlocked),
      egg,
      isBirthday: birthday !== '' && monthDay(now, offset) === birthday,
      names,
      dark,
    }
    let house: RenderElement
    if (e.surface === 'terminal') {
      const { Raster } = $.ui.resolve(e)
      const columns = Math.max(1, Math.min(width, SW))
      // The timer repaints it from here on, a frame a tick, until it is gone.
      rasterSite = { requestId: e.requestId, columns, props: scene }
      blits ??= $.clock.every(STEP, () => void blitHouse($))
      house = (
        <Box flexDirection="column">
          <Raster key="house" columns={columns} rows={HOUSE_ROWS} cells={houseCells(scene, rasterFrame, now, columns)} />
          <Text dimColor wrap="truncate">
            {signsLine(cameraOf(scene, columns, now), columns, talk, theme)}
          </Text>
        </Box>
      )
    } else {
      const { Svg } = $.ui.resolve(e)
      const frame = Math.round(width * CELL_PX)
      const height = Math.round((frame * SH) / SW)
      // An image, not a frame: a new drawing takes the old one's place without a blink.
      const art = <Svg key="art" source={sceneSvg(scene, now)} alt={w.houseAlt(doing.label || w.readingInLibrary)} width={frame} height={height} />
      house =
        e.surface === 'mobile' ? (
          art
        ) : (
          <Box key="house" position="relative" flexDirection="column">
            {art}
            {houseZones($, $.ui.resolve(e) as unknown as Elements['vscode'], scene, { width, height, now, git })}
          </Box>
        )
    }

    // Other sessions on this machine, one name a project however many there are.
    const projects = new Map<string, number>()
    for (const n of neighbors) projects.set(n.project, (projects.get(n.project) ?? 0) + 1)
    const neighborText = [...projects].map(([project, n]) => (n > 1 ? `${project} ×${n}` : project)).join(talk === 'zh' ? '、' : ', ')

    return (
      <Box flexDirection="column">
        {house}
        <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
          <Text color={ORANGE} bold wrap="truncate-end">
            {`「${doing.label || (isWorking ? w.thinking : w.hello)}」`}
          </Text>
          {gitText}
          {neighbors.length === 0 ? null : stat(w.neighborsLabel, neighborText)}
          {usage.model ? <Text dimColor>{usage.model}</Text> : null}
          {usage.contextPercent === null ? null : stat('ctx', `${bar(usage.contextPercent)} ${Math.round(usage.contextPercent)}%`, level(usage.contextPercent))}
          {limit('5h', usage.fiveHour, usage.fiveHourResetsAt)}
          {limit('7d', usage.sevenDay, usage.sevenDayResetsAt)}
          {usage.usd === null ? null : stat('$', usage.usd.toFixed(2))}
          {/* One group, so it reads as one thing: how long Claude has been on your latest message (or took on the last), and what it did there. */}
          {hasReply ? (
            <Text>
              <Text dimColor>{`${isWorking ? w.turn : w.lastTurn} `}</Text>
              {clockText}
              <Text dimColor>{` · ${w.tools} `}</Text>
              {String(usage.tools)}
              <Text dimColor>{` · ${w.edited} `}</Text>
              {w.files(usage.edits)}
              <Text dimColor>{` · ${w.ran} `}</Text>
              {w.commands(usage.runs)}
            </Text>
          ) : null}
        </Box>
        <Box flexDirection="row" flexWrap="wrap" columnGap={1}>
          {deadlineText ?? <Text dimColor>{w.noDeadline}</Text>}
          <Box flexGrow={1} />
          <Button key="panel" label={w.list} hotkey="l" onPress={() => $.ui.open({ id: PANE, title: w.paneTitle })} />
          {e.surface === 'terminal' ? null : <Button key="pet" label={w.pet} onPress={() => onPet($, 'main')} />}
          <Button key="scene" label={w.scene(w.themes[theme])} hotkey="s" onPress={() => setTheme($, 'next')} />
          {langButton}
          <Button key="hide" label={w.hide} plain dimColor onPress={() => setCollapsed($, true)} />
        </Box>
      </Box>
    )
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const [usage, talk, isCompacting] = await Promise.all([read($, usageAtom), read($, langAtom), read($, compactingAtom)])
    const mode = e.props.mode
    // Compacting, he stomps the conversation's pages down into a bundle.
    const isSquashing = isCompacting || /compact/i.test(e.props.message ?? '')
    const doing = isSquashing ? 'squash' : mode === 'tool-use' || mode === 'tool-input' ? 'type' : mode === 'responding' ? 'code' : 'think'
    const props = {
      word: e.props.message ?? e.props.word,
      suffix: e.props.suffix,
      // The terminal says what the turn is doing; the desktop says it itself.
      mode: e.surface === 'terminal' ? MODE_WORDS[mode] : '',
      startedAt: usage.turnStartedAt > 0 ? usage.turnStartedAt : Date.now(),
      doing,
      isTerminal: e.surface === 'terminal',
    } as const
    if (e.surface === 'terminal') {
      const { Client } = $.ui.resolve(e)
      return <Client key="spinner" module="./spinner-client.tsx" props={props} />
    }
    if (e.surface === 'desktop') {
      const { Box, Svg, Client } = $.ui.resolve(e)
      return (
        <Box flexDirection="row" gap={1} alignItems="center">
          {doing === 'squash' ? (
            <Svg source={squashClawdSvg()} alt="Clawd" width={30} height={23.75} />
          ) : (
            <Svg source={miniClawdSvg(doing, doing !== 'think')} alt="Clawd" width={30} height={20} />
          )}
          <Client key="spinner" module="./spinner-client.tsx" props={props} />
        </Box>
      )
    }
    return next(e)
  })

  // A tool's row on the desktop. While it runs: Clawd at his laptop, with what
  // it is doing, its clock and its command or file. Once done: a small Clawd,
  // pleased or worried, what it did and how it ended, and an arrow of Clawd's
  // own that opens the command and the first lines of its output.
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (e.surface !== 'desktop') return next(e)
    if (!e.props.isRunning) {
      const id = e.props.tool_use_id
      const [talk, open] = await Promise.all([read($, langAtom), read($, openRowsAtom)])
      const words = say(talk)
      const done = (e.props.input ?? {}) as Record<string, unknown>
      const isOk = !e.props.isErrored && !e.props.isInterrupted
      const what = str(done.description) || describe(e.props.tool, done).label
      const isOpen = open.includes(id)
      const { Box, Text, Svg, Button } = $.ui.resolve(e)
      return (
        <Box flexDirection="column">
          <Box flexDirection="row" gap={1} alignItems="center">
            <Svg source={doneClawdSvg(isOk)} alt="Clawd" width={24} height={16} />
            <Text wrap="truncate-end">{what}</Text>
            <Text color={isOk ? '#4CB363' : '#E5484D'}>{e.props.isInterrupted ? words.rowInterrupted : isOk ? '✓' : '✗'}</Text>
            <Button key={`row-${id}`} label={isOpen ? '⌄' : '›'} plain dimColor onPress={() => toggleRow($, id)} />
          </Box>
          {isOpen ? (
            <Box flexDirection="column" paddingLeft={4}>
              {rowDetail(e.props.tool, done, e.props.output, words).map((line, i) => (
                <Text key={`line-${i}`} dimColor wrap="truncate-end">
                  {line}
                </Text>
              ))}
            </Box>
          ) : null}
        </Box>
      )
    }
    const input = (e.props.input ?? {}) as Record<string, unknown>
    const detail = str(input.command) || str(input.file_path) || str(input.url) || str(input.query) || str(input.pattern) || str(input.description)
    const { Box, Svg, Client } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" gap={1} alignItems="center">
        <Svg source={miniClawdSvg('type', true)} alt="Clawd" width={30} height={20} />
        <Client
          key={`tool-${e.props.tool_use_id}`}
          module="./spinner-client.tsx"
          props={{
            word: TOOL_WORDS[e.props.tool] ?? `Using ${e.props.tool}`,
            suffix: '',
            mode: clip(detail.replace(/\s+/g, ' '), 60),
            startedAt: toolStarted.get(e.props.tool_use_id) ?? Date.now(),
            doing: 'type',
            isTerminal: false,
          }}
        />
      </Box>
    )
  })

  // Between turns, Clawd stands by on the prompt's hint line: what he is up
  // to, how long the last turn took, how long today has run. The terminal
  // keeps the engine's line and its live pills and adds a tail; the desktop
  // draws him beside the engine's own hint. Like the spinner, the line is in
  // English whatever Clawd speaks, beside Claude Code's own words.
  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    if (e.props.isWorking || e.props.isDraft) return next(e)
    const [doing, actors, game, today, offset, talk, names, now] = await Promise.all([
      read($, activity),
      read($, actorsAtom),
      read($, gameAtom),
      read($, todayAtom),
      read($, offsetAtom),
      read($, langAtom),
      read($, namesAtom),
      read($, nowAtom),
    ])
    const en = say('en')
    const isAsleep = game === 'sleep' && !isWorking
    const word = isAsleep
      ? 'Asleep'
      : doing.pose === 'wait'
        ? en.yourTurn
        : doing.pose === 'oops'
          ? en.turnError
          : doing.label === say(talk).interrupted
            ? en.interrupted
            : en.idle
    const details: string[] = []
    if (lastTurnMs > 0) details.push(`${en.lastTurn} ${Math.floor(lastTurnMs / 60_000)}:${String(Math.floor((lastTurnMs % 60_000) / 1000)).padStart(2, '0')}`)
    if (today !== null && today.date === dateOf(now || (await $.clock.now()), offset) && today.workMs > 0) details.push(en.todayWorked(duration(today.workMs, 'en')))
    if (e.surface === 'terminal') {
      return next({ ...e, props: { ...e.props, tail: ` · ${names.main ?? 'Clawd'} · ${[word, ...details].join(' · ')}` } })
    }
    if (e.surface !== 'desktop') return next(e)
    const STANDING: readonly Doing[] = ['idle', 'wait', 'read', 'love', 'cheer', 'oops', 'sleep']
    const main = actors.find(a => a.cap === null)?.doing ?? 'idle'
    const pose: Doing = isAsleep ? 'sleep' : STANDING.includes(main) ? main : 'idle'
    const { Box, Text, Svg } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" gap={1} alignItems="center">
        <Svg source={miniClawdSvg(pose)} alt="Clawd" width={30} height={20} />
        <Text color={ORANGE} bold>
          {word}
        </Text>
        {details.length === 0 ? null : <Text dimColor>{details.join(' · ')}</Text>}
        {e.props.hint === '' ? null : <Text dimColor>{`· ${e.props.hint}`}</Text>}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const [doing, deadlines, pets, offset, talk] = await Promise.all([
      read($, activity),
      read($, deadlinesAtom),
      read($, petsAtom),
      read($, offsetAtom),
      read($, langAtom),
      read($, nowAtom),
    ])
    const w = say(talk)
    const now = await $.clock.now()
    const { Box, Text, Button } = $.ui.resolve(e)
    const scale = e.props.bodyColumns >= W * 2 + 2 ? 2 : 1
    const nervous = isNervous(deadlines, now)
    let sprite: RenderElement
    if (e.surface === 'terminal') {
      const { Client } = $.ui.resolve(e)
      sprite = <Client key="clawd-big" module="./clawd-client.tsx" props={{ pose: doing.pose, isNervous: nervous, scale }} width={W * scale} height={(H * scale) / 2} />
    } else {
      const { Svg } = $.ui.resolve(e)
      sprite = <Svg source={clawdSvg(doing.pose, { isNervous: nervous }, 6)} alt={`Clawd: ${doing.label || w.hello}`} width={W * 6} height={H * 6} />
    }
    const heading = (text: string): RenderElement => (
      <Text color={ORANGE} bold>
        {`── ${text} `}
      </Text>
    )

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column" alignItems="center">
          {sprite}
          <Text color={ORANGE}>{`「${doing.label || w.hello}」`}</Text>
          <Text dimColor>{w.petted(pets)}</Text>
          <Box flexDirection="row" gap={1}>
            <Button key="recap" label={w.recapButton} hotkey="r" onPress={() => $.ui.open({ id: RECAP, title: w.recapPaneTitle })} />
            <Button key="trophies" label={w.trophiesButton} hotkey="t" onPress={() => $.ui.open({ id: TROPHY_PANE, title: w.trophiesTitle })} />
            <Button key="changes" label={w.changesButton} hotkey="c" onPress={() => $.ui.open({ id: CHANGES_PANE, title: w.changesTitle })} />
            <Button key="session" label={w.sessionButton} hotkey="u" onPress={() => $.ui.open({ id: SESSION_PANE, title: w.sessionTitle })} />
          </Box>
        </Box>

        <Box flexDirection="column">
          {heading(w.deadlines)}
          {deadlines.length === 0 ? <Text dimColor>{w.usage}</Text> : null}
          {deadlines.map(d => (
            <Box flexDirection="row" gap={1}>
              <Text color={URGENCY_COLOR[urgency(d.due, now)]}>{countdown(d.due, now, talk).padEnd(14)}</Text>
              <Text wrap="truncate-end">{`${d.title}  `}</Text>
              <Text dimColor>{formatDue(d.due, offset)}</Text>
              <Button key={`rm-${d.id}`} label={w.remove} plain dimColor onPress={() => changeDeadlines($, list => list.filter(x => x.id !== d.id))} />
            </Box>
          ))}
        </Box>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: CHANGES_PANE }, async ($, e) => {
    const [talk, changes, git] = await Promise.all([read($, langAtom), read($, changesAtom), read($, gitAtom)])
    const root = await $.session.root()
    const w = say(talk)
    const { Box, Text } = $.ui.resolve(e)
    const sum = totals(changes)
    return (
      <Box flexDirection="column" gap={1}>
        <Text color={ORANGE} bold>{`── ${w.changesTitle} ──`}</Text>
        <Text>{sum.files + sum.commands === 0 ? w.changesNone : w.changesSummary(sum.files, sum.added, sum.removed, sum.commands, sum.failed)}</Text>
        <Text dimColor>{git === null ? w.notARepo : w.gitLine(git.branch, git.ahead, git.behind, git.changed + git.untracked)}</Text>
        {changes.files.length === 0 ? null : (
          <Box flexDirection="column">
            <Text bold>{`${w.changesFiles}  `}<Text color={ORANGE}>{w.changesThisTurn}</Text></Text>
            {changes.files.map(f => (
              <Box key={f.path} flexDirection="row" gap={1}>
                <Text color={ORANGE}>{f.turn === changes.turn ? '●' : ' '}</Text>
                <Text wrap="truncate-start">{relativePath(f.path, root)}</Text>
                {f.isNew ? <Text color="#4CB363">new</Text> : null}
                <Text color="#4CB363">{`+${f.added}`}</Text>
                <Text color="#E5484D">{`−${f.removed}`}</Text>
                <Text dimColor>{`×${f.edits}`}</Text>
              </Box>
            ))}
          </Box>
        )}
        {changes.commands.length === 0 ? null : (
          <Box flexDirection="column">
            <Text bold>{w.changesCommands}</Text>
            {changes.commands.slice(0, 15).map((c, i) => (
              <Box key={`cmd-${i}`} flexDirection="row" gap={1}>
                <Text color={ORANGE}>{c.turn === changes.turn ? '●' : ' '}</Text>
                <Text color={c.isOk ? '#4CB363' : '#E5484D'}>{c.isOk ? '✓' : '✗'}</Text>
                <Text wrap="truncate-end">{c.text}</Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: TROPHY_PANE }, async ($, e) => {
    const [talk, trophies] = await Promise.all([read($, langAtom), read($, trophiesAtom)])
    const life = await loadLife($)
    const w = say(talk)
    const { Box, Text } = $.ui.resolve(e)
    const TIER_COLOR: Record<Tier, string> = { bronze: '#C0763A', silver: '#C9CDD3', gold: '#F2C14E', legend: '#E05EC8' }
    const got = Object.keys(trophies.unlocked).length
    const hats = hatsOf(trophies.unlocked)
    const pals = palsOf(trophies.unlocked)
    const hat = hatFor(trophies)
    const pal = palFor(trophies)
    const rewardName = (reward: NonNullable<(typeof FAMILIES)[number]['tiers'][number]['reward']>): string =>
      'hat' in reward ? w.hats[reward.hat] : 'pal' in reward ? w.pals[reward.pal] : w.goldens[reward.golden]
    return (
      <Box flexDirection="column" gap={1}>
        <Text color={ORANGE} bold>{`── ${w.trophiesTitle} · ${w.trophiesCount(got, TROPHY_TOTAL)} ──`}</Text>
        <Box flexDirection="column">
          <Text>
            <Text bold>{`${w.hatsHeading}  `}</Text>
            <Text dimColor>{hats.length === 0 ? w.noneYet : hats.map(h => (h === hat ? `${w.hats[h]} ✓` : w.hats[h])).join('、')}</Text>
          </Text>
          <Text>
            <Text bold>{`${w.palsHeading}  `}</Text>
            <Text dimColor>{pals.length === 0 ? w.noneYet : pals.map(p => (p === pal ? `${w.pals[p]} ✓` : w.pals[p])).join('、')}</Text>
          </Text>
        </Box>
        <Box flexDirection="column">
          {FAMILIES.map(family => {
            const { tier, next } = standing(family, trophies.unlocked)
            const value = family.progress(life)
            const filled = next === null ? 10 : Math.min(10, Math.floor((10 * value) / next.target))
            const target = next ?? family.tiers[family.tiers.length - 1]!
            return (
              <Box key={family.id} flexDirection="column">
                <Box flexDirection="row" gap={1}>
                  <Text color={tier === null ? undefined : TIER_COLOR[tier]} dimColor={tier === null}>
                    {tier === null ? '○' : '●'}
                  </Text>
                  <Text bold>{w.families[family.id]}</Text>
                  <Text color={tier === null ? undefined : TIER_COLOR[tier]} dimColor={tier === null}>
                    {tier === null ? '—' : w.tiers[tier]}
                  </Text>
                  <Text color={ORANGE}>{'▰'.repeat(filled) + '▱'.repeat(10 - filled)}</Text>
                  <Text dimColor>{w.trophyNext(w.amount(family.unit, value), w.amount(family.unit, target.target))}</Text>
                </Box>
                <Text dimColor>
                  {next === null
                    ? `  ${w.trophyMax} ${w.familyWhat[family.id](w.amountLong(family.unit, target.target))}`
                    : `  ${w.nextTier(w.tiers[next.tier], w.familyWhat[family.id](w.amountLong(family.unit, next.target)), next.reward === undefined ? null : rewardName(next.reward))}`}
                </Text>
              </Box>
            )
          })}
        </Box>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: SESSION_PANE }, async ($, e) => {
    const [talk, project] = await Promise.all([read($, langAtom), read($, projectAtom), read($, sessionAtom), read($, changesAtom), read($, usageAtom)])
    const summary = await summaryOf($)
    const w = say(talk)
    const { Box, Text } = $.ui.resolve(e)
    if (e.surface !== 'terminal') {
      const { Svg } = $.ui.resolve(e)
      const width = Math.min(720, Math.max(360, Math.round(e.props.bodyColumns * CELL_PX)))
      return <Svg source={sessionSvg(summary, talk, project)} alt={sessionLine(summary, talk)} width={width} height={Math.round((width * 140) / 240)} />
    }
    const top = [...summary.files].sort((a, b) => b.added + b.removed - (a.added + a.removed)).slice(0, 6)
    return (
      <Box flexDirection="column" gap={1}>
        <Text color={ORANGE} bold>{`── ${w.sessionTitle}${project === '' ? '' : ` · ${project}`} ──`}</Text>
        <Text wrap="wrap">{sessionLine(summary, talk)}</Text>
        {top.length === 0 ? null : (
          <Box flexDirection="column">
            <Text dimColor>{w.sessionTop}</Text>
            {top.map(f => (
              <Box flexDirection="row" gap={1}>
                <Text wrap="truncate-start">{f.path}</Text>
                <Text color="#4CB363">{`+${f.added}`}</Text>
                <Text color="#E5484D">{`−${f.removed}`}</Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: RECAP }, async ($, e) => {
    const [talk, theme, names] = await Promise.all([read($, langAtom), read($, themeAtom), read($, namesAtom), read($, todayAtom)])
    const { today, week, streak } = await readWeek($)
    const w = say(talk)
    const { Box, Text } = $.ui.resolve(e)
    if (e.surface !== 'terminal') {
      const { Svg } = $.ui.resolve(e)
      const width = Math.min(720, Math.max(360, Math.round(e.props.bodyColumns * CELL_PX)))
      return <Svg source={recapSvg(today, week, streak, talk, theme, names.main)} alt={recapLine(today, streak, talk)} width={width} height={Math.round((width * 140) / 240)} />
    }
    const { Client } = $.ui.resolve(e)
    const favorite = favoriteRoom(today)
    const total = ROOM_IDS.reduce((sum, id) => sum + today.rooms[id], 0)
    const BAR = 40
    const COLOR: Record<RoomId, string> = { library: '#C8873F', codelab: '#4D8DF6', terminal: '#4CB363', web: '#8ECDF5', game: '#A98BF5' }
    const most = Math.max(1, ...week.map(d => d?.tools ?? 0))
    const spark = week.map(d => ' ▁▂▃▄▅▆▇█'[Math.round((8 * (d?.tools ?? 0)) / most)] ?? ' ').join('')
    const figure = (value: string | number, label: string): RenderElement => (
      <Text>
        <Text bold>{String(value)}</Text>
        <Text dimColor>{` ${label}`}</Text>
      </Text>
    )
    return (
      <Box flexDirection="column" gap={1}>
        <Text color={ORANGE} bold>{`── ${names.main === undefined ? w.recapTitle : w.recapTitleOf(names.main)} · ${w.recapDate(today.date)} ──`}</Text>
        <Box flexDirection="row" gap={2} alignItems="center">
          <Client key="recap-clawd" module="./clawd-client.tsx" props={{ pose: poseOf(today), isNervous: false, scale: 1 }} width={W} height={H / 2} />
          <Box flexDirection="column">
            <Text color={ORANGE}>{today.turns + today.tools === 0 ? w.recapQuiet : w.recapWorked(duration(today.workMs, talk))}</Text>
            {favorite === undefined ? null : <Text dimColor>{w.recapFavorite(w.rooms[theme][favorite])}</Text>}
          </Box>
        </Box>
        <Box flexDirection="row" flexWrap="wrap" columnGap={3}>
          {figure(today.turns, w.recapTurns(today.turns))}
          {figure(today.tools, w.recapTools(today.tools))}
          {figure(today.edits, w.recapEdits(today.edits))}
          {figure(today.runs, w.recapRuns(today.runs))}
          {figure(`${today.testsPassed}/${today.testsPassed + today.testsFailed}`, w.recapTests)}
          {figure(today.commits, w.recapCommits(today.commits))}
          {figure(today.pushes + today.prsOpened, w.recapPushes(today.pushes + today.prsOpened))}
          {figure(today.compactions, w.recapTidies(today.compactions))}
        </Box>
        <Box flexDirection="column">
          <Text dimColor>{w.recapWhere}</Text>
          <Text>
            {total === 0 ? (
              <Text dimColor>{'░'.repeat(BAR)}</Text>
            ) : (
              ROOM_IDS.map(id => <Text color={COLOR[id]}>{'█'.repeat(Math.round((BAR * today.rooms[id]) / total))}</Text>)
            )}
          </Text>
          <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
            {total === 0
              ? null
              : ROOM_IDS.filter(id => today.rooms[id] > 0).map(id => (
                  <Text>
                    <Text color={COLOR[id]}>■</Text>
                    <Text dimColor>{` ${w.rooms[theme][id]} ${Math.round((100 * today.rooms[id]) / total)}%`}</Text>
                  </Text>
                ))}
          </Box>
        </Box>
        <Text>
          <Text dimColor>{`${w.recapWeek} `}</Text>
          <Text color={ORANGE}>{spark}</Text>
          <Text color={ORANGE} bold>{`  ${w.recapStreak(streak)}`}</Text>
        </Text>
      </Box>
    )
  })

  // ── Session and commands ────────────────────────────────────────────────

  // A session that ends takes its word back, so its visitors leave at once.
  on('session.end', async ($, e, next) => {
    const ending = sessionId
    // Nothing said after this point: a turn still winding down must not bring the word back.
    sessionId = ''
    // The session's summary: said now, and kept for the next session in this project.
    try {
      const summary = await summaryOf($)
      if (summary.totals.turns + summary.totals.tools > 0) {
        const line = sessionLine(summary, lang)
        await $.store.set(`lastSession:${await read($, projectAtom)}`, line)
        $.ui.toast(line, { timeoutMs: 10_000 })
      }
      // After a /clear the process goes on, a new conversation with figures of its own.
      if (e.reason === 'clear') {
        const now = await $.clock.now()
        await update($, sessionAtom, () => ({ startedAt: now, totals: emptyDay(dateOf(now, 0)) }))
      }
    } catch {
      // Ending goes ahead without it.
    }
    if (ending !== '') {
      try {
        await $.store.delete(`presence:${ending}`)
      } catch {
        // Unheard for long enough, it counts as gone anyway.
      }
    }
    return next(e)
  })

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    for (const key of RETIRED_KEYS) {
      try {
        await $.store.delete(key)
      } catch {
        // Gone already, or the store is busy: the next session tries again.
      }
    }
    await load($)
    const root = await $.session.root()
    await update($, projectAtom, () => baseName(root))
    const theme = await sceneFor($, baseName(root))
    await update($, themeAtom, () => theme)
    try {
      const zone = await $.process.run(['/bin/date', '+%z'], { timeoutMs: 3000 })
      const offset = parseOffset(zone.stdout)
      if (offset !== undefined) await update($, offsetAtom, () => offset)
    } catch {
      await update($, offsetAtom, () => -new Date().getTimezoneOffset())
    }
    await update($, nowAtom, () => Date.now())
    lang = await chooseLang($)
    await update($, langAtom, () => lang)
    await loadToday($)
    await changeLife($, () => {})
    // The session's own figures start here; a reload keeps them.
    const begun = await $.clock.now()
    const offsetNow = await read($, offsetAtom)
    await update($, sessionAtom, s => (s.startedAt === 0 ? { startedAt: begun, totals: emptyDay(dateOf(begun, offsetNow)) } : s))
    // What the last session in this project came to, once.
    const project = await read($, projectAtom)
    const last = (await $.store.get(`lastSession:${project}`)) as string | undefined
    if (typeof last === 'string' && last !== '') {
      await $.store.delete(`lastSession:${project}`)
      $.ui.toast(say(lang).lastSession(project, last), { timeoutMs: 8000 })
    }
    sessionId = await $.session.id()
    await readGit($, true)
    await sharePresence($)
    await lookAround($)
    await act($, 'idle', '')
    $.clock.every(5_000, () => void tickClock($))
    void checkClock($)
    void systemZone($).then(found => update($, zoneAtom, () => found ?? ''))
    void refreshUsage($, true)
    const w = say(lang)
    for (const command of [
      { name: 'clawd', description: w.describeClawd, argumentHint: w.hintClawd },
      { name: 'deadline', description: w.describeDeadline, argumentHint: w.hintDeadline },
    ]) {
      await $.command.register(command)
    }
    return started
  })

  // The menu describes the commands in whatever Clawd speaks now.
  on('command.describe', { command: 'clawd' }, async ($, e) => ({ description: say(lang).describeClawd, argumentHint: say(lang).hintClawd, isHidden: e.isHidden }))
  on('command.describe', { command: 'deadline' }, async ($, e) => ({ description: say(lang).describeDeadline, argumentHint: say(lang).hintDeadline, isHidden: e.isHidden }))

  on('command.run', { command: 'clawd' }, async ($, e) => {
    const [arg = '', choice = ''] = e.args.trim().split(/\s+/)
    if (arg === 'name') {
      const words = say(lang)
      const rest = e.args.trim().slice(arg.length).trim()
      if (rest === '') return answer($, words.nameUsage)
      if (rest === 'reset') {
        await $.store.set('names', {})
        await update($, namesAtom, () => ({}))
        return answer($, words.nameReset)
      }
      const [first = '', ...others] = rest.split(/\s+/)
      const crew = others.length > 0 ? await whoOf($, first) : undefined
      const id = crew !== undefined && crew !== 'main' ? crew : 'main'
      const name = (crew !== undefined && crew !== 'main' ? others.join(' ') : rest).slice(0, 12)
      const names = { ...(await read($, namesAtom)), [id]: name }
      await $.store.set('names', names)
      await update($, namesAtom, () => names)
      return answer($, words.nameSet(id === 'main' ? words.mainClawd : words.crewNumber(Number(id.slice(1))), name))
    }
    if (arg === 'cap') {
      const words = say(lang)
      const [, who = '', color = ''] = e.args.trim().split(/\s+/)
      const id = await whoOf($, who)
      const cap = CAP_COLORS.find(c => c === color.toLowerCase() || words.caps[c] === color || say('en').caps[c]?.toLowerCase() === color.toLowerCase())
      if (id === undefined || id === 'main' || cap === undefined) return answer($, words.capUsage)
      const caps = { ...(((await $.store.get('caps')) as Record<string, string> | undefined) ?? {}), [id]: cap }
      await $.store.set('caps', caps)
      await paintCaps($)
      return answer($, words.capSet((await read($, namesAtom))[id] ?? words.crewNumber(Number(id.slice(1))), words.caps[cap] ?? cap))
    }
    if (arg === 'birthday') {
      const words = say(lang)
      if (choice === 'off' || choice === 'none') {
        await $.store.set('birthday', '')
        await update($, birthdayAtom, () => '')
        return answer($, words.birthdayOff)
      }
      const m = choice.match(/^(\d{1,2})[/-](\d{1,2})$/)
      const month = Number(m?.[1])
      const day = Number(m?.[2])
      if (m === null || month < 1 || month > 12 || day < 1 || day > 31) return answer($, words.birthdayUsage)
      const birthday = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      await $.store.set('birthday', birthday)
      await update($, birthdayAtom, () => birthday)
      await greetBirthday($, await $.clock.now())
      return answer($, words.birthdaySet(`${month}/${day}`))
    }
    if (arg === 'changes' || arg === '改了什麼') {
      await $.ui.open({ id: CHANGES_PANE, title: say(lang).changesTitle })
      return {}
    }
    if (arg === 'trophies' || arg === 'trophy' || arg === '成就') {
      await $.ui.open({ id: TROPHY_PANE, title: say(lang).trophiesTitle })
      const trophies = await read($, trophiesAtom)
      return answer($, say(lang).trophiesCount(Object.keys(trophies.unlocked).length, TROPHY_TOTAL))
    }
    if (arg === 'hat' || arg === 'pal') {
      const words = say(lang)
      const trophies = await read($, trophiesAtom)
      if (arg === 'hat') {
        const have = hatsOf(trophies.unlocked)
        const pick = pickOf<Hat>(choice, [say('en').hats, say('zh').hats])
        if (pick === undefined || choice === '') return answer($, words.hatUsage(have.length === 0 ? words.noneYet : have.map(h => words.hats[h]).join('、')))
        if (pick !== 'auto' && pick !== 'none' && !have.includes(pick)) return answer($, words.locked(words.hats[pick]))
        const next = await setTrophyPick($, t => ({ ...t, hat: pick }))
        const worn = hatFor(next)
        return answer($, worn === null ? words.hatOff : words.hatSet(words.hats[worn]))
      }
      const have = palsOf(trophies.unlocked)
      const pick = pickOf<Pal>(choice, [say('en').pals, say('zh').pals])
      if (pick === undefined || choice === '') return answer($, words.palUsage(have.length === 0 ? words.noneYet : have.map(p => words.pals[p]).join('、')))
      if (pick !== 'auto' && pick !== 'none' && !have.includes(pick)) return answer($, words.locked(words.pals[pick]))
      const next = await setTrophyPick($, t => ({ ...t, pal: pick }))
      const walking = palFor(next)
      return answer($, walking === null ? words.palOff : words.palSet(words.pals[walking]))
    }
    if (arg === 'recap') {
      await $.ui.open({ id: RECAP, title: say(lang).recapPaneTitle })
      const { today, streak } = await readWeek($)
      return answer($, recapLine(today, streak, lang))
    }
    if (arg === 'summary' || arg === 'session' || arg === '結算') {
      await $.ui.open({ id: SESSION_PANE, title: say(lang).sessionTitle })
      return answer($, sessionLine(await summaryOf($), lang))
    }
    if (arg === 'lights' || arg === 'light' || arg === '燈') {
      const words = say(lang)
      const [, onOff = '', room = ''] = e.args.trim().split(/\s+/)
      const isOn = onOff === 'on' || onOff === '開' ? true : onOff === 'off' || onOff === '關' ? false : undefined
      const rooms = room === '' || room === 'all' ? ROOM_IDS : ROOM_IDS.filter(id => id === room.toLowerCase())
      if (isOn === undefined || rooms.length === 0) return answer($, words.lightsUsage)
      await setLights($, rooms, isOn)
      const theme = await read($, themeAtom)
      return answer($, words.lightsSet(rooms.length === ROOM_IDS.length ? words.allRooms : words.rooms[theme][rooms[0]!], isOn))
    }
    if (arg === 'hide') {
      await setCollapsed($, true)
      return answer($, say(lang).folded)
    }
    if (arg === 'show') {
      await setCollapsed($, false)
      return answer($, say(lang).unfolded)
    }
    if (arg === 'scene') {
      const wanted = choice.toLowerCase()
      const aliases: Record<string, Theme | 'next'> = { house: 'house', 小屋: 'house', beach: 'beach', 海灘: 'beach', space: 'space', 太空站: 'space', forest: 'forest', camp: 'forest', 森林: 'forest', 森林營地: 'forest', next: 'next', '': 'next' }
      const pick = aliases[wanted]
      if (pick === undefined) return answer($, say(lang).sceneUsage)
      const theme = await setTheme($, pick)
      return answer($, say(lang).sceneSet(say(lang).themes[theme]))
    }
    if (arg === 'season') {
      const words = say(lang)
      const pick = choice.toLowerCase()
      const seasons = ['spring', 'summer', 'autumn', 'winter'] as const
      if (pick === 'auto' || pick === '') {
        await $.store.set('seasonPick', 'auto')
        await update($, seasonPickAtom, (): Season | 'auto' => 'auto')
        return answer($, words.seasonAuto(words.seasons[seasonOf(await $.clock.now(), await read($, offsetAtom), await read($, zoneAtom))]))
      }
      const season = seasons.find(one => one === pick || (pick === 'fall' && one === 'autumn'))
      if (season === undefined) return answer($, words.seasonUsage)
      await $.store.set('seasonPick', season)
      await update($, seasonPickAtom, (): Season | 'auto' => season)
      return answer($, words.seasonSet(words.seasons[season]))
    }
    if (arg === 'holiday') {
      const words = say(lang)
      const pick = choice.toLowerCase()
      const names: Record<string, Holiday> = { lunar: 'lunarNewYear', 'lunar-new-year': 'lunarNewYear', 新年: 'lunarNewYear', 過年: 'lunarNewYear', halloween: 'halloween', 萬聖節: 'halloween', christmas: 'christmas', xmas: 'christmas', 聖誕節: 'christmas', none: 'none', off: 'none' }
      if (pick === 'auto' || pick === '') {
        await $.store.set('holidayPick', 'auto')
        await update($, holidayPickAtom, (): Holiday | 'auto' => 'auto')
        return answer($, words.holidayAuto(words.holidays[holidayOf(await $.clock.now(), await read($, offsetAtom))]))
      }
      const holiday = names[pick]
      if (holiday === undefined) return answer($, words.holidayUsage)
      await $.store.set('holidayPick', holiday)
      await update($, holidayPickAtom, (): Holiday | 'auto' => holiday)
      return answer($, words.holidaySet(words.holidays[holiday]))
    }
    if (arg === 'lang') {
      const wanted = choice.toLowerCase()
      const pick = wanted.startsWith('zh') || wanted === '中文' ? 'zh' : wanted === 'en' || wanted === 'english' ? 'en' : wanted === 'auto' ? 'auto' : undefined
      if (pick === undefined) return answer($, say(lang).langUsage)
      return answer($, say(await setLang($, pick)).speaks)
    }
    await $.ui.open({ id: PANE, title: say(lang).paneTitle })
    return {}
  })

  on('command.run', { command: 'deadline' }, async ($, e) => {
    const w = say(lang)
    const args = e.args.trim()
    const now = await $.clock.now()
    const offset = await read($, offsetAtom)
    if (args.startsWith('add')) {
      const parsed = parseDeadline(args.slice(3), now, offset, lang)
      if ('error' in parsed) return answer($, parsed.error)
      const project = await read($, projectAtom)
      const id = newId(now, parsed.title)
      await changeDeadlines($, list => [...list, { id, title: parsed.title, due: parsed.due, project, hasAlarmed: false }])
      return answer($, w.deadlineAdded(parsed.title, formatDue(parsed.due, offset), countdown(parsed.due, now, lang)))
    }
    const deadlines = await read($, deadlinesAtom)
    if (args.startsWith('rm')) {
      const target = deadlines[Number(args.slice(2).trim()) - 1]
      if (target === undefined) return answer($, w.noSuchDeadline)
      await changeDeadlines($, list => list.filter(d => d.id !== target.id))
      return answer($, w.removed(target.title))
    }
    // The list is the pane's: nothing of it goes into the conversation.
    await $.ui.open({ id: PANE, title: w.paneTitle })
    return deadlines.length === 0 ? answer($, `${w.noDeadlines} ${w.usage}`) : {}
  })

  // ── What the agent does ─────────────────────────────────────────────────

  on('turn.start', async ($, e, next) => {
    isWorking = true
    await update($, changesAtom, (changes): Changes => ({ ...changes, turn: changes.turn + 1 }))
    const started = await $.clock.now()
    if (busySince === 0 || started - lastTurnEndAt > BUSY_GAP) busySince = started
    await update($, usageAtom, (u): Usage => ({ ...u, turnStartedAt: started, tools: 0, edits: 0, runs: 0 }))
    await act($, 'think', say(lang).thinking)
    await arrangeCrew($)
    // The neighbors hear at once that this session got busy.
    await sharePresence($)
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const input = e as unknown as Record<string, unknown>
    const tool = String(e.tool)
    const seen = describe(tool, input)
    const agentId = e.agentId
    const isDispatch = agentId === undefined && (tool === 'Agent' || tool === 'Task')
    try {
      if (agentId !== undefined) await routeCrew($, agentId, seen.pose, seen.label)
      else {
        await act($, seen.pose, seen.label)
        await count($, 'tools')
        if (tool === 'Bash') await count($, 'runs')
        if (isDispatch) await assignCrew($, e.tool_use_id, clip(str(input.description) || say(lang).helper, 12))
      }
    } catch {
      // Clawd missing a beat never holds up the tool.
    }
    toolStarted.set(e.tool_use_id, Date.now())
    const ran = await next(e).finally(() => toolStarted.delete(e.tool_use_id))
    try {
      if (ran.deny === undefined) {
        const at = await $.clock.now()
        const failed = ran.isError === true
        const change = failed ? undefined : fileChangeOf(tool, input, ran.result)
        if (change !== undefined) await update($, changesAtom, changes => recordFile(changes, change, at))
        if (tool === 'Bash') {
          const text = str(input.description) || (str(input.command).split('\n')[0] ?? '')
          await update($, changesAtom, changes => recordCommand(changes, { text, isOk: !failed, isTest: isTestRun(str(input.command)), at }))
        }
        if (tool === 'Bash' || EDITING.has(tool)) await readGit($)
      }
    } catch {
      // A change not counted is no reason to hold up the tool.
    }
    try {
      const isFailed = ran.deny === undefined && ran.isError === true
      if (isDispatch) await releaseCrew($, e.tool_use_id)
      if (agentId === undefined) {
        if (!isFailed && ran.deny === undefined && EDIT_TOOLS.has(tool)) await count($, 'edits')
        const git = !isFailed && ran.deny === undefined ? (ran.result as { gitOperation?: GitOperation } | undefined)?.gitOperation : undefined
        const moment = tool === 'Bash' && ran.deny === undefined ? momentOf(str(input.command), isFailed, git, lang) : undefined
        const spot = PLACE[seen.pose].spot
        const room = spot === null ? undefined : ROOM_OF_SPOT[spot]
        const isTest = tool === 'Bash' && isTestRun(str(input.command))
        if (ran.deny === undefined) await logDay($, day => {
          day.tools++
          if (room !== undefined) day.rooms[room]++
          if (!isFailed && EDIT_TOOLS.has(tool)) day.edits++
          if (tool === 'Bash') day.runs++
          if (isDispatch) day.helpers++
          if (isTest) {
            if (isFailed) day.testsFailed++
            else day.testsPassed++
          }
          if (git?.commit !== undefined) day.commits++
          if (git?.push !== undefined) day.pushes++
          if (git?.pr?.action === 'created') day.prsOpened++
          if (git?.pr?.action === 'merged') day.prsMerged++
        }, life => {
          if (!isTest) return
          if (isFailed) {
            life.failRun++
            life.greenRun = 0
            return
          }
          if (life.failRun >= 3) life.comebacks++
          life.failRun = 0
          life.greenRun++
          life.bestGreenRun = Math.max(life.bestGreenRun, life.greenRun)
        })
        if (moment !== undefined) await flash($, moment.pose, moment.label, moment.ms, () => settle($))
        else if (isFailed) await flash($, 'oops', say(lang).failed(seen.label), 2500, () => settle($))
        else if (isWorking && seen.pose !== 'wait') await act($, 'think', say(lang).thinking)
      }
      await refreshUsage($)
    } catch {
      // The tool already ran; its result goes back as it came.
    }
    return ran
  }).catch(($, e, next) => next(e))

  on('classic.Notification', async ($, e, next) => {
    if (/permission/i.test(String(e.notification_type))) {
      try {
        await act($, 'ask', say(lang).approve)
      } catch {
        // A missed wave is no reason to drop the notification.
      }
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  // Compacting, Clawd carries the library's books off and back; the shelves then show the room it made.
  on('session.compact', async ($, e, next) => {
    if (e.agentId !== undefined || e.trigger === 'precompute') return next(e)
    try {
      await update($, compactingAtom, () => true)
      await act($, 'tidy', say(lang).compacting)
    } catch {
      // Compaction goes ahead whatever Clawd is doing.
    }
    let compacted
    try {
      compacted = await next(e)
    } finally {
      await update($, compactingAtom, () => false).catch(() => undefined)
    }
    try {
      await logDay($, day => {
        day.compactions++
      })
      await refreshUsage($, true)
      await flash($, 'cheer', say(lang).compacted, 3000, () => settle($))
    } catch {
      // As above.
    }
    return compacted
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId !== undefined) return result
    isWorking = false
    lastTurnMs = e.durationMs
    lastTurnEndAt = await $.clock.now()
    const ended = await $.clock.now()
    const offset = await read($, offsetAtom)
    const hour = new Date(ended - e.durationMs + offset * 60_000).getUTCHours()
    const holiday = holidayOf(ended, offset)
    await logDay(
      $,
      day => {
        day.turns++
        day.workMs += e.durationMs
        day.longestMs = Math.max(day.longestMs, e.durationMs)
      },
      life => {
        if (hour < 5) life.nightTurns++
        else if (hour < 7) life.dawnTurns++
        if (holiday !== 'none' && !life.holidays.includes(holiday)) life.holidays.push(holiday)
      },
    )
    void refreshUsage($, true)
    await arrangeCrew($)
    if (e.reason === 'aborted') {
      await act($, 'idle', say(lang).interrupted)
      await sharePresence($)
      return result
    }
    if (e.reason !== 'answer') {
      await act($, 'oops', say(lang).turnError)
      await sharePresence($)
      return result
    }
    await act($, 'wait', say(lang).yourTurn)
    await sharePresence($)
    return result
  })
}
