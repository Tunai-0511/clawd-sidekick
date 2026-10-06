// The house as one animated SVG for the surfaces that draw SVG, drawn as an
// image: the static house once, each moving part looping on its own as a
// flipbook, and a walking Clawd sliding to his spot with SMIL and then
// switching to what he does there. Over the pixels, light: each room lit by
// its own lamps and screens, dim with its switch off or late at night, the
// day coming in at the windows, soft shadows under the Clawds, and the air
// moving (dust in the light, fireflies, glints on the sea). `color-scheme` on
// the root keeps the surface's frame transparent. With reduced motion every
// loop holds its first frame and nothing drifts. What the pointer finds is
// the band's own: `roomHoverSvg` and `actorHoverSvg` draw what shows there.

import type { RoomId } from '../types'
import { decorate, decorParts, fallingSvg } from './decor'
import { say } from './i18n'
import { FLOOR } from './pixels'
import { isSwitched, NIGHT, roomSpans, shadeOf } from './light'
import { drawScene, THEMES, type Glow, type ThemeArt } from './themes'
import {
  actorX,
  blankets,
  blank,
  drawBackground,
  gameRoom,
  drawPal,
  drawStar,
  hatRise,
  STAR_LOOP,
  STAR_TICKS,
  PAL_FROM,
  PAL_LOOP,
  PAL_TO,
  drawClawd,
  drawLaptop,
  drawSquash,
  SQUASH_LOOP,
  isNervous,
  outfitOf,
  playOf,
  playPose,
  ROOMS,
  SCENE_PALETTE,
  SH,
  SPEED,
  STEP,
  SW,
  type Box,
  type Doing,
  type Grid,
  type Play,
  type SceneActor,
  type SceneProps,
  type TimeOfDay,
} from './scene'

/** A loop of 48 ticks covers every period the house uses (2, 3, 4, 6, 8, 12, 16, 24, 48). */
const LOOP = 48
/** Where an actor is drawn before his group is moved into place. */
const REF = 12

const FULL: Box = { x: 0, y: 0, w: SW, h: SH }

/** One path per colour over `box` (the pixels `keep` lets through), each run a `M x y h w v 1 h -w z`. */
function paths(grid: Grid, box: Box = FULL, keep: (i: number) => boolean = () => true): string {
  const runs = new Map<number, string>()
  for (let y = Math.max(0, box.y); y < Math.min(SH, box.y + box.h); y++) {
    let x = Math.max(0, box.x)
    const end = Math.min(SW, box.x + box.w)
    while (x < end) {
      const i = y * SW + x
      if (!keep(i)) {
        x++
        continue
      }
      const c = grid[i]!
      let run = x + 1
      while (run < end && grid[y * SW + run] === c && keep(y * SW + run)) run++
      if (c !== 0) runs.set(c, `${runs.get(c) ?? ''}M${x} ${y}h${run - x}v1h-${run - x}z`)
      x = run
    }
  }
  return [...runs].map(([c, d]) => `<path fill="${SCENE_PALETTE[c]}" d="${d}"/>`).join('')
}

/**
 * Frames over an opaque `box` that the still scene already shows at tick 0:
 * each frame paints only the pixels where it differs from that, and only
 * those `keep` lets through.
 */
function overStill(frames: readonly Grid[], box: Box, keep: (i: number) => boolean = () => true): string {
  const first = frames[0]
  if (first === undefined) return ''
  const marks = frames.map(g => paths(g, box, i => g[i] !== first[i] && keep(i)))
  return new Set(marks).size > 1 ? flipbook(marks) : ''
}

/**
 * Frames on a transparent ground: the pixels every frame shares drawn once,
 * then per frame only the rest.
 */
function layered(frames: readonly Grid[], box: Box): string {
  const first = frames[0]
  if (first === undefined) return ''
  const isShared = (i: number): boolean => first[i] !== 0 && frames.every(g => g[i] === first[i])
  return paths(first, box, isShared) + flipbook(frames.map(g => paths(g, box, i => !isShared(i))))
}

