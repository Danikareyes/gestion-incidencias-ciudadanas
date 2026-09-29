import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '../lib/auth'

// Mismo ancho y márgenes para cabecera y contenido
const contenedor = 'mx-auto w-full max-w-[120rem] px-4 sm:px-6 lg:px-12'

const claseEnlace = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold ${
    isActive ? 'bg-white/15 text-white' : 'text-white/80 hover:text-white'
  }`

export default function Layout() {
  const { session, perfil, esPersonal, cerrarSesion } = useAuth()
  const { pathname } = useLocation()

  // El panel admin queda arriba; el resto se centra en altura
  const centrarEnAltura = !pathname.startsWith('/admin')

  return (
    <div className="flex min-h-screen flex-col bg-papel text-asfalto">
      <header className="bg-civico text-white">
        <div className={`${contenedor} flex flex-wrap items-center justify-between gap-3 py-3`}>
          <Link to="/" className="text-lg font-extrabold">Reportes Ciudadanos</Link>

          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={claseEnlace}>Mapa</NavLink>
            <NavLink to="/reportar" className={claseEnlace}>Reportar</NavLink>
            <NavLink to="/mis-reportes" className={claseEnlace}>Mis reportes</NavLink>
            <NavLink to="/seguimiento" className={claseEnlace}>Seguimiento</NavLink>
            {esPersonal && <NavLink to="/admin" className={claseEnlace}>Panel</NavLink>}

            {session ? (
              <div className="ml-2 flex items-center gap-2 border-l border-white/20 pl-3">
                <span className="text-sm text-white/80">{perfil?.nombre}</span>
                <button type="button" onClick={cerrarSesion}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-white/80 hover:text-white">
                  Salir
                </button>
              </div>
            ) : (
              <NavLink to="/login"
                className="ml-2 rounded-lg bg-senal px-3 py-2 text-sm font-bold text-white">
                Entrar
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className={`${contenedor} flex flex-grow flex-col py-10 lg:py-14`}>
        <div className={centrarEnAltura ? 'my-auto w-full' : 'w-full'}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}