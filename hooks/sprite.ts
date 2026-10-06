// Clawd, drawn procedurally on a 40 × 14 pixel canvas.
//
// Every pose is the same little body (18 × 10, two eyes, two arm nubs, four
// legs, after the CLI banner's Clawd) with different eyes, arms, legs and a
// prop. `frame(pose, t)` answers palette indexes, one per pixel; the terminal
// client draws them as half blocks and the desktop as an animated SVG.

import type { Pose } from '../types'

export type { Pose }

export const W = 40
export const H = 14

/** One tick of animation, in milliseconds (8 frames a second). */
export const TICK_MS = 125

export const PALETTE: readonly string[] = [
  '', // 0 transparent
  '#D97757', // 1 body
  '#B4553A', // 2 shade
  '#2A1A15', // 3 eye
  '#FFFFFF', // 4 white
  '#F6A5B8', // 5 pink
  '#E5484D', // 6 red
  '#7CC6F2', // 7 sweat blue
  '#F5C542', // 8 yellow
  '#F1EADB', // 9 paper
  '#8A8F98', // 10 gray
  '#4CB363', // 11 green
  '#A98BF5', // 12 purple
  '#3B3F46', // 13 dark
  '#C9CDD3', // 14 light gray
  '#4D8DF6', // 15 blue
  '#EE9A78', // 16 highlight
  '#8B5A2B', // 17 brown
]

export const POSES: readonly Pose[] = [
  'idle',
  'think',
  'type',
  'write',
  'read',
  'search',
  'web',
  'agent',
  'wait',
  'cheer',
  'panic',
  'oops',
  'sleep',
  'itemget',
  'love',
  'ask',
  'stamp',
  'mail',
  'tidy',
  'stretch',
]

/** Ticks before a pose's animation repeats. */
export const CYCLE: Record<Pose, number> = {
  idle: 48,
  think: 12,
  type: 4,
  write: 24,
  read: 32,
  search: 16,
  web: 8,
  agent: 16,
  wait: 8,
  cheer: 8,
  panic: 4,
  oops: 16,
  sleep: 32,
  itemget: 8,
  love: 12,
  ask: 8,
  stamp: 8,
  mail: 16,
  tidy: 12,
  stretch: 16,
}

export type FrameOptions = {
  /** Where the eyes look: -1 left, 0 ahead, 1 right (the pointer, say). */
  look?: -1 | 0 | 1
  /** A deadline is near: a sweat drop now and then. */
  isNervous?: boolean
}

export type Grid = Uint8Array

type Eyes = 'open' | 'blink' | 'happy' | 'closed' | 'wide' | 'x' | 'down' | 'up'
type Arm = 'mid' | 'up' | 'wave' | 'down' | 'out' | 'none'
type Legs = 'stand' | 'walkA' | 'walkB' | 'squat'
type Mouth = 'none' | 'o' | 'smile'

type Body = {
  x: number
  y: number
  eyes: Eyes
  look: number
  armL: Arm
  armR: Arm
  legs: Legs
  isSquashed: boolean
  hasBlush: boolean
  mouth: Mouth
}

const blank = (): Grid => new Uint8Array(W * H)

function px(g: Grid, x: number, y: number, c: number): void {
  if (x >= 0 && x < W && y >= 0 && y < H) g[y * W + x] = c
}

function rect(g: Grid, x: number, y: number, w: number, h: number, c: number): void {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(g, x + i, y + j, c)
}

const KEY: Record<string, number> = {
  o: 1,
  s: 2,
  e: 3,
  w: 4,
  p: 5,
  r: 6,
  b: 7,
  y: 8,
  P: 9,
  g: 10,
  G: 11,
  u: 12,
  d: 13,
  l: 14,
  B: 15,
  h: 16,
  n: 17,
}

/** Draws ASCII art: each letter a palette entry (KEY), `.` left alone. */
function stamp(g: Grid, x: number, y: number, art: readonly string[]): void {
  art.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const c = KEY[row[i] ?? '.']
      if (c !== undefined) px(g, x + i, y + j, c)
    }
  })
}

