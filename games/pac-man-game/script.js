// ==================== GAME CONFIGURATION ====================
const CONFIG = {
    COLS: 19,
    ROWS: 21,
    FPS: 60,
    PACMAN_SPEED: 0.12,
    GHOST_SPEED: 0.1,
    FRIGHTENED_SPEED: 0.05,
    FRIGHTENED_DURATION: 8000,
    GHOST_SCORE: 200,
    PELLET_SCORE: 10,
    POWER_PELLET_SCORE: 50
};

// ==================== MAZE LAYOUT ====================
// 0 = path, 1 = wall, 2 = pellet, 3 = power pellet, 4 = empty (ghost house)
const MAZE_TEMPLATE = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,3,1],
    [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
    [1,1,1,1,2,1,0,1,1,4,1,1,0,1,2,1,1,1,1],
    [0,0,0,0,2,0,0,1,4,4,4,1,0,0,2,0,0,0,0],
    [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
    [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
    [1,3,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,3,1],
    [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
    [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// ==================== GAME STATE ====================
let canvas, ctx;
let cellSize, offsetX, offsetY;
let maze = [];
let pacman, ghosts;
let score = 0, lives = 3, level = 1;
let pelletsRemaining = 0;
let gameRunning = false;
let gamePaused = false;
let lastTime = 0;
let soundEnabled = true;

// Audio context for sounds
let audioCtx = null;

// ==================== AUDIO SYSTEM ====================
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!soundEnabled || !audioCtx) return;
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    switch(type) {
        case 'chomp':
            oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.1);
            break;
        case 'power':
            oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.3);
            break;
        case 'eatGhost':
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.2);
            break;
        case 'death':
            oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.5);
            break;
        case 'levelUp':
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(523, audioCtx.currentTime);
            oscillator.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(784, audioCtx.currentTime + 0.2);
            oscillator.frequency.setValueAtTime(1047, audioCtx.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.5);
            break;
    }
}

// ==================== PACMAN CLASS ====================
class Pacman {
    constructor() {
        this.reset();
    }
    
    reset() {
        // Use integer grid positions for strict alignment
        this.gridX = 9;
        this.gridY = 15;
        this.x = 9;
        this.y = 15;
        this.targetX = 9;
        this.targetY = 15;
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.mouthAngle = 0;
        this.moving = false;
        this.moveProgress = 0;
    }
    
    setDirection(dx, dy) {
        this.nextDirection = { x: dx, y: dy };
        
        // If not moving, try to start moving immediately
        if (!this.moving) {
            const nextX = this.gridX + dx;
            const nextY = this.gridY + dy;
            
            if (this.canMoveTo(nextX, nextY)) {
                this.direction = { x: dx, y: dy };
                this.targetX = nextX;
                this.targetY = nextY;
                this.moving = true;
                this.moveProgress = 0;
            }
        }
    }
    
    canMoveTo(x, y) {
        // Handle tunnel wrapping
        if (y === 9 && (x < 0 || x >= CONFIG.COLS)) return true;
        if (x < 0 || x >= CONFIG.COLS || y < 0 || y >= CONFIG.ROWS) return false;
        return maze[y][x] !== 1;
    }
    
