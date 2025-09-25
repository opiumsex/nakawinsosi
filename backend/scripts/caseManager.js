const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nakawin';

class CaseManager {
    constructor() {
        this.isConnected = false;
    }

    async connect() {
        if (this.isConnected) return;
        
        try {
            await mongoose.connect(MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            this.isConnected = true;
            console.log('✅ Подключение к базе данных установлено');
        } catch (error) {
            console.error('❌ Ошибка подключения к базе данных:', error.message);
            throw error;
        }
    }

    async disconnect() {
        if (this.isConnected) {
            await mongoose.connection.close();
            this.isConnected = false;
            console.log('🔌 Соединение с базой данных закрыто');
        }
    }

    // Добавить новый кейс
    async addCase(caseData) {
        try {
            const { Case } = require('../models/Case');
            const newCase = new Case(caseData);
            await newCase.save();
            console.log('✅ Кейс успешно добавлен:', caseData.name);
            return newCase;
        } catch (error) {
            console.error('❌ Ошибка при добавлении кейса:', error.message);
            throw error;
        }
    }

    // Получить все кейсы
    async getAllCases() {
        try {
            const { Case } = require('../models/Case');
            const cases = await Case.find({ isActive: true });
            console.log(`📦 Найдено кейсов: ${cases.length}`);
            
            cases.forEach((caseItem, index) => {
                console.log(`\n${index + 1}. ${caseItem.name}`);
                console.log(`   💰 Цена: ${caseItem.price} монет`);
                console.log(`   🎁 Предметов: ${caseItem.items.length}`);
                console.log(`   🆔 ID: ${caseItem._id}`);
            });
            
            return cases;
        } catch (error) {
            console.error('❌ Ошибка при получении кейсов:', error.message);
            throw error;
        }
    }

    // Удалить кейс
    async deleteCase(caseName) {
        try {
            const { Case } = require('../models/Case');
            const result = await Case.findOneAndUpdate(
                { name: caseName }, 
                { isActive: false },
                { new: true }
            );
            
            if (result) {
                console.log('✅ Кейс деактивирован:', caseName);
            } else {
                console.log('⚠️ Кейс не найден:', caseName);
            }
            return result;
        } catch (error) {
            console.error('❌ Ошибка при удалении кейса:', error.message);
            throw error;
        }
    }

    // Очистить все кейсы
    async clearAllCases() {
        try {
            const { Case } = require('../models/Case');
            const result = await Case.deleteMany({});
            console.log(`🗑️ Удалено кейсов: ${result.deletedCount}`);
            return result;
        } catch (error) {
            console.error('❌ Ошибка при очистке кейсов:', error.message);
            throw error;
        }
    }

    // Добавить стандартные кейсы
    async addDefaultCases() {
        try {
            const { Case } = require('../models/Case');
            
            // Проверяем, есть ли уже кейсы
            const existingCases = await Case.countDocuments();
            if (existingCases > 0) {
                console.log('⚠️ Кейсы уже существуют. Используйте clear для очистки.');
                return;
            }

            const defaultCases = [
                {
                    name: "Стартовый кейс",
                    image: "/images/start-case.png",
                    price: 100,
                    items: [
                        { name: "Меч новичка", value: 50, chance: 25, image: "/images/novice-sword.png" },
                        { name: "Щит ученика", value: 75, chance: 20, image: "/images/student-shield.png" },
                        { name: "Кольцо магии", value: 150, chance: 15, image: "/images/magic-ring.png" },
                        { name: "Амулет силы", value: 300, chance: 10, image: "/images/strength-amulet.png" },
                        { name: "Ботинки скорости", value: 200, chance: 15, image: "/images/speed-boots.png" },
                        { name: "Наручи защиты", value: 100, chance: 15, image: "/images/defense-bracers.png" }
                    ]
                },
                {
                    name: "Эпический кейс",
                    image: "/images/epic-case.png",
                    price: 250,
                    items: [
                        { name: "Эпический меч", value: 300, chance: 20, image: "/images/epic-sword.png" },
                        { name: "Доспех дракона", value: 500, chance: 15, image: "/images/dragon-armor.png" },
                        { name: "Кольцо огня", value: 400, chance: 15, image: "/images/fire-ring.png" },
                        { name: "Артефакт древних", value: 800, chance: 10, image: "/images/ancient-artifact.png" },
                        { name: "Легендарный клинок", value: 1500, chance: 5, image: "/images/legendary-blade.png" },
                        { name: "Мифический щит", value: 1200, chance: 5, image: "/images/mythic-shield.png" },
                        { name: "Плащ невидимости", value: 600, chance: 15, image: "/images/invisibility-cloak.png" },
                        { name: "Посох магии", value: 700, chance: 15, image: "/images/magic-staff.png" }
                    ]
                },
                {
                    name: "Легендарный кейс",
                    image: "/images/legendary-case.png",
                    price: 500,
                    items: [
                        { name: "Меч дракона", value: 1000, chance: 15, image: "/images/dragon-sword.png" },
                        { name: "Щит титана", value: 800, chance: 15, image: "/images/titan-shield.png" },
                        { name: "Кольцо бессмертия", value: 600, chance: 15, image: "/images/immortal-ring.png" },
                        { name: "Артефакт богов", value: 2000, chance: 5, image: "/images/god-artifact.png" },
                        { name: "Клинок тени", value: 300, chance: 20, image: "/images/shadow-blade.png" },
                        { name: "Наручи силы", value: 200, chance: 15, image: "/images/power-bracers.png" },
                        { name: "Шлем мудрости", value: 400, chance: 10, image: "/images/wisdom-helmet.png" },
                        { name: "Легендарные доспехи", value: 1500, chance: 5, image: "/images/legendary-armor.png" }
                    ]
                },
                {
                    name: "Мифический кейс",
                    image: "/images/mythic-case.png",
                    price: 750,
                    items: [
                        { name: "Посох вселенной", value: 2500, chance: 5, image: "/images/universe-staff.png" },
                        { name: "Меч хаоса", value: 1800, chance: 8, image: "/images/chaos-sword.png" },
                        { name: "Щит порядка", value: 1600, chance: 8, image: "/images/order-shield.png" },
                        { name: "Кольцо времени", value: 1200, chance: 10, image: "/images/time-ring.png" },
                        { name: "Артефакт вечности", value: 3000, chance: 3, image: "/images/eternity-artifact.png" },
                        { name: "Плащ феникса", value: 900, chance: 12, image: "/images/phoenix-cloak.png" },
                        { name: "Ботинки ветра", value: 700, chance: 15, image: "/images/wind-boots.png" },
                        { name: "Перчатки молнии", value: 800, chance: 13, image: "/images/lightning-gloves.png" },
                        { name: "Шлем повелителя", value: 1100, chance: 11, image: "/images/lord-helmet.png" },
                        { name: "Легенда вселенной", value: 5000, chance: 2, image: "/images/universe-legend.png" }
                    ]
                }
            ];

            console.log('🎁 Добавление стандартных кейсов...\n');
            
            for (const caseData of defaultCases) {
                await this.addCase(caseData);
                await new Promise(resolve => setTimeout(resolve, 500)); // Задержка между добавлениями
            }

            console.log('\n🎉 Все кейсы успешно добавлены!');
            console.log('📋 Для просмотра запустите: node caseManager.js list');
            
        } catch (error) {
            console.error('❌ Ошибка при добавлении кейсов:', error.message);
            throw error;
        }
    }

    // Добавить тестовый кейс
    async addTestCase() {
        const testCase = {
            name: "Тестовый кейс",
            image: "/images/test-case.png",
            price: 50,
            items: [
                { name: "Тестовый меч", value: 25, chance: 100, image: "/images/test-sword.png" }
            ]
        };
        
        await this.addCase(testCase);
    }
}

// Функция для быстрого добавления тестовых кейсов
async function setupDefaultCases() {
    const manager = new CaseManager();
    
    try {
        await manager.connect();
        await manager.addDefaultCases();
    } catch (error) {
        console.error('💥 Ошибка:', error.message);
    } finally {
        await manager.disconnect();
    }
}

// Экспортируем для использования в других скриптах
module.exports = { CaseManager, setupDefaultCases };

// Если скрипт запущен напрямую
if (require.main === module) {
    const command = process.argv[2] || 'setup'; // По умолчанию setup
    
    async function main() {
        const manager = new CaseManager();
        
        try {
            await manager.connect();
            
            switch (command) {
                case 'list':
                    console.log('📦 Загрузка списка кейсов...\n');
                    await manager.getAllCases();
                    break;
                    
                case 'setup':
                    console.log('🎁 Настройка стандартных кейсов...\n');
                    await manager.addDefaultCases();
                    break;
                    
                case 'clear':
                    console.log('🗑️ Очистка всех кейсов...\n');
                    await manager.clearAllCases();
                    break;
                    
                case 'test':
                    console.log('🧪 Добавление тестового кейса...\n');
                    await manager.addTestCase();
                    break;
                    
                default:
                    console.log('🎮 Менеджер кейсов Nakawin Casino');
                    console.log('Команды:');
                    console.log('  node caseManager.js list    - Показать все кейсы');
                    console.log('  node caseManager.js setup   - Добавить стандартные кейсы (по умолчанию)');
                    console.log('  node caseManager.js clear   - Очистить все кейсы');
                    console.log('  node caseManager.js test    - Добавить тестовый кейс');
                    break;
            }
            
        } catch (error) {
            console.error('💥 Ошибка:', error.message);
        } finally {
            await manager.disconnect();
        }
    }
    
    main();
}