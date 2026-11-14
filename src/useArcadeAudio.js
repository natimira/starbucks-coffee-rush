import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'habbo-coffee-sound-v1'
const NORMAL_PATTERN = [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 349.23]
const RUSH_PATTERN = [392, 523.25, 659.25, 783.99, 659.25, 880, 783.99, 659.25]
const INGREDIENT_NOTES = {
  espresso: 196,
  milk: 261.63,
  caramel: 329.63,
  ice: 392,
  strawberry: 440,
  chocolate: 220,
}

function initialSoundPreference() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === null ? true : JSON.parse(saved) === true
  } catch { return true }
}

export function useArcadeAudio({ active, paused, intense, calm = false, scoreEvent, rewardEvent, screen }) {
  const [enabled, setEnabled] = useState(initialSoundPreference)
  const [started, setStarted] = useState(false)
  const contextRef = useRef(null)
  const masterRef = useRef(null)
  const noteRef = useRef(0)
  const scoreEventRef = useRef(null)
  const rewardEventRef = useRef(null)
  const screenRef = useRef(screen)
  const enabledRef = useRef(enabled)

  useEffect(() => { enabledRef.current = enabled }, [enabled])

  const ensureContext = useCallback(() => {
    if (!contextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return null
      const context = new AudioContext()
      const master = context.createGain()
      master.gain.value = 0.18
      master.connect(context.destination)
      contextRef.current = context
      masterRef.current = master
    }
    if (contextRef.current.state === 'suspended') contextRef.current.resume().catch(() => {})
    return contextRef.current
  }, [])

  const tone = useCallback((frequency, duration = 0.12, volume = 0.18, type = 'square', delay = 0) => {
    if (!enabledRef.current) return
    const context = ensureContext()
    if (!context || !masterRef.current) return
    const startAt = context.currentTime + delay
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, startAt)
    gain.gain.setValueAtTime(0.0001, startAt)
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
    oscillator.connect(gain)
    gain.connect(masterRef.current)
    oscillator.start(startAt)
    oscillator.stop(startAt + duration + 0.025)
  }, [ensureContext])

  const start = useCallback(() => {
    if (!enabledRef.current) return
    ensureContext()
    setStarted(true)
  }, [ensureContext])

  const playIngredient = useCallback(ingredient => {
    const note = INGREDIENT_NOTES[ingredient] ?? 261.63
    tone(note, 0.075, 0.16, ingredient === 'ice' ? 'square' : 'triangle')
    tone(note * 2, 0.045, 0.07, 'square', 0.025)
  }, [tone])

  const toggle = useCallback(() => {
    setEnabled(current => {
      const next = !current
      enabledRef.current = next
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* Preferencia opcional. */ }
      if (next) {
        ensureContext()
        setStarted(true)
        tone(523.25, 0.1, 0.16, 'square')
      }
      return next
    })
  }, [ensureContext, tone])

  useEffect(() => {
    if (!started || !enabled || !active || paused) return
    const pattern = intense ? RUSH_PATTERN : NORMAL_PATTERN
    const stepMs = intense ? 118 : calm ? 420 : 178
    const gain = calm ? 0.55 : 1
    const playStep = () => {
      const index = noteRef.current % pattern.length
      tone(pattern[index], intense ? 0.095 : calm ? 0.22 : 0.13, (intense ? 0.12 : 0.09) * gain, index % 4 === 0 && !calm ? 'square' : 'triangle')
      if (index % 2 === 0) tone(pattern[index] / 2, 0.08, 0.055 * gain, calm ? 'triangle' : 'square')
      noteRef.current += 1
    }
    playStep()
    const interval = window.setInterval(playStep, stepMs)
    return () => window.clearInterval(interval)
  }, [active, calm, enabled, intense, paused, started, tone])

  useEffect(() => {
    if (!started || !enabled || !scoreEvent || scoreEventRef.current === scoreEvent.id) return
    scoreEventRef.current = scoreEvent.id
    if (scoreEvent.kind === 'negative') {
      tone(196, 0.16, 0.28, 'sawtooth')
      tone(146.83, 0.2, 0.24, 'sawtooth', 0.12)
      tone(98, 0.25, 0.2, 'square', 0.27)
    } else {
      tone(659.25, 0.09, 0.2, 'square')
      tone(783.99, 0.12, 0.16, 'square', 0.07)
    }
  }, [enabled, scoreEvent, started, tone])

  useEffect(() => {
    if (!started || !enabled || !rewardEvent || rewardEventRef.current === rewardEvent.id) return
    rewardEventRef.current = rewardEvent.id
    ;[523.25, 659.25, 783.99, 1046.5].forEach((note, index) => tone(note, 0.22, 0.25, 'square', index * 0.11))
  }, [enabled, rewardEvent, started, tone])

  useEffect(() => {
    if (!started || !enabled || screenRef.current === screen) return
    const previous = screenRef.current
    screenRef.current = screen
    if (screen === 'levelComplete') {
      ;[392, 523.25, 659.25].forEach((note, index) => tone(note, 0.2, 0.2, 'square', index * 0.12))
    } else if (screen === 'results' && previous === 'game') {
      tone(261.63, 0.18, 0.18, 'triangle')
      tone(196, 0.28, 0.18, 'triangle', 0.16)
    }
  }, [enabled, screen, started, tone])

  useEffect(() => () => {
    contextRef.current?.close().catch(() => {})
  }, [])

  return { enabled, start, toggle, playIngredient }
}
