const express = require('express');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const router = express.Router();

// Get user inventory
router.get('/', auth, async (req, res) => {
    try {
        const inventory = await Inventory.find({ 
            user: req.userId,
            status: 'owned'
        }).sort({ createdAt: -1 });
        
        logger.info(`Sent ${inventory.length} inventory items to user ${req.userId}`);
        res.json(inventory);
    } catch (error) {
        logger.error('Error fetching inventory: ' + error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Sell item
router.post('/sell/:itemId', auth, async (req, res) => {
    try {
        const inventoryItem = await Inventory.findOne({
            _id: req.params.itemId,
            user: req.userId,
            status: 'owned'
        });
        
        if (!inventoryItem) {
            logger.error(`Item not found for selling: ${req.params.itemId}`);
            return res.status(404).json({ message: 'Предмет не найден' });
        }
        
        const user = await User.findById(req.userId);
        user.balance += inventoryItem.item.price;
        
        inventoryItem.status = 'sold';
        
        await Promise.all([user.save(), inventoryItem.save()]);
        
        logger.userAction(user.username, 'SOLD_ITEM', `${inventoryItem.item.name} for ${inventoryItem.item.price} ₽, New Balance: ${user.balance}`);
        
        res.json({
            newBalance: user.balance,
            message: 'Предмет продан успешно'
        });
        
    } catch (error) {
        logger.error('Error selling item: ' + error.message);
        res.status(500).json({ message: 'Ошибка продажи предмета' });
    }
});

// Withdraw item
router.post('/withdraw/:itemId', auth, async (req, res) => {
    try {
        const inventoryItem = await Inventory.findOne({
            _id: req.params.itemId,
            user: req.userId,
            status: 'owned'
        });
        
        if (!inventoryItem) {
            logger.error(`Item not found for withdrawal: ${req.params.itemId}`);
            return res.status(404).json({ message: 'Предмет не найден' });
        }
        
        const user = await User.findById(req.userId);
        
        inventoryItem.status = 'withdrawn';
        inventoryItem.withdrawnAt = new Date();
        
        await inventoryItem.save();
        
        // Log withdrawal
        logger.withdrawal(user.username, inventoryItem.item.name, `Price: ${inventoryItem.item.price}, Balance: ${user.balance}`);
        
        res.json({
            message: 'Запрос на вывод отправлен'
        });
        
    } catch (error) {
        logger.error('Error withdrawing item: ' + error.message);
        res.status(500).json({ message: 'Ошибка вывода предмета' });
    }
});

module.exports = router;