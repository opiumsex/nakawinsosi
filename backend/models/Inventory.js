const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    itemId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'CaseItem' 
    },
    itemName: { 
        type: String, 
        required: true 
    },
    itemImage: { 
        type: String, 
        required: true 
    },
    itemValue: { 
        type: Number, 
        required: true 
    },
    itemType: { 
        type: String, 
        enum: ['case', 'wheel', 'other'],
        default: 'case'
    },
    rarity: {
        type: String,
        enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
        default: 'common'
    },
    obtainedFrom: {
        type: String,
        required: true
    }, // 'case', 'wheel', etc.
    obtainedAt: { 
        type: Date, 
        default: Date.now 
    },
    isTradable: { 
        type: Boolean, 
        default: true 
    },
    isWithdrawable: { 
        type: Boolean, 
        default: true 
    },
    status: {
        type: String,
        enum: ['in_inventory', 'sold', 'withdrawn', 'pending_withdrawal'],
        default: 'in_inventory'
    },
    withdrawalRequestedAt: { 
        type: Date 
    },
    soldAt: { 
        type: Date 
    },
    transactionId: {
        type: String,
        unique: true
    }
}, {
    timestamps: true
});

// Index for better performance
inventoryItemSchema.index({ userId: 1, status: 1 });
inventoryItemSchema.index({ obtainedAt: -1 });
inventoryItemSchema.index({ itemValue: -1 });

// Static methods for inventory management
inventoryItemSchema.statics.getUserInventory = function(userId, filters = {}) {
    const query = { userId, status: 'in_inventory' };
    
    // Apply filters
    if (filters.rarity) query.rarity = filters.rarity;
    if (filters.itemType) query.itemType = filters.itemType;
    if (filters.minValue) query.itemValue = { $gte: filters.minValue };
    if (filters.maxValue) query.itemValue = { $lte: filters.maxValue };
    
    return this.find(query)
        .sort({ obtainedAt: -1 })
        .populate('itemId', 'name image value');
};

inventoryItemSchema.statics.getInventoryValue = function(userId) {
    return this.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId), status: 'in_inventory' } },
        { $group: { _id: null, totalValue: { $sum: '$itemValue' } } }
    ]);
};

inventoryItemSchema.statics.getRarityStats = function(userId) {
    return this.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId), status: 'in_inventory' } },
        { $group: { _id: '$rarity', count: { $sum: 1 }, totalValue: { $sum: '$itemValue' } } }
    ]);
};

// Instance methods
inventoryItemSchema.methods.sellItem = async function() {
    if (this.status !== 'in_inventory') {
        throw new Error('Item cannot be sold');
    }
    
    if (!this.isTradable) {
        throw new Error('Item is not tradable');
    }
    
    this.status = 'sold';
    this.soldAt = new Date();
    this.transactionId = `SALE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.save();
    return this.itemValue;
};

inventoryItemSchema.methods.requestWithdrawal = async function() {
    if (this.status !== 'in_inventory') {
        throw new Error('Item cannot be withdrawn');
    }
    
    if (!this.isWithdrawable) {
        throw new Error('Item is not withdrawable');
    }
    
    this.status = 'pending_withdrawal';
    this.withdrawalRequestedAt = new Date();
    this.transactionId = `WITHDRAW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.save();
    
    // Log withdrawal request
    console.log(`=== ЗАПРОС НА ВЫВОД ПРИЗА ===`);
    console.log(`ID предмета: ${this._id}`);
    console.log(`ID пользователя: ${this.userId}`);
    console.log(`Название приза: ${this.itemName}`);
    console.log(`Стоимость: ${this.itemValue}`);
    console.log(`Тип: ${this.itemType}`);
    console.log(`Редкость: ${this.rarity}`);
    console.log(`Время запроса: ${this.withdrawalRequestedAt}`);
    console.log(`Transaction ID: ${this.transactionId}`);
    console.log(`================================`);
};

inventoryItemSchema.methods.completeWithdrawal = async function() {
    if (this.status !== 'pending_withdrawal') {
        throw new Error('Item is not pending withdrawal');
    }
    
    this.status = 'withdrawn';
    await this.save();
};

inventoryItemSchema.methods.getRarityColor = function() {
    const colors = {
        common: '#b0b0b0',
        uncommon: '#00ff00', 
        rare: '#0070ff',
        epic: '#a335ee',
        legendary: '#ff8000'
    };
    return colors[this.rarity] || '#b0b0b0';
};

// Pre-save middleware
inventoryItemSchema.pre('save', function(next) {
    // Auto-determine rarity based on value if not set
    if (!this.rarity) {
        if (this.itemValue >= 1000) this.rarity = 'legendary';
        else if (this.itemValue >= 500) this.rarity = 'epic';
        else if (this.itemValue >= 200) this.rarity = 'rare';
        else if (this.itemValue >= 100) this.rarity = 'uncommon';
        else this.rarity = 'common';
    }
    next();
});

// Virtual for display name with rarity
inventoryItemSchema.virtual('displayName').get(function() {
    const rarityPrefix = {
        common: '',
        uncommon: '[Необычный] ',
        rare: '[Редкий] ',
        epic: '[Эпический] ',
        legendary: '[Легендарный] '
    };
    return `${rarityPrefix[this.rarity]}${this.itemName}`;
});

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);