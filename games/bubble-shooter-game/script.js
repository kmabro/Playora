/**
 * Bubble Shooter Game
 * Vanilla JavaScript Implementation
 */

(() => {
    'use strict';

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        BUBBLE_COLORS: ['#e94560', '#4ade80', '#3b82f6', '#f59e0b', '#a855f7', '#06b6d4'],
        ROWS: 8,
        COLS: 12,
        BUBBLE_SPEED: 15,
        SHOTS_PER_DESCENT: 4, // rows descend after this many shots
        MIN_MATCH: 3,
        POINTS_PER_BUBBLE: 10,
        MIN_CLUSTER_SIZE: 2,
        MAX_CLUSTER_SIZE: 5,
        MIN_ROWS_THRESHOLD: 4 // minimum rows before adding more
    };

    // ==================== GAME STATE ====================
    const state = {
        canvas: null,
        ctx: null,
        bubbleRadius: 0,
        gridOffsetX: 0,
        gridOffsetY: 0,
        bubbles: [],
        shooterBubble: null,
        nextBubble: null,
        shootingBubble: null,
        score: 0,
        highScore: 0,
        shotsFired: 0,
        isGameOver: false,
        isPaused: false,
        isAiming: false,
        isShooting: false,
        aimAngle: -Math.PI / 2,
        aimStart: { x: 0, y: 0 },
        shooterPos: { x: 0, y: 0 },
        animationId: null,
        poppingBubbles: [],
        fallingBubbles: [],
        swapArrowPhase: 0,
        lastPointerY: 0,
        showAimLine: true // for shot cancellation visual
    };

    // ==================== UTILITY FUNCTIONS ====================
    const utils = {
        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },

        distance(x1, y1, x2, y2) {
            return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        },

        getRandomColor() {
            // Get colors that exist on the board, or random if board is empty
            const existingColors = new Set();
            state.bubbles.forEach(row => {
                row.forEach(bubble => {
                    if (bubble) existingColors.add(bubble.color);
                });
            });
            
            const colorArray = existingColors.size > 0 
                ? Array.from(existingColors) 
                : CONFIG.BUBBLE_COLORS;
            
            return colorArray[Math.floor(Math.random() * colorArray.length)];
        },

        getGridPosition(row, col) {
            const offset = row % 2 === 1 ? state.bubbleRadius : 0;
            const x = state.gridOffsetX + col * (state.bubbleRadius * 2) + state.bubbleRadius + offset;
            const y = state.gridOffsetY + row * (state.bubbleRadius * 1.73) + state.bubbleRadius;
            return { x, y };
        },

        getGridFromPosition(x, y) {
            const row = Math.round((y - state.bubbleRadius - state.gridOffsetY) / (state.bubbleRadius * 1.73));
            const offset = row % 2 === 1 ? state.bubbleRadius : 0;
            const col = Math.round((x - state.bubbleRadius - state.gridOffsetX - offset) / (state.bubbleRadius * 2));
            return { row, col };
        }
    };

    // ==================== CANVAS SETUP ====================
    function setupCanvas() {
        const container = document.getElementById('game-area');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Calculate optimal canvas size maintaining aspect ratio
        const aspectRatio = 3 / 4;
        let canvasWidth, canvasHeight;
        
        if (containerWidth / containerHeight > aspectRatio) {
            canvasHeight = containerHeight;
            canvasWidth = containerHeight * aspectRatio;
        } else {
            canvasWidth = containerWidth;
            canvasHeight = containerWidth / aspectRatio;
        }
        
        state.canvas.width = canvasWidth;
        state.canvas.height = canvasHeight;
        
        // Calculate bubble size based on canvas width and columns
        state.bubbleRadius = (canvasWidth / (CONFIG.COLS + 0.5)) / 2;
        state.gridOffsetX = 0;
        state.gridOffsetY = state.bubbleRadius;
        
        // Set shooter position
        state.shooterPos = {
            x: canvasWidth / 2,
            y: canvasHeight - state.bubbleRadius * 2.5
        };
    }

    // ==================== BUBBLE CLASS ====================
    class Bubble {
        constructor(x, y, color, row = -1, col = -1) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.row = row;
            this.col = col;
            this.vx = 0;
            this.vy = 0;
            this.isPopping = false;
            this.popProgress = 0;
            this.isFalling = false;
            this.fallSpeed = 0;
        }

        draw(ctx) {
            const radius = state.bubbleRadius;
            
            if (this.isPopping) {
                const scale = 1 + this.popProgress * 0.3;
                const alpha = 1 - this.popProgress;
                ctx.globalAlpha = alpha;
                this.drawBubble(ctx, radius * scale);
                ctx.globalAlpha = 1;
            } else {
                this.drawBubble(ctx, radius);
            }
        }

        drawBubble(ctx, radius) {
            // Main bubble
            const gradient = ctx.createRadialGradient(
                this.x - radius * 0.3,
                this.y - radius * 0.3,
                radius * 0.1,
                this.x,
                this.y,
                radius
            );
            
            const rgb = utils.hexToRgb(this.color);
            gradient.addColorStop(0, `rgba(255, 255, 255, 0.9)`);
            gradient.addColorStop(0.3, this.color);
            gradient.addColorStop(1, `rgba(${rgb.r * 0.6}, ${rgb.g * 0.6}, ${rgb.b * 0.6}, 1)`);
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius * 0.9, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Highlight
            ctx.beginPath();
            ctx.arc(this.x - radius * 0.25, this.y - radius * 0.25, radius * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fill();
        }

        update() {
            if (this.isPopping) {
                this.popProgress += 0.1;
                return this.popProgress < 1;
            }
            
            if (this.isFalling) {
                this.fallSpeed += 0.5;
                this.y += this.fallSpeed;
                return this.y < state.canvas.height + state.bubbleRadius;
            }
            
            return true;
        }
    }

    // ==================== GAME INITIALIZATION ====================
    function initGame() {
        state.canvas = document.getElementById('game-canvas');
        state.ctx = state.canvas.getContext('2d');
        
        setupCanvas();
        initBubbleGrid();
        createShooterBubble();
        
        // Reset ALL game states
        state.score = 0;
        state.highScore = loadHighScore();
        state.shotsFired = 0;
        state.isGameOver = false;
        state.isPaused = false;
        state.isAiming = false;
        state.isShooting = false;
        state.showAimLine = true;
        state.shootingBubble = null;
        state.poppingBubbles = [];
        state.fallingBubbles = [];
        state.aimAngle = -Math.PI / 2;
        state.lastPointerY = 0;
        state.swapArrowPhase = 0;
        
        updateScoreDisplay();
        hideGameOver();
        
        document.getElementById('game-container').classList.add('game-ready');
    }

    function initBubbleGrid() {
        state.bubbles = [];
        
        // Create a color map for clustered generation
        const colorMap = [];
        
        for (let row = 0; row < CONFIG.ROWS; row++) {
            const cols = row % 2 === 0 ? CONFIG.COLS : CONFIG.COLS - 1;
            colorMap.push(new Array(cols).fill(null));
        }
        
        // Generate clusters
        for (let row = 0; row < CONFIG.ROWS; row++) {
            const cols = row % 2 === 0 ? CONFIG.COLS : CONFIG.COLS - 1;
            
            for (let col = 0; col < cols; col++) {
                if (colorMap[row][col] === null) {
                    // Start a new cluster
                    const color = CONFIG.BUBBLE_COLORS[Math.floor(Math.random() * CONFIG.BUBBLE_COLORS.length)];
                    const clusterSize = CONFIG.MIN_CLUSTER_SIZE + 
                        Math.floor(Math.random() * (CONFIG.MAX_CLUSTER_SIZE - CONFIG.MIN_CLUSTER_SIZE + 1));
                    
                    spreadCluster(colorMap, row, col, color, clusterSize);
                }
            }
        }
        
        // Create bubbles from color map
        for (let row = 0; row < CONFIG.ROWS; row++) {
            const bubbleRow = [];
            const cols = row % 2 === 0 ? CONFIG.COLS : CONFIG.COLS - 1;
            
            for (let col = 0; col < cols; col++) {
                const pos = utils.getGridPosition(row, col);
                const color = colorMap[row][col] || CONFIG.BUBBLE_COLORS[Math.floor(Math.random() * CONFIG.BUBBLE_COLORS.length)];
                bubbleRow.push(new Bubble(pos.x, pos.y, color, row, col));
            }
            
            state.bubbles.push(bubbleRow);
        }
    }
    
    function spreadCluster(colorMap, startRow, startCol, color, size) {
        const queue = [{ row: startRow, col: startCol }];
        let placed = 0;
        const visited = new Set();
        
        while (queue.length > 0 && placed < size) {
            const { row, col } = queue.shift();
            const key = `${row},${col}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            const cols = row % 2 === 0 ? CONFIG.COLS : CONFIG.COLS - 1;
            
            if (row < 0 || row >= CONFIG.ROWS || col < 0 || col >= cols) continue;
            if (colorMap[row][col] !== null) continue;
            
            colorMap[row][col] = color;
            placed++;
            
            // Add neighbors in random order
            const neighbors = getNeighborPositions(row, col);
            shuffleArray(neighbors);
            
            for (const neighbor of neighbors) {
                if (!visited.has(`${neighbor.row},${neighbor.col}`)) {
                    queue.push(neighbor);
                }
            }
        }
    }
    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    function generateClusteredRow(rowIndex) {
        const cols = rowIndex % 2 === 0 ? CONFIG.COLS : CONFIG.COLS - 1;
        const row = [];
        
        let col = 0;
        while (col < cols) {
            const color = CONFIG.BUBBLE_COLORS[Math.floor(Math.random() * CONFIG.BUBBLE_COLORS.length)];
            const clusterSize = CONFIG.MIN_CLUSTER_SIZE + 
                Math.floor(Math.random() * (CONFIG.MAX_CLUSTER_SIZE - CONFIG.MIN_CLUSTER_SIZE + 1));
            
            for (let i = 0; i < clusterSize && col < cols; i++, col++) {
                const pos = utils.getGridPosition(0, col);
                row.push(new Bubble(pos.x, pos.y, color, 0, col));
            }
        }
        
        return row;
    }

    function createShooterBubble() {
        state.shooterBubble = new Bubble(
            state.shooterPos.x,
            state.shooterPos.y,
            utils.getRandomColor()
        );
        
        state.nextBubble = new Bubble(
            state.shooterPos.x - state.bubbleRadius * 3,
            state.shooterPos.y,
            utils.getRandomColor()
        );
    }

    // ==================== INPUT HANDLING ====================
    function setupInputHandlers() {
        const canvas = state.canvas;
        
        // Mouse events
        canvas.addEventListener('mousedown', handlePointerStart);
        canvas.addEventListener('mousemove', handlePointerMove);
        canvas.addEventListener('mouseup', handlePointerEnd);
        canvas.addEventListener('mouseleave', handlePointerEnd);
        
        // Touch events
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
        
        // Buttons
        document.getElementById('restart-btn').addEventListener('click', restartGame);
        document.getElementById('new-game-btn').addEventListener('click', restartGame);
        document.getElementById('pause-btn').addEventListener('click', togglePause);
        document.getElementById('resume-btn').addEventListener('click', togglePause);
        
        // Resize handler
        window.addEventListener('resize', handleResize);
    }
    
    function togglePause() {
        if (state.isGameOver) return;
        
        state.isPaused = !state.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        const pausedOverlay = document.getElementById('paused-overlay');
        
        if (state.isPaused) {
            // Cancel any aiming when pausing
            state.isAiming = false;
            pauseBtn.textContent = '▶';
            pauseBtn.title = 'Resume Game';
            pausedOverlay.classList.remove('hidden');
        } else {
            pauseBtn.textContent = '⏸';
            pauseBtn.title = 'Pause Game';
            pausedOverlay.classList.add('hidden');
        }
    }
    
    function exchangeBubbles() {
        if (state.isShooting || state.isGameOver || !state.shooterBubble || !state.nextBubble) return;
        
        // Swap colors
        const tempColor = state.shooterBubble.color;
        state.shooterBubble.color = state.nextBubble.color;
        state.nextBubble.color = tempColor;
    }
    
    function isClickOnNextBubble(coords) {
        if (!state.nextBubble) return false;
        const dist = utils.distance(coords.x, coords.y, state.nextBubble.x, state.nextBubble.y);
        return dist <= state.bubbleRadius * 1.5;
    }

    function getCanvasCoordinates(clientX, clientY) {
        const rect = state.canvas.getBoundingClientRect();
        const scaleX = state.canvas.width / rect.width;
        const scaleY = state.canvas.height / rect.height;
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function handlePointerStart(e) {
        if (state.isGameOver || state.isShooting || state.isPaused) return;
        
        const coords = getCanvasCoordinates(e.clientX, e.clientY);
        
        // Check if clicking on next bubble to swap
        if (isClickOnNextBubble(coords)) {
            exchangeBubbles();
            return;
        }
        
        state.isAiming = true;
        state.showAimLine = true;
        state.aimStart = coords;
        state.lastPointerY = coords.y;
        updateAimAngle(coords);
    }

    function handlePointerMove(e) {
        if (!state.isAiming || state.isGameOver || state.isShooting || state.isPaused) return;
        
        const coords = getCanvasCoordinates(e.clientX, e.clientY);
        state.lastPointerY = coords.y;
        
        // Check if below danger line - hide aim line
        const dangerLineY = state.shooterPos.y - state.bubbleRadius * 2;
        state.showAimLine = coords.y <= dangerLineY;
        
        updateAimAngle(coords);
    }

    function handlePointerEnd(e) {
        if (!state.isAiming || state.isGameOver || state.isShooting || state.isPaused) return;
        
        state.isAiming = false;
        state.showAimLine = true;
        
        // Cancel shot if pointer is below the danger line (shooter base area)
        const dangerLineY = state.shooterPos.y - state.bubbleRadius * 2;
        if (state.lastPointerY > dangerLineY) {
            // Shot cancelled - don't fire
            return;
        }
        
        shootBubble();
    }

    function handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            handlePointerStart({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    function handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            handlePointerMove({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        handlePointerEnd(e);
    }

    function updateAimAngle(coords) {
        const dx = coords.x - state.shooterPos.x;
        const dy = coords.y - state.shooterPos.y;
        
        // Only allow aiming upward
        let angle = Math.atan2(dy, dx);
        
        // Clamp angle between -170 and -10 degrees
        const minAngle = -Math.PI + 0.17;
        const maxAngle = -0.17;
        
        if (angle > 0) angle = maxAngle;
        angle = Math.max(minAngle, Math.min(maxAngle, angle));
        
        state.aimAngle = angle;
    }

    function handleResize() {
        const oldRadius = state.bubbleRadius;
        setupCanvas();
        
        // Scale bubble positions
        const scale = state.bubbleRadius / oldRadius;
        
        state.bubbles.forEach((row, rowIndex) => {
            row.forEach((bubble, colIndex) => {
                if (bubble) {
                    const pos = utils.getGridPosition(rowIndex, colIndex);
                    bubble.x = pos.x;
                    bubble.y = pos.y;
                }
            });
        });
        
        if (state.shooterBubble) {
            state.shooterBubble.x = state.shooterPos.x;
            state.shooterBubble.y = state.shooterPos.y;
        }
        
        if (state.nextBubble) {
            state.nextBubble.x = state.shooterPos.x - state.bubbleRadius * 3;
            state.nextBubble.y = state.shooterPos.y;
        }
    }

    // ==================== SHOOTING MECHANICS ====================
    function shootBubble() {
        if (state.isShooting || !state.shooterBubble) return;
        
        state.isShooting = true;
        state.shootingBubble = state.shooterBubble;
        state.shootingBubble.vx = Math.cos(state.aimAngle) * CONFIG.BUBBLE_SPEED;
        state.shootingBubble.vy = Math.sin(state.aimAngle) * CONFIG.BUBBLE_SPEED;
        
        state.shooterBubble = null;
        state.shotsFired++;
        // Shot counter logic is kept but not displayed to user
    }

    function updateShootingBubble() {
        if (!state.shootingBubble) return;
        
        const bubble = state.shootingBubble;
        
        // Update position
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;
        
        // Wall collision
        if (bubble.x <= state.bubbleRadius || bubble.x >= state.canvas.width - state.bubbleRadius) {
            bubble.vx = -bubble.vx;
            bubble.x = Math.max(state.bubbleRadius, Math.min(state.canvas.width - state.bubbleRadius, bubble.x));
        }
        
        // Top collision
        if (bubble.y <= state.bubbleRadius + state.gridOffsetY) {
            snapBubbleToGrid(bubble);
            return;
        }
        
        // Check collision with existing bubbles
        for (let row = 0; row < state.bubbles.length; row++) {
            for (let col = 0; col < state.bubbles[row].length; col++) {
                const gridBubble = state.bubbles[row][col];
                if (gridBubble) {
                    const dist = utils.distance(bubble.x, bubble.y, gridBubble.x, gridBubble.y);
                    if (dist < state.bubbleRadius * 1.8) {
                        snapBubbleToGrid(bubble);
                        return;
                    }
                }
            }
        }
    }

    function snapBubbleToGrid(bubble) {
        // Find the best grid position
        const gridPos = utils.getGridFromPosition(bubble.x, bubble.y);
        let bestRow = Math.max(0, gridPos.row);
        let bestCol = gridPos.col;
        
        // Ensure row exists
        while (state.bubbles.length <= bestRow) {
            state.bubbles.push([]);
        }
        
        // Adjust column based on row offset
        const maxCols = bestRow % 2 === 0 ? CONFIG.COLS : CONFIG.COLS - 1;
        bestCol = Math.max(0, Math.min(maxCols - 1, bestCol));
        
        // Find nearest empty spot
        const pos = utils.getGridPosition(bestRow, bestCol);
        
        // Check if position is occupied, find alternative
        if (state.bubbles[bestRow][bestCol]) {
            const neighbors = getNeighborPositions(bestRow, bestCol);
            let found = false;
            
            for (const neighbor of neighbors) {
                if (neighbor.row >= 0 && neighbor.row < state.bubbles.length) {
                    const maxC = neighbor.row % 2 === 0 ? CONFIG.COLS : CONFIG.COLS - 1;
                    if (neighbor.col >= 0 && neighbor.col < maxC) {
                        if (!state.bubbles[neighbor.row][neighbor.col]) {
                            bestRow = neighbor.row;
                            bestCol = neighbor.col;
                            found = true;
                            break;
                        }
                    }
                }
            }
            
            if (!found) {
                // Try next row down
                bestRow++;
                while (state.bubbles.length <= bestRow) {
                    state.bubbles.push([]);
                }
                const maxC = bestRow % 2 === 0 ? CONFIG.COLS : CONFIG.COLS - 1;
                bestCol = Math.max(0, Math.min(maxC - 1, bestCol));
            }
        }
        
        // Place bubble
        const finalPos = utils.getGridPosition(bestRow, bestCol);
        bubble.x = finalPos.x;
        bubble.y = finalPos.y;
        bubble.row = bestRow;
        bubble.col = bestCol;
        bubble.vx = 0;
        bubble.vy = 0;
        
        // Ensure array is large enough
        while (state.bubbles[bestRow].length <= bestCol) {
            state.bubbles[bestRow].push(null);
        }
        
        state.bubbles[bestRow][bestCol] = bubble;
        state.shootingBubble = null;
        
        // Check for matches
        checkMatches(bestRow, bestCol);
        
        // Check for floating bubbles
        setTimeout(() => {
            removeFloatingBubbles();
            
            // Check if we need to descend after shots
            if (state.shotsFired > 0 && state.shotsFired % CONFIG.SHOTS_PER_DESCENT === 0) {
                descendBoard();
            }
            
            // Ensure minimum rows exist
            ensureMinimumRows();
            
            // Check game over
            if (checkGameOver()) {
                endGame();
            } else {
                // Prepare next bubble
                state.shooterBubble = state.nextBubble;
                state.shooterBubble.x = state.shooterPos.x;
                state.shooterBubble.y = state.shooterPos.y;
                
                state.nextBubble = new Bubble(
                    state.shooterPos.x - state.bubbleRadius * 3,
                    state.shooterPos.y,
                    utils.getRandomColor()
                );
                
                state.isShooting = false;
            }
        }, 50);
    }

    function getNeighborPositions(row, col) {
        const isOddRow = row % 2 === 1;
        const offsets = isOddRow ? [
            { row: -1, col: 0 }, { row: -1, col: 1 },
            { row: 0, col: -1 }, { row: 0, col: 1 },
            { row: 1, col: 0 }, { row: 1, col: 1 }
        ] : [
            { row: -1, col: -1 }, { row: -1, col: 0 },
            { row: 0, col: -1 }, { row: 0, col: 1 },
            { row: 1, col: -1 }, { row: 1, col: 0 }
        ];
        
        return offsets.map(offset => ({
            row: row + offset.row,
            col: col + offset.col
        }));
    }

    // ==================== MATCH DETECTION ====================
    function checkMatches(startRow, startCol) {
        const bubble = state.bubbles[startRow]?.[startCol];
        if (!bubble) return;
        
        const color = bubble.color;
        const matched = [];
        const visited = new Set();
        
        function floodFill(row, col) {
            const key = `${row},${col}`;
            if (visited.has(key)) return;
            
            const b = state.bubbles[row]?.[col];
            if (!b || b.color !== color) return;
            
            visited.add(key);
            matched.push({ row, col, bubble: b });
            
            const neighbors = getNeighborPositions(row, col);
            neighbors.forEach(n => floodFill(n.row, n.col));
        }
        
        floodFill(startRow, startCol);
        
        if (matched.length >= CONFIG.MIN_MATCH) {
            // Pop matched bubbles
            matched.forEach(({ row, col, bubble }) => {
                bubble.isPopping = true;
                state.poppingBubbles.push(bubble);
                state.bubbles[row][col] = null;
                state.score += CONFIG.POINTS_PER_BUBBLE;
            });
            
            updateScoreDisplay();
        }
    }

    function removeFloatingBubbles() {
        // Find all bubbles connected to top
        const connected = new Set();
        
        function markConnected(row, col) {
            const key = `${row},${col}`;
            if (connected.has(key)) return;
            
            const bubble = state.bubbles[row]?.[col];
            if (!bubble) return;
            
            connected.add(key);
            
            const neighbors = getNeighborPositions(row, col);
            neighbors.forEach(n => markConnected(n.row, n.col));
        }
        
        // Start from top row
        if (state.bubbles[0]) {
            state.bubbles[0].forEach((bubble, col) => {
                if (bubble) markConnected(0, col);
            });
        }
        
        // Remove unconnected bubbles
        state.bubbles.forEach((row, rowIndex) => {
            row.forEach((bubble, colIndex) => {
                if (bubble && !connected.has(`${rowIndex},${colIndex}`)) {
                    bubble.isFalling = true;
                    state.fallingBubbles.push(bubble);
                    state.bubbles[rowIndex][colIndex] = null;
                    state.score += CONFIG.POINTS_PER_BUBBLE;
                }
            });
        });
        
        updateScoreDisplay();
    }

    // ==================== BOARD DESCENT ====================
    function countActiveRows() {
        let count = 0;
        for (const row of state.bubbles) {
            if (row.some(bubble => bubble !== null)) {
                count++;
            }
        }
        return count;
    }
    
    function ensureMinimumRows() {
        const activeRows = countActiveRows();
        
        if (activeRows <= 3) {
            // Add 2 rows if only 3 or fewer remain
            descendBoard();
            descendBoard();
        } else if (activeRows <= CONFIG.MIN_ROWS_THRESHOLD) {
            // Add 1 row if 4 or fewer remain
            descendBoard();
        }
    }

    function descendBoard() {
        // Determine row parity based on current top row
        const newRowIndex = 0;
        const currentTopIsEven = state.bubbles.length > 0 ? (state.bubbles.length % 2 === 0) : true;
        const cols = currentTopIsEven ? CONFIG.COLS : CONFIG.COLS - 1;
        
        // Generate a clustered row
        const newRow = generateClusteredRow(newRowIndex);
        
        state.bubbles.unshift(newRow);
        
        // Update all bubble positions
        state.bubbles.forEach((row, rowIndex) => {
            const expectedCols = rowIndex % 2 === 0 ? CONFIG.COLS : CONFIG.COLS - 1;
            row.forEach((bubble, colIndex) => {
                if (bubble) {
                    bubble.row = rowIndex;
                    bubble.col = colIndex;
                    const pos = utils.getGridPosition(rowIndex, colIndex);
                    bubble.x = pos.x;
                    bubble.y = pos.y;
                }
            });
        });
        
        // Check game over after descent
        if (checkGameOver()) {
            endGame();
        }
    }

    // ==================== GAME STATE ====================
    function checkGameOver() {
        // Check if any bubble is too low
        const maxY = state.shooterPos.y - state.bubbleRadius * 3;
        
        for (const row of state.bubbles) {
            for (const bubble of row) {
                if (bubble && bubble.y >= maxY) {
                    return true;
                }
            }
        }
        
        return false;
    }

    function endGame() {
        state.isGameOver = true;
        showGameOver();
    }

    function showGameOver() {
        document.getElementById('final-score').textContent = state.score;
        
        // Handle high score
        const isNewRecord = state.score > state.highScore;
        if (isNewRecord) {
            state.highScore = state.score;
            saveHighScore();
        }
        
        document.getElementById('high-score').textContent = state.highScore;
        
        const newRecordEl = document.getElementById('new-record');
        if (isNewRecord && state.score > 0) {
            newRecordEl.classList.remove('hidden');
        } else {
            newRecordEl.classList.add('hidden');
        }
        
        document.getElementById('game-over-overlay').classList.remove('hidden');
    }
    
    function loadHighScore() {
        try {
            const saved = localStorage.getItem('bubbleShooterHighScore');
            return saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            return 0;
        }
    }
    
    function saveHighScore() {
        try {
            localStorage.setItem('bubbleShooterHighScore', state.highScore.toString());
        } catch (e) {
            // localStorage not available
        }
    }

    function hideGameOver() {
        document.getElementById('game-over-overlay').classList.add('hidden');
        document.getElementById('paused-overlay').classList.add('hidden');
        document.getElementById('new-record').classList.add('hidden');
        
        // Reset pause button
        const pauseBtn = document.getElementById('pause-btn');
        pauseBtn.textContent = '⏸';
        pauseBtn.title = 'Pause Game';
    }

    function updateScoreDisplay() {
        document.getElementById('score-value').textContent = state.score;
    }

    function restartGame() {
        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
        }
        
        // Force reset critical states before init
        state.isPaused = false;
        state.isShooting = false;
        state.isAiming = false;
        state.isGameOver = false;
        state.shootingBubble = null;
        
        initGame();
        gameLoop();
    }

    // ==================== RENDERING ====================
    function render() {
        const ctx = state.ctx;
        const canvas = state.canvas;
        
        // Clear canvas
        ctx.fillStyle = '#0f0f1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid background
        drawGridBackground();
        
        // Draw bubbles in grid
        state.bubbles.forEach(row => {
            row.forEach(bubble => {
                if (bubble && !bubble.isPopping && !bubble.isFalling) {
                    bubble.draw(ctx);
                }
            });
        });
        
        // Draw popping bubbles
        state.poppingBubbles.forEach(bubble => bubble.draw(ctx));
        
        // Draw falling bubbles
        state.fallingBubbles.forEach(bubble => bubble.draw(ctx));
        
        // Draw shooting bubble
        if (state.shootingBubble) {
            state.shootingBubble.draw(ctx);
        }
        
        // Draw aim line
        if (state.isAiming && !state.isShooting) {
            drawAimLine();
        }
        
        // Draw shooter
        drawShooter();
        
        // Draw next bubble indicator with animated swap arrow
        if (state.nextBubble && state.shooterBubble) {
            // Draw the next bubble
            state.nextBubble.draw(ctx);
            
            // Draw animated swap arrow between bubbles
            drawSwapArrow(ctx);
        } else if (state.nextBubble) {
            state.nextBubble.draw(ctx);
        }
        
        // Draw danger line
        drawDangerLine();
    }

    function drawGridBackground() {
        const ctx = state.ctx;
        
        // Subtle grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < CONFIG.COLS; col++) {
                const pos = utils.getGridPosition(row, col);
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, state.bubbleRadius * 0.95, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }

    function drawAimLine() {
        const ctx = state.ctx;
        
        // Don't draw if aim is cancelled (below danger line)
        if (!state.showAimLine) return;
        
        const startX = state.shooterPos.x;
        const startY = state.shooterPos.y;
        const bubbleColor = state.shooterBubble ? state.shooterBubble.color : '#ffffff';
        
        // Calculate predictive path with wall bounces
        const path = calculateBouncingPath(startX, startY, state.aimAngle);
        
        // Draw the path with bubble color
        ctx.strokeStyle = bubbleColor;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7;
        ctx.setLineDash([8, 8]);
        
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        
        // Draw small circle at end point
        const endPoint = path[path.length - 1];
        ctx.fillStyle = bubbleColor;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(endPoint.x, endPoint.y, state.bubbleRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    function calculateBouncingPath(startX, startY, angle) {
        const path = [{ x: startX, y: startY }];
        let x = startX;
        let y = startY;
        let vx = Math.cos(angle);
        let vy = Math.sin(angle);
        const stepSize = 5;
        const maxSteps = 500;
        const radius = state.bubbleRadius;
        const leftWall = radius;
        const rightWall = state.canvas.width - radius;
        const topLimit = radius + state.gridOffsetY;
        
        for (let step = 0; step < maxSteps; step++) {
            x += vx * stepSize;
            y += vy * stepSize;
            
            // Check wall collision and bounce
            if (x <= leftWall) {
                x = leftWall;
                vx = -vx;
                path.push({ x, y });
            } else if (x >= rightWall) {
                x = rightWall;
                vx = -vx;
                path.push({ x, y });
            }
            
            // Check top collision
            if (y <= topLimit) {
                path.push({ x, y: topLimit });
                break;
            }
            
            // Check collision with existing bubbles
            let hitBubble = false;
            for (let row = 0; row < state.bubbles.length && !hitBubble; row++) {
                for (let col = 0; col < state.bubbles[row].length && !hitBubble; col++) {
                    const gridBubble = state.bubbles[row][col];
                    if (gridBubble) {
                        const dist = utils.distance(x, y, gridBubble.x, gridBubble.y);
                        if (dist < radius * 1.9) {
                            path.push({ x, y });
                            hitBubble = true;
                        }
                    }
                }
            }
            
            if (hitBubble) break;
        }
        
        // Add final point if not already added
        const lastPoint = path[path.length - 1];
        if (lastPoint.x !== x || lastPoint.y !== y) {
            path.push({ x, y });
        }
        
        return path;
    }

    function drawShooter() {
        const ctx = state.ctx;
        const x = state.shooterPos.x;
        const y = state.shooterPos.y;
        const radius = state.bubbleRadius;
        
        // Draw shooter base
        ctx.fillStyle = '#2a2a4a';
        ctx.beginPath();
        ctx.arc(x, y + radius * 0.5, radius * 1.5, 0, Math.PI);
        ctx.fill();
        
        // Draw shooter cannon
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(state.aimAngle + Math.PI / 2);
        
        ctx.fillStyle = '#4a4a6a';
        ctx.fillRect(-radius * 0.4, -radius * 2, radius * 0.8, radius * 2);
        
        ctx.fillStyle = '#5a5a7a';
        ctx.beginPath();
        ctx.arc(0, -radius * 2, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Draw current bubble
        if (state.shooterBubble) {
            state.shooterBubble.draw(ctx);
        }
    }

    function drawDangerLine() {
        const ctx = state.ctx;
        const y = state.shooterPos.y - state.bubbleRadius * 3;
        
        ctx.strokeStyle = 'rgba(233, 69, 96, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 10]);
        
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(state.canvas.width, y);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    function drawSwapArrow(ctx) {
        if (!state.nextBubble || !state.shooterBubble) return;
        
        const nextX = state.nextBubble.x;
        const nextY = state.nextBubble.y;
        const shooterX = state.shooterBubble.x;
        const shooterY = state.shooterBubble.y;
        
        // Calculate arrow position between the two bubbles
        const midX = (nextX + shooterX) / 2;
        const midY = (nextY + shooterY) / 2;
        
        // Animated offset (pulsing side to side)
        const pulseOffset = Math.sin(state.swapArrowPhase) * state.bubbleRadius * 0.15;
        
        // Arrow properties
        const arrowSize = state.bubbleRadius * 0.4;
        const alpha = 0.6 + Math.sin(state.swapArrowPhase * 2) * 0.2;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Draw double-headed arrow
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        // Left arrow (pointing to next bubble)
        const leftArrowX = midX - arrowSize * 0.5 + pulseOffset;
        ctx.beginPath();
        ctx.moveTo(leftArrowX, midY);
        ctx.lineTo(leftArrowX + arrowSize * 0.6, midY - arrowSize * 0.4);
        ctx.moveTo(leftArrowX, midY);
        ctx.lineTo(leftArrowX + arrowSize * 0.6, midY + arrowSize * 0.4);
        ctx.stroke();
        
        // Right arrow (pointing to shooter bubble)
        const rightArrowX = midX + arrowSize * 0.5 - pulseOffset;
        ctx.beginPath();
        ctx.moveTo(rightArrowX, midY);
        ctx.lineTo(rightArrowX - arrowSize * 0.6, midY - arrowSize * 0.4);
        ctx.moveTo(rightArrowX, midY);
        ctx.lineTo(rightArrowX - arrowSize * 0.6, midY + arrowSize * 0.4);
        ctx.stroke();
        
        // Draw line connecting arrows
        ctx.beginPath();
        ctx.moveTo(leftArrowX + arrowSize * 0.3, midY);
        ctx.lineTo(rightArrowX - arrowSize * 0.3, midY);
        ctx.stroke();
        
        // Draw subtle tap indicator circle around next bubble
        const tapPulse = 1 + Math.sin(state.swapArrowPhase * 1.5) * 0.1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(nextX, nextY, state.bubbleRadius * 1.2 * tapPulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.restore();
    }

    // ==================== GAME LOOP ====================
    function gameLoop() {
        if (!state.isGameOver && !state.isPaused) {
            // Update shooting bubble
            updateShootingBubble();
            
            // Update popping bubbles
            state.poppingBubbles = state.poppingBubbles.filter(bubble => bubble.update());
            
            // Update falling bubbles
            state.fallingBubbles = state.fallingBubbles.filter(bubble => bubble.update());
        }
        
        // Update swap arrow animation (even when paused for visual feedback)
        state.swapArrowPhase += 0.05;
        
        // Render
        render();
        
        // Continue loop
        state.animationId = requestAnimationFrame(gameLoop);
    }

    // ==================== INITIALIZATION ====================
    function init() {
        initGame();
        setupInputHandlers();
        gameLoop();
    }

    // Start the game when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
