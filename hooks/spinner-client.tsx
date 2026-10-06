// The spinner, Clawd's way: on the terminal the CLI banner's own Clawd,
// blinking, thinking in dots, or at work on a laptop, tapping at its keys,
// beside the word and a clock that counts every second; on the desktop the
// clock and the word alone, beside the hooks module's animated Clawd.

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
const LID = '#C9CDD3'
const DECK = '#8A8F98'

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
  // The desktop says what the turn is doing after the row itself ("Thinking"),
  // and its Clawd thinks in dots of his own: there the line is the word and the clock.
  const detail = props.isTerminal ? `  ${elapsed(props.startedAt)} · ${props.mode} ${dots}` : `  ${elapsed(props.startedAt)}${props.mode === '' ? '' : ` · ${props.mode}`}`
  const line = (
    <Text>
      <Text color={ORANGE} bold>
        {`${props.word}${props.suffix}`}
      </Text>
      <Text dimColor>{detail}</Text>
    </Text>
  )
  if (!props.isTerminal) return line
  const isBlink = t % 16 === 5
  const head = <Text color={ORANGE}>{isBlink ? ' ▐█████▌' : ' ▐▛███▜▌'}</Text>
  // At work: the lid hides his lower half, the deck his legs, and his arms take turns at the keys.
  const clawd =
    props.doing === 'think' ? (
      <Box flexDirection="column">
        {head}
        <Text color={ORANGE}>▝▜█████▛▘</Text>
        <Text color={ORANGE}>{'  ▘▘ ▝▝'}</Text>
      </Box>
    ) : (
      <Box flexDirection="column">
        {head}
        <Text>
          <Text color={ORANGE}>{t % 2 === 0 ? '▝' : '▗'}</Text>
          <Text color={LID} backgroundColor={ORANGE}>
            ▄▄▄▄▄▄▄
          </Text>
          <Text color={ORANGE}>{t % 2 === 0 ? '▖' : '▘'}</Text>
        </Text>
        <Text color={DECK}>{' ▀▀▀▀▀▀▀ '}</Text>
      </Box>
    )
  return (
    <Box flexDirection="row" gap={1}>
      {clawd}
      <Box flexDirection="column" justifyContent="center">
        {line}
      </Box>
    </Box>
  )
}

export default SpinnerClient
