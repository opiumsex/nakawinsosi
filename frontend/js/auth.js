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

        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');
        const logoutBtn = document.getElementById('logoutBtn');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        if (showRegister) {
            showRegister.addEventListener('click', (e) => this.showRegisterForm(e));
        }
        if (showLogin) {
            showLogin.addEventListener('click', (e) => this.showLoginForm(e));
        }
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    showAuth() {
        showModal('authModal');
        document.getElementById('app').classList.add('hidden');
    }

    showApp() {
        closeModal('authModal');
        closeModal('registerModal');
        document.getElementById('app').classList.remove('hidden');
        this.updateUI();
        
        // Load current tab from localStorage
        const currentTab = localStorage.getItem('currentTab') || 'cases';
        if (window.mainApp) {
            window.mainApp.showTab(currentTab);
        }
    }

    showRegisterForm(e) {
        e.preventDefault();
        closeModal('authModal');
        showModal('registerModal');
    }

    showLoginForm(e) {
        e.preventDefault();
        closeModal('registerModal');
        showModal('authModal');
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
                
                // Clear form
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
                // Automatically login after registration
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                this.showApp();
                showNotification('Регистрация успешна! Добро пожаловать!', 'success');
                
                // Clear form
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
            const logoutBtn = document.getElementById('logoutBtn');
            
            if (userNameElement) {
                userNameElement.textContent = this.user.username;
            }
            if (userBalanceElement) {
                userBalanceElement.textContent = `${this.user.balance} ₽`;
            }
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
}