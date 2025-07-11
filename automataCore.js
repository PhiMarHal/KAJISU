// automataCore.js - Complete AI system for survival game

/**
 * MAIN AI CONTROLLER
 * Handles opt-in AI features, training, and control switching
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

        // Training data (primarily from AI's own gameplay)
        this.trainingData = [];
        this.currentSession = [];

        // Movement state for continuous control
        this.currentDirection = 0; // Current movement direction
        this.lastDecisionTime = 0; // When AI last made a movement decision
        this.keysPressed = new Set(); // Track which Phaser key objects are "held down"

        // Perk learning system
        this.perkHistory = this.loadPerkHistory();
        this.currentGamePerks = [];
        this.gameStartTime = null;

        // Performance monitoring
        this.lastActionTime = 0;
        this.actionCount = 0;

        // Real-time reward tracking
        this.lastPlayerHealth = null;
        this.lastScore = 0;
        this.framesSinceLastDamage = 0;

        // Game over handling
        this.gameOverHandled = false;

        console.log("🤖 GameAI Controller initialized - AI self-learning mode");
    }

    // Load perk selection history from localStorage
    loadPerkHistory() {
        try {
            const saved = localStorage.getItem('automata-perk-history');
            return saved ? JSON.parse(saved) : {
                combinations: {},  // Track perk combinations and their success
                sequences: {},     // Track perk selection order
                individual: {}     // Track individual perk performance
            };
        } catch (error) {
            console.warn("Could not load perk history:", error);
            return { combinations: {}, sequences: {}, individual: {} };
        }
    }

    // Save perk selection history to localStorage
    savePerkHistory() {
        try {
            localStorage.setItem('automata-perk-history', JSON.stringify(this.perkHistory));
        } catch (error) {
            console.warn("Could not save perk history:", error);
        }
    }

    // Initialize AI systems (only when user opts in)
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

            // Initialize game state reader with advanced observation system
            this.gameState = new AdvancedGameStateExtractor();
            this.gameState.initialize(scene);

            // Initialize RL agent
            const stateSize = this.gameState.getStateSize();
            const actionSize = 9; // 8 directions + stay

            this.agent = new SurvivalAgent(stateSize, actionSize);

            this.enabled = true;
            console.log("✅ AI systems initialized successfully");

            // Show UI
            this.createAIInterface();

            return true;

        } catch (error) {
            console.error("❌ Failed to initialize AI:", error);
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

    // Main game loop integration
    update() {
        if (!this.enabled || !this.agent) return;

        // Make AI decisions when AI is active
        if (this.aiActive) {
            this.makeAIDecision();
        }

        // Secondary: Optionally record player actions for imitation learning
        if (this.learningActive && !this.aiActive) {
            this.recordPlayerAction();
        }

        // Check for game start (to reset perk tracking)
        if (!this.gameStartTime && !this.isGameOver()) {
            this.gameStartTime = Date.now();
            this.currentGamePerks = [];
        }

        // Check for game over (to record learning data)
        if (this.gameStartTime && this.isGameOver()) {
            this.handleGameOver();
        }

        // Update UI
        this.updateInterface();
    }

    // Process recorded session for training
    async processSession() {
        if (this.currentSession.length < 10) {
            console.log("Session too short for training");
            return;
        }

        try {
            console.log(`🧠 Training AI on ${this.currentSession.length} recorded actions...`);

            // For self-learning: calculate rewards based on survival and outcomes
            if (this.currentSession.some(exp => exp.source === 'ai')) {
                const rewards = this.calculateRewards();

                // Store experiences with calculated rewards
                for (let i = 0; i < this.currentSession.length - 1; i++) {
                    const experience = this.currentSession[i];
                    const nextState = this.currentSession[i + 1].state;
                    const reward = rewards[i];

                    this.agent.remember(
                        experience.state,
                        experience.action,
                        reward,
                        nextState,
                        i === this.currentSession.length - 2
                    );
                }
            } else {
                // For imitation learning: use simple positive rewards
                for (let i = 0; i < this.currentSession.length - 1; i++) {
                    const experience = this.currentSession[i];
                    const nextState = this.currentSession[i + 1].state;

                    this.agent.remember(
                        experience.state,
                        experience.action,
                        0.1, // Small positive reward for demonstration
                        nextState,
                        false
                    );
                }
            }

            // Train on recorded data
            if (this.agent.memory.length > 32) {
                const loss = await this.agent.replay();
                console.log(`✅ Training complete. Loss: ${loss?.toFixed(4) || 'N/A'}`);
            }

            // Clear session
            this.currentSession = [];

        } catch (error) {
            console.error("Training error:", error);
        }
    }

    // Calculate rewards for AI's actions based on survival and performance
    calculateRewards() {
        const sessionLength = this.currentSession.length;

        // Note: With real-time rewards, many experiences already have immediate feedback
        // This end-of-session calculation provides additional learning signal

        const survivalBonus = Math.min(sessionLength / 100, 1); // Reward survival up to 100 actions
        const finalSurvivalTime = this.gameStartTime ? (Date.now() - this.gameStartTime) / 1000 : 0;

        return this.currentSession.map((experience, index) => {
            let reward = 0.05; // Base reward for any action (reduced since we have real-time rewards)

            // Survival progress reward (gets better the longer you survive)
            reward += survivalBonus * (index / sessionLength) * 0.5;

            // Final survival time bonus for the entire session
            if (finalSurvivalTime > 30) { // Bonus for surviving more than 30 seconds
                reward += Math.min(finalSurvivalTime / 300, 1) * 0.3; // Up to 5 minutes = max bonus
            }

            // Boundary avoidance learning - penalize actions that led to boundary proximity
            if (experience.state && experience.state.length > 1) {
                const playerX = experience.state[0];
                const playerY = experience.state[1];
                const boundaryPenalty = this.calculateBoundaryPenalty(playerX, playerY);
                reward -= boundaryPenalty * 2; // Double the boundary penalty for end-game learning
            }

            return reward;
        });
    }

    // Check if game is over
    isGameOver() {
        const gameOverState = window.gameOver !== undefined ? window.gameOver :
            (typeof gameOver !== 'undefined' ? gameOver : false);
        return gameOverState;
    }

    // Handle game over for perk learning
    handleGameOver() {
        if (this.gameStartTime) {
            const survivalTime = (Date.now() - this.gameStartTime) / 1000; // Convert to seconds
            const finalScore = window.score !== undefined ? window.score :
                (typeof score !== 'undefined' ? score : 0);

            // Record the outcome for perk learning
            this.recordGameOutcome(survivalTime, finalScore, false);

            this.gameStartTime = null; // Reset for next game
        }
    }

    // Handle automatic restart when game is over
    handleGameOverRestart() {
        if (!this.gameOverHandled) {
            this.gameOverHandled = true;
            console.log("💀 AI: Game over detected, attempting restart in 3 seconds...");

            // Wait a few seconds for death screen to appear, then restart
            setTimeout(() => {
                this.attemptGameRestart();
            }, 3000);
        }
    }

    // Attempt to restart the game by finding and clicking restart button
    attemptGameRestart() {
        console.log("🔄 AI: Attempting to restart game...");

        // Method 1: Look for "RESTART THE LOOP" specifically
        const allElements = document.querySelectorAll('*');
        let restartElement = null;

        for (const element of allElements) {
            const text = element.textContent || element.innerText || '';
            if (text.includes('RESTART THE LOOP') || text.includes('RESTART') || text.includes('LOOP')) {
                // Check if it's likely a button (has click handler or cursor pointer)
                const style = window.getComputedStyle(element);
                if (style.cursor === 'pointer' || element.onclick || element.getAttribute('onclick')) {
                    restartElement = element;
                    console.log(`🔄 AI: Found restart element with text: "${text.trim()}"`);
                    break;
                }
            }
        }

        // Method 2: Look for common button classes/IDs
        if (!restartElement) {
            const buttonSelectors = [
                'button',
                '[role="button"]',
                '.button',
                '#restart',
                '#restartButton',
                '.restart-button'
            ];

            for (const selector of buttonSelectors) {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    const text = element.textContent || '';
                    if (text.includes('RESTART') || text.includes('LOOP')) {
                        restartElement = element;
                        break;
                    }
                }
                if (restartElement) break;
            }
        }

        // Method 3: Try clicking on canvas and pressing Enter/Space
        if (!restartElement) {
            console.log("🔄 AI: No restart button found, trying canvas click + Enter");
            this.clickCenter();

            setTimeout(() => {
                this.simulateKeyPress('Enter');
            }, 500);

            setTimeout(() => {
                this.simulateKeyPress(' '); // Space bar
            }, 1000);
        } else {
            // Click the restart element
            console.log("🔄 AI: Clicking restart element");
            this.clickElement(restartElement);
        }

        // Reset the game over flag after a delay
        setTimeout(() => {
            this.gameOverHandled = false;
            // Reset tracking variables for new game
            this.lastPlayerHealth = null;
            this.lastScore = 0;
            this.framesSinceLastDamage = 0;
            this.gameStartTime = null;
            this.currentGamePerks = [];
            console.log("🔄 AI: Ready for new game");
        }, 5000);
    }

    // Click any DOM element with proper events
    clickElement(element) {
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        console.log(`🖱️ AI: Clicking element at (${centerX.toFixed(0)}, ${centerY.toFixed(0)})`);

        // Create comprehensive click events
        const events = [
            new MouseEvent('mousedown', { view: window, bubbles: true, cancelable: true, clientX: centerX, clientY: centerY, button: 0 }),
            new MouseEvent('mouseup', { view: window, bubbles: true, cancelable: true, clientX: centerX, clientY: centerY, button: 0 }),
            new MouseEvent('click', { view: window, bubbles: true, cancelable: true, clientX: centerX, clientY: centerY, button: 0 }),
            new PointerEvent('pointerdown', { view: window, bubbles: true, cancelable: true, clientX: centerX, clientY: centerY, button: 0, pointerId: 1 }),
            new PointerEvent('pointerup', { view: window, bubbles: true, cancelable: true, clientX: centerX, clientY: centerY, button: 0, pointerId: 1 })
        ];

        events.forEach((event, index) => {
            setTimeout(() => {
                element.dispatchEvent(event);
            }, index * 50);
        });

        return true;
    }

    // Record player behavior for learning
    recordPlayerAction() {
        // Only record when learning is active and AI is not in control
        if (!this.learningActive || this.aiActive) return;

        try {
            const state = this.gameState.getState();
            const action = this.getPlayerAction();

            if (state && action !== null) {
                const experience = {
                    state: state.slice(),
                    action: action,
                    timestamp: Date.now(),
                    source: 'player' // Mark as player action for imitation learning
                };

                this.currentSession.push(experience);

                // Limit session size to prevent memory issues
                if (this.currentSession.length > 1000) {
                    this.currentSession.shift(); // Remove oldest
                }

                // Less frequent logging for performance
                if (this.currentSession.length % 50 === 0) {
                    console.log(`👁️ AI: Recorded ${this.currentSession.length} player actions`);
                }
            }
        } catch (error) {
            console.error("Recording error:", error);
        }
    }

    // Determine what action player is currently taking
    getPlayerAction() {
        // Try both window.player and global player
        const gamePlayer = window.player || player;

        // Map current player movement to action index
        const velocity = gamePlayer?.body?.velocity;
        if (!velocity) return 0; // Stay still

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

        return 0; // Default to stay
    }

    // AI makes a decision and executes it
    async makeAIDecision() {
        // Make movement decisions frequently (every 150ms = ~6.7 FPS)
        const now = Date.now();
        const shouldMakeDecision = (now - this.lastDecisionTime > 150); // Fast human-like reactions

        try {
            // Always get state for reward tracking
            const state = this.gameState.getState();
            if (!state) {
                console.warn("AI: No game state available");
                return;
            }

            // Check if we're in a level-up situation
            if (this.isLevelUpActive()) {
                this.handleLevelUp();
                return;
            }

            // Check if game is over and handle restart
            if (this.isGameOver()) {
                this.handleGameOverRestart();
                return;
            }

            // Make decisions frequently for responsive gameplay
            if (shouldMakeDecision) {
                const newDirection = await this.agent.chooseAction(state);

                // Change direction immediately
                if (newDirection !== this.currentDirection) {
                    if (this.actionCount % 20 === 0) { // Less frequent logging
                        console.log(`🤖 AI Direction Change: ${this.getActionName(newDirection)}`);
                    }
                    this.changeDirection(newDirection);
                    this.currentDirection = newDirection;

                    // Record this decision for self-learning (when AI is active)
                    if (this.learningActive) {
                        this.recordAIAction(state, newDirection);
                    }
                }

                this.lastDecisionTime = now;
                this.actionCount++;
            }

            // Track real-time rewards for immediate feedback (now always has state)
            this.updateRealTimeRewards(state);

            this.lastActionTime = now;

        } catch (error) {
            console.error("AI decision error:", error);
        }
    }

    // Change movement direction by directly manipulating Phaser keyboard objects
    changeDirection(actionIndex) {
        const actionMap = [
            { keys: [] },                           // 0: stay - no keys
            { keys: ['up'] },                       // 1: up
            { keys: ['up', 'right'] },              // 2: up-right  
            { keys: ['right'] },                    // 3: right
            { keys: ['down', 'right'] },            // 4: down-right
            { keys: ['down'] },                     // 5: down
            { keys: ['down', 'left'] },             // 6: down-left
            { keys: ['left'] },                     // 7: left
            { keys: ['up', 'left'] }                // 8: up-left
        ];

        const action = actionMap[actionIndex];
        if (action) {
            // Release all current keys first
            this.releaseAllMovementKeys();

            // Press new keys based on direction
            if (action.keys.length > 0) {
                this.pressMovementKeys(action.keys);
            }

            // Debug log for movement changes
            if (actionIndex !== 0) { // Don't log "stay" commands
                console.log(`🎮 AI: Moving ${this.getActionName(actionIndex)} (keys: ${action.keys.join(', ')})`);
            }
        }
    }

    // Press specific movement keys by directly setting Phaser key states
    pressMovementKeys(directions) {
        if (!this.scene || !this.scene.input || !this.scene.input.keyboard) {
            console.warn("Cannot access Phaser keyboard input");
            return;
        }

        const inputSystem = window.InputSystem;
        if (!inputSystem || !inputSystem.keyboard.cursors || !inputSystem.keyboard.wasdKeys) {
            console.warn("Cannot access InputSystem keyboard objects");
            return;
        }

        directions.forEach(direction => {
            let keys = [];

            // Get both cursor and WASD keys for the direction
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

            // Set isDown to true for all relevant keys
            keys.forEach(key => {
                if (key) {
                    // Manually set the key state
                    key.isDown = true;
                    key.isUp = false;

                    // Store reference for cleanup
                    this.keysPressed.add(key);

                    console.log(`🔑 AI: Pressed ${direction} key`);
                }
            });
        });
    }

    // Release all movement keys by setting their state back to up
    releaseAllMovementKeys() {
        this.keysPressed.forEach(key => {
            if (key) {
                key.isDown = false;
                key.isUp = true;
            }
        });
        this.keysPressed.clear();
        console.log("🔑 AI: Released all movement keys");
    }

    // Update real-time rewards for immediate learning feedback
    updateRealTimeRewards(state) {
        if (!this.learningActive || !this.aiActive) return;

        const currentPlayerHealth = window.playerHealth || playerHealth || 100;
        const currentScore = window.score || score || 0;

        // Initialize on first call
        if (this.lastPlayerHealth === null) {
            this.lastPlayerHealth = currentPlayerHealth;
            this.lastScore = currentScore;
            return;
        }

        let immediateReward = 0;

        // Reward for surviving (small positive reward each frame)
        immediateReward += 0.01;
        this.framesSinceLastDamage++;

        // Check for damage taken (negative reward)
        if (currentPlayerHealth < this.lastPlayerHealth) {
            const damageTaken = this.lastPlayerHealth - currentPlayerHealth;
            immediateReward -= damageTaken * 0.1; // Negative reward for damage
            this.framesSinceLastDamage = 0;
            console.log(`🤕 AI: Took ${damageTaken} damage, reward: ${immediateReward.toFixed(3)}`);
        }

        // Bonus for surviving without damage for extended periods
        if (this.framesSinceLastDamage > 300) { // About 5 seconds at 60fps
            immediateReward += 0.05; // Bonus for sustained survival
        }

        // Reward for enemies killed (score increase)
        if (currentScore > this.lastScore) {
            const enemiesKilled = currentScore - this.lastScore;
            immediateReward += enemiesKilled * 0.2; // Positive reward for kills
            console.log(`💀 AI: Killed ${enemiesKilled} enemies, reward: ${immediateReward.toFixed(3)}`);
        }

        // Penalty for being too close to boundaries
        const playerX = state[0]; // Normalized player X (0-1)
        const playerY = state[1]; // Normalized player Y (0-1)
        const boundaryPenalty = this.calculateBoundaryPenalty(playerX, playerY);
        immediateReward -= boundaryPenalty;

        // Store the immediate reward experience if we have a previous state
        if (this.currentSession.length > 0 && immediateReward !== 0.01) {
            const lastExperience = this.currentSession[this.currentSession.length - 1];
            if (lastExperience && lastExperience.source === 'ai') {
                // Update the last experience with immediate reward
                this.agent.remember(
                    lastExperience.state,
                    lastExperience.action,
                    immediateReward,
                    state,
                    false
                );
            }
        }

        // Update tracking variables
        this.lastPlayerHealth = currentPlayerHealth;
        this.lastScore = currentScore;
    }

    // Calculate penalty for being near screen boundaries
    calculateBoundaryPenalty(playerX, playerY) {
        const edgeDistance = 0.1; // Within 10% of screen edge
        let penalty = 0;

        // Penalty for being too close to any edge
        if (playerX < edgeDistance || playerX > (1 - edgeDistance)) {
            penalty += 0.02;
        }
        if (playerY < edgeDistance || playerY > (1 - edgeDistance)) {
            penalty += 0.02;
        }

        // Extra penalty for being in corners
        if ((playerX < edgeDistance || playerX > (1 - edgeDistance)) &&
            (playerY < edgeDistance || playerY > (1 - edgeDistance))) {
            penalty += 0.03;
        }

        return penalty;
    }
    recordAIAction(state, action) {
        // Only record when learning is active
        if (!this.learningActive) return;

        const experience = {
            state: state.slice(),
            action: action,
            timestamp: Date.now(),
            source: 'ai' // Mark as AI's own action for self-learning
        };

        this.currentSession.push(experience);

        // Limit session size to prevent memory issues
        if (this.currentSession.length > 1000) {
            this.currentSession.shift();
        }

        // Less frequent logging for performance
        if (this.currentSession.length % 25 === 0) {
            console.log(`🧠 AI: Recorded ${this.currentSession.length} self-learning actions`);
        }
    }

    // Check if level-up screen is active
    isLevelUpActive() {
        // Check global variables from your game
        const isLevelUpInProgress = window.levelUpInProgress !== undefined ? window.levelUpInProgress :
            (typeof levelUpInProgress !== 'undefined' ? levelUpInProgress : false);
        const hasLevelUpCards = window.levelUpCards !== undefined ? window.levelUpCards?.length > 0 :
            (typeof levelUpCards !== 'undefined' ? levelUpCards?.length > 0 : false);

        return isLevelUpInProgress || hasLevelUpCards;
    }

    // Handle level-up perk selection
    handleLevelUp() {
        // Simple strategy: wait 2 seconds, then click through all perks and select the first one
        if (!this.levelUpStartTime) {
            this.levelUpStartTime = Date.now();
            this.levelUpStep = 0;
            console.log("🎓 AI: Level up detected, starting perk selection");
        }

        const elapsed = Date.now() - this.levelUpStartTime;

        // Wait 1 second to let UI settle
        if (elapsed < 1000) return;

        // Navigate through perks (press right arrow a few times to see all options)
        if (this.levelUpStep < 3 && elapsed > 1000 + (this.levelUpStep * 800)) {
            console.log(`🎓 AI: Viewing perk ${this.levelUpStep + 1}`);
            this.simulateKeyPress('ArrowRight');
            this.levelUpStep++;
        }

        // Select first perk after seeing all options
        if (this.levelUpStep >= 3 && elapsed > 4000) {
            console.log("🎓 AI: Selecting perk");
            this.selectFirstAvailablePerk();
            this.levelUpStartTime = null;
            this.levelUpStep = 0;
        }
    }

    // Select the first available perk
    selectFirstAvailablePerk() {
        try {
            // Find the center card or first interactive perk element
            const perkCard = this.findBestPerkCard();

            if (perkCard) {
                // Try clicking the specific perk card
                this.clickPerkCard(perkCard);
                console.log("🎓 AI: Clicked perk card successfully");
            } else {
                console.log("🎓 AI: No perk card found, trying center click");
                this.clickCenter();
            }

        } catch (error) {
            console.error("AI perk selection error:", error);
            // Fallback: click center
            this.clickCenter();
        }
    }

    // Find the best perk card element to click
    findBestPerkCard() {
        // Method 1: Look for visible perk card elements
        const perkSelectors = [
            '[data-perk-id]',                    // If cards have perk ID data attributes
            '.perk-card',                        // Common class name
            'div[style*="cursor: pointer"]',     // Interactive divs
            'text[style*="cursor"]'              // Phaser text objects in DOM (less likely)
        ];

        for (const selector of perkSelectors) {
            const elements = document.querySelectorAll(selector);
            const visibleElements = Array.from(elements).filter(el => {
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0;
            });

            if (visibleElements.length > 0) {
                console.log(`🎓 AI: Found ${visibleElements.length} perk elements with selector: ${selector}`);
                return visibleElements[0]; // Return first visible card
            }
        }

        // Method 2: Look for canvas area where cards might be (fallback)
        const canvas = document.querySelector('canvas');
        if (canvas) {
            console.log("🎓 AI: Falling back to canvas click");
            return canvas;
        }

        return null;
    }

    // Click a specific perk card element
    clickPerkCard(element) {
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        console.log(`🎓 AI: Clicking perk at (${centerX.toFixed(0)}, ${centerY.toFixed(0)})`);

        // Create and dispatch mouse events
        const events = ['mousedown', 'mouseup', 'click'];
        events.forEach((eventType, index) => {
            setTimeout(() => {
                const event = new MouseEvent(eventType, {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: centerX,
                    clientY: centerY,
                    button: 0
                });
                element.dispatchEvent(event);
            }, index * 50); // Small delay between events
        });

        // Also try pointer events (Phaser often uses these)
        const pointerEvents = ['pointerdown', 'pointerup'];
        pointerEvents.forEach((eventType, index) => {
            setTimeout(() => {
                const event = new PointerEvent(eventType, {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: centerX,
                    clientY: centerY,
                    button: 0,
                    pointerId: 1
                });
                element.dispatchEvent(event);
            }, (index + 3) * 50);
        });

        return true;
    }

    // Choose the best perk based on learned strategy
    chooseBestPerk(availablePerks, level) {
        if (!availablePerks || availablePerks.length === 0) {
            return null;
        }

        let bestPerk = availablePerks[0];
        let bestScore = -1;

        for (const perk of availablePerks) {
            let score = 0;

            // Score based on individual perk performance
            const individual = this.perkHistory.individual[perk.id] || { games: 0, totalTime: 0, totalScore: 0 };
            if (individual.games > 0) {
                score += (individual.totalTime / individual.games) * 0.4; // 40% weight on avg survival time
                score += (individual.totalScore / individual.games) * 0.0001; // Small weight on score
            }

            // Score based on combination with current perks
            const currentPerkIds = this.currentGamePerks.map(p => p.perkId);
            for (const existingPerk of currentPerkIds) {
                const comboKey = this.makePerkComboKey([existingPerk, perk.id]);
                const combo = this.perkHistory.combinations[comboKey] || { games: 0, totalTime: 0 };
                if (combo.games > 0) {
                    score += (combo.totalTime / combo.games) * 0.3; // 30% weight on combo performance
                }
            }

            // Score based on sequence (what typically gets picked at this level)
            const sequenceKey = `level_${level}`;
            const sequence = this.perkHistory.sequences[sequenceKey] || {};
            const sequenceCount = sequence[perk.id] || 0;
            score += sequenceCount * 0.3; // 30% weight on sequence frequency

            console.log(`🧠 Perk ${perk.id}: score ${score.toFixed(2)} (individual: ${individual.games} games, sequence: ${sequenceCount})`);

            if (score > bestScore) {
                bestScore = score;
                bestPerk = perk;
            }
        }

        return bestPerk.id;
    }

    // Get current perks available for selection (from UI)
    getCurrentPerks() {
        try {
            // Try to access the current perk cards from the global state
            const scene = window.game?.scene?.scenes?.[0];
            if (!scene) return [];

            // Look for available perks in CardSystem if it exists
            if (window.CardSystem && window.CardSystem.generateRandomPerkCards) {
                // This is a fallback - we don't know the exact perks shown
                return window.CardSystem.generateRandomPerkCards(4, this.currentGamePerks.map(p => p.perkId));
            }

            // Fallback: return some common perks
            const PERKS = window.PERKS || {};
            const perkIds = Object.keys(PERKS).slice(0, 4);
            return perkIds.map(id => ({ id, ...PERKS[id] }));

        } catch (error) {
            console.error("Error getting current perks:", error);
            return [];
        }
    }

    // Get current player level
    getCurrentLevel() {
        return window.playerLevel || playerLevel || 1;
    }

    // Click a specific perk by ID (if possible)
    clickPerkById(perkId) {
        // Try to find the perk in the DOM and click it
        // This is game-specific and might need adjustment
        this.clickCenter(); // Fallback to center click for now
    }

    // Click center of screen (fallback perk selection)
    clickCenter() {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            console.log(`🎓 AI: Clicking center at (${centerX.toFixed(0)}, ${centerY.toFixed(0)})`);

            // Create comprehensive click events
            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: centerX,
                clientY: centerY,
                button: 0
            });

            const pointerEvent = new PointerEvent('pointerdown', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: centerX,
                clientY: centerY,
                button: 0,
                pointerId: 1
            });

            canvas.dispatchEvent(pointerEvent);
            canvas.dispatchEvent(clickEvent);

            // Also try Enter key as backup
            setTimeout(() => {
                this.simulateKeyPress('Enter');
            }, 100);
        } else {
            console.warn("🎓 AI: No canvas found for center click");
            this.simulateKeyPress('Enter');
        }
    }

    // Record game outcome and update perk learning
    recordGameOutcome(survivalTime, finalScore, isVictory = false) {
        if (this.currentGamePerks.length === 0) return;

        console.log(`🧠 Recording game outcome: ${survivalTime}s survival, score ${finalScore}, perks: ${this.currentGamePerks.map(p => p.perkId).join(', ')}`);

        // Update individual perk performance
        for (const perk of this.currentGamePerks) {
            const individual = this.perkHistory.individual[perk.perkId] || { games: 0, totalTime: 0, totalScore: 0 };
            individual.games++;
            individual.totalTime += survivalTime;
            individual.totalScore += finalScore;
            this.perkHistory.individual[perk.perkId] = individual;
        }

        // Update perk combinations
        const perkIds = this.currentGamePerks.map(p => p.perkId).sort();
        for (let i = 0; i < perkIds.length; i++) {
            for (let j = i + 1; j < perkIds.length; j++) {
                const comboKey = this.makePerkComboKey([perkIds[i], perkIds[j]]);
                const combo = this.perkHistory.combinations[comboKey] || { games: 0, totalTime: 0, totalScore: 0 };
                combo.games++;
                combo.totalTime += survivalTime;
                combo.totalScore += finalScore;
                this.perkHistory.combinations[comboKey] = combo;
            }
        }

        // Update sequence data (what was picked at each level)
        for (const perk of this.currentGamePerks) {
            const sequenceKey = `level_${perk.level}`;
            if (!this.perkHistory.sequences[sequenceKey]) {
                this.perkHistory.sequences[sequenceKey] = {};
            }
            this.perkHistory.sequences[sequenceKey][perk.perkId] =
                (this.perkHistory.sequences[sequenceKey][perk.perkId] || 0) + 1;
        }

        // Save the updated history
        this.savePerkHistory();

        // Reset for next game
        this.currentGamePerks = [];
    }

    // View learned perk strategies
    viewPerkStrategy() {
        console.log("🧠 === AUTOMATA PERK LEARNING ANALYSIS ===");

        // Individual perk performance
        console.log("\n📊 INDIVIDUAL PERK PERFORMANCE:");
        const individual = this.perkHistory.individual;
        const sortedPerks = Object.entries(individual)
            .sort(([, a], [, b]) => (b.totalTime / b.games) - (a.totalTime / a.games))
            .slice(0, 10); // Top 10

        sortedPerks.forEach(([perkId, data]) => {
            const avgTime = (data.totalTime / data.games).toFixed(1);
            const avgScore = (data.totalScore / data.games).toFixed(0);
            console.log(`  ${perkId}: ${avgTime}s avg survival (${data.games} games), ${avgScore} avg score`);
        });

        // Best perk combinations
        console.log("\n🤝 BEST PERK COMBINATIONS:");
        const combinations = this.perkHistory.combinations;
        const sortedCombos = Object.entries(combinations)
            .sort(([, a], [, b]) => (b.totalTime / b.games) - (a.totalTime / a.games))
            .slice(0, 5); // Top 5

        sortedCombos.forEach(([combo, data]) => {
            const avgTime = (data.totalTime / data.games).toFixed(1);
            console.log(`  ${combo.replace('_', ' + ')}: ${avgTime}s avg survival (${data.games} games)`);
        });

        // Level-based selection patterns
        console.log("\n📈 SELECTION PATTERNS BY LEVEL:");
        const sequences = this.perkHistory.sequences;
        for (let level = 1; level <= 5; level++) {
            const levelKey = `level_${level}`;
            const levelData = sequences[levelKey];
            if (levelData) {
                const sortedLevel = Object.entries(levelData)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3); // Top 3 for each level
                console.log(`  Level ${level}: ${sortedLevel.map(([perk, count]) => `${perk}(${count})`).join(', ')}`);
            }
        }

        // Current game state
        console.log("\n🎮 CURRENT GAME:");
        console.log(`  Perks selected: ${this.currentGamePerks.map(p => p.perkId).join(', ') || 'None yet'}`);
        console.log(`  Game time: ${this.gameStartTime ? ((Date.now() - this.gameStartTime) / 1000).toFixed(1) + 's' : 'Not started'}`);

        // Create a summary alert for easy viewing
        const topPerk = sortedPerks[0];
        const topCombo = sortedCombos[0];

        let summary = "🧠 AUTOMATA LEARNED STRATEGIES:\n\n";
        if (topPerk) {
            const avgTime = (topPerk[1].totalTime / topPerk[1].games).toFixed(1);
            summary += `🏆 Best Individual Perk: ${topPerk[0]} (${avgTime}s avg)\n`;
        }
        if (topCombo) {
            const avgTime = (topCombo[1].totalTime / topCombo[1].games).toFixed(1);
            summary += `🤝 Best Combination: ${topCombo[0].replace('_', ' + ')} (${avgTime}s avg)\n`;
        }
        summary += `\n📈 Total Games Analyzed: ${Object.values(individual).reduce((sum, p) => sum + p.games, 0)}`;
        summary += "\n\nSee console for detailed analysis.";

        alert(summary);
    }

    // Create a consistent key for perk combinations
    makePerkComboKey(perkIds) {
        return perkIds.sort().join('_');
    }

    // Helper to get action name for debugging
    getActionName(actionIndex) {
        const names = ['Stay', 'Up', 'Up-Right', 'Right', 'Down-Right', 'Down', 'Down-Left', 'Left', 'Up-Left'];
        return names[actionIndex] || 'Unknown';
    }

    simulateKeyPress(key) {
        const event = new KeyboardEvent('keydown', {
            key: key,
            code: key,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);

        // Also send keyup for single key presses
        setTimeout(() => {
            const upEvent = new KeyboardEvent('keyup', {
                key: key,
                code: key,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(upEvent);
        }, 100);
    }

    // Toggle AI control
    toggleAIControl() {
        if (!this.enabled) {
            alert("AI not initialized. Click 'Enable AI' first.");
            return;
        }

        this.aiActive = !this.aiActive;

        if (this.aiActive) {
            console.log("🤖 AI taking control");
            this.showAIIndicator();
            // Reset movement and game state when AI takes control
            this.currentDirection = 0;
            this.gameOverHandled = false;
            this.lastPlayerHealth = null;
            this.lastScore = 0;
            this.framesSinceLastDamage = 0;
        } else {
            console.log("🎮 Player control restored");
            this.hideAIIndicator();
            // Release all AI movement keys when player takes back control
            this.releaseAllMovementKeys();
            this.gameOverHandled = false;
        }
    }

    // Toggle learning mode
    toggleLearning() {
        if (!this.enabled) {
            alert("AI not initialized. Click 'Enable AI' first.");
            return;
        }

        this.learningActive = !this.learningActive;

        if (this.learningActive) {
            console.log("📚 AI learning ENABLED - will record and learn from player actions");
            this.currentSession = [];
        } else {
            console.log("📚 AI learning DISABLED - will use existing knowledge only");
            if (this.currentSession.length > 0) {
                this.processSession();
            }
        }
    }

    // Create AI control interface
    createAIInterface() {
        // Remove existing UI
        const existing = document.getElementById('ai-interface');
        if (existing) existing.remove();

        const ui = document.createElement('div');
        ui.id = 'ai-interface';
        ui.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 1000;
            border: 2px solid #4CAF50;
            min-width: 200px;
        `;

        ui.innerHTML = `
            <div style="margin-bottom: 10px; text-align: center; font-weight: bold; color: #4CAF50;">
                🤖 AUTOMATA CONTROL
            </div>
            
            <div style="margin-bottom: 10px;">
                <div>Status: <span id="ai-status">Ready</span></div>
                <div>Learning: <span id="learning-status">Off</span></div>
                <div>Session: <span id="session-length">0</span> actions</div>
                <div>Decisions: <span id="decision-count">0</span></div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <button id="toggle-ai" style="padding: 8px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Toggle AI Control (X)
                </button>
                <button id="toggle-learning" style="padding: 8px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Toggle Learning (C)
                </button>
                <button id="test-movement" style="padding: 6px; background: #9C27B0; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    Test Movement
                </button>
                <button id="debug-state" style="padding: 6px; background: #E91E63; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    Debug Game State
                </button>
                <button id="view-observation" style="padding: 6px; background: #3F51B5; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    View Spatial Grid
                </button>
                <button id="view-perk-strategy" style="padding: 6px; background: #673AB7; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    View Perk Strategy
                </button>
                <button id="save-model" style="padding: 6px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    Save Model
                </button>
                <button id="load-model" style="padding: 6px; background: #9C27B0; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                    Load Model
                </button>
            </div>
            
            <div style="margin-top: 10px; font-size: 10px; color: #888;">
                X = Toggle AI control<br>
                C = Toggle learning mode<br><br>
                <strong>Learning Modes (Automatic):</strong><br>
                • 🧠 Self-Learning: AI active + learning ON<br>
                • 👁️ Watching Player: Player active + learning ON<br>
                • 🎓 Using Training: Learning OFF + has training data<br>
                • 🤷 No Training: Learning OFF + no training data<br><br>
                <strong>AI System:</strong><br>
                • 150ms decisions (fast human-like reactions)<br>
                • Direct Phaser key manipulation (works with InputSystem)<br>
                • 32x32 spatial grid observation (unlimited entities!)<br>
                • Real-time rewards (damage=-0.1, survival=+0.01, kills=+0.2)<br>
                • Boundary avoidance learning (penalties for edge proximity)<br>
                • Auto-restart on death (clicks restart button automatically)<br>
                • Strategic perk selection from learned data<br>
                • Learns which strategies lead to longer survival
            </div>
        `;

        document.body.appendChild(ui);

        // Attach events
        document.getElementById('toggle-ai').onclick = () => this.toggleAIControl();
        document.getElementById('toggle-learning').onclick = () => this.toggleLearning();
        document.getElementById('test-movement').onclick = () => this.testMovement();
        document.getElementById('debug-state').onclick = () => this.debugGameState();
        document.getElementById('view-observation').onclick = () => this.viewObservation();
        document.getElementById('view-perk-strategy').onclick = () => this.viewPerkStrategy();
        document.getElementById('save-model').onclick = () => this.saveModel();
        document.getElementById('load-model').onclick = () => this.loadModel();
    }

    updateInterface() {
        const statusEl = document.getElementById('ai-status');
        const learningEl = document.getElementById('learning-status');
        const sessionEl = document.getElementById('session-length');
        const decisionEl = document.getElementById('decision-count');

        if (statusEl) {
            statusEl.textContent = this.aiActive ? 'AI Active' : 'Player Control';
            statusEl.style.color = this.aiActive ? '#ff4444' : '#44ff44';
        }

        if (learningEl) {
            if (this.learningActive) {
                learningEl.textContent = 'Recording';
                learningEl.style.color = '#ffaa00';
            } else if (this.agent?.memory?.length > 0) {
                learningEl.textContent = 'Using Training';
                learningEl.style.color = '#44ff44';
            } else {
                learningEl.textContent = 'No Training';
                learningEl.style.color = '#888';
            }
        }

        if (sessionEl) {
            sessionEl.textContent = this.currentSession.length;
        }

        if (decisionEl) {
            decisionEl.textContent = this.actionCount;
        }
    }

    // Test movement function to verify AI can control the player
    testMovement() {
        if (!this.enabled) {
            alert("AI not initialized");
            return;
        }

        console.log("🧪 Testing AI movement with direct Phaser key manipulation...");

        // Test sequence: hold each direction for 1.5 seconds
        let testStep = 0;
        const directions = [3, 1, 7, 5]; // Right, Up, Left, Down
        const directionNames = ['Right', 'Up', 'Left', 'Down'];

        const testInterval = setInterval(() => {
            if (testStep < directions.length) {
                console.log(`Testing: Move ${directionNames[testStep]} (direct Phaser keys)`);
                this.changeDirection(directions[testStep]);
            } else {
                console.log("✅ Test complete - stopping movement");
                this.changeDirection(0); // Stop
                clearInterval(testInterval);
                return;
            }
            testStep++;
        }, 1500); // Hold each direction for 1.5 seconds

        // Show visual feedback
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 255, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 18px;
            z-index: 10000;
        `;
        feedback.textContent = '🧪 Testing AI Movement (Direct Phaser Keys)...';
        document.body.appendChild(feedback);

        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.remove();
            }
        }, 7000); // 7 seconds total test
    }

    // View what the AI can "see" with the spatial grid observation system
    viewObservation() {
        if (!this.enabled || !this.gameState) {
            alert("AI not initialized");
            return;
        }

        console.log("🔍 === AI SPATIAL OBSERVATION ANALYSIS ===");

        try {
            const state = this.gameState.getState();
            if (!state) {
                console.log("❌ No observation data available");
                return;
            }

            // Get human-readable summary
            const summary = this.gameState.getObservationSummary();
            console.log("\n📊 OBSERVATION SUMMARY:");
            console.log(summary);

            // Show state size info
            const stateSize = this.gameState.getStateSize();
            console.log(`\n📏 STATE SIZE: ${stateSize} features`);
            console.log(`   - Player info: 10 features`);
            console.log(`   - Spatial grid: ${stateSize - 10} features (${this.gameState.config.gridResolution}x${this.gameState.config.gridResolution}x${this.gameState.config.gridChannels})`);

            // Analyze the spatial grid
            const playerInfo = state.slice(0, 10);
            const gridData = state.slice(10);

            console.log("\n🎮 PLAYER STATE:");
            console.log(`   Position: (${(playerInfo[0] * this.gameState.gameWidth).toFixed(0)}, ${(playerInfo[1] * this.gameState.gameHeight).toFixed(0)})`);
            console.log(`   Health: ${(playerInfo[2] * 100).toFixed(0)}%`);
            console.log(`   Speed: ${playerInfo[3].toFixed(2)}`);
            console.log(`   Damage: ${playerInfo[4].toFixed(2)}`);
            console.log(`   Level: ${(playerInfo[7] * 50).toFixed(0)}`);

            console.log("\n🗺️ SPATIAL GRID ANALYSIS:");
            const grid = this.gameState.config.gridResolution;
            const channels = this.gameState.config.gridChannels;
            const channelNames = ['Enemies', 'Projectiles', 'Orbitals', 'Special'];

            // Count entities per channel
            const channelStats = [0, 0, 0, 0];
            let totalActiveCells = 0;

            for (let i = 0; i < gridData.length; i += channels) {
                for (let c = 0; c < channels; c++) {
                    if (gridData[i + c] > 0) {
                        channelStats[c]++;
                        if (c === 0) totalActiveCells++; // Count unique cells with any activity
                    }
                }
            }

            channelNames.forEach((name, index) => {
                console.log(`   ${name}: ${channelStats[index]} grid cells occupied`);
            });
            console.log(`   Total active cells: ${totalActiveCells}/${grid * grid} (${(totalActiveCells / (grid * grid) * 100).toFixed(1)}%)`);

            // Create visual representation for console
            console.log("\n🎯 VISUAL GRID (E=Enemy, P=Projectile, O=Orbital, *=Player):");
            this.visualizeGrid(gridData, playerInfo);

            // Show as alert for easy viewing
            const alertText = `🧠 AI SPATIAL VISION:\n\n` +
                `👁️ What the AI can see:\n` +
                `• ${channelStats[0]} cells with enemies\n` +
                `• ${channelStats[1]} cells with projectiles\n` +
                `• ${channelStats[2]} cells with orbitals\n` +
                `• ${totalActiveCells}/${grid * grid} total active cells\n\n` +
                `🎮 Player at (${(playerInfo[0] * this.gameState.gameWidth).toFixed(0)}, ${(playerInfo[1] * this.gameState.gameHeight).toFixed(0)}) with ${(playerInfo[2] * 100).toFixed(0)}% health\n\n` +
                `This spatial grid gives the AI much better awareness than the old system!\n` +
                `See console for detailed grid visualization.`;

            alert(alertText);

        } catch (error) {
            console.error("Error analyzing observation:", error);
            alert("Error analyzing AI observation: " + error.message);
        }
    }

    // Create a simple ASCII visualization of the spatial grid
    visualizeGrid(gridData, playerInfo) {
        const grid = this.gameState.config.gridResolution;
        const channels = this.gameState.config.gridChannels;

        // Create a simplified view (sample every 4th cell for readability)
        const sampleRate = Math.max(1, Math.floor(grid / 16)); // Max 16x16 display
        const displaySize = Math.floor(grid / sampleRate);

        console.log(`Sampling every ${sampleRate} cells for ${displaySize}x${displaySize} display:`);

        let visualization = '';
        for (let y = 0; y < displaySize; y++) {
            let row = '';
            for (let x = 0; x < displaySize; x++) {
                const actualX = x * sampleRate;
                const actualY = y * sampleRate;
                const baseIndex = (actualY * grid + actualX) * channels;

                // Check if player is in this cell
                const playerGridX = Math.floor(playerInfo[0] * grid);
                const playerGridY = Math.floor(playerInfo[1] * grid);

                if (Math.abs(actualX - playerGridX) < sampleRate && Math.abs(actualY - playerGridY) < sampleRate) {
                    row += '*'; // Player
                } else if (gridData[baseIndex] > 0) {
                    row += 'E'; // Enemy
                } else if (gridData[baseIndex + 1] > 0) {
                    row += 'P'; // Projectile
                } else if (gridData[baseIndex + 2] > 0) {
                    row += 'O'; // Orbital
                } else if (gridData[baseIndex + 3] > 0) {
                    row += '+'; // Special
                } else {
                    row += '.'; // Empty
                }
            }
            visualization += row + '\n';
        }

        console.log(visualization);
    }
    debugGameState() {
        console.log("🔍 Debugging game state availability...");

        // Check all the variables the AI is looking for
        const checks = {
            'player (global)': typeof player !== 'undefined' ? player : undefined,
            'window.player': window.player,
            'EnemySystem (global)': typeof EnemySystem !== 'undefined' ? EnemySystem : undefined,
            'window.EnemySystem': window.EnemySystem,
            'projectiles (global)': typeof projectiles !== 'undefined' ? projectiles : undefined,
            'window.projectiles': window.projectiles,
            'gameOver (global)': typeof gameOver !== 'undefined' ? gameOver : undefined,
            'window.gameOver': window.gameOver,
            'playerHealth (global)': typeof playerHealth !== 'undefined' ? playerHealth : undefined,
            'window.playerHealth': window.playerHealth,
            'maxPlayerHealth (global)': typeof maxPlayerHealth !== 'undefined' ? maxPlayerHealth : undefined,
            'window.maxPlayerHealth': window.maxPlayerHealth,
            'playerSpeed (global)': typeof playerSpeed !== 'undefined' ? playerSpeed : undefined,
            'window.playerSpeed': window.playerSpeed,
            'playerDamage (global)': typeof playerDamage !== 'undefined' ? playerDamage : undefined,
            'window.playerDamage': window.playerDamage,
            'playerLuck (global)': typeof playerLuck !== 'undefined' ? playerLuck : undefined,
            'window.playerLuck': window.playerLuck,
            'playerFireRate (global)': typeof playerFireRate !== 'undefined' ? playerFireRate : undefined,
            'window.playerFireRate': window.playerFireRate,
            'playerLevel (global)': typeof playerLevel !== 'undefined' ? playerLevel : undefined,
            'window.playerLevel': window.playerLevel,
            'elapsedTime (global)': typeof elapsedTime !== 'undefined' ? elapsedTime : undefined,
            'window.elapsedTime': window.elapsedTime,
            'score (global)': typeof score !== 'undefined' ? score : undefined,
            'window.score': window.score,
            'gamePaused (global)': typeof gamePaused !== 'undefined' ? gamePaused : undefined,
            'window.gamePaused': window.gamePaused,
            'game (global)': typeof game !== 'undefined' ? game : undefined,
            'window.game': window.game,
        };

        console.log("Game variable availability:");
        Object.entries(checks).forEach(([name, value]) => {
            const status = value !== undefined ? '✅' : '❌';
            console.log(`${status} ${name}:`, value);
        });

        // Check player object structure if it exists
        const gamePlayer = window.player || (typeof player !== 'undefined' ? player : null);
        if (gamePlayer) {
            console.log("Player object structure:", {
                x: gamePlayer.x,
                y: gamePlayer.y,
                body: gamePlayer.body,
                hasVelocity: gamePlayer.body?.velocity !== undefined
            });
        }

        // Check EnemySystem structure if it exists
        const gameEnemySystem = window.EnemySystem || (typeof EnemySystem !== 'undefined' ? EnemySystem : null);
        if (gameEnemySystem) {
            console.log("EnemySystem structure:", {
                exists: true,
                hasEnemiesGroup: gameEnemySystem.enemiesGroup !== undefined,
                enemyCount: gameEnemySystem.enemiesGroup?.getChildren?.()?.length || 'unknown'
            });
        }

        // Check game object structure
        const gameInstance = window.game || (typeof game !== 'undefined' ? game : null);
        if (gameInstance) {
            console.log("Game object structure:", {
                config: gameInstance.config,
                width: gameInstance.config?.width,
                height: gameInstance.config?.height
            });
        }

        return checks;
    }

    showAIIndicator() {
        // Remove existing indicator
        const existing = document.getElementById('ai-active-indicator');
        if (existing) existing.remove();

        const indicator = document.createElement('div');
        indicator.id = 'ai-active-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            z-index: 10000;
            pointer-events: none;
            animation: pulse 2s infinite;
        `;
        indicator.innerHTML = '🤖 AUTOMATA ACTIVE';
        document.body.appendChild(indicator);

        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { opacity: 0.7; }
                50% { opacity: 1; }
                100% { opacity: 0.7; }
            }
        `;
        document.head.appendChild(style);
    }

    hideAIIndicator() {
        const indicator = document.getElementById('ai-active-indicator');
        if (indicator) indicator.remove();
    }

    // Model saving/loading
    async saveModel() {
        if (!this.agent) {
            alert("No AI model to save");
            return;
        }

        try {
            const modelName = prompt("Model name:", "my-automata-" + Date.now());
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
            if (success) {
                alert("Model loaded successfully!");
            } else {
                alert("Failed to load model");
            }
        } catch (error) {
            console.error("Load error:", error);
            alert("Failed to load model: " + error.message);
        }
    }

    // Keyboard shortcuts
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
 * ADVANCED GAME STATE EXTRACTION
 * Uses spatial grid approach for unlimited entities and better spatial awareness
 */