/** Frames as groups that take turns, each shown for one tick; the first is `f0`, the one that stays when motion is reduced. */
function flipbook(frames: readonly string[]): string {
  const unique = [...new Set(frames)]
  if (unique.length === 1) return `<g>${unique[0]}</g>`
  const dur = ((frames.length * STEP) / 1000).toFixed(3)
  return unique
    .map((markup, k) => {
      const values = frames.map(f => (f === markup ? 'visible' : 'hidden')).join(';')
      return `<g class="f${k === 0 ? '0' : ''}" visibility="hidden"><animate attributeName="visibility" values="${values}" dur="${dur}s" calcMode="discrete" repeatCount="indefinite"/>${markup}</g>`
    })
    .join('')
}

/**
 * The scene in three layers: everything still at tick 0; the scene's own
 * moving parts, each looping on its own period; and over them the game being
 * played, so the scene's periods and the game's never multiply into one long
 * loop of frames.
 */
function house(s: SceneProps, play: Play): string {
  const art = THEMES[s.theme]
  const sceneAt = (t: number): Grid => {
    const g = blank()
    drawScene(g, t, s, { hasClouds: false, isPlain: false })
    decorate(g, t, s)
    return g
  }
  const scene = sceneAt(0)
  const still = blank()
  drawBackground(still, 0, s, play, { hasClouds: false })
  const isBare = (i: number): boolean => still[i] === scene[i]
  const moving = [...art.parts, ...decorParts(s)].map(part => {
    const frames: Grid[] = []
    for (let t = 0; t < part.ticks; t++) frames.push(sceneAt(t))
    return overStill(frames, part, isBare)
  })
  const games: Grid[] = []
  for (let t = 0; t < LOOP; t++) {
    const g = scene.slice()
    gameRoom(g, t, play)
    games.push(g)
  }
  return paths(still) + moving.join('') + overStill(games, { x: 174, y: 0, w: SW - 174, h: SH })
}

/**
 * The pal walking the floor and back on a loop of its own: facing right one
 * way, left the other, its two steps taking turns. Reduced motion keeps it
 * home, with everything else that drifts.
 */
function palSvg(s: SceneProps): string {
  if (s.pal === null) return ''
  const box: Box = { x: 0, y: 14, w: 12, h: SH - 14 }
  const facing = (isLeft: boolean): string => {
    const steps = [0, 1].map(step => {
      const g = blank()
      drawPal(g, s.pal!, 0, step, isLeft)
      return paths(g, box)
    })
    return flipbook([steps[0]!, steps[0]!, steps[1]!, steps[1]!])
  }
  const loop = ((PAL_LOOP * STEP) / 1000).toFixed(1)
  return (
    `<g class="quiet drift"><animateTransform attributeName="transform" type="translate" values="${PAL_FROM} 0;${PAL_TO} 0;${PAL_FROM} 0" keyTimes="0;0.5;1" dur="${loop}s" repeatCount="indefinite"/>` +
    `<g><animate attributeName="visibility" values="visible;hidden" keyTimes="0;0.5" calcMode="discrete" dur="${loop}s" repeatCount="indefinite"/>${facing(false)}</g>` +
    `<g visibility="hidden"><animate attributeName="visibility" values="hidden;visible" keyTimes="0;0.5" calcMode="discrete" dur="${loop}s" repeatCount="indefinite"/>${facing(true)}</g>` +
    '</g>'
  )
}

/**
 * The rare sight on show: a shooting star whose streak's frames take turns
 * for a moment each loop, or the scene's critter on a clear ground. Both sit
 * over the scene and under the Clawds; reduced motion keeps them still.
 */
function eggSvg(s: SceneProps): string {
  if (s.egg === null) return ''
  const eggs = THEMES[s.theme].eggs
  if (s.egg === 'critter') {
    const frames: Grid[] = []
    for (let t = 0; t < eggs.critter.ticks; t++) {
      const g = blank()
      eggs.critter.draw(g, t)
      frames.push(g)
    }
    return `<g class="quiet">${layered(frames, eggs.critter.box)}</g>`
  }
  const streak: string[] = []
  for (let k = 0; k < STAR_LOOP; k++) {
    const g = blank()
    if (k < STAR_TICKS) drawStar(g, eggs.star, k)
    streak.push(paths(g, eggs.star))
  }
  return `<g class="quiet drift">${flipbook(streak)}</g>`
}

