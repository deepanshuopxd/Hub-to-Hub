import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

/**
 * VehicleMarker — mounts a live vehicle dot on a Mapbox map instance.
 *
 * Props:
 *  - map        mapboxgl.Map   the parent map instance
 *  - coords     [lng, lat]     current position
 *  - bookingId  string         used as marker key
 *  - status     string         'active' | 'in_transit' | 'completed'
 *  - label      string         popup label text
 *  - onClick    () => void
 */
const VehicleMarker = ({ map, coords, bookingId, status = 'active', label = '', onClick }) => {
  const markerRef = useRef(null)

  // Colour by status
  const colorMap = {
    active:     '#C93030',
    in_transit: '#E8A020',
    completed:  '#22c55e',
  }
  const color = colorMap[status] || colorMap.active

  // ── Mount marker ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!map || !coords) return

    // Create element
    const el = document.createElement('div')
    el.style.cssText = `
      width: 16px;
      height: 16px;
      background: ${color};
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.15);
      box-shadow: 0 0 0 4px ${color}33, 0 0 20px ${color}80;
      cursor: pointer;
      transition: transform 0.2s;
    `
    el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.4)' })
    el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })
    if (onClick) el.addEventListener('click', onClick)

    // Pulse ring (only for active/in_transit)
    if (status !== 'completed') {
      const ring = document.createElement('div')
      ring.style.cssText = `
        position: absolute;
        inset: -8px;
        border: 1px solid ${color}60;
        border-radius: 50%;
        animation: vehicleRing 2s ease-out infinite;
      `
      const wrapper = document.createElement('div')
      wrapper.style.position = 'relative'
      wrapper.appendChild(ring)
      wrapper.appendChild(el)

      const popup = label
        ? new mapboxgl.Popup({ offset: 20, closeButton: false })
            .setHTML(`
              <div style="
                font-family:'Space Mono',monospace;font-size:0.6rem;
                letter-spacing:0.1em;text-transform:uppercase;
                color:${color};background:#1A1A1A;
                padding:5px 9px;border:1px solid ${color}33;
              ">${label}</div>
            `)
        : null

      const marker = new mapboxgl.Marker(wrapper)
        .setLngLat(coords)
      if (popup) marker.setPopup(popup)
      marker.addTo(map)
      markerRef.current = marker
    } else {
      const marker = new mapboxgl.Marker(el).setLngLat(coords).addTo(map)
      markerRef.current = marker
    }

    return () => {
      markerRef.current?.remove()
      markerRef.current = null
    }
  }, [map])   // only re-mount when map changes

  // ── Smooth position update ────────────────────────────────────────────────
  useEffect(() => {
    if (markerRef.current && coords) {
      markerRef.current.setLngLat(coords)
    }
  }, [coords])

  // ── Color update ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!markerRef.current) return
    const el = markerRef.current.getElement()?.querySelector('div:last-child') ||
               markerRef.current.getElement()
    if (el) {
      el.style.background  = color
      el.style.boxShadow   = `0 0 0 4px ${color}33, 0 0 20px ${color}80`
    }
  }, [color])

  // Nothing to render — all DOM is handled via mapboxgl
  return null
}

export default VehicleMarker