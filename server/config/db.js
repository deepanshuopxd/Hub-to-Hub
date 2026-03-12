const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    console.log(`✅  MongoDB Connected: ${conn.connection.host}`)

    mongoose.connection.on('disconnected', () =>
      console.warn('⚠️  MongoDB disconnected — retrying...')
    )
    mongoose.connection.on('reconnected', () =>
      console.log('✅  MongoDB reconnected')
    )
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message)
    process.exit(1)
  }
}

module.exports = connectDB