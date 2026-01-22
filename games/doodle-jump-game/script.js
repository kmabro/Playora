// Game Constants
const GRAVITY = 0.4;
const JUMP_FORCE = -12;
const MOVE_SPEED = 5;
const MOVE_ACCELERATION = 0.6;
const MOVE_FRICTION = 0.88;
const MAX_SPEED = 7;
const PLATFORM_COUNT = 7;
const PLATFORM_HEIGHT_RATIO = 0.025;
const PLATFORM_WIDTH_RATIO = 0.18;
const PLAYER_SIZE_RATIO = 0.08;

// Game State
let canvas, ctx;
let gameWidth, gameHeight;
let player;
let platforms = [];
let score = 0;
let highScore = 0;
let gameRunning = false;
let keys = { left: false, right: false };
let touchSide = null;
let cameraY = 0;
let maxHeight = 0;
let isPaused = false;
let platformsCrossed = new Set();

// DOM Elements
let scoreDisplay, highScoreDisplay, finalScoreDisplay;
let gameOverScreen, startScreen;
let restartBtn, startBtn;
let leftBtn, rightBtn, pauseBtn, resumeBtn;
let controlsContainer, pauseOverlay;

// Player Class
class Player {
    constructor() {
        this.width = gameWidth * PLAYER_SIZE_RATIO;
        this.height = this.width * 1.2;
        this.x = gameWidth / 2 - this.width / 2;
        this.y = gameHeight * 0.7;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onPlatform = false;
    }

    update() {
        // Horizontal movement with acceleration
        if (keys.left || touchSide === 'left') {
            this.velocityX -= MOVE_ACCELERATION;
            if (this.velocityX < -MAX_SPEED) this.velocityX = -MAX_SPEED;
        } else if (keys.right || touchSide === 'right') {
            this.velocityX += MOVE_ACCELERATION;
            if (this.velocityX > MAX_SPEED) this.velocityX = MAX_SPEED;
        } else {
            this.velocityX *= MOVE_FRICTION;
            if (Math.abs(this.velocityX) < 0.1) this.velocityX = 0;
        }

        this.x += this.velocityX;

        // Stop at screen edges (no wrapping)
        if (this.x < 0) {
            this.x = 0;
            this.velocityX = 0;
        } else if (this.x + this.width > gameWidth) {
            this.x = gameWidth - this.width;
            this.velocityX = 0;
        }

        // Apply gravity
        this.velocityY += GRAVITY;
        this.y += this.velocityY;

        // Check if player fell below screen
        if (this.y - cameraY > gameHeight + this.height) {
            gameOver();
        }
    }

    jump() {
        this.velocityY = JUMP_FORCE;
    }

    draw() {
        const drawY = this.y - cameraY;
        
        // Draw the Doodler character
        ctx.save();
        
        // Body (green striped shirt)
        const bodyWidth = this.width * 0.7;
        const bodyHeight = this.height * 0.45;
        const bodyX = this.x + (this.width - bodyWidth) / 2;
        const bodyY = drawY + this.height * 0.35;
        
        // Shirt base
        ctx.fillStyle = '#2d5a27';
        ctx.beginPath();
        ctx.roundRect(bodyX, bodyY, bodyWidth, bodyHeight, 5);
        ctx.fill();
        
        // Shirt stripes
        ctx.fillStyle = '#4a7c44';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(bodyX, bodyY + bodyHeight * 0.2 + i * bodyHeight * 0.25, bodyWidth, bodyHeight * 0.12);
        }
        
        // Head (yellow/cream colored bean shape)
        const headWidth = this.width * 0.75;
        const headHeight = this.height * 0.5;
        const headX = this.x + (this.width - headWidth) / 2;
        const headY = drawY;
        
