import { useMemo } from 'react'
import { INGREDIENTS } from '../game/data.js'
import { avatarSrc } from '../avatarSvg.js'
import { STAGE_W, STAGE_H, CUP_X, customerProfile } from '../game/scene.js'

// Escena fija de 960×540. Game.jsx la escala al ancho disponible.

const INK = '#10231d'

function Logo({ x, y, r }) {
  // Sello verde con anillo blanco y estrella; no reproduce el logo original.
  const star = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2
    const d = i % 2 ? r * 0.28 : r * 0.62
    return `${(x + Math.cos(a) * d).toFixed(1)},${(y + Math.sin(a) * d).toFixed(1)}`
  }).join(' ')
  return <g>
    <circle cx={x} cy={y} r={r} fill="#00704A" stroke="#fff" strokeWidth="3" />
    <circle cx={x} cy={y} r={r - 7} fill="none" stroke="#fff" strokeWidth="1.5" />
    <polygon points={star} fill="#fff" />
  </g>
}

function Sign({ x, y, s = 1 }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect width="290" height="86" fill="#CBA258" stroke={INK} strokeWidth="4" />
    <rect x="8" y="8" width="274" height="70" fill="#00704A" />
    <Logo x={50} y={43} r={26} />
    <text x="166" y="38" textAnchor="middle" className="sb-sign-big">STARBUCKS</text>
    <text x="166" y="66" textAnchor="middle" className="sb-sign-small">COFFEE</text>
  </g>
}

function Shelves() {
  return <g>
    <rect x="310" y="168" width="200" height="8" fill="#CBA258" /><rect x="310" y="214" width="200" height="8" fill="#CBA258" />
    {[0, 1, 2, 3, 4].map(i => <g key={i}><rect x={322 + i * 36} y="140" width="22" height="28" fill={i % 2 ? '#fff' : '#D4E9E2'} stroke={INK} strokeWidth="2" /><rect x={322 + i * 36} y="150" width="22" height="8" fill="#00704A" /></g>)}
    {[0, 1, 2, 3].map(i => <g key={i}><rect x={326 + i * 44} y="190" width="30" height="24" fill="#f2f0eb" stroke={INK} strokeWidth="2" /><rect x={354 + i * 44} y="196" width="8" height="12" fill="none" stroke="#f2f0eb" strokeWidth="3" /></g>)}
  </g>
}

function Machine() {
  return <g>
    <rect x="386" y="262" width="118" height="110" fill="#c9d1cf" stroke={INK} strokeWidth="4" />
    <rect x="386" y="262" width="118" height="22" fill="#00704A" stroke={INK} strokeWidth="4" />
    <rect x="404" y="296" width="34" height="46" fill="#2b3a36" /><rect x="452" y="296" width="34" height="46" fill="#2b3a36" />
    <rect x="410" y="342" width="22" height="22" fill="#fff" opacity=".85" /><rect x="458" y="342" width="22" height="22" fill="#fff" opacity=".85" />
    <circle cx="488" cy="274" r="4" fill="#5ee06b" className="sb-led" />
  </g>
}

function Plant() {
  return <g>
    <rect x="918" y="330" width="34" height="40" fill="#7a4a2b" stroke={INK} strokeWidth="3" />
    <polygon points="935,270 946,330 924,330" fill="#3fae4f" stroke={INK} strokeWidth="2" /><polygon points="918,290 936,332 912,330" fill="#52c562" stroke={INK} strokeWidth="2" />
  </g>
}

