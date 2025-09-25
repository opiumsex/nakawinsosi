class CaseOpening {
    static currentCase = null;
    static isSpinning = false;

    static init() {
        this.setupEventListeners();
    }

    static setupEventListeners() {
        // Обработчик для кнопок открытия кейса
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('open-case-btn') || e.target.closest('.case-item')) {
                const caseElement = e.target.closest('.case-item');
                if (caseElement) {
                    this.startCaseOpening(caseElement.dataset.caseId);
                }
            }
        });

        // Обработчики модального окна
        document.getElementById('startCaseOpening').addEventListener('click', () => this.spinCase());
        document.getElementById('cancelCaseOpening').addEventListener('click', () => this.closeCaseOpening());
        document.getElementById('sellPrizeBtn').addEventListener('click', () => this.sellPrize());
        document.getElementById('keepPrizeBtn').addEventListener('click', () => this.keepPrize());
    }

    static async startCaseOpening(caseId) {
        if (!window.auth || !window.auth.token) {
            Notifications.show('Войдите в аккаунт для открытия кейсов', 'error');
            return;
        }

        if (this.isSpinning) return;

        try {
            // Загружаем данные кейса
            const response = await fetch(`/api/cases/${caseId}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message);
            }

            this.currentCase = data.case;
            this.showCaseOpeningModal();
            
        } catch (error) {
            console.error('Error loading case:', error);
            Notifications.show('Ошибка загрузки кейса', 'error');
        }
    }

    static showCaseOpeningModal() {
        const modal = document.getElementById('caseOpeningModal');
        const caseBalance = document.getElementById('caseOpeningBalance');
        const casePrice = document.getElementById('casePrice');
        const itemsTrack = document.getElementById('caseItemsTrack');

        // Обновляем баланс
        caseBalance.textContent = window.auth.user.balance;
        casePrice.textContent = this.currentCase.price;

        // Создаем трек с предметами
        itemsTrack.innerHTML = '';
        const items = [...this.currentCase.items, ...this.currentCase.items, ...this.currentCase.items];
        
        items.forEach(item => {
            const slide = document.createElement('div');
            slide.className = 'case-item-slide';
            slide.innerHTML = `
                <img src="${item.image || '/images/default-item.png'}" alt="${item.name}">
                <div class="item-name">${item.name}</div>
                <div class="item-value">${item.value} монет</div>
            `;
            itemsTrack.appendChild(slide);
        });

        modal.classList.remove('hidden');
    }

    static async spinCase() {
        if (this.isSpinning) return;

        const user = window.auth.user;
        if (user.balance < this.currentCase.price) {
            Notifications.show('Недостаточно средств', 'error');
            return;
        }

        this.isSpinning = true;
        const startBtn = document.getElementById('startCaseOpening');
        const spinningText = document.getElementById('spinningText');
        const caseTimer = document.getElementById('caseTimer');
        const itemsTrack = document.getElementById('caseItemsTrack');

        startBtn.disabled = true;
        spinningText.textContent = 'Крутим...';
        itemsTrack.classList.add('case-spinning');

        // Анимация прокрутки
        let timeLeft = 5;
        const timerInterval = setInterval(() => {
            caseTimer.textContent = `Осталось: ${timeLeft}с`;
            timeLeft--;
        }, 1000);

        try {
            // Отправляем запрос на открытие кейса
            const response = await fetch(`/api/cases/open/${this.currentCase._id}`, {
                method: 'POST',
                headers: window.auth.getAuthHeaders()
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message);
            }

            // Замедляем анимацию перед остановкой
            setTimeout(() => {
                itemsTrack.classList.remove('case-spinning');
                itemsTrack.style.transition = 'transform 2s ease-out';
                
                // Позиционируем на выигранный предмет
                const prizeIndex = this.currentCase.items.findIndex(item => item.name === data.item.name);
                if (prizeIndex !== -1) {
                    const targetPosition = -((prizeIndex + this.currentCase.items.length) * 200);
                    itemsTrack.style.transform = `translateX(${targetPosition}px)`;
                }

                setTimeout(() => {
                    clearInterval(timerInterval);
                    this.showPrize(data.item);
                    window.auth.updateBalance(data.newBalance);
                    this.isSpinning = false;
                }, 2000);

            }, 3000);

        } catch (error) {
            console.error('Error opening case:', error);
            clearInterval(timerInterval);
            this.isSpinning = false;
            startBtn.disabled = false;
            itemsTrack.classList.remove('case-spinning');
            Notifications.show(error.message, 'error');
        }
    }

    static showPrize(item) {
        const modal = document.getElementById('caseOpeningModal');
        const prizeModal = document.getElementById('prizeModal');
        
        modal.classList.add('hidden');
        
        // Обновляем информацию о призе
        document.getElementById('prizeImage').src = item.image || '/images/default-item.png';
        document.getElementById('prizeName').textContent = item.name;
        document.getElementById('prizeValue').textContent = item.value;
        document.getElementById('sellPrice').textContent = item.value;
        
        // Определяем редкость
        const rarity = this.getRarity(item.value);
        const rarityElement = document.getElementById('prizeRarity');
        rarityElement.textContent = rarity.toUpperCase();
        rarityElement.className = `prize-rarity ${rarity}`;
        
        prizeModal.classList.remove('hidden');
        this.currentPrize = item;
    }

    static getRarity(value) {
        if (value >= 1000) return 'legendary';
        if (value >= 500) return 'epic';
        if (value >= 200) return 'rare';
        if (value >= 100) return 'uncommon';
        return 'common';
    }

    static async sellPrize() {
        if (!this.currentPrize) return;

        try {
            // Логика продажи предмета
            const newBalance = window.auth.user.balance + this.currentPrize.value;
            window.auth.updateBalance(newBalance);
            
            Notifications.show(`Предмет "${this.currentPrize.name}" продан за ${this.currentPrize.value} монет`, 'success');
            this.closePrizeModal();
            
        } catch (error) {
            Notifications.show('Ошибка при продаже предмета', 'error');
        }
    }

    static keepPrize() {
        Notifications.show('Предмет добавлен в инвентарь', 'success');
        this.closePrizeModal();
        
        // Обновляем инвентарь
        if (typeof Inventory !== 'undefined') {
            Inventory.loadInventory();
        }
    }

    static closeCaseOpening() {
        document.getElementById('caseOpeningModal').classList.add('hidden');
        this.isSpinning = false;
        this.currentCase = null;
    }

    static closePrizeModal() {
        document.getElementById('prizeModal').classList.add('hidden');
        document.getElementById('caseOpeningModal').classList.add('hidden');
        this.currentPrize = null;
        this.currentCase = null;
        this.isSpinning = false;
    }
}