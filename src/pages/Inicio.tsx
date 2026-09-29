import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase'
import type { Estado } from '../lib/estados'
import MapaPublico, { type ReportePublico } from '../components/MapaPublico'

type Categoria = { id: number; nombre: string; color: string | null }

type FilaVista = {
  id: string
  codigo_seguimiento: string
  categoria_id: number
  titulo: string
  lat: number
  lng: number
  direccion: string | null
  estado: Estado
  created_at: string
}

export default function Inicio() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [filas, setFilas] = useState<FilaVista[] | null>(null)
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null)
  const [mostrarResueltos, setMostrarResueltos] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) return
    Promise.all([
      supabase.from('categorias').select('id, nombre, color').order('id'),
      supabase
        .from('v_reportes_publicos')
        .select('id, codigo_seguimiento, categoria_id, titulo, lat, lng, direccion, estado, created_at')
        .order('created_at', { ascending: false })
        .limit(500),
    ]).then(([respuestaCategorias, respuestaReportes]) => {
      if (respuestaReportes.error) {
        setError('No pudimos cargar el mapa. Recarga la página.')
        return
      }
      setCategorias((respuestaCategorias.data ?? []) as Categoria[])
      setFilas((respuestaReportes.data ?? []) as FilaVista[])
    })
  }, [])

  const reportes = useMemo<ReportePublico[]>(() => {
    const porId = new Map(categorias.map((c) => [c.id, c]))
    return (filas ?? [])
      .filter((f) => categoriaActiva === null || f.categoria_id === categoriaActiva)
      .filter((f) => mostrarResueltos || f.estado !== 'resuelto')
      .map((f) => ({
        ...f,
        categoria: porId.get(f.categoria_id)?.nombre ?? '',
        color: porId.get(f.categoria_id)?.color ?? '#5B6470',
      }))
  }, [filas, categorias, categoriaActiva, mostrarResueltos])

  const abiertos = reportes.filter((r) => r.estado !== 'resuelto').length
  const resueltos = reportes.length - abiertos

  const claseChip = (activo: boolean) =>
    `flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
      activo ? 'bg-civico text-white' : 'border border-bordillo bg-white text-asfalto'
    }`

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
      {/* Columna izquierda: presentación y contadores */}
      <section className="space-y-5 lg:sticky lg:top-8">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-civico lg:text-4xl">
          Reporta los problemas de tu ciudad y sigue su solución
        </h1>
        <p className="text-lg text-gris">
          Baches, luminarias dañadas, fugas de agua o basura acumulada: márcalos en el mapa,
          añade una foto y el municipio se encargará.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/reportar" className="rounded-xl bg-senal px-5 py-3 font-bold text-white">
            Reportar incidencia
          </Link>
          <Link to="/seguimiento" className="rounded-xl border border-civico px-5 py-3 font-semibold text-civico">
            Consultar un código
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-bordillo bg-white p-4">
            <p className="text-sm font-semibold text-gris">Abiertos</p>
            <p className="text-3xl font-extrabold text-senal">{filas === null ? '…' : abiertos}</p>
          </div>
          <div className="rounded-2xl border border-bordillo bg-white p-4">
            <p className="text-sm font-semibold text-gris">Resueltos</p>
            <p className="text-3xl font-extrabold text-resuelto">{filas === null ? '…' : resueltos}</p>
          </div>
        </div>
      </section>

      {/* Columna derecha: filtros y mapa */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" aria-pressed={categoriaActiva === null}
            onClick={() => setCategoriaActiva(null)} className={claseChip(categoriaActiva === null)}>
            Todas
          </button>
          {categorias.map((categoria) => (
            <button key={categoria.id} type="button" aria-pressed={categoriaActiva === categoria.id}
              onClick={() => setCategoriaActiva(categoria.id)}
              className={claseChip(categoriaActiva === categoria.id)}>
              <span className="h-3 w-3 rounded-full ring-2 ring-white"
                style={{ backgroundColor: categoria.color ?? '#5B6470' }} />
              {categoria.nombre}
            </button>
          ))}
          <label className="ml-auto flex min-h-9 items-center gap-2 text-sm">
            <input type="checkbox" checked={mostrarResueltos}
              onChange={(e) => setMostrarResueltos(e.target.checked)} className="h-4 w-4 accent-civico" />
            Mostrar resueltos
          </label>
        </div>

        {error ? (
          <p role="alert" className="rounded-lg bg-senal-tenue px-3 py-2 text-senal">{error}</p>
        ) : (
          <MapaPublico reportes={reportes} />
        )}

        <p className="text-sm text-gris">
          {filas === null ? 'Cargando reportes…' : 'Toca un punto del mapa para ver el detalle.'}
        </p>
      </section>
    </div>
  )
}