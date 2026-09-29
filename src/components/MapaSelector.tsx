import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { divIcon, type Marker as MarcadorLeaflet } from 'leaflet'

export type Punto = { lat: number; lng: number }

const iconoPin = divIcon({
  className: '',
  html: `<svg width="36" height="46" viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 29s-10-9-10-17a10 10 0 0 1 20 0c0 8-10 17-10 17z" fill="#C2410C" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="3.5" fill="#fff"/>
  </svg>`,
  iconSize: [36, 46],
  iconAnchor: [18, 46],
})

function EscucharClics({ onCambiar }: { onCambiar: (p: Punto) => void }) {
  useMapEvents({
    click(evento) {
      onCambiar({ lat: evento.latlng.lat, lng: evento.latlng.lng })
    },
  })
  return null
}

function Centrar({ centro }: { centro: Punto }) {
  const mapa = useMap()
  useEffect(() => {
    mapa.setView([centro.lat, centro.lng], 17)
  }, [mapa, centro.lat, centro.lng])
  return null
}

type Props = {
  punto: Punto | null
  centro: Punto
  onCambiar: (p: Punto) => void
}

export default function MapaSelector({ punto, centro, onCambiar }: Props) {
  return (
    <MapContainer
      center={[centro.lat, centro.lng]}
      zoom={15}
      className="h-80 w-full rounded-xl border border-bordillo"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <EscucharClics onCambiar={onCambiar} />
      <Centrar centro={centro} />
      {punto && (
        <Marker
          position={[punto.lat, punto.lng]}
          icon={iconoPin}
          draggable
          eventHandlers={{
            dragend(evento) {
              const { lat, lng } = (evento.target as MarcadorLeaflet).getLatLng()
              onCambiar({ lat, lng })
            },
          }}
        />
      )}
    </MapContainer>
  )
}