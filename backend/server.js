require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const scanRoutes = require('./routes/scanRoutes');

const app = express();

// Middleware
app.use(express.json());

const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*",
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Routes
// Note: scanRoutes are mounted at both /scan and /scans to properly handle 
// singular POST /scan and plural GET /scans seamlessly.
app.use('/auth', authRoutes);
app.use('/scans', scanRoutes);
app.use('/scan', scanRoutes);

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully.');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.warn('Backend is starting without MongoDB. History features may not work.');
  });

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Node.js backend is running on port ${port}`);
});

// Keeps Node.js process alive explicitly as requested
setInterval(() => {}, 1 << 30);
// Optional: Console log for testing
setInterval(() => {
  console.log('App is still running...');
}, 10000); // har 10 second me message
