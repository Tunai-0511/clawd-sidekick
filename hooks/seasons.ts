// What the calendar brings: the season and holiday from the person's local
// date, with no network. South of the equator the seasons turn over; the
// system's time zone (Australia/Sydney, America/Sao_Paulo) says which side
// the person is on.

import type { Holiday, Season } from '../types'

export type { Holiday, Season }

const DAY = 86_400_000

/** The person's local calendar date. */
function localDate(now: number, offset: number): { y: number; m: number; d: number } {
  const local = new Date(now + offset * 60_000)
  return { y: local.getUTCFullYear(), m: local.getUTCMonth() + 1, d: local.getUTCDate() }
}

/** Meteorological seasons, flipped south of the equator. */
export function seasonOf(now: number, offset: number, zone = ''): Season {
  const { m } = localDate(now, offset)
  const north: Season = m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter'
  if (!isSouthern(zone)) return north
  return ({ spring: 'autumn', summer: 'winter', autumn: 'spring', winter: 'summer' } as const)[north]
}

/** Lunar New Year's Day, by year. */
const LUNAR_NEW_YEAR: Record<number, [number, number]> = {
  2025: [1, 29],
  2026: [2, 17],
  2027: [2, 6],
  2028: [1, 26],
  2029: [2, 13],
  2030: [2, 3],
  2031: [1, 23],
  2032: [2, 11],
  2033: [1, 31],
  2034: [2, 19],
  2035: [2, 8],
}

/** Lunar New Year from its eve to the seventh day; Halloween's last week; Christmas from the 18th to Boxing Day. */
export function holidayOf(now: number, offset: number): Holiday {
  const { y, m, d } = localDate(now, offset)
  const lunar = LUNAR_NEW_YEAR[y]
  if (lunar !== undefined) {
    const today = Date.UTC(y, m - 1, d)
    const newYear = Date.UTC(y, lunar[0] - 1, lunar[1])
    if (today >= newYear - DAY && today <= newYear + 7 * DAY) return 'lunarNewYear'
  }
  if (m === 10 && d >= 24) return 'halloween'
  if (m === 12 && d >= 18 && d <= 26) return 'christmas'
  return 'none'
}

/** The IANA zone a path or TZ value names: ".../zoneinfo/Asia/Taipei" → "Asia/Taipei". */
export function zoneOf(text: string): string | undefined {
  const value = text.trim()
  const zone = value.includes('zoneinfo/') ? value.slice(value.lastIndexOf('zoneinfo/') + 'zoneinfo/'.length) : value.replace(/^:/, '')
  return /^[A-Za-z]+\/[A-Za-z0-9_+\-/]+$/.test(zone) ? zone : undefined
}

/** The zones south of the equator, old names included. */
const SOUTH = new RegExp(
  [
    '^(Australia|Antarctica|Brazil|Chile)/',
    '^America/Argentina/',
    '^America/(Buenos_Aires|Cordoba|Mendoza|Catamarca|Jujuy|Rosario|Santiago|Punta_Arenas|Sao_Paulo|Montevideo|Asuncion|La_Paz|Lima|Bahia|Recife|Fortaleza|Maceio|Araguaina|Belem|Cuiaba|Campo_Grande|Porto_Velho|Rio_Branco|Eirunepe|Manaus|Noronha|Santarem|Guayaquil)$',
    '^Africa/(Johannesburg|Maputo|Harare|Lusaka|Windhoek|Gaborone|Maseru|Mbabane|Blantyre|Lubumbashi|Luanda|Dar_es_Salaam|Kinshasa|Brazzaville|Kigali|Bujumbura|Nairobi)$',
    '^Indian/(Antananarivo|Mauritius|Reunion|Mayotte|Comoro|Mahe|Chagos|Kerguelen|Cocos|Christmas)$',
    '^Asia/(Jakarta|Makassar|Jayapura|Dili)$',
    '^Pacific/(Auckland|Chatham|Fiji|Tongatapu|Apia|Noumea|Efate|Port_Moresby|Bougainville|Guadalcanal|Norfolk|Rarotonga|Tahiti|Marquesas|Gambier|Pitcairn|Easter|Niue|Pago_Pago|Wallis|Funafuti|Fakaofo|Nauru)$',
    '^Atlantic/(Stanley|South_Georgia|St_Helena)$',
  ].join('|'),
)

export const isSouthern = (zone: string): boolean => SOUTH.test(zone)
