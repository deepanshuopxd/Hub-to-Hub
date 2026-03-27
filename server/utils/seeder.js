require('dotenv').config()
const mongoose = require('mongoose')
const User     = require('../models/User.model')
const Vehicle  = require('../models/Vehicle.model')
const Booking  = require('../models/Booking.model')

const connectDB = require('../config/db')

// ── 10 cities × 3 rental services each = 30 vendors ──────────────────────────
const CITIES = [
  { city: 'Mumbai',    lat: 18.9696, lng: 72.8196, address: 'Mumbai Central Station' },
  { city: 'Pune',      lat: 18.5204, lng: 73.8567, address: 'Pune Railway Station'   },
  { city: 'Delhi',     lat: 28.6315, lng: 77.2167, address: 'Connaught Place'        },
  { city: 'Bangalore', lat: 12.9716, lng: 77.5946, address: 'MG Road'               },
  { city: 'Hyderabad', lat: 17.4435, lng: 78.3772, address: 'HITEC City'             },
  { city: 'Chennai',   lat: 13.0827, lng: 80.2707, address: 'Anna Salai'             },
  { city: 'Jaipur',    lat: 26.9124, lng: 75.7873, address: 'Pink City Center'       },
  { city: 'Goa',       lat: 15.4909, lng: 73.8278, address: 'Panaji Bus Stand'       },
  { city: 'Varanasi',  lat: 25.3176, lng: 82.9739, address: 'Ghats Road'             },
  { city: 'Agra',      lat: 27.1767, lng: 78.0081, address: 'Taj Mahal Road'         },
]

const SERVICE_SUFFIXES = ['Rides', 'Wheels', 'Motors']

