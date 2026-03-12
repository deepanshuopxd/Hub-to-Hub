require('dotenv').config()
const mongoose  = require('mongoose')
const bcrypt    = require('bcryptjs')

const connectDB = require('../config/db')
const User      = require('../models/User.model')
const Vehicle   = require('../models/Vehicle.model')
const Booking   = require('../models/Booking.model')

/* ── Hub data inline ───────────────────────────────────────────────────── */

const HUBS = [
  { name: 'Mumbai Central Hub',    city: 'Mumbai',    lat: 18.9696, lng: 72.8196 },
  { name: 'Pune Station Hub',      city: 'Pune',      lat: 18.5204, lng: 73.8567 },
  { name: 'Lonavala Hill Hub',     city: 'Lonavala',  lat: 18.7546, lng: 73.4062 },
  { name: 'Bangalore MG Road Hub', city: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad HITEC Hub',   city: 'Hyderabad', lat: 17.4435, lng: 78.3772 },
  { name: 'Goa Panaji Hub',        city: 'Goa',       lat: 15.4909, lng: 73.8278 },
  { name: 'Delhi CP Hub',          city: 'New Delhi', lat: 28.6315, lng: 77.2167 },
  { name: 'Chennai Anna Hub',      city: 'Chennai',   lat: 13.0827, lng: 80.2707 },
]

/* ── Seeder Function ───────────────────────────────────────────────────── */

const seed = async () => {

  await connectDB()

  console.log('🗑  Clearing existing data...')
  await User.deleteMany({})
  await Vehicle.deleteMany({})
  await Booking.deleteMany({})

  /* ── Hash password once ───────────────────────────────────────────── */

  const hashedPassword = await bcrypt.hash('demo123', 10)

  /* ── Users ───────────────────────────────────────────────────────── */

  console.log('👤  Creating users...')

  const users = await User.create([
    {
      name: 'Arjun Sharma',
      email: 'customer@demo.com',
      phone: '9876543210',
      password: 'demo123',
      role: 'customer',
      kyc: {
        status: 'verified',
        extractedName: 'Arjun Sharma',
        dlUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        aadhaarUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        verifiedAt: new Date(),
      },
      wallet: { balance: 15000, locked: 0 },
    },
    {
      name: 'Priya Nair',
      email: 'priya@demo.com',
      phone: '9123456789',
      password: 'demo123',
      role: 'customer',
      kyc: { status: 'pending' },
      wallet: { balance: 8000, locked: 0 },
    },
    {
      name: 'Ravi Motors',
      email: 'vendor@demo.com',
      phone: '9988776655',
      password: 'demo123',
      role: 'center_admin',
      homeHub: { name: HUBS[0].name, lat: HUBS[0].lat, lng: HUBS[0].lng },
      wallet: { balance: 50000, locked: 0 },
    },
    {
      name: 'Deccan Rentals',
      email: 'deccan@demo.com',
      phone: '9871234560',
      password: 'demo123',
      role: 'center_admin',
      homeHub: { name: HUBS[1].name, lat: HUBS[1].lat, lng: HUBS[1].lng },
      wallet: { balance: 30000, locked: 0 },
    },
  ])

  const customer = users.find(u => u.email === 'customer@demo.com')
  const vendor1  = users.find(u => u.email === 'vendor@demo.com')
  const vendor2  = users.find(u => u.email === 'deccan@demo.com')

  /* ── Vehicles ────────────────────────────────────────────────────── */

  console.log('🚗  Creating vehicles across hubs...')

  const vehicles = await Vehicle.create([
    {
      make: 'Honda',
      model: 'City',
      year: 2022,
      plateNumber: 'MH01AB1234',
      pricePerDay: 1800,
      category: 'sedan',
      currentHub: HUBS[0],
      owner: vendor1._id,
      isAvailable: true,
      images: ['https://images.unsplash.com/photo-1590362891991-f776e747a588?w=600'],
      description: 'Well-maintained Honda City with AC and music system',
      hubHistory: [{ hub: HUBS[0], arrivedAt: new Date() }],
    },
    {
      make: 'Tata',
      model: 'Nexon',
      year: 2023,
      plateNumber: 'MH01CD5678',
      pricePerDay: 2200,
      category: 'suv',
      currentHub: HUBS[0],
      owner: vendor1._id,
      isAvailable: true,
      images: ['https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=600'],
      description: 'Tata Nexon EV — zero emissions, perfect for city hops',
      hubHistory: [{ hub: HUBS[0], arrivedAt: new Date() }],
    },
    {
      make: 'Maruti',
      model: 'Swift',
      year: 2021,
      plateNumber: 'MH02EF9012',
      pricePerDay: 1200,
      category: 'hatchback',
      currentHub: HUBS[0],
      owner: vendor1._id,
      isAvailable: true,
      images: ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600'],
      description: 'Zippy Swift — ideal for Mumbai traffic',
      hubHistory: [{ hub: HUBS[0], arrivedAt: new Date() }],
    },
    {
      make: 'Royal Enfield',
      model: 'Classic 350',
      year: 2022,
      plateNumber: 'MH03GH3456',
      pricePerDay: 900,
      category: 'bike',
      currentHub: HUBS[2],
      owner: vendor1._id,
      isAvailable: true,
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'],
      description: 'Classic 350 — ride the ghats in style from Lonavala',
      hubHistory: [{ hub: HUBS[2], arrivedAt: new Date() }],
    },
    {
      make: 'Hyundai',
      model: 'Creta',
      year: 2023,
      plateNumber: 'MH12IJ7890',
      pricePerDay: 2500,
      category: 'suv',
      currentHub: HUBS[1],
      owner: vendor2._id,
      isAvailable: true,
      images: ['https://images.unsplash.com/photo-1617469165786-8007eda3caa7?w=600'],
      description: 'Hyundai Creta — premium SUV experience',
      hubHistory: [{ hub: HUBS[1], arrivedAt: new Date() }],
    },
    {
      make: 'Toyota',
      model: 'Innova',
      year: 2021,
      plateNumber: 'MH12KL1234',
      pricePerDay: 3000,
      category: 'van',
      currentHub: HUBS[1],
      owner: vendor2._id,
      isAvailable: true,
      images: ['https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600'],
      description: '7-seater Innova — perfect for group trips Pune to Goa',
      hubHistory: [{ hub: HUBS[1], arrivedAt: new Date() }],
    },
  ])

  /* ── Sample Bookings ─────────────────────────────────────────────── */

  console.log('📋  Creating sample bookings...')

  await Booking.create({
    user: customer._id,
    vehicle: vehicles[0]._id,
    startHub: HUBS[0],
    endHub: HUBS[1],
    startDate: new Date(Date.now() - 10 * 86400000),
    endDate: new Date(Date.now() - 8 * 86400000),
    totalDays: 2,
    pricePerDay: 1800,
    rentalCost: 3600,
    depositAmount: 2000,
    platformFee: 360,
    totalPrice: 3600,
    status: 'completed',
    depositReleased: true,
    vendorPaid: true,
    completedAt: new Date(Date.now() - 8 * 86400000),
  })

  await Booking.create({
    user: customer._id,
    vehicle: vehicles[4]._id,
    startHub: HUBS[1],
    endHub: HUBS[5],
    startDate: new Date(),
    endDate: new Date(Date.now() + 3 * 86400000),
    totalDays: 3,
    pricePerDay: 2500,
    rentalCost: 7500,
    depositAmount: 2000,
    platformFee: 750,
    totalPrice: 7500,
    status: 'active',
  })

  console.log(`
  ✅ Database seeded!

  Demo Accounts:
  customer@demo.com / demo123
  vendor@demo.com   / demo123
  deccan@demo.com   / demo123
  `)

  await mongoose.connection.close()
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seeder failed:', err)
  process.exit(1)
})