const HEART = ['.r.r.', 'rprrr', '.rrr.', '..r..']
const HEART_SMALL = ['p.p', 'ppp', '.p.']
const BANG = ['rr', 'rr', 'rr', '..', 'rr']
const SIGN = ['wwwwwww', 'wwrrrww', 'wrwwwrw', 'wwwwrww', 'wwwrwww', 'wwwwwww', 'wwwrwww', 'lllllll']
const PLANE = ['wwwwwww', 'wgwwwgw', 'wwgwgww', 'wwwrwww']
const BOOKS = ['rrrrrr.', '.BBBBBB', 'GGGGGG.', '.yyyyy.']
const Z_SMALL = ['lll', '.l.', 'lll']
const Z_BIG = ['llll', '..l.', '.l..', 'llll']
const DROP = ['.b', 'bb', 'bb']
const SPARKLE_A = ['.y.', 'yyy', '.y.']
const SPARKLE_B = ['y.y', '.y.', 'y.y']
const TINY = ['.oooooo.', '.oeooeo.', 'oooooooo', '.ssssss.', '.o.o.o.o']
const TINY_STEP = ['.oooooo.', '.oeooeo.', 'oooooooo', '.ssssss.', 'o.o.o.o.']
const CLIPBOARD = ['..ll..', 'nnllnn', 'nPPPPn', 'nPggPn', 'nPPPPn', 'nPggPn', 'nnnnnn']
const GLOBE_MASK = ['..###..', '.#####.', '#######', '#######', '#######', '.#####.', '..###..']
const LAND = ['..GG.....G..', '.GGG....GGG.', 'GG.....GGGG.', '.G......GG..', '.....G...G..', '....GG......', '.....G......']

// The body's geometry, after the CLI banner's Clawd scaled to square pixels:
// 18 × 10, eyes two by three, arms two by two at mid height, four legs.
const BW = 18
const BH = 10
const LEGS = [2, 5, 11, 14]
const EYES = [3, 13]

function eye(g: Grid, ex: number, ey: number, kind: Eyes, isLeft: boolean): void {
  switch (kind) {
    case 'open':
      rect(g, ex, ey, 2, 3, 3)
      px(g, isLeft ? ex : ex + 1, ey, 4)
      return
    case 'blink':
      rect(g, ex, ey + 2, 2, 1, 3)
      return
    case 'happy':
      px(g, ex - 1, ey + 2, 3)
      rect(g, ex, ey + 1, 2, 1, 3)
      px(g, ex + 2, ey + 2, 3)
      return
    case 'closed':
      px(g, ex - 1, ey + 1, 3)
      rect(g, ex, ey + 2, 2, 1, 3)
      px(g, ex + 2, ey + 1, 3)
      return
    case 'wide':
      rect(g, ex - 1, ey, 3, 3, 4)
      px(g, ex, ey + 1, 3)
      return
    case 'x':
      px(g, ex - 1, ey, 3)
      px(g, ex + 1, ey, 3)
      px(g, ex, ey + 1, 3)
      px(g, ex - 1, ey + 2, 3)
      px(g, ex + 1, ey + 2, 3)
      return
    case 'down':
      rect(g, ex, ey + 1, 2, 2, 3)
      return
    case 'up':
      rect(g, ex, ey, 2, 2, 3)
      px(g, isLeft ? ex : ex + 1, ey, 4)
      return
  }
}

function arm(g: Grid, b: Body, isLeft: boolean, kind: Arm): void {
  const top = b.y + (b.isSquashed ? 1 : 0)
  const near = isLeft ? b.x - 2 : b.x + BW
  const out = isLeft ? -1 : 1
  switch (kind) {
    case 'mid':
      rect(g, near, top + 5, 2, 2, 1)
      return
    case 'up':
      rect(g, near, top + 3, 2, 2, 1)
      rect(g, near + out, top + 1, 2, 2, 1)
      return
    case 'wave':
      rect(g, near, top + 4, 2, 2, 1)
      rect(g, near + 2 * out, top + 3, 2, 2, 1)
      return
    case 'down':
      rect(g, near, top + 6, 2, 2, 1)
      return
    case 'out':
      rect(g, isLeft ? near - 1 : near, top + 5, 3, 2, 1)
      return
    case 'none':
      return
  }
}