// Vehicle data per city (2 vehicles per vendor = 60 total)
const VEHICLE_TEMPLATES = [
  { make: 'Honda',   model: 'City',      year: 2022, category: 'sedan',    pricePerDay: 1800, securityDeposit: 2000, image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600' },
  { make: 'Maruti',  model: 'Swift',     year: 2023, category: 'hatchback', pricePerDay: 1200, securityDeposit: 1500, image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=600' },
  { make: 'Hyundai', model: 'Creta',     year: 2023, category: 'suv',      pricePerDay: 2500, securityDeposit: 3000, image: 'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=600' },
  { make: 'Tata',    model: 'Nexon',     year: 2022, category: 'suv',      pricePerDay: 2200, securityDeposit: 2500, image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600' },
  { make: 'Royal Enfield', model: 'Bullet 350', year: 2023, category: 'bike', pricePerDay: 800, securityDeposit: 1000, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600' },
  { make: 'Maruti',  model: 'Ertiga',    year: 2022, category: 'van',      pricePerDay: 2800, securityDeposit: 3500, image: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=600' },
]

const seed = async () => {
  try {
    await connectDB()

    console.log('🗑  Clearing existing data...')
    await User.deleteMany({})
    await Vehicle.deleteMany({})
    await Booking.deleteMany({})

    // ── Demo customer ─────────────────────────────────────────────────────────
    console.log('👤  Creating demo customer...')
    const customer = await User.create({
      name:     'Rahul Sharma',
      email:    'customer@demo.com',
      phone:    '9876543210',
      password: 'demo123',
      role:     'customer',
      kyc: {
        status:        'verified',
        dlNumber:      'DL0420110034567',
        aadhaarNumber: '1234 5678 9012',
        extractedName: 'Rahul Sharma',
        verifiedAt:    new Date(),
      },
      wallet: { balance: 0, locked: 0 },
    })

    // ── 30 vendors (3 per city × 10 cities) ──────────────────────────────────
    console.log('🏪  Creating 30 rental service vendors across 10 cities...')
    const vendorDocs = []

    for (const cityData of CITIES) {
      for (let i = 0; i < 3; i++) {
        const suffix      = SERVICE_SUFFIXES[i]
        const serviceName = `${cityData.city} ${suffix}`
        const emailSlug   = `${cityData.city.toLowerCase()}.${suffix.toLowerCase()}`

        vendorDocs.push({
          name:     `${serviceName} Owner`,
          email:    `${emailSlug}@demo.com`,
          phone:    `98${String(CITIES.indexOf(cityData)).padStart(2,'0')}${String(i).padStart(2,'0')}12345`.slice(0,10),
          password: 'demo123',
          role:     'center_admin',
          rentalService: {
            name:    serviceName,
            city:    cityData.city,
            address: cityData.address,
            lat:     cityData.lat + (i * 0.005),   // slight offset per service
            lng:     cityData.lng + (i * 0.005),
            hubCode: `HUB-${cityData.city.slice(0,3).toUpperCase()}-00${i+1}`,
          },
          wallet: { balance: 0, locked: 0 },
        })
      }
    }

    const vendors = await User.create(vendorDocs)
    console.log(`✅  Created ${vendors.length} vendors`)

    // ── Vehicles (2 per vendor) ───────────────────────────────────────────────
    console.log('🚗  Creating vehicles...')
    const vehicleDocs = []
    let plateCounter  = 1000

    for (const vendor of vendors) {
      const city    = vendor.rentalService.city
      const cityIdx = CITIES.findIndex(c => c.city === city)
      // Give each vendor 2 different vehicle types
      const t1 = VEHICLE_TEMPLATES[(cityIdx * 2) % VEHICLE_TEMPLATES.length]
      const t2 = VEHICLE_TEMPLATES[(cityIdx * 2 + 1) % VEHICLE_TEMPLATES.length]

      const hubData = {
        name:          vendor.rentalService.name,
        city:          vendor.rentalService.city,
        address:       vendor.rentalService.address,
        lat:           vendor.rentalService.lat,
        lng:           vendor.rentalService.lng,
        vendorId:      vendor._id,
        rentalService: vendor.rentalService.name,
      }

      for (const template of [t1, t2]) {
        plateCounter++
        vehicleDocs.push({
          ...template,
          plateNumber:  `XX${String(plateCounter).padStart(6,'0')}`,
          description:  `${template.make} ${template.model} available in ${city}`,
          images:       [template.image],
          owner:        vendor._id,
          homeService: {
            vendorId: vendor._id,
            name:     vendor.rentalService.name,
            city:     vendor.rentalService.city,
            address:  vendor.rentalService.address,
            lat:      vendor.rentalService.lat,
            lng:      vendor.rentalService.lng,
          },
          currentHub:  hubData,
          hubHistory:  [{ hub: hubData, arrivedAt: new Date() }],
          isAvailable: true,
          isActive:    true,
        })
      }
    }

    const vehicles = await Vehicle.create(vehicleDocs)
    console.log(`✅  Created ${vehicles.length} vehicles`)

    // ── 2 sample bookings ─────────────────────────────────────────────────────
    console.log('📋  Creating sample bookings...')

    const mumbaiVendor1 = vendors.find(v => v.rentalService.city === 'Mumbai' && v.rentalService.name.includes('Rides'))
    const puneVendor1   = vendors.find(v => v.rentalService.city === 'Pune'   && v.rentalService.name.includes('Rides'))
    const mumbaiVehicle = vehicles.find(v => v.owner.toString() === mumbaiVendor1._id.toString())

    if (mumbaiVendor1 && puneVendor1 && mumbaiVehicle) {
      const startDT = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      const endDT   = new Date(Date.now() -  8 * 24 * 60 * 60 * 1000)

      await Booking.create({
        user:          customer._id,
        vehicle:       mumbaiVehicle._id,
        startVendor:   mumbaiVendor1._id,
        endVendor:     puneVendor1._id,
        startVendorApproved: true,
        endVendorApproved:   true,
        startHub: {
          name:          mumbaiVendor1.rentalService.name,
          city:          'Mumbai',
          address:       mumbaiVendor1.rentalService.address,
          lat:           mumbaiVendor1.rentalService.lat,
          lng:           mumbaiVendor1.rentalService.lng,
          vendorId:      mumbaiVendor1._id,
          rentalService: mumbaiVendor1.rentalService.name,
        },
        endHub: {
          name:          puneVendor1.rentalService.name,
          city:          'Pune',
          address:       puneVendor1.rentalService.address,
          lat:           puneVendor1.rentalService.lat,
          lng:           puneVendor1.rentalService.lng,
          vendorId:      puneVendor1._id,
          rentalService: puneVendor1.rentalService.name,
        },
        startDateTime:    startDT,
        endDateTime:      endDT,
        startDate:        startDT,
        endDate:          endDT,
        totalDays:        2,
        totalHours:       48,
        pricePerDay:      mumbaiVehicle.pricePerDay,
        rentalCost:       mumbaiVehicle.pricePerDay * 2,
        depositAmount:    mumbaiVehicle.securityDeposit,
        platformFee:      Math.round(mumbaiVehicle.pricePerDay * 2 * 0.1),
        totalPrice:       mumbaiVehicle.pricePerDay * 2 + mumbaiVehicle.securityDeposit,
        paymentMethod:    'wallet',
        paymentStatus:    'paid',
        status:           'completed',
        depositReleased:  true,
        depositReleasedAt:endDT,
        depositReleasedBy:mumbaiVendor1._id,
        depositRefundAmount: mumbaiVehicle.securityDeposit,
        depositDeductAmount: 0,
        vendorPaid:       true,
        completedAt:      endDT,
        customerRating:   5,
        vendorRating:     5,
        reviewNote:       'Great experience! Mumbai to Pune was smooth.',
        statusHistory: [
          { status: 'pending',                     changedBy: customer._id,     note: 'Booking created' },
          { status: 'awaiting_destination_vendor', changedBy: mumbaiVendor1._id,note: 'Approved by Mumbai Rides' },
          { status: 'active',                      changedBy: puneVendor1._id,  note: 'Approved by Pune Rides' },
          { status: 'in_transit',                  changedBy: customer._id,     note: 'Trip started' },
          { status: 'dropped_at_destination',      changedBy: customer._id,     note: 'Vehicle dropped at Pune' },
          { status: 'completed_by_destination',    changedBy: puneVendor1._id,  note: 'Vehicle received at Pune' },
          { status: 'completed',                   changedBy: mumbaiVendor1._id,note: 'Full deposit released' },
        ],
      })
      console.log('✅  Sample booking created (Mumbai → Pune, completed)')
    }

    // ── Print summary ─────────────────────────────────────────────────────────
    console.log(`
  ╔═══════════════════════════════════════════════════════════════╗
  ║   HubDrive Database Seeded Successfully!                      ║
  ╠═══════════════════════════════════════════════════════════════╣
  ║   Customer:  customer@demo.com  /  demo123                    ║
  ╠═══════════════════════════════════════════════════════════════╣
  ║   Vendors:   30 rental services across 10 cities              ║
  ║              3 per city: Rides, Wheels, Motors                ║
  ║                                                               ║
  ║   Cities:    Mumbai, Pune, Delhi, Bangalore, Hyderabad,       ║
  ║              Chennai, Jaipur, Goa, Varanasi, Agra             ║
  ╠═══════════════════════════════════════════════════════════════╣
  ║   Vehicles:  ${vehicles.length} total (2 per vendor)                          ║
  ╠═══════════════════════════════════════════════════════════════╣
  ║   Vendor login pattern:                                       ║
  ║   mumbai.rides@demo.com  /  demo123                           ║
  ║   mumbai.wheels@demo.com /  demo123                           ║
  ║   mumbai.motors@demo.com /  demo123                           ║
  ║   pune.rides@demo.com    /  demo123  (etc.)                   ║
  ╚═══════════════════════════════════════════════════════════════╝
    `)

    process.exit(0)
  } catch (err) {
    console.error('❌  Seeder failed:', err.message)
    process.exit(1)
  }
}

seed()