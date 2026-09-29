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

  // Cargar categorías y reportes públicos
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

  // Aplicar filtros y añadir nombre y color de la categoría
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
    <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,9fr)] lg:gap-16 xl:gap-24">      {/* Columna izquierda: presentación y contadores, centrada en vertical */}
      <section className="flex flex-col justify-center gap-7 lg:py-6 xl:pl-8">        <div className="space-y-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-senal">
            Participación ciudadana
          </p>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-civico sm:text-4xl xl:text-5xl">
            Reporta los problemas de tu ciudad y sigue su solución
          </h1>
          <p className="text-lg leading-relaxed text-gris">
            Baches, luminarias dañadas, fugas de agua o basura acumulada: márcalos en el mapa,
            añade una foto y el municipio se encargará.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
          <Link to="/reportar"
            className="flex h-14 items-center justify-center rounded-xl bg-senal px-6 text-lg font-bold text-white hover:bg-[#A63A0A]">
            Reportar incidencia
          </Link>
          <Link to="/seguimiento"
            className="flex h-14 items-center justify-center rounded-xl border-2 border-civico px-6 text-lg font-semibold text-civico hover:bg-civico-niebla">
            Consultar un código
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-bordillo bg-white p-5">
            <p className="text-sm font-semibold text-gris">Reportes abiertos</p>
            <p className="mt-1 text-4xl font-extrabold text-senal">{filas === null ? '…' : abiertos}</p>
          </div>
          <div className="rounded-2xl border border-bordillo bg-white p-5">
            <p className="text-sm font-semibold text-gris">Resueltos</p>
            <p className="mt-1 text-4xl font-extrabold text-resuelto">{filas === null ? '…' : resueltos}</p>
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