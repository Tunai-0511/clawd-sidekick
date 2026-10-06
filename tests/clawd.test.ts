import { describe, expect, test } from 'claude-code/testing'
import type { RenderElement } from 'claude-code'

import type { Doing, Game, SceneActor, SceneProps, Season, Theme, TimeOfDay } from '../types'
import { countdown, parseDeadline, urgency } from '../hooks/deadline'
import { isTestRun, momentOf } from '../hooks/events'
import { dateOf, dayBefore, emptyDay, poseOf, recapSvg, streakOf } from '../hooks/recap'
import { MEDAL_BOX } from '../hooks/decor'
import { emptyLife, FAMILIES, hatFor, lifeFromDays, medalsOf, palFor, reached, TROPHY_TOTAL } from '../hooks/trophies'
import { composeScene, hatRise, hitTest, layoutFor, SPOT_X, tipOf } from '../hooks/scene'
import { sceneSvg } from '../hooks/scene-svg'
import { holidayOf, isSouthern, seasonOf, zoneOf } from '../hooks/seasons'
import { CYCLE, frame, H, POSES, W } from '../hooks/sprite'
import { THEME_ORDER, THEMES } from '../hooks/themes'
import { isDuplicate, parseList, shouldExtract } from '../hooks/todo'
import { BAND, NOW, SURFACES, world } from './world'

const TAIPEI = 480
const DAY = 86_400_000

const crewIn = (game: Game): SceneActor[] =>
  layoutFor(game, 3).slots.map((slot, i) => ({
    id: `c${i + 1}`,
    cap: ['blue', 'green', 'purple'][i] ?? 'blue',
    fromX: slot.x,
    toX: slot.x,
    departAt: 0,
    doing: slot.doing,
    label: '',
  }))

const sceneOf = (game: Game, time: TimeOfDay = 'day', lang: 'zh' | 'en' = 'zh', theme: Theme = 'house', season: Season = 'autumn'): SceneProps => ({
  actors: [{ id: 'main', cap: null, fromX: SPOT_X.library, toX: SPOT_X.code, departAt: NOW - 500, doing: 'code', label: '改 register.tsx' }, ...crewIn(game)],
  todos: 2,
  days: 5,
  urgency: 'near',
  game,
  time,
  board: ['更新設定裡的密鑰', '上傳簡報'],
  deadline: 'Launch · 12/24 23:59 · 剩 5 天',
  lang,
  theme,
  memory: 5,
  isTired: false,
  medals: [],
  trophyCount: [0, 79],
  hat: null,
  pal: null,
  golden: { stamp: false, seal: false },
  season,
  holiday: 'none',
})

