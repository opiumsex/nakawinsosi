const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'nakawin-casino-secret-key-2024';

// Debug endpoint для проверки токена
router.get('/debug', (req, res) => {
    console.log('🔧 Debug auth endpoint');
    res.json({ 
        message: 'Auth endpoint works',
        timestamp: new Date().toISOString()
    });
});

// Регистрация
router.post('/register', async (req, res) => {
    try {
        console.log('📝 Регистрация:', req.body);
        
        const { username, password, gameNickname, gameServer, bankAccount } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Заполните имя пользователя и пароль' 
            });
        }

        // Проверяем существующего пользователя
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'Пользователь уже существует' 
            });
        }

        // Создаем пользователя
        const user = new User({ 
            username, 
            password,
            gameNickname: gameNickname || username,
            gameServer: gameServer || 'main',
            bankAccount: bankAccount || '0000000000'
        });
        
        await user.save();
        console.log('✅ Пользователь создан:', username);

        // Создаем токен
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ 
            success: true,
            token,
            user: { 
                id: user._id,
                username: user.username, 
                balance: user.balance,
                gameNickname: user.gameNickname,
                gameServer: user.gameServer
            } 
        });
        
    } catch (error) {
        console.error('❌ Ошибка регистрации:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ошибка сервера' 
        });
    }
});

// Вход
router.post('/login', async (req, res) => {
    try {
        console.log('🔐 Вход:', req.body);
        
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Заполните имя пользователя и пароль' 
            });
        }

        // Ищем пользователя
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: 'Пользователь не найден' 
            });
        }

        // Проверяем пароль
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false,
                message: 'Неверный пароль' 
            });
        }

        // Создаем токен
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        console.log('✅ Успешный вход. Токен создан для пользователя:', username);

        res.json({ 
            success: true,
            token,
            user: { 
                id: user._id,
                username: user.username, 
                balance: user.balance,
                gameNickname: user.gameNickname,
                gameServer: user.gameServer
            } 
        });
        
    } catch (error) {
        console.error('❌ Ошибка входа:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ошибка сервера' 
        });
    }
});

// Проверка токена
router.get('/verify', async (req, res) => {
    try {
        let token = req.header('Authorization') || req.query.token;
        
        if (token && token.startsWith('Bearer ')) {
            token = token.slice(7);
        }

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Токен отсутствует' 
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Пользователь не найден' 
            });
        }

        res.json({ 
            success: true,
            user: { 
                id: user._id,
                username: user.username, 
                balance: user.balance,
                gameNickname: user.gameNickname,
                gameServer: user.gameServer
            } 
        });
        
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Неверный токен' 
        });
    }
});

module.exports = router;