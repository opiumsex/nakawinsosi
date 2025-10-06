class Wheel {
    constructor() {
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.wheel = null;
        this.isSpinning = false;
        this.currentRotation = 0;
        this.hitZone = null;
        this.init();
    }

    async init() {
        console.log('Initializing Wheel...');
        await this.loadWheel();
        this.setupEventListeners();
        this.setupHitZone();
        
        // Сохраняем инстанс глобально
        window.wheelInstance = this;
    }

    setupHitZone() {
        this.hitZone = document.getElementById('hitZoneWheel');
        if (!this.hitZone) {
            console.error('Hit zone for wheel not found');
        }
    }

    async loadWheel() {
        try {
            console.log('Loading wheel data...');
            const response = await fetch('/api/wheel');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.wheel = await response.json();
            console.log('Wheel loaded:', this.wheel);
            
            if (this.wheel && this.wheel.segments) {
                console.log(`Wheel has ${this.wheel.segments.length} segments`);
                this.drawWheel();
                
                const wheelCostElement = document.getElementById('wheelCost');
                if (wheelCostElement) {
                    wheelCostElement.textContent = this.wheel.spinCost || 250;
                }
            } else {
                console.error('Wheel data is invalid:', this.wheel);
                showNotification('Ошибка: данные колеса не загружены', 'error');
            }
            
        } catch (error) {
            console.error('Error loading wheel:', error);
            showNotification('Ошибка загрузки колеса фортуны', 'error');
        }
    }

    drawWheel() {
        if (!this.wheel || !this.wheel.segments || this.wheel.segments.length === 0) {
            console.error('Cannot draw wheel: no segments data');
            this.createDefaultWheel();
            return;
        }

        const segments = this.wheel.segments;
        const totalChance = segments.reduce((sum, seg) => sum + seg.dropChance, 0);
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let startAngle = 0;

        segments.forEach((segment, index) => {
            const sliceAngle = (segment.dropChance / totalChance) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;

            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();
            
            this.ctx.fillStyle = segment.color || this.getSegmentColor(index);
            this.ctx.fill();
            this.ctx.strokeStyle = 'gold';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(startAngle + sliceAngle / 2);
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 12px Arial';
            
            let displayText = segment.name;
            if (displayText.length > 10) {
                displayText = displayText.substring(0, 8) + '...';
            }
            
            this.ctx.fillText(displayText, radius - 15, 0);
            this.ctx.restore();

            startAngle = endAngle;
        });

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
        this.ctx.fillStyle = 'gold';
        this.ctx.fill();
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('GO', centerX, centerY);
        
        console.log('Wheel drawn successfully');
    }

    createDefaultWheel() {
        console.log('Creating default wheel visualization');
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fill();
        this.ctx.strokeStyle = 'gold';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        this.ctx.fillStyle = '#ff4444';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('No Data', centerX, centerY);
    }

    getSegmentColor(index) {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
            '#FFA07A', '#20B2AA'
        ];
        return colors[index % colors.length];
    }

    async spinWheel() {
        if (this.isSpinning) {
            console.log('Wheel is already spinning');
            return;
        }

        if (!this.wheel) {
            console.error('Cannot spin: wheel data not loaded');
            showNotification('Ошибка: данные колеса не загружены', 'error');
            return;
        }

        this.isSpinning = true;
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) {
            spinBtn.disabled = true;
            spinBtn.textContent = '...';
        }

        try {
            console.log('Sending spin request...');
            
            const response = await fetch('/api/wheel/spin', {
                method: 'POST',
                headers: auth.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Spin successful:', data);

            this.animateSpin(data);

        } catch (error) {
            console.error('Spin error:', error);
            showNotification(error.message || 'Ошибка вращения колеса', 'error');
            this.resetSpinButton();
        }
    }

    animateSpin(data) {
        if (!this.wheel || !this.wheel.segments) {
            console.error('Cannot animate: wheel segments not available');
            this.resetSpinButton();
            return;
        }

        const wheel = this.canvas;
        const segments = this.wheel.segments;
        const spinDuration = 7000;
        const startTime = Date.now();
        
        const segmentAngle = 360 / segments.length;
        const targetSegmentIndex = data.segmentIndex;
        
        const wonSegmentCenterAngle = targetSegmentIndex * segmentAngle + segmentAngle / 2;
        const rotationNeeded = -90 - wonSegmentCenterAngle;
        
        const fullRotations = 5;
        const targetRotation = this.currentRotation + fullRotations * 360 + rotationNeeded;

        console.log(`Animation: segment ${targetSegmentIndex} (${segments[targetSegmentIndex].name})`);

        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / spinDuration, 1);
            
            let easedProgress;
            if (progress < 0.3) {
                easedProgress = this.easeInQuart(progress * (1/0.3)) * 0.3;
            } else if (progress < 0.8) {
                easedProgress = 0.3 + (progress - 0.3) * 0.5;
            } else {
                const decelProgress = (progress - 0.8) / 0.2;
                easedProgress = 0.8 + this.easeOutElastic(decelProgress) * 0.2;
            }
            
            const rotation = this.currentRotation + (targetRotation - this.currentRotation) * easedProgress;
            
            wheel.style.transform = `rotate(${rotation}deg)`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // ФИКС: Запрещаем дальнейшее вращение
                wheel.style.transform = `rotate(${targetRotation}deg)`;
                this.currentRotation = targetRotation % 360;
                
                this.highlightWonSegment(targetSegmentIndex);
                
                setTimeout(() => {
                    this.showWheelWinModal(data);
                    this.resetSpinButton();
                }, 1500);
            }
        };

        animate();
    }

    highlightWonSegment(segmentIndex) {
        this.drawWheel();
        
        const segments = this.wheel.segments;
        const totalChance = segments.reduce((sum, seg) => sum + seg.dropChance, 0);
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        let startAngle = 0;
        for (let i = 0; i < segmentIndex; i++) {
            startAngle += (segments[i].dropChance / totalChance) * 2 * Math.PI;
        }
        
        const sliceAngle = (segments[segmentIndex].dropChance / totalChance) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        this.ctx.fill();
        this.ctx.restore();
    }

    easeInQuart(t) {
        return t * t * t * t;
    }

    easeOutElastic(t) {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }

    resetSpinButton() {
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) {
            spinBtn.disabled = false;
            spinBtn.textContent = 'GO';
        }
        this.isSpinning = false;
    }

    showWheelWinModal(data) {
        const winImage = document.getElementById('winImage');
        const winName = document.getElementById('winName');
        const winPrice = document.getElementById('winPrice');
        
        if (winImage && winName && winPrice && data.wonSegment) {
            winImage.src = data.wonSegment.image || '/images/items/default.png';
            winImage.onerror = function() { this.src = '/images/items/default.png'; };
            winName.textContent = data.wonSegment.name;
            winPrice.textContent = data.wonSegment.price;
        }
        
        if (auth.user && data.newBalance !== undefined) {
            auth.user.balance = data.newBalance;
            auth.updateUI();
        }

        // Настраиваем кнопки для рулетки
        const sellBtn = document.getElementById('sellBtn');
        const keepBtn = document.getElementById('keepBtn');
        
        if (sellBtn) {
            sellBtn.onclick = () => {
                closeModal('winModal');
                if (data.wonSegment.price > 0 && !data.wonSegment.name.includes('₽')) {
                    showNotification('Предмет добавлен в инвентарь', 'success');
                    if (window.inventoryInstance) {
                        window.inventoryInstance.loadInventory();
                    }
                } else if (data.wonSegment.price > 0) {
                    showNotification(`Получено ${data.wonSegment.price} ₽`, 'success');
                }
            };
        }
        
        if (keepBtn) {
            keepBtn.onclick = () => {
                closeModal('winModal');
                if (data.wonSegment.price > 0 && !data.wonSegment.name.includes('₽')) {
                    showNotification('Предмет добавлен в инвентарь', 'success');
                }
            };
        }

        showModal('winModal');
    }

    setupEventListeners() {
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) {
            spinBtn.addEventListener('click', () => this.spinWheel());
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Wheel();
});