// const multer               = require('multer')
// const { CloudinaryStorage }= require('multer-storage-cloudinary')
// const { cloudinary }       = require('../config/cloudinary')

// const imageFilter = (req, file, cb) => {
//   const ok = ['image/jpeg','image/jpg','image/png','image/webp'].includes(file.mimetype)
//   ok ? cb(null, true) : cb(new Error('Only JPG, PNG, WEBP allowed'), false)
// }

// const docFilter = (req, file, cb) => {
//   const ok = ['image/jpeg','image/jpg','image/png','image/webp','application/pdf'].includes(file.mimetype)
//   ok ? cb(null, true) : cb(new Error('Only JPG, PNG, WEBP or PDF allowed'), false)
// }

// // Vehicle photos storage
// const vehicleStorage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder:          'hubdrive/vehicles',
//     allowed_formats: ['jpg','jpeg','png','webp'],
//     transformation:  [{ width: 900, height: 600, crop: 'fill', quality: 'auto:good' }],
//   },
// })

// // KYC document storage
// const kycStorage = new CloudinaryStorage({
//   cloudinary,
//   params: async (req, file) => ({
//     folder:        `hubdrive/kyc/${req.user?._id || 'anon'}`,
//     resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
//     public_id:     `${file.fieldname}_${Date.now()}`,
//   }),
// })

// const uploadVehicleImages = multer({
//   storage: vehicleStorage, fileFilter: imageFilter,
//   limits: { fileSize: 5 * 1024 * 1024, files: 5 },
// })

// const uploadKYCDocs = multer({
//   storage: kycStorage, fileFilter: docFilter,
//   limits: { fileSize: 5 * 1024 * 1024, files: 2 },
// })

// // Wraps multer to forward errors to Express error handler
// const handleMulter = (multerFn) => (req, res, next) => {
//   multerFn(req, res, (err) => {
//     if (!err) return next()
//     if (err.code === 'LIMIT_FILE_SIZE')  return res.status(400).json({ message: 'File too large — max 5MB' })
//     if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ message: 'Too many files' })
//     res.status(400).json({ message: err.message || 'Upload error' })
//   })
// }

// module.exports = { uploadVehicleImages, uploadKYCDocs, handleMulter }




// const multer               = require('multer')
// const { CloudinaryStorage }= require('multer-storage-cloudinary')
// // Import cloudinary v1 and ensure config is loaded via config/cloudinary.js
// const cloudinary           = require('../config/cloudinary')

// const imageFilter = (req, file, cb) => {
//   const ok = ['image/jpeg','image/jpg','image/png','image/webp'].includes(file.mimetype)
//   ok ? cb(null, true) : cb(new Error('Only JPG, PNG, WEBP allowed'), false)
// }

// const docFilter = (req, file, cb) => {
//   const ok = ['image/jpeg','image/jpg','image/png','image/webp','application/pdf'].includes(file.mimetype)
//   ok ? cb(null, true) : cb(new Error('Only JPG, PNG, WEBP or PDF allowed'), false)
// }

// // Vehicle photos — compressed via Cloudinary transformation
// const vehicleStorage = new CloudinaryStorage({
//   cloudinary: cloudinary.cloudinary,
//   params: {
//     folder:          'hubdrive/vehicles',
//     allowed_formats: ['jpg','jpeg','png','webp'],
//     transformation:  [{ width: 900, height: 600, crop: 'fill', quality: 'auto:good' }],
//   },
// })

// // KYC documents — stored unmodified for admin review
// const kycStorage = new CloudinaryStorage({
//   cloudinary: cloudinary.cloudinary,
//   params: async (req, file) => ({
//     folder:        `hubdrive/kyc/${req.user?._id || 'anon'}`,
//     resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
//     public_id:     `${file.fieldname}_${Date.now()}`,
//   }),
// })

// const uploadVehicleImages = multer({
//   storage: vehicleStorage,
//   fileFilter: imageFilter,
//   limits: { fileSize: 5 * 1024 * 1024, files: 5 },
// })

// const uploadKYCDocs = multer({
//   storage: kycStorage,
//   fileFilter: docFilter,
//   limits: { fileSize: 5 * 1024 * 1024, files: 2 },
// })

