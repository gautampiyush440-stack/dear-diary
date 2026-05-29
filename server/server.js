const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./db');

const authRoutes = require('./routes/auth');
const entriesRoutes = require('./routes/entries');
const snapsRoutes = require('./routes/snaps');
const gamesRoutes = require('./routes/games');
const companionRoutes = require('./routes/companion');
const notificationsRoutes = require('./routes/notifications');
const paymentsRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support larger base64 file payloads for photos

// Register route handlers
app.use('/api/auth', authRoutes);
app.use('/api/entries', entriesRoutes);
app.use('/api/snaps', snapsRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/companion', companionRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/payments', paymentsRoutes);

// Database connection & server startup
sequelize.sync()
  .then(() => {
    console.log('✔ SQLite Database connected and synchronized successfully via Sequelize.');
    app.listen(PORT, () => {
      console.log(`🚀 Dear Diary server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('✘ Database synchronization failed:', err);
  });
