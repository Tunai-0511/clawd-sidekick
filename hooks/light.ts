// Light, room by room: which stretch of the scene each room takes, what its
// switch turns off, and how dim it is by the hour and by that switch. The
// Desktop scene draws it as light and shadow; the terminal tints its cells.

import type { RoomId } from '../types'
import { ROOMS, SW, type TimeOfDay } from './scene'
import type { Glow, ThemeArt } from './themes'

/** Each room's stretch of the scene, the wall between two shared halfway. */
export function roomSpans(): { id: RoomId; x0: number; x1: number }[] {
  return ROOMS.map((room, i) => {
    const before = ROOMS[i - 1]
    const after = ROOMS[i + 1]
    return {
      id: room.id,
      x0: before === undefined ? 0 : (before.x + before.w + room.x) / 2,
      x1: after === undefined ? SW : (room.x + room.w + after.x) / 2,
    }
  })
}

/** What a room's switch turns off: its screens, lamps and racks. A window or a fire it leaves be. */
export const isSwitched = (glow: Glow): boolean => glow.kind === 'screen' || glow.kind === 'lamp' || glow.kind === 'leds'

/** How dim a room is: indoors by its switch and the hour, outdoors by the hour alone. */
export function shadeOf(art: ThemeArt, time: TimeOfDay, isDark: boolean): number {
  // Indoors, or out in space where no sun reaches: the switch decides.
  if (art.isIndoor || !art.hasDaylight) {
    if (isDark) return !art.hasDaylight || time === 'night' ? 0.66 : time === 'dusk' ? 0.52 : 0.36
    return time === 'night' ? 0.2 : time === 'dusk' ? 0.08 : 0
  }
  return time === 'night' ? 0.32 : time === 'dusk' ? 0.1 : 0
}

/** The colour a room fades toward as it dims. */
export const NIGHT = '#060914'

/** `hex` dimmed by `shade` (0 to 1) toward NIGHT. */
export function tint(hex: string, shade: number): string {
  if (shade <= 0) return hex
  const mix = (i: number): number => {
    const from = parseInt(hex.slice(i, i + 2), 16)
    const to = parseInt(NIGHT.slice(i, i + 2), 16)
    return Math.round(from + (to - from) * shade)
  }
  return `#${[1, 3, 5].map(i => mix(i).toString(16).padStart(2, '0')).join('')}`
}
