// Clawd 副駕 (clawd-sidekick): the human's half of pairing with Claude.
//
// Above the prompt is Clawd's house: the main Clawd walks to the room of
// whatever Claude is doing, and a crew of three plays in the game room
// (volleyball while Claude works, something else while it waits, asleep at
// night) until a subagent calls one of them to work. Under it, the figures
// the status line knows. Clawd keeps the list of things only you can do
// (read off Claude's replies) and frets as your deadlines close in.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderElement } from 'claude-code'

import type { Activity, Deadline, Doing, Game, Holiday, Pose, SceneActor, SceneProps, Season, Theme, TimeOfDay, Todo, Usage } from '../types'
import { countdown, formatDue, parseDeadline, parseOffset, urgency, URGENCY_COLOR } from './deadline'
import { langOf, say, type Lang } from './i18n'
import { actorX, layoutFor, ROOMS, SH, SPOT_X, SW, type Spot } from './scene'
import { miniClawdSvg, sceneSvg } from './scene-svg'
import { H, W } from './sprite'
import { THEME_ORDER } from './themes'
import { clawdSvg } from './svg'
import { holidayOf, seasonOf, zoneOf } from './seasons'
import { extractPrompt, isDuplicate, newId, ordered, parseList, shouldExtract } from './todo'

type Engine = EngineInterface

const PANE = 'clawd'
const ORANGE = '#D97757'
/** CSS pixels a desktop cell is taken to be, to size the house's frame. */
const CELL_PX = 8

const activity = atom({ plugin: 'clawd-sidekick', key: 'activity' } as const, { pose: 'idle', label: '', since: 0 })
const todosAtom = atom({ plugin: 'clawd-sidekick', key: 'todos' } as const, [])
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
const seasonPickAtom = atom({ plugin: 'clawd-sidekick', key: 'seasonPick' } as const, 'auto')
const holidayPickAtom = atom({ plugin: 'clawd-sidekick', key: 'holidayPick' } as const, 'auto')

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
  conduct: { spot: 'code', doing: 'think' },
  quiz: { spot: null, doing: 'quiz' },
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
      return { pose: 'type', label: w.run(clip(str(input.command).split('\n')[0] ?? '', 28)) }
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
  if (isWorking) return 'volley'
  const hour = hourOf(now, offset)
  if (hour >= 23 || hour < 7) return 'sleep'
  return (['pong', 'rope', 'tower'] as const)[Math.floor(now / 90_000) % 3] ?? 'pong'
}

// Module state: what a reload may forget.

