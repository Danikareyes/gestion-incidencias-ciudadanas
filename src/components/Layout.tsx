import { NavLink, Outlet } from 'react-router'

const enlaces = [
  { to: '/', texto: 'Mapa' },
  { to: '/reportar', texto: 'Reportar' },
  { to: '/mis-reportes', texto: 'Mis reportes' },
  { to: '/seguimiento', texto: 'Seguimiento' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-papel text-asfalto">
      <header className="bg-civico text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="text-lg font-extrabold">Reportes Ciudadanos</span>
          <nav className="flex flex-wrap gap-1">
            {enlaces.map((enlace) => (
              <NavLink
                key={enlace.to}
                to={enlace.to}
                end={enlace.to === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-semibold ${
                    isActive ? 'bg-white/15 text-white' : 'text-white/80 hover:text-white'
                  }`
                }
              >
                {enlace.texto}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}