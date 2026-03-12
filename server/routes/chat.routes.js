const router = require('express').Router()
const { protect } = require('../middleware/auth.middleware')
const { getChatHistory, sendMessage, markMessagesRead } = require('../controllers/chat.controller')

router.get   ('/:bookingId/history', protect, getChatHistory)
router.post  ('/:bookingId/message', protect, sendMessage)
router.patch ('/:bookingId/read',    protect, markMessagesRead)

module.exports = router