const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  item: {
    name: String,
    image: String,
    price: Number,
    type: {
      type: String,
      enum: ['case', 'wheel']
    }
  },
  status: {
    type: String,
    enum: ['owned', 'sold', 'withdrawn'],
    default: 'owned'
  },
  withdrawnAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Inventory', inventorySchema);