const { setupDefaultCases } = require('./caseManager.js');

console.log('🚀 Автоматическая настройка Nakawin Casino...\n');

async function runSetup() {
    try {
        await setupDefaultCases();
        console.log('\n✅ Настройка завершена!');
        console.log('🎮 Теперь вы можете:');
        console.log('   1. Запустить сервер: npm start');
        console.log('   2. Открыть http://localhost:3000');
        console.log('   3. Использовать логин: test / test123');
    } catch (error) {
        console.error('❌ Ошибка настройки:', error.message);
    }
}

runSetup();