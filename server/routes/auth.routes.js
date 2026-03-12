const router = require('express').Router()
const { protect } = require('../middleware/auth.middleware')
const {
  register, login, getMe,
  updateProfile, changePassword, topUpWallet,
} = require('../controllers/auth.controller')

router.post  ('/register',         register)
router.post  ('/login',            login)
router.get   ('/me',               protect, getMe)
router.put   ('/profile',          protect, updateProfile)
router.post  ('/change-password',  protect, changePassword)
router.patch ('/wallet',           protect, topUpWallet)

module.exports = router