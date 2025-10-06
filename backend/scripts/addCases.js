const mongoose = require('mongoose');
const Case = require('../models/Case');
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
    {
        name: "Премиум кейс",
        image: "/images/cases/premium-case.png",
        price: 500,
        items: [
            { name: "Редкий артефакт", image: "/images/items/rare-artifact.png", price: 300, dropChance: 30 },
            { name: "Эпическое оружие", image: "/images/items/epic-weapon.png", price: 800, dropChance: 25 },
            { name: "Легендарная броня", image: "/images/items/legendary-armor.png", price: 1500, dropChance: 20 },
            { name: "Мифический артефакт", image: "/images/items/mythic-artifact.png", price: 2500, dropChance: 15 },
            { name: "Уникальный предмет", image: "/images/items/unique.png", price: 5000, dropChance: 8 },
            { name: "Эксклюзив", image: "/images/items/exclusive.png", price: 10000, dropChance: 2 }
        ]
    }
];

async function addCases() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://hizzexnakagawa_db_user:AsC6VLIQxhCANDlS@nakawin.wmveagk.mongodb.net/?retryWrites=true&w=majority&appName=nakawin');
        console.log('Connected to MongoDB');

        // Clear existing cases
        await Case.deleteMany({});
        console.log('Cleared existing cases');

        // Add new cases
        for (const caseData of sampleCases) {
            const newCase = new Case(caseData);
            await newCase.save();
            console.log(`Added case: ${caseData.name}`);
        }

        console.log('All cases added successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error adding cases:', error);
        process.exit(1);
    }
}

addCases();