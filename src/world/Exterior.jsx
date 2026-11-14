import { useMemo, useState } from 'react'
import World from './World.jsx'
import { Dialogue, Typewriter, Btn, SoundButton } from './UI.jsx'
import { Hotspot } from './Cafe.jsx'
import { avatarSrc } from '../avatarSvg.js'
import { customerProfile, MANAGER_PROFILE } from '../game/scene.js'

const INK = '#10231d'
const BANDS = [[330, '#cfe6ee'], [412, '#cfc8b8'], [540, '#3b4541']]

function Facade() {
  const stripes = Array.from({ length: 24 }, (_, i) => <g key={i}><rect x={120 + i * 30} y="152" width="30" height="34" fill={i % 2 ? '#f2f0eb' : '#00704A'} /><rect x={120 + i * 30} y="186" width="30" height="6" fill={i % 2 ? '#d6d2c6' : '#005638'} /></g>)
  const cobbles = Array.from({ length: 20 }, (_, i) => <rect key={i} x={i * 48 + 10} y="342" width="2" height="68" fill="#b5ad9a" />)
  const dashes = Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 90 + 20} y="486" width="50" height="5" fill="#e9e4d2" />)
  const star = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2, d = i % 2 ? 7 : 16
    return `${(66 + Math.cos(a) * d).toFixed(1)},${(66 + Math.sin(a) * d).toFixed(1)}`
  }).join(' ')
  return <svg className="sb-layer" viewBox="0 0 960 540" shapeRendering="crispEdges" aria-hidden="true">
    {/* nubes y edificios lejanos */}
    <g className="sb-cloud c1"><rect x="40" y="40" width="90" height="14" fill="#fff" /><rect x="58" y="28" width="52" height="14" fill="#fff" /></g>
    <g className="sb-cloud c2"><rect x="520" y="70" width="110" height="14" fill="#fff" /><rect x="545" y="58" width="60" height="14" fill="#fff" /></g>
    <rect x="0" y="200" width="100" height="140" fill="#a9c3b8" /><rect x="860" y="170" width="100" height="170" fill="#a9c3b8" />
    <rect x="30" y="170" width="60" height="30" fill="#94b0a5" /><rect x="880" y="140" width="60" height="30" fill="#94b0a5" />
    {/* fachada */}
    <rect x="100" y="14" width="760" height="326" fill="#1E3932" stroke={INK} strokeWidth="4" />
    <rect x="92" y="10" width="776" height="20" fill="#CBA258" stroke={INK} strokeWidth="3" />
    {/* cartel grande */}
    <g transform="translate(300 40) scale(1.24)">
      <rect width="290" height="86" fill="#CBA258" stroke={INK} strokeWidth="3.5" /><rect x="8" y="8" width="274" height="70" fill="#00704A" />
      <g transform="translate(-16 -23)"><circle cx="66" cy="66" r="26" fill="#00704A" stroke="#fff" strokeWidth="3" /><circle cx="66" cy="66" r="19" fill="none" stroke="#fff" strokeWidth="1.5" /><polygon points={star} fill="#fff" /></g>
      <text x="166" y="38" textAnchor="middle" className="sb-sign-big">STARBUCKS</text><text x="166" y="66" textAnchor="middle" className="sb-sign-small">COFFEE</text>
    </g>
    {/* toldo */}
    {stripes}
    <rect x="120" y="152" width="720" height="3" fill={INK} /><rect x="120" y="190" width="720" height="3" fill={INK} opacity=".5" />
    {/* ventanas con la cafetería encendida */}
    {[140, 570].map(x => <g key={x}>
      <rect x={x} y="200" width="250" height="134" fill="#CBA258" stroke={INK} strokeWidth="4" />
      <rect x={x + 8} y="208" width="234" height="118" fill="#f6d98a" />
      <rect x={x + 8} y="266" width="234" height="60" fill="#e9b865" />
      <rect x={x + 24} y="236" width="40" height="8" fill="#6b4a2f" /><rect x={x + 24} y="262" width="40" height="8" fill="#6b4a2f" />
      <rect x={x + 100} y="278" width="48" height="6" fill="#6b4a2f" /><rect x={x + 108} y="284" width="4" height="30" fill="#6b4a2f" /><rect x={x + 136} y="284" width="4" height="30" fill="#6b4a2f" />
      <rect x={x + 176} y="240" width="26" height="62" fill="#3a2a1d" /><rect x={x + 178} y="224" width="22" height="20" fill="#3a2a1d" />
      <polygon points={`${x + 8},208 ${x + 70},208 ${x + 30},326 ${x + 8},326`} fill="#fff" opacity=".18" />
      <rect x={x + 120} y="208" width="4" height="118" fill="#CBA258" />
    </g>)}
    {/* puerta */}
    <rect x="410" y="196" width="140" height="144" fill="#CBA258" stroke={INK} strokeWidth="4" />
    <rect x="420" y="206" width="120" height="134" fill="#10231d" />
    <rect x="426" y="212" width="50" height="128" fill="#f6d98a" /><rect x="484" y="212" width="50" height="128" fill="#f6d98a" />
    <rect x="466" y="264" width="6" height="30" fill="#CBA258" /><rect x="488" y="264" width="6" height="30" fill="#CBA258" />
    <polygon points="426,212 450,212 426,300" fill="#fff" opacity=".25" />
    <rect x="440" y="170" width="80" height="22" fill="#f2f0eb" stroke={INK} strokeWidth="3" /><text x="480" y="187" textAnchor="middle" className="sb-open">ABIERTO</text>
    {/* faroles */}
    {[372, 588].map(x => <g key={x}><rect x={x} y="226" width="8" height="26" fill="#10231d" /><rect x={x - 4} y="212" width="16" height="16" fill="#ffd84a" stroke={INK} strokeWidth="2" /></g>)}
    {/* macetas */}
    {[104, 836].map(x => <g key={x}><rect x={x} y="306" width="24" height="30" fill="#7a4a2b" stroke={INK} strokeWidth="3" /><polygon points={`${x + 12},266 ${x + 22},308 ${x + 2},308`} fill="#3fae4f" stroke={INK} strokeWidth="2" /></g>)}
    {/* vereda y calle */}
    <rect x="0" y="334" width="960" height="8" fill="#e6dfcd" />{cobbles}
    <rect x="0" y="406" width="960" height="10" fill="#a39b88" />
    <rect x="0" y="416" width="960" height="4" fill="#2b3430" />{dashes}
    {/* farol de la calle */}
    <rect x="34" y="150" width="8" height="190" fill="#10231d" /><rect x="24" y="142" width="28" height="12" fill="#10231d" /><rect x="26" y="154" width="24" height="8" fill="#ffd84a" />
  </svg>
}