// // Wraps multer so its errors flow through Express error handler
// const handleMulter = (multerFn) => (req, res, next) => {
//   multerFn(req, res, (err) => {
//     if (!err) return next()
//     if (err.code === 'LIMIT_FILE_SIZE')  return res.status(400).json({ message: 'File too large — max 5MB' })
//     if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ message: 'Too many files' })
//     res.status(400).json({ message: err.message || 'Upload error' })
//   })
// }

// module.exports = { uploadVehicleImages, uploadKYCDocs, handleMulter }




// const multer               = require('multer')
// const { CloudinaryStorage } = require('multer-storage-cloudinary')
// const cloudinary           = require('../config/cloudinary')

// const imageFilter = (req, file, cb) => {
//   const ok = ['image/jpeg','image/jpg','image/png','image/webp'].includes(file.mimetype)
//   ok ? cb(null, true) : cb(new Error('Only JPG, PNG, WEBP allowed'), false)
// }

// const docFilter = (req, file, cb) => {
//   const ok = ['image/jpeg','image/jpg','image/png','image/webp','application/pdf'].includes(file.mimetype)
//   ok ? cb(null, true) : cb(new Error('Only JPG, PNG, WEBP or PDF allowed'), false)
// }

// const vehicleStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder:          'hubdrive/vehicles',
//     allowed_formats: ['jpg','jpeg','png','webp'],
//     transformation:  [{ width: 900, height: 600, crop: 'fill', quality: 'auto:good' }],
//   },
// })

// const kycStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: async (req, file) => ({
//     folder:        `hubdrive/kyc/${req.user?._id || 'anon'}`,
//     resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
//     public_id:     `${file.fieldname}_${Date.now()}`,
//   }),
// })

// const uploadVehicleImages = multer({
//   storage:    vehicleStorage,
//   fileFilter: imageFilter,
//   limits:     { fileSize: 5 * 1024 * 1024, files: 5 },
// })

// const uploadKYCDocs = multer({
//   storage:    kycStorage,
//   fileFilter: docFilter,
//   limits:     { fileSize: 5 * 1024 * 1024, files: 2 },
// })

// const handleMulter = (multerFn) => (req, res, next) => {
//   multerFn(req, res, (err) => {
//     if (!err) return next()
//     if (err.code === 'LIMIT_FILE_SIZE')  return res.status(400).json({ message: 'File too large — max 5MB' })
//     if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ message: 'Too many files' })
//     res.status(400).json({ message: err.message || 'Upload error' })
//   })
// }

// module.exports = { uploadVehicleImages, uploadKYCDocs, handleMulter }














const multer = require("multer")
const { CloudinaryStorage } = require("multer-storage-cloudinary")
const cloudinary = require("../config/cloudinary")

/* ---------------- Image Filter ---------------- */

const imageFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error("Only JPG, PNG, or WEBP images allowed"), false)
  }
}

/* ---------------- Document Filter ---------------- */

const docFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]

  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error("Only JPG, PNG, WEBP, or PDF allowed"), false)
  }
}

/* ---------------- Vehicle Images Storage ---------------- */

const vehicleStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: "hubdrive/vehicles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 900,
        height: 600,
        crop: "fill",
        quality: "auto",
      },
    ],
  }),
})

/* ---------------- KYC Storage ---------------- */

const kycStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: `hubdrive/kyc/${req.user ? req.user._id : "anon"}`,
    resource_type: file.mimetype === "application/pdf" ? "raw" : "image",
    public_id: `${file.fieldname}_${Date.now()}`,
  }),
})

/* ---------------- Multer Upload Instances ---------------- */

const uploadVehicleImages = multer({
  storage: vehicleStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
})

const uploadKYCDocs = multer({
  storage: kycStorage,
  fileFilter: docFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 2,
  },
})

/* ---------------- Error Handler Wrapper ---------------- */

const handleMulter = (multerFn) => (req, res, next) => {
  multerFn(req, res, (err) => {
    if (!err) return next()

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File too large (max 5MB)",
      })
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message: "Too many files uploaded",
      })
    }

    return res.status(400).json({
      message: err.message || "Upload error",
    })
  })
}

/* ---------------- Export ---------------- */

module.exports = {
  uploadVehicleImages,
  uploadKYCDocs,
  handleMulter,
}
