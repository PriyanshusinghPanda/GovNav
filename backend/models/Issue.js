const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['road', 'water', 'electricity', 'sanitation', 'other']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  details: {
    type: String,
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'in_progress', 'resolved'],
    default: 'pending'
  },
  department: {
    type: String,
    required: true
  },
  upvotes: {
    type: Number,
    default: 0
  },
  resolutionDetails: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index
issueSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Issue', issueSchema); 