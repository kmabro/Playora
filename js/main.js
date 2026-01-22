/**
 * Playora - Gaming Platform
 * Main JavaScript Module
 * 
 * Handles game loading, search, navigation, and fullscreen functionality
 */

const Playora = (function() {
    'use strict';

    // ========================================
    // Game Data - All Games
    // ========================================
    const games = [
        { id: '2048', name: '2048', folder: '2048-game', icon: '🔢', featured: false },
        { id: 'asteroids', name: 'Asteroids', folder: 'asteroids-game', icon: '☄️', featured: false },
        { id: 'avoid-blocks', name: 'Avoid the Blocks', folder: 'avoid-the-blocks-game', icon: '🟥', featured: false },
        { id: 'breakout', name: 'Breakout', folder: 'breakout-game', icon: '🧱', featured: true },
        { id: 'bubble-shooter', name: 'Bubble Shooter', folder: 'bubble-shooter-game', icon: '🫧', featured: true },
        { id: 'chess', name: 'Chess', folder: 'chess-game', icon: '♟️', featured: false },
        { id: 'connect-four', name: 'Connect Four', folder: 'connect-four-game', icon: '🔴', featured: false },
        { id: 'doodle-jump', name: 'Doodle Jump', folder: 'doodle-jump-game', icon: '🚀', featured: false },
        { id: 'flappy-bird', name: 'Flappy Bird', folder: 'flappy-bird-game', icon: '🐦', featured: false },
        { id: 'frogger', name: 'Frogger', folder: 'frogger-game', icon: '🐸', featured: false },
        { id: 'fruit-ninja', name: 'Fruit Ninja', folder: 'fruit-ninja-game', icon: '🍉', featured: true },
        { id: 'hangman', name: 'Hangman', folder: 'hangman-game', icon: '📝', featured: false },
        { id: 'memory-match', name: 'Memory Match', folder: 'memory-match-game', icon: '🃏', featured: false },
        { id: 'pac-man', name: 'Pac-Man', folder: 'pac-man-game', icon: '👾', featured: true },
        { id: 'pong', name: 'Pong', folder: 'pong-game', icon: '🏓', featured: false },
        { id: 'rock-paper-scissors', name: 'Rock Paper Scissors', folder: 'rock-paper-scissors-game', icon: '✊', featured: false },
        { id: 'sliding-puzzle', name: 'Sliding Puzzle', folder: 'sliding-puzzle-game', icon: '🧩', featured: true },
        { id: 'snake', name: 'Snake', folder: 'snake-game', icon: '🐍', featured: false },
        { id: 'space-invaders', name: 'Space Invaders', folder: 'space-invaders-game', icon: '👽', featured: false },
        { id: 'tetris', name: 'Tetris', folder: 'tetris-game', icon: '🟦', featured: false },
        { id: 'tic-tac-toe', name: 'Tic Tac Toe', folder: 'tic-tac-toe-game', icon: '⭕', featured: false },
        { id: 'water-sort', name: 'Water Sort Puzzle', folder: 'water-sort-puzzle-game', icon: '🧪', featured: false, wide: true },
        { id: 'word-scramble', name: 'Word Scramble', folder: 'word-scramble-game', icon: '🔤', featured: false, wide: true },
        { id: 'word-search', name: 'Word Search', folder: 'word-search-game', icon: '🔍', featured: false, wide: true }
    ];

    // Poki-style size patterns for visual variety
    const sizePatterns = [
        'size-large',  // First game featured large
        'size-normal',
        'size-normal',
        'size-tall',
        'size-normal',
        'size-wide',
        'size-normal',
        'size-normal',
        'size-normal',
        'size-large',  // Every 9th-10th game featured
        'size-normal',
        'size-tall',
        'size-normal',
        'size-normal',
        'size-wide',
        'size-normal',
        'size-normal',
        'size-normal',
        'size-normal',
        'size-large',
        'size-normal',
        'size-normal',
        'size-tall',
        'size-normal',
        'size-wide',
        'size-normal'
    ];

    // ========================================
    // State
    // ========================================
    const state = {
        currentGame: null,
        isPaused: false
    };

    // ========================================
    // Audio Feedback System
    // ========================================
    
    /**
     * Play a click sound effect
     * Uses a short, clean base64 encoded beep
     */
    function playClickSound() {
        try {
            // Create audio context for a clean click/pop sound
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            // Short, pleasant click sound
            oscillator.frequency.value = 600;
            oscillator.type = 'sine';
            
            // Quick fade in/out for clean sound
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.08);
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.08);
        } catch (e) {
            // Audio not supported, fail silently
        }
    }

    // ========================================
    // DOM Elements Cache
    // ========================================
    let elements = {};

    /**
     * Cache DOM elements for performance
     */
    function cacheElements() {
        elements = {
            header: document.getElementById('siteHeader'),
            logo: document.getElementById('siteLogo'),
            searchContainer: document.getElementById('searchContainer'),
            homeView: document.getElementById('homeView'),
            playView: document.getElementById('playView'),
            gamesGrid: document.getElementById('gamesGrid'),
            noResults: document.getElementById('noResults'),
            searchInput: document.getElementById('searchInput'),
            searchClear: document.getElementById('searchClear'),
            gameFrame: document.getElementById('gameFrame'),
            gameLoader: document.getElementById('gameLoader'),
            backBtn: document.getElementById('backBtn'),
            pauseOverlay: document.getElementById('pauseOverlay'),
            resumeBtn: document.getElementById('resumeBtn'),
            pauseHomeBtn: document.getElementById('pauseHomeBtn')
        };
    }

    // ========================================
    // Card Generation
    // ========================================

    /**
     * Get icon path for a game
     * @param {Object} game - Game object
     * @returns {string} - Path to icon image
     */
    function getIconPath(game) {
        return `assets/icons/${game.id}.png`;
    }

    /**
     * Create a game card element
     * @param {Object} game - Game data
     * @param {number} index - Card index for size pattern
     * @returns {HTMLElement}
     */
    function createGameCard(game, index) {
        const card = document.createElement('article');
        // Use featured flag for large cards, wide flag for wide cards, otherwise use size patterns
        let sizeClass = 'size-normal';
        if (game.featured) {
            sizeClass = 'size-large';
        } else if (game.wide) {
            sizeClass = 'size-wide';
        } else {
            sizeClass = sizePatterns[index] || 'size-normal';
        }
        card.className = `game-card ${sizeClass}`;
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Play ${game.name}`);
        card.dataset.gameId = game.id;

        const iconPath = getIconPath(game);

        card.innerHTML = `
            <div class="card-bg"></div>
            <img 
                src="${iconPath}" 
                alt="${game.name}" 
                class="game-card-image"
                loading="lazy"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            >
            <div class="game-card-fallback" style="display: none;">
                <span class="fallback-icon">${game.icon}</span>
            </div>
            <div class="game-card-overlay">
                <span class="game-card-name">${game.name}</span>
            </div>
            <div class="game-card-play">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </div>
        `;

        // Click handler with audio feedback
        card.addEventListener('click', () => {
            playClickSound();
            launchGame(game);
        });

        // Keyboard handler
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                playClickSound();
                launchGame(game);
            }
        });

        return card;
    }

    /**
     * Render games grid
     * @param {Array} gamesToRender - Games to display
     */
    function renderGames(gamesToRender) {
        const grid = elements.gamesGrid;
        grid.innerHTML = '';

        if (gamesToRender.length === 0) {
            elements.noResults.classList.remove('hidden');
            return;
        }

        elements.noResults.classList.add('hidden');

        // Create document fragment for performance
        const fragment = document.createDocumentFragment();
        gamesToRender.forEach((game, index) => {
            fragment.appendChild(createGameCard(game, index));
        });
        grid.appendChild(fragment);
    }

    // ========================================
    // Search Functionality
    // ========================================

    /**
     * Filter games by search query
     * @param {string} query - Search term
     */
    function filterGames(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            renderGames(games);
            elements.searchClear.classList.add('hidden');
            return;
        }

        elements.searchClear.classList.remove('hidden');

        const filtered = games.filter(game => 
            game.name.toLowerCase().includes(searchTerm) ||
            game.id.toLowerCase().includes(searchTerm)
        );

        renderGames(filtered);
    }

    /**
     * Clear search input
     */
    function clearSearch() {
        elements.searchInput.value = '';
        filterGames('');
        elements.searchInput.focus();
    }

    // ========================================
    // Game Launching
    // ========================================

    /**
     * Launch a game
     * @param {Object} game - Game to launch
     */
    function launchGame(game) {
        state.currentGame = game;
        state.isPaused = false;

        // Hide header elements for immersive play (display: none)
        elements.header.style.display = 'none';
        elements.logo.style.display = 'none';
        elements.searchContainer.style.display = 'none';

        // Show loading state
        elements.gameLoader.classList.remove('hidden');

        // Switch views
        elements.homeView.classList.remove('active');
        elements.playView.classList.remove('hidden');

        // Build game URL
        const gameUrl = `Games/${game.folder}/index.html`;

        // Set iframe source
        const iframe = elements.gameFrame;
        iframe.classList.remove('loaded');
        
        iframe.onload = () => {
            // Hide loader and fade in game
            setTimeout(() => {
                elements.gameLoader.classList.add('hidden');
                iframe.classList.add('loaded');
            }, 300);
        };

        iframe.onerror = () => {
            elements.gameLoader.innerHTML = `
                <div class="no-results-icon">😕</div>
                <p>Failed to load game</p>
            `;
        };

        iframe.src = gameUrl;

        // Update page title
        document.title = `${game.name} - Playora`;

        // Scroll to top
        window.scrollTo(0, 0);
    }

    /**
     * Return to home view
     */
    function goHome() {
        // Play click sound for back navigation
        playClickSound();
        
        // Stop the game - clear iframe src
        const iframe = elements.gameFrame;
        iframe.src = 'about:blank';
        iframe.classList.remove('loaded');
        
        // Reset state
        state.currentGame = null;
        state.isPaused = false;

        // Show header elements again (restore display)
        elements.header.style.display = '';
        elements.logo.style.display = '';
        elements.searchContainer.style.display = '';

        // Hide pause overlay
        elements.pauseOverlay.classList.add('hidden');

        // Switch views
        elements.playView.classList.add('hidden');
        elements.homeView.classList.add('active');

        // Reset title
        document.title = 'Playora - Let the world play';

        // Show loader for next game
        elements.gameLoader.classList.remove('hidden');
        elements.gameLoader.innerHTML = `
            <div class="loader-spinner"></div>
            <p>Loading game...</p>
        `;
    }

    // ========================================
    // Pause Functionality
    // ========================================

    /**
     * Toggle pause state
     */
    function togglePause() {
        if (state.isPaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }

    /**
     * Pause the game
     */
    function pauseGame() {
        state.isPaused = true;
        elements.pauseOverlay.classList.remove('hidden');
        
        // Try to pause game in iframe (if supported)
        try {
            elements.gameFrame.contentWindow.postMessage({ action: 'pause' }, '*');
        } catch (e) {
            // Iframe might not support messaging
        }
    }

    /**
     * Resume the game
     */
    function resumeGame() {
        state.isPaused = false;
        elements.pauseOverlay.classList.add('hidden');
        
        // Try to resume game in iframe (if supported)
        try {
            elements.gameFrame.contentWindow.postMessage({ action: 'resume' }, '*');
        } catch (e) {
            // Iframe might not support messaging
        }
    }

    // ========================================
    // Event Listeners
    // ========================================

    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Search
        elements.searchInput.addEventListener('input', (e) => {
            filterGames(e.target.value);
        });

        elements.searchClear.addEventListener('click', clearSearch);

        // Back button
        elements.backBtn.addEventListener('click', goHome);

        // Pause overlay buttons
        elements.resumeBtn.addEventListener('click', resumeGame);
        elements.pauseHomeBtn.addEventListener('click', goHome);

        // Window resize handler for iframe scaling (fixes Tetris and similar games)
        window.addEventListener('resize', handleWindowResize);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape - go back home when in game
            if (e.key === 'Escape' && state.currentGame) {
                goHome();
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            if (state.currentGame) {
                goHome();
            }
        });
    }

    /**
     * Handle window resize for iframe scaling
     */
    function handleWindowResize() {
        if (state.currentGame && elements.gameFrame) {
            // Force iframe to recalculate dimensions
            const iframe = elements.gameFrame;
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            
            // Trigger a reflow
            void iframe.offsetHeight;
        }
    }

    // ========================================
    // Initialization
    // ========================================

    /**
     * Initialize the application
     */
    function init() {
        // Cache DOM elements
        cacheElements();

        // Render all games
        renderGames(games);

        // Set up event listeners
        setupEventListeners();

        // Log ready message
        console.log('🎮 Playora loaded successfully!');
        console.log(`📦 ${games.length} games available`);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ========================================
    // Public API
    // ========================================
    return {
        goHome,
        getGames: () => [...games],
        getState: () => ({ ...state })
    };

})();
