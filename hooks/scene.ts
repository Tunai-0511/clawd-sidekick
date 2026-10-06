// Clawd's house: a cross-section of five rooms, after the pixel library
// OpenClaw's lobsters live in. The main Clawd walks to the room of whatever
// Claude is doing; three crew Clawds play in the game room (volleyball while
// Claude works; ping-pong, jump rope or a block tower while it waits; asleep
// under blankets at night) until a subagent calls one of them to work. The
// window shows the person's time of day.
//
// Pure drawing: the terminal client composes frames from it at its own frame
// rate, and scene-svg.ts turns the same frames into an animated SVG.

import type { Doing, Game, SceneActor, SceneProps, TimeOfDay } from '../types'
import { say, type Lang, type RoomId } from './i18n'

export type { Doing, Game, SceneActor, SceneProps, TimeOfDay }

export const SW = 256
export const SH = 28
/** Milliseconds a tick, eight frames a second. */
export const STEP = 125
/** How fast a Clawd walks, in pixels a second. */
export const SPEED = 30

const HEX = {
  roofEdge: '#4A2616',
  roof: '#8C4A2B',
  roofTile: '#A65A34',
  beam: '#5E3420',
  wall: '#F3E3C3',
  wallLine: '#E6D2AC',
  wallBlue: '#E4ECF2',
  wallBlueLine: '#D3DEE7',
  wallSlate: '#3B4250',
  wallSlateLine: '#343A47',
  wallSky: '#DDF0F7',
  wallSkyLine: '#CBE6F0',
  wallLilac: '#EADCF5',
  wallLilacLine: '#DCCAEC',
  wains: '#6E4630',
  wainsDark: '#8C5A3C',
  floorHi: '#C07A48',
  floor: '#A8693F',
  floorDark: '#6B3A22',
  wood: '#7A4A2E',
  woodLight: '#9C6238',
  body: '#D97757',
  shade: '#B4553A',
  highlight: '#EE9A78',
  eye: '#2A1A15',
  white: '#FFFFFF',
  pink: '#F6A5B8',
  red: '#E5484D',
  blue: '#4D8DF6',
  green: '#4CB363',
  purple: '#A98BF5',
  yellow: '#F5C542',
  sky: '#8ECDF5',
  dark: '#2E3138',
  screen: '#14201B',
  code: '#6EE7A0',
  steel: '#3A3F47',
  gray: '#8A8F98',
  light: '#C9CDD3',
  cork: '#B07A44',
  beige: '#D9CBB0',
  table: '#2F7D57',
  arcade: '#5B3FA8',
  sweat: '#7CC6F2',
  pageNear: '#FCE7A6',
  pageUrgent: '#F7B0B0',
  duskTop: '#E8836B',
  duskMid: '#F2A65A',
  duskLow: '#F6C77A',
  sunset: '#F0703C',
  night: '#1E2A4A',
  moon: '#F4E8B0',
  net: '#E8E8E8',
} as const

type Color = keyof typeof HEX

const NAMES = Object.keys(HEX) as Color[]

/** Palette index 0 is transparent; the rest follow HEX's order. */
export const SCENE_PALETTE: readonly string[] = ['', ...NAMES.map(name => HEX[name])]

const C = Object.fromEntries(NAMES.map((name, i) => [name, i + 1])) as Record<Color, number>

export type Grid = Uint8Array

export const blank = (): Grid => new Uint8Array(SW * SH)

function px(g: Grid, x: number, y: number, c: number): void {
  if (x >= 0 && x < SW && y >= 0 && y < SH) g[y * SW + x] = c
}

function rect(g: Grid, x: number, y: number, w: number, h: number, c: number): void {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(g, x + i, y + j, c)
}

const hash = (n: number): number => {
  let x = (n ^ 0x9e3779b9) >>> 0
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0
  return (x ^ (x >>> 16)) >>> 0
}

// ── The house ──────────────────────────────────────────────────────────────

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

const FLOOR = 25
const FEET = FLOOR - 1

const DIGITS = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001010010010', '111101111101111', '111101111001111']

