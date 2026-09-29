import { useEffect } from 'react'
import { Link } from 'react-router'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import { latLngBounds } from 'leaflet'
import { CENTRO_MAPA } from '../lib/config'
import { formatearFecha } from '../lib/formato'
import type { Estado } from '../lib/estados'
import EtiquetaEstado from './EtiquetaEstado'

export type ReportePublico = {
  id: string
  codigo_seguimiento: string
  titulo: string
  lat: number
  lng: number
  direccion: string | null
  estado: Estado
  created_at: string
  categoria: string
  color: string
}

function AjustarVista({ reportes }: { reportes: ReportePublico[] }) {
  const mapa = useMap()
  useEffect(() => {
    if (reportes.length === 0) return
    const limites = latLngBounds(reportes.map((r) => [r.lat, r.lng] as [number, number]))
    mapa.fitBounds(limites, { padding: [40, 40], maxZoom: 16 })
  }, [mapa, reportes])
  return null
}

export default function MapaPublico({ reportes }: { reportes: ReportePublico[] }) {
  return (
    <MapContainer
      center={[CENTRO_MAPA.lat, CENTRO_MAPA.lng]}
      zoom={14}
      className="h-[28rem] w-full rounded-2xl border border-bordillo lg:h-[calc(100vh-10rem)] lg:min-h-[32rem]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AjustarVista reportes={reportes} />

      {reportes.map((reporte) => (
        <CircleMarker
          key={reporte.id}
          center={[reporte.lat, reporte.lng]}
          radius={9}
          pathOptions={{ color: '#FFFFFF', weight: 3, fillColor: reporte.color, fillOpacity: 1 }}
        >
          <Popup>
            <div className="space-y-1.5 font-sans">
              <div className="text-sm font-bold text-asfalto">{reporte.titulo}</div>
              <div className="text-xs text-gris">
                {reporte.categoria}
                {reporte.direccion ? ` · ${reporte.direccion}` : ''}
              </div>
              <EtiquetaEstado estado={reporte.estado} />
              <div className="text-xs text-gris">{formatearFecha(reporte.created_at)}</div>
              <Link
                to={`/seguimiento?codigo=${reporte.codigo_seguimiento}`}
                className="text-xs font-semibold underline"
                style={{ color: '#1D3557' }}
              >
                Ver seguimiento
              </Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}