const GUEST_LINES = [
  '¡Buen día! Soy el gerente de Starbucks Coffee. Hoy abrimos y la fila ya llega hasta la puerta.',
  'Vas a ser nuestro barista: leé cada pedido, armá la bebida y entregala antes de que se termine el turno.',
  'Son tres turnos de cinco clientes cada uno. Los pedidos express pagan doble, pero esperan solo 5 segundos por bebida.',
  'Si la rompés, tu nombre sube al muro de la fama. ¿Estás listo para tu primer turno?',
]

export default function Exterior({ profile, interrupted, bestScore, soundEnabled, onToggleSound, onEnter, onHow, children }) {
  const lines = useMemo(() => profile ? [
    `¡Qué bueno verte de nuevo, ${profile.name}! La cafetería ya está abierta y te estaban esperando.`,
    bestScore > 0 ? `Tu mejor marca es de ${bestScore.toLocaleString('es-AR')} puntos. ¿La superás hoy?` : 'Todavía no tenés puntos en el muro de la fama. ¡Hoy es el día!',
  ] : GUEST_LINES, [profile, bestScore])
  const [step, setStep] = useState(0)
  const manager = useMemo(() => avatarSrc(MANAGER_PROFILE), [])
  const player = useMemo(() => profile ? avatarSrc(profile) : null, [profile])
  const walkers = useMemo(() => ['a1', 'b2', 'c3'].map(id => avatarSrc(customerProfile(id))), [])
  const last = step >= lines.length - 1
  return <World scene="exterior" bands={BANDS} label="Entrada de Starbucks Coffee">
    <Facade />
    <img className="sb-walker w1" src={walkers[0]} alt="" /><img className="sb-walker w2" src={walkers[1]} alt="" /><img className="sb-walker w3" src={walkers[2]} alt="" />
    <div className="sb-npc manager" style={{ left: 316 }}><img src={manager} alt="El gerente de la cafetería" /></div>
    {player && <div className="sb-npc you" style={{ left: 602 }}><img src={player} alt={`${profile.name}, tu avatar`} /></div>}
    <Hotspot x={410} y={196} w={140} h={144} label={profile ? 'ENTRAR' : 'ENTRAR AL CAFÉ'} pin="top" className="sb-door" onClick={onEnter} />
    <SoundButton enabled={soundEnabled} onToggle={onToggleSound} />
    {interrupted && <p className="sb-notice" role="status">El turno anterior se interrumpió. Tu récord sigue guardado.</p>}
    <Dialogue portrait={manager} name="GERENTE" className="sb-intro" actions={<>
      {!last && <><Btn secondary onClick={() => setStep(lines.length - 1)}>Saltar</Btn><Btn onClick={() => setStep(step + 1)}>Siguiente ▶</Btn></>}
      {last && <><Btn secondary onClick={onHow}>Cómo jugar</Btn><Btn onClick={onEnter}>{profile ? 'Entrar al café ▶' : 'Entrar e iniciar sesión ▶'}</Btn></>}
    </>}>
      <Typewriter key={`${profile?.name}-${step}`} text={lines[step]} />
    </Dialogue>
    {children}
  </World>
}
