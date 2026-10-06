// Clawd's house: a cross-section of five rooms, after the pixel library
// OpenClaw's lobsters live in. The main Clawd walks to the room of whatever
// Claude is doing; three crew Clawds play in the game room (volleyball while
// Claude works; ping-pong, jump rope or a block tower while it waits; asleep
// under blankets at night) until a subagent calls one of them to work. The
// window shows the person's time of day.
//
// Pure drawing: the terminal client composes frames from it at its own frame
// rate, and scene-svg.ts turns the same frames into an animated SVG.

import type { Doing, Game, SceneActor, SceneProps, Theme, TimeOfDay } from '../types'
import { say, type Lang, type RoomId } from './i18n'
import { blank, C, FEET, FLOOR, px, rect, type Box, type Grid } from './pixels'
import { decorate, drawFalling } from './decor'
import { drawScene, THEMES } from './themes'

export type { Doing, Game, SceneActor, SceneProps, Theme, TimeOfDay }
export { blank, SCENE_PALETTE, SH, STEP, SW, type Box, type Grid } from './pixels'

/** How fast a Clawd walks, in pixels a second. */
export const SPEED = 30

// ── The zones every scene keeps ───────────────────────────────────────────

export const ROOMS = [
  { id: 'library', x: 2, w: 42 },
  { id: 'codelab', x: 46, w: 46 },
  { id: 'terminal', x: 94, w: 40 },
  { id: 'web', x: 136, w: 36 },
  { id: 'game', x: 174, w: 80 },
] as const

/** Where a Clawd stands for each errand: the left edge of his 16-pixel body. */
export const SPOT_X = {
  library: 15,
  board: 48,
  code: 68,
  bash: 99,
  web: 141,
  arcade: 187,
  pongL: 204,
  pongR: 238,
} as const

export type Spot = keyof typeof SPOT_X

// ── The game room ──────────────────────────────────────────────────────────

/** One player's place in a game: where he stands, what he does, his part. */
type Slot = { x: number; doing: Doing; role: string }

const ARCADE: Slot = { x: SPOT_X.arcade, doing: 'arcade', role: 'arcade' }
const PONG_L: Slot = { x: SPOT_X.pongL, doing: 'pong', role: 'L' }
const PONG_R: Slot = { x: SPOT_X.pongR, doing: 'pong', role: 'R' }

/** Each game's places for one, two and three free players. */
const LAYOUTS: Record<Game, readonly (readonly Slot[] | undefined)[]> = {
  pong: [[ARCADE], [PONG_L, PONG_R], [ARCADE, PONG_L, PONG_R]],
  volley: [
    [ARCADE],
    [
      { x: 196, doing: 'volley', role: 'L1' },
      { x: 234, doing: 'volley', role: 'R' },
    ],
    [
      { x: 188, doing: 'volley', role: 'L1' },
      { x: 203, doing: 'volley', role: 'L2' },
      { x: 234, doing: 'volley', role: 'R' },
    ],
  ],
  rope: [
    [ARCADE],
    undefined,
    [
      { x: 186, doing: 'turn', role: 'L' },
      { x: 212, doing: 'jump', role: 'J' },
      { x: 238, doing: 'turn', role: 'R' },
    ],
  ],
  tower: [
    [ARCADE],
    [
      { x: 202, doing: 'tower', role: 'L' },
      { x: 226, doing: 'tower', role: 'R' },
    ],
    [
      { x: 186, doing: 'clap', role: 'C' },
      { x: 202, doing: 'tower', role: 'L' },
      { x: 226, doing: 'tower', role: 'R' },
    ],
  ],
  sleep: [
    [{ x: 207, doing: 'sleep', role: 'S' }],
    [
      { x: 194, doing: 'sleep', role: 'S' },
      { x: 222, doing: 'sleep', role: 'S' },
    ],
    [
      { x: 186, doing: 'sleep', role: 'S' },
      { x: 207, doing: 'sleep', role: 'S' },
      { x: 228, doing: 'sleep', role: 'S' },
    ],
  ],
}

