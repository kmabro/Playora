/**
 * Classic Tetris Game
 * Vanilla JavaScript Implementation
 */

(function() {
    'use strict';

    // ========== Constants ==========
    const COLS = 10;
    const ROWS = 20;
    const BLOCK_SIZE = 30;
    const NEXT_BLOCK_SIZE = 20;
    
    const COLORS = {
        I: '#00f5ff',
        O: '#ffeb3b',
        T: '#9c27b0',
        S: '#4caf50',
        Z: '#f44336',
        J: '#2196f3',
        L: '#ff9800'
    };

    const SHAPES = {
        I: [
            [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
            [[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]],
            [[0,0,0,0], [0,0,0,0], [1,1,1,1], [0,0,0,0]],
            [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]]
        ],
        O: [
            [[1,1], [1,1]],
            [[1,1], [1,1]],
            [[1,1], [1,1]],
            [[1,1], [1,1]]
        ],
        T: [
            [[0,1,0], [1,1,1], [0,0,0]],
            [[0,1,0], [0,1,1], [0,1,0]],
            [[0,0,0], [1,1,1], [0,1,0]],
            [[0,1,0], [1,1,0], [0,1,0]]
        ],
        S: [
            [[0,1,1], [1,1,0], [0,0,0]],
            [[0,1,0], [0,1,1], [0,0,1]],
            [[0,0,0], [0,1,1], [1,1,0]],
            [[1,0,0], [1,1,0], [0,1,0]]
        ],
        Z: [
            [[1,1,0], [0,1,1], [0,0,0]],
            [[0,0,1], [0,1,1], [0,1,0]],
            [[0,0,0], [1,1,0], [0,1,1]],
            [[0,1,0], [1,1,0], [1,0,0]]
        ],
        J: [
            [[1,0,0], [1,1,1], [0,0,0]],
            [[0,1,1], [0,1,0], [0,1,0]],
            [[0,0,0], [1,1,1], [0,0,1]],
            [[0,1,0], [0,1,0], [1,1,0]]
        ],
        L: [
            [[0,0,1], [1,1,1], [0,0,0]],
            [[0,1,0], [0,1,0], [0,1,1]],
            [[0,0,0], [1,1,1], [1,0,0]],
            [[1,1,0], [0,1,0], [0,1,0]]
        ]
    };

    const PIECE_TYPES = Object.keys(SHAPES);
    
    // Scoring: 10 points per block (10 blocks per row)
    // 1 line = 100, 2 lines = 200, 3 lines = 300, 4 lines = 400
    const POINTS = {
        PER_BLOCK: 10,  // 10 points per block cancelled
        SOFT_DROP: 1
    };

    const LEVEL_SPEEDS = [
        800, 720, 630, 550, 470, 380, 300, 220, 130, 100,
        80, 80, 80, 70, 70, 70, 50, 50, 50, 30
    ];

    const SOFT_DROP_INTERVAL = 80; // Faster but not too quick

    // ========== Game State ==========
    let canvas, ctx, nextCanvas, nextCtx;
    let board = [];
    let currentPiece = null;
    let nextPiece = null;
    let score = 0;
    let highScore = 0;
    let level = 1;
    let lines = 0;
    let gameRunning = false;
    let gamePaused = false;
    let gameOver = false;
    let lastDropTime = 0;
    let dropInterval = LEVEL_SPEEDS[0];
    let animationId = null;

    // ========== DOM Elements ==========
    let scoreEl, highScoreEl;
    let overlay, overlayTitle, overlayMessage, startBtn;
    let pauseBtn, restartBtn;
    let btnLeft, btnRight, btnRotate, btnDown, btnDrop;

    // ========== Initialization ==========
    function init() {
        // Get DOM elements
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');
        nextCanvas = document.getElementById('next-canvas');
        nextCtx = nextCanvas.getContext('2d');
        
        scoreEl = document.getElementById('score');
        highScoreEl = document.getElementById('high-score');
        
        overlay = document.getElementById('game-overlay');
        overlayTitle = document.getElementById('overlay-title');
        overlayMessage = document.getElementById('overlay-message');
        startBtn = document.getElementById('start-btn');
        
        pauseBtn = document.getElementById('pause-btn');
        restartBtn = document.getElementById('restart-btn');
        
        btnLeft = document.getElementById('btn-left');
        btnRight = document.getElementById('btn-right');
        btnRotate = document.getElementById('btn-rotate');
        btnDown = document.getElementById('btn-down');
        btnDrop = document.getElementById('btn-drop');

        // Load high score from localStorage
        loadHighScore();

        // Setup canvas sizes
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Setup event listeners
        setupEventListeners();
        
        // Show start overlay
        showOverlay('TETRIS', 'Press Start to Play');
        
        // Update high score display
        updateUI();
    }

    function loadHighScore() {
        const saved = localStorage.getItem('tetris-high-score');
        if (saved) {
            highScore = parseInt(saved, 10) || 0;
        }
    }

    function saveHighScore() {
        localStorage.setItem('tetris-high-score', highScore.toString());
    }

    function resizeCanvas() {
        const gameArea = document.querySelector('.game-area');
        const availableWidth = gameArea.clientWidth * 0.98;
        const availableHeight = gameArea.clientHeight * 0.98;
        
        // Calculate the best size maintaining aspect ratio (10:20 = 1:2)
        const aspectRatio = COLS / ROWS;
        let canvasWidth, canvasHeight;
        
        if (availableWidth / availableHeight > aspectRatio) {
            canvasHeight = availableHeight;
            canvasWidth = canvasHeight * aspectRatio;
        } else {
            canvasWidth = availableWidth;
            canvasHeight = canvasWidth / aspectRatio;
        }
        
        // Set canvas display size
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;
        
        // Set canvas internal resolution
        const scale = window.devicePixelRatio || 1;
        canvas.width = COLS * BLOCK_SIZE * scale;
        canvas.height = ROWS * BLOCK_SIZE * scale;
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        
        // Next piece canvas - small fixed size
        const nextDisplaySize = 50;
        nextCanvas.style.width = `${nextDisplaySize}px`;
        nextCanvas.style.height = `${nextDisplaySize}px`;
        // Use fixed internal size for consistent rendering
        nextCanvas.width = 80;
        nextCanvas.height = 80;
        nextCtx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Redraw if game is running
        if (gameRunning || gameOver) {
            draw();
            drawNextPiece();
        }
    }

    function setupEventListeners() {
        // Start button (also handles resume)
        startBtn.addEventListener('click', () => {
            if (gamePaused) {
                togglePause();
            } else {
                startGame();
            }
        });
        
        // Pause button
        pauseBtn.addEventListener('click', togglePause);
        
        // Restart button
        restartBtn.addEventListener('click', restartGame);
        
        // Keyboard controls
        document.addEventListener('keydown', handleKeyDown);
        
        // Touch controls
        setupTouchControls();
    }

    function addButtonHighlight(btn) {
        btn.classList.add('pressed');
    }

    function removeButtonHighlight(btn) {
        btn.classList.remove('pressed');
    }

    function setupTouchControls() {
        // Prevent default touch behavior
        const preventTouch = (e) => e.preventDefault();
        
        // Left button
        btnLeft.addEventListener('touchstart', (e) => {
            preventTouch(e);
            addButtonHighlight(btnLeft);
            movePiece(-1, 0);
        });
        btnLeft.addEventListener('touchend', () => removeButtonHighlight(btnLeft));
        btnLeft.addEventListener('touchcancel', () => removeButtonHighlight(btnLeft));
        btnLeft.addEventListener('click', () => movePiece(-1, 0));
        
        // Right button
        btnRight.addEventListener('touchstart', (e) => {
            preventTouch(e);
            addButtonHighlight(btnRight);
            movePiece(1, 0);
        });
        btnRight.addEventListener('touchend', () => removeButtonHighlight(btnRight));
        btnRight.addEventListener('touchcancel', () => removeButtonHighlight(btnRight));
        btnRight.addEventListener('click', () => movePiece(1, 0));
        
        // Rotate button
        btnRotate.addEventListener('touchstart', (e) => {
            preventTouch(e);
            addButtonHighlight(btnRotate);
            rotatePiece();
        });
        btnRotate.addEventListener('touchend', () => removeButtonHighlight(btnRotate));
        btnRotate.addEventListener('touchcancel', () => removeButtonHighlight(btnRotate));
        btnRotate.addEventListener('click', () => rotatePiece());
        
        // Down button - continuous soft drop (faster interval)
        let downInterval = null;
        
        const startDown = (e) => {
            if (e) preventTouch(e);
            addButtonHighlight(btnDown);
            softDrop();
            downInterval = setInterval(softDrop, SOFT_DROP_INTERVAL);
        };
        
        const stopDown = () => {
            removeButtonHighlight(btnDown);
            if (downInterval) {
                clearInterval(downInterval);
                downInterval = null;
            }
        };
        
        btnDown.addEventListener('touchstart', startDown);
        btnDown.addEventListener('touchend', stopDown);
        btnDown.addEventListener('touchcancel', stopDown);
        btnDown.addEventListener('mousedown', startDown);
        btnDown.addEventListener('mouseup', stopDown);
        btnDown.addEventListener('mouseleave', stopDown);
        
        // Hard Drop button (for mobile - like Space on keyboard)
        btnDrop.addEventListener('touchstart', (e) => {
            preventTouch(e);
            addButtonHighlight(btnDrop);
            hardDrop();
        });
        btnDrop.addEventListener('touchend', () => removeButtonHighlight(btnDrop));
        btnDrop.addEventListener('touchcancel', () => removeButtonHighlight(btnDrop));
        btnDrop.addEventListener('click', () => hardDrop());
        
        // Also allow tapping anywhere on canvas for hard drop on mobile
        canvas.addEventListener('touchstart', (e) => {
            if (!gameRunning || gamePaused || gameOver) return;
            // Only trigger if it's a quick tap (not a drag)
            const touch = e.touches[0];
            const startY = touch.clientY;
            
            const onTouchEnd = (endE) => {
                const endTouch = endE.changedTouches[0];
                const endY = endTouch.clientY;
                // If finger moved down significantly, it's a swipe down = hard drop
                if (endY - startY > 30) {
                    hardDrop();
                }
                canvas.removeEventListener('touchend', onTouchEnd);
            };
            
            canvas.addEventListener('touchend', onTouchEnd);
        });
    }

    function handleKeyDown(e) {
        if (!gameRunning || gamePaused) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (gameOver || !gameRunning) {
                    startGame();
                } else if (gamePaused) {
                    togglePause();
                }
            }
            return;
        }
        
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                movePiece(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                movePiece(1, 0);
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                e.preventDefault();
                rotatePiece();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                softDrop();
                break;
            case ' ':
                e.preventDefault();
                hardDrop();
                break;
            case 'p':
            case 'P':
            case 'Escape':
                e.preventDefault();
                togglePause();
                break;
        }
    }

    // ========== Game Logic ==========
    function startGame() {
        // Reset game state
        board = createBoard();
        score = 0;
        level = 1;
        lines = 0;
        gameRunning = true;
        gamePaused = false;
        gameOver = false;
        dropInterval = LEVEL_SPEEDS[0];
        
        // Update UI
        updateUI();
        hideOverlay();
        pauseBtn.textContent = '⏸ Pause';
        
        // Create first pieces
        currentPiece = createPiece();
        nextPiece = createPiece();
        
        // Draw next piece
        drawNextPiece();
        
        // Start game loop
        lastDropTime = performance.now();
        gameLoop();
    }

    function restartGame() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        startGame();
    }

    function togglePause() {
        if (!gameRunning || gameOver) return;
        
        gamePaused = !gamePaused;
        pauseBtn.textContent = gamePaused ? '▶ Resume' : '⏸ Pause';
        
        if (gamePaused) {
            showOverlay('PAUSED', 'Game Paused', true);
        } else {
            hideOverlay();
            lastDropTime = performance.now();
            gameLoop();
        }
    }

    function createBoard() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    function createPiece() {
        const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
        return {
            type: type,
            shape: SHAPES[type],
            color: COLORS[type],
            rotation: 0,
            x: Math.floor((COLS - SHAPES[type][0][0].length) / 2),
            y: 0
        };
    }

    function getCurrentShape(piece) {
        return piece.shape[piece.rotation];
    }

    function isValidMove(piece, offsetX, offsetY, newRotation = piece.rotation) {
        const shape = piece.shape[newRotation];
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = piece.x + col + offsetX;
                    const newY = piece.y + row + offsetY;
                    
                    // Check boundaries
                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return false;
                    }
                    
                    // Check collision with placed blocks (ignore if above board)
                    if (newY >= 0 && board[newY][newX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    function movePiece(dx, dy) {
        if (!gameRunning || gamePaused || gameOver) return false;
        
        if (isValidMove(currentPiece, dx, dy)) {
            currentPiece.x += dx;
            currentPiece.y += dy;
            return true;
        }
        return false;
    }

    function rotatePiece() {
        if (!gameRunning || gamePaused || gameOver) return;
        
        const newRotation = (currentPiece.rotation + 1) % 4;
        
        // Try normal rotation
        if (isValidMove(currentPiece, 0, 0, newRotation)) {
            currentPiece.rotation = newRotation;
            return;
        }
        
        // Wall kick - try moving left or right
        const kicks = [-1, 1, -2, 2];
        for (const kick of kicks) {
            if (isValidMove(currentPiece, kick, 0, newRotation)) {
                currentPiece.x += kick;
                currentPiece.rotation = newRotation;
                return;
            }
        }
    }

    function softDrop() {
        if (movePiece(0, 1)) {
            score += POINTS.SOFT_DROP;
            updateUI();
            lastDropTime = performance.now();
        }
    }

    function hardDrop() {
        if (!gameRunning || gamePaused || gameOver) return;
        
        let dropDistance = 0;
        while (isValidMove(currentPiece, 0, 1)) {
            currentPiece.y++;
            dropDistance++;
        }
        score += dropDistance * 2;
        updateUI();
        lockPiece();
    }

    function lockPiece() {
        const shape = getCurrentShape(currentPiece);
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardY = currentPiece.y + row;
                    const boardX = currentPiece.x + col;
                    
                    if (boardY >= 0) {
                        board[boardY][boardX] = currentPiece.color;
                    }
                }
            }
        }
        
        // Check for completed lines
        checkLines();
        
        // Spawn new piece
        spawnNewPiece();
    }

    function checkLines() {
        const completedLines = [];
        
        for (let row = ROWS - 1; row >= 0; row--) {
            if (board[row].every(cell => cell !== 0)) {
                completedLines.push(row);
            }
        }
        
        if (completedLines.length > 0) {
            // Remove completed lines
            clearLines(completedLines);
            
            // Score: 10 points per block cancelled (10 blocks per row)
            // 1 row = 100 pts, 2 rows = 200 pts, etc.
            const blocksCleared = completedLines.length * COLS;
            score += blocksCleared * POINTS.PER_BLOCK * level;
            lines += completedLines.length;
            
            // Update level (every 10 lines)
            const newLevel = Math.floor(lines / 10) + 1;
            if (newLevel !== level) {
                level = Math.min(newLevel, 20);
                dropInterval = LEVEL_SPEEDS[level - 1];
            }
            
            // Update high score if needed
            if (score > highScore) {
                highScore = score;
                saveHighScore();
            }
            
            updateUI();
        }
    }

    function clearLines(completedLines) {
        // Sort lines from top to bottom
        completedLines.sort((a, b) => a - b);
        
        // Remove lines from bottom to top
        for (let i = completedLines.length - 1; i >= 0; i--) {
            board.splice(completedLines[i], 1);
            board.unshift(Array(COLS).fill(0));
        }
    }

    function spawnNewPiece() {
        currentPiece = nextPiece;
        nextPiece = createPiece();
        drawNextPiece();
        
        // Check if new piece can be placed
        if (!isValidMove(currentPiece, 0, 0)) {
            endGame();
        }
    }

    function endGame() {
        gameRunning = false;
        gameOver = true;
        
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        
        // Update high score
        if (score > highScore) {
            highScore = score;
            saveHighScore();
        }
        
        showOverlay('GAME OVER', `Score: ${score.toLocaleString()}${score >= highScore ? ' (New High Score!)' : ''}`);
        startBtn.textContent = 'Play Again';
        updateUI();
    }

    // ========== Game Loop ==========
    function gameLoop(currentTime = 0) {
        if (!gameRunning || gamePaused) return;
        
        const deltaTime = currentTime - lastDropTime;
        
        if (deltaTime >= dropInterval) {
            if (!movePiece(0, 1)) {
                lockPiece();
            }
            lastDropTime = currentTime;
        }
        
        draw();
        animationId = requestAnimationFrame(gameLoop);
    }

    // ========== Rendering ==========
    function draw() {
        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        
        // Draw grid
        drawGrid();
        
        // Draw placed blocks
        drawBoard();
        
        // Draw ghost piece
        drawGhostPiece();
        
        // Draw current piece
        if (currentPiece) {
            drawPiece(currentPiece);
        }
    }

    function drawGrid() {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        for (let x = 0; x <= COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(x * BLOCK_SIZE, 0);
            ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
            ctx.stroke();
        }
        
        for (let y = 0; y <= ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * BLOCK_SIZE);
            ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
            ctx.stroke();
        }
    }

    function drawBoard() {
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (board[row][col]) {
                    drawBlock(col, row, board[row][col]);
                }
            }
        }
    }

    function drawPiece(piece) {
        const shape = getCurrentShape(piece);
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    drawBlock(piece.x + col, piece.y + row, piece.color);
                }
            }
        }
    }

    function drawGhostPiece() {
        if (!currentPiece) return;
        
        // Find ghost position
        let ghostY = currentPiece.y;
        while (isValidMove(currentPiece, 0, ghostY - currentPiece.y + 1)) {
            ghostY++;
        }
        
        const shape = getCurrentShape(currentPiece);
        ctx.globalAlpha = 0.3;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    drawBlock(currentPiece.x + col, ghostY + row, currentPiece.color, true);
                }
            }
        }
        
        ctx.globalAlpha = 1;
    }

    function drawBlock(x, y, color, isGhost = false) {
        if (y < 0) return; // Don't draw above the board
        
        const padding = 1;
        const size = BLOCK_SIZE - padding * 2;
        const posX = x * BLOCK_SIZE + padding;
        const posY = y * BLOCK_SIZE + padding;
        
        // Main block
        ctx.fillStyle = color;
        ctx.fillRect(posX, posY, size, size);
        
        if (!isGhost) {
            // Highlight (top-left)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(posX, posY, size, 3);
            ctx.fillRect(posX, posY, 3, size);
            
            // Shadow (bottom-right)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(posX, posY + size - 3, size, 3);
            ctx.fillRect(posX + size - 3, posY, 3, size);
        }
        
        // Border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(posX, posY, size, size);
    }

    function drawNextPiece() {
        const canvasSize = 80; // Fixed internal canvas size
        
        // Clear next canvas
        nextCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        nextCtx.fillRect(0, 0, canvasSize, canvasSize);
        
        if (!nextPiece) return;
        
        const shape = nextPiece.shape[0];
        
        // Find actual bounds of the piece (ignore empty rows/cols)
        let minRow = shape.length, maxRow = 0, minCol = shape[0].length, maxCol = 0;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    minRow = Math.min(minRow, row);
                    maxRow = Math.max(maxRow, row);
                    minCol = Math.min(minCol, col);
                    maxCol = Math.max(maxCol, col);
                }
            }
        }
        
        const pieceWidth = maxCol - minCol + 1;
        const pieceHeight = maxRow - minRow + 1;
        
        // Calculate block size to fit in canvas with padding
        const padding = 8;
        const availableSize = canvasSize - padding * 2;
        const blockSize = Math.floor(Math.min(availableSize / pieceWidth, availableSize / pieceHeight));
        
        // Center the piece
        const totalWidth = pieceWidth * blockSize;
        const totalHeight = pieceHeight * blockSize;
        const startX = (canvasSize - totalWidth) / 2;
        const startY = (canvasSize - totalHeight) / 2;
        
        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                if (shape[row][col]) {
                    const x = startX + (col - minCol) * blockSize;
                    const y = startY + (row - minRow) * blockSize;
                    
                    // Draw block with gap
                    const gap = 1;
                    const size = blockSize - gap * 2;
                    
                    nextCtx.fillStyle = nextPiece.color;
                    nextCtx.fillRect(x + gap, y + gap, size, size);
                    
                    // Highlight
                    nextCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    nextCtx.fillRect(x + gap, y + gap, size, 2);
                    nextCtx.fillRect(x + gap, y + gap, 2, size);
                    
                    // Shadow
                    nextCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    nextCtx.fillRect(x + gap, y + gap + size - 2, size, 2);
                    nextCtx.fillRect(x + gap + size - 2, y + gap, 2, size);
                }
            }
        }
    }

    // ========== UI Updates ==========
    function updateUI() {
        scoreEl.textContent = score.toLocaleString();
        highScoreEl.textContent = highScore.toLocaleString();
    }

    function showOverlay(title, message, isPaused = false) {
        overlayTitle.textContent = title;
        overlayMessage.textContent = message;
        if (isPaused) {
            startBtn.textContent = 'Resume';
        } else {
            startBtn.textContent = gameOver ? 'Play Again' : 'Start Game';
        }
        overlay.classList.remove('hidden');
    }

    function hideOverlay() {
        overlay.classList.add('hidden');
    }

    // ========== Initialize Game ==========
    document.addEventListener('DOMContentLoaded', init);
})();
