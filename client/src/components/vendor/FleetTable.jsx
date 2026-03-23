import { useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  Edit2, Trash2, ToggleLeft, ToggleRight,
  ChevronUp, ChevronDown, Car, Search,
} from 'lucide-react'
import { deleteVehicle, updateVehicle } from '../../store/slices/vehicleSlice'
import { formatINR, statusClass } from '../../utils/formatters'
import Modal from '../ui/Modal'
import AddVehicleForm from './AddVehicleForm'
import toast from 'react-hot-toast'

// ── Sort helper ───────────────────────────────────────────────────────────────
const useSortedFleet = (fleet) => {
  const [sort, setSort] = useState({ key: 'make', dir: 'asc' })

  const toggle = (key) => {
    setSort(s => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))
  }

  const sorted = [...fleet].sort((a, b) => {
    let av = a[sort.key] ?? ''
    let bv = b[sort.key] ?? ''
    if (typeof av === 'string') av = av.toLowerCase()
    if (typeof bv === 'string') bv = bv.toLowerCase()
    if (av < bv) return sort.dir === 'asc' ? -1 : 1
    if (av > bv) return sort.dir === 'asc' ?  1 : -1
    return 0
  })

  return { sorted, sort, toggle }
}

// ── Column header ─────────────────────────────────────────────────────────────
const ColHeader = ({ label, sortKey, current, dir, onToggle }) => (
  <th
    className="px-4 py-3 text-left font-mono text-xs tracking-widest uppercase text-brand-muted
               cursor-pointer select-none hover:text-brand-amber transition-colors"
    onClick={() => onToggle(sortKey)}
  >
    <span className="flex items-center gap-1">
      {label}
      {current === sortKey
        ? dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
        : <ChevronUp size={12} className="opacity-20" />
      }
    </span>
  </th>
)

// ── Main Table ────────────────────────────────────────────────────────────────
const FleetTable = ({ fleet = [], loading = false }) => {
  const dispatch = useDispatch()
  const { sorted, sort, toggle } = useSortedFleet(fleet)

  const [search,     setSearch]     = useState('')
  const [editTarget, setEditTarget] = useState(null)   // vehicle object
  const [deleting,   setDeleting]   = useState(null)   // id

  // Filter
  const filtered = sorted.filter(v => {
    const q = search.toLowerCase()
    return (
      v.make?.toLowerCase().includes(q)   ||
      v.model?.toLowerCase().includes(q)  ||
      v.plateNumber?.toLowerCase().includes(q) ||
      v.currentHub?.name?.toLowerCase().includes(q)
    )
  })

  const handleDelete = async (id) => {
    if (!confirm('Remove this vehicle from your fleet?')) return
    setDeleting(id)
    try {
      await dispatch(deleteVehicle(id)).unwrap()
      toast.success('Vehicle removed')
    } catch (err) {
      toast.error(err || 'Failed to remove')
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleAvailability = async (vehicle) => {
    try {
      await dispatch(updateVehicle({
        id: vehicle._id,
        formData: { isAvailable: !vehicle.isAvailable },
      })).unwrap()
      toast.success(`Marked as ${!vehicle.isAvailable ? 'available' : 'unavailable'}`)
    } catch (err) {
      toast.error(err || 'Failed to update')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="w-8 h-8 border-2 border-brand-mid border-t-brand-amber rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search fleet by make, model, plate, hub…"
          className="input-field pl-11"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 card border border-white/8">
          <Car size={40} className="text-brand-muted mx-auto mb-3" />
          <p className="text-brand-muted text-sm">
            {search ? 'No vehicles match your search.' : 'No vehicles in fleet yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-white/8">
          <table className="w-full min-w-[700px]">
            <thead className="bg-brand-slate border-b border-white/8">
              <tr>
                <ColHeader label="Vehicle"     sortKey="make"        current={sort.key} dir={sort.dir} onToggle={toggle} />
                <ColHeader label="Year"        sortKey="year"        current={sort.key} dir={sort.dir} onToggle={toggle} />
                <ColHeader label="Plate"       sortKey="plateNumber" current={sort.key} dir={sort.dir} onToggle={toggle} />
                <ColHeader label="Hub"         sortKey="currentHub"  current={sort.key} dir={sort.dir} onToggle={toggle} />
                <ColHeader label="Price/Day"   sortKey="pricePerDay" current={sort.key} dir={sort.dir} onToggle={toggle} />
                <th className="px-4 py-3 text-left font-mono text-xs tracking-widest uppercase text-brand-muted">Status</th>
                <th className="px-4 py-3 text-right font-mono text-xs tracking-widest uppercase text-brand-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(v => (
                <tr key={v._id} className="hover:bg-brand-mid/30 transition-colors group">
                  {/* Vehicle */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-brand-mid flex items-center justify-center flex-shrink-0">
                        {v.images?.[0]
                          ? <img src={v.images[0]} alt="" className="w-full h-full object-cover" />
                          : <Car size={16} className="text-brand-amber" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-brand-cream">{v.make} {v.model}</p>
                        <p className="font-mono text-xs text-brand-muted capitalize">{v.category}</p>
                      </div>
                    </div>
                  </td>

                  {/* Year */}
                  <td className="px-4 py-3 font-mono text-sm text-brand-muted">{v.year}</td>

                  {/* Plate */}
                  <td className="px-4 py-3 font-mono text-sm text-brand-amber">{v.plateNumber}</td>

                  {/* Hub */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-brand-muted">{v.currentHub?.name}</span>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3">
                    <span className="font-display text-lg text-brand-amber">{formatINR(v.pricePerDay)}</span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleAvailability(v)}
                      className="flex items-center gap-1.5 transition-colors group/toggle"
                    >
                      {v.isAvailable
                        ? <ToggleRight size={20} className="text-green-400" />
                        : <ToggleLeft  size={20} className="text-brand-muted" />
                      }
                      <span className={`font-mono text-xs ${v.isAvailable ? 'text-green-400' : 'text-brand-muted'}`}>
                        {v.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          console.log("Edit button clicked");
                          setEditTarget(v)}
                        }
                        className="p-1.5 text-brand-muted hover:text-brand-amber hover:bg-brand-amber/10 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(v._id)}
                        disabled={deleting === v._id}
                        className="p-1.5 text-brand-muted hover:text-brand-red hover:bg-brand-red/10 transition-colors disabled:opacity-40"
                        title="Delete"
                      >
                        {deleting === v._id
                          ? <span className="w-3 h-3 border border-brand-red border-t-transparent rounded-full animate-spin block" />
                          : <Trash2 size={15} />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-4 py-2 bg-brand-slate border-t border-white/8">
            <span className="font-mono text-xs text-brand-muted">
              {filtered.length} of {fleet.length} vehicle{fleet.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Edit modal (reuses AddVehicleForm pre-filled) */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Edit — ${editTarget?.make} ${editTarget?.model}`}
        size="lg"
      >
        {editTarget && (
          <AddVehicleForm
            initialValues={editTarget}
            isEdit
            onClose={() => setEditTarget(null)}
          />
        )}
      </Modal>
    </div>
  )
}

export default FleetTable