/** The places `game` gives `players` free crew; a game short of players falls back to ping-pong. */
export function layoutFor(game: Game, players: number): { game: Game; slots: readonly Slot[] } {
  if (players <= 0) return { game, slots: [] }
  const n = Math.min(3, players)
  const slots = LAYOUTS[game][n - 1]
  if (slots !== undefined) return { game, slots }
  return { game: 'pong', slots: LAYOUTS.pong[n - 1] ?? [] }
}

/** What the game room is playing right now, and whether every player has arrived. */
export type Play = { game: Game; slots: readonly Slot[]; isOn: boolean }

export function playOf(s: SceneProps, now: number): Play {
  const crew = s.actors.filter(a => a.cap !== null && a.agentKey === undefined)
  const { game, slots } = layoutFor(s.game, crew.length)
  const isOn =
    slots.length > 0 &&
    slots.every(slot => crew.some(a => a.toX === slot.x && a.doing === slot.doing && !isWalking(a, now)))
  return { game, slots, isOn }
}

const roleOf = (play: Play, a: SceneActor): string | undefined =>
  a.agentKey === undefined && a.cap !== null ? play.slots.find(s => s.x === a.toX && s.doing === a.doing)?.role : undefined

type Point = { x: number; y: number }

/** The volleyball at tick `t`, and who hits it when. */
function volley(play: Play, t: number): { ball: Point; hitter: string } {
  const by = (role: string): number => (play.slots.find(s => s.role === role)?.x ?? 0) + 7
  const legs =
    play.slots.length === 3
      ? [
          { from: 'R', to: 'L1', peak: 3 },
          { from: 'L1', to: 'L2', peak: 7 },
          { from: 'L2', to: 'R', peak: 3 },
        ]
      : [
          { from: 'L1', to: 'R', peak: 3 },
          { from: 'R', to: 'L1', peak: 3 },
        ]
  const span = 24 / legs.length
  const k = t % 24
  const leg = legs[Math.floor(k / span)] ?? legs[0]!
  const u = (k % span) / span
  const x0 = by(leg.from)
  const x1 = by(leg.to)
  return { ball: { x: Math.round(x0 + (x1 - x0) * u), y: Math.round(12 - (12 - leg.peak) * Math.sin(Math.PI * u)) }, hitter: leg.from }
}

const ROPE_MID = [6, 8, 13, 19, 24, 19, 13, 8]

function rope(g: Grid, t: number): void {
  const mid = ROPE_MID[t % 8] ?? 6
  let last: Point | undefined
  for (let x = 202; x <= 237; x++) {
    const u = (x - 202) / 35
    const y = Math.round(19 + (mid - 19) * 4 * u * (1 - u))
    if (last !== undefined) {
      const step = Math.sign(y - last.y)
      for (let yy = last.y; yy !== y; yy += step) px(g, x, yy, C.red)
    }
    px(g, x, y, C.red)
    last = { x, y }
  }
}

const BLOCKS = [C.red, C.yellow, C.blue, C.green, C.purple, C.pink]

function tower(g: Grid, t: number): void {
  const k = t % 48
  if (k >= 42) {
    ;[
      [208, 23],
      [213, 24],
      [221, 23],
      [227, 24],
      [216, 22],
      [233, 24],
    ].forEach(([x, y], i) => rect(g, x ?? 0, y ?? 0, i % 2 === 0 ? 4 : 5, 2, BLOCKS[i] ?? C.red))
    return
  }
  const count = Math.min(6, Math.floor(k / 6) + 1)
  for (let i = 0; i < count; i++) {
    const wobble = k >= 36 && i >= 3 ? (k % 2 === 0 ? -1 : 1) * (i - 2) : 0
    rect(g, 219 + wobble, 23 - i * 2, 6, 2, BLOCKS[i] ?? C.red)
  }
}

