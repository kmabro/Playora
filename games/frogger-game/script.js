/**
 * Frogger - Infinite Arcade Game
 * Vanilla JavaScript Implementation with Procedural Generation
 */

(function() {
    'use strict';

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        GRID_COLS: 13,
        VISIBLE_ROWS: 15,
        FROG_START_ROW: 2,
        MOVE_COOLDOWN: 120,
        SCORE_PER_STEP: 10,
        DIFFICULTY_INCREASE_INTERVAL: 50,
        BASE_SPEED_MULTIPLIER: 1.0,
        MAX_SPEED_MULTIPLIER: 2.5,
        ICE_MOMENTUM: 0.92,
        COLORS: {
            SAFE: '#4ade80',
            ROAD: '#374151',
            WATER: '#0ea5e9',
            GRASS: '#166534',
            FOREST: '#15803d',
            DESERT: '#d97706',
            SAND: '#fbbf24',
            ICE: '#7dd3fc',
            TUNDRA: '#e0f2fe'
        }
    };

    // ==================== BIOME DEFINITIONS ====================
    const BIOME_TYPES = {
        ROAD: 'road',
        WATER: 'water',
        FOREST: 'forest',
        DESERT: 'desert',
        TUNDRA: 'tundra',
        SAFE: 'safe'
    };

    const LANE_TEMPLATES = {
        road_car: { biome: BIOME_TYPES.ROAD, obstacleType: 'car', obstacleLength: 1, gap: 4.5, baseSpeed: 0.8 },
        road_truck: { biome: BIOME_TYPES.ROAD, obstacleType: 'truck', obstacleLength: 2, gap: 5.5, baseSpeed: 0.6 },
        road_car_fast: { biome: BIOME_TYPES.ROAD, obstacleType: 'car', obstacleLength: 1, gap: 4, baseSpeed: 1.2 },
        road_bike: { biome: BIOME_TYPES.ROAD, obstacleType: 'bike', obstacleLength: 0.7, gap: 3, baseSpeed: 1.4 },
        road_bus: { biome: BIOME_TYPES.ROAD, obstacleType: 'bus', obstacleLength: 2.5, gap: 6, baseSpeed: 0.5 },
        road_taxi: { biome: BIOME_TYPES.ROAD, obstacleType: 'taxi', obstacleLength: 1, gap: 4, baseSpeed: 0.9 },
        
        water_log: { biome: BIOME_TYPES.WATER, obstacleType: 'log', obstacleLength: 3, gap: 2.2, baseSpeed: 0.5 },
        water_turtle: { biome: BIOME_TYPES.WATER, obstacleType: 'turtle', obstacleLength: 3, gap: 2.2, baseSpeed: 0.45 },
        water_long_log: { biome: BIOME_TYPES.WATER, obstacleType: 'log', obstacleLength: 5, gap: 2.5, baseSpeed: 0.6 },
        
        forest_log: { biome: BIOME_TYPES.FOREST, obstacleType: 'forest_log', obstacleLength: 3, gap: 2, baseSpeed: 0.35 },
        forest_tree: { biome: BIOME_TYPES.FOREST, obstacleType: 'tree', obstacleLength: 1, gap: 3, baseSpeed: 0, isStatic: true },
        
        desert_worm: { biome: BIOME_TYPES.DESERT, obstacleType: 'sandworm', obstacleLength: 2, gap: 4, baseSpeed: 1.1 },
        desert_pit: { biome: BIOME_TYPES.DESERT, obstacleType: 'quicksand', obstacleLength: 1.5, gap: 2.5, baseSpeed: 0, isPit: true },
        
        tundra_ice: { biome: BIOME_TYPES.TUNDRA, obstacleType: 'iceblock', obstacleLength: 3, gap: 2, baseSpeed: 0.6, isSlippery: true },
        tundra_slide: { biome: BIOME_TYPES.TUNDRA, obstacleType: 'iceslide', obstacleLength: 4, gap: 2.5, baseSpeed: 0.75, isSlippery: true }
    };

    const BIOME_SECTIONS = {
        road_easy: ['safe', 'road_car', 'road_truck', 'road_car', 'safe'],
        road_medium: ['road_car', 'road_truck', 'road_bike', 'road_taxi', 'road_truck'],
        road_hard: ['road_car_fast', 'road_truck', 'road_car_fast', 'road_bus', 'road_truck'],
        road_mixed: ['road_bike', 'road_truck', 'road_bus', 'road_taxi', 'road_truck'],
        water_easy: ['safe', 'water_long_log', 'water_log', 'water_turtle', 'safe'],
        water_medium: ['water_log', 'water_turtle', 'water_long_log', 'water_log'],
        forest: ['safe', 'forest_log', 'forest_tree', 'forest_log', 'safe'],
        desert: ['safe', 'desert_pit', 'desert_worm', 'desert_pit', 'safe'],
        desert_hard: ['desert_worm', 'desert_pit', 'desert_worm'],
        tundra: ['safe', 'tundra_ice', 'tundra_slide', 'tundra_ice', 'safe'],
        mixed_easy: ['safe', 'road_car', 'safe', 'water_long_log', 'safe'],
        mixed_medium: ['road_car', 'road_truck', 'safe', 'water_log', 'water_turtle']
    };

    // ==================== GAME STATE ====================
    const state = {
        canvas: null,
        ctx: null,
        tileWidth: 0,
        tileHeight: 0,
        frog: { 
            x: 6, 
            y: 2, 
            targetX: 6, 
            targetY: 2, 
            animProgress: 0,
            velocityX: 0,
            onIce: false
        },
        lanes: [],
        worldOffset: 0,
        highestRow: 0,
        score: 0,
        highScore: parseInt(localStorage.getItem('froggerHighScore')) || 0,
        gameOver: false,
        lastMoveTime: 0,
        animationId: null,
        lastTime: 0,
        difficultyMultiplier: 1.0,
        generatedUpTo: 0
    };

    // ==================== LANE GENERATION ====================
    function initLanes() {
        state.lanes = [];
        state.generatedUpTo = 0;
        
        // Generate initial safe zone
        for (let i = 0; i < 4; i++) {
            state.lanes.push(createLane('safe', state.generatedUpTo++));
        }
        
        // Generate first sections
        for (let i = 0; i < 8; i++) {
            generateNextBiomeSection();
        }
    }

    function generateNextBiomeSection() {
        const progress = state.highestRow;
        let sectionName;
        
        // Progressive difficulty
        if (progress < 10) {
            sectionName = 'road_easy';
        } else if (progress < 25) {
            sectionName = ['road_easy', 'mixed_easy'][Math.floor(Math.random() * 2)];
        } else if (progress < 50) {
            sectionName = ['road_easy', 'road_mixed', 'water_easy', 'mixed_easy'][Math.floor(Math.random() * 4)];
        } else if (progress < 80) {
            sectionName = ['road_medium', 'road_mixed', 'water_easy', 'water_medium', 'forest'][Math.floor(Math.random() * 5)];
        } else if (progress < 120) {
            sectionName = ['road_medium', 'road_mixed', 'road_hard', 'water_medium', 'forest', 'desert', 'mixed_medium'][Math.floor(Math.random() * 7)];
        } else {
            const allBiomes = ['road_medium', 'road_hard', 'road_mixed', 'water_medium', 'forest', 'desert', 'desert_hard', 'tundra', 'mixed_medium'];
            sectionName = allBiomes[Math.floor(Math.random() * allBiomes.length)];
        }
        
        const section = BIOME_SECTIONS[sectionName];
        
        section.forEach(laneType => {
            const lane = createLane(laneType, state.generatedUpTo);
            state.lanes.push(lane);
            state.generatedUpTo++;
        });
    }

    function createLane(laneType, rowIndex) {
        if (laneType === 'safe') {
            return {
                type: 'safe',
                biome: BIOME_TYPES.SAFE,
                obstacles: [],
                speed: 0,
                rowIndex: rowIndex
            };
        }
        
        const template = LANE_TEMPLATES[laneType];
        if (!template) {
            return {
                type: 'safe',
                biome: BIOME_TYPES.SAFE,
                obstacles: [],
                speed: 0,
                rowIndex: rowIndex
            };
        }
        
        const difficultyBonus = Math.min(state.difficultyMultiplier, CONFIG.MAX_SPEED_MULTIPLIER);
        // Add random speed variation: 0.7x to 1.4x for more dynamic gameplay
        const speedVariation = 0.7 + Math.random() * 0.7;
        const speed = template.baseSpeed * difficultyBonus * speedVariation;
        const direction = Math.random() > 0.5 ? 1 : -1;
        
        const lane = {
            type: laneType,
            biome: template.biome,
            obstacleType: template.obstacleType,
            obstacleLength: template.obstacleLength,
            gap: template.gap,
            speed: speed,
            direction: direction,
            obstacles: [],
            rowIndex: rowIndex,
            isStatic: template.isStatic || false,
            isPit: template.isPit || false,
            isSlippery: template.isSlippery || false,
            isPlatform: template.biome === BIOME_TYPES.WATER || 
                        template.obstacleType === 'forest_log' ||
                        template.obstacleType === 'iceblock' ||
                        template.obstacleType === 'iceslide'
        };
        
        createObstaclesForLane(lane);
        return lane;
    }

    function createObstaclesForLane(lane) {
        lane.obstacles = [];
        const totalWidth = CONFIG.GRID_COLS;
        
        if (lane.isStatic) {
            // Trees - ensure clear paths
            const numObstacles = 3 + Math.floor(Math.random() * 2);
            const clearCols = [
                Math.floor(Math.random() * 3) + 1,
                Math.floor(Math.random() * 3) + 5,
                Math.floor(Math.random() * 3) + 9
            ];
            
            const positions = [];
            for (let i = 0; i < numObstacles; i++) {
                let x;
                let attempts = 0;
                do {
                    x = Math.floor(Math.random() * (totalWidth - 2)) + 1;
                    attempts++;
                } while ((clearCols.some(c => Math.abs(c - x) < 2) || positions.some(p => Math.abs(p - x) < 2)) && attempts < 20);
                
                if (attempts < 20) {
                    positions.push(x);
                    lane.obstacles.push({ x: x, length: lane.obstacleLength, type: lane.obstacleType });
                }
            }
            return;
        }
        
        if (lane.isPit) {
            // Pits with guaranteed safe spots
            let x = 1 + Math.random() * 2;
            while (x < totalWidth - 1) {
                const pitLength = 1 + Math.random() * 0.8;
                lane.obstacles.push({ x: x, length: pitLength, type: lane.obstacleType, isPit: true });
                const safeGap = 2.5 + Math.random() * 1.5;
                x += pitLength + safeGap;
            }
            return;
        }
        
        // Moving obstacles/platforms
        const isPlatformLane = lane.isPlatform;
        const maxGap = isPlatformLane ? 2.3 : lane.gap;
        
        let x = Math.random() * 1.5;
        let count = 0;
        let colorIdx = Math.floor(Math.random() * 5);
        
        while (x < totalWidth + lane.obstacleLength + 4) {
            lane.obstacles.push({ 
                x: x, 
                length: lane.obstacleLength, 
                type: lane.obstacleType,
                colorIndex: colorIdx
            });
            colorIdx++;
            count++;
            
            const gapVariance = Math.random() * 0.6;
            const gap = isPlatformLane ? Math.min(lane.gap + gapVariance, maxGap) : lane.gap + gapVariance;
            x += lane.obstacleLength + gap;
        }
        
        // Ensure minimum platforms for safety
        if (isPlatformLane && count < 4) {
            for (let i = count; i < 4; i++) {
                lane.obstacles.push({
                    x: (totalWidth / 4) * i + Math.random(),
                    length: lane.obstacleLength,
                    type: lane.obstacleType
                });
            }
        }
    }

    // ==================== CANVAS SETUP ====================
    function setupCanvas() {
        state.canvas = document.getElementById('gameCanvas');
        state.ctx = state.canvas.getContext('2d');
        resizeCanvas();
    }

    function resizeCanvas() {
        const container = state.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const aspectRatio = CONFIG.GRID_COLS / CONFIG.VISIBLE_ROWS;
        let width, height;
        
        if (containerWidth / containerHeight > aspectRatio) {
            height = containerHeight;
            width = height * aspectRatio;
        } else {
            width = containerWidth;
            height = width / aspectRatio;
        }
        
        const dpr = window.devicePixelRatio || 1;
        state.canvas.width = width * dpr;
        state.canvas.height = height * dpr;
        
        state.canvas.style.width = `${width}px`;
        state.canvas.style.height = `${height}px`;
        
        state.ctx.scale(dpr, dpr);
        
        state.tileWidth = width / CONFIG.GRID_COLS;
        state.tileHeight = height / CONFIG.VISIBLE_ROWS;
    }

    // ==================== DRAWING FUNCTIONS ====================
    function draw() {
        const ctx = state.ctx;
        const canvasWidth = state.canvas.width / (window.devicePixelRatio || 1);
        const canvasHeight = state.canvas.height / (window.devicePixelRatio || 1);
        
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        const scrollOffset = state.worldOffset;
        const startRow = Math.floor(scrollOffset);
        const fractionalOffset = scrollOffset - startRow;
        
        for (let i = -1; i <= CONFIG.VISIBLE_ROWS + 1; i++) {
            const laneIndex = startRow + i;
            if (laneIndex >= 0 && laneIndex < state.lanes.length) {
                const lane = state.lanes[laneIndex];
                const screenY = (CONFIG.VISIBLE_ROWS - 1 - i + fractionalOffset) * state.tileHeight;
                drawLane(lane, screenY);
            }
        }
        
        drawFrog();
    }

    function drawLane(lane, screenY) {
        const ctx = state.ctx;
        const th = state.tileHeight;
        const canvasWidth = state.canvas.width / (window.devicePixelRatio || 1);
        
        switch (lane.biome) {
            case BIOME_TYPES.SAFE:
                ctx.fillStyle = CONFIG.COLORS.SAFE;
                break;
            case BIOME_TYPES.ROAD:
                ctx.fillStyle = CONFIG.COLORS.ROAD;
                break;
            case BIOME_TYPES.WATER:
                ctx.fillStyle = CONFIG.COLORS.WATER;
                break;
            case BIOME_TYPES.FOREST:
                ctx.fillStyle = CONFIG.COLORS.FOREST;
                break;
            case BIOME_TYPES.DESERT:
                ctx.fillStyle = lane.isPit ? CONFIG.COLORS.SAND : CONFIG.COLORS.DESERT;
                break;
            case BIOME_TYPES.TUNDRA:
                ctx.fillStyle = CONFIG.COLORS.TUNDRA;
                break;
            default:
                ctx.fillStyle = CONFIG.COLORS.GRASS;
        }
        
        ctx.fillRect(0, screenY, canvasWidth, th);
        
        if (lane.biome === BIOME_TYPES.ROAD) {
            drawRoadMarkings(screenY);
        }
        
        lane.obstacles.forEach(obstacle => {
            drawObstacle(obstacle, screenY, lane);
        });
    }

    function drawRoadMarkings(screenY) {
        const ctx = state.ctx;
        const tw = state.tileWidth;
        const th = state.tileHeight;
        const canvasWidth = state.canvas.width / (window.devicePixelRatio || 1);
        
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.setLineDash([tw * 0.3, tw * 0.5]);
        ctx.beginPath();
        ctx.moveTo(0, screenY + th / 2);
        ctx.lineTo(canvasWidth, screenY + th / 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function drawObstacle(obstacle, screenY, lane) {
        const ctx = state.ctx;
        const tw = state.tileWidth;
        const th = state.tileHeight;
        const x = obstacle.x * tw;
        const width = obstacle.length * tw;
        
        switch (obstacle.type) {
            case 'car':
                drawCar(x, screenY, width, th, obstacle.colorIndex || 0);
                break;
            case 'truck':
                drawTruck(x, screenY, width, th);
                break;
            case 'bike':
                drawBike(x, screenY, width, th, obstacle.colorIndex || 0);
                break;
            case 'bus':
                drawBus(x, screenY, width, th);
                break;
            case 'taxi':
                drawTaxi(x, screenY, width, th);
                break;
            case 'log':
            case 'forest_log':
                drawLog(x, screenY, width, th);
                break;
            case 'turtle':
                drawTurtle(x, screenY, width, th);
                break;
            case 'tree':
                drawTree(x, screenY, tw, th);
                break;
            case 'sandworm':
                drawSandworm(x, screenY, width, th);
                break;
            case 'quicksand':
                drawQuicksand(x, screenY, width, th);
                break;
            case 'iceblock':
            case 'iceslide':
                drawIceBlock(x, screenY, width, th);
                break;
        }
    }

    function drawCar(x, y, width, height, colorIndex) {
        const ctx = state.ctx;
        const padding = height * 0.15;
        
        const colors = ['#ef4444', '#3b82f6', '#eab308', '#8b5cf6', '#ec4899'];
        ctx.fillStyle = colors[colorIndex % colors.length];
        
        ctx.beginPath();
        ctx.roundRect(x + padding, y + padding, width - padding * 2, height - padding * 2, height * 0.2);
        ctx.fill();
        
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(x + width * 0.25, y + padding * 1.5, width * 0.4, height * 0.3);
        
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.arc(x + width * 0.25, y + height - padding, height * 0.12, 0, Math.PI * 2);
        ctx.arc(x + width * 0.75, y + height - padding, height * 0.12, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawBike(x, y, width, height, colorIndex) {
        const ctx = state.ctx;
        const padding = height * 0.2;
        
        // Bike frame colors
        const colors = ['#ef4444', '#22c55e', '#3b82f6', '#f97316', '#a855f7'];
        const bikeColor = colors[colorIndex % colors.length];
        
        // Wheels
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.arc(x + width * 0.25, y + height - padding, height * 0.18, 0, Math.PI * 2);
        ctx.arc(x + width * 0.75, y + height - padding, height * 0.18, 0, Math.PI * 2);
        ctx.fill();
        
        // Wheel spokes
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x + width * 0.25, y + height - padding, height * 0.12, 0, Math.PI * 2);
        ctx.arc(x + width * 0.75, y + height - padding, height * 0.12, 0, Math.PI * 2);
        ctx.stroke();
        
        // Frame
        ctx.strokeStyle = bikeColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + width * 0.25, y + height - padding);
        ctx.lineTo(x + width * 0.5, y + height * 0.35);
        ctx.lineTo(x + width * 0.75, y + height - padding);
        ctx.stroke();
        
        // Handlebars
        ctx.beginPath();
        ctx.moveTo(x + width * 0.4, y + height * 0.3);
        ctx.lineTo(x + width * 0.6, y + height * 0.3);
        ctx.stroke();
        
        // Rider (helmet)
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(x + width * 0.5, y + height * 0.25, height * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        // Rider body
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(x + width * 0.4, y + height * 0.32, width * 0.2, height * 0.25);
    }

    function drawBus(x, y, width, height) {
        const ctx = state.ctx;
        const padding = height * 0.1;
        
        // Bus body
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(x + padding, y + padding, width - padding * 2, height - padding * 2, height * 0.12);
        ctx.fill();
        
        // Windows stripe
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(x + width * 0.08, y + padding * 1.8, width * 0.84, height * 0.32);
        
        // Window dividers
        ctx.fillStyle = '#f59e0b';
        const windowCount = 5;
        const windowWidth = (width * 0.84) / windowCount;
        for (let i = 1; i < windowCount; i++) {
            ctx.fillRect(x + width * 0.08 + i * windowWidth - 2, y + padding * 1.8, 4, height * 0.32);
        }
        
        // Front window (larger)
        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(x + width * 0.85, y + padding * 1.5, width * 0.1, height * 0.4);
        
        // Bus stripe
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(x + padding, y + height * 0.65, width - padding * 2, height * 0.08);
        
        // Wheels
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.arc(x + width * 0.15, y + height - padding, height * 0.12, 0, Math.PI * 2);
        ctx.arc(x + width * 0.4, y + height - padding, height * 0.12, 0, Math.PI * 2);
        ctx.arc(x + width * 0.85, y + height - padding, height * 0.12, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawTaxi(x, y, width, height) {
        const ctx = state.ctx;
        const padding = height * 0.15;
        
        // Taxi body (yellow)
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.roundRect(x + padding, y + padding, width - padding * 2, height - padding * 2, height * 0.2);
        ctx.fill();
        
        // Roof sign
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + width * 0.35, y + padding * 0.3, width * 0.3, height * 0.18);
        ctx.fillStyle = '#1f2937';
        ctx.font = `${height * 0.12}px Arial`;
        ctx.fillText('TAXI', x + width * 0.38, y + padding * 0.3 + height * 0.13);
        
        // Windows
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(x + width * 0.25, y + padding * 1.5, width * 0.4, height * 0.28);
        
        // Checker pattern on side
        ctx.fillStyle = '#1f2937';
        const checkerSize = height * 0.08;
        for (let i = 0; i < 4; i++) {
            if (i % 2 === 0) {
                ctx.fillRect(x + width * 0.15 + i * checkerSize, y + height * 0.6, checkerSize, checkerSize);
            }
        }
        
        // Wheels
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.arc(x + width * 0.25, y + height - padding, height * 0.12, 0, Math.PI * 2);
        ctx.arc(x + width * 0.75, y + height - padding, height * 0.12, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawTruck(x, y, width, height) {
        const ctx = state.ctx;
        const padding = height * 0.12;
        
        ctx.fillStyle = '#6b7280';
        ctx.beginPath();
        ctx.roundRect(x + padding, y + padding, width - padding * 2, height - padding * 2, height * 0.15);
        ctx.fill();
        
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(x + width * 0.75, y + padding, width * 0.2, height - padding * 2);
        
        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(x + width * 0.78, y + padding * 2, width * 0.12, height * 0.35);
        
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.arc(x + width * 0.15, y + height - padding, height * 0.12, 0, Math.PI * 2);
        ctx.arc(x + width * 0.5, y + height - padding, height * 0.12, 0, Math.PI * 2);
        ctx.arc(x + width * 0.85, y + height - padding, height * 0.12, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawLog(x, y, width, height) {
        const ctx = state.ctx;
        const padding = height * 0.2;
        
        ctx.fillStyle = '#92400e';
        ctx.beginPath();
        ctx.roundRect(x + padding / 2, y + padding, width - padding, height - padding * 2, height * 0.3);
        ctx.fill();
        
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        for (let i = width * 0.25; i < width; i += width / 4) {
            ctx.beginPath();
            ctx.moveTo(x + i, y + padding * 1.3);
            ctx.lineTo(x + i, y + height - padding * 1.3);
            ctx.stroke();
        }
        
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.ellipse(x + padding, y + height / 2, padding * 0.5, height * 0.2, 0, 0, Math.PI * 2);
        ctx.ellipse(x + width - padding, y + height / 2, padding * 0.5, height * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawTurtle(x, y, width, height) {
        const ctx = state.ctx;
        const turtleWidth = width / 3;
        
        for (let i = 0; i < 3; i++) {
            const tx = x + i * turtleWidth + turtleWidth * 0.1;
            const ty = y + height * 0.2;
            const tw = turtleWidth * 0.8;
            const tHeight = height * 0.6;
            
            ctx.fillStyle = '#166534';
            ctx.beginPath();
            ctx.ellipse(tx + tw / 2, ty + tHeight / 2, tw / 2, tHeight / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#14532d';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(tx + tw / 2, ty + tHeight / 2, tw / 3, tHeight / 3, 0, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.ellipse(tx + tw * 0.9, ty + tHeight / 2, tw * 0.12, tHeight * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawTree(x, y, width, height) {
        const ctx = state.ctx;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        ctx.fillStyle = '#78350f';
        ctx.fillRect(centerX - width * 0.1, centerY + height * 0.1, width * 0.2, height * 0.35);
        
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(centerX, centerY - height * 0.05, width * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(centerX - width * 0.12, centerY + height * 0.05, width * 0.18, 0, Math.PI * 2);
        ctx.arc(centerX + width * 0.12, centerY + height * 0.05, width * 0.18, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawSandworm(x, y, width, height) {
        const ctx = state.ctx;
        const padding = height * 0.15;
        
        ctx.fillStyle = '#a855f7';
        const segments = 4;
        const segWidth = width / segments;
        
        for (let i = 0; i < segments; i++) {
            const sx = x + i * segWidth + segWidth * 0.1;
            const sy = y + padding + (i % 2 === 0 ? 0 : height * 0.08);
            ctx.beginPath();
            ctx.ellipse(sx + segWidth * 0.4, sy + (height - padding * 2) / 2, segWidth * 0.35, (height - padding * 2) / 2.2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(x + width - width * 0.12, y + height * 0.38, height * 0.07, 0, Math.PI * 2);
        ctx.arc(x + width - width * 0.12, y + height * 0.55, height * 0.07, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawQuicksand(x, y, width, height) {
        const ctx = state.ctx;
        
        ctx.fillStyle = '#92400e';
        ctx.fillRect(x, y, width, height);
        
        ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
        const time = Date.now() / 500;
        for (let i = 0; i < 2; i++) {
            const bx = x + width * (0.3 + i * 0.4);
            const by = y + height * 0.5 + Math.sin(time + i) * height * 0.1;
            ctx.beginPath();
            ctx.arc(bx, by, height * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawIceBlock(x, y, width, height) {
        const ctx = state.ctx;
        const padding = height * 0.1;
        
        ctx.fillStyle = '#93c5fd';
        ctx.beginPath();
        ctx.roundRect(x + padding, y + padding, width - padding * 2, height - padding * 2, height * 0.15);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(x + padding * 2, y + padding * 2);
        ctx.lineTo(x + width * 0.25, y + padding * 2);
        ctx.lineTo(x + padding * 2, y + height * 0.35);
        ctx.closePath();
        ctx.fill();
    }

    function drawFrog() {
        const ctx = state.ctx;
        const tw = state.tileWidth;
        const th = state.tileHeight;
        
        const progress = state.frog.animProgress;
        const currentX = state.frog.x + (state.frog.targetX - state.frog.x) * (1 - progress);
        const currentY = state.frog.y + (state.frog.targetY - state.frog.y) * (1 - progress);
        
        const screenX = currentX * tw + tw / 2;
        const screenY = (CONFIG.VISIBLE_ROWS - 1 - (currentY - state.worldOffset)) * th + th / 2;
        
        const size = Math.min(tw, th) * 0.38;
        
        const frogColor = state.frog.onIce ? '#60a5fa' : '#4ade80';
        
        ctx.fillStyle = frogColor;
        ctx.beginPath();
        ctx.ellipse(screenX, screenY, size, size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screenX - size * 0.4, screenY - size * 0.3, size * 0.22, 0, Math.PI * 2);
        ctx.arc(screenX + size * 0.4, screenY - size * 0.3, size * 0.22, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.arc(screenX - size * 0.4, screenY - size * 0.3, size * 0.1, 0, Math.PI * 2);
        ctx.arc(screenX + size * 0.4, screenY - size * 0.3, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = frogColor;
        ctx.beginPath();
        ctx.ellipse(screenX - size * 0.65, screenY + size * 0.45, size * 0.25, size * 0.18, -0.3, 0, Math.PI * 2);
        ctx.ellipse(screenX + size * 0.65, screenY + size * 0.45, size * 0.25, size * 0.18, 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    // ==================== GAME LOGIC ====================
    function update(deltaTime) {
        if (state.gameOver) return;
        
        // Update frog animation
        if (state.frog.animProgress > 0) {
            state.frog.animProgress = Math.max(0, state.frog.animProgress - deltaTime * 10);
            if (state.frog.animProgress === 0) {
                state.frog.x = state.frog.targetX;
                state.frog.y = state.frog.targetY;
            }
        }
        
        // Ice momentum
        if (state.frog.onIce && state.frog.animProgress === 0) {
            state.frog.x += state.frog.velocityX * deltaTime;
            state.frog.targetX = state.frog.x;
            state.frog.velocityX *= CONFIG.ICE_MOMENTUM;
            if (Math.abs(state.frog.velocityX) < 0.01) state.frog.velocityX = 0;
        }
        
        // Update obstacles
        state.lanes.forEach(lane => {
            if (lane.speed > 0 && !lane.isStatic && !lane.isPit) {
                lane.obstacles.forEach((obstacle, index) => {
                    obstacle.x += lane.speed * lane.direction * deltaTime;
                    
                    // Wrap around with proper spacing to prevent overlaps
                    if (lane.direction > 0 && obstacle.x > CONFIG.GRID_COLS + 2) {
                        // Find the leftmost obstacle to position behind it
                        let leftmost = obstacle.x;
                        lane.obstacles.forEach(other => {
                            if (other !== obstacle && other.x < leftmost) {
                                leftmost = other.x;
                            }
                        });
                        obstacle.x = leftmost - lane.gap - obstacle.length;
                    } else if (lane.direction < 0 && obstacle.x + obstacle.length < -2) {
                        // Find the rightmost obstacle to position after it
                        let rightmost = obstacle.x;
                        lane.obstacles.forEach(other => {
                            if (other !== obstacle && other.x + other.length > rightmost) {
                                rightmost = other.x + other.length;
                            }
                        });
                        obstacle.x = rightmost + lane.gap;
                    }
                });
            }
        });
        
        const frogRow = Math.round(state.frog.y);
        const frogCol = state.frog.x;
        const currentLane = state.lanes[frogRow];
        
        if (!currentLane) {
            endGame();
            return;
        }
        
        state.frog.onIce = currentLane.isSlippery;
        
        // Platform lanes (water, logs, ice)
        if (currentLane.isPlatform) {
            let onPlatform = false;
            let platformSpeed = 0;
            let platformDirection = 0;
            
            for (const obstacle of currentLane.obstacles) {
                // Very generous hitbox - frog just needs to touch the platform
                const frogCenter = frogCol;
                const platformLeft = obstacle.x - 0.4;
                const platformRight = obstacle.x + obstacle.length + 0.4;
                
                if (frogCenter >= platformLeft && frogCenter <= platformRight) {
                    onPlatform = true;
                    platformSpeed = currentLane.speed;
                    platformDirection = currentLane.direction;
                    break;
                }
            }
            
            if (onPlatform) {
                state.frog.x += platformSpeed * platformDirection * deltaTime;
                state.frog.targetX = state.frog.x;
                
                // Only die if completely off screen
                if (state.frog.x < -0.8 || state.frog.x >= CONFIG.GRID_COLS - 0.2) {
                    endGame();
                    return;
                }
            } else {
                endGame();
                return;
            }
        }
        
        // Pit lanes
        if (currentLane.isPit) {
            for (const obstacle of currentLane.obstacles) {
                if (obstacle.isPit) {
                    const frogCenter = frogCol + 0.5;
                    if (frogCenter >= obstacle.x + 0.35 && frogCenter <= obstacle.x + obstacle.length - 0.35) {
                        endGame();
                        return;
                    }
                }
            }
        }
        
        // Danger lanes (road, sandworm) - tighter collision detection
        if (currentLane.biome === BIOME_TYPES.ROAD || currentLane.obstacleType === 'sandworm') {
            for (const obstacle of currentLane.obstacles) {
                // Frog hitbox
                const frogLeft = frogCol - 0.35;
                const frogRight = frogCol + 0.35;
                
                // Vehicle hitbox (tight to actual vehicle)
                const vehicleLeft = obstacle.x + 0.1;
                const vehicleRight = obstacle.x + obstacle.length - 0.1;
                
                // Check overlap
                if (frogRight > vehicleLeft && frogLeft < vehicleRight) {
                    endGame();
                    return;
                }
            }
        }
        
        // Static obstacles (trees)
        if (currentLane.isStatic) {
            for (const obstacle of currentLane.obstacles) {
                const dist = Math.abs(frogCol - obstacle.x);
                if (dist < 0.55) {
                    const pushDir = frogCol > obstacle.x ? 1 : -1;
                    state.frog.x += pushDir * 0.15;
                    state.frog.targetX = state.frog.x;
                }
            }
        }
        
        // Camera
        updateCamera();
        
        // Difficulty
        updateDifficulty();
        
        // Generate more lanes
        while (state.generatedUpTo < state.frog.y + 35) {
            generateNextBiomeSection();
        }
        
        // Score
        if (state.frog.y > state.highestRow) {
            const rowsGained = Math.floor(state.frog.y) - Math.floor(state.highestRow);
            if (rowsGained > 0) {
                state.score += rowsGained * CONFIG.SCORE_PER_STEP;
                state.highestRow = state.frog.y;
                updateScoreDisplay();
            }
        }
    }

    function updateCamera() {
        const targetOffset = state.frog.y - CONFIG.VISIBLE_ROWS * 0.65;
        if (targetOffset > state.worldOffset) {
            state.worldOffset += Math.min((targetOffset - state.worldOffset) * 4 * 0.016, 0.4);
        }
    }

    function updateDifficulty() {
        const difficultyLevel = Math.floor(state.highestRow / CONFIG.DIFFICULTY_INCREASE_INTERVAL);
        state.difficultyMultiplier = CONFIG.BASE_SPEED_MULTIPLIER + difficultyLevel * 0.08;
        state.difficultyMultiplier = Math.min(state.difficultyMultiplier, CONFIG.MAX_SPEED_MULTIPLIER);
    }

    function moveFrog(dx, dy) {
        if (state.gameOver) return;
        
        const now = Date.now();
        if (now - state.lastMoveTime < CONFIG.MOVE_COOLDOWN) return;
        
        let newX = state.frog.targetX + dx;
        let newY = state.frog.targetY + dy;
        
        if (state.frog.onIce && dx !== 0) {
            state.frog.velocityX += dx * 1.5;
        }
        
        if (newX < 0 || newX >= CONFIG.GRID_COLS) return;
        if (newY < 0) return;
        
        // Check trees ahead
        const targetLane = state.lanes[Math.round(newY)];
        if (targetLane && targetLane.isStatic) {
            for (const obstacle of targetLane.obstacles) {
                if (Math.abs(newX - obstacle.x) < 0.7) {
                    const leftClear = !targetLane.obstacles.some(o => Math.abs((newX - 1) - o.x) < 0.7);
                    const rightClear = !targetLane.obstacles.some(o => Math.abs((newX + 1) - o.x) < 0.7);
                    
                    if (leftClear && newX > 0) newX -= 1;
                    else if (rightClear && newX < CONFIG.GRID_COLS - 1) newX += 1;
                    else return;
                }
            }
        }
        
        state.frog.x = state.frog.targetX;
        state.frog.y = state.frog.targetY;
        state.frog.targetX = newX;
        state.frog.targetY = newY;
        state.frog.animProgress = 1;
        state.lastMoveTime = now;
    }

    function endGame() {
        state.gameOver = true;
        
        if (state.score > state.highScore) {
            state.highScore = state.score;
            localStorage.setItem('froggerHighScore', state.highScore.toString());
            document.getElementById('high-score').textContent = state.highScore;
        }
        
        document.getElementById('final-score').textContent = state.score;
        document.getElementById('final-distance').textContent = Math.floor(state.highestRow);
        document.getElementById('game-over-overlay').classList.remove('hidden');
    }

    function restartGame() {
        state.gameOver = false;
        state.score = 0;
        state.highestRow = 0;
        state.worldOffset = 0;
        state.difficultyMultiplier = 1.0;
        state.frog = {
            x: 6,
            y: CONFIG.FROG_START_ROW,
            targetX: 6,
            targetY: CONFIG.FROG_START_ROW,
            animProgress: 0,
            velocityX: 0,
            onIce: false
        };
        
        updateScoreDisplay();
        initLanes();
        document.getElementById('game-over-overlay').classList.add('hidden');
    }

    function updateScoreDisplay() {
        document.getElementById('score').textContent = state.score;
    }

    // ==================== GAME LOOP ====================
    function gameLoop(timestamp) {
        const deltaTime = Math.min((timestamp - state.lastTime) / 1000, 0.1);
        state.lastTime = timestamp;
        
        update(deltaTime);
        draw();
        
        state.animationId = requestAnimationFrame(gameLoop);
    }

    // ==================== INPUT HANDLING ====================
    function setupInputHandlers() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    moveFrog(0, 1);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    moveFrog(0, -1);
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    moveFrog(-1, 0);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    moveFrog(1, 0);
                    break;
            }
        });
        
        const btnUp = document.getElementById('btn-up');
        const btnDown = document.getElementById('btn-down');
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        
        const addMobileControl = (btn, dx, dy) => {
            if (!btn) return;
            ['touchstart', 'mousedown'].forEach(eventType => {
                btn.addEventListener(eventType, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    moveFrog(dx, dy);
                }, { passive: false });
            });
        };
        
        addMobileControl(btnUp, 0, 1);
        addMobileControl(btnDown, 0, -1);
        addMobileControl(btnLeft, -1, 0);
        addMobileControl(btnRight, 1, 0);
        
        document.getElementById('restart-btn').addEventListener('click', restartGame);
        
        let touchStartX = 0;
        let touchStartY = 0;
        const SWIPE_THRESHOLD = 30;
        
        state.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        state.canvas.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    moveFrog(dx > 0 ? 1 : -1, 0);
                } else {
                    moveFrog(0, dy > 0 ? -1 : 1);
                }
            }
        }, { passive: true });
        
        window.addEventListener('resize', resizeCanvas);
    }

    // ==================== INITIALIZATION ====================
    function init() {
        setupCanvas();
        initLanes();
        setupInputHandlers();
        
        document.getElementById('high-score').textContent = state.highScore;
        
        state.lastTime = performance.now();
        gameLoop(state.lastTime);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