class AdvancedGameStateExtractor {
    constructor() {
        // Configuration for the spatial grid approach
        this.config = {
            gridResolution: 32,     // 32x32 grid for performance
            gridChannels: 4,        // [enemies, projectiles, orbitals, special]
        };

        this.lastState = null;
        this.gameWidth = 1200;   // Default values
        this.gameHeight = 800;
    }

    initialize(scene) {
        this.scene = scene;
        if (scene && scene.game && scene.game.config) {
            this.gameWidth = scene.game.config.width;
            this.gameHeight = scene.game.config.height;
        }
        console.log(`🧠 Advanced observation system initialized: ${this.gameWidth}x${this.gameHeight} → ${this.config.gridResolution}x${this.config.gridResolution} grid`);
    }

    getState() {
        try {
            // Check if game objects exist
            const gamePlayer = window.player || player;
            const gameEnemySystem = window.EnemySystem || EnemySystem;
            const gameInstance = window.game || game;

            if (!gamePlayer) {
                console.warn("AdvancedGameStateExtractor: player object is undefined");
                return this.lastState;
            }

            // Check game over status
            const isGameOver = window.gameOver !== undefined ? window.gameOver : gameOver;
            if (isGameOver) {
                return this.lastState;
            }

            // Get the full spatial observation
            const spatialObservation = this.getSpatialGridObservation();

            this.lastState = spatialObservation;
            return spatialObservation;

        } catch (error) {
            console.error("AdvancedGameStateExtractor error:", error);
            return this.lastState;
        }
    }