/** The games' own things: the table, the net and ball, the rope, the blocks, the mats. */
export function gameRoom(g: Grid, t: number, play: Play): void {
  switch (play.game) {
    case 'pong': {
      if (!play.slots.some(s => s.role === 'L')) break
      rect(g, 220, 18, 18, 1, C.table)
      rect(g, 220, 19, 18, 1, C.dark)
      rect(g, 228, 15, 1, 3, C.light)
      rect(g, 221, 20, 1, 5, C.dark)
      rect(g, 236, 20, 1, 5, C.dark)
      px(g, 220, 18, C.white)
      px(g, 237, 18, C.white)
      if (play.isOn) {
        const k = t % 16
        const u = (k % 8) / 8
        const from = k < 8 ? 219 : 238
        const to = k < 8 ? 238 : 219
        rect(g, Math.round(from + (to - from) * u), Math.round(16 - Math.sin(Math.PI * u) * 5), 2, 2, C.white)
      }
      break
    }
    case 'volley': {
      if (play.slots.length < 2) break
      rect(g, 220, 10, 1, 15, C.dark)
      rect(g, 219, 10, 3, 1, C.white)
      for (let y = 11; y < 16; y++) {
        px(g, 219, y, y % 2 === 0 ? C.net : C.light)
        px(g, 221, y, y % 2 === 1 ? C.net : C.light)
      }
      if (play.isOn) {
        const { ball } = volley(play, t)
        rect(g, ball.x, ball.y, 3, 3, C.white)
        px(g, ball.x + 1, ball.y, C.yellow)
        px(g, ball.x, ball.y + 2, C.blue)
      }
      break
    }
    case 'rope':
      if (play.isOn) rope(g, t)
      break
    case 'tower':
      if (play.slots.length >= 2) tower(g, play.isOn ? t : 0)
      break
    case 'sleep':
      play.slots.forEach((slot, i) => {
        rect(g, slot.x, 24, 16, 1, [C.sky, C.pink, C.green][i] ?? C.sky)
        rect(g, slot.x - 2, 22, 3, 2, C.white)
      })
      break
  }
}

/** Blankets go over the sleepers, drawn after them. */
export function blankets(g: Grid, play: Play, s: SceneProps, now: number): void {
  if (play.game !== 'sleep') return
  play.slots.forEach((slot, i) => {
    if (!s.actors.some(a => a.toX === slot.x && a.doing === 'sleep' && !isWalking(a, now))) return
    const color = [C.blue, C.purple, C.table][i] ?? C.blue
    rect(g, slot.x + 1, 20, 14, 4, color)
    for (let x = slot.x + 2; x < slot.x + 15; x += 3) px(g, x, 21, C.white)
  })
}

export type BackgroundOptions = {
  /** Draw the clouds into the window (the SVG moves its own instead). */
  hasClouds?: boolean
  /** Leave out the wallpaper stripes, roof tiles and floor seams: fewer runs for the terminal. */
  isPlain?: boolean
}

/** Everything but the Clawds at tick `t`: the scene, then the game being played. */
export function drawBackground(g: Grid, t: number, s: SceneProps, play: Play, options: BackgroundOptions = {}): void {
  const { hasClouds = true, isPlain = false } = options
  drawScene(g, t, s, { hasClouds, isPlain })
  decorate(g, t, s)
  gameRoom(g, t, play)
}

// ── The Clawds ─────────────────────────────────────────────────────────────

const CAP: Record<string, number> = { blue: C.blue, green: C.green, purple: C.purple }

/** Where an actor is at `now`: walking in a straight line at SPEED. */
export function actorX(actor: SceneActor, now: number): number {
  const distance = Math.abs(actor.toX - actor.fromX)
  if (distance === 0) return actor.toX
  const done = ((now - actor.departAt) / 1000) * SPEED
  if (done >= distance) return actor.toX
  if (done <= 0) return actor.fromX
  return Math.round(actor.fromX + Math.sign(actor.toX - actor.fromX) * done)
}

export const isWalking = (actor: SceneActor, now: number): boolean => actorX(actor, now) !== actor.toX

type Eyes = 'open' | 'blink' | 'happy' | 'closed' | 'up' | 'down' | 'wide'

type Arm = 'mid' | 'up' | 'low'

