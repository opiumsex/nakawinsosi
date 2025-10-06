const express = require('express');
const Wheel = require('../models/Wheel');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const router = express.Router();

// Get wheel data
router.get('/', async (req, res) => {
    try {
        console.log('Fetching wheel data...');
        let wheel = await Wheel.findOne({ isActive: true });
        
        if (!wheel) {
            console.log('No wheel found, creating default wheel...');
            // Create default wheel with proper data
            wheel = new Wheel({
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
            });
            await wheel.save();
            console.log('Default wheel created successfully');
        }
        
        console.log(`Sending wheel data with ${wheel.segments.length} segments`);
        res.json(wheel);
        
    } catch (error) {
        console.error('Error fetching wheel:', error);
        res.status(500).json({ message: 'Ошибка сервера при загрузке колеса' });
    }
});

// Spin wheel
router.post('/spin', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const wheel = await Wheel.findOne({ isActive: true });
        if (!wheel) {
            return res.status(404).json({ message: 'Колесо не найдено' });
        }
        
        if (user.balance < wheel.spinCost) {
            return res.status(400).json({ message: 'Недостаточно средств' });
        }
        
        // Calculate win based on drop chances
        const totalChance = wheel.segments.reduce((sum, segment) => sum + segment.dropChance, 0);
        const random = Math.random() * totalChance;
        
        let current = 0;
        let wonSegment = null;
        let segmentIndex = -1;
        
        for (let i = 0; i < wheel.segments.length; i++) {
            const segment = wheel.segments[i];
            current += segment.dropChance;
            if (random <= current) {
                wonSegment = segment;
                segmentIndex = i;
                break;
            }
        }
        
        if (!wonSegment) {
            wonSegment = wheel.segments[0];
            segmentIndex = 0;
        }
        
        console.log(`Wheel spin: User ${user.username} won segment ${segmentIndex} - ${wonSegment.name}`);
        
        // Deduct balance
        user.balance -= wheel.spinCost;
        
        let inventoryItem = null;
        
        // Add to inventory if it's an item (not cash)
        if (wonSegment.price > 0 && !wonSegment.name.includes('₽')) {
            inventoryItem = new Inventory({
                user: user._id,
                item: {
                    name: wonSegment.name,
                    image: wonSegment.image,
                    price: wonSegment.price,
                    type: 'wheel'
                }
            });
            await inventoryItem.save();
            
            user.inventory.push({ item: inventoryItem._id });
        } else if (wonSegment.price > 0) {
            // If it's cash, add to balance
            user.balance += wonSegment.price;
            console.log(`Added ${wonSegment.price} to balance, new balance: ${user.balance}`);
        }
        
        await user.save();
        
        logger.wheelSpin(user.username, wonSegment.name, `Index: ${segmentIndex}, Price: ${wonSegment.price}, New Balance: ${user.balance}`);
        
        res.json({
            wonSegment: {
                name: wonSegment.name,
                image: wonSegment.image,
                price: wonSegment.price
            },
            segmentIndex,
            newBalance: user.balance,
            inventoryItem: inventoryItem ? inventoryItem._id : null
        });
        
    } catch (error) {
        console.error('Wheel spin error:', error);
        res.status(500).json({ message: 'Ошибка сервера при вращении колеса' });
    }
});

module.exports = router;