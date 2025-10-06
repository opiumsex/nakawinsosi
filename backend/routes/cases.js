const express = require('express');
const Case = require('../models/Case');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const router = express.Router();

// Get all cases
router.get('/', async (req, res) => {
    try {
        const cases = await Case.find({ isActive: true });
        logger.info(`Sent ${cases.length} cases to client`);
        res.json(cases);
    } catch (error) {
        logger.error('Error fetching cases: ' + error.message);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Open case
router.post('/open/:caseId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            logger.error(`User not found: ${req.userId}`);
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const caseData = await Case.findById(req.params.caseId);
        if (!caseData) {
            logger.error(`Case not found: ${req.params.caseId}`);
            return res.status(404).json({ message: 'Кейс не найден' });
        }
        
        if (user.balance < caseData.price) {
            logger.warn(`Insufficient balance for case: ${user.username} - ${user.balance} < ${caseData.price}`);
            return res.status(400).json({ message: 'Недостаточно средств' });
        }
        
        // Calculate drop based on chances
        const totalChance = caseData.items.reduce((sum, item) => sum + item.dropChance, 0);
        const random = Math.random() * totalChance;
        
        let current = 0;
        let wonItem = null;
        
        for (const item of caseData.items) {
            current += item.dropChance;
            if (random <= current) {
                wonItem = item;
                break;
            }
        }

        if (!wonItem) {
            wonItem = caseData.items[0];
            logger.warn('Fallback to first item in case');
        }
        
        // Deduct balance
        user.balance -= caseData.price;
        await user.save();
        
        // Add to inventory
        const inventoryItem = new Inventory({
            user: user._id,
            item: {
                name: wonItem.name,
                image: wonItem.image,
                price: wonItem.price,
                type: 'case'
            }
        });
        await inventoryItem.save();
        
        user.inventory.push({ item: inventoryItem._id });
        await user.save();
        
        // Log the case opening
        logger.caseOpen(user.username, caseData.name, wonItem.name, `Price: ${wonItem.price}, New Balance: ${user.balance}`);
        
        res.json({
            wonItem: {
                _id: inventoryItem._id,
                name: wonItem.name,
                image: wonItem.image,
                price: wonItem.price
            },
            newBalance: user.balance
        });
        
    } catch (error) {
        logger.error('Case opening error: ' + error.message);
        res.status(500).json({ message: 'Ошибка сервера при открытии кейса' });
    }
});

module.exports = router;