describe('the pure parts', () => {
  test('a deadline without a year lands this year, at 23:59 Taipei time', async () => {
    const parsed = parseDeadline('12/24 Launch', NOW, TAIPEI, 'zh')
    expect(parsed).toEqual({ due: Date.UTC(2026, 9, 11, 15, 59), title: 'Launch' })
    const timed = parseDeadline('2027-03-01 09:00 Product review', NOW, TAIPEI, 'zh')
    expect(timed).toEqual({ due: Date.UTC(2026, 9, 14, 5, 0), title: 'Product review' })
    expect('error' in parseDeadline('someday 繳費', NOW, TAIPEI, 'zh')).toBe(true)
    const tomorrow = parseDeadline('明天 繳費', NOW, TAIPEI, 'zh')
    expect('due' in tomorrow && tomorrow.due).toBe(Date.UTC(2026, 9, 7, 15, 59))
    const english = parseDeadline('tomorrow 18:00 Launch', NOW, TAIPEI, 'en')
    expect(english).toEqual({ due: Date.UTC(2026, 9, 7, 10, 0), title: 'Launch' })
    const bad = parseDeadline('someday Laundry', NOW, TAIPEI, 'en')
    expect('error' in bad && bad.error).toStartWith('Usage: /deadline add')
  })

  test('countdowns read like a person would say them', async () => {
    expect(countdown(NOW + 5 * DAY + 3_600_000, NOW, 'zh')).toBe('剩 5 天')
    expect(countdown(NOW + DAY + 6 * 3_600_000, NOW, 'zh')).toBe('剩 1 天 6 小時')
    expect(countdown(NOW + 6 * 3_600_000 + 20 * 60_000, NOW, 'zh')).toBe('剩 6 小時 20 分')
    expect(countdown(NOW - 2 * DAY, NOW, 'zh')).toBe('過了 2 天')
    expect(countdown(NOW + 5 * DAY + 3_600_000, NOW, 'en')).toBe('5 days left')
    expect(countdown(NOW + 6 * 3_600_000 + 20 * 60_000, NOW, 'en')).toBe('6 h 20 min left')
    expect(countdown(NOW - DAY - 1, NOW, 'en')).toBe('1 day ago')
    expect(urgency(NOW + 2 * 3_600_000, NOW)).toBe('urgent')
    expect(urgency(NOW + 2 * DAY, NOW)).toBe('near')
  })

  test('only replies that hand something over go to the model', async () => {
    expect(shouldExtract('我把 register.tsx 的 bug 修好了，測試全過。')).toBe(false)
    expect(shouldExtract('程式寫好了。接下來請你到設定頁更新密鑰。')).toBe(true)
    expect(parseList('好的：["更新設定裡的密鑰", "上傳簡報", 3]')).toEqual(['更新設定裡的密鑰', '上傳簡報'])
    expect(parseList('none')).toEqual([])
    const open = [{ id: 'a', text: '更新設定裡的密鑰', project: 'x', createdAt: 0, isDone: false, isManual: false }]
    expect(isDuplicate(open, '更新設定裡的密鑰')).toBe(true)
    expect(isDuplicate(open, '上傳影片')).toBe(false)
  })

  test('every pose of the big Clawd stays on his canvas', async () => {
    for (const pose of POSES) {
      for (let t = 0; t < CYCLE[pose]; t++) {
        const grid = frame(pose, t)
        expect(grid.length).toBe(W * H)
        expect(grid.filter(c => c === 1).length).toBeGreaterThan(60)
      }
    }
  })

  test('each game seats the crew it has, and a short game falls back to ping-pong', async () => {
    expect(layoutFor('volley', 3).slots.map(s => s.doing)).toEqual(['volley', 'volley', 'volley'])
    expect(layoutFor('volley', 2).slots).toHaveLength(2)
    expect(layoutFor('rope', 2).game).toBe('pong')
    expect(layoutFor('tower', 1).slots[0]?.doing).toBe('arcade')
    expect(layoutFor('sleep', 0).slots).toHaveLength(0)
  })

  test('the pointer finds Clawds, the board, the calendar and the rooms', async () => {
    const s = sceneOf('pong')
    const later = NOW + 10_000
    expect(hitTest(s, later, SPOT_X.code + 8, 20)).toEqual({ kind: 'actor', id: 'main' })
    expect(tipOf(s, { kind: 'actor', id: 'main' })).toContain('改 register.tsx')
    expect(tipOf(s, { kind: 'actor', id: 'c1' })).toContain('在打電動')
    expect(tipOf(s, hitTest(s, later, 52, 8)!)).toContain('更新設定裡的密鑰')
    expect(tipOf(s, hitTest(s, later, 70, 8)!)).toContain('剩 5 天')
    expect(hitTest(s, later, 100, 6)).toEqual({ kind: 'room', id: 'terminal' })
    const english = sceneOf('pong', 'day', 'en')
    expect(tipOf(english, { kind: 'actor', id: 'c1' })).toBe('Blue-cap Clawd · playing the arcade')
    expect(tipOf(english, { kind: 'room', id: 'terminal' })).toStartWith('Server room')
  })

  test('every scene, game and time of day makes a transparent, hoverable SVG inside the size limit', async () => {
    for (const theme of ['house', 'beach', 'space', 'forest'] as const)
    for (const game of ['pong', 'volley', 'rope', 'tower', 'sleep'] as const) {
      for (const time of ['day', 'dusk', 'night'] as const) {
        const svg = sceneSvg(sceneOf(game, time, 'zh', theme), NOW)
        expect(svg.length).toBeLessThan(131072)
        expect(svg).toContain('color-scheme:light dark')
        expect(svg).toContain('.clawd:hover')
        expect(svg).toContain('□ 更新設定裡的密鑰')
      }
    }
    const english = sceneSvg(sceneOf('volley', 'day', 'en'), NOW)
    expect(english).toContain('Game room')
    expect(english).toContain('Board: for you to do')
    expect(english).not.toContain('遊戲間')
    expect(sceneSvg(sceneOf('volley', 'night', 'zh', 'beach'), NOW)).toContain('沙灘球場')
    expect(sceneSvg(sceneOf('pong', 'day', 'en', 'forest'), NOW)).toContain('Campfire')
    expect(sceneSvg(sceneOf('pong', 'day', 'en', 'space'), NOW)).toContain('Outside: the endless dark')
  })
})

describe('the season and the holidays', () => {
  test('seasons follow the local date, turned over south of the equator', async () => {
    expect(seasonOf(NOW, TAIPEI)).toBe('autumn')
    expect(seasonOf(NOW, TAIPEI, 'Asia/Taipei')).toBe('autumn')
    expect(seasonOf(NOW, 600, 'Australia/Sydney')).toBe('spring')
    expect(seasonOf(NOW, -180, 'America/Argentina/Buenos_Aires')).toBe('spring')
    expect(seasonOf(Date.UTC(2026, 0, 15), 0)).toBe('winter')
  })

  test('holidays come from the local date', async () => {
    expect(holidayOf(NOW, TAIPEI)).toBe('none')
    expect(holidayOf(Date.UTC(2026, 1, 16, 4), TAIPEI)).toBe('lunarNewYear')
    expect(holidayOf(Date.UTC(2026, 9, 31, 4), TAIPEI)).toBe('halloween')
    expect(holidayOf(Date.UTC(2026, 11, 25, 4), TAIPEI)).toBe('christmas')
  })

  test('the time zone tells which side of the equator the person is on', async () => {
    expect(zoneOf('/var/db/timezone/zoneinfo/Asia/Taipei\n')).toBe('Asia/Taipei')
    expect(zoneOf('/usr/share/zoneinfo/America/Argentina/Buenos_Aires')).toBe('America/Argentina/Buenos_Aires')
    expect(zoneOf(':Europe/Paris')).toBe('Europe/Paris')
    expect(zoneOf('UTC')).toBeUndefined()
    expect(['Australia/Perth', 'Pacific/Auckland', 'America/Sao_Paulo', 'Africa/Johannesburg', 'Asia/Jakarta'].every(isSouthern)).toBe(true)
    expect(['Asia/Taipei', 'Europe/London', 'America/New_York', 'America/Bahia_Banderas', 'Africa/Cairo', ''].some(isSouthern)).toBe(false)
  })

  test("petals and leaves fall only where the sky can be seen, and every scene stays inside the size limit", async () => {
    for (const theme of ['house', 'beach', 'space', 'forest'] as const) {
      for (const season of ['spring', 'summer', 'autumn', 'winter'] as const) {
        const svg = sceneSvg(sceneOf('volley', 'day', 'zh', theme, season), NOW)
        expect(svg.length).toBeLessThan(131072)
        expect(svg.includes('clip-path="url(#falling)"')).toBe(theme !== 'space' && (season === 'spring' || season === 'autumn'))
      }
    }
  })
})

