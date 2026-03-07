import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

/**
 * HubMap — reusable Mapbox GL wrapper
 *
 * Props:
 *  - center       [lng, lat]   initial center
 *  - zoom         number       initial zoom
 *  - hubs         Hub[]        array of hub objects with name, lat, lng
 *  - onHubClick   (hub) => void
 *  - style        string       mapbox style URL
 *  - className    string       container classes
 *
 * Ref methods exposed:
 *  - flyTo(coords, zoom)
 *  - addMarker(id, coords, type) → 'hub' | 'vehicle'
 *  - moveMarker(id, coords)
 *  - removeMarker(id)
 *  - drawRoute(start, end)
 *  - clearRoute()
 */
const HubMap = forwardRef(({
  center     = [78.9629, 20.5937],
  zoom       = 5,
  hubs       = [],
  onHubClick = null,
  style      = 'mapbox://styles/mapbox/dark-v11',
  className  = '',
  height     = '100%',
}, ref) => {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const markersRef   = useRef({})        // { [id]: mapboxgl.Marker }
  const hubMarkersRef= useRef([])        // cleanup array
  const readyRef     = useRef(false)

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    if (!mapboxgl.accessToken) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style,
      center,
      zoom,
      attributionControl: false,
      pitchWithRotate: false,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 80, unit: 'metric' }), 'bottom-left')

    map.on('load', () => {
      readyRef.current = true
      // Inject custom route layer placeholder
      if (!map.getSource('route')) {
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } },
        })
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color':    '#E8A020',
            'line-width':    2,
            'line-opacity':  0.75,
            'line-dasharray': [2, 3],
          },
        })
        // Glow layer
        map.addLayer({
          id: 'route-glow',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color':   '#E8A020',
            'line-width':   6,
            'line-opacity': 0.15,
            'line-blur':    4,
          },
        }, 'route')
      }
    })

    mapRef.current = map

    return () => {
      hubMarkersRef.current.forEach(m => m.remove())
      Object.values(markersRef.current).forEach(m => m.remove())
      map.remove()
      mapRef.current  = null
      readyRef.current= false
    }
  }, [])

  // ── Render hubs whenever array changes ─────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !readyRef.current) return

    // Clear old hub markers
    hubMarkersRef.current.forEach(m => m.remove())
    hubMarkersRef.current = []

    hubs.forEach(hub => {
      const el = _makeHubEl(hub.name)

      const popup = new mapboxgl.Popup({
        offset: 22,
        closeButton: false,
        className: 'hub-popup-dark',
      }).setHTML(`
        <div style="
          font-family:'Space Mono',monospace;
          font-size:0.62rem;letter-spacing:0.1em;
          text-transform:uppercase;color:#E8A020;
          background:#1A1A1A;padding:6px 10px;
          border:1px solid rgba(232,160,32,0.2);
        ">${hub.name}</div>
      `)

      const marker = new mapboxgl.Marker(el)
        .setLngLat([hub.lng, hub.lat])
        .setPopup(popup)
        .addTo(mapRef.current)

      if (onHubClick) {
        el.addEventListener('click', () => onHubClick(hub))
      }

      hubMarkersRef.current.push(marker)
    })
  }, [hubs, onHubClick])

  // ── Imperative API ─────────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    flyTo(coords, z = 10) {
      mapRef.current?.flyTo({ center: coords, zoom: z, speed: 1.4, curve: 1 })
    },

    addMarker(id, coords, type = 'vehicle') {
      if (!mapRef.current) return
      markersRef.current[id]?.remove()
      const el = type === 'hub' ? _makeHubEl(id) : _makeVehicleEl()
      const m  = new mapboxgl.Marker(el).setLngLat(coords).addTo(mapRef.current)
      markersRef.current[id] = m
      return m
    },

    moveMarker(id, coords) {
      markersRef.current[id]?.setLngLat(coords)
    },

    removeMarker(id) {
      markersRef.current[id]?.remove()
      delete markersRef.current[id]
    },

    drawRoute(start, end) {
      if (!mapRef.current || !readyRef.current) return
      const src = mapRef.current.getSource('route')
      if (src) {
        src.setData({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [start, end] },
        })
      }
      // Fit bounds
      const bounds = new mapboxgl.LngLatBounds(start, start)
      bounds.extend(end)
      mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 10 })
    },

    clearRoute() {
      const src = mapRef.current?.getSource('route')
      if (src) {
        src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } })
      }
    },

    fitHubs(hubList) {
      if (!mapRef.current || hubList.length === 0) return
      const bounds = hubList.reduce(
        (b, h) => b.extend([h.lng, h.lat]),
        new mapboxgl.LngLatBounds([hubList[0].lng, hubList[0].lat], [hubList[0].lng, hubList[0].lat])
      )
      mapRef.current.fitBounds(bounds, { padding: 60 })
    },
  }))

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ height }}>
      <div ref={containerRef} className="w-full h-full" />

      {/* No token warning */}
      {!mapboxgl.accessToken && (
        <div className="absolute inset-0 flex items-center justify-center bg-brand-black/90 z-10">
          <div className="text-center px-6">
            <div className="font-mono text-xs tracking-widest uppercase text-brand-amber mb-2">
              Mapbox Token Required
            </div>
            <p className="text-brand-muted text-sm">
              Add <code className="text-brand-amber">VITE_MAPBOX_TOKEN</code> to your <code>.env</code> file
            </p>
          </div>
        </div>
      )}
    </div>
  )
})

HubMap.displayName = 'HubMap'

// ── Element factories ────────────────────────────────────────────────────────

function _makeHubEl(label = '') {
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'position:relative; cursor:pointer;'

  const dot = document.createElement('div')
  dot.style.cssText = `
    width:16px; height:16px;
    background:#E8A020; border-radius:50%;
    box-shadow: 0 0 0 4px rgba(232,160,32,0.2), 0 0 16px rgba(232,160,32,0.4);
    transition: transform 0.2s;
  `
  dot.addEventListener('mouseenter', () => dot.style.transform = 'scale(1.5)')
  dot.addEventListener('mouseleave', () => dot.style.transform = 'scale(1)')

  // Pulse ring
  const ring = document.createElement('div')
  ring.style.cssText = `
    position:absolute; inset:-6px;
    border:1px solid rgba(232,160,32,0.3);
    border-radius:50%;
    animation: hubPulse 2.5s ease-out infinite;
  `

  wrapper.appendChild(ring)
  wrapper.appendChild(dot)
  return wrapper
}

function _makeVehicleEl() {
  const el = document.createElement('div')
  el.style.cssText = `
    width:14px; height:14px;
    background:#C93030; border-radius:50%;
    box-shadow: 0 0 0 4px rgba(201,48,48,0.2), 0 0 16px rgba(201,48,48,0.6);
    animation: vehiclePulse 1.5s ease-in-out infinite;
  `
  return el
}

export default HubMap