/**
 * 2048 Game
 * A complete implementation of the 2048 sliding puzzle game
 * using vanilla JavaScript with ES6+ syntax.
 */

(() => {
    'use strict';

    // Game Configuration
    const GRID_SIZE = 4;
    const WINNING_TILE = 2048;

    // Game State
    const state = {
        grid: [],
        score: 0,
        bestScore: parseInt(localStorage.getItem('bestScore')) || 0,
        isGameOver: false,
        hasWon: false,
        isMoving: false
    };

    // DOM Elements
    const elements = {
        grid: document.getElementById('grid'),
        restartBtn: document.getElementById('restart-btn'),
        gameMessage: document.getElementById('game-message'),
        messageText: document.getElementById('message-text'),
        tryAgainBtn: document.getElementById('try-again-btn')
    };

    // Touch handling variables
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const MIN_SWIPE_DISTANCE = 30;

    /**
     * Initialize the game
     */
    function init() {
        createGrid();
        addEventListeners();
        startNewGame();
    }

    /**
     * Create the grid cells (background)
     */
    function createGrid() {
        elements.grid.innerHTML = '';
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            elements.grid.appendChild(cell);
        }
    }

    /**
     * Start a new game
     */
    function startNewGame() {
        state.grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
        state.score = 0;
        state.isGameOver = false;
        state.hasWon = false;
        state.isMoving = false;

        hideGameMessage();
        
        // Remove all tiles
        const tiles = elements.grid.querySelectorAll('.tile');
        tiles.forEach(tile => tile.remove());

        // Wait for layout to be ready, then add initial tiles
        requestAnimationFrame(() => {
            addRandomTile();
            addRandomTile();
        });
    }

    /**
     * Add event listeners
     */
    function addEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', handleKeyPress);

        // Touch controls
        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: false });

        // Button controls
        elements.restartBtn.addEventListener('click', startNewGame);
        elements.tryAgainBtn.addEventListener('click', startNewGame);
    }

    /**
     * Handle keyboard input
     */
    function handleKeyPress(event) {
        if (state.isGameOver || state.isMoving) return;

        const keyMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right'
        };

        const direction = keyMap[event.key];
        if (direction) {
            event.preventDefault();
            move(direction);
        }
    }

    /**
     * Handle touch start
     */
    function handleTouchStart(event) {
        if (state.isGameOver) return;
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }

    /**
     * Handle touch move (prevent scrolling)
     */
    function handleTouchMove(event) {
        event.preventDefault();
    }

    /**
     * Handle touch end
     */
    function handleTouchEnd(event) {
        if (state.isGameOver || state.isMoving) return;

        touchEndX = event.changedTouches[0].clientX;
        touchEndY = event.changedTouches[0].clientY;

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (Math.max(absDeltaX, absDeltaY) < MIN_SWIPE_DISTANCE) return;

        let direction;
        if (absDeltaX > absDeltaY) {
            direction = deltaX > 0 ? 'right' : 'left';
        } else {
            direction = deltaY > 0 ? 'down' : 'up';
        }

        move(direction);
    }

    /**
     * Move tiles in the specified direction
     */
    function move(direction) {
        state.isMoving = true;
        
        const previousGrid = state.grid.map(row => [...row]);
        let moved = false;

        switch (direction) {
            case 'up':
                moved = moveUp();
                break;
            case 'down':
                moved = moveDown();
                break;
            case 'left':
                moved = moveLeft();
                break;
            case 'right':
                moved = moveRight();
                break;
        }

        if (moved) {
            renderGrid();
            
            setTimeout(() => {
                addRandomTile();
                
                if (checkWin() && !state.hasWon) {
                    state.hasWon = true;
                    showGameMessage('You Win! 🎉');
                } else if (checkGameOver()) {
                    state.isGameOver = true;
                    showGameMessage('Game Over!');
                }
                
                state.isMoving = false;
            }, 150);
        } else {
            state.isMoving = false;
        }
    }

    /**
     * Move tiles up
     */
    function moveUp() {
        let moved = false;
        for (let col = 0; col < GRID_SIZE; col++) {
            const column = [];
            for (let row = 0; row < GRID_SIZE; row++) {
                column.push(state.grid[row][col]);
            }
            const newColumn = slideAndMerge(column);
            for (let row = 0; row < GRID_SIZE; row++) {
                if (state.grid[row][col] !== newColumn[row]) {
                    moved = true;
                }
                state.grid[row][col] = newColumn[row];
            }
        }
        return moved;
    }

    /**
     * Move tiles down
     */
    function moveDown() {
        let moved = false;
        for (let col = 0; col < GRID_SIZE; col++) {
            const column = [];
            for (let row = GRID_SIZE - 1; row >= 0; row--) {
                column.push(state.grid[row][col]);
            }
            const newColumn = slideAndMerge(column);
            for (let row = GRID_SIZE - 1; row >= 0; row--) {
                if (state.grid[row][col] !== newColumn[GRID_SIZE - 1 - row]) {
                    moved = true;
                }
                state.grid[row][col] = newColumn[GRID_SIZE - 1 - row];
            }
        }
        return moved;
    }

    /**
     * Move tiles left
     */
    function moveLeft() {
        let moved = false;
        for (let row = 0; row < GRID_SIZE; row++) {
            const newRow = slideAndMerge([...state.grid[row]]);
            for (let col = 0; col < GRID_SIZE; col++) {
                if (state.grid[row][col] !== newRow[col]) {
                    moved = true;
                }
                state.grid[row][col] = newRow[col];
            }
        }
        return moved;
    }

    /**
     * Move tiles right
     */
    function moveRight() {
        let moved = false;
        for (let row = 0; row < GRID_SIZE; row++) {
            const reversed = [...state.grid[row]].reverse();
            const newRow = slideAndMerge(reversed).reverse();
            for (let col = 0; col < GRID_SIZE; col++) {
                if (state.grid[row][col] !== newRow[col]) {
                    moved = true;
                }
                state.grid[row][col] = newRow[col];
            }
        }
        return moved;
    }

    /**
     * Slide and merge tiles in one direction
     */
    function slideAndMerge(line) {
        // Remove zeros
        let tiles = line.filter(val => val !== 0);
        
        // Merge adjacent equal tiles
        for (let i = 0; i < tiles.length - 1; i++) {
            if (tiles[i] === tiles[i + 1]) {
                tiles[i] *= 2;
                state.score += tiles[i];
                tiles.splice(i + 1, 1);
            }
        }
        
        // Pad with zeros
        while (tiles.length < GRID_SIZE) {
            tiles.push(0);
        }
        
        return tiles;
    }

    /**
     * Add a random tile (2 or 4) to an empty cell
     */
    function addRandomTile() {
        const emptyCells = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (state.grid[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length === 0) return;

        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const value = Math.random() < 0.9 ? 2 : 4;
        state.grid[randomCell.row][randomCell.col] = value;

        renderGrid(randomCell.row, randomCell.col);
    }

    /**
     * Render the grid with tiles
     */
    function renderGrid(newTileRow = -1, newTileCol = -1) {
        // Remove existing tiles
        const existingTiles = elements.grid.querySelectorAll('.tile');
        existingTiles.forEach(tile => tile.remove());

        // Get grid dimensions for positioning
        const gridRect = elements.grid.getBoundingClientRect();
        
        // If grid has no size yet, wait and try again
        if (gridRect.width === 0) {
            requestAnimationFrame(() => renderGrid(newTileRow, newTileCol));
            return;
        }
        
        const computedStyle = getComputedStyle(elements.grid);
        const padding = parseFloat(computedStyle.paddingLeft) || parseFloat(computedStyle.padding) || 10;
        const gap = parseFloat(computedStyle.gap) || 8;
        const availableSpace = gridRect.width - (padding * 2) - (gap * 3);
        const cellSize = availableSpace / 4;

        // Create tiles
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const value = state.grid[row][col];
                if (value !== 0) {
                    const tile = document.createElement('div');
                    tile.classList.add('tile');
                    tile.classList.add(getTileClass(value));
                    tile.textContent = value;

                    // Position tile
                    const left = padding + col * (cellSize + gap);
                    const top = padding + row * (cellSize + gap);
                    tile.style.left = `${left}px`;
                    tile.style.top = `${top}px`;
                    tile.style.width = `${cellSize}px`;
                    tile.style.height = `${cellSize}px`;

                    // Set font size based on value length
                    const fontSize = getFontSize(value, cellSize);
                    tile.style.fontSize = `${fontSize}px`;

                    // Add animation class for new tiles
                    if (row === newTileRow && col === newTileCol) {
                        tile.classList.add('tile-new');
                    }

                    elements.grid.appendChild(tile);
                }
            }
        }
    }

    /**
     * Get tile CSS class based on value
     */
    function getTileClass(value) {
        if (value <= 2048) {
            return `tile-${value}`;
        }
        return 'tile-super';
    }

    /**
     * Get font size based on tile value and cell size
     */
    function getFontSize(value, cellSize) {
        const digits = value.toString().length;
        const baseFontSize = cellSize * 0.45;
        
        if (digits <= 2) return baseFontSize;
        if (digits === 3) return baseFontSize * 0.8;
        if (digits === 4) return baseFontSize * 0.65;
        return baseFontSize * 0.5;
    }

    /**
     * Check if player has won
     */
    function checkWin() {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (state.grid[row][col] >= WINNING_TILE) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Check if game is over (no valid moves)
     */
    function checkGameOver() {
        // Check for empty cells
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (state.grid[row][col] === 0) {
                    return false;
                }
            }
        }

        // Check for possible merges
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const current = state.grid[row][col];
                
                // Check right neighbor
                if (col < GRID_SIZE - 1 && state.grid[row][col + 1] === current) {
                    return false;
                }
                
                // Check bottom neighbor
                if (row < GRID_SIZE - 1 && state.grid[row + 1][col] === current) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Show game message overlay
     */
    function showGameMessage(message) {
        elements.messageText.textContent = message;
        elements.gameMessage.classList.add('active');
    }

    /**
     * Hide game message overlay
     */
    function hideGameMessage() {
        elements.gameMessage.classList.remove('active');
    }

    /**
     * Handle window resize to reposition tiles
     */
    function handleResize() {
        renderGrid();
    }

    // Debounced resize handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleResize, 100);
    });

    // Initialize game when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