describe('what happens shows in every scene', () => {
  const differing = (a: Uint8Array, b: Uint8Array, box: { x: number; y: number; w: number; h: number }): number => {
    let n = 0
    for (let y = box.y; y < box.y + box.h; y++) for (let x = box.x; x < box.x + box.w; x++) if (a[y * 256 + x] !== b[y * 256 + x]) n++
    return n
  }

  /** The scene with the main Clawd standing at `x` doing `doing`, out of the way unless told. */
  const withMain = (theme: Theme, doing: Doing, x: number = SPOT_X.code): SceneProps => {
    const s = sceneOf('volley', 'day', 'zh', theme)
    return { ...s, actors: s.actors.map(a => (a.cap === null ? { ...a, fromX: x, toX: x, departAt: 0, doing, label: '好' } : a)) }
  }

  test("every scene keeps Claude's memory in its library zone, and fills it as the context fills", async () => {
    for (const theme of THEME_ORDER) {
      const { box } = THEMES[theme].memory
      expect(box.x + box.w).toBeLessThanOrEqual(46)
      const scene = (memory: number): Uint8Array => composeScene({ ...withMain(theme, 'code'), memory }, 0, NOW)
      expect(differing(scene(0), scene(10), box)).toBeGreaterThan(8)
      expect(differing(scene(4), scene(5), box)).toBeGreaterThan(0)
      expect(sceneSvg({ ...sceneOf('pong', 'day', 'zh', theme), memory: 6 }, NOW)).toContain('記憶（context），大約 60% 滿')
      expect(tipOf({ ...sceneOf('pong', 'day', 'en', theme), memory: 3 }, { kind: 'memory' })).toContain('about 30% full')
      expect(hitTest(withMain(theme, 'code'), NOW, box.x + 1, box.y + box.h - 1)).toEqual({ kind: 'memory' })
    }
  })

  test('every moment is acted out the same in every scene, inside the size limit', async () => {
    const moments: Doing[] = ['ask', 'stamp', 'mail', 'tidy', 'cheer', 'oops']
    for (const theme of THEME_ORDER) {
      const around = { x: SPOT_X.code - 4, y: 0, w: 32, h: 28 }
      for (const doing of moments) {
        const frames = [0, 3, 5, 9].map(t => composeScene(withMain(theme, doing), t, NOW))
        const plain = [0, 3, 5, 9].map(t => composeScene(withMain(theme, 'think'), t, NOW))
        expect(frames.some((g, i) => differing(g, plain[i]!, around) > 6)).toBe(true)
        expect(sceneSvg(withMain(theme, doing), NOW).length).toBeLessThan(131072)
      }
    }
  })

  test('a tired crew droops late in the five-hour window, in every scene', async () => {
    for (const theme of THEME_ORDER) {
      const rested = composeScene(sceneOf('pong', 'day', 'zh', theme), 2, NOW)
      const tired = composeScene({ ...sceneOf('pong', 'day', 'zh', theme), isTired: true }, 2, NOW)
      expect(differing(rested, tired, { x: 174, y: 0, w: 82, h: 28 })).toBeGreaterThan(0)
    }
  })

  test('commands become moments: test runs, commits, pushes, pull requests', async () => {
    expect(['npm test', 'pnpm run test -- --watch=false', 'cd api && pytest -q', 'go test ./...', 'cargo test', './gradlew test', 'claude plugin test .'].every(isTestRun)).toBe(true)
    expect(['npm install', 'git status', 'cat test.txt', 'ls tests'].some(isTestRun)).toBe(false)
    expect(momentOf('npm test', false, undefined, 'zh')).toMatchObject({ pose: 'cheer', label: '測試通過！' })
    expect(momentOf('pytest', true, undefined, 'en')).toMatchObject({ pose: 'oops', label: 'Tests failed…' })
    expect(momentOf('git commit -m x', false, { commit: { sha: 'abc1234def' } }, 'zh')).toMatchObject({ pose: 'stamp', label: 'commit 好了 abc1234' })
    expect(momentOf('git commit -m x && git push', false, { commit: { sha: 'abc1234' }, push: { branch: 'main' } }, 'en')).toMatchObject({ pose: 'mail', label: 'Pushed to main' })
    expect(momentOf('gh pr merge 12', false, { pr: { number: 12, action: 'merged' } }, 'zh')).toMatchObject({ pose: 'cheer', label: 'PR #12 合併了！' })
    expect(momentOf('git push', true, { push: { branch: 'main' } }, 'zh')).toBeUndefined()
    expect(momentOf('ls', false, undefined, 'zh')).toBeUndefined()
  })
})

