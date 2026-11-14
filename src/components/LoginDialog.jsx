import { useEffect, useRef, useState } from 'react'
import { Button } from './UI.jsx'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginDialog({ open, onClose, onLogin }) {
  const dialog = useRef(null)
  const emailInput = useRef(null)
  const nameInput = useRef(null)
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const node = dialog.current
    if (open && !node.open) {
      node.showModal()
      requestAnimationFrame(() => emailInput.current?.focus())
    } else if (!open && node.open) node.close()
  }, [open])

  function submit(event) {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedName = name.trim()
    const issues = {}
    if (mode === 'register' && ([...normalizedName].length < 2 || [...normalizedName].length > 20)) issues.name = 'Usá entre 2 y 20 caracteres.'
    if (email.length > 254 || !EMAIL_PATTERN.test(normalizedEmail)) issues.email = 'Ingresá un mail válido, como nombre@dominio.com.'
    if (password.length < 8) issues.password = 'Usá al menos 8 caracteres.'
    if (mode === 'register' && passwordConfirmation !== password) issues.passwordConfirmation = 'Las contraseñas tienen que coincidir.'
    setErrors(issues)
    if (Object.keys(issues).length) {
      dialog.current?.querySelector('[aria-invalid="true"]')?.focus()
      return
    }
    const result = onLogin({ email: normalizedEmail, name: normalizedName, mode })
    if (typeof result === 'string') {
      setErrors({ form: result })
      return
    }
    setPassword('')
    setPasswordConfirmation('')
    setErrors({})
  }

  function close() {
    setMode('login')
    setPassword('')
    setPasswordConfirmation('')
    setErrors({})
    onClose()
  }

  function switchMode(nextMode) {
    setMode(nextMode)
    setErrors({})
    requestAnimationFrame(() => (nextMode === 'register' ? nameInput.current : emailInput.current)?.focus())
  }

  return <dialog ref={dialog} className="login-dialog" aria-labelledby="login-title" onCancel={event => { event.preventDefault(); close() }} onClick={event => { if (event.target === dialog.current) close() }}>
    <form className="login-form" onSubmit={submit} noValidate>
      <button className="login-close" type="button" onClick={close} aria-label="Cerrar inicio de sesión">×</button>
      <span className="login-kicker">{mode === 'login' ? 'EL TURNO TE ESPERA' : 'TU TURNO EMPIEZA ACÁ'}</span>
      <h2 id="login-title">{mode === 'login' ? 'INICIÁ SESIÓN' : 'CREÁ TU CUENTA'}</h2>
      <p className="login-lead">Guardá tus cards, tu avatar y tu lugar en el muro de la fama.</p>

      {mode === 'register' && <>
        <label className="login-field" htmlFor="register-name">Nombre
          <input ref={nameInput} id="register-name" name="name" value={name} maxLength={20} autoComplete="name" placeholder="¿Cómo te llamás?" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'register-name-error' : undefined} onChange={event => { setName(event.target.value); setErrors(value => ({ ...value, name: undefined, form: undefined })) }} />
        </label>
        {errors.name && <p id="register-name-error" className="field-error" role="alert">{errors.name}</p>}
      </>}

      <label className="login-field" htmlFor="login-email">Mail
        <input ref={emailInput} id="login-email" name="email" type="email" value={email} maxLength={254} autoComplete="email" placeholder="nombre@dominio.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'login-email-error' : undefined} onChange={event => { setEmail(event.target.value); setErrors(value => ({ ...value, email: undefined, form: undefined })) }} />
      </label>
      {errors.email && <p id="login-email-error" className="field-error" role="alert">{errors.email}</p>}

      <label className="login-field" htmlFor="login-password">Contraseña
        <input id="login-password" name="password" type="password" value={password} minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'login' ? 'Ingresá tu contraseña' : 'Creá una contraseña'} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'login-password-error' : 'login-password-hint'} onChange={event => { setPassword(event.target.value); setErrors(value => ({ ...value, password: undefined, form: undefined })) }} />
      </label>
      {errors.password ? <p id="login-password-error" className="field-error" role="alert">{errors.password}</p> : <p id="login-password-hint" className="login-hint">Usá al menos 8 caracteres. Tu contraseña no se guarda.</p>}

      {mode === 'register' && <>
        <label className="login-field" htmlFor="register-password-confirmation">Confirmar contraseña
          <input id="register-password-confirmation" name="passwordConfirmation" type="password" value={passwordConfirmation} minLength={8} autoComplete="new-password" placeholder="Repetí tu contraseña" aria-invalid={Boolean(errors.passwordConfirmation)} aria-describedby={errors.passwordConfirmation ? 'register-password-confirmation-error' : undefined} onChange={event => { setPasswordConfirmation(event.target.value); setErrors(value => ({ ...value, passwordConfirmation: undefined, form: undefined })) }} />
        </label>
        {errors.passwordConfirmation && <p id="register-password-confirmation-error" className="field-error" role="alert">{errors.passwordConfirmation}</p>}
      </>}

      {errors.form && <p className="login-form-error" role="alert">{errors.form}</p>}
      <Button className="login-submit" type="submit">{mode === 'login' ? 'Iniciar sesión y entrar' : 'Crear cuenta y armar mi barista'}</Button>
      <p className="login-first-time">{mode === 'login' ? '¿No tenés una cuenta?' : '¿Ya tenés una cuenta?'} <button className="login-switch" type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}</button></p>
    </form>
  </dialog>
}
