// drawing.js - Kanji Drawing Challenge System

const KanjiDrawingSystem = {
    // UI elements
    elements: {
        container: null,
        background: null,
        borderRect: null,
        graphics: null,
        infoText: null,
        strokeFeedback: null
    },

    // Challenge state
    state: {
        active: false,
        currentKanji: null,
        currentStroke: 0,
        strokeAttempts: 0,
        missedStrokes: 0,
        isDrawing: false,
        currentPath: [],
        completedStrokes: [],
        challengeComplete: false,
        targetStrokePoints: []
    },

    // Configuration
    config: {
        challengeInterval: 1000,
        maxAttemptsPerStroke: 2,
        strokeMatchTolerance: 20,
        kanjiSize: 109
    },

    challengeTimer: null,

    init: function (scene) {
        if (!scene || !scene.add) return;
        this.startChallengeTimer(scene);
        console.log("Kanji Drawing System initialized");
    },

    startChallengeTimer: function (scene) {
        if (this.challengeTimer) {
            this.challengeTimer.remove();
        }
        this.challengeTimer = scene.time.addEvent({
            delay: this.config.challengeInterval,
            callback: () => {
                // Added extra check for gamePaused to prevent stacking
                if (!gameOver && !gamePaused && !window.levelUpInProgress && !this.state.active) {
                    this.startChallenge(scene);
                }
            },
            callbackScope: this,
            loop: true
        });
        registerTimer(this.challengeTimer);
    },

    startChallenge: function (scene) {
        if (this.state.active || gameOver || window.levelUpInProgress) return;

        // FIX: Use PauseSystem to stop Enemy Spawners and Timers
        if (window.PauseSystem) {
            PauseSystem.pauseGame();
        } else {
            // Fallback if PauseSystem missing (though you have it)
            gamePaused = true;
            if (scene.physics) scene.physics.pause();
        }

        this.state.currentKanji = getRandomKanji();

        // Reset State
        this.state.active = true;
        this.state.currentStroke = 0;
        this.state.strokeAttempts = 0;
        this.state.missedStrokes = 0;
        this.state.isDrawing = false;
        this.state.currentPath = [];
        this.state.completedStrokes = [];
        this.state.challengeComplete = false;

        this.state.targetStrokePoints = this.state.currentKanji.strokes.map(strokePath =>
            this.extractSVGPoints(strokePath)
        );

        this.createChallengeUI(scene);
        console.log(`Started drawing challenge for: ${this.state.currentKanji.character}`);
    },

    createChallengeUI: function (scene) {
        const centerX = game.config.width / 2;
        const centerY = game.config.height / 2;

        this.elements.container = scene.add.container(0, 0).setDepth(1500);

        const fullscreenBg = scene.add.rectangle(centerX, centerY, game.config.width, game.config.height, 0x000000, 0.8);
        this.elements.container.add(fullscreenBg);

        const panelWidth = Math.min(game.config.width * 0.9, 600);
        const panelHeight = Math.min(game.config.height * 0.9, 700);

        this.elements.background = scene.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x000000);
        this.elements.container.add(this.elements.background);

        this.elements.borderRect = scene.add.rectangle(centerX, centerY, panelWidth, panelHeight).setStrokeStyle(4, 0xFFD700);
        this.elements.container.add(this.elements.borderRect);

        const title = scene.add.text(centerX, centerY - panelHeight / 2 + 40, 'DRAW THE KANJI', {
            fontFamily: 'Arial', fontSize: '32px', color: '#FFD700', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.elements.container.add(title);

        this.elements.graphics = scene.add.graphics().setDepth(1501);
        this.elements.container.add(this.elements.graphics);

        this.renderScene(scene);

        const infoY = centerY + panelHeight / 2 - 60;
        const kanji = this.state.currentKanji;
        this.elements.infoText = scene.add.text(centerX, infoY,
            `${kanji.kana} (${kanji.romaji}) - ${kanji.english}`,
            { fontFamily: 'Arial', fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }
        ).setOrigin(0.5);
        this.elements.container.add(this.elements.infoText);

        this.elements.strokeFeedback = scene.add.text(centerX, infoY + 40, '',
            { fontFamily: 'Arial', fontSize: '20px', color: '#00ff00', fontStyle: 'bold' }
        ).setOrigin(0.5);
        this.elements.container.add(this.elements.strokeFeedback);

        const drawAreaSize = Math.min(panelWidth - 80, 400);
        const drawAreaTop = centerY - drawAreaSize / 2 - 30;

        const drawAreaBorder = scene.add.rectangle(centerX, drawAreaTop + drawAreaSize / 2, drawAreaSize, drawAreaSize).setStrokeStyle(2, 0x333333);
        this.elements.container.add(drawAreaBorder);

        this.setupInputHandlers(scene, centerX, drawAreaTop + drawAreaSize / 2, drawAreaSize);
    },

    setupInputHandlers: function (scene, centerX, centerY, drawAreaSize) {
        const halfSize = drawAreaSize / 2;
        const minX = centerX - halfSize;
        const maxX = centerX + halfSize;
        const minY = centerY - halfSize;
        const maxY = centerY + halfSize;

        scene.input.on('pointerdown', (pointer) => {
            if (!this.state.active) return;
            if (pointer.x >= minX && pointer.x <= maxX && pointer.y >= minY && pointer.y <= maxY) {
                this.state.isDrawing = true;
                this.state.currentPath = [{ x: pointer.x, y: pointer.y }];
            }
        });

        scene.input.on('pointermove', (pointer) => {
            if (!this.state.active || !this.state.isDrawing) return;
            this.state.currentPath.push({ x: pointer.x, y: pointer.y });
            this.renderScene(scene);
        });

        scene.input.on('pointerup', () => {
            if (!this.state.active || !this.state.isDrawing || this.state.challengeComplete) return;
            this.state.isDrawing = false;
            this.validateStroke(scene);
        });
    },

    renderScene: function (scene) {
        if (!this.elements.graphics || !this.elements.graphics.scene) return;

        const g = this.elements.graphics;
        g.clear();

        // 1. Draw Guides (Progressive System)
        if (this.state.targetStrokePoints && this.state.targetStrokePoints[this.state.currentStroke]) {
            const guidePoints = this.transformToScreen(this.state.targetStrokePoints[this.state.currentStroke]);

            if (guidePoints && guidePoints.length > 0) {
                // CONDITION: Show Gray Outline only after 2 attempts
                if (this.state.strokeAttempts >= 2) {
                    g.lineStyle(12, 0x444444, 0.5);
                    g.beginPath();
                    g.moveTo(guidePoints[0].x, guidePoints[0].y);
                    for (let i = 1; i < guidePoints.length; i++) {
                        g.lineTo(guidePoints[i].x, guidePoints[i].y);
                    }
                    g.strokePath();
                }

                // CONDITION: Show Start Dot if stroke 0 OR attempts >= 1
                if (this.state.currentStroke === 0 || this.state.strokeAttempts >= 1) {
                    g.fillStyle(0x00ff00, 0.8);
                    g.fillCircle(guidePoints[0].x, guidePoints[0].y, 8);
                }
            }
        }

        // 2. Draw Completed Strokes
        g.lineStyle(8, 0xffffff, 1);
        this.state.completedStrokes.forEach(stroke => {
            if (stroke.length < 2) return;
            g.beginPath();
            g.moveTo(stroke[0].x, stroke[0].y);
            for (let i = 1; i < stroke.length; i++) {
                g.lineTo(stroke[i].x, stroke[i].y);
            }
            g.strokePath();
        });

        // 3. Draw Current User Input
        if (this.state.currentPath.length > 1) {
            g.lineStyle(8, 0xFFD700, 1);
            g.beginPath();
            g.moveTo(this.state.currentPath[0].x, this.state.currentPath[0].y);
            for (let i = 1; i < this.state.currentPath.length; i++) {
                g.lineTo(this.state.currentPath[i].x, this.state.currentPath[i].y);
            }
            g.strokePath();
        }
    },

    validateStroke: function (scene) {
        if (this.state.currentPath.length < 2) {
            this.state.currentPath = [];
            this.renderScene(scene);
            return;
        }

        const rawTargetPoints = this.state.targetStrokePoints[this.state.currentStroke];
        if (!rawTargetPoints) {
            this.acceptStroke(scene);
            return;
        }

        const screenTargetPoints = this.transformToScreen(rawTargetPoints);
        const isValid = this.compareStrokes(this.state.currentPath, screenTargetPoints);

        if (isValid) {
            this.acceptStroke(scene);
        } else {
            this.rejectStroke(scene);
        }
    },

    transformToScreen: function (svgPoints) {
        if (!svgPoints) return [];

        const panelWidth = Math.min(game.config.width * 0.9, 600);
        const drawAreaSize = Math.min(panelWidth - 80, 400);
        const padding = 40;

        const centerX = game.config.width / 2;
        const centerY = game.config.height / 2 - 30;

        const scale = (drawAreaSize - padding * 2) / this.config.kanjiSize;
        const startX = centerX - (this.config.kanjiSize * scale) / 2;
        const startY = centerY - (this.config.kanjiSize * scale) / 2;

        return svgPoints.map(p => ({
            x: startX + (p.x * scale),
            y: startY + (p.y * scale)
        }));
    },

    getPathLength: function (path) {
        let len = 0;
        for (let i = 1; i < path.length; i++) {
            len += Phaser.Math.Distance.BetweenPoints(path[i - 1], path[i]);
        }
        return len;
    },

    compareStrokes: function (drawn, target) {
        if (drawn.length < 2 || target.length < 2) return false;

        const drawnLen = this.getPathLength(drawn);
        const targetLen = this.getPathLength(target);
        const lengthRatio = drawnLen / targetLen;

        if (lengthRatio < 0.5 || lengthRatio > 1.5) {
            console.log(`Stroke Failed: Length Mismatch. Ratio: ${lengthRatio.toFixed(2)}`);
            return false;
        }

        let totalDeviation = 0;
        let maxDeviation = 0;
        const sampleRate = Math.max(1, Math.floor(drawn.length / 15));
        let samples = 0;

        for (let i = 0; i < drawn.length; i += sampleRate) {
            const result = this.closestPointOnPath(drawn[i], target);
            totalDeviation += result.distance;
            maxDeviation = Math.max(maxDeviation, result.distance);
            samples++;
        }

        const averageDeviation = totalDeviation / samples;

        const drawnStart = drawn[0];
        const drawnEnd = drawn[drawn.length - 1];
        const targetStart = target[0];
        const targetEnd = target[target.length - 1];

        const startDist = Phaser.Math.Distance.BetweenPoints(drawnStart, targetStart);
        const endDist = Phaser.Math.Distance.BetweenPoints(drawnEnd, targetEnd);
        const endpointError = Math.max(startDist, endDist);

        const corridorTolerance = 20;
        const endpointTolerance = 30;
        const hardMaxDeviation = 50;

        const isValid = (
            averageDeviation < corridorTolerance &&
            endpointError < endpointTolerance &&
            maxDeviation < hardMaxDeviation
        );

        console.log(`Stroke Check: AvgDev=${Math.round(averageDeviation)}, MaxDev=${Math.round(maxDeviation)}, EndErr=${Math.round(endpointError)} -> ${isValid ? "PASS" : "FAIL"}`);

        return isValid;
    },

    closestPointOnPath: function (point, path) {
        let minDist = Infinity;
        let closestPoint = path[0];

        for (let i = 0; i < path.length; i++) {
            const dist = Phaser.Math.Distance.BetweenPoints(point, path[i]);
            if (dist < minDist) {
                minDist = dist;
                closestPoint = path[i];
            }
        }
        return { point: closestPoint, distance: minDist };
    },

    acceptStroke: function (scene) {
        const perfectStroke = this.transformToScreen(this.state.targetStrokePoints[this.state.currentStroke]);
        this.state.completedStrokes.push(perfectStroke);

        this.state.currentPath = [];
        this.state.currentStroke++;
        this.state.strokeAttempts = 0;

        this.showStrokeFeedback('Correct!', '#00ff00');
        this.renderScene(scene);

        const totalStrokes = this.state.currentKanji.strokes.length;

        if (this.state.currentStroke >= totalStrokes) {
            this.state.challengeComplete = true;
            setTimeout(() => {
                this.completeChallenge(scene);
            }, 200);
        }
    },

    rejectStroke: function (scene) {
        if (!this.elements.graphics) return;

        const g = this.elements.graphics;
        g.lineStyle(8, 0xff0000, 1);
        g.beginPath();
        g.moveTo(this.state.currentPath[0].x, this.state.currentPath[0].y);
        for (let i = 1; i < this.state.currentPath.length; i++) {
            g.lineTo(this.state.currentPath[i].x, this.state.currentPath[i].y);
        }
        g.strokePath();

        this.state.currentPath = [];
        this.state.strokeAttempts++;

        setTimeout(() => {
            this.renderScene(scene);
        }, 300);

        if (this.state.strokeAttempts === 1) {
            this.showStrokeFeedback('Start at the green dot', '#ffff00');
        } else if (this.state.strokeAttempts === 2) {
            this.showStrokeFeedback('Guide added', '#ffff00');
            this.state.missedStrokes++;
        } else {
            this.showStrokeFeedback('Try again!', '#ffaa00');
        }
    },

    extractSVGPoints: function (pathString) {
        if (!pathString) return [];
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathString);

        const totalLength = path.getTotalLength();
        const points = [];
        const step = 5;

        for (let i = 0; i <= totalLength; i += step) {
            const pt = path.getPointAtLength(i);
            points.push({ x: pt.x, y: pt.y });
        }

        const endPt = path.getPointAtLength(totalLength);
        points.push({ x: endPt.x, y: endPt.y });

        return points;
    },

    showStrokeFeedback: function (message, color) {
        if (!this.elements.strokeFeedback) return;
        this.elements.strokeFeedback.setText(message);
        this.elements.strokeFeedback.setColor(color);
        if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
        this.feedbackTimer = setTimeout(() => {
            if (this.elements.strokeFeedback && this.elements.strokeFeedback.active) {
                this.elements.strokeFeedback.setText('');
            }
        }, 1500);
    },

    completeChallenge: function (scene) {
        const totalStrokes = this.state.currentKanji.strokes.length;
        const correctStrokes = totalStrokes - this.state.missedStrokes;
        const accuracy = Math.max(0, correctStrokes / totalStrokes);

        const xpReward = Math.ceil(xpForNextLevel(playerLevel) * (0.5 + (accuracy * 0.5)));

        heroExp += xpReward;
        GameUI.updateExpBar(scene);
        this.showCompletionMessage(scene, xpReward, accuracy);

        setTimeout(() => {
            this.cleanup(scene);
        }, 2500);
    },

    showCompletionMessage: function (scene, xpReward, accuracy) {
        const centerX = game.config.width / 2;
        const centerY = game.config.height / 2;
        const accPct = Math.round(accuracy * 100);

        const msg = scene.add.text(centerX, centerY,
            `EXCELLENT!\nAccuracy: ${accPct}%\n+${xpReward} XP`,
            { fontFamily: 'Arial', fontSize: '40px', color: '#00ff00', fontStyle: 'bold', align: 'center', stroke: '#000000', strokeThickness: 4 }
        ).setOrigin(0.5).setDepth(1502);

        scene.tweens.add({
            targets: msg,
            scale: { from: 0.5, to: 1.2 },
            duration: 400,
            yoyo: true,
            hold: 1000,
            onComplete: () => msg.destroy()
        });
    },

    cleanup: function (scene) {
        if (this.elements.graphics) {
            this.elements.graphics.destroy();
            this.elements.graphics = null;
        }

        if (this.elements.container) {
            this.elements.container.destroy();
            this.elements.container = null;
        }

        this.elements = { container: null, background: null, borderRect: null, graphics: null, infoText: null, strokeFeedback: null };

        this.state.active = false;
        this.state.challengeComplete = false;

        // FIX: Use PauseSystem to Resume Game Logic (Resumes physics and timers)
        if (window.PauseSystem) {
            PauseSystem.resumeGame();
        } else {
            // Fallback
            gamePaused = false;
            if (scene && scene.physics) {
                scene.physics.resume();
            }
        }
    },

    destroy: function () {
        if (this.challengeTimer) this.challengeTimer.remove();
        this.cleanup(null);
    }
};

window.KanjiDrawingSystem = KanjiDrawingSystem;