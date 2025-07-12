// automataCore.js - Enhanced AI with improved learning and decision making

/**
 * ENHANCED AI CONTROLLER - Better movement, rewards, and perk selection
 */
class EnhancedGameAIController {
    constructor() {
        this.enabled = false;
        this.tfLoaded = false;
        this.agent = null;
        this.gameState = null;

        // Control state
        this.aiActive = false;
        this.learningActive = false;

        // Enhanced training data
        this.trainingData = [];
        this.currentSession = [];
        this.rewardHistory = [];

        // Enhanced movement state
        this.currentDirection = 0;
        this.lastDecisionTime = 0;
        this.keysPressed = new Set();
        this.moveHistory = [];
        this.lastValidPositions = [];

        // Improved stuck detection
        this.lastPosition = { x: 0, y: 0, time: 0 };
        this.stuckCheckInterval = 1000; // Check more frequently
        this.stuckThreshold = 15; // Slightly more lenient
        this.isReallyStuck = false;
        this.stuckCounter = 0;

        // Performance monitoring
        this.lastActionTime = 0;
        this.actionCount = 0;
        this.lastPlayerRecordTime = 0;
        this.survivalTime = 0;
        this.lastSurvivalRewardTime = 0;

        // Enhanced game state tracking
        this.lastPlayerHealth = null;
        this.lastScore = 0;
        this.gameStartTime = null;
        this.maxSurvivalTime = 0;
        this.deathCauses = [];

        // Level up handling (unchanged)
        this.gameOverHandled = false;
        this.levelUpHandled = false;
        this.levelUpStartTime = null;
        this.perkScrollPhase = null;
        this.perksViewed = 0;

        // Perk selection system
        this.perkPreferences = new Map();
        this.perkPerformanceHistory = [];

        // Auto-loading
        this.autoLoadAttempted = false;

        // Enhanced training tracking
        this.lossHistory = [];
        this.rewardStats = { total: 0, positive: 0, negative: 0, count: 0 };

        console.log("🚀 Enhanced GameAI Controller - Better learning, movement, and perk selection");
    }

