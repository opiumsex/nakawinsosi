class Cases {
    constructor() {
        this.cases = [];
        this.currentCase = null;
        this.isOpening = false;
        this.scrollAnimationId = null;
        this.hitZone = null;
        this.init();
    }

    async init() {
        await this.loadCases();
        this.setupEventListeners();
        this.setupHitZone();
        
        // Сохраняем инстанс глобально для переинициализации
        window.casesInstance = this;
    }

    setupHitZone() {
        this.hitZone = document.getElementById('hitZoneCase');
        if (!this.hitZone) {
            console.error('Hit zone for cases not found');
        }
    }

    async loadCases() {
        try {
            console.log('Loading cases...');
            const response = await fetch('/api/cases');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.cases = await response.json();
            console.log('Cases loaded:', this.cases);
            
            this.renderCases();
            
        } catch (error) {
            console.error('Error loading cases:', error);
            showNotification('Ошибка загрузки кейсов', 'error');
        }
    }

    renderCases() {
        const grid = document.getElementById('casesGrid');
        
        if (!grid) {
            console.error('Cases grid element not found');
            return;
        }
        
        grid.innerHTML = '';

        this.cases.forEach((caseItem) => {
            const caseElement = document.createElement('div');
            caseElement.className = 'case-item';
            caseElement.innerHTML = `
                <img src="${caseItem.image}" 
                     alt="${caseItem.name}" 
                     class="case-image"
                     onerror="this.src='/images/cases/default.png'">
                <h3>${caseItem.name}</h3>
                <p>${caseItem.price} ₽</p>
            `;
            
            caseElement.addEventListener('click', () => {
                console.log('Case clicked:', caseItem.name);
                this.openCaseModal(caseItem);
            });
            
            grid.appendChild(caseElement);
        });
    }

    openCaseModal(caseItem) {
        if (this.isOpening) {
            showNotification('Дождитесь окончания открытия текущего кейса', 'warning');
            return;
        }
        
        this.resetCaseModal();
        this.currentCase = caseItem;
        
        const itemsScroll = document.getElementById('itemsScroll');
        const casePrice = document.getElementById('casePrice');
        const caseOpeningTitle = document.getElementById('caseOpeningTitle');

        if (!itemsScroll || !casePrice || !caseOpeningTitle) {
            console.error('Case modal elements not found');
            return;
        }

        // Clear previous items
        itemsScroll.innerHTML = '';
        
        // Create extended items array for smooth scrolling
        const extendedItems = [];
        const copies = 10;
        
        for (let i = 0; i < copies; i++) {
            const shuffled = [...caseItem.items].sort(() => Math.random() - 0.5);
            extendedItems.push(...shuffled);
        }

        extendedItems.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'scroll-item';
            itemElement.setAttribute('data-item-id', item._id || `item-${index}`);
            itemElement.setAttribute('data-item-name', item.name);
            itemElement.innerHTML = `
                <img src="${item.image}" 
                     alt="${item.name}"
                     onerror="this.src='/images/items/default.png'">
                <p>${item.name}</p>
                <small>${item.price} ₽</small>
            `;
            itemsScroll.appendChild(itemElement);
        });

        casePrice.textContent = caseItem.price;
        caseOpeningTitle.textContent = `Открытие: ${caseItem.name}`;
        
        showModal('caseModal');
    }

    async openCase() {
        if (this.isOpening) return;
        
        if (!this.currentCase) {
            showNotification('Ошибка: кейс не выбран', 'error');
            return;
        }

        const openBtn = document.getElementById('openCaseBtn');
        if (!openBtn) return;

        openBtn.disabled = true;
        openBtn.textContent = 'Открывается...';
        this.isOpening = true;

        try {
            console.log('Opening case:', this.currentCase._id);
            
            const response = await fetch(`/api/cases/open/${this.currentCase._id}`, {
                method: 'POST',
                headers: auth.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Case opened successfully:', data);

            this.animateCaseOpening(data);

        } catch (error) {
            console.error('Open case error:', error);
            showNotification(error.message || 'Ошибка открытия кейса', 'error');
            this.resetOpenButton();
        }
    }

    animateCaseOpening(data) {
        const itemsScroll = document.getElementById('itemsScroll');
        if (!itemsScroll) {
            this.showWinModal(data);
            this.resetOpenButton();
            return;
        }

        const scrollDuration = 7000;
        const startTime = Date.now();
        const startScroll = itemsScroll.scrollLeft;
        
        // Находим элемент для анимации
        const allItems = itemsScroll.querySelectorAll('.scroll-item');
        let targetItem = null;

        // Ищем элемент который будет в зоне попадания после прокрутки
        for (let i = 0; i < allItems.length; i++) {
            const item = allItems[i];
            const itemName = item.getAttribute('data-item-name');
            if (itemName === data.wonItem.name) {
                targetItem = item;
                break;
            }
        }

        if (!targetItem) {
            console.error('Could not find won item in scroll');
            this.showWinModal(data);
            this.resetOpenButton();
            return;
        }

        // Рассчитываем позицию для прокрутки
        const itemRect = targetItem.getBoundingClientRect();
        const containerRect = itemsScroll.getBoundingClientRect();
        const hitZoneRect = this.hitZone.getBoundingClientRect();
        
        const targetScroll = itemsScroll.scrollLeft + (itemRect.left - containerRect.left) - (hitZoneRect.width / 2) + (itemRect.width / 2);

        console.log(`Animating to won item: ${data.wonItem.name}`);

        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / scrollDuration, 1);
            
            let easedProgress;
            if (progress < 0.6) {
                easedProgress = this.easeInQuart(progress * (1/0.6)) * 0.6;
            } else if (progress < 0.9) {
                const midProgress = (progress - 0.6) / 0.3;
                easedProgress = 0.6 + this.easeOutCubic(midProgress) * 0.3;
            } else {
                const finalProgress = (progress - 0.9) / 0.1;
                easedProgress = 0.9 + this.easeOutElastic(finalProgress) * 0.1;
            }
            
            const currentScroll = startScroll + (targetScroll - startScroll) * easedProgress;
            itemsScroll.scrollLeft = currentScroll;

            if (progress < 1) {
                this.scrollAnimationId = requestAnimationFrame(animate);
            } else {
                // ФИКС: Запрещаем дальнейшую прокрутку
                itemsScroll.style.overflow = 'hidden';
                itemsScroll.scrollLeft = targetScroll;
                
                // Подсвечиваем выигрышный предмет
                this.highlightWonItem(targetItem);
                
                setTimeout(() => {
                    this.showWinModal(data);
                    this.resetOpenButton();
                }, 1000);
            }
        };

        animate();
    }

    highlightWonItem(itemElement) {
        itemElement.style.transform = 'scale(1.2)';
        itemElement.style.boxShadow = '0 0 30px gold';
        itemElement.style.zIndex = '10';
        itemElement.style.transition = 'all 0.5s ease';
        
        // Добавляем анимацию пульсации
        itemElement.style.animation = 'pulse 1s infinite';
    }

    easeInQuart(t) {
        return t * t * t * t;
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    easeOutElastic(t) {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }

    resetOpenButton() {
        const openBtn = document.getElementById('openCaseBtn');
        if (openBtn && this.currentCase) {
            openBtn.disabled = false;
            openBtn.textContent = `Открыть за ${this.currentCase.price} ₽`;
        }
        this.isOpening = false;
        
        if (this.scrollAnimationId) {
            cancelAnimationFrame(this.scrollAnimationId);
            this.scrollAnimationId = null;
        }
    }

    resetCaseModal() {
        const itemsScroll = document.getElementById('itemsScroll');
        if (itemsScroll) {
            itemsScroll.scrollLeft = 0;
            itemsScroll.style.filter = 'none';
            itemsScroll.style.overflow = 'auto'; // Восстанавливаем прокрутку
            itemsScroll.style.animation = 'none';
            
            // Сбрасываем все стили предметов
            const allItems = itemsScroll.querySelectorAll('.scroll-item');
            allItems.forEach(item => {
                item.style.transform = '';
                item.style.boxShadow = '';
                item.style.zIndex = '';
                item.style.animation = '';
            });
        }
        this.resetOpenButton();
        this.currentCase = null;
    }

    showWinModal(data) {
        closeModal('caseModal');
        
        const winImage = document.getElementById('winImage');
        const winName = document.getElementById('winName');
        const winPrice = document.getElementById('winPrice');
        
        if (winImage && winName && winPrice) {
            winImage.src = data.wonItem.image || '/images/items/default.png';
            winImage.onerror = function() { this.src = '/images/items/default.png'; };
            winName.textContent = data.wonItem.name;
            winPrice.textContent = data.wonItem.price;
        }
        
        // Обновляем баланс
        if (auth.user) {
            auth.user.balance = data.newBalance;
            auth.updateUI();
        }

        // Настраиваем кнопки
        const sellBtn = document.getElementById('sellBtn');
        const keepBtn = document.getElementById('keepBtn');
        
        if (sellBtn) {
            sellBtn.onclick = () => {
                closeModal('winModal');
                showNotification('Предмет добавлен в инвентарь', 'success');
                // Перезагружаем инвентарь если он открыт
                if (window.inventoryInstance) {
                    window.inventoryInstance.loadInventory();
                }
            };
        }
        
        if (keepBtn) {
            keepBtn.onclick = () => {
                closeModal('winModal');
                showNotification('Предмет добавлен в инвентарь', 'success');
            };
        }

        showModal('winModal');
    }

    setupEventListeners() {
        document.getElementById('openCaseBtn').addEventListener('click', () => this.openCase());
        
        // Сбрасываем модалку при закрытии
        document.querySelector('#caseModal .close-btn').addEventListener('click', () => {
            if (!this.isOpening) {
                this.resetCaseModal();
                closeModal('caseModal');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Cases();
});