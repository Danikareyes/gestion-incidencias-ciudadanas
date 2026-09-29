import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { supabase } from '../lib/supabase'
import { urlFoto } from '../lib/fotos'
import { formatearFecha } from '../lib/formato'
import type { Estado } from '../lib/estados'
import EtiquetaEstado from '../components/EtiquetaEstado'
import LineaTiempo, { type Evento } from '../components/LineaTiempo'

type Detalle = {
  id: string
  codigo_seguimiento: string
  titulo: string
  descripcion: string
  estado: Estado
  prioridad: string
  direccion: string | null
  lat: number
  lng: number
  created_at: string
  categorias: { nombre: string; color: string | null } | null
  fotos_reporte: { id: string; storage_path: string; tipo: 'evidencia' | 'resolucion' }[]
}

type FilaHistorial = { estado_nuevo: Estado | null; comentario: string | null; created_at: string }

export default function DetalleReporte() {
  const { id } = useParams<{ id: string }>()
  const [reporte, setReporte] = useState<Detalle | null>(null)
  const [eventos, setEventos] = useState<Evento[]>([])
  const [estadoCarga, setEstadoCarga] = useState<'cargando' | 'listo' | 'no-encontrado'>('cargando')
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!supabase || !id) return
    Promise.all([
      supabase
        .from('reportes')
        .select(`id, codigo_seguimiento, titulo, descripcion, estado, prioridad, direccion,
                 lat, lng, created_at, categorias(nombre, color), fotos_reporte(id, storage_path, tipo)`)
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('historial_estados')
        .select('estado_nuevo, comentario, created_at')
        .eq('reporte_id', id)
        .eq('campo_cambiado', 'estado')
        .order('created_at'),
    ]).then(([respuestaReporte, respuestaHistorial]) => {
      if (!respuestaReporte.data) {
        setEstadoCarga('no-encontrado')
        return
      }
      setReporte(respuestaReporte.data as unknown as Detalle)
      const filas = (respuestaHistorial.data ?? []) as FilaHistorial[]
      setEventos(filas.map((f) => ({ estado: f.estado_nuevo, comentario: f.comentario, fecha: f.created_at })))
      setEstadoCarga('listo')
    })
  }, [id])

  async function copiarCodigo() {
    if (!reporte) return
    await navigator.clipboard.writeText(reporte.codigo_seguimiento)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (estadoCarga === 'cargando') return <p className="text-gris">Cargando reporte…</p>

  if (estadoCarga === 'no-encontrado' || !reporte) {
    return (
      <div className="space-y-3">
        <p className="font-semibold">No encontramos este reporte.</p>
        <Link to="/mis-reportes" className="font-semibold text-civico underline">Volver a mis reportes</Link>
      </div>
    )
  }

  const evidencias = reporte.fotos_reporte.filter((f) => f.tipo === 'evidencia')
  const resolucion = reporte.fotos_reporte.find((f) => f.tipo === 'resolucion')

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <Link to="/mis-reportes" className="text-sm font-semibold text-civico">← Mis reportes</Link>

      {/* Cabecera */}
      <header className="space-y-3 rounded-2xl bg-civico p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-sm text-white/70">{reporte.codigo_seguimiento}</span>
          <button type="button" onClick={copiarCodigo}
            className="rounded-lg border border-white/40 px-3 py-1.5 text-sm font-semibold">
            {copiado ? 'Código copiado ✓' : 'Copiar código'}
          </button>
        </div>
        <h1 className="text-2xl font-extrabold">{reporte.titulo}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
          <EtiquetaEstado estado={reporte.estado} />
          <span>{reporte.categorias?.nombre} · Prioridad {reporte.prioridad}</span>
        </div>
      </header>

      {/* Fotos antes / después */}
      <section className="grid grid-cols-2 gap-3">
        <figure className="space-y-1">
          {evidencias[0] && (
            <img src={urlFoto(evidencias[0].storage_path)} alt="Foto del problema reportado"
              className="h-48 w-full rounded-xl object-cover" />
          )}
          <figcaption className="text-xs font-semibold text-gris">Antes</figcaption>
        </figure>
        <figure className="space-y-1">
          {resolucion ? (
            <img src={urlFoto(resolucion.storage_path)} alt="Foto de la solución"
              className="h-48 w-full rounded-xl object-cover" />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-bordillo px-4 text-center text-sm text-gris">
              Aparecerá cuando se resuelva
            </div>
          )}
          <figcaption className="text-xs font-semibold text-gris">Después</figcaption>
        </figure>
      </section>

      {evidencias.length > 1 && (
        <div className="flex gap-3">
          {evidencias.slice(1).map((foto) => (
            <img key={foto.id} src={urlFoto(foto.storage_path)} alt="Otra foto del problema"
              className="h-20 w-28 rounded-lg object-cover" />
          ))}
        </div>
      )}

      {/* Datos */}
      <section className="space-y-2 rounded-2xl border border-bordillo bg-white p-5">
        <p>{reporte.descripcion}</p>
        <p className="text-sm text-gris">{reporte.direccion ?? 'Sin dirección indicada'}</p>
        <p className="font-mono text-xs text-gris">
          {reporte.lat.toFixed(5)}, {reporte.lng.toFixed(5)} · Creado el {formatearFecha(reporte.created_at)}
        </p>
      </section>

      {/* Historial */}
      <section className="rounded-2xl border border-bordillo bg-white p-5">
        <h2 className="mb-4 font-bold">Historial</h2>
        <LineaTiempo eventos={eventos} estadoActual={reporte.estado} />
      </section>
    </article>
  )
}