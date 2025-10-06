const mongoose = require('mongoose');
const Wheel = require('../models/Wheel');
require('dotenv').config();

const wheelData = {
    name: "Колесо Фортуны",
    spinCost: 1,
    segments: [
        { name: "100 BlackCoins", image: "/images/wheel/coin.png", price: 100, dropChance: 25, color: "#FF6B6B" },
        { name: "200 BlackCoins", image: "/images/wheel/coin.png", price: 200, dropChance: 20, color: "#4ECDC4" },
        { name: "300 BlackCoins", image: "/images/items/rare.png", price: 300, dropChance: 15, color: "#45B7D1" },
        { name: "500 BlackCoins", image: "/images/wheel/coin.png", price: 500, dropChance: 12, color: "#96CEB4" },
        { name: "600 BlackCoins", image: "/images/items/epic.png", price: 800, dropChance: 10, color: "#FFEAA7" },
        { name: "1000 BlackCoins", image: "/images/wheel/coin.png", price: 1000, dropChance: 8, color: "#DDA0DD" },
        { name: "1500 BlackCoins", image: "/images/items/legendary.png", price: 1500, dropChance: 5, color: "#98D8C8" },
        { name: "2000 BlackCoins", image: "/images/items/jackpot.png", price: 5000, dropChance: 3, color: "#F7DC6F" },
        { name: "3000 BlackCoins", image: "/images/wheel/luck.png", price: 0, dropChance: 2, color: "#FFA07A" }
    ]
};

async function addWheel() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://hizzexnakagawa_db_user:AsC6VLIQxhCANDlS@nakawin.wmveagk.mongodb.net/?retryWrites=true&w=majority&appName=nakawin');
        console.log('Connected to MongoDB');

        // Clear existing wheel
        await Wheel.deleteMany({});
        console.log('Cleared existing wheel');

        // Add new wheel
        const wheel = new Wheel(wheelData);
        await wheel.save();
        console.log('Wheel added successfully');

        process.exit(0);
    } catch (error) {
        console.error('Error adding wheel:', error);
        process.exit(1);
    }
}

addWheel();