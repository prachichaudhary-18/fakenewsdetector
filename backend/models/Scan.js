const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inputText: {
    type: String,
    default: null
  },
  inputUrl: {
    type: String,
    default: null
  },
  verdict: {
    type: String,
    enum: ['Fake', 'Real'],
    required: true
  },
  confidence: {
    type: Number,
    required: true
  },
  highlights: [
    {
      phrase: String,
      score: Number
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Scan', scanSchema);
