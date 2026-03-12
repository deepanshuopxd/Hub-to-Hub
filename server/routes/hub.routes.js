const router = require('express').Router()
const {
  getAllHubs, getVehiclesAtHub,
  getPopularRoutes, getNetworkStats, getHubDistance,
} = require('../controllers/hub.controller')

// All public — hubs are the USP showcase, always visible
router.get ('/',                 getAllHubs)
router.get ('/routes',           getPopularRoutes)
router.get ('/network-stats',    getNetworkStats)
router.get ('/distance',         getHubDistance)          // ?from=MUM&to=PUN
router.get ('/:hubName/vehicles',getVehiclesAtHub)

module.exports = router