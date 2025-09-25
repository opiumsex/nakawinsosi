const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nakawin';

async function addWheelPrizes() {
    try {
        console.log('🔗 Подключаемся к MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ Подключение успешно');

        const Wheel = require('../models/Wheel');
        
        // Удаляем существующее колесо
        await Wheel.deleteMany({});
        
        // Создаем новое колесо с призами
        const wheelPrizes = {
            name: "Колесо Фортуны Nakawin",
            segments: [
                { 
                    name: "100 монет", 
                    value: 100, 
                    chance: 25, 
                    color: "#FF6B6B",
                    image: "/images/coins/100.png",
                    type: "currency"
                },
                { 
                    name: "500 монет", 
                    value: 500, 
                    chance: 10, 
                    color: "#4ECDC4",
                    image: "/images/coins/500.png",
                    type: "currency"
                },
                { 
                    name: "50 монет", 
                    value: 50, 
                    chance: 30, 
                    color: "#45B7D1",
                    image: "/images/coins/50.png",
                    type: "currency"
                },
                { 
                    name: "1000 монет", 
                    value: 1000, 
                    chance: 5, 
                    color: "#96CEB4",
                    image: "/images/coins/1000.png",
                    type: "currency"
                },
                { 
                    name: "Меч воина", 
                    value: 200, 
                    chance: 15, 
                    color: "#FFEAA7",
                    image: "/images/items/sword.png",
                    type: "item"
                },
                { 
                    name: "Кольцо магии", 
                    value: 300, 
                    chance: 10, 
                    color: "#DDA0DD",
                    image: "/images/items/ring.png",
                    type: "item"
                },
                { 
                    name: "Легендарный артефакт", 
                    value: 1500, 
                    chance: 3, 
                    color: "#FFD700",
                    image: "/images/items/artifact.png",
                    type: "item"
                },
                { 
                    name: "200 монет", 
                    value: 200, 
                    chance: 20, 
                    color: "#A29BFE",
                    image: "/images/coins/200.png",
                    type: "currency"
                }
            ]
        };

        const wheel = new Wheel(wheelPrizes);
        await wheel.save();
        
        console.log('🎡 Колесо фортуны успешно создано!');
        console.log('📊 Призы на колесе:');
        wheelPrizes.segments.forEach((prize, index) => {
            console.log(`${index + 1}. ${prize.name} - ${prize.value} монет (шанс: ${prize.chance}%)`);
        });
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Соединение закрыто');
    }
}

// Запускаем скрипт
addWheelPrizes();