// The house on the terminal, as a Raster the engine paints cell by cell: two
// scene pixels a cell (the upper one a half block's ink, the lower its
// background), the whole width a terminal can show, with a camera on the
// main Clawd when it is narrower. A cell of one colour is a space on that
// background, so no terminal's line spacing shows through as stripes. A room
// with its light off, or late at night, is tinted dim, its lit screens,
// lamps and fires left bright. The band blits a new frame every tick.

import { say, type Lang } from './i18n'
import { isSwitched, roomSpans, shadeOf, tint } from './light'
import { actorX, composeScene, ROOMS, SCENE_PALETTE, SH, SW, type SceneProps, type Theme } from './scene'
import { THEMES } from './themes'

/** Terminal rows the house takes: two scene pixels a row. */
export const HOUSE_ROWS = SH / 2

/** The terminal's own colour, for a cell's ink or background left blank. */
const DEFAULT = 0x01000000

const BLOCK_TOP = 0x2580
const BLOCK_BOTTOM = 0x2584
const SPACE = 0x20

const colorOf = (hex: string): number => parseInt(hex.slice(1, 7), 16)

/** How dim each column is, and which pixels stay lit: the screens, lamps and fires shining in their rooms. */
export function lightOf(props: SceneProps): { shade: number[]; lit: Set<number> } {
  const art = THEMES[props.theme]
  const dark = props.dark ?? []
  const shade = new Array<number>(SW).fill(0)
  const lit = new Set<number>()
  for (const span of roomSpans()) {
    const isDark = dark.includes(span.id)
    const amount = shadeOf(art, props.time, isDark)
    for (let x = Math.floor(span.x0); x < Math.min(SW, Math.ceil(span.x1)); x++) shade[x] = amount
    for (const g of art.glows) {
      if (g.room !== span.id || (isDark && isSwitched(g))) continue
      for (let y = g.box.y; y < g.box.y + g.box.h; y++) for (let x = g.box.x; x < g.box.x + g.box.w; x++) lit.add(y * SW + x)
    }
  }
  return { shade, lit }
}

/** Where the view starts: the left edge, or, narrower than the house, centred on the main Clawd. */
export function cameraOf(props: SceneProps, columns: number, now: number): number {
  if (columns >= SW) return 0
  const main = props.actors.find(a => a.cap === null)
  const follow = main === undefined ? 0 : actorX(main, now) + 8
  return Math.max(0, Math.min(SW - columns, Math.round(follow - columns / 2)))
}

/** The house at tick `t`, `columns` wide, as a Raster's `cells`. */
export function houseCells(props: SceneProps, t: number, now: number, columns: number): string {
  const grid = composeScene(props, t, now, { isPlain: true })
  const { shade, lit } = lightOf(props)
  const left = cameraOf(props, columns, now)
  const words = new Uint32Array(columns * HOUSE_ROWS * 3)
  const ink = (i: number, x: number): number => {
    const index = grid[i] ?? 0
    return index === 0 ? -1 : colorOf(tint(SCENE_PALETTE[index] ?? '#000000', lit.has(i) ? 0 : (shade[x] ?? 0)))
  }
  for (let row = 0; row < HOUSE_ROWS; row++) {
    for (let col = 0; col < columns; col++) {
      const x = left + col
      const upper = x < SW ? ink(row * 2 * SW + x, x) : -1
      const lower = x < SW ? ink((row * 2 + 1) * SW + x, x) : -1
      let cell: [number, number, number]
      if (upper < 0 && lower < 0) cell = [SPACE, DEFAULT, DEFAULT]
      else if (upper === lower) cell = [SPACE, DEFAULT, upper]
      else if (lower < 0) cell = [BLOCK_TOP, upper, DEFAULT]
      else if (upper < 0) cell = [BLOCK_BOTTOM, lower, DEFAULT]
      else cell = [BLOCK_TOP, upper, lower]
      words.set(cell, (row * columns + col) * 3)
    }
  }
  return base64(new Uint8Array(words.buffer))
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** Standard padded base64: the environment's own where it has one, else by hand. */
function base64(bytes: Uint8Array): string {
  const own = (bytes as unknown as { toBase64?: () => string }).toBase64
  if (typeof own === 'function') return own.call(bytes)
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0
    const b = bytes[i + 1] ?? 0
    const c = bytes[i + 2] ?? 0
    out += ALPHABET[a >> 2]! + ALPHABET[((a & 3) << 4) | (b >> 4)]!
    out += i + 1 < bytes.length ? ALPHABET[((b & 15) << 2) | (c >> 6)]! : '='
    out += i + 2 < bytes.length ? ALPHABET[c & 63]! : '='
  }
  return out
}

/** Terminal cells a string takes: CJK two, the rest one. */
const cellsOf = (text: string): number => [...text].reduce((n, ch) => n + ((ch.codePointAt(0) ?? 0) > 0x2e80 ? 2 : 1), 0)

/** The room names under the house, each centred on its room within the view. */
export function signsLine(left: number, columns: number, lang: Lang, theme: Theme): string {
  const names = say(lang).rooms[theme]
  let line = ''
  for (const room of ROOMS) {
    const name = names[room.id]
    const width = cellsOf(name)
    const at = Math.round(room.x + room.w / 2 - width / 2) - left
    if (at < cellsOf(line) || at + width > columns) continue
    line += ' '.repeat(at - cellsOf(line)) + name
  }
  return line
}
