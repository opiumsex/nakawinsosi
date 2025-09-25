// Admin panel for managing cases and wheel (accessible via console or secret URL)
class AdminPanel {
    static init() {
        // Add admin panel to page (hidden by default)
        this.createAdminPanel();
    }

    static createAdminPanel() {
        const adminHTML = `
        <div id="adminPanel" class="modal hidden">
            <div class="modal-content" style="max-width: 800px;">
                <h3>Панель администратора Nakawin</h3>
                
                <div class="admin-tabs">
                    <button class="tab-btn active" data-tab="cases-admin">Кейсы</button>
                    <button class="tab-btn" data-tab="wheel-admin">Колесо</button>
                </div>

                <div id="cases-admin" class="tab-content active">
                    <h4>Управление кейсами</h4>
                    <div id="casesList"></div>
                    <button class="btn-glow" onclick="AdminPanel.showAddCaseForm()">Добавить кейс</button>
                    
                    <div id="addCaseForm" class="hidden">
                        <input type="text" id="caseName" placeholder="Название кейса">
                        <input type="text" id="caseImage" placeholder="URL изображения">
                        <input type="number" id="casePrice" placeholder="Цена">
                        <div id="caseItems">
                            <h5>Предметы в кейсе:</h5>
                        </div>
                        <button class="btn-glow" onclick="AdminPanel.addCaseItem()">Добавить предмет</button>
                        <button class="btn-glow" onclick="AdminPanel.saveCase()">Сохранить кейс</button>
                    </div>
                </div>

                <div id="wheel-admin" class="tab-content">
                    <h4>Управление колесом фортуны</h4>
                    <div id="wheelSegments"></div>
                    <button class="btn-glow" onclick="AdminPanel.addWheelSegment()">Добавить сегмент</button>
                    <button class="btn-glow" onclick="AdminPanel.saveWheel()">Сохранить колесо</button>
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', adminHTML);
        this.setupAdminEventListeners();
    }

    static setupAdminEventListeners() {
        document.addEventListener('keydown', (e) => {
            // Secret key combination to open admin panel: Ctrl+Alt+A
            if (e.ctrlKey && e.altKey && e.key === 'a') {
                this.toggleAdminPanel();
            }
        });
    }

    static toggleAdminPanel() {
        const panel = document.getElementById('adminPanel');
        panel.classList.toggle('hidden');
    }

    static showAddCaseForm() {
        document.getElementById('addCaseForm').classList.remove('hidden');
    }

    static addCaseItem() {
        const itemsContainer = document.getElementById('caseItems');
        const itemHTML = `
        <div class="case-item-form">
            <input type="text" placeholder="Название предмета" class="item-name">
            <input type="text" placeholder="URL изображения" class="item-image">
            <input type="number" placeholder="Стоимость" class="item-value">
            <input type="number" placeholder="Шанс (1-100)" class="item-chance">
            <button class="btn-glow" onclick="this.parentElement.remove()">Удалить</button>
        </div>
        `;
        itemsContainer.insertAdjacentHTML('beforeend', itemHTML);
    }

    static async saveCase() {
        const caseData = {
            name: document.getElementById('caseName').value,
            image: document.getElementById('caseImage').value,
            price: parseInt(document.getElementById('casePrice').value),
            items: []
        };

        document.querySelectorAll('.case-item-form').forEach(form => {
            caseData.items.push({
                name: form.querySelector('.item-name').value,
                image: form.querySelector('.item-image').value,
                value: parseInt(form.querySelector('.item-value').value),
                chance: parseInt(form.querySelector('.item-chance').value)
            });
        });

        try {
            const response = await Admin.addCase(caseData);
            Notifications.show('Кейс успешно добавлен!', 'success');
            document.getElementById('addCaseForm').classList.add('hidden');
        } catch (error) {
            Notifications.show('Ошибка при добавлении кейса', 'error');
        }
    }

    static addWheelSegment() {
        const segmentsContainer = document.getElementById('wheelSegments');
        const segmentHTML = `
        <div class="wheel-segment-form">
            <input type="text" placeholder="Название приза" class="segment-name">
            <input type="text" placeholder="URL изображения" class="segment-image">
            <input type="number" placeholder="Стоимость" class="segment-value">
            <input type="number" placeholder="Шанс (определяет размер)" class="segment-chance">
            <input type="color" class="segment-color" value="#${Math.floor(Math.random()*16777215).toString(16)}">
            <button class="btn-glow" onclick="this.parentElement.remove()">Удалить</button>
        </div>
        `;
        segmentsContainer.insertAdjacentHTML('beforeend', segmentHTML);
    }

    static async saveWheel() {
        const segments = [];
        
        document.querySelectorAll('.wheel-segment-form').forEach(form => {
            segments.push({
                name: form.querySelector('.segment-name').value,
                image: form.querySelector('.segment-image').value,
                value: parseInt(form.querySelector('.segment-value').value),
                chance: parseInt(form.querySelector('.segment-chance').value),
                color: form.querySelector('.segment-color').value
            });
        });

        try {
            const response = await Admin.updateWheel(segments);
            Notifications.show('Колесо успешно обновлено!', 'success');
        } catch (error) {
            Notifications.show('Ошибка при обновлении колеса', 'error');
        }
    }
}