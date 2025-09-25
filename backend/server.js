const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Debug middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/wheel', require('./routes/wheel'));
app.use('/api/inventory', require('./routes/inventory'));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nakawin';
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';

console.log('🔧 Конфигурация:');
console.log('MONGODB_URI:', MONGODB_URI ? 'Установлен' : 'Не установлен');
console.log('JWT_SECRET:', JWT_SECRET ? 'Установлен' : 'Используется по умолчанию');

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Успешное подключение к MongoDB');
    initializeDefaultData();
})
.catch((error) => {
    console.error('❌ Ошибка подключения к MongoDB:', error);
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

async function initializeDefaultData() {
    try {
        const Wheel = require('./models/Wheel');
        const { Case } = require('./models/Case');
        const User = require('./models/User');
        
        // Check if admin user exists
        const adminUser = await User.findOne({ username: 'admin' });
        if (!adminUser) {
            const defaultAdmin = new User({
                username: 'admin',
                password: 'admin123',
                gameNickname: 'admin',
                gameServer: 'main',
                bankAccount: '0000000000',
                role: 'admin'
            });
            await defaultAdmin.save();
            console.log('👑 Создан администратор: admin / admin123');
        }

        // Create default wheel
        const existingWheel = await Wheel.findOne({ isActive: true });
        if (!existingWheel) {
            const defaultWheel = new Wheel({
                name: "Колесо Фортуны",
                segments: [
                    { name: "100 монет", value: 100, chance: 30, color: "#FF6B6B" },
                    { name: "500 монет", value: 500, chance: 10, color: "#4ECDC4" },
                    { name: "50 монет", value: 50, chance: 40, color: "#45B7D1" },
                    { name: "1000 монет", value: 1000, chance: 5, color: "#96CEB4" },
                    { name: "200 монет", value: 200, chance: 20, color: "#FFEAA7" },
                    { name: "Случайный предмет", value: 250, chance: 15, color: "#DDA0DD" }
                ]
            });
            await defaultWheel.save();
            console.log('🎡 Создано колесо фортуны');
        }

        console.log('✅ Инициализация данных завершена');
    } catch (error) {
        console.error('❌ Ошибка инициализации данных:', error);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📍 Откройте http://localhost:${PORT}`);
});