class Auth {
    constructor() {
        this.token = localStorage.getItem('nakawin_token');
        this.user = JSON.parse(localStorage.getItem('nakawin_user') || 'null');
        this.init();
    }

    init() {
        console.log('🔐 Инициализация аутентификации...');
        console.log('Токен:', this.token ? 'Есть' : 'Нет');
        console.log('Пользователь:', this.user);

        if (this.token && this.user) {
            this.verifyToken();
        } else {
            this.showAuthModal();
        }

        this.setupEventListeners();
    }

    async verifyToken() {
        try {
            console.log('🔍 Проверка токена...');
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            console.log('Ответ verify:', data);

            if (data.success) {
                console.log('✅ Токен действителен');
                this.user = data.user;
                localStorage.setItem('nakawin_user', JSON.stringify(this.user));
                this.showApp();
            } else {
                console.log('❌ Токен недействителен');
                this.logout();
            }
        } catch (error) {
            console.error('Ошибка проверки токена:', error);
            this.logout();
        }
    }

    setupEventListeners() {
        document.getElementById('loginBtn').addEventListener('click', () => this.login());
        document.getElementById('registerBtn').addEventListener('click', () => this.register());
        
        document.querySelectorAll('.auth-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchAuthTab(tabName);
            });
        });

        document.getElementById('depositBtn').addEventListener('click', () => this.showDepositModal());
        document.getElementById('confirmDepositBtn').addEventListener('click', () => this.confirmDeposit());
        
        const cancelDepositBtn = document.getElementById('cancelDepositBtn');
        if (cancelDepositBtn) {
            cancelDepositBtn.addEventListener('click', () => {
                document.getElementById('depositModal').classList.add('hidden');
            });
        }

        // Закрытие модальных окон
        document.querySelectorAll('.modal-close, .btn-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.add('hidden');
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
    }

    async login() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            Notifications.show('Заполните все поля', 'error');
            return;
        }

        try {
            console.log('🔐 Отправка запроса на вход...');
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            console.log('Ответ сервера:', data);

            if (data.success && data.token) {
                this.token = data.token;
                this.user = data.user;
                
                localStorage.setItem('nakawin_token', this.token);
                localStorage.setItem('nakawin_user', JSON.stringify(this.user));
                
                this.showApp();
                Notifications.show('Успешный вход!', 'success');
            } else {
                Notifications.show(data.message || 'Ошибка входа', 'error');
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            Notifications.show('Ошибка соединения', 'error');
        }
    }

    async register() {
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const gameNickname = document.getElementById('registerGameNick').value || username;
        const gameServer = document.getElementById('registerGameServer').value || 'main';
        const bankAccount = document.getElementById('registerBankAccount').value || '0000000000';

        if (!username || !password) {
            Notifications.show('Заполните имя пользователя и пароль', 'error');
            return;
        }

        if (password.length < 6) {
            Notifications.show('Пароль должен содержать минимум 6 символов', 'error');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ 
                    username, 
                    password, 
                    gameNickname, 
                    gameServer, 
                    bankAccount 
                })
            });

            const data = await response.json();

            if (data.success) {
                Notifications.show('Регистрация успешна! Войдите в аккаунт.', 'success');
                this.switchAuthTab('login');
                
                // Автозаполнение полей входа
                document.getElementById('loginUsername').value = username;
                document.getElementById('loginPassword').value = password;
            } else {
                Notifications.show(data.message || 'Ошибка регистрации', 'error');
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            Notifications.show('Ошибка соединения', 'error');
        }
    }

    switchAuthTab(tabName) {
        document.querySelectorAll('.auth-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.auth-tab-content').forEach(content => content.classList.remove('active'));

        const activeBtn = document.querySelector(`.auth-tab-btn[data-tab="${tabName}"]`);
        const activeContent = document.getElementById(`${tabName}Tab`);

        if (activeBtn) activeBtn.classList.add('active');
        if (activeContent) activeContent.classList.add('active');
    }

    showAuthModal() {
        document.getElementById('authModal').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    }

    showApp() {
        document.getElementById('authModal').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        this.updateUI();
        this.initializeApp();
    }

    updateUI() {
        if (this.user) {
            document.getElementById('userBalance').textContent = this.user.balance;
            document.getElementById('usernameDisplay').textContent = this.user.username;
            
            // Обновляем пример ника для пополнения
            const nickExample = document.getElementById('userNickExample');
            if (nickExample) {
                nickExample.textContent = this.user.username;
            }
            
            // Обновляем аватар
            const avatar = document.getElementById('userAvatar');
            if (avatar) {
                avatar.textContent = this.user.username.charAt(0).toUpperCase();
            }
        }
    }

    initializeApp() {
        // Инициализируем все модули
        if (typeof Cases !== 'undefined') {
            Cases.init();
        }
        if (typeof Wheel !== 'undefined') {
            Wheel.init();
        }
        if (typeof Inventory !== 'undefined') {
            Inventory.init();
        }
        if (typeof CaseOpening !== 'undefined') {
            CaseOpening.init();
        }
        if (window.tabManager) {
            window.tabManager.showTab('cases');
        }
    }

    getAuthHeaders() {
        if (!this.token) {
            console.error('❌ Токен отсутствует при попытке получить заголовки');
            return {
                'Content-Type': 'application/json'
            };
        }

        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    async makeAuthenticatedRequest(url, options = {}) {
        const headers = this.getAuthHeaders();
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...headers,
                    ...options.headers
                }
            });

            if (response.status === 401) {
                this.logout();
                throw new Error('Требуется авторизация');
            }

            return response;
        } catch (error) {
            console.error('Ошибка запроса:', error);
            throw error;
        }
    }

    logout() {
        console.log('🚪 Выход из системы');
        localStorage.removeItem('nakawin_token');
        localStorage.removeItem('nakawin_user');
        this.token = null;
        this.user = null;
        this.showAuthModal();
        Notifications.show('Сессия завершена', 'info');
    }

    updateBalance(newBalance) {
        if (this.user) {
            this.user.balance = newBalance;
            localStorage.setItem('nakawin_user', JSON.stringify(this.user));
            this.updateUI();
        }
    }

    showDepositModal() {
        if (!this.user) {
            Notifications.show('Войдите в аккаунт', 'error');
            return;
        }
        document.getElementById('depositModal').classList.remove('hidden');
    }

    confirmDeposit() {
        if (!this.user) return;
        
        console.log(`💰 Пользователь ${this.user.username} подтвердил оплату`);
        Notifications.show('Запрос на пополнение отправлен! Ожидайте зачисления.', 'success');
        document.getElementById('depositModal').classList.add('hidden');
    }
}