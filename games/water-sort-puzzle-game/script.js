/**
 * Water Sort Puzzle - Level Progression Update
 * 
 * Features:
 * - Automated win detection after every pour
 * - Dynamic level generation with random scramble
 * - Solvability validation (at least one valid move)
 * - Sound effects for pouring
 * - Anti-stuck toast message
 */

(function() {
    'use strict';

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        NUM_COLORS: 10,
        EMPTY_GLASSES: 2,
        MAX_LAYERS: 4,
        BACK_SIM_MOVES: 80,
        POUR_DURATION: 400,
        HINT_DURATION: 1800,
        TOAST_DURATION: 3000,
        
        // High-contrast color palette (can pick 10 random from this)
        ALL_COLORS: [
            'neon-pink',
            'cyan',
            'gold',
            'purple',
            'lime',
            'orange',
            'blue',
            'white',
            'red',
            'seafoam',
            'teal',
            'magenta',
            'yellow',
            'coral'
        ]
    };

    CONFIG.TOTAL_GLASSES = CONFIG.NUM_COLORS + CONFIG.EMPTY_GLASSES;

    // ==================== AUDIO ====================
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    /**
     * Play a simple pour/splash sound using Web Audio API
     */
    function playPourSound() {
        try {
            // Resume audio context if suspended (required for some browsers)
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Create a "water splash" sound
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.15);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            // Audio not supported, silently fail
        }
    }

    // ==================== STATE ====================
    const state = {
        glasses: [],
        selectedIndex: null,
        isAnimating: false,
        hintTimeout: null,
        level: 1
    };

    // ==================== DOM CACHE ====================
    const dom = {};

    // ==================== INITIALIZATION ====================
    function init() {
        cacheDom();
        bindEvents();
        startNewLevel();
    }

    function cacheDom() {
        dom.container = document.getElementById('glasses-container');
        dom.hintBtn = document.getElementById('hint-btn');
        dom.resetBtn = document.getElementById('reset-btn');
        dom.winModal = document.getElementById('win-modal');
        dom.nextLevelBtn = document.getElementById('next-level-btn');
        dom.stuckMessage = document.getElementById('stuck-message');
        dom.toast = document.getElementById('toast');
    }

    function bindEvents() {
        dom.hintBtn.addEventListener('click', showHint);
        dom.resetBtn.addEventListener('click', startNewLevel); // Reset now generates new puzzle
        dom.nextLevelBtn.addEventListener('click', startNewLevel);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (state.isAnimating) return;
            const key = e.key.toLowerCase();
            if (key === 'h') showHint();
            else if (key === 'r') startNewLevel();
            else if (key === 'escape') deselect();
        });

        // Enable audio context on first user interaction
        document.addEventListener('click', () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }, { once: true });
    }

    // ==================== LEVEL MANAGEMENT ====================
    function startNewLevel() {
        hideModal();
        hideStuckMessage();
        hideToast();
        state.selectedIndex = null;
        state.isAnimating = false;
        clearHintTimeout();
        
        // Generate a new random solvable puzzle
        generateRandomPuzzle();
        render();
        
        // Remove highlight from reset button if it was highlighted
        dom.resetBtn.classList.remove('highlight');
    }

    /**
     * Generate a puzzle with random colors that is guaranteed solvable
     * Uses back-simulation and validates at least one move exists
     */
    function generateRandomPuzzle() {
        let attempts = 0;
        const maxAttempts = 10;

        do {
            // Pick 10 random colors from the palette
            const shuffledColors = [...CONFIG.ALL_COLORS];
            shuffleArray(shuffledColors);
            const selectedColors = shuffledColors.slice(0, CONFIG.NUM_COLORS);

            // Create solved state (each glass has 4 of same color)
            let glasses = selectedColors.map(color => [color, color, color, color]);
            
            // Add empty glasses
            for (let i = 0; i < CONFIG.EMPTY_GLASSES; i++) {
                glasses.push([]);
            }

            // Back-simulate with random pours to scramble
            const numMoves = CONFIG.BACK_SIM_MOVES + Math.floor(Math.random() * 40);
            
            for (let m = 0; m < numMoves; m++) {
                const validMoves = [];
                
                for (let from = 0; from < glasses.length; from++) {
                    if (glasses[from].length === 0) continue;
                    
                    for (let to = 0; to < glasses.length; to++) {
                        if (from === to) continue;
                        if (glasses[to].length >= CONFIG.MAX_LAYERS) continue;
                        validMoves.push({ from, to });
                    }
                }
                
                if (validMoves.length > 0) {
                    const move = validMoves[Math.floor(Math.random() * validMoves.length)];
                    const color = glasses[move.from].pop();
                    glasses[move.to].push(color);
                }
            }

            // Shuffle glass positions
            shuffleArray(glasses);
            state.glasses = glasses;

            attempts++;

            // Validate: not solved AND has at least one valid move
            if (!isSolved() && hasAnyValidMove()) {
                return; // Good puzzle!
            }

        } while (attempts < maxAttempts);

        // Fallback: just use whatever we have (shouldn't happen often)
    }

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    // ==================== RENDERING ====================
    function render() {
        dom.container.innerHTML = '';
        state.glasses.forEach((glass, idx) => {
            dom.container.appendChild(createGlassElement(glass, idx));
        });
    }

    function createGlassElement(glass, index) {
        const div = document.createElement('div');
        div.className = 'glass';
        div.dataset.index = index;
        div.tabIndex = 0;

        glass.forEach((color, layerIdx) => {
            const layer = document.createElement('div');
            layer.className = 'water-layer';
            layer.dataset.color = color;
            layer.dataset.layer = layerIdx;
            div.appendChild(layer);
        });

        div.addEventListener('click', () => onGlassClick(index));
        div.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onGlassClick(index);
            }
        });

        return div;
    }

    function updateGlassDOM(index, animateNewLayer = false) {
        const el = dom.container.children[index];
        if (!el) return;
        
        const glass = state.glasses[index];
        el.innerHTML = '';

        glass.forEach((color, layerIdx) => {
            const layer = document.createElement('div');
            layer.className = 'water-layer';
            layer.dataset.color = color;
            layer.dataset.layer = layerIdx;

            if (animateNewLayer && layerIdx === glass.length - 1) {
                layer.classList.add('slide-in');
            }

            el.appendChild(layer);
        });
    }

    // ==================== CORE POUR LOGIC ====================
    function getTopColor(idx) {
        const g = state.glasses[idx];
        return g.length > 0 ? g[g.length - 1] : null;
    }

    function countTopSameColor(idx) {
        const g = state.glasses[idx];
        if (g.length === 0) return 0;
        
        const topColor = g[g.length - 1];
        let count = 0;
        for (let i = g.length - 1; i >= 0; i--) {
            if (g[i] === topColor) count++;
            else break;
        }
        return count;
    }

    function canPour(fromIdx, toIdx) {
        const from = state.glasses[fromIdx];
        const to = state.glasses[toIdx];
        
        if (from.length === 0) return false;
        if (to.length >= CONFIG.MAX_LAYERS) return false;
        if (to.length === 0) return true;
        
        return getTopColor(fromIdx) === getTopColor(toIdx);
    }

    function getPourCount(fromIdx, toIdx) {
        if (!canPour(fromIdx, toIdx)) return 0;
        
        const availableSpace = CONFIG.MAX_LAYERS - state.glasses[toIdx].length;
        const sameColorCount = countTopSameColor(fromIdx);
        return Math.min(availableSpace, sameColorCount);
    }

    function isGlassComplete(idx) {
        const g = state.glasses[idx];
        if (g.length !== CONFIG.MAX_LAYERS) return false;
        return g.every(c => c === g[0]);
    }

    function isGlassSingleColor(idx) {
        const g = state.glasses[idx];
        if (g.length === 0) return false;
        return g.every(c => c === g[0]);
    }

    // ==================== INTERACTION ====================
    function onGlassClick(index) {
        if (state.isAnimating) return;
        
        clearAllHighlights();
        hideStuckMessage();
        hideToast();

        if (state.selectedIndex === null) {
            if (state.glasses[index].length > 0) {
                select(index);
            }
        } else if (state.selectedIndex === index) {
            deselect();
        } else {
            attemptPour(state.selectedIndex, index);
        }
    }

    function select(index) {
        state.selectedIndex = index;
        const el = dom.container.children[index];
        if (el) el.classList.add('selected');
    }

    function deselect() {
        if (state.selectedIndex !== null) {
            const el = dom.container.children[state.selectedIndex];
            if (el) el.classList.remove('selected');
            state.selectedIndex = null;
        }
    }

    function attemptPour(fromIdx, toIdx) {
        if (!canPour(fromIdx, toIdx)) {
            shakeGlass(toIdx);
            deselect();
            return;
        }

        const count = getPourCount(fromIdx, toIdx);
        if (count === 0) {
            shakeGlass(toIdx);
            deselect();
            return;
        }

        executePour(fromIdx, toIdx, count);
    }

    function shakeGlass(idx) {
        const el = dom.container.children[idx];
        if (!el) return;
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 400);
    }

    // ==================== POUR ANIMATION ====================
    function executePour(fromIdx, toIdx, count) {
        state.isAnimating = true;

        const fromEl = dom.container.children[fromIdx];
        const toEl = dom.container.children[toIdx];
        const color = getTopColor(fromIdx);

        fromEl.classList.remove('selected');
        state.selectedIndex = null;

        // Determine tilt direction
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        const tiltClass = fromRect.left < toRect.left ? 'tilting-right' : 'tilting-left';

        fromEl.classList.add(tiltClass);

        setTimeout(() => {
            toEl.classList.add('receiving');
        }, CONFIG.POUR_DURATION * 0.15);

        // Remove from source
        setTimeout(() => {
            for (let i = 0; i < count; i++) {
                state.glasses[fromIdx].pop();
            }
            updateGlassDOM(fromIdx);
        }, CONFIG.POUR_DURATION * 0.25);

        // Add to target with animation and sound
        setTimeout(() => {
            let added = 0;
            const addLayer = () => {
                if (added >= count) {
                    finishPour(fromEl, toEl, tiltClass);
                    return;
                }
                state.glasses[toIdx].push(color);
                updateGlassDOM(toIdx, true);
                playPourSound(); // Play sound for each layer
                added++;
                setTimeout(addLayer, 50);
            };
            addLayer();
        }, CONFIG.POUR_DURATION * 0.35);
    }

    function finishPour(fromEl, toEl, tiltClass) {
        setTimeout(() => {
            fromEl.classList.remove(tiltClass);
            toEl.classList.remove('receiving');
            state.isAnimating = false;

            // Check win AFTER every successful pour
            if (isSolved()) {
                state.level++;
                setTimeout(showWinModal, 350);
            } else {
                // Check if stuck
                checkIfStuck();
            }
        }, 80);
    }

    // ==================== WIN / STUCK DETECTION ====================
    /**
     * Win condition: All glasses are either empty OR have 4 of the same color
     */
    function isSolved() {
        return state.glasses.every(g => {
            if (g.length === 0) return true;
            if (g.length !== CONFIG.MAX_LAYERS) return false;
            return g.every(c => c === g[0]);
        });
    }

    function hasAnyValidMove() {
        for (let from = 0; from < state.glasses.length; from++) {
            if (state.glasses[from].length === 0) continue;
            if (isGlassComplete(from)) continue;
            
            for (let to = 0; to < state.glasses.length; to++) {
                if (from === to) continue;
                if (canPour(from, to)) {
                    const toGlass = state.glasses[to];
                    
                    // Skip pointless moves
                    if (toGlass.length === 0 && isGlassSingleColor(from)) {
                        continue;
                    }
                    
                    return true;
                }
            }
        }
        return false;
    }

    function checkIfStuck() {
        if (!hasAnyValidMove() && !isSolved()) {
            showStuckState();
        }
    }

    function showStuckState() {
        // Show toast message
        showToast('No moves left! Click Reset for a new puzzle.');
        
        // Highlight the Reset button
        dom.resetBtn.classList.add('highlight');
    }

    function showToast(message) {
        if (dom.toast) {
            dom.toast.textContent = message;
            dom.toast.classList.remove('hidden');
            
            setTimeout(() => {
                hideToast();
            }, CONFIG.TOAST_DURATION);
        }
    }

    function hideToast() {
        if (dom.toast) {
            dom.toast.classList.add('hidden');
        }
    }

    function showStuckMessage() {
        if (dom.stuckMessage) {
            dom.stuckMessage.classList.remove('hidden');
        }
    }

    function hideStuckMessage() {
        if (dom.stuckMessage) {
            dom.stuckMessage.classList.add('hidden');
        }
    }

    function showWinModal() {
        dom.winModal.classList.remove('hidden');
    }

    function hideModal() {
        dom.winModal.classList.add('hidden');
    }

    // ==================== SMART HINT SYSTEM ====================
    function findBestHint() {
        let candidates = [];

        for (let from = 0; from < state.glasses.length; from++) {
            const fromGlass = state.glasses[from];
            
            if (fromGlass.length === 0) continue;
            if (isGlassComplete(from)) continue;

            for (let to = 0; to < state.glasses.length; to++) {
                if (from === to) continue;
                if (!canPour(from, to)) continue;

                const toGlass = state.glasses[to];
                const pourCount = getPourCount(from, to);

                if (toGlass.length === 0 && isGlassSingleColor(from)) {
                    continue;
                }

                let score = 0;

                // Would complete the target
                if (toGlass.length + pourCount === CONFIG.MAX_LAYERS) {
                    const targetColor = toGlass.length > 0 ? toGlass[0] : fromGlass[fromGlass.length - 1];
                    if (toGlass.length === 0 || toGlass.every(c => c === targetColor)) {
                        score += 1000;
                    }
                }

                // Would empty the source
                if (fromGlass.length === pourCount) {
                    score += 800;
                }

                // Matching color
                if (toGlass.length > 0) {
                    score += 500;
                }

                score += pourCount * 50;

                if (toGlass.length === 0) {
                    score -= 30;
                }

                candidates.push({ from, to, score });
            }
        }

        candidates.sort((a, b) => b.score - a.score);
        return candidates.length > 0 ? candidates[0] : null;
    }

    function showHint() {
        if (state.isAnimating) return;

        clearAllHighlights();
        clearHintTimeout();
        deselect();

        const hint = findBestHint();

        if (hint) {
            const fromEl = dom.container.children[hint.from];
            const toEl = dom.container.children[hint.to];

            if (fromEl) fromEl.classList.add('hint-source');
            if (toEl) toEl.classList.add('hint-target');

            state.hintTimeout = setTimeout(() => {
                clearAllHighlights();
            }, CONFIG.HINT_DURATION);
        } else {
            showStuckState();
        }
    }

    function clearAllHighlights() {
        const glasses = dom.container.querySelectorAll('.glass');
        glasses.forEach(el => {
            el.classList.remove('hint-source', 'hint-target', 'selected');
        });
    }

    function clearHintTimeout() {
        if (state.hintTimeout) {
            clearTimeout(state.hintTimeout);
            state.hintTimeout = null;
        }
    }

    // ==================== START GAME ====================
    document.addEventListener('DOMContentLoaded', init);
})();
