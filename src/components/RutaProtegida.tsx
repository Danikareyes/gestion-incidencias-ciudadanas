import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth, type Rol } from '../lib/auth'

export default function RutaProtegida({ roles }: { roles?: Rol[] }) {
  const { session, perfil, cargando } = useAuth()
  const location = useLocation()

  if (cargando) {
    return <p className="text-gris">Cargando…</p>
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  }

  if (roles && (!perfil || !roles.includes(perfil.rol))) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}