    // SPATIAL GRID APPROACH - Handles unlimited entities with spatial awareness
    getSpatialGridObservation() {
        const grid = this.config.gridResolution;
        const channels = this.config.gridChannels;
        const cellWidth = this.gameWidth / grid;
        const cellHeight = this.gameHeight / grid;

        // Create multi-channel grid: [enemies, projectiles, orbitals, special]
        const spatialGrid = new Array(grid * grid * channels).fill(0);

        // Helper to add entity to grid with intensity based on size/importance
        const addToGrid = (x, y, channel, intensity = 1.0) => {
            const gridX = Math.floor(x / cellWidth);
            const gridY = Math.floor(y / cellHeight);

            if (gridX >= 0 && gridX < grid && gridY >= 0 && gridY < grid) {
                const index = (gridY * grid + gridX) * channels + channel;
                // Accumulate intensity (multiple entities in same cell)
                spatialGrid[index] = Math.min(spatialGrid[index] + intensity, 1.0);
            }
        };

        // Add ALL enemies (no hard cap!)
        try {
            const gameEnemySystem = window.EnemySystem || EnemySystem;
            if (gameEnemySystem && gameEnemySystem.enemiesGroup) {
                const enemies = gameEnemySystem.enemiesGroup.getChildren();
                enemies.forEach(enemy => {
                    if (enemy && enemy.active && enemy.x !== undefined && enemy.y !== undefined) {
                        // Intensity based on enemy threat level
                        const intensity = this.getEnemyIntensity(enemy);
                        addToGrid(enemy.x, enemy.y, 0, intensity);
                    }
                });
                console.log(`🎯 AI: Tracking ${enemies.length} enemies in spatial grid`);
            }
        } catch (error) {
            console.warn("Error adding enemies to grid:", error);
        }

        // Add ALL projectiles (no hard cap!)
        try {
            const gameProjectiles = window.projectiles || projectiles;
            if (gameProjectiles && gameProjectiles.getChildren) {
                const projs = gameProjectiles.getChildren();
                projs.forEach(proj => {
                    if (proj && proj.active && proj.x !== undefined && proj.y !== undefined) {
                        const intensity = this.getProjectileIntensity(proj);
                        addToGrid(proj.x, proj.y, 1, intensity);
                    }
                });
            }
        } catch (error) {
            console.warn("Error adding projectiles to grid:", error);
        }

        // Add orbitals/shields if available
        try {
            if (window.OrbitalSystem && OrbitalSystem.orbitals) {
                OrbitalSystem.orbitals.forEach(orbital => {
                    if (orbital && orbital.x !== undefined && orbital.y !== undefined) {
                        addToGrid(orbital.x, orbital.y, 2, 0.8);
                    }
                });
            }
        } catch (error) {
            console.warn("Error adding orbitals to grid:", error);
        }

        // Add player position and game state to special channel
        const gamePlayer = window.player || player;
        if (gamePlayer) {
            addToGrid(gamePlayer.x, gamePlayer.y, 3, 1.0);
        }

        // Player info as separate features (not in grid)
        const playerInfo = [
            gamePlayer.x / this.gameWidth,                                    // Normalized position X
            gamePlayer.y / this.gameHeight,                                   // Normalized position Y
            (window.playerHealth || playerHealth || 100) / (window.maxPlayerHealth || maxPlayerHealth || 100), // Health ratio
            (window.playerSpeed || playerSpeed || 8) / 20,                    // Normalized speed
            (window.playerDamage || playerDamage || 10) / 50,                 // Normalized damage
            (window.playerLuck || playerLuck || 10) / 50,                     // Normalized luck
            (window.playerFireRate || playerFireRate || 1) / 20,              // Normalized fire rate
            Math.min((window.playerLevel || playerLevel || 1) / 50, 1),       // Normalized level
            Math.min((window.elapsedTime || elapsedTime || 0) / 1800, 1),     // Normalized time (30 min)
            Math.min((window.score || score || 0) / 10000, 1)                 // Normalized score
        ];

        // Combine player info with spatial grid
        return [...playerInfo, ...spatialGrid];
    }

