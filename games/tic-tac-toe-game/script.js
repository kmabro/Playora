/**
 * Tic Tac Toe - Human vs AI (Minimax)
 * A fully responsive, accessible game with optimal AI play
 */

// ============================================
// GAME CONSTANTS
// ============================================
const PLAYER = {
    HUMAN: 'X',
    AI: 'O',
    EMPTY: ''
};

// All possible winning combinations (board indices)
const WINNING_COMBINATIONS = Object.freeze([
    [0, 1, 2], // Top row
    [3, 4, 5], // Middle row
    [6, 7, 8], // Bottom row
    [0, 3, 6], // Left column
    [1, 4, 7], // Middle column
    [2, 5, 8], // Right column
    [0, 4, 8], // Diagonal: top-left to bottom-right
    [2, 4, 6]  // Diagonal: top-right to bottom-left
]);

// AI thinking delay range (ms)
const AI_DELAY = {
    MIN: 300,
    MAX: 600
};

// Game modes
const MODE = {
    AI: 'ai',
    HUMAN: 'human'
};

// ============================================
// GAME STATE
// ============================================
const GameState = {
    board: Array(9).fill(PLAYER.EMPTY),
    isActive: true,
    isAITurn: false,
    currentPlayer: 'X',  // Track current player for human vs human mode
    mode: MODE.AI,       // Current game mode
    scores: {
        player: 0,
        ai: 0,
        draw: 0
    }
};

