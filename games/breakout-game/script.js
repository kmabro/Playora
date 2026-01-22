/**
 * Breakout Game
 * A classic brick-breaking game built with vanilla JavaScript
 */
(function() {
    'use strict';

    // ==================== DOM Elements ====================
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score');
    const highScoreDisplay = document.getElementById('highScore');
    const livesDisplay = document.getElementById('lives');
    const overlay = document.getElementById('gameOverlay');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlayMessage = document.getElementById('overlayMessage');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');

    // ==================== Game Constants ====================
    const BRICK_ROWS = 4; // Initial rows at start
    const BRICK_COLS = 8;
    const BRICK_PADDING = 0.015; // Percentage of canvas width
    const BRICK_TOP_OFFSET = 0.02; // Percentage of canvas height - very close to top
    const PADDLE_HEIGHT_RATIO = 0.02;
    const PADDLE_WIDTH_RATIO = 0.15;
    const BALL_RADIUS_RATIO = 0.012;
    const INITIAL_BALL_SPEED = 0.006;
    const SPEED_INCREMENT = 0.0001;
    const MAX_BALL_SPEED = 0.012;
    const INITIAL_LIVES = 3;
    const BRICK_DESCENT_SPEED = 0.000004; // 12x slower brick descent
    const BRICK_SPAWN_INTERVAL = 8000; // Spawn new row every 8 seconds

    const BRICK_COLORS = [
        '#ff6b6b', // Red
        '#ffa94d', // Orange
        '#ffd43b', // Yellow
        '#69db7c', // Green
        '#4ecdc4', // Teal
        '#74c0fc'  // Blue
    ];

    // ==================== Audio ====================
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new AudioContext();
        }
    }

    function playSound(frequency, duration, type = 'square') {
        if (!audioCtx) return;
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + duration);
    }

    function playBrickHitSound() {
        playSound(520, 0.1, 'square');
    }

    function playLifeLostSound() {
        playSound(150, 0.3, 'sawtooth');
        setTimeout(() => playSound(100, 0.3, 'sawtooth'), 150);
    }

    function playLevelCompleteSound() {
        playSound(523, 0.1, 'square');
        setTimeout(() => playSound(659, 0.1, 'square'), 100);
        setTimeout(() => playSound(784, 0.2, 'square'), 200);
    }

    // ==================== Game State ====================
    let gameState = {
        score: 0,
        highScore: 0,
        lives: INITIAL_LIVES,
        isRunning: false,
        isPaused: false,
        isGameOver: false,
        ballSpeed: INITIAL_BALL_SPEED,
        bricksDestroyed: 0,
        level: 1,
        lastSpawnTime: 0,
        nextRowColorIndex: 0
    };

    // ==================== Game Objects ====================
    let paddle = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        dx: 0,
        speed: 0.012
    };

    let ball = {
        x: 0,
        y: 0,
        radius: 0,
        dx: 0,
        dy: 0
    };

    let bricks = [];

    // ==================== Input State ====================
    let keys = {
        left: false,
        right: false
    };

    let touch = {
        active: false,
        startX: 0,
        currentX: 0,
        paddleStartX: 0
    };

    // ==================== Canvas Setup ====================
    function resizeCanvas() {
        const wrapper = canvas.parentElement;
        const rect = wrapper.getBoundingClientRect();
        
        // Set canvas internal dimensions
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        
        // Scale context for retina displays
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        // Store actual display dimensions
        canvas.displayWidth = rect.width;
        canvas.displayHeight = rect.height;
        
        // Recalculate game object sizes
        updateGameObjectSizes();
    }

    function updateGameObjectSizes() {
        const w = canvas.displayWidth;
        const h = canvas.displayHeight;
        
        // Update paddle
        paddle.width = w * PADDLE_WIDTH_RATIO;
        paddle.height = Math.max(h * PADDLE_HEIGHT_RATIO, 10);
        paddle.y = h - paddle.height - (h * 0.05); // More space at bottom
        
        // Keep paddle in bounds
        if (paddle.x < 0) paddle.x = 0;
        if (paddle.x + paddle.width > w) paddle.x = w - paddle.width;
        
        // Update ball
        ball.radius = Math.max(w * BALL_RADIUS_RATIO, 6);
        
        // Update bricks
        createBricks();
    }

    // ==================== Brick Creation ====================
    function createBricks() {
        const w = canvas.displayWidth;
        const h = canvas.displayHeight;
        
        const padding = w * BRICK_PADDING;
        const topOffset = h * BRICK_TOP_OFFSET;
        const brickAreaWidth = w - (padding * 2);
        const brickWidth = (brickAreaWidth - (padding * (BRICK_COLS - 1))) / BRICK_COLS;
        const brickHeight = Math.max(h * 0.025, 15);
        
        // Always create fresh bricks
        bricks = [];
        gameState.nextRowColorIndex = 0;
        
        for (let row = 0; row < BRICK_ROWS; row++) {
            for (let col = 0; col < BRICK_COLS; col++) {
                bricks.push({
                    x: padding + col * (brickWidth + padding),
                    y: topOffset + row * (brickHeight + padding),
                    width: brickWidth,
                    height: brickHeight,
                    color: BRICK_COLORS[row % BRICK_COLORS.length],
                    destroyed: false,
                    points: (BRICK_ROWS - row) * 10
                });
            }
            gameState.nextRowColorIndex = (row + 1) % BRICK_COLORS.length;
        }
    }
    
    function spawnNewRow(yPosition) {
        const w = canvas.displayWidth;
        const h = canvas.displayHeight;
        
        const padding = w * BRICK_PADDING;
        const brickAreaWidth = w - (padding * 2);
        const brickWidth = (brickAreaWidth - (padding * (BRICK_COLS - 1))) / BRICK_COLS;
        const brickHeight = Math.max(h * 0.025, 15);
        
        // Spawn new row at the specified Y position
        const spawnY = yPosition !== undefined ? yPosition : 0;
        
        for (let col = 0; col < BRICK_COLS; col++) {
            bricks.push({
                x: padding + col * (brickWidth + padding),
                y: spawnY,
                width: brickWidth,
                height: brickHeight,
                color: BRICK_COLORS[gameState.nextRowColorIndex],
                destroyed: false,
                points: 10 + (gameState.level * 5)
            });
        }
        
        gameState.nextRowColorIndex = (gameState.nextRowColorIndex + 1) % BRICK_COLORS.length;
    }

    // ==================== Game Initialization ====================
    function initGame() {
        resizeCanvas();
        resetGameState();
        bricks = []; // Clear bricks to force fresh creation
        createBricks();
        resetBall();
        resetPaddle();
        updateUI();
        showOverlay('BREAKOUT', 'Press Start to Play', 'Start Game');
    }

    function resetGameState() {
        gameState.score = 0;
        gameState.lives = INITIAL_LIVES;
        gameState.isRunning = false;
        gameState.isPaused = false;
        gameState.isGameOver = false;
        gameState.ballSpeed = INITIAL_BALL_SPEED;
        gameState.bricksDestroyed = 0;
        gameState.level = 1;
        gameState.lastSpawnTime = 0;
        gameState.nextRowColorIndex = 0;
    }

    function resetBall() {
        const w = canvas.displayWidth;
        const h = canvas.displayHeight;
        
        ball.x = w / 2;
        ball.y = paddle.y - ball.radius - 10; // Position above paddle
        
        // Random angle between 45 and 135 degrees (going upward)
        const angle = (Math.random() * 90 + 45) * (Math.PI / 180);
        const speed = gameState.ballSpeed * Math.min(w, h);
        
        ball.dx = speed * Math.cos(angle) * (Math.random() > 0.5 ? 1 : -1);
        ball.dy = -speed * Math.sin(angle);
    }

    function resetPaddle() {
        const w = canvas.displayWidth;
        paddle.x = (w - paddle.width) / 2;
    }

    // ==================== Game Loop ====================
    let lastTime = 0;
    let animationId = null;

    function gameLoop(timestamp) {
        if (!gameState.isRunning || gameState.isPaused) return;
        
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        // Cap delta time to prevent large jumps
        const dt = Math.min(deltaTime, 32);
        
        update(dt);
        render();
        
        animationId = requestAnimationFrame(gameLoop);
    }

    function startGame() {
        initAudio();
        
        if (gameState.isGameOver) {
            initGame();
        }
        
        hideOverlay();
        gameState.isRunning = true;
        gameState.isPaused = false;
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
    }

    function togglePause() {
        if (gameState.isGameOver) return;
        
        if (gameState.isPaused) {
            // Resume
            gameState.isPaused = false;
            hideOverlay();
            lastTime = performance.now();
            animationId = requestAnimationFrame(gameLoop);
        } else {
            // Pause
            gameState.isPaused = true;
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            showOverlay('PAUSED', 'Press Space to Continue', 'Resume', 'pause');
        }
    }

    function pauseGame() {
        gameState.isRunning = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    }

    // ==================== Update Logic ====================
    function update(dt) {
        updatePaddle(dt);
        updateBall(dt);
        updateBricks(dt);
        checkCollisions();
        increaseDifficulty();
    }

    function updateBricks(dt) {
        const h = canvas.displayHeight;
        const descent = BRICK_DESCENT_SPEED * h * dt;
        const dangerZone = paddle.y - 20; // Game over if bricks reach this line
        
        let topmostY = h; // Track the topmost brick position
        
        for (let brick of bricks) {
            if (!brick.destroyed) {
                brick.y += descent;
                
                // Track topmost brick
                if (brick.y < topmostY) {
                    topmostY = brick.y;
                }
                
                // Check if any brick reached the danger zone
                if (brick.y + brick.height >= dangerZone) {
                    bricksReachedBottom();
                    return;
                }
            }
        }
        
        // Remove destroyed bricks that are off screen to save memory
        bricks = bricks.filter(brick => !brick.destroyed || brick.y < h + 50);
        
        // Spawn new row when topmost row has moved down enough
        const brickHeight = Math.max(h * 0.025, 15);
        const padding = canvas.displayWidth * BRICK_PADDING;
        const rowHeight = brickHeight + padding;
        
        // Spawn when there's room for a new row at the top
        if (topmostY > rowHeight) {
            spawnNewRow(topmostY - rowHeight);
        }
    }

    function bricksReachedBottom() {
        playLifeLostSound();
        gameState.lives = 0;
        updateUI();
        loseGame();
    }

    function loseLife() {
        gameState.lives--;
        animateStat('lives');
        updateUI();
        playLifeLostSound();
        
        if (gameState.lives <= 0) {
            loseGame();
        } else {
            resetBall();
            resetPaddle();
        }
    }

    function updatePaddle(dt) {
        const w = canvas.displayWidth;
        const moveSpeed = paddle.speed * w * (dt / 16);
        
        if (keys.left) {
            paddle.x -= moveSpeed;
        }
        if (keys.right) {
            paddle.x += moveSpeed;
        }
        
        // Keep paddle in bounds
        if (paddle.x < 0) paddle.x = 0;
        if (paddle.x + paddle.width > w) paddle.x = w - paddle.width;
    }

    function updateBall(dt) {
        const timeFactor = dt / 16;
        ball.x += ball.dx * timeFactor;
        ball.y += ball.dy * timeFactor;
    }

    function checkCollisions() {
        const w = canvas.displayWidth;
        const h = canvas.displayHeight;
        
        // Wall collisions
        // Left wall
        if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius;
            ball.dx = Math.abs(ball.dx);
        }
        // Right wall
        if (ball.x + ball.radius >= w) {
            ball.x = w - ball.radius;
            ball.dx = -Math.abs(ball.dx);
        }
        // Top wall
        if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.dy = Math.abs(ball.dy);
        }
        
        // Bottom wall (lose life)
        if (ball.y + ball.radius >= h) {
            loseLife();
            return;
        }
        
        // Paddle collision
        if (ball.dy > 0 && 
            ball.y + ball.radius >= paddle.y &&
            ball.y + ball.radius <= paddle.y + paddle.height &&
            ball.x >= paddle.x &&
            ball.x <= paddle.x + paddle.width) {
            
            // Calculate hit position (0 to 1)
            const hitPos = (ball.x - paddle.x) / paddle.width;
            
            // Angle based on hit position (-60 to 60 degrees)
            const angle = (hitPos - 0.5) * 120 * (Math.PI / 180);
            const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            
            ball.dx = speed * Math.sin(angle);
            ball.dy = -speed * Math.cos(angle);
            
            // Ensure ball is above paddle
            ball.y = paddle.y - ball.radius;
        }
        
        // Brick collisions
        for (let brick of bricks) {
            if (brick.destroyed) continue;
            
            if (checkBrickCollision(brick)) {
                brick.destroyed = true;
                gameState.score += brick.points;
                gameState.bricksDestroyed++;
                updateHighScore();
                updateUI();
                playBrickHitSound();
                break;
            }
        }
    }

    function checkBrickCollision(brick) {
        // Find closest point on brick to ball center
        const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
        const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
        
        // Calculate distance
        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const distance = Math.sqrt(distX * distX + distY * distY);
        
        if (distance <= ball.radius) {
            // Determine collision side
            const overlapX = ball.radius - Math.abs(distX);
            const overlapY = ball.radius - Math.abs(distY);
            
            if (overlapX < overlapY) {
                ball.dx = -ball.dx;
                ball.x += distX > 0 ? overlapX : -overlapX;
            } else {
                ball.dy = -ball.dy;
                ball.y += distY > 0 ? overlapY : -overlapY;
            }
            
            return true;
        }
        return false;
    }

    function increaseDifficulty() {
        const w = canvas.displayWidth;
        const h = canvas.displayHeight;
        const maxSpeed = MAX_BALL_SPEED * Math.min(w, h);
        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        
        if (currentSpeed < maxSpeed) {
            const increment = SPEED_INCREMENT * Math.min(w, h);
            const factor = 1 + increment / currentSpeed;
            ball.dx *= factor;
            ball.dy *= factor;
        }
    }

    function updateHighScore() {
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
        }
    }

    function loseGame() {
        gameState.isRunning = false;
        gameState.isGameOver = true;
        updateHighScore();
        showOverlay('GAME OVER', `Score: ${gameState.score} | High Score: ${gameState.highScore}`, 'Try Again', 'lose');
    }

    // ==================== Rendering ====================
    function render() {
        const w = canvas.displayWidth;
        const h = canvas.displayHeight;
        
        // Clear canvas
        ctx.clearRect(0, 0, w, h);
        
        // Draw bricks
        drawBricks();
        
        // Draw paddle
        drawPaddle();
        
        // Draw ball
        drawBall();
    }

    function drawBricks() {
        for (let brick of bricks) {
            if (brick.destroyed) continue;
            
            // Brick body
            ctx.fillStyle = brick.color;
            ctx.beginPath();
            roundRect(ctx, brick.x, brick.y, brick.width, brick.height, 3);
            ctx.fill();
            
            // Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            roundRect(ctx, brick.x, brick.y, brick.width, brick.height * 0.4, 3);
            ctx.fill();
            
            // Border
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            roundRect(ctx, brick.x, brick.y, brick.width, brick.height, 3);
            ctx.stroke();
        }
    }

    function drawPaddle() {
        // Paddle glow
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 15;
        
        // Paddle body
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        roundRect(ctx, paddle.x, paddle.y, paddle.width, paddle.height, 5);
        ctx.fill();
        
        // Paddle highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        roundRect(ctx, paddle.x + 2, paddle.y + 2, paddle.width - 4, paddle.height * 0.4, 3);
        ctx.fill();
    }

    function drawBall() {
        // Ball glow
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        
        // Ball body
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Ball highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    function roundRect(ctx, x, y, width, height, radius) {
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

    // ==================== UI Functions ====================
    function updateUI() {
        scoreDisplay.textContent = gameState.score;
        highScoreDisplay.textContent = gameState.highScore;
        livesDisplay.textContent = gameState.lives;
    }

    function animateStat(stat) {
        const element = stat === 'score' ? scoreDisplay : (stat === 'lives' ? livesDisplay : highScoreDisplay);
        element.classList.remove('pulse');
        void element.offsetWidth; // Trigger reflow
        element.classList.add('pulse');
    }

    function showOverlay(title, message, buttonText, state = '') {
        overlayTitle.textContent = title;
        overlayTitle.className = 'overlay-title ' + state;
        overlayMessage.textContent = message;
        startBtn.textContent = buttonText;
        overlay.classList.remove('hidden');
    }

    function hideOverlay() {
        overlay.classList.add('hidden');
    }

    // ==================== Event Handlers ====================
    function handleKeyDown(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            keys.left = true;
            e.preventDefault();
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            keys.right = true;
            e.preventDefault();
        }
        if (e.key === ' ') {
            if (!gameState.isRunning && !gameState.isPaused) {
                startGame();
            } else if (gameState.isRunning || gameState.isPaused) {
                togglePause();
            }
            e.preventDefault();
        }
        if (e.key === 'Enter') {
            if (!gameState.isRunning && !gameState.isPaused) {
                startGame();
            }
            e.preventDefault();
        }
    }

    function handleKeyUp(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            keys.left = false;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            keys.right = false;
        }
    }

    function handleTouchStart(e) {
        if (e.touches.length > 0) {
            touch.active = true;
            touch.startX = e.touches[0].clientX;
            touch.currentX = touch.startX;
            touch.paddleStartX = paddle.x;
            e.preventDefault();
        }
    }

    function handleTouchMove(e) {
        if (touch.active && e.touches.length > 0) {
            touch.currentX = e.touches[0].clientX;
            const deltaX = touch.currentX - touch.startX;
            const w = canvas.displayWidth;
            
            paddle.x = touch.paddleStartX + deltaX;
            
            // Keep paddle in bounds
            if (paddle.x < 0) paddle.x = 0;
            if (paddle.x + paddle.width > w) paddle.x = w - paddle.width;
            
            e.preventDefault();
        }
    }

    function handleTouchEnd(e) {
        touch.active = false;
        e.preventDefault();
    }

    function handleMouseMove(e) {
        if (!gameState.isRunning) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const w = canvas.displayWidth;
        
        paddle.x = mouseX - paddle.width / 2;
        
        // Keep paddle in bounds
        if (paddle.x < 0) paddle.x = 0;
        if (paddle.x + paddle.width > w) paddle.x = w - paddle.width;
    }

    function handleResize() {
        const wasRunning = gameState.isRunning;
        
        // Store relative positions
        const w = canvas.displayWidth || 1;
        const h = canvas.displayHeight || 1;
        const ballRelX = ball.x / w;
        const ballRelY = ball.y / h;
        const paddleRelX = paddle.x / w;
        
        // Resize canvas
        resizeCanvas();
        
        // Restore relative positions
        const newW = canvas.displayWidth;
        const newH = canvas.displayHeight;
        ball.x = ballRelX * newW;
        ball.y = ballRelY * newH;
        paddle.x = paddleRelX * newW;
        
        // Scale ball velocity
        const speedScale = Math.min(newW, newH) / Math.min(w || 1, h || 1);
        ball.dx *= speedScale;
        ball.dy *= speedScale;
        
        // Render current state
        if (!wasRunning) {
            render();
        }
    }

    // ==================== Event Listeners ====================
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    canvas.addEventListener('mousemove', handleMouseMove);
    
    window.addEventListener('resize', handleResize);
    
    startBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', () => {
        pauseGame();
        initGame();
    });

    // Prevent context menu on long press
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // ==================== Initialize ====================
    initGame();
    
    // Initial render
    render();
})();
