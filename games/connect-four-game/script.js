/**
 * Connect Four Game
 * Vanilla JavaScript implementation with Human vs Human and Human vs AI modes
 */
(function() {
    'use strict';

    // Game Constants
    const ROWS = 6;
    const COLS = 7;
    const EMPTY = 0;
    const PLAYER1 = 1;
    const PLAYER2 = 2;
    const WIN_LENGTH = 4;

    // Game State
    const state = {
        board: [],
        currentPlayer: PLAYER1,
        gameOver: false,
        gameMode: 'pvc', // 'pvp' or 'pvc'
        isAIThinking: false,
        winningCells: []
    };

    // DOM Elements
    const elements = {
        board: null,
        statusText: null,
        playerDisc: null,
        gameStatus: null,
        resetBtn: null,
        modeBtns: null
    };

    /**
     * Initialize the game
     */
    function init() {
        cacheElements();
        createBoard();
        bindEvents();
        resetGame();
    }

    /**
     * Cache DOM elements for better performance
     */
    function cacheElements() {
        elements.board = document.querySelector('.board');
        elements.statusText = document.querySelector('.status-text');
        elements.playerDisc = document.querySelector('.player-disc');
        elements.gameStatus = document.querySelector('.game-status');
        elements.resetBtn = document.querySelector('.reset-btn');
        elements.modeBtns = document.querySelectorAll('.mode-btn');
    }

    /**
     * Create the game board grid
     */
    function createBoard() {
        elements.board.innerHTML = '';
        
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.setAttribute('role', 'gridcell');
                cell.setAttribute('aria-label', `Row ${row + 1}, Column ${col + 1}, empty`);
                cell.setAttribute('tabindex', '0');
                elements.board.appendChild(cell);
            }
        }
    }

    /**
     * Bind event listeners
     */
    function bindEvents() {
        // Board click events
        elements.board.addEventListener('click', handleCellClick);
        elements.board.addEventListener('keydown', handleKeyPress);

        // Reset button
        elements.resetBtn.addEventListener('click', resetGame);

        // Mode selection
        elements.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.mode !== state.gameMode) {
                    setGameMode(btn.dataset.mode);
                }
            });
        });
    }

    /**
     * Handle cell click
     * @param {Event} e - Click event
     */
    function handleCellClick(e) {
        const cell = e.target.closest('.cell');
        if (!cell) return;

        const col = parseInt(cell.dataset.col);
        makeMove(col);
    }

    /**
     * Handle keyboard navigation
     * @param {KeyboardEvent} e - Keyboard event
     */
    function handleKeyPress(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            const cell = e.target.closest('.cell');
            if (cell) {
                e.preventDefault();
                const col = parseInt(cell.dataset.col);
                makeMove(col);
            }
        }
    }

    /**
     * Make a move in the specified column
     * @param {number} col - Column index
     */
    function makeMove(col) {
        if (state.gameOver || state.isAIThinking) return;
        if (state.gameMode === 'pvc' && state.currentPlayer === PLAYER2) return;

        const row = getLowestEmptyRow(col);
        if (row === -1) return; // Column is full

        placeDisc(row, col, state.currentPlayer);
    }

    /**
     * Place a disc on the board
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} player - Player number
     */
    function placeDisc(row, col, player) {
        state.board[row][col] = player;

        const cell = getCell(row, col);
        cell.classList.add('filled');

        const disc = document.createElement('div');
        disc.className = `disc player${player}`;
        cell.appendChild(disc);

        // Update aria label
        cell.setAttribute('aria-label', `Row ${row + 1}, Column ${col + 1}, Player ${player}`);

        // Check for win or draw
        if (checkWin(row, col, player)) {
            endGame(player);
            return;
        }

        if (checkDraw()) {
            endGame(null);
            return;
        }

        // Switch player
        switchPlayer();

        // AI move if applicable
        if (state.gameMode === 'pvc' && state.currentPlayer === PLAYER2 && !state.gameOver) {
            makeAIMove();
        }
    }

    /**
     * Get the lowest empty row in a column
     * @param {number} col - Column index
     * @returns {number} Row index or -1 if column is full
     */
    function getLowestEmptyRow(col) {
        for (let row = ROWS - 1; row >= 0; row--) {
            if (state.board[row][col] === EMPTY) {
                return row;
            }
        }
        return -1;
    }

    /**
     * Get cell element by row and column
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {HTMLElement} Cell element
     */
    function getCell(row, col) {
        return elements.board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    /**
     * Switch to the next player
     */
    function switchPlayer() {
        state.currentPlayer = state.currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1;
        updateStatus();
        updateBoardClass();
    }

    /**
     * Update the status display
     */
    function updateStatus() {
        const playerName = state.gameMode === 'pvc' && state.currentPlayer === PLAYER2 
            ? 'AI' 
            : `Player ${state.currentPlayer}`;
        
        elements.statusText.textContent = `${playerName}'s Turn`;
        elements.playerDisc.className = `player-disc current-player player${state.currentPlayer}`;
        elements.gameStatus.classList.remove('winner', 'draw');
    }

    /**
     * Update board class for hover effects
     */
    function updateBoardClass() {
        elements.board.classList.remove('player1-turn', 'player2-turn', 'disabled');
        
        if (!state.gameOver) {
            elements.board.classList.add(`player${state.currentPlayer}-turn`);
        } else {
            elements.board.classList.add('disabled');
        }
    }

    /**
     * Check for a win condition
     * @param {number} row - Last placed row
     * @param {number} col - Last placed column
     * @param {number} player - Player to check
     * @returns {boolean} True if player won
     */
    function checkWin(row, col, player) {
        const directions = [
            { dr: 0, dc: 1 },   // Horizontal
            { dr: 1, dc: 0 },   // Vertical
            { dr: 1, dc: 1 },   // Diagonal down-right
            { dr: 1, dc: -1 }   // Diagonal down-left
        ];

        for (const { dr, dc } of directions) {
            const cells = getConnectedCells(row, col, dr, dc, player);
            if (cells.length >= WIN_LENGTH) {
                state.winningCells = cells.slice(0, WIN_LENGTH);
                return true;
            }
        }

        return false;
    }

    /**
     * Get all connected cells in a direction
     * @param {number} row - Starting row
     * @param {number} col - Starting column
     * @param {number} dr - Row direction
     * @param {number} dc - Column direction
     * @param {number} player - Player to check
     * @returns {Array} Array of connected cell coordinates
     */
    function getConnectedCells(row, col, dr, dc, player) {
        const cells = [{ row, col }];

        // Check positive direction
        for (let i = 1; i < WIN_LENGTH; i++) {
            const r = row + dr * i;
            const c = col + dc * i;
            if (isValidCell(r, c) && state.board[r][c] === player) {
                cells.push({ row: r, col: c });
            } else {
                break;
            }
        }

        // Check negative direction
        for (let i = 1; i < WIN_LENGTH; i++) {
            const r = row - dr * i;
            const c = col - dc * i;
            if (isValidCell(r, c) && state.board[r][c] === player) {
                cells.unshift({ row: r, col: c });
            } else {
                break;
            }
        }

        return cells;
    }

    /**
     * Check if cell coordinates are valid
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {boolean} True if valid
     */
    function isValidCell(row, col) {
        return row >= 0 && row < ROWS && col >= 0 && col < COLS;
    }

    /**
     * Check for a draw
     * @returns {boolean} True if game is a draw
     */
    function checkDraw() {
        return state.board[0].every(cell => cell !== EMPTY);
    }

    /**
     * End the game
     * @param {number|null} winner - Winner player number or null for draw
     */
    function endGame(winner) {
        state.gameOver = true;
        elements.board.classList.add('disabled');

        if (winner) {
            const winnerName = state.gameMode === 'pvc' && winner === PLAYER2 
                ? 'AI Wins!' 
                : `Player ${winner} Wins!`;
            
            elements.statusText.textContent = winnerName;
            elements.playerDisc.className = `player-disc player${winner}`;
            elements.gameStatus.classList.add('winner');
            highlightWinningCells();
        } else {
            elements.statusText.textContent = "It's a Draw!";
            elements.playerDisc.className = 'player-disc';
            elements.gameStatus.classList.add('draw');
        }
    }

    /**
     * Highlight the winning cells
     */
    function highlightWinningCells() {
        for (const { row, col } of state.winningCells) {
            const cell = getCell(row, col);
            const disc = cell.querySelector('.disc');
            if (disc) {
                disc.classList.add('winning');
            }
        }
    }

    /**
     * Make an AI move (random strategy)
     */
    function makeAIMove() {
        state.isAIThinking = true;

        // Add a small delay for better UX
        setTimeout(() => {
            const availableCols = getAvailableColumns();
            
            if (availableCols.length > 0) {
                // Try to win first
                const winningCol = findWinningMove(PLAYER2);
                if (winningCol !== -1) {
                    const row = getLowestEmptyRow(winningCol);
                    state.isAIThinking = false;
                    placeDisc(row, winningCol, PLAYER2);
                    return;
                }

                // Try to block opponent's win
                const blockingCol = findWinningMove(PLAYER1);
                if (blockingCol !== -1) {
                    const row = getLowestEmptyRow(blockingCol);
                    state.isAIThinking = false;
                    placeDisc(row, blockingCol, PLAYER2);
                    return;
                }

                // Random move with preference for center
                const col = selectSmartRandomColumn(availableCols);
                const row = getLowestEmptyRow(col);
                state.isAIThinking = false;
                placeDisc(row, col, PLAYER2);
            }
        }, 500);
    }

    /**
     * Get all columns that are not full
     * @returns {Array} Array of available column indices
     */
    function getAvailableColumns() {
        const available = [];
        for (let col = 0; col < COLS; col++) {
            if (state.board[0][col] === EMPTY) {
                available.push(col);
            }
        }
        return available;
    }

    /**
     * Find a winning move for a player
     * @param {number} player - Player to check
     * @returns {number} Column index or -1 if no winning move
     */
    function findWinningMove(player) {
        for (let col = 0; col < COLS; col++) {
            const row = getLowestEmptyRow(col);
            if (row === -1) continue;

            // Simulate the move
            state.board[row][col] = player;
            const isWin = checkWinSimulation(row, col, player);
            state.board[row][col] = EMPTY;

            if (isWin) {
                return col;
            }
        }
        return -1;
    }

    /**
     * Check for win without setting winning cells
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} player - Player to check
     * @returns {boolean} True if winning
     */
    function checkWinSimulation(row, col, player) {
        const directions = [
            { dr: 0, dc: 1 },
            { dr: 1, dc: 0 },
            { dr: 1, dc: 1 },
            { dr: 1, dc: -1 }
        ];

        for (const { dr, dc } of directions) {
            let count = 1;

            // Positive direction
            for (let i = 1; i < WIN_LENGTH; i++) {
                const r = row + dr * i;
                const c = col + dc * i;
                if (isValidCell(r, c) && state.board[r][c] === player) {
                    count++;
                } else {
                    break;
                }
            }

            // Negative direction
            for (let i = 1; i < WIN_LENGTH; i++) {
                const r = row - dr * i;
                const c = col - dc * i;
                if (isValidCell(r, c) && state.board[r][c] === player) {
                    count++;
                } else {
                    break;
                }
            }

            if (count >= WIN_LENGTH) {
                return true;
            }
        }

        return false;
    }

    /**
     * Select a random column with preference for center columns
     * @param {Array} availableCols - Available columns
     * @returns {number} Selected column
     */
    function selectSmartRandomColumn(availableCols) {
        // Weight center columns more heavily
        const centerCol = Math.floor(COLS / 2);
        const weightedCols = [];

        for (const col of availableCols) {
            const distance = Math.abs(col - centerCol);
            const weight = COLS - distance; // Higher weight for center
            for (let i = 0; i < weight; i++) {
                weightedCols.push(col);
            }
        }

        return weightedCols[Math.floor(Math.random() * weightedCols.length)];
    }

    /**
     * Set the game mode
     * @param {string} mode - Game mode ('pvp' or 'pvc')
     */
    function setGameMode(mode) {
        state.gameMode = mode;

        elements.modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        resetGame();
    }

    /**
     * Reset the game
     */
    function resetGame() {
        // Reset state
        state.board = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
        state.currentPlayer = PLAYER1;
        state.gameOver = false;
        state.isAIThinking = false;
        state.winningCells = [];

        // Clear board
        const cells = elements.board.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('filled');
            cell.innerHTML = '';
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            cell.setAttribute('aria-label', `Row ${row + 1}, Column ${col + 1}, empty`);
        });

        // Update UI
        updateStatus();
        updateBoardClass();
    }

    // Initialize game when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
