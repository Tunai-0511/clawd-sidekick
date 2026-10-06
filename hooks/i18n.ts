// Every word Clawd says, in Traditional Chinese and English.
//
// `say(lang)` answers one table; each entry is a string or a small function
// of what goes in it, so word order stays each language's own.

import type { Hat, Pal, Tier } from '../types'
import type { FamilyId, Unit } from './trophies'

export type Lang = 'zh' | 'en'

export type RoomId = 'library' | 'codelab' | 'terminal' | 'web' | 'game'

export type Theme = 'house' | 'beach' | 'space' | 'forest'


type SeasonWord = 'spring' | 'summer' | 'autumn' | 'winter'
type HolidayWord = 'none' | 'lunarNewYear' | 'halloween' | 'christmas'

type Doings =
  | 'idle'
  | 'read'
  | 'think'
  | 'code'
  | 'type'
  | 'web'
  | 'arcade'
  | 'pong'
  | 'volley'
  | 'turn'
  | 'jump'
  | 'tower'
  | 'clap'
  | 'wait'
  | 'sleep'
  | 'pin'
  | 'panic'
  | 'love'
  | 'oops'
  | 'cheer'
  | 'ask'
  | 'stamp'
  | 'mail'
  | 'tidy'

export type Strings = {
  // What Clawd is doing, from a tool call
  run: (command: string) => string
  edit: (file: string) => string
  read: (file: string) => string
  find: (pattern: string) => string
  search: (query: string) => string
  fetch: (host: string) => string
  dispatch: (task: string) => string
  helper: string
  asks: string
  plan: string
  use: (tool: string) => string
  thinking: string
  yourTurn: string
  interrupted: string
  turnError: string
  approve: string
  failed: (what: string) => string
  // What happened, acted out
  testsPassed: string
  testsFailed: string
  committed: (sha: string) => string
  pushed: (branch: string) => string
  prOpened: (n: number) => string
  prMerged: (n: number) => string
  compacting: string
  compacted: string
  /** The library zone's hover: Claude's memory, `level` tenths full or not known yet. */
  memoryTip: (theme: Theme, level: number | null) => string
  sleepy: string
  petLines: (count: number) => string[]
  done: (todo: string) => string
  noted: (todos: readonly string[]) => string
  notedCount: (count: number) => string
  alarm: (title: string, left: string) => string
  // The band
  hello: string
  nothingToDo: string
  toDo: (count: number) => string
  due: (title: string, left: string) => string
  turn: string
  lastTurn: string
  /** The prompt's hint line while nothing runs: Clawd standing by. */
  idle: string
  todayWorked: (duration: string) => string
  tools: string
  edited: string
  files: (count: number) => string
  ran: string
  commands: (count: number) => string
  list: string
  pet: string
  hide: string
  expand: string
  otherLanguage: string
  houseAlt: (doing: string) => string
  readingInLibrary: string
  // The pane
  paneTitle: string
  forYou: (count: number) => string
  allDone: string
  doneCount: (count: number) => string
  manual: string
  complete: string
  deadlines: string
  remove: string
  petted: (count: number) => string
  // Commands
  describeClawd: string
  describeTodo: string
  describeDeadline: string
  hintClawd: string
  hintTodo: string
  hintDeadline: string
  folded: string
  unfolded: string
  paneOpened: string
  // The day's recap card
  recapTitle: string
  recapPaneTitle: string
  recapButton: string
  recapDate: (date: string) => string
  recapQuiet: string
  recapWorked: (duration: string) => string
  /** The words over the day's working time, set large beneath them. */
  recapWorkedLead: string
  recapFavorite: (room: string) => string
  recapDuration: (hours: number, minutes: number) => string
  recapTurns: (n: number) => string
  recapTools: (n: number) => string
  recapEdits: (n: number) => string
  recapRuns: (n: number) => string
  recapTests: string
  recapCommits: (n: number) => string
  recapPushes: (n: number) => string
  recapTidies: (n: number) => string
  recapWhere: string
  recapWeek: string
  recapStreak: (days: number) => string
  recapLine: (d: { turns: number; work: string; tools: number; edits: number; passed: number; failed: number; commits: number; pushes: number; streak: number }) => string
  // Trophies
  tiers: Record<Tier, string>
  families: Record<FamilyId, string>
  hats: Record<Hat, string>
  pals: Record<Pal, string>
  goldens: Record<'stamp' | 'seal', string>
  /** A progress figure in its unit: a count, days, hours or minutes. */
  amount: (unit: Unit, value: number) => string
  unlocked: (trophy: string) => string
  unlockedMany: (count: number) => string
  brings: (reward: string) => string
  trophiesTitle: string
  trophiesButton: string
  trophiesCount: (got: number, total: number) => string
  trophyNext: (progress: string, target: string) => string
  trophyMax: string
  medalsTip: (got: number, total: number) => string
  wearing: (hat: string) => string
  walking: (pal: string) => string
  hatsHeading: string
  palsHeading: string
  noneYet: string
  hatUsage: (have: string) => string
  hatSet: (hat: string) => string
  hatOff: string
  palUsage: (have: string) => string
  palSet: (pal: string) => string
  palOff: string
  locked: (thing: string) => string
  speaks: string
  langUsage: string
  todoUsage: string
  todoAdded: (todo: string) => string
  todoDuplicate: string
  noSuchTodo: (n: string) => string
  nothingToUndo: string
  undone: (todo: string) => string
  removed: (what: string) => string
  cleared: (left: number) => string
  emptyList: string
  listHeader: string
  listFooter: string
  deadlineAdded: (title: string, date: string, left: string) => string
  noSuchDeadline: string
  noDeadlines: string
  deadlineHeader: string
  deadlineFooter: string
  // Deadlines
  usage: string
  badDate: string
  left: {
    days: (d: number) => string
    dayHours: (h: number) => string
    hoursMinutes: (h: number, m: number) => string
    minutes: (m: number) => string
    hours: (h: number) => string
    underHour: string
  }
  ago: { days: (d: number) => string; hours: (h: number) => string }
  // The scenes
  themes: Record<Theme, string>
  scene: (name: string) => string
  sceneSet: (name: string) => string
  sceneUsage: string
  rooms: Record<Theme, Record<RoomId, string>>
  roomPurpose: Record<RoomId, string>
  roomTip: (name: string, purpose: string) => string
  doings: Record<Doings, string>
  caps: Record<string, string>
  mainClawd: string
  crewClawd: (cap: string) => string
  forSubagent: (task: string) => string
  gettingReady: string
  boardEmpty: string
  board: (todos: readonly string[]) => string
  boardTitle: (todos: readonly string[]) => string
  calendarEmpty: string
  calendar: (deadline: string) => string
  lights: Record<Theme, string>
  toys: Record<Theme, string>
  outside: Record<'day' | 'dusk' | 'night', string>
  outsideSpace: string
  noTodos: string
  // Seasons, holidays
  seasons: Record<SeasonWord, string>
  holidays: Record<HolidayWord, string>
  seasonSet: (season: string) => string
  seasonAuto: (season: string) => string
  seasonUsage: string
  holidaySet: (holiday: string) => string
  holidayAuto: (holiday: string) => string
  holidayUsage: string
}

