// drawing.js - Kanji Drawing Challenge System
// Presents a drawing challenge at intervals, where player draws a kanji for XP rewards

const KanjiDrawingSystem = {
    // UI elements
    elements: {
        container: null,
        background: null,
        borderRect: null,
        canvas: null,
        graphics: null,
        infoText: null,
        strokeFeedback: null
    },

    // Challenge state
    state: {
        active: false,
        currentKanji: null,
        currentStroke: 0,
        strokeAttempts: 0, // Attempts for current stroke
        missedStrokes: 0,  // Total strokes that were missed (after 2+ attempts)
        isDrawing: false,
        currentPath: [],
        completedStrokes: [],
        challengeComplete: false, // Prevent processing after completion
        kanjiBounds: null // Cache bounding box for consistent positioning
    },

    // Configuration
    config: {
        challengeInterval: 4000, // 4 seconds for testing (change to 180000 for production = 3 minutes)
        maxAttemptsPerStroke: 2,
        strokeMatchTolerance: 50, // Pixels of tolerance for stroke matching
        showGuideAfterMisses: true
    },

    // Timer reference
    challengeTimer: null,

    // Initialize the system
    init: function (scene) {
        if (!scene || !scene.add) {
            console.error("Cannot initialize KanjiDrawingSystem: Invalid scene");
            return;
        }

        // Start the interval timer for challenges
        this.startChallengeTimer(scene);

        console.log("Kanji Drawing System initialized");
    },

    // Start the timer for periodic challenges
    startChallengeTimer: function (scene) {
        // Clear existing timer if any
        if (this.challengeTimer) {
            this.challengeTimer.remove();
            this.challengeTimer = null;
        }

        // Create new timer
        this.challengeTimer = scene.time.addEvent({
            delay: this.config.challengeInterval,
            callback: () => {
                if (!gameOver && !gamePaused && !window.levelUpInProgress && !this.state.active) {
                    this.startChallenge(scene);
                }
            },
            callbackScope: this,
            loop: true
        });

        registerTimer(this.challengeTimer);
    },

    // Start a drawing challenge
    startChallenge: function (scene) {
        // Don't start if already active or game conditions prevent it
        if (this.state.active || gameOver || window.levelUpInProgress) {
            return;
        }

        // Pause the game
        gamePaused = true;
        if (scene.physics) {
            scene.physics.pause();
        }

        // Select a random kanji from dictionary
        this.state.currentKanji = getRandomKanji();

        // Reset challenge state
        this.state.active = true;
        this.state.currentStroke = 0;
        this.state.strokeAttempts = 0;
        this.state.missedStrokes = 0;
        this.state.isDrawing = false;
        this.state.currentPath = [];
        this.state.completedStrokes = [];
        this.state.challengeComplete = false;

        // Calculate and cache bounding box for consistent positioning
        this.state.kanjiBounds = this.calculateSVGBounds(this.state.currentKanji.strokes);

        // Create the UI
        this.createChallengeUI(scene);

        console.log(`Started drawing challenge for: ${this.state.currentKanji.character}`);
    },

    // Create the challenge UI
    createChallengeUI: function (scene) {
        const centerX = game.config.width / 2;
        const centerY = game.config.height / 2;

        // Create container
        this.elements.container = scene.add.container(0, 0);
        this.elements.container.setDepth(1500); // Higher than pause/levelup screens

        // Full-screen semi-transparent background
        const fullscreenBg = scene.add.rectangle(
            centerX, centerY,
            game.config.width, game.config.height,
            0x000000, 0.8
        );
        this.elements.container.add(fullscreenBg);

        // Drawing panel dimensions
        const panelWidth = Math.min(game.config.width * 0.9, 600);
        const panelHeight = Math.min(game.config.height * 0.9, 700);

        // Black background panel
        this.elements.background = scene.add.rectangle(
            centerX, centerY,
            panelWidth, panelHeight,
            0x000000
        );
        this.elements.container.add(this.elements.background);

        // Gold border
        this.elements.borderRect = scene.add.rectangle(
            centerX, centerY,
            panelWidth, panelHeight
        );
        this.elements.borderRect.setStrokeStyle(4, 0xFFD700);
        this.elements.container.add(this.elements.borderRect);

        // Title
        const title = scene.add.text(
            centerX,
            centerY - panelHeight / 2 + 40,
            'DRAW THE KANJI',
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#FFD700',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        this.elements.container.add(title);

        // We'll show strokes one at a time instead of the full character
        // (This will be implemented when we add real stroke data)

        // Drawing area dimensions
        const drawAreaSize = Math.min(panelWidth - 80, 400);
        const drawAreaTop = centerY - drawAreaSize / 2 - 30;

        // Drawing area border (for visual reference)
        const drawAreaBorder = scene.add.rectangle(
            centerX,
            centerY - 30,
            drawAreaSize,
            drawAreaSize
        );
        drawAreaBorder.setStrokeStyle(2, 0x666666);
        this.elements.container.add(drawAreaBorder);

        // Graphics for drawing
        this.elements.graphics = scene.add.graphics();
        this.elements.graphics.setDepth(1501);

        // If we have real stroke data, show the first stroke as a light guide
        if (this.state.currentKanji.strokes && this.state.currentKanji.strokes.length > 0) {
            this.drawGuideStroke(scene, 0, 0x666666, 0.3);
        }

        // Info text at bottom (kana, romaji, english)
        const infoY = centerY + panelHeight / 2 - 60;
        const kanji = this.state.currentKanji;
        this.elements.infoText = scene.add.text(
            centerX,
            infoY,
            `${kanji.kana} (${kanji.romaji}) - ${kanji.english}`,
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        this.elements.container.add(this.elements.infoText);

        // Stroke feedback text
        this.elements.strokeFeedback = scene.add.text(
            centerX,
            infoY + 40,
            '',
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#00ff00',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        this.elements.container.add(this.elements.strokeFeedback);

        // Get stroke count (for now, use a simple estimate based on kanji complexity)
        const strokeCount = this.state.currentKanji.strokeCount ??
            this.getStrokeCount(this.state.currentKanji.character);

        // Instructions
        const instructions = scene.add.text(
            centerX,
            centerY - panelHeight / 2 + 80,
            `Draw ${strokeCount} strokes`,
            {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#cccccc'
            }
        ).setOrigin(0.5);
        this.elements.container.add(instructions);

        // Setup input handlers
        this.setupInputHandlers(scene, centerX, centerY - 30, drawAreaSize);
    },

    // Setup mouse and touch input handlers
    setupInputHandlers: function (scene, centerX, centerY, drawAreaSize) {
        const halfSize = drawAreaSize / 2;
        const minX = centerX - halfSize;
        const maxX = centerX + halfSize;
        const minY = centerY - halfSize;
        const maxY = centerY + halfSize;

        // Mouse/touch down - start drawing
        scene.input.on('pointerdown', (pointer) => {
            if (!this.state.active) return;

            const x = pointer.x;
            const y = pointer.y;

            // Check if pointer is within drawing area
            if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                this.state.isDrawing = true;
                this.state.currentPath = [{ x, y }];
            }
        });

        // Mouse/touch move - continue drawing
        scene.input.on('pointermove', (pointer) => {
            if (!this.state.active || !this.state.isDrawing) return;

            const x = pointer.x;
            const y = pointer.y;

            // Add point to path
            this.state.currentPath.push({ x, y });

            // Draw the stroke in gold
            if (this.state.currentPath.length > 1) {
                const prev = this.state.currentPath[this.state.currentPath.length - 2];
                this.elements.graphics.lineStyle(8, 0xFFD700, 1);
                this.elements.graphics.beginPath();
                this.elements.graphics.moveTo(prev.x, prev.y);
                this.elements.graphics.lineTo(x, y);
                this.elements.graphics.strokePath();
            }
        });

        // Mouse/touch up - finish stroke
        scene.input.on('pointerup', () => {
            if (!this.state.active || !this.state.isDrawing || this.state.challengeComplete) return;

            this.state.isDrawing = false;
            this.validateStroke(scene);
        });
    },

    // Validate the drawn stroke
    validateStroke: function (scene) {
        if (this.state.currentPath.length < 2) {
            // Path too short, ignore
            this.state.currentPath = [];
            return;
        }

        // For now, we'll use a simple validation that accepts any reasonable stroke
        // In the future, this would check against actual stroke order data
        const isValid = this.checkStrokeValidity(this.state.currentPath);

        if (isValid) {
            // Stroke is correct!
            this.acceptStroke(scene);
        } else {
            // Stroke is wrong
            this.rejectStroke(scene);
        }
    },

    // Check if a stroke is valid by comparing direction with target
    checkStrokeValidity: function (path) {
        // Basic checks first
        if (path.length < 5) return false;

        // Calculate path length
        let length = 0;
        for (let i = 1; i < path.length; i++) {
            const dx = path[i].x - path[i - 1].x;
            const dy = path[i].y - path[i - 1].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }

        // Must be at least 30 pixels
        if (length < 30) return false;

        // If we have stroke data, compare direction
        if (this.state.currentKanji.strokes &&
            this.state.currentStroke < this.state.currentKanji.strokes.length) {

            const targetPath = this.state.currentKanji.strokes[this.state.currentStroke];
            const targetPoints = this.extractSVGPoints(targetPath);

            if (targetPoints && targetPoints.length >= 2) {
                // Normalize both paths to same coordinate space
                const drawnNorm = this.normalizeDrawnPath(path);
                const targetNorm = this.normalizeTargetPath(targetPoints);

                // Compare directions
                const similarity = this.compareStrokeDirection(drawnNorm, targetNorm);

                // Require 50% similarity in direction
                return similarity > 0.5;
            }
        }

        // Fallback if no stroke data - just accept reasonable length
        return true;
    },

    // Extract start and end points from SVG path string
    extractSVGPoints: function (pathString) {
        const coords = pathString.match(/-?\d+\.?\d*/g);
        if (!coords || coords.length < 4) return null;

        const points = [];
        for (let i = 0; i < coords.length; i += 2) {
            if (i + 1 < coords.length) {
                points.push({
                    x: parseFloat(coords[i]),
                    y: parseFloat(coords[i + 1])
                });
            }
        }
        return points;
    },

    // Normalize drawn path relative to drawing area
    normalizeDrawnPath: function (path) {
        const drawAreaSize = Math.min(Math.min(game.config.width * 0.9, 600) - 80, 400);
        const centerX = game.config.width / 2;
        const centerY = game.config.height / 2 - 30;

        const bounds = this.state.kanjiBounds;
        if (!bounds) return path;

        const scale = Math.min(
            (drawAreaSize - 40) / bounds.width,
            (drawAreaSize - 40) / bounds.height
        );

        const offsetX = centerX - bounds.centerX * scale;
        const offsetY = centerY - bounds.centerY * scale;

        // Convert drawn screen coordinates to SVG coordinate space
        return path.map(point => ({
            x: (point.x - offsetX) / scale,
            y: (point.y - offsetY) / scale
        }));
    },

    // Normalize target path (already in SVG coordinates)
    normalizeTargetPath: function (points) {
        return points;
    },

    // Compare direction between drawn and target strokes
    compareStrokeDirection: function (drawn, target) {
        if (drawn.length < 2 || target.length < 2) return 0;

        // Get overall direction vectors
        const drawnStart = drawn[0];
        const drawnEnd = drawn[drawn.length - 1];
        const targetStart = target[0];
        const targetEnd = target[target.length - 1];

        const drawnDx = drawnEnd.x - drawnStart.x;
        const drawnDy = drawnEnd.y - drawnStart.y;
        const targetDx = targetEnd.x - targetStart.x;
        const targetDy = targetEnd.y - targetStart.y;

        const drawnLen = Math.sqrt(drawnDx * drawnDx + drawnDy * drawnDy);
        const targetLen = Math.sqrt(targetDx * targetDx + targetDy * targetDy);

        if (drawnLen === 0 || targetLen === 0) return 0;

        // Normalize vectors
        const drawnNormX = drawnDx / drawnLen;
        const drawnNormY = drawnDy / drawnLen;
        const targetNormX = targetDx / targetLen;
        const targetNormY = targetDy / targetLen;

        // Dot product gives cosine of angle
        const dotProduct = drawnNormX * targetNormX + drawnNormY * targetNormY;

        // Convert to 0-1 similarity (1 = same direction, 0 = opposite)
        return (dotProduct + 1) / 2;
    },

    // Accept the stroke as correct
    acceptStroke: function (scene) {
        // Turn the stroke white to indicate success
        this.redrawCurrentStroke(0xffffff);

        // Add to completed strokes
        this.state.completedStrokes.push([...this.state.currentPath]);
        this.state.currentPath = [];

        // Move to next stroke
        this.state.currentStroke++;
        this.state.strokeAttempts = 0;

        // Show feedback
        this.showStrokeFeedback('Correct!', '#00ff00');

        // Check if kanji is complete
        const totalStrokes = this.state.currentKanji.strokeCount ??
            this.getStrokeCount(this.state.currentKanji.character);

        if (this.state.currentStroke >= totalStrokes) {
            // Mark as complete to prevent further strokes
            this.state.challengeComplete = true;

            // Challenge complete!
            setTimeout(() => {
                this.completeChallenge(scene);
            }, 500);
        } else {
            // Show next stroke guide if available
            if (this.state.currentKanji.strokes &&
                this.state.currentStroke < this.state.currentKanji.strokes.length) {
                setTimeout(() => {
                    // Clear previous SVG strokes
                    if (this.elements.svgOverlay) {
                        while (this.elements.svgOverlay.firstChild) {
                            this.elements.svgOverlay.removeChild(this.elements.svgOverlay.firstChild);
                        }
                    }
                    this.drawGuideStroke(scene, this.state.currentStroke, 0x666666, 0.3);
                }, 300);
            }
        }
    },

    // Reject the stroke as incorrect
    rejectStroke: function (scene) {
        // Blink red
        this.blinkStroke(scene, 0xff0000);

        this.state.strokeAttempts++;

        if (this.state.strokeAttempts >= this.config.maxAttemptsPerStroke) {
            // Too many attempts - show guide and count as missed
            this.state.missedStrokes++;
            this.showStrokeGuide(scene);
            // Feedback is set in showStrokeGuide
        } else {
            // Show feedback for retry
            this.showStrokeFeedback('Try again!', '#ff0000');
        }

        // Clear the current path
        this.state.currentPath = [];
    },

    // Redraw the current stroke in a different color
    redrawCurrentStroke: function (color) {
        if (this.state.currentPath.length < 2) return;

        this.elements.graphics.lineStyle(8, color, 1);
        this.elements.graphics.beginPath();
        this.elements.graphics.moveTo(this.state.currentPath[0].x, this.state.currentPath[0].y);

        for (let i = 1; i < this.state.currentPath.length; i++) {
            this.elements.graphics.lineTo(this.state.currentPath[i].x, this.state.currentPath[i].y);
        }

        this.elements.graphics.strokePath();
    },

    // Blink a stroke red
    blinkStroke: function (scene, color) {
        // Redraw in red
        this.redrawCurrentStroke(color);

        // After a brief delay, clear it
        setTimeout(() => {
            // Clear the failed stroke
            this.elements.graphics.clear();

            // Redraw all completed strokes in white
            this.state.completedStrokes.forEach(stroke => {
                if (stroke.length < 2) return;

                this.elements.graphics.lineStyle(8, 0xffffff, 1);
                this.elements.graphics.beginPath();
                this.elements.graphics.moveTo(stroke[0].x, stroke[0].y);

                for (let i = 1; i < stroke.length; i++) {
                    this.elements.graphics.lineTo(stroke[i].x, stroke[i].y);
                }

                this.elements.graphics.strokePath();
            });
        }, 300);
    },

    // Calculate bounding box from SVG path strings
    calculateSVGBounds: function (strokes) {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        strokes.forEach(pathString => {
            // Extract coordinates from SVG path string
            // Match all numbers (including decimals and negatives)
            const coords = pathString.match(/-?\d+\.?\d*/g);
            if (!coords) return;

            for (let i = 0; i < coords.length; i += 2) {
                if (i + 1 < coords.length) {
                    const x = parseFloat(coords[i]);
                    const y = parseFloat(coords[i + 1]);
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        });

        const width = maxX - minX;
        const height = maxY - minY;
        const centerX = minX + width / 2;
        const centerY = minY + height / 2;

        return { minX, maxX, minY, maxY, width, height, centerX, centerY };
    },

    // Draw a guide stroke from stroke data using native SVG rendering
    drawGuideStroke: function (scene, strokeIndex, color, alpha) {
        const strokes = this.state.currentKanji.strokes;
        if (!strokes || strokeIndex >= strokes.length) {
            return;
        }

        const strokePath = strokes[strokeIndex];
        if (!strokePath || typeof strokePath !== 'string') return;

        // Create SVG element if it doesn't exist
        if (!this.elements.svgOverlay) {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '0';
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.pointerEvents = 'none';
            svg.style.zIndex = '1501';
            document.body.appendChild(svg);
            this.elements.svgOverlay = svg;
        }

        // Calculate drawing area dimensions
        const drawAreaSize = Math.min(Math.min(game.config.width * 0.9, 600) - 80, 400);
        const centerX = game.config.width / 2;
        const centerY = game.config.height / 2 - 30;

        // Use cached bounds for consistent positioning
        const bounds = this.state.kanjiBounds;
        if (!bounds) return;

        // Calculate scale to fit kanji in drawing area with padding
        const padding = 20; // pixels
        const scale = Math.min(
            (drawAreaSize - padding * 2) / bounds.width,
            (drawAreaSize - padding * 2) / bounds.height
        );

        // Calculate offset to center the kanji
        const offsetX = centerX - bounds.centerX * scale;
        const offsetY = centerY - bounds.centerY * scale;

        // Create path element
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', strokePath);
        path.setAttribute('stroke', `#${color.toString(16).padStart(6, '0')}`);
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        path.setAttribute('opacity', alpha);
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('transform', `translate(${offsetX}, ${offsetY}) scale(${scale})`);

        this.elements.svgOverlay.appendChild(path);
    },

    // Show a guide for the correct stroke
    showStrokeGuide: function (scene) {
        const strokeIndex = this.state.currentStroke;

        // Clear any existing SVG paths
        if (this.elements.svgOverlay) {
            while (this.elements.svgOverlay.firstChild) {
                this.elements.svgOverlay.removeChild(this.elements.svgOverlay.firstChild);
            }
        }

        if (this.state.currentKanji.strokes && strokeIndex < this.state.currentKanji.strokes.length) {
            // Draw the actual stroke in light gray
            this.drawGuideStroke(scene, strokeIndex, 0x888888, 0.6);

            if (this.elements.strokeFeedback) {
                this.elements.strokeFeedback.setText('Guide shown - follow the gray line');
                this.elements.strokeFeedback.setColor('#888888');
            }
        } else {
            // Fallback if no stroke data
            if (this.elements.strokeFeedback) {
                this.elements.strokeFeedback.setText('Guide unavailable - draw any stroke');
                this.elements.strokeFeedback.setColor('#888888');
            }
        }

        console.log(`Showing guide for stroke ${strokeIndex + 1}`);
    },

    // Show stroke feedback message
    showStrokeFeedback: function (message, color) {
        if (!this.elements.strokeFeedback) return;

        this.elements.strokeFeedback.setText(message);
        this.elements.strokeFeedback.setColor(color);

        // Clear after a delay
        setTimeout(() => {
            if (this.elements.strokeFeedback) {
                this.elements.strokeFeedback.setText('');
            }
        }, 2000);
    },

    // Get stroke count for a kanji (improved estimates until we have real data)
    getStrokeCount: function (character) {
        // Common kanji with known stroke counts for better accuracy
        const knownStrokes = {
            '鬼': 10, '龍': 16, '蛇': 11, '魔': 21, '死': 6, '獣': 16, '骨': 10, '影': 15,
            '鮫': 17, '妖': 7, '霊': 15, '怨': 9, '邪': 8, '呪': 9, '魂': 14, '闇': 17,
            '煉': 13, '殺': 10, '禍': 13, '悪': 11, '屍': 9, '凶': 4, '餓': 15, '狂': 7,
            '災': 7, '亡': 3, '滅': 13, '崩': 11, '破': 10, '裂': 12, '灰': 6, '焦': 12,
            '血': 6, '斬': 11, '刺': 8, '砕': 9, '毒': 8, '疫': 9, '病': 10, '腐': 14,
            '蝕': 15, '墓': 13, '棺': 12, '葬': 12, '鎖': 18, '縛': 16, '罠': 11, '恐': 10,
            '脅': 10, '絶': 12, '終': 11, '喪': 12, '虚': 11, '空': 8, '虫': 6, '蜘': 14,
            '蛛': 12, '蠍': 19, '蟹': 19, '蛾': 15, '蝶': 15, '蜂': 13, '蟻': 19, '蛭': 12,
            '蚊': 10, '蠅': 18, '蝙': 15, '蟲': 18, '髑': 23, '髏': 22, '怪': 8, '妄': 6,
            '憑': 16, '鵺': 19, '魘': 23
        };

        // Return known stroke count if available
        if (knownStrokes[character]) {
            return knownStrokes[character];
        }

        // Fallback: estimate based on Unicode and complexity
        const code = character.charCodeAt(0);
        if (code < 0x5200) return 6;   // Simpler kanji
        if (code < 0x7000) return 9;   // Medium complexity
        if (code < 0x9000) return 12;  // More complex
        return 15; // Very complex kanji
    },

    // Complete the challenge and award XP
    completeChallenge: function (scene) {
        const totalStrokes = this.getStrokeCount(this.state.currentKanji.character);
        const correctStrokes = totalStrokes - this.state.missedStrokes;
        const accuracy = correctStrokes / totalStrokes;

        // Calculate XP reward (full level worth, scaled by accuracy)
        const fullLevelXP = xpForNextLevel(playerLevel);
        const xpReward = Math.ceil(fullLevelXP * accuracy);

        // Award XP
        heroExp += xpReward;
        GameUI.updateExpBar(scene);

        // Show completion message
        this.showCompletionMessage(scene, xpReward, accuracy);

        // Clean up after a delay
        setTimeout(() => {
            this.cleanup(scene);
        }, 3000);
    },

    // Show completion message
    showCompletionMessage: function (scene, xpReward, accuracy) {
        const centerX = game.config.width / 2;
        const centerY = game.config.height / 2;

        const accuracyPercent = Math.round(accuracy * 100);

        const message = scene.add.text(
            centerX,
            centerY + 150,
            `${accuracyPercent}% Accuracy!\n+${xpReward} XP`,
            {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#00ff00',
                fontStyle: 'bold',
                align: 'center'
            }
        ).setOrigin(0.5);

        message.setDepth(1502);

        // Animate the message
        scene.tweens.add({
            targets: message,
            scale: { from: 0.8, to: 1.2 },
            alpha: { from: 1, to: 0 },
            duration: 2500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                message.destroy();
            }
        });
    },

    // Clean up the challenge UI
    cleanup: function (scene) {
        // Destroy graphics
        if (this.elements.graphics) {
            this.elements.graphics.destroy();
            this.elements.graphics = null;
        }

        // Remove SVG overlay
        if (this.elements.svgOverlay) {
            this.elements.svgOverlay.remove();
            this.elements.svgOverlay = null;
        }

        // Destroy container and all children
        if (this.elements.container) {
            this.elements.container.destroy();
            this.elements.container = null;
        }

        // Clear elements
        this.elements = {
            container: null,
            background: null,
            borderRect: null,
            canvas: null,
            graphics: null,
            svgOverlay: null,
            infoText: null,
            strokeFeedback: null
        };

        // Reset state
        this.state.active = false;
        this.state.currentKanji = null;
        this.state.currentStroke = 0;
        this.state.strokeAttempts = 0;
        this.state.missedStrokes = 0;
        this.state.isDrawing = false;
        this.state.currentPath = [];
        this.state.completedStrokes = [];
        this.state.challengeComplete = false;
        this.state.kanjiBounds = null;

        // Resume game
        gamePaused = false;
        if (scene.physics) {
            scene.physics.resume();
        }

        console.log("Drawing challenge completed and cleaned up");
    },

    // Cleanup when game ends/restarts
    destroy: function () {
        if (this.challengeTimer) {
            this.challengeTimer.remove();
            this.challengeTimer = null;
        }

        if (this.elements.graphics) {
            this.elements.graphics.destroy();
        }

        if (this.elements.svgOverlay) {
            this.elements.svgOverlay.remove();
        }

        if (this.elements.container) {
            this.elements.container.destroy();
        }

        this.state.active = false;
        this.state.challengeComplete = false;
        this.state.kanjiBounds = null;
    }
};

// Make available globally
window.KanjiDrawingSystem = KanjiDrawingSystem;