export type Estado =
  | 'pendiente'
  | 'en_revision'
  | 'asignado'
  | 'en_progreso'
  | 'resuelto'
  | 'rechazado'

export const ESTADOS: Record<Estado, { texto: string; clase: string }> = {
  pendiente:   { texto: 'Pendiente',   clase: 'bg-[#FBF0D9] text-[#7A4F00]' },
  en_revision: { texto: 'En revisión', clase: 'bg-[#E3ECF7] text-[#1D4E89]' },
  asignado:    { texto: 'Asignado',    clase: 'bg-[#EEE8F8] text-[#5B3A9E]' },
  en_progreso: { texto: 'En progreso', clase: 'bg-senal-tenue text-[#A63A0A]' },
  resuelto:    { texto: 'Resuelto',    clase: 'bg-[#E2F0E8] text-resuelto' },
  rechazado:   { texto: 'Rechazado',   clase: 'bg-[#ECEBE7] text-[#4A525C]' },
}

export const TRANSICIONES: Record<Estado, Estado[]> = {
  pendiente: ['en_revision', 'rechazado'],
  en_revision: ['asignado', 'rechazado'],
  asignado: ['en_progreso', 'rechazado'],
  en_progreso: ['resuelto'],
  resuelto: [],
  rechazado: [],
}

export type Prioridad = 'baja' | 'media' | 'alta' | 'critica'

export const PRIORIDADES: { valor: Prioridad; texto: string; clase: string }[] = [
  { valor: 'baja', texto: 'Baja', clase: 'text-gris' },
  { valor: 'media', texto: 'Media', clase: 'text-asfalto' },
  { valor: 'alta', texto: 'Alta', clase: 'text-senal font-bold' },
  { valor: 'critica', texto: 'Crítica', clase: 'text-[#9B1C1C] font-bold' },
]

export function datosPrioridad(valor: string) {
  return PRIORIDADES.find((p) => p.valor === valor) ?? PRIORIDADES[1]
}