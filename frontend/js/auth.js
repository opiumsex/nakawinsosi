class Auth {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user'));
        this.init();
    }

    init() {
        if (this.token && this.user) {
            this.showApp();
        } else {
            this.showAuth();
        }

        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('showRegister').addEventListener('click', (e) => this.showRegisterForm(e));
        document.getElementById('showLogin').addEventListener('click', (e) => this.showLoginForm(e));
        
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
    }

    showAuth() {
        this.showModal('authModal');
        document.getElementById('app').classList.add('hidden');
    }

    showApp() {
        this.hideAllModals();
        document.getElementById('app').classList.remove('hidden');
        this.updateUI();
        
        // Load current tab from localStorage
        const currentTab = localStorage.getItem('currentTab') || 'cases';
        if (window.mainApp) {
            window.mainApp.showTab(currentTab);
        }
        
        // Инициализируем все системы после входа
        this.initializeAppSystems();
    }

    initializeAppSystems() {
        // Переинициализируем кейсы
        if (window.casesInstance) {
            window.casesInstance.loadCases();
        } else {
            window.casesInstance = new Cases();
        }
        
        // Переинициализируем рулетку
        if (window.wheelInstance) {
            window.wheelInstance.loadWheel();
        } else {
            window.wheelInstance = new Wheel();
        }
        
        // Переинициализируем инвентарь
        if (window.inventoryInstance) {
            window.inventoryInstance.loadInventory();
        } else {
            window.inventoryInstance = new Inventory();
        }
    }

    showRegisterForm(e) {
        e.preventDefault();
        this.hideModal('authModal');
        this.showModal('registerModal');
    }

    showLoginForm(e) {
        e.preventDefault();
        this.hideModal('registerModal');
        this.showModal('authModal');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                this.showApp();
                showNotification('Успешный вход! Добро пожаловать!', 'success');
                
                // Очищаем форму
                document.getElementById('loginForm').reset();
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            showNotification('Ошибка соединения с сервером', 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const password = document.getElementById('regPassword').value;
        const gameNickname = document.getElementById('regGameNickname').value;
        const bankAccount = document.getElementById('regBankAccount').value;
        const server = document.getElementById('regServer').value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    username, 
                    password, 
                    gameNickname, 
                    bankAccount, 
                    server 
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Автоматически входим после регистрации
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                this.showApp();
                showNotification('Регистрация успешна! Добро пожаловать!', 'success');
                
                // Очищаем форму
                document.getElementById('registerForm').reset();
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            showNotification('Ошибка соединения с сервером', 'error');
        }
    }

    updateUI() {
        if (this.user) {
            const userNameElement = document.getElementById('userName');
            const userBalanceElement = document.getElementById('userBalance');
            
            if (userNameElement) {
                userNameElement.textContent = this.user.username;
            }
            if (userBalanceElement) {
                userBalanceElement.textContent = `${this.user.balance} ₽`;
            }
            
            // Показываем кнопку выхода
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.style.display = 'flex';
            }
        }
    }

    getAuthHeaders() {
        if (!this.token) {
            showNotification('Требуется авторизация', 'error');
            this.showAuth();
            throw new Error('No token available');
        }
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    logout() {
        this.animateLogout();
        
        showNotification('Выход из аккаунта...', 'info');
        
        setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('currentTab');
            this.token = null;
            this.user = null;
            
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.style.display = 'none';
            }
            
            this.showAuth();
            
            setTimeout(() => {
                showNotification('Вы успешно вышли из аккаунта', 'success');
            }, 500);
        }, 1000);
    }

    animateLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        const app = document.getElementById('app');
        
        if (logoutBtn) {
            this.createRippleEffect(logoutBtn);
            logoutBtn.classList.add('bounce-out');
        }
        
        if (app) {
            app.classList.add('fade-out-up');
        }
    }

    createRippleEffect(button) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
}

const auth = new Auth();