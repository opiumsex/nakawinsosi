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
    gameServer: {
        type: String,
        required: true,
        trim: true
    },
    bankAccount: {
        type: String,
        required: true,
        trim: true
    },
    balance: { 
        type: Number, 
        default: 1000,
        min: 0
    },
    totalDeposited: {
        type: Number,
        default: 0
    },
    totalWithdrawn: {
        type: Number,
        default: 0
    },
    loginAttempts: { 
        type: Number, 
        default: 0 
    },
    lastAttempt: { 
        type: Date 
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        enum: ['user', 'moderator', 'admin'],
        default: 'user'
    }
}, {
    timestamps: true
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.incrementLoginAttempts = function() {
    this.loginAttempts += 1;
    this.lastAttempt = Date.now();
    return this.save();
};

userSchema.methods.resetLoginAttempts = function() {
    this.loginAttempts = 0;
    this.lastAttempt = null;
    return this.save();
};

userSchema.methods.isAccountLocked = function() {
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
    
    return this.loginAttempts >= MAX_ATTEMPTS && 
           Date.now() - this.lastAttempt < LOCKOUT_TIME;
};

userSchema.methods.getRemainingAttempts = function() {
    const MAX_ATTEMPTS = 5;
    return Math.max(0, MAX_ATTEMPTS - this.loginAttempts);
};

module.exports = mongoose.model('User', userSchema);