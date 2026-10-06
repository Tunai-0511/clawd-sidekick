// The house on the terminal: composed every tick from scene.ts, two pixels a
// cell, and cropped to the band's width (at most MAX_COLUMNS, so one frame
// stays inside a tree's bounds) with a camera that follows the main Clawd.
// The pointer finds things: a Clawd under it hams it up, and the line under
// the house says what is there; a click on a Clawd pets him.

import type { ClientModule, RenderElement } from 'claude-code'

import { say, type Lang } from './i18n'
import { actorX, composeScene, hitTest, ROOMS, SCENE_PALETTE, SH, STEP, SW, tipOf, type Hit, type SceneProps, type Theme } from './scene'

type Live = { t: number; hover?: Hit }

const MAX_COLUMNS = 150

/** What the last draw showed, for the pointer handler: the crop's left edge and the props. */
const view: { left: number; props?: SceneProps } = { left: 0 }

type Cell = { glyph: string; color?: string; backgroundColor?: string }

function cell(top: number, bottom: number): Cell {
  if (top === 0 && bottom === 0) return { glyph: ' ' }
  if (top === bottom) return { glyph: '█', color: SCENE_PALETTE[top] }
  if (bottom === 0) return { glyph: '▀', color: SCENE_PALETTE[top] }
  if (top === 0) return { glyph: '▄', color: SCENE_PALETTE[bottom] }
  return { glyph: '▀', color: SCENE_PALETTE[top], backgroundColor: SCENE_PALETTE[bottom] }
}

const isSame = (a: Cell, b: Cell): boolean =>
  a.glyph === b.glyph && a.color === b.color && a.backgroundColor === b.backgroundColor

/** Terminal cells a string takes: CJK two, the rest one. */
const cellsOf = (text: string): number => [...text].reduce((n, ch) => n + ((ch.codePointAt(0) ?? 0) > 0x2e80 ? 2 : 1), 0)

/** The room names under the house, each centred on its room within the crop. */
function signs(left: number, columns: number, lang: Lang, theme: Theme): string {
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

const keyOf = (hit: Hit | undefined): string => (hit === undefined ? '' : hit.kind === 'actor' || hit.kind === 'room' ? `${hit.kind}:${hit.id}` : hit.kind)

const SceneClient: ClientModule<SceneProps, Live> = (props, surface) => {
  if (surface.state === undefined) {
    const live: Live = { t: 0 }
    surface.every(STEP, () => {
      live.t += 1
      surface.setState({ ...live })
    })
    surface.onPointer(event => {
      const shown = view.props
      if (shown === undefined) return
      const row = event.y * 2 + ((event.fine?.y ?? event.y) % 1 >= 0.5 ? 1 : 0)
      const hit = event.type === 'leave' || event.y >= SH / 2 ? undefined : hitTest(shown, Date.now(), view.left + event.x, row)
      if (event.type === 'down' && hit?.kind === 'actor') surface.post({ type: 'pet', id: hit.id })
      if (keyOf(hit) !== keyOf(live.hover)) {
        live.hover = hit
        surface.setState({ ...live })
      }
    })
    surface.setState({ ...live })
  }
  const { Box, Text } = surface.elements
  const t = surface.state?.t ?? 0
  const hover = surface.state?.hover
  const now = Date.now()
  const grid = composeScene(props, t, now, { isPlain: true, hover: hover?.kind === 'actor' ? hover.id : undefined })
  const columns = Math.min(surface.columns > 0 ? surface.columns : MAX_COLUMNS, MAX_COLUMNS, SW)
  const main = props.actors.find(a => a.cap === null)
  const follow = main === undefined ? 0 : actorX(main, now) + 8
  const left = Math.max(0, Math.min(SW - columns, Math.round(follow - columns / 2)))
  view.left = left
  view.props = props
  const rows: RenderElement[] = []
  for (let y = 0; y < SH; y += 2) {
    const runs: { cell: Cell; text: string }[] = []
    for (let x = left; x < left + columns; x++) {
      const next = cell(grid[y * SW + x] ?? 0, grid[(y + 1) * SW + x] ?? 0)
      const last = runs[runs.length - 1]
      if (last !== undefined && isSame(last.cell, next)) last.text += next.glyph
      else runs.push({ cell: next, text: next.glyph })
    }
    rows.push(
      <Box flexDirection="row">
        {runs.map(run => (
          <Text color={run.cell.color} backgroundColor={run.cell.backgroundColor}>
            {run.text}
          </Text>
        ))}
      </Box>,
    )
  }
  return (
    <Box flexDirection="column">
      {rows}
      {hover === undefined ? (
        <Text dimColor wrap="truncate">
          {signs(left, columns, props.lang, props.theme)}
        </Text>
      ) : (
        <Text color="#F5C542" wrap="truncate">
          {tipOf(props, hover)}
        </Text>
      )}
    </Box>
  )
}

export default SceneClient