const zh: Strings = {
  run: command => `跑 ${command}`,
  edit: file => `改 ${file}`,
  read: file => `讀 ${file}`,
  find: pattern => `找 ${pattern}`,
  search: query => `查 ${query}`,
  fetch: host => `看 ${host}`,
  dispatch: task => `派分身：${task}`,
  helper: '分身',
  asks: '有事想問你',
  plan: '計畫好了，等你點頭',
  use: tool => `用 ${tool}`,
  thinking: '想一下…',
  yourTurn: '輪到你了',
  interrupted: '被打斷了',
  turnError: '這回合出錯了',
  approve: '需要你批准',
  failed: what => `${what} 出錯了`,
  testsPassed: '測試通過！',
  testsFailed: '測試沒過…',
  committed: sha => `commit 好了 ${sha}`,
  pushed: branch => `推上 ${branch} 了`,
  prOpened: n => `開了 PR #${n}`,
  prMerged: n => `PR #${n} 合併了！`,
  compacting: '整理記憶中…',
  compacted: '記憶整理好了',
  memoryTip: (theme, level) => {
    const what = { house: '書架', beach: '書堆', space: '資料水晶', forest: '書堆' }[theme]
    return level === null
      ? `${what}＝Claude 的記憶（context），還不知道用了多少`
      : `${what}＝Claude 的記憶（context），大約 ${level * 10}% 滿；快滿時 Clawd 會整理一次`
  },
  sleepy: 'zzz…',
  petLines: count => ['嘿嘿～', '好癢！', '再摸一下', '♥', `被摸了 ${count} 次`],
  done: todo => `完成：${todo}`,
  noted: todos => `Clawd 記下了你要做的事：${todos.join('、')}`,
  notedCount: count => `記下 ${count} 件你要做的事`,
  alarm: (title, left) => `${title} ${left}！`,
  hello: '我是 Clawd，你的副駕',
  nothingToDo: '沒有要你做的事 ✓',
  toDo: count => `待辦 ${count}`,
  due: (title, left) => `截止 ${title} ${left}`,
  turn: '回合',
  lastTurn: '上回合',
  idle: '待機中',
  todayWorked: duration => `今天 ${duration}`,
  tools: '工具',
  edited: '改',
  files: count => `${count} 檔`,
  ran: '跑',
  commands: count => `${count} 指令`,
  list: '清單',
  pet: '♥ 摸摸',
  hide: '收合',
  expand: '展開',
  otherLanguage: 'EN',
  houseAlt: doing => `Clawd 小屋：${doing}`,
  readingInLibrary: 'Clawd 在書庫看書',
  paneTitle: 'Clawd 副駕',
  forYou: count => `你要做的事（${count}）`,
  allDone: '都做完了。Claude 交代你的事會自動記在這裡，也可以 /todo add。',
  doneCount: count => `已完成 ${count} 件 · /todo clear 清掉`,
  manual: '手動',
  complete: '完成',
  deadlines: '截止日',
  remove: '移除',
  petted: count => `被摸了 ${count} 次`,
  describeClawd: 'Clawd 副駕：打開面板（/clawd recap 今日戰報、/clawd trophies 成就、/clawd scene 換場景、/clawd hide 收合、/clawd lang en 換英文）',
  describeTodo: 'Clawd 幫你記的人類待辦',
  describeDeadline: '截止日雷達：越接近 Clawd 越慌',
  hintClawd: '[recap|trophies|hat|pal|scene 名稱|season|holiday|hide|show|lang]',
  hintTodo: '[add 事情|done N|undo|rm N|clear]',
  hintDeadline: '[add 12/24 名稱|rm N]',
  folded: 'Clawd 收成一行了，/clawd show 叫他回來。',
  unfolded: 'Clawd 回來了。',
  paneOpened: 'Clawd 副駕面板打開了。',
  recapTitle: 'Clawd 的一天',
  recapPaneTitle: 'Clawd 的一天',
  recapButton: '今日戰報',
  recapDate: date => {
    const d = new Date(`${date}T00:00:00Z`)
    return `${d.getUTCMonth() + 1} 月 ${d.getUTCDate()} 日（${'日一二三四五六'[d.getUTCDay()]}）`
  },
  recapQuiet: '今天還沒開工',
  recapWorked: duration => `陪 Claude 工作了 ${duration}`,
  recapWorkedLead: '陪 Claude 工作了',
  recapFavorite: room => `最常待在${room}`,
  recapDuration: (h, m) => (h > 0 ? `${h} 小時 ${m} 分` : `${m} 分鐘`),
  recapTurns: () => '個回合',
  recapTools: () => '次工具',
  recapEdits: () => '個檔改過',
  recapRuns: () => '個指令',
  recapTests: '測試過',
  recapCommits: () => '次 commit',
  recapPushes: () => '次 push',
  recapTidies: () => '次整理記憶',
  recapWhere: '時間都去哪了',
  recapWeek: '這週',
  recapStreak: days => (days > 0 ? `連續 ${days} 天` : '今天開工吧'),
  recapLine: d =>
    `今天 ${d.turns} 個回合、工作了 ${d.work}：用了 ${d.tools} 次工具、改了 ${d.edits} 個檔，測試 ${d.passed} 過 ${d.failed} 沒過，${d.commits} 次 commit、${d.pushes} 次 push。連續 ${d.streak} 天。`,
  tiers: { bronze: '銅', silver: '銀', gold: '金', legend: '傳說' },
  families: {
    streak: '連續開工',
    days: '開工天數',
    commits: 'Commit',
    pushes: 'Push',
    tests: '測試通過',
    green: '連續綠燈',
    tools: '工具次數',
    edits: '改過的檔',
    tidy: '整理記憶',
    helpers: '派出子代理',
    night: '夜貓子',
    dawn: '早起的鳥',
    marathon: '單日馬拉松',
    longTurn: '超長回合',
    busyDay: '最忙的一天',
    pets: '被摸摸',
    prs: 'PR 合併',
    scenes: '環遊四景',
    holidays: '節日也上工',
    comeback: '逆轉勝',
    todos: '人類那一半',
  },
  hats: { party: '派對帽', crown: '王冠', halo: '光環', wizard: '巫師帽', captain: '船長帽', flower: '小花', explorer: '探險帽', graduation: '學士帽', headphones: '耳機' },
  pals: { cat: '貓咪', owl: '貓頭鷹', crab: '小螃蟹' },
  goldens: { stamp: '金色印章', seal: '金色封蠟' },
  amount: (unit, value) => {
    const n = unit === 'hours' ? Math.floor(value * 10) / 10 : Math.floor(value)
    return unit === 'days' ? `${n} 天` : unit === 'hours' ? `${n} 小時` : unit === 'minutes' ? `${n} 分` : n.toLocaleString('en')
  },
  unlocked: trophy => `🏆 解鎖成就：${trophy}`,
  unlockedMany: count => `🏆 解鎖了 ${count} 個成就！打 /clawd trophies 看看`,
  brings: reward => `，獲得${reward}`,
  trophiesTitle: '成就',
  trophiesButton: '成就',
  trophiesCount: (got, total) => `已解鎖 ${got} / ${total}`,
  trophyNext: (progress, target) => `${progress} / ${target}`,
  trophyMax: '全部完成！',
  medalsTip: (got, total) => `獎牌：成就 ${got} / ${total}（/clawd trophies）`,
  wearing: hat => `戴著${hat}`,
  walking: pal => `${pal}陪著`,
  hatsHeading: '帽子',
  palsHeading: '夥伴',
  noneYet: '還沒有，解鎖成就就會拿到',
  hatUsage: have => `用法：/clawd hat 名稱、auto（最好的那頂）或 none。你有：${have}`,
  hatSet: hat => `主 Clawd 戴上了${hat}。`,
  hatOff: '主 Clawd 把帽子拿下來了。',
  palUsage: have => `用法：/clawd pal 名稱、auto 或 none。你有：${have}`,
  palSet: pal => `${pal}開始在場景裡散步了。`,
  palOff: '夥伴回家休息了。',
  locked: thing => `還沒解鎖${thing}。打 /clawd trophies 看要達成什麼。`,
  speaks: 'Clawd 改說中文了。',
  langUsage: '用法：/clawd lang zh、/clawd lang en、/clawd lang auto（跟系統語言）',
  todoUsage: '用法：/todo add 要做的事',
  todoAdded: todo => `記下了：${todo}`,
  todoDuplicate: '這件已經在清單上了。',
  noSuchTodo: n => `沒有第 ${n} 件。/todo 看清單。`,
  nothingToUndo: '沒有可以復原的。',
  undone: todo => `放回清單：${todo}`,
  removed: what => `刪掉了：${what}`,
  cleared: left => `清掉已完成的，剩 ${left} 件。`,
  emptyList: '沒有要你做的事。Claude 交代你的事會自動記下來，也可以 /todo add。',
  listHeader: '你要做的事：',
  listFooter: '/todo done N 完成、/todo rm N 刪除',
  deadlineAdded: (title, date, left) => `記下截止日：${title}，${date}（${left}）`,
  noSuchDeadline: '沒有這一個。/deadline 看清單。',
  noDeadlines: '還沒有截止日。',
  deadlineHeader: '截止日：',
  deadlineFooter: '/deadline rm N 移除',
  usage: '用法：/deadline add 12/24 報告、/deadline add 2027-03-01 09:00 發表會、/deadline add 明天 繳費',
  badDate: '看不懂這個日期。',
  left: {
    days: d => `剩 ${d} 天`,
    dayHours: h => `剩 1 天 ${h} 小時`,
    hoursMinutes: (h, m) => `剩 ${h} 小時 ${m} 分`,
    minutes: m => `剩 ${m} 分`,
    hours: h => `剩 ${h} 小時`,
    underHour: '剩不到 1 小時',
  },
  ago: { days: d => `過了 ${d} 天`, hours: h => `過了 ${h} 小時` },
  themes: { house: '小屋', beach: '海灘', space: '太空站', forest: '森林營地' },
  scene: name => `場景：${name}`,
  sceneSet: name => `Clawd 們搬到${name}了。`,
  sceneUsage: '用法：/clawd scene house（小屋）、beach（海灘）、space（太空站）、forest（森林營地），或 /clawd scene next 換下一個',
  rooms: {
    house: { library: '書庫', codelab: '工作室', terminal: '機房', web: '瞭望台', game: '遊戲間' },
    beach: { library: '遮陽傘', codelab: '沙灘書桌', terminal: '救生塔', web: '燈塔觀景台', game: '沙灘球場' },
    space: { library: '資料艙', codelab: '實驗艙', terminal: '反應爐', web: '觀測窗', game: '娛樂艙' },
    forest: { library: '帳篷', codelab: '木桌', terminal: '無線電小屋', web: '樹屋', game: '營火空地' },
  },
  roomPurpose: {
    library: 'Claude 讀檔、搜尋的時候會來這裡',
    codelab: '改程式、想事情的地方；你的待辦和截止日也在這',
    terminal: '跑指令的地方',
    web: '上網查資料的地方',
    game: 'Claude 工作時大家打排球，閒著時輪流玩桌球、跳繩、疊積木，深夜就睡覺',
  },
  roomTip: (name, purpose) => `${name}：${purpose}`,
  doings: {
    idle: '在發呆',
    read: '在書庫看書',
    think: '在想事情',
    code: '在改程式',
    type: '在跑指令',
    web: '在看網路',
    arcade: '在打電動',
    pong: '在打桌球',
    volley: '在打排球',
    turn: '在甩跳繩',
    jump: '在跳繩',
    tower: '在疊積木',
    clap: '在旁邊加油',
    wait: '在等你',
    sleep: '睡著了',
    pin: '在貼便利貼',
    panic: '慌了！',
    love: '被摸得很開心',
    oops: '出錯了',
    cheer: '好開心',
    ask: '舉牌等你批准',
    stamp: '在 commit 上蓋章',
    mail: '把 push 寄出去',
    tidy: '在整理記憶',
  },
  caps: { blue: '藍帽', green: '綠帽', purple: '紫帽' },
  mainClawd: '主 Clawd',
  crewClawd: cap => `${cap} Clawd`,
  forSubagent: task => `替子代理工作：${task}`,
  gettingReady: '準備中',
  boardEmpty: '布告欄：沒有要你做的事',
  board: todos => `布告欄：${todos.join('、')}`,
  boardTitle: todos => (todos.length === 0 ? '布告欄：沒有要你做的事 ✓' : `布告欄：你要做的事\n${todos.map(t => `□ ${t}`).join('\n')}`),
  calendarEmpty: '日曆：還沒有截止日（/deadline add 12/24 名稱）',
  calendar: deadline => `日曆：${deadline}`,
  lights: { house: '檯燈：摸一下就亮', beach: '燈塔：摸一下就亮', space: '全像檯燈：摸一下就亮', forest: '營燈：摸一下就亮' },
  toys: {
    house: '大型電玩：有人在玩的時候別擋到螢幕',
    beach: '沙堡：裡面住著一隻小螃蟹',
    space: '全像電玩：有人在玩的時候別擋到螢幕',
    forest: '營火：小心燙',
  },
  outside: { day: '窗外：白天', dusk: '窗外：黃昏', night: '窗外：晚上' },
  outsideSpace: '窗外：無邊的宇宙',
  noTodos: '沒有待辦',
  seasons: { spring: '春天', summer: '夏天', autumn: '秋天', winter: '冬天' },
  holidays: { none: '平常日', lunarNewYear: '農曆新年', halloween: '萬聖節', christmas: '聖誕節' },
  seasonSet: season => `季節固定成${season}。/clawd season auto 改回跟著日期。`,
  seasonAuto: season => `季節跟著日期走，現在是${season}。`,
  seasonUsage: '用法：/clawd season spring、summer、autumn、winter，或 auto 跟著日期',
  holidaySet: holiday => `節日佈置固定成${holiday}。/clawd holiday auto 改回跟著日期。`,
  holidayAuto: holiday => `節日跟著日期走，現在是${holiday}。`,
  holidayUsage: '用法：/clawd holiday lunar（農曆新年）、halloween、christmas、none（不佈置），或 auto 跟著日期',
}

