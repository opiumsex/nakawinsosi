const express = require('express');
const auth = require('../middleware/auth');
const { Case } = require('../models/Case');
const User = require('../models/User');
const InventoryItem = require('../models/Inventory');
const router = express.Router();

// Получить все кейсы (публичный доступ)
router.get('/', async (req, res) => {
    try {
        const cases = await Case.find({ isActive: true });
        res.json({ 
            success: true,
            cases 
        });
    } catch (error) {
        console.error('Get cases error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ошибка сервера' 
        });
    }
});

// Открыть кейс (требуется аутентификация)
router.post('/open/:caseId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const caseData = await Case.findById(req.params.caseId);
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Пользователь не найден' 
            });
        }

        if (!caseData) {
            return res.status(404).json({ 
                success: false,
                message: 'Кейс не найден' 
            });
        }

        if (user.balance < caseData.price) {
            return res.status(400).json({ 
                success: false,
                message: 'Недостаточно средств' 
            });
        }

        // Рассчитываем случайный предмет на основе шансов
        const totalChance = caseData.items.reduce((sum, item) => sum + item.chance, 0);
        const random = Math.random() * totalChance;
        
        let accumulatedChance = 0;
        let selectedItem = null;

        for (const item of caseData.items) {
            accumulatedChance += item.chance;
            if (random <= accumulatedChance) {
                selectedItem = item;
                break;
            }
        }

        if (!selectedItem) {
            selectedItem = caseData.items[0];
        }

        // Обновляем баланс пользователя
        user.balance -= caseData.price;
        
        // Добавляем предмет в инвентарь
        const inventoryItem = new InventoryItem({
            userId: user._id,
            itemName: selectedItem.name,
            itemImage: selectedItem.image || '/images/default-item.png',
            itemValue: selectedItem.value,
            itemType: 'case',
            obtainedFrom: `case_${caseData._id}`,
            rarity: this.calculateRarity(selectedItem.value)
        });

        await inventoryItem.save();
        await user.save();

        res.json({ 
            success: true,
            item: selectedItem,
            newBalance: user.balance,
            message: `Вы получили: ${selectedItem.name}`
        });
    } catch (error) {
        console.error('Open case error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ошибка при открытии кейса' 
        });
    }
});

// Вспомогательная функция для определения редкости
router.calculateRarity = (value) => {
    if (value >= 1000) return 'legendary';
    if (value >= 500) return 'epic';
    if (value >= 200) return 'rare';
    if (value >= 100) return 'uncommon';
    return 'common';
};

module.exports = router;