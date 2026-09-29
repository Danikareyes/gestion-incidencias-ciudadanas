import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { formatearFecha } from '../lib/formato'
import type { Estado } from '../lib/estados'
import EtiquetaEstado from '../components/EtiquetaEstado'

type ReporteResumen = {
  id: string
  codigo_seguimiento: string
  titulo: string
  estado: Estado
  direccion: string | null
  created_at: string
  categorias: { nombre: string; color: string | null } | null
}

export default function MisReportes() {
  const { session } = useAuth()
  const [reportes, setReportes] = useState<ReporteResumen[] | null>(null)
  const [error, setError] = useState('')

  const usuarioId = session?.user.id

  useEffect(() => {
    if (!supabase || !usuarioId) return
    supabase
      .from('reportes')
      .select('id, codigo_seguimiento, titulo, estado, direccion, created_at, categorias(nombre, color)')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError('No pudimos cargar tus reportes. Recarga la página.')
        else setReportes((data ?? []) as unknown as ReporteResumen[])
      })
  }, [usuarioId])

  if (error) {
    return <p role="alert" className="rounded-lg bg-senal-tenue px-3 py-2 text-senal">{error}</p>
  }

  if (!reportes) {
    return <p className="text-gris">Cargando tus reportes…</p>
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold text-civico">Mis reportes</h1>
        <Link to="/reportar" className="rounded-xl bg-senal px-4 py-2 font-bold text-white">
          + Nuevo reporte
        </Link>
      </div>

      {reportes.length === 0 ? (
        <div className="rounded-2xl border border-bordillo bg-white p-8 text-center">
          <p className="font-semibold">Todavía no has creado reportes.</p>
          <p className="mt-1 text-sm text-gris">Cuando veas un problema en tu ciudad, repórtalo aquí.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reportes.map((reporte) => (
            <li key={reporte.id}>
              <Link
                to={`/mis-reportes/${reporte.id}`}
                className="flex items-start gap-4 rounded-2xl border border-bordillo bg-white p-4 hover:border-civico"
              >
                <span
                  className="mt-1 h-4 w-4 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: reporte.categorias?.color ?? '#5B6470' }}
                />
                <div className="min-w-0 flex-grow space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{reporte.titulo}</span>
                    <EtiquetaEstado estado={reporte.estado} />
                  </div>
                  <p className="text-sm text-gris">
                    {reporte.categorias?.nombre}
                    {reporte.direccion ? ` · ${reporte.direccion}` : ''}
                  </p>
                  <p className="font-mono text-xs text-gris">
                    {reporte.codigo_seguimiento} · {formatearFecha(reporte.created_at)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}