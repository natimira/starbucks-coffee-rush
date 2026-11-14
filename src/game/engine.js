import { LEVELS, RULES, INGREDIENTS, createLevelPlan, validateProfile, sanitizeProfile } from './data.js'
import { achievementProgressFromState, getUnlockedAchievementIds } from './achievements.js'

export const initialState = {
  screen: 'home', countdown: null, bestScore: 0, profile: null, levelIndex: 0,
  orderIndex: 0, drinkIndex: 0, orders: [], events: { happyHour: null, rushOrderIndices: [] },
  runSeed: 0, levelSeed: 0, levelElapsed: 0, levelCompletedOrders: 0, failedOrders: 0,
  doses: {}, score: 0, streak: 0, bestStreak: 0, completedOrders: 0, completedDrinks: 0,
  remaining: 0, expressRemaining: null, paused: false, pausedAt: null,
  phase: 'idle', phaseUntil: null, ingredient: null, lastAt: 0,
  message: '', messageKind: 'info', outcome: null, checkpoint: null,
  fastestDrink: null, drinkStartedAt: 0, drinkHadMistake: false, returnScreen: null,
  careerOrders: 0, perfectOrderStreak: 0, bestPerfectOrderStreak: 0, orderPerfect: true,
  currentOrderStreak: 0, orderClean: true, level2Thirty: false, level3Thirty: false,
  expressOrders: 0, happyHourExpress: false, rushMastered: false, rushCompleted: [],
  eventSequence: 0, scoreEvent: null, rewardEvent: null,
}

export function currentOrder(state) { return state.orders[state.orderIndex] }
export function currentRecipe(state) { return currentOrder(state)?.drinks[state.drinkIndex] }
export function isHappyHourActive(state) {
  const event = state.events?.happyHour
  return Boolean(event && state.levelElapsed >= event.startAt && state.levelElapsed < event.startAt + event.duration)
}
export function recipeComplete(state) {
  const recipe = currentRecipe(state)
  return Boolean(recipe && Object.entries(recipe.doses).every(([key, count]) => state.doses[key] === count))
}

function achievementProgress(state) {
  return {
    fastestDrink: state.fastestDrink, careerOrders: state.careerOrders,
    bestPerfectOrderStreak: state.bestPerfectOrderStreak,
    level2Thirty: state.level2Thirty, level3Thirty: state.level3Thirty,
    currentOrderStreak: Number(state.currentOrderStreak) || 0,
    expressOrders: Number(state.expressOrders) || 0,
    happyHourExpress: state.happyHourExpress === true,
    rushMastered: state.rushMastered === true,
  }
}

function progressForCards(state, overrides = {}) {
  return {
    totalOrders: state.careerOrders, fastestDrink: state.fastestDrink,
    bestPerfectOrderStreak: state.bestPerfectOrderStreak,
    level2Thirty: state.level2Thirty, level3Thirty: state.level3Thirty,
    expressOrders: state.expressOrders, happyHourExpress: state.happyHourExpress,
    rushMastered: state.rushMastered, ...overrides,
  }
}

function startLevel(state, levelIndex, now, keepStreak = false, preservedPlan = null) {
  const runSeed = state.runSeed || Math.max(1, Math.floor(now))
  const levelSeed = preservedPlan?.seed ?? runSeed + levelIndex * 997
  const plan = preservedPlan ?? createLevelPlan(levelIndex, levelSeed)
  const checkpoint = {
    score: state.score, completedOrders: state.completedOrders, completedDrinks: state.completedDrinks,
    streak: state.streak, bestStreak: state.bestStreak, perfectOrderStreak: state.perfectOrderStreak,
    currentOrderStreak: Number(state.currentOrderStreak) || 0,
  }
  return {
    ...state, screen: 'briefing', countdown: null, levelIndex, orders: plan.orders, events: plan.events,
    runSeed, levelSeed, orderIndex: 0, drinkIndex: 0, levelElapsed: 0, levelCompletedOrders: 0,
    failedOrders: 0, rushCompleted: [], doses: {}, remaining: LEVELS[levelIndex].duration,
    expressRemaining: null, lastAt: now, phase: 'idle', phaseUntil: null, ingredient: null,
    paused: false, pausedAt: null, streak: keepStreak ? state.streak : 0, message: '',
    messageKind: 'info', outcome: null, checkpoint, drinkStartedAt: now, drinkHadMistake: false,
    returnScreen: null, perfectOrderStreak: keepStreak ? state.perfectOrderStreak : 0,
    currentOrderStreak: keepStreak ? Number(state.currentOrderStreak) || 0 : 0,
    orderPerfect: true, orderClean: true, scoreEvent: null, rewardEvent: null,
  }
}