        ctx.fillStyle = '#f4d03f';
        ctx.beginPath();
        ctx.ellipse(headX + headWidth / 2, headY + headHeight / 2, headWidth / 2, headHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Snout/nose protrusion
        ctx.fillStyle = '#f4d03f';
        ctx.beginPath();
        ctx.ellipse(headX + headWidth * 0.85, headY + headHeight * 0.35, headWidth * 0.25, headHeight * 0.18, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose hole
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(headX + headWidth * 0.95, headY + headHeight * 0.35, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(headX + headWidth * 0.35, headY + headHeight * 0.4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX + headWidth * 0.55, headY + headHeight * 0.4, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Legs
        const legWidth = this.width * 0.12;
        const legHeight = this.height * 0.2;
        const legY = drawY + this.height * 0.8;
        
        ctx.fillStyle = '#333';
        // Left leg
        ctx.beginPath();
        ctx.roundRect(this.x + this.width * 0.25, legY, legWidth, legHeight, 3);
        ctx.fill();
        // Right leg
        ctx.beginPath();
        ctx.roundRect(this.x + this.width * 0.55, legY, legWidth, legHeight, 3);
        ctx.fill();
        
        // Feet
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width * 0.25 + legWidth / 2, legY + legHeight, legWidth * 0.8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.x + this.width * 0.55 + legWidth / 2, legY + legHeight, legWidth * 0.8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Platform ID counter
let platformIdCounter = 0;

// Platform Class
class Platform {
    constructor(x, y) {
        this.id = platformIdCounter++;
        this.width = gameWidth * PLATFORM_WIDTH_RATIO;
        this.height = gameHeight * PLATFORM_HEIGHT_RATIO;
        this.x = x;
        this.y = y;
    }

    draw() {
        const drawY = this.y - cameraY;
        
        // Only draw if visible
        if (drawY < -this.height || drawY > gameHeight + this.height) return;
        
        // Platform shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.roundRect(this.x + 3, drawY + 3, this.width, this.height, 8);
        ctx.fill();
        
        // Platform body - bright green like the original
        const gradient = ctx.createLinearGradient(this.x, drawY, this.x, drawY + this.height);
        gradient.addColorStop(0, '#7CFC00');
        gradient.addColorStop(0.5, '#32CD32');
        gradient.addColorStop(1, '#228B22');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(this.x, drawY, this.width, this.height, 8);
        ctx.fill();
        
        // Platform highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.roundRect(this.x + 4, drawY + 2, this.width - 8, this.height * 0.4, 4);
        ctx.fill();
        
        // Platform outline
        ctx.strokeStyle = '#1a6b1a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(this.x, drawY, this.width, this.height, 8);
        ctx.stroke();
    }

    isPlayerOn(player) {
        return (
            player.velocityY > 0 &&
            player.x + player.width > this.x &&
            player.x < this.x + this.width &&
            player.y + player.height >= this.y &&
            player.y + player.height <= this.y + this.height + player.velocityY + 5
        );
    }
}

// Initialize Game
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    scoreDisplay = document.getElementById('score');
    highScoreDisplay = document.getElementById('high-score');
    finalScoreDisplay = document.getElementById('final-score');
    gameOverScreen = document.getElementById('game-over-screen');
    startScreen = document.getElementById('start-screen');
    restartBtn = document.getElementById('restart-btn');
    startBtn = document.getElementById('start-btn');
    leftBtn = document.getElementById('left-btn');
    rightBtn = document.getElementById('right-btn');
    pauseBtn = document.getElementById('pause-btn');
    resumeBtn = document.getElementById('resume-btn');
    controlsContainer = document.getElementById('controls');
    pauseOverlay = document.getElementById('pause-overlay');
    
    // Load high score from localStorage
    highScore = parseInt(localStorage.getItem('doodleJumpHighScore')) || 0;
    highScoreDisplay.textContent = highScore;
    
    resizeCanvas();
    setupEventListeners();
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Maintain aspect ratio (portrait-first: 9:16 or similar)
    const aspectRatio = 9 / 16;
    
    let width, height;
    
    if (containerWidth / containerHeight < aspectRatio) {
        // Container is taller than aspect ratio
        width = containerWidth;
        height = containerWidth / aspectRatio;
    } else {
        // Container is wider than aspect ratio
        height = containerHeight;
        width = containerHeight * aspectRatio;
    }
    
    // Cap maximum dimensions
    width = Math.min(width, 500);
    height = Math.min(height, width / aspectRatio);
    
    canvas.width = width;
    canvas.height = height;
    gameWidth = width;
    gameHeight = height;
    
    // Reinitialize game elements if game is running
    if (player) {
        player.width = gameWidth * PLAYER_SIZE_RATIO;
        player.height = player.width * 1.2;
    }
}

function setupEventListeners() {
    // Window resize
    window.addEventListener('resize', () => {
        resizeCanvas();
    });
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') {
            keys.left = true;
            leftBtn.classList.add('active');
            e.preventDefault();
        }
        if (e.key === 'ArrowRight' || e.key === 'd') {
            keys.right = true;
            rightBtn.classList.add('active');
            e.preventDefault();
        }
        if (e.key === 'Escape' || e.key === 'p') {
            togglePause();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') {
            keys.left = false;
            leftBtn.classList.remove('active');
        }
        if (e.key === 'ArrowRight' || e.key === 'd') {
            keys.right = false;
            rightBtn.classList.remove('active');
        }
    });
    
    // Touch controls
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('touchend', () => {
        touchSide = null;
    });
    
    // Mouse controls for testing on desktop
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        touchSide = x < canvas.width / 2 ? 'left' : 'right';
    });
    
    canvas.addEventListener('mouseup', () => {
        touchSide = null;
    });
    
    canvas.addEventListener('mouseleave', () => {
        touchSide = null;
    });
    
    // Buttons
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
    pauseBtn.addEventListener('click', togglePause);
    resumeBtn.addEventListener('click', togglePause);
    
    // Control buttons
    setupControlButton(leftBtn, 'left');
    setupControlButton(rightBtn, 'right');
    
    // Prevent default touch behavior
    document.body.addEventListener('touchstart', (e) => {
        if (e.target === canvas) {
            e.preventDefault();
        }
    }, { passive: false });
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    touchSide = x < canvas.width / 2 ? 'left' : 'right';
}

