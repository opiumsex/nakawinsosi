const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    gameNickname: {
        type: String,
        required: true,
        trim: true
    },
    bankAccount: {
        type: String,
        required: true,
        trim: true
    },
    server: {
        type: String,
        required: true,
        trim: true
    },
    balance: {
        type: Number,
        default: 1000
    },
    inventory: [{
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Inventory'
        },
        obtainedAt: {
            type: Date,
            default: Date.now
        }
    }],
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date
}, {
    timestamps: true
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.incrementLoginAttempts = function() {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    if (this.loginAttempts + 1 >= 5 && !this.lockUntil) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
    }
    
    return this.updateOne(updates);
};

module.exports = mongoose.model('User', userSchema);