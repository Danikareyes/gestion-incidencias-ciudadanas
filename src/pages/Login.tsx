import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const claseCampo =
  'h-11 w-full rounded-lg border border-bordillo bg-white px-3 text-base focus:border-civico focus:outline-none'

export default function Login() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destino = (location.state as { desde?: string } | null)?.desde ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (session) return <Navigate to={destino} replace />

  async function iniciarSesion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!supabase) return
    setEnviando(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setEnviando(false)
    if (error) {
      setError('Correo o contraseña incorrectos.')
    } else {
      navigate(destino, { replace: true })
    }
  }

  return (
    <section className="mx-auto max-w-sm space-y-6">
      <h1 className="text-3xl font-extrabold text-civico">Iniciar sesión</h1>

      <form onSubmit={iniciarSesion} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-semibold text-gris">Correo</label>
          <input id="email" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} className={claseCampo} />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-semibold text-gris">Contraseña</label>
          <input id="password" type="password" required autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} className={claseCampo} />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-senal-tenue px-3 py-2 text-sm text-senal">{error}</p>
        )}

        <button type="submit" disabled={enviando}
          className="h-12 w-full rounded-xl bg-civico font-bold text-white disabled:opacity-60">
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="text-sm text-gris">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-civico underline">Regístrate</Link>
      </p>
    </section>
  )
}