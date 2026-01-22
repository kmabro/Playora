(() => {
    'use strict';

    // ===== CONSTANTS =====
    const STORAGE_KEY = 'avoidBlocksHighScore';
    const PLAYER_COLORS = {
        body: '#00ff88',
        bodyGradient: '#00cc66',
        head: '#00ffaa',
        headHighlight: '#66ffcc',
        glow: 'rgba(0, 255, 136, 0.7)',
        outline: '#00aa55'
    };

    // Movement constants - normalized base speed (pixels per second at 1000px reference)
    const BASE_SPEED = 400; // pixels per second at reference size
    const REFERENCE_SIZE = 1000; // reference canvas dimension
    const ACCELERATION = 0.15; // velocity lerp factor (0-1)
    const DECELERATION = 0.12; // velocity decay when no input
    const MAX_TILT_ANGLE = 15; // degrees

    // ===== GAME STATE =====
    const gameState = {
        canvas: null,
        ctx: null,
        player: {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            velocityX: 0,
            velocityY: 0,
            targetVelocityX: 0,
            targetVelocityY: 0,
            tilt: 0, // current tilt angle
            targetTilt: 0 // target tilt angle
        },
        blocks: [],
        score: 0,
        highScore: 0,
        isPlaying: false,
        isPaused: false,
        gameLoopId: null,
        lastTime: 0,
        blockSpawnTimer: 0,
        blockSpawnInterval: 1200,
        minBlockSpawnInterval: 350,
        gameSpeed: 1,
        maxGameSpeed: 2.8,
        speedIncreaseRate: 0.00004,
        // Input state
        keys: {
            left: false,
            right: false,
            up: false,
            down: false
        },
        // Touch/joystick state
        touch: {
            isActive: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            deltaX: 0,
            deltaY: 0
        },
        // Scaling factor for movement
        speedScale: 1
    };

    // ===== DOM ELEMENTS =====
    const elements = {
        canvas: document.getElementById('gameCanvas'),
        scoreDisplay: document.getElementById('scoreDisplay'),
        highScoreDisplay: document.getElementById('highScoreDisplay'),
        finalScore: document.getElementById('finalScore'),
        startScreen: document.getElementById('startScreen'),
        gameOverScreen: document.getElementById('gameOverScreen'),
        startBtn: document.getElementById('startBtn'),
        restartBtn: document.getElementById('restartBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        pauseIcon: document.getElementById('pauseIcon'),
        pauseOverlay: document.getElementById('pauseOverlay'),
        newHighScore: document.getElementById('newHighScore'),
        startHighScore: document.getElementById('startHighScore')
    };

    // ===== INITIALIZATION =====
    function init() {
        gameState.canvas = elements.canvas;
        gameState.ctx = gameState.canvas.getContext('2d');
        
        loadHighScore();
        resizeCanvas();
        setupEventListeners();
        
        elements.startScreen.classList.remove('hidden');
        elements.gameOverScreen.classList.add('hidden');
        elements.pauseOverlay.classList.add('hidden');
    }

    // ===== HIGH SCORE MANAGEMENT =====
    function loadHighScore() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            gameState.highScore = saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            gameState.highScore = 0;
        }
        updateHighScoreDisplay();
    }

    function saveHighScore() {
        try {
            localStorage.setItem(STORAGE_KEY, gameState.highScore.toString());
        } catch (e) {
            // localStorage not available
        }
    }

    function updateHighScoreDisplay() {
        elements.highScoreDisplay.textContent = gameState.highScore;
        elements.startHighScore.textContent = gameState.highScore;
    }

    // ===== CANVAS RESIZE =====
    function resizeCanvas() {
        const container = gameState.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Use actual pixel dimensions for sharp rendering
        const dpr = window.devicePixelRatio || 1;
        gameState.canvas.width = rect.width * dpr;
        gameState.canvas.height = rect.height * dpr;
        
        // Reset and scale context for DPR
        gameState.ctx.setTransform(1, 0, 0, 1, 0, 0);
        gameState.ctx.scale(dpr, dpr);
        
        // Store logical dimensions
        gameState.canvasWidth = rect.width;
        gameState.canvasHeight = rect.height;
        
        // Calculate speed scaling factor based on canvas size
        // This ensures movement feels the same on all screen sizes
        const avgDimension = (rect.width + rect.height) / 2;
        gameState.speedScale = avgDimension / REFERENCE_SIZE;
        
        // Update player dimensions based on canvas size
        const minDimension = Math.min(rect.width, rect.height);
        gameState.player.width = Math.max(minDimension * 0.07, 28);
        gameState.player.height = Math.max(minDimension * 0.11, 44);
        
        // Keep player within bounds after resize
        const p = gameState.player;
        if (p.x === 0 || p.x + p.width > rect.width) {
            p.x = (rect.width - p.width) / 2;
        }
        
        // Clamp Y position - allow more vertical movement space
        const minY = rect.height * 0.3;
        const maxY = rect.height - p.height - (rect.height * 0.02);
        if (p.y === 0 || p.y < minY || p.y > maxY) {
            p.y = maxY;
        }
        
        // Re-render if paused
        if (gameState.isPlaying && gameState.isPaused) {
            render();
        }
    }

    // ===== EVENT LISTENERS =====
    function setupEventListeners() {
        // Window resize with debounce
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                resizeCanvas();
                if (!gameState.isPlaying || gameState.isPaused) {
                    render();
                }
            }, 50);
        });

        // Orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(resizeCanvas, 200);
        });

        // Buttons
        elements.startBtn.addEventListener('click', startGame);
        elements.restartBtn.addEventListener('click', restartGame);
        elements.pauseBtn.addEventListener('click', togglePause);

        // Keyboard controls - track key state only
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Touch controls (virtual joystick style)
        gameState.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        gameState.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        gameState.canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        gameState.canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

        // Mouse controls (also joystick style)
        gameState.canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    // ===== KEYBOARD HANDLERS =====
    function handleKeyDown(e) {
        // Track arrow keys state
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                gameState.keys.left = true;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                gameState.keys.right = true;
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                e.preventDefault();
                gameState.keys.up = true;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                gameState.keys.down = true;
                break;
            case 'Escape':
            case 'p':
            case 'P':
                if (gameState.isPlaying) {
                    togglePause();
                }
                break;
        }
    }

    function handleKeyUp(e) {
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                gameState.keys.left = false;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                gameState.keys.right = false;
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                gameState.keys.up = false;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                gameState.keys.down = false;
                break;
        }
    }

    // ===== TOUCH HANDLERS (Virtual Joystick) =====
    function handleTouchStart(e) {
        e.preventDefault();
        if (!gameState.isPlaying || gameState.isPaused) return;
        
        const touch = e.touches[0];
        gameState.touch.isActive = true;
        gameState.touch.startX = touch.clientX;
        gameState.touch.startY = touch.clientY;
        gameState.touch.currentX = touch.clientX;
        gameState.touch.currentY = touch.clientY;
        gameState.touch.deltaX = 0;
        gameState.touch.deltaY = 0;
    }

    function handleTouchMove(e) {
        e.preventDefault();
        if (!gameState.isPlaying || gameState.isPaused || !gameState.touch.isActive) return;
        
        const touch = e.touches[0];
        gameState.touch.currentX = touch.clientX;
        gameState.touch.currentY = touch.clientY;
        
        // Calculate delta from start position (relative movement)
        gameState.touch.deltaX = touch.clientX - gameState.touch.startX;
        gameState.touch.deltaY = touch.clientY - gameState.touch.startY;
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        gameState.touch.isActive = false;
        gameState.touch.deltaX = 0;
        gameState.touch.deltaY = 0;
    }

    // ===== MOUSE HANDLERS (Virtual Joystick) =====
    function handleMouseDown(e) {
        if (!gameState.isPlaying || gameState.isPaused) return;
        
        gameState.touch.isActive = true;
        gameState.touch.startX = e.clientX;
        gameState.touch.startY = e.clientY;
        gameState.touch.currentX = e.clientX;
        gameState.touch.currentY = e.clientY;
        gameState.touch.deltaX = 0;
        gameState.touch.deltaY = 0;
    }

    function handleMouseMove(e) {
        if (!gameState.isPlaying || gameState.isPaused || !gameState.touch.isActive) return;
        
        gameState.touch.currentX = e.clientX;
        gameState.touch.currentY = e.clientY;
        
        // Calculate delta from start position
        gameState.touch.deltaX = e.clientX - gameState.touch.startX;
        gameState.touch.deltaY = e.clientY - gameState.touch.startY;
    }

    function handleMouseUp() {
        gameState.touch.isActive = false;
        gameState.touch.deltaX = 0;
        gameState.touch.deltaY = 0;
    }

    // ===== PAUSE CONTROL =====
    function togglePause() {
        if (!gameState.isPlaying) return;
        
        gameState.isPaused = !gameState.isPaused;
        
        if (gameState.isPaused) {
            elements.pauseIcon.textContent = '▶';
            elements.pauseOverlay.classList.remove('hidden');
            if (gameState.gameLoopId) {
                cancelAnimationFrame(gameState.gameLoopId);
                gameState.gameLoopId = null;
            }
        } else {
            elements.pauseIcon.textContent = '❚❚';
            elements.pauseOverlay.classList.add('hidden');
            gameState.lastTime = performance.now();
            gameLoop(gameState.lastTime);
        }
    }

    // ===== GAME CONTROL =====
    function startGame() {
        elements.startScreen.classList.add('hidden');
        resetGame();
        gameState.isPlaying = true;
        gameState.lastTime = performance.now();
        gameLoop(gameState.lastTime);
    }

    function restartGame() {
        elements.gameOverScreen.classList.add('hidden');
        elements.newHighScore.classList.add('hidden');
        resetGame();
        gameState.isPlaying = true;
        gameState.lastTime = performance.now();
        gameLoop(gameState.lastTime);
    }

    function resetGame() {
        gameState.blocks = [];
        gameState.score = 0;
        gameState.gameSpeed = 1;
        gameState.blockSpawnTimer = 0;
        gameState.blockSpawnInterval = 1200;
        gameState.isPaused = false;
        
        // Reset input state
        gameState.keys = { left: false, right: false, up: false, down: false };
        gameState.touch = {
            isActive: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            deltaX: 0,
            deltaY: 0
        };
        
        // Reset player velocity and tilt
        gameState.player.velocityX = 0;
        gameState.player.velocityY = 0;
        gameState.player.targetVelocityX = 0;
        gameState.player.targetVelocityY = 0;
        gameState.player.tilt = 0;
        gameState.player.targetTilt = 0;
        
        elements.pauseIcon.textContent = '❚❚';
        elements.pauseOverlay.classList.add('hidden');
        
        resizeCanvas();
        updateScore();
        
        if (gameState.gameLoopId) {
            cancelAnimationFrame(gameState.gameLoopId);
            gameState.gameLoopId = null;
        }
    }

    function gameOver() {
        gameState.isPlaying = false;
        
        // Check for new high score
        const isNewHighScore = gameState.score > gameState.highScore;
        if (isNewHighScore) {
            gameState.highScore = gameState.score;
            saveHighScore();
            updateHighScoreDisplay();
            elements.newHighScore.classList.remove('hidden');
        } else {
            elements.newHighScore.classList.add('hidden');
        }
        
        elements.finalScore.textContent = gameState.score;
        elements.gameOverScreen.classList.remove('hidden');
        
        if (gameState.gameLoopId) {
            cancelAnimationFrame(gameState.gameLoopId);
            gameState.gameLoopId = null;
        }
    }

    // ===== GAME LOOP =====
    function gameLoop(timestamp) {
        if (!gameState.isPlaying || gameState.isPaused) return;
        
        const deltaTime = Math.min(timestamp - gameState.lastTime, 50);
        gameState.lastTime = timestamp;

        update(deltaTime);
        render();

        gameState.gameLoopId = requestAnimationFrame(gameLoop);
    }

    // ===== UPDATE =====
    function update(deltaTime) {
        const dt = deltaTime / 1000; // Convert to seconds
        const p = gameState.player;
        
        // Calculate base speed scaled for screen size
        const scaledSpeed = BASE_SPEED * gameState.speedScale * gameState.gameSpeed;
        
        // ===== PROCESS INPUT =====
        let inputX = 0;
        let inputY = 0;
        
        // Keyboard input
        if (gameState.keys.left) inputX -= 1;
        if (gameState.keys.right) inputX += 1;
        if (gameState.keys.up) inputY -= 1;
        if (gameState.keys.down) inputY += 1;
        
        // Touch/mouse input (virtual joystick)
        if (gameState.touch.isActive) {
            const sensitivity = 0.02; // How fast the character follows drag
            const maxDelta = 100; // Maximum drag distance for full speed
            
            // Normalize touch delta
            const normalizedDeltaX = Math.max(-1, Math.min(1, gameState.touch.deltaX / maxDelta));
            const normalizedDeltaY = Math.max(-1, Math.min(1, gameState.touch.deltaY / maxDelta));
            
            inputX += normalizedDeltaX;
            inputY += normalizedDeltaY;
        }
        
        // Clamp combined input to prevent diagonal speed boost
        const inputMagnitude = Math.sqrt(inputX * inputX + inputY * inputY);
        if (inputMagnitude > 1) {
            inputX /= inputMagnitude;
            inputY /= inputMagnitude;
        }
        
        // ===== CALCULATE TARGET VELOCITY =====
        p.targetVelocityX = inputX * scaledSpeed;
        p.targetVelocityY = inputY * scaledSpeed;
        
        // ===== SMOOTH VELOCITY INTERPOLATION =====
        const accel = inputMagnitude > 0 ? ACCELERATION : DECELERATION;
        p.velocityX = lerp(p.velocityX, p.targetVelocityX, accel);
        p.velocityY = lerp(p.velocityY, p.targetVelocityY, accel);
        
        // Apply small threshold to stop tiny movements
        if (Math.abs(p.velocityX) < 0.5) p.velocityX = 0;
        if (Math.abs(p.velocityY) < 0.5) p.velocityY = 0;
        
        // ===== UPDATE POSITION =====
        p.x += p.velocityX * dt;
        p.y += p.velocityY * dt;
        
        // ===== CLAMP TO BOUNDS =====
        const minY = gameState.canvasHeight * 0.3;
        const maxY = gameState.canvasHeight - p.height - (gameState.canvasHeight * 0.02);
        
        p.x = Math.max(0, Math.min(gameState.canvasWidth - p.width, p.x));
        p.y = Math.max(minY, Math.min(maxY, p.y));
        
        // ===== CALCULATE TILT =====
        // Tilt based on horizontal velocity
        const maxVel = scaledSpeed;
        p.targetTilt = (p.velocityX / maxVel) * MAX_TILT_ANGLE;
        p.tilt = lerp(p.tilt, p.targetTilt, 0.15);
        
        // ===== SPAWN BLOCKS =====
        gameState.blockSpawnTimer += deltaTime;
        if (gameState.blockSpawnTimer >= gameState.blockSpawnInterval) {
            spawnBlock();
            gameState.blockSpawnTimer = 0;
        }

        // ===== UPDATE BLOCKS =====
        for (let i = gameState.blocks.length - 1; i >= 0; i--) {
            const block = gameState.blocks[i];
            block.y += block.speed * gameState.gameSpeed * (deltaTime / 16);

            // Check collision with player hitbox
            const playerHitbox = {
                x: p.x + p.width * 0.15,
                y: p.y + p.height * 0.1,
                width: p.width * 0.7,
                height: p.height * 0.85
            };

            if (checkCollision(playerHitbox, block)) {
                gameOver();
                return;
            }

            // Remove blocks off screen
            if (block.y > gameState.canvasHeight) {
                gameState.blocks.splice(i, 1);
                gameState.score += 10;
                updateScore();
            }
        }

        // ===== INCREASE DIFFICULTY =====
        gameState.gameSpeed = Math.min(
            gameState.gameSpeed + (gameState.speedIncreaseRate * deltaTime),
            gameState.maxGameSpeed
        );
        
        gameState.blockSpawnInterval = Math.max(
            1200 - (gameState.score * 1.5),
            gameState.minBlockSpawnInterval
        );
    }

    // ===== LINEAR INTERPOLATION =====
    function lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // ===== RENDER =====
    function render() {
        const ctx = gameState.ctx;
        const width = gameState.canvasWidth;
        const height = gameState.canvasHeight;
        
        // Clear canvas
        ctx.fillStyle = '#0a0a15';
        ctx.fillRect(0, 0, width, height);

        // Draw subtle grid pattern
        drawGrid(ctx, width, height);

        // Draw blocks with glow
        gameState.blocks.forEach(block => {
            ctx.shadowBlur = 25;
            ctx.shadowColor = block.color;
            ctx.fillStyle = block.color;
            
            // Rounded rectangle for blocks
            drawRoundedRect(ctx, block.x, block.y, block.width, block.height, 4);
            ctx.fill();
            
            // Inner highlight
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fillRect(block.x + 3, block.y + 3, block.width - 6, 4);
        });
        ctx.shadowBlur = 0;

        // Draw virtual joystick indicator if touch active
        if (gameState.touch.isActive) {
            drawJoystickIndicator(ctx);
        }

        // Draw player character
        drawPlayer(ctx);
    }

    function drawGrid(ctx, width, height) {
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.03)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        
        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    function drawRoundedRect(ctx, x, y, width, height, radius) {
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
    }

    function drawJoystickIndicator(ctx) {
        const touch = gameState.touch;
        const rect = gameState.canvas.getBoundingClientRect();
        
        // Convert screen coordinates to canvas coordinates
        const startX = (touch.startX - rect.left) * (gameState.canvasWidth / rect.width);
        const startY = (touch.startY - rect.top) * (gameState.canvasHeight / rect.height);
        const currentX = (touch.currentX - rect.left) * (gameState.canvasWidth / rect.width);
        const currentY = (touch.currentY - rect.top) * (gameState.canvasHeight / rect.height);
        
        // Draw outer ring
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(startX, startY, 50, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw inner dot at current position (clamped)
        const dx = currentX - startX;
        const dy = currentY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 50;
        
        let dotX = currentX;
        let dotY = currentY;
        if (dist > maxDist) {
            dotX = startX + (dx / dist) * maxDist;
            dotY = startY + (dy / dist) * maxDist;
        }
        
        ctx.fillStyle = 'rgba(0, 255, 136, 0.6)';
        ctx.beginPath();
        ctx.arc(dotX, dotY, 15, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawPlayer(ctx) {
        const p = gameState.player;
        const centerX = p.x + p.width / 2;
        const centerY = p.y + p.height / 2;
        
        // Save context for rotation
        ctx.save();
        
        // Apply tilt rotation around player center
        ctx.translate(centerX, centerY);
        ctx.rotate((p.tilt * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
        
        // ===== ENHANCED CHARACTER DRAWING =====
        
        // Glow effect
        ctx.shadowBlur = 35;
        ctx.shadowColor = PLAYER_COLORS.glow;
        
        // --- BODY (rounded trapezoid) ---
        const bodyTop = p.y + p.height * 0.32;
        const bodyBottom = p.y + p.height;
        const bodyTopWidth = p.width * 0.45;
        const bodyBottomWidth = p.width * 0.65;
        
        // Body gradient
        const bodyGrad = ctx.createLinearGradient(centerX - bodyBottomWidth/2, bodyTop, centerX + bodyBottomWidth/2, bodyTop);
        bodyGrad.addColorStop(0, PLAYER_COLORS.bodyGradient);
        bodyGrad.addColorStop(0.5, PLAYER_COLORS.body);
        bodyGrad.addColorStop(1, PLAYER_COLORS.bodyGradient);
        
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(centerX - bodyTopWidth / 2, bodyTop);
        ctx.lineTo(centerX + bodyTopWidth / 2, bodyTop);
        ctx.lineTo(centerX + bodyBottomWidth / 2, bodyBottom - 5);
        ctx.quadraticCurveTo(centerX + bodyBottomWidth / 2, bodyBottom, centerX + bodyBottomWidth / 2 - 5, bodyBottom);
        ctx.lineTo(centerX - bodyBottomWidth / 2 + 5, bodyBottom);
        ctx.quadraticCurveTo(centerX - bodyBottomWidth / 2, bodyBottom, centerX - bodyBottomWidth / 2, bodyBottom - 5);
        ctx.closePath();
        ctx.fill();
        
        // Body highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.moveTo(centerX - bodyTopWidth / 2 + 3, bodyTop + 3);
        ctx.lineTo(centerX, bodyTop + 3);
        ctx.lineTo(centerX - bodyBottomWidth / 4, bodyBottom - 10);
        ctx.lineTo(centerX - bodyBottomWidth / 2 + 5, bodyBottom - 10);
        ctx.closePath();
        ctx.fill();
        
        // --- HEAD (circle with gradient) ---
        ctx.shadowBlur = 35;
        ctx.shadowColor = PLAYER_COLORS.glow;
        
        const headRadius = p.width * 0.24;
        const headY = p.y + headRadius + 2;
        
        const headGrad = ctx.createRadialGradient(
            centerX - headRadius * 0.3, headY - headRadius * 0.3, 0,
            centerX, headY, headRadius
        );
        headGrad.addColorStop(0, PLAYER_COLORS.headHighlight);
        headGrad.addColorStop(0.7, PLAYER_COLORS.head);
        headGrad.addColorStop(1, PLAYER_COLORS.body);
        
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(centerX, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // --- ARMS ---
        ctx.shadowBlur = 20;
        const armY = bodyTop + (bodyBottom - bodyTop) * 0.15;
        const armLength = p.width * 0.28;
        const armThickness = Math.max(3, p.width * 0.09);
        
        ctx.strokeStyle = PLAYER_COLORS.body;
        ctx.lineWidth = armThickness;
        ctx.lineCap = 'round';
        
        // Left arm (animated based on tilt)
        const leftArmAngle = 0.5 + (p.tilt / MAX_TILT_ANGLE) * 0.3;
        ctx.beginPath();
        ctx.moveTo(centerX - bodyTopWidth / 2, armY);
        ctx.lineTo(
            centerX - bodyTopWidth / 2 - armLength,
            armY + armLength * leftArmAngle
        );
        ctx.stroke();
        
        // Right arm
        const rightArmAngle = 0.5 - (p.tilt / MAX_TILT_ANGLE) * 0.3;
        ctx.beginPath();
        ctx.moveTo(centerX + bodyTopWidth / 2, armY);
        ctx.lineTo(
            centerX + bodyTopWidth / 2 + armLength,
            armY + armLength * rightArmAngle
        );
        ctx.stroke();
        
        // --- LEGS ---
        const legY = bodyBottom - 8;
        const legLength = 8;
        const legSpacing = p.width * 0.15;
        
        ctx.lineWidth = armThickness * 0.9;
        
        // Left leg
        ctx.beginPath();
        ctx.moveTo(centerX - legSpacing, legY);
        ctx.lineTo(centerX - legSpacing - 3, legY + legLength);
        ctx.stroke();
        
        // Right leg
        ctx.beginPath();
        ctx.moveTo(centerX + legSpacing, legY);
        ctx.lineTo(centerX + legSpacing + 3, legY + legLength);
        ctx.stroke();
        
        // --- FACE ---
        ctx.shadowBlur = 0;
        
        // Eyes
        ctx.fillStyle = '#0a0a15';
        const eyeRadius = headRadius * 0.18;
        const eyeOffsetX = headRadius * 0.38;
        const eyeOffsetY = headRadius * 0.05;
        
        ctx.beginPath();
        ctx.arc(centerX - eyeOffsetX, headY + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + eyeOffsetX, headY + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye highlights
        ctx.fillStyle = '#ffffff';
        const highlightRadius = eyeRadius * 0.4;
        ctx.beginPath();
        ctx.arc(centerX - eyeOffsetX + 1, headY + eyeOffsetY - 1, highlightRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + eyeOffsetX + 1, headY + eyeOffsetY - 1, highlightRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Small smile
        ctx.strokeStyle = '#0a0a15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, headY + headRadius * 0.15, headRadius * 0.35, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        
        // Restore context
        ctx.restore();
    }

    // ===== BLOCK SPAWNING =====
    function spawnBlock() {
        const minWidth = gameState.canvasWidth * 0.06;
        const maxWidth = gameState.canvasWidth * 0.18;
        const width = Math.random() * (maxWidth - minWidth) + minWidth;
        const height = Math.max(gameState.canvasHeight * 0.025, 12);
        
        const x = Math.random() * (gameState.canvasWidth - width);
        const baseSpeed = gameState.canvasHeight * 0.003;
        const speed = baseSpeed + (Math.random() * baseSpeed * 0.4);

        const colors = [
            '#ff3366', '#ff5533', '#ff33aa', 
            '#aa33ff', '#3366ff', '#33aaff'
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];

        gameState.blocks.push({
            x: x,
            y: -height,
            width: width,
            height: height,
            speed: speed,
            color: color
        });
    }

    // ===== COLLISION DETECTION =====
    function checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    // ===== SCORE UPDATE =====
    function updateScore() {
        elements.scoreDisplay.textContent = gameState.score;
    }

    // ===== START APPLICATION =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
