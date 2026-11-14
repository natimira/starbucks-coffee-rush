// Las reglas viven acá: cambiar el balance no requiere modificar las pantallas.
export const LEVELS = [
  { number: 1, duration: 120_000, orders: 5, drinkCounts: [1, 2], expressOrders: 2, title: 'Tu primer turno' },
  { number: 2, duration: 90_000, orders: 5, drinkCounts: [1, 2, 3], expressOrders: 2, title: 'La hora pico' },
  { number: 3, duration: 60_000, orders: 5, drinkCounts: [1, 2, 3], expressOrders: 3, title: 'Camarero experto' },
]
export const INGREDIENTS = [
  { id: 'espresso', label: 'Espresso', asset: '7a422.svg', color: '#774b32' },
  { id: 'milk', label: 'Leche', asset: '1a1f5.svg', color: '#fffcf3' },
  { id: 'caramel', label: 'Caramelo', asset: '29ac5.svg', color: '#f4c64e' },
  { id: 'ice', label: 'Hielo', asset: '6724d.svg', color: '#92b8af' },
  { id: 'strawberry', label: 'Frutilla', asset: 'e3bd6.svg', color: '#ef735a' },
  { id: 'chocolate', label: 'Chocolate', asset: '8e371.svg', color: '#774b32' },
]
export const RECIPES = [
  { id: 'caramel-latte', name: 'Caramel Latte', asset: 'cce88.svg', doses: { espresso: 1, milk: 2, caramel: 2 } },
  { id: 'iced-latte', name: 'Iced Latte', asset: 'cce88.svg', doses: { espresso: 1, milk: 2, ice: 1 } },
  { id: 'mocha', name: 'Mocha', asset: '794e0.svg', doses: { espresso: 1, milk: 1, chocolate: 2 } },
  { id: 'strawberry-latte', name: 'Strawberry Latte', asset: 'cce88.svg', doses: { milk: 2, strawberry: 2, ice: 1 } },
]
export const HAIR = { 'Castaño': '#774b32', Negro: '#102b24', Rubio: '#f4c64e', Rojo: '#ef735a' }
export const APRONS = { Verde: '#00754a', Crema: '#f5eedc', Café: '#774b32' }
export const GENDERS = ['Mujer', 'Hombre', 'No binario', 'Prefiero no decirlo']
export const DEFAULT_PROFILE = { name: '', email: '', gender: 'Prefiero no decirlo', hair: 'Castaño', apron: 'Verde' }
export const RULES = {
  pourMs: 240,
  deliveryMs: 480,
  mistakePenaltyMs: 10_000,
  expressDrinkMs: 5_000,
  expressFailurePenaltyMs: 10_000,
  expressFailurePoints: 100,
  happyHourMs: 20_000,
}

function makeRandom(seed) {
  let value = (Number(seed) >>> 0) || 0x6d2b79f5
  return () => {
    value += 0x6d2b79f5
    let result = value
    result = Math.imul(result ^ result >>> 15, result | 1)
    result ^= result + Math.imul(result ^ result >>> 7, result | 61)
    return ((result ^ result >>> 14) >>> 0) / 4294967296
  }
}

function shuffle(items, random) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

function recipeSequence(count, random) {
  const recipes = []
  let previous = null
  for (let index = 0; index < count; index += 1) {
    const available = RECIPES.filter(recipe => recipe.id !== previous)
    const recipe = available[Math.floor(random() * available.length)]
    recipes.push(recipe)
    previous = recipe.id
  }
  return recipes
}

function drinkCountSequence(level, random, count = level.orders) {
  const counts = [...level.drinkCounts]
  while (counts.length < count) counts.push(level.drinkCounts[Math.floor(random() * level.drinkCounts.length)])
  return shuffle(counts.slice(0, count), random)
}

function happyHourEvent(level, random) {
  const earliest = 15_000
  const latest = Math.max(earliest, level.duration - RULES.happyHourMs - 5_000)
  return { startAt: earliest + Math.floor(random() * (latest - earliest + 1)), duration: RULES.happyHourMs }
}

// El plan se sortea al entrar al nivel y se conserva al reintentar.
export function createLevelPlan(levelIndex, seed = 1) {
  const level = LEVELS[levelIndex]
  const reserveOrders = Math.ceil(level.duration / (RULES.expressDrinkMs + RULES.expressFailurePenaltyMs))
  const plannedOrders = level.orders + reserveOrders
  const random = makeRandom((Number(seed) || 1) + levelIndex * 101)
  const events = { happyHour: null, rushOrderIndices: [] }
  if (levelIndex === 0) {
    events.happyHour = happyHourEvent(level, random)
  } else if (levelIndex === 1) {
    if (random() < 0.5) events.happyHour = happyHourEvent(level, random)
    else {
      const start = 1 + Math.floor(random() * 3)
      events.rushOrderIndices = [start, start + 1]
    }
  } else {
    events.happyHour = happyHourEvent(level, random)
    const start = 1 + Math.floor(random() * 3)
    events.rushOrderIndices = [start, start + 1]
  }

  const forcedExpress = new Set(events.rushOrderIndices)
  const remainingIndices = shuffle(Array.from({ length: level.orders }, (_, index) => index)
    .filter(index => !forcedExpress.has(index)), random)
  const expressIndices = new Set(forcedExpress)
  for (const index of remainingIndices) {
    if (expressIndices.size >= level.expressOrders) break
    expressIndices.add(index)
  }
  for (let index = level.orders; index < plannedOrders; index += 1) {
    if (random() < level.expressOrders / level.orders) expressIndices.add(index)
  }

  const drinkCounts = [
    ...drinkCountSequence(level, random, level.orders),
    ...drinkCountSequence(level, random, reserveOrders),
  ]
  const recipes = recipeSequence(drinkCounts.reduce((total, count) => total + count, 0), random)
  let recipeIndex = 0
  const orders = Array.from({ length: plannedOrders }, (_, index) => ({
    id: `${level.number}-${index + 1}`,
    type: expressIndices.has(index) ? 'express' : 'classic',
    rush: forcedExpress.has(index),
    drinks: Array.from({ length: drinkCounts[index] }, () => recipes[recipeIndex++]),
  }))
  return { seed, orders, events }
}
export function validateProfile(profile) {
  const errors = {}
  const name = String(profile.name ?? '').trim()
  const email = String(profile.email ?? '').trim()
  if ([...name].length < 2 || [...name].length > 20) errors.name = 'Usá entre 2 y 20 caracteres.'
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Ingresá un mail válido, como nombre@dominio.com.'
  return errors
}
export function sanitizeProfile(profile) {
  return { name: String(profile.name).trim(), email: String(profile.email).trim(),
    gender: GENDERS.includes(profile.gender) ? profile.gender : DEFAULT_PROFILE.gender,
    hair: Object.hasOwn(HAIR, profile.hair) ? profile.hair : 'Castaño',
    apron: Object.hasOwn(APRONS, profile.apron) ? profile.apron : 'Verde' }
}
