const mongoose = require('mongoose');

const wheelSegmentSchema = new mongoose.Schema({
    name: String,
    image: String,
    value: Number,
    chance: Number, // Determines segment size
    color: String
});

const wheelSchema = new mongoose.Schema({
    name: { type: String, default: "Wheel of Fortune" },
    segments: [wheelSegmentSchema],
    isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Wheel', wheelSchema);