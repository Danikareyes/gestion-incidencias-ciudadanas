import { useAuth } from '../../lib/auth'

export default function PanelReportes() {
  const { perfil } = useAuth()
  return (
    <section className="space-y-2">
      <h1 className="text-3xl font-extrabold text-civico">Panel de reportes</h1>
      <p className="text-gris">
        Bienvenida, {perfil?.nombre}. Tu rol es <b>{perfil?.rol}</b>. Aquí irá la lista de reportes.
      </p>
    </section>
  )
}