// variant 'hub': el café para recorrer. variant 'play': el café en pleno turno.
export function BackLayer({ variant = 'play' }) {
  const planks = Array.from({ length: 24 }, (_, i) => <rect key={i} x={i * 40} y="250" width="2" height="146" fill="#4d3321" />)
  const hub = variant === 'hub'
  return <svg className="sb-layer" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} shapeRendering="crispEdges" aria-hidden="true">
    <rect width={STAGE_W} height="396" fill="#1E3932" />
    <rect y="250" width={STAGE_W} height="146" fill="#6b4a2f" />{planks}
    <rect y="246" width={STAGE_W} height="6" fill="#CBA258" />
    {hub ? <>
      <Sign x={290} y={36} />
      {/* pizarra de menú */}
      <rect x="26" y="36" width="236" height="112" fill="#5b3d27" stroke={INK} strokeWidth="4" /><rect x="34" y="44" width="220" height="96" fill="#17231f" />
      {/* muro de la fama */}
      <rect x="640" y="40" width="295" height="210" fill="#5b3d27" stroke={INK} strokeWidth="4" /><rect x="648" y="48" width="279" height="194" fill="#17231f" />
      <rect x="648" y="48" width="279" height="30" fill="#CBA258" />
      {/* casilleros */}
      {[150, 262].map(y => <g key={y}><rect x="22" y={y} width="98" height="110" fill="#00704A" stroke={INK} strokeWidth="4" />
        <rect x="32" y={y + 12} width="78" height="10" fill="#0a5239" />{[0, 1, 2].map(i => <rect key={i} x="36" y={y + 28 + i * 8} width="70" height="3" fill="#0a5239" />)}
        <rect x="90" y={y + 66} width="10" height="22" fill="#CBA258" stroke={INK} strokeWidth="2" /></g>)}
    </> : <>
      <Sign x={20} y={12} s={0.9} />
      {/* ventana a la calle */}
      <rect x="690" y="70" width="250" height="170" fill="#10231d" />
      <rect x="698" y="78" width="234" height="154" fill="#bfe4f2" />
      <rect x="698" y="168" width="234" height="64" fill="#9fcf9a" />
      <rect x="712" y="124" width="38" height="46" fill="#e8dcc3" /><rect x="760" y="106" width="30" height="64" fill="#d8c7a6" />
      <rect x="800" y="136" width="44" height="34" fill="#e8dcc3" /><rect x="860" y="116" width="34" height="54" fill="#d8c7a6" />
      <rect x="811" y="78" width="6" height="154" fill="#10231d" /><rect x="698" y="150" width="234" height="6" fill="#10231d" />
    </>}
    <Shelves />
    <Machine />
    <Plant />
  </svg>
}

function Tables() {
  const tiles = []
  for (let row = 0; row < 4; row++) for (let col = 0; col < 24; col++) tiles.push(<rect key={`${row}-${col}`} x={col * 40} y={412 + row * 40} width="40" height="40" fill={(row + col) % 2 ? '#cfc2a2' : '#e4dac0'} />)
  const table = cx => <g key={cx}>
    {/* banquitos */}
    {[-62, 38].map(dx => <g key={dx}><rect x={cx + dx} y="484" width="24" height="9" fill="#00704A" stroke={INK} strokeWidth="2" /><rect x={cx + dx + 10} y="493" width="4" height="22" fill={INK} /><rect x={cx + dx + 2} y="513" width="20" height="4" fill={INK} /></g>)}
    {/* mesa */}
    <rect x={cx - 5} y="466" width="10" height="46" fill="#4d3321" stroke={INK} strokeWidth="2" />
    <rect x={cx - 24} y="508" width="48" height="8" fill="#4d3321" stroke={INK} strokeWidth="2" />
    <rect x={cx - 38} y="454" width="76" height="14" fill="#8b5e3c" stroke={INK} strokeWidth="3" />
    <rect x={cx - 34} y="457" width="68" height="3" fill="#b07f55" />
    {/* taza y platito */}
    <rect x={cx - 8} y="440" width="16" height="14" fill="#f2f0eb" stroke={INK} strokeWidth="2" /><rect x={cx + 8} y="444" width="5" height="7" fill="none" stroke={INK} strokeWidth="2" />
    <rect x={cx - 8} y="442" width="16" height="4" fill="#00704A" />
  </g>
  return <g>{tiles}<rect x="0" y="412" width={STAGE_W} height="6" fill="#10231d" opacity=".25" />{[130, 330, 530, 700].map(table)}</g>
}

// variant 'play': la barra con la bandeja de frascos. variant 'hub': el salón con mesitas.
export function FrontLayer({ variant = 'play' }) {
  const hub = variant === 'hub'
  return <svg className="sb-layer" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} shapeRendering="crispEdges" aria-hidden="true">
    {hub && <Tables />}
    {/* cubierta */}
    <rect x="0" y="372" width={STAGE_W} height="24" fill="#F2F0EB" stroke={INK} strokeWidth="3" />
    <rect x="0" y="376" width={STAGE_W} height="4" fill="#fff" />
    {/* frente verde con filete dorado */}
    <rect x="0" y="396" width={STAGE_W} height={hub ? 16 : 144} fill="#00704A" />
    <rect x="0" y="396" width={STAGE_W} height="6" fill="#CBA258" />
    <rect x="0" y="402" width={STAGE_W} height="4" fill={INK} opacity=".35" />
    {!hub && <>
      {/* bandeja de ingredientes */}
      <rect x="22" y="412" width="750" height="116" rx="4" fill="#4d3321" stroke={INK} strokeWidth="4" />
      <rect x="28" y="418" width="738" height="104" fill="#6b4a2f" />
      <rect x="28" y="506" width="738" height="16" fill="#4d3321" />
    </>}
    {/* recuadro de entrega */}
    <rect x="792" y="412" width="146" height="116" rx="4" fill="#1E3932" stroke={INK} strokeWidth="4" />
    <rect x="798" y="418" width="134" height="104" fill="#17231f" />
  </svg>
}

