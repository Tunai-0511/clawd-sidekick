// What sits beneath the plugin in a test: a clock, a store, the host calls
// it makes, and a model that answers from a list.

import type { On, RenderPropsOf } from 'claude-code'
import { mock, type MockClock } from 'claude-code/testing'

export const NOW = Date.UTC(2026, 9, 6, 8, 0)

export type World = {
  clock: MockClock
  played: number
  toasts: string[]
  opened: string[]
  prompts: string[]
  replies: string[]
  /** The project folder session.root answers; a test changes it to open another project. */
  root: string
}

export type Extra = { zone?: string; now?: number }

export function world(on: On, replies: string[] = [], stored: Readonly<Record<string, unknown>> = {}, system = 'zh-Hant-TW', extra: Extra = {}): World {
  const w: World = { clock: mock.clock(on, { now: extra.now ?? NOW }), played: 0, toasts: [], opened: [], prompts: [], replies, root: '/Users/me/projects/my-app' }
  mock.store(on, stored)
  mock.env(on, { HOME: '/tmp/clawd-test' })
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('session.root', () => ({ value: w.root }))
  on('session.id', () => ({ value: 'this-session' }))
  on('process.run', (_$, e) => {
    const zone = extra.zone === undefined ? '' : `/var/db/timezone/zoneinfo/${extra.zone}\n`
    const stdout = e.argv[0] === '/bin/date' ? '+0800\n' : e.argv[0] === '/usr/bin/defaults' ? `(\n    "${system}"\n)\n` : e.argv[0] === 'readlink' ? zone : ''
    return { value: { exitCode: stdout === '' ? 1 : 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('audio.play', () => {
    w.played += 1
    return { value: undefined }
  })
  on('ui.toast', (_$, e) => {
    w.toasts.push(e.text)
    return { value: undefined }
  })
  on('ui.open', (_$, e) => {
    w.opened.push(e.id)
    return { value: { isPlaced: true } }
  })
  on('ui.close', () => ({ value: undefined }))
  on('session.model', () => ({ value: 'claude-opus-5-5[1m]' }))
  on('session.usage', () => ({
    value: {
      startedAt: NOW,
      context: { window: 1_000_000, percent: 42 },
      rateLimits: [
        { kind: 'five_hour', percentUsed: 31 },
        { kind: 'seven_day', percentUsed: 12 },
      ],
      cost: { usd: 1.84 },
    },
  }))
  const answer = (prompt: string) => {
    w.prompts.push(prompt)
    const text = w.replies.shift() ?? '[]'
    return { value: { isAnswered: true as const, text, usage: { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } } }
  }
  on('model.complete', (_$, e) => answer(e.prompt))
  on('model.fork', (_$, e) => answer(e.prompt))
  on('turn.start', (_$, e) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  return w
}

export const BAND_PROPS: RenderPropsOf['AbovePrompt'] = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 20,
  bodyColumns: 110,
  scroll: { offset: 0, bodyRows: 20 },
  view: {},
}

export const BAND = { plugin: 'clawd-sidekick', component: 'AbovePrompt', props: BAND_PROPS } as const

export const SURFACES = ['terminal', 'desktop'] as const