function resolveLevel(state, levelCompletedOrders) {
  const completed = levelCompletedOrders >= LEVELS[state.levelIndex].orders
  if (!completed) return { screen: 'game', outcome: null, level2Thirty: state.level2Thirty, level3Thirty: state.level3Thirty }
  const level2Thirty = state.level2Thirty || (state.levelIndex === 1 && state.remaining >= 20_000)
  const level3Thirty = state.level3Thirty || (state.levelIndex === 2 && state.remaining >= 20_000)
  return {
    screen: state.levelIndex === LEVELS.length - 1 ? 'results' : 'levelComplete',
    outcome: state.levelIndex === LEVELS.length - 1 ? 'won' : null,
    level2Thirty, level3Thirty,
  }
}

function nextExpressTime(state, nextOrderIndex, nextDrinkIndex) {
  return state.orders[nextOrderIndex]?.type === 'express' && state.orders[nextOrderIndex]?.drinks[nextDrinkIndex]
    ? RULES.expressDrinkMs : null
}

function finishDrink(state) {
  const order = currentOrder(state)
  const streak = state.streak + 1
  const drinkTime = Math.max(0, state.lastAt - state.drinkStartedAt)
  const comboMultiplier = Math.min(5, 1 + Math.floor(streak / 3))
  const happyHour = isHappyHourActive(state)
  const orderMultiplier = order.type === 'express' ? 2 : 1
  const eventMultiplier = happyHour ? 2 : 1
  const points = 100 * comboMultiplier * orderMultiplier * eventMultiplier
  const lastDrink = state.drinkIndex + 1 === order.drinks.length
  const levelCompletedOrders = state.levelCompletedOrders + (lastDrink ? 1 : 0)
  const resolution = lastDrink ? resolveLevel(state, levelCompletedOrders) : {
    screen: 'game', outcome: null, level2Thirty: state.level2Thirty, level3Thirty: state.level3Thirty,
  }
  const orderPerfect = state.orderPerfect && !state.drinkHadMistake && drinkTime <= 6000
  const perfectOrderStreak = lastDrink ? (orderPerfect ? state.perfectOrderStreak + 1 : 0) : state.perfectOrderStreak
  const orderClean = state.orderClean && !state.drinkHadMistake
  const cleanStreak = Number(state.currentOrderStreak) || 0
  const currentOrderStreak = lastDrink ? (orderClean ? cleanStreak + 1 : 0) : cleanStreak
  const careerOrders = state.careerOrders + (lastDrink ? 1 : 0)
  const bestPerfectOrderStreak = Math.max(state.bestPerfectOrderStreak, perfectOrderStreak)
  const fastestDrink = state.drinkHadMistake ? state.fastestDrink : Math.min(state.fastestDrink ?? Infinity, drinkTime)
  const expressOrders = state.expressOrders + (lastDrink && order.type === 'express' ? 1 : 0)
  const happyHourExpress = state.happyHourExpress || (lastDrink && order.type === 'express' && happyHour)
  const rushCompleted = lastDrink && order.rush && !state.rushCompleted.includes(state.orderIndex)
    ? [...state.rushCompleted, state.orderIndex] : state.rushCompleted
  const rushMastered = state.rushMastered || (state.events.rushOrderIndices.length === 2
    && state.events.rushOrderIndices.every(index => rushCompleted.includes(index)))
  const unlockedBefore = new Set(getUnlockedAchievementIds(achievementProgressFromState(state)))
  const unlockedNow = getUnlockedAchievementIds(progressForCards(state, {
    totalOrders: careerOrders, fastestDrink, bestPerfectOrderStreak,
    level2Thirty: resolution.level2Thirty, level3Thirty: resolution.level3Thirty,
    expressOrders, happyHourExpress, rushMastered,
  })).filter(id => !unlockedBefore.has(id))
  const eventSequence = state.eventSequence + 1
  const nextOrderIndex = state.orderIndex + (lastDrink ? 1 : 0)
  const nextDrinkIndex = lastDrink ? 0 : state.drinkIndex + 1
  const bonusLabel = `${order.type === 'express' ? ' EXPRESS' : ''}${happyHour ? ' · HORA FELIZ' : ''}`
  const score = state.score + points
  return {
    ...state, score, bestScore: Math.max(state.bestScore, score), streak,
    bestStreak: Math.max(state.bestStreak, streak), completedDrinks: state.completedDrinks + 1,
    completedOrders: state.completedOrders + (lastDrink ? 1 : 0), levelCompletedOrders,
    orderIndex: nextOrderIndex, drinkIndex: nextDrinkIndex, doses: {}, phase: 'idle',
    phaseUntil: null, ingredient: null,
    message: lastDrink ? `¡Pedido${bonusLabel} completo! +${points}` : `¡Bebida${bonusLabel} lista! +${points}`,
    messageKind: 'success', screen: resolution.screen, outcome: resolution.outcome,
    fastestDrink, drinkStartedAt: state.lastAt, drinkHadMistake: false,
    careerOrders, perfectOrderStreak, bestPerfectOrderStreak, currentOrderStreak,
    orderPerfect: lastDrink ? true : orderPerfect, orderClean: lastDrink ? true : orderClean,
    level2Thirty: resolution.level2Thirty, level3Thirty: resolution.level3Thirty,
    expressOrders, happyHourExpress, rushCompleted, rushMastered,
    expressRemaining: nextExpressTime(state, nextOrderIndex, nextDrinkIndex), eventSequence,
    scoreEvent: { id: eventSequence, label: `+${points}`, kind: 'positive' },
    rewardEvent: unlockedNow.length ? { id: eventSequence, cards: unlockedNow } : state.rewardEvent,
  }
}

