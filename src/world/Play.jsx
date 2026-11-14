import { useMemo } from 'react'
import World from './World.jsx'
import { SoundButton, Btn } from './UI.jsx'
import { BackLayer, FrontLayer, Customer, Cup, Barista } from './Cafe.jsx'
import { PauseDialog } from '../components/UI.jsx'
import { INGREDIENTS, LEVELS } from '../game/data.js'
import { currentOrder, currentRecipe, isHappyHourActive, recipeComplete } from '../game/engine.js'
import { avatarSrc } from '../avatarSvg.js'
import { positionOf } from '../game/ranking.js'
import { CUP_X, JAR_X, CAFE_BANDS, MANAGER_PROFILE } from '../game/scene.js'

const formatTime = ms => `${Math.floor(Math.ceil(ms / 1000) / 60).toString().padStart(2, '0')}:${(Math.ceil(ms / 1000) % 60).toString().padStart(2, '0')}`
const formatLevelTime = ms => `${Math.floor(ms / 60000)}:${String((ms / 1000) % 60).padStart(2, '0')}`
const totalOrders = LEVELS.reduce((total, level) => total + level.orders, 0)

function Ticket({ state, order, level }) {
  const express = order.type === 'express'
  return <div className={`sb-ticket ${express ? 'express' : ''}`}>
    <div className="sb-ticket-head"><span>{express ? '⚡ EXPRESS ×2' : '☕ PEDIDO'}</span>{express && <strong className={state.expressRemaining <= 2500 ? 'urgent' : ''} aria-label="Tiempo del pedido express">{formatTime(state.expressRemaining ?? 0)}</strong>}<em>{state.levelCompletedOrders + 1}/{level.orders}</em></div>
    {order.drinks.map((drink, drinkIndex) => {
      const finished = drinkIndex < state.drinkIndex, active = drinkIndex === state.drinkIndex
      return <div key={drinkIndex} className={`sb-ticket-drink${finished ? ' finished' : ''}${active ? ' active' : ''}`}>
        <img src={`/assets/${drink.asset}`} alt="" />
        <div><b>{drink.name}</b>
          <div className="sb-doses">{Object.entries(drink.doses).map(([id, count]) => {
            const done = finished ? count : active ? state.doses[id] ?? 0 : 0
            const item = INGREDIENTS.find(i => i.id === id)
            return <span key={id} className={`sb-dose${done === count ? ' done' : ''}`} title={item.label}><img src={`/assets/${item.asset}`} alt="" /><i>{done}/{count}</i><span className="sr-only">{item.label}</span></span>
          })}</div>
        </div>
        {finished && <span className="sb-check" aria-label="Bebida completada">✓</span>}
      </div>
    })}
  </div>
}

function Briefing({ state, level, onReady }) {
  const manager = useMemo(() => avatarSrc(MANAGER_PROFILE), [])
  const expressCount = state.orders.slice(0, level.orders).filter(order => order.type === 'express').length
  const events = [state.events.happyHour && '★ Hora feliz ×2', state.events.rushOrderIndices.length > 0 && '⚡ Hora pico · 2 express'].filter(Boolean)
  return <div className="sb-overlay"><div className="sb-card-center briefing" role="dialog" aria-modal="true" aria-labelledby="briefing-title">
    <div className="sb-card-portrait"><img src={manager} alt="" /><span>GERENTE</span></div>
    <div className="sb-card-main">
      <span className="sb-kicker">INDICACIONES · TURNO {level.number}</span>
      <h2 id="briefing-title">{level.title.toUpperCase()}</h2>
      <p>“Preparate antes de abrir: el reloj arranca después de la cuenta regresiva.”</p>
      <div className="sb-chips"><div><span>TIEMPO</span><strong>{formatLevelTime(level.duration)}</strong></div><div><span>CLIENTES</span><strong>{level.orders}</strong></div><div><span>EXPRESS</span><strong>{expressCount}</strong></div></div>
      <ul className="sb-bullets"><li>{level.drinkCounts.join('–')} bebidas por pedido, al azar.</li>{events.map(label => <li key={label}>{label}</li>)}<li>Al reintentar, conservás la misma secuencia.</li></ul>
      <Btn onClick={onReady} autoFocus>Estoy listo ▶</Btn>
    </div>
  </div></div>
}

function Countdown({ value }) {
  return <div className="sb-overlay light" aria-live="assertive" aria-label={value === 0 ? 'Ya' : `El turno comienza en ${value}`}>
    <div className="sb-countdown"><span>PREPARÁ TU BARRA</span><strong key={value}>{value === 0 ? '¡YA!' : value}</strong></div>
  </div>
}