let settings = { isAutoTodo: true, todoModel: 'haiku', language: 'auto' }
let lang: Lang = 'en'
let isWorking = false
let lastUsageAt = 0
let lastTurnMs = 0
let ticks = 0

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
    const free = actors.filter(a => a.cap !== null && a.agentKey === undefined).sort((p, q) => p.id.localeCompare(q.id))
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
    const free = actors.filter(a => a.cap !== null && a.agentKey === undefined).sort((p, q) => p.id.localeCompare(q.id))[0]
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
function onPet($: Engine, id: string): void {
  void (async () => {
    const pets = await update($, petsAtom, n => n + 1)
    await $.store.set('pets', pets)
    if (id !== 'main') {
      await update($, actorsAtom, actors => actors.map(a => (a.id === id && a.agentKey === undefined ? { ...a, doing: 'love' } : a)))
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
    await update($, usageAtom, (u): Usage => ({
      ...u,
      model: modelName(model),
      contextPercent: usage.context.percent ?? null,
      fiveHour: window('five_hour'),
      sevenDay: window('seven_day'),
      usd: usage.cost?.usd ?? null,
    }))
  } catch {
    // The figures wait for the next tick.
  }
}

async function count($: Engine, field: 'tools' | 'edits' | 'runs'): Promise<void> {
  await update($, usageAtom, (u): Usage => ({ ...u, [field]: u[field] + 1 }))
}

// ── Persistence: $.store outlives the session, $.state draws ─────────────

async function load($: Engine): Promise<void> {
  const stored = async <T,>(key: string, fallback: T): Promise<T> => ((await $.store.get(key)) as T | undefined) ?? fallback
  const todos = await stored<Todo[]>('todos', [])
  const deadlines = await stored<Deadline[]>('deadlines', [])
  const isCollapsed = await stored<boolean>('isCollapsed', false)
  const pets = await stored<number>('pets', 0)
  const theme = await stored<string>('theme', 'house')
  const seasonPick = await stored<Season | 'auto'>('seasonPick', 'auto')
  const holidayPick = await stored<Holiday | 'auto'>('holidayPick', 'auto')
  await update($, seasonPickAtom, () => seasonPick)
  await update($, holidayPickAtom, () => holidayPick)
  await update($, themeAtom, (): Theme => (THEME_ORDER as readonly string[]).includes(theme) ? (theme as Theme) : 'house')
  await update($, todosAtom, () => todos)
  await update($, deadlinesAtom, () => deadlines)
  await update($, collapsedAtom, () => isCollapsed)
  await update($, petsAtom, () => pets)
}

/** Changes the todo list from what the store holds now, so another session's adds survive. */
async function changeTodos($: Engine, change: (todos: Todo[]) => Todo[]): Promise<Todo[]> {
  const current = ((await $.store.get('todos')) as Todo[] | undefined) ?? (await read($, todosAtom))
  const next = change(current.map(todo => ({ ...todo })))
  await $.store.set('todos', next)
  await update($, todosAtom, () => next)
  return next
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
async function setTheme($: Engine, choice: Theme | 'next'): Promise<Theme> {
  const current = await read($, themeAtom)
  const theme = choice === 'next' ? (THEME_ORDER[(THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length] ?? 'house') : choice
  await $.store.set('theme', theme)
  await update($, themeAtom, () => theme)
  return theme
}

// ── The human's todo list ───────────────────────────────────────────────

async function addTodos($: Engine, texts: readonly string[], isManual: boolean): Promise<string[]> {
  const project = await read($, projectAtom)
  const now = await $.clock.now()
  const added: string[] = []
  await changeTodos($, todos => {
    for (const text of texts) {
      if (isDuplicate(todos, text)) continue
      todos.push({ id: newId(now + added.length, text), text, project, createdAt: now, isDone: false, isManual })
      added.push(text)
    }
    return todos
  })
  return added
}

async function completeTodo($: Engine, id: string): Promise<Todo | undefined> {
  const now = await $.clock.now()
  let done: Todo | undefined
  await changeTodos($, todos =>
    todos.map(todo => {
      if (todo.id !== id || todo.isDone) return todo
      done = { ...todo, isDone: true, doneAt: now }
      return done
    }),
  )
  if (done !== undefined) await flash($, 'cheer', say(lang).done(clip(done.text, 18)), 2500, () => settle($))
  return done
}

async function extractTodos($: Engine, answer: string): Promise<void> {
  const reply = await $.model.complete({ model: settings.todoModel, prompt: extractPrompt(answer), maxTokens: 400 })
  if (!reply.isAnswered) return
  const added = await addTodos($, parseList(reply.text), false)
  if (added.length === 0) return
  $.ui.toast(say(lang).noted(added), { timeoutMs: 6000 })
  await flash($, 'itemget', say(lang).notedCount(added.length), 4000, () => settle($))
}

// ── The clock: deadlines, dozing off, the game rotation ─────────────────

async function checkClock($: Engine): Promise<void> {
  const now = await $.clock.now()
  await update($, nowAtom, () => now)
  await arrangeCrew($)
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
  const fresh = (await $.store.get('todos')) as Todo[] | undefined
  if (fresh !== undefined && JSON.stringify(fresh) !== JSON.stringify(await read($, todosAtom))) await update($, todosAtom, () => fresh)
}

/** Every five seconds: the turn clock while working, the rest every thirty. */
async function tickClock($: Engine): Promise<void> {
  ticks += 1
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
    isAutoTodo: options.autoTodo !== false,
    todoModel: typeof options.todoModel === 'string' && options.todoModel !== '' ? options.todoModel : 'haiku',
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
    const [doing, todos, deadlines, isCollapsed, project, actors, usage, game, offset, talk, theme, zone, seasonPick, holidayPick] = await Promise.all([
      read($, activity),
      read($, todosAtom),
      read($, deadlinesAtom),
      read($, collapsedAtom),
      read($, projectAtom),
      read($, actorsAtom),
      read($, usageAtom),
      read($, gameAtom),
      read($, offsetAtom),
      read($, langAtom),
      read($, themeAtom),
      read($, zoneAtom),
      read($, seasonPickAtom),
      read($, holidayPickAtom),
      read($, nowAtom),
    ])
    const w = say(talk)
    const now = await $.clock.now()
    const open = ordered(todos, project)
    const ahead = deadlines.filter(d => d.due > now - 86_400_000)
    const nearest = ahead[0]
    const { Box, Text, Button } = $.ui.resolve(e)
    const width = e.props.bodyColumns

    // The terminal folds the band when the house cannot fit; the desktop scales it instead.
    const isCramped = e.surface === 'terminal' && (width < 70 || e.props.maxRows < SH / 2 + 3)
    const main = actors.find(a => a.cap === null)
    const langButton = <Button key="lang" label={w.otherLanguage} onPress={() => setLang($, talk === 'zh' ? 'en' : 'zh')} />
    if (isCollapsed || isCramped) {
      const now_ = doing.label && doing.label !== w.sleepy ? doing.label : w.doings[main?.doing ?? 'idle']
      const summary = [`Clawd · ${now_}`, open.length > 0 ? w.toDo(open.length) : w.noTodos]
      if (nearest !== undefined) summary.push(w.due(nearest.title, countdown(nearest.due, now, talk)))
      let face: RenderElement
      if (e.surface === 'terminal') {
        face = <Text color={ORANGE}>▐▛███▜▌</Text>
      } else {
        const { Svg } = $.ui.resolve(e)
        face = <Svg source={miniClawdSvg(main?.doing ?? 'idle')} alt="Clawd" width={36} height={24} />
      }
      return (
        <Box flexDirection="row" gap={1} alignItems="center">
          {face}
          <Text wrap="truncate-end">{summary.join(' · ')}</Text>
          <Box flexGrow={1} />
          {isCollapsed ? <Button key="expand" label={w.expand} variant="primary" onPress={() => setCollapsed($, false)} /> : null}
          {e.surface === 'terminal' ? null : langButton}
        </Box>
      )
    }

    const scene: SceneProps = {
      actors,
      todos: open.length,
      days: nearest === undefined ? null : Math.max(0, Math.floor((nearest.due - now) / 86_400_000)),
      urgency: nearest === undefined ? 'none' : urgency(nearest.due, now),
      game,
      time: timeOfDay(now, offset),
      board: open.slice(0, 6).map(t => t.text),
      // To the hour only: a minute's change would redraw the desktop house and start its loops over.
      deadline: nearest === undefined ? '' : `${nearest.title} · ${formatDue(nearest.due, offset)} · ${countdown(nearest.due, now, talk, true)}`,
      lang: talk,
      theme,
      season: seasonPick !== 'auto' ? seasonPick : seasonOf(now, offset, zone),
      holiday: holidayPick !== 'auto' ? holidayPick : holidayOf(now, offset),
    }
    let house: RenderElement
    if (e.surface === 'terminal') {
      const { Client } = $.ui.resolve(e)
      house = <Client key="house" module="./scene-client.tsx" props={scene} width="100%" height={SH / 2 + 1} />
    } else {
      const { Svg } = $.ui.resolve(e)
      const frame = Math.round(width * CELL_PX)
      house = (
        <Svg
          source={sceneSvg(scene, now)}
          alt={w.houseAlt(doing.label || w.readingInLibrary)}
          isInteractive
          width={frame}
          height={Math.round((frame * SH) / SW)}
        />
      )
    }

    const level = (percent: number | null): string | undefined =>
      percent === null ? undefined : percent >= 80 ? '#E5484D' : percent >= 50 ? '#F5C542' : '#4CB363'
    const bar = (percent: number): string => {
      const filled = Math.round(percent / 20)
      return '▰'.repeat(filled) + '▱'.repeat(5 - filled)
    }
    const elapsed = isWorking ? now - usage.turnStartedAt : lastTurnMs
    const clockText = `${Math.floor(elapsed / 60_000)}:${String(Math.floor((elapsed % 60_000) / 1000)).padStart(2, '0')}`
    const stat = (label: string, value: string, color?: string): RenderElement => (
      <Text>
        <Text dimColor>{`${label} `}</Text>
        <Text color={color}>{value}</Text>
      </Text>
    )

    return (
      <Box flexDirection="column">
        {house}
        <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
          <Text color={ORANGE} bold wrap="truncate-end">
            {`「${doing.label || (isWorking ? w.thinking : w.hello)}」`}
          </Text>
          {usage.model ? <Text dimColor>{usage.model}</Text> : null}
          {usage.contextPercent === null ? null : stat('ctx', `${bar(usage.contextPercent)} ${Math.round(usage.contextPercent)}%`, level(usage.contextPercent))}
          {usage.fiveHour === null ? null : stat('5h', `${Math.round(usage.fiveHour)}%`, level(usage.fiveHour))}
          {usage.sevenDay === null ? null : stat('7d', `${Math.round(usage.sevenDay)}%`, level(usage.sevenDay))}
          {usage.usd === null ? null : stat('$', usage.usd.toFixed(2))}
          {stat(isWorking ? w.turn : w.lastTurn, clockText)}
          {stat(w.tools, String(usage.tools))}
          {stat(w.edited, w.files(usage.edits))}
          {stat(w.ran, w.commands(usage.runs))}
        </Box>
        <Box flexDirection="row" flexWrap="wrap" columnGap={1}>
          {open.length === 0 ? <Text dimColor>{w.nothingToDo}</Text> : null}
          {open.slice(0, 3).map((todo, i) => (
            <Box flexDirection="row">
              <Button key={`done-${todo.id}`} label="□" plain hotkey={String(i + 1)} onPress={() => completeTodo($, todo.id)} />
              <Text wrap="truncate-end">{` ${clip(todo.text, 16)}`}</Text>
            </Box>
          ))}
          {open.length > 3 ? <Text dimColor>{`+${open.length - 3}`}</Text> : null}
          {nearest === undefined ? null : (
            <Text color={URGENCY_COLOR[urgency(nearest.due, now)]} wrap="truncate-end">
              {` ${w.due(clip(nearest.title, 10), countdown(nearest.due, now, talk))}`}
            </Text>
          )}
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
    const [usage, talk] = await Promise.all([read($, usageAtom), read($, langAtom)])
    const mode = e.props.mode
    const doing = mode === 'tool-use' || mode === 'tool-input' ? 'type' : mode === 'responding' ? 'code' : 'think'
    const props = {
      word: e.props.message ?? e.props.word,
      suffix: e.props.suffix,
      mode: say(talk).modes[mode],
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
          <Svg source={miniClawdSvg(doing)} alt="Clawd" width={30} height={20} />
          <Client key="spinner" module="./spinner-client.tsx" props={props} />
        </Box>
      )
    }
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const [doing, todos, deadlines, pets, offset, project, talk] = await Promise.all([
      read($, activity),
      read($, todosAtom),
      read($, deadlinesAtom),
      read($, petsAtom),
      read($, offsetAtom),
      read($, projectAtom),
      read($, langAtom),
      read($, nowAtom),
    ])
    const w = say(talk)
    const now = await $.clock.now()
    const { Box, Text, Button } = $.ui.resolve(e)
    const open = ordered(todos, project)
    const doneCount = todos.filter(t => t.isDone).length
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
        </Box>

        <Box flexDirection="column">
          {heading(w.forYou(open.length))}
          {open.length === 0 ? <Text dimColor>{w.allDone}</Text> : null}
          {open.map((todo, i) => (
            <Box flexDirection="row" gap={1}>
              <Button key={`pane-done-${todo.id}`} label={w.complete} plain hotkey={i < 9 ? String(i + 1) : undefined} onPress={() => completeTodo($, todo.id)} />
              <Text wrap="truncate-end">
                {todo.text}
                <Text dimColor>{` · ${todo.project || '—'}${todo.isManual ? ` · ${w.manual}` : ''}`}</Text>
              </Text>
            </Box>
          ))}
          {doneCount > 0 ? <Text dimColor>{w.doneCount(doneCount)}</Text> : null}
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

  // ── Session and commands ────────────────────────────────────────────────

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await load($)
    const root = await $.session.root()
    await update($, projectAtom, () => baseName(root))
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
    await act($, 'idle', '')
    $.clock.every(5_000, () => void tickClock($))
    void checkClock($)
    void systemZone($).then(found => update($, zoneAtom, () => found ?? ''))
    void refreshUsage($, true)
    const w = say(lang)
    for (const command of [
      { name: 'clawd', description: w.describeClawd, argumentHint: w.hintClawd },
      { name: 'todo', description: w.describeTodo, argumentHint: w.hintTodo },
      { name: 'deadline', description: w.describeDeadline, argumentHint: w.hintDeadline },
    ]) {
      await $.command.register(command)
    }
    return started
  })

  // The menu describes the commands in whatever Clawd speaks now.
  on('command.describe', { command: 'clawd' }, async ($, e) => ({ description: say(lang).describeClawd, argumentHint: say(lang).hintClawd, isHidden: e.isHidden }))
  on('command.describe', { command: 'todo' }, async ($, e) => ({ description: say(lang).describeTodo, argumentHint: say(lang).hintTodo, isHidden: e.isHidden }))
  on('command.describe', { command: 'deadline' }, async ($, e) => ({ description: say(lang).describeDeadline, argumentHint: say(lang).hintDeadline, isHidden: e.isHidden }))

  on('command.run', { command: 'clawd' }, async ($, e) => {
    const [arg = '', choice = ''] = e.args.trim().split(/\s+/)
    if (arg === 'hide') {
      await setCollapsed($, true)
      return { text: say(lang).folded }
    }
    if (arg === 'show') {
      await setCollapsed($, false)
      return { text: say(lang).unfolded }
    }
    if (arg === 'scene') {
      const wanted = choice.toLowerCase()
      const aliases: Record<string, Theme | 'next'> = { house: 'house', 小屋: 'house', beach: 'beach', 海灘: 'beach', space: 'space', 太空站: 'space', forest: 'forest', camp: 'forest', 森林: 'forest', 森林營地: 'forest', next: 'next', '': 'next' }
      const pick = aliases[wanted]
      if (pick === undefined) return { text: say(lang).sceneUsage }
      const theme = await setTheme($, pick)
      return { text: say(lang).sceneSet(say(lang).themes[theme]) }
    }
    if (arg === 'season') {
      const words = say(lang)
      const pick = choice.toLowerCase()
      const seasons = ['spring', 'summer', 'autumn', 'winter'] as const
      if (pick === 'auto' || pick === '') {
        await $.store.set('seasonPick', 'auto')
        await update($, seasonPickAtom, (): Season | 'auto' => 'auto')
        return { text: words.seasonAuto(words.seasons[seasonOf(await $.clock.now(), await read($, offsetAtom), await read($, zoneAtom))]) }
      }
      const season = seasons.find(one => one === pick || (pick === 'fall' && one === 'autumn'))
      if (season === undefined) return { text: words.seasonUsage }
      await $.store.set('seasonPick', season)
      await update($, seasonPickAtom, (): Season | 'auto' => season)
      return { text: words.seasonSet(words.seasons[season]) }
    }
    if (arg === 'holiday') {
      const words = say(lang)
      const pick = choice.toLowerCase()
      const names: Record<string, Holiday> = { lunar: 'lunarNewYear', 'lunar-new-year': 'lunarNewYear', 新年: 'lunarNewYear', 過年: 'lunarNewYear', halloween: 'halloween', 萬聖節: 'halloween', christmas: 'christmas', xmas: 'christmas', 聖誕節: 'christmas', none: 'none', off: 'none' }
      if (pick === 'auto' || pick === '') {
        await $.store.set('holidayPick', 'auto')
        await update($, holidayPickAtom, (): Holiday | 'auto' => 'auto')
        return { text: words.holidayAuto(words.holidays[holidayOf(await $.clock.now(), await read($, offsetAtom))]) }
      }
      const holiday = names[pick]
      if (holiday === undefined) return { text: words.holidayUsage }
      await $.store.set('holidayPick', holiday)
      await update($, holidayPickAtom, (): Holiday | 'auto' => holiday)
      return { text: words.holidaySet(words.holidays[holiday]) }
    }
    if (arg === 'lang') {
      const wanted = choice.toLowerCase()
      const pick = wanted.startsWith('zh') || wanted === '中文' ? 'zh' : wanted === 'en' || wanted === 'english' ? 'en' : wanted === 'auto' ? 'auto' : undefined
      if (pick === undefined) return { text: say(lang).langUsage }
      return { text: say(await setLang($, pick)).speaks }
    }
    await $.ui.open({ id: PANE, title: say(lang).paneTitle })
    return { text: say(lang).paneOpened }
  })

  on('command.run', { command: 'todo' }, async ($, e) => {
    const w = say(lang)
    const [verb = '', ...rest] = e.args.trim().split(/\s+/)
    const text = rest.join(' ').trim()
    const project = await read($, projectAtom)
    const open = ordered(await read($, todosAtom), project)
    const pick = (): Todo | undefined => open[Number(text) - 1]
    switch (verb) {
      case 'add': {
        if (text === '') return { text: w.todoUsage }
        const added = await addTodos($, [text], true)
        return { text: added.length > 0 ? w.todoAdded(text) : w.todoDuplicate }
      }
      case 'done': {
        const todo = pick()
        if (todo === undefined) return { text: w.noSuchTodo(text) }
        await completeTodo($, todo.id)
        return { text: w.done(todo.text) }
      }
      case 'undo': {
        const all = await read($, todosAtom)
        const last = all.filter(t => t.isDone).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0))[0]
        if (last === undefined) return { text: w.nothingToUndo }
        await changeTodos($, list => list.map(t => (t.id === last.id ? { ...t, isDone: false } : t)))
        return { text: w.undone(last.text) }
      }
      case 'rm': {
        const todo = pick()
        if (todo === undefined) return { text: w.noSuchTodo(text) }
        await changeTodos($, list => list.filter(t => t.id !== todo.id))
        return { text: w.removed(todo.text) }
      }
      case 'clear': {
        const next = await changeTodos($, list => list.filter(t => !t.isDone))
        return { text: w.cleared(next.length) }
      }
      default: {
        if (open.length === 0) return { text: w.emptyList }
        const lines = open.map((t, i) => `${i + 1}. ${t.text}${t.project && t.project !== project ? `（${t.project}）` : ''}`)
        return { text: [w.listHeader, ...lines, '', w.listFooter].join('\n') }
      }
    }
  })

  on('command.run', { command: 'deadline' }, async ($, e) => {
    const w = say(lang)
    const args = e.args.trim()
    const now = await $.clock.now()
    const offset = await read($, offsetAtom)
    if (args.startsWith('add')) {
      const parsed = parseDeadline(args.slice(3), now, offset, lang)
      if ('error' in parsed) return { text: parsed.error }
      const project = await read($, projectAtom)
      const id = newId(now, parsed.title)
      await changeDeadlines($, list => [...list, { id, title: parsed.title, due: parsed.due, project, hasAlarmed: false }])
      return { text: w.deadlineAdded(parsed.title, formatDue(parsed.due, offset), countdown(parsed.due, now, lang)) }
    }
    const deadlines = await read($, deadlinesAtom)
    if (args.startsWith('rm')) {
      const target = deadlines[Number(args.slice(2).trim()) - 1]
      if (target === undefined) return { text: w.noSuchDeadline }
      await changeDeadlines($, list => list.filter(d => d.id !== target.id))
      return { text: w.removed(target.title) }
    }
    if (deadlines.length === 0) return { text: `${w.noDeadlines} ${w.usage}` }
    const lines = deadlines.map((d, i) => `${i + 1}. ${d.title} · ${formatDue(d.due, offset)} · ${countdown(d.due, now, lang)}`)
    return { text: [w.deadlineHeader, ...lines, '', w.deadlineFooter].join('\n') }
  })

  // ── What the agent does ─────────────────────────────────────────────────

  on('turn.start', async ($, e, next) => {
    isWorking = true
    const started = await $.clock.now()
    await update($, usageAtom, (u): Usage => ({ ...u, turnStartedAt: started, tools: 0, edits: 0, runs: 0 }))
    await act($, 'think', say(lang).thinking)
    await arrangeCrew($)
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
    const ran = await next(e)
    try {
      const isFailed = ran.deny === undefined && ran.isError === true
      if (isDispatch) await releaseCrew($, e.tool_use_id)
      if (agentId === undefined) {
        if (!isFailed && ran.deny === undefined && EDIT_TOOLS.has(tool)) await count($, 'edits')
        if (isFailed) await flash($, 'oops', say(lang).failed(seen.label), 2500, () => settle($))
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
        await act($, 'wait', say(lang).approve)
      } catch {
        // A missed wave is no reason to drop the notification.
      }
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId !== undefined) return result
    isWorking = false
    lastTurnMs = e.durationMs
    void refreshUsage($, true)
    await arrangeCrew($)
    if (e.reason === 'aborted') {
      await act($, 'idle', say(lang).interrupted)
      return result
    }
    if (e.reason !== 'answer') {
      await act($, 'oops', say(lang).turnError)
      return result
    }
    await act($, 'wait', say(lang).yourTurn)
    if (settings.isAutoTodo && shouldExtract(e.answer)) {
      const answer = e.answer
      $.clock.after(50, () => void extractTodos($, answer))
    }
    return result
  })
}
