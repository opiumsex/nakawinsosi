const InventoryItem = require('../models/Inventory');

class InventoryUtils {
    static async addItemToInventory(userId, itemData) {
        const inventoryItem = new InventoryItem({
            userId,
            ...itemData
        });

        await inventoryItem.save();
        return inventoryItem;
    }

    static async getUserInventoryValue(userId) {
        const result = await InventoryItem.getInventoryValue(userId);
        return result.length > 0 ? result[0].totalValue : 0;
    }

    static async getInventorySummary(userId) {
        const [totalValue, rarityStats, recentItems] = await Promise.all([
            this.getUserInventoryValue(userId),
            InventoryItem.getRarityStats(userId),
            InventoryItem.find({ userId, status: 'in_inventory' })
                .sort({ obtainedAt: -1 })
                .limit(5)
        ]);

        return {
            totalValue,
            rarityStats: rarityStats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, {}),
            recentItems
        };
    }

    static async transferItem(itemId, fromUserId, toUserId) {
        const item = await InventoryItem.findOne({
            _id: itemId,
            userId: fromUserId,
            status: 'in_inventory'
        });

        if (!item) {
            throw new Error('Item not found or not available for transfer');
        }

        if (!item.isTradable) {
            throw new Error('Item is not tradable');
        }

        item.userId = toUserId;
        item.obtainedFrom = `transfer_from_${fromUserId}`;
        await item.save();

        return item;
    }
}

module.exports = InventoryUtils;