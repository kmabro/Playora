/**
 * ============================================
 * CHESS GAME ENGINE
 * Human vs AI with Voice & Sound
 * Stable board, transform-based animations
 * ============================================
 */

(function() {
    'use strict';

    // ==================== CONSTANTS ====================

    const PIECES = {
        K: { white: '♔', black: '♚', value: 0 },
        Q: { white: '♕', black: '♛', value: 900 },
        R: { white: '♖', black: '♜', value: 500 },
        B: { white: '♗', black: '♝', value: 330 },
        N: { white: '♘', black: '♞', value: 320 },
        P: { white: '♙', black: '♟', value: 100 }
    };

    const INITIAL_BOARD = [
        ['bR','bN','bB','bQ','bK','bB','bN','bR'],
        ['bP','bP','bP','bP','bP','bP','bP','bP'],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        ['wP','wP','wP','wP','wP','wP','wP','wP'],
        ['wR','wN','wB','wQ','wK','wB','wN','wR']
    ];

    // Position value tables for AI evaluation
    const POSITION_VALUES = {
        P: [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5,  5, 10, 25, 25, 10,  5,  5],
            [0,  0,  0, 20, 20,  0,  0,  0],
            [5, -5,-10,  0,  0,-10, -5,  5],
            [5, 10, 10,-20,-20, 10, 10,  5],
            [0,  0,  0,  0,  0,  0,  0,  0]
        ],
        N: [
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ],
        B: [
            [-20,-10,-10,-10,-10,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5, 10, 10,  5,  0,-10],
            [-10,  5,  5, 10, 10,  5,  5,-10],
            [-10,  0, 10, 10, 10, 10,  0,-10],
            [-10, 10, 10, 10, 10, 10, 10,-10],
            [-10,  5,  0,  0,  0,  0,  5,-10],
            [-20,-10,-10,-10,-10,-10,-10,-20]
        ],
        R: [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [5, 10, 10, 10, 10, 10, 10,  5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [0,  0,  0,  5,  5,  0,  0,  0]
        ],
        Q: [
            [-20,-10,-10, -5, -5,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5,  5,  5,  5,  0,-10],
            [-5,  0,  5,  5,  5,  5,  0, -5],
            [0,  0,  5,  5,  5,  5,  0, -5],
            [-10,  5,  5,  5,  5,  5,  0,-10],
            [-10,  0,  5,  0,  0,  0,  0,-10],
            [-20,-10,-10, -5, -5,-10,-10,-20]
        ],
        K: [
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-20,-30,-30,-40,-40,-30,-30,-20],
            [-10,-20,-20,-20,-20,-20,-20,-10],
            [20, 20,  0,  0,  0,  0, 20, 20],
            [20, 30, 10,  0,  0, 10, 30, 20]
        ]
    };

    // ==================== GAME STATE ====================

    const state = {
        board: [],
        turn: 'w',
        selected: null,
        legalMoves: [],
        lastMove: null,
        gameOver: false,
        castling: { wK: true, wQ: true, bK: true, bQ: true },
        enPassant: null,
        isAIThinking: false,
        gameMode: 'ai' // 'ai' or 'human'
    };

    // DOM element cache
    const elements = {
        board: null,
        status: null,
        statusText: null,
        restartBtn: null,
        overlay: null,
        overlayMessage: null,
        overlayRestartBtn: null,
        modeAIBtn: null,
        modeHumanBtn: null,
        squares: [],
        pieces: new Map()
    };

    // Audio context for sound effects
    let audioCtx = null;

    // ==================== INITIALIZATION ====================

    /**
     * Initialize the game on DOM ready
     */
    function init() {
        cacheElements();
        initAudio();
        resetState();
        createBoard();
        renderPieces();
        updateStatus();
        setupEventListeners();
    }

    /**
     * Cache DOM elements for performance
     */
    function cacheElements() {
        elements.board = document.getElementById('board');
        elements.status = document.getElementById('status');
        elements.statusText = elements.status.querySelector('.status-text');
        elements.restartBtn = document.getElementById('restartBtn');
        elements.overlay = document.getElementById('overlay');
        elements.overlayMessage = document.getElementById('overlayMessage');
        elements.overlayRestartBtn = document.getElementById('overlayRestartBtn');
        elements.modeAIBtn = document.getElementById('modeAI');
        elements.modeHumanBtn = document.getElementById('modeHuman');
    }

    /**
     * Reset game state to initial
     */
    function resetState() {
        state.board = INITIAL_BOARD.map(row => [...row]);
        state.turn = 'w';
        state.selected = null;
        state.legalMoves = [];
        state.lastMove = null;
        state.gameOver = false;
        state.castling = { wK: true, wQ: true, bK: true, bQ: true };
        state.enPassant = null;
        state.isAIThinking = false;
        // Note: gameMode is intentionally NOT reset here to preserve user's selection
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        elements.restartBtn.addEventListener('click', () => {
            playSound('click');
            restartGame();
        });
        elements.overlayRestartBtn.addEventListener('click', () => {
            playSound('click');
            restartGame();
        });

        // Mode toggle buttons
        elements.modeAIBtn.addEventListener('click', () => {
            if (state.gameMode !== 'ai') {
                playSound('click');
                setGameMode('ai');
            }
        });

        elements.modeHumanBtn.addEventListener('click', () => {
            if (state.gameMode !== 'human') {
                playSound('click');
                setGameMode('human');
            }
        });
    }

    /**
     * Set game mode (AI or Human)
     */
    function setGameMode(mode) {
        state.gameMode = mode;
        
        // Update button states
        if (mode === 'ai') {
            elements.modeAIBtn.classList.add('active');
            elements.modeHumanBtn.classList.remove('active');
        } else {
            elements.modeAIBtn.classList.remove('active');
            elements.modeHumanBtn.classList.add('active');
        }

        // Restart game with new mode
        restartGame();
    }

    // ==================== AUDIO SYSTEM ====================

    /**
     * Initialize Web Audio API
     */
    function initAudio() {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    /**
     * Resume audio context (for user interaction requirement)
     */
    function resumeAudio() {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    /**
     * Play Chess.com-style sound effects using Web Audio API
     * Short, clean, wooden click sounds
     */
    function playSound(type) {
        if (!audioCtx) return;
        resumeAudio();

        switch (type) {
            case 'move':
                playMoveSound();
                break;
            case 'capture':
                playCaptureSound();
                break;
            case 'check':
                playCheckSound();
                break;
            case 'checkmate':
                playCheckmateSound();
                break;
            case 'castle':
                playCastleSound();
                break;
        }
    }

    /**
     * Soft wooden click for normal moves
     */
    function playMoveSound() {
        const now = audioCtx.currentTime;
        
        // Create noise burst for wood-like click
        const bufferSize = audioCtx.sampleRate * 0.06;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            // Noise with fast decay
            const decay = Math.exp(-i / (bufferSize * 0.08));
            data[i] = (Math.random() * 2 - 1) * decay;
        }
        
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        
        // Bandpass filter for wooden tone
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1800;
        filter.Q.value = 1.5;
        
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        
        noise.start(now);
        noise.stop(now + 0.06);
        
        // Add subtle tonal component
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);
        
        const oscGain = audioCtx.createGain();
        oscGain.gain.setValueAtTime(0.08, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        
        osc.connect(oscGain);
        oscGain.connect(audioCtx.destination);
        
        osc.start(now);
        osc.stop(now + 0.05);
    }

    /**
     * Sharper clack for captures
     */
    function playCaptureSound() {
        const now = audioCtx.currentTime;
        
        // Sharper noise burst
        const bufferSize = audioCtx.sampleRate * 0.08;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            const decay = Math.exp(-i / (bufferSize * 0.06));
            data[i] = (Math.random() * 2 - 1) * decay;
        }
        
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        
        // Higher frequency bandpass for sharper sound
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2200;
        filter.Q.value = 2;
        
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        
        noise.start(now);
        noise.stop(now + 0.08);
        
        // Add impact tone
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
        
        const oscGain = audioCtx.createGain();
        oscGain.gain.setValueAtTime(0.15, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        
        osc.connect(oscGain);
        oscGain.connect(audioCtx.destination);
        
        osc.start(now);
        osc.stop(now + 0.07);
    }

    /**
     * Alert tone for check
     */
    function playCheckSound() {
        const now = audioCtx.currentTime;
        
        // Two-tone alert
        const osc1 = audioCtx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 660;
        
        const gain1 = audioCtx.createGain();
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.2, now + 0.01);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        
        osc1.start(now);
        osc1.stop(now + 0.12);
        
        // Second tone
        const osc2 = audioCtx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 880;
        
        const gain2 = audioCtx.createGain();
        gain2.gain.setValueAtTime(0, now + 0.08);
        gain2.gain.linearRampToValueAtTime(0.15, now + 0.09);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        
        osc2.start(now + 0.08);
        osc2.stop(now + 0.2);
    }

    /**
     * Dramatic tone for checkmate
     */
    function playCheckmateSound() {
        const now = audioCtx.currentTime;
        
        // Descending dramatic tones
        const frequencies = [523, 440, 349, 262];
        const durations = [0.15, 0.15, 0.2, 0.35];
        let offset = 0;
        
        frequencies.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0, now + offset);
            gain.gain.linearRampToValueAtTime(0.25, now + offset + 0.02);
            gain.gain.setValueAtTime(0.25, now + offset + durations[i] - 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + durations[i]);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start(now + offset);
            osc.stop(now + offset + durations[i]);
            
            offset += durations[i] - 0.03;
        });
    }

    /**
     * Castle sound (move + extra click)
     */
    function playCastleSound() {
        playMoveSound();
        setTimeout(() => playMoveSound(), 80);
    }

    // ==================== BOARD RENDERING ====================

    /**
     * Create the chess board DOM (called once)
     */
    function createBoard() {
        elements.board.innerHTML = '';
        elements.squares = [];

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                const isLight = (row + col) % 2 === 0;

                square.className = `square ${isLight ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;

                // Click handler
                square.addEventListener('click', () => handleSquareClick(row, col));

                elements.board.appendChild(square);
                elements.squares.push(square);
            }
        }
    }

    /**
     * Get square element by row and col
     */
    function getSquareEl(row, col) {
        return elements.squares[row * 8 + col];
    }

    /**
     * Render all pieces on the board
     */
    function renderPieces() {
        // Clear existing pieces
        elements.pieces.forEach(pieceEl => pieceEl.remove());
        elements.pieces.clear();

        // Create piece elements
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = state.board[row][col];
                if (piece) {
                    createPieceElement(row, col, piece);
                }
            }
        }

        updateSquareStates();
    }

    /**
     * Create a piece DOM element
     */
    function createPieceElement(row, col, piece) {
        const pieceEl = document.createElement('div');
        const color = piece[0] === 'w' ? 'white' : 'black';
        const type = piece[1];

        pieceEl.className = `piece ${color}`;
        pieceEl.textContent = PIECES[type][color];
        pieceEl.dataset.row = row;
        pieceEl.dataset.col = col;

        const square = getSquareEl(row, col);
        square.appendChild(pieceEl);

        elements.pieces.set(`${row}-${col}`, pieceEl);
        return pieceEl;
    }

    /**
     * Update square visual states (highlights, selectable, etc.)
     */
    function updateSquareStates() {
        elements.squares.forEach(square => {
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            const piece = state.board[row][col];

            // Reset classes
            square.classList.remove('selected', 'legal-move', 'legal-capture', 'last-move', 'check', 'selectable');

            // Last move highlight
            if (state.lastMove) {
                const { from, to } = state.lastMove;
                if ((row === from.row && col === from.col) || (row === to.row && col === to.col)) {
                    square.classList.add('last-move');
                }
            }

            // Selected square
            if (state.selected && state.selected.row === row && state.selected.col === col) {
                square.classList.add('selected');
            }

            // Legal moves
            const isLegalMove = state.legalMoves.some(m => m.row === row && m.col === col);
            if (isLegalMove) {
                square.classList.add(piece ? 'legal-capture' : 'legal-move');
            }

            // King in check
            if (piece && piece[1] === 'K' && piece[0] === state.turn) {
                if (isInCheck(state.board, state.turn)) {
                    square.classList.add('check');
                }
            }

            // Selectable pieces (white pieces on white's turn)
            if (!state.gameOver && !state.isAIThinking && state.turn === 'w' && piece && piece[0] === 'w') {
                square.classList.add('selectable');
            }
        });
    }

    /**
     * Update the status display
     */
    function updateStatus() {
        const currentColor = state.turn === 'w' ? 'White' : 'Black';

        elements.status.classList.remove('check', 'thinking', 'gameover');

        if (state.gameOver) {
            elements.status.classList.add('gameover');
            return;
        }

        if (state.isAIThinking) {
            elements.statusText.textContent = 'Black thinking…';
            elements.status.classList.add('thinking');
            return;
        }

        if (isInCheck(state.board, state.turn)) {
            elements.statusText.textContent = `${currentColor} in Check!`;
            elements.status.classList.add('check');
        } else {
            elements.statusText.textContent = `${currentColor} to move`;
        }
    }

    // ==================== GAME LOGIC ====================

    /**
     * Handle square click
     */
    function handleSquareClick(row, col) {
        resumeAudio();

        // In AI mode, only allow white to move (AI plays black)
        // In human mode, allow the current turn's player to move
        if (state.gameOver || state.isAIThinking) return;
        if (state.gameMode === 'ai' && state.turn !== 'w') return;

        const clickedPiece = state.board[row][col];
        const currentTurn = state.turn;

        // If a piece is selected
        if (state.selected) {
            const move = state.legalMoves.find(m => m.row === row && m.col === col);

            if (move) {
                // Execute move
                executeMove(state.selected.row, state.selected.col, row, col);
                return;
            }

            // Clicking on own piece - select it
            if (clickedPiece && clickedPiece[0] === currentTurn) {
                selectPiece(row, col);
                return;
            }

            // Clicking elsewhere - deselect
            deselectPiece();
            return;
        }

        // No piece selected - try to select
        if (clickedPiece && clickedPiece[0] === currentTurn) {
            selectPiece(row, col);
        }
    }

    /**
     * Select a piece
     */
    function selectPiece(row, col) {
        state.selected = { row, col };
        state.legalMoves = getLegalMoves(state.board, row, col, state.turn, state.castling, state.enPassant);
        updateSquareStates();
    }

    /**
     * Deselect current piece
     */
    function deselectPiece() {
        state.selected = null;
        state.legalMoves = [];
        updateSquareStates();
    }

    /**
     * Execute a move with animation
     */
    function executeMove(fromRow, fromCol, toRow, toCol) {
        const piece = state.board[fromRow][fromCol];
        const captured = state.board[toRow][toCol];
        const pieceType = piece[1];
        const pieceColor = piece[0];
        const pieceEl = elements.pieces.get(`${fromRow}-${fromCol}`);

        // Calculate animation offset
        const deltaRow = toRow - fromRow;
        const deltaCol = toCol - fromCol;

        // Animate piece movement
        if (pieceEl) {
            pieceEl.classList.add('animating');
            pieceEl.style.transform = `translate(${deltaCol * 100}%, ${deltaRow * 100}%)`;
        }

        // Handle captured piece animation
        if (captured) {
            const capturedEl = elements.pieces.get(`${toRow}-${toCol}`);
            if (capturedEl) {
                capturedEl.classList.add('captured');
                setTimeout(() => capturedEl.remove(), 250);
                elements.pieces.delete(`${toRow}-${toCol}`);
            }
            playSound('capture');
        } else {
            playSound('move');
        }

        // After animation completes, update state
        setTimeout(() => {
            finishMove(fromRow, fromCol, toRow, toCol, piece, pieceEl);
        }, 280);
    }

    /**
     * Finish move after animation
     */
    function finishMove(fromRow, fromCol, toRow, toCol, piece, pieceEl) {
        const pieceType = piece[1];
        const pieceColor = piece[0];

        // Handle castling
        if (pieceType === 'K' && Math.abs(toCol - fromCol) === 2) {
            performCastling(fromRow, toCol);
            playSound('castle');
        }

        // Handle en passant capture
        if (pieceType === 'P' && toCol !== fromCol && !state.board[toRow][toCol]) {
            const capturedRow = pieceColor === 'w' ? toRow + 1 : toRow - 1;
            const capturedEl = elements.pieces.get(`${capturedRow}-${toCol}`);
            if (capturedEl) {
                capturedEl.classList.add('captured');
                setTimeout(() => capturedEl.remove(), 250);
                elements.pieces.delete(`${capturedRow}-${toCol}`);
            }
            state.board[capturedRow][toCol] = null;
            playSound('capture');
        }

        // Update board state
        state.board[toRow][toCol] = piece;
        state.board[fromRow][fromCol] = null;

        // Handle pawn promotion (auto-promote to Queen)
        if (pieceType === 'P' && (toRow === 0 || toRow === 7)) {
            state.board[toRow][toCol] = pieceColor + 'Q';
        }

        // Update en passant target
        if (pieceType === 'P' && Math.abs(toRow - fromRow) === 2) {
            state.enPassant = { row: (fromRow + toRow) / 2, col: fromCol };
        } else {
            state.enPassant = null;
        }

        // Update castling rights
        updateCastlingRights(fromRow, fromCol, pieceType, pieceColor);

        // Update piece element position
        if (pieceEl) {
            pieceEl.classList.remove('animating');
            pieceEl.style.transform = '';
            pieceEl.dataset.row = toRow;
            pieceEl.dataset.col = toCol;

            // Move to new square
            elements.pieces.delete(`${fromRow}-${fromCol}`);
            elements.pieces.set(`${toRow}-${toCol}`, pieceEl);

            const newSquare = getSquareEl(toRow, toCol);
            newSquare.appendChild(pieceEl);

            // Update piece display if promoted
            if (pieceType === 'P' && (toRow === 0 || toRow === 7)) {
                const color = pieceColor === 'w' ? 'white' : 'black';
                pieceEl.textContent = PIECES['Q'][color];
            }

            pieceEl.classList.add('arrived');
            setTimeout(() => pieceEl.classList.remove('arrived'), 200);
        }

        // Store last move
        state.lastMove = { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };

        // Clear selection
        state.selected = null;
        state.legalMoves = [];

        // Switch turn
        state.turn = state.turn === 'w' ? 'b' : 'w';

        updateSquareStates();
        updateStatus();

        // Check for game over
        const inCheck = isInCheck(state.board, state.turn);
        if (inCheck) {
            playSound('check');
        }

        if (checkGameOver()) return;

        // AI move (only in AI mode)
        if (state.gameMode === 'ai' && state.turn === 'b' && !state.gameOver) {
            state.isAIThinking = true;
            updateStatus();

            setTimeout(() => {
                makeAIMove();
            }, 400 + Math.random() * 200);
        }
    }

    /**
     * Perform castling move (rook movement)
     */
    function performCastling(row, kingToCol) {
        let rookFromCol, rookToCol;

        if (kingToCol === 6) {
            // Kingside
            rookFromCol = 7;
            rookToCol = 5;
        } else {
            // Queenside
            rookFromCol = 0;
            rookToCol = 3;
        }

        const rook = state.board[row][rookFromCol];
        const rookEl = elements.pieces.get(`${row}-${rookFromCol}`);

        // Animate rook
        if (rookEl) {
            const deltaCol = rookToCol - rookFromCol;
            rookEl.classList.add('animating');
            rookEl.style.transform = `translateX(${deltaCol * 100}%)`;

            setTimeout(() => {
                rookEl.classList.remove('animating');
                rookEl.style.transform = '';
                rookEl.dataset.col = rookToCol;

                elements.pieces.delete(`${row}-${rookFromCol}`);
                elements.pieces.set(`${row}-${rookToCol}`, rookEl);

                const newSquare = getSquareEl(row, rookToCol);
                newSquare.appendChild(rookEl);
            }, 280);
        }

        // Update board
        state.board[row][rookToCol] = rook;
        state.board[row][rookFromCol] = null;
    }

    /**
     * Update castling rights after a move
     */
    function updateCastlingRights(fromRow, fromCol, pieceType, pieceColor) {
        if (pieceType === 'K') {
            if (pieceColor === 'w') {
                state.castling.wK = false;
                state.castling.wQ = false;
            } else {
                state.castling.bK = false;
                state.castling.bQ = false;
            }
        }

        if (pieceType === 'R') {
            if (fromRow === 7 && fromCol === 0) state.castling.wQ = false;
            if (fromRow === 7 && fromCol === 7) state.castling.wK = false;
            if (fromRow === 0 && fromCol === 0) state.castling.bQ = false;
            if (fromRow === 0 && fromCol === 7) state.castling.bK = false;
        }
    }

    /**
     * Check if game is over
     */
    function checkGameOver() {
        const hasLegalMoves = getAllLegalMoves(state.board, state.turn, state.castling, state.enPassant).length > 0;
        const inCheck = isInCheck(state.board, state.turn);

        if (!hasLegalMoves) {
            state.gameOver = true;

            if (inCheck) {
                // Checkmate
                const winner = state.turn === 'w' ? 'Black' : 'White';
                playSound('checkmate');
                showGameOver(`Checkmate!\n${winner} Wins!`, winner.toLowerCase());
            } else {
                // Stalemate
                showGameOver('Stalemate!\nDraw!', 'draw');
            }
            return true;
        }
        return false;
    }

    /**
     * Show game over overlay
     */
    function showGameOver(message, resultClass) {
        elements.statusText.textContent = message.split('\n')[0];
        elements.status.classList.add('gameover');

        elements.overlayMessage.textContent = message;
        elements.overlayMessage.className = 'overlay-message';

        if (resultClass === 'white') {
            elements.overlayMessage.classList.add('white-wins');
        } else if (resultClass === 'black') {
            elements.overlayMessage.classList.add('black-wins');
        } else {
            elements.overlayMessage.classList.add('draw');
        }

        elements.overlay.classList.add('visible');
    }

    /**
     * Restart the game
     */
    function restartGame() {
        elements.overlay.classList.remove('visible');
        resetState();
        renderPieces();
        updateStatus();
    }

    // ==================== MOVE GENERATION ====================

    /**
     * Get all legal moves for a piece
     */
    function getLegalMoves(board, row, col, turn, castling, enPassant) {
        const piece = board[row][col];
        if (!piece || piece[0] !== turn) return [];

        const pieceType = piece[1];
        const moves = [];

        switch (pieceType) {
            case 'P': addPawnMoves(board, row, col, turn, moves, enPassant); break;
            case 'N': addKnightMoves(board, row, col, turn, moves); break;
            case 'B': addBishopMoves(board, row, col, turn, moves); break;
            case 'R': addRookMoves(board, row, col, turn, moves); break;
            case 'Q': addQueenMoves(board, row, col, turn, moves); break;
            case 'K': addKingMoves(board, row, col, turn, moves, castling); break;
        }

        // Filter out moves that leave king in check
        return moves.filter(move => {
            const testBoard = simulateMove(board, row, col, move.row, move.col, enPassant);
            return !isInCheck(testBoard, turn);
        });
    }

    /**
     * Get all legal moves for a color
     */
    function getAllLegalMoves(board, turn, castling, enPassant) {
        const moves = [];

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece[0] === turn) {
                    const pieceMoves = getLegalMoves(board, row, col, turn, castling, enPassant);
                    pieceMoves.forEach(move => {
                        moves.push({ from: { row, col }, to: move });
                    });
                }
            }
        }

        return moves;
    }

    /**
     * Add pawn moves
     */
    function addPawnMoves(board, row, col, turn, moves, enPassant) {
        const direction = turn === 'w' ? -1 : 1;
        const startRow = turn === 'w' ? 6 : 1;

        // Forward one
        if (isValidSquare(row + direction, col) && !board[row + direction][col]) {
            moves.push({ row: row + direction, col });

            // Forward two from start
            if (row === startRow && !board[row + 2 * direction][col]) {
                moves.push({ row: row + 2 * direction, col });
            }
        }

        // Captures
        [-1, 1].forEach(dc => {
            const newRow = row + direction;
            const newCol = col + dc;

            if (isValidSquare(newRow, newCol)) {
                const target = board[newRow][newCol];

                // Regular capture
                if (target && target[0] !== turn) {
                    moves.push({ row: newRow, col: newCol });
                }

                // En passant
                if (enPassant && enPassant.row === newRow && enPassant.col === newCol) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });
    }

    /**
     * Add knight moves
     */
    function addKnightMoves(board, row, col, turn, moves) {
        const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];

        offsets.forEach(([dr, dc]) => {
            const newRow = row + dr;
            const newCol = col + dc;

            if (isValidSquare(newRow, newCol)) {
                const target = board[newRow][newCol];
                if (!target || target[0] !== turn) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });
    }

    /**
     * Add bishop moves
     */
    function addBishopMoves(board, row, col, turn, moves) {
        addSlidingMoves(board, row, col, turn, moves, [[-1,-1],[-1,1],[1,-1],[1,1]]);
    }

    /**
     * Add rook moves
     */
    function addRookMoves(board, row, col, turn, moves) {
        addSlidingMoves(board, row, col, turn, moves, [[-1,0],[1,0],[0,-1],[0,1]]);
    }

    /**
     * Add queen moves
     */
    function addQueenMoves(board, row, col, turn, moves) {
        addSlidingMoves(board, row, col, turn, moves, [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]);
    }

    /**
     * Add sliding piece moves (bishop, rook, queen)
     */
    function addSlidingMoves(board, row, col, turn, moves, directions) {
        directions.forEach(([dr, dc]) => {
            let newRow = row + dr;
            let newCol = col + dc;

            while (isValidSquare(newRow, newCol)) {
                const target = board[newRow][newCol];

                if (!target) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (target[0] !== turn) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }

                newRow += dr;
                newCol += dc;
            }
        });
    }

    /**
     * Add king moves
     */
    function addKingMoves(board, row, col, turn, moves, castling) {
        const offsets = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

        offsets.forEach(([dr, dc]) => {
            const newRow = row + dr;
            const newCol = col + dc;

            if (isValidSquare(newRow, newCol)) {
                const target = board[newRow][newCol];
                if (!target || target[0] !== turn) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });

        // Castling
        if (!isInCheck(board, turn)) {
            const homeRow = turn === 'w' ? 7 : 0;

            if (row === homeRow && col === 4) {
                // Kingside
                if (castling[turn + 'K'] &&
                    !board[homeRow][5] &&
                    !board[homeRow][6] &&
                    board[homeRow][7] === turn + 'R' &&
                    !isSquareAttacked(board, homeRow, 5, turn) &&
                    !isSquareAttacked(board, homeRow, 6, turn)) {
                    moves.push({ row: homeRow, col: 6 });
                }

                // Queenside
                if (castling[turn + 'Q'] &&
                    !board[homeRow][1] &&
                    !board[homeRow][2] &&
                    !board[homeRow][3] &&
                    board[homeRow][0] === turn + 'R' &&
                    !isSquareAttacked(board, homeRow, 2, turn) &&
                    !isSquareAttacked(board, homeRow, 3, turn)) {
                    moves.push({ row: homeRow, col: 2 });
                }
            }
        }
    }

    /**
     * Check if square is valid
     */
    function isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    /**
     * Simulate a move and return new board state
     */
    function simulateMove(board, fromRow, fromCol, toRow, toCol, enPassant) {
        const newBoard = board.map(r => [...r]);
        const piece = newBoard[fromRow][fromCol];
        const pieceType = piece[1];

        // Handle castling
        if (pieceType === 'K' && Math.abs(toCol - fromCol) === 2) {
            newBoard[toRow][toCol] = piece;
            newBoard[fromRow][fromCol] = null;

            if (toCol > fromCol) {
                newBoard[fromRow][5] = newBoard[fromRow][7];
                newBoard[fromRow][7] = null;
            } else {
                newBoard[fromRow][3] = newBoard[fromRow][0];
                newBoard[fromRow][0] = null;
            }
        } else {
            newBoard[toRow][toCol] = piece;
            newBoard[fromRow][fromCol] = null;
        }

        // Handle en passant
        if (pieceType === 'P' && enPassant &&
            toRow === enPassant.row && toCol === enPassant.col) {
            const captureRow = piece[0] === 'w' ? toRow + 1 : toRow - 1;
            newBoard[captureRow][toCol] = null;
        }

        // Handle promotion
        if (pieceType === 'P' && (toRow === 0 || toRow === 7)) {
            newBoard[toRow][toCol] = piece[0] + 'Q';
        }

        return newBoard;
    }

    /**
     * Check if a square is attacked by opponent
     */
    function isSquareAttacked(board, row, col, byColor) {
        const opponent = byColor === 'w' ? 'b' : 'w';

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece && piece[0] === opponent) {
                    if (canPieceAttack(board, r, c, row, col)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Check if a piece can attack a square
     */
    function canPieceAttack(board, fromRow, fromCol, toRow, toCol) {
        const piece = board[fromRow][fromCol];
        const pieceType = piece[1];
        const pieceColor = piece[0];

        switch (pieceType) {
            case 'P': {
                const direction = pieceColor === 'w' ? -1 : 1;
                return toRow === fromRow + direction && Math.abs(toCol - fromCol) === 1;
            }
            case 'N': {
                const dr = Math.abs(toRow - fromRow);
                const dc = Math.abs(toCol - fromCol);
                return (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
            }
            case 'B':
                return canSlidingPieceAttack(board, fromRow, fromCol, toRow, toCol, [[-1,-1],[-1,1],[1,-1],[1,1]]);
            case 'R':
                return canSlidingPieceAttack(board, fromRow, fromCol, toRow, toCol, [[-1,0],[1,0],[0,-1],[0,1]]);
            case 'Q':
                return canSlidingPieceAttack(board, fromRow, fromCol, toRow, toCol, [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]);
            case 'K': {
                const dr = Math.abs(toRow - fromRow);
                const dc = Math.abs(toCol - fromCol);
                return dr <= 1 && dc <= 1 && (dr + dc > 0);
            }
        }

        return false;
    }

    /**
     * Check if sliding piece can attack a square
     */
    function canSlidingPieceAttack(board, fromRow, fromCol, toRow, toCol, directions) {
        for (const [dr, dc] of directions) {
            let r = fromRow + dr;
            let c = fromCol + dc;

            while (isValidSquare(r, c)) {
                if (r === toRow && c === toCol) return true;
                if (board[r][c]) break;
                r += dr;
                c += dc;
            }
        }

        return false;
    }

    /**
     * Check if a color is in check
     */
    function isInCheck(board, color) {
        // Find king
        let kingRow, kingCol;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece === color + 'K') {
                    kingRow = row;
                    kingCol = col;
                    break;
                }
            }
        }

        return isSquareAttacked(board, kingRow, kingCol, color);
    }

    // ==================== AI ENGINE ====================

    /**
     * Make AI move
     */
    function makeAIMove() {
        const bestMove = findBestMove();

        if (bestMove) {
            // Execute AI move with animation
            const { from, to } = bestMove;
            state.selected = from;
            executeMove(from.row, from.col, to.row, to.col);
        }

        state.isAIThinking = false;
    }

    /**
     * Find the best move using minimax
     */
    function findBestMove() {
        const moves = getAllLegalMoves(state.board, 'b', state.castling, state.enPassant);

        if (moves.length === 0) return null;

        let bestScore = -Infinity;
        let bestMoves = [];

        for (const move of moves) {
            const newBoard = simulateMove(state.board, move.from.row, move.from.col, move.to.row, move.to.col, state.enPassant);
            const newEnPassant = getNewEnPassant(state.board, move);
            const newCastling = getNewCastling(state.board, move, state.castling);

            const score = minimax(newBoard, 2, -Infinity, Infinity, false, newCastling, newEnPassant);

            if (score > bestScore) {
                bestScore = score;
                bestMoves = [move];
            } else if (score === bestScore) {
                bestMoves.push(move);
            }
        }

        // Pick randomly from best moves for variety
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    /**
     * Minimax with alpha-beta pruning
     */
    function minimax(board, depth, alpha, beta, isMaximizing, castling, enPassant) {
        const currentTurn = isMaximizing ? 'b' : 'w';
        const moves = getAllLegalMoves(board, currentTurn, castling, enPassant);

        // Terminal conditions
        if (moves.length === 0) {
            if (isInCheck(board, currentTurn)) {
                return isMaximizing ? -10000 + (3 - depth) : 10000 - (3 - depth);
            }
            return 0; // Stalemate
        }

        if (depth === 0) {
            return evaluateBoard(board);
        }

        if (isMaximizing) {
            let maxScore = -Infinity;

            for (const move of moves) {
                const newBoard = simulateMove(board, move.from.row, move.from.col, move.to.row, move.to.col, enPassant);
                const newEnPassant = getNewEnPassant(board, move);
                const newCastling = getNewCastling(board, move, castling);

                const score = minimax(newBoard, depth - 1, alpha, beta, false, newCastling, newEnPassant);
                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);

                if (beta <= alpha) break;
            }

            return maxScore;
        } else {
            let minScore = Infinity;

            for (const move of moves) {
                const newBoard = simulateMove(board, move.from.row, move.from.col, move.to.row, move.to.col, enPassant);
                const newEnPassant = getNewEnPassant(board, move);
                const newCastling = getNewCastling(board, move, castling);

                const score = minimax(newBoard, depth - 1, alpha, beta, true, newCastling, newEnPassant);
                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);

                if (beta <= alpha) break;
            }

            return minScore;
        }
    }

    /**
     * Get new en passant target after a move
     */
    function getNewEnPassant(board, move) {
        const piece = board[move.from.row][move.from.col];
        if (piece && piece[1] === 'P' && Math.abs(move.to.row - move.from.row) === 2) {
            return { row: (move.from.row + move.to.row) / 2, col: move.from.col };
        }
        return null;
    }

    /**
     * Get new castling rights after a move
     */
    function getNewCastling(board, move, castling) {
        const newCastling = { ...castling };
        const piece = board[move.from.row][move.from.col];

        if (!piece) return newCastling;

        const pieceType = piece[1];
        const pieceColor = piece[0];

        if (pieceType === 'K') {
            if (pieceColor === 'w') {
                newCastling.wK = false;
                newCastling.wQ = false;
            } else {
                newCastling.bK = false;
                newCastling.bQ = false;
            }
        }

        if (pieceType === 'R') {
            if (move.from.row === 7 && move.from.col === 0) newCastling.wQ = false;
            if (move.from.row === 7 && move.from.col === 7) newCastling.wK = false;
            if (move.from.row === 0 && move.from.col === 0) newCastling.bQ = false;
            if (move.from.row === 0 && move.from.col === 7) newCastling.bK = false;
        }

        return newCastling;
    }

    /**
     * Evaluate board position (positive = good for black)
     */
    function evaluateBoard(board) {
        let score = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    const pieceType = piece[1];
                    const pieceColor = piece[0];
                    const value = PIECES[pieceType].value;

                    // Material value
                    let pieceScore = value;

                    // Position value
                    if (POSITION_VALUES[pieceType]) {
                        const posRow = pieceColor === 'w' ? row : 7 - row;
                        pieceScore += POSITION_VALUES[pieceType][posRow][col];
                    }

                    score += pieceColor === 'b' ? pieceScore : -pieceScore;
                }
            }
        }

        return score;
    }

    // ==================== INITIALIZE ====================

    // Load voices for speech synthesis
    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }

    // Start game when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
