// The scenes Clawd can live in: the house, the beach, the space station and
// the forest camp. Every one keeps the same five zones at the same places
// (scene.ts's ROOMS and SPOT_X), the board and the calendar where the
// pointer looks for them, and the screen and terminal the animations know,
// so the Clawds behave the same anywhere; only what is around them changes.

import type { SceneProps, Theme } from '../types'
import { blank, C, digit, hash, px, rect, stamp, SW, type Box, type Grid } from './pixels'

export type Part = Box & { ticks: number }

export type ThemeArt = {
  /** Everything but the game-room games and the Clawds at tick `t`. */
  draw: (g: Grid, t: number, s: SceneProps, options: { hasClouds: boolean; isPlain: boolean }) => void
  /** The boxes that move, each with the ticks it loops over (all divide 48). */
  parts: readonly Part[]
  /** What lights up under the pointer, as SVG drawn over the scene. */
  light: { box: Box; glow: string }
  /** What says hi under the pointer. */
  toy: { box: Box; hi: string }
  /** The SVG's drifting clouds: the sky they cross, or none. */
  sky: Box | null
  /** How the room names are lettered. */
  signs: { fill: string; stroke: string; y: number }
}

const ROOM_EDGES = [46, 94, 136, 174] as const

// ── Furniture every scene shares ───────────────────────────────────────────

/** The board your to-dos are pinned to: 16 × 9 at (48, 5). */
function noticeBoard(g: Grid, s: SceneProps, frame: number, surface: number): void {
  rect(g, 48, 5, 16, 9, frame)
  rect(g, 49, 6, 14, 7, surface)
  const colors = [C.yellow, C.pink, C.green, C.sky]
  for (let i = 0; i < Math.min(8, s.todos); i++) {
    const x = 50 + (i % 4) * 3
    const y = 7 + Math.floor(i / 4) * 3
    rect(g, x, y, 2, 2, colors[i % 4] ?? C.yellow)
    px(g, x, y, C.red)
  }
}

/** The calendar counting down to the next deadline: 9 × 8 at (66, 4). */
function calendar(g: Grid, t: number, s: SceneProps, style: { header: number; page: number | null; ink: number; off: number }): void {
  const page = style.page ?? (s.urgency === 'urgent' ? C.pageUrgent : s.urgency === 'near' ? C.pageNear : C.white)
  const isBlinkOff = s.urgency === 'urgent' && t % 4 >= 2
  rect(g, 66, 4, 9, 2, isBlinkOff ? style.off : style.header)
  rect(g, 66, 6, 9, 6, page)
  if (s.days === null) {
    rect(g, 67, 8, 3, 1, C.gray)
    rect(g, 71, 8, 3, 1, C.gray)
    return
  }
  const days = Math.max(0, Math.min(99, s.days))
  digit(g, 67, 6, Math.floor(days / 10), style.ink)
  digit(g, 71, 6, days % 10, style.ink)
}

/** The screen Claude's code scrolls on: 12 × 8 at (76, 9). */
function monitor(g: Grid, t: number, frame: number, hasStand: boolean): void {
  rect(g, 76, 9, 12, 8, frame)
  rect(g, 77, 10, 10, 6, C.screen)
  const lengths = [6, 3, 8, 5, 2, 7, 4, 9]
  const palette = [C.code, C.white, C.purple, C.code]
  for (let row = 0; row < 3; row++) {
    const n = (row + Math.floor(t / 2)) % lengths.length
    rect(g, 78 + (n % 2), 10 + row * 2, lengths[n] ?? 4, 1, palette[n % 4] ?? C.code)
  }
  if (hasStand) rect(g, 81, 17, 2, 1, frame)
  else rect(g, 75, 17, 14, 1, C.light)
}

/** The desk the screen stands on. */
function desk(g: Grid, top: number, leg: number): void {
  rect(g, 70, 18, 21, 2, top)
  rect(g, 71, 20, 1, 5, leg)
  rect(g, 89, 20, 1, 5, leg)
}

/** The terminal commands run on, with its blinking cursor: 12 × 9 at (98, 10). */
function terminalBox(g: Grid, t: number, casing: number): void {
  rect(g, 95, 19, 19, 2, C.woodLight)
  rect(g, 96, 21, 1, 4, C.wood)
  rect(g, 112, 21, 1, 4, C.wood)
  rect(g, 98, 10, 12, 9, casing)
  rect(g, 99, 11, 10, 6, C.screen)
  rect(g, 100, 12, 6, 1, C.code)
  rect(g, 100, 14, 4, 1, C.code)
  px(g, 100, 16, C.code)
  if (t % 4 < 2) rect(g, 102, 16, 2, 1, C.code)
}

