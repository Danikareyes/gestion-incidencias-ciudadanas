import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { supabase } from '../../lib/supabase'
import { urlFoto } from '../../lib/fotos'
import { formatearFecha } from '../../lib/formato'
import {
  ESTADOS, PRIORIDADES, TRANSICIONES, datosPrioridad,
  type Estado, type Prioridad,
} from '../../lib/estados'
import EtiquetaEstado from '../../components/EtiquetaEstado'

type Reporte = {
  id: string
  codigo_seguimiento: string
  titulo: string
  descripcion: string
  estado: Estado
  prioridad: Prioridad
  categoria_id: number
  direccion: string | null
  lat: number
  lng: number
  created_at: string
  autor: { nombre: string } | null
  responsable: { nombre: string } | null
  fotos_reporte: { id: string; storage_path: string; tipo: 'evidencia' | 'resolucion' }[]
}

type FilaHistorial = {
  id: number
  campo_cambiado: string
  estado_anterior: Estado | null
  estado_nuevo: Estado | null
  valor_anterior: string | null
  valor_nuevo: string | null
  comentario: string | null
  es_publico: boolean
  created_at: string
  perfiles: { nombre: string } | null
}

type Persona = { id: string; nombre: string; rol: string }

const claseCampo =
  'w-full rounded-lg border border-bordillo bg-white px-3 text-sm focus:border-civico focus:outline-none'