function digit(g: Grid, x: number, y: number, d: number, c: number): void {
  const bits = DIGITS[d] ?? ''
  for (let i = 0; i < 15; i++) if (bits[i] === '1') px(g, x + (i % 3), y + Math.floor(i / 3), c)
}

function shell(g: Grid, isPlain: boolean): void {
  rect(g, 0, 0, SW, 1, C.roofEdge)
  rect(g, 0, 1, SW, 1, C.roof)
  if (!isPlain) for (let x = 0; x < SW; x += 4) px(g, x + 1, 1, C.roofTile)
  rect(g, 0, 2, SW, 1, C.beam)
  const tints: readonly (readonly [number, number])[] = [
    [C.wall, C.wallLine],
    [C.wallBlue, C.wallBlueLine],
    [C.wallSlate, C.wallSlateLine],
    [C.wallSky, C.wallSkyLine],
    [C.wallLilac, C.wallLilacLine],
  ]
  ROOMS.forEach((room, i) => {
    const [wall, line] = tints[i] ?? [C.wall, C.wallLine]
    rect(g, room.x, 3, room.w, 15, wall)
    if (!isPlain) for (let x = room.x + 4; x < room.x + room.w; x += 12) rect(g, x, 3, 1, 15, line)
  })
  rect(g, 0, 18, SW, 7, C.wains)
  rect(g, 0, 18, SW, 1, C.wainsDark)
  rect(g, 0, FLOOR, SW, 1, C.floorHi)
  rect(g, 0, FLOOR + 1, SW, 1, C.floor)
  if (!isPlain) for (let x = 5; x < SW; x += 11) px(g, x, FLOOR + 1, C.floorDark)
  rect(g, 0, FLOOR + 2, SW, 1, C.floorDark)
  rect(g, 0, 3, 2, 22, C.wood)
  rect(g, SW - 2, 3, 2, 22, C.wood)
  for (const room of ROOMS.slice(1)) {
    rect(g, room.x - 2, 3, 2, 10, C.wood)
    rect(g, room.x - 3, 12, 4, 1, C.beam)
  }
}

function library(g: Grid, s: SceneProps): void {
  for (const sx of [3, 30]) {
    rect(g, sx, 5, 12, 20, C.wood)
    for (const shelf of [5, 10, 15, 20]) {
      const top = shelf + 1
      rect(g, sx + 1, top, 10, shelf === 20 ? 3 : 4, C.woodLight)
      let bx = sx + 1
      while (bx < sx + 11) {
        const h = hash(bx * 31 + shelf)
        const width = 1 + (h % 2)
        const tall = (shelf === 20 ? 3 : 4) - ((h >> 3) % 2)
        const color = [C.red, C.blue, C.green, C.yellow, C.purple, C.beige][(h >> 5) % 6] ?? C.red
        rect(g, bx, top + (shelf === 20 ? 3 : 4) - tall, Math.min(width, sx + 11 - bx), tall, color)
        bx += width + ((h >> 8) % 3 === 0 ? 1 : 0)
      }
    }
  }
  rect(g, 18, 19, 11, 2, C.woodLight)
  rect(g, 18, 21, 1, 4, C.wood)
  rect(g, 28, 21, 1, 4, C.wood)
  if (s.time === 'night') {
    rect(g, 22, 14, 9, 1, C.pageNear)
    rect(g, 21, 17, 11, 1, C.pageNear)
    rect(g, 22, 18, 9, 1, C.pageNear)
  }
  rect(g, 25, 15, 3, 1, C.yellow)
  rect(g, 24, 16, 5, 1, C.yellow)
  rect(g, 26, 17, 1, 2, C.gray)
  rect(g, 20, 18, 4, 1, C.white)
}

