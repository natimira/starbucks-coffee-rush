import { useEffect, useRef } from 'react'

export function Button({ children, secondary = false, className = '', ...props }) {
  return <button className={`sb-btn ${secondary ? 'secondary' : ''} ${className}`} {...props}>{children}</button>
}
export function PauseDialog({ open, onResume, onExit }) {
  const ref = useRef(null)
  useEffect(() => { if (open && !ref.current.open) ref.current.showModal(); else if (!open && ref.current.open) ref.current.close() }, [open])
  return <dialog ref={ref} className="sb-dialog pause-dialog" aria-labelledby="pause-title" onCancel={event => { event.preventDefault(); onResume() }}>
    <span className="sb-kicker">RESPIRÁ UN MOMENTO</span><h2 id="pause-title">CAFÉ EN PAUSA</h2><p>Tu turno te espera. El reloj y los ingredientes están detenidos.</p>
    <div className="sb-stack"><Button onClick={onResume} autoFocus>Seguir jugando</Button><Button secondary onClick={onExit}>Salir del turno</Button></div>
  </dialog>
}