    update(deltaTime) {
        // Animate mouth
        if (this.moving) {
            this.mouthAngle += 0.15;
            if (this.mouthAngle > 0.5) this.mouthAngle = 0;
        }
        
        const speed = CONFIG.PACMAN_SPEED * (1 + level * 0.03);
        
        if (this.moving) {
            // Move towards target
            this.moveProgress += speed;
            
            // Interpolate position
            this.x = this.gridX + this.direction.x * this.moveProgress;
            this.y = this.gridY + this.direction.y * this.moveProgress;
            
            // Handle tunnel wrapping during movement
            if (this.y === 9) {
                if (this.x < -0.5) this.x = CONFIG.COLS - 0.5;
                if (this.x > CONFIG.COLS - 0.5) this.x = -0.5;
            }
            
            // Check if reached target tile
            if (this.moveProgress >= 1) {
                // Snap to target grid position
                this.gridX = this.targetX;
                this.gridY = this.targetY;
                
                // Handle tunnel wrapping
                if (this.gridX < 0) this.gridX = CONFIG.COLS - 1;
                if (this.gridX >= CONFIG.COLS) this.gridX = 0;
                
                this.x = this.gridX;
                this.y = this.gridY;
                this.moveProgress = 0;
                
                // Collect pellet at current position
                this.collectPellet();
                
                // Try to turn to queued direction first
                let nextDir = this.nextDirection;
                let nextX = this.gridX + nextDir.x;
                let nextY = this.gridY + nextDir.y;
                
                if ((nextDir.x !== 0 || nextDir.y !== 0) && this.canMoveTo(nextX, nextY)) {
                    // Can turn to queued direction
                    this.direction = { ...nextDir };
                    this.targetX = nextX;
                    this.targetY = nextY;
                    this.moving = true;
                } else {
                    // Try to continue in current direction
                    nextX = this.gridX + this.direction.x;
                    nextY = this.gridY + this.direction.y;
                    
                    if (this.canMoveTo(nextX, nextY)) {
                        this.targetX = nextX;
                        this.targetY = nextY;
                        this.moving = true;
                    } else {
                        // Hit a wall, stop
                        this.moving = false;
                    }
                }
            }
        } else {
            // Not moving, check if we can start
            if (this.nextDirection.x !== 0 || this.nextDirection.y !== 0) {
                const nextX = this.gridX + this.nextDirection.x;
                const nextY = this.gridY + this.nextDirection.y;
                
                if (this.canMoveTo(nextX, nextY)) {
                    this.direction = { ...this.nextDirection };
                    this.targetX = nextX;
                    this.targetY = nextY;
                    this.moving = true;
                    this.moveProgress = 0;
                }
            }
        }
    }
    
    collectPellet() {
        const cellX = this.gridX;
        const cellY = this.gridY;
        
        if (cellX < 0 || cellX >= CONFIG.COLS || cellY < 0 || cellY >= CONFIG.ROWS) return;
        
        const cell = maze[cellY][cellX];
        
        if (cell === 2) {
            maze[cellY][cellX] = 0;
            score += CONFIG.PELLET_SCORE;
            pelletsRemaining--;
            playSound('chomp');
            updateUI();
        } else if (cell === 3) {
            maze[cellY][cellX] = 0;
            score += CONFIG.POWER_PELLET_SCORE;
            pelletsRemaining--;
            playSound('power');
            activateFrightenedMode();
            updateUI();
        }
        
        // Check win condition
        if (pelletsRemaining <= 0) {
            levelComplete();
        }
    }
    
    draw() {
        const screenX = offsetX + this.x * cellSize + cellSize / 2;
        const screenY = offsetY + this.y * cellSize + cellSize / 2;
        const radius = cellSize * 0.4;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        
        // Rotate based on direction
        let angle = 0;
        if (this.direction.x === 1) angle = 0;
        else if (this.direction.x === -1) angle = Math.PI;
        else if (this.direction.y === 1) angle = Math.PI / 2;
        else if (this.direction.y === -1) angle = -Math.PI / 2;
        
        ctx.rotate(angle);
        
        // Draw Pac-Man with glow
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.arc(0, 0, radius, this.mouthAngle * Math.PI, (2 - this.mouthAngle) * Math.PI);
        ctx.lineTo(0, 0);
        ctx.closePath();
        
        ctx.fillStyle = '#ffff00';
        ctx.fill();
        
        ctx.restore();
    }
}

// ==================== GHOST CLASS ====================
class Ghost {
    constructor(x, y, color, name) {
        this.startX = x;
        this.startY = y;
        this.color = color;
        this.name = name;
        this.reset();
    }
    
    reset() {
        this.gridX = this.startX;
        this.gridY = this.startY;
        this.x = this.startX;
        this.y = this.startY;
        this.targetX = this.startX;
        this.targetY = this.startY;
        this.direction = { x: 0, y: -1 };
        this.frightened = false;
        this.eaten = false;
        this.frightenedTimer = 0;
        this.exitingHouse = true;
        this.exitDelay = Math.random() * 2000;
        this.exitTimer = 0;
        this.moveProgress = 0;
        this.moving = false;
    }
    
    canMoveTo(x, y) {
        if (x < 0 || x >= CONFIG.COLS || y < 0 || y >= CONFIG.ROWS) {
            // Tunnel
            if (y === 9 && (x < 0 || x >= CONFIG.COLS)) return true;
            return false;
        }
        const cell = maze[y][x];
        return cell !== 1;
    }
    