// ============================================
// DOM ELEMENTS
// ============================================
const DOM = {
    cells: null,
    status: null,
    restartBtn: null,
    modeAIBtn: null,
    modeHumanBtn: null,
    player1Label: null,
    player2Label: null,
    scores: {
        player: null,
        ai: null,
        draw: null
    },

    // Initialize DOM references
    init() {
        this.cells = document.querySelectorAll('.cell');
        this.status = document.getElementById('status');
        this.restartBtn = document.getElementById('restart-btn');
        this.modeAIBtn = document.getElementById('mode-ai');
        this.modeHumanBtn = document.getElementById('mode-human');
        this.player1Label = document.getElementById('player1-label');
        this.player2Label = document.getElementById('player2-label');
        this.scores.player = document.getElementById('player-score');
        this.scores.ai = document.getElementById('ai-score');
        this.scores.draw = document.getElementById('draw-score');
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate random delay within AI thinking range
 * @returns {number} Delay in milliseconds
 */
function getRandomDelay() {
    return AI_DELAY.MIN + Math.random() * (AI_DELAY.MAX - AI_DELAY.MIN);
}

/**
 * Create a deep copy of the board array
 * @param {Array} board - Current board state
 * @returns {Array} Copy of the board
 */
function copyBoard(board) {
    return [...board];
}

// ============================================
// UI UPDATE FUNCTIONS
// ============================================

/**
 * Update the status display with animation
 * @param {string} message - Status message to display
 * @param {string} [className] - Optional CSS class for styling
 */
function updateStatus(message, className = '') {
    DOM.status.classList.remove('status-enter', 'win', 'lose', 'draw', 'thinking');
    
    // Force reflow for animation restart
    void DOM.status.offsetWidth;
    
    DOM.status.textContent = message;
    DOM.status.classList.add('status-enter');
    
    if (className) {
        DOM.status.classList.add(className);
    }
}

/**
 * Update score display with animation
 * @param {string} type - Score type: 'player', 'ai', or 'draw'
 */
function updateScore(type) {
    const element = DOM.scores[type];
    element.textContent = GameState.scores[type];
    
    // Trigger bump animation
    element.classList.remove('bump');
    void element.offsetWidth;
    element.classList.add('bump');
}

/**
 * Disable all board cells
 */
function disableBoard() {
    DOM.cells.forEach(cell => cell.classList.add('disabled'));
}

/**
 * Enable unoccupied board cells
 */
function enableBoard() {
    DOM.cells.forEach(cell => {
        if (!cell.classList.contains('occupied')) {
            cell.classList.remove('disabled');
        }
    });
}

/**
 * Highlight winning cells with animation
 * @param {Array} combination - Array of winning cell indices
 */
function highlightWinningCells(combination) {
    combination.forEach((index, i) => {
        // Stagger the animation slightly
        setTimeout(() => {
            DOM.cells[index].classList.add('winning');
        }, i * 100);
    });
}

/**
 * Add ripple effect to cell on click
 * @param {HTMLElement} cell - Cell element
 */
function addRippleEffect(cell) {
    cell.classList.remove('ripple');
    void cell.offsetWidth;
    cell.classList.add('ripple');
}

// ============================================
// GAME LOGIC FUNCTIONS
// ============================================

/**
 * Make a move on the board
 * @param {number} index - Cell index (0-8)
 * @param {string} player - Player making the move ('X' or 'O')
 */
function makeMove(index, player) {
    GameState.board[index] = player;
    
    const cell = DOM.cells[index];
    cell.textContent = player;
    cell.classList.add(player.toLowerCase(), 'occupied');
    cell.setAttribute('aria-label', `Cell ${index + 1}, ${player}`);
}

/**
 * Check for a winner in the given board state
 * @param {Array} board - Board state to check
 * @returns {string|null} Winner ('X' or 'O') or null
 */
function checkWinner(board) {
    for (const combo of WINNING_COMBINATIONS) {
        const [a, b, c] = combo;
        if (
            board[a] !== PLAYER.EMPTY &&
            board[a] === board[b] &&
            board[b] === board[c]
        ) {
            return board[a];
        }
    }
    return null;
}

/**
 * Check if the board is full (draw condition)
 * @param {Array} board - Board state to check
 * @returns {boolean} True if board is full
 */
function isBoardFull(board) {
    return !board.includes(PLAYER.EMPTY);
}

/**
 * Check for game end condition
 * @returns {Object|null} Result object with winner and combo, or null
 */
function checkGameEnd() {
    // Check for winner
    for (const combo of WINNING_COMBINATIONS) {
        const [a, b, c] = combo;
        if (
            GameState.board[a] !== PLAYER.EMPTY &&
            GameState.board[a] === GameState.board[b] &&
            GameState.board[b] === GameState.board[c]
        ) {
            return { 
                winner: GameState.board[a], 
                combo: combo 
            };
        }
    }

    // Check for draw
    if (isBoardFull(GameState.board)) {
        return { 
            winner: 'draw', 
            combo: null 
        };
    }

    return null;
}

/**
 * Handle game end state
 * @param {Object} result - Game result object
 */
function handleGameEnd(result) {
    GameState.isActive = false;
    disableBoard();

    if (result.winner === PLAYER.HUMAN) {
        GameState.scores.player++;
        updateScore('player');
        if (GameState.mode === MODE.AI) {
            updateStatus('You win! 🎉', 'win');
        } else {
            updateStatus('Player 1 wins! 🎉', 'win');
        }
        highlightWinningCells(result.combo);
    } else if (result.winner === PLAYER.AI) {
        GameState.scores.ai++;
        updateScore('ai');
        if (GameState.mode === MODE.AI) {
            updateStatus('AI wins!', 'lose');
        } else {
            updateStatus('Player 2 wins! 🎉', 'win');
        }
        highlightWinningCells(result.combo);
    } else {
        GameState.scores.draw++;
        updateScore('draw');
        updateStatus("It's a draw!", 'draw');
    }
}

/**
 * Reset the game to initial state
 */
function restartGame() {
    // Reset game state
    GameState.board = Array(9).fill(PLAYER.EMPTY);
    GameState.isActive = true;
    GameState.isAITurn = false;
    GameState.currentPlayer = PLAYER.HUMAN; // X always starts

    // Reset UI
    DOM.cells.forEach((cell, index) => {
        cell.textContent = '';
        cell.className = 'cell';
        cell.setAttribute('aria-label', `Cell ${index + 1}`);
    });

    // Update status based on mode
    if (GameState.mode === MODE.AI) {
        updateStatus('Your turn');
    } else {
        updateStatus('Player 1 (X) turn');
    }
}

/**
 * Update scoreboard labels based on game mode
 */
function updateScoreboardLabels() {
    if (GameState.mode === MODE.AI) {
        DOM.player1Label.textContent = 'You (X)';
        DOM.player2Label.textContent = 'AI (O)';
    } else {
        DOM.player1Label.textContent = 'Player 1 (X)';
        DOM.player2Label.textContent = 'Player 2 (O)';
    }
}

/**
 * Switch game mode
 * @param {string} mode - New game mode
 */
function switchMode(mode) {
    if (GameState.mode === mode) return;
    
    GameState.mode = mode;
    
    // Update button states
    DOM.modeAIBtn.classList.toggle('active', mode === MODE.AI);
    DOM.modeHumanBtn.classList.toggle('active', mode === MODE.HUMAN);
    
    // Update scoreboard labels
    updateScoreboardLabels();
    
    // Reset scores when switching modes
    GameState.scores.player = 0;
    GameState.scores.ai = 0;
    GameState.scores.draw = 0;
    DOM.scores.player.textContent = '0';
    DOM.scores.ai.textContent = '0';
    DOM.scores.draw.textContent = '0';
    
    // Restart the game
    restartGame();
}

// ============================================
// MINIMAX AI ALGORITHM
// ============================================

/**
 * Get all available moves (empty cells)
 * @param {Array} board - Current board state
 * @returns {Array} Array of available cell indices
 */
function getAvailableMoves(board) {
    const moves = [];
    for (let i = 0; i < 9; i++) {
        if (board[i] === PLAYER.EMPTY) {
            moves.push(i);
        }
    }
    return moves;
}

/**
 * Minimax algorithm with alpha-beta pruning
 * Calculates the optimal move for the AI
 * 
 * @param {Array} board - Current board state
 * @param {number} depth - Current search depth
 * @param {boolean} isMaximizing - True if AI's turn (maximizing)
 * @param {number} alpha - Best score for maximizer
 * @param {number} beta - Best score for minimizer
 * @returns {number} The evaluated score for the position
 */
function minimax(board, depth, isMaximizing, alpha, beta) {
    // Terminal state evaluation
    const winner = checkWinner(board);
    
    // AI wins: return positive score (prefer winning sooner)
    if (winner === PLAYER.AI) {
        return 10 - depth;
    }
    
    // Human wins: return negative score (prefer losing later)
    if (winner === PLAYER.HUMAN) {
        return depth - 10;
    }
    
    // Draw: return neutral score
    if (isBoardFull(board)) {
        return 0;
    }

    if (isMaximizing) {
        // AI's turn: maximize the score
        let maxScore = -Infinity;
        
        for (const move of getAvailableMoves(board)) {
            // Make move
            board[move] = PLAYER.AI;
            
            // Recursively evaluate
            const score = minimax(board, depth + 1, false, alpha, beta);
            
            // Undo move
            board[move] = PLAYER.EMPTY;
            
            // Update best score
            maxScore = Math.max(maxScore, score);
            alpha = Math.max(alpha, score);
            
            // Alpha-beta pruning
            if (beta <= alpha) {
                break;
            }
        }
        
        return maxScore;
    } else {
        // Human's turn: minimize the score
        let minScore = Infinity;
        
        for (const move of getAvailableMoves(board)) {
            // Make move
            board[move] = PLAYER.HUMAN;
            
            // Recursively evaluate
            const score = minimax(board, depth + 1, true, alpha, beta);
            
            // Undo move
            board[move] = PLAYER.EMPTY;
            
            // Update best score
            minScore = Math.min(minScore, score);
            beta = Math.min(beta, score);
            
            // Alpha-beta pruning
            if (beta <= alpha) {
                break;
            }
        }
        
        return minScore;
    }
}

/**
 * Find the best move for AI using Minimax
 * @returns {number} Index of the best move
 */
function getBestMove() {
    let bestScore = -Infinity;
    let bestMove = null;
    
    // Create a working copy of the board
    const boardCopy = copyBoard(GameState.board);
    
    // Evaluate each available move
    for (const move of getAvailableMoves(boardCopy)) {
        // Try the move
        boardCopy[move] = PLAYER.AI;
        
        // Calculate score using minimax
        const score = minimax(boardCopy, 0, false, -Infinity, Infinity);
        
        // Undo the move
        boardCopy[move] = PLAYER.EMPTY;
        
        // Update best move if this is better
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    
    return bestMove;
}

/**
 * Execute AI's turn
 */
function executeAITurn() {
    if (!GameState.isActive) return;
    
    const aiMove = getBestMove();
    makeMove(aiMove, PLAYER.AI);
    
    const result = checkGameEnd();
    if (result) {
        handleGameEnd(result);
    } else {
        GameState.isAITurn = false;
        enableBoard();
        updateStatus('Your turn');
    }
}

// ============================================
// EVENT HANDLERS
// ============================================

/**
 * Handle cell click event
 * @param {Event} event - Click event
 */
function handleCellClick(event) {
    const cell = event.target;
    const index = parseInt(cell.dataset.index, 10);

    // Validate move
    if (
        GameState.board[index] !== PLAYER.EMPTY ||
        !GameState.isActive ||
        GameState.isAITurn
    ) {
        return;
    }

    // Add visual feedback
    addRippleEffect(cell);

    if (GameState.mode === MODE.AI) {
        // VS AI Mode
        // Make human move
        makeMove(index, PLAYER.HUMAN);

        // Check for game end
        const result = checkGameEnd();
        if (result) {
            handleGameEnd(result);
            return;
        }

        // Prepare for AI turn
        GameState.isAITurn = true;
        updateStatus('AI is thinking...', 'thinking');
        disableBoard();

        // Execute AI move after delay
        setTimeout(executeAITurn, getRandomDelay());
    } else {
        // VS Human Mode
        // Make current player's move
        makeMove(index, GameState.currentPlayer);

        // Check for game end
        const result = checkGameEnd();
        if (result) {
            handleGameEnd(result);
            return;
        }

        // Switch to next player
        GameState.currentPlayer = GameState.currentPlayer === PLAYER.HUMAN ? PLAYER.AI : PLAYER.HUMAN;
        
        // Update status for next player
        if (GameState.currentPlayer === PLAYER.HUMAN) {
            updateStatus('Player 1 (X) turn');
        } else {
            updateStatus('Player 2 (O) turn');
        }
    }
}

/**
 * Handle restart button click
 */
function handleRestartClick() {
    restartGame();
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the game
 */
function initGame() {
    // Initialize DOM references
    DOM.init();

    // Attach event listeners to cells
    DOM.cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    // Attach restart button listener
    DOM.restartBtn.addEventListener('click', handleRestartClick);

    // Attach mode button listeners
    DOM.modeAIBtn.addEventListener('click', () => switchMode(MODE.AI));
    DOM.modeHumanBtn.addEventListener('click', () => switchMode(MODE.HUMAN));

    // Set initial status
    updateStatus('Your turn');
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
