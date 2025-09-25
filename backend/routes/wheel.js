const express = require('express');
const auth = require('../middleware/auth');
const Wheel = require('../models/Wheel');
const User = require('../models/User');
const router = express.Router();

// Get wheel data
router.get('/', async (req, res) => {
    try {
        const wheel = await Wheel.findOne({ isActive: true });
        res.json(wheel);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Spin the wheel
router.post('/spin', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const wheel = await Wheel.findOne({ isActive: true });
        
        if (!wheel) {
            return res.status(404).json({ message: 'Wheel not found' });
        }

        // Check if user has enough balance (if wheel has a spin cost)
        const spinCost = 100; // Example cost
        if (user.balance < spinCost) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // После определения выигрышного сегмента:
const inventoryItem = new InventoryItem({
    userId: user._id,
    itemName: winningSegment.name,
    itemImage: winningSegment.image,
    itemValue: winningSegment.value,
    itemType: 'wheel',
    obtainedFrom: 'wheel_of_fortune'
});

await inventoryItem.save();

        // Calculate winning segment based on chances
        const totalChance = wheel.segments.reduce((sum, seg) => sum + seg.chance, 0);
        const random = Math.random() * totalChance;
        
        let accumulatedChance = 0;
        let winningSegment = null;

        for (const segment of wheel.segments) {
            accumulatedChance += segment.chance;
            if (random <= accumulatedChance) {
                winningSegment = segment;
                break;
            }
        }

        // Update user balance and inventory
        user.balance -= spinCost;
        user.balance += winningSegment.value; // Add prize value to balance
        
        user.inventory.push({
            itemName: winningSegment.name,
            itemImage: winningSegment.image,
            itemValue: winningSegment.value
        });

        await user.save();

        res.json({ 
            winningSegment, 
            newBalance: user.balance,
            prizeValue: winningSegment.value 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin route to update wheel
router.post('/admin/update', async (req, res) => {
    try {
        let wheel = await Wheel.findOne({ isActive: true });
        
        if (!wheel) {
            wheel = new Wheel({ segments: req.body.segments });
        } else {
            wheel.segments = req.body.segments;
        }
        
        await wheel.save();
        res.json({ message: 'Wheel updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;