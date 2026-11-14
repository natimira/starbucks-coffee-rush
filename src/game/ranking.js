import { useSyncExternalStore } from 'react'
import { readStorage, writeStorage } from './storage.js'

// Ranking local: un puntaje (el mejor) por persona, guardado solo en este navegador.
const KEY = 'habbo-coffee-ranking-v1'
export const RANKING_SIZE = 10

function sorted(list) {
  return [...list].sort((a, b) => b.score - a.score).slice(0, RANKING_SIZE)
}
export function sanitizeRanking(value) {
  if (!Array.isArray(value)) return []
  return sorted(value
    .filter(item => item && typeof item.email === 'string' && typeof item.name === 'string' && Number.isFinite(item.score) && item.score > 0)
    .map(item => ({ email: item.email.toLowerCase(), name: item.name.slice(0, 20), score: Math.floor(item.score), date: typeof item.date === 'string' ? item.date : '' })))
}
// Devuelve la misma lista si nada cambia, para que los componentes no se redibujen de más.
export function addScore(list, entry) {
  const email = String(entry.email ?? '').toLowerCase()
  const score = Math.floor(Number(entry.score))
  if (!email || !Number.isFinite(score) || score <= 0) return list
  const record = { email, name: String(entry.name ?? '').slice(0, 20), score, date: entry.date ?? '' }
  const current = list.find(item => item.email === email)
  if (current && current.score >= score) return list
  return sorted([...list.filter(item => item.email !== email), record])
}
export function positionOf(list, email) {
  const index = list.findIndex(item => item.email === String(email ?? '').toLowerCase())
  return index < 0 ? null : index + 1
}

let current = null
const listeners = new Set()
export function getRanking() {
  if (current === null) current = sanitizeRanking(readStorage(KEY, []))
  return current
}
function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) }
export function recordScore(entry) {
  const next = addScore(getRanking(), entry)
  if (next === current) return
  current = next
  writeStorage(KEY, next)
  listeners.forEach(listener => listener())
}
export const useRanking = () => useSyncExternalStore(subscribe, getRanking)