function cancelExpressOrder(state) {
  const eventSequence = state.eventSequence + 1
  const remaining = Math.max(0, state.remaining - RULES.expressFailurePenaltyMs)
  const score = Math.max(0, state.score - RULES.expressFailurePoints)
  const resolution = remaining === 0
    ? { screen: 'results', outcome: 'timeout', level2Thirty: state.level2Thirty, level3Thirty: state.level3Thirty }
    : resolveLevel(state, state.levelCompletedOrders)
  const nextOrderIndex = state.orderIndex + 1
  return {
    ...state, score, remaining, streak: 0, perfectOrderStreak: 0, currentOrderStreak: 0,
    orderIndex: nextOrderIndex, drinkIndex: 0, failedOrders: state.failedOrders + 1,
    doses: {}, phase: 'idle', phaseUntil: null, ingredient: null, screen: resolution.screen,
    outcome: resolution.outcome, level2Thirty: resolution.level2Thirty, level3Thirty: resolution.level3Thirty,
    expressRemaining: nextExpressTime(state, nextOrderIndex, 0), drinkStartedAt: state.lastAt,
    drinkHadMistake: false, orderPerfect: true, orderClean: true,
    message: `Pedido express cancelado. −${RULES.expressFailurePoints} puntos y −${RULES.expressFailurePenaltyMs / 1000} segundos.`,
    messageKind: 'error', eventSequence,
    scoreEvent: { id: eventSequence, label: `−${RULES.expressFailurePoints} · −${RULES.expressFailurePenaltyMs / 1000} S`, kind: 'negative' },
  }
}

// El tiempo se calcula por diferencia real para que un clic tardío nunca gane al reloj.
function advance(state, now) {
  if (state.screen !== 'game' || state.paused) return state
  const elapsed = Math.max(0, now - state.lastAt)
  const order = currentOrder(state)
  const wasExpress = order?.type === 'express' && state.expressRemaining !== null
  const generalDeadline = state.lastAt + state.remaining
  const expressDeadline = wasExpress ? state.lastAt + state.expressRemaining : Infinity
  const deliveryInTime = state.phase === 'delivering' && state.phaseUntil <= generalDeadline && state.phaseUntil <= expressDeadline
  let next = {
    ...state,
    remaining: Math.max(0, state.remaining - elapsed),
    expressRemaining: wasExpress ? Math.max(0, state.expressRemaining - elapsed) : null,
    levelElapsed: state.levelElapsed + elapsed,
    lastAt: now,
  }
  if (deliveryInTime && now >= state.phaseUntil) next = finishDrink(next)
  else if (next.remaining === 0) return { ...next, screen: 'results', outcome: 'timeout', phase: 'idle', phaseUntil: null }
  else if (wasExpress && next.expressRemaining === 0) return cancelExpressOrder(next)
  else if (next.phaseUntil !== null && now >= next.phaseUntil) next = { ...next, phase: 'idle', phaseUntil: null, ingredient: null }
  if (next.remaining === 0 && next.screen === 'game') return { ...next, screen: 'results', outcome: 'timeout', phase: 'idle', phaseUntil: null }
  return next
}

