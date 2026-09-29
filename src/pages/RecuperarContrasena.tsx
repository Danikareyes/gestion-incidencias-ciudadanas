import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase'

export default function RecuperarContrasena() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  async function solicitar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!supabase) return
    setEnviando(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + import.meta.env.BASE_URL + '#/nueva-contrasena',
    })
    setEnviando(false)
    if (error) {
      setError('No pudimos enviar el correo. Espera unos minutos e inténtalo de nuevo.')
    } else {
      setEnviado(true)
    }
  }

  return (
    <section className="mx-auto max-w-sm space-y-6">
      <h1 className="text-3xl font-extrabold text-civico">Recuperar contraseña</h1>

      {enviado ? (
        <div className="space-y-3 rounded-2xl border border-bordillo bg-white p-5">
          <p className="font-semibold">Revisa tu correo.</p>
          <p className="text-sm text-gris">
            Si existe una cuenta con <b>{email}</b>, te enviamos un enlace para crear una nueva contraseña.
            Ábrelo en <b>este mismo navegador</b>. Si no lo ves, revisa la carpeta de spam.
          </p>
        </div>
      ) : (
        <form onSubmit={solicitar} className="space-y-4">
          <p className="text-sm text-gris">Escribe el correo de tu cuenta y te enviaremos un enlace.</p>
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-semibold text-gris">Correo</label>
            <input id="email" type="email" required autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-lg border border-bordillo bg-white px-3 text-base focus:border-civico focus:outline-none" />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-senal-tenue px-3 py-2 text-sm text-senal">{error}</p>
          )}
          <button type="submit" disabled={enviando}
            className="h-12 w-full rounded-xl bg-civico font-bold text-white disabled:opacity-60">
            {enviando ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
      )}

      <Link to="/login" className="inline-block text-sm font-semibold text-civico underline">
        Volver a iniciar sesión
      </Link>
    </section>
  )
}