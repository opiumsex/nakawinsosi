const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nakawin';

console.log('🔗 Подключаемся к MongoDB...');
console.log('URI:', MONGODB_URI ? 'Установлен' : 'Не установлен');

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Успешное подключение к MongoDB');
    runScript();
})
.catch((error) => {
    console.error('❌ Ошибка подключения к MongoDB:', error.message);
    console.log('💡 Убедитесь, что:');
    console.log('1. Файл .env существует в корне проекта');
    console.log('2. MONGODB_URI указан в .env файле');
    console.log('3. MongoDB сервер запущен');
    process.exit(1);
});

const { Case } = require('../models/Case');

const addCase = async (caseData) => {
    try {
        const newCase = new Case(caseData);
        await newCase.save();
        console.log('✅ Кейс успешно добавлен!');
        console.log(`📦 Название: ${caseData.name}`);
        console.log(`💰 Цена: ${caseData.price} монет`);
        console.log(`🎁 Количество предметов: ${caseData.items.length}`);
        return newCase;
    } catch (error) {
        console.error('❌ Ошибка при добавлении кейса:', error.message);
        throw error;
    }
};

// Примеры кейсов для добавления
const sampleCases = [
    {
        name: "Стартовый кейс",
        image: "/images/start-case.png",
        price: 101,
        items: [
            { name: "Меч новичка", value: 50, chance: 40, image: "/images/novice-sword.png" },
            { name: "Щит ученика", value: 75, chance: 30, image: "/images/student-shield.png" },
            { name: "Кольцо магии", value: 150, chance: 15, image: "/images/magic-ring.png" },
            { name: "Амулет силы", value: 300, chance: 10, image: "/images/strength-amulet.png" },
            { name: "Легендарный артефакт", value: 1000, chance: 5, image: "/images/legendary-artifact.png" }
        ]
    },
    {
        name: "Эпический кейс",
        image: "/images/epic-case.png",
        price: 250,
        items: [
            { name: "Эпический меч", value: 300, chance: 25, image: "/images/epic-sword.png" },
            { name: "Доспех дракона", value: 500, chance: 20, image: "/images/dragon-armor.png" },
            { name: "Кольцо огня", value: 400, chance: 20, image: "/images/fire-ring.png" },
            { name: "Артефакт древних", value: 800, chance: 15, image: "/images/ancient-artifact.png" },
            { name: "Легендарный клинок", value: 1500, chance: 10, image: "/images/legendary-blade.png" },
            { name: "Мифический щит", value: 1200, chance: 10, image: "/images/mythic-shield.png" }
        ]
    },
    {
        name: "Легендарный кейс",
        image: "/images/legendary-case.png",
        price: 500,
        items: [
            { name: "Меч дракона", value: 1000, chance: 15, image: "/images/dragon-sword.png" },
            { name: "Щит титана", value: 800, chance: 20, image: "/images/titan-shield.png" },
            { name: "Кольцо бессмертия", value: 600, chance: 25, image: "/images/immortal-ring.png" },
            { name: "Артефакт богов", value: 2000, chance: 10, image: "/images/god-artifact.png" },
            { name: "Клинок тени", value: 300, chance: 20, image: "/images/shadow-blade.png" },
            { name: "Наручи силы", value: 200, chance: 10, image: "/images/power-bracers.png" }
        ]
    }
];

async function runScript() {
    try {
        console.log('\n🎮 Начинаем добавление кейсов...\n');
        
        // Проверяем, есть ли уже кейсы
        const existingCases = await Case.countDocuments();
        console.log(`📊 Найдено существующих кейсов: ${existingCases}`);
        
        if (existingCases > 0) {
            console.log('⚠️  Кейсы уже существуют. Пропускаем добавление.');
            mongoose.connection.close();
            return;
        }
        
        // Добавляем кейсы
        for (const caseData of sampleCases) {
            console.log(`\n➕ Добавляем кейс: ${caseData.name}`);
            await addCase(caseData);
            await new Promise(resolve => setTimeout(resolve, 500)); // Задержка между добавлениями
        }
        
        console.log('\n🎉 Все кейсы успешно добавлены!');
        console.log('📋 Для просмотра кейсов запустите сервер и откройте http://localhost:3000');
        
    } catch (error) {
        console.error('💥 Ошибка при выполнении скрипта:', error.message);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Соединение с базой данных закрыто');
    }
}

// Запуск только если скрипт вызван напрямую
if (require.main === module) {
    // Скрипт запустится автоматически через mongoose.connect
}