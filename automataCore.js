// automataCore.js - Improved AI system with smaller footprint and better behavior

/**
 * MAIN AI CONTROLLER - Completely rewritten for better performance
 * Key improvements:
 * - Much smaller neural network (fits in localStorage)
 * - Better spatial awareness without overcomplicated grids
 * - Fixed stuck detection (only when truly stuck)
 * - Simplified but more robust perk selection
 * - Better survival-focused behavior
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

        // Improved movement state with fixed stuck detection
        this.currentDirection = 0;
        this.lastDecisionTime = 0;
        this.keysPressed = new Set();

        // Fixed stuck detection - only when truly not moving
        this.lastPosition = { x: 0, y: 0, time: 0 };
        this.stuckCheckInterval = 2000; // Check every 2 seconds
        this.stuckThreshold = 10; // Must move at least 10 pixels in 2 seconds
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

        console.log("🤖 Improved GameAI Controller initialized - smaller network, better behavior");
    }

    async initialize(scene) {
        if (this.enabled) return true;

        try {
            console.log("🔄 Loading AI systems...");

            // Load TensorFlow.js
            if (!window.tf) {
                console.log("📥 Loading TensorFlow.js...");
                await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0/dist/tf.min.js');
                console.log("✅ TensorFlow.js loaded");
            }

            this.tfLoaded = true;
            this.scene = scene;

            // Initialize compact game state reader
            this.gameState = new CompactGameStateExtractor();
            this.gameState.initialize(scene);

            // Initialize RL agent with much smaller network
            const stateSize = this.gameState.getStateSize();
            const actionSize = 9; // 8 directions + stay

            this.agent = new CompactSurvivalAgent(stateSize, actionSize);

            this.enabled = true;
            console.log("✅ AI systems initialized successfully");

            // Auto-load saved model
            await this.attemptAutoLoad();

            // Show UI
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
            const autoSaveSuccess = await this.agent.loadModel('automata-compact-autosave');
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

        // Update stuck detection
        this.updateStuckDetection();

        // Make AI decisions when active
        if (this.aiActive) {
            this.makeAIDecision();
        }

        // Record player actions for learning
        if (this.learningActive && !this.aiActive) {
            this.recordPlayerAction();
        }

        // Track game state
        this.updateGameStateTracking();

        // Check for game over
        if (this.isGameOver() && !this.gameOverHandled) {
            this.handleGameOver();
        }

        // Update UI
        this.updateInterface();
    }

    // Fixed stuck detection - only when truly not moving
    updateStuckDetection() {
        const gamePlayer = window.player || player;
        if (!gamePlayer) return;

        const now = Date.now();
        const currentPos = { x: gamePlayer.x, y: gamePlayer.y, time: now };

        // Check if enough time has passed for stuck detection
        if (now - this.lastPosition.time >= this.stuckCheckInterval) {
            const distance = Math.sqrt(
                Math.pow(currentPos.x - this.lastPosition.x, 2) +
                Math.pow(currentPos.y - this.lastPosition.y, 2)
            );

            // Only consider stuck if moved less than threshold AND we're trying to move
            this.isReallyStuck = distance < this.stuckThreshold && this.currentDirection !== 0;

            this.lastPosition = currentPos;
        }
    }

    updateGameStateTracking() {
        // Track game start
        if (!this.gameStartTime && !this.isGameOver()) {
            this.gameStartTime = Date.now();
        }

        // Reset on new game
        if (this.gameStartTime && this.isGameOver()) {
            this.gameStartTime = null;
        }
    }

    async makeAIDecision() {
        const now = Date.now();

        // Make decisions every 150ms for responsive but not frantic gameplay
        if (now - this.lastDecisionTime < 150) return;

        try {
            const state = this.gameState.getState();
            if (!state) return;

            // Handle level-up
            if (this.isLevelUpActive()) {
                this.handleLevelUp();
                return;
            }

            // Handle game over
            if (this.isGameOver()) {
                this.handleGameOver();
                return;
            }

            let newDirection;

            // Emergency unstuck action (only when truly stuck)
            if (this.isReallyStuck) {
                newDirection = this.getUnstuckAction(state);
                this.isReallyStuck = false; // Reset
                console.log("🆘 AI: Emergency unstuck action");
            } else {
                newDirection = await this.agent.chooseAction(state);
            }

            // Change direction
            if (newDirection !== this.currentDirection) {
                this.changeDirection(newDirection);
                this.currentDirection = newDirection;

                // Record for learning
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

        // Move towards center with some randomness
        const targetX = 0.4 + Math.random() * 0.2; // 40-60% across screen
        const targetY = 0.4 + Math.random() * 0.2; // 40-60% down screen

        const deltaX = targetX - playerX;
        const deltaY = targetY - playerY;

        // Choose direction based on largest delta
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            return deltaX > 0 ? 3 : 7; // Right or Left
        } else {
            return deltaY > 0 ? 5 : 1; // Down or Up
        }
    }

    isLevelUpActive() {
        // Check multiple indicators
        const globalLevelUpInProgress = window.levelUpInProgress ?? (typeof levelUpInProgress !== 'undefined' ? levelUpInProgress : false);
        const hasLevelUpCards = window.levelUpCards?.length > 0 ?? (typeof levelUpCards !== 'undefined' ? levelUpCards?.length > 0 : false);
        const isGamePaused = window.gamePaused ?? (typeof gamePaused !== 'undefined' ? gamePaused : false);

        return globalLevelUpInProgress || hasLevelUpCards || (isGamePaused && this.detectLevelUpUI());
    }

    detectLevelUpUI() {
        const levelUpTexts = ['LEVEL UP', 'CHOOSE A PERK', 'TYPE ROMAJI'];
        const allElements = document.querySelectorAll('*');

        return Array.from(allElements).some(el => {
            const text = el.textContent || '';
            const style = window.getComputedStyle(el);
            return levelUpTexts.some(levelText => text.includes(levelText)) &&
                style.display !== 'none' && style.visibility !== 'hidden';
        });
    }

    handleLevelUp() {
        if (!this.levelUpStartTime) {
            this.levelUpStartTime = Date.now();
            this.levelUpHandled = false;
            console.log("🎓 AI: Level up detected");
        }

        if (this.levelUpHandled) return;

        const elapsed = Date.now() - this.levelUpStartTime;

        // Wait for UI to settle
        if (elapsed < 1000) return;

        // Try simplified perk selection
        const perkSelected = this.selectAnyAvailablePerk();

        if (perkSelected) {
            this.levelUpHandled = true;
            this.levelUpStartTime = null;
            console.log("🎓 AI: Perk selected successfully");
        } else if (elapsed > 8000) {
            // Timeout - try emergency clicks
            console.log("🎓 AI: Perk selection timeout, trying emergency clicks");
            this.emergencyClickStrategy();
            this.levelUpHandled = true;
            this.levelUpStartTime = null;
        }
    }

    // Simplified perk selection - just find and click anything that looks like a perk
    selectAnyAvailablePerk() {
        console.log("🎓 AI: Looking for any clickable perk...");

        // Strategy 1: Look for any kanji characters that are clickable
        const allElements = document.querySelectorAll('*');

        for (const element of allElements) {
            const text = element.textContent || '';
            const hasKanji = /[\u4e00-\u9faf]/.test(text); // Japanese kanji range

            if (hasKanji) {
                const style = window.getComputedStyle(element);
                const rect = element.getBoundingClientRect();

                const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 20 && rect.height > 20;
                const isReasonableSize = rect.width < 300 && rect.height < 200; // Not too big

                if (isVisible && isReasonableSize) {
                    console.log(`🎓 AI: Found kanji element: "${text.trim()}" - attempting click`);
                    this.clickElement(element);
                    return true;
                }
            }
        }

        // Strategy 2: Look for any large clickable areas (like card backgrounds)
        for (const element of allElements) {
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();

            const isClickable = style.cursor === 'pointer' || element.onclick || element.getAttribute('onclick');
            const isCardSized = rect.width > 150 && rect.width < 350 && rect.height > 200 && rect.height < 400;
            const isVisible = style.display !== 'none' && style.visibility !== 'hidden';

            if (isClickable && isCardSized && isVisible) {
                console.log("🎓 AI: Found card-sized clickable element - attempting click");
                this.clickElement(element);
                return true;
            }
        }

        return false;
    }

    emergencyClickStrategy() {
        // Try clicking center and random areas
        this.clickCenter();
        setTimeout(() => this.clickRandomArea(), 200);
        setTimeout(() => this.simulateKeyPress('Enter'), 400);
        setTimeout(() => this.clickRandomArea(), 600);
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
        }, 2000); // Wait 2 seconds before restart attempt
    }

    attemptGameRestart() {
        console.log("🔄 AI: Attempting to restart game...");

        // Method 1: Look for restart button text
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

        // Method 2: Try calling startGame directly if available
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

        // Method 3: Emergency key presses
        console.log("🔄 AI: Trying emergency restart keys");
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

        // Calculate immediate reward
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

        // Map velocity to action index
        if (vx === 0 && vy === 0) return 0; // Stay
        if (vx === 0 && vy === -1) return 1; // Up
        if (vx === 1 && vy === -1) return 2; // Up-right
        if (vx === 1 && vy === 0) return 3; // Right
        if (vx === 1 && vy === 1) return 4; // Down-right
        if (vx === 0 && vy === 1) return 5; // Down
        if (vx === -1 && vy === 1) return 6; // Down-left
        if (vx === -1 && vy === 0) return 7; // Left
        if (vx === -1 && vy === -1) return 8; // Up-left

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

        // Penalty for damage
        if (currentPlayerHealth < this.lastPlayerHealth) {
            const damage = this.lastPlayerHealth - currentPlayerHealth;
            reward -= damage * 3.0; // Heavy penalty for taking damage
        }

        // Reward for kills
        if (currentScore > this.lastScore) {
            const kills = currentScore - this.lastScore;
            reward += kills * 0.2;
        }

        // Boundary penalty
        const playerX = state[0];
        const playerY = state[1];
        if (playerX < 0.15 || playerX > 0.85 || playerY < 0.15 || playerY > 0.85) {
            reward -= 0.05;
        }

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
            { keys: [] },                    // 0: stay
            { keys: ['up'] },                // 1: up
            { keys: ['up', 'right'] },       // 2: up-right
            { keys: ['right'] },             // 3: right
            { keys: ['down', 'right'] },     // 4: down-right
            { keys: ['down'] },              // 5: down
            { keys: ['down', 'left'] },      // 6: down-left
            { keys: ['left'] },              // 7: left
            { keys: ['up', 'left'] }         // 8: up-left
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

    // UI interaction helpers
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

    clickRandomArea() {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const x = rect.left + rect.width * (0.3 + Math.random() * 0.4);
            const y = rect.top + rect.height * (0.3 + Math.random() * 0.4);

            const clickEvent = new MouseEvent('click', {
                bubbles: true, clientX: x, clientY: y
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

            // Train on recorded data
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
            const modelName = prompt("Model name:", "automata-compact-" + Date.now());
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
            position: fixed; top: 20px; left: 20px;
            background: rgba(0,0,0,0.9); color: white;
            padding: 15px; border-radius: 8px;
            font-family: Arial, sans-serif; font-size: 12px;
            z-index: 1000; border: 2px solid #4CAF50;
            min-width: 200px;
        `;

        ui.innerHTML = `
            <div style="margin-bottom: 10px; text-align: center; font-weight: bold; color: #4CAF50;">
                🤖 COMPACT AUTOMATA
            </div>
            
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
            
            <div style="margin-top: 10px; font-size: 10px; color: #888;">
                FIXES:<br>
                ✅ Compact neural network (fits in storage)<br>
                ✅ Fixed stuck detection (only when truly stuck)<br>
                ✅ Simplified perk selection<br>
                ✅ Better survival behavior<br>
                ✅ Improved spatial awareness<br><br>
                X = Toggle AI, C = Toggle learning
            </div>
        `;

        document.body.appendChild(ui);

        // Attach events
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
 * Much smaller state representation that fits in localStorage
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

            // Compact state: player info + nearby threats
            const state = [
                // Player position (normalized)
                gamePlayer.x / this.gameWidth,
                gamePlayer.y / this.gameHeight,

                // Player stats (normalized)
                (window.playerHealth || playerHealth || 100) / (window.maxPlayerHealth || maxPlayerHealth || 100),
                Math.min((window.playerDamage || playerDamage || 10) / 50, 1),
                Math.min((window.playerSpeed || playerSpeed || 8) / 20, 1),
                Math.min((window.elapsedTime || elapsedTime || 0) / 1800, 1), // 30 min max

                // Threat detection in 8 directions around player
                ...this.getDirectionalThreats(gamePlayer),

                // Closest enemy info
                ...this.getClosestEnemyInfo(gamePlayer),

                // Boundary distances
                ...this.getBoundaryDistances(gamePlayer)
            ];

            this.lastState = state;
            return state;

        } catch (error) {
            console.error("State extraction error:", error);
            return this.lastState;
        }
    }

    getDirectionalThreats(player) {
        // Check 8 directions around player for threats
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

        const checkDistance = 150; // pixels
        const threats = [];

        directions.forEach(dir => {
            const checkX = player.x + dir.dx * checkDistance;
            const checkY = player.y + dir.dy * checkDistance;

            let threatLevel = 0;

            // Check for enemies
            try {
                const enemies = window.EnemySystem?.enemiesGroup?.getChildren() || [];
                for (const enemy of enemies) {
                    if (enemy?.active && enemy.x !== undefined) {
                        const dist = Math.sqrt(Math.pow(enemy.x - checkX, 2) + Math.pow(enemy.y - checkY, 2));
                        if (dist < checkDistance) {
                            const intensity = Math.max(0, 1 - dist / checkDistance);
                            threatLevel += intensity * (enemy.isBoss ? 2 : 1);
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

                    if (dist < closestDist && dist < 300) { // Only within 300 pixels
                        closestDist = dist;
                        closestAngle = Math.atan2(dy, dx) / Math.PI; // Normalized to [-1, 1]
                        closestThreat = enemy.isBoss ? 1 : 0.5;
                    }
                }
            }

            return [
                Math.min(closestDist / 300, 1), // Normalized distance
                closestAngle,                   // Angle to closest enemy
                closestThreat                   // Threat level
            ];
        } catch (e) {
            return [1, 0, 0]; // No threat
        }
    }

    getBoundaryDistances(player) {
        return [
            player.x / this.gameWidth,                    // Distance from left edge
            (this.gameWidth - player.x) / this.gameWidth, // Distance from right edge
            player.y / this.gameHeight,                   // Distance from top edge
            (this.gameHeight - player.y) / this.gameHeight // Distance from bottom edge
        ];
    }

    getStateSize() {
        // 6 player stats + 8 directional threats + 3 closest enemy + 4 boundary distances = 21
        return 21;
    }
}

/**
 * COMPACT SURVIVAL AGENT
 * Much smaller neural network that fits in localStorage
 */
