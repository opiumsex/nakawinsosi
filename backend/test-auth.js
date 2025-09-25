const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nakawin';
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';

async function testAuth() {
    try {
        console.log('🧪 Тестирование аутентификации...');
        
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Подключение к MongoDB');

        const User = require('./models/User');
        const jwt = require('jsonwebtoken');

        // Создаем тестового пользователя
        const testUser = await User.findOne({ username: 'test' });
        if (!testUser) {
            console.log('👤 Создаем тестового пользователя...');
            const user = new User({
                username: 'test',
                password: 'test123',
                gameNickname: 'testplayer',
                gameServer: 'test',
                bankAccount: '1111111111'
            });
            await user.save();
            console.log('✅ Тестовый пользователь создан: test / test123');
        }

        // Тестируем JWT
        const user = await User.findOne({ username: 'test' });
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        console.log('🔑 Сгенерированный токен:', token);

        // Проверяем токен
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Токен валиден, пользователь ID:', decoded.userId);

        console.log('\n🎉 Тест пройден успешно!');
        console.log('👤 Логин: test');
        console.log('🔑 Пароль: test123');
        
    } catch (error) {
        console.error('❌ Ошибка тестирования:', error);
    } finally {
        await mongoose.connection.close();
    }
}

testAuth();