/** What a game asks of a player on top of his own pose: where to look, his arms, a jump. */
export type Mod = { look?: number; armL?: Arm; armR?: Arm; lift?: number; eyes?: Eyes; isSweating?: boolean; hasScarf?: boolean; hat?: 'santa' | 'witch'; isTired?: boolean }

/** A Clawd at the CLI banner's own size: 16 × 10, feet on the floor at FEET. */
export function drawClawd(g: Grid, x: number, t: number, doing: Doing | 'walk', cap: string | null, phase = 0, mod: Mod = {}): void {
  const k = t + phase
  let y = FEET - 9
  let eyes: Eyes = k % 48 === 7 ? 'blink' : 'open'
  let look = 0
  let armL: Arm = 'mid'
  let armR: Arm = 'mid'
  let legs: 'stand' | 'a' | 'b' = 'stand'
  let shake = 0
  switch (doing) {
    case 'walk':
      legs = k % 4 < 2 ? 'a' : 'b'
      if (legs === 'b') y -= 1
      break
    case 'read':
      eyes = 'down'
      break
    case 'think':
      eyes = 'up'
      look = 1
      break
    case 'code':
    case 'type':
      eyes = 'up'
      look = 1
      armL = k % 2 === 0 ? 'mid' : 'low'
      armR = k % 2 === 0 ? 'low' : 'mid'
      break
    case 'web':
      eyes = 'up'
      look = 1
      break
    case 'arcade':
      eyes = 'up'
      look = -1
      armL = k % 2 === 0 ? 'mid' : 'low'
      armR = k % 3 === 0 ? 'low' : 'mid'
      if (k % 8 < 1) y -= 1
      break
    case 'pong':
    case 'volley':
      armL = 'low'
      armR = 'low'
      break
    case 'turn':
    case 'jump':
    case 'tower':
      break
    case 'clap':
      eyes = 'happy'
      armL = k % 4 < 2 ? 'up' : 'mid'
      armR = k % 4 < 2 ? 'up' : 'mid'
      break
    case 'wait':
      armR = k % 4 < 2 ? 'up' : 'mid'
      if (k % 8 < 2) y -= 1
      break
    case 'sleep':
      eyes = 'closed'
      armL = 'low'
      armR = 'low'
      break
    case 'pin':
      armL = 'up'
      eyes = 'happy'
      look = -1
      break
    case 'panic':
      eyes = 'wide'
      shake = k % 2 === 0 ? -1 : 1
      armL = k % 2 === 0 ? 'up' : 'mid'
      armR = k % 2 === 0 ? 'mid' : 'up'
      break
    case 'quiz':
      armR = 'up'
      break
    case 'love':
    case 'cheer':
      eyes = 'happy'
      armL = 'up'
      armR = 'up'
      if (k % 6 < 2) y -= 2
      break
    case 'oops':
      eyes = k % 16 < 10 ? 'wide' : 'blink'
      armL = 'low'
      armR = 'low'
      break
    case 'ask':
      // Holds a sign up to the glass and taps it.
      eyes = 'wide'
      armL = 'up'
      armR = 'up'
      if (k % 8 < 2) y -= 1
      break
    case 'stamp':
      eyes = 'happy'
      armR = k % 8 < 4 ? 'up' : 'low'
      break
    case 'mail':
      eyes = 'happy'
      armR = k % 16 < 3 ? 'up' : 'mid'
      look = 1
      break
    case 'tidy':
      eyes = 'happy'
      armL = 'up'
      armR = 'up'
      if (k % 12 < 2) y -= 1
      break
    case 'idle':
      if (k % 48 >= 28 && k % 48 < 34) look = -1
      if (k % 48 >= 36 && k % 48 < 42) look = 1
      break
  }
  if (mod.look !== undefined) look = mod.look
  if (mod.armL !== undefined) armL = mod.armL
  if (mod.armR !== undefined) armR = mod.armR
  if (mod.eyes !== undefined) eyes = mod.eyes
  // Tired: heavy eyelids, the eyes open now and then.
  if (mod.isTired && (eyes === 'open' || eyes === 'up' || eyes === 'down') && k % 16 < 11) eyes = 'blink'
  const lift = mod.lift ?? 0
  y -= lift
  const bx = x + shake
  ;[3, 5, 10, 12].forEach((lx, i) => {
    const isLifted = lift > 0 || (legs === 'a' && i % 2 === 0) || (legs === 'b' && i % 2 === 1)
    rect(g, bx + lx, y + 8, 1, isLifted ? 1 : FEET - (y + 8) + 1, C.body)
  })
  rect(g, bx + 2, y, 12, 8, C.body)
  rect(g, bx + 3, y, 10, 1, C.highlight)
  rect(g, bx + 2, y + 7, 12, 1, C.shade)
  const arm = (ax: number, kind: Arm, out: number): void => {
    if (kind === 'mid') rect(g, ax, y + 4, 2, 2, C.body)
    if (kind === 'low') rect(g, ax, y + 5, 2, 2, C.body)
    if (kind === 'up') {
      rect(g, ax, y + 2, 2, 2, C.body)
      rect(g, ax + out, y, 2, 2, C.body)
    }
  }
  arm(bx, armL, -1)
  arm(bx + 14, armR, 1)
  for (const ex of [bx + 4 + look, bx + 11 + look]) {
    switch (eyes) {
      case 'open':
        rect(g, ex, y + 2, 1, 2, C.eye)
        break
      case 'blink':
        px(g, ex, y + 3, C.eye)
        break
      case 'up':
        rect(g, ex, y + 1, 1, 2, C.eye)
        break
      case 'down':
        rect(g, ex, y + 3, 1, 2, C.eye)
        break
      case 'happy':
        px(g, ex - 1, y + 3, C.eye)
        px(g, ex, y + 2, C.eye)
        px(g, ex + 1, y + 3, C.eye)
        break
      case 'closed':
        rect(g, ex - 1, y + 3, 3, 1, C.eye)
        break
      case 'wide':
        rect(g, ex - 1, y + 1, 2, 3, C.white)
        px(g, ex, y + 2, C.eye)
        break
    }
  }
  if (cap !== null) {
    const color = CAP[cap] ?? C.blue
    rect(g, bx + 3, y - 1, 10, 1, color)
    rect(g, bx + 5, y - 2, 6, 1, color)
    rect(g, bx + 7, y - 3, 2, 1, C.white)
  }
  if (mod.hasScarf) {
    rect(g, bx + 2, y + 6, 12, 1, C.red)
    px(g, bx + 5, y + 6, C.white)
    px(g, bx + 9, y + 6, C.white)
    rect(g, bx + 10, y + 7, 2, 2, C.red)
    px(g, bx + 10, y + 8, C.white)
  }
  if (mod.hat === 'santa') {
    rect(g, bx + 3, y - 1, 10, 1, C.white)
    rect(g, bx + 4, y - 2, 8, 1, C.red)
    rect(g, bx + 6, y - 3, 6, 1, C.red)
    rect(g, bx + 9, y - 4, 4, 1, C.red)
    px(g, bx + 13, y - 4, C.white)
    px(g, bx + 13, y - 3, C.white)
  } else if (mod.hat === 'witch') {
    rect(g, bx + 2, y - 1, 12, 1, C.witch)
    rect(g, bx + 5, y - 2, 6, 1, C.pumpkin)
    rect(g, bx + 6, y - 3, 4, 1, C.witch)
    rect(g, bx + 7, y - 4, 2, 1, C.witch)
    px(g, bx + 8, y - 5, C.witch)
  }
  drawProps(g, bx, y, k, doing)
  if (mod.isTired && doing !== 'sleep' && k % 48 >= 30 && k % 48 < 42) {
    const rise = Math.floor((k % 48 - 30) / 4)
    rect(g, bx + 15, y - 1 - rise, 2, 1, C.light)
    px(g, bx + 16, y - rise, C.light)
    rect(g, bx + 15, y + 1 - rise, 2, 1, C.light)
  }
  if (mod.isSweating && k % 24 < 9) {
    const drop = Math.floor((k % 24) / 3)
    px(g, bx + 15, y + 1 + drop, C.sweat)
    px(g, bx + 15, y + 2 + drop, C.sweat)
  }
}

