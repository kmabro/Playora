/**
 * Hangman Game - Classic Paper Style
 */
(function() {
    'use strict';

    // Words organized by category (Easy & Medium difficulty)
    const WORD_CATEGORIES = {
        'Animals': [
            // Easy (3-4 letters)
            'cat', 'dog', 'cow', 'pig', 'rat', 'bat', 'ant', 'bee', 'fox', 'owl',
            'hen', 'duck', 'frog', 'fish', 'bear', 'deer', 'goat', 'lion', 'wolf',
            // Medium (5-6 letters)
            'horse', 'sheep', 'mouse', 'tiger', 'zebra', 'snake', 'whale', 'shark',
            'eagle', 'camel', 'koala', 'panda', 'rabbit', 'monkey', 'parrot'
        ],
        'Countries': [
            // Easy
            'usa', 'uk', 'peru', 'cuba', 'iran', 'iraq', 'mali', 'fiji', 'chad',
            // Medium
            'india', 'china', 'japan', 'korea', 'spain', 'italy', 'france', 'brazil',
            'egypt', 'kenya', 'nepal', 'qatar', 'chile', 'mexico', 'canada', 'russia'
        ],
        'Fruits & Veg': [
            // Easy
            'fig', 'pea', 'yam', 'kiwi', 'lime', 'pear', 'plum', 'corn', 'bean',
            // Medium
            'apple', 'grape', 'mango', 'melon', 'peach', 'lemon', 'olive', 'onion',
            'berry', 'guava', 'papaya', 'banana', 'orange', 'carrot', 'potato', 'tomato'
        ],
        'Movies': [
            // Easy
            'jaws', 'cars', 'up', 'elf', 'her', 'ted',
            // Medium
            'rocky', 'alien', 'ghost', 'joker', 'brave', 'coco', 'moana', 'shrek',
            'frozen', 'avatar', 'titanic', 'matrix'
        ],
        'Sports': [
            // Easy
            'golf', 'polo', 'surf', 'swim', 'dive', 'ski', 'run', 'box',
            // Medium
            'tennis', 'soccer', 'hockey', 'rugby', 'boxing', 'cycling', 'rowing',
            'karate', 'racing', 'surfing', 'skating', 'archery', 'fencing'
        ],
        'Occupations': [
            // Easy
            'chef', 'cook', 'doc', 'vet', 'cop',
            // Medium
            'nurse', 'pilot', 'actor', 'baker', 'judge', 'coach', 'guard',
            'artist', 'singer', 'driver', 'farmer', 'doctor', 'lawyer', 'writer',
            'dancer', 'tailor', 'barber'
        ],
        'Technology': [
            // Easy
            'app', 'web', 'usb', 'cpu', 'ram', 'bug', 'wifi', 'code', 'data',
            // Medium
            'mouse', 'email', 'laptop', 'tablet', 'phone', 'robot', 'cloud',
            'server', 'screen', 'coding', 'gaming', 'hacker', 'pixel'
        ],
        'Colors & Shapes': [
            // Easy
            'red', 'blue', 'pink', 'gray', 'gold', 'line', 'cube', 'cone',
            // Medium
            'green', 'black', 'white', 'brown', 'orange', 'purple', 'yellow',
            'circle', 'square', 'oval', 'heart', 'star', 'arrow', 'cross'
        ]
    };

    // Keyboard layout (QWERTY style)
    const KEYBOARD_ROWS = [
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
        ['z', 'x', 'c', 'v', 'b', 'n', 'm']
    ];

    const MAX_WRONG = 6;
    const HANGMAN_PARTS = ['head', 'body', 'left-arm', 'right-arm', 'left-leg', 'right-leg'];

    // Game state
    let currentWord = '';
    let currentCategory = '';
    let guessedLetters = new Set();
    let correctLetters = new Set();
    let wrongCount = 0;
    let gameOver = false;
    let score = 0;

    // DOM Elements
    const wordContainer = document.getElementById('word-container');
    const categoryName = document.getElementById('category-name');
    const wrongCountEl = document.getElementById('wrong-count');
    const scoreEl = document.getElementById('score');
    const gameMessage = document.getElementById('game-message');
    const restartBtn = document.getElementById('restart-btn');
    const keyboardRows = [
        document.getElementById('row1'),
        document.getElementById('row2'),
        document.getElementById('row3')
    ];

    /**
     * Initialize the game
     */
    function init() {
        createKeyboard();
        startNewGame();
        setupEventListeners();
    }

    /**
     * Create the on-screen keyboard
     */
    function createKeyboard() {
        KEYBOARD_ROWS.forEach((row, index) => {
            keyboardRows[index].innerHTML = '';
            row.forEach(letter => {
                const button = document.createElement('button');
                button.className = 'key-btn';
                button.textContent = letter;
                button.dataset.letter = letter;
                button.setAttribute('aria-label', `Guess letter ${letter.toUpperCase()}`);
                keyboardRows[index].appendChild(button);
            });
        });
    }

    /**
     * Start a new game
     */
    function startNewGame() {
        // Pick random category
        const categories = Object.keys(WORD_CATEGORIES);
        currentCategory = categories[Math.floor(Math.random() * categories.length)];
        
        // Pick random word from category
        const words = WORD_CATEGORIES[currentCategory];
        currentWord = words[Math.floor(Math.random() * words.length)].toLowerCase();
        
        // Reset state
        guessedLetters = new Set();
        correctLetters = new Set();
        wrongCount = 0;
        gameOver = false;

        // Update UI
        categoryName.textContent = currentCategory;
        updateWordDisplay();
        updateWrongCount();
        resetKeyboard();
        resetHangman();
        
        gameMessage.textContent = '';
        gameMessage.className = 'game-message';
    }

    /**
     * Update the word display
     */
    function updateWordDisplay() {
        wordContainer.innerHTML = '';
        
        for (const letter of currentWord) {
            const letterBox = document.createElement('div');
            letterBox.className = 'letter-box';
            
            if (correctLetters.has(letter)) {
                letterBox.textContent = letter;
                letterBox.classList.add('revealed');
            }
            
            wordContainer.appendChild(letterBox);
        }
    }

    /**
     * Update wrong count display
     */
    function updateWrongCount() {
        wrongCountEl.textContent = wrongCount;
    }

    /**
     * Update score display
     */
    function updateScore() {
        scoreEl.textContent = score;
    }

    /**
     * Reset keyboard buttons
     */
    function resetKeyboard() {
        document.querySelectorAll('.key-btn').forEach(button => {
            button.disabled = false;
            button.classList.remove('correct', 'incorrect');
        });
    }

    /**
     * Reset hangman drawing
     */
    function resetHangman() {
        HANGMAN_PARTS.forEach(part => {
            const element = document.querySelector(`.hangman-part.${part}`);
            if (element) {
                element.classList.remove('visible');
            }
        });
    }

    /**
     * Show next hangman part
     */
    function showNextHangmanPart() {
        if (wrongCount > 0 && wrongCount <= HANGMAN_PARTS.length) {
            const part = HANGMAN_PARTS[wrongCount - 1];
            const element = document.querySelector(`.hangman-part.${part}`);
            if (element) {
                element.classList.add('visible');
            }
        }
    }

    /**
     * Handle a letter guess
     */
    function guessLetter(letter) {
        if (gameOver || guessedLetters.has(letter)) {
            return;
        }

        guessedLetters.add(letter);
        const button = document.querySelector(`[data-letter="${letter}"]`);

        if (currentWord.includes(letter)) {
            // Correct guess
            correctLetters.add(letter);
            if (button) {
                button.classList.add('correct');
                button.disabled = true;
            }
        } else {
            // Wrong guess
            wrongCount++;
            if (button) {
                button.classList.add('incorrect');
                button.disabled = true;
            }
            showNextHangmanPart();
        }

        updateWordDisplay();
        updateWrongCount();
        checkGameEnd();
    }

    /**
     * Check if game has ended
     */
    function checkGameEnd() {
        const wordLetters = new Set(currentWord);
        const allGuessed = [...wordLetters].every(letter => correctLetters.has(letter));

        if (allGuessed) {
            gameOver = true;
            score += 10;
            updateScore();
            gameMessage.textContent = '🎉 You Won! +10 points';
            gameMessage.className = 'game-message win';
            disableAllKeys();
            return;
        }

        if (wrongCount >= MAX_WRONG) {
            gameOver = true;
            gameMessage.textContent = `Game Over! Word: ${currentWord.toUpperCase()}`;
            gameMessage.className = 'game-message lose';
            revealWord();
            disableAllKeys();
        }
    }

    /**
     * Reveal all letters
     */
    function revealWord() {
        const letterBoxes = wordContainer.querySelectorAll('.letter-box');
        currentWord.split('').forEach((letter, index) => {
            if (!letterBoxes[index].textContent) {
                letterBoxes[index].textContent = letter;
                letterBoxes[index].style.color = 'var(--wrong-red)';
            }
        });
    }

    /**
     * Disable all keyboard keys
     */
    function disableAllKeys() {
        document.querySelectorAll('.key-btn').forEach(button => {
            button.disabled = true;
        });
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Keyboard button clicks
        document.querySelectorAll('.keyboard-row').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.classList.contains('key-btn')) {
                    guessLetter(e.target.dataset.letter);
                }
            });
        });

        // Physical keyboard
        document.addEventListener('keydown', (e) => {
            const letter = e.key.toLowerCase();
            if (/^[a-z]$/.test(letter)) {
                guessLetter(letter);
            }
        });

        // Restart button
        restartBtn.addEventListener('click', startNewGame);
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
