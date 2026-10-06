import { describe, expect, test } from 'claude-code/testing'

import type { Game, SceneActor, SceneProps, TimeOfDay } from '../types'
import { countdown, parseDeadline, urgency } from '../hooks/deadline'
import { hitTest, layoutFor, SPOT_X, tipOf } from '../hooks/scene'
import { sceneSvg } from '../hooks/scene-svg'
import { CYCLE, frame, H, POSES, W } from '../hooks/sprite'
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

const sceneOf = (game: Game, time: TimeOfDay = 'day', lang: 'zh' | 'en' = 'zh'): SceneProps => ({
  actors: [{ id: 'main', cap: null, fromX: SPOT_X.library, toX: SPOT_X.code, departAt: NOW - 500, doing: 'code', label: '改 register.tsx' }, ...crewIn(game)],
  todos: 2,
  days: 5,
  urgency: 'near',
  game,
  time,
  board: ['更新設定裡的密鑰', '上傳簡報'],
  deadline: 'Launch · 12/24 23:59 · 剩 5 天',
  lang,
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

  test('every game and time of day makes a transparent, hoverable SVG inside the size limit', async () => {
    for (const game of ['pong', 'volley', 'rope', 'tower', 'sleep'] as const) {
      for (const time of ['day', 'dusk', 'night'] as const) {
        const svg = sceneSvg(sceneOf(game, time), NOW)
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
  })
})

describe('the band above the prompt', () => {
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
})