/** The sleepers' blankets, over the sleepers. */
function covers(s: SceneProps, play: Play, now: number): string {
  const g = blank()
  blankets(g, play, s, now + 60_000)
  return paths(g)
}

/** Clouds drift on their own: across the house's window, or the whole sky outdoors. */
function clouds(s: SceneProps): string {
  const sky = THEMES[s.theme].sky
  if (sky === null || s.time === 'night') return ''
  const fill = s.time === 'dusk' ? '#FBD3C0' : '#FFFFFF'
  if (s.theme === 'house') {
    return (
      '<clipPath id="glass"><rect x="141" y="6" width="12" height="4"/><rect x="154" y="6" width="13" height="4"/><rect x="141" y="11" width="12" height="4"/><rect x="154" y="11" width="13" height="4"/></clipPath>' +
      `<g class="drift" clip-path="url(#glass)" fill="${fill}">` +
      '<g><animateTransform attributeName="transform" type="translate" from="-12 0" to="30 0" dur="17s" repeatCount="indefinite"/><path d="M141 8h6v1h-6zM142 7h3v1h-3z"/></g>' +
      '<g><animateTransform attributeName="transform" type="translate" from="-20 0" to="30 0" dur="23s" begin="-9s" repeatCount="indefinite"/><path d="M146 12h5v1h-5zM147 11h2v1h-2z"/></g>' +
      '</g>'
    )
  }
  const rows = sky.h > 13 ? [4, 7, 10] : [3, 6]
  return (
    `<clipPath id="sky"><rect x="${sky.x}" y="${sky.y}" width="${sky.w}" height="${sky.h}"/></clipPath><g class="drift" clip-path="url(#sky)" fill="${fill}">` +
    rows
      .map(
        (y, i) =>
          `<g><animateTransform attributeName="transform" type="translate" from="-20 0" to="${SW + 10} 0" dur="${70 + i * 23}s" begin="-${(i * 37) % 70}s" repeatCount="indefinite"/><path d="M0 ${y}h7v1h-7zM1 ${y - 1}h4v1h-4z"/></g>`,
      )
      .join('') +
    '</g>'
  )
}

/** Roughly how wide `text` sets at `size`: CJK a full em, the rest six tenths. */
function textWidth(text: string, size: number): number {
  let em = 0
  for (const ch of text) em += (ch.codePointAt(0) ?? 0) > 0x2e80 ? 1 : 0.6
  return em * size
}

const escape = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const FONT = "font-family=\"'PingFang TC','Noto Sans TC','Microsoft JhengHei',system-ui,sans-serif\""

/** How far over his head the bubble must go: above a holiday hat, or an armful of books. */
function headroom(a: SceneActor, s: SceneProps): number {
  return Math.max(hatRise(outfitOf(a, s).hat), a.doing === 'tidy' ? 6 : 0)
}

function bubble(label: string, isMain: boolean, rise: number): string {
  if (label === '') return ''
  const size = isMain ? 2.4 : 1.9
  const width = textWidth(label, size) + 1.6
  const height = size + 1.2
  const cx = REF + 8
  const x = Math.max(cx - width / 2, REF - 12)
  const y = 13.2 - height - (isMain ? 0 : 1.2) - rise
  return (
    `<g class="quiet"><rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${width.toFixed(2)}" height="${height.toFixed(2)}" rx="0.8" fill="#FFFFFF" fill-opacity="0.94" stroke="#2A1A15" stroke-width="0.18"/>` +
    `<path d="M${cx - 0.8} ${(y + height).toFixed(2)}l0.8 1l0.8 -1z" fill="#FFFFFF"/>` +
    `<text x="${(x + 0.8).toFixed(2)}" y="${(y + size + 0.25).toFixed(2)}" font-size="${size}" fill="${isMain ? '#B4553A' : '#2A1A15'}" ${FONT}>${escape(label)}</text></g>`
  )
}

