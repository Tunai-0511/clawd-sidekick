// The spinner, Clawd's way: on the terminal the CLI banner's own Clawd,
// blinking, thinking in dots or tapping his feet while a tool runs, beside
// the word and a clock that counts every second; on the desktop the clock
// and the word alone, beside the hooks module's animated Clawd.

import type { ClientModule } from 'claude-code'

type Props = {
  word: string
  suffix: string
  /** What the turn is doing, in the person's language. */
  mode: string
  /** When the turn began, wall-clock milliseconds. */
  startedAt: number
  doing: 'think' | 'type' | 'code'
  isTerminal: boolean
}

type Live = { t: number }

const ORANGE = '#D97757'

function elapsed(startedAt: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
  return seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`
}

const SpinnerClient: ClientModule<Props, Live> = (props, surface) => {
  if (surface.state === undefined) {
    const live: Live = { t: 0 }
    surface.every(250, () => {
      live.t += 1
      surface.setState({ ...live })
    })
    surface.setState({ ...live })
  }
  const { Box, Text } = surface.elements
  const t = surface.state?.t ?? 0
  const dots = props.doing === 'think' ? '·'.repeat(1 + (t % 3)) : ''
  const line = (
    <Text>
      <Text color={ORANGE} bold>
        {`${props.word}${props.suffix}`}
      </Text>
      <Text dimColor>{`  ${elapsed(props.startedAt)} · ${props.mode} ${dots}`}</Text>
    </Text>
  )
  if (!props.isTerminal) return line
  const isBlink = t % 16 === 5
  const legs = props.doing === 'think' ? '  ▘▘ ▝▝' : t % 2 === 0 ? '  ▘▘ ▝▝' : '  ▝▘ ▘▝'
  return (
    <Box flexDirection="row" gap={1}>
      <Box flexDirection="column">
        <Text color={ORANGE}>{isBlink ? ' ▐█████▌' : ' ▐▛███▜▌'}</Text>
        <Text color={ORANGE}>{props.doing === 'type' && t % 2 === 1 ? '▗▜█████▛▖' : '▝▜█████▛▘'}</Text>
        <Text color={ORANGE}>{legs}</Text>
      </Box>
      <Box flexDirection="column" justifyContent="center">
        {line}
      </Box>
    </Box>
  )
}

export default SpinnerClient
