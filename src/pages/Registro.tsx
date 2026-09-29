import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const claseCampo =
  'h-11 w-full rounded-lg border border-bordillo bg-white px-3 text-base focus:border-civico focus:outline-none'

export default function Registro() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function registrarse(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!supabase) return
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setEnviando(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre },
        emailRedirectTo: window.location.origin + import.meta.env.BASE_URL,
      },
    })
    setEnviando(false)
    if (error) {
      setError('No pudimos crear la cuenta. Revisa los datos o prueba con otro correo.')
    } else if (!data.session) {
      setMensaje('Cuenta creada. Revisa tu correo para confirmarla.')
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <section className="mx-auto max-w-sm space-y-6">
      <h1 className="text-3xl font-extrabold text-civico">Crear cuenta</h1>

      <form onSubmit={registrarse} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="nombre" className="text-sm font-semibold text-gris">Nombre</label>
          <input id="nombre" type="text" required autoComplete="name"
            value={nombre} onChange={(e) => setNombre(e.target.value)} className={claseCampo} />
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-semibold text-gris">Correo</label>
          <input id="email" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} className={claseCampo} />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-semibold text-gris">Contraseña (mínimo 8 caracteres)</label>
          <input id="password" type="password" required autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)} className={claseCampo} />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-senal-tenue px-3 py-2 text-sm text-senal">{error}</p>
        )}
        {mensaje && (
          <p role="status" className="rounded-lg bg-civico-niebla px-3 py-2 text-sm text-civico">{mensaje}</p>
        )}

        <button type="submit" disabled={enviando}
          className="h-12 w-full rounded-xl bg-senal font-bold text-white disabled:opacity-60">
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="text-sm text-gris">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-civico underline">Inicia sesión</Link>
      </p>
    </section>
  )
}