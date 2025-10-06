const mongoose = require('mongoose');

const caseItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  dropChance: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case'
  }
});

const caseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  items: [caseItemSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Case', caseSchema);