/** A deadline under three days away makes the main Clawd sweat. */
export const isNervous = (s: SceneProps): boolean => s.urgency === 'near' || s.urgency === 'urgent'

/** What the date and the hour have the Clawds wear: scarves in winter, a hat for the main Clawd on holidays, tired eyes late in the five-hour window. */
export function outfitOf(a: SceneActor, s: SceneProps): Mod {
  const hat = a.cap !== null ? undefined : s.holiday === 'christmas' ? 'santa' : s.holiday === 'halloween' ? 'witch' : undefined
  return { hasScarf: s.season === 'winter', isTired: s.isTired, ...(hat === undefined ? {} : { hat }) }
}

function drawProps(g: Grid, x: number, y: number, k: number, doing: Doing | 'walk'): void {
  switch (doing) {
    case 'read':
      rect(g, x + 5, y + 5, 6, 3, C.white)
      rect(g, x + 7, y + 5, 2, 3, C.wood)
      if (k % 24 < 3) rect(g, x + 9 - (k % 24), y + 4, 1, 4, C.white)
      break
    case 'think': {
      const dots = Math.floor((k % 12) / 3)
      for (let i = 0; i < dots; i++) px(g, x + 14 + i * 2, y - 2, C.gray)
      break
    }
    case 'wait':
      if (k % 4 !== 3) {
        rect(g, x + 17, y - 6, 1, 3, C.red)
        px(g, x + 17, y - 2, C.red)
      }
      break
    case 'sleep': {
      const rise = (phase: number) => 6 - Math.floor(((k + phase) % 24) / 4)
      const a = rise(0)
      if (a >= -4) {
        rect(g, x + 15, y + a - 2, 3, 1, C.light)
        px(g, x + 16, y + a - 1, C.light)
        rect(g, x + 15, y + a, 3, 1, C.light)
      }
      break
    }
    case 'pin':
      if (k % 4 < 2) px(g, x - 2, y - 1, C.yellow)
      break
    case 'panic':
      rect(g, x + 17, y - 6, 1, 3, C.red)
      px(g, x + 17, y - 2, C.red)
      if (k % 3 !== 2) {
        px(g, x - 1 - (k % 3), y + 1 + (k % 3), C.sweat)
        px(g, x - 1 - (k % 3), y + 2 + (k % 3), C.sweat)
      }
      break
    case 'quiz':
      rect(g, x + 17, y - 6, 2, 1, C.yellow)
      px(g, x + 19, y - 5, C.yellow)
      px(g, x + 18, y - 4, C.yellow)
      px(g, x + 18, y - 2, C.yellow)
      break
    case 'love':
      for (const [dx, phase] of [[15, 0], [-3, 6]] as const) {
        const h = y + 2 - ((k + phase) % 12)
        if (h > -4) {
          px(g, x + dx, h, C.red)
          px(g, x + dx + 2, h, C.red)
          rect(g, x + dx, h + 1, 3, 1, C.red)
          px(g, x + dx + 1, h + 2, C.red)
        }
      }
      break
    case 'cheer':
      if (k % 2 === 0) {
        px(g, x - 2, y - 1, C.yellow)
        px(g, x + 17, y + 1, C.yellow)
      } else {
        px(g, x - 1, y + 2, C.yellow)
        px(g, x + 18, y - 1, C.yellow)
      }
      break
    case 'oops':
      if (k % 12 < 9) {
        px(g, x + 15, y + Math.floor((k % 12) / 3), C.sweat)
        px(g, x + 15, y + 1 + Math.floor((k % 12) / 3), C.sweat)
      }
      break
    case 'ask': {
      // A sign with a big "?", held up over his head.
      const top = y - 8 - (k % 8 < 2 ? 1 : 0)
      rect(g, x + 2, top, 12, 6, C.white)
      rect(g, x + 2, top + 6, 12, 1, C.light)
      rect(g, x + 7, top + 1, 2, 1, C.red)
      px(g, x + 9, top + 2, C.red)
      px(g, x + 8, top + 3, C.red)
      px(g, x + 8, top + 5, C.red)
      if (k % 8 < 2) {
        px(g, x - 2, top + 1, C.yellow)
        px(g, x + 17, top + 1, C.yellow)
      }
      break
    }
    case 'stamp': {
      // A form on the desk; the stamp comes down and leaves a red seal.
      rect(g, x + 16, y + 7, 7, 1, C.white)
      rect(g, x + 16, y + 6, 7, 1, C.light)
      const isDown = k % 8 >= 4
      const sy = isDown ? y + 3 : y - 1
      rect(g, x + 18, sy, 3, 1, C.wood)
      rect(g, x + 19, sy + 1, 1, 1, C.wood)
      rect(g, x + 17, sy + 2, 5, 1, C.red)
      if (isDown || k % 16 >= 8) rect(g, x + 18, y + 6, 3, 1, C.red)
      break
    }
    case 'mail': {
      // A sealed envelope off his hand, up and away.
      const p = k % 16
      if (p >= 2 && p < 14) {
        const ex = x + 15 + Math.floor((p - 2) * 0.55)
        const ey = y + 1 - Math.floor((p - 2) / 2)
        rect(g, ex, ey, 5, 3, C.white)
        px(g, ex + 1, ey, C.gray)
        px(g, ex + 2, ey + 1, C.gray)
        px(g, ex + 3, ey, C.gray)
        px(g, ex + 2, ey + 2, C.red)
      }
      break
    }
    case 'tidy': {
      // An armful of books, held high on the way back to the shelf.
      const top = y - 4 - (k % 12 < 2 ? 1 : 0)
      rect(g, x + 3, top, 10, 1, C.red)
      rect(g, x + 4, top + 1, 9, 1, C.blue)
      rect(g, x + 3, top + 2, 10, 1, C.green)
      rect(g, x + 4, top + 3, 8, 1, C.yellow)
      break
    }
    case 'pong':
    case 'arcade':
    case 'code':
    case 'type':
    case 'web':
    case 'idle':
    case 'walk':
    case 'volley':
    case 'turn':
    case 'jump':
    case 'tower':
    case 'clap':
      break
  }
}

