class Inventory {
    constructor() {
        this.items = [];
        this.selectedItem = null;
        this.init();
    }

    async init() {
        await this.loadInventory();
        this.setupEventListeners();
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
        
        grid.innerHTML = '';
        itemsCount.textContent = this.items.length;

        if (this.items.length === 0) {
            grid.innerHTML = '<div class="empty-inventory">Инвентарь пуст</div>';
            return;
        }

        this.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.setAttribute('data-item-id', item._id);
            itemElement.innerHTML = `
                <div class="item-content">
                    <img src="${item.item.image}" alt="${item.item.name}" onerror="this.src='/images/items/default.png'">
                    <h4>${item.item.name}</h4>
                    <p class="item-price">${item.item.price} ₽</p>
                </div>
                <div class="item-actions">
                    <button class="btn-secondary sell-btn" onclick="inventory.sellItem('${item._id}')">Продать</button>
                    <button class="btn-primary withdraw-btn" onclick="inventory.withdrawItem('${item._id}')">Вывести</button>
                </div>
            `;
            grid.appendChild(itemElement);
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
                
                console.log(`=== WITHDRAWAL REQUEST ===`);
                console.log(`User: ${auth.user.username}`);
                console.log(`Item: ${this.items.find(item => item._id === itemId)?.item.name}`);
                console.log(`Timestamp: ${new Date().toISOString()}`);
                console.log(`========================`);
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('Withdraw item error:', error);
            showNotification('Ошибка вывода предмета', 'error');
        }
    }

    setupEventListeners() {
        document.querySelector('[data-tab="inventory"]').addEventListener('click', () => {
            this.loadInventory();
        });
    }
}

const inventory = new Inventory();