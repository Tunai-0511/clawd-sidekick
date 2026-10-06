// What the date and the sky add to any scene: holiday decorations, snow on
// the ground, and what falls through the air (rain, snow, spring petals,
// autumn leaves). The terminal draws the falling things into each frame; the
// SVG lets them fall on their own with SMIL, so they cost no redraws.

import type { SceneProps, Theme } from '../types'
import { C, hash, px, rect, SH, SW, type Box, type Grid } from './pixels'
import type { Part } from './themes'

/** Where weather can be seen: all of an outdoor scene, the house's window, nowhere in space. */
export function weatherArea(theme: Theme): readonly Box[] {
  if (theme === 'beach' || theme === 'forest') return [{ x: 0, y: 0, w: SW, h: 25 }]
  if (theme === 'house') return [{ x: 141, y: 6, w: 26, h: 9 }]
  return []
}

const inArea = (area: readonly Box[], x: number, y: number): boolean => area.some(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h)

type Falling = 'rain' | 'snow' | 'petals' | 'leaves' | null

/** What falls: the weather first, then the season's petals or leaves. */
export function fallingOf(s: SceneProps): Falling {
  if (s.weather === 'rain' || s.weather === 'storm') return 'rain'
  if (s.weather === 'snow') return 'snow'
  if (s.weather === 'fog') return null
  if (s.season === 'spring') return 'petals'
  if (s.season === 'autumn') return 'leaves'
  return null
}

const GROUND: Readonly<Record<Theme, readonly number[]>> = {
  house: [C.roof, C.roofTile],
  beach: [C.sand, C.sandWet, C.sandDot],
  forest: [C.grass, C.grassDark, C.grassNight],
  space: [],
}

const LANTERNS = [27, 112, 200, 240]
const PUMPKINS = [37, 84, 166, 248]

/** Decorations drawn over the scene and under the games and the Clawds. */
export function decorate(g: Grid, t: number, s: SceneProps): void {
  if (s.weather === 'snow' && GROUND[s.theme].length > 0) {
    const ground = new Set(GROUND[s.theme])
    const rows = s.theme === 'house' ? [0, 1] : s.theme === 'beach' ? [20, 21, 22] : [17, 18, 19, 20, 21]
    for (const y of rows) for (let x = 0; x < SW; x++) if (ground.has(g[y * SW + x] ?? 0)) px(g, x, y, hash(x + y * 7) % 5 === 0 ? C.snowShade : C.snow)
  }
  switch (s.holiday) {
    case 'lunarNewYear':
      for (const x of LANTERNS) {
        px(g, x + 2, 3, C.gold)
        rect(g, x + 1, 4, 3, 1, C.gold)
        rect(g, x, 5, 5, 3, C.lantern)
        px(g, x + 1, 5, C.pink)
        rect(g, x + 1, 8, 3, 1, C.gold)
        rect(g, x + 2, 9, 1, 2, C.gold)
      }
      break
    case 'halloween':
      for (const x of PUMPKINS) {
        px(g, x + 2, 20, C.green)
        rect(g, x + 1, 21, 3, 1, C.pumpkin)
        rect(g, x, 22, 5, 2, C.pumpkin)
        rect(g, x + 1, 24, 3, 1, C.pumpkinDark)
        const face = s.time === 'night' ? C.ember : C.pumpkinDark
        px(g, x + 1, 22, face)
        px(g, x + 3, 22, face)
        rect(g, x + 1, 23, 3, 1, face)
      }
      break
    case 'christmas': {
      rect(g, 47, 22, 3, 3, C.wood)
      for (let y = 13; y < 22; y++) {
        const half = Math.floor((y - 13) / 2)
        rect(g, 48 - half, y, half * 2 + 1, 1, C.fir)
      }
      px(g, 48, 12, C.yellow)
      for (let i = 0; i < 9; i++) {
        const y = 14 + (hash(i * 3) % 8)
        const half = Math.floor((y - 13) / 2)
        const x = 48 - half + (hash(i * 7 + 1) % (half * 2 + 1))
        px(g, x, y, [C.red, C.yellow, C.sky, C.pink][(i + Math.floor(t / 2)) % 4] ?? C.red)
      }
      break
    }
    case 'none':
      break
  }
}

/** The decorations that move: the Christmas lights. */
export function decorParts(s: SceneProps): readonly Part[] {
  return s.holiday === 'christmas' ? [{ x: 43, y: 12, w: 11, h: 10, ticks: 8 }] : []
}

const COUNTS: Record<Exclude<Falling, null>, number> = { rain: 70, snow: 45, petals: 16, leaves: 16 }