const en: Strings = {
  run: command => `Running ${command}`,
  edit: file => `Editing ${file}`,
  read: file => `Reading ${file}`,
  find: pattern => `Looking for ${pattern}`,
  search: query => `Searching ${query}`,
  fetch: host => `Visiting ${host}`,
  dispatch: task => `Sending a helper: ${task}`,
  helper: 'helper',
  asks: 'Has a question for you',
  plan: 'Plan ready, waiting for your nod',
  use: tool => `Using ${tool}`,
  thinking: 'Thinking…',
  yourTurn: 'Your turn',
  interrupted: 'Interrupted',
  turnError: 'That turn hit an error',
  approve: 'Needs your OK',
  failed: what => `${what} failed`,
  testsPassed: 'Tests pass!',
  testsFailed: 'Tests failed…',
  committed: sha => `Committed ${sha}`,
  pushed: branch => `Pushed to ${branch}`,
  prOpened: n => `Opened PR #${n}`,
  prMerged: n => `PR #${n} merged!`,
  compacting: 'Tidying the memory…',
  compacted: 'Memory tidied',
  memoryTip: (theme, level) => {
    const what = { house: 'The shelves', beach: 'The book pile', space: 'The data crystals', forest: 'The book pile' }[theme]
    return level === null
      ? `${what} = Claude's memory (context), not measured yet`
      : `${what} = Claude's memory (context), about ${level * 10}% full; when it fills up, Clawd tidies it`
  },
  sleepy: 'zzz…',
  petLines: count => ['Hehe~', 'That tickles!', 'Again!', '♥', `Petted ${count} times`],
  done: todo => `Done: ${todo}`,
  noted: todos => `Clawd noted something for you: ${todos.join(', ')}`,
  notedCount: count => (count === 1 ? 'Noted 1 thing for you' : `Noted ${count} things for you`),
  alarm: (title, left) => `${title}: ${left}!`,
  hello: "I'm Clawd, your sidekick",
  nothingToDo: 'Nothing for you to do ✓',
  toDo: count => `${count} to do`,
  due: (title, left) => `Due: ${title} ${left}`,
  turn: 'turn',
  lastTurn: 'last turn',
  idle: 'Standing by',
  todayWorked: duration => `${duration} today`,
  tools: 'tools',
  edited: 'edited',
  files: count => (count === 1 ? '1 file' : `${count} files`),
  ran: 'ran',
  commands: count => (count === 1 ? '1 command' : `${count} commands`),
  list: 'List',
  pet: '♥ Pet',
  hide: 'Hide',
  expand: 'Expand',
  otherLanguage: '中文',
  houseAlt: doing => `Clawd's house: ${doing}`,
  readingInLibrary: 'Clawd is reading in the library',
  paneTitle: 'Clawd Sidekick',
  forYou: count => `For you to do (${count})`,
  allDone: 'All done. What Claude hands you lands here on its own, or add something with /todo add.',
  doneCount: count => `${count} done · /todo clear to tidy up`,
  manual: 'added by you',
  complete: 'Done',
  deadlines: 'Deadlines',
  remove: 'Remove',
  petted: count => (count === 1 ? 'Petted once' : `Petted ${count} times`),
  describeClawd: 'Clawd Sidekick: open the pane (/clawd recap shows your day, /clawd trophies your trophies, /clawd scene changes the scene, /clawd hide folds the band, /clawd lang zh switches to Chinese)',
  describeTodo: 'The things Clawd noted for you to do',
  describeDeadline: 'Deadline radar: the closer it gets, the more Clawd frets',
  hintClawd: '[recap|trophies|hat|pal|scene name|season|holiday|hide|show|lang]',
  hintTodo: '[add something|done N|undo|rm N|clear]',
  hintDeadline: '[add 12/24 name|rm N]',
  folded: 'Clawd folded into one line. /clawd show brings him back.',
  unfolded: 'Clawd is back.',
  paneOpened: 'Opened the Clawd Sidekick pane.',
  recapTitle: "Clawd's day",
  recapPaneTitle: "Clawd's day",
  recapButton: 'Today',
  recapDate: date => {
    const d = new Date(`${date}T00:00:00Z`)
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()]
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()]
    return `${day}, ${month} ${d.getUTCDate()}`
  },
  recapQuiet: 'No work yet today',
  recapWorked: duration => `Worked alongside Claude for ${duration}`,
  recapWorkedLead: 'Worked with Claude for',
  recapFavorite: room => `Mostly in the ${room.toLowerCase()}`,
  recapDuration: (h, m) => (h > 0 ? `${h} h ${m} min` : `${m} min`),
  recapTurns: n => (n === 1 ? 'turn' : 'turns'),
  recapTools: n => (n === 1 ? 'tool call' : 'tool calls'),
  recapEdits: n => (n === 1 ? 'file edited' : 'files edited'),
  recapRuns: n => (n === 1 ? 'command' : 'commands'),
  recapTests: 'tests passed',
  recapCommits: n => (n === 1 ? 'commit' : 'commits'),
  recapPushes: n => (n === 1 ? 'push' : 'pushes'),
  recapTidies: n => (n === 1 ? 'tidy-up' : 'tidy-ups'),
  recapWhere: 'Where the day went',
  recapWeek: 'This week',
  recapStreak: days => (days === 1 ? '1-day streak' : days > 0 ? `${days}-day streak` : 'Start a streak'),
  recapLine: d =>
    `Today: ${d.turns} turns over ${d.work}, ${d.tools} tool calls, ${d.edits} files edited, tests ${d.passed} passed and ${d.failed} failed, ${d.commits} commits, ${d.pushes} pushes. ${d.streak}-day streak.`,
  tiers: { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', legend: 'Legendary' },
  families: {
    streak: 'Streak',
    days: 'Days at work',
    commits: 'Commits',
    pushes: 'Pushes',
    tests: 'Tests passed',
    green: 'Green run',
    tools: 'Tool calls',
    edits: 'Files edited',
    tidy: 'Tidy-ups',
    helpers: 'Subagents sent',
    night: 'Night owl',
    dawn: 'Early bird',
    marathon: 'Marathon day',
    longTurn: 'Long haul',
    busyDay: 'Busiest day',
    pets: 'Pets',
    prs: 'PRs merged',
    scenes: 'Globetrotter',
    holidays: 'Holiday shift',
    comeback: 'Comeback',
    todos: 'Your half',
  },
  hats: { party: 'party hat', crown: 'crown', halo: 'halo', wizard: 'wizard hat', captain: "captain's cap", flower: 'flower', explorer: "explorer's hat", graduation: 'mortarboard', headphones: 'headphones' },
  pals: { cat: 'cat', owl: 'owl', crab: 'little crab' },
  goldens: { stamp: 'golden stamp', seal: 'golden seal' },
  amount: (unit, value) => {
    const n = unit === 'hours' ? Math.floor(value * 10) / 10 : Math.floor(value)
    return unit === 'days' ? `${n} d` : unit === 'hours' ? `${n} h` : unit === 'minutes' ? `${n} min` : n.toLocaleString('en')
  },
  unlocked: trophy => `🏆 Trophy: ${trophy}`,
  unlockedMany: count => `🏆 ${count} trophies unlocked! See them with /clawd trophies`,
  brings: reward => `, and a ${reward}`,
  trophiesTitle: 'Trophies',
  trophiesButton: 'Trophies',
  trophiesCount: (got, total) => `${got} of ${total} unlocked`,
  trophyNext: (progress, target) => `${progress} / ${target}`,
  trophyMax: 'All done!',
  medalsTip: (got, total) => `Medals: ${got} of ${total} trophies (/clawd trophies)`,
  wearing: hat => `wearing the ${hat}`,
  walking: pal => `with the ${pal}`,
  hatsHeading: 'Hats',
  palsHeading: 'Pals',
  noneYet: 'None yet: trophies bring them',
  hatUsage: have => `Usage: /clawd hat name, auto (the finest) or none. You have: ${have}`,
  hatSet: hat => `Clawd puts on the ${hat}.`,
  hatOff: 'Clawd takes his hat off.',
  palUsage: have => `Usage: /clawd pal name, auto or none. You have: ${have}`,
  palSet: pal => `The ${pal} is out for a walk.`,
  palOff: 'The pal heads home for a rest.',
  locked: thing => `The ${thing} isn't unlocked yet. /clawd trophies shows what it takes.`,
  speaks: 'Clawd speaks English now.',
  langUsage: 'Usage: /clawd lang en, /clawd lang zh, /clawd lang auto (follow the system language)',
  todoUsage: 'Usage: /todo add <something to do>',
  todoAdded: todo => `Noted: ${todo}`,
  todoDuplicate: "That's already on the list.",
  noSuchTodo: n => `There's no #${n}. /todo shows the list.`,
  nothingToUndo: 'Nothing to undo.',
  undone: todo => `Back on the list: ${todo}`,
  removed: what => `Removed: ${what}`,
  cleared: left => `Cleared the done ones; ${left} left.`,
  emptyList: 'Nothing for you to do. What Claude hands you lands here on its own, or add something with /todo add.',
  listHeader: 'For you to do:',
  listFooter: '/todo done N to finish one, /todo rm N to remove one',
  deadlineAdded: (title, date, left) => `Deadline noted: ${title}, ${date} (${left})`,
  noSuchDeadline: 'No such deadline. /deadline shows the list.',
  noDeadlines: 'No deadlines yet.',
  deadlineHeader: 'Deadlines:',
  deadlineFooter: '/deadline rm N to remove one',
  usage: 'Usage: /deadline add 12/24 Report, /deadline add 2027-03-01 09:00 Launch, /deadline add tomorrow Laundry',
  badDate: "Can't read that date.",
  left: {
    days: d => `${d} days left`,
    dayHours: h => `1 day ${h} h left`,
    hoursMinutes: (h, m) => `${h} h ${m} min left`,
    minutes: m => `${m} min left`,
    hours: h => `${h} h left`,
    underHour: 'under an hour left',
  },
  ago: { days: d => (d === 1 ? '1 day ago' : `${d} days ago`), hours: h => `${h} h ago` },
  themes: { house: 'House', beach: 'Beach', space: 'Space station', forest: 'Forest camp' },
  scene: name => `Scene: ${name}`,
  sceneSet: name => `The Clawds moved to the ${name.toLowerCase()}.`,
  sceneUsage: 'Usage: /clawd scene house, beach, space or forest, or /clawd scene next for the next one',
  rooms: {
    house: { library: 'Library', codelab: 'Workshop', terminal: 'Server room', web: 'Lookout', game: 'Game room' },
    beach: { library: 'Umbrella', codelab: 'Beach desk', terminal: 'Lifeguard tower', web: 'Lighthouse view', game: 'Beach court' },
    space: { library: 'Archive pod', codelab: 'Lab', terminal: 'Reactor', web: 'Observatory', game: 'Rec deck' },
    forest: { library: 'Tent', codelab: 'Log desk', terminal: 'Radio hut', web: 'Treehouse', game: 'Campfire' },
  },
  roomPurpose: {
    library: 'where Clawd goes when Claude reads and searches files',
    codelab: 'editing and thinking; your to-dos and deadlines live here too',
    terminal: 'where commands run',
    web: 'browsing the web',
    game: 'volleyball while Claude works; ping-pong, jump rope or blocks while it waits; asleep late at night',
  },
  roomTip: (name, purpose) => `${name}: ${purpose}`,
  doings: {
    idle: 'daydreaming',
    read: 'reading in the library',
    think: 'thinking',
    code: 'editing code',
    type: 'running a command',
    web: 'browsing the web',
    arcade: 'playing the arcade',
    pong: 'playing ping-pong',
    volley: 'playing volleyball',
    turn: 'turning the rope',
    jump: 'jumping rope',
    tower: 'stacking blocks',
    clap: 'cheering them on',
    wait: 'waiting for you',
    sleep: 'asleep',
    pin: 'pinning a note',
    panic: 'panicking!',
    love: 'loving the pets',
    oops: 'hit an error',
    cheer: 'happy',
    ask: 'holding up a sign for your OK',
    stamp: 'stamping a commit',
    mail: 'sending a push off',
    tidy: 'tidying the memory',
  },
  caps: { blue: 'Blue-cap', green: 'Green-cap', purple: 'Purple-cap' },
  mainClawd: 'Clawd',
  crewClawd: cap => `${cap} Clawd`,
  forSubagent: task => `working for a subagent: ${task}`,
  gettingReady: 'getting ready',
  boardEmpty: 'Board: nothing for you to do',
  board: todos => `Board: ${todos.join(', ')}`,
  boardTitle: todos => (todos.length === 0 ? 'Board: nothing for you to do ✓' : `Board: for you to do\n${todos.map(t => `□ ${t}`).join('\n')}`),
  calendarEmpty: 'Calendar: no deadlines yet (/deadline add 12/24 name)',
  calendar: deadline => `Calendar: ${deadline}`,
  lights: { house: 'Lamp: hover to switch it on', beach: 'Lighthouse: hover to light it', space: 'Holo-lamp: hover to switch it on', forest: 'Lantern: hover to light it' },
  toys: {
    house: "Arcade: don't block the screen while someone's playing",
    beach: 'Sandcastle: a little crab lives inside',
    space: "Holo-arcade: don't block the screen while someone's playing",
    forest: "Campfire: careful, it's hot",
  },
  outside: { day: 'Outside: daytime', dusk: 'Outside: dusk', night: 'Outside: night' },
  outsideSpace: 'Outside: the endless dark',
  noTodos: 'no to-dos',
  seasons: { spring: 'spring', summer: 'summer', autumn: 'autumn', winter: 'winter' },
  holidays: { none: 'an ordinary day', lunarNewYear: 'Lunar New Year', halloween: 'Halloween', christmas: 'Christmas' },
  seasonSet: season => `The season is set to ${season}. /clawd season auto follows the date again.`,
  seasonAuto: season => `The season follows the date: it's ${season}.`,
  seasonUsage: 'Usage: /clawd season spring, summer, autumn, winter, or auto to follow the date',
  holidaySet: holiday => `Decorations are set to ${holiday}. /clawd holiday auto follows the date again.`,
  holidayAuto: holiday => `Holidays follow the date: today is ${holiday}.`,
  holidayUsage: 'Usage: /clawd holiday lunar (Lunar New Year), halloween, christmas, none, or auto to follow the date',
}

const STRINGS: Record<Lang, Strings> = { zh, en }

export const say = (lang: Lang): Strings => STRINGS[lang]

/** The language a list of locales ("zh-Hant-TW", "en_US.UTF-8") asks for first; English when none is Chinese. */
export function langOf(locales: readonly string[]): Lang {
  const first = locales.map(l => l.trim().toLowerCase()).find(l => l !== '' && l !== 'c' && l !== 'posix')
  return first?.startsWith('zh') ? 'zh' : 'en'
}