describe('trophies', () => {
  const differing = (a: Uint8Array, b: Uint8Array, box: { x: number; y: number; w: number; h: number }): number => {
    let n = 0
    for (let y = box.y; y < box.y + box.h; y++) for (let x = box.x; x < box.x + box.w; x++) if (a[y * 256 + x] !== b[y * 256 + x]) n++
    return n
  }
  const at = (theme: Theme): SceneProps => {
    const s = sceneOf('pong', 'day', 'zh', theme)
    return { ...s, actors: s.actors.map(a => (a.cap === null ? { ...a, fromX: SPOT_X.code, toX: SPOT_X.code, departAt: 0, doing: 'code' as const, label: '改 app.ts' } : a)) }
  }

  test('79 goals in rising tiers, from a first commit to a hundred days in a row', async () => {
    expect(TROPHY_TOTAL).toBe(79)
    for (const family of FAMILIES) {
      const targets = family.tiers.map(t => t.target)
      expect([...targets].sort((a, b) => a - b)).toEqual(targets)
    }
    const life = { ...emptyLife(), commits: 1, bestStreak: 30, tools: 999 }
    expect(reached(life)).toEqual(expect.arrayContaining(['commits:bronze', 'streak:bronze', 'streak:silver', 'streak:gold']))
    expect(reached(life)).not.toContain('tools:bronze')
    expect(reached(life)).not.toContain('streak:legend')
  })

  test('the medals show each goal at its best, and hats and pals come as rewards', async () => {
    const unlocked = { 'commits:bronze': 1, 'commits:silver': 2, 'streak:bronze': 3, 'streak:silver': 4, 'streak:gold': 5, 'scenes:silver': 6 }
    expect(medalsOf(unlocked)).toEqual(['gold', 'silver', 'silver'])
    expect(hatFor({ unlocked, hat: 'auto', pal: 'auto' })).toBe('crown')
    expect(hatFor({ unlocked, hat: 'explorer', pal: 'auto' })).toBe('explorer')
    expect(hatFor({ unlocked, hat: 'halo', pal: 'auto' })).toBe('crown')
    expect(hatFor({ unlocked, hat: 'none', pal: 'auto' })).toBeNull()
    expect(palFor({ unlocked, hat: 'auto', pal: 'auto' })).toBeNull()
    expect(palFor({ unlocked: { 'pets:gold': 1 }, hat: 'auto', pal: 'auto' })).toBe('crab')
  })

  test('the days already kept count toward the streak', async () => {
    const day = (date: string, tools: number) => ({ ...emptyDay(date), tools, turns: tools > 0 ? 1 : 0 })
    const life = lifeFromDays([day('2026-10-01', 5), day('2026-10-02', 3), day('2026-10-03', 0), day('2026-10-04', 9), day('2026-10-05', 2), day('2026-10-06', 4)])
    expect(life.days).toBe(5)
    expect(life.bestStreak).toBe(3)
    expect(life.streak).toBe(3)
    expect(life.tools).toBe(23)
  })

  test('every scene hangs the medals, wears every hat clear of the bubble, and walks the pal', async () => {
    const medals = ['legend', 'gold', 'gold', 'silver', 'silver', 'silver', 'bronze', 'bronze', 'bronze', 'bronze'] as const
    for (const theme of THEME_ORDER) {
      expect(differing(composeScene({ ...at(theme), medals: [...medals] }, 0, NOW), composeScene(at(theme), 0, NOW), MEDAL_BOX)).toBeGreaterThan(40)
      expect(sceneSvg({ ...at(theme), medals: [...medals], trophyCount: [23, 79] }, NOW)).toContain('成就 23 / 79')
      expect(tipOf({ ...at(theme), medals: [...medals], trophyCount: [23, 79] }, hitTest({ ...at(theme), medals: [...medals] }, NOW, 200, 9)!)).toContain('23 / 79')
      for (const hat of ['party', 'crown', 'halo', 'wizard', 'captain', 'flower', 'explorer', 'graduation', 'headphones'] as const) {
        const s = { ...at(theme), hat }
        const around = { x: SPOT_X.code, y: 8, w: 16, h: 8 }
        expect(differing(composeScene(s, 0, NOW), composeScene(at(theme), 0, NOW), around)).toBeGreaterThan(2)
        const svg = sceneSvg({ ...s, medals: [...medals], pal: 'cat' }, NOW)
        expect(svg.length).toBeLessThan(131072)
        const bubble = svg.match(/<g class="quiet"><rect x="[\d.]+" y="([\d.]+)" width="[\d.]+" height="([\d.]+)"/)
        expect(Number(bubble?.[1]) + Number(bubble?.[2]) + 1).toBeLessThanOrEqual(15 - hatRise(hat) + 0.5)
      }
      for (const pal of ['cat', 'owl', 'crab'] as const) {
        const frames = [0, 80, 160, 240].map(t => composeScene({ ...at(theme), pal }, t, NOW))
        const plain = [0, 80, 160, 240].map(t => composeScene(at(theme), t, NOW))
        expect(frames.filter((g, i) => differing(g, plain[i]!, { x: 0, y: 19, w: 256, h: 6 }) > 4).length).toBeGreaterThanOrEqual(3)
      }
    }
  })

  test('the days kept before trophies unlock theirs, and a new day keeps the streak going', async ($, on) => {
    const day = (date: string) => ({ ...emptyDay(date), turns: 2, tools: 20 })
    const w = world(on, [], { 'day:2026-10-04': day('2026-10-04'), 'day:2026-10-05': day('2026-10-05') })
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    expect(w.toasts.length).toBe(0)
    await $.turn.start({ text: '開工', turnId: 't1' })
    await $.turn.complete({ turnId: 't1', reason: 'answer', answer: '好', durationMs: 60_000 } as never)
    expect(w.toasts.some(t => t.includes('連續開工・銅'))).toBe(true)
    const run = (args: string) => $.command.run({ command: 'clawd', args, origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } })
    expect((await run('trophies')).text).toContain('已解鎖 1 / 79')
    expect((await run('hat crown')).text).toContain('還沒解鎖王冠')
    const pane = await $.ui.mount({ plugin: 'clawd-sidekick', surface: 'terminal', component: 'Pane', requestId: 'clawd-trophies', props: { title: '成就', isFocused: true, bodyColumns: 100, placement: 'dock' } } as never)
    expect(await pane.find({ text: /連續開工/ })).toBeDefined()
    expect(await pane.find({ text: /3 天 \/ 7 天/ })).toBeDefined()
  })

  test('a hat earned can be worn, swapped and taken off', async ($, on) => {
    world(on, [], { trophies: { unlocked: { 'streak:silver': 1, 'streak:gold': 2, 'scenes:silver': 3 }, hat: 'auto', pal: 'auto' } })
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    const run = (args: string) => $.command.run({ command: 'clawd', args, origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } })
    expect((await run('hat')).text).toContain('王冠')
    expect((await run('hat 探險帽')).text).toContain('戴上了探險帽')
    expect((await run('hat none')).text).toContain('拿下來')
    expect((await run('pal cat')).text).toContain('還沒解鎖貓咪')
  })
})

