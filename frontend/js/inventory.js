class Inventory {
    constructor() {
        this.items = [];
        this.init();
    }

    async init() {
        await this.loadInventory();
        this.setupEventListeners();
        console.log('Inventory system initialized');
    }

    async loadInventory() {
        try {
            const response = await fetch('/api/inventory', {
                headers: auth.getAuthHeaders()
            });
            
            if (response.ok) {
                this.items = await response.json();
                this.renderInventory();
            } else {
                showNotification('Ошибка загрузки инвентаря', 'error');
            }
        } catch (error) {
            console.error('Error loading inventory:', error);
            showNotification('Ошибка загрузки инвентаря', 'error');
        }
    }

    renderInventory() {
        const grid = document.getElementById('inventoryGrid');
        const itemsCount = document.getElementById('itemsCount');
        
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (itemsCount) {
            itemsCount.textContent = this.items.length;
        }

        if (this.items.length === 0) {
            grid.innerHTML = '<div class="empty-inventory">Инвентарь пуст</div>';
            return;
        }

        this.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.innerHTML = `
                <div class="item-content">
                    <img src="${item.item.image}" alt="${item.item.name}" onerror="this.src='/images/items/default.png'">
                    <h4>${item.item.name}</h4>
                    <p class="item-price">${item.item.price} ₽</p>
                </div>
                <div class="item-actions">
                    <button class="btn-secondary sell-btn" data-id="${item._id}">Продать</button>
                    <button class="btn-primary withdraw-btn" data-id="${item._id}">Вывести</button>
                </div>
            `;
            grid.appendChild(itemElement);
        });

        // Add event listeners
        document.querySelectorAll('.sell-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.sellItem(e.target.dataset.id));
        });

        document.querySelectorAll('.withdraw-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.withdrawItem(e.target.dataset.id));
        });
    }

    async sellItem(itemId) {
        try {
            const response = await fetch(`/api/inventory/sell/${itemId}`, {
                method: 'POST',
                headers: auth.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('Предмет продан', 'success');
                if (auth.user) {
                    auth.user.balance = data.newBalance;
                    auth.updateUI();
                }
                await this.loadInventory();
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('Sell item error:', error);
            showNotification('Ошибка продажи предмета', 'error');
        }
    }

    async withdrawItem(itemId) {
        try {
            const response = await fetch(`/api/inventory/withdraw/${itemId}`, {
                method: 'POST',
                headers: auth.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('Запрос на вывод отправлен', 'success');
                await this.loadInventory();
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('Withdraw item error:', error);
            showNotification('Ошибка вывода предмета', 'error');
        }
    }

    setupEventListeners() {
        const inventoryTab = document.querySelector('[data-tab="inventory"]');
        if (inventoryTab) {
            inventoryTab.addEventListener('click', () => {
                this.loadInventory();
            });
        }
    }
}