// automataCore.js - Fixed AI with proper evasive movement and calculated perk selection

/**
 * MAIN AI CONTROLLER - Fixed for proper evasive behavior and calculated UI clicks
 */
class GameAIController {
    constructor() {
        this.enabled = false;
        this.tfLoaded = false;
        this.agent = null;
        this.gameState = null;

        // Control state
        this.aiActive = false;
        this.learningActive = false;

        // Training data
        this.trainingData = [];
        this.currentSession = [];

        // Movement state with fixed stuck detection
        this.currentDirection = 0;
        this.lastDecisionTime = 0;
        this.keysPressed = new Set();

        // Fixed stuck detection - only when truly not moving
        this.lastPosition = { x: 0, y: 0, time: 0 };
        this.stuckCheckInterval = 2000;
        this.stuckThreshold = 10;
        this.isReallyStuck = false;

        // Performance monitoring
        this.lastActionTime = 0;
        this.actionCount = 0;
        this.lastPlayerRecordTime = 0;

        // Game state tracking
        this.lastPlayerHealth = null;
        this.lastScore = 0;
        this.gameStartTime = null;

        // Game over handling
        this.gameOverHandled = false;
        this.levelUpHandled = false;
        this.levelUpStartTime = null;
        this.perkScrollPhase = null; // Track perk browsing vs selection phase
        this.perksViewed = 0; // Track how many perks we've seen

        // Auto-loading
        this.autoLoadAttempted = false;

        // Training tracking
        this.lossHistory = [];

        console.log("🤖 Fixed GameAI Controller - improved boundary avoidance, level-up detection, and training frequency");

        // Log training guidance
        console.log(`
📚 AI Training Guide:
• Expect 200-500 training steps before noticeable improvement
• Training can plateau or go wrong - watch the loss values
• If loss stops decreasing after 1000+ steps, consider restarting
• Player training records every 150ms (not every frame) to match AI decisions
• Boundary avoidance now uses gradual pressure instead of hard cutoffs
        `.trim());
    }

    async initialize(scene) {
        if (this.enabled) return true;

        try {
            console.log("🔄 Loading AI systems...");

            if (!window.tf) {
                console.log("📥 Loading TensorFlow.js...");
                await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0/dist/tf.min.js');
                console.log("✅ TensorFlow.js loaded");
            }

            this.tfLoaded = true;
            this.scene = scene;

            this.gameState = new CompactGameStateExtractor();
            this.gameState.initialize(scene);

            const stateSize = this.gameState.getStateSize();
            const actionSize = 9;

            this.agent = new EvasiveSurvivalAgent(stateSize, actionSize);

            this.enabled = true;
            console.log("✅ AI systems initialized successfully");

            await this.attemptAutoLoad();
            this.createAIInterface();

            return true;

        } catch (error) {
            console.error("❌ Failed to initialize AI:", error);
            alert("Failed to load AI systems: " + error.message);
            return false;
        }
    }

