/**
 * Sliding Puzzle Game
 * A classic sliding puzzle implementation using vanilla JavaScript
 */
(function() {
    'use strict';

    // Game State
    const state = {
        size: 3,
        tiles: [],
        emptyIndex: 0,
        moves: 0,
        isAnimating: false,
        lastHintTile: -1,  // Track last suggested tile to avoid loops
        moveHistory: []     // Track recent moves
    };

    // DOM Elements
    const elements = {
        board: document.getElementById('game-board'),
        sizeSelector: document.getElementById('board-size'),
        movesDisplay: document.getElementById('moves'),
        shuffleBtn: document.getElementById('shuffle-btn'),
        hintBtn: document.getElementById('hint-btn'),
        winMessage: document.getElementById('win-message'),
        finalMoves: document.getElementById('final-moves'),
        playAgainBtn: document.getElementById('play-again-btn')
    };

    /**
     * Initialize the game
     */
    function init() {
        bindEvents();
        newGame();
    }

    /**
     * Bind event listeners
     */
    function bindEvents() {
        elements.sizeSelector.addEventListener('change', handleSizeChange);
        elements.shuffleBtn.addEventListener('click', shuffleBoard);
        elements.hintBtn.addEventListener('click', handleHint);
        elements.playAgainBtn.addEventListener('click', handlePlayAgain);
        
        // Handle keyboard navigation
        document.addEventListener('keydown', handleKeyPress);
    }

    /**
     * Handle board size change
     */
    function handleSizeChange() {
        state.size = parseInt(elements.sizeSelector.value);
        newGame();
    }

    /**
     * Start a new game
     */
    function newGame() {
        state.moves = 0;
        state.isAnimating = false;
        updateMovesDisplay();
        hideWinMessage();
        createBoard();
        shuffleBoard();
    }

    /**
     * Create the game board
     */
    function createBoard() {
        const totalTiles = state.size * state.size;
        
        // Create ordered tiles array (1 to n-1, then 0 for empty)
        state.tiles = [];
        for (let i = 1; i < totalTiles; i++) {
            state.tiles.push(i);
        }
        state.tiles.push(0); // Empty tile at the end
        state.emptyIndex = totalTiles - 1;

        // Update board grid class
        elements.board.className = `game-board grid-${state.size}`;
        
        renderBoard();
    }

    /**
     * Render the board tiles
     */
    function renderBoard() {
        elements.board.innerHTML = '';
        
        state.tiles.forEach((value, index) => {
            const tile = document.createElement('div');
            tile.className = value === 0 ? 'tile empty' : 'tile';
            tile.textContent = value === 0 ? '' : value;
            tile.dataset.index = index;
            
            if (value !== 0) {
                tile.addEventListener('click', () => handleTileClick(index));
                tile.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    handleTileClick(index);
                });
            }
            
            elements.board.appendChild(tile);
        });
    }

    /**
     * Handle tile click
     * @param {number} index - The clicked tile index
     */
    function handleTileClick(index) {
        if (state.isAnimating) return;
        
        const adjacentIndex = getAdjacentEmptyIndex(index);
        if (adjacentIndex !== -1) {
            moveTile(index, adjacentIndex);
        }
    }

    /**
     * Handle keyboard arrow keys
     * @param {KeyboardEvent} e - The keyboard event
     */
    function handleKeyPress(e) {
        if (state.isAnimating) return;
        
        const emptyRow = Math.floor(state.emptyIndex / state.size);
        const emptyCol = state.emptyIndex % state.size;
        let targetIndex = -1;

        switch (e.key) {
            case 'ArrowUp':
                // Move tile from below up into empty space
                if (emptyRow < state.size - 1) {
                    targetIndex = state.emptyIndex + state.size;
                }
                break;
            case 'ArrowDown':
                // Move tile from above down into empty space
                if (emptyRow > 0) {
                    targetIndex = state.emptyIndex - state.size;
                }
                break;
            case 'ArrowLeft':
                // Move tile from right left into empty space
                if (emptyCol < state.size - 1) {
                    targetIndex = state.emptyIndex + 1;
                }
                break;
            case 'ArrowRight':
                // Move tile from left right into empty space
                if (emptyCol > 0) {
                    targetIndex = state.emptyIndex - 1;
                }
                break;
        }

        if (targetIndex !== -1) {
            e.preventDefault();
            moveTile(targetIndex, state.emptyIndex);
        }
    }

    /**
     * Check if clicked tile is adjacent to empty space
     * @param {number} index - The tile index to check
     * @returns {number} - The empty index if adjacent, -1 otherwise
     */
    function getAdjacentEmptyIndex(index) {
        const row = Math.floor(index / state.size);
        const col = index % state.size;
        const emptyRow = Math.floor(state.emptyIndex / state.size);
        const emptyCol = state.emptyIndex % state.size;

        // Check if adjacent (not diagonal)
        const rowDiff = Math.abs(row - emptyRow);
        const colDiff = Math.abs(col - emptyCol);

        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            return state.emptyIndex;
        }

        return -1;
    }

    /**
     * Move a tile to the empty position
     * @param {number} tileIndex - The tile to move
     * @param {number} emptyIndex - The empty position
     * @param {boolean} animate - Whether to animate the move
     * @param {boolean} countMove - Whether to count this as a move
     */
    function moveTile(tileIndex, emptyIndex, animate = true, countMove = true) {
        if (animate) {
            state.isAnimating = true;
        }

        // Track move history for hint system
        if (countMove) {
            state.moveHistory.push({
                tileIndex: tileIndex,
                fromEmpty: emptyIndex
            });
            // Keep only last 10 moves
            if (state.moveHistory.length > 10) {
                state.moveHistory.shift();
            }
        }

        // Determine slide direction for animation
        const direction = getSlideDirection(tileIndex, emptyIndex);

        // Swap tiles in state
        [state.tiles[tileIndex], state.tiles[emptyIndex]] = 
        [state.tiles[emptyIndex], state.tiles[tileIndex]];
        state.emptyIndex = tileIndex;

        // Update move counter
        if (countMove) {
            state.moves++;
            updateMovesDisplay();
        }

        // Re-render with animation
        renderBoardWithAnimation(emptyIndex, direction, animate);

        if (animate) {
            setTimeout(() => {
                state.isAnimating = false;
                
                // Check for win condition after animation
                if (countMove && checkWin()) {
                    showWinMessage();
                }
            }, 150);
        } else if (countMove && checkWin()) {
            showWinMessage();
        }
    }

    /**
     * Get the slide direction for animation
     * @param {number} fromIndex - Starting position
     * @param {number} toIndex - Target position
     * @returns {string} - Direction class name
     */
    function getSlideDirection(fromIndex, toIndex) {
        const fromRow = Math.floor(fromIndex / state.size);
        const fromCol = fromIndex % state.size;
        const toRow = Math.floor(toIndex / state.size);
        const toCol = toIndex % state.size;

        if (fromRow < toRow) return 'slide-down';
        if (fromRow > toRow) return 'slide-up';
        if (fromCol < toCol) return 'slide-right';
        if (fromCol > toCol) return 'slide-left';
        return '';
    }

    /**
     * Render board with slide animation
     * @param {number} movedToIndex - Index where tile moved to
     * @param {string} direction - Animation direction
     * @param {boolean} animate - Whether to animate
     */
    function renderBoardWithAnimation(movedToIndex, direction, animate) {
        const tiles = elements.board.children;
        
        state.tiles.forEach((value, index) => {
            const tile = tiles[index];
            tile.className = value === 0 ? 'tile empty' : 'tile';
            tile.textContent = value === 0 ? '' : value;
            
            // Add animation class to the tile that moved
            if (animate && index === movedToIndex && value !== 0) {
                tile.classList.add(direction);
            }

            // Update click handlers
            tile.onclick = null;
            tile.ontouchend = null;
            
            if (value !== 0) {
                tile.onclick = () => handleTileClick(index);
                tile.ontouchend = (e) => {
                    e.preventDefault();
                    handleTileClick(index);
                };
            }
        });
    }

    /**
     * Shuffle the board with a solvable configuration
     */
    function shuffleBoard() {
        state.moves = 0;
        state.moveHistory = [];  // Reset move history
        state.lastHintTile = -1; // Reset hint tracking
        updateMovesDisplay();
        hideWinMessage();

        // Perform random valid moves to ensure solvability
        const numMoves = state.size * state.size * 20;
        
        for (let i = 0; i < numMoves; i++) {
            const adjacentTiles = getAdjacentTiles(state.emptyIndex);
            const randomTile = adjacentTiles[Math.floor(Math.random() * adjacentTiles.length)];
            
            // Swap without animation or counting
            [state.tiles[randomTile], state.tiles[state.emptyIndex]] = 
            [state.tiles[state.emptyIndex], state.tiles[randomTile]];
            state.emptyIndex = randomTile;
        }

        renderBoard();
    }

    /**
     * Get tiles adjacent to a given index
     * @param {number} index - The center index
     * @returns {number[]} - Array of adjacent tile indices
     */
    function getAdjacentTiles(index) {
        const adjacent = [];
        const row = Math.floor(index / state.size);
        const col = index % state.size;

        // Up
        if (row > 0) adjacent.push(index - state.size);
        // Down
        if (row < state.size - 1) adjacent.push(index + state.size);
        // Left
        if (col > 0) adjacent.push(index - 1);
        // Right
        if (col < state.size - 1) adjacent.push(index + 1);

        return adjacent;
    }

    /**
     * Check if the puzzle is solved
     * @returns {boolean} - True if solved
     */
    function checkWin() {
        const totalTiles = state.size * state.size;
        
        for (let i = 0; i < totalTiles - 1; i++) {
            if (state.tiles[i] !== i + 1) {
                return false;
            }
        }
        
        // Last tile should be empty (0)
        return state.tiles[totalTiles - 1] === 0;
    }

    /**
     * Update the moves display
     */
    function updateMovesDisplay() {
        elements.movesDisplay.textContent = state.moves;
    }

    /**
     * Show the win message
     */
    function showWinMessage() {
        elements.finalMoves.textContent = state.moves;
        elements.winMessage.classList.remove('hidden');
    }

    /**
     * Hide the win message
     */
    function hideWinMessage() {
        elements.winMessage.classList.add('hidden');
    }

    /**
     * Handle play again button click
     */
    function handlePlayAgain() {
        hideWinMessage();
        shuffleBoard();
    }

    /**
     * Handle hint button click - uses IDA* search to find optimal move
     */
    function handleHint() {
        if (state.isAnimating || checkWin()) return;

        // Disable button during computation
        elements.hintBtn.disabled = true;
        elements.hintBtn.textContent = 'Thinking...';

        // Use setTimeout to allow UI to update before computation
        setTimeout(() => {
            const bestMove = findBestMoveBeamSearch();
            
            elements.hintBtn.disabled = false;
            elements.hintBtn.textContent = 'Get Hint';

            if (bestMove !== -1) {
                state.lastHintTile = bestMove;
                highlightHintTile(bestMove);
            }
        }, 10);
    }

    /**
     * Beam Search - explores multiple paths to find a good move
     * Works well for both 3x3 and 4x4 without freezing
     * @returns {number} - Index of the tile to move
     */
    function findBestMoveBeamSearch() {
        const size = state.size;
        const beamWidth = size === 3 ? 100 : 200;  // How many states to keep at each level
        const maxDepth = size === 3 ? 25 : 15;     // How far to look ahead
        
        // Get the last move to avoid immediate reversal
        const lastMove = state.moveHistory.length > 0 
            ? state.moveHistory[state.moveHistory.length - 1] 
            : null;
        
        // Initial state
        const initialState = {
            tiles: [...state.tiles],
            emptyIndex: state.emptyIndex,
            firstMove: -1,           // The first move that led to this state
            h: calculateHeuristic(state.tiles, size),
            path: []                 // Track path to avoid cycles
        };
        
        // Already solved
        if (initialState.h === 0) return -1;
        
        let beam = [initialState];
        const visited = new Set();
        visited.add(state.tiles.join(','));
        
        for (let depth = 0; depth < maxDepth; depth++) {
            const candidates = [];
            
            for (const current of beam) {
                const adjacent = getAdjacentTilesForState(current.emptyIndex, size);
                
                for (const tileIndex of adjacent) {
                    // Skip if this would undo the previous move in the path
                    if (current.path.length > 0 && 
                        current.path[current.path.length - 1] === current.emptyIndex) {
                        continue;
                    }
                    
                    // On first move, don't immediately reverse the player's last move
                    if (depth === 0 && lastMove && tileIndex === lastMove.fromEmpty) {
                        continue;
                    }
                    
                    // Create new state
                    const newTiles = [...current.tiles];
                    [newTiles[tileIndex], newTiles[current.emptyIndex]] = 
                    [newTiles[current.emptyIndex], newTiles[tileIndex]];
                    
                    const stateKey = newTiles.join(',');
                    
                    // Skip if we've seen this state in this search
                    if (visited.has(stateKey)) continue;
                    
                    const h = calculateHeuristic(newTiles, size);
                    
                    // Check if solved
                    if (h === 0) {
                        return current.firstMove === -1 ? tileIndex : current.firstMove;
                    }
                    
                    candidates.push({
                        tiles: newTiles,
                        emptyIndex: tileIndex,
                        firstMove: current.firstMove === -1 ? tileIndex : current.firstMove,
                        h: h,
                        score: h + depth * 0.1,  // Slight preference for shorter paths
                        path: [...current.path, tileIndex]
                    });
                }
            }
            
            if (candidates.length === 0) break;
            
            // Sort by heuristic and keep best ones
            candidates.sort((a, b) => a.score - b.score);
            beam = candidates.slice(0, beamWidth);
            
            // Mark these states as visited
            for (const s of beam) {
                visited.add(s.tiles.join(','));
            }
        }
        
        // Return the first move of the best path found
        if (beam.length > 0 && beam[0].firstMove !== -1) {
            return beam[0].firstMove;
        }
        
        // Fallback: find any move that improves or maintains heuristic
        return findFallbackMove();
    }
    
    /**
     * Fallback move finder - used when beam search doesn't find improvement
     * Avoids the last suggested tile to prevent loops
     * @returns {number} - Best tile index to move
     */
    function findFallbackMove() {
        const adjacent = getAdjacentTiles(state.emptyIndex);
        const lastMove = state.moveHistory.length > 0 
            ? state.moveHistory[state.moveHistory.length - 1] 
            : null;
        
        let bestMove = -1;
        let bestScore = Infinity;
        const currentH = calculateHeuristic(state.tiles, state.size);
        
        for (const tileIndex of adjacent) {
            // Don't suggest undoing the last move
            if (lastMove && tileIndex === lastMove.fromEmpty) {
                continue;
            }
            
            // Simulate this move
            const tiles1 = [...state.tiles];
            [tiles1[tileIndex], tiles1[state.emptyIndex]] = 
            [tiles1[state.emptyIndex], tiles1[tileIndex]];
            
            const h1 = calculateHeuristic(tiles1, state.size);
            
            // Look ahead one more move
            let bestH2 = Infinity;
            const adjacent2 = getAdjacentTilesForState(tileIndex, state.size);
            
            for (const tileIndex2 of adjacent2) {
                if (tileIndex2 === state.emptyIndex) continue;
                
                const tiles2 = [...tiles1];
                [tiles2[tileIndex2], tiles2[tileIndex]] = 
                [tiles2[tileIndex], tiles2[tileIndex2]];
                
                const h2 = calculateHeuristic(tiles2, state.size);
                bestH2 = Math.min(bestH2, h2);
            }
            
            // Penalize moves that were recently suggested
            let penalty = 0;
            if (tileIndex === state.lastHintTile) {
                penalty = 5;  // Discourage repeating the same hint
            }
            
            const score = h1 + bestH2 * 0.5 + penalty;
            
            if (score < bestScore) {
                bestScore = score;
                bestMove = tileIndex;
            }
        }
        
        // If all moves were filtered out, just pick any adjacent tile
        if (bestMove === -1) {
            bestMove = adjacent[0];
        }
        
        return bestMove;
    }

    /**
     * Calculate Manhattan distance heuristic with linear conflict
     * @param {number[]} tiles - Current tile configuration
     * @param {number} size - Board size
     * @returns {number} - Heuristic value
     */
    function calculateHeuristic(tiles, size) {
        let distance = 0;
        
        for (let i = 0; i < tiles.length; i++) {
            const value = tiles[i];
            if (value === 0) continue; // Skip empty tile
            
            // Goal position for this value
            const goalIndex = value - 1;
            const currentRow = Math.floor(i / size);
            const currentCol = i % size;
            const goalRow = Math.floor(goalIndex / size);
            const goalCol = goalIndex % size;
            
            distance += Math.abs(currentRow - goalRow) + Math.abs(currentCol - goalCol);
        }
        
        return distance;
    }

    /**
     * Get adjacent tiles for a given empty index (stateless version)
     * @param {number} emptyIndex - Index of empty tile
     * @param {number} size - Board size
     * @returns {number[]} - Array of adjacent indices
     */
    function getAdjacentTilesForState(emptyIndex, size) {
        const adjacent = [];
        const row = Math.floor(emptyIndex / size);
        const col = emptyIndex % size;

        if (row > 0) adjacent.push(emptyIndex - size); // Up
        if (row < size - 1) adjacent.push(emptyIndex + size); // Down
        if (col > 0) adjacent.push(emptyIndex - 1); // Left
        if (col < size - 1) adjacent.push(emptyIndex + 1); // Right

        return adjacent;
    }

    /**
     * Highlight the suggested tile with a glow effect
     * @param {number} tileIndex - Index of tile to highlight
     */
    function highlightHintTile(tileIndex) {
        const tiles = elements.board.children;
        const tile = tiles[tileIndex];
        
        if (tile && !tile.classList.contains('empty')) {
            // Remove any existing hint glow
            document.querySelectorAll('.hint-glow').forEach(t => {
                t.classList.remove('hint-glow');
            });
            
            // Add glow effect
            tile.classList.add('hint-glow');
            
            // Remove glow after animation completes
            setTimeout(() => {
                tile.classList.remove('hint-glow');
            }, 1500);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
