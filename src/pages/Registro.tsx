import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
   import PantallaAcceso from '../components/PantallaAcceso'

const claseCampo =
  'h-11 w-full rounded-lg border border-bordillo bg-white px-3 text-base focus:border-civico focus:outline-none'

function traducirError(mensaje: string) {
  const texto = mensaje.toLowerCase()
  if (texto.includes('already registered')) return 'Ese correo ya tiene una cuenta. Inicia sesión.'
  if (texto.includes('signups not allowed')) return 'El registro de usuarios está desactivado en Supabase.'
  if (texto.includes('confirmation email')) return 'No se pudo enviar el correo de confirmación. Desactiva "Confirm email" en Supabase.'
  if (texto.includes('rate limit')) return 'Demasiados intentos. Espera unos minutos y vuelve a probar.'
  if (texto.includes('password')) return 'La contraseña no cumple los requisitos de seguridad.'
  if (texto.includes('invalid')) return 'El correo no es válido.'
  if (texto.includes('database error')) return 'Error al crear el perfil en la base de datos.'
  return `No pudimos crear la cuenta (${mensaje}).`
}

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
      console.error('Error de registro:', error)
      setError(traducirError(error.message))
    } else if (!data.session) {
      setMensaje('Cuenta creada. Revisa tu correo para confirmarla.')
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
      <PantallaAcceso titulo="Crear cuenta">
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
      </PantallaAcceso>
  )
}