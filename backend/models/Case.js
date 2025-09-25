const mongoose = require('mongoose');

const caseItemSchema = new mongoose.Schema({
    name: String,
    image: String,
    value: Number,
    rarity: String,
    chance: Number // 1-100
});

const caseSchema = new mongoose.Schema({
    name: String,
    image: String,
    price: Number,
    items: [caseItemSchema],
    isActive: { type: Boolean, default: true }
});

module.exports = {
    Case: mongoose.model('Case', caseSchema),
    CaseItem: mongoose.model('CaseItem', caseItemSchema)
};