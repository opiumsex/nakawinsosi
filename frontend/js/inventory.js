class Inventory {
    static init() {
        this.loadInventory();
    }

    static async loadInventory() {
        try {
            const response = await fetch('/api/inventory', {
                headers: {
                    'Authorization': `Bearer ${auth.token}`
                }
            });
            
            const inventory = await response.json();
            this.renderInventory(inventory);
        } catch (error) {
            console.error('Error loading inventory:', error);
        }
    }

    static renderInventory(inventory) {
        const container = document.getElementById('inventoryContainer');
        
        if (inventory.length === 0) {
            container.innerHTML = '<p>Инвентарь пуст</p>';
            return;
        }

        container.innerHTML = inventory.map(item => `
            <div class="inventory-item" data-item-id="${item._id}">
                <img src="${item.itemImage}" alt="${item.itemName}">
                <h4>${item.itemName}</h4>
                <p>Стоимость: ${item.itemValue} монет</p>
                <div class="item-actions">
                    <button class="btn-glow sell-item">Продать</button>
                    <button class="btn-glow withdraw-item">Вывести</button>
                </div>
            </div>
        `).join('');

        this.setupItemEventListeners();
    }

    static setupItemEventListeners() {
        document.querySelectorAll('.sell-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemElement = e.target.closest('.inventory-item');
                this.sellItem(itemElement.dataset.itemId);
            });
        });

        document.querySelectorAll('.withdraw-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemElement = e.target.closest('.inventory-item');
                this.withdrawItem(itemElement.dataset.itemId);
            });
        });
    }

    static async sellItem(itemId) {
        try {
            const response = await fetch(`/api/inventory/sell/${itemId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                auth.updateBalance(data.newBalance);
                this.loadInventory();
                Notifications.show('Предмет продан', 'success');
            } else {
                Notifications.show(data.message, 'error');
            }
        } catch (error) {
            Notifications.show('Ошибка продажи предмета', 'error');
        }
    }

    static async withdrawItem(itemId) {
        if (!confirm('Вы уверены, что хотите вывести этот предмет?')) return;

        try {
            const response = await fetch(`/api/inventory/withdraw/${itemId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.loadInventory();
                console.log(`Игрок ${auth.user.username} запросил вывод предмета: ${data.itemName}`);
                Notifications.show('Запрос на вывод отправлен', 'success');
            } else {
                Notifications.show(data.message, 'error');
            }
        } catch (error) {
            Notifications.show('Ошибка вывода предмета', 'error');
        }
    }
}