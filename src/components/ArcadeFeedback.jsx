import { ACHIEVEMENTS } from '../game/achievements.js'

export default function ArcadeFeedback({ scoreEvent, rewardEvent }) {
  const rewards = rewardEvent?.cards.map(id => ACHIEVEMENTS.find(card => card.id === id)).filter(Boolean) ?? []
  if (!scoreEvent && rewards.length === 0) return null
  return <div className="arcade-feedback-layer" aria-live="polite" aria-atomic="true">
    {scoreEvent && <strong key={`score-${scoreEvent.id}`} className={`arcade-score-pop ${scoreEvent.kind}${rewards.length ? ' with-reward' : ''}`}>{scoreEvent.label}</strong>}
    {rewards.length > 0 && <div key={`reward-${rewardEvent.id}`} className="arcade-reward-stack">
      {rewards.map((card, index) => <div className="arcade-reward" style={{ '--reward-index': index }} key={card.id}>
        <strong>+10 CRÉDITOS</strong>
        <div className={`arcade-mini-card card-${card.color}`}><span>{card.title}</span><img src={`/assets/${card.asset}`} alt="" /></div>
        <span className="mono">¡NUEVA CARD!</span>
      </div>)}
    </div>}
  </div>
}
