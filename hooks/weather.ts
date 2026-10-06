// What the sky is doing: the season and holiday from the person's local date
// (no network), and, only once they name a city, the real weather from
// Open-Meteo (free, no key; the city's coordinates are all it is sent).
// Any city on Earth, named in any script: Open-Meteo's geocoder first, then
// OpenStreetMap's Nominatim for the names it does not know. South of the
// equator the seasons turn over; in the US and a few other places the
// temperature is in Fahrenheit.

import type { Holiday, Season, Weather } from '../types'

export type { Holiday, Season, Weather }

const DAY = 86_400_000

/** The person's local calendar date. */
function localDate(now: number, offset: number): { y: number; m: number; d: number } {
  const local = new Date(now + offset * 60_000)
  return { y: local.getUTCFullYear(), m: local.getUTCMonth() + 1, d: local.getUTCDate() }
}

/** Meteorological seasons, flipped south of the equator. */
export function seasonOf(now: number, offset: number, latitude: number | null = null): Season {
  const { m } = localDate(now, offset)
  const north: Season = m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter'
  if (latitude === null || latitude >= 0) return north
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

/** A WMO weather code, as Open-Meteo reports it, in the house's words. */
export function weatherOfCode(code: number): Weather {
  if (code <= 1) return 'clear'
  if (code <= 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'storm'
  if (code >= 51) return 'rain'
  return 'cloudy'
}

export type Place = { name: string; latitude: number; longitude: number; country: string }

/** "25.03,121.56" names a place by itself. */
export function placeOfCoordinates(text: string): Place | undefined {
  const m = text.trim().match(/^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/)
  if (m === null) return undefined
  const latitude = Number(m[1])
  const longitude = Number(m[2])
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return undefined
  return { name: `${latitude.toFixed(2)},${longitude.toFixed(2)}`, latitude, longitude, country: '' }
}

/** Open-Meteo's geocoder: quick, but it knows place names in Latin letters only. */
export function openMeteoPlaceUrl(city: string): string {
  return `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&format=json`
}

export function parseOpenMeteoPlace(text: string): Place | undefined {
  try {
    const first = (JSON.parse(text) as { results?: { name?: string; latitude?: number; longitude?: number; country_code?: string }[] }).results?.[0]
    if (first === undefined || typeof first.latitude !== 'number' || typeof first.longitude !== 'number') return undefined
    return { name: first.name ?? '', latitude: first.latitude, longitude: first.longitude, country: (first.country_code ?? '').toUpperCase() }
  } catch {
    return undefined
  }
}

/** OpenStreetMap's Nominatim: any city in any script (台北, 東京, Москва, القاهرة); one lookup when a city is set. */
export function nominatimPlaceUrl(city: string): string {
  return `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city.trim())}&format=jsonv2&limit=1&addressdetails=1`
}

/** Nominatim's usage policy asks every client to name itself. */
export const NOMINATIM_HEADERS: Readonly<Record<string, string>> = {
  'User-Agent': 'clawd-sidekick (+https://github.com/Tunai-0511/clawd-sidekick)',
}

export function parseNominatimPlace(text: string): Place | undefined {
  try {
    const first = (JSON.parse(text) as { name?: string; lat?: string; lon?: string; address?: { country_code?: string } }[])[0]
    if (first === undefined) return undefined
    const latitude = Number(first.lat)
    const longitude = Number(first.lon)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined
    return { name: first.name ?? '', latitude, longitude, country: (first.address?.country_code ?? '').toUpperCase() }
  } catch {
    return undefined
  }
}

/** Where people read temperatures in Fahrenheit. */
const FAHRENHEIT = new Set(['US', 'PR', 'GU', 'VI', 'AS', 'MP', 'LR', 'MM', 'BS', 'KY', 'PW', 'FM', 'MH', 'BZ'])

export const usesFahrenheit = (country: string): boolean => FAHRENHEIT.has(country)

export function forecastUrl(place: Place): string {
  const unit = usesFahrenheit(place.country) ? '&temperature_unit=fahrenheit' : ''
  return `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude.toFixed(3)}&longitude=${place.longitude.toFixed(3)}&current=weather_code,temperature_2m${unit}`
}

export function parseForecast(text: string): { weather: Weather; temperature: number } | undefined {
  try {
    const current = (JSON.parse(text) as { current?: { weather_code?: number; temperature_2m?: number } }).current
    if (current === undefined || typeof current.weather_code !== 'number') return undefined
    return { weather: weatherOfCode(current.weather_code), temperature: Math.round(current.temperature_2m ?? 0) }
  } catch {
    return undefined
  }
}

/** Words that set the weather by hand instead of naming a city. */
export const WEATHER_WORDS: Readonly<Record<string, Weather>> = {
  clear: 'clear',
  sunny: 'clear',
  晴: 'clear',
  晴天: 'clear',
  cloudy: 'cloudy',
  多雲: 'cloudy',
  陰天: 'cloudy',
  rain: 'rain',
  rainy: 'rain',
  雨: 'rain',
  下雨: 'rain',
  storm: 'storm',
  thunder: 'storm',
  雷雨: 'storm',
  snow: 'snow',
  雪: 'snow',
  下雪: 'snow',
  fog: 'fog',
  霧: 'fog',
  起霧: 'fog',
}
