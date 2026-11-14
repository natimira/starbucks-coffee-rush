import { useEffect, useRef, useState } from 'react'

export function SoundButton({ enabled, onToggle, className = '' }) {
  return <button type="button" className={`sb-corner sb-sound ${className}`} onClick={onToggle} aria-pressed={enabled} aria-label={enabled ? 'Silenciar música y efectos' : 'Activar música y efectos'}>
    <span aria-hidden="true">{enabled ? '♪' : '×'}</span><b>{enabled ? 'SONIDO' : 'SIN SONIDO'}</b>
  </button>
}

// Panel dentro del mundo (pizarra o papel). Se cierra con ✕ o Esc.
export function Panel({ title, kicker, onClose, tone = 'board', className = '', children }) {
  const ref = useRef(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
    const onKey = event => { if (event.key === 'Escape') { event.preventDefault(); onClose() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return <div className="sb-panel-layer" onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className={`sb-panel ${tone} ${className}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
      <header className="sb-panel-head"><div>{kicker && <span>{kicker}</span>}<h2>{title}</h2></div><button type="button" onClick={onClose} aria-label="Cerrar">✕</button></header>
      <div className="sb-panel-body">{children}</div>
    </div>
  </div>
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Texto que se escribe solo. Tocar el cuadro lo completa al instante.
export function Typewriter({ text }) {
  const [count, setCount] = useState(() => (reducedMotion() ? text.length : 0))
  useEffect(() => {
    if (count >= text.length) return
    const id = setTimeout(() => setCount(value => value + 1), 22)
    return () => clearTimeout(id)
  }, [count, text])
  return <span onClick={() => setCount(text.length)} aria-label={text}>{text.slice(0, count)}<i className={count >= text.length ? 'sb-caret done' : 'sb-caret'} aria-hidden="true" /></span>
}

// Cuadro de diálogo del gerente (o de quien hable), al pie de la escena.
export function Dialogue({ portrait, name, children, actions, className = '' }) {
  return <div className={`sb-dialogue ${className}`}>
    {portrait && <div className="sb-dialogue-portrait"><img src={portrait} alt="" /><span>{name}</span></div>}
    <div className="sb-dialogue-main"><div className="sb-dialogue-text" aria-live="polite">{children}</div>{actions && <div className="sb-dialogue-actions">{actions}</div>}</div>
  </div>
}

export function Btn({ secondary = false, className = '', children, ...props }) {
  return <button type="button" className={`sb-btn${secondary ? ' secondary' : ''} ${className}`} {...props}>{children}</button>
}