function clawd(g: Grid, b: Body): void {
  const top = b.y + (b.isSquashed ? 1 : 0)
  const height = BH - (b.isSquashed ? 1 : 0)
  LEGS.forEach((lx, i) => {
    const isLifted =
      (b.legs === 'walkA' && i % 2 === 0) || (b.legs === 'walkB' && i % 2 === 1) || b.legs === 'squat'
    rect(g, b.x + lx, b.y + BH, 2, isLifted ? 1 : 2, 1)
  })
  rect(g, b.x, top, BW, height, 1)
  rect(g, b.x + 2, top, BW - 4, 1, 16)
  rect(g, b.x, b.y + BH - 1, BW, 1, 2)
  arm(g, b, true, b.armL)
  arm(g, b, false, b.armR)
  const look = Math.max(-1, Math.min(1, b.look))
  eye(g, b.x + (EYES[0] ?? 3) + look, top + 2, b.eyes, true)
  eye(g, b.x + (EYES[1] ?? 13) + look, top + 2, b.eyes, false)
  if (b.hasBlush) {
    rect(g, b.x + 1, top + 6, 2, 1, 5)
    rect(g, b.x + BW - 3, top + 6, 2, 1, 5)
  }
  const mid = b.x + BW / 2 - 1 + look
  if (b.mouth === 'o') rect(g, mid, top + 6, 2, 2, 3)
  if (b.mouth === 'smile') {
    px(g, mid - 1, top + 6, 3)
    rect(g, mid, top + 7, 2, 1, 3)
    px(g, mid + 2, top + 6, 3)
  }
}

const base = (over: Partial<Body> = {}): Body => ({
  x: 11,
  y: 2,
  eyes: 'open',
  look: 0,
  armL: 'mid',
  armR: 'mid',
  legs: 'stand',
  isSquashed: false,
  hasBlush: false,
  mouth: 'none',
  ...over,
})

/** A cheap, repeatable scramble, so frames never depend on Math.random. */
const hash = (n: number): number => {
  let x = (n ^ 0x9e3779b9) >>> 0
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0
  return (x ^ (x >>> 16)) >>> 0
}

function sweat(g: Grid, t: number, x: number): void {
  const k = t % 12
  if (k < 9) stamp(g, x, 1 + Math.floor(k / 3), DROP)
}