function setupControlButton(btn, direction) {
    const activate = () => {
        touchSide = direction;
        btn.classList.add('active');
    };
    const deactivate = () => {
        if (touchSide === direction) touchSide = null;
        btn.classList.remove('active');
    };
    
    btn.addEventListener('mousedown', activate);
    btn.addEventListener('mouseup', deactivate);
    btn.addEventListener('mouseleave', deactivate);
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); activate(); }, { passive: false });
    btn.addEventListener('touchend', (e) => { e.preventDefault(); deactivate(); });
    btn.addEventListener('touchcancel', deactivate);
}

function togglePause() {
    if (!gameRunning) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        pauseOverlay.classList.add('visible');
        pauseBtn.textContent = '▶';
    } else {
        pauseOverlay.classList.remove('visible');
        pauseBtn.textContent = '❚❚';
        gameLoop();
    }
}

function startGame() {
    startScreen.style.display = 'none';
    controlsContainer.classList.add('visible');
    resetGame();
    gameRunning = true;
    isPaused = false;
    gameLoop();
}

function restartGame() {
    gameOverScreen.style.display = 'none';
    controlsContainer.classList.add('visible');
    resetGame();
    gameRunning = true;
    isPaused = false;
    gameLoop();
}

function resetGame() {
    score = 0;
    maxHeight = 0;
    cameraY = 0;
    platformsCrossed = new Set();
    platformIdCounter = 0;
    scoreDisplay.textContent = '0';
    pauseBtn.textContent = '❚❚';
    
    // Create player
    player = new Player();
    
    // Create initial platforms
    platforms = [];
    const platformSpacing = gameHeight / PLATFORM_COUNT;
    
    // First platform directly under player
    platforms.push(new Platform(
        gameWidth / 2 - (gameWidth * PLATFORM_WIDTH_RATIO) / 2,
        gameHeight * 0.85
    ));
    
    // Generate other platforms ensuring they're reachable
    let lastX = gameWidth / 2 - (gameWidth * PLATFORM_WIDTH_RATIO) / 2;
    const maxJumpDistance = gameWidth * 0.45;
    const platformWidth = gameWidth * PLATFORM_WIDTH_RATIO;
    
    for (let i = 1; i < PLATFORM_COUNT; i++) {
        let minX = Math.max(0, lastX - maxJumpDistance);
        let maxX = Math.min(gameWidth - platformWidth, lastX + maxJumpDistance);
        const x = minX + Math.random() * (maxX - minX);
        const y = gameHeight * 0.85 - i * platformSpacing;
        platforms.push(new Platform(x, y));
        lastX = x;
    }
}

function gameOver() {
    gameRunning = false;
    controlsContainer.classList.remove('visible');
    pauseOverlay.classList.remove('visible');
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('doodleJumpHighScore', highScore);
        highScoreDisplay.textContent = highScore;
    }
    
    finalScoreDisplay.textContent = score;
    gameOverScreen.style.display = 'flex';
}

function updateCamera() {
    // Move camera up when player is above middle of screen
    const playerScreenY = player.y - cameraY;
    const threshold = gameHeight * 0.4;
    
    if (playerScreenY < threshold) {
        const diff = threshold - playerScreenY;
        cameraY -= diff;
    }
}

