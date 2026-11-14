import { useState } from 'react'
import { HAIR, APRONS, GENDERS, DEFAULT_PROFILE, validateProfile } from '../game/data.js'
import { readStorage } from '../game/storage.js'
import Avatar from './Avatar.jsx'
import { Button } from './UI.jsx'


function savedProfile(profile) {
  const saved = profile ?? readStorage('habbo-coffee-profile', {})
  return Object.fromEntries(Object.entries(DEFAULT_PROFILE).map(([key, fallback]) => [key, typeof saved?.[key] === 'string' ? saved[key] : fallback]))
}
export default function Profile({ previous, onStart, onBack, editor = false }) {
  const [profile, setProfile] = useState(() => savedProfile(previous))
  const [errors, setErrors] = useState({})
  function update(key, value) { setProfile(p => ({ ...p, [key]: value })); setErrors(e => ({ ...e, [key]: undefined })) }
  function submit(event) {
    event.preventDefault()
    const issues = validateProfile(profile)
    setErrors(issues)
    if (Object.keys(issues).length) { document.getElementById(Object.keys(issues)[0])?.focus(); return }
    onStart(profile)
  }
  return <section className="sb-form-wrap">
    <form onSubmit={submit} noValidate>
      <div className="sb-form-layout"><div className="sb-form-fields">
        <label htmlFor="name">Nombre<input id="name" name="name" value={profile.name} maxLength={40} autoComplete="given-name" placeholder="¿Cómo te llamás?" onChange={e => update('name', e.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : 'name-hint'} /></label>
        {errors.name ? <p id="name-error" className="field-error" role="alert">{errors.name}</p> : <small id="name-hint">De 2 a 20 caracteres. Este nombre aparece en el juego.</small>}
        <label htmlFor="email">Mail<input id="email" name="email" type="email" value={profile.email} maxLength={254} autoComplete="email" placeholder="nombre@dominio.com" onChange={e => update('email', e.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : 'email-hint'} /></label>
        {errors.email && <p id="email-error" className="field-error" role="alert">{errors.email}</p>}
        <small id="email-hint">Tu mail queda guardado solo en este navegador para reconocer tu cuenta.</small>
        <fieldset><legend>Género</legend><div className="choices genders">{GENDERS.map(gender => <label key={gender} className={`choice ${profile.gender === gender ? 'selected' : ''}`}><input type="radio" name="gender" value={gender} checked={profile.gender === gender} onChange={() => update('gender', gender)} /><span>{gender}</span></label>)}</div></fieldset>
        <fieldset><legend>Color de pelo</legend><div className="choices">{Object.entries(HAIR).map(([name, color]) => <label key={name} className={`choice swatch ${profile.hair === name ? 'selected' : ''}`} style={{ '--swatch': color, '--swatch-text': ['Castaño', 'Negro'].includes(name) ? '#fffcf3' : '#102b24' }}><input type="radio" name="hair" value={name} checked={profile.hair === name} onChange={() => update('hair', name)} /><span>{name}{profile.hair === name ? ' ✓' : ''}</span></label>)}</div></fieldset>
        <fieldset><legend>Color de delantal</legend><div className="choices">{Object.entries(APRONS).map(([name, color]) => <label key={name} className={`choice swatch ${profile.apron === name ? 'selected' : ''}`} style={{ '--swatch': color, '--swatch-text': name === 'Crema' ? '#102b24' : '#fffcf3' }}><input type="radio" name="apron" value={name} checked={profile.apron === name} onChange={() => update('apron', name)} /><span>{name}{profile.apron === name ? ' ✓' : ''}</span></label>)}</div></fieldset>
      </div><aside className="sb-form-preview"><span>TU BARISTA</span><Avatar profile={profile} /><h3>{profile.name.trim() || 'TU NOMBRE'}</h3><p>Tu avatar y tu nombre te acompañan en los tres turnos.</p><dl><div><dt>Género</dt><dd>{profile.gender}</dd></div><div><dt>Pelo</dt><dd>{profile.gender === 'Prefiero no decirlo' ? 'Sin pelo' : profile.hair}</dd></div><div><dt>Delantal</dt><dd>{profile.apron}</dd></div></dl></aside></div>
      <div className="sb-actions"><Button type="submit">{editor ? 'Guardar cambios' : 'Guardar y entrar al café'}</Button><Button type="button" secondary onClick={onBack}>{editor ? 'Cancelar' : 'Volver'}</Button></div>
    </form>
  </section>
}