/** The falling things at tick `t`, for the terminal: drawn over the Clawds. */
export function drawFalling(g: Grid, t: number, s: SceneProps): void {
  const kind = fallingOf(s)
  const area = weatherArea(s.theme)
  if (kind === null || area.length === 0) return
  const count = s.weather === 'storm' ? 110 : COUNTS[kind]
  for (let i = 0; i < count; i++) {
    const x0 = hash(i * 31 + 7) % SW
    const y0 = hash(i * 17 + 3) % SH
    if (kind === 'rain') {
      const y = (y0 + t * 3) % SH
      const x = (x0 + SW - ((t * 1) % SW)) % SW
      if (inArea(area, x, y)) px(g, x, y, C.rain)
      if (inArea(area, x - 1, y + 1)) px(g, x - 1, y + 1, C.rain)
      continue
    }
    const speed = kind === 'snow' ? 3 : 4
    const y = (y0 + Math.floor(t / speed)) % SH
    const x = (x0 + Math.floor((t + i * 5) / 8) + (Math.floor((t + i * 3) / 6) % 2)) % SW
    const color =
      kind === 'snow' ? C.snow : kind === 'petals' ? C.blossom : ([C.autumnRed, C.autumnOrange, C.autumnYellow][i % 3] ?? C.autumnOrange)
    if (inArea(area, x, y)) px(g, x, y, color)
  }
}

const HEX_OF: Record<Exclude<Falling, null>, readonly string[]> = {
  rain: ['#A9C7E8'],
  snow: ['#F4F8FB'],
  petals: ['#F6B6C8', '#FBD3DE'],
  leaves: ['#C8452E', '#E07B2E', '#E8B33A'],
}

/**
 * The weather as SVG over everything else: one tile of falling things drawn
 * twice, one above the other, and the pair sliding down a tile's height on a
 * loop; lightning that flashes now and then; fog drifting by.
 */
export function weatherSvg(s: SceneProps): string {
  const area = weatherArea(s.theme)
  if (area.length === 0) return ''
  const clip = `<clipPath id="weather">${area.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"/>`).join('')}</clipPath>`
  let inner = ''
  const kind = fallingOf(s)
  if (kind !== null) {
    const count = s.weather === 'storm' ? 110 : COUNTS[kind]
    const colors = HEX_OF[kind]
    const byColor = colors.map(() => '')
    for (let i = 0; i < count; i++) {
      const x = hash(i * 31 + 7) % SW
      const y = hash(i * 17 + 3) % SH
      const shape = kind === 'rain' ? `M${x} ${y}h1v2h-1zM${x - 1} ${y + 2}h1v1h-1z` : `M${x} ${y}h1v1h-1z`
      const slot = i % colors.length
      byColor[slot] += shape + shape.replace(/M(-?\d+) (-?\d+)/g, (_, a: string, b: string) => `M${a} ${Number(b) - SH}`)
    }
    const dur = kind === 'rain' ? (s.weather === 'storm' ? 0.4 : 0.55) : kind === 'snow' ? 7 : 9
    const tile = byColor.map((d, i) => `<path fill="${colors[i]}" d="${d}"/>`).join('')
    const sway =
      kind === 'rain'
        ? tile
        : `<g><animateTransform attributeName="transform" type="translate" values="0 0;3 0;0 0" dur="${kind === 'snow' ? 3 : 4}s" repeatCount="indefinite"/>${tile}</g>`
    inner += `<g><animateTransform attributeName="transform" type="translate" from="0 0" to="0 ${SH}" dur="${dur}s" repeatCount="indefinite"/>${sway}</g>`
  }
  if (s.weather === 'storm') {
    const first = area[0] ?? { x: 0, y: 0, w: SW, h: SH }
    const bx = Math.round(first.x + first.w / 4)
    const by = first.y
    inner +=
      `<rect x="0" y="0" width="${SW}" height="${SH}" fill="#FFFFFF" opacity="0"><animate attributeName="opacity" values="0;0;0;0;0;0;0.55;0;0.35;0" dur="7s" repeatCount="indefinite"/></rect>` +
      `<path fill="#FFF6C8" visibility="hidden" d="M${bx} ${by}h2v3h-2zM${bx - 2} ${by + 3}h2v3h-2zM${bx - 1} ${by + 6}h2v2h-2z"><animate attributeName="visibility" values="hidden;hidden;hidden;hidden;hidden;hidden;visible;hidden;visible;hidden" dur="7s" calcMode="discrete" repeatCount="indefinite"/></path>`
  }
  if (s.weather === 'fog') {
    inner +=
      `<g fill="#FFFFFF"><animateTransform attributeName="transform" type="translate" values="-30 0;30 0;-30 0" dur="40s" repeatCount="indefinite"/>` +
      `<rect x="-40" y="9" width="${SW + 80}" height="5" opacity="0.22"/><rect x="-40" y="17" width="${SW + 80}" height="6" opacity="0.28"/></g>`
  }
  return inner === '' ? '' : `${clip}<g class="quiet" clip-path="url(#weather)">${inner}</g>`
}