    async initialize(scene) {
        if (this.enabled) return true;

        try {
            console.log("🔄 Loading focused AI systems...");

            if (!window.tf) {
                console.log("📥 Loading TensorFlow.js...");
                await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0/dist/tf.min.js');
                console.log("✅ TensorFlow.js loaded");
            }

            this.tfLoaded = true;
            this.scene = scene;

            this.gameState = new EnhancedGameStateExtractor();
            this.gameState.initialize(scene);

            const stateSize = this.gameState.getStateSize();
            const actionSize = 9;

            this.agent = new SmartSurvivalAgent(stateSize, actionSize);

            this.enabled = true;
            console.log("✅ Focused AI systems initialized successfully");

            await this.attemptAutoLoad();
            this.createEnhancedAIInterface();

            return true;

        } catch (error) {
            console.error("❌ Failed to initialize focused AI:", error);
            alert("Failed to load AI systems: " + error.message);
            return false;
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load ' + src));
            document.head.appendChild(script);
        });
    }

    async attemptAutoLoad() {
        if (this.autoLoadAttempted) return;
        this.autoLoadAttempted = true;

        try {
            const autoSaveSuccess = await this.agent.loadModel('focused-automata-autosave');
            if (autoSaveSuccess) {
                console.log("🔄 Auto-loaded focused AI training");
                return;
            }
            console.log("📝 No previous focused AI training found - starting fresh");
        } catch (error) {
            console.log("📝 Starting with fresh focused AI model");
        }
    }

    update() {
        if (!this.enabled || !this.agent) return;

        this.updateSurvivalTime();
        this.updateStuckDetection();
        this.updateMoveHistory();

        if (this.aiActive) {
            this.makeEnhancedAIDecision();
        }

        if (this.learningActive && !this.aiActive) {
            this.recordPlayerAction();
        }

        this.updateGameStateTracking();

        if (this.isGameOver() && !this.gameOverHandled) {
            this.handleGameOver();
        }

        this.updateInterface();
    }

    updateSurvivalTime() {
        if (!this.gameStartTime || this.isGameOver()) return;

        this.survivalTime = (Date.now() - this.gameStartTime) / 1000;
        this.maxSurvivalTime = Math.max(this.maxSurvivalTime, this.survivalTime);
    }

    updateGameStateTracking() {
        if (!this.gameStartTime && !this.isGameOver()) {
            this.gameStartTime = Date.now();
        }

        if (this.gameStartTime && this.isGameOver()) {
            this.gameStartTime = null;
        }
    }

    updateMoveHistory() {
        const gamePlayer = window.player || player;
        if (!gamePlayer) return;

        const now = Date.now();
        this.moveHistory.push({
            x: gamePlayer.x,
            y: gamePlayer.y,
            time: now,
            direction: this.currentDirection
        });

        // Keep only last 10 moves
        if (this.moveHistory.length > 10) {
            this.moveHistory.shift();
        }

        // Track valid positions (not near boundaries)
        const normalizedX = gamePlayer.x / (this.scene?.game?.config?.width || 1200);
        const normalizedY = gamePlayer.y / (this.scene?.game?.config?.height || 800);

        if (normalizedX > 0.3 && normalizedX < 0.7 && normalizedY > 0.3 && normalizedY < 0.7) {
            this.lastValidPositions.push({ x: gamePlayer.x, y: gamePlayer.y, time: now });
            if (this.lastValidPositions.length > 5) {
                this.lastValidPositions.shift();
            }
        }
    }

    updateStuckDetection() {
        const gamePlayer = window.player || player;
        if (!gamePlayer) return;

        const now = Date.now();

        if (now - this.lastPosition.time >= this.stuckCheckInterval) {
            const distance = Math.sqrt(
                Math.pow(gamePlayer.x - this.lastPosition.x, 2) +
                Math.pow(gamePlayer.y - this.lastPosition.y, 2)
            );

            const wasStuck = this.isReallyStuck;
            this.isReallyStuck = distance < this.stuckThreshold && this.currentDirection !== 0;

            if (this.isReallyStuck) {
                this.stuckCounter++;
                if (!wasStuck) {
                    console.log("🆘 AI: Stuck detected, counter:", this.stuckCounter);
                }
            } else {
                this.stuckCounter = 0;
            }

            this.lastPosition = { x: gamePlayer.x, y: gamePlayer.y, time: now };
        }
    }

    async makeEnhancedAIDecision() {
        const now = Date.now();
        if (now - this.lastDecisionTime < 100) return; // Faster decisions (100ms)

        try {
            const state = this.gameState.getState();
            if (!state) return;

            // Handle special states first
            if (this.isLevelUpActive()) {
                this.releaseAllMovementKeys();
                this.currentDirection = 0;
                this.handleLevelUp();
                return;
            }

            if (this.isGameOver()) {
                this.handleGameOver();
                return;
            }

            let newDirection;

            // Enhanced stuck handling
            if (this.isReallyStuck || this.stuckCounter > 3) {
                newDirection = this.getEnhancedUnstuckAction(state);
                this.isReallyStuck = false;
                this.stuckCounter = 0;
                console.log("🆘 AI: Enhanced unstuck action");
            } else {
                newDirection = await this.agent.chooseAction(state);
            }

            if (newDirection !== this.currentDirection) {
                this.changeDirection(newDirection);
                this.currentDirection = newDirection;

                if (this.learningActive) {
                    this.recordEnhancedAIAction(state, newDirection);
                }
            }

            this.lastDecisionTime = now;
            this.actionCount++;

        } catch (error) {
            console.error("Focused AI decision error:", error);
        }
    }

    getEnhancedUnstuckAction(state) {
        const gamePlayer = window.player || player;
        if (!gamePlayer) return 0;

        // Try to move towards a recent valid position
        if (this.lastValidPositions.length > 0) {
            const target = this.lastValidPositions[this.lastValidPositions.length - 1];
            const deltaX = target.x - gamePlayer.x;
            const deltaY = target.y - gamePlayer.y;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                return deltaX > 0 ? 3 : 7; // Right or Left
            } else {
                return deltaY > 0 ? 5 : 1; // Down or Up
            }
        }

        // Fallback: move towards center with some randomness
        const gameWidth = this.scene?.game?.config?.width || 1200;
        const gameHeight = this.scene?.game?.config?.height || 800;

        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;

        const deltaX = centerX - gamePlayer.x;
        const deltaY = centerY - gamePlayer.y;

        // Add randomness to avoid repeated patterns
        const randomOffset = (Math.random() - 0.5) * 100;

        if (Math.abs(deltaX + randomOffset) > Math.abs(deltaY)) {
            return deltaX > 0 ? 3 : 7;
        } else {
            return deltaY > 0 ? 5 : 1;
        }
    }

    recordEnhancedAIAction(state, action) {
        if (!this.learningActive) return;

        const experience = {
            state: state.slice(),
            action: action,
            timestamp: Date.now(),
            source: 'ai',
            survivalTime: this.survivalTime,
            playerHealth: window.playerHealth || playerHealth || 100
        };

        this.currentSession.push(experience);
        this.updateEnhancedRewards(state);
    }

    updateEnhancedRewards(state) {
        const currentPlayerHealth = window.playerHealth || playerHealth || 100;
        const currentScore = window.score || score || 0;
        const now = Date.now();

        if (this.lastPlayerHealth === null) {
            this.lastPlayerHealth = currentPlayerHealth;
            this.lastScore = currentScore;
            this.lastSurvivalRewardTime = now;
            return;
        }

        let reward = 0;
        let rewardBreakdown = {};

        // 1. SURVIVAL REWARDS (every second)
        const timeSinceLastReward = (now - this.lastSurvivalRewardTime) / 1000;
        if (timeSinceLastReward >= 1.0) {
            const survivalReward = 0.5; // Substantial survival reward
            reward += survivalReward;
            rewardBreakdown.survival = survivalReward;
            this.lastSurvivalRewardTime = now;
        }

        // 2. HEALTH PENALTIES (severe)
        if (currentPlayerHealth < this.lastPlayerHealth) {
            const damage = this.lastPlayerHealth - currentPlayerHealth;
            const healthPenalty = damage * 20.0; // Very high penalty for taking damage
            reward -= healthPenalty;
            rewardBreakdown.healthPenalty = -healthPenalty;
        }

        // 3. KILL REWARDS
        if (currentScore > this.lastScore) {
            const kills = currentScore - this.lastScore;
            const killReward = kills * 2.0;
            reward += killReward;
            rewardBreakdown.kills = killReward;
        }

        // 4. SIMPLIFIED BOUNDARY PENALTIES (most important)
        const playerX = state[0];
        const playerY = state[1];

        // Simple boundary calculation
        const leftDist = playerX;
        const rightDist = 1 - playerX;
        const topDist = playerY;
        const bottomDist = 1 - playerY;
        const minBoundaryDist = Math.min(leftDist, rightDist, topDist, bottomDist);

        // MASSIVE boundary penalty
        if (minBoundaryDist < 0.15) {
            const boundaryPenalty = Math.pow((0.15 - minBoundaryDist) / 0.15, 2) * 50; // Up to -50 reward
            reward -= boundaryPenalty;
            rewardBreakdown.boundary = -boundaryPenalty;
        }

        // Corner penalty (even worse)
        const inTopLeftCorner = (leftDist < 0.25 && topDist < 0.25);
        const inTopRightCorner = (rightDist < 0.25 && topDist < 0.25);
        const inBottomLeftCorner = (leftDist < 0.25 && bottomDist < 0.25);
        const inBottomRightCorner = (rightDist < 0.25 && bottomDist < 0.25);
        const inAnyCorner = inTopLeftCorner || inTopRightCorner || inBottomLeftCorner || inBottomRightCorner;

        if (inAnyCorner) {
            const cornerPenalty = 100; // MASSIVE corner penalty
            reward -= cornerPenalty;
            rewardBreakdown.corner = -cornerPenalty;
        }

        // 5. Movement reward (encourage movement)
        if (this.currentDirection !== 0) {
            const movementReward = 0.1;
            reward += movementReward;
            rewardBreakdown.movement = movementReward;
        }

        // Track reward statistics
        this.rewardStats.total += reward;
        this.rewardStats.count++;
        if (reward > 0) this.rewardStats.positive++;
        if (reward < 0) this.rewardStats.negative++;

        // Log significant rewards with breakdown
        if (Math.abs(reward) > 1.0 || this.actionCount % 200 === 0) {
            const breakdown = Object.entries(rewardBreakdown)
                .map(([key, value]) => `${key}:${value.toFixed(1)}`)
                .join(' ');
            console.log(`🎯 AI: Reward: ${reward.toFixed(2)} | ${breakdown} | Pos:${this.rewardStats.positive} Neg:${this.rewardStats.negative}`);
        }

        // Store reward with experience
        if (this.currentSession.length > 0 && Math.abs(reward) > 0.01) {
            const lastExp = this.currentSession[this.currentSession.length - 1];
            if (lastExp && lastExp.source === 'ai') {
                this.agent.remember(lastExp.state, lastExp.action, reward, state, false);
            }
        }

        this.lastPlayerHealth = currentPlayerHealth;
        this.lastScore = currentScore;
    }

    // Level up and game over handling remain the same
    isLevelUpActive() {
        const scene = this.scene;
        const checks = {
            windowLevelUpInProgress: window.levelUpInProgress,
            globalLevelUpInProgress: (typeof levelUpInProgress !== 'undefined') ? levelUpInProgress : undefined,
            windowLevelUpCards: window.levelUpCards,
            globalLevelUpCards: (typeof levelUpCards !== 'undefined') ? levelUpCards : undefined,
            windowGamePaused: window.gamePaused,
            globalGamePaused: (typeof gamePaused !== 'undefined') ? gamePaused : undefined,
            hasLevelUpUI: this.detectLevelUpUI(),
            physicsActive: scene?.physics?.world?.enabled,
        };

        const isLevelUp = checks.hasLevelUpUI ||
            checks.windowLevelUpInProgress ||
            checks.globalLevelUpInProgress ||
            (checks.windowLevelUpCards && checks.windowLevelUpCards.length > 0) ||
            (checks.globalLevelUpCards && checks.globalLevelUpCards.length > 0) ||
            ((checks.windowGamePaused || checks.globalGamePaused) && checks.hasLevelUpUI);

        if (isLevelUp && !this.levelUpStartTime) {
            console.log("🎓 AI: Level up detected - analyzing perks");
        }

        return isLevelUp;
    }

    detectLevelUpUI() {
        const levelUpTexts = ['LEVEL UP', 'CHOOSE A PERK', 'TYPE ROMAJI', 'Tap arrows to see perks', 'MY PERKS'];
        const allElements = document.querySelectorAll('*');

        for (const el of allElements) {
            const text = el.textContent || '';
            const style = window.getComputedStyle(el);
            const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';

            if (isVisible && levelUpTexts.some(levelText => text.includes(levelText))) {
                return true;
            }
        }
        return false;
    }

    handleLevelUp() {
        if (!this.levelUpStartTime) {
            this.levelUpStartTime = Date.now();
            this.levelUpHandled = false;
            this.perkScrollPhase = 'browsing';
            this.perksViewed = 0;
            console.log("🎓 AI: Level up started - analyzing available perks");
        }

        if (this.levelUpHandled) return;

        const elapsed = Date.now() - this.levelUpStartTime;
        if (elapsed < 1000) return;

        if (this.perkScrollPhase === 'browsing') {
            if (this.perksViewed < 4) {
                this.navigateToNextPerk();
                this.perksViewed++;
                return;
            } else {
                console.log("🎓 AI: Finished browsing, selecting optimal perk");
                this.perkScrollPhase = 'selecting';
                return;
            }
        }

        if (this.perkScrollPhase === 'selecting') {
            const perkSelected = this.selectOptimalPerk();

            if (perkSelected) {
                this.levelUpHandled = true;
                this.levelUpStartTime = null;
                this.perkScrollPhase = null;
                console.log("🎓 AI: Optimal perk selected");
            } else if (elapsed > 15000) {
                console.log("🎓 AI: Perk selection timeout");
                this.emergencyLevelUpExit();
                this.levelUpHandled = true;
                this.levelUpStartTime = null;
                this.perkScrollPhase = null;
            }
        }
    }

    selectOptimalPerk() {
        // Enhanced perk selection logic
        console.log("🧠 AI: Analyzing perk options for optimal selection");

        const currentHealth = window.playerHealth || playerHealth || 100;
        const maxHealth = window.maxPlayerHealth || maxPlayerHealth || 100;
        const currentDamage = window.playerDamage || playerDamage || 10;
        const currentSpeed = window.playerSpeed || playerSpeed || 8;

        // Priority based on current state
        let perkPriority = [];

        if (currentHealth < maxHealth * 0.5) {
            perkPriority = ['health', 'defense', 'speed', 'damage'];
        } else if (this.survivalTime > 300) { // 5+ minutes - focus on damage
            perkPriority = ['damage', 'speed', 'health', 'defense'];
        } else { // Early game - focus on survival
            perkPriority = ['speed', 'health', 'damage', 'defense'];
        }

        console.log(`🎯 AI: Perk priority for this situation: ${perkPriority.join(' > ')}`);

        // For now, just click center (first perk shown)
        // In a full implementation, we'd analyze actual perk text/effects
        return this.selectPerkByCalculatedPosition();
    }

    navigateToNextPerk() {
        const gameWidth = window.game?.config?.width || 1200;
        const gameHeight = window.game?.config?.height || 800;
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;
        const kajisuliMode = (typeof KAJISULI_MODE !== 'undefined') ? KAJISULI_MODE : false;
        const arrowDistance = kajisuliMode ? gameWidth * 0.32 : gameWidth * 0.16;
        const rightArrowX = centerX + arrowDistance;
        const rightArrowY = centerY;

        this.clickAtGamePosition(rightArrowX, rightArrowY);
    }

    selectPerkByCalculatedPosition() {
        const gameWidth = window.game?.config?.width || 1200;
        const gameHeight = window.game?.config?.height || 800;
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;

        this.clickAtGamePosition(centerX, centerY);
        return true;
    }

    clickAtGamePosition(gameX, gameY) {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const gameWidth = window.game?.config?.width || 1200;
        const gameHeight = window.game?.config?.height || 800;
        const canvasX = rect.left + (gameX / gameWidth) * rect.width;
        const canvasY = rect.top + (gameY / gameHeight) * rect.height;

        const events = [
            new MouseEvent('mousedown', { bubbles: true, clientX: canvasX, clientY: canvasY }),
            new MouseEvent('mouseup', { bubbles: true, clientX: canvasX, clientY: canvasY }),
            new MouseEvent('click', { bubbles: true, clientX: canvasX, clientY: canvasY }),
            new PointerEvent('pointerdown', { bubbles: true, clientX: canvasX, clientY: canvasY, pointerId: 1 }),
            new PointerEvent('pointerup', { bubbles: true, clientX: canvasX, clientY: canvasY, pointerId: 1 })
        ];

        events.forEach((event, index) => {
            setTimeout(() => canvas.dispatchEvent(event), index * 50);
        });
    }

    emergencyLevelUpExit() {
        const gameWidth = window.game?.config?.width || 1200;
        const gameHeight = window.game?.config?.height || 800;
        this.clickAtGamePosition(gameWidth / 2, gameHeight / 2);
        setTimeout(() => this.simulateKeyPress('Enter'), 200);
    }

    // Game over handling (unchanged)
    isGameOver() {
        return window.gameOver ?? (typeof gameOver !== 'undefined' ? gameOver : false);
    }

    handleGameOver() {
        if (this.gameOverHandled) return;
        this.gameOverHandled = true;

        // Record death cause for analysis
        const deathAnalysis = {
            survivalTime: this.survivalTime,
            finalScore: window.score || score || 0,
            finalHealth: window.playerHealth || playerHealth || 0,
            stuckCount: this.stuckCounter,
            boundaryDeaths: this.rewardStats.negative > this.rewardStats.positive * 2
        };

        this.deathCauses.push(deathAnalysis);
        console.log("💀 AI: Death analysis:", deathAnalysis);

        setTimeout(() => this.attemptGameRestart(), 2000);
    }

    attemptGameRestart() {
        console.log("🔄 AI: Attempting to restart game...");

        const allElements = document.querySelectorAll('*');
        for (const element of allElements) {
            const text = element.textContent || '';
            if (text.includes('RESTART THE LOOP') || text.includes('RESTART')) {
                const style = window.getComputedStyle(element);
                const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
                if (isVisible) {
                    this.clickElement(element);
                    this.resetGameOverState();
                    return;
                }
            }
        }

        if (this.scene && typeof startGame === 'function') {
            try {
                startGame.call(this.scene);
                this.resetGameOverState();
                return;
            } catch (error) {
                console.log("🔄 AI: Error calling startGame:", error);
            }
        }

        this.simulateKeyPress('Enter');
        setTimeout(() => this.clickCenter(), 500);
        this.resetGameOverState();
    }

    resetGameOverState() {
        setTimeout(() => {
            this.gameOverHandled = false;
            this.levelUpHandled = false;
            this.lastPlayerHealth = null;
            this.lastScore = 0;
            this.gameStartTime = Date.now();
            this.survivalTime = 0;
            this.isReallyStuck = false;
            this.stuckCounter = 0;
            this.moveHistory = [];
            this.lastValidPositions = [];
            this.rewardStats = { total: 0, positive: 0, negative: 0, count: 0 };
            console.log("🔄 AI: Ready for new focused game session");
        }, 1000);
    }

    // Player action recording (unchanged but with enhanced rewards)
    recordPlayerAction() {
        if (!this.learningActive || this.aiActive) return;

        const now = Date.now();
        if (!this.lastPlayerRecordTime) this.lastPlayerRecordTime = now;
        if (now - this.lastPlayerRecordTime < 100) return; // Match AI frequency
        this.lastPlayerRecordTime = now;

        try {
            const state = this.gameState.getState();
            const action = this.getPlayerAction();

            if (state && action !== null) {
                const experience = {
                    state: state.slice(),
                    action: action,
                    timestamp: Date.now(),
                    source: 'player',
                    survivalTime: this.survivalTime
                };

                this.currentSession.push(experience);

                if (this.currentSession.length % 50 === 0) {
                    console.log(`📚 AI: Recorded ${this.currentSession.length} player actions`);
                }
            }
        } catch (error) {
            console.error("Recording error:", error);
        }
    }

    getPlayerAction() {
        const gamePlayer = window.player || player;
        const velocity = gamePlayer?.body?.velocity;
        if (!velocity) return 0;

        const vx = Math.sign(velocity.x);
        const vy = Math.sign(velocity.y);

        if (vx === 0 && vy === 0) return 0;
        if (vx === 0 && vy === -1) return 1;
        if (vx === 1 && vy === -1) return 2;
        if (vx === 1 && vy === 0) return 3;
        if (vx === 1 && vy === 1) return 4;
        if (vx === 0 && vy === 1) return 5;
        if (vx === -1 && vy === 1) return 6;
        if (vx === -1 && vy === 0) return 7;
        if (vx === -1 && vy === -1) return 8;

        return 0;
    }

    // Movement control (unchanged)
    changeDirection(actionIndex) {
        const actionMap = [
            { keys: [] },
            { keys: ['up'] },
            { keys: ['up', 'right'] },
            { keys: ['right'] },
            { keys: ['down', 'right'] },
            { keys: ['down'] },
            { keys: ['down', 'left'] },
            { keys: ['left'] },
            { keys: ['up', 'left'] }
        ];

        const action = actionMap[actionIndex];
        if (action) {
            this.releaseAllMovementKeys();
            if (action.keys.length > 0) {
                this.pressMovementKeys(action.keys);
            }
        }
    }

    pressMovementKeys(directions) {
        const inputSystem = window.InputSystem;
        if (!inputSystem?.keyboard?.cursors || !inputSystem?.keyboard?.wasdKeys) return;

        directions.forEach(direction => {
            let keys = [];
            switch (direction) {
                case 'up':
                    keys = [inputSystem.keyboard.cursors.up, inputSystem.keyboard.wasdKeys.up];
                    break;
                case 'down':
                    keys = [inputSystem.keyboard.cursors.down, inputSystem.keyboard.wasdKeys.down];
                    break;
                case 'left':
                    keys = [inputSystem.keyboard.cursors.left, inputSystem.keyboard.wasdKeys.left];
                    break;
                case 'right':
                    keys = [inputSystem.keyboard.cursors.right, inputSystem.keyboard.wasdKeys.right];
                    break;
            }

            keys.forEach(key => {
                if (key) {
                    key.isDown = true;
                    key.isUp = false;
                    this.keysPressed.add(key);
                }
            });
        });
    }

    releaseAllMovementKeys() {
        this.keysPressed.forEach(key => {
            if (key) {
                key.isDown = false;
                key.isUp = true;
            }
        });
        this.keysPressed.clear();
    }

    // Utility methods (unchanged)
    clickElement(element) {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const events = [
            new MouseEvent('mousedown', { bubbles: true, clientX: centerX, clientY: centerY }),
            new MouseEvent('mouseup', { bubbles: true, clientX: centerX, clientY: centerY }),
            new MouseEvent('click', { bubbles: true, clientX: centerX, clientY: centerY })
        ];

        events.forEach((event, index) => {
            setTimeout(() => element.dispatchEvent(event), index * 50);
        });
    }

    clickCenter() {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const clickEvent = new MouseEvent('click', { bubbles: true, clientX: centerX, clientY: centerY });
            canvas.dispatchEvent(clickEvent);
        }
    }

    simulateKeyPress(key) {
        const downEvent = new KeyboardEvent('keydown', { key, bubbles: true });
        const upEvent = new KeyboardEvent('keyup', { key, bubbles: true });
        document.dispatchEvent(downEvent);
        setTimeout(() => document.dispatchEvent(upEvent), 100);
    }

    // Session processing with enhanced feedback
    async processSession() {
        if (this.currentSession.length < 10) { // Lower threshold for faster training
            console.log(`📊 SESSION TOO SHORT: ${this.currentSession.length} actions (need 10+ to process)`);
            return;
        }

        try {
            console.log(`🧠 PROCESSING FOCUSED SESSION: ${this.currentSession.length} actions`);

            for (let i = 0; i < this.currentSession.length - 1; i++) {
                const experience = this.currentSession[i];
                const nextState = this.currentSession[i + 1].state;

                // Simple base reward for survival
                let reward = 0.1;

                // Bonus for longer sessions
                if (experience.survivalTime > 30) {
                    reward += Math.min(experience.survivalTime / 60, 2.0); // Up to +2 for 60+ seconds
                }

                this.agent.remember(experience.state, experience.action, reward, nextState, false);
            }

            if (this.agent.memory.length >= 32) { // Lower threshold
                const loss = await this.agent.replay();

                if (loss !== null && loss !== undefined) {
                    console.log(`🔥 FOCUSED TRAINING LOSS: ${loss.toFixed(6)} | Memory: ${this.agent.memory.length} | Epsilon: ${this.agent.config.epsilon.toFixed(3)}`);

                    this.lossHistory.push(loss);
                    if (this.lossHistory.length > 10) this.lossHistory.shift(); // Shorter history

                    if (this.lossHistory.length >= 3) {
                        const recent = this.lossHistory.slice(-3);
                        const trend = recent[2] < recent[0] ? "📉 IMPROVING" : "📈 INCREASING";
                        console.log(`🔥 LOSS TREND: ${trend} | Recent: [${recent.map(l => l.toFixed(4)).join(', ')}]`);
                    }
                }
            } else {
                console.log(`📊 NEED MORE DATA: ${this.agent.memory.length}/32 experiences`);
            }

            this.currentSession = [];

        } catch (error) {
            console.error("🔥 FOCUSED TRAINING ERROR:", error);
        }
    }

    // Control methods
    toggleAIControl() {
        if (!this.enabled) {
            alert("AI not initialized. Click 'Enable AI' first.");
            return;
        }

        this.aiActive = !this.aiActive;

        if (this.aiActive) {
            console.log("🤖 Focused AI taking control");
            this.showAIIndicator();
            this.currentDirection = 0;
            this.gameOverHandled = false;
            this.levelUpHandled = false;
            this.gameStartTime = Date.now();
            this.survivalTime = 0;
        } else {
            console.log("🎮 Player control restored");
            this.hideAIIndicator();
            this.releaseAllMovementKeys();
        }
    }

    toggleLearning() {
        if (!this.enabled) {
            alert("AI not initialized. Click 'Enable AI' first.");
            return;
        }

        this.learningActive = !this.learningActive;

        if (this.learningActive) {
            console.log("📚 Focused AI learning ENABLED");
            this.currentSession = [];
            this.rewardStats = { total: 0, positive: 0, negative: 0, count: 0 };
        } else {
            console.log("📚 Focused AI learning DISABLED");
            if (this.currentSession.length > 0) {
                this.processSession();
            }
        }
    }

    showAIIndicator() {
        const existing = document.getElementById('ai-active-indicator');
        if (existing) existing.remove();

        const indicator = document.createElement('div');
        indicator.id = 'ai-active-indicator';
        indicator.style.cssText = `
            position: fixed; bottom: 20px; right: 100px;
            background: rgba(255, 0, 0, 0.8); color: white;
            padding: 4px 8px; border-radius: 4px;
            font-size: 10px; font-weight: bold;
            z-index: 999; animation: aiPulse 2s infinite;
        `;
        indicator.innerHTML = 'FOCUSED AI';
        document.body.appendChild(indicator);

        const style = document.createElement('style');
        style.textContent = '@keyframes aiPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 0.9; } }';
        document.head.appendChild(style);
    }

    hideAIIndicator() {
        const indicator = document.getElementById('ai-active-indicator');
        if (indicator) indicator.remove();
    }

    // Model management
    async saveModel() {
        if (!this.agent) {
            alert("No AI model to save");
            return;
        }

        try {
            const modelName = prompt("Model name:", "focused-automata-" + Date.now());
            if (!modelName) return;

            await this.agent.saveModel(modelName);
            alert(`Focused model saved as: ${modelName}`);
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to save model: " + error.message);
        }
    }

    async loadModel() {
        if (!this.agent) {
            alert("AI not initialized");
            return;
        }

        try {
            const modelName = prompt("Model name to load:");
            if (!modelName) return;

            const success = await this.agent.loadModel(modelName);
            alert(success ? "Focused model loaded successfully!" : "Failed to load model");
        } catch (error) {
            console.error("Load error:", error);
            alert("Failed to load model: " + error.message);
        }
    }

    createEnhancedAIInterface() {
        const existing = document.getElementById('ai-interface');
        if (existing) existing.remove();

        const ui = document.createElement('div');
        ui.id = 'ai-interface';
        ui.style.cssText = `
            position: fixed; 
            top: 50%; left: 20px;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.9); color: white;
            padding: 15px; border-radius: 8px;
            font-family: Arial, sans-serif; font-size: 12px;
            z-index: 1000; border: 2px solid #4CAF50;
            min-width: 220px;
        `;

        ui.innerHTML = `
            <div style="margin-bottom: 10px;">
                <div><strong>Focused AI</strong></div>
                <div>Status: <span id="ai-status">Ready</span></div>
                <div>Learning: <span id="learning-status">Off</span></div>
                <div>Session/Memory: <span id="session-length">S:0 M:0</span></div>
                <div>Survival: <span id="survival-time">0s</span></div>
                <div>Max Survival: <span id="max-survival">0s</span></div>
                <div>Rewards: <span id="reward-ratio">+0/-0</span></div>
                <div>Stuck: <span id="stuck-indicator">No</span></div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <button id="toggle-ai" style="padding: 8px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Toggle Focused AI (X)
                </button>
                <button id="toggle-learning" style="padding: 8px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Toggle Learning (C)
                </button>
                <button id="save-model" style="padding: 6px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    Save Focused Model
                </button>
                <button id="load-model" style="padding: 6px; background: #9C27B0; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    Load Model
                </button>
            </div>
            
            <div style="margin-top: 8px; font-size: 10px; color: #aaa;">
                Fixed boundaries, simple rewards, aggressive learning
            </div>
        `;

        document.body.appendChild(ui);

        document.getElementById('toggle-ai').onclick = () => this.toggleAIControl();
        document.getElementById('toggle-learning').onclick = () => this.toggleLearning();
        document.getElementById('save-model').onclick = () => this.saveModel();
        document.getElementById('load-model').onclick = () => this.loadModel();
    }

    updateInterface() {
        const statusEl = document.getElementById('ai-status');
        const learningEl = document.getElementById('learning-status');
        const sessionEl = document.getElementById('session-length');
        const survivalEl = document.getElementById('survival-time');
        const maxSurvivalEl = document.getElementById('max-survival');
        const rewardEl = document.getElementById('reward-ratio');
        const stuckEl = document.getElementById('stuck-indicator');

        if (statusEl) {
            statusEl.textContent = this.aiActive ? 'Focused AI Active' : 'Player';
            statusEl.style.color = this.aiActive ? '#ff4444' : '#44ff44';
        }

        if (learningEl) {
            learningEl.textContent = this.learningActive ? 'Recording' : 'Off';
            learningEl.style.color = this.learningActive ? '#ffaa00' : '#888';
        }

        if (sessionEl) {
            const sessionCount = this.currentSession.length;
            const memoryCount = this.agent ? this.agent.memory.length : 0;
            sessionEl.textContent = `S:${sessionCount} M:${memoryCount}`;
        }

        if (survivalEl) {
            survivalEl.textContent = `${Math.floor(this.survivalTime)}s`;
        }

        if (maxSurvivalEl) {
            maxSurvivalEl.textContent = `${Math.floor(this.maxSurvivalTime)}s`;
        }

        if (rewardEl) {
            rewardEl.textContent = `+${this.rewardStats.positive}/-${this.rewardStats.negative}`;
        }

        if (stuckEl) {
            stuckEl.textContent = this.isReallyStuck ? 'Yes' : 'No';
            stuckEl.style.color = this.isReallyStuck ? '#ff4444' : '#44ff44';
        }
    }

    handleKeyPress(event) {
        if (!this.enabled) return;

        switch (event.key.toLowerCase()) {
            case 'x':
                this.toggleAIControl();
                break;
            case 'c':
                this.toggleLearning();
                break;
        }
    }
}

