// The house as one animated, hoverable SVG for the surfaces that draw SVG.
// Nothing in it needs a redraw: the static house is drawn once, each moving
// part loops on its own as a flipbook, and a walking Clawd slides to his spot
// with SMIL and then switches to what he does there. Hovering is CSS alone:
// a Clawd hams it up, the lamp lights, the arcade says hi, and every room,
// Clawd, the board and the calendar carry a tooltip. `color-scheme` on the
// root keeps the surface's frame transparent.

import { say } from './i18n'
import {
  actorTip,
  actorX,
  ARCADE_BOX,
  BOARD,
  blank,
  CALENDAR,
  drawBackground,
  drawClawd,
  isNervous,
  LAMP,
  playOf,
  playPose,
  ROOMS,
  SCENE_PALETTE,
  SH,
  SPEED,
  STEP,
  SW,
  type Box,
  type Grid,
  type Play,
  type SceneActor,
  type SceneProps,
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
 * Frames over an opaque `box` that the still house already shows at tick 0:
 * each frame paints only the pixels where it differs from that.
 */
function overStill(frames: readonly Grid[], box: Box): string {
  const first = frames[0]
  if (first === undefined) return ''
  const marks = frames.map(g => paths(g, box, i => g[i] !== first[i]))
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

/** Frames as groups that take turns, each shown for one tick. */
function flipbook(frames: readonly string[]): string {
  const unique = [...new Set(frames)]
  if (unique.length === 1) return `<g>${unique[0]}</g>`
  const dur = ((frames.length * STEP) / 1000).toFixed(3)
  return unique
    .map(markup => {
      const values = frames.map(f => (f === markup ? 'visible' : 'hidden')).join(';')
      return `<g visibility="hidden"><animate attributeName="visibility" values="${values}" dur="${dur}s" calcMode="discrete" repeatCount="indefinite"/>${markup}</g>`
    })
    .join('')
}

/** The moving parts of the house, each a box and how many ticks it loops over. */
const PARTS: readonly (Box & { ticks: number })[] = [
  { x: 77, y: 10, w: 10, h: 6, ticks: 16 },
  { x: 121, y: 8, w: 10, h: 14, ticks: 16 },
  { x: 100, y: 16, w: 4, h: 1, ticks: 4 },
  { x: 141, y: 6, w: 26, h: 9, ticks: 24 },
  { x: 160, y: 16, w: 7, h: 6, ticks: 18 },
  { x: 177, y: 9, w: 8, h: 7, ticks: 8 },
  { x: 186, y: 3, w: 62, h: 22, ticks: 48 },
  { x: 66, y: 4, w: 9, h: 2, ticks: 4 },
]

function house(s: SceneProps, play: Play): string {
  const still = blank()
  drawBackground(still, 0, s, play, { hasClouds: false })
  const moving = PARTS.map(part => {
    const frames: Grid[] = []
    for (let t = 0; t < part.ticks; t++) {
      const g = blank()
      drawBackground(g, t, s, play, { hasClouds: false })
      frames.push(g)
    }
    return overStill(frames, part)
  })
  return paths(still) + moving.join('')
}

/** Clouds drift across the window on their own, clipped to the glass. */
function clouds(s: SceneProps): string {
  if (s.time === 'night') return ''
  const fill = s.time === 'dusk' ? '#FBD3C0' : '#FFFFFF'
  return (
    '<clipPath id="glass"><rect x="141" y="6" width="12" height="4"/><rect x="154" y="6" width="13" height="4"/><rect x="141" y="11" width="12" height="4"/><rect x="154" y="11" width="13" height="4"/></clipPath>' +
    `<g clip-path="url(#glass)" fill="${fill}">` +
    '<g><animateTransform attributeName="transform" type="translate" from="-12 0" to="30 0" dur="17s" repeatCount="indefinite"/><path d="M141 8h6v1h-6zM142 7h3v1h-3z"/></g>' +
    '<g><animateTransform attributeName="transform" type="translate" from="-20 0" to="30 0" dur="23s" begin="-9s" repeatCount="indefinite"/><path d="M146 12h5v1h-5zM147 11h2v1h-2z"/></g>' +
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

function bubble(label: string, isMain: boolean): string {
  if (label === '') return ''
  const size = isMain ? 2.4 : 1.9
  const width = textWidth(label, size) + 1.6
  const height = size + 1.2
  const cx = REF + 8
  const x = Math.max(cx - width / 2, REF - 12)
  const y = 13.2 - height - (isMain ? 0 : 1.2)
  return (
    `<g class="quiet"><rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${width.toFixed(2)}" height="${height.toFixed(2)}" rx="0.8" fill="#FFFFFF" fill-opacity="0.94" stroke="#2A1A15" stroke-width="0.18"/>` +
    `<path d="M${cx - 0.8} ${(y + height).toFixed(2)}l0.8 1l0.8 -1z" fill="#FFFFFF"/>` +
    `<text x="${(x + 0.8).toFixed(2)}" y="${(y + size + 0.25).toFixed(2)}" font-size="${size}" fill="${isMain ? '#B4553A' : '#2A1A15'}" ${FONT}>${escape(label)}</text></g>`
  )
}

/** Hearts and a blush a hovered Clawd shows while CSS makes him hop. */
const PET =
  `<g class="pet"><path fill="#E5484D" d="M${REF + 15} 9h1v1h-1zM${REF + 17} 9h1v1h-1zM${REF + 15} 10h3v1h-3zM${REF + 16} 11h1v1h-1z` +
  `M${REF - 3} 12h1v1h-1zM${REF - 1} 12h1v1h-1zM${REF - 3} 13h3v1h-3zM${REF - 2} 14h1v1h-1z"/>` +
  `<path fill="#F6A5B8" d="M${REF + 2} 20h2v1h-2zM${REF + 12} 20h2v1h-2z"/></g>`

/** One Clawd: a walk that ends where he is going, then what he does there; under the pointer he hops. */
function actor(a: SceneActor, index: number, s: SceneProps, now: number, play: Play): string {
  const box: Box = { x: REF - 6, y: 0, w: 32, h: SH }
  const frames = (doing: Parameters<typeof drawClawd>[3], ticks: number, isPlaying: boolean): string => {
    const out: Grid[] = []
    for (let t = 0; t < ticks; t++) {
      const g = blank()
      drawClawd(g, REF, t, doing, a.cap, index * 3, { ...(isPlaying ? playPose(a, t, play) : {}), isSweating: isPlaying && a.cap === null && isNervous(s) })
      out.push(g)
    }
    return layered(out, box)
  }
  const x = actorX(a, now)
  const label = bubble(a.label, a.cap === null)
  const stay = `<g class="act">${frames(a.doing, LOOP, true)}</g>${PET}`
  const title = `<title>${escape(actorTip(a, s.lang))}</title>`
  if (x === a.toX) return `<g class="clawd" transform="translate(${a.toX - REF} 0)">${title}${stay}${label}</g>`
  const dur = (Math.abs(a.toX - x) / SPEED).toFixed(3)
  return (
    `<g class="clawd">${title}<animateTransform attributeName="transform" type="translate" from="${x - REF} 0" to="${a.toX - REF} 0" dur="${dur}s" fill="freeze"/>` +
    `<g><set attributeName="visibility" to="hidden" begin="${dur}s" fill="freeze"/>${frames('walk', 4, false)}</g>` +
    `<g visibility="hidden"><set attributeName="visibility" to="visible" begin="${dur}s" fill="freeze"/>${stay}</g>` +
    `${label}</g>`
  )
}

function signs(s: SceneProps): string {
  const names = say(s.lang).rooms
  return ROOMS.map(
    room =>
      `<text x="${room.x + room.w / 2}" y="2.35" font-size="2.1" text-anchor="middle" fill="#F3E3C3" ${FONT} font-weight="600">${escape(names[room.id])}</text>`,
  ).join('')
}

const rectOf = (b: Box, attrs = ''): string => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" ${attrs}/>`

/** The hover layer: every room, the board, the calendar, the lamp, the arcade and the window. */
function hovers(s: SceneProps): string {
  const words = say(s.lang)
  const rooms = ROOMS.map(
    room => `<g class="room">${rectOf({ x: room.x, y: 3, w: room.w, h: 22 }, 'class="glass"')}<title>${escape(words.roomTips[room.id])}</title></g>`,
  ).join('')
  const board = words.boardTitle(s.board)
  const calendar = s.deadline === '' ? words.calendarEmpty : words.calendar(s.deadline)
  const ring = (b: Box): string =>
    rectOf({ x: b.x - 0.5, y: b.y - 0.5, w: b.w + 1, h: b.h + 1 }, 'class="on" fill="none" stroke="#F5C542" stroke-width="0.5"')
  const glow = '<path class="on" fill="#FCE7A6" fill-opacity="0.85" d="M22 14h9v1h-9zM21 17h11v1h-11zM22 18h9v1h-9zM20 15h4v1h-4zM29 15h4v1h-4z"/>'
  const hi =
    '<g class="on"><rect x="177" y="9" width="8" height="6" fill="#2E3138"/><path fill="#F5C542" d="M178 10h1v4h-1zM180 10h1v4h-1zM179 12h1v1h-1zM182 10h1v4h-1z"/><path fill="#E5484D" d="M184 10h1v3h-1zM184 14h1v1h-1z"/></g>'
  return (
    rooms +
    `<g class="spot">${rectOf(BOARD, 'class="glass"')}${ring(BOARD)}<title>${escape(board)}</title></g>` +
    `<g class="spot">${rectOf(CALENDAR, 'class="glass"')}${ring(CALENDAR)}<title>${escape(calendar)}</title></g>` +
    `<g class="spot">${rectOf(LAMP, 'class="glass"')}${glow}<title>${escape(words.lamp)}</title></g>` +
    `<g class="spot">${rectOf(ARCADE_BOX, 'class="glass"')}${hi}<title>${escape(words.arcade)}</title></g>` +
    `<g class="spot">${rectOf({ x: 140, y: 5, w: 28, h: 11 }, 'class="glass"')}<title>${escape(words.outside[s.time])}</title></g>`
  )
}

const STYLE =
  '<style>' +
  ':root{color-scheme:light dark;background:transparent}' +
  '.art,.quiet{pointer-events:none}' +
  '.glass{fill:#FFFFFF;fill-opacity:0}' +
  '.room:hover .glass{fill-opacity:0.07}' +
  '.on{display:none}.spot:hover .on{display:inline}' +
  '.pet{display:none}.clawd:hover .pet{display:inline;animation:rise 1s steps(5) infinite}' +
  '.clawd:hover .act{animation:hop .5s steps(2,jump-none) infinite}' +
  '@keyframes hop{from{transform:translateY(0)}to{transform:translateY(-2px)}}' +
  '@keyframes rise{from{transform:translateY(0);opacity:1}to{transform:translateY(-5px);opacity:0}}' +
  '</style>'

/** The house as an SVG that fills its box; the same props and time give the same text. */
export function sceneSvg(s: SceneProps, now: number): string {
  // The game is drawn as it will be once the players get there, so a ball
  // never waits for a redraw to appear.
  const play = playOf(s, now + 60_000)
  const order = s.actors.map((a, i) => ({ a, i })).sort((p, q) => Number(p.a.cap === null) - Number(q.a.cap === null))
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SW} ${SH}" width="100%" height="100%" shape-rendering="crispEdges">` +
    STYLE +
    `<g class="art">${house(s, play)}${clouds(s)}${signs(s)}</g>` +
    hovers(s) +
    order.map(({ a, i }) => actor(a, i, s, now, play)).join('') +
    '</svg>'
  )
}
