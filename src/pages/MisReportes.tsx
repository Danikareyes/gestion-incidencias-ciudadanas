import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { urlFoto } from '../lib/fotos'
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
  fotos_reporte: { storage_path: string; tipo: 'evidencia' | 'resolucion' }[]
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
      .select(`id, codigo_seguimiento, titulo, estado, direccion, created_at,
               categorias(nombre, color), fotos_reporte(storage_path, tipo)`)
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
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-civico">Mis reportes</h1>
          <p className="text-gris">
            {reportes.length === 1 ? '1 reporte enviado' : `${reportes.length} reportes enviados`}
          </p>
        </div>
        <Link to="/reportar" className="rounded-xl bg-senal px-5 py-3 font-bold text-white">
          + Nuevo reporte
        </Link>
      </div>

      {reportes.length === 0 ? (
        <div className="rounded-2xl border border-bordillo bg-white p-10 text-center">
          <p className="font-semibold">Todavía no has creado reportes.</p>
          <p className="mt-1 text-sm text-gris">Cuando veas un problema en tu ciudad, repórtalo aquí.</p>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {reportes.map((reporte) => {
            const foto = reporte.fotos_reporte.find((f) => f.tipo === 'evidencia')
            return (
              <li key={reporte.id}>
                <Link
                  to={`/mis-reportes/${reporte.id}`}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border border-bordillo bg-white hover:border-civico"
                >
                  {foto ? (
                    <img src={urlFoto(foto.storage_path)} alt="" className="h-44 w-full object-cover" />
                  ) : (
                    <div className="h-44 bg-papel" />
                  )}
                  <div className="flex flex-grow flex-col gap-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold">{reporte.titulo}</span>
                      <EtiquetaEstado estado={reporte.estado} />
                    </div>
                    <p className="flex items-center gap-2 text-sm text-gris">
                      <span className="h-3 w-3 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: reporte.categorias?.color ?? '#5B6470' }} />
                      {reporte.categorias?.nombre}
                      {reporte.direccion ? ` · ${reporte.direccion}` : ''}
                    </p>
                    <p className="mt-auto pt-2 font-mono text-xs text-gris">
                      {reporte.codigo_seguimiento} · {formatearFecha(reporte.created_at)}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}