/**
 * ENHANCED GAME STATE EXTRACTOR - More comprehensive state representation
 */
class EnhancedGameStateExtractor {
    constructor() {
        this.gameWidth = 1200;
        this.gameHeight = 800;
        this.lastState = null;
        this.enemyHistory = [];
        this.playerHistory = [];
    }

    initialize(scene) {
        this.scene = scene;
        if (scene?.game?.config) {
            this.gameWidth = scene.game.config.width;
            this.gameHeight = scene.game.config.height;
        }
        console.log("🧠 Focused state extractor initialized");
    }

    getState() {
        try {
            const gamePlayer = window.player || player;
            if (!gamePlayer) return this.lastState;

            if (window.gameOver ?? gameOver) return this.lastState;

            const state = [
                // Basic player state (6 features)
                gamePlayer.x / this.gameWidth,
                gamePlayer.y / this.gameHeight,
                (window.playerHealth || playerHealth || 100) / (window.maxPlayerHealth || maxPlayerHealth || 100),
                Math.min((window.playerDamage || playerDamage || 10) / 100, 1),
                Math.min((window.playerSpeed || playerSpeed || 8) / 20, 1),
                Math.min((window.elapsedTime || elapsedTime || 0) / 1800, 1),

                // Simplified directional threats (8 features)
                ...this.getSimpleDirectionalThreats(gamePlayer),

                // Simple boundary info (4 features)
                ...this.getSimpleBoundaryInfo(gamePlayer),

                // Simple extras (2 features)
                ...this.getSimpleExtras(gamePlayer)
            ];

            this.lastState = state;
            return state;

        } catch (error) {
            console.error("Enhanced state extraction error:", error);
            return this.lastState;
        }
    }

