// The git safety net: the project's branch, how far it is from its
// upstream, and what hasn't been committed, read from `git status` on this
// machine. Nothing here runs git; register.tsx does, and hands the text in.

import type { GitState } from '../types'

export type { GitState }

/** `git status --porcelain=v1 -b`, read: the branch line, then a line a file. */
export function parseStatus(text: string): Omit<GitState, 'lastCommitAt'> | undefined {
  const lines = text.split('\n').filter(line => line !== '')
  const head = lines[0]
  if (head === undefined || !head.startsWith('## ')) return undefined
  const info = head.slice(3)
  let branch = info.split('...')[0]?.split(' ')[0] ?? ''
  const fresh = info.match(/^No commits yet on (\S+)/)
  if (fresh !== null) branch = fresh[1] ?? branch
  if (info.startsWith('HEAD (no branch)')) branch = 'HEAD'
  const ahead = Number(info.match(/ahead (\d+)/)?.[1] ?? 0)
  const behind = Number(info.match(/behind (\d+)/)?.[1] ?? 0)
  const files = lines.slice(1)
  const untracked = files.filter(line => line.startsWith('??')).length
  return { branch, ahead, behind, changed: files.length - untracked, untracked }
}

export const isDirty = (git: GitState): boolean => git.changed + git.untracked > 0

/** An hour's work not committed: since the tree got dirty, or since the last commit, whichever is later. */
export const COMMIT_AFTER = 60 * 60_000

export function needsCommit(git: GitState, dirtySince: number, now: number): boolean {
  if (!isDirty(git) || dirtySince === 0) return false
  return now - Math.max(dirtySince, git.lastCommitAt) >= COMMIT_AFTER
}

/** How worried the band's git figure looks: fine, a while uncommitted, or long or large. */
export function gitColor(git: GitState, dirtySince: number, now: number): string | undefined {
  if (!isDirty(git) || dirtySince === 0) return undefined
  const age = now - Math.max(dirtySince, git.lastCommitAt)
  if (age >= 2 * COMMIT_AFTER || git.changed + git.untracked >= 20) return '#E5484D'
  if (age >= COMMIT_AFTER / 2) return '#F5C542'
  return undefined
}