    getEnemyIntensity(enemy) {
        // Base intensity
        let intensity = 0.5;

        // Increase based on enemy health/size if available
        if (enemy.health && enemy.health > 1) {
            intensity = Math.min(enemy.health / 20, 1.0);
        }

        // Increase for larger enemies
        if (enemy.scale && enemy.scale > 1) {
            intensity *= Math.min(enemy.scale, 2.0);
        }

        // Boss enemies get maximum intensity
        if (enemy.isBoss) {
            intensity = 1.0;
        }

        return intensity;
    }

    getProjectileIntensity(proj) {
        // Base intensity for projectiles
        let intensity = 0.3;

        // Increase based on damage if available
        if (proj.damage && proj.damage > 1) {
            intensity = Math.min(proj.damage / 30, 0.8);
        }

        // Increase for faster projectiles (more dangerous)
        if (proj.body && proj.body.velocity) {
            const speed = Math.sqrt(proj.body.velocity.x ** 2 + proj.body.velocity.y ** 2);
            intensity += Math.min(speed / 500, 0.3);
        }

        return Math.min(intensity, 1.0);
    }

    getStateSize() {
        // Calculate total state size
        const playerInfo = 10; // 10 features for player
        const gridSize = this.config.gridResolution * this.config.gridResolution * this.config.gridChannels;

        const totalSize = playerInfo + gridSize;
        console.log(`🧠 State size: ${totalSize} (player: ${playerInfo} + grid: ${gridSize})`);
        return totalSize;
    }