    getAvailableDirections() {
        const directions = [
            { x: 0, y: -1 },  // up
            { x: 0, y: 1 },   // down
            { x: -1, y: 0 },  // left
            { x: 1, y: 0 }    // right
        ];
        
        return directions.filter(dir => {
            // Don't reverse direction unless necessary
            if (dir.x === -this.direction.x && dir.y === -this.direction.y) {
                return false;
            }
            
            const newX = this.gridX + dir.x;
            const newY = this.gridY + dir.y;
            
            return this.canMoveTo(newX, newY);
        });
    }
    
    update(deltaTime) {
        // Handle exit delay
        if (this.exitingHouse) {
            this.exitTimer += deltaTime;
            if (this.exitTimer < this.exitDelay) return;
            
            // Move to exit position
            if (this.y > 7) {
                this.y -= CONFIG.GHOST_SPEED * 0.5;
                this.gridY = Math.round(this.y);
                return;
            }
            this.exitingHouse = false;
            this.gridX = Math.round(this.x);
            this.gridY = Math.round(this.y);
            this.moving = false;
        }
        
        // Handle frightened timer
        if (this.frightened) {
            this.frightenedTimer -= deltaTime;
            if (this.frightenedTimer <= 0) {
                this.frightened = false;
            }
        }
        
        // Handle eaten ghost returning home
        if (this.eaten) {
            const homeX = 9;
            const homeY = 9;
            
            const dx = homeX - this.x;
            const dy = homeY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 0.5) {
                this.eaten = false;
                this.frightened = false;
                this.gridX = homeX;
                this.gridY = homeY;
                this.x = homeX;
                this.y = homeY;
                this.moving = false;
                return;
            }
            
            const speed = CONFIG.GHOST_SPEED * 3;
            this.x += (dx / dist) * speed;
            this.y += (dy / dist) * speed;
            return;
        }
        
        // Normal grid-based movement
        const speed = this.frightened ? CONFIG.FRIGHTENED_SPEED : CONFIG.GHOST_SPEED * (1 + level * 0.03);
        
        if (this.moving) {
            this.moveProgress += speed;
            
            // Interpolate position
            this.x = this.gridX + this.direction.x * this.moveProgress;
            this.y = this.gridY + this.direction.y * this.moveProgress;
            
            // Handle tunnel wrapping
            if (this.gridY === 9) {
                if (this.x < -0.5) this.x = CONFIG.COLS - 0.5;
                if (this.x > CONFIG.COLS - 0.5) this.x = -0.5;
            }
            
            // Reached target tile
            if (this.moveProgress >= 1) {
                this.gridX = this.targetX;
                this.gridY = this.targetY;
                
                // Handle tunnel wrapping
                if (this.gridX < 0) this.gridX = CONFIG.COLS - 1;
                if (this.gridX >= CONFIG.COLS) this.gridX = 0;
                
                this.x = this.gridX;
                this.y = this.gridY;
                this.moveProgress = 0;
                this.moving = false;
            }
        }
        
