const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { initDB } = require('./config/db');
const OTP = require('./models/OTP');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const contentRoutes = require('./routes/content');
const { UPLOAD_ROOT } = require('./utils/upload');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', contentRoutes);

// Uploaded gallery photos, reel videos and hero media
app.use('/uploads', express.static(UPLOAD_ROOT, { maxAge: '7d' }));

const PORT = process.env.PORT || 5000;

// Database Connection (creates the database and tables if they don't exist)
initDB()
  .then(() => {
    console.log('MySQL Connected');
    // Clear expired OTPs every minute
    setInterval(() => OTP.cleanupExpired().catch(() => {}), 60 * 1000);
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MySQL Connection Error:', err.message);
    console.error('Check DB_HOST / DB_USER / DB_PASSWORD in server/.env');
    process.exit(1);
  });
