// What sits beneath the plugin in a test: a clock, a store it can look into, the host calls
// it makes, and a model that answers from a list.

import type { On, RenderPropsOf } from 'claude-code'
import { mock, type MockClock } from 'claude-code/testing'

export const NOW = Date.UTC(2026, 9, 6, 8, 0)

export type World = {
  clock: MockClock
  toasts: string[]
  opened: string[]
  prompts: string[]
  replies: string[]
  /** The project folder session.root answers; a test changes it to open another project. */
  root: string
  /** What the plugin keeps across sessions, as it keeps it. */
  store: Map<string, unknown>
}

export type Extra = { zone?: string; now?: number; git?: { status: string; lastCommit: number } }

export function world(on: On, replies: string[] = [], stored: Readonly<Record<string, unknown>> = {}, system = 'zh-Hant-TW', extra: Extra = {}): World {
  const w: World = { clock: mock.clock(on, { now: extra.now ?? NOW }), toasts: [], opened: [], prompts: [], replies, root: '/Users/me/projects/my-app', store: new Map() }
  // A store in memory the test can look into, each value copied the way a file would.
  const copy = (value: unknown): unknown => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)))
  for (const [key, value] of Object.entries(stored)) w.store.set(key, copy(value))
  on('store.get', (_$, e) => ({ value: copy(w.store.get(e.key)) }))
  on('store.set', (_$, e) => {
    w.store.set(e.key, copy(e.value))
    return { value: undefined }
  })
  on('store.delete', (_$, e) => {
    w.store.delete(e.key)
    return { value: undefined }
  })
  on('store.keys', () => ({ value: [...w.store.keys()] }))
  mock.env(on, { HOME: '/tmp/clawd-test' })
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('session.root', () => ({ value: w.root }))
  on('session.id', () => ({ value: 'this-session' }))
  on('process.run', (_$, e) => {
    const zone = extra.zone === undefined ? '' : `/var/db/timezone/zoneinfo/${extra.zone}\n`
    const git = e.argv[0] === 'git' && extra.git !== undefined ? (e.argv[1] === 'status' ? extra.git.status : `${extra.git.lastCommit}\n`) : ''
    const stdout = git !== '' ? git : e.argv[0] === '/bin/date' ? '+0800\n' : e.argv[0] === '/usr/bin/defaults' ? `(\n    "${system}"\n)\n` : e.argv[0] === 'readlink' ? zone : ''
    return { value: { exitCode: stdout === '' ? 1 : 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
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
