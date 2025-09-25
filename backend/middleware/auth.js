const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'nakawin-casino-secret-key-2024';

const auth = async (req, res, next) => {
    try {
        console.log('🔐 Auth Middleware - Проверка токена...');
        console.log('Headers:', req.headers);
        
        // Получаем токен из разных источников
        let token = req.header('Authorization') || 
                   req.header('authorization') || 
                   req.query.token;

        console.log('Raw token:', token);

        // Извлекаем токен из Bearer
        if (token && token.startsWith('Bearer ')) {
            token = token.slice(7);
        }

        if (!token) {
            console.log('❌ Токен не предоставлен');
            return res.status(401).json({ 
                success: false,
                message: 'Токен доступа отсутствует' 
            });
        }

        console.log('Token to verify:', token.substring(0, 20) + '...');

        // Проверяем токен
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Токен валиден. User ID:', decoded.userId);

        // Добавляем user ID к запросу
        req.userId = decoded.userId;
        next();

    } catch (error) {
        console.error('❌ Ошибка аутентификации:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                message: 'Неверный токен' 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: 'Токен истек' 
            });
        }

        res.status(401).json({ 
            success: false,
            message: 'Ошибка аутентификации' 
        });
    }
};

module.exports = auth;