describe('neighbors', () => {
  const presence = (id: string, project: string, isWorking: boolean, label = '跑 npm test') => ({ id, project, pose: 'type', label, isWorking, at: NOW })

  test('a busy session next door sends its Clawd over; an idle one is only named', async ($, on) => {
    world(on, [], { 'presence:busy': presence('busy', 'api', true), 'presence:idle': presence('idle', 'web', false, '輪到你了') })
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
    const svg = String((await ui.find({ type: 'Svg' }))?.props.source)
    expect(svg).toContain('api・跑 npm test')
    expect(svg).toContain('鄰居 Clawd（api）')
    expect(svg).not.toContain('鄰居 Clawd（web）')
    expect(await ui.find({ text: /api、web/ })).toBeDefined()
  })

  test('a visitor never joins the crew, and walks out once his session falls quiet', async ($, on) => {
    const w = world(on, [], { 'presence:busy': presence('busy', 'api', true) })
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    await $.turn.start({ text: '修 bug', turnId: 't1' })
    const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
    const during = String((await ui.find({ type: 'Svg' }))?.props.source)
    expect(during).toContain('在打排球')
    expect(during).toContain('api・跑 npm test')
    await w.clock.advance(70_000)
    const after = String((await ui.find({ type: 'Svg' }))?.props.source)
    expect(after).not.toContain('api・')
    expect(after).toContain('在打排球')
  })
})

describe("Clawd's day", () => {
  const busy = { ...emptyDay('2026-10-06'), turns: 14, workMs: 192 * 60_000, tools: 148, edits: 23, runs: 41, rooms: { library: 38, codelab: 61, terminal: 41, web: 8, game: 0 }, testsPassed: 5, testsFailed: 1, commits: 3, pushes: 2 }

  test('days follow the local date, and a streak counts the days in a row with work', async () => {
    expect(dateOf(Date.UTC(2026, 9, 6, 17, 0), 480)).toBe('2026-10-07')
    expect(dayBefore('2026-03-01')).toBe('2026-02-28')
    expect(streakOf([busy, busy, undefined, busy])).toBe(2)
    expect(streakOf([emptyDay('2026-10-06'), busy, busy])).toBe(2)
    expect(streakOf([undefined])).toBe(0)
    expect(poseOf(emptyDay('2026-10-06'))).toBe('sleep')
    expect(poseOf(busy)).toBe('cheer')
  })

  test('the card fits every scene and both languages, and says a quiet day is quiet', async () => {
    for (const theme of THEME_ORDER) {
      for (const lang of ['zh', 'en'] as const) {
        const svg = recapSvg(busy, [undefined, busy, busy], 3, lang, theme)
        expect(svg.length).toBeLessThan(131072)
        expect(svg).toContain('148')
        expect(svg).toContain(lang === 'zh' ? '3 小時 12 分' : '3 h 12 min')
      }
    }
    expect(recapSvg(emptyDay('2026-10-06'), [], 0, 'zh', 'house')).toContain('今天還沒開工')
    expect(recapSvg({ ...busy, commits: 1 }, [], 1, 'en', 'house')).toContain('>commit</tspan>')
  })

  test('/clawd recap sums up today across sessions, with yesterday in the streak', async ($, on) => {
    world(on, [], { 'day:2026-10-05': { ...emptyDay('2026-10-05'), turns: 2, tools: 9 } })
    on('tool.call', async (_$, e) => {
      const command = String((e as unknown as { command?: string }).command ?? '')
      const git = command.startsWith('git commit') ? { gitOperation: { commit: { sha: 'abc1234', kind: 'committed' } } } : {}
      return { result: { stdout: '', stderr: '', interrupted: false, ...git } as never }
    })
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    await $.turn.start({ text: '修好再 commit', turnId: 't1' })
    await $.tool.call({ tool: 'Bash', command: 'npm test' } as never)
    await $.tool.call({ tool: 'Bash', command: 'git commit -m "fix"' } as never)
    await $.turn.complete({ turnId: 't1', reason: 'answer', answer: '好了', durationMs: 5 * 60_000 } as never)
    const run = (args: string) => $.command.run({ command: 'clawd', args, origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } })
    const said = (await run('recap')).text ?? ''
    expect(said).toContain('1 個回合')
    expect(said).toContain('測試 1 過 0 沒過')
    expect(said).toContain('1 次 commit')
    expect(said).toContain('連續 2 天')
    const pane = { plugin: 'clawd-sidekick', component: 'Pane', requestId: 'clawd-recap', props: { title: 'Clawd 的一天', isFocused: true, bodyColumns: 90, placement: 'dock' } } as never
    const desktop = await $.ui.mount({ ...(pane as object), surface: 'desktop' } as never)
    const card = String((await desktop.find({ type: 'Svg' }))?.props.source)
    expect(card).toContain('1/1')
    expect(card).toContain('連續 2 天')
    const terminal = await $.ui.mount({ ...(pane as object), surface: 'terminal' } as never)
    expect(await terminal.find({ text: /連續 2 天/ })).toBeDefined()
  })
})

