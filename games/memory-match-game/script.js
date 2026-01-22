/**
 * Memory Match Game
 * A concentration game with 40 tiles (20 unique shapes)
 */

(function() {
    'use strict';

    // Game State
    const state = {
        tiles: [],
        flippedTiles: [],
        matchedPairs: 0,
        moves: 0,
        isChecking: false,
        totalPairs: 20
    };

    // DOM Elements
    const elements = {
        board: document.getElementById('game-board'),
        movesCount: document.getElementById('moves-count'),
        matchesCount: document.getElementById('matches-count'),
        restartBtn: document.getElementById('restart-btn'),
        winModal: document.getElementById('win-modal'),
        finalMoves: document.getElementById('final-moves'),
        playAgainBtn: document.getElementById('play-again-btn')
    };

    // 20 Unique Shape SVGs
    const shapes = [
        // 1. Circle
        `<svg viewBox="0 0 100 100" class="shape-svg">
            <circle cx="50" cy="50" r="40"/>
        </svg>`,
        
        // 2. Square
        `<svg viewBox="0 0 100 100" class="shape-svg">
            <rect x="15" y="15" width="70" height="70"/>
        </svg>`,
        
        // 3. Triangle
        `<svg viewBox="0 0 100 100" class="shape-svg">
            <polygon points="50,10 90,90 10,90"/>
        </svg>`,
        
        // 4. Ellipse
        `<svg viewBox="0 0 100 100" class="shape-svg">
            <ellipse cx="50" cy="50" rx="45" ry="30"/>
        </svg>`,
        
        // 5. Cross
        `<svg viewBox="0 0 100 100" class="shape-svg">
            <path d="M35,10 H65 V35 H90 V65 H65 V90 H35 V65 H10 V35 H35 Z"/>
        </svg>`,
        
        // 6. Rectangle
        `<svg viewBox="0 0 100 100" class="shape-svg">
            <rect x="10" y="25" width="80" height="50"/>
        </svg>`,
        
        // 7. Pentagon
        `<svg viewBox="0 0 100 100" class="shape-svg">
            <polygon points="50,5 95,38 77,90 23,90 5,38"/>
        </svg>`,
        
        // 8. Diamond
        `<svg viewBox="0 0 100 100" class="shape-svg">
            <polygon points="50,5 95,50 50,95 5,50"/>
        </svg>`,
        
        // 9. Heptagon
        `<svg viewBox="0 0 100 100" class="shape-svg">
            <polygon points="50,5 80,20 95,50 80,80 50,95 20,80 5,50 20,20"/>
        </svg>`,
        
        // 10. Crescent
        `<svg viewBox="0 0 100 100" class="shape-svg">
            <path d="M70,15 A40,40 0 1,1 70,85 A30,30 0 1,0 70,15"/>
        </svg>`,
        
        // 11. Hexagon
        `<svg viewBox="0 0 100 100" class="shape-svg">
            <polygon points="50,5 90,27 90,73 50,95 10,73 10,27"/>
        </svg>`,
        
        // 12. Trapezium
        `<svg viewBox="0 0 100 100" class="shape-svg">
            <polygon points="25,25 75,25 95,75 5,75"/>
        </svg>`,
        
        // 13. Star
        `<svg viewBox="0 0 100 100" class="shape-svg">
            <polygon points="50,5 61,40 97,40 68,60 79,95 50,75 21,95 32,60 3,40 39,40"/>
        </svg>`,
        
        // 14. Heart
        `<svg viewBox="0 0 100 100" class="shape-svg">
            <path d="M50,88 C20,60 5,40 15,25 C25,10 40,10 50,25 C60,10 75,10 85,25 C95,40 80,60 50,88 Z"/>
        </svg>`,
        
        // 15. Arrow
        `<svg viewBox="0 0 100 100" class="shape-svg">
            <polygon points="95,50 55,10 55,35 5,35 5,65 55,65 55,90"/>
        </svg>`,
        
        // 16. Parallelogram
        `<svg viewBox="0 0 100 100" class="shape-svg">
            <polygon points="25,25 95,25 75,75 5,75"/>
        </svg>`,
        
        // 17. Octagon
        `<svg viewBox="0 0 100 100" class="shape-svg">
            <polygon points="35,5 65,5 95,35 95,65 65,95 35,95 5,65 5,35"/>
        </svg>`,
        
        // 18. Polygon (irregular hexagon)
        `<svg viewBox="0 0 100 100" class="shape-svg">
            <polygon points="30,10 70,10 90,40 75,90 25,90 10,40"/>
        </svg>`,
        
        // 19. Quatrefoil
        `<svg viewBox="0 0 100 100" class="shape-svg">
            <path d="M50,20 A15,15 0 1,1 50,20.01 M80,50 A15,15 0 1,1 80,50.01 M50,80 A15,15 0 1,1 50,80.01 M20,50 A15,15 0 1,1 20,50.01"/>
            <circle cx="50" cy="20" r="15"/>
            <circle cx="80" cy="50" r="15"/>
            <circle cx="50" cy="80" r="15"/>
            <circle cx="20" cy="50" r="15"/>
        </svg>`,
        
        // 20. Curvilinear Triangle
        `<svg viewBox="0 0 100 100" class="shape-svg">
            <path d="M50,10 Q90,50 50,90 Q10,50 50,10 Q70,30 80,50 Q70,70 50,90"/>
            <path d="M50,10 Q80,30 80,60 Q70,85 50,90 Q30,85 20,60 Q20,30 50,10"/>
        </svg>`
    ];

    /**
     * Fisher-Yates shuffle algorithm
     */
    function shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Create tile pairs and shuffle them
     */
    function createTiles() {
        const tilePairs = [];
        for (let i = 0; i < shapes.length; i++) {
            tilePairs.push({ id: i, shape: shapes[i] });
            tilePairs.push({ id: i, shape: shapes[i] });
        }
        return shuffle(tilePairs);
    }

    /**
     * Create a tile element
     */
    function createTileElement(tile, index) {
        const tileEl = document.createElement('div');
        tileEl.className = 'tile';
        tileEl.dataset.index = index;
        tileEl.dataset.shapeId = tile.id;
        
        tileEl.innerHTML = `
            <div class="tile-inner">
                <div class="tile-face tile-back"></div>
                <div class="tile-face tile-front">${tile.shape}</div>
            </div>
        `;
        
        return tileEl;
    }

    /**
     * Handle tile click/tap
     */
    function handleTileClick(event) {
        const tile = event.currentTarget;
        
        // Ignore if already checking, flipped, or matched
        if (state.isChecking || 
            tile.classList.contains('flipped') || 
            tile.classList.contains('matched')) {
            return;
        }
        
        // Flip the tile
        tile.classList.add('flipped');
        state.flippedTiles.push(tile);
        
        // Check for match if two tiles are flipped
        if (state.flippedTiles.length === 2) {
            state.moves++;
            updateStats();
            checkForMatch();
        }
    }

    /**
     * Check if flipped tiles match
     */
    function checkForMatch() {
        state.isChecking = true;
        
        const [tile1, tile2] = state.flippedTiles;
        const match = tile1.dataset.shapeId === tile2.dataset.shapeId;
        
        if (match) {
            // Mark as matched
            tile1.classList.add('matched');
            tile2.classList.add('matched');
            state.matchedPairs++;
            updateStats();
            
            state.flippedTiles = [];
            state.isChecking = false;
            
            // Check for win
            if (state.matchedPairs === state.totalPairs) {
                setTimeout(showWinModal, 500);
            }
        } else {
            // Flip back after delay
            tile1.classList.add('checking');
            tile2.classList.add('checking');
            
            setTimeout(() => {
                tile1.classList.remove('flipped', 'checking');
                tile2.classList.remove('flipped', 'checking');
                state.flippedTiles = [];
                state.isChecking = false;
            }, 800);
        }
    }

    /**
     * Update stats display
     */
    function updateStats() {
        elements.movesCount.textContent = state.moves;
        elements.matchesCount.textContent = state.matchedPairs;
    }

    /**
     * Show win modal
     */
    function showWinModal() {
        elements.finalMoves.textContent = state.moves;
        elements.winModal.classList.remove('hidden');
    }

    /**
     * Hide win modal
     */
    function hideWinModal() {
        elements.winModal.classList.add('hidden');
    }

    /**
     * Initialize or restart the game
     */
    function initGame() {
        // Reset state
        state.tiles = createTiles();
        state.flippedTiles = [];
        state.matchedPairs = 0;
        state.moves = 0;
        state.isChecking = false;
        
        // Clear and populate board
        elements.board.innerHTML = '';
        
        state.tiles.forEach((tile, index) => {
            const tileEl = createTileElement(tile, index);
            tileEl.addEventListener('click', handleTileClick);
            tileEl.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleTileClick({ currentTarget: tileEl });
            });
            elements.board.appendChild(tileEl);
        });
        
        // Update stats display
        updateStats();
        
        // Hide win modal if visible
        hideWinModal();
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        elements.restartBtn.addEventListener('click', initGame);
        elements.playAgainBtn.addEventListener('click', initGame);
        
        // Close modal on outside click
        elements.winModal.addEventListener('click', (e) => {
            if (e.target === elements.winModal) {
                hideWinModal();
            }
        });
    }

    // Initialize the game when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        setupEventListeners();
        initGame();
    });
})();
