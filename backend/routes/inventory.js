const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const InventoryItem = require('../models/Inventory');
const router = express.Router();

// Get user inventory with filters
router.get('/', auth, async (req, res) => {
    try {
        const { 
            rarity, 
            itemType, 
            minValue, 
            maxValue,
            sortBy = 'obtainedAt',
            sortOrder = 'desc',
            page = 1,
            limit = 50
        } = req.query;

        const filters = {};
        if (rarity) filters.rarity = rarity;
        if (itemType) filters.itemType = itemType;
        if (minValue) filters.minValue = parseInt(minValue);
        if (maxValue) filters.maxValue = parseInt(maxValue);

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const inventory = await InventoryItem.find({
            userId: req.userId,
            status: 'in_inventory',
            ...filters
        })
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

        const totalItems = await InventoryItem.countDocuments({
            userId: req.userId,
            status: 'in_inventory',
            ...filters
        });

        res.json({
            inventory,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalItems,
                totalPages: Math.ceil(totalItems / limit)
            }
        });
    } catch (error) {
        console.error('Inventory error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get inventory statistics
router.get('/stats', auth, async (req, res) => {
    try {
        const [valueResult, rarityStats] = await Promise.all([
            InventoryItem.getInventoryValue(req.userId),
            InventoryItem.getRarityStats(req.userId)
        ]);

        const totalValue = valueResult.length > 0 ? valueResult[0].totalValue : 0;
        
        res.json({
            totalValue,
            rarityStats: rarityStats.reduce((acc, stat) => {
                acc[stat._id] = { count: stat.count, value: stat.totalValue };
                return acc;
            }, {})
        });
    } catch (error) {
        console.error('Inventory stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Sell item from inventory
router.post('/sell/:itemId', auth, async (req, res) => {
    try {
        const item = await InventoryItem.findOne({
            _id: req.params.itemId,
            userId: req.userId
        });

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const saleValue = await item.sellItem();
        
        // Update user balance
        const user = await User.findById(req.userId);
        user.balance += saleValue;
        await user.save();

        res.json({ 
            success: true,
            newBalance: user.balance,
            soldItem: {
                name: item.itemName,
                value: saleValue
            }
        });
    } catch (error) {
        console.error('Sell item error:', error);
        res.status(400).json({ message: error.message });
    }
});

// Withdraw item
router.post('/withdraw/:itemId', auth, async (req, res) => {
    try {
        const item = await InventoryItem.findOne({
            _id: req.params.itemId,
            userId: req.userId
        });

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        await item.requestWithdrawal();

        res.json({ 
            success: true,
            message: 'Withdrawal request submitted',
            item: {
                name: item.itemName,
                value: item.itemValue,
                transactionId: item.transactionId
            }
        });
    } catch (error) {
        console.error('Withdraw item error:', error);
        res.status(400).json({ message: error.message });
    }
});

// Bulk sell items
router.post('/bulk-sell', auth, async (req, res) => {
    try {
        const { itemIds } = req.body;
        
        if (!Array.isArray(itemIds) || itemIds.length === 0) {
            return res.status(400).json({ message: 'No items selected' });
        }

        const items = await InventoryItem.find({
            _id: { $in: itemIds },
            userId: req.userId,
            status: 'in_inventory'
        });

        if (items.length === 0) {
            return res.status(404).json({ message: 'No valid items found' });
        }

        let totalValue = 0;
        const soldItems = [];

        for (const item of items) {
            try {
                const value = await item.sellItem();
                totalValue += value;
                soldItems.push(item.itemName);
            } catch (error) {
                console.error(`Error selling item ${item._id}:`, error);
            }
        }

        // Update user balance
        const user = await User.findById(req.userId);
        user.balance += totalValue;
        await user.save();

        res.json({
            success: true,
            newBalance: user.balance,
            totalValue,
            soldItemsCount: soldItems.length,
            soldItems
        });
    } catch (error) {
        console.error('Bulk sell error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin routes for inventory management
router.get('/admin/user/:userId', async (req, res) => {
    try {
        // Add admin authentication in production
        const inventory = await InventoryItem.find({ userId: req.params.userId })
            .sort({ obtainedAt: -1 })
            .populate('userId', 'username');
        
        res.json(inventory);
    } catch (error) {
        console.error('Admin inventory error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add item to user inventory (admin function)
router.post('/admin/add-item', async (req, res) => {
    try {
        const { userId, itemName, itemImage, itemValue, itemType, rarity } = req.body;
        
        const inventoryItem = new InventoryItem({
            userId,
            itemName,
            itemImage,
            itemValue,
            itemType: itemType || 'other',
            rarity,
            obtainedFrom: 'admin_grant'
        });

        await inventoryItem.save();

        res.json({ 
            success: true, 
            message: 'Item added to inventory',
            item: inventoryItem 
        });
    } catch (error) {
        console.error('Add item error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;