const mongoose = require('mongoose');
const Case = require('../models/Case');
const Wheel = require('../models/Wheel');
const logger = require('../utils/logger');
require('dotenv').config();

const sampleCases = [
    {
        name: "Осений кейс",
        image: "/images/cases/ocenb.png",
        price: 100,
        items: [
            { name: "100 BlackCoin", image: "/images/items/common.png", price: 50, dropChance: 40 },
            { name: "150 BlackCoin", image: "/images/items/rare.png", price: 150, dropChance: 25 },
            { name: "200 BlackCoin", image: "/images/items/epic.png", price: 300, dropChance: 15 },
            { name: "500 BlackCoin", image: "/images/items/legendary.png", price: 500, dropChance: 10 },
            { name: "1000 BlackCoin", image: "/images/items/mythic.png", price: 1000, dropChance: 5 },
            { name: "1500 BlackCoin", image: "/images/items/ultra.png", price: 2000, dropChance: 3 },
            { name: "100000 BlackCoin", image: "/images/items/jackpot.png", price: 5000, dropChance: 2 }
        ]
    },
];

const wheelData = {
    name: "СЫН ШЛЮХИ",
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

async function initData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://hizzexnakagawa_db_user:AsC6VLIQxhCANDlS@nakawin.wmveagk.mongodb.net/?retryWrites=true&w=majority&appName=nakawin', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        logger.info('Connected to MongoDB');

        // Clear existing data
        await Case.deleteMany({});
        await Wheel.deleteMany({});
        logger.info('Cleared existing data');

        // Add cases
        for (const caseData of sampleCases) {
            const newCase = new Case(caseData);
            await newCase.save();
            logger.info(`Added case: ${caseData.name} with ${caseData.items.length} items`);
        }

        // Add wheel
        const wheel = new Wheel(wheelData);
        await wheel.save();
        logger.info(`Wheel added successfully with ${wheelData.segments.length} segments`);

        logger.info('All data initialized successfully');
        
        // Show summary
        const casesCount = await Case.countDocuments();
        const wheelsCount = await Wheel.countDocuments();
        console.log('\n=== DATA INITIALIZATION COMPLETE ===');
        console.log(`Cases: ${casesCount}`);
        console.log(`Wheels: ${wheelsCount}`);
        console.log('====================================\n');
        
        process.exit(0);
    } catch (error) {
        logger.error('Error initializing data: ' + error.message);
        console.error('Initialization error:', error);
        process.exit(1);
    }
}

initData();