describe('the band above the prompt', () => {
  test('reduced motion holds every loop on its first frame, and a holiday hat clears the bubble', async () => {
    const svg = sceneSvg({ ...sceneOf('volley', 'night', 'zh', 'house', 'winter'), holiday: 'christmas' }, NOW)
    expect(svg).toContain('@media (prefers-reduced-motion:reduce)')
    const loops = svg.split('<animate attributeName="visibility"').length - 1
    expect(loops).toBeGreaterThan(0)
    expect(svg.split('<g class="f0" visibility').length - 1 + svg.split('<g class="f" visibility').length - 1).toBe(loops)
    const bubbleTop = (text: string): number => Number(text.match(/<g class="quiet"><rect x="[\d.]+" y="([\d.]+)"/)?.[1])
    expect(bubbleTop(svg)).toBeLessThan(bubbleTop(sceneSvg(sceneOf('volley', 'night', 'zh', 'house', 'winter'), NOW)) - 3)
  })

  test('the house draws as a Client on the terminal and an interactive SVG on the desktop', async ($, on) => {
    world(on)
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    for (const surface of SURFACES) {
      const ui = await $.ui.mount({ ...BAND, surface })
      expect(await ui.find({ text: /我是 Clawd/ })).toBeDefined()
      expect(await ui.find({ text: '沒有要你做的事 ✓' })).toBeDefined()
      expect(await ui.find({ text: 'Opus 5.5' })).toBeDefined()
      expect(await ui.find({ text: /▰▰▱▱▱ 42%/ })).toBeDefined()
      expect(await ui.find({ text: '1.84' })).toBeDefined()
      expect(await ui.find({ text: '考我' })).toBeUndefined()
      expect(await ui.find({ text: /樂團/ })).toBeUndefined()
      if (surface === 'terminal') {
        await ui.resize({ columns: 110, rows: 15, in: 'house' })
        expect(await ui.find({ text: /書庫/, in: 'house' })).toBeDefined()
      } else {
        const svg = await ui.find({ type: 'Svg' })
        expect(svg?.props.isInteractive).toBe(true)
        expect(svg?.props.width).toBe(110 * 8)
        expect(String(svg?.props.source)).toContain('遊戲間')
      }
      await ui.unmount()
    }
  })

  test('between ticks the desktop house keeps the same SVG, so its loops never start over', async ($, on) => {
    const w = world(on)
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    const run = (command: string, args: string) => $.command.run({ command, args, origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } })
    // Five hours from now, written in Taipei time: a countdown that would tick every minute.
    await run('deadline', `add ${new Date(NOW + 13 * 3_600_000).toISOString().slice(0, 16).replace('T', ' ')} Demo`)
    await $.turn.start({ text: '幫我修 bug', turnId: 't0' })
    // Past the walk to the court and the deadline's one alarm.
    await w.clock.advance(60_000)
    const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
    const source = async (): Promise<string> => String((await ui.find({ type: 'Svg' }))?.props.source)
    const first = await source()
    expect(first).toContain('Demo')
    expect(first).toContain('在打排球')
    for (let i = 0; i < 12; i++) {
      await w.clock.advance(5_000)
      expect(await source()).toBe(first)
    }
  })

  test('a commit, then a permission ask, play out on the band', async ($, on) => {
    world(on)
    on('classic.Notification', async () => ({}))
    on('tool.call', async () => ({ result: { stdout: '', stderr: '', interrupted: false, gitOperation: { commit: { sha: 'abc1234def', kind: 'committed' } } } as never }))
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    await $.turn.start({ text: 'commit 一下', turnId: 't9' })
    await $.tool.call({ tool: 'Bash', command: 'git commit -m "fix"' } as never)
    const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
    expect(String((await ui.find({ type: 'Svg' }))?.props.source)).toContain('commit 好了 abc1234')
    await $.classic.Notification({ message: 'Claude needs your permission', notification_type: 'permission_prompt' })
    const asking = String((await ui.find({ type: 'Svg' }))?.props.source)
    expect(asking).toContain('主 Clawd · 需要你批准')
    expect(asking).not.toContain('>需要你批准</text>')
  })

  test('compacting, Clawd tidies the library, then says it is done', async ($, on) => {
    world(on)
    let during = ''
    on('session.compact', async () => {
      const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
      during = String((await ui.find({ type: 'Svg' }))?.props.source)
      await ui.unmount()
      return { messages: [{ role: 'user', text: '摘要', toolUses: [] }] } as never
    })
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    const summary = [{ role: 'user', text: '摘要', toolUses: [] }] as never
    await $.session.compact({ trigger: 'manual', messages: summary })
    expect(during).toContain('整理記憶中…')
    const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
    expect(String((await ui.find({ type: 'Svg' }))?.props.source)).toContain('記憶整理好了')
  })

  test('the crew plays volleyball while Claude works', async ($, on) => {
    world(on)
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    await $.turn.start({ text: '幫我修 bug', turnId: 't0' })
    const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
    expect(String((await ui.find({ type: 'Svg' }))?.props.source)).toContain('在打排球')
  })

  test('a subagent borrows a player from the game room and gives him back', async ($, on) => {
    world(on)
    const sourceNow = async (): Promise<string> => {
      const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
      const source = String((await ui.find({ type: 'Svg' }))?.props.source)
      await ui.unmount()
      return source
    }
    let during = ''
    on('tool.call', async () => {
      during = await sourceNow()
      return { result: { status: 'completed', content: [] } as never }
    })
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    await $.turn.start({ text: '查一下', turnId: 't3' })
    await $.tool.call({ tool: 'Agent', description: '探索 hooks', prompt: '找出 hooks 怎麼載入', subagent_type: 'Explore' } as never)
    expect(during).toContain('探索 hooks')
    expect(await sourceNow()).not.toContain('探索 hooks')
  })

  test('a reply that hands you work becomes a todo you can tick off', async ($, on) => {
    const w = world(on, ['["更新設定裡的密鑰"]'])
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    await $.turn.start({ text: '幫我改登入頁', turnId: 't1' })
    await $.turn.complete({
      answer: '串接寫好了。接下來請你到設定頁更新密鑰。',
      durationMs: 1000,
      isAborted: false,
      turnId: 't1',
      reason: 'answer',
    })
    await w.clock.advance(100)
    expect(w.toasts.join()).toContain('更新設定裡的密鑰')
    for (const surface of SURFACES) {
      const ui = await $.ui.mount({ ...BAND, surface })
      const box = await ui.find({ type: 'Button', text: '□' })
      expect(box).toBeDefined()
      expect(await ui.find({ text: /更新設定裡的密鑰/ })).toBeDefined()
      if (surface === 'desktop') {
        expect(String((await ui.find({ type: 'Svg' }))?.props.source)).toContain('□ 更新設定裡的密鑰')
        await ui.press({ key: box?.key ?? '' })
        expect(await ui.find({ text: '沒有要你做的事 ✓' })).toBeDefined()
      }
      await ui.unmount()
    }
  })

  test('a deadline shows its countdown on the band and the calendar', async ($, on) => {
    world(on)
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    const added = await $.command.run({ command: 'deadline', args: 'add 12/24 Launch', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } })
    expect(added.text).toContain('剩 5 天')
    const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
    expect(await band.find({ text: /Launch 剩 5 天/ })).toBeDefined()
    expect(String((await band.find({ type: 'Svg' }))?.props.source)).toContain('日曆：Launch')
  })

  test('on the terminal the pointer names what it is over, and a click pets that Clawd', async ($, on) => {
    world(on)
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
    await ui.resize({ columns: 110, rows: 15, in: 'house' })
    await ui.pointer({ type: 'move', x: SPOT_X.library + 8, y: 10, in: 'house' })
    expect(await ui.find({ text: /主 Clawd/, in: 'house' })).toBeDefined()
    await ui.pointer({ type: 'move', x: 100, y: 3, in: 'house' })
    expect(await ui.find({ text: /機房/, in: 'house' })).toBeDefined()
    await ui.pointer({ type: 'move', x: SPOT_X.library + 8, y: 10, in: 'house' })
    await ui.pointer({ type: 'down', x: SPOT_X.library + 8, y: 10, button: 'left', in: 'house' })
    expect(await ui.find({ text: /嘿嘿|好癢|再摸|♥|被摸了/ })).toBeDefined()
  })

  test('English when the person asks for it, and /clawd lang switches on the spot', { options: { language: 'en' } }, async ($, on) => {
    world(on)
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
    expect(await ui.find({ text: 'Nothing for you to do ✓' })).toBeDefined()
    expect(await ui.find({ text: /1 command|0 commands/ })).toBeDefined()
    expect(String((await ui.find({ type: 'Svg' }))?.props.source)).toContain('Game room')
    await ui.unmount()
    const switched = await $.command.run({ command: 'clawd', args: 'lang zh', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } })
    expect(switched.text).toBe('Clawd 改說中文了。')
    const again = await $.ui.mount({ ...BAND, surface: 'desktop' })
    expect(await again.find({ text: '沒有要你做的事 ✓' })).toBeDefined()
    await again.press({ key: 'lang' })
    expect(await again.find({ text: 'Nothing for you to do ✓' })).toBeDefined()
  })

  test('auto follows the system, except for someone who met Clawd before he spoke English', async ($, on) => {
    world(on, [], { pets: 6 }, 'en-TW')
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
    expect(await ui.find({ text: /我是 Clawd/ })).toBeDefined()
  })

  test('a fresh install on an English system speaks English', async ($, on) => {
    world(on, [], {}, 'en-US')
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
    expect(await ui.find({ text: /I'm Clawd, your sidekick/ })).toBeDefined()
  })

  test('the scene button moves the Clawds from the house to the beach, space and the forest', async ($, on) => {
    world(on)
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
    const source = async (): Promise<string> => String((await ui.find({ type: 'Svg' }))?.props.source)
    expect(await ui.find({ type: 'Button', text: '場景：小屋' })).toBeDefined()
    await ui.press({ key: 'scene' })
    expect(await source()).toContain('沙灘球場')
    expect(await ui.find({ type: 'Button', text: '場景：海灘' })).toBeDefined()
    const moved = await $.command.run({ command: 'clawd', args: 'scene forest', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } })
    expect(moved.text).toBe('Clawd 們搬到森林營地了。')
    expect(await source()).toContain('營火空地')
  })

  test('a narrow desktop band keeps the house; folding it leaves a way back', async ($, on) => {
    world(on)
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    const narrow = await $.ui.mount({ ...BAND, props: { ...BAND.props, bodyColumns: 50 }, surface: 'desktop' })
    expect(String((await narrow.find({ type: 'Svg' }))?.props.source)).toContain('遊戲間')
    await narrow.press({ key: 'hide' })
    expect(await narrow.find({ text: /Clawd · .* · 沒有待辦/ })).toBeDefined()
    await narrow.press({ key: 'expand' })
    expect(String((await narrow.find({ type: 'Svg' }))?.props.source)).toContain('遊戲間')
  })

  test('between turns Clawd stands by on the hint line, and gives it back while Claude works', async ($, on) => {
    world(on)
    // The engine's own line: its hint, and a plugin's tail after it.
    on('ui.render', { component: 'PromptHint' }, async ($, e) => {
      const { Text } = $.ui.resolve(e)
      return h(Text, { dimColor: true }, `${e.props.hint}${e.props.tail ?? ''}`) as RenderElement
    })
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    const hint = (surface: 'terminal' | 'desktop', isWorking: boolean) =>
      $.ui.mount({ plugin: 'clawd-sidekick', surface, component: 'PromptHint', props: { isDraft: false, isWorking, hint: '? for shortcuts' } })
    const desktop = await hint('desktop', false)
    expect(await desktop.find({ type: 'Svg' })).toBeDefined()
    // English beside Claude Code's own words, though Clawd speaks Chinese here.
    expect(await desktop.find({ text: /Standing by/ })).toBeDefined()
    expect(await desktop.find({ text: /\? for shortcuts/ })).toBeDefined()
    const terminal = await hint('terminal', false)
    expect(await terminal.find({ text: /\? for shortcuts · Clawd · Standing by/ })).toBeDefined()
    const working = await hint('desktop', true)
    expect(await working.find({ type: 'Svg' })).toBeUndefined()
    expect(await working.find({ text: '? for shortcuts' })).toBeDefined()
    await $.turn.start({ text: '修 bug', turnId: 't5' })
    await $.turn.complete({ turnId: 't5', reason: 'answer', answer: '好了', durationMs: 64_000 } as never)
    const after = await hint('desktop', false)
    expect(await after.find({ text: /Your turn/ })).toBeDefined()
    expect(await after.find({ text: /last turn 1:04/ })).toBeDefined()
  })

  test('the spinner is a thinking Clawd with a clock that keeps counting', async ($, on) => {
    world(on)
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    const props = { word: 'Thinking', message: null, suffix: '…', mode: 'thinking' as const }
    const terminal = await $.ui.mount({ plugin: 'clawd-sidekick', surface: 'terminal', component: 'Spinner', props })
    expect(await terminal.find({ text: /▐▛███▜▌/, in: 'spinner' })).toBeDefined()
    expect(await terminal.find({ text: /Thinking…/, in: 'spinner' })).toBeDefined()
    expect(await terminal.find({ text: /thinking/, in: 'spinner' })).toBeDefined()
    expect(await terminal.find({ text: /思考中/, in: 'spinner' })).toBeUndefined()
    const desktop = await $.ui.mount({ plugin: 'clawd-sidekick', surface: 'desktop', component: 'Spinner', props })
    expect(await desktop.find({ type: 'Svg' })).toBeDefined()
    expect(await desktop.find({ text: /Thinking…/, in: 'spinner' })).toBeDefined()
  })

  test('the season and the holiday can be set by hand and handed back to the date', async ($, on) => {
    world(on)
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    const run = (args: string) => $.command.run({ command: 'clawd', args, origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } })
    expect((await run('holiday christmas')).text).toContain('聖誕節')
    expect((await run('season winter')).text).toContain('冬天')
    expect((await run('holiday auto')).text).toContain('平常日')
    expect((await run('season nope')).text).toContain('用法')
  })

  test('south of the equator the season turns over, and nothing goes online', async ($, on) => {
    const w = world(on, [], {}, 'zh-Hant-TW', { zone: 'Australia/Sydney' })
    const asked: string[] = []
    on('http.fetch', (_$, e) => {
      asked.push(e.url)
      return { value: { status: 200, ok: true, headers: {}, text: '' } }
    })
    await $.session.start({ cwd: '/Users/me/projects/my-app', surface: 'terminal', isInteractive: true })
    await w.clock.settle()
    const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
    expect(String((await ui.find({ type: 'Svg' }))?.props.source)).toContain('#F6B6C8')
    const run = (args: string) => $.command.run({ command: 'clawd', args, origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 120 } })
    expect((await run('season auto')).text).toContain('春天')
    expect(asked).toHaveLength(0)
  })
})
