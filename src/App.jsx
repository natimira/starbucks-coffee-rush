import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { currentOrder, gameReducer, initialState, isHappyHourActive } from './game/engine.js'
import { DEFAULT_PROFILE, INGREDIENTS } from './game/data.js'
import { readStorage, writeStorage } from './game/storage.js'
import { recordScore, useRanking } from './game/ranking.js'
import Profile from './components/Profile.jsx'
import LoginDialog from './components/LoginDialog.jsx'
import ArcadeFeedback from './components/ArcadeFeedback.jsx'
import Exterior from './world/Exterior.jsx'
import Hub from './world/Hub.jsx'
import Play from './world/Play.jsx'
import { Panel } from './world/UI.jsx'
import { HowToPanel, RankingPanel, LockerPanel } from './world/Panels.jsx'
import './world.css'
import { useArcadeAudio } from './useArcadeAudio.js'

const PLAY_SCREENS = ['briefing', 'countdown', 'game', 'levelComplete', 'results']

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState, initial => {
    const value = readStorage('habbo-coffee-record', 0)
    const saved = readStorage('habbo-coffee-progress-v1', {})
    // El juego siempre arranca sin sesión: la historia del gerente y el inicio de sesión van primero.
    return { ...initial, bestScore: typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0,
      careerOrders: Number(saved.totalOrders) || 0,
      bestPerfectOrderStreak: Number(saved.bestPerfectOrderStreak) || 0,
      fastestDrink: Number.isFinite(saved.fastestDrink) ? saved.fastestDrink : null,
      level2Thirty: saved.level2Thirty === true, level3Thirty: saved.level3Thirty === true,
      currentOrderStreak: Number(saved.currentOrderStreak) || 0,
      expressOrders: Number(saved.expressOrders) || 0,
      happyHourExpress: saved.happyHourExpress === true,
      rushMastered: saved.rushMastered === true }
  })
  const [interrupted] = useState(() => readStorage('habbo-coffee-active', false, true) === true)
  const [loginOpen, setLoginOpen] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [pendingName, setPendingName] = useState('')
  const [panel, setPanel] = useState(null) // 'how' | 'ranking' | 'locker' | 'edit'
  const ranking = useRanking()
  const progress = useMemo(() => ({ totalOrders: state.careerOrders,
    bestPerfectOrderStreak: state.bestPerfectOrderStreak, fastestDrink: state.fastestDrink,
    level2Thirty: state.level2Thirty, level3Thirty: state.level3Thirty,
    currentOrderStreak: state.currentOrderStreak, expressOrders: state.expressOrders,
    happyHourExpress: state.happyHourExpress, rushMastered: state.rushMastered }),
  [state.careerOrders, state.bestPerfectOrderStreak, state.fastestDrink, state.level2Thirty, state.level3Thirty, state.currentOrderStreak, state.expressOrders, state.happyHourExpress, state.rushMastered])
  const send = useCallback(action => dispatch({ ...action, now: performance.now() }), [])
  const inCafe = ['account', 'profile'].includes(state.screen)
  const { enabled: soundEnabled, start: startAudio, toggle: toggleAudio, playIngredient } = useArcadeAudio({
    active: ['countdown', 'game'].includes(state.screen) || inCafe || state.screen === 'home', paused: state.paused,
    calm: !['countdown', 'game'].includes(state.screen),
    intense: state.screen === 'game' && (state.remaining <= 20_000 || isHappyHourActive(state) || currentOrder(state)?.rush === true),
    scoreEvent: state.scoreEvent, rewardEvent: state.rewardEvent, screen: state.screen,
  })
  const navigate = screen => { setPanel(null); send({ type: 'NAVIGATE', screen }) }

  // Entrar por la puerta: sin sesión se pide iniciar sesión; con sesión se pasa al café.
  function enterCafe() {
    startAudio()
    if (state.profile) { setPanel(null); send({ type: 'GO_ACCOUNT' }) } else setLoginOpen(true)
  }
  function login({ email, name, mode }) {
    const account = readStorage('habbo-coffee-account-v1', null)
    if (mode === 'login' && account?.email === email && account.profile?.name) {
      setLoginOpen(false)
      send({ type: 'ACCOUNT_LOGIN', profile: { ...account.profile, email }, progress })
      return
    }
    if (mode === 'login') return 'No encontramos una cuenta con ese mail. Podés crear una nueva.'
    if (account?.email === email) return 'Ese mail ya tiene una cuenta. Iniciá sesión para continuar.'
    setLoginOpen(false)
    setPendingEmail(email)
    setPendingName(name)
    navigate('profile')
  }
  function startWithProfile(profile) {
    const completeProfile = { ...profile, email: pendingEmail || profile.email }
    writeStorage('habbo-coffee-account-v1', {
      email: completeProfile.email.toLowerCase(),
      profile: Object.fromEntries(Object.entries(completeProfile).filter(([key]) => key !== 'email')),
    })
    setPendingEmail('')
    setPendingName('')
    send({ type: 'PROFILE_READY', profile: completeProfile })
  }
  function updateProfile(profile) {
    writeStorage('habbo-coffee-account-v1', {
      email: profile.email.toLowerCase(),
      profile: Object.fromEntries(Object.entries(profile).filter(([key]) => key !== 'email')),
    })
    setPanel(null)
    send({ type: 'UPDATE_PROFILE', profile })
  }
  function logout() {
    setPanel(null)
    send({ type: 'LOGOUT' })
  }

  useEffect(() => {
    if (state.screen !== 'game' || state.paused) return
    const interval = setInterval(() => send({ type: 'TICK' }), 50)
    return () => clearInterval(interval)
  }, [state.screen, state.paused, send])

  useEffect(() => {
    if (state.screen !== 'countdown') return
    const delay = state.countdown === 0 ? 1100 : 1000
    const timeout = setTimeout(() => send({ type: 'COUNTDOWN_TICK' }), delay)
    return () => clearTimeout(timeout)
  }, [state.screen, state.countdown, send])

  useEffect(() => {
    function hidden() { if (document.hidden) send({ type: 'PAUSE' }) }
    function keyboard(event) {
      if (state.screen !== 'game' || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
      if (event.target.closest('input, textarea, select, [contenteditable=true]')) return
      if (event.key === 'Escape') { if (!state.paused) { event.preventDefault(); send({ type: 'PAUSE' }) }; return }
      if (state.paused) return
      const ingredient = INGREDIENTS[Number(event.key) - 1]
      if (/^[1-6]$/.test(event.key) && ingredient) { event.preventDefault(); if (state.phase === 'idle') playIngredient(ingredient.id); send({ type: 'ADD', ingredient: ingredient.id }) }
      // Evita que Enter entregue y active a la vez el botón de ingrediente enfocado.
      if (event.key === 'Enter') { event.preventDefault(); send({ type: 'DELIVER' }) }
    }
    document.addEventListener('visibilitychange', hidden)
    window.addEventListener('keydown', keyboard)
    return () => { document.removeEventListener('visibilitychange', hidden); window.removeEventListener('keydown', keyboard) }
  }, [state.screen, state.paused, state.phase, send, playIngredient])

  useEffect(() => {
    writeStorage('habbo-coffee-active', ['briefing', 'countdown', 'game'].includes(state.screen) || state.returnScreen === 'game', true)
  }, [state.screen, state.returnScreen])
  useEffect(() => {
    if (state.profile) {
      // El mail queda solo en memoria; las preferencias visuales sí se recuerdan.
      const { name, gender, hair, apron } = state.profile
      writeStorage('habbo-coffee-profile', { name, gender, hair, apron })
    }
  }, [state.profile])
  useEffect(() => {
    if (state.screen !== 'results' && state.screen !== 'levelComplete') return
    writeStorage('habbo-coffee-record', state.bestScore)
    if (state.profile) recordScore({ email: state.profile.email, name: state.profile.name, score: state.score, date: new Date().toISOString() })
  }, [state.screen, state.bestScore, state.score, state.profile])
  useEffect(() => { writeStorage('habbo-coffee-progress-v1', progress) }, [progress])

  const closePanel = useCallback(() => setPanel(null), [])
  const hubPanels = <>
    {panel === 'how' && <HowToPanel onClose={closePanel} />}
    {panel === 'ranking' && <RankingPanel ranking={ranking} profile={state.profile} onClose={closePanel} />}
    {panel === 'locker' && state.profile && <LockerPanel profile={state.profile} progress={progress} currentStreak={state.currentOrderStreak} bestScore={state.bestScore} onEdit={() => setPanel('edit')} onLogout={logout} onClose={closePanel} />}
    {panel === 'edit' && state.profile && <Panel title="EDITAR AVATAR" kicker="VESTUARIO" tone="paper" onClose={closePanel}><Profile previous={state.profile} onStart={updateProfile} onBack={closePanel} editor /></Panel>}
  </>

  return <>
    {state.screen === 'home' && <Exterior profile={state.profile} interrupted={interrupted} bestScore={state.bestScore} soundEnabled={soundEnabled} onToggleSound={toggleAudio} onEnter={enterCafe} onHow={() => setPanel('how')}>
      {panel === 'how' && <HowToPanel onClose={closePanel} />}
    </Exterior>}

    {state.screen === 'profile' && <Hub dimmed profile={{ ...DEFAULT_PROFILE, name: pendingName || 'Nuevo barista' }} ranking={ranking} soundEnabled={soundEnabled} onToggleSound={toggleAudio} onExit={() => navigate('home')}>
      <Panel title="VESTUARIO" kicker="ANTES DE TU PRIMER TURNO" tone="paper" onClose={() => navigate('home')}>
        <Profile previous={{ name: pendingName, email: pendingEmail }} onStart={startWithProfile} onBack={() => navigate('home')} />
      </Panel>
    </Hub>}

    {state.screen === 'account' && state.profile && <Hub dimmed={panel !== null} profile={state.profile} ranking={ranking} soundEnabled={soundEnabled} onToggleSound={toggleAudio}
      onPlay={() => { setPanel(null); startAudio(); send({ type: 'START_ACCOUNT', progress }) }}
      onHow={() => setPanel('how')} onRanking={() => setPanel('ranking')} onLocker={() => setPanel('locker')} onExit={() => navigate('home')}>
      {hubPanels}
    </Hub>}

    {PLAY_SCREENS.includes(state.screen) && <Play state={state} send={send} onIngredient={playIngredient} ranking={ranking}
      soundEnabled={soundEnabled} onToggleSound={toggleAudio}
      onReady={() => { startAudio(); send({ type: 'START_COUNTDOWN' }) }} onNext={() => send({ type: 'NEXT_LEVEL' })} />}

    <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={login} />
    <ArcadeFeedback scoreEvent={state.scoreEvent} rewardEvent={state.rewardEvent} />
  </>
}
