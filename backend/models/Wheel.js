const mongoose = require('mongoose');

const wheelSegmentSchema = new mongoose.Schema({
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
        min: 1,
        max: 100
    },
    color: {
        type: String,
        default: '#ffffff'
    }
});

const wheelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    spinCost: {
        type: Number,
        required: true,
        default: 250
    },
    segments: [wheelSegmentSchema],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Wheel', wheelSchema);