'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  initialLat?: number | null
  initialLng?: number | null
  onSave: (lat: number, lng: number) => Promise<void>
}

export function ShopLocationMap({ initialLat, initialLng, onSave }: Props) {
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return

    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const initialCenter: [number, number] = pin ? [pin.lat, pin.lng] : [29.3759, 47.9774]
      const map = L.map(containerRef.current!).setView(initialCenter, pin ? 14 : 10)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      if (pin) {
        markerRef.current = L.marker([pin.lat, pin.lng], { draggable: true }).addTo(map)
        markerRef.current.on('dragend', (e: any) => {
          const { lat, lng } = e.target.getLatLng()
          setPin({ lat, lng })
        })
      }

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng
        setPin({ lat, lng })
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        } else {
          markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map)
          markerRef.current.on('dragend', (de: any) => {
            const pos = de.target.getLatLng()
            setPin({ lat: pos.lat, lng: pos.lng })
          })
        }
      })
    })

    return () => { mapRef.current?.remove(); mapRef.current = null }
  }, [])

  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lng } = pos.coords
      setPin({ lat, lng })
      import('leaflet').then((L) => {
        mapRef.current?.setView([lat, lng], 15)
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        } else {
          markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current)
        }
      })
    })
  }

  const handleSave = async () => {
    if (!pin) return
    setSaving(true)
    try {
      await onSave(pin.lat, pin.lng)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={containerRef} style={{ height: 320, borderRadius: 12, overflow: 'hidden', border: '1px solid #E5E7EB' }} />
      <div className="flex gap-2 items-center">
        <p className="text-sm text-gray-500 flex-1">
          {pin ? `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}` : 'Click map to pin your shop'}
        </p>
        <button
          onClick={useMyLocation}
          className="text-sm text-amber-700 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-50"
        >
          Use my location
        </button>
        <button
          onClick={handleSave}
          disabled={!pin || saving}
          className="bg-amber-600 text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Location'}
        </button>
      </div>
    </div>
  )
}
