// Clawd on the terminal: a surface module with its own frame clock, two
// pixels a cell (▀ with a foreground and a background), eyes that follow
// the pointer, and a click that pets him.

import type { ClientModule, RenderElement } from 'claude-code'

import { CYCLE, frame, H, PALETTE, TICK_MS, W, type Grid, type Pose } from './sprite'

type Props = { pose: Pose; isNervous: boolean; scale: number }

type Live = { t: number; petUntil: number; look: -1 | 0 | 1 | undefined }

type Cell = { glyph: string; color?: string; backgroundColor?: string }

function cell(top: number, bottom: number): Cell {
  if (top === 0 && bottom === 0) return { glyph: ' ' }
  if (top === bottom) return { glyph: '█', color: PALETTE[top] }
  if (bottom === 0) return { glyph: '▀', color: PALETTE[top] }
  if (top === 0) return { glyph: '▄', color: PALETTE[bottom] }
  return { glyph: '▀', color: PALETTE[top], backgroundColor: PALETTE[bottom] }
}

const isSame = (a: Cell, b: Cell): boolean =>
  a.glyph === b.glyph && a.color === b.color && a.backgroundColor === b.backgroundColor

/** One row of cells per two pixel rows, runs of one style merged into one Text. */
function draw(grid: Grid, scale: number, elements: Parameters<ClientModule>[1]['elements']): RenderElement {
  const { Box, Text } = elements
  const at = (x: number, y: number): number => grid[Math.floor(y / scale) * W + Math.floor(x / scale)] ?? 0
  const rows: RenderElement[] = []
  for (let y = 0; y < H * scale; y += 2) {
    const runs: { cell: Cell; text: string }[] = []
    for (let x = 0; x < W * scale; x++) {
      const next = cell(at(x, y), at(x, y + 1))
      const last = runs[runs.length - 1]
      if (last !== undefined && isSame(last.cell, next)) last.text += next.glyph
      else runs.push({ cell: next, text: next.glyph })
    }
    rows.push(
      <Box flexDirection="row">
        {runs.map(run => (
          <Text color={run.cell.color} backgroundColor={run.cell.backgroundColor} wrap="truncate">
            {run.text}
          </Text>
        ))}
      </Box>,
    )
  }
  return <Box flexDirection="column">{rows}</Box>
}

const ClawdClient: ClientModule<Props, Live> = (props, surface) => {
  if (surface.state === undefined) {
    const live: Live = { t: 0, petUntil: -1, look: undefined }
    surface.every(TICK_MS, () => {
      live.t += 1
      surface.setState({ ...live })
    })
    surface.onPointer(event => {
      const columns = W * props.scale
      if (event.type === 'leave') live.look = undefined
      else live.look = event.x < columns / 3 ? -1 : event.x > (columns * 2) / 3 ? 1 : 0
      if (event.type === 'down') {
        live.petUntil = live.t + CYCLE.love * 2
        surface.post({ type: 'pet' })
      }
      surface.setState({ ...live })
    })
    surface.setState({ ...live })
  }
  const live = surface.state ?? { t: 0, petUntil: -1, look: undefined }
  const isPetted = live.t < live.petUntil
  const pose: Pose = isPetted ? 'love' : props.pose
  const grid = frame(pose, live.t, { look: live.look, isNervous: props.isNervous })
  return draw(grid, props.scale, surface.elements)
}

export default ClawdClient