/** What the game asks of `actor` at tick `t`: the rally, the rope, the tower. */
export function playPose(actor: SceneActor, t: number, play: Play): Mod {
  const role = roleOf(play, actor)
  if (role === undefined || !play.isOn) return {}
  const center = actor.toX + 8
  switch (play.game) {
    case 'pong': {
      if (role === 'arcade') return {}
      const k = t % 16
      const isSwing = role === 'L' ? k === 0 : k === 8
      return { look: k < 8 ? 1 : -1, ...(isSwing ? (role === 'L' ? { armR: 'up' as const } : { armL: 'up' as const }) : {}) }
    }
    case 'volley': {
      if (role === 'arcade') return {}
      const { ball, hitter } = volley(play, t)
      const span = 24 / (play.slots.length === 3 ? 3 : 2)
      const look = ball.x + 1 < center - 3 ? -1 : ball.x + 1 > center + 3 ? 1 : 0
      if (hitter === role && t % 24 % span <= 1) return { look, armL: 'up', armR: 'up', lift: 2 }
      return { look }
    }
    case 'rope': {
      const p = t % 8
      const arm: Arm = p === 7 || p <= 1 ? 'up' : p === 2 || p === 6 ? 'mid' : 'low'
      if (role === 'L') return { armR: arm, look: 1 }
      if (role === 'R') return { armL: arm, look: -1 }
      return p >= 3 && p <= 5 ? { lift: 3, eyes: 'happy', armL: 'up', armR: 'up' } : {}
    }
    case 'tower': {
      const k = t % 48
      if (role === 'C') {
        if (k >= 42) return { eyes: 'wide', armL: 'up', armR: 'up' }
        if (k >= 36) return { eyes: 'happy', armL: 'up', armR: 'up', lift: k % 2 }
        return {}
      }
      if (k >= 42) return { eyes: 'wide', look: role === 'L' ? 1 : -1 }
      const isPlacing = role === 'L' ? k % 12 <= 1 : k % 12 >= 6 && k % 12 <= 7
      if (!isPlacing) return { look: role === 'L' ? 1 : -1 }
      return role === 'L' ? { armR: 'up', look: 1 } : { armL: 'up', look: -1 }
    }
    case 'sleep':
      return {}
  }
}