    async attemptAutoLoad() {
        if (this.autoLoadAttempted) return;
        this.autoLoadAttempted = true;

        try {
            const autoSaveSuccess = await this.agent.loadModel('automata-evasive-autosave');
            if (autoSaveSuccess) {
                console.log("🔄 Auto-loaded previous AI training");
                return;
            }
            console.log("📝 No previous AI training found - starting fresh");
        } catch (error) {
            console.log("📝 Starting with fresh AI model");
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

    update() {
        if (!this.enabled || !this.agent) return;

        this.updateStuckDetection();

        if (this.aiActive) {
            this.makeAIDecision();
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

    updateStuckDetection() {
        const gamePlayer = window.player || player;
        if (!gamePlayer) return;

        const now = Date.now();
        const currentPos = { x: gamePlayer.x, y: gamePlayer.y, time: now };

        if (now - this.lastPosition.time >= this.stuckCheckInterval) {
            const distance = Math.sqrt(
                Math.pow(currentPos.x - this.lastPosition.x, 2) +
                Math.pow(currentPos.y - this.lastPosition.y, 2)
            );

            this.isReallyStuck = distance < this.stuckThreshold && this.currentDirection !== 0;
            this.lastPosition = currentPos;
        }
    }

    updateGameStateTracking() {
        if (!this.gameStartTime && !this.isGameOver()) {
            this.gameStartTime = Date.now();
        }

        if (this.gameStartTime && this.isGameOver()) {
            this.gameStartTime = null;
        }
    }

    async makeAIDecision() {
        const now = Date.now();

        if (now - this.lastDecisionTime < 150) return;

        try {
            const state = this.gameState.getState();
            if (!state) return;

            // STOP MOVING during level up
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

            if (this.isReallyStuck) {
                newDirection = this.getUnstuckAction(state);
                this.isReallyStuck = false;
                console.log("🆘 AI: Emergency unstuck action");
            } else {
                newDirection = await this.agent.chooseAction(state);
            }

            if (newDirection !== this.currentDirection) {
                this.changeDirection(newDirection);
                this.currentDirection = newDirection;

                if (this.learningActive) {
                    this.recordAIAction(state, newDirection);
                }
            }

            this.lastDecisionTime = now;
            this.actionCount++;

        } catch (error) {
            console.error("AI decision error:", error);
        }
    }

    getUnstuckAction(state) {
        const playerX = state[0];
        const playerY = state[1];

        // Move towards center with randomness
        const targetX = 0.4 + Math.random() * 0.2;
        const targetY = 0.4 + Math.random() * 0.2;

        const deltaX = targetX - playerX;
        const deltaY = targetY - playerY;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            return deltaX > 0 ? 3 : 7;
        } else {
            return deltaY > 0 ? 5 : 1;
        }
    }

    isLevelUpActive() {
        // Try accessing variables from the scene and window in multiple ways
        const scene = this.scene;

        // Check multiple possible sources for level-up state
        const checks = {
            windowLevelUpInProgress: window.levelUpInProgress,
            globalLevelUpInProgress: (typeof levelUpInProgress !== 'undefined') ? levelUpInProgress : undefined,
            windowLevelUpCards: window.levelUpCards,
            globalLevelUpCards: (typeof levelUpCards !== 'undefined') ? levelUpCards : undefined,
            windowGamePaused: window.gamePaused,
            globalGamePaused: (typeof gamePaused !== 'undefined') ? gamePaused : undefined,
            sceneGamePaused: scene?.gamePaused,
            hasLevelUpUI: this.detectLevelUpUI(),
            // Check if CardSystem is in level-up mode
            cardSystemMode: window.CardSystem?.showingLevelUp,
            // Check scene physics state (paused during level-up)
            physicsActive: scene?.physics?.world?.enabled,
        };

        // Log debug info every 60 frames but only when paused
        if (this.actionCount % 60 === 0 && (checks.windowGamePaused || checks.globalGamePaused)) {
            console.log("🔍 AI: Level-up debug:", checks);
        }

        // Determine if level-up is active - prioritize actual UI detection
        const isLevelUp = checks.hasLevelUpUI ||
            checks.windowLevelUpInProgress ||
            checks.globalLevelUpInProgress ||
            (checks.windowLevelUpCards && checks.windowLevelUpCards.length > 0) ||
            (checks.globalLevelUpCards && checks.globalLevelUpCards.length > 0) ||
            // If game is paused AND physics is paused AND we can see level-up UI
            ((checks.windowGamePaused || checks.globalGamePaused) && checks.hasLevelUpUI);

        if (isLevelUp && !this.levelUpStartTime) {
            console.log("🎓 AI: Level up detected - stopping movement");
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
            this.perkScrollPhase = 'browsing'; // Track what phase we're in
            this.perksViewed = 0; // Track how many perks we've seen
            console.log("🎓 AI: Level up started - beginning perk browsing phase");
        }

        if (this.levelUpHandled) return;

        const elapsed = Date.now() - this.levelUpStartTime;

        // Wait for UI to settle
        if (elapsed < 1000) return;

        // PHASE 1: Browse through all perks first (required by the game)
        if (this.perkScrollPhase === 'browsing') {
            console.log(`🎓 AI: Browsing phase - viewed ${this.perksViewed}/4 perks`);

            if (this.perksViewed < 4) {
                // Click navigation arrows to browse through perks
                this.navigateToNextPerk();
                this.perksViewed++;
                return;
            } else {
                // We've viewed all perks, now we can select
                console.log("🎓 AI: Finished browsing all perks, switching to selection phase");
                this.perkScrollPhase = 'selecting';
                return;
            }
        }

        // PHASE 2: Actually select a perk (only after browsing all)
        if (this.perkScrollPhase === 'selecting') {
            console.log("🎓 AI: Attempting perk selection...");
            const perkSelected = this.selectPerkByCalculatedPosition();

            if (perkSelected) {
                this.levelUpHandled = true;
                this.levelUpStartTime = null;
                this.perkScrollPhase = null;
                console.log("🎓 AI: Perk selected successfully");
            } else if (elapsed > 15000) { // Longer timeout since we have two phases
                console.log("🎓 AI: Perk selection timeout after 15 seconds");
                this.emergencyLevelUpExit();
                this.levelUpHandled = true;
                this.levelUpStartTime = null;
                this.perkScrollPhase = null;
            }
        }
    }

    // Navigate through perks using arrow buttons
    navigateToNextPerk() {
        console.log("🎓 AI: Clicking navigation arrow to browse next perk");

        // Get game dimensions
        const gameWidth = window.game?.config?.width || 1200;
        const gameHeight = window.game?.config?.height || 800;

        // From cards.js showMobileLevelUpScreen: arrows are positioned at centerX ± arrowDistance
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;

        // Calculate arrow positions (from cards.js)
        const kajisuliMode = (typeof KAJISULI_MODE !== 'undefined') ? KAJISULI_MODE : false;
        const arrowDistance = kajisuliMode ? gameWidth * 0.32 : gameWidth * 0.16;

        // Click right arrow to navigate to next perk
        const rightArrowX = centerX + arrowDistance;
        const rightArrowY = centerY;

        console.log(`🎓 AI: Clicking right arrow at game position: ${rightArrowX},${rightArrowY}`);
        this.clickAtGamePosition(rightArrowX, rightArrowY);

        // Wait a bit before next action
        setTimeout(() => {
            console.log("🎓 AI: Navigation click completed");
        }, 500);
    }

    // Use calculated positions from cards.js instead of DOM scanning
    selectPerkByCalculatedPosition() {
        console.log("🎓 AI: Using calculated UI positions for perk selection...");

        // Get game dimensions (from cards.js: game.config.width/height)
        const gameWidth = window.game?.config?.width || 1200;
        const gameHeight = window.game?.config?.height || 800;

        // Calculate center positions (from showMobileLevelUpScreen in cards.js)
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;

        console.log(`🎓 AI: Game dimensions: ${gameWidth}x${gameHeight}, center: ${centerX},${centerY}`);

        // Strategy 1: Click center where current perk card should be
        console.log("🎓 AI: Clicking center perk card position");
        this.clickAtGamePosition(centerX, centerY);

        return true; // Always return true since we attempted a click
    }

    // Convert game coordinates to screen coordinates and click
    clickAtGamePosition(gameX, gameY) {
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            console.log("🎓 AI: No canvas found");
            return;
        }

        const rect = canvas.getBoundingClientRect();

        // Get game dimensions
        const gameWidth = window.game?.config?.width || 1200;
        const gameHeight = window.game?.config?.height || 800;

        // Convert game coordinates to canvas coordinates
        const canvasX = rect.left + (gameX / gameWidth) * rect.width;
        const canvasY = rect.top + (gameY / gameHeight) * rect.height;

        console.log(`🎓 AI: Clicking at canvas position: ${canvasX.toFixed(0)},${canvasY.toFixed(0)} (game: ${gameX},${gameY})`);

        // Create and dispatch click events
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
        console.log("🎓 AI: Emergency level up exit");

        // Try clicking center and some navigation areas
        const gameWidth = window.game?.config?.width || 1200;
        const gameHeight = window.game?.config?.height || 800;

        this.clickAtGamePosition(gameWidth / 2, gameHeight / 2);
        setTimeout(() => this.simulateKeyPress('Enter'), 200);
        setTimeout(() => this.clickAtGamePosition(gameWidth * 0.8, gameHeight / 2), 400); // Right arrow area
    }

    isGameOver() {
        return window.gameOver ?? (typeof gameOver !== 'undefined' ? gameOver : false);
    }

    handleGameOver() {
        if (this.gameOverHandled) return;
        this.gameOverHandled = true;

        console.log("🔄 AI: Game over detected, will attempt restart...");

        setTimeout(() => {
            this.attemptGameRestart();
        }, 2000);
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
                    console.log("🔄 AI: Found restart button");
                    this.clickElement(element);
                    this.resetGameOverState();
                    return;
                }
            }
        }

