/**
 * ASTEROIDS GAME
 * A classic arcade game built with vanilla JavaScript
 * 
 * Features:
 * - Ship physics with rotation, thrust, and velocity
 * - Asteroid spawning, movement, and splitting
 * - Collision detection
 * - Score and lives tracking
 * - Responsive canvas sizing
 * - Mobile touch controls
 */

(function() {
    'use strict';

    // ============================================
    // GAME CONFIGURATION
    // ============================================
    const CONFIG = {
        // Ship settings
        SHIP_SIZE: 20,
        SHIP_THRUST: 0.15,
        SHIP_ROTATION_SPEED: 0.08,
        SHIP_FRICTION: 0.99,
        SHIP_MAX_SPEED: 8,
        SHIP_INVINCIBILITY_TIME: 3000, // ms
        SHIP_BLINK_RATE: 100, // ms
        
        // Bullet settings
        BULLET_SPEED: 10,
        BULLET_LIFETIME: 60, // frames
        BULLET_SIZE: 3,
        MAX_BULLETS: 10,
        FIRE_RATE: 150, // ms between shots
        
        // Asteroid settings
        ASTEROID_SPEED_MIN: 0.3,
        ASTEROID_SPEED_MAX: 1.2,
        ASTEROID_VERTICES_MIN: 8,
        ASTEROID_VERTICES_MAX: 12,
        ASTEROID_JAGGEDNESS: 0.4,
        ASTEROID_SIZES: {
            LARGE: 40,
            MEDIUM: 20,
            SMALL: 10
        },
        INITIAL_ASTEROIDS: 4,
        ASTEROID_SPAWN_INTERVAL: 3000, // Spawn new asteroid every 3 seconds
        MAX_ASTEROIDS: 15, // Maximum asteroids on screen
        
        // Scoring
        SCORE_LARGE: 20,
        SCORE_MEDIUM: 50,
        SCORE_SMALL: 100,
        
        // Game settings
        INITIAL_LIVES: 3,
        NEW_LEVEL_DELAY: 2000, // ms
        
        // Colors
        COLORS: {
            SHIP: '#00ffcc',
            SHIP_THRUST: '#ff6600',
            BULLET: '#ffffff',
            ASTEROID: '#ffffff',
            EXPLOSION: '#ffaa00'
        }
    };

    // ============================================
    // GAME STATE
    // ============================================
    let canvas, ctx;
    let gameState = {
        score: 0,
        highScore: 0,
        lives: CONFIG.INITIAL_LIVES,
        isRunning: false,
        isGameOver: false,
        level: 1
    };
    
    let ship = null;
    let bullets = [];
    let asteroids = [];
    let particles = []; // For explosion effects
    
    // Input state
    let keys = {
        left: false,
        right: false,
        up: false,
        down: false,
        space: false
    };
    
    let lastFireTime = 0;
    let lastSpawnTime = 0;
    let animationId = null;

    // ============================================
    // DOM ELEMENTS
    // ============================================
    let elements = {};

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        // Cache DOM elements
        elements = {
            canvas: document.getElementById('game-canvas'),
            scoreDisplay: document.getElementById('score'),
            livesDisplay: document.getElementById('lives'),
            highscoreDisplay: document.getElementById('highscore'),
            startOverlay: document.getElementById('start-overlay'),
            gameOverOverlay: document.getElementById('game-over-overlay'),
            finalScore: document.getElementById('final-score'),
            finalHighscore: document.getElementById('final-highscore'),
            startBtn: document.getElementById('start-btn'),
            restartBtn: document.getElementById('restart-btn'),
            resetBtn: document.getElementById('reset-btn'),
            btnLeft: document.getElementById('btn-left'),
            btnRight: document.getElementById('btn-right'),
            btnUp: document.getElementById('btn-up'),
            btnDown: document.getElementById('btn-down'),
            btnFire: document.getElementById('btn-fire')
        };
        
        canvas = elements.canvas;
        ctx = canvas.getContext('2d');
        
        // Set up canvas size
        resizeCanvas();
        
        // Event listeners
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        // Button listeners
        elements.startBtn.addEventListener('click', startGame);
        elements.restartBtn.addEventListener('click', restartGame);
        elements.resetBtn.addEventListener('click', restartGame);
        
        // Mobile touch controls
        setupMobileControls();
        
        // Prevent context menu on long press
        canvas.addEventListener('contextmenu', e => e.preventDefault());
    }

    /**
     * Resize canvas to fit the screen while maintaining aspect ratio
     */
    function resizeCanvas() {
        const container = document.getElementById('game-container');
        const padding = 10;
        
        // Calculate available space
        let availableWidth = window.innerWidth - padding * 2;
        let availableHeight = window.innerHeight - padding * 2;
        
        // Detect mobile
        const isMobile = window.innerWidth <= 768;
        
        // Account for controls at bottom
        if (isMobile) {
            // Leave space for D-pad controls (roughly 40vw + some margin)
            const controlsHeight = Math.min(window.innerWidth * 0.42, 170);
            availableHeight -= controlsHeight + 20;
        } else {
            // Desktop - smaller controls
            availableHeight -= 160;
        }
        
        // Account for HUD at top
        availableHeight -= 50;
        
        // Use available space more efficiently
        let width = availableWidth;
        let height = availableHeight;
        
        // Maintain a reasonable aspect ratio (between 4:3 and 16:9)
        const aspectRatio = width / height;
        if (aspectRatio > 1.8) {
            width = height * 1.6;
        } else if (aspectRatio < 0.8) {
            height = width * 1.2;
        }
        
        // Ensure minimum size
        width = Math.max(width, 280);
        height = Math.max(height, 200);
        
        canvas.width = Math.floor(width);
        canvas.height = Math.floor(height);
        
        // If game is running, reposition ship if needed
        if (ship) {
            ship.x = Math.min(ship.x, canvas.width);
            ship.y = Math.min(ship.y, canvas.height);
        }
    }

    // ============================================
    // GAME CONTROLS
    // ============================================
    function handleKeyDown(e) {
        // Allow starting game with Enter or Space on start screen
        if (!gameState.isRunning && !gameState.isGameOver) {
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                startGame();
                return;
            }
        }
        
        if (!gameState.isRunning) return;
        
        switch(e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                keys.left = true;
                highlightButton(elements.btnLeft, true);
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'KeyD':
                keys.right = true;
                highlightButton(elements.btnRight, true);
                e.preventDefault();
                break;
            case 'ArrowUp':
            case 'KeyW':
                keys.up = true;
                highlightButton(elements.btnUp, true);
                e.preventDefault();
                break;
            case 'ArrowDown':
            case 'KeyS':
                keys.down = true;
                highlightButton(elements.btnDown, true);
                e.preventDefault();
                break;
            case 'Space':
            case 'KeyX':
            case 'ControlLeft':
            case 'ControlRight':
                keys.space = true;
                highlightButton(elements.btnFire, true);
                e.preventDefault();
                break;
        }
    }
    
    /**
     * Highlight/unhighlight a button
     */
    function highlightButton(btn, active) {
        if (btn) {
            if (active) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    }

    function handleKeyUp(e) {
        switch(e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                keys.left = false;
                highlightButton(elements.btnLeft, false);
                break;
            case 'ArrowRight':
            case 'KeyD':
                keys.right = false;
                highlightButton(elements.btnRight, false);
                break;
            case 'ArrowUp':
            case 'KeyW':
                keys.up = false;
                highlightButton(elements.btnUp, false);
                break;
            case 'ArrowDown':
            case 'KeyS':
                keys.down = false;
                highlightButton(elements.btnDown, false);
                break;
            case 'Space':
            case 'KeyX':
            case 'ControlLeft':
            case 'ControlRight':
                keys.space = false;
                highlightButton(elements.btnFire, false);
                break;
        }
    }

    /**
     * Setup mobile touch controls
     */
    function setupMobileControls() {
        const addTouchListeners = (element, key) => {
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                keys[key] = true;
                element.classList.add('active');
            }, { passive: false });
            
            element.addEventListener('touchend', (e) => {
                e.preventDefault();
                keys[key] = false;
                element.classList.remove('active');
            }, { passive: false });
            
            element.addEventListener('touchcancel', (e) => {
                keys[key] = false;
                element.classList.remove('active');
            });
        };
        
        addTouchListeners(elements.btnUp, 'up');
        addTouchListeners(elements.btnDown, 'down');
        addTouchListeners(elements.btnLeft, 'left');
        addTouchListeners(elements.btnRight, 'right');
        addTouchListeners(elements.btnFire, 'space');
    }

    // ============================================
    // GAME OBJECTS
    // ============================================
    
    /**
     * Create the player ship
     */
    function createShip() {
        return {
            x: canvas.width / 2,
            y: canvas.height / 2,
            angle: -Math.PI / 2, // Point upward
            velocityX: 0,
            velocityY: 0,
            isThrusting: false,
            isInvincible: true,
            invincibilityTimer: CONFIG.SHIP_INVINCIBILITY_TIME,
            blinkTimer: 0,
            isVisible: true
        };
    }

    /**
     * Create a bullet at the ship's position
     */
    function createBullet() {
        const now = Date.now();
        if (now - lastFireTime < CONFIG.FIRE_RATE) return null;
        if (bullets.length >= CONFIG.MAX_BULLETS) return null;
        
        lastFireTime = now;
        
        const tipX = ship.x + Math.cos(ship.angle) * CONFIG.SHIP_SIZE;
        const tipY = ship.y + Math.sin(ship.angle) * CONFIG.SHIP_SIZE;
        
        return {
            x: tipX,
            y: tipY,
            velocityX: Math.cos(ship.angle) * CONFIG.BULLET_SPEED + ship.velocityX * 0.5,
            velocityY: Math.sin(ship.angle) * CONFIG.BULLET_SPEED + ship.velocityY * 0.5,
            lifetime: CONFIG.BULLET_LIFETIME
        };
    }

    /**
     * Create an asteroid that comes from outside the screen
     * @param {string} size - 'LARGE', 'MEDIUM', or 'SMALL'
     * @param {number} targetX - Optional target X to move toward
     * @param {number} targetY - Optional target Y to move toward
     */
    function createAsteroid(x, y, size, fromEdge = false) {
        const radius = CONFIG.ASTEROID_SIZES[size];
        const vertices = [];
        const numVertices = Math.floor(
            Math.random() * (CONFIG.ASTEROID_VERTICES_MAX - CONFIG.ASTEROID_VERTICES_MIN + 1)
        ) + CONFIG.ASTEROID_VERTICES_MIN;
        
        // Generate irregular polygon vertices
        for (let i = 0; i < numVertices; i++) {
            const angle = (i / numVertices) * Math.PI * 2;
            const variance = 1 - Math.random() * CONFIG.ASTEROID_JAGGEDNESS;
            vertices.push({
                angle: angle,
                radius: radius * variance
            });
        }
        
        let spawnX = x;
        let spawnY = y;
        let velocityX, velocityY;
        
        if (fromEdge) {
            // Spawn from outside screen edges
            const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
            const margin = radius + 20;
            
            switch(edge) {
                case 0: // Top
                    spawnX = Math.random() * canvas.width;
                    spawnY = -margin;
                    break;
                case 1: // Right
                    spawnX = canvas.width + margin;
                    spawnY = Math.random() * canvas.height;
                    break;
                case 2: // Bottom
                    spawnX = Math.random() * canvas.width;
                    spawnY = canvas.height + margin;
                    break;
                case 3: // Left
                    spawnX = -margin;
                    spawnY = Math.random() * canvas.height;
                    break;
            }
            
            // Aim toward center area of screen with some randomness
            const targetX = canvas.width * (0.2 + Math.random() * 0.6);
            const targetY = canvas.height * (0.2 + Math.random() * 0.6);
            const angle = Math.atan2(targetY - spawnY, targetX - spawnX);
            const speed = Math.random() * (CONFIG.ASTEROID_SPEED_MAX - CONFIG.ASTEROID_SPEED_MIN) + CONFIG.ASTEROID_SPEED_MIN;
            
            velocityX = Math.cos(angle) * speed;
            velocityY = Math.sin(angle) * speed;
        } else {
            // Random velocity for spawned asteroids (from splitting, etc.)
            const speed = Math.random() * (CONFIG.ASTEROID_SPEED_MAX - CONFIG.ASTEROID_SPEED_MIN) + CONFIG.ASTEROID_SPEED_MIN;
            const direction = Math.random() * Math.PI * 2;
            velocityX = Math.cos(direction) * speed;
            velocityY = Math.sin(direction) * speed;
        }
        
        return {
            x: spawnX,
            y: spawnY,
            velocityX: velocityX,
            velocityY: velocityY,
            radius: radius,
            size: size,
            vertices: vertices,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.02
        };
    }

    /**
     * Spawn initial asteroids for a level
     */
    function spawnAsteroids(count) {
        asteroids = [];
        
        for (let i = 0; i < count; i++) {
            // Spawn from edges
            asteroids.push(createAsteroid(0, 0, 'LARGE', true));
        }
        
        lastSpawnTime = Date.now();
    }
    
    /**
     * Spawn a single new asteroid from edge
     */
    function spawnSingleAsteroid() {
        if (asteroids.length < CONFIG.MAX_ASTEROIDS) {
            const sizes = ['LARGE', 'LARGE', 'MEDIUM', 'MEDIUM', 'SMALL'];
            const size = sizes[Math.floor(Math.random() * sizes.length)];
            asteroids.push(createAsteroid(0, 0, size, true));
        }
    }

    /**
     * Create explosion particles
     */
    function createExplosion(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            particles.push({
                x: x,
                y: y,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                lifetime: 30 + Math.random() * 20,
                color: color,
                size: Math.random() * 3 + 1
            });
        }
    }

    // ============================================
    // GAME LOGIC
    // ============================================
    
    /**
     * Start the game
     */
    function startGame() {
        elements.startOverlay.classList.add('hidden');
        resetGameState();
        gameState.isRunning = true;
        gameLoop();
    }

    /**
     * Restart the game after game over
     */
    function restartGame() {
        elements.gameOverOverlay.classList.add('hidden');
        elements.startOverlay.classList.add('hidden');
        resetGameState();
        gameState.isRunning = true;
        if (!animationId) {
            gameLoop();
        }
    }

    /**
     * Reset all game state
     */
    function resetGameState() {
        gameState.score = 0;
        gameState.lives = CONFIG.INITIAL_LIVES;
        gameState.isGameOver = false;
        gameState.level = 1;
        // Note: highScore is preserved across games, only resets on page refresh
        
        ship = createShip();
        bullets = [];
        particles = [];
        
        spawnAsteroids(CONFIG.INITIAL_ASTEROIDS);
        
        updateHUD();
        
        // Reset keys
        keys = { left: false, right: false, up: false, down: false, space: false };
    }

    /**
     * Update HUD display
     */
    function updateHUD() {
        elements.scoreDisplay.textContent = gameState.score;
        elements.livesDisplay.textContent = gameState.lives;
        elements.highscoreDisplay.textContent = gameState.highScore;
        
        // Update high score if current score is higher
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            elements.highscoreDisplay.textContent = gameState.highScore;
        }
    }

    /**
     * Handle player death
     */
    function playerDeath() {
        gameState.lives--;
        updateHUD();
        
        // Create explosion at ship position
        createExplosion(ship.x, ship.y, CONFIG.COLORS.SHIP, 20);
        
        if (gameState.lives <= 0) {
            gameOver();
        } else {
            // Respawn ship
            ship = createShip();
        }
    }

    /**
     * Handle game over
     */
    function gameOver() {
        gameState.isGameOver = true;
        gameState.isRunning = false;
        
        // Update high score one final time
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
        }
        
        elements.finalScore.textContent = gameState.score;
        elements.finalHighscore.textContent = gameState.highScore;
        elements.gameOverOverlay.classList.remove('hidden');
    }

    // ============================================
    // PHYSICS & MOVEMENT
    // ============================================
    
    /**
     * Update ship physics
     */
    function updateShip(deltaTime) {
        if (!ship) return;
        
        // Handle invincibility
        if (ship.isInvincible) {
            ship.invincibilityTimer -= deltaTime;
            ship.blinkTimer += deltaTime;
            
            if (ship.blinkTimer >= CONFIG.SHIP_BLINK_RATE) {
                ship.blinkTimer = 0;
                ship.isVisible = !ship.isVisible;
            }
            
            if (ship.invincibilityTimer <= 0) {
                ship.isInvincible = false;
                ship.isVisible = true;
            }
        }
        
        // Rotation
        if (keys.left) {
            ship.angle -= CONFIG.SHIP_ROTATION_SPEED;
        }
        if (keys.right) {
            ship.angle += CONFIG.SHIP_ROTATION_SPEED;
        }
        
        // Thrust forward
        ship.isThrusting = keys.up;
        if (keys.up) {
            ship.velocityX += Math.cos(ship.angle) * CONFIG.SHIP_THRUST;
            ship.velocityY += Math.sin(ship.angle) * CONFIG.SHIP_THRUST;
        }
        
        // Thrust backward (reverse)
        if (keys.down) {
            ship.velocityX -= Math.cos(ship.angle) * CONFIG.SHIP_THRUST * 0.5;
            ship.velocityY -= Math.sin(ship.angle) * CONFIG.SHIP_THRUST * 0.5;
        }
        
        // Apply friction
        ship.velocityX *= CONFIG.SHIP_FRICTION;
        ship.velocityY *= CONFIG.SHIP_FRICTION;
        
        // Limit speed
        const speed = Math.sqrt(ship.velocityX ** 2 + ship.velocityY ** 2);
        if (speed > CONFIG.SHIP_MAX_SPEED) {
            ship.velocityX = (ship.velocityX / speed) * CONFIG.SHIP_MAX_SPEED;
            ship.velocityY = (ship.velocityY / speed) * CONFIG.SHIP_MAX_SPEED;
        }
        
        // Update position
        ship.x += ship.velocityX;
        ship.y += ship.velocityY;
        
        // Wrap around screen
        ship.x = wrapPosition(ship.x, canvas.width);
        ship.y = wrapPosition(ship.y, canvas.height);
        
        // Fire bullets
        if (keys.space) {
            const bullet = createBullet();
            if (bullet) {
                bullets.push(bullet);
            }
        }
    }

    /**
     * Update bullets
     */
    function updateBullets() {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            
            // Move bullet
            bullet.x += bullet.velocityX;
            bullet.y += bullet.velocityY;
            
            // Decrease lifetime
            bullet.lifetime--;
            
            // Remove bullets that go off screen or expire
            if (bullet.lifetime <= 0 || 
                bullet.x < 0 || bullet.x > canvas.width ||
                bullet.y < 0 || bullet.y > canvas.height) {
                bullets.splice(i, 1);
            }
        }
    }

    /**
     * Update asteroids
     */
    function updateAsteroids() {
        const margin = 100; // How far off screen before removing
        
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const asteroid = asteroids[i];
            
            // Move asteroid
            asteroid.x += asteroid.velocityX;
            asteroid.y += asteroid.velocityY;
            
            // Rotate
            asteroid.rotation += asteroid.rotationSpeed;
            
            // Remove asteroids that go too far off screen
            if (asteroid.x < -margin || asteroid.x > canvas.width + margin ||
                asteroid.y < -margin || asteroid.y > canvas.height + margin) {
                asteroids.splice(i, 1);
            }
        }
        
        // Continuously spawn new asteroids
        const now = Date.now();
        if (now - lastSpawnTime >= CONFIG.ASTEROID_SPAWN_INTERVAL) {
            spawnSingleAsteroid();
            lastSpawnTime = now;
        }
    }

    /**
     * Update particles
     */
    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.lifetime--;
            
            if (particle.lifetime <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    // ============================================
    // COLLISION DETECTION
    // ============================================
    
    /**
     * Check all collisions
     */
    function checkCollisions() {
        // Bullet vs Asteroid collisions
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            
            for (let j = asteroids.length - 1; j >= 0; j--) {
                const asteroid = asteroids[j];
                
                if (circleCollision(bullet.x, bullet.y, CONFIG.BULLET_SIZE, 
                                   asteroid.x, asteroid.y, asteroid.radius)) {
                    // Remove bullet
                    bullets.splice(i, 1);
                    
                    // Handle asteroid destruction
                    destroyAsteroid(j);
                    break;
                }
            }
        }
        
        // Ship vs Asteroid collisions (only if not invincible)
        if (ship && !ship.isInvincible) {
            for (const asteroid of asteroids) {
                if (circleCollision(ship.x, ship.y, CONFIG.SHIP_SIZE * 0.5,
                                   asteroid.x, asteroid.y, asteroid.radius)) {
                    playerDeath();
                    break;
                }
            }
        }
    }

    /**
     * Destroy an asteroid and potentially split it
     */
    function destroyAsteroid(index) {
        const asteroid = asteroids[index];
        
        // Create explosion
        createExplosion(asteroid.x, asteroid.y, CONFIG.COLORS.EXPLOSION, 8);
        
        // Add score
        switch(asteroid.size) {
            case 'LARGE':
                gameState.score += CONFIG.SCORE_LARGE;
                break;
            case 'MEDIUM':
                gameState.score += CONFIG.SCORE_MEDIUM;
                break;
            case 'SMALL':
                gameState.score += CONFIG.SCORE_SMALL;
                break;
        }
        updateHUD();
        
        // Asteroids are destroyed completely (no splitting)
        // Remove original asteroid
        asteroids.splice(index, 1);
    }

    /**
     * Circle collision detection
     */
    function circleCollision(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < r1 + r2;
    }

    /**
     * Calculate distance between two points
     */
    function distanceBetween(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    /**
     * Wrap position for screen wrapping
     */
    function wrapPosition(value, max) {
        if (value < 0) return max + value;
        if (value > max) return value - max;
        return value;
    }

    // ============================================
    // RENDERING
    // ============================================
    
    /**
     * Draw the ship
     */
    function drawShip() {
        if (!ship || !ship.isVisible) return;
        
        ctx.save();
        ctx.translate(ship.x, ship.y);
        ctx.rotate(ship.angle);
        
        // Draw ship body
        ctx.beginPath();
        ctx.strokeStyle = CONFIG.COLORS.SHIP;
        ctx.lineWidth = 2;
        
        // Triangle ship
        ctx.moveTo(CONFIG.SHIP_SIZE, 0);
        ctx.lineTo(-CONFIG.SHIP_SIZE * 0.7, -CONFIG.SHIP_SIZE * 0.5);
        ctx.lineTo(-CONFIG.SHIP_SIZE * 0.4, 0);
        ctx.lineTo(-CONFIG.SHIP_SIZE * 0.7, CONFIG.SHIP_SIZE * 0.5);
        ctx.closePath();
        ctx.stroke();
        
        // Draw thrust flame
        if (ship.isThrusting) {
            ctx.beginPath();
            ctx.strokeStyle = CONFIG.COLORS.SHIP_THRUST;
            ctx.moveTo(-CONFIG.SHIP_SIZE * 0.4, -CONFIG.SHIP_SIZE * 0.25);
            ctx.lineTo(-CONFIG.SHIP_SIZE * 0.9 - Math.random() * 10, 0);
            ctx.lineTo(-CONFIG.SHIP_SIZE * 0.4, CONFIG.SHIP_SIZE * 0.25);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    /**
     * Draw bullets
     */
    function drawBullets() {
        ctx.fillStyle = CONFIG.COLORS.BULLET;
        
        for (const bullet of bullets) {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, CONFIG.BULLET_SIZE, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Draw asteroids
     */
    function drawAsteroids() {
        ctx.strokeStyle = CONFIG.COLORS.ASTEROID;
        ctx.lineWidth = 1.5;
        
        for (const asteroid of asteroids) {
            ctx.save();
            ctx.translate(asteroid.x, asteroid.y);
            ctx.rotate(asteroid.rotation);
            
            ctx.beginPath();
            
            const firstVertex = asteroid.vertices[0];
            ctx.moveTo(
                Math.cos(firstVertex.angle) * firstVertex.radius,
                Math.sin(firstVertex.angle) * firstVertex.radius
            );
            
            for (let i = 1; i < asteroid.vertices.length; i++) {
                const vertex = asteroid.vertices[i];
                ctx.lineTo(
                    Math.cos(vertex.angle) * vertex.radius,
                    Math.sin(vertex.angle) * vertex.radius
                );
            }
            
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }
    }

    /**
     * Draw particles
     */
    function drawParticles() {
        for (const particle of particles) {
            const alpha = particle.lifetime / 50;
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    /**
     * Clear and render frame
     */
    function render() {
        // Clear canvas
        ctx.fillStyle = 'rgba(10, 10, 15, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw game objects
        drawAsteroids();
        drawBullets();
        drawShip();
        drawParticles();
    }

    // ============================================
    // GAME LOOP
    // ============================================
    
    let lastTime = 0;
    
    function gameLoop(currentTime = 0) {
        if (!gameState.isRunning) {
            animationId = null;
            return;
        }
        
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        // Update
        updateShip(deltaTime);
        updateBullets();
        updateAsteroids();
        updateParticles();
        checkCollisions();
        
        // Render
        render();
        
        // Continue loop
        animationId = requestAnimationFrame(gameLoop);
    }

    // ============================================
    // START APPLICATION
    // ============================================
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
