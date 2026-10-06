// What a finished command means for Clawd: a test run that passed or failed,
// a commit, a push, a pull request opened or merged. Claude Code classifies
// git and gh itself (Bash's `gitOperation`); test runs are recognized by the
// command. Nothing here draws: it names the pose and the line.

import type { Pose } from '../types'
import { say, type Lang } from './i18n'

/** The part of Bash's result that names git and gh operations. */
export type GitOperation = {
  commit?: { sha: string }
  push?: { branch: string }
  pr?: { number: number; action: string }
}

export type Moment = { pose: Pose; label: string; ms: number }

/** The usual ways to run a test suite, in most languages' tooling. */
const TEST_RUN =
  /(^|[\s;&|(])((npm|pnpm|yarn|bun)( run)? test\b|npx (vitest|jest|mocha|playwright test)\b|(vitest|jest|pytest|mocha|rspec|phpunit|ctest|tox|nox)\b|go test\b|cargo (test|nextest)\b|(mvn|gradle|\.\/gradlew)\b[^|;&]*\btest\b|dotnet test\b|mix test\b|deno test\b|swift test\b|make (test|check)\b|python3? -m (pytest|unittest)\b|claude plugin test\b)/

export const isTestRun = (command: string): boolean => TEST_RUN.test(command)

/** The moment a Bash command makes, if it makes one: what Claude Code says it did first, then the test run. */
export function momentOf(command: string, isFailed: boolean, git: GitOperation | undefined, lang: Lang): Moment | undefined {
  const words = say(lang)
  if (!isFailed && git !== undefined) {
    if (git.pr?.action === 'merged') return { pose: 'cheer', label: words.prMerged(git.pr.number), ms: 4000 }
    if (git.pr?.action === 'created') return { pose: 'mail', label: words.prOpened(git.pr.number), ms: 3500 }
    if (git.push !== undefined) return { pose: 'mail', label: words.pushed(git.push.branch), ms: 3500 }
    if (git.commit !== undefined) return { pose: 'stamp', label: words.committed(git.commit.sha.slice(0, 7)), ms: 3000 }
  }
  if (isTestRun(command)) return isFailed ? { pose: 'oops', label: words.testsFailed, ms: 3500 } : { pose: 'cheer', label: words.testsPassed, ms: 3500 }
  return undefined
}