/** An arcade cabinet, its invader changing colour: 10 × 18 at (176, 7). */
function arcadeCabinet(g: Grid, t: number, body: number, trim: number): void {
  rect(g, 176, 7, 10, 18, body)
  rect(g, 177, 9, 8, 6, C.dark)
  const invader = ['.#..#.', '######', '#.##.#']
  const hue = [C.code, C.pink, C.yellow, C.sky][Math.floor(t / 2) % 4] ?? C.code
  invader.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) if (row[i] === '#') px(g, 178 + i, 10 + j + (t % 4 < 2 ? 0 : 1), hue)
  })
  rect(g, 176, 16, 10, 2, trim)
  px(g, 178, 15, C.red)
  px(g, 182, 16, C.yellow)
  px(g, 184, 16, C.sky)
}

function bunting(g: Grid, from: number, to: number): void {
  for (let x = from; x < to; x += 5) {
    const color = [C.red, C.yellow, C.blue, C.green][((x - from) / 5) % 4] ?? C.red
    rect(g, x, 4, 3, 1, color)
    px(g, x + 1, 5, color)
  }
}

const GLOBE = ['..###..', '.#####.', '#######', '#######', '.#####.', '..###..']

/** A round thing whose surface turns: a globe, a planet, a beach ball. */
function spinner(g: Grid, x: number, y: number, t: number, colors: (column: number, row: number) => number): void {
  GLOBE.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) if (row[i] === '#') px(g, x + i, y + j, colors((i + Math.floor(t / 2)) % 8, j))
  })
}

const STARS: readonly (readonly [number, number])[] = Array.from({ length: 24 }, (_, i) => [hash(i * 7 + 3) % SW, 1 + (hash(i * 13 + 5) % 11)] as const)

/** The sky's three bands, top to bottom, by time of day and weather. */
function skyBands(s: SceneProps): readonly number[] {
  const isGray = s.weather !== 'clear'
  if (s.time === 'night') return isGray ? [C.nightTop, C.nightCloud, C.nightCloud] : [C.nightTop, C.night, C.nightLow]
  if (s.weather === 'storm') return [C.stormTop, C.storm, C.stormLow]
  if (isGray) return [C.overcastTop, C.overcast, C.overcastLow]
  return s.time === 'dusk' ? [C.duskTop, C.duskMid, C.duskLow] : [C.skyTop, C.sky, C.skyLow]
}

/** An open sky by the person's time of day and weather: bands, then sun or moon and stars when it is clear. */
function outdoorSky(g: Grid, t: number, s: SceneProps, bottom: number, sunX: number): void {
  const third = Math.ceil(bottom / 3)
  skyBands(s).forEach((color, i) => rect(g, 0, i * third, SW, Math.min(third, bottom - i * third), color))
  if (s.weather !== 'clear') return
  if (s.time === 'night') {
    STARS.forEach(([x, y], i) => {
      if (y < bottom - 2 && hash(i * 11 + (Math.floor(t / 3) % 8)) % 3 !== 0) px(g, x, y, C.white)
    })
    rect(g, sunX, 2, 3, 3, C.moon)
    px(g, sunX, 2, C.nightTop)
    px(g, sunX, 3, C.nightTop)
  } else if (s.time === 'dusk') {
    rect(g, sunX - 40, bottom - 3, 6, 3, C.sunset)
    rect(g, sunX - 39, bottom - 4, 4, 1, C.sunset)
  } else {
    rect(g, sunX, 2, 4, 4, C.yellow)
  }
}

/** Clouds drawn into the sky, for the terminal (the SVG moves its own). */
function driftingClouds(g: Grid, t: number, s: SceneProps, rows: readonly number[]): void {
  if (s.time === 'night' || (s.weather !== 'clear' && s.weather !== 'cloudy')) return
  rows.forEach((y, i) => {
    const x = ((Math.floor(t / 4) + i * 97) % 300) - 20
    rect(g, x, y, 7, 1, C.white)
    rect(g, x + 1, y - 1, 4, 1, C.white)
  })
}

// ── The house ─────────────────────────────────────────────────────────────

