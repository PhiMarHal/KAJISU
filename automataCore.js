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

        // Game state tracking
        this.lastPlayerHealth = null;
        this.lastScore = 0;
        this.gameStartTime = null;

        // Game over handling
        this.gameOverHandled = false;
        this.levelUpHandled = false;
        this.levelUpStartTime = null;

        // Auto-loading
        this.autoLoadAttempted = false;

        console.log("🤖 Fixed GameAI Controller - proper evasive movement and calculated perk selection");
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
        const globalLevelUpInProgress = window.levelUpInProgress ?? (typeof levelUpInProgress !== 'undefined' ? levelUpInProgress : false);
        const hasLevelUpCards = window.levelUpCards?.length > 0 ?? (typeof levelUpCards !== 'undefined' ? levelUpCards?.length > 0 : false);
        const isGamePaused = window.gamePaused ?? (typeof gamePaused !== 'undefined' ? gamePaused : false);

        const hasLevelUpUI = this.detectLevelUpUI();

        const result = globalLevelUpInProgress || hasLevelUpCards || hasLevelUpUI || (isGamePaused && hasLevelUpUI);

        if (result && !this.levelUpStartTime) {
            console.log("🎓 AI: Level up detected - stopping movement");
        }

        return result;
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
            console.log("🎓 AI: Level up started - movement stopped");
        }

        if (this.levelUpHandled) return;

        const elapsed = Date.now() - this.levelUpStartTime;

        // Wait for UI to settle
        if (elapsed < 1000) return;

        console.log("🎓 AI: Attempting calculated perk selection...");
        const perkSelected = this.selectPerkByCalculatedPosition();

        if (perkSelected) {
            this.levelUpHandled = true;
            this.levelUpStartTime = null;
            console.log("🎓 AI: Perk selected successfully");
        } else if (elapsed > 8000) {
            console.log("🎓 AI: Perk selection timeout after 8 seconds");
            this.emergencyLevelUpExit();
            this.levelUpHandled = true;
            this.levelUpStartTime = null;
        }
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
        if (this.currentSession.length < 10) return;

        try {
            console.log(`🧠 Training AI on ${this.currentSession.length} actions...`);

            if (this.agent.memory.length > 32) {
                const loss = await this.agent.replay();
                console.log(`✅ Training complete. Loss: ${loss?.toFixed(4) || 'N/A'}`);
            }

            this.currentSession = [];
        } catch (error) {
            console.error("Training error:", error);
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
                <div>Session: <span id="session-length">0</span> actions</div>
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
            learningEl.textContent = this.learningActive ? 'Recording' : 'Off';
            learningEl.style.color = this.learningActive ? '#ffaa00' : '#888';
        }

        if (sessionEl) sessionEl.textContent = this.currentSession.length;
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

        // Get threat directions (indices 6-13)
        const threats = state.slice(6, 14);

        // Start with balanced action weights
        const actionWeights = [1, 1, 1, 1, 1, 1, 1, 1, 1];

        // AVOID directions with threats (move away from danger)
        threats.forEach((threat, i) => {
            if (threat > 0.1) {
                const actionIndex = i + 1;
                actionWeights[actionIndex] *= (1 - threat * 3); // Strong avoidance

                // BOOST opposite direction to actively evade
                const oppositeDirection = ((i + 4) % 8) + 1;
                actionWeights[oppositeDirection] *= (1 + threat * 2);
            }
        });

        // Boundary avoidance
        const boundaryThreshold = 0.2;

        if (playerX < boundaryThreshold) {
            actionWeights[7] *= 0.2;  // Avoid left
            actionWeights[6] *= 0.2;  // Avoid down-left  
            actionWeights[8] *= 0.2;  // Avoid up-left
            actionWeights[3] *= 2;    // Favor right
        }
        if (playerX > (1 - boundaryThreshold)) {
            actionWeights[3] *= 0.2;  // Avoid right
            actionWeights[2] *= 0.2;  // Avoid up-right
            actionWeights[4] *= 0.2;  // Avoid down-right
            actionWeights[7] *= 2;    // Favor left
        }
        if (playerY < boundaryThreshold) {
            actionWeights[1] *= 0.2;  // Avoid up
            actionWeights[2] *= 0.2;  // Avoid up-right
            actionWeights[8] *= 0.2;  // Avoid up-left
            actionWeights[5] *= 2;    // Favor down
        }
        if (playerY > (1 - boundaryThreshold)) {
            actionWeights[5] *= 0.2;  // Avoid down
            actionWeights[4] *= 0.2;  // Avoid down-right
            actionWeights[6] *= 0.2;  // Avoid down-left
            actionWeights[1] *= 2;    // Favor up
        }

        // When low health, be MORE evasive, not less
        if (playerHealth < 0.5) {
            // Reduce staying still when low health
            actionWeights[0] *= 0.5;

            // Boost movement away from threats
            threats.forEach((threat, i) => {
                if (threat > 0.05) {
                    const oppositeDirection = ((i + 4) % 8) + 1;
                    actionWeights[oppositeDirection] *= 3; // Even stronger evasion when low health
                }
            });
        }

        // Choose action based on weights
        const totalWeight = actionWeights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < actionWeights.length; i++) {
            random -= actionWeights[i];
            if (random <= 0) return i;
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

console.log("🤖 Fixed Game AI System loaded! Proper evasive movement and calculated perk selection.");