/** A soft shadow on the floor under a Clawd. */
const SHADOW = `<ellipse cx="${REF + 8}" cy="${FLOOR + 0.15}" rx="6.8" ry="0.85" fill="#000" fill-opacity="0.22"/>`

/** One Clawd: a walk that ends where he is going, then what he does there. */
function actor(a: SceneActor, index: number, s: SceneProps, now: number, play: Play): string {
  const box: Box = { x: REF - 6, y: 0, w: 32, h: SH }
  const frames = (doing: Parameters<typeof drawClawd>[3], ticks: number, isPlaying: boolean): string => {
    const out: Grid[] = []
    for (let t = 0; t < ticks; t++) {
      const g = blank()
      drawClawd(g, REF, t, doing, a.cap, index * 3, {
        ...(isPlaying ? playPose(a, t, play) : {}),
        ...outfitOf(a, s),
        isSweating: isPlaying && a.cap === null && isNervous(s),
      })
      out.push(g)
    }
    return layered(out, box)
  }
  const stay = frames(a.doing, LOOP, true)
  return following(a, now, `${SHADOW}`, stay, frames('walk', 4, false))
}

/** `stay` where a Clawd is going, or a walk there in `walk` first; `always` goes with him the whole way. */
function following(a: SceneActor, now: number, always: string, stay: string, walk: string): string {
  const x = actorX(a, now)
  if (x === a.toX) return `<g transform="translate(${a.toX - REF} 0)">${always}${stay}</g>`
  const dur = (Math.abs(a.toX - x) / SPEED).toFixed(3)
  return (
    `<g><animateTransform attributeName="transform" type="translate" from="${x - REF} 0" to="${a.toX - REF} 0" dur="${dur}s" fill="freeze"/>${always}` +
    (walk === '' ? '' : `<g><set attributeName="visibility" to="hidden" begin="${dur}s" fill="freeze"/>${walk}</g>`) +
    `<g visibility="hidden"><set attributeName="visibility" to="visible" begin="${dur}s" fill="freeze"/>${stay}</g></g>`
  )
}

/** A Clawd's speech bubble, going with him, drawn over the light so a dark room keeps it readable. */
function speech(a: SceneActor, s: SceneProps, now: number): string {
  // Asking, he holds up a sign of his own; the band's line says what for.
  const label = a.doing === 'ask' ? '' : bubble(a.label, a.cap === null, headroom(a, s))
  if (label === '') return ''
  const x = actorX(a, now)
  if (x === a.toX) return `<g transform="translate(${a.toX - REF} 0)">${label}</g>`
  const dur = (Math.abs(a.toX - x) / SPEED).toFixed(3)
  return `<g><animateTransform attributeName="transform" type="translate" from="${x - REF} 0" to="${a.toX - REF} 0" dur="${dur}s" fill="freeze"/>${label}</g>`
}

function signs(s: SceneProps): string {
  const names = say(s.lang).rooms[s.theme]
  const { fill, stroke, y } = THEMES[s.theme].signs
  const outline = stroke === 'none' ? '' : ` stroke="${stroke}" stroke-width="0.45" paint-order="stroke"`
  return ROOMS.map(
    room =>
      `<text x="${room.x + room.w / 2}" y="${y}" font-size="2.1" text-anchor="middle" fill="${fill}"${outline} ${FONT} font-weight="600">${escape(names[room.id])}</text>`,
  ).join('')
}

const rectOf = (b: Box, attrs = ''): string => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" ${attrs}/>`

/**
 * Reduced motion: the first frame of every loop stays (`!important` outranks
 * SMIL's own visibility), and the other frames, the clouds, the falling
 * leaves, the flicker and the drifting motes go.
 */
const STILL = '@media (prefers-reduced-motion:reduce){.f,.drift{display:none}.f0{visibility:visible!important}}'

const STYLE = `<style>:root{color-scheme:light dark;background:transparent}${STILL}</style>`