    // Get a human-readable description of what the AI can "see"
    getObservationSummary() {
        if (!this.lastState) return "No observation data";

        const playerInfo = this.lastState.slice(0, 10);
        const gridData = this.lastState.slice(10);

        // Count non-zero grid cells per channel
        const grid = this.config.gridResolution;
        const channels = this.config.gridChannels;
        const channelCounts = [0, 0, 0, 0]; // [enemies, projectiles, orbitals, special]

        for (let i = 0; i < gridData.length; i += channels) {
            for (let c = 0; c < channels; c++) {
                if (gridData[i + c] > 0) {
                    channelCounts[c]++;
                }
            }
        }

        return `Player: (${(playerInfo[0] * this.gameWidth).toFixed(0)}, ${(playerInfo[1] * this.gameHeight).toFixed(0)}) Health: ${(playerInfo[2] * 100).toFixed(0)}% | Grid cells with enemies: ${channelCounts[0]}, projectiles: ${channelCounts[1]}, orbitals: ${channelCounts[2]}, special: ${channelCounts[3]}`;
    }
}

/**
 * REINFORCEMENT LEARNING AGENT
 * DQN agent that learns to play the game
 */
class SurvivalAgent {
    constructor(stateSize, actionSize) {
        this.stateSize = stateSize;
        this.actionSize = actionSize;

        // Hyperparameters
        this.config = {
            learningRate: 0.0005,
            gamma: 0.95,
            epsilon: 0.9,
            epsilonMin: 0.1,
            epsilonDecay: 0.995,
            batchSize: 32,
            memorySize: 10000
        };

        // Experience replay memory
        this.memory = [];
        this.memoryIndex = 0;

        // Neural networks
        this.mainNetwork = this.buildNetwork();
        this.targetNetwork = this.buildNetwork();
        this.updateTargetNetwork();

        // Training stats
        this.episodeCount = 0;
        this.totalSteps = 0;

        console.log(`🧠 AI Agent created: ${stateSize} inputs → ${actionSize} actions`);
    }