        if (this.scene && typeof startGame === 'function') {
            console.log("🔄 AI: Calling startGame directly");
            try {
                startGame.call(this.scene);
                this.resetGameOverState();
                return;
            } catch (error) {
                console.log("🔄 AI: Error calling startGame:", error);
            }
        }

        console.log("🔄 AI: Trying emergency restart methods");
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
            this.gameStartTime = null;
            this.isReallyStuck = false;
            console.log("🔄 AI: Ready for new game");
        }, 1000);
    }

    recordAIAction(state, action) {
        if (!this.learningActive) return;

        const experience = {
            state: state.slice(),
            action: action,
            timestamp: Date.now(),
            source: 'ai'
        };

        this.currentSession.push(experience);
        this.updateRealTimeRewards(state);
    }

    recordPlayerAction() {
        if (!this.learningActive || this.aiActive) return;

        // Record at the same frequency as AI decisions (every 150ms)
        const now = Date.now();
        if (!this.lastPlayerRecordTime) this.lastPlayerRecordTime = now;
        if (now - this.lastPlayerRecordTime < 150) return;
        this.lastPlayerRecordTime = now;

        try {
            const state = this.gameState.getState();
            const action = this.getPlayerAction();

            if (state && action !== null) {
                const experience = {
                    state: state.slice(),
                    action: action,
                    timestamp: Date.now(),
                    source: 'player'
                };

                this.currentSession.push(experience);

                // Log occasionally to show it's working
                if (this.currentSession.length % 50 === 0) {
                    console.log(`📚 AI: Recorded ${this.currentSession.length} player actions (every 150ms)`);
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

    updateRealTimeRewards(state) {
        const currentPlayerHealth = window.playerHealth || playerHealth || 100;
        const currentScore = window.score || score || 0;

        if (this.lastPlayerHealth === null) {
            this.lastPlayerHealth = currentPlayerHealth;
            this.lastScore = currentScore;
            return;
        }

        let reward = 0.01; // Small survival reward

        // Heavy penalty for damage
        if (currentPlayerHealth < this.lastPlayerHealth) {
            const damage = this.lastPlayerHealth - currentPlayerHealth;
            reward -= damage * 5.0;
        }

        // Reward for kills
        if (currentScore > this.lastScore) {
            const kills = currentScore - this.lastScore;
            reward += kills * 0.1;
        }

        // Strong boundary penalty
        const playerX = state[0];
        const playerY = state[1];
        const boundaryThreshold = 0.2;

        let boundaryPenalty = 0;
        if (playerX < boundaryThreshold) boundaryPenalty += (boundaryThreshold - playerX) * 5;
        if (playerX > (1 - boundaryThreshold)) boundaryPenalty += (playerX - (1 - boundaryThreshold)) * 5;
        if (playerY < boundaryThreshold) boundaryPenalty += (boundaryThreshold - playerY) * 5;
        if (playerY > (1 - boundaryThreshold)) boundaryPenalty += (playerY - (1 - boundaryThreshold)) * 5;

        reward -= boundaryPenalty;

        // Store reward with last experience
        if (this.currentSession.length > 0 && Math.abs(reward - 0.01) > 0.001) {
            const lastExp = this.currentSession[this.currentSession.length - 1];
            if (lastExp && lastExp.source === 'ai') {
                this.agent.remember(lastExp.state, lastExp.action, reward, state, false);
            }
        }

        this.lastPlayerHealth = currentPlayerHealth;
        this.lastScore = currentScore;
    }

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

    clickElement(element) {
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const events = [
            new MouseEvent('mousedown', { bubbles: true, clientX: centerX, clientY: centerY }),
            new MouseEvent('mouseup', { bubbles: true, clientX: centerX, clientY: centerY }),
            new MouseEvent('click', { bubbles: true, clientX: centerX, clientY: centerY }),
            new PointerEvent('pointerdown', { bubbles: true, clientX: centerX, clientY: centerY, pointerId: 1 }),
            new PointerEvent('pointerup', { bubbles: true, clientX: centerX, clientY: centerY, pointerId: 1 })
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

            const clickEvent = new MouseEvent('click', {
                bubbles: true, clientX: centerX, clientY: centerY
            });
            canvas.dispatchEvent(clickEvent);
        }
    }

    simulateKeyPress(key) {
        const downEvent = new KeyboardEvent('keydown', { key, bubbles: true });
        const upEvent = new KeyboardEvent('keyup', { key, bubbles: true });

        document.dispatchEvent(downEvent);
        setTimeout(() => document.dispatchEvent(upEvent), 100);
    }

    async processSession() {
        if (this.currentSession.length < 10) {
            console.log(`📊 SESSION TOO SHORT: ${this.currentSession.length} actions (need 10+ to process)`);
            return;
        }

        try {
            console.log(`🧠 PROCESSING SESSION: ${this.currentSession.length} actions → agent memory...`);

            // Process each experience in the session
            for (let i = 0; i < this.currentSession.length - 1; i++) {
                const experience = this.currentSession[i];
                const nextState = this.currentSession[i + 1].state;

                // Calculate a simple reward (this is basic - could be improved)
                const reward = 0.01; // Small positive reward for surviving

                // Add to agent memory
                this.agent.remember(
                    experience.state,
                    experience.action,
                    reward,
                    nextState,
                    false // not done
                );
            }

            console.log(`📊 MEMORY UPDATE: Session → Memory | Agent memory now: ${this.agent.memory.length} experiences`);

            // Now try to train if we have enough experiences
            if (this.agent.memory.length >= 32) {
                const loss = await this.agent.replay();

                // Make loss values VERY visible
                if (loss !== null && loss !== undefined) {
                    console.log(`🔥 TRAINING LOSS: ${loss.toFixed(6)} | Memory: ${this.agent.memory.length} | Epsilon: ${this.agent.config.epsilon.toFixed(3)}`);

                    // Store loss history for trend analysis
                    if (!this.lossHistory) this.lossHistory = [];
                    this.lossHistory.push(loss);

                    // Keep only last 10 loss values
                    if (this.lossHistory.length > 10) this.lossHistory.shift();

                    // Show trend
                    if (this.lossHistory.length >= 3) {
                        const recent = this.lossHistory.slice(-3);
                        const trend = recent[2] < recent[0] ? "📉 IMPROVING" : "📈 INCREASING";
                        console.log(`🔥 LOSS TREND: ${trend} | Last 3: [${recent.map(l => l.toFixed(4)).join(', ')}]`);
                    }
                } else {
                    console.log(`🔥 TRAINING: Complete but no loss reported`);
                }
            } else {
                console.log(`📊 NEED MORE DATA: Agent memory has ${this.agent.memory.length}/32 experiences (need 32+ for training)`);
            }

            // Clear the session after processing
            this.currentSession = [];

        } catch (error) {
            console.error("🔥 TRAINING ERROR:", error);
        }
    }

    toggleAIControl() {
        if (!this.enabled) {
            alert("AI not initialized. Click 'Enable AI' first.");
            return;
        }

        this.aiActive = !this.aiActive;

        if (this.aiActive) {
            console.log("🤖 AI taking control");
            this.showAIIndicator();
            this.currentDirection = 0;
            this.gameOverHandled = false;
            this.levelUpHandled = false;
            this.lastPlayerHealth = null;
            this.lastScore = 0;
            this.isReallyStuck = false;
        } else {
            console.log("🎮 Player control restored");
            this.hideAIIndicator();
            this.releaseAllMovementKeys();
            this.gameOverHandled = false;
            this.levelUpHandled = false;
        }
    }

    toggleLearning() {
        if (!this.enabled) {
            alert("AI not initialized. Click 'Enable AI' first.");
            return;
        }

        this.learningActive = !this.learningActive;

        if (this.learningActive) {
            console.log("📚 AI learning ENABLED");
            this.currentSession = [];
        } else {
            console.log("📚 AI learning DISABLED");
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
        indicator.innerHTML = 'AI';
        document.body.appendChild(indicator);

        const style = document.createElement('style');
        style.textContent = '@keyframes aiPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 0.9; } }';
        document.head.appendChild(style);
    }

    hideAIIndicator() {
        const indicator = document.getElementById('ai-active-indicator');
        if (indicator) indicator.remove();
    }

    async saveModel() {
        if (!this.agent) {
            alert("No AI model to save");
            return;
        }

        try {
            const modelName = prompt("Model name:", "automata-evasive-" + Date.now());
            if (!modelName) return;

            await this.agent.saveModel(modelName);
            alert(`Model saved as: ${modelName}`);
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
            alert(success ? "Model loaded successfully!" : "Failed to load model");
        } catch (error) {
            console.error("Load error:", error);
            alert("Failed to load model: " + error.message);
        }
    }

    createAIInterface() {
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
            min-width: 200px;
        `;

        ui.innerHTML = `
            <div style="margin-bottom: 10px;">
                <div>Status: <span id="ai-status">Ready</span></div>
                <div>Learning: <span id="learning-status">Off</span></div>
                <div>Session/Memory: <span id="session-length">S:0 M:0</span></div>
                <div>Decisions: <span id="decision-count">0</span></div>
                <div>Stuck: <span id="stuck-indicator">No</span></div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <button id="toggle-ai" style="padding: 8px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Toggle AI Control (X)
                </button>
                <button id="toggle-learning" style="padding: 8px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Toggle Learning (C)
                </button>
                <button id="save-model" style="padding: 6px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    Save Model
                </button>
                <button id="load-model" style="padding: 6px; background: #9C27B0; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    Load Model
                </button>
            </div>
            
            <div style="margin-top: 8px; font-size: 10px; color: #aaa;">
                S=Session (current actions), M=Memory (training data)<br>
                Need 32+ Memory for training to start
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
        const decisionEl = document.getElementById('decision-count');
        const stuckEl = document.getElementById('stuck-indicator');

        if (statusEl) {
            statusEl.textContent = this.aiActive ? 'AI Active' : 'Player';
            statusEl.style.color = this.aiActive ? '#ff4444' : '#44ff44';
        }

        if (learningEl) {
            if (this.learningActive) {
                const memoryInfo = this.agent ? ` (Mem: ${this.agent.memory.length})` : '';
                learningEl.textContent = `Recording${memoryInfo}`;
                learningEl.style.color = '#ffaa00';
            } else {
                learningEl.textContent = 'Off';
                learningEl.style.color = '#888';
            }
        }

        if (sessionEl) {
            const sessionCount = this.currentSession.length;
            const memoryCount = this.agent ? this.agent.memory.length : 0;
            sessionEl.textContent = `S:${sessionCount} M:${memoryCount}`;
        }

        if (decisionEl) decisionEl.textContent = this.actionCount;
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
 * COMPACT GAME STATE EXTRACTOR
 */
class CompactGameStateExtractor {
    constructor() {
        this.gameWidth = 1200;
        this.gameHeight = 800;
        this.lastState = null;
    }

    initialize(scene) {
        this.scene = scene;
        if (scene?.game?.config) {
            this.gameWidth = scene.game.config.width;
            this.gameHeight = scene.game.config.height;
        }
        console.log("🧠 Compact state extractor initialized");
    }

    getState() {
        try {
            const gamePlayer = window.player || player;
            if (!gamePlayer) return this.lastState;

            if (window.gameOver ?? gameOver) return this.lastState;

            const state = [
                // Player position (normalized)
                gamePlayer.x / this.gameWidth,
                gamePlayer.y / this.gameHeight,

                // Player stats (normalized)
                (window.playerHealth || playerHealth || 100) / (window.maxPlayerHealth || maxPlayerHealth || 100),
                Math.min((window.playerDamage || playerDamage || 10) / 50, 1),
                Math.min((window.playerSpeed || playerSpeed || 8) / 20, 1),
                Math.min((window.elapsedTime || elapsedTime || 0) / 1800, 1),

                // Threat detection in 8 directions
                ...this.getDirectionalThreats(gamePlayer),

                // Closest enemy info
                ...this.getClosestEnemyInfo(gamePlayer),

                // Boundary info
                ...this.getBoundaryInfo(gamePlayer)
            ];

            this.lastState = state;
            return state;

        } catch (error) {
            console.error("State extraction error:", error);
            return this.lastState;
        }
    }

    getDirectionalThreats(player) {
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

        const checkDistance = 100;
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

    getClosestEnemyInfo(player) {
        try {
            const enemies = window.EnemySystem?.enemiesGroup?.getChildren() || [];
            let closestDist = Infinity;
            let closestAngle = 0;
            let closestThreat = 0;

            for (const enemy of enemies) {
                if (enemy?.active && enemy.x !== undefined) {
                    const dx = enemy.x - player.x;
                    const dy = enemy.y - player.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < closestDist && dist < 200) {
                        closestDist = dist;
                        closestAngle = Math.atan2(dy, dx) / Math.PI;
                        closestThreat = 0.5;
                    }
                }
            }

            return [
                Math.min(closestDist / 200, 1),
                closestAngle,
                closestThreat
            ];
        } catch (e) {
            return [1, 0, 0];
        }
    }

    getBoundaryInfo(player) {
        const normalizedX = player.x / this.gameWidth;
        const normalizedY = player.y / this.gameHeight;

        return [
            normalizedX,
            1 - normalizedX,
            normalizedY,
            1 - normalizedY,
            Math.min(normalizedX, 1 - normalizedX, normalizedY, 1 - normalizedY)
        ];
    }

    getStateSize() {
        return 22;
    }
}

/**
 * EVASIVE SURVIVAL AGENT - Focuses on movement and avoidance
 */
class EvasiveSurvivalAgent {
    constructor(stateSize, actionSize) {
        this.stateSize = stateSize;
        this.actionSize = actionSize;

        this.config = {
            learningRate: 0.001,
            gamma: 0.95,
            epsilon: 0.4,
            epsilonMin: 0.05,
            epsilonDecay: 0.995,
            batchSize: 32,
            memorySize: 5000
        };

        this.memory = [];
        this.memoryIndex = 0;

        this.mainNetwork = this.buildEvasiveNetwork();
        this.targetNetwork = this.buildEvasiveNetwork();
        this.updateTargetNetwork();

        this.totalSteps = 0;

        console.log(`🧠 Evasive Survival Agent: ${stateSize} inputs → ${actionSize} actions`);
    }

    buildEvasiveNetwork() {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [this.stateSize],
                    units: 32,
                    activation: 'relu'
                }),
                tf.layers.dense({
                    units: 16,
                    activation: 'relu'
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
        if (this.memory.length < 20 || Math.random() < this.config.epsilon) {
            return this.chooseEvasiveAction(state);
        }

        const stateTensor = tf.tensor2d([state]);
        const qValues = await this.mainNetwork.predict(stateTensor);
        const action = await qValues.argMax(1).data();

        stateTensor.dispose();
        qValues.dispose();

        return action[0];
    }

    chooseEvasiveAction(state) {
        const playerX = state[0];
        const playerY = state[1];
        const playerHealth = state[2];
        const minBoundaryDist = state[21];

        // ALWAYS log position every 20 frames to debug boundary detection
        if (this.actionCount % 20 === 0) {
            console.log(`🔍 AI POSITION: X:${playerX.toFixed(3)} Y:${playerY.toFixed(3)} (boundaries at 0.25/0.75)`);
        }

        // Get threat directions (indices 6-13)
        const threats = state.slice(6, 14);

        // Start with balanced action weights
        const actionWeights = [1, 1, 1, 1, 1, 1, 1, 1, 1];

        // GRADUAL boundary avoidance - with MUCH more visible debugging
        const softBoundaryThreshold = 0.25; // Start applying pressure at 25% from edges

        // Calculate boundary pressures
        const leftPressure = Math.max(0, (softBoundaryThreshold - playerX) / softBoundaryThreshold);
        const rightPressure = Math.max(0, (playerX - (1 - softBoundaryThreshold)) / softBoundaryThreshold);
        const topPressure = Math.max(0, (softBoundaryThreshold - playerY) / softBoundaryThreshold);
        const bottomPressure = Math.max(0, (playerY - (1 - softBoundaryThreshold)) / softBoundaryThreshold);

        // ALWAYS log pressure calculations every 10 frames when ANY pressure > 0
        const anyPressure = leftPressure > 0 || rightPressure > 0 || topPressure > 0 || bottomPressure > 0;
        if (anyPressure && this.actionCount % 10 === 0) {
            console.log(`🟡 BOUNDARY PRESSURE: L:${leftPressure.toFixed(2)} R:${rightPressure.toFixed(2)} T:${topPressure.toFixed(2)} B:${bottomPressure.toFixed(2)}`);
        }

        // Apply gradual boundary pressure
        if (leftPressure > 0) {
            const penalty = Math.max(0.1, 1 - (leftPressure * 0.8)); // Reduce weight by up to 80%, minimum 10%
            actionWeights[7] *= penalty; // Left
            actionWeights[6] *= penalty; // Down-left
            actionWeights[8] *= penalty; // Up-left

            const boost = 1 + (leftPressure * 3); // Boost by up to 300%
            actionWeights[3] *= boost; // Right
            actionWeights[2] *= boost * 0.7; // Up-right
            actionWeights[4] *= boost * 0.7; // Down-right

            console.log(`🟡 LEFT BOUNDARY: penalty=${penalty.toFixed(2)}, boost=${boost.toFixed(2)}`);
        }

        if (rightPressure > 0) {
            const penalty = Math.max(0.1, 1 - (rightPressure * 0.8));
            actionWeights[3] *= penalty; // Right
            actionWeights[2] *= penalty; // Up-right
            actionWeights[4] *= penalty; // Down-right

            const boost = 1 + (rightPressure * 3);
            actionWeights[7] *= boost; // Left
            actionWeights[6] *= boost * 0.7; // Down-left
            actionWeights[8] *= boost * 0.7; // Up-left

            console.log(`🟡 RIGHT BOUNDARY: penalty=${penalty.toFixed(2)}, boost=${boost.toFixed(2)}`);
        }

        if (topPressure > 0) {
            const penalty = Math.max(0.1, 1 - (topPressure * 0.8));
            actionWeights[1] *= penalty; // Up
            actionWeights[2] *= penalty; // Up-right
            actionWeights[8] *= penalty; // Up-left

            const boost = 1 + (topPressure * 3);
            actionWeights[5] *= boost; // Down
            actionWeights[4] *= boost * 0.7; // Down-right
            actionWeights[6] *= boost * 0.7; // Down-left

            console.log(`🟡 TOP BOUNDARY: penalty=${penalty.toFixed(2)}, boost=${boost.toFixed(2)}`);
        }

        if (bottomPressure > 0) {
            const penalty = Math.max(0.1, 1 - (bottomPressure * 0.8));
            actionWeights[5] *= penalty; // Down
            actionWeights[4] *= penalty; // Down-right
            actionWeights[6] *= penalty; // Down-left

            const boost = 1 + (bottomPressure * 3);
            actionWeights[1] *= boost; // Up
            actionWeights[2] *= boost * 0.7; // Up-right
            actionWeights[8] *= boost * 0.7; // Up-left

            console.log(`🟡 BOTTOM BOUNDARY: penalty=${penalty.toFixed(2)}, boost=${boost.toFixed(2)}`);
        }

        // Apply threat avoidance AFTER boundary logic
        threats.forEach((threat, i) => {
            if (threat > 0.1) {
                const actionIndex = i + 1;
                const threatPenalty = Math.max(0.1, 1 - (threat * 2)); // Up to 200% penalty, minimum 10%
                actionWeights[actionIndex] *= threatPenalty;

                // BOOST opposite direction to actively evade
                const oppositeDirection = ((i + 4) % 8) + 1;
                const threatBoost = 1 + (threat * 1.5); // Up to 150% boost
                actionWeights[oppositeDirection] *= threatBoost;
            }
        });

        // When low health, be MORE evasive
        if (playerHealth < 0.5) {
            actionWeights[0] *= 0.3; // Reduce staying still

            // Boost evasion
            threats.forEach((threat, i) => {
                if (threat > 0.05) {
                    const oppositeDirection = ((i + 4) % 8) + 1;
                    actionWeights[oppositeDirection] *= 1.5;
                }
            });
        }

        // Choose action based on weights
        const totalWeight = actionWeights.reduce((sum, w) => sum + w, 0);
        if (totalWeight <= 0) {
            console.log("🚨 AI: All actions blocked, forcing center movement");
            return playerX < 0.5 ? 3 : 7;
        }

        let random = Math.random() * totalWeight;

        for (let i = 0; i < actionWeights.length; i++) {
            random -= actionWeights[i];
            if (random <= 0) {
                // Log chosen action when near boundaries OR every 30 frames for debugging
                if (anyPressure || this.actionCount % 30 === 0) {
                    const actionNames = ['Stay', 'Up', 'Up-Right', 'Right', 'Down-Right', 'Down', 'Down-Left', 'Left', 'Up-Left'];
                    const topWeights = actionWeights.map((w, idx) => `${idx}:${w.toFixed(1)}`).join(',');
                    console.log(`🎯 AI CHOSE: ${i} (${actionNames[i]}) | Weights: ${topWeights}`);
                }
                return i;
            }
        }

        return 0;
    }

    remember(state, action, reward, nextState, done) {
        const experience = { state: state.slice(), action, reward, nextState: nextState?.slice(), done };

        if (this.memory.length < this.config.memorySize) {
            this.memory.push(experience);
        } else {
            this.memory[this.memoryIndex] = experience;
            this.memoryIndex = (this.memoryIndex + 1) % this.config.memorySize;
        }
    }

    async replay() {
        if (this.memory.length < this.config.batchSize) return null;

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
        const history = await this.mainNetwork.fit(statesTensor, targetTensor, { epochs: 1, verbose: 0 });

        const loss = history.history.loss[0];

        // Cleanup
        statesTensor.dispose();
        qValues.dispose();
        targetTensor.dispose();
        if (targetQValues) targetQValues.dispose();

        if (this.config.epsilon > this.config.epsilonMin) {
            this.config.epsilon *= this.config.epsilonDecay;
        }

        this.totalSteps++;
        if (this.totalSteps % 50 === 0) {
            this.updateTargetNetwork();
        }

        if (this.totalSteps % 200 === 0) {
            try {
                await this.saveModel('automata-evasive-autosave');
                console.log(`🔄 Auto-saved evasive model at step ${this.totalSteps}`);
            } catch (error) {
                console.warn("Auto-save failed:", error);
            }
        }

        return loss;
    }

    updateTargetNetwork() {
        const mainWeights = this.mainNetwork.getWeights();
        this.targetNetwork.setWeights(mainWeights);
    }

    async saveModel(name) {
        try {
            await this.mainNetwork.save(`localstorage://${name}`);
            console.log(`✅ Evasive model saved: ${name}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to save evasive model: ${error}`);
            return false;
        }
    }

    async loadModel(name) {
        try {
            this.mainNetwork = await tf.loadLayersModel(`localstorage://${name}`);
            this.updateTargetNetwork();
            console.log(`✅ Evasive model loaded: ${name}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to load evasive model: ${error}`);
            return false;
        }
    }
}

// Global AI controller instance
window.gameAI = new GameAIController();

// Keyboard event handling
document.addEventListener('keydown', (event) => {
    if (window.gameAI) {
        window.gameAI.handleKeyPress(event);
    }
});

console.log("🤖 Fixed Game AI System loaded! Improved boundary avoidance, level-up detection, and proper training frequency.");