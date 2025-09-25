class Cases {
    static init() {
        this.loadCases();
        this.setupEventListeners();
    }

    static async loadCases() {
        try {
            console.log('📦 Загрузка кейсов...');
            const response = await fetch('/api/cases');
            const data = await response.json();

            if (data.success) {
                console.log('✅ Кейсы загружены:', data.cases.length);
                this.renderCases(data.cases);
            } else {
                console.error('❌ Ошибка загрузки кейсов:', data.message);
                Notifications.show('Ошибка загрузки кейсов', 'error');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки кейсов:', error);
            Notifications.show('Ошибка соединения', 'error');
        }
    }

    static renderCases(cases) {
        const container = document.getElementById('casesContainer');
        
        if (!cases || cases.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>🎁 Кейсы скоро появятся!</h3>
                    <p>Мы готовим для вас новые увлекательные кейсы</p>
                </div>
            `;
            return;
        }

        container.innerHTML = cases.map(caseItem => {
            const avgValue = caseItem.items.reduce((sum, item) => sum + item.value, 0) / caseItem.items.length;
            const rarity = this.getRarity(avgValue);
            
            return `
                <div class="case-item" data-case-id="${caseItem._id}">
                    <div class="case-rarity rarity-${rarity}">${rarity.toUpperCase()}</div>
                    <div class="case-image">
                        <img src="${caseItem.image || '/images/default-case.png'}" alt="${caseItem.name}">
                    </div>
                    <div class="case-info">
                        <h3>${caseItem.name}</h3>
                        <div class="case-price">${caseItem.price} монет</div>
                        <div class="case-items-count">${caseItem.items.length} предметов</div>
                    </div>
                    <button class="btn-glow btn-rounded open-case-btn">
                        🎯 Открыть кейс
                    </button>
                </div>
            `;
        }).join('');
    }

    static getRarity(value) {
        if (value >= 1000) return 'legendary';
        if (value >= 500) return 'epic';
        if (value >= 200) return 'rare';
        if (value >= 100) return 'uncommon';
        return 'common';
    }

    static setupEventListeners() {
        document.getElementById('casesContainer').addEventListener('click', (e) => {
            if (e.target.classList.contains('open-case-btn') || e.target.closest('.case-item')) {
                const caseItem = e.target.closest('.case-item');
                if (caseItem) {
                    this.openCase(caseItem.dataset.caseId);
                }
            }
        });
    }

    static async openCase(caseId) {
        console.log('🎁 Попытка открытия кейса:', caseId);
        
        if (!window.auth || !window.auth.token) {
            Notifications.show('Войдите в аккаунт для открытия кейсов', 'error');
            return;
        }

        try {
            // Используем метод makeAuthenticatedRequest для авторизованных запросов
            const response = await window.auth.makeAuthenticatedRequest(`/api/cases/open/${caseId}`, {
                method: 'POST'
            });

            const data = await response.json();
            console.log('Ответ открытия кейса:', data);

            if (data.success) {
                // Используем систему открытия кейсов с анимацией
                if (typeof CaseOpening !== 'undefined') {
                    CaseOpening.showPrize(data.item);
                    window.auth.updateBalance(data.newBalance);
                } else {
                    // Fallback: просто показываем уведомление
                    Notifications.show(`Вы получили: ${data.item.name}`, 'success');
                    window.auth.updateBalance(data.newBalance);
                }
            } else {
                Notifications.show(data.message || 'Ошибка открытия кейса', 'error');
            }
        } catch (error) {
            console.error('❌ Ошибка открытия кейса:', error);
            Notifications.show('Ошибка открытия кейса', 'error');
        }
    }
}