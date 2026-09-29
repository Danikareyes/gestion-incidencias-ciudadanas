import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import PantallaAcceso from '../components/PantallaAcceso'
const claseCampo =
  'h-11 w-full rounded-lg border border-bordillo bg-white px-3 text-base focus:border-civico focus:outline-none'

export default function NuevaContrasena() {
  const { session, cargando } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [listo, setListo] = useState(false)

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!supabase) return
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setGuardando(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setGuardando(false)
    if (error) {
      setError('No pudimos cambiar la contraseña. Prueba con otra diferente a la anterior.')
    } else {
      setListo(true)
    }
  }

  if (cargando) return <p className="text-gris">Verificando el enlace…</p>

  if (listo) {
    return (
      <section className="mx-auto max-w-sm space-y-4 rounded-2xl border border-bordillo bg-white p-6">
        <h1 className="text-2xl font-extrabold text-resuelto">Contraseña actualizada</h1>
        <p className="text-gris">Ya puedes usar tu nueva contraseña.</p>
        <Link to="/" className="inline-block rounded-xl bg-civico px-5 py-3 font-bold text-white">
          Ir al inicio
        </Link>
      </section>
    )
  }

  if (!session) {
    return (
      <section className="mx-auto max-w-sm space-y-3">
        <h1 className="text-2xl font-extrabold text-civico">Enlace no válido</h1>
        <p className="text-gris">
          El enlace expiró, ya se usó o se abrió en otro navegador.
        </p>
        <Link to="/recuperar" className="font-semibold text-civico underline">Solicitar un enlace nuevo</Link>
      </section>
    )
  }

  return (
      <PantallaAcceso titulo="Nueva contraseña">
      <form onSubmit={guardar} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-semibold text-gris">Nueva contraseña (mínimo 8 caracteres)</label>
          <input id="password" type="password" required autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} className={claseCampo} />
        </div>
        <div className="space-y-1">
          <label htmlFor="confirmacion" className="text-sm font-semibold text-gris">Repite la contraseña</label>
          <input id="confirmacion" type="password" required autoComplete="new-password" value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)} className={claseCampo} />
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-senal-tenue px-3 py-2 text-sm text-senal">{error}</p>
        )}
        <button type="submit" disabled={guardando}
          className="h-12 w-full rounded-xl bg-civico font-bold text-white disabled:opacity-60">
          {guardando ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </PantallaAcceso>
  )
}