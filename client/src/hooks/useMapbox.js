import { useRef, useEffect, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

export const useMapbox = ({ container, center = [72.87, 19.07], zoom = 7 }) => {
  const mapRef    = useRef(null)
  const markersRef= useRef({})

  // Initialize map
  useEffect(() => {
    if (!container.current || mapRef.current) return

    mapRef.current = new mapboxgl.Map({
      container: container.current,
      style:     'mapbox://styles/mapbox/dark-v11',
      center,
      zoom,
      attributionControl: false,
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Custom dark overlay
    mapRef.current.on('load', () => {
      mapRef.current.setPaintProperty('background', 'background-color', '#080808')
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // ── Helpers ───────────────────────────────────────────────────────────────

  const addHubMarker = useCallback((hub, options = {}) => {
    if (!mapRef.current) return

    // Custom hub marker element
    const el = document.createElement('div')
    el.className = 'hub-marker'
    el.style.cssText = `
      width: 18px; height: 18px;
      background: #E8A020;
      border-radius: 50%;
      border: 2px solid rgba(232,160,32,0.4);
      box-shadow: 0 0 0 6px rgba(232,160,32,0.12), 0 0 20px rgba(232,160,32,0.3);
      cursor: pointer;
      transition: transform 0.2s;
    `
    el.addEventListener('mouseenter', () => el.style.transform = 'scale(1.4)')
    el.addEventListener('mouseleave', () => el.style.transform = 'scale(1)')

    const popup = new mapboxgl.Popup({ offset: 20, className: 'hub-popup' })
      .setHTML(`
        <div style="
          font-family:'Space Mono',monospace;
          font-size:0.65rem;
          letter-spacing:0.1em;
          text-transform:uppercase;
          color:#E8A020;
          background:#1A1A1A;
          padding:0.5rem 0.8rem;
          border:1px solid rgba(232,160,32,0.2);
        ">${hub.name}</div>
      `)

    const marker = new mapboxgl.Marker(el)
      .setLngLat([hub.lng, hub.lat])
      .setPopup(popup)
      .addTo(mapRef.current)

    if (options.id) markersRef.current[options.id] = marker
    return marker
  }, [])

  const addVehicleMarker = useCallback((id, coords, label = '') => {
    if (!mapRef.current) return

    const el = document.createElement('div')
    el.style.cssText = `
      width: 14px; height: 14px;
      background: #C93030;
      border-radius: 50%;
      border: 2px solid rgba(201,48,48,0.4);
      box-shadow: 0 0 0 4px rgba(201,48,48,0.15), 0 0 16px rgba(201,48,48,0.5);
      animation: pulse-vehicle 1.5s ease-in-out infinite;
    `

    // Remove old marker if exists
    if (markersRef.current[id]) markersRef.current[id].remove()

    const marker = new mapboxgl.Marker(el)
      .setLngLat(coords)
      .addTo(mapRef.current)

    markersRef.current[id] = marker
    return marker
  }, [])

  const updateMarkerPosition = useCallback((id, coords) => {
    const marker = markersRef.current[id]
    if (marker) marker.setLngLat(coords)
  }, [])

  const drawRoute = useCallback((start, end, waypoints = []) => {
    if (!mapRef.current) return

    const coordinates = [start, ...waypoints, end]

    if (mapRef.current.getLayer('route')) {
      mapRef.current.removeLayer('route')
      mapRef.current.removeSource('route')
    }

    mapRef.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates },
      },
    })

    mapRef.current.addLayer({
      id:     'route',
      type:   'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#E8A020',
        'line-width': 2,
        'line-opacity': 0.7,
        'line-dasharray': [2, 3],
      },
    })

    // Fit bounds
    const bounds = coordinates.reduce(
      (b, c) => b.extend(c),
      new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
    )
    mapRef.current.fitBounds(bounds, { padding: 80 })
  }, [])

  const flyTo = useCallback((coords, zoom = 12) => {
    mapRef.current?.flyTo({ center: coords, zoom, speed: 1.2 })
  }, [])

  const removeMarker = useCallback((id) => {
    if (markersRef.current[id]) {
      markersRef.current[id].remove()
      delete markersRef.current[id]
    }
  }, [])

  return {
    map: mapRef.current,
    addHubMarker,
    addVehicleMarker,
    updateMarkerPosition,
    drawRoute,
    flyTo,
    removeMarker,
  }
}