    buildNetwork() {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [this.stateSize],
                    units: 128,
                    activation: 'relu'
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({
                    units: 64,
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
        // If no training data yet, use simple movement pattern instead of random
        if (this.memory.length < 10) {
            return this.chooseSimpleAction(state);
        }

        if (Math.random() < this.config.epsilon) {
            // Random action (exploration)
            return Math.floor(Math.random() * this.actionSize);
        } else {
            // Best action according to Q-network
            const stateTensor = tf.tensor2d([state]);
            const qValues = await this.mainNetwork.predict(stateTensor);
            const action = await qValues.argMax(1).data();

            stateTensor.dispose();
            qValues.dispose();

            return action[0];
        }
    }

    // Simple action selection for untrained AI
    chooseSimpleAction(state) {
        // Extract player position and enemy info from state
        const playerX = state[0]; // Normalized player X (0-1)
        const playerY = state[1]; // Normalized player Y (0-1)

        // Find closest enemy (first enemy in state array)
        const enemyX = state[8];  // First enemy X position
        const enemyY = state[9];  // First enemy Y position
        const enemyDistance = state[10]; // First enemy distance

        // Check if we're too close to boundaries
        const edgeDistance = 0.15; // Stay away from edges
        const isNearLeftEdge = playerX < edgeDistance;
        const isNearRightEdge = playerX > (1 - edgeDistance);
        const isNearTopEdge = playerY < edgeDistance;
        const isNearBottomEdge = playerY > (1 - edgeDistance);

        // Priority 1: Move away from boundaries if close
        if (isNearLeftEdge || isNearRightEdge || isNearTopEdge || isNearBottomEdge) {
            // Move toward center
            const centerX = 0.5;
            const centerY = 0.5;
            const toCenterX = centerX - playerX;
            const toCenterY = centerY - playerY;

            if (Math.abs(toCenterX) > Math.abs(toCenterY)) {
                return toCenterX > 0 ? 3 : 7; // Move right or left toward center
            } else {
                return toCenterY > 0 ? 5 : 1; // Move down or up toward center
            }
        }

        // Priority 2: Move away from closest enemy if present
        if (enemyDistance > 0) {
            const dx = playerX - enemyX;
            const dy = playerY - enemyY;

            // But ensure we don't move toward boundaries while avoiding enemies
            let preferredAction;
            if (Math.abs(dx) > Math.abs(dy)) {
                preferredAction = dx > 0 ? 3 : 7; // Move right or left
            } else {
                preferredAction = dy > 0 ? 5 : 1; // Move down or up
            }

            // Check if preferred action would move us toward a boundary
            const futureX = playerX + (preferredAction === 3 ? 0.1 : preferredAction === 7 ? -0.1 : 0);
            const futureY = playerY + (preferredAction === 5 ? 0.1 : preferredAction === 1 ? -0.1 : 0);

            // If preferred action leads to boundary, choose perpendicular movement
            if (futureX < edgeDistance || futureX > (1 - edgeDistance) ||
                futureY < edgeDistance || futureY > (1 - edgeDistance)) {
                // Choose perpendicular direction that doesn't lead to boundary
                if (Math.abs(dx) > Math.abs(dy)) {
                    // Was moving horizontally, try vertical
                    return dy > 0 ? 5 : 1;
                } else {
                    // Was moving vertically, try horizontal
                    return dx > 0 ? 3 : 7;
                }
            }

            return preferredAction;
        }

        // Priority 3: If no enemies and not near boundaries, do gentle movement toward center
        const centerX = 0.5;
        const centerY = 0.5;
        const distanceFromCenter = Math.sqrt((playerX - centerX) ** 2 + (playerY - centerY) ** 2);

        if (distanceFromCenter > 0.3) {
            // Move toward center if far from it
            const toCenterX = centerX - playerX;
            const toCenterY = centerY - playerY;

            if (Math.abs(toCenterX) > Math.abs(toCenterY)) {
                return toCenterX > 0 ? 3 : 7; // Move right or left toward center
            } else {
                return toCenterY > 0 ? 5 : 1; // Move down or up toward center
            }
        }

        // Default: stay in place if near center and no enemies
        return 0;
    }

    remember(state, action, reward, nextState, done) {
        const experience = {
            state: state.slice(),
            action: action,
            reward: reward,
            nextState: nextState ? nextState.slice() : null,
            done: done
        };

        if (this.memory.length < this.config.memorySize) {
            this.memory.push(experience);
        } else {
            this.memory[this.memoryIndex] = experience;
            this.memoryIndex = (this.memoryIndex + 1) % this.config.memorySize;
        }
    }

    async replay() {
        if (this.memory.length < this.config.batchSize) {
            return null;
        }

        // Sample random batch
        const batch = [];
        for (let i = 0; i < this.config.batchSize; i++) {
            const randomIndex = Math.floor(Math.random() * this.memory.length);
            batch.push(this.memory[randomIndex]);
        }

        // Prepare training data
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

        // Update Q-values
        const qValuesArray = await qValues.array();
        let targetIndex = 0;

        for (let i = 0; i < batch.length; i++) {
            const experience = batch[i];

            if (experience.done) {
                qValuesArray[i][experience.action] = experience.reward;
            } else {
                const targetQArray = await targetQValues.array();
                const maxTargetQ = Math.max(...targetQArray[targetIndex]);
                qValuesArray[i][experience.action] = experience.reward + this.config.gamma * maxTargetQ;
                targetIndex++;
            }
        }

        // Train the network
        const targetTensor = tf.tensor2d(qValuesArray);
        const history = await this.mainNetwork.fit(statesTensor, targetTensor, {
            epochs: 1,
            verbose: 0
        });

        const loss = history.history.loss[0];

        // Cleanup
        statesTensor.dispose();
        qValues.dispose();
        targetTensor.dispose();
        if (targetQValues) targetQValues.dispose();

        return loss;
    }

    updateTargetNetwork() {
        const mainWeights = this.mainNetwork.getWeights();
        this.targetNetwork.setWeights(mainWeights);
    }

    async saveModel(name) {
        try {
            await this.mainNetwork.save(`localstorage://${name}`);
            console.log(`✅ Model saved: ${name}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to save model: ${error}`);
            return false;
        }
    }

    async loadModel(name) {
        try {
            this.mainNetwork = await tf.loadLayersModel(`localstorage://${name}`);
            this.updateTargetNetwork();
            console.log(`✅ Model loaded: ${name}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to load model: ${error}`);
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

console.log("🤖 Game AI System loaded! Call gameAI.initialize(scene) to enable AI features.");