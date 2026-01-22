/**
 * Flappy Bird Game
 * A responsive, mobile-friendly arcade game
 */

(function() {
    'use strict';

    // ==================== DOM Elements ====================
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score');
    const highScoreDisplay = document.getElementById('high-score');
    const gameOverlay = document.getElementById('game-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayMessage = document.getElementById('overlay-message');
    const finalScoreEl = document.getElementById('final-score');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const pauseBtn = document.getElementById('pause-btn');

    // ==================== Game Constants ====================
    const GAME_CONFIG = {
        // Base dimensions (will be scaled) - wider aspect ratio
        BASE_WIDTH: 500,
        BASE_HEIGHT: 600,
        
        // Physics - easier gravity and gentler jump
        GRAVITY: 0.35,
        JUMP_FORCE: -7,
        
        // Bird - smaller size
        BIRD_SIZE_RATIO: 0.055,
        BIRD_X_RATIO: 0.2,
        
        // Pipes - bigger gaps, slower speed, more time between pipes
        PIPE_WIDTH_RATIO: 0.12,
        PIPE_GAP_RATIO: 0.35,
        PIPE_SPEED_RATIO: 0.004,
        PIPE_SPAWN_INTERVAL: 2200,
        MIN_PIPE_HEIGHT_RATIO: 0.15,
        MAX_PIPE_HEIGHT_RATIO: 0.55,
        
        // Colors
        SKY_GRADIENT: ['#87CEEB', '#4A90D9', '#2E5A88'],
        GROUND_COLOR: '#8B7355',
        GROUND_GRASS: '#7CB342',
        PIPE_COLOR: '#4CAF50',
        PIPE_BORDER: '#2E7D32',
        BIRD_BODY: '#FFD700',
        BIRD_WING: '#FFA000',
        BIRD_EYE: '#000000',
        BIRD_BEAK: '#FF5722'
    };

    // ==================== Game State ====================
    let gameState = {
        isRunning: false,
        isGameOver: false,
        isPaused: false,
        score: 0,
        highScore: parseInt(localStorage.getItem('flappyHighScore')) || 0,
        
        // Dimensions (updated on resize)
        width: 0,
        height: 0,
        scale: 1,
        
        // Bird state
        bird: {
            x: 0,
            y: 0,
            size: 0,
            velocity: 0,
            rotation: 0
        },
        
        // Pipes
        pipes: [],
        pipeTimer: 0,
        lastFrameTime: 0,
        
        // Animation
        animationId: null,
        wingAngle: 0
    };

    // ==================== Initialization ====================
    function init() {
        updateHighScoreDisplay();
        resizeCanvas();
        resetGame();
        drawGame();
        setupEventListeners();
        pauseBtn.classList.add('hidden');
    }

    function resizeCanvas() {
        const container = canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        // Calculate available space
        const availableWidth = containerRect.width - 20;
        const availableHeight = containerRect.height - 20;
        
        // Maintain aspect ratio
        const aspectRatio = GAME_CONFIG.BASE_WIDTH / GAME_CONFIG.BASE_HEIGHT;
        
        let canvasWidth, canvasHeight;
        
        if (availableWidth / availableHeight > aspectRatio) {
            // Height is limiting factor
            canvasHeight = availableHeight;
            canvasWidth = canvasHeight * aspectRatio;
        } else {
            // Width is limiting factor
            canvasWidth = availableWidth;
            canvasHeight = canvasWidth / aspectRatio;
        }
        
        // Set canvas size
        canvas.width = Math.floor(canvasWidth);
        canvas.height = Math.floor(canvasHeight);
        
        // Update game state dimensions
        gameState.width = canvas.width;
        gameState.height = canvas.height;
        gameState.scale = canvas.height / GAME_CONFIG.BASE_HEIGHT;
        
        // Update bird size and position
        gameState.bird.size = gameState.height * GAME_CONFIG.BIRD_SIZE_RATIO;
        gameState.bird.x = gameState.width * GAME_CONFIG.BIRD_X_RATIO;
        
        // If not running, reset bird position
        if (!gameState.isRunning) {
            gameState.bird.y = gameState.height / 2;
        }
        
        // Redraw if not running
        if (!gameState.isRunning) {
            drawGame();
        }
    }

    function resetGame() {
        gameState.score = 0;
        gameState.isGameOver = false;
        gameState.pipes = [];
        gameState.pipeTimer = 0;
        
        // Reset bird
        gameState.bird.y = gameState.height / 2;
        gameState.bird.velocity = 0;
        gameState.bird.rotation = 0;
        
        updateScoreDisplay();
    }

    // ==================== Event Listeners ====================
    function setupEventListeners() {
        // Resize handler
        window.addEventListener('resize', debounce(resizeCanvas, 100));
        window.addEventListener('orientationchange', () => {
            setTimeout(resizeCanvas, 100);
        });
        
        // Start button
        startBtn.addEventListener('click', startGame);
        startBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            startGame();
        });
        
        // Restart button
        restartBtn.addEventListener('click', restartGame);
        restartBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            restartGame();
        });
        
        // Pause button
        pauseBtn.addEventListener('click', togglePause);
        pauseBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            togglePause();
        });
        
        // Resume button
        resumeBtn.addEventListener('click', togglePause);
        resumeBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            togglePause();
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                if (gameState.isPaused) {
                    togglePause(); // Resume if paused
                } else if (!gameState.isRunning && !gameState.isGameOver) {
                    startGame();
                } else if (gameState.isGameOver) {
                    restartGame();
                } else {
                    handleFlap();
                }
            }
            // Escape or P to pause/resume
            if ((e.code === 'Escape' || e.code === 'KeyP') && gameState.isRunning && !gameState.isGameOver) {
                e.preventDefault();
                togglePause();
            }
        });
        
        // Overlay click/touch to resume when paused
        gameOverlay.addEventListener('click', handleOverlayClick);
        gameOverlay.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleOverlayClick();
        });
        
        // Canvas click/touch
        canvas.addEventListener('click', handleCanvasInteraction);
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleCanvasInteraction();
        });
    }

    function handleCanvasInteraction() {
        if (!gameState.isRunning && !gameState.isGameOver) {
            startGame();
        } else if (gameState.isRunning && !gameState.isPaused) {
            handleFlap();
        } else if (gameState.isPaused) {
            togglePause();
        }
    }

    function handleOverlayClick(e) {
        // Don't handle if clicking on buttons
        if (e && e.target && (e.target.tagName === 'BUTTON' || e.target.closest('button'))) {
            return;
        }
        // Resume if paused
        if (gameState.isPaused) {
            togglePause();
        }
    }

    function handleFlap() {
        if (gameState.isRunning && !gameState.isGameOver && !gameState.isPaused) {
            gameState.bird.velocity = GAME_CONFIG.JUMP_FORCE * gameState.scale;
        }
    }

    function togglePause() {
        if (!gameState.isRunning || gameState.isGameOver) return;
        
        gameState.isPaused = !gameState.isPaused;
        
        if (gameState.isPaused) {
            // Show pause overlay
            pauseBtn.textContent = '▶';
            overlayTitle.textContent = 'Paused';
            overlayMessage.textContent = '';
            finalScoreEl.classList.add('hidden');
            startBtn.classList.add('hidden');
            restartBtn.classList.add('hidden');
            resumeBtn.classList.remove('hidden');
            gameOverlay.classList.remove('hidden');
            cancelAnimationFrame(gameState.animationId);
        } else {
            // Resume game
            pauseBtn.textContent = '⏸';
            resumeBtn.classList.add('hidden');
            gameOverlay.classList.add('hidden');
            gameState.lastFrameTime = performance.now();
            gameLoop();
        }
    }

    // ==================== Game Loop ====================
    function startGame() {
        if (gameState.isRunning) return;
        
        resetGame();
        gameState.isRunning = true;
        gameState.isPaused = false;
        gameOverlay.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
        pauseBtn.textContent = '⏸';
        gameState.lastFrameTime = performance.now();
        
        // Initial pipe after delay
        setTimeout(() => {
            if (gameState.isRunning && !gameState.isPaused) {
                spawnPipe();
            }
        }, 1200);
        
        gameLoop();
    }

    function restartGame() {
        gameOverlay.classList.add('hidden');
        startBtn.classList.add('hidden');
        restartBtn.classList.add('hidden');
        finalScoreEl.classList.add('hidden');
        startGame();
    }

    function gameLoop(currentTime = performance.now()) {
        if (!gameState.isRunning || gameState.isPaused) return;
        
        const deltaTime = (currentTime - gameState.lastFrameTime) / 16.67; // Normalize to 60fps
        gameState.lastFrameTime = currentTime;
        
        update(deltaTime);
        drawGame();
        
        if (!gameState.isGameOver && !gameState.isPaused) {
            gameState.animationId = requestAnimationFrame(gameLoop);
        }
    }

    function update(deltaTime) {
        const dt = Math.min(deltaTime, 3); // Cap delta time to prevent huge jumps
        
        // Update bird
        updateBird(dt);
        
        // Update pipes
        updatePipes(dt);
        
        // Check collisions
        checkCollisions();
        
        // Spawn pipes
        gameState.pipeTimer += 16.67 * dt;
        if (gameState.pipeTimer >= GAME_CONFIG.PIPE_SPAWN_INTERVAL) {
            spawnPipe();
            gameState.pipeTimer = 0;
        }
        
        // Update wing animation
        gameState.wingAngle += 0.3 * dt;
    }

    function updateBird(dt) {
        // Apply gravity
        gameState.bird.velocity += GAME_CONFIG.GRAVITY * gameState.scale * dt;
        gameState.bird.y += gameState.bird.velocity * dt;
        
        // Calculate rotation based on velocity
        const targetRotation = Math.min(Math.max(gameState.bird.velocity * 3, -30), 90);
        gameState.bird.rotation += (targetRotation - gameState.bird.rotation) * 0.1 * dt;
        
        // Ceiling collision
        if (gameState.bird.y < gameState.bird.size / 2) {
            gameState.bird.y = gameState.bird.size / 2;
            gameState.bird.velocity = 0;
        }
    }

    function updatePipes(dt) {
        const pipeSpeed = gameState.width * GAME_CONFIG.PIPE_SPEED_RATIO * dt;
        
        for (let i = gameState.pipes.length - 1; i >= 0; i--) {
            const pipe = gameState.pipes[i];
            pipe.x -= pipeSpeed;
            
            // Score when bird passes pipe
            if (!pipe.passed && pipe.x + pipe.width < gameState.bird.x) {
                pipe.passed = true;
                gameState.score++;
                updateScoreDisplay();
                animateScore();
            }
            
            // Remove off-screen pipes
            if (pipe.x + pipe.width < 0) {
                gameState.pipes.splice(i, 1);
            }
        }
    }

    function spawnPipe() {
        const pipeWidth = gameState.width * GAME_CONFIG.PIPE_WIDTH_RATIO;
        const pipeGap = gameState.height * GAME_CONFIG.PIPE_GAP_RATIO;
        const groundHeight = gameState.height * 0.1;
        
        // Ensure pipes are always passable with comfortable margins
        const minTopHeight = gameState.height * GAME_CONFIG.MIN_PIPE_HEIGHT_RATIO;
        const maxTopHeight = gameState.height * GAME_CONFIG.MAX_PIPE_HEIGHT_RATIO;
        
        // Calculate top pipe height with safety margins
        const topHeight = minTopHeight + Math.random() * (maxTopHeight - minTopHeight);
        const bottomY = topHeight + pipeGap;
        
        // Verify gap is above ground
        if (bottomY + minTopHeight > gameState.height - groundHeight) {
            // Adjust if too low
            const adjustedTopHeight = gameState.height - groundHeight - pipeGap - minTopHeight;
            gameState.pipes.push({
                x: gameState.width,
                topHeight: Math.max(minTopHeight, adjustedTopHeight),
                bottomY: Math.max(minTopHeight, adjustedTopHeight) + pipeGap,
                width: pipeWidth,
                gap: pipeGap,
                passed: false
            });
        } else {
            gameState.pipes.push({
                x: gameState.width,
                topHeight: topHeight,
                bottomY: bottomY,
                width: pipeWidth,
                gap: pipeGap,
                passed: false
            });
        }
    }

    function checkCollisions() {
        const bird = gameState.bird;
        const birdRadius = bird.size / 2 * 0.7; // Smaller hitbox for fairness
        
        // Ground collision
        const groundHeight = gameState.height * 0.1;
        if (bird.y + birdRadius > gameState.height - groundHeight) {
            endGame();
            return;
        }
        
        // Pipe collisions
        for (const pipe of gameState.pipes) {
            // Check if bird is in pipe's x range
            if (bird.x + birdRadius > pipe.x && bird.x - birdRadius < pipe.x + pipe.width) {
                // Check top pipe collision
                if (bird.y - birdRadius < pipe.topHeight) {
                    endGame();
                    return;
                }
                // Check bottom pipe collision
                if (bird.y + birdRadius > pipe.bottomY) {
                    endGame();
                    return;
                }
            }
        }
    }

    function endGame() {
        gameState.isGameOver = true;
        gameState.isRunning = false;
        gameState.isPaused = false;
        
        // Hide pause button
        pauseBtn.classList.add('hidden');
        
        // Update high score
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('flappyHighScore', gameState.highScore);
            updateHighScoreDisplay();
        }
        
        // Show game over overlay
        showGameOver();
    }

    function showGameOver() {
        overlayTitle.textContent = 'Game Over!';
        overlayMessage.textContent = '';
        finalScoreEl.textContent = `Final Score: ${gameState.score}`;
        finalScoreEl.classList.remove('hidden');
        startBtn.classList.add('hidden');
        restartBtn.classList.remove('hidden');
        gameOverlay.classList.remove('hidden');
    }

    // ==================== Drawing ====================
    function drawGame() {
        // Clear canvas
        ctx.clearRect(0, 0, gameState.width, gameState.height);
        
        // Draw background
        drawBackground();
        
        // Draw pipes
        drawPipes();
        
        // Draw ground
        drawGround();
        
        // Draw bird
        drawBird();
    }

    function drawBackground() {
        const gradient = ctx.createLinearGradient(0, 0, 0, gameState.height);
        gradient.addColorStop(0, GAME_CONFIG.SKY_GRADIENT[0]);
        gradient.addColorStop(0.5, GAME_CONFIG.SKY_GRADIENT[1]);
        gradient.addColorStop(1, GAME_CONFIG.SKY_GRADIENT[2]);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, gameState.width, gameState.height);
        
        // Draw clouds
        drawClouds();
    }

    function drawClouds() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        const cloudPositions = [
            { x: 0.1, y: 0.15, size: 0.08 },
            { x: 0.4, y: 0.1, size: 0.1 },
            { x: 0.7, y: 0.2, size: 0.07 },
            { x: 0.85, y: 0.12, size: 0.09 }
        ];
        
        cloudPositions.forEach(cloud => {
            const x = gameState.width * cloud.x;
            const y = gameState.height * cloud.y;
            const size = gameState.height * cloud.size;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.arc(x + size * 0.8, y, size * 0.7, 0, Math.PI * 2);
            ctx.arc(x - size * 0.6, y, size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function drawGround() {
        const groundHeight = gameState.height * 0.1;
        const groundY = gameState.height - groundHeight;
        
        // Grass layer
        ctx.fillStyle = GAME_CONFIG.GROUND_GRASS;
        ctx.fillRect(0, groundY, gameState.width, groundHeight * 0.3);
        
        // Dirt layer
        ctx.fillStyle = GAME_CONFIG.GROUND_COLOR;
        ctx.fillRect(0, groundY + groundHeight * 0.3, gameState.width, groundHeight * 0.7);
        
        // Ground line
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2 * gameState.scale;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(gameState.width, groundY);
        ctx.stroke();
    }

    function drawPipes() {
        gameState.pipes.forEach(pipe => {
            const capHeight = 20 * gameState.scale;
            const capOverhang = 5 * gameState.scale;
            
            // Top pipe body
            ctx.fillStyle = GAME_CONFIG.PIPE_COLOR;
            ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight - capHeight);
            
            // Top pipe cap
            ctx.fillRect(
                pipe.x - capOverhang,
                pipe.topHeight - capHeight,
                pipe.width + capOverhang * 2,
                capHeight
            );
            
            // Bottom pipe body
            const bottomHeight = gameState.height - pipe.bottomY - gameState.height * 0.1;
            ctx.fillRect(pipe.x, pipe.bottomY + capHeight, pipe.width, bottomHeight);
            
            // Bottom pipe cap
            ctx.fillRect(
                pipe.x - capOverhang,
                pipe.bottomY,
                pipe.width + capOverhang * 2,
                capHeight
            );
            
            // Pipe borders
            ctx.strokeStyle = GAME_CONFIG.PIPE_BORDER;
            ctx.lineWidth = 3 * gameState.scale;
            
            // Top pipe border
            ctx.strokeRect(pipe.x, 0, pipe.width, pipe.topHeight - capHeight);
            ctx.strokeRect(
                pipe.x - capOverhang,
                pipe.topHeight - capHeight,
                pipe.width + capOverhang * 2,
                capHeight
            );
            
            // Bottom pipe border
            ctx.strokeRect(pipe.x, pipe.bottomY + capHeight, pipe.width, bottomHeight);
            ctx.strokeRect(
                pipe.x - capOverhang,
                pipe.bottomY,
                pipe.width + capOverhang * 2,
                capHeight
            );
            
            // Pipe highlights
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(pipe.x + 5 * gameState.scale, 0, 8 * gameState.scale, pipe.topHeight - capHeight);
            ctx.fillRect(pipe.x + 5 * gameState.scale, pipe.bottomY + capHeight, 8 * gameState.scale, bottomHeight);
        });
    }

    function drawBird() {
        const { x, y, size, rotation } = gameState.bird;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation * Math.PI / 180);
        
        // Body
        ctx.fillStyle = GAME_CONFIG.BIRD_BODY;
        ctx.beginPath();
        ctx.ellipse(0, 0, size / 2, size / 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body outline
        ctx.strokeStyle = '#E6A700';
        ctx.lineWidth = 2 * gameState.scale;
        ctx.stroke();
        
        // Wing
        const wingOffset = Math.sin(gameState.wingAngle) * size * 0.15;
        ctx.fillStyle = GAME_CONFIG.BIRD_WING;
        ctx.beginPath();
        ctx.ellipse(-size * 0.1, wingOffset, size / 4, size / 6, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#E68A00';
        ctx.stroke();
        
        // Eye white
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(size * 0.15, -size * 0.1, size * 0.18, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye pupil
        ctx.fillStyle = GAME_CONFIG.BIRD_EYE;
        ctx.beginPath();
        ctx.arc(size * 0.2, -size * 0.1, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye highlight
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(size * 0.22, -size * 0.14, size * 0.03, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = GAME_CONFIG.BIRD_BEAK;
        ctx.beginPath();
        ctx.moveTo(size * 0.3, 0);
        ctx.lineTo(size * 0.55, size * 0.05);
        ctx.lineTo(size * 0.3, size * 0.15);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    // ==================== UI Updates ====================
    function updateScoreDisplay() {
        scoreDisplay.textContent = gameState.score;
    }

    function updateHighScoreDisplay() {
        highScoreDisplay.textContent = gameState.highScore;
    }

    function animateScore() {
        scoreDisplay.classList.remove('score-pop');
        void scoreDisplay.offsetWidth; // Trigger reflow
        scoreDisplay.classList.add('score-pop');
    }

    // ==================== Utilities ====================
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ==================== Start Game ====================
    init();
})();