export default function GestionReporte() {
  const { id } = useParams<{ id: string }>()
  const [reporte, setReporte] = useState<Reporte | null>(null)
  const [historial, setHistorial] = useState<FilaHistorial[]>([])
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([])
  const [operadores, setOperadores] = useState<Persona[]>([])
  const [noEncontrado, setNoEncontrado] = useState(false)
  const [version, setVersion] = useState(0) 

  const [nuevoEstado, setNuevoEstado] = useState<Estado | ''>('')
  const [comentario, setComentario] = useState('')
  const [esPublico, setEsPublico] = useState(true)
  const [asignadoA, setAsignadoA] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    if (!supabase) return
    supabase.from('categorias').select('id, nombre').order('id')
      .then(({ data }) => setCategorias(data ?? []))
    supabase.from('perfiles').select('id, nombre, rol').in('rol', ['operador', 'admin']).order('nombre')
      .then(({ data }) => setOperadores((data ?? []) as Persona[]))
  }, [])

  useEffect(() => {
    if (!supabase || !id) return
    Promise.all([
      supabase
        .from('reportes')
        .select(`id, codigo_seguimiento, titulo, descripcion, estado, prioridad, categoria_id,
                 direccion, lat, lng, created_at,
                 autor:perfiles!reportes_usuario_id_fkey(nombre),
                 responsable:perfiles!reportes_asignado_a_fkey(nombre),
                 fotos_reporte(id, storage_path, tipo)`)
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('historial_estados')
        .select(`id, campo_cambiado, estado_anterior, estado_nuevo, valor_anterior, valor_nuevo,
                 comentario, es_publico, created_at, perfiles(nombre)`)
        .eq('reporte_id', id)
        .order('created_at', { ascending: false }),
    ]).then(([respuestaReporte, respuestaHistorial]) => {
      if (!respuestaReporte.data) {
        setNoEncontrado(true)
        return
      }
      setReporte(respuestaReporte.data as unknown as Reporte)
      setHistorial((respuestaHistorial.data ?? []) as unknown as FilaHistorial[])
    })
  }, [id, version])

  function mostrarAviso(texto: string) {
    setAviso(texto)
    setTimeout(() => setAviso(''), 3000)
  }

  async function guardarEstado(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!supabase || !reporte || !nuevoEstado) return
    setGuardando(true)
    setError('')
    const { error } = await supabase.rpc('cambiar_estado_reporte', {
      p_reporte_id: reporte.id,
      p_nuevo_estado: nuevoEstado,
      p_comentario: comentario.trim() || null,
      p_es_publico: esPublico,
      p_asignado_a: nuevoEstado === 'asignado' ? asignadoA || null : null,
    })
    setGuardando(false)
    if (error) {
      setError(error.message) 
      return
    }
    setNuevoEstado('')
    setComentario('')
    setEsPublico(true)
    setAsignadoA('')
    mostrarAviso(`Estado cambiado a "${ESTADOS[nuevoEstado].texto}".`)
    setVersion((v) => v + 1)
  }

  async function actualizarCampo(cambios: { prioridad?: Prioridad; categoria_id?: number }) {
    if (!supabase || !reporte) return
    setError('')
    const { error } = await supabase.from('reportes').update(cambios).eq('id', reporte.id)
    if (error) {
      setError('No se pudo guardar el cambio.')
      return
    }
    mostrarAviso('Cambio guardado.')
    setVersion((v) => v + 1)
  }

  function nombreCategoria(valor: string | null) {
    return categorias.find((c) => String(c.id) === valor)?.nombre ?? valor ?? '—'
  }

  function describirCambio(fila: FilaHistorial) {
    if (fila.campo_cambiado === 'estado') {
      if (!fila.estado_anterior) return 'Reporte creado'
      return `${ESTADOS[fila.estado_anterior].texto} → ${fila.estado_nuevo ? ESTADOS[fila.estado_nuevo].texto : '—'}`
    }
    if (fila.campo_cambiado === 'prioridad') {
      return `Prioridad: ${datosPrioridad(fila.valor_anterior ?? '').texto} → ${datosPrioridad(fila.valor_nuevo ?? '').texto}`
    }
    if (fila.campo_cambiado === 'categoria') {
      return `Categoría: ${nombreCategoria(fila.valor_anterior)} → ${nombreCategoria(fila.valor_nuevo)}`
    }
    return fila.campo_cambiado
  }

  if (noEncontrado) {
    return (
      <div className="space-y-3">
        <p className="font-semibold">No encontramos este reporte.</p>
        <Link to="/admin" className="font-semibold text-civico underline">Volver al panel</Link>
      </div>
    )
  }

  if (!reporte) return <p className="text-gris">Cargando reporte…</p>

  const siguientes = TRANSICIONES[reporte.estado]
  const evidencias = reporte.fotos_reporte.filter((f) => f.tipo === 'evidencia')

  return (
    <article className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm text-gris">
          <Link to="/admin" className="font-semibold text-civico">Reportes</Link>
          {' / '}
          <span className="font-mono">{reporte.codigo_seguimiento}</span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold text-civico">{reporte.titulo}</h1>
          <EtiquetaEstado estado={reporte.estado} />
        </div>
      </div>

      {aviso && (
        <p role="status" className="rounded-lg bg-[#E2F0E8] px-3 py-2 text-sm font-semibold text-resuelto">{aviso}</p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-senal-tenue px-3 py-2 text-sm text-senal">{error}</p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Columna izquierda: información e historial */}
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-bordillo bg-white p-5">
            {evidencias.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {evidencias.map((foto) => (
                  <a key={foto.id} href={urlFoto(foto.storage_path)} target="_blank" rel="noreferrer">
                    <img src={urlFoto(foto.storage_path)} alt="Foto del reporte"
                      className="h-32 w-full rounded-lg object-cover" />
                  </a>
                ))}
              </div>
            )}
            <p>{reporte.descripcion}</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-gris">Reportado por</dt><dd>{reporte.autor?.nombre ?? '—'}</dd>
              <dt className="text-gris">Fecha</dt><dd>{formatearFecha(reporte.created_at)}</dd>
              <dt className="text-gris">Dirección</dt><dd>{reporte.direccion ?? '—'}</dd>
              <dt className="text-gris">Coordenadas</dt>
              <dd className="font-mono text-xs">
                <a href={`https://www.openstreetmap.org/?mlat=${reporte.lat}&mlon=${reporte.lng}#map=18/${reporte.lat}/${reporte.lng}`}
                  target="_blank" rel="noreferrer" className="text-civico underline">
                  {reporte.lat.toFixed(5)}, {reporte.lng.toFixed(5)}
                </a>
              </dd>
              <dt className="text-gris">Responsable</dt><dd>{reporte.responsable?.nombre ?? 'Sin asignar'}</dd>
            </dl>
          </section>

          <section className="rounded-2xl border border-bordillo bg-white p-5">
            <h2 className="mb-3 font-bold">Historial (auditoría)</h2>
            <ul className="divide-y divide-[#ECEBE7]">
              {historial.map((fila) => (
                <li key={fila.id} className="grid gap-1 py-3 text-sm sm:grid-cols-[150px_1fr_140px] sm:gap-3">
                  <span className="text-xs text-gris">{formatearFecha(fila.created_at)}</span>
                  <div>
                    <p className="font-semibold">{describirCambio(fila)}</p>
                    {fila.comentario && fila.comentario !== 'Reporte creado' && (
                      <p className="text-gris">“{fila.comentario}”</p>
                    )}
                    {!fila.es_publico && (
                      <span className="text-xs font-semibold italic text-gris">interno</span>
                    )}
                  </div>
                  <span className="text-xs text-gris sm:text-right">{fila.perfiles?.nombre ?? 'Sistema'}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Columna derecha: gestión */}
        <aside className="space-y-5">
          <form onSubmit={guardarEstado} className="space-y-4 rounded-2xl border border-bordillo bg-white p-5">
            <h2 className="text-lg font-extrabold text-civico">Cambiar estado</h2>

            {siguientes.length === 0 ? (
              <p className="text-sm text-gris">Este reporte está cerrado: no admite más cambios de estado.</p>
            ) : (
              <>
                <fieldset>
                  <legend className="mb-2 text-sm font-semibold text-gris">Siguiente estado</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {siguientes.map((opcion) => (
                      <button key={opcion} type="button" aria-pressed={nuevoEstado === opcion}
                        onClick={() => setNuevoEstado(opcion)}
                        className={`h-11 rounded-lg text-sm font-semibold ${
                          nuevoEstado === opcion
                            ? 'border-2 border-civico bg-civico-niebla text-civico'
                            : 'border border-bordillo bg-white text-asfalto'
                        }`}>
                        {ESTADOS[opcion].texto}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {nuevoEstado === 'asignado' && (
                  <div className="space-y-1">
                    <label htmlFor="responsable" className="text-sm font-semibold text-gris">Responsable</label>
                    <select id="responsable" value={asignadoA} onChange={(e) => setAsignadoA(e.target.value)}
                      className={`${claseCampo} h-11`}>
                      <option value="">Seleccionar operador</option>
                      {operadores.map((persona) => (
                        <option key={persona.id} value={persona.id}>{persona.nombre} ({persona.rol})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="comentario" className="text-sm font-semibold text-gris">
                    Comentario{nuevoEstado === 'rechazado' ? ' (obligatorio: motivo del rechazo)' : ''}
                  </label>
                  <textarea id="comentario" rows={3} value={comentario} onChange={(e) => setComentario(e.target.value)}
                    placeholder="Qué se hizo o qué sigue" className={`${claseCampo} py-2`} />
                </div>

                <label className="flex min-h-8 items-center gap-2 text-sm">
                  <input type="checkbox" checked={esPublico} onChange={(e) => setEsPublico(e.target.checked)}
                    className="h-4 w-4 accent-civico" />
                  Visible para el ciudadano
                </label>

                <button type="submit" disabled={!nuevoEstado || guardando}
                  className="h-11 w-full rounded-xl bg-civico font-bold text-white disabled:opacity-50">
                  {guardando ? 'Guardando…' : 'Guardar cambio'}
                </button>
              </>
            )}
          </form>

          <section className="space-y-4 rounded-2xl border border-bordillo bg-white p-5">
            <h2 className="text-lg font-extrabold text-civico">Clasificación</h2>

            <div className="space-y-1">
              <span className="text-sm font-semibold text-gris">Prioridad</span>
              <div className="grid grid-cols-4 overflow-hidden rounded-lg border border-bordillo">
                {PRIORIDADES.map((p) => (
                  <button key={p.valor} type="button" aria-pressed={reporte.prioridad === p.valor}
                    onClick={() => reporte.prioridad !== p.valor && actualizarCampo({ prioridad: p.valor })}
                    className={`h-10 border-r border-bordillo text-xs last:border-r-0 ${
                      reporte.prioridad === p.valor ? 'bg-senal font-bold text-white' : 'bg-white'
                    }`}>
                    {p.texto}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="categoria" className="text-sm font-semibold text-gris">Categoría</label>
              <select id="categoria" value={reporte.categoria_id}
                onChange={(e) => actualizarCampo({ categoria_id: Number(e.target.value) })}
                className={`${claseCampo} h-11`}>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </section>
        </aside>
      </div>
    </article>
  )
}