function generatePlatforms() {
    // Remove platforms that are too far below and count them for score
    const oldCount = platforms.length;
    platforms = platforms.filter(platform => {
        const isBelow = platform.y - cameraY > gameHeight + 50;
        if (isBelow && !platformsCrossed.has(platform.id)) {
            platformsCrossed.add(platform.id);
            score++;
            scoreDisplay.textContent = score;
        }
        return !isBelow;
    });
    
    // Find the highest platform
    let highestPlatformY = Math.min(...platforms.map(p => p.y));
    
    // Generate new platforms above
    const platformSpacing = gameHeight / PLATFORM_COUNT;
    
    // Get the last platform's x position for reachability check
    let lastPlatformX = platforms.length > 0 ? platforms[platforms.length - 1].x : gameWidth / 2;
    
    while (highestPlatformY > cameraY - gameHeight * 0.5) {
        // Calculate max horizontal distance player can travel during a jump
        const maxJumpDistance = gameWidth * 0.45;
        const platformWidth = gameWidth * PLATFORM_WIDTH_RATIO;
        
        // Generate x position within reachable range from last platform
        let minX = Math.max(0, lastPlatformX - maxJumpDistance);
        let maxX = Math.min(gameWidth - platformWidth, lastPlatformX + maxJumpDistance);
        
        const x = minX + Math.random() * (maxX - minX);
        const y = highestPlatformY - platformSpacing * (0.7 + Math.random() * 0.5);
        
        platforms.push(new Platform(x, y));
        lastPlatformX = x;
        highestPlatformY = y;
    }
}

function checkCollisions() {
    for (const platform of platforms) {
        if (platform.isPlayerOn(player)) {
            player.y = platform.y - player.height;
            player.jump();
            break;
        }
    }
}

function drawBackground() {
    // Create gradient based on height
    const heightFactor = Math.min(score / 1000, 1);
    
    const gradient = ctx.createLinearGradient(0, 0, 0, gameHeight);
    
    // Transition from day to dusk as player goes higher
    if (heightFactor < 0.5) {
        gradient.addColorStop(0, `rgb(${135 - heightFactor * 50}, ${206 - heightFactor * 50}, ${235 - heightFactor * 30})`);
        gradient.addColorStop(1, `rgb(${224 - heightFactor * 50}, ${246 - heightFactor * 50}, 255)`);
    } else {
        gradient.addColorStop(0, `rgb(${110 - (heightFactor - 0.5) * 60}, ${181 - (heightFactor - 0.5) * 80}, ${220 - (heightFactor - 0.5) * 100})`);
        gradient.addColorStop(1, `rgb(${199 - (heightFactor - 0.5) * 80}, ${221 - (heightFactor - 0.5) * 80}, 255)`);
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gameWidth, gameHeight);
    
    // Draw some clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    const cloudOffset = (cameraY * 0.1) % (gameHeight * 2);
    
    drawCloud(gameWidth * 0.1, (gameHeight * 0.2 + cloudOffset) % gameHeight, gameWidth * 0.15);
    drawCloud(gameWidth * 0.7, (gameHeight * 0.5 + cloudOffset) % gameHeight, gameWidth * 0.12);
    drawCloud(gameWidth * 0.4, (gameHeight * 0.8 + cloudOffset) % gameHeight, gameWidth * 0.18);
}

function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
    ctx.fill();
}

function gameLoop() {
    if (!gameRunning || isPaused) return;
    
    // Update
    player.update();
    updateCamera();
    generatePlatforms();
    checkCollisions();
    
    // Draw
    drawBackground();
    
    // Draw platforms
    for (const platform of platforms) {
        platform.draw();
    }
    
    // Draw player
    player.draw();
    
    requestAnimationFrame(gameLoop);
}

// Polyfill for roundRect if not available
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (typeof radius === 'number') {
            radius = { tl: radius, tr: radius, br: radius, bl: radius };
        }
        this.moveTo(x + radius.tl, y);
        this.lineTo(x + width - radius.tr, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        this.lineTo(x + width, y + height - radius.br);
        this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        this.lineTo(x + radius.bl, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        this.lineTo(x, y + radius.tl);
        this.quadraticCurveTo(x, y, x + radius.tl, y);
        this.closePath();
        return this;
    };
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