function codelab(g: Grid, t: number, s: SceneProps): void {
  rect(g, 48, 5, 16, 9, C.wood)
  rect(g, 49, 6, 14, 7, C.cork)
  const colors = [C.yellow, C.pink, C.green, C.sky]
  for (let i = 0; i < Math.min(8, s.todos); i++) {
    const x = 50 + (i % 4) * 3
    const y = 7 + Math.floor(i / 4) * 3
    rect(g, x, y, 2, 2, colors[i % 4] ?? C.yellow)
    px(g, x, y, C.red)
  }
  const page = s.urgency === 'urgent' ? C.pageUrgent : s.urgency === 'near' ? C.pageNear : C.white
  const isBlinkOff = s.urgency === 'urgent' && t % 4 >= 2
  rect(g, 66, 4, 9, 2, isBlinkOff ? C.wood : C.red)
  rect(g, 66, 6, 9, 6, page)
  if (s.days === null) {
    rect(g, 67, 8, 3, 1, C.gray)
    rect(g, 71, 8, 3, 1, C.gray)
  } else {
    const days = Math.max(0, Math.min(99, s.days))
    digit(g, 67, 6, Math.floor(days / 10), C.eye)
    digit(g, 71, 6, days % 10, C.eye)
  }
  rect(g, 70, 18, 21, 2, C.woodLight)
  rect(g, 71, 20, 1, 5, C.wood)
  rect(g, 89, 20, 1, 5, C.wood)
  rect(g, 76, 9, 12, 8, C.dark)
  rect(g, 77, 10, 10, 6, C.screen)
  const lengths = [6, 3, 8, 5, 2, 7, 4, 9]
  const palette = [C.code, C.white, C.purple, C.code]
  for (let row = 0; row < 3; row++) {
    const n = (row + Math.floor(t / 2)) % lengths.length
    rect(g, 78 + (n % 2), 10 + row * 2, lengths[n] ?? 4, 1, palette[n % 4] ?? C.code)
  }
  rect(g, 81, 17, 2, 1, C.dark)
  rect(g, 47, 21, 4, 4, C.shade)
  rect(g, 46, 18, 6, 3, C.green)
  px(g, 48, 17, C.green)
}

function terminal(g: Grid, t: number): void {
  rect(g, 120, 6, 12, 19, C.steel)
  for (let slot = 0; slot < 5; slot++) {
    const y = 8 + slot * 3
    rect(g, 121, y, 10, 2, C.dark)
    for (let led = 0; led < 3; led++) {
      const on = hash(slot * 7 + led + (Math.floor(t / 2) % 8) * 13) % 3 !== 0
      px(g, 122 + led * 2, y, on ? ([C.code, C.yellow, C.red][led] ?? C.code) : C.gray)
    }
  }
  rect(g, 95, 19, 19, 2, C.woodLight)
  rect(g, 96, 21, 1, 4, C.wood)
  rect(g, 112, 21, 1, 4, C.wood)
  rect(g, 98, 10, 12, 9, C.beige)
  rect(g, 99, 11, 10, 6, C.screen)
  rect(g, 100, 12, 6, 1, C.code)
  rect(g, 100, 14, 4, 1, C.code)
  px(g, 100, 16, C.code)
  if (t % 4 < 2) rect(g, 102, 16, 2, 1, C.code)
}

const STARS: readonly (readonly [number, number])[] = [
  [143, 7],
  [147, 12],
  [150, 8],
  [156, 7],
  [159, 13],
  [165, 12],
]

function web(g: Grid, t: number, s: SceneProps, hasClouds: boolean): void {
  rect(g, 140, 5, 28, 11, C.wood)
  if (s.time === 'night') {
    rect(g, 141, 6, 26, 9, C.night)
    rect(g, 162, 7, 3, 3, C.moon)
    px(g, 162, 7, C.night)
    px(g, 162, 8, C.night)
    STARS.forEach(([x, y], i) => {
      if (hash(i * 11 + (Math.floor(t / 3) % 8)) % 3 !== 0) px(g, x, y, C.white)
    })
  } else if (s.time === 'dusk') {
    rect(g, 141, 6, 26, 3, C.duskTop)
    rect(g, 141, 9, 26, 3, C.duskMid)
    rect(g, 141, 12, 26, 3, C.duskLow)
    rect(g, 161, 11, 4, 2, C.sunset)
    rect(g, 162, 10, 2, 1, C.sunset)
  } else {
    rect(g, 141, 6, 26, 9, C.sky)
    rect(g, 163, 7, 3, 3, C.yellow)
  }
  for (const [phase, y] of hasClouds && s.time !== 'night' ? ([[0, 8], [13, 11]] as const) : []) {
    const cx = 141 + ((Math.floor(t / 3) + phase) % 30) - 4
    for (let i = 0; i < 6; i++) if (cx + i > 140 && cx + i < 167) px(g, cx + i, y, C.white)
    for (let i = 1; i < 4; i++) if (cx + i > 140 && cx + i < 167) px(g, cx + i, y - 1, C.white)
  }
  rect(g, 153, 6, 1, 9, C.wood)
  rect(g, 141, 10, 26, 1, C.wood)
  const globe = ['..###..', '.#####.', '#######', '#######', '.#####.', '..###..']
  globe.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      if (row[i] !== '#') continue
      const isLand = (hash(((i + Math.floor(t / 2)) % 9) * 5 + j) & 3) === 0
      px(g, 160 + i, 16 + j, isLand ? C.green : C.blue)
    }
  })
  rect(g, 163, 22, 1, 2, C.gray)
  rect(g, 161, 24, 5, 1, C.wood)
}

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

