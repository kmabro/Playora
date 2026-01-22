/**
 * Rock Paper Scissors
 * Clean, responsive game with Human vs AI and Human vs Human modes
 * 
 * Features:
 * - Human vs AI (random)
 * - Human vs Human (turn-based)
 * - LocalStorage for scores
 * - No external dependencies
 */

(function() {
    'use strict';

    // ==========================================
    // Configuration
    // ==========================================
    const CHOICES = ['rock', 'paper', 'scissors'];
    const EMOJIS = { rock: '✊', paper: '✋', scissors: '✌️', unknown: '❓' };
    const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
    const AI_DELAY = 600;
    const STORAGE_KEY = 'rps_game_data';

    // ==========================================
    // Game State
    // ==========================================
    const state = {
        mode: 'ai',           // 'ai' or 'human'
        scores: { p1: 0, p2: 0, draws: 0 },
        currentTurn: 1,       // For human vs human
        p1Choice: null,       // For human vs human
        isPlaying: false
    };

    // ==========================================
    // DOM Elements
    // ==========================================
    const dom = {
        modeButtons: document.querySelectorAll('.mode-btn'),
        choiceButtons: document.querySelectorAll('.choice-btn'),
        player1Choice: document.getElementById('player1Choice'),
        player2Choice: document.getElementById('player2Choice'),
        player1Label: document.getElementById('player1Label'),
        player2Label: document.getElementById('player2Label'),
        score1Label: document.getElementById('score1Label'),
        score2Label: document.getElementById('score2Label'),
        score1: document.getElementById('score1'),
        score2: document.getElementById('score2'),
        scoreDraw: document.getElementById('scoreDraw'),
        result: document.getElementById('result'),
        resetBtn: document.getElementById('resetBtn'),
        turnIndicator: document.getElementById('turnIndicator'),
        turnText: document.getElementById('turnText')
    };

    // ==========================================
    // AI Logic - Simple Random
    // ==========================================
    const AI = {
        /**
         * Get random AI choice
         * @returns {string} chosen move
         */
        getChoice() {
            return CHOICES[Math.floor(Math.random() * CHOICES.length)];
        }
    };

    // ==========================================
    // Game Logic
    // ==========================================
    const Game = {
        /**
         * Initialize game
         */
        init() {
            this.loadState();
            this.updateUI();
            this.bindEvents();
        },

        /**
         * Bind event listeners
         */
        bindEvents() {
            // Mode selection
            dom.modeButtons.forEach(btn => {
                btn.addEventListener('click', () => this.setMode(btn.dataset.mode));
            });

            // Choice buttons
            dom.choiceButtons.forEach(btn => {
                btn.addEventListener('click', () => this.handleChoice(btn.dataset.choice));
            });

            // Reset button
            dom.resetBtn.addEventListener('click', () => this.reset());
        },

        /**
         * Set game mode (ai or human)
         * @param {string} mode
         */
        setMode(mode) {
            state.mode = mode;
            state.currentTurn = 1;
            state.p1Choice = null;

            // Update mode buttons
            dom.modeButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mode === mode);
            });

            // Update labels
            this.updateLabels();
            this.resetRound();
        },

        /**
         * Update labels based on mode
         */
        updateLabels() {
            if (state.mode === 'ai') {
                dom.player1Label.textContent = 'You';
                dom.player2Label.textContent = 'AI';
                dom.score1Label.textContent = 'You';
                dom.score2Label.textContent = 'AI';
                dom.turnIndicator.classList.add('hidden');
            } else {
                dom.player1Label.textContent = 'P1';
                dom.player2Label.textContent = 'P2';
                dom.score1Label.textContent = 'P1';
                dom.score2Label.textContent = 'P2';
                dom.turnIndicator.classList.remove('hidden');
                dom.turnText.textContent = "Player 1's Turn";
            }
        },

        /**
         * Handle player choice
         * @param {string} choice
         */
        async handleChoice(choice) {
            if (state.isPlaying) return;

            if (state.mode === 'ai') {
                await this.playVsAI(choice);
            } else {
                this.playVsHuman(choice);
            }
        },

        /**
         * Play against AI
         * @param {string} playerChoice
         */
        async playVsAI(playerChoice) {
            state.isPlaying = true;
            this.setButtonsDisabled(true);

            // Show player choice
            this.showChoice(1, playerChoice);

            // AI "thinking"
            dom.player2Choice.classList.add('thinking');
            dom.player2Choice.textContent = '🤔';

            await this.delay(AI_DELAY);

            // Get AI choice
            const aiChoice = AI.getChoice();
            dom.player2Choice.classList.remove('thinking');
            this.showChoice(2, aiChoice);

            // Determine winner
            await this.delay(150);
            const result = this.getResult(playerChoice, aiChoice);
            this.showResult(result, false);
            this.updateScores(result);
            this.saveState();

            state.isPlaying = false;
            this.setButtonsDisabled(false);
        },

        /**
         * Play human vs human
         * @param {string} choice
         */
        playVsHuman(choice) {
            if (state.currentTurn === 1) {
                // Player 1's turn - hide choice
                state.p1Choice = choice;
                dom.player1Choice.textContent = '✅';
                state.currentTurn = 2;
                dom.turnText.textContent = "Player 2's Turn";
                dom.result.textContent = "Player 2, make your move!";
                dom.result.className = 'result';
            } else {
                // Player 2's turn - reveal and determine winner
                const p1Choice = state.p1Choice;
                const p2Choice = choice;

                // Show both choices
                this.showChoice(1, p1Choice);
                this.showChoice(2, p2Choice);

                // Determine winner
                const result = this.getResult(p1Choice, p2Choice);
                this.showResult(result, true);
                this.updateScores(result);
                this.saveState();

                // Reset for next round after delay
                setTimeout(() => {
                    state.currentTurn = 1;
                    state.p1Choice = null;
                    dom.turnText.textContent = "Player 1's Turn";
                }, 1500);
            }
        },

        /**
         * Show choice in display circle
         * @param {number} player - 1 or 2
         * @param {string} choice
         */
        showChoice(player, choice) {
            const el = player === 1 ? dom.player1Choice : dom.player2Choice;
            el.textContent = EMOJIS[choice];
            el.classList.remove('winner', 'loser', 'draw');
        },

        /**
         * Get result of round
         * @param {string} choice1
         * @param {string} choice2
         * @returns {string} 'draw', 'p1', or 'p2'
         */
        getResult(choice1, choice2) {
            if (choice1 === choice2) return 'draw';
            return BEATS[choice1] === choice2 ? 'p1' : 'p2';
        },

        /**
         * Show result message and highlight winner
         * @param {string} result
         * @param {boolean} isHuman - human vs human mode
         */
        showResult(result, isHuman) {
            dom.player1Choice.classList.remove('winner', 'loser', 'draw');
            dom.player2Choice.classList.remove('winner', 'loser', 'draw');
            dom.result.className = 'result';

            const p1Name = isHuman ? 'Player 1' : 'You';
            const p2Name = isHuman ? 'Player 2' : 'AI';

            if (result === 'draw') {
                dom.result.textContent = "🤝 It's a Draw!";
                dom.result.classList.add('draw');
                dom.player1Choice.classList.add('draw');
                dom.player2Choice.classList.add('draw');
            } else if (result === 'p1') {
                dom.result.textContent = `🎉 ${p1Name} Win${isHuman ? 's' : ''}!`;
                dom.result.classList.add('win');
                dom.player1Choice.classList.add('winner');
                dom.player2Choice.classList.add('loser');
            } else {
                dom.result.textContent = `${isHuman ? '🎉' : '😢'} ${p2Name} Win${isHuman ? 's' : ''}!`;
                dom.result.classList.add('lose');
                dom.player1Choice.classList.add('loser');
                dom.player2Choice.classList.add('winner');
            }
        },

        /**
         * Update scores
         * @param {string} result
         */
        updateScores(result) {
            if (result === 'p1') state.scores.p1++;
            else if (result === 'p2') state.scores.p2++;
            else state.scores.draws++;

            dom.score1.textContent = state.scores.p1;
            dom.score2.textContent = state.scores.p2;
            dom.scoreDraw.textContent = state.scores.draws;
        },

        /**
         * Reset round display (not scores)
         */
        resetRound() {
            dom.player1Choice.textContent = EMOJIS.unknown;
            dom.player2Choice.textContent = EMOJIS.unknown;
            dom.player1Choice.classList.remove('winner', 'loser', 'draw', 'thinking');
            dom.player2Choice.classList.remove('winner', 'loser', 'draw', 'thinking');
            dom.result.textContent = 'Choose your move!';
            dom.result.className = 'result';
        },

        /**
         * Full game reset
         */
        reset() {
            state.scores = { p1: 0, p2: 0, draws: 0 };
            state.currentTurn = 1;
            state.p1Choice = null;

            dom.score1.textContent = '0';
            dom.score2.textContent = '0';
            dom.scoreDraw.textContent = '0';

            this.resetRound();
            this.updateLabels();
            this.saveState();
        },

        /**
         * Update UI from state
         */
        updateUI() {
            dom.score1.textContent = state.scores.p1;
            dom.score2.textContent = state.scores.p2;
            dom.scoreDraw.textContent = state.scores.draws;
            this.updateLabels();
        },

        /**
         * Enable/disable choice buttons
         * @param {boolean} disabled
         */
        setButtonsDisabled(disabled) {
            dom.choiceButtons.forEach(btn => btn.disabled = disabled);
        },

        /**
         * Save state to localStorage
         */
        saveState() {
            const data = {
                scores: state.scores
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        },

        /**
         * Load state from localStorage
         */
        loadState() {
            try {
                const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
                if (data) {
                    state.scores = data.scores || { p1: 0, p2: 0, draws: 0 };
                }
            } catch (e) {
                console.warn('Failed to load saved state');
            }
        },

        /**
         * Promise-based delay
         * @param {number} ms
         * @returns {Promise}
         */
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    };

    // ==========================================
    // Initialize when DOM ready
    // ==========================================
    Game.init();

})();
