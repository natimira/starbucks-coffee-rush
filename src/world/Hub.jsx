import { useMemo } from 'react'
import World from './World.jsx'
import { SoundButton } from './UI.jsx'
import { BackLayer, FrontLayer, Barista, Hotspot, RadioArt } from './Cafe.jsx'
import { HUB_BANDS } from '../game/scene.js'
import { avatarSrc } from '../avatarSvg.js'

const medals = ['🥇', '🥈', '🥉']
// El café recorrible: cada objeto del local lleva a una sección del juego.
export default function Hub({ profile, ranking, soundEnabled, onToggleSound, onPlay, onHow, onRanking, onLocker, onExit, dimmed, children }) {
  const src = useMemo(() => avatarSrc(profile), [profile])
  const top = ranking.slice(0, 3)
  return <World scene="cafe" bands={HUB_BANDS} label="Cafetería Starbucks Coffee">
    <div className={`sb-room${dimmed ? ' dimmed' : ''}`}>
      <BackLayer variant="hub" />

      <Hotspot x={26} y={36} w={236} h={112} label="CÓMO JUGAR" pin="none" onClick={onHow}>
        <span className="sb-board"><b>☕ MENÚ DEL DÍA</b><i>Caramel · Iced Latte</i><i>Mocha · Strawberry Latte</i><em>▶ CÓMO JUGAR</em></span>
      </Hotspot>

      <Hotspot x={640} y={40} w={295} h={210} label="MURO DE LA FAMA" pin="bottom" onClick={onRanking}>
        <span className="sb-fame"><b>★ TOP BARISTAS ★</b>
          {top.length === 0 ? <em>Todavía nadie. ¡Sé el primero!</em> : top.map((item, index) => <span key={item.email} className="sb-fame-row"><i aria-hidden="true">{medals[index]}</i><span>{item.name}</span><strong>{item.score.toLocaleString('es-AR')}</strong></span>)}
        </span>
      </Hotspot>

      <Hotspot x={22} y={150} w={98} h={222} label="MI CASILLERO" pin="none" onClick={onLocker}>
        <span className="sb-locker-plate">MI<br />PERFIL</span>
      </Hotspot>

      <Barista src={src} name={profile.name} />
      <FrontLayer variant="hub" />

      <Hotspot x={696} y={328} w={84} h={56} label="RADIO" pin="top" className="sb-radio" onClick={onToggleSound} aria-pressed={soundEnabled}><RadioArt on={soundEnabled} /></Hotspot>
      <p className="sb-message">Hola, {profile.name}. Tocá un lugar del café para ir.</p>

      <Hotspot x={806} y={424} w={120} h={92} label="ABRIR TURNO" pin="top" className="sb-serve ready" onClick={onPlay}>
        <span aria-hidden="true">🛎</span><b>JUGAR</b><kbd aria-hidden="true">Turno 1</kbd>
      </Hotspot>

      <button type="button" className="sb-corner sb-exit" onClick={onExit}><span aria-hidden="true">←</span><b>SALIR A LA PUERTA</b></button>
      <SoundButton enabled={soundEnabled} onToggle={onToggleSound} />
    </div>
    {children}
  </World>
}