/** How far a light reaches, as an ellipse's two radii. */
function reachOf(glow: Glow): [number, number] {
  const { w, h } = glow.box
  switch (glow.kind) {
    case 'lamp':
      return [Math.max(9, w * 1.4), Math.max(7, h * 2)]
    case 'screen':
      return [w * 0.95, h * 1.3]
    case 'leds':
      return [Math.max(6, w * 0.8), Math.max(5, h * 0.6)]
    case 'window':
      return [w * 0.75, h * 1.6]
    case 'fire':
      return [w * 2, h * 1.5]
  }
}

/** How strongly a window lets light in at this hour; the station's only ever shows the stars. */
function daylight(art: ThemeArt, time: TimeOfDay): number {
  if (!art.hasDaylight) return 0.45
  return time === 'day' ? 1 : time === 'dusk' ? 0.7 : 0.3
}


/**
 * The scene's light: room by room, a dim veil with holes where its lights
 * reach; screens that are off go black; what is lit blooms a little. Then
 * the warm cast of dusk, and the depth every room has: a shadow under the
 * ceiling, and the floor a touch darker where it meets the wall.
 */
function lighting(s: SceneProps): string {
  const art = THEMES[s.theme]
  let defs =
    '<radialGradient id="pool"><stop offset="0" stop-color="#000"/><stop offset="0.6" stop-color="#000" stop-opacity="0.6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
    '<filter id="bloom" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.2"/></filter>'
  let veil = ''
  let over = ''
  for (const span of roomSpans()) {
    const isDark = s.dark.includes(span.id)
    const shade = shadeOf(art, s.time, isDark)
    const glows = art.glows.filter(g => g.room === span.id)
    const lit = glows.filter(g => !(isDark && isSwitched(g)))
    for (const g of glows) {
      if (lit.includes(g)) continue
      if (g.kind === 'screen') over += rectOf(g.box, 'fill="#0B0F14" fill-opacity="0.9"')
    }
    for (const g of lit) {
      const strength = g.kind === 'window' ? daylight(art, s.time) : 1
      const bloom = (0.12 + shade * 0.55) * strength
      const box = { x: g.box.x - 0.5, y: g.box.y - 0.5, w: g.box.w + 1, h: g.box.h + 1 }
      over += rectOf(box, `fill="${g.color}" opacity="${bloom.toFixed(2)}" filter="url(#bloom)"`)
      if (g.kind === 'fire') {
        over += `<g class="drift">${rectOf(box, `fill="${g.color}" filter="url(#bloom)"`).replace('/>', '><animate attributeName="opacity" values="0.05;0.35;0.12;0.3;0.05" dur="1.3s" repeatCount="indefinite"/></rect>')}</g>`
      }
    }
    if (shade === 0) continue
    const id = `veil-${span.id}`
    const width = span.x1 - span.x0
    let holes = ''
    for (const g of lit) {
      const [rx, ry] = reachOf(g)
      const strength = g.kind === 'window' ? daylight(art, s.time) : 1
      const cx = g.box.x + g.box.w / 2
      const cy = g.box.y + g.box.h / 2 + (g.kind === 'window' ? g.box.h * 0.6 : 0)
      holes += `<ellipse cx="${cx}" cy="${cy}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="url(#pool)" opacity="${strength.toFixed(2)}"/>`
      holes += rectOf(g.box, `fill="#000" opacity="${strength.toFixed(2)}"`)
    }
    defs += `<mask id="${id}" maskUnits="userSpaceOnUse" x="${span.x0}" y="0" width="${width}" height="${SH}"><rect x="${span.x0}" y="0" width="${width}" height="${SH}" fill="#FFF"/>${holes}</mask>`
    veil += `<rect x="${span.x0}" y="0" width="${width}" height="${SH}" fill="${NIGHT}" opacity="${shade}" mask="url(#${id})"/>`
  }
  const dusk = s.time === 'dusk' ? `<rect width="${SW}" height="${SH}" fill="#FF8A4C" opacity="0.07"/>` : ''
  defs +=
    '<linearGradient id="ceiling" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.16"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.12"/></linearGradient>'
  const depth = art.isIndoor
    ? `<rect x="0" y="3" width="${SW}" height="5" fill="url(#ceiling)"/><rect x="0" y="17" width="${SW}" height="8" fill="url(#ground)"/>`
    : `<rect x="0" y="19" width="${SW}" height="6" fill="url(#ground)"/>`
  return `<defs>${defs}</defs><g>${depth}${veil}${dusk}${over}</g>`
}