// ---------- Clientes ----------
// slot: -1 saliendo, 0 en el mostrador, 1 y 2 esperando, 3 afuera (aún no entra).
const SLOT_X = { '-1': 1120, 0: 600, 1: 790, 2: 900, 3: 1120 }
export function Customer({ id, slot, happy, impatient }) {
  const src = useMemo(() => avatarSrc(customerProfile(id)), [id])
  return <div className={`sb-customer slot-${slot < 0 ? 'out' : slot}${happy ? ' happy' : ''}${impatient ? ' impatient' : ''}`} style={{ left: SLOT_X[slot] }}>
    <div className="sb-customer-walk"><img src={src} alt="" /></div>
    {happy && <span className="sb-heart" aria-hidden="true">❤</span>}
  </div>
}

// ---------- Vaso con capas ----------
export function Cup({ recipe, doses, phase, ready }) {
  const total = Object.values(recipe.doses).reduce((a, b) => a + b, 0)
  const segment = 56 / total
  const layers = []
  let level = 0
  for (const item of INGREDIENTS) {
    const count = doses[item.id] ?? 0
    for (let i = 0; i < count; i++) {
      layers.push(<rect key={`${item.id}${i}`} className="sb-layer-in" x="0" y={78 - (level + 1) * segment} width="64" height={segment + .5} fill={item.color} stroke="rgba(16,35,29,.45)" strokeWidth="1" />)
      level++
    }
  }
  const ticks = Array.from({ length: total - 1 }, (_, i) => <line key={i} x1="10" x2="54" y1={78 - (i + 1) * segment} y2={78 - (i + 1) * segment} stroke="#fff" strokeOpacity=".55" strokeDasharray="3 3" strokeWidth="1" />)
  return <div className={`sb-cup ${phase}${ready ? ' ready' : ''}${level === 0 ? ' empty' : ''}`} style={{ left: CUP_X - 36 }}>
    <svg viewBox="-4 -6 72 92" shapeRendering="crispEdges" aria-hidden="true">
      <defs><clipPath id="cup-clip"><polygon points="6,14 58,14 50,78 14,78" /></clipPath></defs>
      <polygon points="6,14 58,14 50,78 14,78" fill="#9fc4b8" fillOpacity=".55" />
      <g clipPath="url(#cup-clip)">{layers}</g>
      {ticks}
      <polygon points="6,14 58,14 50,78 14,78" fill="none" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <rect x="3" y="8" width="58" height="8" rx="2" fill="#00704A" stroke={INK} strokeWidth="3" />
      <rect x="36" y="-6" width="5" height="18" fill="#00704A" stroke={INK} strokeWidth="2" />
      <polygon points="12,26 20,26 18,62 15,62" fill="#fff" opacity=".45" />
    </svg>
  </div>
}

// ---------- Personajes y objetos clicables ----------
export function Barista({ src, phase = 'idle', name }) {
  return <div className={`sb-barista ${phase}`}><img src={src} alt={name ? `${name}, barista` : 'Tu avatar, el barista'} />{name && <span className="sb-nameplate">{name}</span>}</div>
}

// Zona clicable de la escena. La etiqueta (pin) invita a tocarla.
export function Hotspot({ x, y, w, h, label, onClick, pin = 'top', className = '', children, ...rest }) {
  return <button type="button" className={`sb-hot ${className}`} style={{ left: x, top: y, width: w, height: h }} onClick={onClick} aria-label={label} {...rest}>
    {children}{pin !== 'none' && <span className={`sb-pin pin-${pin}`} aria-hidden="true">{label}</span>}
  </button>
}

export function RadioArt({ on }) {
  return <svg viewBox="0 0 80 52" shapeRendering="crispEdges" aria-hidden="true" className={`sb-radio-art${on ? ' on' : ''}`}>
    <rect x="30" y="2" width="3" height="14" fill={INK} /><rect x="30" y="2" width="14" height="3" fill={INK} />
    <rect x="4" y="14" width="72" height="36" fill="#CBA258" stroke={INK} strokeWidth="3" />
    <rect x="10" y="20" width="30" height="24" fill="#10231d" />{[0, 1, 2, 3].map(i => <rect key={i} x="14" y={24 + i * 5} width="22" height="2" fill="#5ee06b" opacity=".7" />)}
    <circle cx="56" cy="26" r="6" fill="#f2f0eb" stroke={INK} strokeWidth="2" /><circle cx="56" cy="40" r="4" fill="#00704A" stroke={INK} strokeWidth="2" />
    {on && <g className="sb-waves" fill="none" stroke="#00704A" strokeWidth="2"><path d="M70 8 q6 -4 8 2" /><path d="M66 3 q10 -6 14 4" /></g>}
  </svg>
}
