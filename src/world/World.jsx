import { useEffect, useState } from 'react'
import { STAGE_W, STAGE_H } from '../game/scene.js'

function useViewport() {
  const read = () => ({ w: window.visualViewport?.width ?? window.innerWidth, h: window.visualViewport?.height ?? window.innerHeight })
  const [size, setSize] = useState(read)
  useEffect(() => {
    const onResize = () => setSize(read())
    window.addEventListener('resize', onResize)
    window.visualViewport?.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); window.visualViewport?.removeEventListener('resize', onResize) }
  }, [])
  return size
}

// Un mundo ocupa toda la ventana. La escena de 960×540 se escala para entrar entera y el
// fondo (bandas de color alineadas con la escena) continúa más allá de sus bordes.
// bands: [[yFinDeBanda, color], ...] en coordenadas de la escena.
export default function World({ bands, scene, children, label }) {
  const { w, h } = useViewport()
  const scale = Math.min(w / STAGE_W, h / STAGE_H)
  const ox = (w - STAGE_W * scale) / 2, oy = (h - STAGE_H * scale) / 2
  const ends = bands.map(([end], index) => (index === bands.length - 1 ? h : Math.round(oy + end * scale)))
  const stops = bands.map(([, color], index) => `${color} ${index === 0 ? 0 : ends[index - 1]}px ${ends[index]}px`)
  const portrait = w < 700 && h > w * 1.15
  return <div className={`world world-${scene}`} role="region" aria-label={label}>
    <div className="world-bg" style={{ background: `linear-gradient(to bottom, ${stops.join(',')})` }} />
    <div className="world-stage" style={{ transform: `translate(${ox}px, ${oy}px) scale(${scale})` }}>{children}</div>
    {portrait && <div className="world-rotate" role="alert"><span aria-hidden="true">📱↻</span><strong>Girá el celular</strong><p>La cafetería se ve mejor en horizontal.</p></div>}
  </div>
}
