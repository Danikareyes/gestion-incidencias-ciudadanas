import { Link } from 'react-router'
import { supabase } from '../lib/supabase'

export default function Inicio() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-extrabold text-civico">Mapa de incidencias</h1>
      <p className="text-gris">Aquí irá el mapa público con los reportes.</p>
      <Link
        to="/reportar"
        className="inline-block rounded-xl bg-senal px-5 py-3 font-bold text-white"
      >
        Reportar incidencia
      </Link>
      <p className="font-mono text-sm text-gris">
        Supabase: {supabase ? 'conectado ✓' : 'pendiente de configurar'}
      </p>
    </section>
  )
}