export type ComposeOptions = BackgroundOptions & {
  /** The actor under the pointer: he hams it up. */
  hover?: string
}

/** The whole scene at tick `t`, wall-clock `now`. */
export function composeScene(s: SceneProps, t: number, now: number, options: ComposeOptions = {}): Grid {
  const g = blank()
  const play = playOf(s, now)
  drawBackground(g, t, s, play, options)
  const order = [...s.actors].sort((a, b) => Number(a.id === 'main') - Number(b.id === 'main'))
  order.forEach((actor, i) => {
    const x = actorX(actor, now)
    const doing = x !== actor.toX ? 'walk' : actor.id === options.hover ? 'love' : actor.doing
    const mod = doing === actor.doing ? playPose(actor, t, play) : {}
    drawClawd(g, x, t, doing, actor.cap, i * 3, { ...mod, ...outfitOf(actor, s), isSweating: actor.cap === null && isNervous(s) })
  })
  blankets(g, play, s, now)
  drawFalling(g, t, s)
  return g
}

// ── What the pointer finds ─────────────────────────────────────────────────

/** What hovering a Clawd says about him. */
export function actorTip(a: SceneActor, lang: Lang): string {
  const words = say(lang)
  const name = a.cap === null ? words.mainClawd : words.crewClawd(words.caps[a.cap] ?? '')
  if (a.agentKey !== undefined) return `${name} · ${words.forSubagent(a.label || words.gettingReady)}`
  if (a.cap === null) return `${name} · ${a.label || words.doings[a.doing]}`
  return `${name} · ${words.doings[a.doing]}`
}