function restoredProgress(state, progress = {}) {
  return {
    fastestDrink: progress.fastestDrink ?? state.fastestDrink,
    careerOrders: progress.totalOrders ?? state.careerOrders,
    bestPerfectOrderStreak: progress.bestPerfectOrderStreak ?? state.bestPerfectOrderStreak,
    level2Thirty: progress.level2Thirty ?? state.level2Thirty,
    level3Thirty: progress.level3Thirty ?? state.level3Thirty,
    currentOrderStreak: progress.currentOrderStreak ?? state.currentOrderStreak,
    expressOrders: progress.expressOrders ?? state.expressOrders,
    happyHourExpress: progress.happyHourExpress ?? state.happyHourExpress,
    rushMastered: progress.rushMastered ?? state.rushMastered,
  }
}

export function gameReducer(state, action) {
  const now = Number.isFinite(action.now) ? Math.max(action.now, state.lastAt) : state.lastAt
  let next = advance(state, now)
  switch (action.type) {
    case 'NAVIGATE':
      if (!['home', 'how', 'profile'].includes(action.screen)) return next
      return { ...initialState, ...achievementProgress(state), bestScore: state.bestScore, profile: state.profile, screen: action.screen }
    case 'LEAVE_SHIFT':
      if (!state.profile || !['game', 'briefing', 'levelComplete', 'results'].includes(state.screen)) return next
      return { ...initialState, ...achievementProgress(state), bestScore: state.bestScore, profile: state.profile, screen: 'account' }
    case 'LOGOUT':
      return { ...initialState, bestScore: state.bestScore, screen: 'home' }
    case 'GO_ACCOUNT':
      if (!state.profile || !['home', 'how', 'results'].includes(state.screen)) return next
      return { ...initialState, ...achievementProgress(state), bestScore: state.bestScore, profile: state.profile, screen: 'account' }
    case 'START':
      if (state.screen !== 'profile' || Object.keys(validateProfile(action.profile ?? {})).length) return next
      return startLevel({ ...initialState, ...achievementProgress(state), bestScore: state.bestScore, profile: sanitizeProfile(action.profile) }, 0, now)
    case 'AUTH_START':
      if (!['home', 'how'].includes(state.screen) || Object.keys(validateProfile(action.profile ?? {})).length) return next
      return startLevel({ ...initialState, ...achievementProgress(state), bestScore: state.bestScore, profile: sanitizeProfile(action.profile) }, 0, now)
    case 'ACCOUNT_LOGIN':
      if (!['home', 'how'].includes(state.screen) || Object.keys(validateProfile(action.profile ?? {})).length) return next
      return { ...initialState, bestScore: state.bestScore, profile: sanitizeProfile(action.profile), screen: 'account',
        ...restoredProgress(initialState, action.progress) }
    case 'PROFILE_READY':
      if (state.screen !== 'profile' || Object.keys(validateProfile(action.profile ?? {})).length) return next
      return { ...initialState, ...achievementProgress(state), bestScore: state.bestScore, profile: sanitizeProfile(action.profile), screen: 'account' }
    case 'START_ACCOUNT':
      return state.screen === 'account' && state.profile
        ? startLevel({ ...initialState, bestScore: state.bestScore, profile: state.profile, ...restoredProgress(state, action.progress) }, 0, now)
        : next
    case 'START_COUNTDOWN':
      return state.screen === 'briefing' ? { ...state, screen: 'countdown', countdown: 3, lastAt: now } : next
    case 'COUNTDOWN_TICK':
      if (state.screen !== 'countdown') return next
      if (state.countdown > 0) return { ...state, countdown: state.countdown - 1, lastAt: now }
      return { ...state, screen: 'game', countdown: null, lastAt: now, drinkStartedAt: now,
        expressRemaining: currentOrder(state)?.type === 'express' ? RULES.expressDrinkMs : null }
    case 'OPEN_ACCOUNT': {
      if (!state.profile || !['game', 'levelComplete', 'briefing'].includes(state.screen)) return next
      const playing = state.screen === 'game'
      return { ...next, screen: 'account', returnScreen: state.screen, paused: playing, pausedAt: playing ? now : null }
    }
    case 'CLOSE_ACCOUNT': {
      if (state.screen !== 'account' || !state.returnScreen) return next
      if (state.returnScreen !== 'game') return { ...state, screen: state.returnScreen, returnScreen: null }
      const pausedFor = Math.max(0, now - state.pausedAt)
      return { ...state, screen: 'game', returnScreen: null, paused: false, pausedAt: null, lastAt: now,
        phaseUntil: state.phaseUntil === null ? null : state.phaseUntil + pausedFor,
        drinkStartedAt: state.drinkStartedAt + pausedFor }
    }
    case 'UPDATE_PROFILE':
      return state.screen === 'account' && !Object.keys(validateProfile(action.profile ?? {})).length
        ? { ...state, profile: sanitizeProfile(action.profile) } : next
    case 'TICK': return next
    case 'ADD': {
      if (next.screen !== 'game' || next.paused || next.phase !== 'idle') return next
      if (!INGREDIENTS.some(item => item.id === action.ingredient)) return next
      const recipe = currentRecipe(next)
      const current = next.doses[action.ingredient] ?? 0
      if (current >= (recipe.doses[action.ingredient] ?? 0)) {
        const eventSequence = next.eventSequence + 1
        next = { ...next, remaining: Math.max(0, next.remaining - RULES.mistakePenaltyMs), streak: 0,
          message: `Esa dosis no va en esta receta. −${RULES.mistakePenaltyMs / 1000} segundos.`, messageKind: 'error',
          phase: 'mistake', phaseUntil: now + RULES.pourMs, drinkHadMistake: true, orderPerfect: false, orderClean: false,
          eventSequence, scoreEvent: { id: eventSequence, label: `−${RULES.mistakePenaltyMs / 1000} S`, kind: 'negative' } }
        if (next.remaining === 0) next = { ...next, screen: 'results', outcome: 'timeout', phase: 'idle' }
        return next
      }
      return { ...next, doses: { ...next.doses, [action.ingredient]: current + 1 }, phase: 'pouring',
        phaseUntil: now + RULES.pourMs, ingredient: action.ingredient, message: '', messageKind: 'info' }
    }
    case 'DELIVER':
      if (next.screen !== 'game' || next.paused || next.phase !== 'idle' || !recipeComplete(next)) return next
      return { ...next, phase: 'delivering', phaseUntil: now + RULES.deliveryMs, message: '' }
    case 'PAUSE':
      if (next.screen !== 'game' || next.paused) return next
      return { ...next, paused: true, pausedAt: now }
    case 'RESUME':
      if (state.screen !== 'game' || !state.paused) return state
      return { ...state, paused: false, pausedAt: null, lastAt: now,
        phaseUntil: state.phaseUntil === null ? null : state.phaseUntil + Math.max(0, now - state.pausedAt),
        drinkStartedAt: state.drinkStartedAt + Math.max(0, now - state.pausedAt) }
    case 'NEXT_LEVEL':
      return state.screen === 'levelComplete' && state.levelIndex < LEVELS.length - 1
        ? startLevel(state, state.levelIndex + 1, now, true) : next
    case 'RETRY': {
      if (state.screen !== 'results' || state.outcome !== 'timeout') return next
      const plan = { seed: state.levelSeed, orders: state.orders, events: state.events }
      return startLevel({ ...state, ...state.checkpoint }, state.levelIndex, now, true, plan)
    }
    case 'RESTART':
      return state.screen === 'results' ? startLevel({ ...initialState, bestScore: state.bestScore, profile: state.profile,
        ...achievementProgress(state), runSeed: Math.max(1, Math.floor(now) + 1) }, 0, now) : next
    default: return next
  }
}
