// // ─────────────────────────────────────────────────────────────────────────────
// // VehiclesPage.jsx  — Browse / Vendor Fleet
// // ─────────────────────────────────────────────────────────────────────────────
// import { useEffect, useState } from 'react'
// import { Link } from 'react-router-dom'
// import { useDispatch, useSelector } from 'react-redux'
// import { Car, Plus, Search, Filter, Edit2, Trash2, ArrowRight, Star } from 'lucide-react'
// import {
//   fetchVehicles, fetchVendorVehicles, addVehicle, deleteVehicle,
//   selectVehicles, selectVendorFleet, selectVehicleLoading, selectFleetLoading,
// } from '../store/slices/vehicleSlice'
// import { useAuth } from '../hooks/useAuth'
// import { formatINR, HUBS } from '../utils/formatters'
// import { validateVehicleForm, hasErrors } from '../utils/validators'
// import Modal from '../components/ui/Modal'
// import Loader from '../components/ui/Loader'
// import toast from 'react-hot-toast'

// // ── Add Vehicle Form ──────────────────────────────────────────────────────────
// const AddVehicleForm = ({ onClose }) => {
//   const dispatch = useDispatch()
//   const [form, setForm] = useState({
//     make: '', model: '', year: new Date().getFullYear(),
//     plateNumber: '', pricePerDay: '', category: 'sedan',
//     currentHub: HUBS[0],
//   })
//   const [errors,   setErrors]   = useState({})
//   const [loading,  setLoading]  = useState(false)
//   const [images,   setImages]   = useState([])

//   const handleChange = (e) => {
//     const { name, value } = e.target
//     setForm(f => ({ ...f, [name]: value }))
//     if (errors[name]) setErrors(er => ({ ...er, [name]: null }))
//   }

//   const handleHub = (hubName) => {
//     const hub = HUBS.find(h => h.name === hubName)
//     if (hub) setForm(f => ({ ...f, currentHub: hub }))
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     const errs = validateVehicleForm(form)
//     if (hasErrors(errs)) { setErrors(errs); return }

//     const fd = new FormData()
//     Object.entries(form).forEach(([k, v]) => {
//       if (k === 'currentHub') fd.append(k, JSON.stringify(v))
//       else fd.append(k, v)
//     })
//     images.forEach(img => fd.append('images', img))

//     setLoading(true)
//     try {
//       await dispatch(addVehicle(fd)).unwrap()
//       toast.success('Vehicle added to fleet!')
//       onClose()
//     } catch (err) { toast.error(err || 'Failed to add vehicle') }
//     finally { setLoading(false) }
//   }

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div className="grid grid-cols-2 gap-4">
//         {[
//           { name: 'make',  label: 'Make',  placeholder: 'Honda' },
//           { name: 'model', label: 'Model', placeholder: 'City' },
//         ].map(({ name, label, placeholder }) => (
//           <div key={name}>
//             <label className="input-label">{label}</label>
//             <input name={name} value={form[name]} onChange={handleChange}
//               placeholder={placeholder} className={`input-field ${errors[name] ? 'border-brand-red/50' : ''}`} />
//             {errors[name] && <p className="font-mono text-xs text-brand-red mt-1">{errors[name]}</p>}
//           </div>
//         ))}
//       </div>

//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <label className="input-label">Year</label>
//           <input type="number" name="year" value={form.year} onChange={handleChange}
//             min="2000" max={new Date().getFullYear() + 1} className={`input-field ${errors.year ? 'border-brand-red/50' : ''}`} />
//           {errors.year && <p className="font-mono text-xs text-brand-red mt-1">{errors.year}</p>}
//         </div>
//         <div>
//           <label className="input-label">Plate Number</label>
//           <input name="plateNumber" value={form.plateNumber} onChange={handleChange}
//             placeholder="MH01AB1234" className={`input-field ${errors.plateNumber ? 'border-brand-red/50' : ''}`} />
//           {errors.plateNumber && <p className="font-mono text-xs text-brand-red mt-1">{errors.plateNumber}</p>}
//         </div>
//       </div>