    getSimpleDirectionalThreats(player) {
        const directions = [
            { dx: 0, dy: -1 },   // Up
            { dx: 1, dy: -1 },   // Up-right
            { dx: 1, dy: 0 },    // Right
            { dx: 1, dy: 1 },    // Down-right
            { dx: 0, dy: 1 },    // Down
            { dx: -1, dy: 1 },   // Down-left
            { dx: -1, dy: 0 },   // Left
            { dx: -1, dy: -1 }   // Up-left
        ];

        const checkDistance = 120;
        const threats = [];

        directions.forEach(dir => {
            const checkX = player.x + dir.dx * checkDistance;
            const checkY = player.y + dir.dy * checkDistance;

            let threatLevel = 0;

            try {
                const enemies = window.EnemySystem?.enemiesGroup?.getChildren() || [];
                for (const enemy of enemies) {
                    if (enemy?.active && enemy.x !== undefined) {
                        const dist = Math.sqrt(Math.pow(enemy.x - checkX, 2) + Math.pow(enemy.y - checkY, 2));
                        if (dist < checkDistance) {
                            const intensity = Math.max(0, 1 - dist / checkDistance);
                            threatLevel += intensity;
                        }
                    }
                }
            } catch (e) { }

            threats.push(Math.min(threatLevel, 1));
        });

        return threats;
    }

