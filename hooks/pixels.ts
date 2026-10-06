// The canvas every scene draws on: its size, its palette, and the few
// drawing calls the scenes share.

export const SW = 256
export const SH = 28
/** Milliseconds a tick, eight frames a second. */
export const STEP = 125
/** The floor's top row; a Clawd's feet stand on the row above. */
export const FLOOR = 25
export const FEET = FLOOR - 1

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
  nightTop: '#141C33',
  nightLow: '#2E3F6E',
  moon: '#F4E8B0',
  net: '#E8E8E8',
  // The beach
  skyTop: '#6EC1F0',
  skyLow: '#B9E2F7',
  sea: '#2F8FD0',
  seaDeep: '#2577B3',
  seaDusk: '#C9735E',
  seaNight: '#1A2A50',
  foam: '#E8F6FF',
  sand: '#F2D7A0',
  sandWet: '#E0BE85',
  sandDot: '#D9B378',
  palm: '#9C6B3E',
  leaf: '#3E9E4F',
  leafDark: '#2E7A3B',
  rock: '#6E6A66',
  // The space station
  hull: '#2A2F3A',
  hullLine: '#3A4150',
  panel: '#1F2533',
  panelLine: '#2A3142',
  metal: '#4A5160',
  metalLight: '#6B7385',
  space: '#0B0F1C',
  cyan: '#5EE6F0',
  magenta: '#E05EC8',
  teal: '#2BB3A3',
  glass: '#1B3A4A',
  core: '#BFF8FF',
  board: '#DDE3EA',
  // The forest camp
  grass: '#5C9E4A',
  grassDark: '#4A8A3C',
  grassNight: '#2F5A2C',
  path: '#A6814F',
  pathDark: '#8A6A3E',
  pine: '#2E6B3A',
  pineDark: '#22522C',
  trunk: '#6B4A2E',
  mountain: '#8FA5BF',
  mountainDusk: '#9C7A8A',
  mountainNight: '#2B3550',
  tent: '#E07A3C',
  tentDark: '#B85E2A',
  tentDoor: '#3A2A1A',
  flame: '#FFB13B',
  flameHot: '#FF6A2B',
  ember: '#FFE08A',
  radio: '#4A6B3A',
  // Seasons, holidays
  pumpkin: '#F08A24',
  pumpkinDark: '#C2661A',
  autumnRed: '#C8452E',
  autumnOrange: '#E07B2E',
  autumnYellow: '#E8B33A',
  blossom: '#F6B6C8',
  lantern: '#D8312F',
  gold: '#F2C14E',
  fir: '#2E8B57',
  witch: '#6B4BA8',
  // Trophies
  bronze: '#C0763A',
  bronzeHi: '#E8A86A',
} as const

export type Color = keyof typeof HEX

const NAMES = Object.keys(HEX) as Color[]

/** Palette index 0 is transparent; the rest follow HEX's order. */
export const SCENE_PALETTE: readonly string[] = ['', ...NAMES.map(name => HEX[name])]

export const C = Object.fromEntries(NAMES.map((name, i) => [name, i + 1])) as Record<Color, number>

export type Grid = Uint8Array

export type Box = { x: number; y: number; w: number; h: number }

export const blank = (): Grid => new Uint8Array(SW * SH)

export function px(g: Grid, x: number, y: number, c: number): void {
  if (x >= 0 && x < SW && y >= 0 && y < SH) g[y * SW + x] = c
}

export function rect(g: Grid, x: number, y: number, w: number, h: number, c: number): void {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(g, x + i, y + j, c)
}

/** Draws ASCII art: each character a palette entry by `key`, the rest left alone. */
export function stamp(g: Grid, x: number, y: number, rows: readonly string[], key: Readonly<Record<string, number>>): void {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const c = key[row[i] ?? '.']
      if (c !== undefined) px(g, x + i, y + j, c)
    }
  })
}

/** A cheap, repeatable scramble, so frames never depend on Math.random. */
export const hash = (n: number): number => {
  let x = (n ^ 0x9e3779b9) >>> 0
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0
  return (x ^ (x >>> 16)) >>> 0
}

const DIGITS = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001010010010', '111101111101111', '111101111001111']

/** A 3 × 5 digit. */
export function digit(g: Grid, x: number, y: number, d: number, c: number): void {
  const bits = DIGITS[d] ?? ''
  for (let i = 0; i < 15; i++) if (bits[i] === '1') px(g, x + (i % 3), y + Math.floor(i / 3), c)
}
