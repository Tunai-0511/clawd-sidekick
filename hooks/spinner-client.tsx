// The spinner's words on the desktop, and a running tool row's: what it is
// doing, a clock that counts every second, and the command or file at hand,
// beside the hooks module's animated Clawd.

import type { ClientModule } from 'claude-code'

type Props = {
  word: string
  suffix: string
  /** When the turn or the tool began, wall-clock milliseconds. */
  startedAt: number
  /** The command or file a tool row is on, after the clock. */
  detail?: string
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
    surface.every(1000, () => {
      live.t += 1
      surface.setState({ ...live })
    })
    surface.setState({ ...live })
  }
  const { Text } = surface.elements
  return (
    <Text>
      <Text color={ORANGE} bold>
        {`${props.word}${props.suffix}`}
      </Text>
      <Text dimColor>{`  ${elapsed(props.startedAt)}${props.detail ? ` · ${props.detail}` : ''}`}</Text>
    </Text>
  )
}

export default SpinnerClient