/**
 * The air moving, a few specks at a time: dust in the light from the house's
 * window by day, the stars twinkling past the station's, glints on the sea,
 * and fireflies at the camp after sundown.
 */
function atmosphere(s: SceneProps): string {
  const specks: string[] = []
  const drift = (x: number, y: number, dx: number, dy: number, r: number, fill: string, dur: number, begin: number, blink = false): string =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}">` +
    `<animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy};0 0" dur="${dur}s" begin="-${begin}s" repeatCount="indefinite"/>` +
    `<animate attributeName="opacity" values="${blink ? '0;1;0.2;1;0' : '0;0.7;0.5;0.7;0'}" dur="${(dur / 2).toFixed(1)}s" begin="-${begin}s" repeatCount="indefinite"/></circle>`
  switch (s.theme) {
    case 'house':
      if (s.time === 'night' || s.dark.includes('web')) break
      for (let i = 0; i < 6; i++) specks.push(drift(143 + ((i * 37) % 24), 13 + ((i * 11) % 9), 2 + (i % 3), -3 - (i % 2), 0.28, '#FFF6D8', 9 + i * 2, i * 3))
      break
    case 'space':
      for (const [x, y, k] of [[145, 8, 0], [159, 7, 1], [151, 12, 2], [164, 13, 3]] as const) {
        specks.push(`<path d="M${x - 0.9} ${y}h1.8M${x} ${y - 0.9}v1.8" stroke="#FFFFFF" stroke-width="0.35" opacity="0"><animate attributeName="opacity" values="0;0.9;0" dur="3.2s" begin="${k * 0.8}s" repeatCount="indefinite"/></path>`)
      }
      break
    case 'beach':
      if (s.time === 'night') break
      for (let i = 0; i < 8; i++) {
        const x = 8 + ((i * 53) % 236)
        const y = 15.5 + (i % 3) * 1.1
        specks.push(`<rect x="${x}" y="${y}" width="1.6" height="0.3" fill="#FFFFFF" opacity="0"><animate attributeName="opacity" values="0;0.9;0" dur="${2 + (i % 3) * 0.7}s" begin="${(i * 0.45).toFixed(2)}s" repeatCount="indefinite"/></rect>`)
      }
      break
    case 'forest':
      if (s.time === 'day') break
      for (let i = 0; i < 8; i++) specks.push(drift(20 + ((i * 61) % 220), 15 + ((i * 7) % 7), 4 - (i % 3) * 3, -2 + (i % 2) * 3, 0.38, '#E8FF8A', 6 + i, i * 2, true))
      break
  }
  if (specks.length === 0) return ''
  return `<g class="drift" filter="url(#bloom)">${specks.join('')}</g>`
}

/**
 * What lights up under the pointer in one room, cropped to the room's own
 * stretch (`x0` to `x0 + width`, scene pixels) so the band can lay it over
 * exactly that: the room a little brighter, its lamp lit, its toy saying hi.
 */
export function roomHoverSvg(s: SceneProps, x0: number, width: number): string {
  const art = THEMES[s.theme]
  const inside = (b: Box): boolean => b.x + b.w > x0 && b.x < x0 + width
  const body =
    `<rect x="${x0}" y="3" width="${width}" height="22" fill="#FFFFFF" fill-opacity="0.08"/>` +
    (inside(art.light.box) ? art.light.glow : '') +
    (inside(art.toy.box) ? art.toy.hi : '')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0.toFixed(3)} 0 ${width.toFixed(3)} ${SH}" width="100%" height="100%" shape-rendering="crispEdges" preserveAspectRatio="none">${STYLE}${body}</svg>`
}

