/**
 * Classic Snake Game
 * Vanilla JavaScript Implementation
 */

(function() {
    'use strict';

    // Game Configuration
    const CONFIG = {
        GRID_SIZE: 20,
        INITIAL_SPEED: 200,
        MIN_SPEED: 60,
        SPEED_DECREASE: 5,
        INITIAL_SNAKE_LENGTH: 3
    };

    // Game State
    const state = {
        snake: [],
        food: null,
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        score: 0,
        gameLoop: null,
        isPlaying: false,
        isPaused: false,
        currentSpeed: CONFIG.INITIAL_SPEED
    };

    // DOM Elements
    const elements = {
        board: document.getElementById('game-board'),
        score: document.getElementById('score'),
        highScore: document.getElementById('high-score'),
        finalScore: document.getElementById('final-score'),
        overlay: document.getElementById('game-overlay'),
        overlayTitle: document.getElementById('overlay-title'),
        startBtn: document.getElementById('start-btn'),
        restartBtn: document.getElementById('restart-btn'),
        mobileControls: document.getElementById('mobile-controls')
    };

    // Load high score from localStorage
    let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;

    // Touch handling
    const touch = {
        startX: 0,
        startY: 0,
        threshold: 30
    };

    /**
     * Initialize the game board grid
     */
    function initBoard() {
        elements.board.innerHTML = '';
        elements.board.style.gridTemplateColumns = `repeat(${CONFIG.GRID_SIZE}, 1fr)`;
        elements.board.style.gridTemplateRows = `repeat(${CONFIG.GRID_SIZE}, 1fr)`;

        for (let row = 0; row < CONFIG.GRID_SIZE; row++) {
            for (let col = 0; col < CONFIG.GRID_SIZE; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                elements.board.appendChild(cell);
            }
        }
    }

    /**
     * Get cell element at specific position
     */
    function getCell(row, col) {
        return elements.board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    /**
     * Clear all snake and food classes from cells
     */
    function clearBoard() {
        const cells = elements.board.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('snake', 'snake-head', 'food');
        });
    }

    /**
     * Render the current game state
     */
    function render() {
        clearBoard();

        // Render snake
        state.snake.forEach((segment, index) => {
            const cell = getCell(segment.row, segment.col);
            if (cell) {
                cell.classList.add('snake');
                if (index === 0) {
                    cell.classList.add('snake-head');
                }
            }
        });

        // Render food
        if (state.food) {
            const foodCell = getCell(state.food.row, state.food.col);
            if (foodCell) {
                foodCell.classList.add('food');
            }
        }

        // Update score display
        elements.score.textContent = state.score;
        elements.highScore.textContent = highScore;
    }

    /**
     * Initialize snake at starting position
     */
    function initSnake() {
        state.snake = [];
        const startRow = Math.floor(CONFIG.GRID_SIZE / 2);
        const startCol = Math.floor(CONFIG.GRID_SIZE / 4);

        for (let i = 0; i < CONFIG.INITIAL_SNAKE_LENGTH; i++) {
            state.snake.push({
                row: startRow,
                col: startCol - i
            });
        }
    }

    /**
     * Spawn food at random empty position
     */
    function spawnFood() {
        const emptyCells = [];

        for (let row = 0; row < CONFIG.GRID_SIZE; row++) {
            for (let col = 0; col < CONFIG.GRID_SIZE; col++) {
                const isSnake = state.snake.some(
                    segment => segment.row === row && segment.col === col
                );
                if (!isSnake) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            state.food = emptyCells[randomIndex];
        }
    }

    /**
     * Move the snake in current direction
     */
    function moveSnake() {
        // Update direction
        state.direction = state.nextDirection;

        // Calculate new head position
        const head = { ...state.snake[0] };

        switch (state.direction) {
            case 'UP':
                head.row -= 1;
                break;
            case 'DOWN':
                head.row += 1;
                break;
            case 'LEFT':
                head.col -= 1;
                break;
            case 'RIGHT':
                head.col += 1;
                break;
        }

        // Check wall collision
        if (head.row < 0 || head.row >= CONFIG.GRID_SIZE ||
            head.col < 0 || head.col >= CONFIG.GRID_SIZE) {
            gameOver();
            return;
        }

        // Check self collision
        const selfCollision = state.snake.some(
            segment => segment.row === head.row && segment.col === head.col
        );
        if (selfCollision) {
            gameOver();
            return;
        }

        // Add new head
        state.snake.unshift(head);

        // Check food collision
        if (state.food && head.row === state.food.row && head.col === state.food.col) {
            state.score += 10;
            spawnFood();
            increaseSpeed();
        } else {
            // Remove tail if no food eaten
            state.snake.pop();
        }

        render();
    }

    /**
     * Increase game speed
     */
    function increaseSpeed() {
        if (state.currentSpeed > CONFIG.MIN_SPEED) {
            state.currentSpeed -= CONFIG.SPEED_DECREASE;
            restartGameLoop();
        }
    }

    /**
     * Restart the game loop with current speed
     */
    function restartGameLoop() {
        if (state.gameLoop) {
            clearInterval(state.gameLoop);
        }
        if (state.isPlaying && !state.isPaused) {
            state.gameLoop = setInterval(moveSnake, state.currentSpeed);
        }
    }

    /**
     * Start the game
     */
    function startGame() {
        // Reset state
        state.direction = 'RIGHT';
        state.nextDirection = 'RIGHT';
        state.score = 0;
        state.currentSpeed = CONFIG.INITIAL_SPEED;
        state.isPlaying = true;
        state.isPaused = false;

        // Initialize game elements
        initSnake();
        spawnFood();
        render();

        // Hide overlay
        elements.overlay.classList.add('hidden');

        // Update button
        elements.startBtn.textContent = 'Restart';

        // Start game loop
        restartGameLoop();
    }

    /**
     * End the game
     */
    function gameOver() {
        state.isPlaying = false;
        
        if (state.gameLoop) {
            clearInterval(state.gameLoop);
            state.gameLoop = null;
        }

        // Update high score
        if (state.score > highScore) {
            highScore = state.score;
            localStorage.setItem('snakeHighScore', highScore);
            elements.highScore.textContent = highScore;
        }

        // Show overlay
        elements.overlayTitle.textContent = 'Game Over!';
        elements.finalScore.textContent = state.score;
        elements.overlay.classList.remove('hidden');
    }

    /**
     * Highlight control button
     */
    function highlightControlButton(direction) {
        if (!elements.mobileControls) return;
        
        const dirMap = {
            'UP': '.ctrl-up',
            'DOWN': '.ctrl-down',
            'LEFT': '.ctrl-left',
            'RIGHT': '.ctrl-right'
        };
        
        const selector = dirMap[direction];
        if (selector) {
            const btn = elements.mobileControls.querySelector(selector);
            if (btn) {
                btn.classList.add('active');
                setTimeout(() => btn.classList.remove('active'), 150);
            }
        }
    }

    /**
     * Handle keyboard input
     */
    function handleKeydown(e) {
        if (!state.isPlaying) return;

        const key = e.key;
        const directions = {
            'ArrowUp': 'UP',
            'ArrowDown': 'DOWN',
            'ArrowLeft': 'LEFT',
            'ArrowRight': 'RIGHT',
            'w': 'UP',
            'W': 'UP',
            's': 'DOWN',
            'S': 'DOWN',
            'a': 'LEFT',
            'A': 'LEFT',
            'd': 'RIGHT',
            'D': 'RIGHT'
        };

        const newDirection = directions[key];
        if (newDirection) {
            e.preventDefault();
            changeDirection(newDirection);
            highlightControlButton(newDirection);
        }

        // Pause with space or P
        if (key === ' ' || key === 'p' || key === 'P') {
            e.preventDefault();
            togglePause();
        }
    }

    /**
     * Change snake direction (prevent 180° turns)
     */
    function changeDirection(newDirection) {
        const opposites = {
            'UP': 'DOWN',
            'DOWN': 'UP',
            'LEFT': 'RIGHT',
            'RIGHT': 'LEFT'
        };

        if (opposites[newDirection] !== state.direction) {
            state.nextDirection = newDirection;
        }
    }

    /**
     * Toggle pause state
     */
    function togglePause() {
        if (!state.isPlaying) return;

        state.isPaused = !state.isPaused;

        if (state.isPaused) {
            clearInterval(state.gameLoop);
            state.gameLoop = null;
            elements.overlayTitle.textContent = 'Paused';
            elements.finalScore.textContent = state.score;
            elements.overlay.classList.remove('hidden');
        } else {
            elements.overlay.classList.add('hidden');
            restartGameLoop();
        }
    }

    /**
     * Handle touch start
     */
    function handleTouchStart(e) {
        if (e.touches.length === 1) {
            touch.startX = e.touches[0].clientX;
            touch.startY = e.touches[0].clientY;
        }
    }

    /**
     * Handle touch end (swipe detection)
     */
    function handleTouchEnd(e) {
        if (!state.isPlaying || state.isPaused) return;
        if (e.changedTouches.length !== 1) return;

        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;

        const diffX = endX - touch.startX;
        const diffY = endY - touch.startY;

        const absDiffX = Math.abs(diffX);
        const absDiffY = Math.abs(diffY);

        // Check if swipe is significant enough
        if (Math.max(absDiffX, absDiffY) < touch.threshold) return;

        // Determine swipe direction
        if (absDiffX > absDiffY) {
            // Horizontal swipe
            changeDirection(diffX > 0 ? 'RIGHT' : 'LEFT');
        } else {
            // Vertical swipe
            changeDirection(diffY > 0 ? 'DOWN' : 'UP');
        }
    }

    /**
     * Handle window resize
     */
    function handleResize() {
        // The CSS handles responsive scaling
        // This function can be used for additional adjustments if needed
    }

    /**
     * Initialize event listeners
     */
    function initEventListeners() {
        // Button clicks
        elements.startBtn.addEventListener('click', startGame);
        elements.restartBtn.addEventListener('click', startGame);

        // Keyboard controls
        document.addEventListener('keydown', handleKeydown);

        // Touch controls
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        // Prevent default touch behavior on game board
        elements.board.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        // Handle resize
        window.addEventListener('resize', handleResize);

        // Prevent context menu on long press
        document.addEventListener('contextmenu', (e) => {
            if (state.isPlaying) {
                e.preventDefault();
            }
        });

        // Handle visibility change (pause when tab hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && state.isPlaying && !state.isPaused) {
                togglePause();
            }
        });

        // Mobile control buttons
        if (elements.mobileControls) {
            elements.mobileControls.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-dir]');
                if (btn && state.isPlaying && !state.isPaused) {
                    changeDirection(btn.dataset.dir);
                }
            });

            // Prevent double-tap zoom on mobile controls
            elements.mobileControls.addEventListener('touchend', (e) => {
                e.preventDefault();
                const btn = e.target.closest('[data-dir]');
                if (btn && state.isPlaying && !state.isPaused) {
                    changeDirection(btn.dataset.dir);
                }
            });
        }
    }

    /**
     * Initialize the game
     */
    function init() {
        initBoard();
        initEventListeners();
        
        // Initialize high score display
        elements.highScore.textContent = highScore;
        
        // Show initial state
        elements.overlayTitle.textContent = 'Snake Game';
        elements.finalScore.parentElement.innerHTML = '<p>Press Start to Play!</p>';
        elements.overlay.classList.remove('hidden');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
