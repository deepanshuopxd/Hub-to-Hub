import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Car, Plus, Search, Edit2, Trash2, ArrowRight, MapPin, Building, ArrowLeft } from 'lucide-react'
import {
  fetchVehicles, fetchVendorVehicles, addVehicle, updateVehicle, deleteVehicle,
  selectVehicles, selectVendorFleet, selectVehicleLoading, selectFleetLoading,
} from '../store/slices/vehicleSlice'
import { useAuth } from '../hooks/useAuth'
import { formatINR } from '../utils/formatters'
import { selectUser } from '../store/slices/authSlice'
import { validateVehicleForm, hasErrors } from '../utils/validators'
import Modal  from '../components/ui/Modal'
import Loader from '../components/ui/Loader'
import api    from '../services/api'
import toast  from 'react-hot-toast'

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR SECTION — Add/Edit vehicle forms
// ─────────────────────────────────────────────────────────────────────────────

const VehicleForm = ({ initial, onClose, onSubmit, submitLabel, vendorHub = null }) => {
  const [form,    setForm]    = useState(initial)
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [images,  setImages]  = useState([])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(er => ({ ...er, [name]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validateVehicleForm(form)
    if (hasErrors(errs)) { setErrors(errs); return }

    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'currentHub' || k === 'homeService') fd.append(k, JSON.stringify(v))
      else if (v !== undefined && v !== null) fd.append(k, v)
    })
    images.forEach(img => fd.append('images', img))

    setLoading(true)
    try {
      await onSubmit(fd)
      onClose()
    } catch (err) {
      toast.error(err || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {[
          { name: 'make',  label: 'Make',  placeholder: 'Honda' },
          { name: 'model', label: 'Model', placeholder: 'City'  },
        ].map(({ name, label, placeholder }) => (
          <div key={name}>
            <label className="input-label">{label}</label>
            <input name={name} value={form[name]} onChange={handleChange}
              placeholder={placeholder}
              className={"input-field " + (errors[name] ? 'border-brand-red/50' : '')} />
            {errors[name] && <p className="font-mono text-xs text-brand-red mt-1">{errors[name]}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="input-label">Year</label>
          <input type="number" name="year" value={form.year} onChange={handleChange}
            min="2000" max={new Date().getFullYear() + 1}
            className={"input-field " + (errors.year ? 'border-brand-red/50' : '')} />
          {errors.year && <p className="font-mono text-xs text-brand-red mt-1">{errors.year}</p>}
        </div>
        <div>
          <label className="input-label">Plate Number</label>
          <input name="plateNumber" value={form.plateNumber} onChange={handleChange}
            placeholder="MH01AB1234"
            className={"input-field " + (errors.plateNumber ? 'border-brand-red/50' : '')} />
          {errors.plateNumber && <p className="font-mono text-xs text-brand-red mt-1">{errors.plateNumber}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="input-label">Price per Day (₹)</label>
          <input type="number" name="pricePerDay" value={form.pricePerDay} onChange={handleChange}
            placeholder="1500" min="0"
            className={"input-field " + (errors.pricePerDay ? 'border-brand-red/50' : '')} />
          {errors.pricePerDay && <p className="font-mono text-xs text-brand-red mt-1">{errors.pricePerDay}</p>}
        </div>
        <div>
          <label className="input-label">Category</label>
          <select name="category" value={form.category} onChange={handleChange} className="input-field">
            {['sedan', 'suv', 'hatchback', 'bike', 'van'].map(c => (
              <option key={c} value={c}>{c.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="input-label">Security Deposit (₹)</label>
        <input type="number" name="securityDeposit" value={form.securityDeposit ?? 2000} onChange={handleChange}
          placeholder="2000" min="0" className="input-field" />
        <p className="font-mono text-[10px] text-brand-muted mt-1">Held from customer, returned on completion</p>
      </div>

      {/* Hub — read-only from vendor's rental service */}
      <div>
        <label className="input-label">Hub Location</label>
        {vendorHub ? (
          <div className="input-field bg-brand-mid/60 flex items-center gap-3 cursor-not-allowed">
            <MapPin size={14} className="text-brand-amber shrink-0" />
            <div>
              <p className="text-sm text-brand-cream">{vendorHub.name}</p>
              <p className="font-mono text-xs text-brand-muted">{vendorHub.city}</p>
            </div>
          </div>
        ) : (
          <p className="font-mono text-xs text-brand-red p-3 border border-brand-red/20 bg-brand-red/5">
            Complete rental service registration first.
          </p>
        )}
      </div>

      <div>
        <label className="input-label">
          Vehicle Images
          {submitLabel === 'Save Changes' && (
            <span className="text-brand-muted ml-1 text-[10px]">(leave empty to keep existing)</span>
          )}
        </label>
        <input type="file" accept="image/*" multiple
          onChange={e => setImages(Array.from(e.target.files))}
          className="input-field py-2 text-sm file:mr-4 file:py-1 file:px-3 file:border-0
                     file:bg-brand-amber/20 file:text-brand-amber file:font-mono file:text-xs file:cursor-pointer" />
        {images.length > 0 && <p className="font-mono text-xs text-brand-muted mt-1">{images.length} file(s) selected</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
        <button type="submit" disabled={loading || !vendorHub}
          className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40">
          {loading
            ? <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
            : submitLabel}
        </button>
      </div>
    </form>
  )
}

const AddVehicleForm = ({ onClose }) => {
  const dispatch = useDispatch()
  const user     = useSelector(selectUser)
  const vendorHub = user?.rentalService ? {
    name:          user.rentalService.name,
    city:          user.rentalService.city,
    address:       user.rentalService.address || '',
    lat:           user.rentalService.lat  || 0,
    lng:           user.rentalService.lng  || 0,
    vendorId:      user._id,
    rentalService: user.rentalService.name,
  } : null

  const initial = {
    make: '', model: '', year: new Date().getFullYear(),
    plateNumber: '', pricePerDay: '', category: 'sedan',
    securityDeposit: 2000, currentHub: vendorHub,
  }
  const onSubmit = async (fd) => {
    if (vendorHub) fd.append('homeService', JSON.stringify({
      vendorId: user._id, name: user.rentalService.name,
      city: user.rentalService.city, address: user.rentalService.address || '',
      lat: user.rentalService.lat || 0, lng: user.rentalService.lng || 0,
    }))
    await dispatch(addVehicle(fd)).unwrap()
    toast.success('Vehicle added!')
  }
  return <VehicleForm initial={initial} onClose={onClose} onSubmit={onSubmit} submitLabel="Add Vehicle" vendorHub={vendorHub} />
}

const EditVehicleForm = ({ vehicle, onClose }) => {
  const dispatch  = useDispatch()
  const user      = useSelector(selectUser)
  const vendorHub = vehicle.currentHub || (user?.rentalService ? {
    name: user.rentalService.name, city: user.rentalService.city,
    lat: user.rentalService.lat || 0, lng: user.rentalService.lng || 0,
    vendorId: user._id, rentalService: user.rentalService.name,
  } : null)

  const initial = {
    make: vehicle.make || '', model: vehicle.model || '',
    year: vehicle.year || new Date().getFullYear(),
    plateNumber: vehicle.plateNumber || '',
    pricePerDay: vehicle.pricePerDay || '',
    securityDeposit: vehicle.securityDeposit ?? 2000,
    category: vehicle.category || 'sedan',
    currentHub: vendorHub,
  }
  const onSubmit = async (fd) => {
    await dispatch(updateVehicle({ id: vehicle._id, formData: fd })).unwrap()
    toast.success('Vehicle updated!')
  }
  return <VehicleForm initial={initial} onClose={onClose} onSubmit={onSubmit} submitLabel="Save Changes" vendorHub={vendorHub} />
}

// ── Vehicle Card (vendor view) ────────────────────────────────────────────────
const VehicleCard = ({ vehicle, isVendor, onDelete, onEdit }) => (
  <div className="card border border-white/8 overflow-hidden group">
    <div className="h-40 bg-brand-mid flex items-center justify-center relative overflow-hidden">
      {vehicle.images?.length > 0 ? (
        <img src={vehicle.images[0]} alt={vehicle.make} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <Car size={40} className="text-brand-muted/30" />
      )}
      <div className="absolute top-2 left-2">
        <span className="font-mono text-[10px] tracking-wider uppercase px-2 py-0.5
          bg-brand-black/60 backdrop-blur-sm text-brand-amber border border-brand-amber/30">
          {vehicle.category}
        </span>
      </div>
      <div className={"absolute top-2 right-2 w-2 h-2 rounded-full " + (vehicle.isAvailable ? 'bg-green-400' : 'bg-brand-red')} />
      {/* Relocated badge */}
      {vehicle.isCurrentlyHere && !vehicle.isOriginallyMine && (
        <div className="absolute bottom-2 left-2 right-2">
          <span className="font-mono text-[9px] bg-blue-500/80 text-white px-2 py-0.5 block text-center truncate">
            From: {vehicle.originalService}
          </span>
        </div>
      )}
    </div>
    <div className="p-3 sm:p-4">
      <div className="flex items-start justify-between mb-1 gap-2">
        <h3 className="font-medium text-brand-cream text-sm sm:text-base truncate">{vehicle.make} {vehicle.model}</h3>
        <span className="font-display text-lg sm:text-xl text-brand-amber shrink-0">{formatINR(vehicle.pricePerDay)}</span>
      </div>
      <p className="font-mono text-xs text-brand-muted mb-0.5">{vehicle.year} · {vehicle.plateNumber}</p>
      <p className="font-mono text-xs text-brand-muted truncate">{vehicle.currentHub?.name}</p>

      {isVendor && (
        <div className="flex gap-2 mt-3">
          {vehicle.isOriginallyMine !== false && (
            <button onClick={() => onEdit(vehicle)}
              className="btn-ghost flex-1 text-xs flex items-center justify-center gap-1 py-1.5">
              <Edit2 size={11} /> Edit
            </button>
          )}
          <button onClick={() => onDelete(vehicle._id)}
            className="btn-danger flex-1 text-xs flex items-center justify-center gap-1 py-1.5">
            <Trash2 size={11} /> Delete
          </button>
        </div>
      )}
    </div>
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER SECTION — City → Rental Service → Vehicles
// ─────────────────────────────────────────────────────────────────────────────

// ── Step 1: Search city ───────────────────────────────────────────────────────
const CitySearchStep = ({ onCitySelect }) => {
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState([])
  const [searching, setSearching] = useState(false)
  const [popular,   setPopular]   = useState([])

  // Load popular cities on mount
  useEffect(() => {
    api.get('/vendors/cities').then(({ data }) => {
      setPopular(data.cities?.slice(0, 10) || [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await api.get(`/vendors/cities-with-vehicles`)
        const filtered = data.hubs?.filter(h =>
          h.city?.toLowerCase().includes(query.toLowerCase())
        ) || []
        setResults(filtered)
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-[fadeUp_0.4s_ease_forwards]">
      <div>
        <span className="section-eyebrow">Browse Vehicles</span>
        <h1 className="font-display text-3xl sm:text-4xl text-brand-cream">
          Where are you <span className="text-brand-amber">picking up?</span>
        </h1>
        <p className="font-mono text-xs text-brand-muted mt-2">
          Search for a city to see available rental services
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search city (e.g. Mumbai, Varanasi...)"
          className="input-field pl-12 py-4 text-base"
          autoFocus
        />
        {searching && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-amber/40 border-t-brand-amber rounded-full animate-spin" />
        )}
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <p className="font-mono text-xs text-brand-muted">Results for "{query}"</p>
          {results.map(h => (
            <button key={h.city} onClick={() => onCitySelect(h.city)}
              className="w-full text-left p-4 card border border-white/8 hover:border-brand-amber/30 hover:bg-brand-amber/5 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-brand-amber shrink-0" />
                  <div>
                    <p className="font-medium text-brand-cream group-hover:text-brand-amber transition-colors">{h.city}</p>
                    <p className="font-mono text-xs text-brand-muted">
                      {h.vehicleCount} vehicle{h.vehicleCount !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-brand-muted group-hover:text-brand-amber transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && !searching && (
        <div className="card p-8 border border-white/8 text-center">
          <MapPin size={32} className="text-brand-muted mx-auto mb-3" />
          <p className="text-brand-muted">No rental services found in "{query}"</p>
          <p className="font-mono text-xs text-brand-muted mt-1">Try a different city name</p>
        </div>
      )}

      {/* Popular cities */}
      {query.length < 2 && popular.length > 0 && (
        <div>
          <p className="font-mono text-xs text-brand-muted uppercase tracking-widest mb-3">Popular Cities</p>
          <div className="flex flex-wrap gap-2">
            {popular.map(city => (
              <button key={city} onClick={() => onCitySelect(city)}
                className="px-4 py-2 border border-white/10 font-mono text-sm text-brand-muted
                           hover:border-brand-amber/50 hover:text-brand-amber transition-colors">
                {city}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Step 2: Select rental service ─────────────────────────────────────────────
const RentalServiceStep = ({ city, onSelect, onBack }) => {
  const [services, setServices]  = useState([])
  const [loading,  setLoading]   = useState(true)

  useEffect(() => {
    api.get(`/vendors/search?city=${encodeURIComponent(city)}`)
      .then(({ data }) => setServices(data.vendors || []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false))
  }, [city])

  return (
    <div className="space-y-5 animate-[fadeUp_0.4s_ease_forwards]">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 font-mono text-xs text-brand-muted hover:text-brand-amber transition-colors mb-3">
          <ArrowLeft size={13} /> Back to city search
        </button>
        <span className="section-eyebrow">Rental Services in</span>
        <h1 className="font-display text-3xl sm:text-4xl text-brand-cream">
          <span className="text-brand-amber">{city}</span>
        </h1>
        <p className="font-mono text-xs text-brand-muted mt-1">
          Select a rental service to browse their vehicles
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader label="Finding services..." /></div>
      ) : services.length === 0 ? (
        <div className="card p-12 border border-white/8 text-center">
          <Building size={40} className="text-brand-muted mx-auto mb-3" />
          <p className="text-brand-muted">No rental services in {city} yet</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(s => (
            <button key={s.vendorId} onClick={() => onSelect(s)}
              className="text-left card p-5 border border-white/8 hover:border-brand-amber/30 hover:bg-brand-amber/5 transition-all group">
              <Building size={24} className="text-brand-amber mb-3" />
              <h3 className="font-medium text-brand-cream group-hover:text-brand-amber transition-colors mb-1">
                {s.serviceName}
              </h3>
              <p className="font-mono text-xs text-brand-muted">{s.city}</p>
              {s.address && <p className="font-mono text-xs text-brand-muted truncate mt-0.5">{s.address}</p>}
              <div className="flex items-center gap-1 mt-3 text-brand-amber font-mono text-xs">
                Browse vehicles <ArrowRight size={12} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Step 3: Vehicles from chosen rental service ───────────────────────────────
const ServiceVehiclesStep = ({ service, onBack }) => {
  const dispatch = useDispatch()
  const vehicles = useSelector(selectVehicles)
  const loading  = useSelector(selectVehicleLoading)
  const [search, setSearch] = useState('')

  useEffect(() => {
    // Fetch vehicles filtered by this vendor
    dispatch(fetchVehicles({ vendorId: service.vendorId }))
  }, [service.vendorId, dispatch])

  const filtered = vehicles.filter(v =>
    `${v.make} ${v.model} ${v.category} ${v.plateNumber}`
      .toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-[fadeUp_0.4s_ease_forwards]">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 font-mono text-xs text-brand-muted hover:text-brand-amber transition-colors mb-3">
          <ArrowLeft size={13} /> Back to {service.city} services
        </button>
        <span className="section-eyebrow">{service.serviceName}</span>
        <h1 className="font-display text-3xl sm:text-4xl text-brand-cream">
          Available <span className="text-brand-amber">Vehicles</span>
        </h1>
        <p className="font-mono text-xs text-brand-muted mt-1">{service.city}</p>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by make, model, category..."
          className="input-field pl-11" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader label="Loading vehicles..." /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 border border-white/8 text-center">
          <Car size={40} className="text-brand-muted mx-auto mb-3" />
          <p className="text-brand-muted">
            {vehicles.length === 0 ? 'No vehicles available at this service' : 'No vehicles match your search'}
          </p>
        </div>
      ) : (
        <>
          <p className="font-mono text-xs text-brand-muted">{filtered.length} vehicle{filtered.length !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(v => (
              <CustomerVehicleCard key={v._id} vehicle={v} service={service} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Customer vehicle card ─────────────────────────────────────────────────────
const CustomerVehicleCard = ({ vehicle, service }) => (
  <div className="card border border-white/8 overflow-hidden group">
    <div className="h-40 bg-brand-mid relative overflow-hidden">
      {vehicle.images?.length > 0 ? (
        <img src={vehicle.images[0]} alt={vehicle.make} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full flex items-center justify-center"><Car size={40} className="text-brand-muted/30" /></div>
      )}
      <div className="absolute top-2 left-2">
        <span className="font-mono text-[10px] uppercase px-2 py-0.5
          bg-brand-black/60 backdrop-blur-sm text-brand-amber border border-brand-amber/30">
          {vehicle.category}
        </span>
      </div>
      <div className={"absolute top-2 right-2 w-2 h-2 rounded-full " + (vehicle.isAvailable ? 'bg-green-400' : 'bg-brand-red')} />
    </div>
    <div className="p-4">
      <div className="flex items-start justify-between mb-1 gap-2">
        <h3 className="font-medium text-brand-cream truncate">{vehicle.make} {vehicle.model}</h3>
        <span className="font-display text-xl text-brand-amber shrink-0">{formatINR(vehicle.pricePerDay)}</span>
      </div>
      <p className="font-mono text-xs text-brand-muted mb-0.5">{vehicle.year}</p>
      <p className="font-mono text-xs text-brand-muted">Deposit: {formatINR(vehicle.securityDeposit || 2000)}</p>
      {vehicle.isAvailable ? (
        <Link to={`/vehicles/${vehicle._id}/book`}
          className="btn-primary w-full text-center flex items-center justify-center gap-2 mt-3">
          Book Now <ArrowRight size={14} />
        </Link>
      ) : (
        <button disabled className="btn-outline w-full mt-3 opacity-40 cursor-not-allowed">
          Not Available
        </button>
      )}
    </div>
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const VehiclesPage = ({ vendor = false }) => {
  const dispatch     = useDispatch()
  const { isVendor } = useAuth()
  const isVendorView = vendor || isVendor

  // ── Customer state ──
  const [step,            setStep]           = useState('city')    // city | service | vehicles
  const [selectedCity,    setSelectedCity]   = useState(null)
  const [selectedService, setSelectedService]= useState(null)

  // ── Vendor state ──
  const fleet        = useSelector(selectVendorFleet)
  const loading      = useSelector(selectFleetLoading)
  const [search,     setSearch]      = useState('')
  const [showAdd,    setShowAdd]     = useState(false)
  const [editVehicle,setEditVehicle] = useState(null)

  useEffect(() => {
    if (isVendorView) dispatch(fetchVendorVehicles())
  }, [isVendorView, dispatch])

  const handleDelete = async (id) => {
    if (!confirm('Remove this vehicle?')) return
    try {
      await dispatch(deleteVehicle(id)).unwrap()
      toast.success('Vehicle removed')
    } catch (err) { toast.error(err || 'Failed') }
  }

  const filtered = fleet.filter(v =>
    `${v.make} ${v.model} ${v.plateNumber} ${v.currentHub?.city || ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

  // ── Customer browse ───────────────────────────────────────────────────────
  if (!isVendorView) {
    if (step === 'city') {
      return (
        <div className="animate-[fadeUp_0.5s_ease_forwards]">
          <CitySearchStep onCitySelect={city => { setSelectedCity(city); setStep('service') }} />
        </div>
      )
    }
    if (step === 'service') {
      return (
        <div className="animate-[fadeUp_0.5s_ease_forwards]">
          <RentalServiceStep
            city={selectedCity}
            onSelect={service => { setSelectedService(service); setStep('vehicles') }}
            onBack={() => setStep('city')}
          />
        </div>
      )
    }
    if (step === 'vehicles') {
      return (
        <div className="animate-[fadeUp_0.5s_ease_forwards]">
          <ServiceVehiclesStep
            service={selectedService}
            onBack={() => setStep('service')}
          />
        </div>
      )
    }
  }

  // ── Vendor fleet ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 sm:space-y-6 animate-[fadeUp_0.5s_ease_forwards]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <span className="section-eyebrow">Fleet Management</span>
          <h1 className="font-display text-3xl sm:text-5xl text-brand-cream">My Fleet</h1>
          <p className="font-mono text-xs text-brand-muted mt-1">
            Includes vehicles originally yours + currently at your hub
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus size={16} /> Add Vehicle
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search fleet..." className="input-field pl-11" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader label="Loading fleet..." /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 border border-white/8 text-center">
          <Car size={40} className="text-brand-muted mx-auto mb-3" />
          <p className="text-brand-muted">No vehicles in fleet</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary inline-flex items-center gap-2 mt-4">
            <Plus size={14} /> Add First Vehicle
          </button>
        </div>
      ) : (
        <>
          <p className="font-mono text-xs text-brand-muted">{filtered.length} vehicle{filtered.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(v => (
              <VehicleCard key={v._id} vehicle={v} isVendor onDelete={handleDelete} onEdit={setEditVehicle} />
            ))}
          </div>
        </>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Vehicle to Fleet" size="lg">
        <AddVehicleForm onClose={() => setShowAdd(false)} />
      </Modal>

      <Modal isOpen={!!editVehicle} onClose={() => setEditVehicle(null)} title="Edit Vehicle" size="lg">
        {editVehicle && <EditVehicleForm vehicle={editVehicle} onClose={() => setEditVehicle(null)} />}
      </Modal>
    </div>
  )
}

export default VehiclesPage
export { VehiclesPage }