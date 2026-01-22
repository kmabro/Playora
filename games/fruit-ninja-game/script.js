/**
 * Fruit Ninja Style Arcade Game
 * Vanilla JavaScript Implementation
 */

(() => {
    'use strict';

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        fruits: [
            { emoji: '🍎', color: '#ff4444', points: 10, name: 'apple' },
            { emoji: '🍊', color: '#ff8c00', points: 10, name: 'orange' },
            { emoji: '🍋', color: '#ffdd00', points: 10, name: 'lemon' },
            { emoji: '🍇', color: '#8b5cf6', points: 15, name: 'grape' },
            { emoji: '🍉', color: '#22c55e', points: 20, name: 'watermelon' },
            { emoji: '🍓', color: '#ef4444', points: 15, name: 'strawberry' },
            { emoji: '🥝', color: '#84cc16', points: 15, name: 'kiwi' },
            { emoji: '🍑', color: '#fb923c', points: 15, name: 'peach' },
            { emoji: '🍍', color: '#fbbf24', points: 20, name: 'pineapple' },
            { emoji: '🥭', color: '#f97316', points: 20, name: 'mango' }
        ],
        bomb: { emoji: '💣', color: '#333', name: 'bomb' },
        spawnInterval: { min: 600, max: 1200 },
        bombChance: 0.12,
        gravity: 0.25,
        fruitSize: { min: 40, max: 70 },
        sliceTrailLength: 15,
        comboTimeWindow: 500,
        comboMultiplier: 1.5
    };

    // ==================== GAME STATE ====================
    const state = {
        isRunning: false,
        isPaused: false,
        score: 0,
        bestScore: parseInt(localStorage.getItem('fruitNinjaBest')) || 0,
        fruits: [],
        slicedPieces: [],
        sliceTrail: [],
        isSlicing: false,
        lastSliceTime: 0,
        comboCount: 0,
        comboTimer: null,
        spawnTimer: null,
        animationId: null
    };

    // ==================== DOM ELEMENTS ====================
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score');
    const finalScoreDisplay = document.getElementById('finalScore');
    const bestScoreDisplay = document.getElementById('bestScore');
    const comboDisplay = document.getElementById('combo-display');
    const startScreen = document.getElementById('startScreen');
    const pauseScreen = document.getElementById('pauseScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const restartBtn = document.getElementById('restartBtn');

    // ==================== UTILITY FUNCTIONS ====================
    const random = (min, max) => Math.random() * (max - min) + min;
    const randomInt = (min, max) => Math.floor(random(min, max + 1));
    const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
    const lerp = (a, b, t) => a + (b - a) * t;

    // Point to line segment distance
    const pointToSegmentDistance = (px, py, x1, y1, x2, y2) => {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) param = dot / lenSq;
        
        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        return distance(px, py, xx, yy);
    };

    // ==================== CANVAS SETUP ====================
    const resizeCanvas = () => {
        canvas.width = window.innerWidth * window.devicePixelRatio;
        canvas.height = window.innerHeight * window.devicePixelRatio;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    // ==================== FRUIT CLASS ====================
    class Fruit {
        constructor(isBomb = false) {
            this.isBomb = isBomb;
            
            if (isBomb) {
                this.data = CONFIG.bomb;
            } else {
                this.data = CONFIG.fruits[randomInt(0, CONFIG.fruits.length - 1)];
            }
            
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            
            // Spawn from bottom, random horizontal position
            this.size = random(CONFIG.fruitSize.min, CONFIG.fruitSize.max);
            this.x = random(this.size, screenWidth - this.size);
            this.y = screenHeight + this.size;
            
            // Calculate velocity for arc trajectory
            const targetX = random(screenWidth * 0.2, screenWidth * 0.8);
            const peakY = random(screenHeight * 0.15, screenHeight * 0.4);
            
            // Physics for parabolic motion
            const timeToApex = random(0.8, 1.2);
            this.vy = -Math.sqrt(2 * CONFIG.gravity * (this.y - peakY)) * 0.85;
            this.vx = (targetX - this.x) / (timeToApex * 60);
            
            this.rotation = 0;
            this.rotationSpeed = random(-0.15, 0.15);
            this.sliced = false;
            this.opacity = 1;
        }

        update() {
            this.vy += CONFIG.gravity;
            this.x += this.vx;
            this.y += this.vy;
            this.rotation += this.rotationSpeed;
        }

        draw() {
            if (this.sliced) return;
            
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;
            
            // Draw shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 5;
            
            // Draw fruit/bomb emoji
            ctx.font = `${this.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.data.emoji, 0, 0);
            
            ctx.restore();
        }

        isOffScreen() {
            return this.y > window.innerHeight + this.size * 2;
        }

        checkSlice(trail) {
            if (this.sliced || trail.length < 2) return false;
            
            // Check collision with recent trail segments
            for (let i = trail.length - 1; i > Math.max(0, trail.length - 5); i--) {
                const p1 = trail[i];
                const p2 = trail[i - 1];
                const dist = pointToSegmentDistance(this.x, this.y, p1.x, p1.y, p2.x, p2.y);
                
                if (dist < this.size * 0.6) {
                    return true;
                }
            }
            return false;
        }
    }

    // ==================== SLICED PIECE CLASS ====================
    class SlicedPiece {
        constructor(x, y, emoji, size, direction) {
            this.x = x;
            this.y = y;
            this.emoji = emoji;
            this.size = size;
            this.vx = direction * random(2, 5);
            this.vy = random(-3, -1);
            this.rotation = 0;
            this.rotationSpeed = direction * random(0.1, 0.3);
            this.opacity = 1;
            this.scale = 1;
        }

        update() {
            this.vy += CONFIG.gravity * 0.8;
            this.x += this.vx;
            this.y += this.vy;
            this.rotation += this.rotationSpeed;
            this.opacity -= 0.02;
            this.scale -= 0.01;
        }

        draw() {
            if (this.opacity <= 0) return;
            
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.scale(this.scale, this.scale);
            ctx.globalAlpha = Math.max(0, this.opacity);
            
            ctx.font = `${this.size * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, 0, 0);
            
            ctx.restore();
        }

        isDead() {
            return this.opacity <= 0 || this.y > window.innerHeight + 100;
        }
    }

    // ==================== PARTICLE SPLASH ====================
    class SplashParticle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = random(3, 8);
            const angle = random(0, Math.PI * 2);
            const speed = random(2, 8);
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.opacity = 1;
            this.life = 1;
        }

        update() {
            this.vy += 0.15;
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.98;
            this.life -= 0.03;
            this.opacity = this.life;
            this.size *= 0.97;
        }

        draw() {
            if (this.opacity <= 0) return;
            
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        isDead() {
            return this.life <= 0;
        }
    }

    let particles = [];

    const createSplash = (x, y, color, count = 15) => {
        for (let i = 0; i < count; i++) {
            particles.push(new SplashParticle(x, y, color));
        }
    };

    // ==================== SLICE TRAIL ====================
    const drawSliceTrail = () => {
        if (state.sliceTrail.length < 2) return;
        
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        for (let i = 1; i < state.sliceTrail.length; i++) {
            const p1 = state.sliceTrail[i - 1];
            const p2 = state.sliceTrail[i];
            const progress = i / state.sliceTrail.length;
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            
            // Gradient effect
            const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${progress * 0.3})`);
            gradient.addColorStop(1, `rgba(255, 255, 255, ${progress * 0.8})`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = progress * 8;
            ctx.stroke();
            
            // Glow effect
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 15;
            ctx.stroke();
        }
        
        ctx.restore();
    };

    // ==================== GAME FUNCTIONS ====================
    const spawnFruit = () => {
        if (!state.isRunning) return;
        
        const isBomb = Math.random() < CONFIG.bombChance;
        state.fruits.push(new Fruit(isBomb));
        
        // Occasionally spawn multiple fruits
        if (Math.random() < 0.3) {
            setTimeout(() => {
                if (state.isRunning) {
                    state.fruits.push(new Fruit(false));
                }
            }, random(100, 300));
        }
        
        // Schedule next spawn
        const interval = random(CONFIG.spawnInterval.min, CONFIG.spawnInterval.max);
        state.spawnTimer = setTimeout(spawnFruit, interval);
    };

    const sliceFruit = (fruit) => {
        fruit.sliced = true;
        
        // Create sliced pieces
        state.slicedPieces.push(new SlicedPiece(fruit.x - 10, fruit.y, fruit.data.emoji, fruit.size, -1));
        state.slicedPieces.push(new SlicedPiece(fruit.x + 10, fruit.y, fruit.data.emoji, fruit.size, 1));
        
        // Create splash particles
        createSplash(fruit.x, fruit.y, fruit.data.color, 20);
        
        // Update score with combo
        const now = Date.now();
        if (now - state.lastSliceTime < CONFIG.comboTimeWindow) {
            state.comboCount++;
        } else {
            state.comboCount = 1;
        }
        state.lastSliceTime = now;
        
        let points = fruit.data.points || 10;
        if (state.comboCount > 1) {
            points = Math.floor(points * (1 + (state.comboCount - 1) * 0.5));
            showCombo(state.comboCount);
        }
        
        state.score += points;
        updateScoreDisplay();
    };

    const showCombo = (count) => {
        const comboText = comboDisplay.querySelector('.combo-text');
        comboText.textContent = `${count}x COMBO!`;
        comboText.classList.remove('show');
        void comboText.offsetWidth; // Trigger reflow
        comboText.classList.add('show');
    };

    const hitBomb = () => {
        state.isRunning = false;
        
        // Create explosion effect
        const bomb = state.fruits.find(f => f.isBomb && f.sliced);
        if (bomb) {
            createSplash(bomb.x, bomb.y, '#ff4444', 30);
            createSplash(bomb.x, bomb.y, '#ffaa00', 25);
            createSplash(bomb.x, bomb.y, '#333', 20);
        }
        
        // Update best score
        if (state.score > state.bestScore) {
            state.bestScore = state.score;
            localStorage.setItem('fruitNinjaBest', state.bestScore.toString());
        }
        
        // Show game over after a short delay
        setTimeout(() => {
            cancelAnimationFrame(state.animationId);
            clearTimeout(state.spawnTimer);
            finalScoreDisplay.textContent = state.score;
            bestScoreDisplay.textContent = state.bestScore;
            gameOverScreen.classList.remove('hidden');
        }, 500);
    };

    const updateScoreDisplay = () => {
        scoreDisplay.textContent = state.score;
        scoreDisplay.style.transform = 'scale(1.2)';
        setTimeout(() => {
            scoreDisplay.style.transform = 'scale(1)';
        }, 100);
    };

    const update = () => {
        // Update fruits
        state.fruits.forEach(fruit => fruit.update());
        
        // Remove off-screen fruits
        state.fruits = state.fruits.filter(fruit => !fruit.isOffScreen());
        
        // Update sliced pieces
        state.slicedPieces.forEach(piece => piece.update());
        state.slicedPieces = state.slicedPieces.filter(piece => !piece.isDead());
        
        // Update particles
        particles.forEach(p => p.update());
        particles = particles.filter(p => !p.isDead());
        
        // Fade out slice trail
        if (!state.isSlicing && state.sliceTrail.length > 0) {
            state.sliceTrail.shift();
        }
        
        // Check for slices
        if (state.isSlicing && state.sliceTrail.length >= 2) {
            state.fruits.forEach(fruit => {
                if (!fruit.sliced && fruit.checkSlice(state.sliceTrail)) {
                    if (fruit.isBomb) {
                        fruit.sliced = true;
                        hitBomb();
                    } else {
                        sliceFruit(fruit);
                    }
                }
            });
        }
    };

    const draw = () => {
        // Clear canvas
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        
        // Draw background gradient overlay
        const bgGradient = ctx.createRadialGradient(
            window.innerWidth / 2, window.innerHeight / 2, 0,
            window.innerWidth / 2, window.innerHeight / 2, window.innerWidth
        );
        bgGradient.addColorStop(0, 'rgba(50, 50, 100, 0.1)');
        bgGradient.addColorStop(1, 'rgba(20, 20, 50, 0.3)');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        
        // Draw particles
        particles.forEach(p => p.draw());
        
        // Draw sliced pieces
        state.slicedPieces.forEach(piece => piece.draw());
        
        // Draw fruits
        state.fruits.forEach(fruit => fruit.draw());
        
        // Draw slice trail
        drawSliceTrail();
    };

    const gameLoop = () => {
        if (!state.isRunning) return;
        
        if (!state.isPaused) {
            update();
            draw();
        }
        
        state.animationId = requestAnimationFrame(gameLoop);
    };

    const startGame = () => {
        // Reset state
        state.isRunning = true;
        state.isPaused = false;
        state.score = 0;
        state.fruits = [];
        state.slicedPieces = [];
        state.sliceTrail = [];
        state.comboCount = 0;
        particles = [];
        
        pauseBtn.disabled = false;
        pauseBtn.classList.remove('paused');
        pauseBtn.textContent = '⏸';
        updateScoreDisplay();
        startScreen.classList.add('hidden');
        pauseScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        
        // Start spawning and game loop
        spawnFruit();
        gameLoop();
    };

    const resetGame = () => {
        cancelAnimationFrame(state.animationId);
        clearTimeout(state.spawnTimer);
        state.isPaused = false;
        startGame();
    };

    const togglePause = () => {
        if (!state.isRunning) return;
        
        state.isPaused = !state.isPaused;
        
        if (state.isPaused) {
            // Pause the game
            cancelAnimationFrame(state.animationId);
            clearTimeout(state.spawnTimer);
            pauseBtn.classList.add('paused');
            pauseBtn.textContent = '▶';
            pauseScreen.classList.remove('hidden');
        } else {
            // Resume the game
            pauseBtn.classList.remove('paused');
            pauseBtn.textContent = '⏸';
            pauseScreen.classList.add('hidden');
            spawnFruit();
            gameLoop();
        }
    };

    // ==================== INPUT HANDLING ====================
    const getInputPosition = (e) => {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    };

    const handleStart = (e) => {
        if (!state.isRunning || state.isPaused) return;
        e.preventDefault();
        
        state.isSlicing = true;
        state.sliceTrail = [];
        
        const pos = getInputPosition(e);
        state.sliceTrail.push({ x: pos.x, y: pos.y, time: Date.now() });
    };

    const handleMove = (e) => {
        if (!state.isRunning || !state.isSlicing || state.isPaused) return;
        e.preventDefault();
        
        const pos = getInputPosition(e);
        state.sliceTrail.push({ x: pos.x, y: pos.y, time: Date.now() });
        
        // Limit trail length
        if (state.sliceTrail.length > CONFIG.sliceTrailLength) {
            state.sliceTrail.shift();
        }
    };

    const handleEnd = (e) => {
        e.preventDefault();
        state.isSlicing = false;
    };

    // ==================== EVENT LISTENERS ====================
    const initEventListeners = () => {
        // Window resize
        window.addEventListener('resize', resizeCanvas);
        
        // Mouse events
        canvas.addEventListener('mousedown', handleStart);
        canvas.addEventListener('mousemove', handleMove);
        canvas.addEventListener('mouseup', handleEnd);
        canvas.addEventListener('mouseleave', handleEnd);
        
        // Touch events
        canvas.addEventListener('touchstart', handleStart, { passive: false });
        canvas.addEventListener('touchmove', handleMove, { passive: false });
        canvas.addEventListener('touchend', handleEnd, { passive: false });
        canvas.addEventListener('touchcancel', handleEnd, { passive: false });
        
        // Prevent context menu
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Button events
        startBtn.addEventListener('click', startGame);
        pauseBtn.addEventListener('click', togglePause);
        resumeBtn.addEventListener('click', togglePause);
        restartBtn.addEventListener('click', resetGame);
        
        // Touch events for buttons
        startBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            startGame();
        });
        pauseBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            togglePause();
        });
        resumeBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            togglePause();
        });
        restartBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            resetGame();
        });
        
        // Visibility change - pause when hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && state.isRunning && !state.isPaused) {
                // Pause spawning when tab is hidden
                clearTimeout(state.spawnTimer);
            } else if (!document.hidden && state.isRunning && !state.isPaused) {
                // Resume spawning when tab is visible
                spawnFruit();
            }
        });
    };

    // ==================== INITIALIZATION ====================
    const init = () => {
        resizeCanvas();
        initEventListeners();
        
        // Display best score
        bestScoreDisplay.textContent = state.bestScore;
        
        // Initial draw
        draw();
    };

    // Start the game when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
