import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { supabase } from '../../lib/supabase'
import { formatearFecha } from '../../lib/formato'
import { ESTADOS, PRIORIDADES, datosPrioridad, type Estado } from '../../lib/estados'
import EtiquetaEstado from '../../components/EtiquetaEstado'

const POR_PAGINA = 20
const DIAS_VENCIDO = 7

type Fila = {
  id: string
  codigo_seguimiento: string
  titulo: string
  estado: Estado
  prioridad: string
  direccion: string | null
  created_at: string
  categorias: { nombre: string; color: string | null } | null
}

const claseSelect =
  'h-10 rounded-lg border border-bordillo bg-white px-2 text-sm focus:border-civico focus:outline-none'

function diasDesde(fecha: string) {
  return Math.floor((Date.now() - new Date(fecha).getTime()) / 86_400_000)
}

export default function PanelReportes() {

  const [params, setParams] = useSearchParams()
  const estado = params.get('estado') ?? ''
  const prioridad = params.get('prioridad') ?? ''
  const categoria = params.get('categoria') ?? ''
  const texto = params.get('q') ?? ''
  const pagina = Math.max(1, Number(params.get('pagina') ?? '1'))

  const [busqueda, setBusqueda] = useState(texto)
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([])
  const [filas, setFilas] = useState<Fila[] | null>(null)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')

  function cambiarFiltro(clave: string, valor: string) {
    const nuevos = new URLSearchParams(params)
    if (valor) nuevos.set(clave, valor)
    else nuevos.delete(clave)
    if (clave !== 'pagina') nuevos.delete('pagina') // al filtrar, volver a la página 1
    setParams(nuevos)
  }

  function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    cambiarFiltro('q', busqueda.trim())
  }

  useEffect(() => {
    supabase
      ?.from('categorias')
      .select('id, nombre')
      .order('id')
      .then(({ data }) => setCategorias(data ?? []))
  }, [])

  useEffect(() => {
    if (!supabase) return
    let consulta = supabase
      .from('reportes')
      .select(
        'id, codigo_seguimiento, titulo, estado, prioridad, direccion, created_at, categorias(nombre, color)',
        { count: 'exact' },
      )

    if (estado) consulta = consulta.eq('estado', estado)
    if (prioridad) consulta = consulta.eq('prioridad', prioridad)
    if (categoria) consulta = consulta.eq('categoria_id', Number(categoria))

    const limpio = texto.replace(/[,()%*]/g, ' ').trim()
    if (limpio) {
      consulta = consulta.or(
        `titulo.ilike.%${limpio}%,codigo_seguimiento.ilike.%${limpio}%,direccion.ilike.%${limpio}%`,
      )
    }

    const desde = (pagina - 1) * POR_PAGINA
    consulta
      .order('created_at', { ascending: false })
      .range(desde, desde + POR_PAGINA - 1)
      .then(({ data, count, error }) => {
        if (error) {
          setError('No pudimos cargar los reportes.')
          return
        }
        setError('')
        setFilas((data ?? []) as unknown as Fila[])
        setTotal(count ?? 0)
      })
  }, [estado, prioridad, categoria, texto, pagina])

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  const hayFiltros = Boolean(estado || prioridad || categoria || texto)

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-extrabold text-civico">Reportes</h1>
        <form onSubmit={buscar} className="flex gap-2">
          <label htmlFor="buscar" className="sr-only">Buscar</label>
          <input id="buscar" type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Código, título o dirección"
            className="h-10 w-64 rounded-lg border border-bordillo bg-white px-3 text-sm focus:border-civico focus:outline-none" />
          <button type="submit" className="h-10 rounded-lg bg-civico px-4 text-sm font-bold text-white">
            Buscar
          </button>
        </form>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="f-estado">Estado</label>
        <select id="f-estado" value={estado} onChange={(e) => cambiarFiltro('estado', e.target.value)} className={claseSelect}>
          <option value="">Todos los estados</option>
          {(Object.keys(ESTADOS) as Estado[]).map((clave) => (
            <option key={clave} value={clave}>{ESTADOS[clave].texto}</option>
          ))}
        </select>

        <label className="sr-only" htmlFor="f-prioridad">Prioridad</label>
        <select id="f-prioridad" value={prioridad} onChange={(e) => cambiarFiltro('prioridad', e.target.value)} className={claseSelect}>
          <option value="">Todas las prioridades</option>
          {PRIORIDADES.map((p) => (
            <option key={p.valor} value={p.valor}>{p.texto}</option>
          ))}
        </select>

        <label className="sr-only" htmlFor="f-categoria">Categoría</label>
        <select id="f-categoria" value={categoria} onChange={(e) => cambiarFiltro('categoria', e.target.value)} className={claseSelect}>
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>

        {hayFiltros && (
          <button type="button" onClick={() => { setBusqueda(''); setParams(new URLSearchParams()) }}
            className="h-10 px-3 text-sm font-semibold text-civico underline">
            Limpiar filtros
          </button>
        )}

        <span className="ml-auto text-sm text-gris">{total} reporte{total === 1 ? '' : 's'}</span>
      </div>

      {error && <p role="alert" className="rounded-lg bg-senal-tenue px-3 py-2 text-senal">{error}</p>}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-2xl border border-bordillo bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-papel text-xs font-bold uppercase tracking-wide text-gris">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Reporte</th>
              <th className="px-4 py-3">Prioridad</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Antigüedad</th>
            </tr>
          </thead>
          <tbody>
            {filas === null && (
              <tr><td colSpan={5} className="px-4 py-6 text-gris">Cargando…</td></tr>
            )}
            {filas?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-gris">No hay reportes con estos filtros.</td></tr>
            )}
            {filas?.map((fila) => {
              const dias = diasDesde(fila.created_at)
              const vencido = fila.estado === 'pendiente' && dias >= DIAS_VENCIDO
              const prioridadFila = datosPrioridad(fila.prioridad)
              return (
                <tr key={fila.id} className="border-t border-[#ECEBE7] hover:bg-civico-niebla/50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{fila.codigo_seguimiento}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: fila.categorias?.color ?? '#5B6470' }} />
                      <div>
                        <Link to={`/admin/reportes/${fila.id}`} className="font-semibold text-asfalto hover:text-civico hover:underline">
                          {fila.titulo}
                        </Link>
                        <p className="text-xs text-gris">
                          {fila.categorias?.nombre}{fila.direccion ? ` · ${fila.direccion}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className={`px-4 py-3 ${prioridadFila.clase}`}>{prioridadFila.texto}</td>
                  <td className="px-4 py-3"><EtiquetaEstado estado={fila.estado} /></td>
                  <td className="px-4 py-3" title={formatearFecha(fila.created_at)}>
                    {vencido ? (
                      <span className="font-bold text-[#9B1C1C]">{dias} d · vencido</span>
                    ) : (
                      <span className="text-gris">{dias === 0 ? 'Hoy' : `${dias} d`}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between text-sm text-gris">
        <span>Página {pagina} de {totalPaginas}</span>
        <div className="flex gap-2">
          <button type="button" disabled={pagina <= 1} onClick={() => cambiarFiltro('pagina', String(pagina - 1))}
            className="h-10 rounded-lg border border-bordillo bg-white px-4 font-semibold text-asfalto disabled:opacity-40">
            Anterior
          </button>
          <button type="button" disabled={pagina >= totalPaginas} onClick={() => cambiarFiltro('pagina', String(pagina + 1))}
            className="h-10 rounded-lg border border-bordillo bg-white px-4 font-semibold text-asfalto disabled:opacity-40">
            Siguiente
          </button>
        </div>
      </div>
    </section>
  )
}