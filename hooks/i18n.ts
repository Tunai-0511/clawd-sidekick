// Every word Clawd says, in Traditional Chinese and English.
//
// `say(lang)` answers one table; each entry is a string or a small function
// of what goes in it, so word order stays each language's own.

import type { Hat, Pal, Tier } from '../types'
import type { FamilyId, Unit } from './trophies'

export type Lang = 'zh' | 'en'

export type RoomId = 'library' | 'codelab' | 'terminal' | 'web' | 'game'

export type Theme = 'house' | 'beach' | 'space' | 'forest' | 'cosmos'


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
  | 'stretch'
  | 'eat'
  | 'sip'

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
  alarm: (title: string, left: string) => string
  // The band
  hello: string
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
  complete: string
  deadlines: string
  remove: string
  petted: (count: number) => string
  // Commands
  describeClawd: string
  describeDeadline: string
  hintClawd: string
  hintDeadline: string
  folded: string
  unfolded: string
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
  // The git safety net and this session's changes
  uncommitted: (n: number) => string
  commitLabel: string
  commitNudge: (files: number, minutes: number, ahead: number) => string
  changesTitle: string
  changesButton: string
  changesSummary: (files: number, added: number, removed: number, commands: number, failed: number) => string
  changesNone: string
  changesFiles: string
  changesCommands: string
  changesThisTurn: string
  gitLine: (branch: string, ahead: number, behind: number, dirty: number) => string
  notARepo: string
  rowInterrupted: string
  rowNoOutput: string
  // Daily life, rare sights, birthdays, names
  takeBreak: string
  breakToast: (minutes: number) => string
  eggStar: string
  eggCritter: Record<Theme, string>
  birthdayToast: (name: string) => string
  recapTitleOf: (name: string) => string
  crewNumber: (n: number) => string
  nameSet: (who: string, name: string) => string
  nameReset: string
  nameUsage: string
  capSet: (who: string, cap: string) => string
  capUsage: string
  birthdaySet: (date: string) => string
  birthdayOff: string
  birthdayUsage: string
  // Neighbors: the other sessions on this machine
  neighborClawd: (project: string) => string
  neighborsLabel: string
  // Trophies
  tiers: Record<Tier, string>
  families: Record<FamilyId, string>
  /** What a trophy asks, in a sentence, with the tier's target in it ("7 天"). */
  familyWhat: Record<FamilyId, (target: string) => string>
  /** A target as the sentences read it: "7 days", "8 hours", "1,000". */
  amountLong: (unit: Unit, value: number) => string
  nextTier: (tier: string, what: string, reward: string | null) => string
  unlockedWhat: (trophy: string, what: string, reward: string | null) => string
  hats: Record<Hat, string>
  pals: Record<Pal, string>
  goldens: Record<'stamp' | 'seal', string>
  /** A progress figure in its unit: a count, days, hours or minutes. */
  amount: (unit: Unit, value: number) => string
  unlockedMany: (count: number) => string
  trophiesTitle: string
  trophiesButton: string
  trophiesCount: (got: number, total: number) => string
  trophyNext: (progress: string, target: string) => string
  trophyMax: string
  medalsTip: (got: number, total: number) => string
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
  removed: (what: string) => string
  deadlineAdded: (title: string, date: string, left: string) => string
  noSuchDeadline: string
  noDeadlines: string
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
  boardTitle: (deadlines: readonly string[]) => string
  noDeadline: string
  calendarEmpty: string
  calendar: (deadline: string) => string
  toys: Record<Theme, string>
  outside: Record<'day' | 'dusk' | 'night', string>
  outsideSpace: string
  outsideCosmos: string
  // Seasons, holidays
  seasons: Record<SeasonWord, string>
  holidays: Record<HolidayWord, string>
  seasonSet: (season: string) => string
  seasonAuto: (season: string) => string
  seasonUsage: string
  holidaySet: (holiday: string) => string
  holidayAuto: (holiday: string) => string
  holidayUsage: string
  // Lights, the hover cards, the plan's limits, the session's summary
  desktopOnly: string
  lightOff: string
  lightOn: string
  lightsSet: (rooms: string, isOn: boolean) => string
  lightsUsage: string
  allRooms: string
  span: (minutes: number) => string
  resetsIn: (left: string) => string
  usageWarn: (window: 'five_hour' | 'seven_day', step: number, left: string, at: string, isDirty: boolean) => string
  usageBubble: (window: 'five_hour' | 'seven_day', step: number) => string
  sessionTitle: string
  sessionSince: (clock: string) => string
  sessionButton: string
  sessionReplies: (n: number) => string
  sessionFiles: (n: number) => string
  sessionCommands: (n: number) => string
  sessionFailed: (n: number) => string
  sessionCost: string
  sessionTop: string
  sessionQuiet: string
  sessionLine: (d: { work: string; turns: number; tools: number; files: number; added: number; removed: number; runs: number; failed: number; commits: number; pushes: number; usd: string | null }) => string
  lastSession: (project: string, line: string) => string
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
    const what = { house: '書架', beach: '書堆', space: '資料水晶', forest: '書堆', cosmos: '漂浮的書' }[theme]
    return level === null
      ? `${what}＝Claude 的記憶（context），還不知道用了多少`
      : `${what}＝Claude 的記憶（context），大約 ${level * 10}% 滿；快滿時 Clawd 會整理一次`
  },
  sleepy: 'zzz…',
  petLines: count => ['嘿嘿～', '好癢！', '再摸一下', '♥', `被摸了 ${count} 次`],
  alarm: (title, left) => `${title} ${left}！`,
  hello: '我是 Clawd，你的副駕',
  due: (title, left) => `截止 ${title} ${left}`,
  turn: '這次回覆',
  lastTurn: '上次回覆',
  idle: '待機中',
  todayWorked: duration => `今天 ${duration}`,
  tools: '工具',
  edited: '改',
  files: count => `${count} 檔`,
  ran: '跑',
  commands: count => `${count} 指令`,
  list: '面板',
  pet: '♥ 摸摸',
  hide: '收合',
  expand: '展開',
  otherLanguage: 'EN',
  houseAlt: doing => `Clawd 小屋：${doing}`,
  readingInLibrary: 'Clawd 在書庫看書',
  paneTitle: 'Clawd 副駕',
  complete: '完成',
  deadlines: '截止日',
  remove: '移除',
  petted: count => `被摸了 ${count} 次`,
  describeClawd: 'Clawd 副駕：打開面板（/clawd recap 今日戰報、/clawd trophies 成就、/clawd scene 換場景、/clawd hide 收合、/clawd lang en 換英文）',
  describeDeadline: '截止日雷達：越接近 Clawd 越慌',
  hintClawd: '[changes|recap|trophies|hat|pal|name|cap|birthday|scene 名稱|season|holiday|hide|show|lang]',
  hintDeadline: '[add 12/24 名稱|rm N]',
  folded: 'Clawd 收成一行了，/clawd show 叫他回來。',
  unfolded: 'Clawd 回來了。',
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
  uncommitted: n => `${n} 個未提交`,
  commitLabel: '該 commit 了',
  commitNudge: (files, minutes, ahead) => `有 ${files} 個檔案改了 ${minutes} 分鐘還沒 commit${ahead > 0 ? `，另外 ${ahead} 個 commit 還沒 push` : ''}。存個檔吧`,
  changesTitle: '這個 session 改了什麼',
  changesButton: '改了什麼',
  changesSummary: (files, added, removed, commands, failed) => `改了 ${files} 個檔（+${added} −${removed}）· 跑了 ${commands} 個指令${failed > 0 ? `（${failed} 個失敗）` : ''}`,
  changesNone: '這個 session 還沒改任何東西',
  changesFiles: '檔案',
  changesCommands: '指令',
  changesThisTurn: '● 這一回合',
  gitLine: (branch, ahead, behind, dirty) => `⎇ ${branch}${ahead > 0 ? ` ↑${ahead}` : ''}${behind > 0 ? ` ↓${behind}` : ''}${dirty > 0 ? ` · ${dirty} 個未提交` : ' · 都已提交'}`,
  notARepo: '這個資料夾不是 git repo',
  rowInterrupted: '已中斷',
  rowNoOutput: '（沒有輸出）',
  takeBreak: '休息一下吧',
  breakToast: minutes => `已經連續工作 ${minutes} 分鐘了，起來伸展一下吧`,
  eggStar: '✨ 有流星！快看天空',
  eggCritter: { house: '🐦 窗台上來了一隻小麻雀', beach: '🐋 遠方有鯨魚在噴水', space: '🛸 觀測窗外飛過一架 UFO', forest: '🦌 樹叢後面有隻鹿在偷看', cosmos: '🧑‍🚀 有個太空人從遠方飄過去了' },
  birthdayToast: name => `🎂 生日快樂！${name}和夥伴們都戴上了派對帽`,
  recapTitleOf: name => `${name}的一天`,
  crewNumber: n => `夥伴 ${n}`,
  nameSet: (who, name) => `${who}現在叫「${name}」了。`,
  nameReset: '名字都改回預設了。',
  nameUsage: '用法：/clawd name 名字（主 Clawd）、/clawd name 1 名字（夥伴 1–3），或 /clawd name reset',
  capSet: (who, cap) => `${who}換上了${cap}。`,
  capUsage: '用法：/clawd cap 1 red（夥伴 1–3；顏色有 blue、green、purple、red、yellow、teal、pink）',
  birthdaySet: date => `記住了，你的生日是 ${date}。那天大家會戴派對帽慶祝。`,
  birthdayOff: '生日設定拿掉了。',
  birthdayUsage: '用法：/clawd birthday 10/31，或 /clawd birthday off',
  neighborClawd: project => `鄰居 Clawd（${project}）`,
  neighborsLabel: '鄰居',
  tiers: { bronze: '銅', silver: '銀', gold: '金', legend: '傳說' },
  families: {
    streak: '連續開工',
    days: '開工天數',
    commits: 'Commit',
    pushes: 'Push',
    tests: '測試通過',
    green: '測試全綠',
    tools: '工具呼叫',
    edits: '改檔',
    tidy: '整理記憶',
    helpers: '派出子代理',
    night: '夜貓子',
    dawn: '早起的鳥',
    marathon: '工作馬拉松',
    longTurn: '長回合',
    busyDay: '最忙的一天',
    pets: '摸摸 Clawd',
    prs: 'PR 合併',
    scenes: '環遊四景',
    holidays: '節日也上工',
    comeback: '逆轉勝',
    eggs: '稀有景象',
  },
  familyWhat: {
    streak: t => `連續 ${t}都有開工`,
    days: t => `累計 ${t}有開工`,
    commits: t => `累計 commit ${t} 次`,
    pushes: t => `累計 push ${t} 次`,
    tests: t => `測試累計通過 ${t} 次`,
    green: t => `測試連續通過 ${t} 次，中間沒有失敗`,
    tools: t => `Claude 累計用了 ${t} 次工具`,
    edits: t => `累計改了 ${t} 次檔案`,
    tidy: t => `對話被壓縮（整理記憶）${t} 次`,
    helpers: t => `累計派出 ${t} 個子代理`,
    night: t => `在半夜 0 點到 5 點開始了 ${t} 個回合`,
    dawn: t => `在早上 5 點到 7 點開始了 ${t} 個回合`,
    marathon: t => `一天之內工作滿 ${t}`,
    longTurn: t => `單一回合跑了 ${t}`,
    busyDay: t => `一天之內用了 ${t} 次工具`,
    pets: t => `摸了 Clawd ${t} 次`,
    prs: t => `合併了 ${t} 個 PR`,
    scenes: t => `${t} 個場景都住過`,
    holidays: t => `在 ${t} 個節日工作過（農曆新年、萬聖節、聖誕節）`,
    comeback: t => `測試連續失敗 3 次以上之後又通過，${t} 次`,
    eggs: t => `看過 ${t} 種稀有景象（流星，或各場景的訪客）`,
  },
  amountLong: (unit, value) => {
    const n = unit === 'hours' ? Math.floor(value * 10) / 10 : Math.floor(value)
    return unit === 'days' ? `${n} 天` : unit === 'hours' ? `${n} 小時` : unit === 'minutes' ? `${n} 分鐘` : n.toLocaleString('en')
  },
  nextTier: (tier, what, reward) => `下一級（${tier}）：${what}${reward === null ? '' : `，可得${reward}`}`,
  unlockedWhat: (trophy, what, reward) => `🏆 ${trophy}：${what}${reward === null ? '' : `，獲得${reward}`}`,

  hats: { party: '派對帽', crown: '王冠', halo: '光環', wizard: '巫師帽', captain: '船長帽', flower: '小花', explorer: '探險帽', graduation: '學士帽', headphones: '耳機' },
  pals: { cat: '貓咪', owl: '貓頭鷹', crab: '小螃蟹' },
  goldens: { stamp: '金色印章', seal: '金色封蠟' },
  amount: (unit, value) => {
    const n = unit === 'hours' ? Math.floor(value * 10) / 10 : Math.floor(value)
    return unit === 'days' ? `${n} 天` : unit === 'hours' ? `${n} 小時` : unit === 'minutes' ? `${n} 分` : n.toLocaleString('en')
  },
  unlockedMany: count => `🏆 解鎖了 ${count} 個成就！打 /clawd trophies 看看`,
  trophiesTitle: '成就',
  trophiesButton: '成就',
  trophiesCount: (got, total) => `已解鎖 ${got} / ${total}`,
  trophyNext: (progress, target) => `${progress} / ${target}`,
  trophyMax: '全部完成！',
  medalsTip: (got, total) => `獎牌：成就 ${got} / ${total}（/clawd trophies）`,
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
  removed: what => `刪掉了：${what}`,
  deadlineAdded: (title, date, left) => `記下截止日：${title}，${date}（${left}）`,
  noSuchDeadline: '沒有這一個。/deadline 看清單。',
  noDeadlines: '還沒有截止日。',
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
  themes: { house: '小屋', beach: '海灘', space: '太空站', forest: '森林營地', cosmos: '宇宙' },
  scene: name => `場景：${name}`,
  sceneSet: name => `Clawd 們搬到${name}了。`,
  sceneUsage: '用法：/clawd scene house（小屋）、beach（海灘）、space（太空站）、forest（森林營地）、cosmos（宇宙），或 /clawd scene next 換下一個',
  rooms: {
    house: { library: '書庫', codelab: '工作室', terminal: '機房', web: '瞭望台', game: '遊戲間' },
    beach: { library: '遮陽傘', codelab: '沙灘書桌', terminal: '救生塔', web: '燈塔觀景台', game: '沙灘球場' },
    space: { library: '資料艙', codelab: '實驗艙', terminal: '反應爐', web: '觀測窗', game: '娛樂艙' },
    forest: { library: '帳篷', codelab: '木桌', terminal: '無線電小屋', web: '樹屋', game: '營火空地' },
    cosmos: { library: '漂流書庫', codelab: '軌道書桌', terminal: '衛星', web: '望遠鏡', game: '零重力球場' },
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
    stretch: '在伸懶腰',
    eat: '在吃午餐',
    sip: '在喝下午茶',
  },
  caps: { blue: '藍帽', green: '綠帽', purple: '紫帽', red: '紅帽', yellow: '黃帽', teal: '青帽', pink: '粉紅帽' },
  mainClawd: '主 Clawd',
  crewClawd: cap => `${cap} Clawd`,
  forSubagent: task => `替子代理工作：${task}`,
  gettingReady: '準備中',
  boardTitle: deadlines => (deadlines.length === 0 ? '布告欄：還沒有截止日（/deadline add 12/24 名稱）' : `布告欄：截止日\n${deadlines.map(d => `· ${d}`).join('\n')}`),
  noDeadline: '沒有截止日',
  calendarEmpty: '日曆：還沒有截止日（/deadline add 12/24 名稱）',
  calendar: deadline => `日曆：${deadline}`,
  toys: {
    house: '大型電玩：有人在玩的時候別擋到螢幕',
    beach: '沙堡：裡面住著一隻小螃蟹',
    space: '全像電玩：有人在玩的時候別擋到螢幕',
    forest: '營火：小心燙',
    cosmos: '漂浮電玩：玩的時候要抓好，不然會飄走',
  },
  outside: { day: '窗外：白天', dusk: '窗外：黃昏', night: '窗外：晚上' },
  outsideSpace: '窗外：無邊的宇宙',
  outsideCosmos: '四面八方都是星星，遠方有一顆帶環的行星',
  seasons: { spring: '春天', summer: '夏天', autumn: '秋天', winter: '冬天' },
  holidays: { none: '平常日', lunarNewYear: '農曆新年', halloween: '萬聖節', christmas: '聖誕節' },
  seasonSet: season => `季節固定成${season}。/clawd season auto 改回跟著日期。`,
  seasonAuto: season => `季節跟著日期走，現在是${season}。`,
  seasonUsage: '用法：/clawd season spring、summer、autumn、winter，或 auto 跟著日期',
  holidaySet: holiday => `節日佈置固定成${holiday}。/clawd holiday auto 改回跟著日期。`,
  holidayAuto: holiday => `節日跟著日期走，現在是${holiday}。`,
  holidayUsage: '用法：/clawd holiday lunar（農曆新年）、halloween、christmas、none（不佈置），或 auto 跟著日期',
  desktopOnly: 'Clawd 副駕住在 Claude 桌面版裡，在這裡打開就看得到。',
  lightOff: '💡 關燈',
  lightOn: '💡 開燈',
  lightsSet: (rooms, isOn) => `${rooms}${isOn ? '開燈了' : '關燈了'}`,
  lightsUsage: '用法：/clawd lights on 或 off，後面可以接房間（library、codelab、terminal、web、game），不接就是全部',
  allRooms: '全部房間',
  span: minutes => {
    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)
    const mins = minutes % 60
    if (days > 0) return `${days} 天${hours > 0 ? ` ${hours} 小時` : ''}`
    if (hours > 0) return `${hours} 小時${mins > 0 ? ` ${mins} 分` : ''}`
    return `${Math.max(1, mins)} 分`
  },
  resetsIn: left => `${left}後重置`,
  usageWarn: (window, step, left, at, isDirty) => {
    const name = window === 'five_hour' ? '5 小時額度' : '7 天額度'
    if (step >= 100) return `${name}用完了，${at}（${left}後）重置。`
    const tip = step >= 95 ? (isDirty ? '快用完了，先 commit 手上的改動吧。' : '快用完了，留給最要緊的事。') : ''
    return `${name}已用 ${step}%，${at}（${left}後）重置。${tip}`
  },
  usageBubble: (window, step) => `${window === 'five_hour' ? '5h' : '7d'} 額度 ${step}%`,
  sessionTitle: '這次 session',
  sessionSince: clock => `${clock} 開始`,
  sessionButton: '結算',
  sessionReplies: () => '次回覆',
  sessionFiles: () => '個檔',
  sessionCommands: () => '個指令',
  sessionFailed: n => `${n} 個失敗`,
  sessionCost: '花費',
  sessionTop: '改最多的檔',
  sessionQuiet: '這次 session 還沒做什麼事',
  sessionLine: d =>
    `這次 session：${d.work}、${d.turns} 次回覆、${d.tools} 次工具、改 ${d.files} 個檔（+${d.added} −${d.removed}）、跑 ${d.runs} 個指令${d.failed > 0 ? `（${d.failed} 個失敗）` : ''}、${d.commits} 次 commit、${d.pushes} 次 push${d.usd === null ? '' : `、花費 $${d.usd}`}。`,
  lastSession: (project, line) => `上次在 ${project}：${line}`,
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
    const what = { house: 'The shelves', beach: 'The book pile', space: 'The data crystals', forest: 'The book pile', cosmos: 'The floating books' }[theme]
    return level === null
      ? `${what} = Claude's memory (context), not measured yet`
      : `${what} = Claude's memory (context), about ${level * 10}% full; when it fills up, Clawd tidies it`
  },
  sleepy: 'zzz…',
  petLines: count => ['Hehe~', 'That tickles!', 'Again!', '♥', `Petted ${count} times`],
  alarm: (title, left) => `${title}: ${left}!`,
  hello: "I'm Clawd, your sidekick",
  due: (title, left) => `Due: ${title} ${left}`,
  turn: 'this reply',
  lastTurn: 'last reply',
  idle: 'Standing by',
  todayWorked: duration => `${duration} today`,
  tools: 'tools',
  edited: 'edited',
  files: count => (count === 1 ? '1 file' : `${count} files`),
  ran: 'ran',
  commands: count => (count === 1 ? '1 command' : `${count} commands`),
  list: 'Panel',
  pet: '♥ Pet',
  hide: 'Hide',
  expand: 'Expand',
  otherLanguage: '中文',
  houseAlt: doing => `Clawd's house: ${doing}`,
  readingInLibrary: 'Clawd is reading in the library',
  paneTitle: 'Clawd Sidekick',
  complete: 'Done',
  deadlines: 'Deadlines',
  remove: 'Remove',
  petted: count => (count === 1 ? 'Petted once' : `Petted ${count} times`),
  describeClawd: 'Clawd Sidekick: open the pane (/clawd recap shows your day, /clawd trophies your trophies, /clawd scene changes the scene, /clawd hide folds the band, /clawd lang zh switches to Chinese)',
  describeDeadline: 'Deadline radar: the closer it gets, the more Clawd frets',
  hintClawd: '[changes|recap|trophies|hat|pal|name|cap|birthday|scene name|season|holiday|hide|show|lang]',
  hintDeadline: '[add 12/24 name|rm N]',
  folded: 'Clawd folded into one line. /clawd show brings him back.',
  unfolded: 'Clawd is back.',
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
  uncommitted: n => `${n} uncommitted`,
  commitLabel: 'Time to commit',
  commitNudge: (files, minutes, ahead) => `${files} files changed ${minutes} minutes ago and still not committed${ahead > 0 ? `, and ${ahead} commits not pushed` : ''}. Save your work?`,
  changesTitle: 'What this session changed',
  changesButton: 'Changes',
  changesSummary: (files, added, removed, commands, failed) => `${files} files changed (+${added} −${removed}) · ${commands} commands run${failed > 0 ? ` (${failed} failed)` : ''}`,
  changesNone: 'Nothing changed in this session yet',
  changesFiles: 'Files',
  changesCommands: 'Commands',
  changesThisTurn: '● this turn',
  gitLine: (branch, ahead, behind, dirty) => `⎇ ${branch}${ahead > 0 ? ` ↑${ahead}` : ''}${behind > 0 ? ` ↓${behind}` : ''}${dirty > 0 ? ` · ${dirty} uncommitted` : ' · all committed'}`,
  notARepo: 'Not a git repository',
  rowInterrupted: 'interrupted',
  rowNoOutput: '(no output)',
  takeBreak: 'Time for a break',
  breakToast: minutes => `${minutes} minutes at it without a break: time to get up and stretch`,
  eggStar: '✨ A shooting star! Look at the sky',
  eggCritter: { house: '🐦 A sparrow is hopping along the window sill', beach: '🐋 A whale is spouting far out at sea', space: '🛸 A UFO is gliding past the observatory window', forest: '🦌 A deer is peeking out from the bushes', cosmos: '🧑‍🚀 An astronaut is drifting by in the distance' },
  birthdayToast: name => `🎂 Happy birthday! ${name} and the crew have their party hats on`,
  recapTitleOf: name => `${name}'s day`,
  crewNumber: n => `Crew ${n}`,
  nameSet: (who, name) => `${who} is now called "${name}".`,
  nameReset: 'Every name is back to the default.',
  nameUsage: 'Usage: /clawd name <name> (the main Clawd), /clawd name 1 <name> (crew 1–3), or /clawd name reset',
  capSet: (who, cap) => `${who} has a ${cap.toLowerCase()} on.`,
  capUsage: 'Usage: /clawd cap 1 red (crew 1–3; colours: blue, green, purple, red, yellow, teal, pink)',
  birthdaySet: date => `Got it: your birthday is ${date}. Everyone will wear party hats that day.`,
  birthdayOff: 'Birthday forgotten.',
  birthdayUsage: 'Usage: /clawd birthday 10/31, or /clawd birthday off',
  neighborClawd: project => `Neighbor Clawd (${project})`,
  neighborsLabel: 'neighbors',
  tiers: { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', legend: 'Legendary' },
  families: {
    streak: 'Streak',
    days: 'Days at work',
    commits: 'Commits',
    pushes: 'Pushes',
    tests: 'Tests passed',
    green: 'All green',
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
    eggs: 'Rare sights',
  },
  familyWhat: {
    streak: t => `Work on ${t} in a row`,
    days: t => `Work on ${t} in all`,
    commits: t => `Make ${t} commits`,
    pushes: t => `Push ${t} times`,
    tests: t => `Pass ${t} test runs`,
    green: t => `Pass ${t} test runs in a row, with no failure between`,
    tools: t => `Have Claude make ${t} tool calls`,
    edits: t => `Edit files ${t} times`,
    tidy: t => `Have the conversation compacted ${t} times`,
    helpers: t => `Send out ${t} subagents`,
    night: t => `Start ${t} turns between midnight and 5 a.m.`,
    dawn: t => `Start ${t} turns between 5 and 7 a.m.`,
    marathon: t => `Work ${t} in a single day`,
    longTurn: t => `Have one turn run for ${t}`,
    busyDay: t => `Make ${t} tool calls in a single day`,
    pets: t => `Pet Clawd ${t} times`,
    prs: t => `Merge ${t} pull requests`,
    scenes: t => `Live in all ${t} scenes`,
    holidays: t => `Work through ${t} holidays (Lunar New Year, Halloween, Christmas)`,
    comeback: t => `Pass a test run after three or more failures in a row, ${t} times`,
    eggs: t => `See ${t} kinds of rare sight (a shooting star, or a scene's visitor)`,
  },
  amountLong: (unit, value) => {
    const n = unit === 'hours' ? Math.floor(value * 10) / 10 : Math.floor(value)
    if (unit === 'days') return n === 1 ? '1 day' : `${n} days`
    if (unit === 'hours') return n === 1 ? '1 hour' : `${n} hours`
    if (unit === 'minutes') return n === 1 ? '1 minute' : `${n} minutes`
    return n.toLocaleString('en')
  },
  nextTier: (tier, what, reward) => `Next (${tier}): ${what}${reward === null ? '' : `, for a ${reward}`}`,
  unlockedWhat: (trophy, what, reward) => `🏆 ${trophy}: ${what}${reward === null ? '' : `, and a ${reward}`}`,

  hats: { party: 'party hat', crown: 'crown', halo: 'halo', wizard: 'wizard hat', captain: "captain's cap", flower: 'flower', explorer: "explorer's hat", graduation: 'mortarboard', headphones: 'headphones' },
  pals: { cat: 'cat', owl: 'owl', crab: 'little crab' },
  goldens: { stamp: 'golden stamp', seal: 'golden seal' },
  amount: (unit, value) => {
    const n = unit === 'hours' ? Math.floor(value * 10) / 10 : Math.floor(value)
    return unit === 'days' ? `${n} d` : unit === 'hours' ? `${n} h` : unit === 'minutes' ? `${n} min` : n.toLocaleString('en')
  },
  unlockedMany: count => `🏆 ${count} trophies unlocked! See them with /clawd trophies`,
  trophiesTitle: 'Trophies',
  trophiesButton: 'Trophies',
  trophiesCount: (got, total) => `${got} of ${total} unlocked`,
  trophyNext: (progress, target) => `${progress} / ${target}`,
  trophyMax: 'All done!',
  medalsTip: (got, total) => `Medals: ${got} of ${total} trophies (/clawd trophies)`,
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
  removed: what => `Removed: ${what}`,
  deadlineAdded: (title, date, left) => `Deadline noted: ${title}, ${date} (${left})`,
  noSuchDeadline: 'No such deadline. /deadline shows the list.',
  noDeadlines: 'No deadlines yet.',
  usage: 'Usage: /deadline add 12/24 Report, /deadline add 2027-03-01 09:00 Launch, /deadline add tomorrow Pay the rent',
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
  themes: { house: 'House', beach: 'Beach', space: 'Space station', forest: 'Forest camp', cosmos: 'Cosmos' },
  scene: name => `Scene: ${name}`,
  sceneSet: name => `The Clawds moved to the ${name.toLowerCase()}.`,
  sceneUsage: 'Usage: /clawd scene house, beach, space, forest or cosmos, or /clawd scene next for the next one',
  rooms: {
    house: { library: 'Library', codelab: 'Workshop', terminal: 'Server room', web: 'Lookout', game: 'Game room' },
    beach: { library: 'Umbrella', codelab: 'Beach desk', terminal: 'Lifeguard tower', web: 'Lighthouse view', game: 'Beach court' },
    space: { library: 'Archive pod', codelab: 'Lab', terminal: 'Reactor', web: 'Observatory', game: 'Rec deck' },
    forest: { library: 'Tent', codelab: 'Log desk', terminal: 'Radio hut', web: 'Treehouse', game: 'Campfire' },
    cosmos: { library: 'Drifting library', codelab: 'Orbital desk', terminal: 'Satellite', web: 'Telescope', game: 'Zero-g court' },
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
    stretch: 'stretching',
    eat: 'having lunch',
    sip: 'having tea',
  },
  caps: { blue: 'Blue-cap', green: 'Green-cap', purple: 'Purple-cap', red: 'Red-cap', yellow: 'Yellow-cap', teal: 'Teal-cap', pink: 'Pink-cap' },
  mainClawd: 'Clawd',
  crewClawd: cap => `${cap} Clawd`,
  forSubagent: task => `working for a subagent: ${task}`,
  gettingReady: 'getting ready',
  boardTitle: deadlines => (deadlines.length === 0 ? 'Board: no deadlines yet (/deadline add 12/24 name)' : `Board: deadlines\n${deadlines.map(d => `· ${d}`).join('\n')}`),
  noDeadline: 'no deadlines',
  calendarEmpty: 'Calendar: no deadlines yet (/deadline add 12/24 name)',
  calendar: deadline => `Calendar: ${deadline}`,
  toys: {
    house: "Arcade: don't block the screen while someone's playing",
    beach: 'Sandcastle: a little crab lives inside',
    space: "Holo-arcade: don't block the screen while someone's playing",
    forest: "Campfire: careful, it's hot",
    cosmos: 'Floating arcade: hold on while you play, or off it drifts',
  },
  outside: { day: 'Outside: daytime', dusk: 'Outside: dusk', night: 'Outside: night' },
  outsideSpace: 'Outside: the endless dark',
  outsideCosmos: 'Stars in every direction, and a ringed planet far off',
  seasons: { spring: 'spring', summer: 'summer', autumn: 'autumn', winter: 'winter' },
  holidays: { none: 'an ordinary day', lunarNewYear: 'Lunar New Year', halloween: 'Halloween', christmas: 'Christmas' },
  seasonSet: season => `The season is set to ${season}. /clawd season auto follows the date again.`,
  seasonAuto: season => `The season follows the date: it's ${season}.`,
  seasonUsage: 'Usage: /clawd season spring, summer, autumn, winter, or auto to follow the date',
  holidaySet: holiday => `Decorations are set to ${holiday}. /clawd holiday auto follows the date again.`,
  holidayAuto: holiday => `Holidays follow the date: today is ${holiday}.`,
  holidayUsage: 'Usage: /clawd holiday lunar (Lunar New Year), halloween, christmas, none, or auto to follow the date',
  desktopOnly: 'Clawd Sidekick lives in the Claude desktop app: open it there to see this.',
  lightOff: '💡 Lights off',
  lightOn: '💡 Lights on',
  lightsSet: (rooms, isOn) => `Lights ${isOn ? 'on' : 'off'}: ${rooms}`,
  lightsUsage: 'Usage: /clawd lights on or off, then a room (library, codelab, terminal, web, game), or none for all of them',
  allRooms: 'every room',
  span: minutes => {
    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)
    const mins = minutes % 60
    if (days > 0) return `${days}d${hours > 0 ? ` ${hours}h` : ''}`
    if (hours > 0) return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`
    return `${Math.max(1, mins)}m`
  },
  resetsIn: left => `resets in ${left}`,
  usageWarn: (window, step, left, at, isDirty) => {
    const name = window === 'five_hour' ? 'Your 5-hour limit' : 'Your 7-day limit'
    if (step >= 100) return `${name} is used up. It resets at ${at} (in ${left}).`
    const tip = step >= 95 ? (isDirty ? ' Nearly out: commit what you have first.' : ' Nearly out: keep it for what matters most.') : ''
    return `${name} is ${step}% used. It resets at ${at} (in ${left}).${tip}`
  },
  usageBubble: (window, step) => `${window === 'five_hour' ? '5h' : '7d'} limit ${step}%`,
  sessionTitle: 'This session',
  sessionSince: clock => `since ${clock}`,
  sessionButton: 'Summary',
  sessionReplies: n => (n === 1 ? 'reply' : 'replies'),
  sessionFiles: n => (n === 1 ? 'file' : 'files'),
  sessionCommands: n => (n === 1 ? 'command' : 'commands'),
  sessionFailed: n => `${n} failed`,
  sessionCost: 'cost',
  sessionTop: 'Most changed',
  sessionQuiet: 'Nothing done in this session yet',
  sessionLine: d =>
    `This session: ${d.work}, ${d.turns} replies, ${d.tools} tool calls, ${d.files} files changed (+${d.added} −${d.removed}), ${d.runs} commands${d.failed > 0 ? ` (${d.failed} failed)` : ''}, ${d.commits} commits, ${d.pushes} pushes${d.usd === null ? '' : `, $${d.usd}`}.`,
  lastSession: (project, line) => `Last time in ${project}: ${line}`,
}

const STRINGS: Record<Lang, Strings> = { zh, en }

export const say = (lang: Lang): Strings => STRINGS[lang]

/** The language a list of locales ("zh-Hant-TW", "en_US.UTF-8") asks for first; English when none is Chinese. */
export function langOf(locales: readonly string[]): Lang {
  const first = locales.map(l => l.trim().toLowerCase()).find(l => l !== '' && l !== 'c' && l !== 'posix')
  return first?.startsWith('zh') ? 'zh' : 'en'
}
