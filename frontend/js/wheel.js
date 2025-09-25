class Wheel {
    static init() {
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isSpinning = false;
        this.segments = [];
        
        this.loadWheel();
        this.setupEventListeners();
    }

    static async loadWheel() {
        try {
            const response = await fetch('/api/wheel');
            const wheelData = await response.json();
            this.segments = wheelData.segments;
            this.drawWheel();
        } catch (error) {
            console.error('Error loading wheel:', error);
        }
    }

    static drawWheel() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        
        let startAngle = 0;
        const totalChance = this.segments.reduce((sum, seg) => sum + seg.chance, 0);

        this.segments.forEach((segment, index) => {
            const segmentAngle = (segment.chance / totalChance) * 2 * Math.PI;
            const endAngle = startAngle + segmentAngle;

            // Draw segment
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();
            
            this.ctx.fillStyle = segment.color || this.getSegmentColor(index);
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Draw text
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(startAngle + segmentAngle / 2);
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = '#000';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(segment.name, radius - 20, 10);
            this.ctx.restore();

            startAngle = endAngle;
        });
    }

    static getSegmentColor(index) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        return colors[index % colors.length];
    }

    static setupEventListeners() {
        document.getElementById('spinBtn').addEventListener('click', () => this.spin());
    }

    static async spin() {
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        const spinBtn = document.getElementById('spinBtn');
        spinBtn.disabled = true;

        try {
            const response = await fetch('/api/wheel/spin', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.animateSpin(data.winningSegment);
            } else {
                Notifications.show(data.message, 'error');
                this.isSpinning = false;
                spinBtn.disabled = false;
            }
        } catch (error) {
            Notifications.show('Ошибка вращения колеса', 'error');
            this.isSpinning = false;
            spinBtn.disabled = false;
        }
    }

    static animateSpin(winningSegment) {
        const spinDuration = 7000; // 7 seconds
        const startTime = Date.now();
        const rotations = 5; // Full rotations
        
        const spin = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / spinDuration, 1);
            
            // Easing function for smooth slowdown
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const angle = easeOut * rotations * 2 * Math.PI;
            
            this.canvas.style.transform = `rotate(${angle}rad)`;
            
            if (progress < 1) {
                requestAnimationFrame(spin);
            } else {
                this.onSpinComplete(winningSegment);
            }
        };
        
        spin();
    }

    static onSpinComplete(segment) {
        this.isSpinning = false;
        document.getElementById('spinBtn').disabled = false;
        this.canvas.style.transform = 'rotate(0rad)';
        
        Cases.showPrize(segment);
    }
}