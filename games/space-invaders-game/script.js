/**
 * Space Invaders Arcade Game - FIXED VERSION
 * Vanilla JavaScript - No Libraries
 * Fixes: Player persistence, bullet alignment, game loop stability
 */

(function() {
    'use strict';

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        PLAYER_SIZE: 50,
        PLAYER_SPEED: 8,
        BULLET_SPEED: 14,
        BULLET_WIDTH: 6,
        BULLET_HEIGHT: 20,
        BASE_FIRE_RATE: 180,
        FAST_FIRE_RATE: 60,
        ENEMY_SIZE: 40,
        ENEMY_BASE_SPEED: 1.5,
        ENEMY_SPAWN_INTERVAL: 1000,
        POWERUP_DROP_CHANCE: 0.12,
        POWERUP_DURATION: 10000,
        POWERUP_SIZE: 35,
        POWERUP_SPEED: 3,
        SPEED_INCREASE_INTERVAL: 20000,
        SPEED_INCREASE_AMOUNT: 0.25
    };

    // ==================== GAME STATE ====================
    let gameRunning = false;
    let gamePaused = false;
    let score = 0;
    let bestScore = parseInt(localStorage.getItem('spaceInvadersBest')) || 0;
    let lastFireTime = 0;
    let lastSpawnTime = 0;
    let gameStartTime = 0;
    let currentEnemySpeed = CONFIG.ENEMY_BASE_SPEED;
    let isShieldActive = false;
    let shieldEndTime = 0;
    let isFirePowerActive = false;
    let firePowerEndTime = 0;
    let animationFrameId = null;

    // ==================== GAME OBJECTS ====================
    // Player object - NEVER set to null during gameplay
    let player = {
        x: 0,
        y: 0,
        width: CONFIG.PLAYER_SIZE,
        height: CONFIG.PLAYER_SIZE,
        vx: 0,
        vy: 0,
        emoji: '🚀',
        isAlive: true
    };

    let bullets = [];
    let enemies = [];
    let powerups = [];
    let particles = [];

    // ==================== INPUT STATE ====================
    const keys = {
        left: false,
        right: false,
        up: false,
        down: false
    };
    
    let touchActive = false;
    let touchX = null;
    let touchY = null;

    // ==================== CANVAS & DOM ====================
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    const scoreEl = document.getElementById('score');
    const bestScoreEl = document.getElementById('best-score');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const pauseOverlay = document.getElementById('pause-overlay');
    const finalScoreEl = document.getElementById('final-score');
    const finalBestEl = document.getElementById('final-best');
    const startBestEl = document.getElementById('start-best');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const activePowerupEl = document.getElementById('active-powerup');
    const powerupIconEl = document.getElementById('powerup-icon');
    const powerupTimerEl = document.getElementById('powerup-timer');
    const gameContainer = document.getElementById('game-container');

    // Enemy emoji options
    const ENEMY_EMOJIS = ['💀', '👾', '👽', '🛸', '🤖'];

    // ==================== CANVAS SETUP ====================
    function resizeCanvas() {
        const header = document.getElementById('game-header');
        const headerHeight = header ? header.offsetHeight : 50;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - headerHeight;
        
        // Keep player in bounds after resize
        if (player.isAlive) {
            player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
            player.y = Math.max(100, Math.min(canvas.height - player.height / 2 - 20, player.y));
        }
    }

    // ==================== DRAWING FUNCTIONS ====================
    function drawNeonEmoji(emoji, x, y, size, glowColor = '#00ff00') {
        ctx.save();
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Strong neon glow - multiple layers
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 30;
        ctx.fillText(emoji, x, y);
        ctx.shadowBlur = 20;
        ctx.fillText(emoji, x, y);
        ctx.shadowBlur = 10;
        ctx.fillText(emoji, x, y);
        ctx.shadowBlur = 0;
        ctx.fillText(emoji, x, y);
        
        ctx.restore();
    }

    function drawPlayer() {
        if (!player.isAlive) return;
        
        // Draw shield effect if active
        if (isShieldActive) {
            ctx.save();
            const pulse = Math.sin(Date.now() * 0.008) * 8;
            
            // Outer glow ring
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.width * 0.7 + pulse, 0, Math.PI * 2);
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 25;
            ctx.stroke();
            
            // Inner glow
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.width * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
            ctx.fill();
            
            ctx.restore();
        }
        
        // Draw rocket with glow
        const glowColor = isFirePowerActive ? '#ff6600' : '#00ff00';
        drawNeonEmoji(player.emoji, player.x, player.y, player.width, glowColor);
    }

    function drawBullet(bullet) {
        ctx.save();
        
        // Neon glow effect
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 15;
        
        // Main bullet body - bright green rectangle
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(
            bullet.x - CONFIG.BULLET_WIDTH / 2,
            bullet.y - CONFIG.BULLET_HEIGHT / 2,
            CONFIG.BULLET_WIDTH,
            CONFIG.BULLET_HEIGHT
        );
        
        // Bright core
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(
            bullet.x - CONFIG.BULLET_WIDTH / 4,
            bullet.y - CONFIG.BULLET_HEIGHT / 2,
            CONFIG.BULLET_WIDTH / 2,
            CONFIG.BULLET_HEIGHT
        );
        
        // Trail effect
        ctx.fillStyle = 'rgba(0, 255, 0, 0.4)';
        ctx.fillRect(
            bullet.x - CONFIG.BULLET_WIDTH / 2,
            bullet.y + CONFIG.BULLET_HEIGHT / 2,
            CONFIG.BULLET_WIDTH,
            CONFIG.BULLET_HEIGHT * 1.5
        );
        
        ctx.restore();
    }

    function drawEnemy(enemy) {
        drawNeonEmoji(enemy.emoji, enemy.x, enemy.y, enemy.size, '#00ff00');
    }

    function drawPowerup(powerup) {
        const glowColor = powerup.type === 'shield' ? '#00ffff' : '#ff6600';
        const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.15;
        drawNeonEmoji(powerup.emoji, powerup.x, powerup.y, CONFIG.POWERUP_SIZE * pulse, glowColor);
    }

    function drawParticle(p) {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ==================== UPDATE FUNCTIONS ====================
    function updatePlayer() {
        if (!player.isAlive) return;
        
        // Keyboard input
        if (keys.left) player.vx = -CONFIG.PLAYER_SPEED;
        else if (keys.right) player.vx = CONFIG.PLAYER_SPEED;
        else player.vx *= 0.8; // Friction
        
        if (keys.up) player.vy = -CONFIG.PLAYER_SPEED;
        else if (keys.down) player.vy = CONFIG.PLAYER_SPEED;
        else player.vy *= 0.8; // Friction
        
        // Touch/mouse drag input - smooth movement towards touch point
        if (touchActive && touchX !== null && touchY !== null) {
            const dx = touchX - player.x;
            const dy = touchY - player.y;
            player.vx = dx * 0.15;
            player.vy = dy * 0.15;
        }
        
        // Apply velocity
        player.x += player.vx;
        player.y += player.vy;
        
        // STRICT boundary constraints - keep player fully on screen
        const halfW = player.width / 2;
        const halfH = player.height / 2;
        const minY = 80; // Below header
        const maxY = canvas.height - halfH - 30;
        
        if (player.x < halfW) { player.x = halfW; player.vx = 0; }
        if (player.x > canvas.width - halfW) { player.x = canvas.width - halfW; player.vx = 0; }
        if (player.y < minY) { player.y = minY; player.vy = 0; }
        if (player.y > maxY) { player.y = maxY; player.vy = 0; }
    }

    function fireAutomatic() {
        if (!player.isAlive) return;
        
        const now = Date.now();
        const fireRate = isFirePowerActive ? CONFIG.FAST_FIRE_RATE : CONFIG.BASE_FIRE_RATE;
        
        if (now - lastFireTime >= fireRate) {
            lastFireTime = now;
            
            // CRITICAL FIX: Bullet spawns at EXACT center of player
            // player.x is already the center (we use center-based positioning)
            bullets.push({
                x: player.x,  // Exact horizontal center
                y: player.y - player.height / 2 - 10,  // Top of rocket
                active: true
            });
        }
    }

    function updateBullets() {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.y -= CONFIG.BULLET_SPEED;
            
            // Remove if off screen
            if (b.y < -CONFIG.BULLET_HEIGHT) {
                bullets.splice(i, 1);
            }
        }
    }

    function spawnEnemies() {
        const now = Date.now();
        
        if (now - lastSpawnTime >= CONFIG.ENEMY_SPAWN_INTERVAL) {
            lastSpawnTime = now;
            
            // Spawn 2-4 enemies at a time
            const count = 2 + Math.floor(Math.random() * 3);
            
            for (let i = 0; i < count; i++) {
                const margin = CONFIG.ENEMY_SIZE;
                enemies.push({
                    x: margin + Math.random() * (canvas.width - margin * 2),
                    y: -CONFIG.ENEMY_SIZE - Math.random() * 100,
                    size: CONFIG.ENEMY_SIZE,
                    emoji: ENEMY_EMOJIS[Math.floor(Math.random() * ENEMY_EMOJIS.length)],
                    wobble: Math.random() * Math.PI * 2,
                    wobbleSpeed: 0.02 + Math.random() * 0.02,
                    active: true
                });
            }
        }
    }

    function updateEnemies() {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            
            // Move downward
            e.y += currentEnemySpeed;
            
            // Wobble side to side
            e.wobble += e.wobbleSpeed;
            e.x += Math.sin(e.wobble) * 1;
            
            // Remove if off screen (bottom)
            if (e.y > canvas.height + e.size) {
                enemies.splice(i, 1);
            }
        }
    }

    function updatePowerups() {
        for (let i = powerups.length - 1; i >= 0; i--) {
            const p = powerups[i];
            p.y += CONFIG.POWERUP_SPEED;
            
            if (p.y > canvas.height + CONFIG.POWERUP_SIZE) {
                powerups.splice(i, 1);
            }
        }
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.life -= p.decay;
            
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function createExplosion(x, y, color) {
        for (let i = 0; i < 15; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                size: Math.random() * 6 + 3,
                color: color,
                life: 1,
                decay: Math.random() * 0.03 + 0.02
            });
        }
    }

    // ==================== COLLISION DETECTION ====================
    function checkCollisions() {
        if (!player.isAlive) return;
        
        // Bullet vs Enemy
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                
                const dx = b.x - e.x;
                const dy = b.y - e.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < e.size / 2 + CONFIG.BULLET_WIDTH) {
                    // Hit!
                    bullets.splice(i, 1);
                    enemies.splice(j, 1);
                    
                    score += 10;
                    scoreEl.textContent = score;
                    
                    createExplosion(e.x, e.y, '#00ff00');
                    
                    // Chance to drop power-up
                    if (Math.random() < CONFIG.POWERUP_DROP_CHANCE) {
                        const type = Math.random() < 0.5 ? 'shield' : 'fire';
                        powerups.push({
                            x: e.x,
                            y: e.y,
                            type: type,
                            emoji: type === 'shield' ? '🛡️' : '🔥'
                        });
                    }
                    
                    break;
                }
            }
        }
        
        // Player vs Power-up
        for (let i = powerups.length - 1; i >= 0; i--) {
            const p = powerups[i];
            
            const dx = player.x - p.x;
            const dy = player.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < player.width / 2 + CONFIG.POWERUP_SIZE / 2) {
                // Collected!
                powerups.splice(i, 1);
                
                const now = Date.now();
                if (p.type === 'shield') {
                    isShieldActive = true;
                    shieldEndTime = now + CONFIG.POWERUP_DURATION;
                    activePowerupEl.classList.remove('hidden');
                    powerupIconEl.textContent = '🛡️';
                } else {
                    isFirePowerActive = true;
                    firePowerEndTime = now + CONFIG.POWERUP_DURATION;
                    activePowerupEl.classList.remove('hidden');
                    powerupIconEl.textContent = '🔥';
                }
                
                createExplosion(p.x, p.y, p.type === 'shield' ? '#00ffff' : '#ff6600');
            }
        }
        
        // Player vs Enemy - GAME OVER unless shield is active
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            
            const dx = player.x - e.x;
            const dy = player.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Collision threshold
            const collisionDist = player.width / 2.5 + e.size / 2.5;
            
            if (dist < collisionDist) {
                if (isShieldActive) {
                    // Shield destroys enemy on contact
                    enemies.splice(i, 1);
                    score += 10;
                    scoreEl.textContent = score;
                    createExplosion(e.x, e.y, '#00ffff');
                } else {
                    // GAME OVER - instant death
                    createExplosion(player.x, player.y, '#ff0000');
                    createExplosion(e.x, e.y, '#00ff00');
                    triggerGameOver();
                    return;
                }
            }
        }
    }

    // ==================== POWER-UP TIMER ====================
    function updatePowerupTimers() {
        const now = Date.now();
        
        if (isShieldActive && now >= shieldEndTime) {
            isShieldActive = false;
        }
        
        if (isFirePowerActive && now >= firePowerEndTime) {
            isFirePowerActive = false;
        }
        
        // Update UI
        if (isShieldActive) {
            const remaining = Math.ceil((shieldEndTime - now) / 1000);
            powerupTimerEl.textContent = remaining + 's';
        } else if (isFirePowerActive) {
            const remaining = Math.ceil((firePowerEndTime - now) / 1000);
            powerupTimerEl.textContent = remaining + 's';
        } else {
            activePowerupEl.classList.add('hidden');
        }
    }

    // ==================== DIFFICULTY SCALING ====================
    function updateDifficulty() {
        const elapsed = Date.now() - gameStartTime;
        const increases = Math.floor(elapsed / CONFIG.SPEED_INCREASE_INTERVAL);
        currentEnemySpeed = CONFIG.ENEMY_BASE_SPEED + (increases * CONFIG.SPEED_INCREASE_AMOUNT);
    }

    // ==================== GAME LOOP ====================
    function gameLoop() {
        // CRITICAL: Only stop if game is explicitly not running
        if (!gameRunning) {
            return;
        }
        
        // If paused, keep requesting frames but don't update
        if (gamePaused) {
            animationFrameId = requestAnimationFrame(gameLoop);
            return;
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update game state
        updateDifficulty();
        updatePlayer();
        fireAutomatic();
        spawnEnemies();
        updateBullets();
        updateEnemies();
        updatePowerups();
        updateParticles();
        updatePowerupTimers();
        checkCollisions();
        
        // Update best score
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('spaceInvadersBest', bestScore);
            bestScoreEl.textContent = bestScore;
        }
        
        // Draw everything
        enemies.forEach(drawEnemy);
        bullets.forEach(drawBullet);
        powerups.forEach(drawPowerup);
        particles.forEach(drawParticle);
        drawPlayer();
        
        // ALWAYS request next frame while game is running
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // ==================== GAME CONTROL ====================
    function startGame() {
        // Hide screens
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        pauseOverlay.classList.add('hidden');
        
        // Reset state
        gameRunning = true;
        gamePaused = false;
        score = 0;
        lastFireTime = 0;
        lastSpawnTime = Date.now();
        gameStartTime = Date.now();
        currentEnemySpeed = CONFIG.ENEMY_BASE_SPEED;
        isShieldActive = false;
        isFirePowerActive = false;
        
        // Clear arrays
        bullets = [];
        enemies = [];
        powerups = [];
        particles = [];
        
        // Reset player - ALWAYS create fresh player at start
        player = {
            x: canvas.width / 2,
            y: canvas.height - 100,
            width: CONFIG.PLAYER_SIZE,
            height: CONFIG.PLAYER_SIZE,
            vx: 0,
            vy: 0,
            emoji: '🚀',
            isAlive: true
        };
        
        // Reset UI
        scoreEl.textContent = '0';
        bestScoreEl.textContent = bestScore;
        activePowerupEl.classList.add('hidden');
        pauseBtn.textContent = '⏸️';
        
        // Start game loop
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        gameLoop();
    }

    function triggerGameOver() {
        gameRunning = false;
        player.isAlive = false;
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        // Update best score
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('spaceInvadersBest', bestScore);
        }
        
        // Show game over screen
        finalScoreEl.textContent = score;
        finalBestEl.textContent = bestScore;
        gameOverScreen.classList.remove('hidden');
        
        // Screen shake
        gameContainer.classList.add('shake');
        setTimeout(() => gameContainer.classList.remove('shake'), 300);
    }

    function togglePause() {
        if (!gameRunning) return;
        
        gamePaused = !gamePaused;
        
        if (gamePaused) {
            pauseOverlay.classList.remove('hidden');
            pauseBtn.textContent = '▶️';
        } else {
            pauseOverlay.classList.add('hidden');
            pauseBtn.textContent = '⏸️';
        }
    }

    // ==================== INPUT HANDLERS ====================
    function setupInputHandlers() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    e.preventDefault();
                    keys.left = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    e.preventDefault();
                    keys.right = true;
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    e.preventDefault();
                    keys.up = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    e.preventDefault();
                    keys.down = true;
                    break;
                case 'Escape':
                case 'KeyP':
                    if (gameRunning) togglePause();
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    keys.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    keys.right = false;
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    keys.up = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    keys.down = false;
                    break;
            }
        });

        // Touch - drag anywhere on canvas to move
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchActive = true;
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            touchX = touch.clientX - rect.left;
            touchY = touch.clientY - rect.top;
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            touchX = touch.clientX - rect.left;
            touchY = touch.clientY - rect.top;
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            touchActive = false;
            touchX = null;
            touchY = null;
        });

        canvas.addEventListener('touchcancel', () => {
            touchActive = false;
            touchX = null;
            touchY = null;
        });

        // Mouse drag
        let mouseDown = false;
        canvas.addEventListener('mousedown', (e) => {
            mouseDown = true;
            touchActive = true;
            const rect = canvas.getBoundingClientRect();
            touchX = e.clientX - rect.left;
            touchY = e.clientY - rect.top;
        });

        canvas.addEventListener('mousemove', (e) => {
            if (mouseDown) {
                const rect = canvas.getBoundingClientRect();
                touchX = e.clientX - rect.left;
                touchY = e.clientY - rect.top;
            }
        });

        canvas.addEventListener('mouseup', () => {
            mouseDown = false;
            touchActive = false;
            touchX = null;
            touchY = null;
        });

        canvas.addEventListener('mouseleave', () => {
            mouseDown = false;
            touchActive = false;
            touchX = null;
            touchY = null;
        });

        // Buttons
        startBtn.addEventListener('click', startGame);
        restartBtn.addEventListener('click', startGame);
        pauseBtn.addEventListener('click', togglePause);
        resumeBtn.addEventListener('click', togglePause);

        // Touch buttons
        startBtn.addEventListener('touchend', (e) => { e.preventDefault(); startGame(); });
        restartBtn.addEventListener('touchend', (e) => { e.preventDefault(); startGame(); });
        pauseBtn.addEventListener('touchend', (e) => { e.preventDefault(); togglePause(); });
        resumeBtn.addEventListener('touchend', (e) => { e.preventDefault(); togglePause(); });

        // Resize
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));
    }

    // ==================== INITIALIZE ====================
    function init() {
        resizeCanvas();
        setupInputHandlers();
        
        // Display best scores
        bestScoreEl.textContent = bestScore;
        startBestEl.textContent = bestScore;
    }

    // Start when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
