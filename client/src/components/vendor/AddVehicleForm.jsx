import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Upload, X, AlertCircle, Car } from 'lucide-react'
import { addVehicle, updateVehicle } from '../../store/slices/vehicleSlice'
import { validateVehicleForm, hasErrors } from '../../utils/validators'
import { HUBS } from '../../utils/formatters'
import toast from 'react-hot-toast'

const CATEGORIES = ['sedan', 'suv', 'hatchback', 'bike']

const AddVehicleForm = ({ initialValues = null, isEdit = false, onClose, onSuccess }) => {

  const dispatch = useDispatch()

  const [form, setForm] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    plateNumber: '',
    pricePerDay: '',
    category: 'sedan',
    currentHub: HUBS[0],
    description: '',
  })

  const [errors, setErrors] = useState({})
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(false)

  /* ───────── Populate form when editing ───────── */

  useEffect(() => {

    if (!initialValues) return

    setForm({
      make: initialValues.make || '',
      model: initialValues.model || '',
      year: initialValues.year || new Date().getFullYear(),
      plateNumber: initialValues.plateNumber || '',
      pricePerDay: initialValues.pricePerDay || '',
      category: initialValues.category || 'sedan',
      currentHub: initialValues.currentHub || HUBS[0],
      description: initialValues.description || '',
    })

    if (initialValues.images?.length) {
      setPreviews(initialValues.images)
    }

  }, [initialValues])

  /* ───────── Field change ───────── */

  const handleChange = (e) => {

    const { name, value } = e.target

    setForm(f => ({ ...f, [name]: value }))

    if (errors[name]) {
      setErrors(er => ({ ...er, [name]: null }))
    }
  }

  /* ───────── Hub select ───────── */

  const handleHub = (hubName) => {

    const hub = HUBS.find(h => h.name === hubName)

    if (!hub) return

    setForm(f => ({ ...f, currentHub: hub }))

    if (errors.currentHub) {
      setErrors(er => ({ ...er, currentHub: null }))
    }
  }

  /* ───────── Image upload ───────── */

  const handleImages = (e) => {

    const files = Array.from(e.target.files).slice(0, 5)

    setImages(files)

    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const removeImage = (index) => {

    setImages(imgs => imgs.filter((_, i) => i !== index))

    setPreviews(pvs => pvs.filter((_, i) => i !== index))
  }

  /* ───────── Submit ───────── */

  const handleSubmit = async (e) => {

    e.preventDefault()

    const payload = {
      ...form,
      make: form.make.trim(),
      model: form.model.trim(),
      plateNumber: form.plateNumber.trim().toUpperCase(),
      year: Number(form.year),
      pricePerDay: Number(form.pricePerDay),
    }

    const errs = validateVehicleForm(payload)

    if (hasErrors(errs)) {
      setErrors(errs)
      return
    }

    if (!isEdit && images.length === 0) {
      toast.error("Please upload at least one vehicle photo")
      return
    }

    setLoading(true)

    try {

      const fd = new FormData()

      fd.append('make', payload.make)
      fd.append('model', payload.model)
      fd.append('year', payload.year)
      fd.append('plateNumber', payload.plateNumber)
      fd.append('pricePerDay', payload.pricePerDay)
      fd.append('category', payload.category)
      fd.append('currentHub', JSON.stringify(payload.currentHub))

      if (payload.description?.trim()) {
        fd.append('description', payload.description.trim())
      }

      if (images.length) {
        images.forEach(img => fd.append('images', img))
      }

      if (isEdit) {

        await dispatch(updateVehicle({
          id: initialValues?._id,
          formData: fd
        })).unwrap()

        toast.success("Vehicle updated successfully")

      } else {

        await dispatch(addVehicle(fd)).unwrap()

        toast.success(`${payload.make} ${payload.model} added to fleet!`)
      }

      onSuccess?.()
      onClose?.()

    } catch (err) {

      console.error(err)

      toast.error(err || 'Failed to save vehicle')

    } finally {

      setLoading(false)
    }
  }

  /* ───────── Field helper ───────── */

  const Field = ({ name, label, type = 'text', placeholder, min, max, children }) => (

    <div>

      <label className="input-label">{label}</label>

      {children || (

        <input
          type={type}
          name={name}
          value={form[name]}
          onChange={handleChange}
          placeholder={placeholder}
          min={min}
          max={max}
          className={`input-field ${errors[name] ? 'border-brand-red/50 focus:border-brand-red' : ''}`}
        />

      )}

      {errors[name] && (
        <p className="flex items-center gap-1 mt-1.5 font-mono text-xs text-brand-red">
          <AlertCircle size={11} />{errors[name]}
        </p>
      )}

    </div>
  )

  return (

    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      {/* Make + Model */}

      <div className="grid grid-cols-2 gap-4">
        <Field name="make" label="Make" placeholder="Honda" />
        <Field name="model" label="Model" placeholder="City" />
      </div>

      {/* Year + Plate */}

      <div className="grid grid-cols-2 gap-4">

        <Field
          name="year"
          label="Year"
          type="number"
          min="2000"
          max={new Date().getFullYear() + 1}
        />

        <Field
          name="plateNumber"
          label="Plate Number"
          placeholder="MH01AB1234"
        />

      </div>

      {/* Price + Category */}

      <div className="grid grid-cols-2 gap-4">

        <Field
          name="pricePerDay"
          label="Price per Day (₹)"
          type="number"
          min="0"
        />

        <div>

          <label className="input-label">Category</label>

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="input-field"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>

        </div>

      </div>

      {/* Hub */}

      <Field name="currentHub" label="Current Hub Location">

        <select
          value={form.currentHub.name}
          onChange={(e) => handleHub(e.target.value)}
          className={`input-field ${errors.currentHub ? 'border-brand-red/50' : ''}`}
        >

          {HUBS.map(h => (
            <option key={h.name} value={h.name}>
              {h.name}
            </option>
          ))}

        </select>

      </Field>

      {/* Description */}

      <div>

        <label className="input-label">Description (optional)</label>

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
          className="input-field resize-none"
        />

      </div>

      {/* Images */}

      <div>

        <label className="input-label">Vehicle Photos (max 5)</label>

        {previews.length > 0 && (

          <div className="flex gap-2 flex-wrap mb-2">

            {previews.map((src, i) => (

              <div key={i} className="relative w-20 h-20 group">

                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover border border-white/10"
                />

                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-brand-red flex items-center justify-center"
                >
                  <X size={10} />
                </button>

              </div>

            ))}

          </div>

        )}

        <label className="w-full border-2 border-dashed border-white/15 p-6 flex flex-col items-center gap-2 cursor-pointer">

          <Upload size={24} />

          <span className="text-sm">
            Click to upload photos
          </span>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImages}
            className="hidden"
          />

        </label>

      </div>

      {/* Buttons */}

      <div className="flex gap-3 pt-2 border-t border-white/8">

        <button
          type="button"
          onClick={onClose}
          className="btn-outline flex-1"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >

          {loading
            ? <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
            : <>
                <Car size={16} />
                {isEdit ? "Update Vehicle" : "Add to Fleet"}
              </>
          }

        </button>

      </div>

    </form>
  )
}

export default AddVehicleForm