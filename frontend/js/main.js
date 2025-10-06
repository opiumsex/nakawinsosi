class MainApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupDeposit();
        this.setupTabContent();
        this.createSnowflakes();
        
        window.mainApp = this;
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        // Load saved tab or default to cases
        const savedTab = localStorage.getItem('currentTab') || 'cases';
        this.showTab(savedTab);
        
        // Set active button based on saved tab
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === savedTab) {
                btn.classList.add('active');
            }
        });
        
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                
                // Update active button
                navButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // Show target tab
                this.showTab(targetTab);
            });
        });
    }

    showTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show target tab
        const targetTab = document.getElementById(`${tabName}Tab`);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // Save current tab to localStorage
        localStorage.setItem('currentTab', tabName);
    }

    setupDeposit() {
        const depositBtn = document.getElementById('depositBtn');
        const confirmBtn = document.getElementById('confirmDeposit');

        depositBtn.addEventListener('click', () => {
            showModal('depositModal');
        });

        confirmBtn.addEventListener('click', () => {
            closeModal('depositModal');
            showNotification('Запрос на пополнение отправлен', 'success');
            
            console.log(`=== DEPOSIT CONFIRMATION ===`);
            console.log(`User: ${auth.user.username}`);
            console.log(`Balance: ${auth.user.balance}`);
            console.log(`Timestamp: ${new Date().toISOString()}`);
            console.log(`===========================`);
        });
    }

    setupTabContent() {
        // Tab content is now handled in setupNavigation
    }

    createSnowflakes() {
        const snowflakesContainer = document.createElement('div');
        snowflakesContainer.className = 'snowflakes';
        document.body.appendChild(snowflakesContainer);

        const snowflakeCount = 50; // Reduced count for subtle effect

        for (let i = 0; i < snowflakeCount; i++) {
            setTimeout(() => {
                const snowflake = document.createElement('div');
                snowflake.className = 'snowflake';
                snowflake.innerHTML = '.';
                snowflake.style.left = Math.random() * 100 + 'vw';
                snowflake.style.animationDuration = (Math.random() * 10 + 10) + 's';
                snowflake.style.animationDelay = Math.random() * 5 + 's';
                snowflake.style.opacity = Math.random() * 0.3 + 0.1;
                snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
                snowflakesContainer.appendChild(snowflake);

                // Remove snowflake after animation
                setTimeout(() => {
                    if (snowflake.parentNode) {
                        snowflake.parentNode.removeChild(snowflake);
                    }
                }, 20000);
            }, i * 200);
        }

        // Continuously create snowflakes
        setInterval(() => {
            this.createSingleSnowflake(snowflakesContainer);
        }, 500);
    }

    createSingleSnowflake(container) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.innerHTML = '.';
        snowflake.style.left = Math.random() * 100 + 'vw';
        snowflake.style.animationDuration = (Math.random() * 10 + 10) + 's';
        snowflake.style.opacity = Math.random() * 0.3 + 0.1;
        snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
        container.appendChild(snowflake);

        setTimeout(() => {
            if (snowflake.parentNode) {
                snowflake.parentNode.removeChild(snowflake);
            }
        }, 20000);
    }
}

// Initialize main app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MainApp();
});