function gameRoom(g: Grid, t: number, play: Play): void {
  rect(g, 176, 7, 10, 18, C.arcade)
  rect(g, 177, 9, 8, 6, C.dark)
  const invader = ['.#..#.', '######', '#.##.#']
  const hue = [C.code, C.pink, C.yellow, C.sky][Math.floor(t / 2) % 4] ?? C.code
  invader.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) if (row[i] === '#') px(g, 178 + i, 10 + j + (t % 4 < 2 ? 0 : 1), hue)
  })
  rect(g, 176, 16, 10, 2, C.steel)
  px(g, 178, 15, C.red)
  px(g, 182, 16, C.yellow)
  px(g, 184, 16, C.sky)
  for (let x = 189; x < 252; x += 5) {
    const color = [C.red, C.yellow, C.blue, C.green][((x - 189) / 5) % 4] ?? C.red
    rect(g, x, 4, 3, 1, color)
    px(g, x + 1, 5, color)
  }
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
function blankets(g: Grid, play: Play, s: SceneProps, now: number): void {
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

/** Everything but the Clawds at tick `t`. */
export function drawBackground(g: Grid, t: number, s: SceneProps, play: Play, options: BackgroundOptions = {}): void {
  const { hasClouds = true, isPlain = false } = options
  shell(g, isPlain)
  library(g, s)
  codelab(g, t, s)
  terminal(g, t)
  web(g, t, s, hasClouds)
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
export type Mod = { look?: number; armL?: Arm; armR?: Arm; lift?: number; eyes?: Eyes; isSweating?: boolean }

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
    case 'idle':
      if (k % 48 >= 28 && k % 48 < 34) look = -1
      if (k % 48 >= 36 && k % 48 < 42) look = 1
      break
  }
  if (mod.look !== undefined) look = mod.look
  if (mod.armL !== undefined) armL = mod.armL
  if (mod.armR !== undefined) armR = mod.armR
  if (mod.eyes !== undefined) eyes = mod.eyes
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
  drawProps(g, bx, y, k, doing)
  if (mod.isSweating && k % 24 < 9) {
    const drop = Math.floor((k % 24) / 3)
    px(g, bx + 15, y + 1 + drop, C.sweat)
    px(g, bx + 15, y + 2 + drop, C.sweat)
  }
}

/** A deadline under three days away makes the main Clawd sweat. */
export const isNervous = (s: SceneProps): boolean => s.urgency === 'near' || s.urgency === 'urgent'

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
    drawClawd(g, x, t, doing, actor.cap, i * 3, { ...mod, isSweating: actor.cap === null && isNervous(s) })
  })
  blankets(g, play, s, now)
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
export const LAMP: Box = { x: 23, y: 14, w: 7, h: 5 }
export const ARCADE_BOX: Box = { x: 176, y: 7, w: 10, h: 18 }

export type Box = { x: number; y: number; w: number; h: number }

const inside = (b: Box, x: number, y: number): boolean => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h

export type Hit = { kind: 'actor'; id: string } | { kind: 'board' } | { kind: 'calendar' } | { kind: 'room'; id: string }

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
    case 'room':
      return words.roomTips[hit.id as RoomId] ?? ''
  }
}
