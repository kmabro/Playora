/**
 * Catch the Falling Objects Game
 * A fully responsive arcade game using vanilla JavaScript
 */

(() => {
    'use strict';

    // Game Configuration
    const CONFIG = {
        initialLives: 3,
        baseSpawnInterval: 1500,
        minSpawnInterval: 400,
        baseFallSpeed: 2,
        maxFallSpeed: 12,
        speedIncreaseRate: 0.0005,
        spawnIntervalDecreaseRate: 0.995,
        catcherWidthRatio: 0.25,
        catcherHeightRatio: 0.06,
        objectSizeRatio: 0.08,
        objectTypes: [
            { emoji: '⭐', points: 10, color: '#f1c40f' },
            { emoji: '💎', points: 25, color: '#3498db' },
            { emoji: '🍎', points: 5, color: '#e74c3c' },
            { emoji: '🍊', points: 5, color: '#e67e22' },
            { emoji: '🍋', points: 5, color: '#f39c12' },
            { emoji: '🍇', points: 15, color: '#9b59b6' },
            { emoji: '🎁', points: 50, color: '#e91e63' },
        ],
        badObjects: [
            { emoji: '💀', points: -20, color: '#2c3e50' },
            { emoji: '💣', points: -15, color: '#34495e' },
        ],
        badObjectChance: 0.15,
        bombScoreThreshold: 50,
        maxSpawnDistance: 0.4,
        minObjectSpacing: 50,
    };

    // Game State
    const state = {
        score: 0,
        highScore: 0,
        lives: CONFIG.initialLives,
        isPlaying: false,
        isPaused: false,
        fallSpeed: CONFIG.baseFallSpeed,
        spawnInterval: CONFIG.baseSpawnInterval,
        lastSpawnTime: 0,
        lastSpawnX: null,
        animationId: null,
        objects: [],
        catcher: {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            targetX: 0,
        },
    };

    // DOM Elements
    const elements = {
        canvas: document.getElementById('gameCanvas'),
        ctx: null,
        scoreDisplay: document.getElementById('score'),
        highScoreDisplay: document.getElementById('highScore'),
        livesDisplay: document.getElementById('lives'),
        overlay: document.getElementById('gameOverlay'),
        overlayTitle: document.getElementById('overlayTitle'),
        overlayMessage: document.getElementById('overlayMessage'),
        finalScore: document.getElementById('finalScore'),
        bestScore: document.getElementById('bestScore'),
        startBtn: document.getElementById('startBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        gameArea: document.querySelector('.game-area'),
    };

    // Initialize canvas context
    elements.ctx = elements.canvas.getContext('2d');

    // Utility Functions
    const utils = {
        random: (min, max) => Math.random() * (max - min) + min,
        randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
        lerp: (start, end, factor) => start + (end - start) * factor,
    };

    // Resize Handler
    function resizeCanvas() {
        const rect = elements.gameArea.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        elements.canvas.width = rect.width * dpr;
        elements.canvas.height = rect.height * dpr;
        
        elements.ctx.scale(dpr, dpr);
        
        // Store display dimensions
        elements.canvas.displayWidth = rect.width;
        elements.canvas.displayHeight = rect.height;
        
        // Update catcher dimensions
        updateCatcherDimensions();
    }

    function updateCatcherDimensions() {
        const width = elements.canvas.displayWidth;
        const height = elements.canvas.displayHeight;
        
        // Make catcher larger and more visible on mobile
        // Use larger minimums for better mobile visibility
        state.catcher.width = Math.max(120, width * CONFIG.catcherWidthRatio);
        state.catcher.height = Math.max(35, height * CONFIG.catcherHeightRatio);
        state.catcher.y = height - state.catcher.height - 30;
        
        // Clamp catcher position
        state.catcher.x = utils.clamp(
            state.catcher.x,
            0,
            width - state.catcher.width
        );
        state.catcher.targetX = state.catcher.x;
    }

    // Game Object Class
    class FallingObject {
        constructor(forcedX = null) {
            // Only spawn bombs after score threshold is reached
            const canSpawnBomb = state.score >= CONFIG.bombScoreThreshold;
            const isBad = canSpawnBomb && Math.random() < CONFIG.badObjectChance;
            const typeArray = isBad ? CONFIG.badObjects : CONFIG.objectTypes;
            const type = typeArray[utils.randomInt(0, typeArray.length - 1)];
            
            const size = Math.max(30, elements.canvas.displayWidth * CONFIG.objectSizeRatio);
            const canvasWidth = elements.canvas.displayWidth;
            
            // Smart spawning: spawn within reachable distance from catcher or last spawn
            let spawnX;
            if (forcedX !== null) {
                spawnX = forcedX;
            } else {
                const maxDistance = canvasWidth * CONFIG.maxSpawnDistance;
                const catcherCenterX = state.catcher.x + state.catcher.width / 2;
                const referenceX = state.lastSpawnX !== null ? state.lastSpawnX : catcherCenterX;
                
                const minX = Math.max(size, referenceX - maxDistance);
                const maxX = Math.min(canvasWidth - size, referenceX + maxDistance);
                
                spawnX = utils.random(minX, maxX);
            }
            
            this.x = spawnX;
            this.y = -size;
            this.size = size;
            this.emoji = type.emoji;
            this.points = type.points;
            this.color = type.color;
            this.isBad = isBad;
            this.speed = state.fallSpeed * utils.random(0.9, 1.1);
            this.rotation = 0;
            this.rotationSpeed = utils.random(-0.03, 0.03);
            this.wobble = utils.random(0, Math.PI * 2);
            this.wobbleSpeed = utils.random(0.01, 0.03);
            this.wobbleAmount = utils.random(0.3, 1);
        }

        update(deltaTime) {
            this.y += this.speed * (deltaTime / 16);
            this.rotation += this.rotationSpeed;
            this.wobble += this.wobbleSpeed;
            this.x += Math.sin(this.wobble) * this.wobbleAmount;
            
            // Keep within bounds
            this.x = utils.clamp(this.x, this.size / 2, elements.canvas.displayWidth - this.size / 2);
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            
            // Draw glow effect
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;
            
            // Draw emoji
            ctx.font = `${this.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, 0, 0);
            
            ctx.restore();
        }

        isOffScreen() {
            return this.y > elements.canvas.displayHeight + this.size;
        }

        collidesWith(catcher) {
            const objectLeft = this.x - this.size / 2;
            const objectRight = this.x + this.size / 2;
            const objectBottom = this.y + this.size / 2;
            const objectTop = this.y - this.size / 2;
            
            return (
                objectRight > catcher.x &&
                objectLeft < catcher.x + catcher.width &&
                objectBottom > catcher.y &&
                objectTop < catcher.y + catcher.height
            );
        }
    }

    // Drawing Functions
    function drawCatcher() {
        const ctx = elements.ctx;
        const { x, y, width, height } = state.catcher;
        
        // Smooth movement
        state.catcher.x = utils.lerp(state.catcher.x, state.catcher.targetX, 0.2);
        
        ctx.save();
        
        // Draw outer glow
        ctx.shadowColor = '#4a90d9';
        ctx.shadowBlur = 30;
        
        // Draw catcher body with gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, '#5ba3ec');
        gradient.addColorStop(0.5, '#4a90d9');
        gradient.addColorStop(1, '#357abd');
        
        ctx.fillStyle = gradient;
        
        // Rounded rectangle
        const radius = height / 2;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
        
        // Draw border for better visibility
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw handle indicator line
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        const handleWidth = Math.min(40, width * 0.3);
        ctx.fillRect(x + width / 2 - handleWidth / 2, y + height * 0.2, handleWidth, height * 0.2);
        
        ctx.restore();
    }

    function drawBackground() {
        const ctx = elements.ctx;
        const width = elements.canvas.displayWidth;
        const height = elements.canvas.displayHeight;
        
        // Stars background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 50; i++) {
            const starX = (i * 73) % width;
            const starY = (i * 47 + Date.now() * 0.01) % height;
            const size = (i % 3) + 1;
            ctx.beginPath();
            ctx.arc(starX, starY, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function clearCanvas() {
        const ctx = elements.ctx;
        ctx.clearRect(0, 0, elements.canvas.displayWidth, elements.canvas.displayHeight);
    }

    // Score Popup Effect
    function showScorePopup(x, y, points) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = points > 0 ? `+${points}` : points;
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        popup.style.color = points > 0 ? '#2ecc71' : '#e74c3c';
        popup.style.fontSize = 'clamp(1rem, 3vw, 1.5rem)';
        
        elements.gameArea.appendChild(popup);
        
        setTimeout(() => popup.remove(), 800);
    }

    // Game Logic
    function checkOverlap(newX, newSize) {
        const minSpacing = CONFIG.minObjectSpacing;
        for (const obj of state.objects) {
            // Check if objects are close in Y (both near top) and would overlap in X
            if (obj.y < newSize * 2) {
                const distance = Math.abs(obj.x - newX);
                if (distance < (obj.size + newSize) / 2 + minSpacing) {
                    return true;
                }
            }
        }
        return false;
    }

    function spawnObject() {
        const canvasWidth = elements.canvas.displayWidth;
        const size = Math.max(30, canvasWidth * CONFIG.objectSizeRatio);
        const maxDistance = canvasWidth * CONFIG.maxSpawnDistance;
        const catcherCenterX = state.catcher.x + state.catcher.width / 2;
        const referenceX = state.lastSpawnX !== null ? state.lastSpawnX : catcherCenterX;
        
        // Try to find a non-overlapping position
        let attempts = 0;
        let spawnX;
        do {
            const minX = Math.max(size, referenceX - maxDistance);
            const maxX = Math.min(canvasWidth - size, referenceX + maxDistance);
            spawnX = utils.random(minX, maxX);
            attempts++;
        } while (checkOverlap(spawnX, size) && attempts < 10);
        
        const newObject = new FallingObject(spawnX);
        state.objects.push(newObject);
        state.lastSpawnX = spawnX;
    }

    function updateObjects(deltaTime) {
        const currentTime = Date.now();
        
        // Spawn new objects
        if (currentTime - state.lastSpawnTime > state.spawnInterval) {
            spawnObject();
            state.lastSpawnTime = currentTime;
            
            // Gradually decrease spawn interval
            state.spawnInterval = Math.max(
                CONFIG.minSpawnInterval,
                state.spawnInterval * CONFIG.spawnIntervalDecreaseRate
            );
        }
        
        // Gradually increase fall speed
        state.fallSpeed = Math.min(
            CONFIG.maxFallSpeed,
            state.fallSpeed + CONFIG.speedIncreaseRate * deltaTime
        );
        
        // Update and check objects
        for (let i = state.objects.length - 1; i >= 0; i--) {
            const obj = state.objects[i];
            obj.update(deltaTime);
            
            // Check collision
            if (obj.collidesWith(state.catcher)) {
                state.score += obj.points;
                state.score = Math.max(0, state.score);
                
                // Update high score
                if (state.score > state.highScore) {
                    state.highScore = state.score;
                    saveHighScore();
                }
                
                // Show popup
                const rect = elements.canvas.getBoundingClientRect();
                showScorePopup(
                    rect.left + obj.x,
                    rect.top + obj.y,
                    obj.points
                );
                
                state.objects.splice(i, 1);
                updateDisplay();
                continue;
            }
            
            // Check if missed (only for good objects)
            if (obj.isOffScreen()) {
                if (!obj.isBad) {
                    state.lives--;
                    updateDisplay();
                    
                    if (state.lives <= 0) {
                        gameOver();
                        return;
                    }
                }
                state.objects.splice(i, 1);
            }
        }
    }

    function drawObjects() {
        state.objects.forEach(obj => obj.draw(elements.ctx));
    }

    function updateDisplay() {
        elements.scoreDisplay.textContent = state.score;
        elements.highScoreDisplay.textContent = state.highScore;
        elements.livesDisplay.textContent = state.lives;
    }
    
    // High Score Management
    function loadHighScore() {
        const saved = localStorage.getItem('catchTheObjectsHighScore');
        if (saved) {
            state.highScore = parseInt(saved, 10) || 0;
        }
    }
    
    function saveHighScore() {
        localStorage.setItem('catchTheObjectsHighScore', state.highScore.toString());
    }

    // Game Loop
    let lastTime = 0;
    let pausedTime = 0;
    
    function gameLoop(currentTime) {
        if (!state.isPlaying) return;
        
        // Skip update if paused
        if (state.isPaused) {
            pausedTime = currentTime;
            state.animationId = requestAnimationFrame(gameLoop);
            return;
        }
        
        // Adjust for pause duration
        if (pausedTime > 0) {
            lastTime += currentTime - pausedTime;
            pausedTime = 0;
        }
        
        const deltaTime = currentTime - lastTime || 16;
        lastTime = currentTime;
        
        clearCanvas();
        drawBackground();
        updateObjects(deltaTime);
        drawObjects();
        drawCatcher();
        
        // Draw pause overlay if paused
        if (state.isPaused) {
            drawPauseOverlay();
        }
        
        state.animationId = requestAnimationFrame(gameLoop);
    }
    
    function drawPauseOverlay() {
        const ctx = elements.ctx;
        const width = elements.canvas.displayWidth;
        const height = elements.canvas.displayHeight;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = '#f39c12';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', width / 2, height / 2);
    }

    // Game State Management
    function startGame() {
        resetGame();
        state.isPlaying = true;
        elements.overlay.classList.add('hidden');
        lastTime = performance.now();
        state.lastSpawnTime = Date.now();
        gameLoop(lastTime);
    }

    function resetGame() {
        state.score = 0;
        state.lives = CONFIG.initialLives;
        state.fallSpeed = CONFIG.baseFallSpeed;
        state.spawnInterval = CONFIG.baseSpawnInterval;
        state.lastSpawnX = null;
        state.isPaused = false;
        state.objects = [];
        
        // Reset pause button
        elements.pauseBtn.textContent = '⏸ Pause';
        elements.pauseBtn.classList.remove('paused');
        
        // Center catcher
        state.catcher.x = (elements.canvas.displayWidth - state.catcher.width) / 2;
        state.catcher.targetX = state.catcher.x;
        
        updateDisplay();
    }

    function gameOver() {
        state.isPlaying = false;
        
        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
        }
        
        // Update high score one final time
        if (state.score > state.highScore) {
            state.highScore = state.score;
            saveHighScore();
        }
        
        elements.overlayTitle.textContent = 'Game Over!';
        elements.overlayMessage.textContent = 'Great effort! Want to try again?';
        elements.finalScore.textContent = `Final Score: ${state.score}`;
        elements.bestScore.textContent = `Best Score: ${state.highScore}`;
        elements.startBtn.textContent = 'Play Again';
        elements.overlay.classList.remove('hidden');
        
        updateDisplay();
    }

    // Input Handlers
    function handleKeyDown(e) {
        if (!state.isPlaying) return;
        
        const moveAmount = state.catcher.width * 0.3;
        const width = elements.canvas.displayWidth;
        
        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                state.catcher.targetX = utils.clamp(
                    state.catcher.targetX - moveAmount,
                    0,
                    width - state.catcher.width
                );
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                state.catcher.targetX = utils.clamp(
                    state.catcher.targetX + moveAmount,
                    0,
                    width - state.catcher.width
                );
                e.preventDefault();
                break;
        }
    }

    // Touch/Mouse handling
    let isDragging = false;
    let dragStartX = 0;
    let catcherStartX = 0;

    function getPointerX(e) {
        if (e.touches && e.touches.length > 0) {
            return e.touches[0].clientX;
        }
        return e.clientX;
    }

    function handlePointerStart(e) {
        if (!state.isPlaying) return;
        
        isDragging = true;
        const rect = elements.canvas.getBoundingClientRect();
        dragStartX = getPointerX(e) - rect.left;
        catcherStartX = state.catcher.targetX;
        
        e.preventDefault();
    }

    function handlePointerMove(e) {
        if (!state.isPlaying || !isDragging) return;
        
        const rect = elements.canvas.getBoundingClientRect();
        const currentX = getPointerX(e) - rect.left;
        const deltaX = currentX - dragStartX;
        
        const width = elements.canvas.displayWidth;
        state.catcher.targetX = utils.clamp(
            catcherStartX + deltaX,
            0,
            width - state.catcher.width
        );
        
        e.preventDefault();
    }

    function handlePointerEnd(e) {
        isDragging = false;
    }

    // Direct touch position (alternative control)
    function handleDirectTouch(e) {
        if (!state.isPlaying) return;
        
        const rect = elements.canvas.getBoundingClientRect();
        const touchX = getPointerX(e) - rect.left;
        const width = elements.canvas.displayWidth;
        
        // Move catcher to touch position (centered)
        state.catcher.targetX = utils.clamp(
            touchX - state.catcher.width / 2,
            0,
            width - state.catcher.width
        );
    }

    // Pause/Resume
    function togglePause() {
        if (!state.isPlaying) return;
        
        state.isPaused = !state.isPaused;
        
        if (state.isPaused) {
            elements.pauseBtn.textContent = '▶ Resume';
            elements.pauseBtn.classList.add('paused');
        } else {
            elements.pauseBtn.textContent = '⏸ Pause';
            elements.pauseBtn.classList.remove('paused');
            lastTime = performance.now();
        }
    }

    // Event Listeners
    function initEventListeners() {
        // Window resize
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('orientationchange', () => {
            setTimeout(resizeCanvas, 100);
        });
        
        // Keyboard
        document.addEventListener('keydown', handleKeyDown);
        
        // Mouse events
        elements.canvas.addEventListener('mousedown', handlePointerStart);
        document.addEventListener('mousemove', handlePointerMove);
        document.addEventListener('mouseup', handlePointerEnd);
        
        // Touch events
        elements.canvas.addEventListener('touchstart', handlePointerStart, { passive: false });
        document.addEventListener('touchmove', handlePointerMove, { passive: false });
        document.addEventListener('touchend', handlePointerEnd);
        
        // Start button
        elements.startBtn.addEventListener('click', startGame);
        elements.startBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            startGame();
        });
        
        // Pause button
        elements.pauseBtn.addEventListener('click', togglePause);
        elements.pauseBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            togglePause();
        });
        
        // Prevent context menu on long press
        elements.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Visibility change (pause when tab is hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && state.isPlaying) {
                // Pause logic could go here
            }
        });
    }

    // Initialize Game
    function init() {
        loadHighScore();
        resizeCanvas();
        initEventListeners();
        updateDisplay();
        
        // Initial draw
        clearCanvas();
        drawBackground();
        
        // Center catcher initially
        state.catcher.x = (elements.canvas.displayWidth - state.catcher.width) / 2;
        state.catcher.targetX = state.catcher.x;
        
        drawCatcher();
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
