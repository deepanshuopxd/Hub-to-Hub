import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { MapPin, Navigation, Clock, Car } from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import { fetchBookingById, selectSelectedBooking } from '../store/slices/bookingSlice'
import { HUBS, formatINR } from '../utils/formatters'
import Loader from '../components/ui/Loader'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

const TrackingPage = () => {
  const { bookingId } = useParams()
  const dispatch      = useDispatch()
  const booking       = useSelector(selectSelectedBooking)

  const mapContainer = useRef(null)
  const mapRef       = useRef(null)
  const vehicleMarker= useRef(null)
  const animFrame    = useRef(null)
  const stepRef      = useRef(0)

  const [simProgress, setSimProgress] = useState(0)
  const [currentPos,  setCurrentPos]  = useState(null)
  const [mapReady,    setMapReady]    = useState(false)

  useEffect(() => {
    if (bookingId) dispatch(fetchBookingById(bookingId))
  }, [bookingId, dispatch])

  // ── Init Map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style:     'mapbox://styles/mapbox/dark-v11',
      center:    [78.9629, 20.5937],
      zoom:      5,
      attributionControl: false,
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    mapRef.current.on('load', () => setMapReady(true))

    return () => {
      cancelAnimationFrame(animFrame.current)
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // ── Draw route and animate when booking + map ready ───────────────────────
  useEffect(() => {
    if (!mapReady || !booking || !mapRef.current) return

    const startCoords = [booking.startHub?.coordinates?.lng || 72.87, booking.startHub?.coordinates?.lat || 19.07]
    const endCoords   = [booking.endHub?.coordinates?.lng   || 73.85, booking.endHub?.coordinates?.lat   || 18.52]

    // Hub markers
    const addHubEl = (label) => {
      const el = document.createElement('div')
      el.style.cssText = `
        width:16px;height:16px;background:#E8A020;border-radius:50%;
        box-shadow:0 0 0 4px rgba(232,160,32,0.2),0 0 16px rgba(232,160,32,0.4);
        cursor:default;
      `
      const popup = new mapboxgl.Popup({ offset: 20 })
        .setHTML(`<div style="font-family:'Space Mono',monospace;font-size:0.65rem;color:#E8A020;background:#1A1A1A;padding:6px 10px;border:1px solid rgba(232,160,32,0.2)">${label}</div>`)
      return { el, popup }
    }

    const { el: startEl, popup: startPop } = addHubEl(booking.startHub?.name || 'Start Hub')
    const { el: endEl,   popup: endPop   } = addHubEl(booking.endHub?.name   || 'End Hub')

    new mapboxgl.Marker(startEl).setLngLat(startCoords).setPopup(startPop).addTo(mapRef.current)
    new mapboxgl.Marker(endEl).setLngLat(endCoords).setPopup(endPop).addTo(mapRef.current)

    // Route line
    if (mapRef.current.getLayer('route')) {
      mapRef.current.removeLayer('route')
      mapRef.current.removeSource('route')
    }
    mapRef.current.addSource('route', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [startCoords, endCoords] } },
    })
    mapRef.current.addLayer({
      id: 'route', type: 'line', source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#E8A020', 'line-width': 2, 'line-opacity': 0.7, 'line-dasharray': [2, 3] },
    })

    // Vehicle marker
    const carEl = document.createElement('div')
    carEl.style.cssText = `
      width:14px;height:14px;background:#C93030;border-radius:50%;
      box-shadow:0 0 0 4px rgba(201,48,48,0.2),0 0 16px rgba(201,48,48,0.6);
    `
    vehicleMarker.current?.remove()
    vehicleMarker.current = new mapboxgl.Marker(carEl).setLngLat(startCoords).addTo(mapRef.current)
    setCurrentPos(startCoords)

    // Fit bounds
    mapRef.current.fitBounds([startCoords, endCoords], { padding: 80, maxZoom: 10 })

    // ── GPS simulation ──
    if (booking.status === 'active' || booking.status === 'in_transit') {
      const STEPS = 200
      let step = stepRef.current

      const animate = () => {
        step = Math.min(step + 1, STEPS)
        const t   = step / STEPS
        const lng = startCoords[0] + (endCoords[0] - startCoords[0]) * t
        const lat = startCoords[1] + (endCoords[1] - startCoords[1]) * t
        // Add slight sine wave for realistic road curve
        const waveLng = lng + Math.sin(t * Math.PI * 3) * 0.05
        const waveLat = lat + Math.cos(t * Math.PI * 2) * 0.02

        vehicleMarker.current?.setLngLat([waveLng, waveLat])
        setCurrentPos([waveLng, waveLat])
        setSimProgress(Math.round(t * 100))
        stepRef.current = step

        if (step < STEPS) {
          animFrame.current = requestAnimationFrame(() => setTimeout(animate, 80))
        }
      }
      animFrame.current = requestAnimationFrame(animate)
    }

    return () => cancelAnimationFrame(animFrame.current)
  }, [mapReady, booking])

  return (
    <div className="space-y-6 animate-[fadeUp_0.5s_ease_forwards]">
      <div>
        <span className="section-eyebrow">Live Tracking</span>
        <h1 className="font-display text-5xl text-brand-cream">
          Vehicle <span className="text-brand-amber">Tracker</span>
        </h1>
      </div>

      {/* Booking info bar */}
      {booking && (
        <div className="card p-4 border border-white/8 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <Car size={18} className="text-brand-amber" />
            <div>
              <p className="text-sm font-medium text-brand-cream">{booking.vehicle?.make} {booking.vehicle?.model}</p>
              <p className="font-mono text-xs text-brand-muted">{booking.vehicle?.plateNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-brand-amber" />
            <span className="font-mono text-xs text-brand-muted">{booking.startHub?.name}</span>
            <span className="text-brand-muted">→</span>
            <span className="font-mono text-xs text-brand-muted">{booking.endHub?.name}</span>
          </div>
          {(booking.status === 'active' || booking.status === 'in_transit') && (
            <div className="flex items-center gap-2 ml-auto">
              <Navigation size={14} className="text-brand-red animate-pulse" />
              <span className="font-mono text-xs text-brand-amber">{simProgress}% complete</span>
              <div className="w-32 h-1 bg-brand-mid">
                <div className="h-full bg-brand-amber transition-all duration-500" style={{ width: `${simProgress}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <div className="relative border border-white/8 overflow-hidden" style={{ height: '520px' }}>
        <div ref={mapContainer} className="w-full h-full" />
        {!mapReady && (
          <div className="absolute inset-0 bg-brand-black flex items-center justify-center">
            <Loader label="Loading map..." />
          </div>
        )}
        {!import.meta.env.VITE_MAPBOX_TOKEN && (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-black/90">
            <div className="text-center">
              <p className="font-mono text-xs text-brand-amber mb-2">MAPBOX TOKEN REQUIRED</p>
              <p className="text-brand-muted text-sm">Add VITE_MAPBOX_TOKEN to your .env file</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-6 font-mono text-xs text-brand-muted">
        <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-amber mr-2 align-middle" />Hub Node</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-red mr-2 align-middle" />Vehicle</span>
        <span><span className="inline-block w-8 h-px bg-brand-amber mr-2 align-middle" />Route</span>
      </div>

      {/* No booking selected */}
      {!bookingId && (
        <div className="card p-8 border border-white/8 text-center">
          <Navigation size={40} className="text-brand-muted mx-auto mb-4" />
          <p className="text-brand-muted text-sm">Select an active booking to track.</p>
          <a href="/bookings" className="btn-primary inline-flex mt-4">View My Bookings</a>
        </div>
      )}
    </div>
  )
}

export default TrackingPage