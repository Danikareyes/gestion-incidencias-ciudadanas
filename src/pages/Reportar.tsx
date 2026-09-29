import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase'
import { BUCKET_FOTOS, CENTRO_MAPA } from '../lib/config'
import { comprimirFoto } from '../lib/fotos'
import MapaSelector, { type Punto } from '../components/MapaSelector'

type Categoria = { id: number; nombre: string; color: string | null }
type FotoLista = { archivo: File; vista: string }

const MAX_FOTOS = 3
const claseCampo =
  'w-full rounded-lg border border-bordillo bg-white px-3 text-base focus:border-civico focus:outline-none'

export default function Reportar() {
  const [centro, setCentro] = useState<Punto>(CENTRO_MAPA)
  const [punto, setPunto] = useState<Punto | null>(null)
  const [precision, setPrecision] = useState<number | null>(null)
  const [buscandoGps, setBuscandoGps] = useState(false)

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaId, setCategoriaId] = useState<number | null>(null)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [direccion, setDireccion] = useState('')

  const [fotos, setFotos] = useState<FotoLista[]>([])
  const [procesandoFotos, setProcesandoFotos] = useState(false)

  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [codigo, setCodigo] = useState<string | null>(null)

  useEffect(() => {
    supabase
      ?.from('categorias')
      .select('id, nombre, color')
      .order('id')
      .then(({ data }) => setCategorias(data ?? []))
  }, [])

  function usarMiUbicacion() {
    if (!navigator.geolocation) {
      setError('Tu navegador no permite obtener la ubicación. Marca el punto en el mapa.')
      return
    }
    setBuscandoGps(true)
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const nuevo = { lat: posicion.coords.latitude, lng: posicion.coords.longitude }
        setPunto(nuevo)
        setCentro(nuevo)
        setPrecision(Math.round(posicion.coords.accuracy))
        setBuscandoGps(false)
      },
      () => {
        setBuscandoGps(false)
        setError('No pudimos obtener tu ubicación. Marca el punto tocando el mapa.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  function cambiarPunto(nuevo: Punto) {
    setPunto(nuevo)
    setPrecision(null)
  }

  async function agregarFotos(evento: ChangeEvent<HTMLInputElement>) {
    const seleccion = Array.from(evento.target.files ?? []).slice(0, MAX_FOTOS - fotos.length)
    evento.target.value = '' // permite volver a elegir el mismo archivo
    if (seleccion.length === 0) return
    setProcesandoFotos(true)
    try {
      const nuevas = await Promise.all(
        seleccion.map(async (archivo) => {
          const comprimida = await comprimirFoto(archivo)
          return { archivo: comprimida, vista: URL.createObjectURL(comprimida) }
        }),
      )
      setFotos((actuales) => [...actuales, ...nuevas].slice(0, MAX_FOTOS))
    } catch {
      setError('Una de las fotos no se pudo procesar. Prueba con otra imagen.')
    } finally {
      setProcesandoFotos(false)
    }
  }

  function quitarFoto(indice: number) {
    setFotos((actuales) => {
      URL.revokeObjectURL(actuales[indice].vista)
      return actuales.filter((_, i) => i !== indice)
    })
  }

  function validar(): string | null {
    if (!punto) return 'Marca en el mapa dónde está el problema.'
    if (!categoriaId) return 'Elige una categoría.'
    if (titulo.trim().length < 5) return 'El título debe tener al menos 5 caracteres.'
    if (descripcion.trim().length < 10) return 'La descripción debe tener al menos 10 caracteres.'
    if (fotos.length === 0) return 'Añade al menos una foto.'
    return null
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!supabase || !punto) {
      setError(validar() ?? 'No hay conexión con el servidor.')
      return
    }
    const problema = validar()
    if (problema) {
      setError(problema)
      return
    }

    setEnviando(true)
    setError('')

    const { data: reporte, error: errorReporte } = await supabase
      .from('reportes')
      .insert({
        categoria_id: categoriaId,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        direccion: direccion.trim() || null,
        lat: punto.lat,
        lng: punto.lng,
      })
      .select('id, codigo_seguimiento')
      .single()

    if (errorReporte || !reporte) {
      setEnviando(false)
      setError(
        errorReporte?.message.includes('Límite')
          ? 'Alcanzaste el límite de 10 reportes en 24 horas.'
          : 'No pudimos guardar el reporte. Inténtalo de nuevo.',
      )
      return
    }

    const rutasSubidas: string[] = []
    try {
      for (const foto of fotos) {
        const ruta = `${reporte.id}/${crypto.randomUUID()}.jpg`
        const { error } = await supabase.storage
          .from(BUCKET_FOTOS)
          .upload(ruta, foto.archivo, { contentType: 'image/jpeg' })
        if (error) throw error
        rutasSubidas.push(ruta)
      }

      const { error } = await supabase.from('fotos_reporte').insert(
        rutasSubidas.map((ruta) => ({
          reporte_id: reporte.id,
          storage_path: ruta,
          tipo: 'evidencia',
        })),
      )
      if (error) throw error
    } catch {
      if (rutasSubidas.length > 0) {
        await supabase.storage.from(BUCKET_FOTOS).remove(rutasSubidas)
      }
      await supabase.from('reportes').delete().eq('id', reporte.id)
      setEnviando(false)
      setError('No pudimos subir las fotos. Revisa tu conexión e inténtalo de nuevo.')
      return
    }

    fotos.forEach((foto) => URL.revokeObjectURL(foto.vista))
    setEnviando(false)
    setCodigo(reporte.codigo_seguimiento)
  }

  function crearOtro() {
    setPunto(null)
    setPrecision(null)
    setCategoriaId(null)
    setTitulo('')
    setDescripcion('')
    setDireccion('')
    setFotos([])
    setCodigo(null)
  }

  if (codigo) {
    return (
      <section className="mx-auto max-w-lg space-y-5 rounded-2xl border border-bordillo bg-white p-8 text-center">
        <h1 className="text-2xl font-extrabold text-resuelto">¡Reporte enviado!</h1>
        <p className="text-gris">Guarda este código para consultar el estado de tu reporte:</p>
        <p className="font-mono text-2xl font-semibold text-asfalto">{codigo}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/mis-reportes" className="rounded-xl bg-civico px-5 py-3 font-bold text-white">
            Ver mis reportes
          </Link>
          <button type="button" onClick={crearOtro}
            className="rounded-xl border border-civico px-5 py-3 font-semibold text-civico">
            Crear otro reporte
          </button>
        </div>
      </section>
    )
  }

    // --- Formulario ---
  return (
    <form onSubmit={enviar} className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-civico">Reportar incidencia</h1>
        <p className="text-gris">Completa los tres pasos. Solo te tomará un par de minutos.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
        {/* 1. UBICACIÓN (en escritorio queda fija al hacer scroll) */}
        <section className="space-y-3 rounded-2xl border border-bordillo bg-white p-5 lg:sticky lg:top-6 lg:self-start">
          <h2 className="text-lg font-bold">1. ¿Dónde está el problema?</h2>
          <p className="text-sm text-gris">Toca el mapa para marcar el punto o usa tu ubicación. Puedes arrastrar el marcador.</p>
          <MapaSelector punto={punto} centro={centro} onCambiar={cambiarPunto} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={usarMiUbicacion} disabled={buscandoGps}
              className="h-11 rounded-lg border border-civico bg-white px-4 font-semibold text-civico disabled:opacity-60">
              {buscandoGps ? 'Buscando…' : 'Usar mi ubicación'}
            </button>
            <span className="font-mono text-xs text-gris">
              {punto
                ? `${punto.lat.toFixed(5)}, ${punto.lng.toFixed(5)}${precision ? ` · ±${precision} m` : ''}`
                : 'Sin punto marcado'}
            </span>
          </div>
          <div className="space-y-1">
            <label htmlFor="direccion" className="text-sm font-semibold text-gris">Dirección o referencia (opcional)</label>
            <input id="direccion" type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej.: Av. Principal y Calle 3, frente a la farmacia" className={`${claseCampo} h-11`} />
          </div>
        </section>

        <div className="space-y-6">
          {/* 2. DETALLES */}
          <section className="space-y-4 rounded-2xl border border-bordillo bg-white p-5">
            <h2 className="text-lg font-bold">2. Cuéntanos qué pasa</h2>

            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold text-gris">Categoría</legend>
              <div className="grid grid-cols-2 gap-2">
                {categorias.map((categoria) => {
                  const elegida = categoria.id === categoriaId
                  return (
                    <button key={categoria.id} type="button" aria-pressed={elegida}
                      onClick={() => setCategoriaId(categoria.id)}
                      className={`flex h-12 items-center gap-3 rounded-xl px-3 text-left font-semibold ${
                        elegida ? 'border-2 border-civico bg-civico-niebla text-civico' : 'border border-bordillo bg-white'
                      }`}>
                      <span className="h-4 w-4 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: categoria.color ?? '#5B6470' }} />
                      {categoria.nombre}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className="space-y-1">
              <label htmlFor="titulo" className="text-sm font-semibold text-gris">Título</label>
              <input id="titulo" type="text" maxLength={100} value={titulo} onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej.: Bache profundo en carril derecho" className={`${claseCampo} h-11`} />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <label htmlFor="descripcion" className="text-sm font-semibold text-gris">Descripción</label>
                <span className="text-xs text-gris">{descripcion.length} / 1000</span>
              </div>
              <textarea id="descripcion" maxLength={1000} rows={4} value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Tamaño, riesgo, desde cuándo lo ves…" className={`${claseCampo} py-2`} />
            </div>
          </section>

          {/* 3. FOTOS */}
          <section className="space-y-3 rounded-2xl border border-bordillo bg-white p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold">3. Fotos</h2>
              <span className="text-sm text-gris">{fotos.length} / {MAX_FOTOS}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {fotos.map((foto, indice) => (
                <div key={foto.vista} className="relative">
                  <img src={foto.vista} alt={`Foto ${indice + 1}`} className="h-28 w-full rounded-lg object-cover" />
                  <button type="button" onClick={() => quitarFoto(indice)} aria-label={`Quitar foto ${indice + 1}`}
                    className="absolute right-1 top-1 h-8 w-8 rounded-full bg-asfalto/80 font-bold text-white">
                    ×
                  </button>
                </div>
              ))}
              {fotos.length < MAX_FOTOS && (
                <label className="flex h-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-civico bg-white text-sm font-semibold text-civico">
                  {procesandoFotos ? 'Procesando…' : '+ Añadir foto'}
                  <input type="file" accept="image/*" multiple onChange={agregarFotos}
                    disabled={procesandoFotos} className="sr-only" />
                </label>
              )}
            </div>
            <p className="text-xs text-gris">Quitamos la ubicación oculta (EXIF) de tus fotos antes de subirlas.</p>
          </section>

          {error && (
            <p role="alert" className="rounded-lg bg-senal-tenue px-3 py-2 text-sm text-senal">{error}</p>
          )}

          <button type="submit" disabled={enviando || procesandoFotos}
            className="h-14 w-full rounded-xl bg-senal text-lg font-bold text-white disabled:opacity-60">
            {enviando ? 'Enviando reporte…' : 'Enviar reporte'}
          </button>
        </div>
      </div>
    </form>
  )
}