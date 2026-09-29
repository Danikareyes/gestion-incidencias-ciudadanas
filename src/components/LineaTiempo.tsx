import { ESTADOS, type Estado } from '../lib/estados'
import { formatearFecha } from '../lib/formato'

export type Evento = {
  estado: Estado | null
  comentario: string | null
  fecha: string
}

type Props = { eventos: Evento[]; estadoActual: Estado }

export default function LineaTiempo({ eventos, estadoActual }: Props) {
  const terminado = estadoActual === 'resuelto' || estadoActual === 'rechazado'

  return (
    <ol>
      {eventos.map((evento, indice) => {
        const esUltimo = indice === eventos.length - 1
        const esActual = esUltimo && !terminado
        return (
          <li key={indice} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`mt-1 h-3.5 w-3.5 flex-shrink-0 rounded-full ${
                  esActual ? 'bg-senal ring-4 ring-senal-tenue' : 'bg-civico'
                }`}
              />
              {!(esUltimo && terminado) && <span className="w-0.5 flex-grow bg-bordillo" />}
            </div>
            <div className="pb-5">
              <p className={`font-semibold ${esActual ? 'text-senal' : ''}`}>
                {evento.estado ? ESTADOS[evento.estado].texto : 'Actualización'}
              </p>
              {evento.comentario && <p className="text-sm">“{evento.comentario}”</p>}
              <p className="text-xs text-gris">{formatearFecha(evento.fecha)}</p>
            </div>
          </li>
        )
      })}

      {!terminado && (
        <li className="flex gap-3">
          <span className="mt-1 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-bordillo bg-white" />
          <p className="text-gris">Resuelto</p>
        </li>
      )}
    </ol>
  )
}