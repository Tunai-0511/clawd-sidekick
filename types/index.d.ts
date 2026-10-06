export type Pose =
  | 'idle'
  | 'think'
  | 'type'
  | 'write'
  | 'read'
  | 'search'
  | 'web'
  | 'agent'
  | 'wait'
  | 'cheer'
  | 'panic'
  | 'oops'
  | 'sleep'
  | 'itemget'
  | 'love'
  /** A tool waits for the person's permission. */
  | 'ask'
  /** A commit went in. */
  | 'stamp'
  /** A push went out. */
  | 'mail'
  /** The conversation is being compacted. */
  | 'tidy'

/** Something only the person can do, kept across sessions and projects. */
export type Todo = {
  id: string
  text: string
  project: string
  createdAt: number
  isDone: boolean
  doneAt?: number
  /** Typed with /todo add rather than read off a reply. */
  isManual: boolean
}

export type Deadline = {
  id: string
  title: string
  /** UTC milliseconds. */
  due: number
  project: string
  /** The under-a-day alarm has sounded. */
  hasAlarmed: boolean
}

/** What Clawd is acting out, and the line beside him. */
export type Activity = { pose: Pose; label: string; since: number }

/** What a Clawd in the house is up to once he gets where he is going. */
export type Doing =
  | 'idle'
  | 'read'
  | 'think'
  | 'code'
  | 'type'
  | 'web'
  | 'arcade'
  | 'pong'
  | 'wait'
  | 'sleep'
  | 'pin'
  | 'panic'
  | 'love'
  | 'oops'
  | 'cheer'
  | 'volley'
  | 'turn'
  | 'jump'
  | 'tower'
  | 'clap'
  | 'ask'
  | 'stamp'
  | 'mail'
  | 'tidy'

/** What the crew plays in the game room. */
export type Game = 'pong' | 'volley' | 'rope' | 'tower' | 'sleep'

/** Where the Clawds live: every scene has the same five zones. */
export type Theme = 'house' | 'beach' | 'space' | 'forest'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export type Holiday = 'none' | 'lunarNewYear' | 'halloween' | 'christmas'

/** The person's time of day, for the window. */
export type TimeOfDay = 'day' | 'dusk' | 'night'

/** A Clawd in the house: walking from `fromX` to `toX` from `departAt` on. */
export type SceneActor = {
  id: string
  /** The crew's beanie colour; null for the main Clawd. */
  cap: string | null
  fromX: number
  toX: number
  departAt: number
  doing: Doing
  /** The speech bubble; '' for none. */
  label: string
  /** The Agent call (tool_use_id) a crew member is working for. */
  agentKey?: string
  /** The subagent's loop id once its first tool call names it. */
  agentId?: string
}

/** Everything the house draws from. */
export type SceneProps = {
  actors: SceneActor[]
  todos: number
  /** Whole days to the nearest deadline ahead; null when there is none. */
  days: number | null
  urgency: 'far' | 'near' | 'urgent' | 'over' | 'none'
  game: Game
  time: TimeOfDay
  /** The open todos, for the board's hover. */
  board: string[]
  /** The nearest deadline in words, for the calendar's hover; '' for none. */
  deadline: string
  /** The language the house's signs and tips speak. */
  lang: 'zh' | 'en'
  theme: Theme
  /** How full Claude's context is, in tenths (0–10): the library's books; null before it is known. */
  memory: number | null
  /** The five-hour window is past 80%: the Clawds are getting tired. */
  isTired: boolean
  season: Season
  holiday: Holiday
}

/** The status line figures: model, context, plan windows, cost, this turn. */
export type Usage = {
  model: string
  contextPercent: number | null
  fiveHour: number | null
  sevenDay: number | null
  usd: number | null
  turnStartedAt: number
  tools: number
  edits: number
  runs: number
}

declare module 'claude-code' {
  interface PluginState {
    'clawd-sidekick': {
      activity: Activity
      todos: Todo[]
      deadlines: Deadline[]
      isCollapsed: boolean
      pets: number
      /** The clock the countdowns and the turn timer draw from. */
      now: number
      /** Minutes east of UTC. */
      offset: number
      project: string
      actors: SceneActor[]
      usage: Usage
      game: Game
      /** The language Clawd speaks: what the person chose, else the system's. */
      lang: 'zh' | 'en'
      theme: Theme
      /** The system's IANA time zone, '' when unknown: south of the equator the seasons turn over. */
      zone: string
      /** A season or holiday chosen by hand, else 'auto' (the local date). */
      seasonPick: Season | 'auto'
      holidayPick: Holiday | 'auto'
    }
  }
}
