import Avatar from '../components/Avatar.jsx'
import { Panel, Btn } from './UI.jsx'
import { LEVELS, RULES } from '../game/data.js'
import { ACHIEVEMENTS as CARDS } from '../game/achievements.js'

const formatTime = ms => `${Math.floor(ms / 60000)}:${String((ms / 1000) % 60).padStart(2, '0')}`
const formatClock = ms => {
  if (!Number.isFinite(ms)) return '--:--'
  const seconds = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function HowToPanel({ onClose }) {
  return <Panel title="CÓMO JUGAR" kicker="PIZARRA DEL MENÚ" onClose={onClose} tone="board">
    <p className="sb-lead">Tres turnos, cinco clientes por turno. Cada turno trae recetas, clientes y eventos distintos.</p>
    <div className="sb-grid three">{[
      ['01', 'Leé el pedido', 'Cada cliente muestra su pedido en un globo: qué bebida es y cuántas dosis de cada ingrediente lleva.'],
      ['02', 'Armá la bebida', 'Tocá los frascos de la barra (o las teclas 1 a 6). Cada toque suma una dosis y el vaso se llena por capas.'],
      ['03', 'Entregá y sumá', 'Con la receta completa tocá la campanita o Enter. Si el pedido es express, tenés 5 segundos por bebida.'],
    ].map(([number, title, body]) => <article key={number} className="sb-chalk"><span>PASO {number}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
    <h3 className="sb-sub">LOS TURNOS</h3>
    <div className="sb-grid three">{LEVELS.map(level => <article key={level.number} className="sb-chalk level"><span>TURNO {level.number}</span><h3>{formatTime(level.duration)}</h3><p>{level.orders} clientes · {level.drinkCounts.join('–')} bebidas por pedido</p></article>)}</div>
    <h3 className="sb-sub">PEDIDOS Y EVENTOS</h3>
    <div className="sb-grid two">
      <article className="sb-chalk"><span>☕ CLÁSICO</span><p>Sin reloj individual. Preparalo a tu ritmo y sumá el puntaje normal.</p></article>
      <article className="sb-chalk gold"><span>⚡ EXPRESS ×2</span><p>5 segundos por bebida. Si vence, el pedido se cancela: perdés 100 puntos, 10 segundos y la racha.</p></article>
      <article className="sb-chalk gold"><span>★ HORA FELIZ</span><p>Durante 20 segundos todos los puntos valen doble. Con un express, los bonus se combinan en ×4.</p></article>
      <article className="sb-chalk gold"><span>⚡⚡ HORA PICO</span><p>Llegan dos express seguidos. Completalos para desbloquear una card especial.</p></article>
    </div>
    <h3 className="sb-sub">REGLAS DE LA BARRA</h3>
    <ul className="sb-rules">
      <li>Una dosis incorrecta o de más no entra al vaso: resta {RULES.mistakePenaltyMs / 1000} segundos y corta la racha.</li>
      <li>Si un express se cancela, llega otro pedido: igual tenés que completar cinco clientes.</li>
      <li>Los aciertos seguidos multiplican tus puntos hasta ×5, y la racha sigue entre turnos.</li>
      <li>Esc o el botón Ⅱ pausan todos los relojes.</li>
    </ul>
  </Panel>
}

const medals = ['🥇', '🥈', '🥉']
export function RankingPanel({ ranking, profile, onClose }) {
  const mine = ranking.find(item => item.email === profile?.email?.toLowerCase())
  return <Panel title="MURO DE LA FAMA" kicker="TOP 10 BARISTAS" onClose={onClose} tone="board">
    {ranking.length === 0 ? <div className="sb-empty"><span aria-hidden="true">☕</span><p>Todavía no hay puntajes. Jugá un turno y sé el primero en el muro.</p></div>
      : <ol className="sb-ranking">{ranking.map((item, index) => <li key={item.email} className={`${index < 3 ? 'podium' : ''}${item.email === profile?.email?.toLowerCase() ? ' me' : ''}`}>
        <span className="pos">{medals[index] ?? index + 1}</span><span className="who">{item.name}{item.email === profile?.email?.toLowerCase() && <em> (vos)</em>}</span>
        <strong>{item.score.toLocaleString('es-AR')}</strong><span className="date">{item.date ? new Date(item.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : ''}</span>
      </li>)}</ol>}
    <p className="sb-foot">{mine ? `Tu mejor puntaje: ${mine.score.toLocaleString('es-AR')}.` : 'Todavía no tenés puntaje en el muro.'} El ranking se guarda en este dispositivo.</p>
  </Panel>
}

function Card({ card, progress }) {
  const unlocked = card.unlocked(progress)
  return <article className={`sb-card card-${card.color}${unlocked ? '' : ' locked'}`} aria-label={`${card.title}: ${unlocked ? 'desbloqueada' : 'bloqueada'}`}>
    <header><h3>{card.title}</h3><span aria-hidden="true">{card.stars}</span></header>
    <img src={`/assets/${card.asset}`} alt="" />
    <p>{card.description}</p>
    {!unlocked && <div className="lock"><span aria-hidden="true">◆</span> BLOQUEADA</div>}
  </article>
}

export function LockerPanel({ profile, progress, currentStreak, bestScore, onEdit, onLogout, onClose }) {
  const unlocked = CARDS.filter(card => card.unlocked(progress)).length
  const credits = unlocked * 10
  return <Panel title="MI CASILLERO" kicker={`PERFIL DE ${profile.name.toUpperCase()}`} onClose={onClose} tone="paper">
    <div className="sb-locker-grid">
      <aside className="sb-me">
        <Avatar profile={profile} />
        <h3>{profile.name}</h3>
        <div className="sb-credits"><div><span>COFFEE CLUB</span><strong>{credits} CRÉDITOS</strong></div><div className="sb-track" role="img" aria-label={`${credits} de ${CARDS.length * 10} créditos`}><span style={{ width: `${credits / (CARDS.length * 10) * 100}%` }} /></div></div>
        <dl className="sb-stats">
          <div><dt>MEJOR PUNTAJE</dt><dd>{bestScore.toLocaleString('es-AR')}</dd></div>
          <div><dt>PEDIDOS COMPLETOS</dt><dd>{progress.totalOrders}</dd></div>
          <div><dt>MEJOR TIEMPO</dt><dd>{formatClock(progress.fastestDrink)}</dd></div>
          <div><dt>RACHA SIN ERRORES</dt><dd>{currentStreak}</dd></div>
        </dl>
        <div className="sb-me-actions"><Btn secondary onClick={onEdit}>Editar avatar</Btn><Btn secondary onClick={onLogout}>Cerrar sesión</Btn></div>
      </aside>
      <section aria-labelledby="cards-title"><div className="sb-cards-head"><h3 id="cards-title">TUS CARDS</h3><span>{unlocked} / {CARDS.length}</span></div>
        <div className="sb-cards">{CARDS.map(card => <Card key={card.id} card={card} progress={progress} />)}</div>
      </section>
    </div>
  </Panel>
}