    getSimpleBoundaryInfo(player) {
        const normalizedX = player.x / this.gameWidth;
        const normalizedY = player.y / this.gameHeight;

        // Distance to boundaries
        const leftDist = normalizedX;
        const rightDist = 1 - normalizedX;
        const topDist = normalizedY;
        const bottomDist = 1 - normalizedY;

        return [leftDist, rightDist, topDist, bottomDist];
    }

    getSimpleExtras(player) {
        const normalizedX = player.x / this.gameWidth;
        const normalizedY = player.y / this.gameHeight;

        // Minimum distance to any boundary
        const minBoundaryDist = Math.min(normalizedX, 1 - normalizedX, normalizedY, 1 - normalizedY);

        // Simple corner detection
        const inCorner = ((normalizedX < 0.25 || normalizedX > 0.75) && (normalizedY < 0.25 || normalizedY > 0.75)) ? 1 : 0;

        return [minBoundaryDist, inCorner];
    }

    updatePlayerHistory(player) {
        this.playerHistory.push({
            x: player.x,
            y: player.y,
            time: Date.now()
        });

        if (this.playerHistory.length > 10) {
            this.playerHistory.shift();
        }
    }

    updateEnemyHistory() {
        try {
            const enemies = window.EnemySystem?.enemiesGroup?.getChildren() || [];
            const currentEnemies = enemies
                .filter(enemy => enemy?.active && enemy.x !== undefined)
                .map(enemy => ({ x: enemy.x, y: enemy.y, time: Date.now() }));

            this.enemyHistory.push(currentEnemies);

            if (this.enemyHistory.length > 3) {
                this.enemyHistory.shift();
            }
        } catch (e) {
            // Silent fail
        }
    }

    getEnhancedDirectionalThreats(player) {
        const directions = [
            { dx: 0, dy: -1, name: 'up' },
            { dx: 1, dy: -1, name: 'up-right' },
            { dx: 1, dy: 0, name: 'right' },
            { dx: 1, dy: 1, name: 'down-right' },
            { dx: 0, dy: 1, name: 'down' },
            { dx: -1, dy: 1, name: 'down-left' },
            { dx: -1, dy: 0, name: 'left' },
            { dx: -1, dy: -1, name: 'up-left' }
        ];

        const shortRange = 80;  // Close threats
        const longRange = 150;  // Distant threats
        const threats = [];

        directions.forEach(dir => {
            const shortCheckX = player.x + dir.dx * shortRange;
            const shortCheckY = player.y + dir.dy * shortRange;
            const longCheckX = player.x + dir.dx * longRange;
            const longCheckY = player.y + dir.dy * longRange;

            let shortThreat = 0;
            let longThreat = 0;

            try {
                const enemies = window.EnemySystem?.enemiesGroup?.getChildren() || [];
                for (const enemy of enemies) {
                    if (enemy?.active && enemy.x !== undefined) {
                        // Short range threat
                        const shortDist = Math.sqrt(
                            Math.pow(enemy.x - shortCheckX, 2) +
                            Math.pow(enemy.y - shortCheckY, 2)
                        );
                        if (shortDist < shortRange) {
                            shortThreat += Math.max(0, 1 - shortDist / shortRange);
                        }

                        // Long range threat
                        const longDist = Math.sqrt(
                            Math.pow(enemy.x - longCheckX, 2) +
                            Math.pow(enemy.y - longCheckY, 2)
                        );
                        if (longDist < longRange) {
                            longThreat += Math.max(0, 1 - longDist / longRange);
                        }
                    }
                }
            } catch (e) { }

            // Combine short and long range threats (short is more important)
            const combinedThreat = Math.min(shortThreat * 0.8 + longThreat * 0.2, 1);
            threats.push(combinedThreat);
        });

        return threats;
    }

