


// const multer = require("multer")
// const { CloudinaryStorage } = require("multer-storage-cloudinary")
// const cloudinary = require("../config/cloudinary")

// /* ---------------- Image Filter ---------------- */

// const imageFilter = (req, file, cb) => {
//   const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

//   if (allowed.includes(file.mimetype)) {
//     cb(null, true)
//   } else {
//     cb(new Error("Only JPG, PNG, or WEBP images allowed"), false)
//   }
// }

// /* ---------------- Document Filter ---------------- */

// const docFilter = (req, file, cb) => {
//   const allowed = [
//     "image/jpeg",
//     "image/jpg",
//     "image/png",
//     "image/webp",
//     "application/pdf",
//   ]

//   if (allowed.includes(file.mimetype)) {
//     cb(null, true)
//   } else {
//     cb(new Error("Only JPG, PNG, WEBP, or PDF allowed"), false)
//   }
// }

// /* ---------------- Vehicle Images Storage ---------------- */

// const vehicleStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: async (req, file) => ({
//     folder: "hubdrive/vehicles",
//     allowed_formats: ["jpg", "jpeg", "png", "webp"],
//     transformation: [
//       {
//         width: 900,
//         height: 600,
//         crop: "fill",
//         quality: "auto",
//       },
//     ],
//   }),
// })

// /* ---------------- KYC Storage ---------------- */

// const kycStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: async (req, file) => ({
//     folder: `hubdrive/kyc/${req.user ? req.user._id : "anon"}`,
//     resource_type: file.mimetype === "application/pdf" ? "raw" : "image",
//     public_id: `${file.fieldname}_${Date.now()}`,
//   }),
// })

// /* ---------------- Multer Upload Instances ---------------- */

// const uploadVehicleImages = multer({
//   storage: vehicleStorage,
//   fileFilter: imageFilter,
//   limits: {
//     fileSize: 5 * 1024 * 1024,
//     files: 5,
//   },
// })

// const uploadKYCDocs = multer({
//   storage: kycStorage,
//   fileFilter: docFilter,
//   limits: {
//     fileSize: 5 * 1024 * 1024,
//     files: 2,
//   },
// })

// /* ---------------- Error Handler Wrapper ---------------- */

// const handleMulter = (multerFn) => (req, res, next) => {
//   multerFn(req, res, (err) => {
//     if (!err) return next()

//     if (err.code === "LIMIT_FILE_SIZE") {
//       return res.status(400).json({
//         message: "File too large (max 5MB)",
//       })
//     }

//     if (err.code === "LIMIT_FILE_COUNT") {
//       return res.status(400).json({
//         message: "Too many files uploaded",
//       })
//     }

//     return res.status(400).json({
//       message: err.message || "Upload error",
//     })
//   })
// }

// /* ---------------- Export ---------------- */

// module.exports = {
//   uploadVehicleImages,
//   uploadKYCDocs,
//   handleMulter,
// }























const multer = require('multer')
const path   = require('path')
const fs     = require('fs')

const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

// ── Storage factories ─────────────────────────────────────────────────────────
const makeStorage = (subDir) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadsDir, subDir, req.user?._id?.toString() || 'anon')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase()
    const name = `${subDir}_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`
    cb(null, name)
  },
})

// ── File filters ──────────────────────────────────────────────────────────────
const imageFilter = (req, file, cb) => {
  const ok = ['image/jpeg','image/jpg','image/png','image/webp'].includes(file.mimetype)
  ok ? cb(null, true) : cb(new Error('Only JPG, PNG, WEBP images allowed'), false)
}

const docFilter = (req, file, cb) => {
  const ok = ['image/jpeg','image/jpg','image/png','image/webp','application/pdf'].includes(file.mimetype)
  ok ? cb(null, true) : cb(new Error('Only JPG, PNG, WEBP or PDF files allowed'), false)
}

// Images + videos (for handover media)
const mediaFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg','image/jpg','image/png','image/webp',
    'video/mp4','video/quicktime','video/x-msvideo','video/webm',
  ]
  const ok = allowed.includes(file.mimetype)
  ok ? cb(null, true) : cb(new Error('Only images (JPG/PNG/WEBP) or videos (MP4/MOV/AVI/WEBM) allowed'), false)
}

// ── Multer instances ──────────────────────────────────────────────────────────
const uploadVehicleImages = multer({
  storage:    makeStorage('vehicles'),
  fileFilter: imageFilter,
  limits:     { fileSize: 5 * 1024 * 1024, files: 5 },
})

const uploadKYCDocs = multer({
  storage:    makeStorage('kyc'),
  fileFilter: docFilter,
  limits:     { fileSize: 5 * 1024 * 1024, files: 2 },
})

// Handover media — images up to 10MB, videos up to 100MB, max 10 files
const uploadHandoverMedia = multer({
  storage:    makeStorage('handover'),
  fileFilter: mediaFilter,
  limits:     { fileSize: 100 * 1024 * 1024, files: 10 },
})

// Damage report media — images only, max 5 files
const uploadDamageMedia = multer({
  storage:    makeStorage('damage'),
  fileFilter: imageFilter,
  limits:     { fileSize: 10 * 1024 * 1024, files: 5 },
})

// ── Error wrapper ─────────────────────────────────────────────────────────────
const handleMulter = (multerFn) => (req, res, next) => {
  multerFn(req, res, (err) => {
    if (!err) return next()
    if (err.code === 'LIMIT_FILE_SIZE')  return res.status(400).json({ message: 'File too large' })
    if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ message: 'Too many files' })
    res.status(400).json({ message: err.message || 'Upload error' })
  })
}

module.exports = {
  uploadVehicleImages,
  uploadKYCDocs,
  uploadHandoverMedia,
  uploadDamageMedia,
  handleMulter,
}