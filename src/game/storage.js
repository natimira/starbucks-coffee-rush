// La app sigue funcionando si el navegador bloquea o llena el almacenamiento.
export function readStorage(key, fallback, session = false) {
  try { const value = (session ? sessionStorage : localStorage).getItem(key); return value === null ? fallback : JSON.parse(value) }
  catch { return fallback }
}
export function writeStorage(key, value, session = false) {
  try { (session ? sessionStorage : localStorage).setItem(key, JSON.stringify(value)) } catch { /* Juego sin persistencia. */ }
}

// Borrado único de los datos guardados (cuentas, progreso, récord, ranking). Para volver a
// empezar de cero en todos los navegadores, subir el número de RESET_VERSION.
const RESET_VERSION = '2'
export function resetSavedDataOnce() {
  try {
    if (localStorage.getItem('habbo-coffee-reset') === RESET_VERSION) return
    const sound = localStorage.getItem('habbo-coffee-sound-v1')
    for (const key of Object.keys(localStorage)) if (key.startsWith('habbo-coffee-')) localStorage.removeItem(key)
    for (const key of Object.keys(sessionStorage)) if (key.startsWith('habbo-coffee-')) sessionStorage.removeItem(key)
    if (sound !== null) localStorage.setItem('habbo-coffee-sound-v1', sound)
    localStorage.setItem('habbo-coffee-reset', RESET_VERSION)
  } catch { /* Sin almacenamiento no hay nada que borrar. */ }
}