//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <label className="input-label">Price per Day (₹)</label>
//           <input type="number" name="pricePerDay" value={form.pricePerDay} onChange={handleChange}
//             placeholder="1500" min="0" className={`input-field ${errors.pricePerDay ? 'border-brand-red/50' : ''}`} />
//           {errors.pricePerDay && <p className="font-mono text-xs text-brand-red mt-1">{errors.pricePerDay}</p>}
//         </div>
//         <div>
//           <label className="input-label">Category</label>
//           <select name="category" value={form.category} onChange={handleChange} className="input-field">
//             {['sedan','suv','hatchback','bike'].map(c => (
//               <option key={c} value={c}>{c.toUpperCase()}</option>
//             ))}
//           </select>
//         </div>
//       </div>

//       <div>
//         <label className="input-label">Current Hub</label>
//         <select value={form.currentHub.name} onChange={(e) => handleHub(e.target.value)} className={`input-field ${errors.currentHub ? 'border-brand-red/50' : ''}`}>
//           {HUBS.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
//         </select>
//         {errors.currentHub && <p className="font-mono text-xs text-brand-red mt-1">{errors.currentHub}</p>}
//       </div>

//       <div>
//         <label className="input-label">Vehicle Images</label>
//         <input type="file" accept="image/*" multiple
//           onChange={(e) => setImages(Array.from(e.target.files))}
//           className="input-field py-2 text-sm file:mr-4 file:py-1 file:px-3 file:border-0 file:bg-brand-amber/20 file:text-brand-amber file:font-mono file:text-xs file:cursor-pointer" />
//         {images.length > 0 && <p className="font-mono text-xs text-brand-muted mt-1">{images.length} file(s) selected</p>}
//       </div>

//       <div className="flex gap-3 pt-2">
//         <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
//         <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
//           {loading ? <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" /> : 'Add Vehicle'}
//         </button>
//       </div>
//     </form>
//   )
// }

// // ── Vehicle Card ──────────────────────────────────────────────────────────────
// const VehicleCard = ({ vehicle, isVendor, onDelete ,onEdit }) => (
//   <div className="card border border-white/8 overflow-hidden group">
//     {/* Image */}
//     <div className="h-44 bg-brand-mid flex items-center justify-center relative overflow-hidden">
//       {vehicle.images?.length > 0 ? (
//         <img src={vehicle.images[0]} alt={`${vehicle.make} ${vehicle.model}`}
//           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
//       ) : (
//         <Car size={48} className="text-brand-muted/30" />
//       )}
//       <div className="absolute top-3 left-3">
//         <span className="font-mono text-[10px] tracking-wider uppercase px-2 py-0.5
//                          bg-brand-black/60 backdrop-blur-sm text-brand-amber border border-brand-amber/30">
//           {vehicle.category}
//         </span>
//       </div>
//       <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${vehicle.isAvailable ? 'bg-green-400' : 'bg-brand-red'}`} />
//     </div>

//     <div className="p-4">
//       <div className="flex items-start justify-between mb-1">
//         <h3 className="font-medium text-brand-cream">{vehicle.make} {vehicle.model}</h3>
//         <span className="font-display text-xl text-brand-amber">{formatINR(vehicle.pricePerDay)}</span>
//       </div>
//       <p className="font-mono text-xs text-brand-muted mb-1">{vehicle.year} · {vehicle.plateNumber}</p>
//       <p className="font-mono text-xs text-brand-muted">{vehicle.currentHub?.name}</p>

//       <div className="flex gap-2 mt-4">
//         {isVendor ? (
//           <>
//             <button onClick={() => onEdit(vehicle)}
//               className="btn-ghost flex-1 text-xs flex items-center justify-center gap-1">
//               <Edit2 size={12} /> Edit
//             </button>
//             <button onClick={() => onDelete(vehicle._id)}
//               className="btn-danger flex-1 text-xs flex items-center justify-center gap-1">
//               <Trash2 size={12} /> Delete
//             </button>
            
//           </>
//         ) : (
//           <Link to={`/vehicles/${vehicle._id}/book`}
//             className="btn-primary flex-1 text-center flex items-center justify-center gap-2">
//             Book Now <ArrowRight size={14} />
//           </Link>
//         )}
//       </div>
//     </div>
//   </div>
// )

// // ── Page ──────────────────────────────────────────────────────────────────────
// const VehiclesPage = ({ vendor = false }) => {
//   const dispatch = useDispatch()
//   const { isVendor } = useAuth()
//   const isVendorView = vendor || isVendor

//   const vehicles = useSelector(isVendorView ? selectVendorFleet : selectVehicles)
//   const loading  = useSelector(isVendorView ? selectFleetLoading : selectVehicleLoading)

//   const [search,  setSearch]  = useState('')
//   const [showAdd, setShowAdd] = useState(false)

