const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, password, gameNickname, bankAccount, server } = req.body;
        
        // Validation
        if (!username || !password || !gameNickname || !bankAccount || !server) {
            return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ message: 'Имя пользователя должно быть от 3 до 20 символов' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Пароль должен содержать минимум 6 символов' });
        }
        
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            logger.warn(`Registration failed: username ${username} already exists`);
            return res.status(400).json({ message: 'Имя пользователя уже занято' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            username,
            password: hashedPassword,
            gameNickname,
            bankAccount,
            server,
            balance: 1000 // Гарантируем начальный баланс
        });
        
        await user.save();
        
        // Сразу создаем токен для автоматического входа
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'nakawin_secret');
        
        logger.userAction(username, 'REGISTERED', `Game: ${gameNickname}, Server: ${server}`);
        
        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                gameNickname: user.gameNickname,
                balance: user.balance
            },
            message: 'Регистрация успешна'
        });
        
    } catch (error) {
        logger.error('Registration error: ' + error.message);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) {
            logger.warn(`Login failed: user ${username} not found`);
            return res.status(400).json({ message: 'Неверное имя пользователя или пароль' });
        }
        
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const timeLeft = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
            logger.warn(`Login failed: user ${username} locked for ${timeLeft} minutes`);
            return res.status(423).json({ 
                message: `Аккаунт заблокирован. Попробуйте через ${timeLeft} минут.` 
            });
        }
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            await user.incrementLoginAttempts();
            const updatedUser = await User.findById(user._id);
            const attemptsLeft = 5 - updatedUser.loginAttempts;
            
            logger.warn(`Login failed: invalid password for ${username}, attempts left: ${attemptsLeft}`);
            
            if (attemptsLeft > 0) {
                return res.status(400).json({ 
                    message: `Неверный пароль. Осталось попыток: ${attemptsLeft}` 
                });
            } else {
                return res.status(400).json({ 
                    message: 'Аккаунт заблокирован из-за слишком большого количества неудачных попыток' 
                });
            }
        }
        
        // Reset login attempts on successful login
        await User.updateOne({ _id: user._id }, { 
            $set: { loginAttempts: 0 },
            $unset: { lockUntil: 1 }
        });
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'nakawin_secret');
        
        logger.userAction(username, 'LOGGED_IN', `Balance: ${user.balance}`);
        
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                gameNickname: user.gameNickname,
                balance: user.balance
            }
        });
    } catch (error) {
        logger.error('Login error: ' + error.message);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;