function house(g: Grid, t: number, s: SceneProps, o: { hasClouds: boolean; isPlain: boolean }): void {
  rect(g, 0, 0, SW, 1, C.roofEdge)
  rect(g, 0, 1, SW, 1, C.roof)
  if (!o.isPlain) for (let x = 0; x < SW; x += 4) px(g, x + 1, 1, C.roofTile)
  rect(g, 0, 2, SW, 1, C.beam)
  const tints = [
    [C.wall, C.wallLine, 2, 42],
    [C.wallBlue, C.wallBlueLine, 46, 46],
    [C.wallSlate, C.wallSlateLine, 94, 40],
    [C.wallSky, C.wallSkyLine, 136, 36],
    [C.wallLilac, C.wallLilacLine, 174, 80],
  ] as const
  for (const [wall, line, x, w] of tints) {
    rect(g, x, 3, w, 15, wall)
    if (!o.isPlain) for (let lx = x + 4; lx < x + w; lx += 12) rect(g, lx, 3, 1, 15, line)
  }
  rect(g, 0, 18, SW, 7, C.wains)
  rect(g, 0, 18, SW, 1, C.wainsDark)
  rect(g, 0, 25, SW, 1, C.floorHi)
  rect(g, 0, 26, SW, 1, C.floor)
  if (!o.isPlain) for (let x = 5; x < SW; x += 11) px(g, x, 26, C.floorDark)
  rect(g, 0, 27, SW, 1, C.floorDark)
  rect(g, 0, 3, 2, 22, C.wood)
  rect(g, SW - 2, 3, 2, 22, C.wood)
  for (const edge of ROOM_EDGES) {
    rect(g, edge - 2, 3, 2, 10, C.wood)
    rect(g, edge - 3, 12, 4, 1, C.beam)
  }
  // Library
  for (const sx of [3, 30]) {
    rect(g, sx, 5, 12, 20, C.wood)
    for (const shelf of [5, 10, 15, 20]) {
      const top = shelf + 1
      const height = shelf === 20 ? 3 : 4
      rect(g, sx + 1, top, 10, height, C.woodLight)
      let bx = sx + 1
      while (bx < sx + 11) {
        const h = hash(bx * 31 + shelf)
        const width = 1 + (h % 2)
        const tall = height - ((h >> 3) % 2)
        const color = [C.red, C.blue, C.green, C.yellow, C.purple, C.beige][(h >> 5) % 6] ?? C.red
        rect(g, bx, top + height - tall, Math.min(width, sx + 11 - bx), tall, color)
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
  // Workshop
  noticeBoard(g, s, C.wood, C.cork)
  calendar(g, t, s, { header: C.red, page: null, ink: C.eye, off: C.wood })
  desk(g, C.woodLight, C.wood)
  monitor(g, t, C.dark, true)
  rect(g, 47, 21, 4, 4, C.shade)
  rect(g, 46, 18, 6, 3, C.green)
  px(g, 48, 17, C.green)
  // Server room
  rect(g, 120, 6, 12, 19, C.steel)
  for (let slot = 0; slot < 5; slot++) {
    const y = 8 + slot * 3
    rect(g, 121, y, 10, 2, C.dark)
    for (let led = 0; led < 3; led++) {
      const isOn = hash(slot * 7 + led + (Math.floor(t / 2) % 8) * 13) % 3 !== 0
      px(g, 122 + led * 2, y, isOn ? ([C.code, C.yellow, C.red][led] ?? C.code) : C.gray)
    }
  }
  terminalBox(g, t, C.beige)
  // Lookout
  rect(g, 140, 5, 28, 11, C.wood)
  if (s.weather !== 'clear') {
    skyBands(s).forEach((color, i) => rect(g, 141, 6 + i * 3, 26, 3, color))
  } else if (s.time === 'night') {
    rect(g, 141, 6, 26, 9, C.night)
    rect(g, 162, 7, 3, 3, C.moon)
    px(g, 162, 7, C.night)
    px(g, 162, 8, C.night)
    STARS.slice(0, 6).forEach(([x, y], i) => {
      if (hash(i * 11 + (Math.floor(t / 3) % 8)) % 3 !== 0) px(g, 141 + (x % 26), 6 + (y % 9), C.white)
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
  if (o.hasClouds && s.time !== 'night' && s.weather === 'clear') {
    for (const [phase, y] of [
      [0, 8],
      [13, 11],
    ] as const) {
      const cx = 141 + ((Math.floor(t / 3) + phase) % 30) - 4
      for (let i = 0; i < 6; i++) if (cx + i > 140 && cx + i < 167) px(g, cx + i, y, C.white)
      for (let i = 1; i < 4; i++) if (cx + i > 140 && cx + i < 167) px(g, cx + i, y - 1, C.white)
    }
  }
  rect(g, 153, 6, 1, 9, C.wood)
  rect(g, 141, 10, 26, 1, C.wood)
  spinner(g, 160, 16, t, (column, row) => ((hash(column * 5 + row) & 3) === 0 ? C.green : C.blue))
  rect(g, 163, 22, 1, 2, C.gray)
  rect(g, 161, 24, 5, 1, C.wood)
  // Game room
  arcadeCabinet(g, t, C.arcade, C.steel)
  bunting(g, 189, 252)
}

// ── The beach ─────────────────────────────────────────────────────────────

function beach(g: Grid, t: number, s: SceneProps, o: { hasClouds: boolean; isPlain: boolean }): void {
  outdoorSky(g, t, s, 15, 226)
  if (o.hasClouds) driftingClouds(g, t, s, [4, 7, 10])
  // The lighthouse on its rock, out at sea
  rect(g, 155, 13, 14, 2, C.rock)
  rect(g, 157, 12, 9, 1, C.rock)
  for (let y = 5; y < 12; y++) rect(g, 159, y, 4, 1, Math.floor((y - 5) / 2) % 2 === 0 ? C.white : C.red)
  rect(g, 158, 3, 6, 2, s.time === 'night' && t % 8 >= 4 ? C.ember : C.yellow)
  rect(g, 158, 2, 6, 1, C.red)
  rect(g, 160, 1, 2, 1, C.red)
  // The sea, its waves, the shore
  const sea = s.time === 'night' ? C.seaNight : s.weather !== 'clear' ? C.seaGray : s.time === 'dusk' ? C.seaDusk : C.sea
  rect(g, 0, 15, SW, 5, sea)
  rect(g, 0, 15, SW, 1, s.time === 'night' ? C.nightLow : C.seaDeep)
  for (let i = 0; i < 8; i++) rect(g, i * 32 + (Math.floor(t / 2) % 8) * 4, 16 + (i % 2) * 2, 3, 1, C.foam)
  rect(g, 0, 20, SW, 8, C.sand)
  rect(g, 0, 20, SW, 1, C.sandWet)
  for (let x = 0; x < SW; x++) if (hash(Math.floor(x / 5)) % 3 === 0) px(g, x, 20, C.foam)
  if (!o.isPlain) for (let i = 0; i < 70; i++) px(g, hash(i * 3 + 1) % SW, 22 + (hash(i * 5 + 2) % 6), C.sandDot)
  // The umbrella, the deck chair, a bucket and spade
  rect(g, 21, 6, 1, 19, C.palm)
  for (const [y, from, to] of [
    [4, 15, 27],
    [5, 13, 29],
    [6, 12, 30],
  ] as const) {
    for (let x = from; x <= to; x++) px(g, x, y, Math.floor((x - 12) / 3) % 2 === 0 ? C.red : C.white)
  }
  for (let x = 12; x <= 30; x++) if ((x - 12) % 3 !== 2) px(g, x, 7, Math.floor((x - 12) / 3) % 2 === 0 ? C.red : C.white)
  rect(g, 27, 21, 9, 1, C.blue)
  rect(g, 34, 16, 2, 5, C.blue)
  rect(g, 34, 17, 2, 1, C.white)
  rect(g, 34, 19, 2, 1, C.white)
  rect(g, 28, 22, 1, 3, C.gray)
  rect(g, 35, 22, 1, 3, C.gray)
  rect(g, 5, 21, 4, 3, C.red)
  rect(g, 5, 20, 4, 1, C.yellow)
  rect(g, 10, 19, 1, 5, C.gray)
  // The beach desk: the board on posts, the calendar on its own post, a laptop on the cooler
  rect(g, 49, 14, 1, 11, C.wood)
  rect(g, 62, 14, 1, 11, C.wood)
  noticeBoard(g, s, C.wood, C.cork)
  rect(g, 70, 12, 1, 13, C.wood)
  calendar(g, t, s, { header: C.red, page: null, ink: C.eye, off: C.wood })
  rect(g, 70, 19, 21, 6, C.blue)
  rect(g, 70, 19, 21, 1, C.white)
  rect(g, 78, 21, 5, 1, C.white)
  monitor(g, t, C.dark, false)
  // The lifeguard tower and its radio
  terminalBox(g, t, C.beige)
  rect(g, 116, 9, 17, 2, C.woodLight)
  rect(g, 117, 11, 1, 14, C.wood)
  rect(g, 131, 11, 1, 14, C.wood)
  for (let i = 0; i < 13; i++) {
    px(g, 118 + i, 12 + i, C.wood)
    px(g, 130 - i, 12 + i, C.wood)
  }
  rect(g, 121, 5, 6, 3, C.red)
  rect(g, 121, 8, 7, 1, C.red)
  rect(g, 132, 1, 1, 8, C.gray)
  if (t % 4 < 2) rect(g, 126, 1, 6, 3, C.red)
  else rect(g, 127, 2, 5, 3, C.red)
  px(g, 129, 2, C.white)
  // A telescope on its tripod, and a beach ball
  for (let i = 0; i < 9; i++) {
    px(g, 146 - Math.floor(i / 2), 16 + i, C.gray)
    px(g, 146 + Math.floor(i / 2), 16 + i, C.gray)
    px(g, 146, 16 + i, C.gray)
  }
  rect(g, 142, 15, 3, 1, C.light)
  rect(g, 144, 14, 3, 1, C.light)
  rect(g, 146, 13, 3, 1, C.light)
  rect(g, 148, 12, 2, 1, C.light)
  spinner(g, 160, 18, t, column => [C.red, C.white, C.blue, C.yellow][column >> 1] ?? C.white)
  // The sandcastle, its flag, the palm
  rect(g, 175, 20, 12, 5, C.sandWet)
  rect(g, 176, 15, 3, 5, C.sandWet)
  rect(g, 183, 15, 3, 5, C.sandWet)
  rect(g, 179, 13, 4, 7, C.sandDot)
  for (const [x, y] of [
    [176, 14],
    [178, 14],
    [183, 14],
    [185, 14],
    [179, 12],
    [182, 12],
  ] as const)
    px(g, x, y, C.sandWet)
  rect(g, 180, 22, 2, 3, C.tentDoor)
  rect(g, 181, 8, 1, 4, C.wood)
  rect(g, 182, t % 4 < 2 ? 8 : 9, 3, 2, C.red)
  for (let i = 0; i < 19; i++) rect(g, 251 - Math.floor(i / 6), 24 - i, 2, 1, C.palm)
  stamp(g, 240, 1, ['....LLLL..LLL...', '..LLLLDLLLDLLLL.', '.LLDD.LLLL.DDLLL', 'LD.....LL.....DL', '.......D........'], { L: C.leaf, D: C.leafDark })
  bunting(g, 189, 240)
}

// ── The space station ─────────────────────────────────────────────────────

function space(g: Grid, t: number, s: SceneProps, o: { hasClouds: boolean; isPlain: boolean }): void {
  rect(g, 0, 0, SW, 1, C.hullLine)
  rect(g, 0, 1, SW, 1, C.hull)
  if (!o.isPlain) for (let x = 3; x < SW; x += 8) px(g, x, 1, C.metalLight)
  rect(g, 0, 2, SW, 1, C.hullLine)
  rect(g, 0, 3, SW, 22, C.panel)
  if (!o.isPlain) {
    for (let x = 8; x < SW; x += 16) rect(g, x, 3, 1, 22, C.panelLine)
    rect(g, 0, 13, SW, 1, C.panelLine)
  }
  ;[
    [2, 42, C.cyan],
    [46, 46, C.magenta],
    [94, 40, C.yellow],
    [136, 36, C.teal],
    [174, 80, C.purple],
  ].forEach(([x, w, color]) => rect(g, x ?? 0, 3, w ?? 0, 1, color ?? C.cyan))
  rect(g, 0, 25, SW, 1, C.metalLight)
  rect(g, 0, 26, SW, 1, C.metal)
  if (!o.isPlain) for (let x = 2; x < SW; x += 4) px(g, x, 26, C.hull)
  rect(g, 0, 27, SW, 1, C.hull)
  rect(g, 0, 3, 2, 22, C.metal)
  rect(g, SW - 2, 3, 2, 22, C.metal)
  for (const edge of ROOM_EDGES) {
    rect(g, edge - 2, 3, 2, 10, C.metal)
    rect(g, edge - 3, 12, 4, 1, C.metalLight)
  }
  // Archive pod: racks of data crystals, a desk, a holo-lamp
  const crystals = [C.cyan, C.magenta, C.yellow, C.teal]
  for (const sx of [3, 30]) {
    rect(g, sx, 5, 12, 20, C.metal)
    ;[6, 11, 16, 21].forEach((shelf, row) => {
      rect(g, sx + 1, shelf, 10, row === 3 ? 3 : 4, C.space)
      for (let k = 0; k < 5; k++) rect(g, sx + 2 + k * 2, shelf + 1 + (hash(sx + k + row) % 2), 1, 2, crystals[(k + row + sx) % 4] ?? C.cyan)
    })
  }
  rect(g, 18, 19, 11, 1, C.metalLight)
  rect(g, 23, 20, 1, 5, C.metal)
  rect(g, 25, 15, 3, 1, C.cyan)
  rect(g, 24, 16, 5, 1, C.teal)
  rect(g, 26, 17, 1, 2, C.metal)
  // Lab: a whiteboard, a digital calendar, a console
  noticeBoard(g, s, C.metalLight, C.board)
  calendar(g, t, s, { header: C.magenta, page: C.space, ink: C.cyan, off: C.metal })
  desk(g, C.metal, C.metalLight)
  monitor(g, t, C.metal, true)
  rect(g, 47, 21, 4, 4, C.metalLight)
  rect(g, 46, 18, 6, 3, C.green)
  px(g, 48, 17, C.green)
  // Reactor: a glass column of moving light
  rect(g, 119, 4, 14, 21, C.metal)
  rect(g, 121, 5, 10, 17, C.glass)
  for (let y = 5; y < 22; y++) {
    const band = (y + Math.floor(t / 2)) % 4
    if (band === 0) rect(g, 122, y, 8, 1, C.core)
    else if (band === 1) rect(g, 123, y, 6, 1, C.cyan)
  }
  rect(g, 119, 22, 14, 3, C.metalLight)
  terminalBox(g, t, C.metalLight)
  // Observatory: a planet turning beyond the glass
  rect(g, 140, 5, 28, 11, C.metalLight)
  rect(g, 141, 6, 26, 9, C.space)
  STARS.slice(0, 9).forEach(([x, y], i) => {
    if (hash(i * 11 + (Math.floor(t / 3) % 8)) % 3 !== 0) px(g, 141 + (x % 26), 6 + (y % 9), C.white)
  })
  spinner(g, 155, 7, t, (column, row) => ((hash(column * 5 + row) & 3) === 0 ? C.green : C.blue))
  rect(g, 161, 19, 6, 6, C.metalLight)
  rect(g, 162, 16, 4, 3, C.green)
  // Rec deck: a holo-arcade, a strip of lights
  arcadeCabinet(g, t, C.teal, C.metal)
  for (let x = 189; x < 252; x += 3) px(g, x, 4, (x / 3 + Math.floor(t / 2)) % 4 === 0 ? C.cyan : C.magenta)
}

// ── The forest camp ───────────────────────────────────────────────────────

function pine(g: Grid, x: number, top: number, bottom: number, color: number, s: SceneProps): void {
  for (let y = top; y < bottom; y++) {
    const half = Math.floor((y - top) / 2)
    rect(g, x - half, y, half * 2 + 1, 1, color)
    if (s.season === 'spring' && y > top + 1 && hash(x * 31 + y) % 4 === 0) px(g, x - half + (hash(y + x) % (half * 2 + 1)), y, C.blossom)
  }
  if (s.weather === 'snow') {
    px(g, x, top, C.snow)
    rect(g, x - 1, top + 2, 3, 1, C.snow)
  }
}

/** The woods' leaves by season: green, autumn's reds and golds, winter's darker green. */
function leaves(s: SceneProps, i: number): number {
  if (s.season === 'autumn') return [C.autumnRed, C.autumnOrange, C.autumnYellow][i % 3] ?? C.autumnOrange
  if (s.season === 'winter') return i % 2 === 0 ? C.pineDark : C.pine
  return i % 2 === 0 ? C.pine : C.pineDark
}

function forest(g: Grid, t: number, s: SceneProps, o: { hasClouds: boolean; isPlain: boolean }): void {
  outdoorSky(g, t, s, 14, 214)
  if (o.hasClouds) driftingClouds(g, t, s, [3, 6])
  const hills = s.time === 'night' ? C.mountainNight : s.time === 'dusk' ? C.mountainDusk : C.mountain
  for (const [cx, top] of [
    [36, 6],
    [118, 5],
    [196, 7],
  ] as const) {
    for (let y = top; y < 15; y++) rect(g, cx - (y - top) * 3, y, (y - top) * 6 + 1, 1, hills)
  }
  for (let x = 3; x < SW; x += 9) pine(g, x, 8 + (hash(x) % 3), 17, leaves(s, Math.floor(x / 9)), s)
  const grass = s.time === 'night' ? C.grassNight : C.grass
  rect(g, 0, 17, SW, 5, grass)
  rect(g, 0, 22, SW, 6, C.path)
  rect(g, 0, 22, SW, 1, C.pathDark)
  if (!o.isPlain) for (let i = 0; i < 50; i++) px(g, hash(i * 7 + 4) % SW, 17 + (hash(i * 3 + 9) % 5), C.grassDark)
  // The tent and its lantern
  for (let y = 8; y < 25; y++) {
    const half = y - 8
    rect(g, 21 - half, y, half + 1, 1, C.tent)
    rect(g, 22, y, half, 1, C.tentDark)
  }
  for (let y = 14; y < 25; y++) {
    const half = Math.floor((y - 14) * 0.6)
    rect(g, 21 - half, y, half * 2 + 1, 1, C.tentDoor)
  }
  rect(g, 33, 9, 1, 4, C.trunk)
  rect(g, 32, 13, 3, 1, C.dark)
  rect(g, 32, 14, 3, 3, s.time === 'night' && t % 8 < 4 ? C.flame : C.ember)
  rect(g, 32, 17, 3, 1, C.dark)
  // The log desk: the board on a post, the calendar nailed to a tree
  rect(g, 55, 14, 2, 11, C.trunk)
  noticeBoard(g, s, C.trunk, C.cork)
  rect(g, 68, 0, 5, 25, C.trunk)
  rect(g, 60, 0, 21, 3, leaves(s, 0))
  rect(g, 63, 3, 15, 1, leaves(s, 1))
  calendar(g, t, s, { header: C.red, page: null, ink: C.eye, off: C.trunk })
  rect(g, 70, 18, 21, 2, C.woodLight)
  rect(g, 71, 20, 3, 5, C.trunk)
  rect(g, 87, 20, 3, 5, C.trunk)
  monitor(g, t, C.dark, false)
  // The radio hut, its antenna, the lights in its window
  terminalBox(g, t, C.radio)
  rect(g, 116, 8, 17, 17, C.wood)
  for (let y = 10; y < 25; y += 3) rect(g, 116, y, 17, 1, C.woodLight)
  for (let i = 0; i < 5; i++) rect(g, 114 + i, 7 - i, 21 - i * 2, 1, C.pineDark)
  rect(g, 120, 11, 11, 6, C.dark)
  for (const row of [12, 14]) {
    for (let led = 0; led < 5; led++) {
      const isOn = hash(row * 7 + led + (Math.floor(t / 2) % 8) * 13) % 3 !== 0
      px(g, 122 + led * 2, row, isOn ? ([C.code, C.yellow, C.red][led % 3] ?? C.code) : C.gray)
    }
  }
  rect(g, 130, 0, 1, 3, C.gray)
  px(g, 130, 0, t % 8 < 4 ? C.red : C.gray)
  // The treehouse and its ladder, mushrooms at the roots
  rect(g, 152, 0, 20, 3, leaves(s, 2))
  rect(g, 160, 3, 4, 22, C.trunk)
  rect(g, 146, 9, 25, 2, C.woodLight)
  rect(g, 148, 4, 10, 5, C.wood)
  rect(g, 147, 3, 12, 1, C.pineDark)
  px(g, 152, 6, s.time === 'night' ? C.ember : C.yellow)
  rect(g, 156, 11, 1, 14, C.woodLight)
  rect(g, 158, 11, 1, 14, C.woodLight)
  for (let y = 12; y < 25; y += 3) rect(g, 156, y, 3, 1, C.woodLight)
  rect(g, 165, 21, 3, 1, C.red)
  rect(g, 166, 22, 1, 2, C.white)
  rect(g, 168, 22, 2, 1, C.red)
  px(g, 168, 23, C.white)
  // The campfire, string lights, fireflies, and the woods' edge
  for (let x = 175; x < 188; x += 2) px(g, x, 24, C.gray)
  rect(g, 177, 23, 9, 1, C.trunk)
  rect(g, 178, 22, 7, 1, C.trunk)
  const k = t % 8
  for (let y = 15; y < 22; y++) {
    const half = Math.max(0, Math.floor((y - 15 - (k % 2)) / 2))
    const sway = k < 4 ? 0 : 1
    rect(g, 181 - half + (y < 18 ? sway : 0), y, half * 2 + 1, 1, C.flameHot)
    if (half > 0) rect(g, 182 - half + (y < 18 ? sway : 0), y, half * 2 - 1, 1, C.flame)
    if (half > 1 && y > 18) rect(g, 183 - half, y, half * 2 - 3, 1, C.ember)
  }
  for (let x = 189; x < 246; x += 4) {
    rect(g, x, 3, 4, 1, C.trunk)
    px(g, x + 2, 4, s.time === 'night' && (Math.floor((x - 189) / 4) + Math.floor(t / 2)) % 3 === 0 ? C.flame : C.ember)
  }
  if (s.time === 'night') {
    for (let i = 0; i < 7; i++) if (hash(i * 5 + (Math.floor(t / 3) % 8)) % 3 === 0) px(g, 190 + (hash(i) % 55), 6 + (hash(i * 9) % 9), C.ember)
  }
  pine(g, 250, 1, 25, leaves(s, 1), s)
}

// ── The roster ────────────────────────────────────────────────────────────

const ARCADE_HI =
  '<g class="on"><rect x="177" y="9" width="8" height="6" fill="#2E3138"/><path fill="#F5C542" d="M178 10h1v4h-1zM180 10h1v4h-1zM179 12h1v1h-1zM182 10h1v4h-1z"/><path fill="#E5484D" d="M184 10h1v3h-1zM184 14h1v1h-1z"/></g>'

const LAMP_GLOW = (color: string): string =>
  `<path class="on" fill="${color}" fill-opacity="0.85" d="M22 14h9v1h-9zM21 17h11v1h-11zM22 18h9v1h-9zM20 15h4v1h-4zM29 15h4v1h-4z"/>`

/** The parts every scene moves; the games' own motion is a layer of its own (scene-svg.ts). */
const COMMON_PARTS: readonly Part[] = [
  { x: 77, y: 10, w: 10, h: 6, ticks: 16 },
  { x: 100, y: 16, w: 4, h: 1, ticks: 4 },
  { x: 66, y: 4, w: 9, h: 2, ticks: 4 },
]

export const THEMES: Record<Theme, ThemeArt> = {
  house: {
    draw: house,
    parts: [
      ...COMMON_PARTS,
      { x: 121, y: 8, w: 10, h: 14, ticks: 16 },
      { x: 141, y: 6, w: 26, h: 9, ticks: 24 },
      { x: 160, y: 16, w: 7, h: 6, ticks: 16 },
      { x: 177, y: 9, w: 8, h: 7, ticks: 8 },
    ],
    light: { box: { x: 23, y: 14, w: 7, h: 5 }, glow: LAMP_GLOW('#FCE7A6') },
    toy: { box: { x: 176, y: 7, w: 10, h: 18 }, hi: ARCADE_HI },
    sky: { x: 141, y: 6, w: 26, h: 9 },
    signs: { fill: '#F3E3C3', stroke: 'none', y: 2.35 },
  },
  beach: {
    draw: beach,
    parts: [
      ...COMMON_PARTS,
      { x: 0, y: 0, w: SW, h: 13, ticks: 24 },
      { x: 0, y: 16, w: SW, h: 3, ticks: 16 },
      { x: 125, y: 1, w: 8, h: 4, ticks: 4 },
      { x: 158, y: 3, w: 6, h: 2, ticks: 8 },
      { x: 160, y: 18, w: 7, h: 6, ticks: 16 },
      { x: 182, y: 8, w: 3, h: 3, ticks: 4 },
    ],
    light: {
      box: { x: 155, y: 1, w: 14, h: 15 },
      glow: '<path class="on" fill="#FFF6C8" fill-opacity="0.5" d="M158 3L128 -2L128 9Z"/><path class="on" fill="#FFF6C8" fill-opacity="0.5" d="M164 3L194 -2L194 9Z"/>',
    },
    toy: {
      box: { x: 175, y: 8, w: 12, h: 17 },
      hi: '<g class="on"><path fill="#E5484D" d="M187 23h5v1h-5zM187 22h1v1h-1zM191 22h1v1h-1zM188 24h1v1h-1zM190 24h1v1h-1z"/><path fill="#2A1A15" d="M188 21h1v1h-1zM190 21h1v1h-1z"/></g>',
    },
    sky: { x: 0, y: 0, w: SW, h: 14 },
    signs: { fill: '#FFFFFF', stroke: '#2A1A15', y: 2.6 },
  },
  space: {
    draw: space,
    parts: [
      ...COMMON_PARTS,
      { x: 121, y: 5, w: 10, h: 17, ticks: 8 },
      { x: 141, y: 6, w: 26, h: 9, ticks: 24 },
      { x: 177, y: 9, w: 8, h: 7, ticks: 8 },
      { x: 186, y: 4, w: 66, h: 1, ticks: 8 },
    ],
    light: { box: { x: 23, y: 14, w: 7, h: 5 }, glow: LAMP_GLOW('#5EE6F0') },
    toy: { box: { x: 176, y: 7, w: 10, h: 18 }, hi: ARCADE_HI },
    sky: null,
    signs: { fill: '#BFF8FF', stroke: 'none', y: 2.35 },
  },
  forest: {
    draw: forest,
    parts: [
      ...COMMON_PARTS,
      { x: 0, y: 0, w: SW, h: 12, ticks: 24 },
      { x: 32, y: 14, w: 3, h: 3, ticks: 8 },
      { x: 122, y: 12, w: 9, h: 3, ticks: 16 },
      { x: 130, y: 0, w: 1, h: 1, ticks: 8 },
      { x: 175, y: 14, w: 13, h: 8, ticks: 8 },
      { x: 189, y: 4, w: 57, h: 1, ticks: 6 },
      { x: 189, y: 6, w: 57, h: 9, ticks: 24 },
    ],
    light: {
      box: { x: 30, y: 9, w: 7, h: 10 },
      glow: '<path class="on" fill="#FFE08A" fill-opacity="0.6" d="M30 13h7v5h-7zM29 14h1v3h-1zM37 14h1v3h-1z"/>',
    },
    toy: {
      box: { x: 175, y: 12, w: 13, h: 13 },
      hi: '<path class="on" fill="#FFE08A" d="M178 12h1v1h-1zM181 9h1v1h-1zM184 12h1v1h-1zM180 7h1v1h-1zM183 6h1v1h-1z"/>',
    },
    sky: { x: 0, y: 0, w: SW, h: 13 },
    signs: { fill: '#FFFFFF', stroke: '#2A1A15', y: 2.6 },
  },
}

export const THEME_ORDER: readonly Theme[] = ['house', 'beach', 'space', 'forest']

/** A whole background for `theme`, for tests and previews. */
export function backdrop(theme: Theme, t: number, s: SceneProps): Grid {
  const g = blank()
  THEMES[theme].draw(g, t, s, { hasClouds: true, isPlain: false })
  return g
}
