class TabManager {
    constructor() {
        this.currentTab = 'cases';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showTab('cases'); // Показываем кейсы по умолчанию
    }

    setupEventListeners() {
        // Обработчики для кнопок навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.showTab(tabName);
            });
        });

        // Обработчики для табов авторизации
        document.querySelectorAll('.auth-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchAuthTab(tabName);
            });
        });
    }

    showTab(tabName) {
        // Скрываем все табы
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // Убираем активный класс со всех кнопок
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Показываем выбранный таб
        const targetTab = document.getElementById(tabName + 'Tab');
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Активируем соответствующую кнопку
        const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }

        this.currentTab = tabName;

        // Инициализируем контент таба если нужно
        this.initializeTabContent(tabName);
    }

    initializeTabContent(tabName) {
        switch(tabName) {
            case 'cases':
                if (typeof Cases !== 'undefined') Cases.loadCases();
                break;
            case 'wheel':
                if (typeof Wheel !== 'undefined') Wheel.drawWheel();
                break;
            case 'inventory':
                if (typeof Inventory !== 'undefined') Inventory.loadInventory();
                break;
        }
    }

    switchAuthTab(tabName) {
        // Скрываем все табы авторизации
        document.querySelectorAll('.auth-tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Убираем активный класс со всех кнопок авторизации
        document.querySelectorAll('.auth-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Показываем выбранный таб
        const targetTab = document.getElementById(tabName + 'Tab');
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Активируем кнопку
        const targetBtn = document.querySelector(`.auth-tab-btn[data-tab="${tabName}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
    }

    getCurrentTab() {
        return this.currentTab;
    }
}