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

// Логирование для продакшена
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    }
    next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/wheel', require('./routes/wheel'));
app.use('/api/inventory', require('./routes/inventory'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV 
    });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI не установлен');
    process.exit(1);
}

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Успешное подключение к MongoDB');
    console.log('📍 База данных:', mongoose.connection.name);
})
.catch((error) => {
    console.error('❌ Ошибка подключения к MongoDB:', error.message);
    process.exit(1);
});

// Обработка ошибок MongoDB
mongoose.connection.on('error', err => {
    console.error('❌ Ошибка MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️  Отключение от MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Получен SIGINT. Завершение работы...');
    await mongoose.connection.close();
    console.log('✅ Соединение с MongoDB закрыто');
    process.exit(0);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`🌐 Окружение: ${process.env.NODE_ENV}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    
    if (process.env.NODE_ENV === 'production') {
        console.log('📊 Режим: PRODUCTION');
    } else {
        console.log('🔧 Режим: DEVELOPMENT');
    }
});
