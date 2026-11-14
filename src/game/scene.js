import { HAIR } from './data.js'

// Medidas de la escena de 960×540 (px de diseño).
export const STAGE_W = 960
export const STAGE_H = 540
export const CUP_X = 560 // centro del vaso de trabajo
export const JAR_X = index => 110 + index * 120

const SHIRTS = [['#f4c64e', '#c98f1a'], ['#ef735a', '#b8452f'], ['#92b8af', '#5d8a80'], ['#a99bf0', '#6d5bc8'], ['#7fb7f2', '#3f7fc4'], ['#e8e0cf', '#a89a78'], ['#f08fb6', '#c2557f'], ['#d9d9d9', '#7a8a8a']]
const GENDERS = ['Mujer', 'Hombre', 'No binario', 'Prefiero no decirlo']
const HAIRS = Object.keys(HAIR)
function hash(text) { let h = 7; for (const ch of String(text)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h }
export function customerProfile(id) {
  const h = hash(id), [shirt, clothes] = SHIRTS[h % SHIRTS.length]
  return { gender: GENDERS[(h >> 3) % GENDERS.length], hair: HAIRS[(h >> 5) % HAIRS.length], shirt, clothes }
}


// El gerente que cuenta la historia y da las indicaciones de cada turno.
export const MANAGER_PROFILE = { gender: 'Hombre', hair: 'Negro', shirt: '#f2f0eb', clothes: '#1E3932' }

// Bandas de color del fondo de la cafetería (fin de banda en y de la escena, color).
export const CAFE_BANDS = [[250, '#1E3932'], [372, '#6b4a2f'], [396, '#F2F0EB'], [540, '#00704A']]

// Fondo del café para recorrer: el salón con piso de baldosas bajo el mostrador.
export const HUB_BANDS = [[250, '#1E3932'], [372, '#6b4a2f'], [396, '#F2F0EB'], [412, '#00704A'], [540, '#d9cfb2']]
