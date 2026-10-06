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
  /** Too long at work without a break: a stretch, and a nudge to take one. */
  | 'stretch'

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
  | 'stretch'
  | 'eat'
  | 'sip'

/** What the crew plays in the game room. */
export type Game = 'pong' | 'volley' | 'rope' | 'tower' | 'sleep' | 'lunch' | 'tea'

/** Where the Clawds live: every scene has the same five zones. */
export type Theme = 'house' | 'beach' | 'space' | 'forest' | 'cosmos'

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
  /** A visitor from another session on this machine: its project. */
  neighbor?: string
}

/** Another Claude Code session on this machine, as it last said it was. */
export type Neighbor = {
  id: string
  project: string
  pose: Pose
  label: string
  isWorking: boolean
}

/** Everything the house draws from. */
export type SceneProps = {
  actors: SceneActor[]
  /** The deadlines ahead pinned to the board, nearest first (at most eight). */
  notes: { text: string; urgency: 'far' | 'near' | 'urgent' | 'over' }[]
  /** Whole days to the nearest deadline ahead; null when there is none. */
  days: number | null
  urgency: 'far' | 'near' | 'urgent' | 'over' | 'none'
  game: Game
  time: TimeOfDay
  /** The nearest deadline in words, for the calendar's hover; '' for none. */
  deadline: string
  /** The language the house's signs and tips speak. */
  lang: 'zh' | 'en'
  theme: Theme
  /** How full Claude's context is, in tenths (0–10): the library's books; null before it is known. */
  memory: number | null
  /** The five-hour window is past 80%: the Clawds are getting tired. */
  isTired: boolean
  /** The medals under the game room's bunting, best first (at most ten). */
  medals: Tier[]
  /** Trophies reached, of all there are, for the medals' hover. */
  trophyCount: [number, number]
  /** What the main Clawd wears when no holiday hat takes its place. */
  hat: Hat | null
  pal: Pal | null
  /** Commits stamped and pushes sealed in gold. */
  golden: { stamp: boolean; seal: boolean }
  /** A rare sight now and then: a shooting star, or the scene's own visitor. */
  egg: Egg | null
  /** The person's birthday: party hats for everyone and confetti. */
  isBirthday: boolean
  /** The names the person gave the Clawds, by actor id. */
  names: Record<string, string>
  season: Season
  holiday: Holiday
  /** The rooms whose lights the person switched off. */
  dark: RoomId[]
}

/** The library, the code lab, the terminal room, the lookout and the game room, in every scene. */
export type RoomId = 'library' | 'codelab' | 'terminal' | 'web' | 'game'

/** One local day of work, across sessions and projects, for /clawd recap. */
export type Day = {
  /** The person's local date, '2026-10-06'. */
  date: string
  turns: number
  /** Time Claude spent working, summed over the turns. */
  workMs: number
  longestMs: number
  tools: number
  edits: number
  runs: number
  /** Tool calls by the room Clawd went to for them. */
  rooms: Record<RoomId, number>
  testsPassed: number
  testsFailed: number
  commits: number
  pushes: number
  prsOpened: number
  prsMerged: number
  compactions: number
  /** Subagents sent out. */
  helpers: number
  pets: number
}

export type Tier = 'bronze' | 'silver' | 'gold' | 'legend'

/** The rare sights: a shooting star across any scene's sky, or a scene's own critter. */
export type Egg = 'star' | 'critter'

/** What a trophy can bring the main Clawd to wear. */
export type Hat = 'party' | 'crown' | 'halo' | 'wizard' | 'captain' | 'flower' | 'explorer' | 'graduation' | 'headphones'

/** A companion who walks the floor of every scene. */
export type Pal = 'cat' | 'owl' | 'crab'

/** Every day's work added up, kept for good: what the trophies are measured against. */
export type Life = {
  turns: number
  workMs: number
  tools: number
  edits: number
  runs: number
  testsPassed: number
  testsFailed: number
  commits: number
  pushes: number
  prsOpened: number
  prsMerged: number
  compactions: number
  helpers: number
  pets: number
  /** Days with work, the run of them up to `lastDay`, and the longest run. */
  days: number
  streak: number
  bestStreak: number
  lastDay: string
  /** Test runs passed in a row, the best such run, and failures in a row. */
  greenRun: number
  bestGreenRun: number
  failRun: number
  /** Passing runs right after three or more failures. */
  comebacks: number
  /** Turns begun between midnight and five, and between five and seven. */
  nightTurns: number
  dawnTurns: number
  longestTurnMs: number
  bestDayMs: number
  bestDayTools: number
  scenes: Theme[]
  holidays: Holiday[]
  /** The rare sights seen: 'star', and 'critter:<theme>' for each scene's visitor. */
  eggs: string[]
}

/** The trophies reached (`family:tier` → when), and what the main Clawd wears and walks with. */
export type Trophies = {
  unlocked: Record<string, number>
  hat: Hat | 'auto' | 'none'
  pal: Pal | 'auto' | 'none'
}

/** The project's git state, as `git status` tells it. */
export type GitState = {
  branch: string
  /** Commits ahead of and behind the upstream; 0 without one. */
  ahead: number
  behind: number
  /** Files changed (staged or not), and files not tracked yet. */
  changed: number
  untracked: number
  /** When the last commit was made; 0 before the first. */
  lastCommitAt: number
}

/** A file Claude touched this session: how often, and the lines it added and removed. */
export type FileChange = {
  path: string
  edits: number
  added: number
  removed: number
  isNew: boolean
  /** The turn it was last touched in, counted from the session's first. */
  turn: number
  at: number
}

/** A command Claude ran this session, and how it ended. */
export type CommandRun = {
  /** What it was for, as Claude described it, else the command. */
  text: string
  isOk: boolean
  isTest: boolean
  turn: number
  at: number
}

export type Changes = { files: FileChange[]; commands: CommandRun[]; turn: number }

/** The status line figures: model, context, plan windows, cost, this turn. */
export type Usage = {
  model: string
  contextPercent: number | null
  fiveHour: number | null
  sevenDay: number | null
  /** When each plan window starts over, UTC milliseconds; null when not known. */
  fiveHourResetsAt: number | null
  sevenDayResetsAt: number | null
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
      /** Today so far, for the recap card. */
      today: Day | null
      trophies: Trophies
      /** The other sessions on this machine heard from in the last 45 seconds. */
      neighbors: Neighbor[]
      /** The rare sight on show, if any. */
      egg: Egg | null
      /** The person's birthday as 'MM-DD', '' when not given. */
      birthday: string
      names: Record<string, string>
      /** The project's git state; null outside a repository. */
      git: GitState | null
      /** What this session changed. */
      changes: Changes
      /** The finished tool rows the person opened, by tool_use_id. */
      openRows: string[]
      /** True while the conversation is being compacted, for the spinner's Clawd. */
      compacting: boolean
      /** The rooms whose lights are off, in every scene. */
      darkRooms: RoomId[]
      /** This session so far, for its summary: when it began, and its figures as a day's. */
      session: { startedAt: number; totals: Day }
    }
  }
}
