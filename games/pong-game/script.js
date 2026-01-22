/**
 * Pong Game - Vanilla JavaScript Implementation
 * Human vs Human and Human vs AI modes
 */

(function() {
    'use strict';

    // Game State
    const state = {
        gameRunning: false,
        gameMode: 'ai', // 'pvp' or 'ai'
        scores: { player1: 0, player2: 0 },
        keys: {
            // Player 1 (Left paddle): W/S
            w: false,
            s: false,
            // Player 2 (Right paddle): Arrow Up/Down
            arrowUp: false,
            arrowDown: false
        },
        touch: {
            left: { active: false, startY: 0, currentY: 0 },
            right: { active: false, startY: 0, currentY: 0 }
        },
        ai: {
            targetY: 50,
            reactionTime: 0,
            lastUpdate: 0,
            error: 0,
            speed: 1.2
        }
    };

    // Game Objects
    const ball = {
        x: 50,
        y: 50,
        vx: 0,
        vy: 0,
        speed: 0.5,
        radius: 1
    };

    const paddles = {
        left: { y: 42.5, height: 15, speed: 1.5 },
        right: { y: 42.5, height: 15, speed: 1.5 }
    };

    // DOM Elements
    let elements = {};

    // Initialize DOM Elements
    function initElements() {
        elements = {
            gameContainer: document.getElementById('gameContainer'),
            ball: document.getElementById('ball'),
            paddleLeft: document.getElementById('paddleLeft'),
            paddleRight: document.getElementById('paddleRight'),
            score1: document.getElementById('score1'),
            score2: document.getElementById('score2'),
            player1Label: document.getElementById('player1Label'),
            player2Label: document.getElementById('player2Label'),
            resetBtn: document.getElementById('resetBtn'),
            startMessage: document.getElementById('startMessage'),
            modeButtons: document.querySelectorAll('.mode-btn'),
            touchZoneLeft: document.getElementById('touchZoneLeft'),
            touchZoneRight: document.getElementById('touchZoneRight')
        };
    }

    // Initialize Ball Position and Velocity
    function initBall() {
        ball.x = 50;
        ball.y = 50;
        ball.speed = 0.5;
        
        // Random direction
        const angle = (Math.random() * 0.5 - 0.25) * Math.PI;
        const direction = Math.random() > 0.5 ? 1 : -1;
        ball.vx = direction * Math.cos(angle) * ball.speed;
        ball.vy = Math.sin(angle) * ball.speed;
    }

    // Initialize Paddles
    function initPaddles() {
        paddles.left.y = 42.5;
        paddles.right.y = 42.5;
    }

    // Update Ball Position
    function updateBall() {
        if (!state.gameRunning) return;

        ball.x += ball.vx;
        ball.y += ball.vy;

        // Wall collision (top and bottom)
        if (ball.y <= 1 || ball.y >= 99) {
            ball.vy = -ball.vy;
            ball.y = ball.y <= 1 ? 1 : 99;
        }

        // Paddle collision
        checkPaddleCollision();

        // Score detection
        if (ball.x <= 0) {
            score('player2');
        } else if (ball.x >= 100) {
            score('player1');
        }

        // Update ball element position
        updateBallElement();
    }

    // Check Paddle Collision
    function checkPaddleCollision() {
        const ballSize = 2;
        const paddleWidth = 1.5;

        // Left paddle collision
        if (ball.x <= 4 + paddleWidth && ball.x >= 2) {
            const paddleTop = paddles.left.y;
            const paddleBottom = paddles.left.y + paddles.left.height;
            
            if (ball.y >= paddleTop - ballSize && ball.y <= paddleBottom + ballSize) {
                ball.vx = Math.abs(ball.vx);
                
                // Calculate angle based on where ball hit paddle
                const hitPos = (ball.y - paddleTop) / paddles.left.height;
                const angle = (hitPos - 0.5) * Math.PI * 0.5;
                
                ball.speed = Math.min(ball.speed * 1.05, 1.5);
                ball.vx = Math.cos(angle) * ball.speed;
                ball.vy = Math.sin(angle) * ball.speed;
                
                ball.x = 4 + paddleWidth;
            }
        }

        // Right paddle collision
        if (ball.x >= 96 - paddleWidth && ball.x <= 98) {
            const paddleTop = paddles.right.y;
            const paddleBottom = paddles.right.y + paddles.right.height;
            
            if (ball.y >= paddleTop - ballSize && ball.y <= paddleBottom + ballSize) {
                ball.vx = -Math.abs(ball.vx);
                
                // Calculate angle based on where ball hit paddle
                const hitPos = (ball.y - paddleTop) / paddles.right.height;
                const angle = (hitPos - 0.5) * Math.PI * 0.5;
                
                ball.speed = Math.min(ball.speed * 1.05, 1.5);
                ball.vx = -Math.cos(angle) * ball.speed;
                ball.vy = Math.sin(angle) * ball.speed;
                
                ball.x = 96 - paddleWidth;
            }
        }
    }

    // Score Function
    function score(player) {
        state.scores[player]++;
        updateScoreboard(player);
        initBall();
    }

    // Update Scoreboard
    function updateScoreboard(lastScorer) {
        elements.score1.textContent = state.scores.player1;
        elements.score2.textContent = state.scores.player2;

        // Flash animation
        const scoreElement = lastScorer === 'player1' ? elements.score1 : elements.score2;
        scoreElement.classList.add('flash');
        setTimeout(() => scoreElement.classList.remove('flash'), 300);
    }

    // Update Ball Element Position
    function updateBallElement() {
        elements.ball.style.left = `${ball.x}%`;
        elements.ball.style.top = `${ball.y}%`;
    }

    // Update Paddle Positions
    function updatePaddles() {
        // Player 1 controls (left paddle)
        if (state.keys.w || state.touch.left.active) {
            let moveAmount = paddles.left.speed;
            if (state.touch.left.active) {
                moveAmount = (state.touch.left.startY - state.touch.left.currentY) * 0.1;
            }
            paddles.left.y = Math.max(0, paddles.left.y - Math.abs(moveAmount));
        }
        if (state.keys.s || (state.touch.left.active && state.touch.left.currentY > state.touch.left.startY)) {
            let moveAmount = paddles.left.speed;
            if (state.touch.left.active) {
                moveAmount = (state.touch.left.currentY - state.touch.left.startY) * 0.1;
            }
            paddles.left.y = Math.min(100 - paddles.left.height, paddles.left.y + Math.abs(moveAmount));
        }

        // Player 2 controls (right paddle) or AI
        if (state.gameMode === 'ai') {
            updateAI();
        } else {
            if (state.keys.arrowUp || state.touch.right.active) {
                let moveAmount = paddles.right.speed;
                if (state.touch.right.active) {
                    moveAmount = (state.touch.right.startY - state.touch.right.currentY) * 0.1;
                }
                paddles.right.y = Math.max(0, paddles.right.y - Math.abs(moveAmount));
            }
            if (state.keys.arrowDown || (state.touch.right.active && state.touch.right.currentY > state.touch.right.startY)) {
                let moveAmount = paddles.right.speed;
                if (state.touch.right.active) {
                    moveAmount = (state.touch.right.currentY - state.touch.right.startY) * 0.1;
                }
                paddles.right.y = Math.min(100 - paddles.right.height, paddles.right.y + Math.abs(moveAmount));
            }
        }

        // Update paddle elements
        elements.paddleLeft.style.top = `${paddles.left.y}%`;
        elements.paddleRight.style.top = `${paddles.right.y}%`;
    }

    // AI Logic - Human-like behavior
    function updateAI() {
        const now = Date.now();
        const paddleCenter = paddles.right.y + paddles.right.height / 2;
        
        // Only update AI target periodically (simulates human reaction time)
        if (now - state.ai.lastUpdate > state.ai.reactionTime) {
            state.ai.lastUpdate = now;
            
            // Predict where ball will be, but with human-like error
            let predictedY = ball.y;
            
            // Only track ball when it's coming towards AI
            if (ball.vx > 0) {
                // Add prediction based on ball trajectory
                const timeToReach = (96 - ball.x) / Math.abs(ball.vx);
                predictedY = ball.y + ball.vy * timeToReach * 0.6;
                
                // Add human-like error (sometimes misjudges)
                state.ai.error = (Math.random() - 0.5) * 20;
                predictedY += state.ai.error;
                
                // Clamp prediction
                predictedY = Math.max(10, Math.min(90, predictedY));
            } else {
                // Ball going away - move towards center with some randomness
                predictedY = 50 + (Math.random() - 0.5) * 30;
            }
            
            state.ai.targetY = predictedY;
            
            // Randomize reaction time (150-400ms like a human)
            state.ai.reactionTime = 150 + Math.random() * 250;
            
            // Randomize speed slightly
            state.ai.speed = 1.0 + Math.random() * 0.5;
        }
        
        // Move towards target with human-like speed
        const diff = state.ai.targetY - paddleCenter;
        const deadZone = 5; // Don't move if close enough
        
        if (Math.abs(diff) > deadZone) {
            const moveAmount = Math.sign(diff) * Math.min(Math.abs(diff) * 0.08, state.ai.speed);
            paddles.right.y = Math.max(0, Math.min(100 - paddles.right.height, paddles.right.y + moveAmount));
        }
    }

    // Game Loop
    function gameLoop() {
        if (state.gameRunning) {
            updateBall();
            updatePaddles();
        }
        requestAnimationFrame(gameLoop);
    }

    // Start Game
    function startGame() {
        if (!state.gameRunning) {
            state.gameRunning = true;
            elements.startMessage.classList.add('hidden');
            initBall();
        }
    }

    // Reset Game
    function resetGame() {
        state.gameRunning = false;
        state.scores.player1 = 0;
        state.scores.player2 = 0;
        initBall();
        initPaddles();
        updateScoreboard('player1');
        updateScoreboard('player2');
        elements.startMessage.classList.remove('hidden');
        updateBallElement();
        elements.paddleLeft.style.top = `${paddles.left.y}%`;
        elements.paddleRight.style.top = `${paddles.right.y}%`;
    }

    // Set Game Mode
    function setGameMode(mode) {
        state.gameMode = mode;
        
        elements.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        if (mode === 'ai') {
            elements.player1Label.textContent = 'You';
            elements.player2Label.textContent = 'AI';
        } else {
            elements.player1Label.textContent = 'P1 (W/S)';
            elements.player2Label.textContent = 'P2 (↑/↓)';
        }
        
        resetGame();
    }

    // Event Handlers
    function setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            const key = e.key;
            
            // Player 1 controls: W/S (or Arrow keys in AI mode)
            if (key === 'w' || key === 'W') {
                state.keys.w = true;
            } else if (key === 's' || key === 'S') {
                state.keys.s = true;
            }
            
            // Arrow keys
            if (key === 'ArrowUp') {
                e.preventDefault();
                state.keys.arrowUp = true;
                // In AI mode, arrows control left paddle
                if (state.gameMode === 'ai') {
                    state.keys.w = true;
                }
            } else if (key === 'ArrowDown') {
                e.preventDefault();
                state.keys.arrowDown = true;
                // In AI mode, arrows control left paddle
                if (state.gameMode === 'ai') {
                    state.keys.s = true;
                }
            }
            
            if (key === ' ') {
                e.preventDefault();
                startGame();
            }
        });

        document.addEventListener('keyup', (e) => {
            const key = e.key;
            
            if (key === 'w' || key === 'W') {
                state.keys.w = false;
            } else if (key === 's' || key === 'S') {
                state.keys.s = false;
            }
            
            if (key === 'ArrowUp') {
                state.keys.arrowUp = false;
                if (state.gameMode === 'ai') {
                    state.keys.w = false;
                }
            } else if (key === 'ArrowDown') {
                state.keys.arrowDown = false;
                if (state.gameMode === 'ai') {
                    state.keys.s = false;
                }
            }
        });

        // Touch events for left zone (Player 1)
        elements.touchZoneLeft.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startGame();
            const touch = e.touches[0];
            state.touch.left.active = true;
            state.touch.left.startY = touch.clientY;
            state.touch.left.currentY = touch.clientY;
        });

        elements.touchZoneLeft.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            state.touch.left.currentY = touch.clientY;
            
            // Direct paddle control based on touch position within game container
            const rect = elements.gameContainer.getBoundingClientRect();
            const relativeY = ((touch.clientY - rect.top) / rect.height) * 100;
            paddles.left.y = Math.max(0, Math.min(100 - paddles.left.height, relativeY - paddles.left.height / 2));
        });

        elements.touchZoneLeft.addEventListener('touchend', () => {
            state.touch.left.active = false;
        });

        // Touch events for right zone (Player 2)
        elements.touchZoneRight.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startGame();
            const touch = e.touches[0];
            state.touch.right.active = true;
            state.touch.right.startY = touch.clientY;
            state.touch.right.currentY = touch.clientY;
        });

        elements.touchZoneRight.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (state.gameMode === 'ai') return; // Ignore if AI is playing
            
            const touch = e.touches[0];
            state.touch.right.currentY = touch.clientY;
            
            // Direct paddle control based on touch position within game container
            const rect = elements.gameContainer.getBoundingClientRect();
            const relativeY = ((touch.clientY - rect.top) / rect.height) * 100;
            paddles.right.y = Math.max(0, Math.min(100 - paddles.right.height, relativeY - paddles.right.height / 2));
        });

        elements.touchZoneRight.addEventListener('touchend', () => {
            state.touch.right.active = false;
        });

        // Mode buttons
        elements.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                setGameMode(btn.dataset.mode);
            });
        });

        // Reset button
        elements.resetBtn.addEventListener('click', resetGame);

        // Click/tap on game container to start
        elements.gameContainer.addEventListener('click', startGame);

        // Window resize handler
        window.addEventListener('resize', () => {
            // Game uses percentage-based positioning, so no recalculation needed
            // Just ensure the ball and paddles are rendered correctly
            updateBallElement();
            elements.paddleLeft.style.top = `${paddles.left.y}%`;
            elements.paddleRight.style.top = `${paddles.right.y}%`;
        });
    }

    // Initialize Game
    function init() {
        initElements();
        initBall();
        initPaddles();
        setupEventListeners();
        updateBallElement();
        // Set initial mode
        setGameMode('ai');
        gameLoop();
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