export const BOARD: Box = { x: 48, y: 5, w: 16, h: 9 }
export const CALENDAR: Box = { x: 66, y: 4, w: 9, h: 8 }

const inside = (b: Box, x: number, y: number): boolean => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h

export type Hit = { kind: 'actor'; id: string } | { kind: 'board' } | { kind: 'calendar' } | { kind: 'memory' } | { kind: 'room'; id: string }

/** What is under scene pixel (x, y): a Clawd first (the main one on top), then the wall's things, then the room. */
export function hitTest(s: SceneProps, now: number, x: number, y: number): Hit | undefined {
  const order = [...s.actors].sort((a, b) => Number(b.id === 'main') - Number(a.id === 'main'))
  const actor = order.find(a => {
    const ax = actorX(a, now)
    return x >= ax && x < ax + 16 && y >= 11 && y <= FEET
  })
  if (actor !== undefined) return { kind: 'actor', id: actor.id }
  if (inside(BOARD, x, y)) return { kind: 'board' }
  if (inside(CALENDAR, x, y)) return { kind: 'calendar' }
  if (inside(THEMES[s.theme].memory.box, x, y)) return { kind: 'memory' }
  const room = ROOMS.find(r => x >= r.x && x < r.x + r.w && y >= 3 && y < FLOOR)
  return room === undefined ? undefined : { kind: 'room', id: room.id }
}

/** The line a hover shows. */
export function tipOf(s: SceneProps, hit: Hit): string {
  const words = say(s.lang)
  switch (hit.kind) {
    case 'actor': {
      const a = s.actors.find(one => one.id === hit.id)
      return a === undefined ? '' : actorTip(a, s.lang)
    }
    case 'board':
      return s.board.length === 0 ? words.boardEmpty : words.board(s.board)
    case 'calendar':
      return s.deadline === '' ? words.calendarEmpty : words.calendar(s.deadline)
    case 'memory':
      return words.memoryTip(s.theme, s.memory)
    case 'room': {
      const id = hit.id as RoomId
      return words.roomTip(words.rooms[s.theme][id], words.roomPurpose[id])
    }
  }
}