//   useEffect(() => {
//     if (isVendorView) dispatch(fetchVendorVehicles())
//     else              dispatch(fetchVehicles())
//   }, [dispatch, isVendorView])

//   const handleDelete = async (id) => {
//     if (!confirm('Remove this vehicle from your fleet?')) return
//     try {
//       await dispatch(deleteVehicle(id)).unwrap()
//       toast.success('Vehicle removed')
//     } catch (err) { toast.error(err || 'Failed to remove') }
//   }

//   const filtered = vehicles.filter(v =>
//     `${v.make} ${v.model} ${v.plateNumber} ${v.currentHub?.name}`
//       .toLowerCase().includes(search.toLowerCase())
//   )

//   return (
//     <div className="space-y-6 animate-[fadeUp_0.5s_ease_forwards]">
//       <div className="flex items-start justify-between">
//         <div>
//           <span className="section-eyebrow">{isVendorView ? 'Fleet Management' : 'Browse Vehicles'}</span>
//           <h1 className="font-display text-5xl text-brand-cream">
//             {isVendorView ? 'My Fleet' : <><span className="text-brand-amber">Available</span> Cars</>}
//           </h1>
//         </div>
//         {isVendorView && (
//           <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
//             <Plus size={16} /> Add Vehicle
//           </button>
//         )}
//       </div>

//       {/* Search */}
//       <div className="relative">
//         <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
//         <input
//           value={search} onChange={(e) => setSearch(e.target.value)}
//           placeholder="Search by make, model, hub..."
//           className="input-field pl-12"
//         />
//       </div>

//       {loading ? (
//         <div className="flex justify-center py-20"><Loader label="Loading vehicles..." /></div>
//       ) : filtered.length === 0 ? (
//         <div className="text-center py-20 card border border-white/8">
//           <Car size={48} className="text-brand-muted mx-auto mb-4" />
//           <p className="text-brand-muted">{isVendorView ? 'No vehicles in fleet.' : 'No vehicles match your search.'}</p>
//           {isVendorView && (
//             <button onClick={() => setShowAdd(true)} className="btn-primary inline-flex items-center gap-2 mt-4">
//               <Plus size={14} /> Add First Vehicle
//             </button>
//           )}
//         </div>
//       ) : (
//         <>
//           <p className="font-mono text-xs text-brand-muted">{filtered.length} vehicle{filtered.length !== 1 ? 's' : ''} found</p>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {filtered.map(v => (
//               <VehicleCard key={v._id} vehicle={v} isVendor={isVendorView} onDelete={handleDelete} />
//             ))}
//           </div>
//         </>
//       )}

//       <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Vehicle to Fleet" size="lg">
//         <AddVehicleForm onClose={() => setShowAdd(false)} />
//       </Modal>
//     </div>
//   )
// }

// export default VehiclesPage
// export { VehiclesPage }
























// ─────────────────────────────────────────────────────────────────────────────
// VehiclesPage.jsx  — Browse / Vendor Fleet
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Car, Plus, Search, Edit2, Trash2, ArrowRight } from 'lucide-react'
import {
  fetchVehicles, fetchVendorVehicles, addVehicle, updateVehicle, deleteVehicle,
  selectVehicles, selectVendorFleet, selectVehicleLoading, selectFleetLoading,
} from '../store/slices/vehicleSlice'
import { useAuth } from '../hooks/useAuth'
import { formatINR, HUBS } from '../utils/formatters'
import { validateVehicleForm, hasErrors } from '../utils/validators'
import Modal  from '../components/ui/Modal'
import Loader from '../components/ui/Loader'
import toast  from 'react-hot-toast'