function LevelComplete({ state, onNext }) {
  const next = LEVELS[state.levelIndex + 1]
  const manager = useMemo(() => avatarSrc(MANAGER_PROFILE), [])
  return <div className="sb-overlay"><div className="sb-card-center" role="dialog" aria-modal="true" aria-labelledby="done-title">
    <div className="sb-card-portrait"><img src={manager} alt="" /><span>GERENTE</span></div>
    <div className="sb-card-main">
      <span className="sb-kicker">{state.levelCompletedOrders} CLIENTES · {state.failedOrders} CANCELADOS</span>
      <h2 id="done-title">¡TURNO {state.levelIndex + 1} COMPLETADO!</h2>
      <p>“Muy bien, {state.profile.name}. Se viene más gente: {next.title.toLowerCase()}.”</p>
      <div className="sb-chips"><div><span>PUNTAJE</span><strong>{state.score.toLocaleString('es-AR')}</strong></div><div><span>RACHA</span><strong>×{Math.min(5, 1 + Math.floor(state.streak / 3))}</strong></div><div><span>SIGUE</span><strong>{formatLevelTime(next.duration)}</strong></div></div>
      <ul className="sb-bullets"><li>Turno {next.number}: {next.orders} clientes, {next.drinkCounts.join('–')} bebidas por pedido.</li><li>{next.number === 2 ? 'Puede aparecer la Hora pico.' : 'Último desafío: Hora feliz y Hora pico.'}</li></ul>
      <Btn onClick={onNext} autoFocus>Ver indicaciones del turno {next.number} ▶</Btn>
    </div>
  </div></div>
}

function Results({ state, ranking, onRetry, onRestart, onLeave }) {
  const won = state.outcome === 'won'
  const position = positionOf(ranking, state.profile.email)
  return <div className="sb-overlay"><div className={`sb-card-center results${won ? '' : ' lost'}`} role="dialog" aria-modal="true" aria-labelledby="results-title">
    <div className="sb-card-main wide">
      <span className="sb-kicker">{won ? '★ 3 TURNOS COMPLETADOS' : 'SE TERMINÓ EL TIEMPO'}</span>
      <h2 id="results-title">{won ? '¡QUÉ BUEN CAFÉ HICISTE!' : 'EL TURNO TERMINÓ'}</h2>
      <p>{won ? `${state.profile.name}, la fila te aplaude. ¿Vamos por otro turno?` : `Completaste ${state.levelCompletedOrders} de 5 clientes en el turno ${state.levelIndex + 1}. Podés reintentarlo con la misma secuencia.`}</p>
      <div className="sb-chips big"><div><span>PUNTAJE FINAL</span><strong>{state.score.toLocaleString('es-AR')}</strong></div><div><span>CLIENTES</span><strong>{state.completedOrders}/{totalOrders}</strong></div><div><span>MEJOR RACHA</span><strong>{state.bestStreak}</strong></div></div>
      <p className="sb-rankline">{position ? `🏆 Estás #${position} en el muro de la fama.` : 'Sumá puntos para entrar al muro de la fama.'}{state.score > 0 && state.score >= state.bestScore ? ' ★ ¡Récord personal!' : ''}</p>
      <div className="sb-actions">{!won && <Btn onClick={onRetry} autoFocus>Reintentar turno {state.levelIndex + 1}</Btn>}<Btn onClick={onRestart} secondary={!won} autoFocus={won}>Jugar de nuevo ↻</Btn><Btn secondary onClick={onLeave}>Volver al café</Btn></div>
    </div>
  </div></div>
}

