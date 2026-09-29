const formateador = new Intl.DateTimeFormat('es', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatearFecha(fecha: string) {
  return formateador.format(new Date(fecha))
}