    getMultipleClosestEnemies(player) {
        try {
            const enemies = window.EnemySystem?.enemiesGroup?.getChildren() || [];
            const enemyDistances = [];

            for (const enemy of enemies) {
                if (enemy?.active && enemy.x !== undefined) {
                    const dx = enemy.x - player.x;
                    const dy = enemy.y - player.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 300) { // Only consider nearby enemies
                        enemyDistances.push({
                            distance: dist,
                            angle: Math.atan2(dy, dx) / Math.PI,
                            dx: dx,
                            dy: dy
                        });
                    }
                }
            }

            // Sort by distance
            enemyDistances.sort((a, b) => a.distance - b.distance);

            // Get info for 3 closest enemies
            const result = [];
            for (let i = 0; i < 3; i++) {
                if (i < enemyDistances.length) {
                    const enemy = enemyDistances[i];
                    result.push(
                        Math.min(enemy.distance / 300, 1), // Normalized distance
                        enemy.angle // Angle (-1 to 1)
                    );
                } else {
                    result.push(1, 0); // No enemy = max distance, no angle
                }
            }

            return result;
        } catch (e) {
            return [1, 0, 1, 0, 1, 0]; // Safe defaults
        }
    }

    getEnhancedBoundaryInfo(player) {
        const normalizedX = player.x / this.gameWidth;
        const normalizedY = player.y / this.gameHeight;

        // Distance to each boundary
        const leftDist = normalizedX;
        const rightDist = 1 - normalizedX;
        const topDist = normalizedY;
        const bottomDist = 1 - normalizedY;

        // Minimum distance to any boundary
        const minBoundaryDist = Math.min(leftDist, rightDist, topDist, bottomDist);

        // Corner detection (being in a corner is very dangerous)
        const inTopLeftCorner = (leftDist < 0.3 && topDist < 0.3) ? 1 : 0;
        const inTopRightCorner = (rightDist < 0.3 && topDist < 0.3) ? 1 : 0;
        const inBottomLeftCorner = (leftDist < 0.3 && bottomDist < 0.3) ? 1 : 0;
        const inBottomRightCorner = (rightDist < 0.3 && bottomDist < 0.3) ? 1 : 0;

        return [
            leftDist,
            rightDist,
            topDist,
            bottomDist,
            minBoundaryDist,
            inTopLeftCorner,
            inTopRightCorner,
            inBottomLeftCorner + inBottomRightCorner // Combine bottom corners
        ];
    }

    getMovementPatterns(player) {
        if (this.playerHistory.length < 3) {
            return [0, 0, 0, 0]; // No movement data yet
        }

        const recent = this.playerHistory.slice(-3);

        // Movement speed (distance covered)
        const dist1 = Math.sqrt(
            Math.pow(recent[1].x - recent[0].x, 2) +
            Math.pow(recent[1].y - recent[0].y, 2)
        );
        const dist2 = Math.sqrt(
            Math.pow(recent[2].x - recent[1].x, 2) +
            Math.pow(recent[2].y - recent[1].y, 2)
        );

        const avgSpeed = (dist1 + dist2) / 2;
        const normalizedSpeed = Math.min(avgSpeed / 100, 1); // Normalize to 0-1

        // Movement direction consistency
        const angle1 = Math.atan2(recent[1].y - recent[0].y, recent[1].x - recent[0].x);
        const angle2 = Math.atan2(recent[2].y - recent[1].y, recent[2].x - recent[1].x);
        const angleDiff = Math.abs(angle1 - angle2);
        const directionConsistency = 1 - Math.min(angleDiff / Math.PI, 1);

        // Movement towards/away from center
        const centerX = this.gameWidth / 2;
        const centerY = this.gameHeight / 2;
        const distToCenter = Math.sqrt(
            Math.pow(player.x - centerX, 2) +
            Math.pow(player.y - centerY, 2)
        );
        const normalizedCenterDist = Math.min(distToCenter / (this.gameWidth / 2), 1);

        // Recent position variance (how much the player is moving around)
        const positions = this.playerHistory.slice(-5);
        let variance = 0;
        if (positions.length >= 2) {
            const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
            const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
            variance = positions.reduce((sum, p) => {
                return sum + Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2);
            }, 0) / positions.length;
            variance = Math.min(Math.sqrt(variance) / 100, 1);
        }

        return [
            normalizedSpeed,
            directionConsistency,
            normalizedCenterDist,
            variance
        ];
    }

    getThreatPrediction(player) {
        if (this.enemyHistory.length < 2) {
            return [0, 0, 0, 0]; // No prediction data yet
        }

        try {
            const current = this.enemyHistory[this.enemyHistory.length - 1];
            const previous = this.enemyHistory[this.enemyHistory.length - 2];

            // Predict where enemies will be in the next few frames
            let threatIn1Step = 0;
            let threatIn2Steps = 0;
            let approachingEnemies = 0;
            let fastEnemies = 0;

            for (let i = 0; i < Math.min(current.length, previous.length); i++) {
                const curr = current[i];
                const prev = previous[i];

                if (curr && prev) {
                    // Estimate enemy velocity
                    const vx = curr.x - prev.x;
                    const vy = curr.y - prev.y;
                    const speed = Math.sqrt(vx * vx + vy * vy);

                    // Predict future positions
                    const futureX1 = curr.x + vx;
                    const futureY1 = curr.y + vy;
                    const futureX2 = curr.x + vx * 2;
                    const futureY2 = curr.y + vy * 2;

                    // Distance to predicted positions
                    const futureDist1 = Math.sqrt(
                        Math.pow(futureX1 - player.x, 2) +
                        Math.pow(futureY1 - player.y, 2)
                    );
                    const futureDist2 = Math.sqrt(
                        Math.pow(futureX2 - player.x, 2) +
                        Math.pow(futureY2 - player.y, 2)
                    );

                    // Current distance
                    const currentDist = Math.sqrt(
                        Math.pow(curr.x - player.x, 2) +
                        Math.pow(curr.y - player.y, 2)
                    );

                    // Check if enemy is getting closer
                    if (futureDist1 < currentDist) {
                        approachingEnemies++;
                    }

                    // Check threat levels at predicted positions
                    if (futureDist1 < 100) threatIn1Step += (100 - futureDist1) / 100;
                    if (futureDist2 < 100) threatIn2Steps += (100 - futureDist2) / 100;

                    // Count fast enemies
                    if (speed > 5) fastEnemies++;
                }
            }

            return [
                Math.min(threatIn1Step, 1),
                Math.min(threatIn2Steps, 1),
                Math.min(approachingEnemies / 10, 1),
                Math.min(fastEnemies / 5, 1)
            ];

        } catch (e) {
            return [0, 0, 0, 0];
        }
    }

    getSafeZones(player) {
        // Calculate safe zones based on enemy positions
        try {
            const enemies = window.EnemySystem?.enemiesGroup?.getChildren() || [];

            // Check 4 quadrants for safety
            const quadrants = [
                { centerX: this.gameWidth * 0.25, centerY: this.gameHeight * 0.25 }, // Top-left
                { centerX: this.gameWidth * 0.75, centerY: this.gameHeight * 0.25 }, // Top-right
                { centerX: this.gameWidth * 0.25, centerY: this.gameHeight * 0.75 }, // Bottom-left
                { centerX: this.gameWidth * 0.75, centerY: this.gameHeight * 0.75 }  // Bottom-right
            ];

            let safestQuadrant = 0;
            let safestQuadrantScore = -1;

            quadrants.forEach((quad, index) => {
                let enemyCount = 0;
                let totalDistance = 0;

                enemies.forEach(enemy => {
                    if (enemy?.active && enemy.x !== undefined) {
                        const dist = Math.sqrt(
                            Math.pow(enemy.x - quad.centerX, 2) +
                            Math.pow(enemy.y - quad.centerY, 2)
                        );

                        if (dist < 200) { // Only count nearby enemies
                            enemyCount++;
                            totalDistance += dist;
                        }
                    }
                });

                // Safety score: fewer enemies and greater distances are better
                const safetyScore = enemyCount === 0 ? 1 : (totalDistance / enemyCount) / 200;

                if (safetyScore > safestQuadrantScore) {
                    safestQuadrantScore = safetyScore;
                    safestQuadrant = index;
                }
            });

            // Distance to safest quadrant
            const safestQuad = quadrants[safestQuadrant];
            const distToSafest = Math.sqrt(
                Math.pow(player.x - safestQuad.centerX, 2) +
                Math.pow(player.y - safestQuad.centerY, 2)
            );
            const normalizedDistToSafest = Math.min(distToSafest / (this.gameWidth / 2), 1);

            return [
                Math.max(safestQuadrantScore, 0),
                normalizedDistToSafest
            ];

        } catch (e) {
            return [0.5, 0.5]; // Neutral values
        }
    }

    getStateSize() {
        return 20; // Simplified: 6 basic + 8 directional threats + 4 boundary + 2 simple extras
    }
}

