import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { supabase } from '../lib/supabase'
import { formatearFecha } from '../lib/formato'
import type { Estado } from '../lib/estados'
import EtiquetaEstado from '../components/EtiquetaEstado'
import LineaTiempo, { type Evento } from '../components/LineaTiempo'

type Resultado = {
  codigo: string
  titulo: string
  estado: Estado
  categoria: string
  direccion: string | null
  creado: string
  historial: Evento[]
}

export default function Seguimiento() {
  const [params] = useSearchParams()
  const codigoInicial = params.get('codigo') ?? ''

  const [codigo, setCodigo] = useState(codigoInicial)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [buscando, setBuscando] = useState(false)

  async function consultar(valor: string) {
    if (!supabase || !valor.trim()) return
    setBuscando(true)
    setMensaje('')
    setResultado(null)
    const { data, error } = await supabase.rpc('consultar_por_codigo', { p_codigo: valor })
    setBuscando(false)
    if (error) {
      setMensaje('No pudimos hacer la consulta. Inténtalo de nuevo.')
    } else if (!data) {
      setMensaje('No encontramos ese reporte. Revisa el código: tiene el formato RPT-2026-000123.')
    } else {
      setResultado(data as Resultado)
    }
  }

  // Si llega un código en la dirección (desde el mapa), consultarlo automáticamente
  useEffect(() => {
    if (codigoInicial) {
      setCodigo(codigoInicial)
      consultar(codigoInicial)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigoInicial])

  function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    consultar(codigo)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      {/* Columna izquierda: buscador */}
      <section className="space-y-6 lg:py-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-civico lg:text-4xl">Seguimiento</h1>
          <p className="text-lg text-gris">Escribe el código que recibiste al crear tu reporte.</p>
        </div>

        <form onSubmit={buscar} className="flex flex-wrap gap-2">
          <label htmlFor="codigo" className="sr-only">Código de seguimiento</label>
          <input id="codigo" type="text" required value={codigo} onChange={(e) => setCodigo(e.target.value)}
            placeholder="RPT-2026-000123"
            className="h-12 flex-grow rounded-lg border border-bordillo bg-white px-3 font-mono text-base uppercase focus:border-civico focus:outline-none" />
          <button type="submit" disabled={buscando}
            className="h-12 rounded-xl bg-civico px-6 font-bold text-white disabled:opacity-60">
            {buscando ? 'Buscando…' : 'Consultar'}
          </button>
        </form>

        {mensaje && (
          <p role="alert" className="rounded-lg bg-senal-tenue px-3 py-2 text-sm text-senal">{mensaje}</p>
        )}

        <div className="space-y-2 rounded-2xl border border-bordillo bg-white p-5 text-sm text-gris">
          <p className="font-semibold text-asfalto">¿Dónde encuentro mi código?</p>
          <p>
            Lo recibes al enviar tu reporte y también aparece en "Mis reportes".
            Tiene el formato <span className="font-mono">RPT-2026-000123</span>.
          </p>
        </div>
      </section>

      {/* Columna derecha: resultado */}
      <section>
        {resultado ? (
          <article className="space-y-5 rounded-2xl border border-bordillo bg-white p-6 lg:p-8">
            <div className="space-y-2">
              <span className="font-mono text-sm text-gris">{resultado.codigo}</span>
              <h2 className="text-2xl font-extrabold">{resultado.titulo}</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gris">
                <EtiquetaEstado estado={resultado.estado} />
                <span>{resultado.categoria}</span>
              </div>
              <p className="text-sm text-gris">
                {resultado.direccion ?? 'Sin dirección indicada'} · Creado el {formatearFecha(resultado.creado)}
              </p>
            </div>
            <LineaTiempo eventos={resultado.historial} estadoActual={resultado.estado} />
          </article>
        ) : (
          <div className="hidden h-full min-h-[22rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-bordillo p-8 text-center lg:flex">
            <p className="font-semibold text-asfalto">Aquí verás el estado de tu reporte</p>
            <p className="text-sm text-gris">Con su historial completo, paso a paso.</p>
          </div>
        )}
      </section>
    </div>
  )
}  