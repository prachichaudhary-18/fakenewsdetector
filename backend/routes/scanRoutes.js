const express = require('express');
const router = express.Router();
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const Scan = require('../models/Scan');

// 20 requests per hour per user setup
const scanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  },
  message: { message: 'Too many analysis requests from this user, please try again after an hour' }
});

const fastApiBase = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

// POST /scan (mounted from server.js as both /scan and /scans)
router.post('/', protect, scanLimiter, async (req, res) => {
  try {
    const { text, url } = req.body;
    
    if (!text && !url) {
      return res.status(400).json({ message: 'Provide exactly one of text or url' });
    }
    
    let fastApiResponse;
    
    if (text) {
      fastApiResponse = await axios.post(`${fastApiBase}/analyze/text`, { text });
    } else if (url) {
      fastApiResponse = await axios.post(`${fastApiBase}/analyze/url`, { url });
    }
    
    const { verdict, confidence, lime_phrases } = fastApiResponse.data;

    // Save result to MongoDB
    const newScan = await Scan.create({
      userId: req.user._id,
      inputText: text || null,
      inputUrl: url || null,
      verdict,
      confidence,
      highlights: lime_phrases || []
    });

    res.status(201).json(newScan);
  } catch (error) {
    console.error('FastAPI integration error:', error.message);
    if (error.response && error.response.data) {
      return res.status(error.response.status || 500).json(error.response.data);
    }
    res.status(500).json({ message: 'Analysis proxy failed', details: error.message });
  }
});

// GET /scans (returns user history with pagination)
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const query = { userId: req.user._id };
    
    const total = await Scan.countDocuments(query);
    const scans = await Scan.find(query)
      .sort({ createdAt: -1 }) // newest first
      .skip(startIndex)
      .limit(limit);

    res.json({
      count: scans.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: scans
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /scans/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const query = { userId: req.user._id };
    
    const total = await Scan.countDocuments(query);
    const fakeCount = await Scan.countDocuments({ ...query, verdict: 'Fake' });
    const realCount = await Scan.countDocuments({ ...query, verdict: 'Real' });
    
    // Classify uncertain scans as those with <= 60% confidence
    const uncertainCount = await Scan.countDocuments({ ...query, confidence: { $lte: 0.60 } });

    res.json({
      totalScans: total,
      fakeCount,
      realCount,
      uncertainCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