/** Hearts and a blush for a Clawd under the pointer, cropped like `roomHoverSvg`; `x` is his left edge. */
export function actorHoverSvg(x: number, x0: number, width: number): string {
  const dx = x - REF
  const body =
    `<g transform="translate(${dx} 0)"><path fill="#E5484D" d="M${REF + 15} 9h1v1h-1zM${REF + 17} 9h1v1h-1zM${REF + 15} 10h3v1h-3zM${REF + 16} 11h1v1h-1z` +
    `M${REF - 3} 12h1v1h-1zM${REF - 1} 12h1v1h-1zM${REF - 3} 13h3v1h-3zM${REF - 2} 14h1v1h-1z"/>` +
    `<path fill="#F6A5B8" d="M${REF + 2} 20h2v1h-2zM${REF + 12} 20h2v1h-2z"/></g>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0.toFixed(3)} 0 ${width.toFixed(3)} ${SH}" width="100%" height="100%" shape-rendering="crispEdges" preserveAspectRatio="none">${STYLE}${body}</svg>`
}

/** The house as an SVG that fills its box; the same props and time give the same text. */
export function sceneSvg(s: SceneProps, now: number): string {
  // The game is drawn as it will be once the players get there, so a ball
  // never waits for a redraw to appear.
  const play = playOf(s, now + 60_000)
  const order = s.actors.map((a, i) => ({ a, i })).sort((p, q) => Number(p.a.cap === null) - Number(q.a.cap === null))
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SW} ${SH}" width="100%" height="100%" shape-rendering="crispEdges">` +
    STYLE +
    house(s, play) +
    clouds(s) +
    eggSvg(s) +
    order.map(({ a, i }) => actor(a, i, s, now, play)).join('') +
    covers(s, play, now) +
    palSvg(s) +
    lighting(s) +
    atmosphere(s) +
    order.map(({ a }) => speech(a, s, now)).join('') +
    signs(s) +
    fallingSvg(s) +
    '</svg>'
  )
}

/** A finished tool row's little Clawd: one still frame, pleased when it went well, worried when it did not. */
export function doneClawdSvg(isOk: boolean): string {
  const box: Box = { x: REF - 3, y: 9, w: 24, h: 16 }
  const g = blank()
  drawClawd(g, REF, 1, isOk ? 'idle' : 'oops', null, 0, { eyes: isOk ? 'happy' : 'wide' })
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" width="100%" height="100%" shape-rendering="crispEdges">` +
    `<style>:root{color-scheme:light dark;background:transparent}</style>${paths(g, box)}</svg>`
  )
}

/**
 * One small Clawd on his own, for the spinner and the folded band:
 * transparent, filling its box. `isOnLaptop` has him typing away on a laptop.
 */
export function miniClawdSvg(doing: Doing, isOnLaptop = false): string {
  const box: Box = { x: REF - 3, y: 9, w: 24, h: 16 }
  const frames: Grid[] = []
  for (let t = 0; t < LOOP; t++) {
    const g = blank()
    if (isOnLaptop) {
      drawClawd(g, REF, t, 'type', null, 0, { look: 0, eyes: t % 24 === 11 ? 'blink' : 'open' })
      drawLaptop(g, REF, t)
    } else {
      drawClawd(g, REF, t, doing, null)
    }
    frames.push(g)
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" width="100%" height="100%" shape-rendering="crispEdges">` +
    `<style>:root{color-scheme:light dark;background:transparent}${STILL}</style>${layered(frames, box)}</svg>`
  )
}

/**
 * The spinner's Clawd while the conversation is compacted, stomping a messy
 * pile of pages into a neat bundle. Three rows taller than `miniClawdSvg`
 * for his jumps: drawn 30 × 23.75, his pixels are the same size.
 */
export function squashClawdSvg(): string {
  const box: Box = { x: REF - 3, y: 6, w: 24, h: 19 }
  const frames: Grid[] = []
  for (let t = 0; t < SQUASH_LOOP; t++) {
    const g = blank()
    drawSquash(g, REF, t)
    frames.push(g)
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" width="100%" height="100%" shape-rendering="crispEdges">` +
    `<style>:root{color-scheme:light dark;background:transparent}${STILL}</style>${layered(frames, box)}</svg>`
  )
}
