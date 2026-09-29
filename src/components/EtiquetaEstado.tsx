import { ESTADOS, type Estado } from '../lib/estados'

export default function EtiquetaEstado({ estado }: { estado: Estado }) {
  const { texto, clase } = ESTADOS[estado]
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${clase}`}>
      {texto}
    </span>
  )
}