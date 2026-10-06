// What the date adds to any scene: holiday decorations, and what falls
// through the air (spring petals, autumn leaves). The terminal draws the
// falling things into each frame; the SVG lets them fall on their own with
// SMIL, so they cost no redraws.

import type { SceneProps, Theme, Tier } from '../types'
import { C, hash, px, rect, SH, SW, type Box, type Grid } from './pixels'
import type { Part } from './themes'

/** Where the open air can be seen: all of an outdoor scene, the house's window, nowhere in space. */
export function skyArea(theme: Theme): readonly Box[] {
  if (theme === 'beach' || theme === 'forest') return [{ x: 0, y: 0, w: SW, h: 25 }]
  if (theme === 'house') return [{ x: 141, y: 6, w: 26, h: 9 }]
  return []
}

const inArea = (area: readonly Box[], x: number, y: number): boolean => area.some(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h)

type Falling = 'petals' | 'leaves' | 'confetti' | null

/** What falls: birthday confetti all over, else spring's petals or autumn's leaves. */
export function fallingOf(s: SceneProps): Falling {
  if (s.isBirthday) return 'confetti'
  if (s.season === 'spring') return 'petals'
  if (s.season === 'autumn') return 'leaves'
  return null
}

const LANTERNS = [27, 112, 200, 240]
const PUMPKINS = [37, 84, 166, 248]

/** Where the medals hang: under the game room's bunting, in every scene. */
export const MEDAL_BOX: Box = { x: 190, y: 5, w: 62, h: 6 }

const MEDAL_COLOR: Record<Tier, readonly [number, number]> = {
  bronze: [C.bronze, C.bronzeHi],
  silver: [C.light, C.white],
  gold: [C.gold, C.ember],
  legend: [C.magenta, C.cyan],
}

/** A medal for each trophy family reached, best first: a ribbon and a disc with a glint. */
function drawMedals(g: Grid, medals: readonly Tier[]): void {
  medals.slice(0, 10).forEach((tier, i) => {
    const x = MEDAL_BOX.x + 1 + i * 6
    const [disc, glint] = MEDAL_COLOR[tier]
    const ribbon = i % 2 === 0 ? C.red : C.blue
    rect(g, x + 1, 6, 1, 2, ribbon)
    rect(g, x, 8, 3, 3, disc)
    px(g, x, 8, glint)
  })
}

/** Decorations drawn over the scene and under the games and the Clawds. */
export function decorate(g: Grid, t: number, s: SceneProps): void {
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
  // Last, so a holiday's lanterns never hide what was earned.
  drawMedals(g, s.medals)
}

/** The decorations that move: the Christmas lights. */
export function decorParts(s: SceneProps): readonly Part[] {
  return s.holiday === 'christmas' ? [{ x: 43, y: 12, w: 11, h: 10, ticks: 8 }] : []
}

const COUNT = 16
const CONFETTI_COUNT = 26

/** Where `kind` falls: confetti fills any scene, indoors or out; the rest only where the sky shows. */
const areaOf = (kind: Exclude<Falling, null>, theme: Theme): readonly Box[] => (kind === 'confetti' ? [{ x: 0, y: 0, w: SW, h: 25 }] : skyArea(theme))

/** The falling things at tick `t`, for the terminal: drawn over the Clawds. */
export function drawFalling(g: Grid, t: number, s: SceneProps): void {
  const kind = fallingOf(s)
  if (kind === null) return
  const area = areaOf(kind, s.theme)
  if (area.length === 0) return
  for (let i = 0; i < (kind === 'confetti' ? CONFETTI_COUNT : COUNT); i++) {
    const x0 = hash(i * 31 + 7) % SW
    const y0 = hash(i * 17 + 3) % SH
    const y = (y0 + Math.floor(t / 4)) % SH
    const x = (x0 + Math.floor((t + i * 5) / 8) + (Math.floor((t + i * 3) / 6) % 2)) % SW
    const color =
      kind === 'petals'
        ? C.blossom
        : kind === 'confetti'
          ? ([C.red, C.yellow, C.blue, C.green, C.pink][i % 5] ?? C.red)
          : ([C.autumnRed, C.autumnOrange, C.autumnYellow][i % 3] ?? C.autumnOrange)
    if (inArea(area, x, y)) px(g, x, y, color)
  }
}

const HEX_OF: Record<Exclude<Falling, null>, readonly string[]> = {
  petals: ['#F6B6C8', '#FBD3DE'],
  leaves: ['#C8452E', '#E07B2E', '#E8B33A'],
  confetti: ['#E5484D', '#F5C542', '#4D8DF6', '#4CB363', '#F6A5B8'],
}

/**
 * The falling petals or leaves as SVG over everything else: one tile drawn
 * twice, one above the other, the pair sliding down a tile's height on a loop
 * and swaying as it goes.
 */
export function fallingSvg(s: SceneProps): string {
  const kind = fallingOf(s)
  if (kind === null) return ''
  const area = areaOf(kind, s.theme)
  if (area.length === 0) return ''
  const clip = `<clipPath id="falling">${area.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"/>`).join('')}</clipPath>`
  const colors = HEX_OF[kind]
  const byColor = colors.map(() => '')
  for (let i = 0; i < (kind === 'confetti' ? CONFETTI_COUNT : COUNT); i++) {
    const x = hash(i * 31 + 7) % SW
    const y = hash(i * 17 + 3) % SH
    byColor[i % colors.length] += `M${x} ${y}h1v1h-1zM${x} ${y - SH}h1v1h-1z`
  }
  const tile = byColor.map((d, i) => `<path fill="${colors[i]}" d="${d}"/>`).join('')
  return (
    `${clip}<g class="quiet drift" clip-path="url(#falling)"><g>` +
    `<animateTransform attributeName="transform" type="translate" from="0 0" to="0 ${SH}" dur="9s" repeatCount="indefinite"/>` +
    `<g><animateTransform attributeName="transform" type="translate" values="0 0;3 0;0 0" dur="4s" repeatCount="indefinite"/>${tile}</g>` +
    '</g></g>'
  )
}
