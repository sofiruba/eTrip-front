import { useState } from 'react'

function Auth({ mode, onClose, onSuccess }) {
  const [login, setLogin] = useState(mode === 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [interests, setInterests] = useState([])
  const interestOptions = ['Gastronomía', 'Arte & salidas', 'Escapadas', 'Música', 'Bienestar', 'Deportes']

  const fillDemo = (role) => {
    setLogin(true)
    setName('')
    setEmail(role === 'ADMIN' ? 'admin@plan.com' : 'sofia@plan.com')
    setPassword('123456')
    setError('')
  }

  const submit = (event) => {
    event.preventDefault()
    if (!login && step === 1) {
      if (!email || !password || !name) {
        setError('Completá todos los campos obligatorios.')
        return
      }
      setError('')
      setStep(2)
      return
    }
    if (!email || !password || (!login && !name)) {
      setError('Completá todos los campos obligatorios.')
      return
    }
    const isAdmin = email.toLowerCase() === 'admin@plan.com'
    if (login && !['sofia@plan.com', 'admin@plan.com'].includes(email.toLowerCase())) {
      setError('Para esta demo usá uno de los accesos rápidos.')
      return
    }
    onSuccess({
      name: login ? (isAdmin ? 'Admin PLAN' : 'Sofía Rubachin') : name,
      email,
      role: isAdmin ? 'ADMIN' : 'CLIENTE',
      interests: login ? ['Gastronomía', 'Escapadas', 'Arte & salidas'] : interests,
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="brand modal-brand">PLAN<span>✦</span></div>
        <h2>{login ? 'Qué bueno verte.' : step === 1 ? 'Empezá tu próximo plan.' : '¿Qué te gusta hacer?'}</h2>
        <p>{login ? 'Ingresá con una cuenta demo para explorar la app.' : step === 1 ? 'Creá una cuenta para guardar y reservar experiencias.' : 'Elegí al menos dos intereses y te mostramos planes para vos.'}</p>
        <div className="demo-access">
          <button type="button" onClick={() => fillDemo('CLIENTE')}><strong>Entrar como cliente</strong><small>sofia@plan.com</small></button>
          <button type="button" onClick={() => fillDemo('ADMIN')}><strong>Entrar como admin</strong><small>admin@plan.com</small></button>
        </div>
        <div className="auth-divider"><span>o {login ? 'ingresá' : 'registrate'} manualmente</span></div>
        <form onSubmit={submit}>
          {!login && step === 1 && <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre completo" />}
          {(login || step === 1) && <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email o username" type="email" />}
          {(login || step === 1) && <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña" type="password" />}
          {!login && step === 2 && <div className="interest-picker">{interestOptions.map((interest) => <button type="button" className={interests.includes(interest) ? 'selected' : ''} key={interest} onClick={() => setInterests((items) => items.includes(interest) ? items.filter((item) => item !== interest) : [...items, interest])}>{interest}<span>{interests.includes(interest) ? '✓' : '+'}</span></button>)}</div>}
          {error && <p className="auth-error">{error}</p>}
          <button className="primary-button full" type="submit">{login ? 'Iniciar sesión' : step === 1 ? 'Continuar' : 'Crear mi perfil'} →</button>
        </form>
        <button className="switch-auth" onClick={() => { setLogin(!login); setStep(1); setError('') }}>{login ? '¿No tenés cuenta? Registrate' : 'Ya tengo una cuenta'}</button>
      </div>
    </div>
  )
}

export default Auth
