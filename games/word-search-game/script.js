/**
 * Word Search Game
 * A fully responsive word search puzzle game
 */

(function() {
    'use strict';

    // ============================================
    // GAME DATA - Categories and Words
    // ============================================
    const CATEGORIES = {
        birds: {
            name: 'Birds',
            icon: '🐦',
            words: [
                'EAGLE', 'SPARROW', 'PEACOCK', 'PARROT', 'OWL', 'CROW', 'FLAMINGO', 'PENGUIN',
                'HAWK', 'ROBIN', 'PIGEON', 'CANARY', 'TOUCAN', 'TURKEY', 'GOOSE', 'HERON',
                'SWAN', 'FALCON', 'PELICAN', 'OSTRICH', 'CHICKEN', 'DUCK', 'RAVEN', 'FINCH',
                'STORK', 'KINGFISHER', 'DOVE', 'MAGPIE', 'SEAGULL', 'VULTURE', 'WOODPECKER', 'CARDINAL'
            ]
        },
        countries: {
            name: 'Countries',
            icon: '🌍',
            words: [
                'INDIA', 'BRAZIL', 'FRANCE', 'JAPAN', 'CANADA', 'EGYPT', 'ITALY', 'SPAIN',
                'GERMANY', 'MEXICO', 'CHINA', 'RUSSIA', 'KENYA', 'PERU', 'GREECE', 'SWEDEN',
                'NORWAY', 'POLAND', 'TURKEY', 'VIETNAM', 'THAILAND', 'MOROCCO', 'CHILE', 'CUBA',
                'IRELAND', 'PORTUGAL', 'AUSTRIA', 'BELGIUM', 'DENMARK', 'FINLAND', 'NEPAL', 'QATAR'
            ]
        },
        fruits: {
            name: 'Fruits',
            icon: '🍎',
            words: [
                'APPLE', 'BANANA', 'MANGO', 'ORANGE', 'GRAPES', 'KIWI', 'PAPAYA', 'LEMON',
                'CHERRY', 'PEACH', 'PLUM', 'PEAR', 'MELON', 'GUAVA', 'LIME', 'FIG',
                'BERRY', 'COCONUT', 'APRICOT', 'AVOCADO', 'LYCHEE', 'OLIVE', 'DATES', 'PRUNE',
                'POMELO', 'DURIAN', 'DRAGONFRUIT', 'KUMQUAT', 'PASSION', 'QUINCE', 'RAISIN', 'TAMARIND'
            ]
        },
        animals: {
            name: 'Animals',
            icon: '🦁',
            words: [
                'LION', 'TIGER', 'ELEPHANT', 'DOG', 'CAT', 'BEAR', 'WOLF', 'GIRAFFE',
                'ZEBRA', 'MONKEY', 'RABBIT', 'DEER', 'FOX', 'HORSE', 'PIG', 'SHEEP',
                'GOAT', 'COW', 'MOUSE', 'RAT', 'HIPPO', 'RHINO', 'LEOPARD', 'CHEETAH',
                'PANDA', 'KOALA', 'KANGAROO', 'GORILLA', 'CAMEL', 'BUFFALO', 'JAGUAR', 'HYENA'
            ]
        },
        colors: {
            name: 'Colors',
            icon: '🎨',
            words: [
                'RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE', 'PINK', 'BLACK',
                'WHITE', 'BROWN', 'GRAY', 'GOLD', 'SILVER', 'VIOLET', 'INDIGO', 'CYAN',
                'MAROON', 'NAVY', 'OLIVE', 'TEAL', 'CORAL', 'SALMON', 'BEIGE', 'TAN',
                'CRIMSON', 'MAGENTA', 'LIME', 'AQUA', 'IVORY', 'PLUM', 'PEACH', 'MINT'
            ]
        },
        planets: {
            name: 'Planets',
            icon: '🪐',
            words: [
                'MERCURY', 'VENUS', 'EARTH', 'MARS', 'JUPITER', 'SATURN', 'URANUS', 'NEPTUNE',
                'PLUTO', 'MOON', 'SUN', 'STAR', 'COMET', 'METEOR', 'GALAXY', 'COSMOS',
                'ORBIT', 'SOLAR', 'LUNAR', 'ASTEROID', 'NEBULA', 'NOVA', 'PULSAR', 'QUASAR',
                'TITAN', 'EUROPA', 'GANYMEDE', 'CALLISTO', 'TRITON', 'CERES', 'ERIS', 'HAUMEA'
            ]
        },
        vegetables: {
            name: 'Vegetables',
            icon: '🥕',
            words: [
                'CARROT', 'POTATO', 'TOMATO', 'ONION', 'SPINACH', 'PEAS', 'BROCCOLI', 'CORN',
                'PEPPER', 'CELERY', 'LETTUCE', 'CABBAGE', 'BEANS', 'GARLIC', 'GINGER', 'RADISH',
                'TURNIP', 'BEET', 'SQUASH', 'PUMPKIN', 'LEEK', 'KALE', 'OKRA', 'FENNEL',
                'PARSLEY', 'BASIL', 'THYME', 'OREGANO', 'SAGE', 'CHIVE', 'DILL', 'ARUGULA'
            ]
        },
        sports: {
            name: 'Sports',
            icon: '⚽',
            words: [
                'FOOTBALL', 'CRICKET', 'TENNIS', 'HOCKEY', 'CHESS', 'BASEBALL', 'GOLF', 'BOXING',
                'RUGBY', 'SOCCER', 'SWIMMING', 'RUNNING', 'CYCLING', 'SKIING', 'SKATING', 'SURFING',
                'ARCHERY', 'FENCING', 'ROWING', 'SAILING', 'DIVING', 'CLIMBING', 'WRESTLING', 'JUDO',
                'KARATE', 'POLO', 'SQUASH', 'BADMINTON', 'VOLLEYBALL', 'HANDBALL', 'LACROSSE', 'CURLING'
            ]
        },
        instruments: {
            name: 'Instruments',
            icon: '🎸',
            words: [
                'PIANO', 'GUITAR', 'VIOLIN', 'DRUMS', 'FLUTE', 'SAXOPHONE', 'TRUMPET', 'HARP',
                'CELLO', 'BASS', 'CLARINET', 'OBOE', 'TUBA', 'HORN', 'BANJO', 'UKULELE',
                'ORGAN', 'HARMONICA', 'ACCORDION', 'MANDOLIN', 'SITAR', 'TABLA', 'XYLOPHONE', 'MARACAS',
                'TRIANGLE', 'CYMBAL', 'BONGO', 'BAGPIPE', 'KAZOO', 'OCARINA', 'PAN', 'LYRE'
            ]
        },
        seacreatures: {
            name: 'Sea Creatures',
            icon: '🐠',
            words: [
                'SHARK', 'WHALE', 'DOLPHIN', 'OCTOPUS', 'CRAB', 'STARFISH', 'JELLYFISH', 'TURTLE',
                'LOBSTER', 'SHRIMP', 'SQUID', 'SEAHORSE', 'CLAM', 'OYSTER', 'MUSSEL', 'CORAL',
                'SALMON', 'TUNA', 'COD', 'BASS', 'TROUT', 'MACKEREL', 'SARDINE', 'ANCHOVY',
                'EEL', 'RAY', 'BARRACUDA', 'SWORDFISH', 'MARLIN', 'GROUPER', 'SNAPPER', 'FLOUNDER'
            ]
        },
        cities: {
            name: 'Cities',
            icon: '🏙️',
            words: [
                'LONDON', 'TOKYO', 'PARIS', 'SYDNEY', 'CAIRO', 'BERLIN', 'MADRID', 'ROME',
                'DUBAI', 'MUMBAI', 'DELHI', 'SEOUL', 'BEIJING', 'MOSCOW', 'VIENNA', 'PRAGUE',
                'ATHENS', 'LISBON', 'DUBLIN', 'OSLO', 'STOCKHOLM', 'BANGKOK', 'SINGAPORE', 'JAKARTA',
                'MANILA', 'HANOI', 'NAIROBI', 'LAGOS', 'TUNIS', 'LIMA', 'BOGOTA', 'HAVANA'
            ]
        },
        flowers: {
            name: 'Flowers',
            icon: '🌸',
            words: [
                'ROSE', 'LILY', 'TULIP', 'DAISY', 'SUNFLOWER', 'JASMINE', 'ORCHID', 'LOTUS',
                'MARIGOLD', 'HIBISCUS', 'CARNATION', 'LAVENDER', 'PEONY', 'IRIS', 'DAFFODIL', 'VIOLET',
                'POPPY', 'DAHLIA', 'MAGNOLIA', 'GARDENIA', 'CAMELLIA', 'AZALEA', 'BEGONIA', 'PETUNIA',
                'ZINNIA', 'ASTER', 'COSMOS', 'CROCUS', 'FREESIA', 'HYACINTH', 'PANSY', 'PRIMROSE'
            ]
        }
    };

    // ============================================
    // GAME STATE
    // ============================================
    const GRID_SIZE = 10;
    const WORDS_PER_GAME = 8;

    let state = {
        currentCategory: null,
        grid: [],
        words: [],
        placedWords: [],
        foundWords: new Set(),
        isSelecting: false,
        selectedCells: [],
        wordColorIndex: 0
    };

    // ============================================
    // DOM ELEMENTS
    // ============================================
    const elements = {
        gameScreen: document.getElementById('gameScreen'),
        letterGrid: document.getElementById('letterGrid'),
        wordList: document.getElementById('wordList'),
        currentCategory: document.getElementById('currentCategory'),
        foundCount: document.getElementById('foundCount'),
        totalCount: document.getElementById('totalCount'),
        restartBtn: document.getElementById('restartBtn'),
        winModal: document.getElementById('winModal'),
        playAgainBtn: document.getElementById('playAgainBtn')
    };

    // Keep track of used categories to ensure variety
    let usedCategories = [];

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    function getRandomLetter() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return letters[Math.floor(Math.random() * letters.length)];
    }

    // ============================================
    // GRID GENERATION
    // ============================================
    function createEmptyGrid() {
        return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
    }

    function canPlaceWord(grid, word, row, col, direction) {
        const directions = {
            horizontal: { dr: 0, dc: 1 },
            vertical: { dr: 1, dc: 0 },
            diagonalDown: { dr: 1, dc: 1 },
            diagonalUp: { dr: -1, dc: 1 }
        };

        const { dr, dc } = directions[direction];
        const len = word.length;

        // Check bounds
        const endRow = row + dr * (len - 1);
        const endCol = col + dc * (len - 1);

        if (endRow < 0 || endRow >= GRID_SIZE || endCol < 0 || endCol >= GRID_SIZE) {
            return false;
        }

        // Check for conflicts
        for (let i = 0; i < len; i++) {
            const r = row + dr * i;
            const c = col + dc * i;
            const existing = grid[r][c];
            if (existing !== '' && existing !== word[i]) {
                return false;
            }
        }

        return true;
    }

    function placeWord(grid, word, row, col, direction) {
        const directions = {
            horizontal: { dr: 0, dc: 1 },
            vertical: { dr: 1, dc: 0 },
            diagonalDown: { dr: 1, dc: 1 },
            diagonalUp: { dr: -1, dc: 1 }
        };

        const { dr, dc } = directions[direction];
        const positions = [];

        for (let i = 0; i < word.length; i++) {
            const r = row + dr * i;
            const c = col + dc * i;
            grid[r][c] = word[i];
            positions.push({ row: r, col: c });
        }

        return positions;
    }

    function tryPlaceWord(grid, word) {
        const directions = ['horizontal', 'vertical', 'diagonalDown', 'diagonalUp'];
        const shuffledDirections = shuffleArray(directions);
        const attempts = 100;

        for (let attempt = 0; attempt < attempts; attempt++) {
            const direction = shuffledDirections[attempt % shuffledDirections.length];
            const row = Math.floor(Math.random() * GRID_SIZE);
            const col = Math.floor(Math.random() * GRID_SIZE);

            if (canPlaceWord(grid, word, row, col, direction)) {
                const positions = placeWord(grid, word, row, col, direction);
                return { word, positions, direction };
            }
        }

        return null;
    }

    function fillEmptyCells(grid) {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (grid[r][c] === '') {
                    grid[r][c] = getRandomLetter();
                }
            }
        }
    }

    function generatePuzzle(categoryKey) {
        const category = CATEGORIES[categoryKey];
        const allWords = [...category.words];
        
        // Filter words that can fit in the grid
        const validWords = allWords.filter(word => word.length <= GRID_SIZE);
        
        // Shuffle and try to place words
        const shuffledWords = shuffleArray(validWords);
        const grid = createEmptyGrid();
        const placedWords = [];

        for (const word of shuffledWords) {
            if (placedWords.length >= WORDS_PER_GAME) break;
            
            const result = tryPlaceWord(grid, word);
            if (result) {
                placedWords.push(result);
            }
        }

        // Fill empty cells with random letters
        fillEmptyCells(grid);

        return { grid, placedWords };
    }

    // ============================================
    // UI RENDERING
    // ============================================
    function getRandomCategory() {
        const categoryKeys = Object.keys(CATEGORIES);
        
        // If all categories have been used, reset the list
        if (usedCategories.length >= categoryKeys.length) {
            usedCategories = [];
        }
        
        // Get available categories (not recently used)
        const availableCategories = categoryKeys.filter(key => !usedCategories.includes(key));
        
        // Pick a random one
        const randomIndex = Math.floor(Math.random() * availableCategories.length);
        const selectedCategory = availableCategories[randomIndex];
        
        // Mark as used
        usedCategories.push(selectedCategory);
        
        return selectedCategory;
    }

    function renderGrid() {
        elements.letterGrid.innerHTML = '';

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.textContent = state.grid[r][c];
                cell.dataset.row = r;
                cell.dataset.col = c;
                elements.letterGrid.appendChild(cell);
            }
        }
    }

    function renderWordList() {
        elements.wordList.innerHTML = '';

        // Sort words alphabetically for display
        const sortedWords = [...state.placedWords].sort((a, b) => 
            a.word.localeCompare(b.word)
        );

        sortedWords.forEach(({ word }) => {
            const li = document.createElement('li');
            li.className = 'word-item';
            li.textContent = word;
            li.dataset.word = word;
            if (state.foundWords.has(word)) {
                li.classList.add('found');
            }
            elements.wordList.appendChild(li);
        });
    }

    function updateUI() {
        elements.foundCount.textContent = state.foundWords.size;
        elements.totalCount.textContent = state.placedWords.length;

        // Update word list
        document.querySelectorAll('.word-item').forEach(item => {
            if (state.foundWords.has(item.dataset.word)) {
                item.classList.add('found');
            }
        });
    }

    // ============================================
    // GAME LOGIC
    // ============================================
    function startGame(categoryKey) {
        state.currentCategory = categoryKey;
        state.foundWords = new Set();
        state.wordColorIndex = 0;

        const { grid, placedWords } = generatePuzzle(categoryKey);
        state.grid = grid;
        state.placedWords = placedWords;
        state.words = placedWords.map(pw => pw.word);

        elements.currentCategory.textContent = CATEGORIES[categoryKey].name;

        renderGrid();
        renderWordList();
        updateUI();
    }

    function restartGame() {
        // Auto-select a new random category
        const newCategory = getRandomCategory();
        startGame(newCategory);
    }

    function checkWin() {
        if (state.foundWords.size === state.placedWords.length) {
            setTimeout(() => {
                elements.winModal.classList.remove('hidden');
            }, 500);
        }
    }

    function getCellAt(row, col) {
        return document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
    }

    function getSelectedWord() {
        return state.selectedCells.map(({ row, col }) => state.grid[row][col]).join('');
    }

    function isValidSelection(cells) {
        if (cells.length < 2) return true;

        // Check if all cells are in a straight line
        const first = cells[0];
        const second = cells[1];
        const dr = Math.sign(second.row - first.row);
        const dc = Math.sign(second.col - first.col);

        for (let i = 1; i < cells.length; i++) {
            const prev = cells[i - 1];
            const curr = cells[i];
            const currentDr = curr.row - prev.row;
            const currentDc = curr.col - prev.col;

            // Must be adjacent and in same direction
            if (Math.abs(currentDr) > 1 || Math.abs(currentDc) > 1) return false;
            if (currentDr !== dr || currentDc !== dc) return false;
        }

        return true;
    }

    function highlightSelection() {
        document.querySelectorAll('.grid-cell.selecting').forEach(cell => {
            cell.classList.remove('selecting');
        });

        state.selectedCells.forEach(({ row, col }) => {
            const cell = getCellAt(row, col);
            if (cell) {
                cell.classList.add('selecting');
            }
        });
    }

    function clearSelection() {
        state.selectedCells = [];
        state.isSelecting = false;
        highlightSelection();
    }

    function markWordAsFound(word) {
        const wordData = state.placedWords.find(pw => pw.word === word);
        if (wordData) {
            const colorClass = `found-${state.wordColorIndex % 12}`;
            state.wordColorIndex++;

            wordData.positions.forEach(({ row, col }) => {
                const cell = getCellAt(row, col);
                if (cell) {
                    cell.classList.add('found', colorClass, 'just-found');
                    setTimeout(() => cell.classList.remove('just-found'), 400);
                }
            });
        }
    }

    function checkSelection() {
        const selectedWord = getSelectedWord();
        const reversedWord = selectedWord.split('').reverse().join('');

        // Check if selected word matches any word (forward or backward)
        for (const { word, positions } of state.placedWords) {
            if (state.foundWords.has(word)) continue;

            if (selectedWord === word || reversedWord === word) {
                // Verify the positions match
                const selectedPositions = state.selectedCells.map(c => `${c.row},${c.col}`).sort();
                const wordPositions = positions.map(p => `${p.row},${p.col}`).sort();

                if (JSON.stringify(selectedPositions) === JSON.stringify(wordPositions)) {
                    state.foundWords.add(word);
                    markWordAsFound(word);
                    updateUI();
                    checkWin();
                    return true;
                }
            }
        }

        return false;
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================
    function handleSelectionStart(row, col) {
        state.isSelecting = true;
        state.selectedCells = [{ row, col }];
        highlightSelection();
    }

    function handleSelectionMove(row, col) {
        if (!state.isSelecting) return;

        // Check if this cell is already selected
        const alreadySelected = state.selectedCells.some(
            c => c.row === row && c.col === col
        );

        if (alreadySelected) {
            // Allow backtracking - remove cells after this one
            const index = state.selectedCells.findIndex(
                c => c.row === row && c.col === col
            );
            state.selectedCells = state.selectedCells.slice(0, index + 1);
        } else {
            // Try to add new cell
            const newCells = [...state.selectedCells, { row, col }];
            if (isValidSelection(newCells)) {
                state.selectedCells = newCells;
            }
        }

        highlightSelection();
    }

    function handleSelectionEnd() {
        if (state.isSelecting && state.selectedCells.length > 1) {
            checkSelection();
        }
        clearSelection();
    }

    function getCellFromEvent(e) {
        let target = e.target;
        
        // Handle touch events
        if (e.touches && e.touches.length > 0) {
            const touch = e.touches[0];
            target = document.elementFromPoint(touch.clientX, touch.clientY);
        }

        if (target && target.classList.contains('grid-cell')) {
            return {
                row: parseInt(target.dataset.row),
                col: parseInt(target.dataset.col)
            };
        }

        return null;
    }

    function setupGridEvents() {
        const grid = elements.letterGrid;

        // Mouse events
        grid.addEventListener('mousedown', (e) => {
            const cell = getCellFromEvent(e);
            if (cell) {
                e.preventDefault();
                handleSelectionStart(cell.row, cell.col);
            }
        });

        grid.addEventListener('mousemove', (e) => {
            const cell = getCellFromEvent(e);
            if (cell) {
                handleSelectionMove(cell.row, cell.col);
            }
        });

        grid.addEventListener('mouseup', () => {
            handleSelectionEnd();
        });

        grid.addEventListener('mouseleave', () => {
            if (state.isSelecting) {
                handleSelectionEnd();
            }
        });

        // Touch events
        grid.addEventListener('touchstart', (e) => {
            const cell = getCellFromEvent(e);
            if (cell) {
                e.preventDefault();
                handleSelectionStart(cell.row, cell.col);
            }
        }, { passive: false });

        grid.addEventListener('touchmove', (e) => {
            const cell = getCellFromEvent(e);
            if (cell) {
                e.preventDefault();
                handleSelectionMove(cell.row, cell.col);
            }
        }, { passive: false });

        grid.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleSelectionEnd();
        }, { passive: false });

        grid.addEventListener('touchcancel', () => {
            clearSelection();
        });
    }

    function setupButtonEvents() {
        elements.restartBtn.addEventListener('click', restartGame);

        elements.playAgainBtn.addEventListener('click', () => {
            elements.winModal.classList.add('hidden');
            restartGame();
        });
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        setupGridEvents();
        setupButtonEvents();
        // Auto-start with a random category
        const initialCategory = getRandomCategory();
        startGame(initialCategory);
    }

    // Start the game when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