/** The pixels of one frame of `pose` at tick `t`. */
export function frame(pose: Pose, t: number, options: FrameOptions = {}): Grid {
  const g = blank()
  const k = ((t % CYCLE[pose]) + CYCLE[pose]) % CYCLE[pose]
  const look = options.look
  switch (pose) {
    case 'idle': {
      const isBlink = k === 20 || k === 21 || k === 40
      const glance = k >= 28 && k < 34 ? -1 : k >= 34 && k < 38 ? 1 : 0
      clawd(g, base({ eyes: isBlink ? 'blink' : 'open', look: look ?? glance, isSquashed: (k >> 3) % 2 === 1 }))
      if (options.isNervous) sweat(g, k, 31)
      break
    }
    case 'think': {
      clawd(g, base({ eyes: 'up', look: 1, isSquashed: k >= 6 }))
      const dots = Math.floor(k / 3)
      for (let i = 0; i < dots; i++) rect(g, 31 + i * 3, 0, 2, 2, 14)
      break
    }
    case 'type': {
      clawd(g, base({ eyes: 'down', armL: 'none', armR: 'none' }))
      rect(g, 11, 9, 18, 1, 14)
      rect(g, 11, 10, 18, 2, 13)
      for (let i = 0; i < 8; i++) if ((hash(i * 7 + k) & 3) !== 0) px(g, 12 + i * 2, 10, 10)
      const isLeftUp = k % 2 === 0
      rect(g, 13, isLeftUp ? 7 : 8, 2, 2, 1)
      rect(g, 25, isLeftUp ? 8 : 7, 2, 2, 1)
      break
    }
    case 'write': {
      clawd(g, base({ eyes: 'down', look: 1, armR: 'none' }))
      rect(g, 13, 6, 14, 6, 9)
      rect(g, 13, 11, 14, 1, 14)
      const first = Math.min(10, k)
      const second = Math.max(0, Math.min(10, k - 12))
      rect(g, 15, 7, first, 1, 10)
      if (second > 0) rect(g, 15, 9, second, 1, 10)
      const tipX = 15 + (k < 12 ? first : second)
      const tipY = k < 12 ? 7 : 9
      px(g, tipX, tipY - 1, 13)
      px(g, tipX + 1, tipY - 2, 8)
      px(g, tipX + 2, tipY - 3, 8)
      px(g, tipX + 3, tipY - 4, 5)
      rect(g, tipX + 1, tipY - 1, 2, 2, 1)
      break
    }
    case 'read': {
      clawd(g, base({ eyes: 'down', armL: 'none', armR: 'none' }))
      rect(g, 11, 7, 18, 5, 17)
      rect(g, 12, 7, 7, 4, 9)
      rect(g, 21, 7, 7, 4, 9)
      rect(g, 19, 7, 2, 5, 2)
      for (const row of [8, 10]) {
        rect(g, 13, row, 5, 1, 14)
        rect(g, 22, row, 5, 1, 14)
      }
      if (k < 3) rect(g, 26 - k * 3, 6, 2, 5, 4)
      rect(g, 9, 8, 2, 2, 1)
      rect(g, 29, 8, 2, 2, 1)
      break
    }
    case 'search': {
      const sweep = k < 8 ? k : 16 - k
      const cx = 10 + sweep * 2
      clawd(g, base({ look: cx < 15 ? -1 : cx > 21 ? 1 : 0 }))
      stamp(g, cx, 4, ['.lll.', 'lbbbl', 'lbwbl', 'lbbbl', '.lll.'])
      px(g, cx + 4, 8, 17)
      px(g, cx + 5, 9, 17)
      px(g, cx + 6, 10, 17)
      break
    }
    case 'web': {
      clawd(g, base({ look: 1, armR: 'out' }))
      GLOBE_MASK.forEach((row, j) => {
        for (let i = 0; i < row.length; i++) {
          if (row[i] !== '#') continue
          const isLand = LAND[j]?.[(i + k) % 12] === 'G'
          px(g, 32 + i, 3 + j, isLand ? 11 : 15)
        }
      })
      break
    }
    case 'agent': {
      clawd(g, base({ x: 4, look: 1, legs: k % 4 < 2 ? 'walkA' : 'walkB' }))
      const hop = k % 4 < 2 ? 0 : 1
      stamp(g, 29, 7 + hop, k % 4 < 2 ? TINY : TINY_STEP)
      if (k % 8 < 4) stamp(g, 33, 1, SPARKLE_A)
      break
    }
    case 'wait': {
      const isHop = k < 2
      clawd(g, base({ y: isHop ? 1 : 2, eyes: k === 5 ? 'blink' : 'open', look: look ?? 0, armR: k % 4 < 2 ? 'up' : 'wave' }))
      if (k % 4 !== 3) stamp(g, 35, 0, BANG)
      break
    }
    case 'cheer': {
      const isUp = k < 3
      clawd(g, base({ y: isUp ? 0 : 2, eyes: 'happy', armL: 'up', armR: 'up', hasBlush: true, mouth: 'smile' }))
      stamp(g, 2, 1, k % 2 === 0 ? SPARKLE_A : SPARKLE_B)
      stamp(g, 35, 2, k % 2 === 1 ? SPARKLE_A : SPARKLE_B)
      stamp(g, 4, 9, k % 2 === 1 ? SPARKLE_A : SPARKLE_B)
      stamp(g, 33, 9, k % 2 === 0 ? SPARKLE_A : SPARKLE_B)
      break
    }
    case 'panic': {
      clawd(g, base({ x: k % 2 === 0 ? 10 : 12, eyes: 'wide', armL: k % 2 === 0 ? 'up' : 'wave', armR: k % 2 === 0 ? 'wave' : 'up', mouth: 'o' }))
      if (k < 2) stamp(g, 2, 0, BANG)
      else stamp(g, 36, 0, BANG)
      stamp(g, k % 2 === 0 ? 4 : 34, 5 + (k % 3), DROP)
      break
    }
    case 'oops': {
      clawd(g, base({ eyes: k < 10 ? 'x' : 'blink', armL: 'down', armR: 'down', isSquashed: true }))
      sweat(g, k, 31)
      break
    }
    case 'sleep': {
      clawd(g, base({ y: 3, eyes: 'closed', armL: 'down', armR: 'down', legs: 'squat', isSquashed: k < 16 }))
      const rise = (phase: number): number => 8 - Math.floor(((k + phase) % 32) / 4)
      const small = rise(0)
      if (small >= 0) stamp(g, 31 + Math.floor((8 - small) / 3), small, Z_SMALL)
      const big = rise(16)
      if (big >= 0) stamp(g, 32 + Math.floor((8 - big) / 3), big, Z_BIG)
      break
    }
    case 'itemget': {
      clawd(g, base({ eyes: 'happy', armR: 'up', hasBlush: true }))
      stamp(g, 32, k < 4 ? 0 : 1, CLIPBOARD)
      stamp(g, 3, 1, k % 2 === 0 ? SPARKLE_A : SPARKLE_B)
      if (k % 4 < 2) stamp(g, 5, 9, SPARKLE_B)
      break
    }
    case 'love': {
      clawd(g, base({ eyes: 'happy', hasBlush: true, mouth: 'smile', isSquashed: k % 6 < 3 }))
      const climb = (phase: number): number => 9 - ((k + phase) % 12)
      const right = climb(0)
      if (right >= -3) stamp(g, 32, right, HEART)
      const left = climb(6)
      if (left >= -2) stamp(g, 5, left + 2, HEART_SMALL)
      break
    }
    case 'ask': {
      const isTap = k < 2
      clawd(g, base({ eyes: 'wide', armR: 'up', mouth: 'o' }))
      stamp(g, 31, isTap ? 0 : 1, SIGN)
      rect(g, 34, isTap ? 8 : 9, 1, 3, 17)
      if (isTap) stamp(g, 2, 1, SPARKLE_B)
      break
    }
    case 'stamp': {
      const isDown = k >= 4
      clawd(g, base({ eyes: 'happy', armR: isDown ? 'out' : 'up', isSquashed: isDown }))
      rect(g, 30, 11, 9, 2, 9)
      rect(g, 33, isDown ? 6 : 1, 3, 2, 17)
      rect(g, 32, isDown ? 8 : 3, 5, 2, 6)
      if (isDown) rect(g, 33, 11, 3, 1, 6)
      break
    }
    case 'mail': {
      clawd(g, base({ eyes: 'happy', look: 1, armR: k < 3 ? 'up' : 'wave', hasBlush: true }))
      if (k >= 2 && k < 14) stamp(g, 29 + Math.floor((k - 2) * 0.6), 8 - Math.floor((k - 2) * 0.7), PLANE)
      break
    }
    case 'stretch': {
      const isUp = k % 8 < 4
      clawd(g, base({ y: isUp ? 1 : 2, eyes: 'closed', armL: 'up', armR: 'up', isSquashed: !isUp }))
      if (isUp) {
        stamp(g, 3, 2, SPARKLE_B)
        stamp(g, 34, 2, SPARKLE_B)
      }
      break
    }
    case 'tidy': {
      const isUp = k % 12 < 2
      clawd(g, base({ y: isUp ? 1 : 2, eyes: 'happy', armL: 'up', armR: 'up' }))
      stamp(g, 31, isUp ? 2 : 3, BOOKS)
      break
    }
  }
  return g
}
