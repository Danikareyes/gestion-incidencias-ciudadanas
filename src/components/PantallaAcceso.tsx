import type { ReactNode } from 'react'

const ventajas = [
  'Reporta un problema en menos de dos minutos',
  'Sigue el estado de tu reporte con un código',
  'Tus datos personales nunca se muestran en público',
]

type Props = { titulo: string; children: ReactNode }

export default function PantallaAcceso({ titulo, children }: Props) {
  return (
    <div className="grid overflow-hidden rounded-3xl border border-bordillo bg-white lg:min-h-[38rem] lg:grid-cols-2">
      {/* Panel azul: solo en escritorio */}
      <aside className="hidden flex-col justify-between gap-10 bg-civico p-12 text-white lg:flex">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-white/70">
          Reportes Ciudadanos
        </p>
        <div className="space-y-4">
          <h2 className="text-4xl font-extrabold leading-tight">Tu ciudad mejora cuando la reportas</h2>
          <p className="text-lg text-white/80">
            Un canal directo entre los ciudadanos y el municipio para resolver los problemas del espacio público.
          </p>
        </div>
        <ul className="space-y-3">
          {ventajas.map((texto) => (
            <li key={texto} className="flex items-center gap-3">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-senal">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF"
                  strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12l5 5 9-10" />
                </svg>
              </span>
              <span className="text-white/90">{texto}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* Formulario */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-6">
          <h1 className="text-3xl font-extrabold text-civico">{titulo}</h1>
          {children}
        </div>
      </div>
    </div>
  )
}