export default function Play({ state, send, onIngredient, soundEnabled, onToggleSound, onReady, onNext, ranking }) {
  const level = LEVELS[state.levelIndex], order = currentOrder(state), recipe = currentRecipe(state)
  const baristaSrc = useMemo(() => avatarSrc(state.profile), [state.profile])
  const playing = state.screen === 'game'
  const busy = !playing || state.phase !== 'idle' || state.paused
  const complete = playing && recipeComplete(state)
  const multiplier = Math.min(5, 1 + Math.floor(state.streak / 3))
  const lastOrder = playing && state.levelCompletedOrders === level.orders - 1
  const happyHour = playing && isHappyHourActive(state)
  const delivering = state.phase === 'delivering'
  const pouringIndex = state.phase === 'pouring' ? INGREDIENTS.findIndex(i => i.id === state.ingredient) : -1
  const nearby = state.orders.slice(Math.max(0, state.orderIndex - 1), state.orderIndex + 4)
  const firstSlot = Math.max(0, state.orderIndex - 1) - state.orderIndex
  const message = playing ? (state.message || (complete ? '¡Tu café está listo! Entregalo con Enter.' : '')) : ''
  const rush = playing && order?.rush

  return <World scene="cafe" bands={CAFE_BANDS} label={`Turno ${level.number}: ${level.title}`}>
    <div className={`sb-room sb-play${state.paused ? ' is-paused' : ''}${lastOrder ? ' final-order' : ''}${happyHour ? ' happy-hour-active' : ''}${state.phase === 'mistake' ? ' shake' : ''}`}>
      <h1 className="sr-only">Turno {level.number}: {level.title}</h1>
      <BackLayer variant="play" />

      {nearby.map((item, index) => {
        const slot = firstSlot + index
        return <Customer key={item.id} id={item.id} slot={slot} happy={slot === 0 && delivering} impatient={slot === 0 && playing && item.type === 'express'} />
      })}

      <Barista src={baristaSrc} phase={state.phase} />
      <FrontLayer />

      {recipe && <Cup key={`${order.id}-${state.drinkIndex}`} recipe={recipe} doses={state.doses} phase={state.phase} ready={complete} />}
      {pouringIndex >= 0 && <img key={state.phaseUntil} className="sb-pour" src={`/assets/${INGREDIENTS[pouringIndex].asset}`} alt=""
        style={{ left: JAR_X(pouringIndex) - 16, '--dx': `${CUP_X - JAR_X(pouringIndex)}px` }} />}

      <p className={`sb-message ${state.messageKind}`} role="status">{message}</p>

      {playing && !state.paused && order && <div className="sb-bubble" key={order.id}><Ticket state={state} order={order} level={level} /></div>}

      {/* tablero digital en la pared */}
      <div className="sb-hudboard" role="group" aria-label="Marcador">
        <div><span>PUNTAJE</span><strong>{state.score.toLocaleString('es-AR')}</strong></div>
        <div className={state.remaining <= 20000 ? 'low-time' : ''}><span>TIEMPO</span><strong aria-label="Tiempo restante">{formatTime(state.remaining)}</strong></div>
        <div className="gold"><span>RACHA</span><strong>×{multiplier}</strong></div>
        <div className={lastOrder ? 'last' : ''}><span>CLIENTES</span><strong>{state.levelCompletedOrders} / {level.orders}</strong></div>
      </div>
      <SoundButton enabled={soundEnabled} onToggle={onToggleSound} className="compact" />
      <button className="sb-corner sb-pause" onClick={() => send({ type: 'PAUSE' })} disabled={!playing} aria-label="Pausar juego">❚❚</button>

      {(lastOrder || happyHour || rush) && <div className={`sb-banner ${happyHour ? 'happy' : rush ? 'rush' : 'last'}`} role="status">
        {happyHour ? '★ HORA FELIZ · PUNTOS ×2 ★' : rush ? '⚡ HORA PICO · EXPRESS ⚡' : '★ ÚLTIMO PEDIDO ★'}</div>}

      {INGREDIENTS.map((item, index) => <button key={item.id} className={`sb-jar${pouringIndex === index ? ' pouring' : ''}`} style={{ left: JAR_X(index) - 48 }} disabled={busy}
        onClick={() => { onIngredient(item.id); send({ type: 'ADD', ingredient: item.id }) }} aria-label={`${item.label}, tecla ${index + 1}`}>
        <span className="sb-jar-lid" />
        <span className="sb-jar-glass"><img src={`/assets/${item.asset}`} alt="" /></span>
        <strong>{item.label}</strong><kbd aria-hidden="true">{index + 1}</kbd>
      </button>)}

      <button className={`sb-serve${complete && !busy ? ' ready' : ''}`} disabled={busy || !complete} onClick={() => send({ type: 'DELIVER' })}>
        <span aria-hidden="true">🛎</span>
        <b>{delivering ? 'ENTREGANDO…' : order?.drinks.length === 1 ? 'ENTREGAR' : `ENTREGAR ${state.drinkIndex + 1}/${order?.drinks.length}`}</b>
        <kbd aria-hidden="true">Enter</kbd>
      </button>
    </div>

    {state.screen === 'briefing' && <Briefing state={state} level={level} onReady={onReady} />}
    {state.screen === 'countdown' && <Countdown value={state.countdown} />}
    {state.screen === 'levelComplete' && <LevelComplete state={state} onNext={onNext} />}
    {state.screen === 'results' && <Results state={state} ranking={ranking} onRetry={() => send({ type: 'RETRY' })} onRestart={() => send({ type: 'RESTART' })} onLeave={() => send({ type: 'LEAVE_SHIFT' })} />}
    <PauseDialog open={state.paused} onResume={() => send({ type: 'RESUME' })} onExit={() => send({ type: 'LEAVE_SHIFT' })} />
  </World>
}