class CompactSurvivalAgent {
    constructor(stateSize, actionSize) {
        this.stateSize = stateSize;
        this.actionSize = actionSize;

        this.config = {
            learningRate: 0.001,
            gamma: 0.95,
            epsilon: 0.5,
            epsilonMin: 0.05,
            epsilonDecay: 0.995,
            batchSize: 32,
            memorySize: 5000 // Smaller memory
        };

        this.memory = [];
        this.memoryIndex = 0;

        // Much smaller networks
        this.mainNetwork = this.buildCompactNetwork();
        this.targetNetwork = this.buildCompactNetwork();
        this.updateTargetNetwork();

        this.totalSteps = 0;

        console.log(`🧠 Compact Survival Agent: ${stateSize} inputs → ${actionSize} actions`);
    }

    buildCompactNetwork() {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [this.stateSize],
                    units: 32, // Much smaller
                    activation: 'relu'
                }),
                tf.layers.dense({
                    units: 16, // Even smaller
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
        if (this.memory.length < 10 || Math.random() < this.config.epsilon) {
            return this.chooseSmartAction(state);
        }

        const stateTensor = tf.tensor2d([state]);
        const qValues = await this.mainNetwork.predict(stateTensor);
        const action = await qValues.argMax(1).data();

        stateTensor.dispose();
        qValues.dispose();

        return action[0];
    }

    chooseSmartAction(state) {
        const playerX = state[0];
        const playerY = state[1];
        const playerHealth = state[2];

        // Get threat directions (indices 6-13)
        const threats = state.slice(6, 14);

        // Action weights based on threats and position
        const actionWeights = [2, 1, 1, 1, 1, 1, 1, 1, 1]; // Favor staying still

        // Reduce weights for directions with threats
        threats.forEach((threat, i) => {
            if (threat > 0.3) {
                const actionIndex = i + 1; // Threat directions map to actions 1-8
                actionWeights[actionIndex] *= (1 - threat);
            }
        });

        // Avoid boundaries
        if (playerX < 0.2) actionWeights[7] *= 0.3; // Left
        if (playerX > 0.8) actionWeights[3] *= 0.3; // Right
        if (playerY < 0.2) actionWeights[1] *= 0.3; // Up
        if (playerY > 0.8) actionWeights[5] *= 0.3; // Down

        // When low health, heavily favor staying
        if (playerHealth < 0.5) {
            actionWeights[0] *= 5;
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

        // Decay epsilon
        if (this.config.epsilon > this.config.epsilonMin) {
            this.config.epsilon *= this.config.epsilonDecay;
        }

        // Update target network
        this.totalSteps++;
        if (this.totalSteps % 50 === 0) {
            this.updateTargetNetwork();
        }

        // Auto-save (smaller model saves faster)
        if (this.totalSteps % 200 === 0) {
            try {
                await this.saveModel('automata-compact-autosave');
                console.log(`🔄 Auto-saved compact model at step ${this.totalSteps}`);
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
            console.log(`✅ Compact model saved: ${name}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to save compact model: ${error}`);
            return false;
        }
    }

    async loadModel(name) {
        try {
            this.mainNetwork = await tf.loadLayersModel(`localstorage://${name}`);
            this.updateTargetNetwork();
            console.log(`✅ Compact model loaded: ${name}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to load compact model: ${error}`);
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

console.log("🤖 Compact Game AI System loaded! Fixed storage issues, better movement, simplified perk selection.");