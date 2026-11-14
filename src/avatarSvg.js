import { HAIR, APRONS } from './game/data.js'

// Figura pixel-art estilo Habbo: cabeza grande, cuerpo chico, contorno oscuro.
const INK = '#0e1b2b'
const SKIN = '#f2c29b'

function parts(profile) {
  const hair = HAIR[profile?.hair] ?? HAIR.Castaño
  const apron = profile?.clothes ?? APRONS[profile?.apron] ?? APRONS.Verde
  const shirt = profile?.shirt ?? '#ffffff'
  const gender = profile?.gender
  const list = []
  const add = (x, y, w, h, fill) => list.push({ x, y, w, h, fill })

  // piernas y zapatos
  add(4, 20, 3, 5, '#3a4f6a'); add(9, 20, 3, 5, '#3a4f6a')
  add(3, 25, 4, 2, '#1d2733'); add(9, 25, 4, 2, '#1d2733')
  // torso, mangas y delantal
  add(4, 13, 8, 8, shirt)
  add(2, 13, 2, 6, shirt); add(12, 13, 2, 6, shirt)
  add(2, 19, 2, 2, SKIN); add(12, 19, 2, 2, SKIN)
  add(5, 14, 6, 7, apron)
  add(6, 15, 4, 2, 'rgba(255,255,255,.35)')
  // cuello y cabeza
  add(7, 12, 2, 1, SKIN)
  add(4, 2, 8, 10, SKIN)
  // pelo
  if (gender === 'Mujer') {
    add(3, 1, 10, 3, hair); add(3, 4, 2, 9, hair); add(11, 4, 2, 9, hair)
  } else if (gender === 'No binario') {
    add(4, 1, 8, 3, hair); add(4, 4, 4, 2, hair); add(11, 4, 1, 3, hair)
  } else if (gender === 'Prefiero no decirlo') {
    // sin pelo
  } else {
    add(4, 1, 8, 3, hair); add(4, 4, 1, 3, hair); add(11, 4, 1, 3, hair)
  }
  // cara
  add(6, 7, 1, 2, INK); add(9, 7, 1, 2, INK)
  add(7, 10, 2, 1, '#b5654a')
  return list
}

export function avatarSvg(profile) {
  const list = parts(profile)
  const outline = list.filter(p => !p.fill.startsWith('rgba')).map(p => `<rect x="${p.x - 1}" y="${p.y - 1}" width="${p.w + 2}" height="${p.h + 2}" fill="${INK}"/>`).join('')
  const fills = list.map(p => `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${p.fill}"/>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 0 18 29" shape-rendering="crispEdges">${outline}${fills}</svg>`
}

export const avatarSrc = profile => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(avatarSvg(profile))}`