        if (!this.moving) {
            // Choose next direction at grid intersection
            const availableDirs = this.getAvailableDirections();
            
            if (availableDirs.length > 0) {
                if (this.frightened) {
                    // Random movement when frightened
                    this.direction = availableDirs[Math.floor(Math.random() * availableDirs.length)];
                } else {
                    // Chase Pac-Man with different AI per ghost
                    let bestDir = availableDirs[0];
                    let bestDist = Infinity;
                    
                    let targetX = pacman.gridX;
                    let targetY = pacman.gridY;
                    
                    switch(this.name) {
                        case 'blinky': // Direct chase
                            break;
                        case 'pinky': // Ambush - target ahead of Pac-Man
                            targetX += pacman.direction.x * 4;
                            targetY += pacman.direction.y * 4;
                            break;
                        case 'inky': // Flanking
                            targetX = pacman.gridX + (pacman.gridX - ghosts[0].gridX);
                            targetY = pacman.gridY + (pacman.gridY - ghosts[0].gridY);
                            break;
                        case 'clyde': // Shy - runs away when close
                            const distToPacman = Math.sqrt(
                                Math.pow(this.gridX - pacman.gridX, 2) + 
                                Math.pow(this.gridY - pacman.gridY, 2)
                            );
                            if (distToPacman < 8) {
                                targetX = 0;
                                targetY = CONFIG.ROWS;
                            }
                            break;
                    }
                    
                    for (const dir of availableDirs) {
                        const newX = this.gridX + dir.x;
                        const newY = this.gridY + dir.y;
                        const dist = Math.sqrt(
                            Math.pow(newX - targetX, 2) + 
                            Math.pow(newY - targetY, 2)
                        );
                        
                        if (dist < bestDist) {
                            bestDist = dist;
                            bestDir = dir;
                        }
                    }
                    
                    this.direction = bestDir;
                }
            } else if (availableDirs.length === 0) {
                // Reverse direction if completely stuck
                const reverseDir = { x: -this.direction.x, y: -this.direction.y };
                if (this.canMoveTo(this.gridX + reverseDir.x, this.gridY + reverseDir.y)) {
                    this.direction = reverseDir;
                }
            }
            
            // Start moving in chosen direction
            const nextX = this.gridX + this.direction.x;
            const nextY = this.gridY + this.direction.y;
            
            if (this.canMoveTo(nextX, nextY)) {
                this.targetX = nextX;
                this.targetY = nextY;
                this.moving = true;
                this.moveProgress = 0;
            }
        }
    }
    
    draw() {
        const screenX = offsetX + this.x * cellSize + cellSize / 2;
        const screenY = offsetY + this.y * cellSize + cellSize / 2;
        const radius = cellSize * 0.4;
        
        ctx.save();
        
        // Glow effect
        let glowColor = this.color;
        let fillColor = this.color;
        
        if (this.eaten) {
            // Just eyes when eaten
            this.drawEyes(screenX, screenY, radius);
            ctx.restore();
            return;
        }
        
        if (this.frightened) {
            // Flashing when almost done
            if (this.frightenedTimer < 2000 && Math.floor(this.frightenedTimer / 200) % 2) {
                glowColor = '#ffffff';
                fillColor = '#ffffff';
            } else {
                glowColor = '#0000ff';
                fillColor = '#0000ff';
            }
        }
        
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 15;
        
        // Ghost body
        ctx.beginPath();
        ctx.arc(screenX, screenY - radius * 0.2, radius, Math.PI, 0);
        ctx.lineTo(screenX + radius, screenY + radius * 0.6);
        
        // Wavy bottom
        const waveCount = 3;
        const waveWidth = (radius * 2) / waveCount;
        for (let i = 0; i < waveCount; i++) {
            const waveX = screenX + radius - (i + 1) * waveWidth;
            const waveY = screenY + radius * 0.6 + (i % 2 === 0 ? radius * 0.3 : 0);
            ctx.lineTo(waveX + waveWidth / 2, waveY);
            ctx.lineTo(waveX, screenY + radius * 0.6);
        }
        
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        
        // Eyes
        this.drawEyes(screenX, screenY, radius);
        
        ctx.restore();
    }
    
    drawEyes(screenX, screenY, radius) {
        const eyeRadius = radius * 0.25;
        const eyeOffsetX = radius * 0.35;
        const eyeOffsetY = -radius * 0.2;
        
        // White part
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screenX - eyeOffsetX, screenY + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.arc(screenX + eyeOffsetX, screenY + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils - look towards Pac-Man
        const dx = pacman.x - this.x;
        const dy = pacman.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const pupilOffsetX = (dx / dist) * eyeRadius * 0.4;
        const pupilOffsetY = (dy / dist) * eyeRadius * 0.4;
        
        ctx.fillStyle = '#0000ff';
        ctx.beginPath();
        ctx.arc(screenX - eyeOffsetX + pupilOffsetX, screenY + eyeOffsetY + pupilOffsetY, eyeRadius * 0.5, 0, Math.PI * 2);
        ctx.arc(screenX + eyeOffsetX + pupilOffsetX, screenY + eyeOffsetY + pupilOffsetY, eyeRadius * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ==================== GAME FUNCTIONS ====================
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Event listeners
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('nextLevelBtn').addEventListener('click', restartGame); // Play Again resets
    document.getElementById('resetBtn').addEventListener('click', restartGame);
    document.getElementById('soundBtn').addEventListener('click', toggleSound);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    
    // D-Pad controls (touch and mouse)
    const dpadBtns = document.querySelectorAll('.dpad-btn');
    dpadBtns.forEach(btn => {
        btn.addEventListener('touchstart', handleDpadInput, { passive: false });
        btn.addEventListener('mousedown', handleDpadInput);
    });
    
    // Keyboard controls
    document.addEventListener('keydown', handleKeyDown);
    
    // Resize handler
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize
    resizeCanvas();
    resetGame();
    drawGame();
}

function handleDpadInput(e) {
    e.preventDefault();
    if (!gameRunning || gamePaused) return;
    
    const dir = e.currentTarget.dataset.dir;
    switch(dir) {
        case 'up': pacman.setDirection(0, -1); break;
        case 'down': pacman.setDirection(0, 1); break;
        case 'left': pacman.setDirection(-1, 0); break;
        case 'right': pacman.setDirection(1, 0); break;
    }
}

function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    
    document.getElementById('pauseIcon').classList.toggle('hidden', gamePaused);
    document.getElementById('playIcon').classList.toggle('hidden', !gamePaused);
    document.querySelector('.game-container').classList.toggle('game-paused', gamePaused);
    
    if (!gamePaused) {
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
}

function resizeCanvas() {
    const container = document.querySelector('.game-main');
    const containerWidth = container.clientWidth - 20;
    const containerHeight = container.clientHeight - 20;
    
    // Calculate cell size to fit the maze
    const cellWidth = containerWidth / CONFIG.COLS;
    const cellHeight = containerHeight / CONFIG.ROWS;
    cellSize = Math.floor(Math.min(cellWidth, cellHeight));
    
    // Set canvas size
    canvas.width = cellSize * CONFIG.COLS;
    canvas.height = cellSize * CONFIG.ROWS;
    
    // Center offset
    offsetX = 0;
    offsetY = 0;
    
    if (gameRunning) {
        drawGame();
    }
}

function resetGame() {
    // Reset maze
    maze = JSON.parse(JSON.stringify(MAZE_TEMPLATE));
    
    // Count pellets
    pelletsRemaining = 0;
    for (let y = 0; y < CONFIG.ROWS; y++) {
        for (let x = 0; x < CONFIG.COLS; x++) {
            if (maze[y][x] === 2 || maze[y][x] === 3) {
                pelletsRemaining++;
            }
        }
    }
    
    // Create Pac-Man
    pacman = new Pacman();
    
    // Create ghosts
    ghosts = [
        new Ghost(9, 9, '#ff0000', 'blinky'),   // Red
        new Ghost(8, 9, '#ffb8ff', 'pinky'),    // Pink
        new Ghost(10, 9, '#00ffff', 'inky'),    // Cyan
        new Ghost(9, 10, '#ffb852', 'clyde')    // Orange
    ];
    
    // Set different exit delays
    ghosts[0].exitDelay = 0;
    ghosts[1].exitDelay = 2000;
    ghosts[2].exitDelay = 4000;
    ghosts[3].exitDelay = 6000;
}

function startGame() {
    initAudio();
    document.getElementById('startScreen').classList.add('hidden');
    gameRunning = true;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function restartGame() {
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('successScreen').classList.add('hidden');
    document.getElementById('startScreen').classList.add('hidden');
    
    // Reset pause state
    gamePaused = false;
    document.getElementById('pauseIcon').classList.remove('hidden');
    document.getElementById('playIcon').classList.add('hidden');
    document.querySelector('.game-container').classList.remove('game-paused');
    
    score = 0;
    lives = 3;
    level = 1;
    
    // Reset maze and all game objects
    resetGame();
    updateUI();
    
    gameRunning = true;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function handleKeyDown(e) {
    if (!gameRunning || gamePaused) return;
    
    switch(e.key) {
        case 'ArrowUp':
            e.preventDefault();
            pacman.setDirection(0, -1);
            break;
        case 'ArrowDown':
            e.preventDefault();
            pacman.setDirection(0, 1);
            break;
        case 'ArrowLeft':
            e.preventDefault();
            pacman.setDirection(-1, 0);
            break;
        case 'ArrowRight':
            e.preventDefault();
            pacman.setDirection(1, 0);
            break;
        case 'Escape':
        case 'p':
        case 'P':
            e.preventDefault();
            togglePause();
            break;
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById('soundOn').classList.toggle('hidden', !soundEnabled);
    document.getElementById('soundOff').classList.toggle('hidden', soundEnabled);
}

function activateFrightenedMode() {
    for (const ghost of ghosts) {
        if (!ghost.eaten) {
            ghost.frightened = true;
            ghost.frightenedTimer = CONFIG.FRIGHTENED_DURATION;
            // Reverse direction
            ghost.direction = { x: -ghost.direction.x, y: -ghost.direction.y };
        }
    }
}

function checkCollisions() {
    for (const ghost of ghosts) {
        // Use actual interpolated positions for smooth collision
        const dist = Math.sqrt(
            Math.pow(pacman.x - ghost.x, 2) + 
            Math.pow(pacman.y - ghost.y, 2)
        );
        
        if (dist < 0.6) {
            if (ghost.frightened && !ghost.eaten) {
                // Eat ghost
                ghost.eaten = true;
                score += CONFIG.GHOST_SCORE * level;
                playSound('eatGhost');
                updateUI();
            } else if (!ghost.eaten) {
                // Pac-Man dies
                pacmanDeath();
                return;
            }
        }
    }
}

function pacmanDeath() {
    lives--;
    playSound('death');
    updateUI();
    
    if (lives <= 0) {
        gameOver();
    } else {
        // Reset positions
        pacman.reset();
        for (const ghost of ghosts) {
            ghost.reset();
        }
    }
}

function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

function levelComplete() {
    gameRunning = false;
    playSound('levelUp');
    document.getElementById('levelScore').textContent = score;
    document.getElementById('successScreen').classList.remove('hidden');
}

function updateUI() {
    document.getElementById('scoreDisplay').textContent = score;
    
    const livesContainer = document.getElementById('livesDisplay');
    livesContainer.innerHTML = '';
    for (let i = 0; i < lives; i++) {
        const lifeSpan = document.createElement('span');
        lifeSpan.className = 'life-icon';
        lifeSpan.textContent = '●';
        livesContainer.appendChild(lifeSpan);
    }
}

// ==================== GAME LOOP ====================
function gameLoop(currentTime) {
    if (!gameRunning || gamePaused) return;
    
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Update
    pacman.update(deltaTime);
    for (const ghost of ghosts) {
        ghost.update(deltaTime);
    }
    
    // Check collisions
    checkCollisions();
    
    // Draw
    drawGame();
    
    requestAnimationFrame(gameLoop);
}

function drawGame() {
    // Clear canvas with pure black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw maze
    drawMaze();
    
    // Draw ghosts
    for (const ghost of ghosts) {
        ghost.draw();
    }
    
    // Draw Pac-Man
    pacman.draw();
}

function drawMaze() {
    for (let y = 0; y < CONFIG.ROWS; y++) {
        for (let x = 0; x < CONFIG.COLS; x++) {
            const cell = maze[y][x];
            const screenX = offsetX + x * cellSize;
            const screenY = offsetY + y * cellSize;
            
            if (cell === 1) {
                // Wall with neon glow
                ctx.fillStyle = '#000000';
                ctx.fillRect(screenX, screenY, cellSize, cellSize);
                
                // Add neon border to walls
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 1;
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 5;
                
                // Check adjacent cells to draw borders only on edges
                const hasTop = y > 0 && maze[y-1][x] !== 1;
                const hasBottom = y < CONFIG.ROWS - 1 && maze[y+1][x] !== 1;
                const hasLeft = x > 0 && maze[y][x-1] !== 1;
                const hasRight = x < CONFIG.COLS - 1 && maze[y][x+1] !== 1;
                
                ctx.beginPath();
                if (hasTop) {
                    ctx.moveTo(screenX, screenY);
                    ctx.lineTo(screenX + cellSize, screenY);
                }
                if (hasBottom) {
                    ctx.moveTo(screenX, screenY + cellSize);
                    ctx.lineTo(screenX + cellSize, screenY + cellSize);
                }
                if (hasLeft) {
                    ctx.moveTo(screenX, screenY);
                    ctx.lineTo(screenX, screenY + cellSize);
                }
                if (hasRight) {
                    ctx.moveTo(screenX + cellSize, screenY);
                    ctx.lineTo(screenX + cellSize, screenY + cellSize);
                }
                ctx.stroke();
                
                ctx.shadowBlur = 0;
            } else if (cell === 2) {
                // Small pellet
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 3;
                ctx.beginPath();
                ctx.arc(
                    screenX + cellSize / 2,
                    screenY + cellSize / 2,
                    cellSize * 0.1,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (cell === 3) {
                // Power pellet (pulsing)
                const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 10 * pulse;
                ctx.beginPath();
                ctx.arc(
                    screenX + cellSize / 2,
                    screenY + cellSize / 2,
                    cellSize * 0.25 * pulse,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }
}

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', initGame);