// ── Shared vehicle form (Add + Edit) ─────────────────────────────────────────
const VehicleForm = ({ initial, onClose, onSubmit, submitLabel }) => {
  const [form,    setForm]    = useState(initial)
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [images,  setImages]  = useState([])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(er => ({ ...er, [name]: null }))
  }

  const handleHub = (hubName) => {
    const hub = HUBS.find(h => h.name === hubName)
    if (hub) setForm(f => ({ ...f, currentHub: hub }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validateVehicleForm(form)
    if (hasErrors(errs)) { setErrors(errs); return }

    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'currentHub') fd.append(k, JSON.stringify(v))
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
            <input
              name={name} value={form[name]} onChange={handleChange}
              placeholder={placeholder}
              className={"input-field " + (errors[name] ? 'border-brand-red/50' : '')}
            />
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
          <label className="input-label">Price per Day (Rs.)</label>
          <input type="number" name="pricePerDay" value={form.pricePerDay} onChange={handleChange}
            placeholder="1500" min="0"
            className={"input-field " + (errors.pricePerDay ? 'border-brand-red/50' : '')} />
          {errors.pricePerDay && <p className="font-mono text-xs text-brand-red mt-1">{errors.pricePerDay}</p>}
        </div>
        <div>
          <label className="input-label">Category</label>
          <select name="category" value={form.category} onChange={handleChange} className="input-field">
            {['sedan', 'suv', 'hatchback', 'bike','scooty'].map(c => (
              <option key={c} value={c}>{c.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="input-label">Current Hub</label>
        <select value={form.currentHub?.name || ''} onChange={(e) => handleHub(e.target.value)}
          className={"input-field " + (errors.currentHub ? 'border-brand-red/50' : '')}>
          {HUBS.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
        </select>
        {errors.currentHub && <p className="font-mono text-xs text-brand-red mt-1">{errors.currentHub}</p>}
      </div>

      <div>
        <label className="input-label">
          Vehicle Images
          {submitLabel === 'Save Changes' && (
            <span className="text-brand-muted ml-1">(leave empty to keep existing)</span>
          )}
        </label>
        <input type="file" accept="image/*" multiple
          onChange={(e) => setImages(Array.from(e.target.files))}
          className="input-field py-2 text-sm file:mr-4 file:py-1 file:px-3 file:border-0
                     file:bg-brand-amber/20 file:text-brand-amber file:font-mono file:text-xs file:cursor-pointer" />
        {images.length > 0 && (
          <p className="font-mono text-xs text-brand-muted mt-1">{images.length} file(s) selected</p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {loading
            ? <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
            : submitLabel}
        </button>
      </div>
    </form>
  )
}

// ── Add wrapper ───────────────────────────────────────────────────────────────
const AddVehicleForm = ({ onClose }) => {
  const dispatch = useDispatch()
  const initial  = {
    make: '', model: '', year: new Date().getFullYear(),
    plateNumber: '', pricePerDay: '', category: 'sedan',
    currentHub: HUBS[0],
  }
  const onSubmit = async (fd) => {
    await dispatch(addVehicle(fd)).unwrap()
    toast.success('Vehicle added to fleet!')
  }
  return <VehicleForm initial={initial} onClose={onClose} onSubmit={onSubmit} submitLabel="Add Vehicle" />
}

// ── Edit wrapper ──────────────────────────────────────────────────────────────
const EditVehicleForm = ({ vehicle, onClose }) => {
  const dispatch = useDispatch()
  const initial  = {
    make:        vehicle.make        || '',
    model:       vehicle.model       || '',
    year:        vehicle.year        || new Date().getFullYear(),
    plateNumber: vehicle.plateNumber || '',
    pricePerDay: vehicle.pricePerDay || '',
    category:    vehicle.category    || 'sedan',
    currentHub:  vehicle.currentHub  || HUBS[0],
  }
  const onSubmit = async (fd) => {
    await dispatch(updateVehicle({ id: vehicle._id, formData: fd })).unwrap()
    toast.success('Vehicle updated!')
  }
  return <VehicleForm initial={initial} onClose={onClose} onSubmit={onSubmit} submitLabel="Save Changes" />
}

// ── Vehicle Card ──────────────────────────────────────────────────────────────
const VehicleCard = ({ vehicle, isVendor, onDelete, onEdit }) => (
  <div className="card border border-white/8 overflow-hidden group">
    <div className="h-44 bg-brand-mid flex items-center justify-center relative overflow-hidden">
      {vehicle.images?.length > 0 ? (
        <img src={vehicle.images[0]} alt={vehicle.make + ' ' + vehicle.model}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <Car size={48} className="text-brand-muted/30" />
      )}
      <div className="absolute top-3 left-3">
        <span className="font-mono text-[10px] tracking-wider uppercase px-2 py-0.5
                         bg-brand-black/60 backdrop-blur-sm text-brand-amber border border-brand-amber/30">
          {vehicle.category}
        </span>
      </div>
      <div className={"absolute top-3 right-3 w-2 h-2 rounded-full " + (vehicle.isAvailable ? 'bg-green-400' : 'bg-brand-red')} />
    </div>

    <div className="p-4">
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-medium text-brand-cream">{vehicle.make} {vehicle.model}</h3>
        <span className="font-display text-xl text-brand-amber">{formatINR(vehicle.pricePerDay)}</span>
      </div>
      <p className="font-mono text-xs text-brand-muted mb-1">{vehicle.year} · {vehicle.plateNumber}</p>
      <p className="font-mono text-xs text-brand-muted">{vehicle.currentHub?.name}</p>

      <div className="flex gap-2 mt-4">
        {isVendor ? (
          <>
            <button onClick={() => onEdit(vehicle)}
              className="btn-ghost flex-1 text-xs flex items-center justify-center gap-1">
              <Edit2 size={12} /> Edit
            </button>
            <button onClick={() => onDelete(vehicle._id)}
              className="btn-danger flex-1 text-xs flex items-center justify-center gap-1">
              <Trash2 size={12} /> Delete
            </button>
          </>
        ) : (
          <Link to={"/vehicles/" + vehicle._id + "/book"}
            className="btn-primary flex-1 text-center flex items-center justify-center gap-2">
            Book Now <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  </div>
)

// ── Page ──────────────────────────────────────────────────────────────────────
const VehiclesPage = ({ vendor = false }) => {
  const dispatch = useDispatch()
  const { isVendor } = useAuth()
  const isVendorView = vendor || isVendor

  const vehicles = useSelector(isVendorView ? selectVendorFleet : selectVehicles)
  const loading  = useSelector(isVendorView ? selectFleetLoading : selectVehicleLoading)

  const [search,      setSearch]      = useState('')
  const [showAdd,     setShowAdd]     = useState(false)
  const [editVehicle, setEditVehicle] = useState(null)

  useEffect(() => {
    if (isVendorView) dispatch(fetchVendorVehicles())
    else              dispatch(fetchVehicles())
  }, [dispatch, isVendorView])

  const handleDelete = async (id) => {
    if (!confirm('Remove this vehicle from your fleet?')) return
    try {
      await dispatch(deleteVehicle(id)).unwrap()
      toast.success('Vehicle removed')
    } catch (err) { toast.error(err || 'Failed to remove') }
  }

  const filtered = vehicles.filter(v =>
    (v.make + ' ' + v.model + ' ' + v.plateNumber + ' ' + (v.currentHub?.name || ''))
      .toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-[fadeUp_0.5s_ease_forwards]">

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <span className="section-eyebrow">{isVendorView ? 'Fleet Management' : 'Browse Vehicles'}</span>
          <h1 className="font-display text-3xl sm:text-5xl text-brand-cream">
            {isVendorView ? 'My Fleet' : <><span className="text-brand-amber">Available</span> Cars</>}
          </h1>
        </div>
        {isVendorView && (
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
            <Plus size={16} /> Add Vehicle
          </button>
        )}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by make, model, hub..."
          className="input-field pl-12" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader label="Loading vehicles..." /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 card border border-white/8">
          <Car size={48} className="text-brand-muted mx-auto mb-4" />
          <p className="text-brand-muted">
            {isVendorView ? 'No vehicles in fleet.' : 'No vehicles match your search.'}
          </p>
          {isVendorView && (
            <button onClick={() => setShowAdd(true)} className="btn-primary inline-flex items-center gap-2 mt-4">
              <Plus size={14} /> Add First Vehicle
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="font-mono text-xs text-brand-muted">
            {filtered.length} vehicle{filtered.length !== 1 ? 's' : ''} found
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(v => (
              <VehicleCard key={v._id} vehicle={v} isVendor={isVendorView}
                onDelete={handleDelete} onEdit={setEditVehicle} />
            ))}
          </div>
        </>
      )}

      {/* Add modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Vehicle to Fleet" size="lg">
        <AddVehicleForm onClose={() => setShowAdd(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editVehicle} onClose={() => setEditVehicle(null)} title="Edit Vehicle" size="lg">
        {editVehicle && (
          <EditVehicleForm vehicle={editVehicle} onClose={() => setEditVehicle(null)} />
        )}
      </Modal>
    </div>
  )
}

export default VehiclesPage
export { VehiclesPage }



// i want to add different security deposits for different vechicle that is set by the vendor itself 

// also the money which is locking that is security deposit i want that initially all money comes to vendor account and later on after ride is completed that money will automatically comes to customer account the security deposit also  i want to add the feaure of adding the video and images while handing the vehicle to user and after the vehicle is dropped again the vendor at different hub will upload 