/**
 * SMART SURVIVAL AGENT - Enhanced neural network and training
 */
class SmartSurvivalAgent {
    constructor(stateSize, actionSize) {
        this.stateSize = stateSize;
        this.actionSize = actionSize;

        this.config = {
            learningRate: 0.001,  // More aggressive learning
            gamma: 0.95,          // Medium-term thinking
            epsilon: 0.8,         // Much higher starting exploration
            epsilonMin: 0.1,      // Higher minimum exploration
            epsilonDecay: 0.995,  // Very slow decay
            batchSize: 32,        // Smaller batch for faster updates
            memorySize: 2000      // Smaller memory for faster cycling
        };

        this.memory = [];
        this.memoryIndex = 0;

        this.mainNetwork = this.buildSimpleNetwork();
        this.targetNetwork = this.buildSimpleNetwork();
        this.updateTargetNetwork();

        this.totalSteps = 0;
        this.lastLoss = null;

        console.log(`🧠 Smart Survival Agent: ${stateSize} → ${actionSize} (Focused Network)`);
    }

    buildSimpleNetwork() {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [this.stateSize],
                    units: 64,  // Smaller, more focused network
                    activation: 'relu',
                    kernelInitializer: 'heNormal'
                }),
                tf.layers.dense({
                    units: 32,
                    activation: 'relu',
                    kernelInitializer: 'heNormal'
                }),
                tf.layers.dense({
                    units: this.actionSize,
                    activation: 'linear'
                })
            ]
        });

        model.compile({
            optimizer: tf.train.adam(this.config.learningRate),
            loss: 'meanSquaredError'
        });

        return model;
    }

    async chooseAction(state) {
        // More sophisticated exploration
        if (this.memory.length < 100 || Math.random() < this.config.epsilon) {
            return this.chooseSmartRandomAction(state);
        }

        const stateTensor = tf.tensor2d([state]);
        const qValues = await this.mainNetwork.predict(stateTensor);
        const qValuesArray = await qValues.data();

        // Add noise to Q-values for better exploration
        const noise = (Math.random() - 0.5) * 0.1;
        const bestAction = qValuesArray.indexOf(Math.max(...qValuesArray));

        stateTensor.dispose();
        qValues.dispose();

        return bestAction;
    }

    chooseSmartRandomAction(state) {
        const playerX = state[0];
        const playerY = state[1];
        const playerHealth = state[2];

        // Debug position every 50 actions
        if (this.actionCount % 50 === 0) {
            console.log(`🎯 AI Position: (${playerX.toFixed(3)}, ${playerY.toFixed(3)})`);
        }

        // SIMPLE and DIRECT boundary detection using raw position
        const criticalBoundary = 0.15;  // 15% from edges
        const warningBoundary = 0.3;    // 30% from edges

        // Calculate actual distances from boundaries
        const leftDist = playerX;
        const rightDist = 1 - playerX;
        const topDist = playerY;
        const bottomDist = 1 - playerY;
        const minBoundaryDist = Math.min(leftDist, rightDist, topDist, bottomDist);

        // ACCURATE corner detection
        const inTopLeftCorner = (leftDist < 0.25 && topDist < 0.25);
        const inTopRightCorner = (rightDist < 0.25 && topDist < 0.25);
        const inBottomLeftCorner = (leftDist < 0.25 && bottomDist < 0.25);
        const inBottomRightCorner = (rightDist < 0.25 && bottomDist < 0.25);
        const inAnyCorner = inTopLeftCorner || inTopRightCorner || inBottomLeftCorner || inBottomRightCorner;

        // Debug corner detection
        if (inAnyCorner) {
            console.log(`🚨 AI: ACTUALLY IN CORNER at (${playerX.toFixed(3)}, ${playerY.toFixed(3)}) - TL:${inTopLeftCorner} TR:${inTopRightCorner} BL:${inBottomLeftCorner} BR:${inBottomRightCorner}`);
        }

        // Get threats from state
        const directionalThreats = state.slice(6, 14);

        // Start with equal weights
        const actionWeights = new Array(9).fill(1.0);

        // ABSOLUTE CORNER ESCAPE (highest priority)
        if (inAnyCorner) {
            console.log("🚨 AI: CORNER ESCAPE MODE ACTIVATED");

            // Eliminate staying still completely
            actionWeights[0] = 0.001;

            // Force movement towards center
            if (inTopLeftCorner) {
                actionWeights[4] = 100; // Down-right (towards center)
                actionWeights[3] = 50;  // Right
                actionWeights[5] = 50;  // Down
                // Eliminate all moves towards corner
                actionWeights[1] = 0.001; // Up
                actionWeights[7] = 0.001; // Left
                actionWeights[8] = 0.001; // Up-left
            } else if (inTopRightCorner) {
                actionWeights[6] = 100; // Down-left
                actionWeights[7] = 50;  // Left
                actionWeights[5] = 50;  // Down
                actionWeights[1] = 0.001; // Up
                actionWeights[3] = 0.001; // Right
                actionWeights[2] = 0.001; // Up-right
            } else if (inBottomLeftCorner) {
                actionWeights[2] = 100; // Up-right
                actionWeights[3] = 50;  // Right
                actionWeights[1] = 50;  // Up
                actionWeights[5] = 0.001; // Down
                actionWeights[7] = 0.001; // Left
                actionWeights[6] = 0.001; // Down-left
            } else if (inBottomRightCorner) {
                actionWeights[8] = 100; // Up-left
                actionWeights[7] = 50;  // Left
                actionWeights[1] = 50;  // Up
                actionWeights[5] = 0.001; // Down
                actionWeights[3] = 0.001; // Right
                actionWeights[4] = 0.001; // Down-right
            }
        }
        // CRITICAL BOUNDARY AVOIDANCE (if not in corner)
        else {
            // Left boundary
            if (leftDist < criticalBoundary) {
                const severity = (criticalBoundary - leftDist) / criticalBoundary;
                console.log(`🟡 AI: Too close to LEFT boundary! Distance: ${leftDist.toFixed(3)}, severity: ${severity.toFixed(2)}`);

                // Almost eliminate leftward movement
                actionWeights[7] = 0.01;  // Left
                actionWeights[6] = 0.01;  // Down-left
                actionWeights[8] = 0.01;  // Up-left

                // Massive boost for rightward movement
                actionWeights[3] *= (1 + severity * 15); // Right
                actionWeights[2] *= (1 + severity * 10); // Up-right
                actionWeights[4] *= (1 + severity * 10); // Down-right
            }

            // Right boundary
            if (rightDist < criticalBoundary) {
                const severity = (criticalBoundary - rightDist) / criticalBoundary;
                console.log(`🟡 AI: Too close to RIGHT boundary! Distance: ${rightDist.toFixed(3)}, severity: ${severity.toFixed(2)}`);

                actionWeights[3] = 0.01;  // Right
                actionWeights[2] = 0.01;  // Up-right
                actionWeights[4] = 0.01;  // Down-right

                actionWeights[7] *= (1 + severity * 15); // Left
                actionWeights[6] *= (1 + severity * 10); // Down-left
                actionWeights[8] *= (1 + severity * 10); // Up-left
            }

            // Top boundary
            if (topDist < criticalBoundary) {
                const severity = (criticalBoundary - topDist) / criticalBoundary;
                console.log(`🟡 AI: Too close to TOP boundary! Distance: ${topDist.toFixed(3)}, severity: ${severity.toFixed(2)}`);

                actionWeights[1] = 0.01;  // Up
                actionWeights[2] = 0.01;  // Up-right
                actionWeights[8] = 0.01;  // Up-left

                actionWeights[5] *= (1 + severity * 15); // Down
                actionWeights[4] *= (1 + severity * 10); // Down-right
                actionWeights[6] *= (1 + severity * 10); // Down-left
            }

            // Bottom boundary
            if (bottomDist < criticalBoundary) {
                const severity = (criticalBoundary - bottomDist) / criticalBoundary;
                console.log(`🟡 AI: Too close to BOTTOM boundary! Distance: ${bottomDist.toFixed(3)}, severity: ${severity.toFixed(2)}`);

                actionWeights[5] = 0.01;  // Down
                actionWeights[4] = 0.01;  // Down-right
                actionWeights[6] = 0.01;  // Down-left

                actionWeights[1] *= (1 + severity * 15); // Up
                actionWeights[2] *= (1 + severity * 10); // Up-right
                actionWeights[8] *= (1 + severity * 10); // Up-left
            }

            // Warning boundary penalties (gentler)
            if (leftDist < warningBoundary && leftDist >= criticalBoundary) {
                const severity = (warningBoundary - leftDist) / (warningBoundary - criticalBoundary);
                actionWeights[7] *= (1 - severity * 0.5);
                actionWeights[3] *= (1 + severity * 2);
            }
            if (rightDist < warningBoundary && rightDist >= criticalBoundary) {
                const severity = (warningBoundary - rightDist) / (warningBoundary - criticalBoundary);
                actionWeights[3] *= (1 - severity * 0.5);
                actionWeights[7] *= (1 + severity * 2);
            }
            if (topDist < warningBoundary && topDist >= criticalBoundary) {
                const severity = (warningBoundary - topDist) / (warningBoundary - criticalBoundary);
                actionWeights[1] *= (1 - severity * 0.5);
                actionWeights[5] *= (1 + severity * 2);
            }
            if (bottomDist < warningBoundary && bottomDist >= criticalBoundary) {
                const severity = (warningBoundary - bottomDist) / (warningBoundary - criticalBoundary);
                actionWeights[5] *= (1 - severity * 0.5);
                actionWeights[1] *= (1 + severity * 2);
            }
        }

        // Threat avoidance (lower priority than boundaries)
        directionalThreats.forEach((threat, i) => {
            if (threat > 0.2) { // Only avoid significant threats
                const actionIndex = i + 1;
                const threatPenalty = Math.max(0.3, 1 - (threat * 2));
                actionWeights[actionIndex] *= threatPenalty;

                // Boost opposite direction
                const oppositeDirection = ((i + 4) % 8) + 1;
                const threatBoost = 1 + (threat * 2);
                actionWeights[oppositeDirection] *= threatBoost;
            }
        });

        // Low health: never stand still
        if (playerHealth < 0.5) {
            actionWeights[0] *= 0.1;
        }

        // Choose action based on weights
        const totalWeight = actionWeights.reduce((sum, w) => sum + w, 0);

        if (totalWeight <= 0.1) {
            console.log("🚨 AI: All actions blocked, emergency center movement");
            // Force movement towards center
            if (playerX < 0.5) return 3; // Right
            if (playerX > 0.5) return 7; // Left
            if (playerY < 0.5) return 5; // Down
            return 1; // Up
        }

        // Weighted random selection
        let random = Math.random() * totalWeight;
        for (let i = 0; i < actionWeights.length; i++) {
            random -= actionWeights[i];
            if (random <= 0) {
                // Debug significant boundary actions
                if (minBoundaryDist < 0.2) {
                    const actionNames = ['Stay', 'Up', 'Up-Right', 'Right', 'Down-Right', 'Down', 'Down-Left', 'Left', 'Up-Left'];
                    console.log(`🎯 AI: Near boundary (${minBoundaryDist.toFixed(3)}), chose ${actionNames[i]}`);
                }
                return i;
            }
        }

        return 0; // Fallback
    }

    remember(state, action, reward, nextState, done) {
        const experience = {
            state: state.slice(),
            action,
            reward,
            nextState: nextState?.slice(),
            done
        };

        if (this.memory.length < this.config.memorySize) {
            this.memory.push(experience);
        } else {
            this.memory[this.memoryIndex] = experience;
            this.memoryIndex = (this.memoryIndex + 1) % this.config.memorySize;
        }
    }

    async replay() {
        if (this.memory.length < this.config.batchSize) return null;

        // Simple random sampling for faster, more frequent updates
        const batch = [];
        for (let i = 0; i < this.config.batchSize; i++) {
            const randomIndex = Math.floor(Math.random() * this.memory.length);
            batch.push(this.memory[randomIndex]);
        }

        const states = batch.map(exp => exp.state);
        const nextStates = batch.filter(exp => !exp.done).map(exp => exp.nextState);

        const statesTensor = tf.tensor2d(states);
        const qValues = await this.mainNetwork.predict(statesTensor);

        let targetQValues = null;
        if (nextStates.length > 0) {
            const nextStatesTensor = tf.tensor2d(nextStates);
            targetQValues = await this.targetNetwork.predict(nextStatesTensor);
            nextStatesTensor.dispose();
        }

        const qValuesArray = await qValues.array();
        let targetIndex = 0;

        for (let i = 0; i < batch.length; i++) {
            const exp = batch[i];

            if (exp.done) {
                qValuesArray[i][exp.action] = exp.reward;
            } else {
                const targetQArray = await targetQValues.array();
                const maxTargetQ = Math.max(...targetQArray[targetIndex]);
                qValuesArray[i][exp.action] = exp.reward + this.config.gamma * maxTargetQ;
                targetIndex++;
            }
        }

        const targetTensor = tf.tensor2d(qValuesArray);
        const history = await this.mainNetwork.fit(statesTensor, targetTensor, {
            epochs: 1,
            verbose: 0,
            shuffle: true
        });

        this.lastLoss = history.history.loss[0];

        // Cleanup
        statesTensor.dispose();
        qValues.dispose();
        targetTensor.dispose();
        if (targetQValues) targetQValues.dispose();

        // Update epsilon
        if (this.config.epsilon > this.config.epsilonMin) {
            this.config.epsilon *= this.config.epsilonDecay;
        }

        this.totalSteps++;

        // Update target network more frequently for faster adaptation
        if (this.totalSteps % 50 === 0) {
            this.updateTargetNetwork();
        }

        // Auto-save more frequently for faster feedback
        if (this.totalSteps % 200 === 0) {
            try {
                await this.saveModel('focused-automata-autosave');
                console.log(`💾 Auto-saved focused model at step ${this.totalSteps}`);
            } catch (error) {
                console.warn("Auto-save failed:", error);
            }
        }

        return this.lastLoss;
    }

    updateTargetNetwork() {
        const mainWeights = this.mainNetwork.getWeights();
        this.targetNetwork.setWeights(mainWeights);
    }

    async saveModel(name) {
        try {
            await this.mainNetwork.save(`localstorage://${name}`);
            console.log(`✅ Focused model saved: ${name}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to save focused model: ${error}`);
            return false;
        }
    }

    async loadModel(name) {
        try {
            this.mainNetwork = await tf.loadLayersModel(`localstorage://${name}`);
            this.updateTargetNetwork();
            console.log(`✅ Focused model loaded: ${name}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to load focused model: ${error}`);
            return false;
        }
    }
}

// Replace the global AI controller
window.gameAI = new EnhancedGameAIController();

// Keyboard event handling
document.addEventListener('keydown', (event) => {
    if (window.gameAI) {
        window.gameAI.handleKeyPress(event);
    }
});

console.log("🚀 Focused Game AI System loaded! Fixed boundaries, simplified learning, aggressive training!");