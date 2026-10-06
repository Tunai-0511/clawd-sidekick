// Clawd for the surfaces that draw SVG (desktop, VS Code, mobile): every
// frame of a pose as one group, shown in turn by SMIL, so he moves with no
// redraw at all. Hovering him swaps in the petting loop, by CSS alone.

import { CYCLE, frame, H, PALETTE, TICK_MS, W, type FrameOptions, type Grid, type Pose } from './sprite'

/** One path per colour, each pixel run a `M x y h w v 1 h -w z`. */
function paths(grid: Grid): string {
  const runs = new Map<number, string>()
  for (let y = 0; y < H; y++) {
    let x = 0
    while (x < W) {
      const c = grid[y * W + x]!
      let end = x + 1
      while (end < W && grid[y * W + end] === c) end++
      if (c !== 0) runs.set(c, `${runs.get(c) ?? ''}M${x} ${y}h${end - x}v1h-${end - x}z`)
      x = end
    }
  }
  return [...runs].map(([c, d]) => `<path fill="${PALETTE[c]}" d="${d}"/>`).join('')
}

/** The frames of `pose` as groups that take turns. */
function flipbook(pose: Pose, options: FrameOptions): string {
  const ticks = CYCLE[pose]
  const frames: string[] = []
  for (let t = 0; t < ticks; t++) frames.push(paths(frame(pose, t, options)))
  const unique = [...new Set(frames)]
  if (unique.length === 1) return `<g>${unique[0]}</g>`
  const dur = ((ticks * TICK_MS) / 1000).toFixed(3)
  return unique
    .map(markup => {
      const values = frames.map(f => (f === markup ? 'visible' : 'hidden')).join(';')
      return `<g visibility="hidden"><animate attributeName="visibility" values="${values}" dur="${dur}s" calcMode="discrete" repeatCount="indefinite"/>${markup}</g>`
    })
    .join('')
}

/** Clawd in `pose` as groups to set inside another SVG, on a 40 × 14 grid of his own. */
export const clawdArt = (pose: Pose, options: FrameOptions = {}): string => flipbook(pose, options)

/** An animated SVG of Clawd in `pose`, `scale` CSS pixels a pixel. */
export function clawdSvg(pose: Pose, options: FrameOptions = {}, scale = 4): string {
  const main = flipbook(pose, options)
  const pet = pose === 'love' ? '' : `<g class="pet">${flipbook('love', {})}</g>`
  const style = pet === '' ? '' : '<style>.pet{display:none}svg:hover .pet{display:inline}svg:hover .main{display:none}</style>'
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * scale}" height="${H * scale}" shape-rendering="crispEdges">` +
    `${style}<g class="main">${main}</g>${pet}</svg>`
  )
}
