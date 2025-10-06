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
        await this.loadWheel();
        this.setupEventListeners();
        this.setupHitZone();
        console.log('Wheel system initialized');
    }

    setupHitZone() {
        this.hitZone = document.getElementById('hitZoneWheel');
        if (!this.hitZone) {
            console.error('Hit zone for wheel not found');
        }
    }

    async loadWheel() {
        try {
            const response = await fetch('/api/wheel');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.wheel = await response.json();
            
            if (this.wheel && this.wheel.segments) {
                this.drawWheel();
                
                const wheelCostElement = document.getElementById('wheelCost');
                if (wheelCostElement) {
                    wheelCostElement.textContent = this.wheel.spinCost || 250;
                }
            }
            
        } catch (error) {
            console.error('Error loading wheel:', error);
            showNotification('Ошибка загрузки колеса фортуны', 'error');
        }
    }

    drawWheel() {
        if (!this.wheel || !this.wheel.segments) return;

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
        if (this.isSpinning) return;

        if (!this.wheel) {
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
            const response = await fetch('/api/wheel/spin', {
                method: 'POST',
                headers: auth.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.animateSpin(data);

        } catch (error) {
            console.error('Spin error:', error);
            showNotification(error.message || 'Ошибка вращения колеса', 'error');
            this.resetSpinButton();
        }
    }

    animateSpin(data) {
        if (!this.wheel || !this.wheel.segments) {
            this.resetSpinButton();
            return;
        }

        const wheel = this.canvas;
        const segments = this.wheel.segments;
        const spinDuration = 7000;
        const startTime = Date.now();
        
        // Точный расчет конечного вращения с учетом зоны попадания
        const segmentAngle = 360 / segments.length;
        const targetSegmentIndex = data.segmentIndex;
        
        // Угол центра выигрышного сегмента
        const wonSegmentCenterAngle = targetSegmentIndex * segmentAngle + segmentAngle / 2;
        
        // Рассчитываем вращение так чтобы выигрышный сегмент оказался под стрелкой
        // Стрелка находится вверху (-90 градусов)
        // Добавляем небольшое смещение для точного позиционирования в зоне
        const rotationNeeded = -90 - wonSegmentCenterAngle + 2; // +2 градуса для точности
        
        // Добавляем полные обороты для эффекта
        const fullRotations = 5;
        const targetRotation = this.currentRotation + fullRotations * 360 + rotationNeeded;

        console.log(`Wheel animation: segment ${targetSegmentIndex} (${segments[targetSegmentIndex].name})`);
        console.log(`Target rotation: ${targetRotation}°`);

        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / spinDuration, 1);
            
            // Сложная функция easing для реалистичного вращения
            let easedProgress;
            if (progress < 0.3) {
                // Быстрое ускорение
                easedProgress = this.easeInQuart(progress * (1/0.3)) * 0.3;
            } else if (progress < 0.8) {
                // Постоянная скорость
                easedProgress = 0.3 + (progress - 0.3) * 0.5;
            } else {
                // Медленное замедление с bounce эффектом
                const decelProgress = (progress - 0.8) / 0.2;
                easedProgress = 0.8 + this.easeOutElastic(decelProgress) * 0.2;
            }
            
            const rotation = this.currentRotation + (targetRotation - this.currentRotation) * easedProgress;
            
            wheel.style.transform = `rotate(${rotation}deg)`;

            // Визуальные эффекты во время вращения
            if (progress < 0.9) {
                const glowIntensity = 1 + Math.sin(progress * Math.PI * 10) * 0.3;
                wheel.style.filter = `brightness(${glowIntensity}) hue-rotate(${rotation * 0.5}deg)`;
            } else {
                wheel.style.filter = 'brightness(1.2)';
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Анимация завершена - фиксируем позицию
                wheel.style.transform = `rotate(${targetRotation}deg)`;
                this.currentRotation = targetRotation % 360;
                wheel.style.filter = 'none';
                
                // Подсвечиваем выигрышный сегмент
                this.highlightWonSegment(targetSegmentIndex);
                
                setTimeout(() => {
                    this.showWheelWinModal(data);
                    this.resetSpinButton();
                }, 1500);
            }
        };

        animate();
    }

    // Подсветка выигрышного сегмента
    highlightWonSegment(segmentIndex) {
        // Перерисовываем колесо с подсветкой
        this.drawWheel();
        
        const segments = this.wheel.segments;
        const totalChance = segments.reduce((sum, seg) => sum + seg.dropChance, 0);
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        // Вычисляем углы выигрышного сегмента
        let startAngle = 0;
        for (let i = 0; i < segmentIndex; i++) {
            startAngle += (segments[i].dropChance / totalChance) * 2 * Math.PI;
        }
        
        const sliceAngle = (segments[segmentIndex].dropChance / totalChance) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        // Рисуем подсветку поверх сегмента
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
        this.ctx.fill();
        
        // Добавляем обводку
        this.ctx.strokeStyle = 'gold';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        this.ctx.restore();
        
        console.log(`Highlighted segment: ${segments[segmentIndex].name}`);
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