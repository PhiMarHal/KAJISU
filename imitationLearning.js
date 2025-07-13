// imitationLearning.js - Dual-Mode Behavioral Cloning System
// Separates movement learning from level-up learning for better AI performance

/**
 * DUAL-MODE IMITATION LEARNING SYSTEM
 * Separates movement training from level-up training to avoid confusion
 */
class DualModeImitationLearningSystem {
    constructor() {
        this.isRecording = false;
        this.recordingData = [];
        this.recordingStartTime = null;
        this.lastRecordTime = 0;
        this.recordingInterval = 150;

        // Dual training data storage
        this.movementData = [];
        this.levelUpData = [];

        // State extractor
        this.stateExtractor = null;

        // Dual models
        this.movementModel = null;
        this.levelUpModel = null;
        this.isMovementModelTrained = false;
        this.isLevelUpModelTrained = false;
        this.tfLoaded = false;

        // Integration state
        this.isUsingImitationMode = false;
        this.lastDecisionTime = 0;
        this.decisionInterval = 150;

        // Training state management - REMOVED AUTO-TRAINING
        this.isTraining = false;
        this.trainingQueued = false; // No longer used
        this.lastGameOverState = false;
        this.sessionRecorded = false;

        // Game state tracking
        this.lastGamePausedState = false;
        this.lastLevelUpState = false;
        this.isInLevelUpMode = false;
        this.currentGameMode = 'movement'; // 'movement' or 'levelup'

        // Level-up handling
        this.levelUpStartTime = null;
        this.levelUpHandled = false;
        this.perkScrollPhase = null;
        this.perksViewed = 0;

        // Movement control
        this.pressedKeys = new Set();

        // Enhanced data quality thresholds
        this.movementDataThreshold = 100;
        this.levelUpDataThreshold = 10;

        // Training overlay
        this.trainingOverlay = null;

        // Debug mode
        this.debugMode = false;

        console.log("🎬 Dual-Mode Imitation Learning System - Separate movement and level-up training");
    }

    async initialize(scene) {
        this.scene = scene;
        await this.ensureTensorFlowLoaded();

        // Create specialized state extractors
        this.stateExtractor = new DualModeStateExtractor();
        this.stateExtractor.initialize(scene);

        this.createDualModeUI();
        this.setupKeyboardShortcuts();
        this.setupEnhancedAutoTraining();

        console.log("🎬 Dual-mode imitation learning system ready");
    }

    async ensureTensorFlowLoaded() {
        if (window.tf) {
            this.tfLoaded = true;
            console.log("✅ TensorFlow.js already available");
            return;
        }

        console.log("📥 Loading TensorFlow.js...");
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0/dist/tf.min.js';
            script.onload = () => {
                this.tfLoaded = true;
                console.log("✅ TensorFlow.js loaded successfully");
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load TensorFlow.js'));
            document.head.appendChild(script);
        });
    }

    setupEnhancedAutoTraining() {
        setInterval(() => {
            this.checkForGameOverEnhanced();
            this.updateGameModeDetection(); // Add continuous game mode detection
        }, 200); // Check more frequently
    }

    updateGameModeDetection() {
        // Use the actual game state variables - much simpler and more reliable
        const isLevelUpInProgress = window.levelUpInProgress ?? (typeof levelUpInProgress !== 'undefined' ? levelUpInProgress : false);

        let hasLevelUpCards = false;
        try {
            const cards = window.levelUpCards ?? (typeof levelUpCards !== 'undefined' ? levelUpCards : null);
            hasLevelUpCards = cards && cards.length > 0;
        } catch (e) { }

        // Simple and direct: if either flag is set, we're in level-up mode
        const isActuallyInLevelUp = isLevelUpInProgress || hasLevelUpCards;

        if (this.debugMode && isActuallyInLevelUp !== this.isInLevelUpMode) {
            console.log(`🎯 Level-up state change: ${this.isInLevelUpMode} → ${isActuallyInLevelUp} (inProgress: ${isLevelUpInProgress}, hasCards: ${hasLevelUpCards})`);
        }

        this.updateGameMode(isActuallyInLevelUp);
        this.isInLevelUpMode = isActuallyInLevelUp;
    }

    checkForGameOverEnhanced() {
        const currentGameOverState = window.gameOver ?? (typeof gameOver !== 'undefined' ? gameOver : false);

        // Game just ended and we have recorded data
        if (currentGameOverState && !this.lastGameOverState && this.sessionRecorded && this.recordingData.length > 0) {
            console.log("🎮 Game over detected - processing dual-mode training...");

            if (this.isRecording) {
                this.stopRecording();
            }

            if (this.isTraining) {
                console.log("⚠️ Training already in progress - queuing this session");
                this.trainingQueued = true;
                return;
            }

            setTimeout(() => {
                this.processDualModeTraining();
            }, 1000);
        }

        // Update state tracking
        this.lastGameOverState = currentGameOverState;

        // Reset session tracking when game starts again
        if (!currentGameOverState && this.lastGameOverState) {
            this.sessionRecorded = false;
            if (this.trainingQueued && !this.isTraining) {
                console.log("🎯 Starting queued dual-mode training");
                this.trainingQueued = false;
                setTimeout(() => {
                    this.processDualModeTraining();
                }, 1000);
            }
        }
    }

    updateGameMode(isLevelUp) {
        const newMode = isLevelUp ? 'levelup' : 'movement';

        if (newMode !== this.currentGameMode) {
            console.log(`🔄 Game mode changed: ${this.currentGameMode} → ${newMode}`);
            this.currentGameMode = newMode;
        }
    }

    // Separate recorded data into movement and level-up examples
    separateTrainingData() {
        const movementExamples = [];
        const levelUpExamples = [];

        console.log(`📊 Analyzing ${this.recordingData.length} recorded examples...`);

        // Debug: Count examples by detected state
        let movementDetected = 0;
        let levelUpDetected = 0;
        let pausedDetected = 0;

        for (const example of this.recordingData) {
            // Simple and direct level-up detection using the game state variables
            const isLevelUpExample = example.gameMode === 'levelup' ||
                example.isLevelUp ||
                example.levelUpInProgress ||
                example.hasLevelUpCards;

            if (isLevelUpExample) {
                levelUpDetected++;
                // Level-up example
                levelUpExamples.push({
                    state: example.state.slice(),
                    action: example.action,
                    isClick: example.isClick || false,
                    clickX: example.clickX || 0,
                    clickY: example.clickY || 0
                });
            } else {
                movementDetected++;
                // Movement example - only include if actually moving or important context
                if (example.action !== 0 || this.isImportantStillAction(example, movementExamples)) {
                    movementExamples.push({
                        state: example.state.slice(),
                        action: example.action
                    });
                }
            }

            if (example.isPaused) pausedDetected++;
        }

        console.log(`📊 Detection results: ${movementDetected} movement, ${levelUpDetected} level-up, ${pausedDetected} paused`);

        // Balance movement data - reduce excessive "stay still" actions
        const balancedMovement = this.balanceMovementData(movementExamples);

        console.log(`📊 Final separation: ${balancedMovement.length} movement (balanced), ${levelUpExamples.length} level-up`);

        return {
            movement: balancedMovement,
            levelUp: levelUpExamples
        };
    }

    // Determine if a "stay still" action is important for context
    isImportantStillAction(example, existingExamples) {
        // Keep some "stay still" actions for context, but not too many
        const recentStillCount = existingExamples.slice(-10).filter(e => e.action === 0).length;

        // Keep every 5th still action, or if player health is low (defensive positioning)
        return recentStillCount < 2 || example.playerHealth < 50;
    }

    // Balance movement data to prevent action bias
    balanceMovementData(movementData) {
        const actionCounts = {};
        movementData.forEach(ex => {
            actionCounts[ex.action] = (actionCounts[ex.action] || 0) + 1;
        });

        console.log("📊 Movement action distribution:", actionCounts);

        // If "stay still" is more than 30% of actions, reduce it
        const totalActions = movementData.length;
        const maxStillAllowed = Math.floor(totalActions * 0.3);

        if (actionCounts[0] > maxStillAllowed) {
            console.log(`📊 Reducing "stay still" actions: ${actionCounts[0]} → ${maxStillAllowed}`);

            const stillActions = movementData.filter(ex => ex.action === 0);
            const nonStillActions = movementData.filter(ex => ex.action !== 0);

            // Randomly sample "stay still" actions
            const sampledStill = this.randomSample(stillActions, maxStillAllowed);

            return [...nonStillActions, ...sampledStill];
        }

        return movementData;
    }

    // Train the movement model
    async trainMovementModel(movementData) {
        if (!this.tfLoaded) {
            console.error("❌ TensorFlow.js not loaded!");
            return false;
        }

        try {
            console.log(`🏃 Starting movement model training with ${movementData.length} examples`);

            const states = movementData.map(ex => ex.state);
            const actions = movementData.map(ex => ex.action);
            const oneHotActions = this.actionsToOneHot(actions, 9); // 9 movement actions

            console.log(`🏃 State dimensions: ${states[0].length}, Action examples: ${actions.length}`);

            if (!this.movementModel) {
                console.log("🏃 Creating new movement model...");
                this.movementModel = await this.createMovementModel(states[0].length);
            } else {
                console.log("🏃 Using existing movement model...");
            }

            const statesTensor = tf.tensor2d(states);
            const actionsTensor = tf.tensor2d(oneHotActions);

            const epochs = this.calculateOptimalEpochs(movementData.length);
            const batchSize = this.calculateOptimalBatchSize(movementData.length);

            console.log(`🏃 Training movement model: ${epochs} epochs, batch ${batchSize}`);

            const history = await this.movementModel.fit(statesTensor, actionsTensor, {
                epochs: epochs,
                batchSize: batchSize,
                validationSplit: 0.15,
                shuffle: true,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        if (epoch % 10 === 0 || epoch === epochs - 1) {
                            console.log(`🏃 Movement Epoch ${epoch}: loss=${logs.loss.toFixed(4)}, acc=${logs.acc.toFixed(4)}`);
                        }
                    }
                }
            });

            statesTensor.dispose();
            actionsTensor.dispose();

            const finalLoss = history.history.loss[history.history.loss.length - 1];
            const finalAcc = history.history.acc[history.history.acc.length - 1];

            console.log(`✅ Movement model training complete! Loss: ${finalLoss.toFixed(4)}, Accuracy: ${finalAcc.toFixed(4)}`);

            // Explicitly set trained flag and log it
            this.isMovementModelTrained = true;
            console.log(`🏃 Movement model trained flag set to: ${this.isMovementModelTrained}`);

            this.updateUI();

            return true;

        } catch (error) {
            console.error("Movement model training error:", error);
            return false;
        }
    }

    // Train the level-up model (simplified for now - could be expanded for click prediction)
    async trainLevelUpModel(levelUpData) {
        if (!this.tfLoaded) {
            console.error("❌ TensorFlow.js not loaded!");
            return false;
        }

        try {
            // For now, just create a simple model that learns basic level-up behavior
            // In the future, this could predict optimal perk selections

            if (!this.levelUpModel) {
                this.levelUpModel = await this.createLevelUpModel();
            }

            console.log(`🎯 Level-up model created with ${levelUpData.length} examples`);

            // For now, mark as trained - future versions could do actual click prediction
            this.isLevelUpModelTrained = true;
            this.updateUI();

            return true;

        } catch (error) {
            console.error("Level-up model training error:", error);
            return false;
        }
    }

    // Create specialized movement model
    async createMovementModel(stateSize) {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [stateSize],
                    units: 128,
                    activation: 'relu',
                    kernelRegularizer: tf.regularizers.l2({ l2: 0.0001 })
                }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({
                    units: 64,
                    activation: 'relu',
                    kernelRegularizer: tf.regularizers.l2({ l2: 0.0001 })
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({
                    units: 9, // 9 movement actions
                    activation: 'softmax'
                })
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        return model;
    }

    // Create simplified level-up model
    async createLevelUpModel() {
        // For now, return a dummy model - future versions could predict clicks
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [10], // Simplified state for level-up
                    units: 32,
                    activation: 'relu'
                }),
                tf.layers.dense({
                    units: 4, // Simple level-up actions (browse, select, etc.)
                    activation: 'softmax'
                })
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        return model;
    }

    // Record frame with dual-mode awareness
    recordFrame() {
        if (!this.isRecording || !this.scene) return;

        const now = Date.now();
        if (now - this.lastRecordTime < this.recordingInterval) return;

        const isPaused = window.gamePaused ?? (typeof gamePaused !== 'undefined' ? gamePaused : false);
        const isLevelUp = window.levelUpInProgress ?? (typeof levelUpInProgress !== 'undefined' ? levelUpInProgress : false);
        const isGameOver = window.gameOver ?? (typeof gameOver !== 'undefined' ? gameOver : false);

        let hasLevelUpCards = false;
        let hasLevelUpUI = false;

        try {
            const cards = window.levelUpCards;
            hasLevelUpCards = cards && cards.length > 0;

            const hasLevelUpText = document.body.textContent.includes('LEVEL UP') ||
                document.body.textContent.includes('CHOOSE A PERK');
            hasLevelUpUI = hasLevelUpText;
        } catch (e) { }

        const isActuallyInLevelUp = isLevelUp || hasLevelUpCards || hasLevelUpUI;

        if (isGameOver) return;

        try {
            const state = this.stateExtractor.getState(this.currentGameMode);
            if (!state) return;

            const action = this.getCurrentHumanAction();
            if (action === null) return;

            const example = {
                state: state.slice(),
                action: action,
                timestamp: now - this.recordingStartTime,
                gameTime: window.elapsedTime || 0,
                playerHealth: window.playerHealth || 100,
                score: window.score || 0,
                isPaused: isPaused,
                isLevelUp: isActuallyInLevelUp,
                gameMode: this.currentGameMode
            };

            this.recordingData.push(example);
            this.lastRecordTime = now;

            if (this.recordingData.length % 200 === 0) {
                const movementExamples = this.recordingData.filter(e => e.gameMode === 'movement').length;
                const levelUpExamples = this.recordingData.filter(e => e.gameMode === 'levelup').length;
                console.log(`📊 Recorded ${this.recordingData.length} examples (${movementExamples} movement, ${levelUpExamples} level-up)`);
            }

        } catch (error) {
            console.error("Recording error:", error);
        }
    }

    // Use appropriate model based on game mode
    async controlMovement() {
        if (!this.isUsingImitationMode) return;

        if (this.isInLevelUpMode) {
            this.handleLevelUpWithModel();
            return;
        }

        if (!this.isMovementModelTrained) return;

        const now = Date.now();
        if (now - this.lastDecisionTime < this.decisionInterval) return;

        const state = this.stateExtractor?.getState('movement');
        if (!state) return;

        const action = await this.chooseMovementAction(state);
        this.executeAction(action);

        this.lastDecisionTime = now;
    }

    // Use movement model for decisions
    async chooseMovementAction(state) {
        if (!this.movementModel || !this.isMovementModelTrained) {
            return 0;
        }

        try {
            const stateTensor = tf.tensor2d([state]);
            const prediction = await this.movementModel.predict(stateTensor);
            const probabilities = await prediction.data();

            const action = this.sampleFromProbabilities(probabilities);

            if (this.debugMode) {
                const actionNames = ['Stay', 'Up', 'Up-Right', 'Right', 'Down-Right', 'Down', 'Down-Left', 'Left', 'Up-Left'];
                console.log(`🏃 MOVEMENT AI: ${actionNames[action]} (${(probabilities[action] * 100).toFixed(1)}%)`);
            }

            stateTensor.dispose();
            prediction.dispose();

            return action;
        } catch (error) {
            console.error("Movement action error:", error);
            return 0;
        }
    }

    // Handle level-up with model (simplified for now)
    handleLevelUpWithModel() {
        // For now, use the simple approach
        if (!this.levelUpStartTime) {
            this.levelUpStartTime = Date.now();
            this.levelUpHandled = false;
            this.perkScrollPhase = 'browsing';
            this.perksViewed = 0;
            console.log("🎯 Dual-mode AI: Level up started");
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
                this.perkScrollPhase = 'selecting';
                return;
            }
        }

        if (this.perkScrollPhase === 'selecting') {
            const perkSelected = this.selectRandomPerk();

            if (perkSelected) {
                this.levelUpHandled = true;
                this.levelUpStartTime = null;
                this.perkScrollPhase = null;
                console.log("🎯 Dual-mode AI: Perk selected");
            } else if (elapsed > 15000) {
                this.emergencyLevelUpExit();
                this.levelUpHandled = true;
                this.levelUpStartTime = null;
                this.perkScrollPhase = null;
            }
        }
    }

    // Start recording
    startRecording(sessionName = null) {
        if (this.isRecording) {
            console.log("⚠️ Already recording!");
            return;
        }

        if (this.isTraining) {
            console.log("⚠️ Cannot start recording while training is in progress");
            this.showTrainingOverlay("Cannot start recording - training in progress", 2000);
            return;
        }

        const defaultName = `dual_mode_session_${Date.now()}`;
        sessionName = sessionName || defaultName;

        this.isRecording = true;
        this.recordingData = [];
        this.recordingStartTime = Date.now();
        this.lastRecordTime = 0;
        this.currentSessionName = sessionName;
        this.sessionRecorded = true;

        console.log(`🔴 DUAL-MODE RECORDING STARTED: ${sessionName}`);
        this.updateUI();
    }

    // Stop recording
    stopRecording() {
        if (!this.isRecording) {
            console.log("⚠️ Not currently recording!");
            return;
        }

        this.isRecording = false;

        if (this.recordingData.length > 0) {
            const duration = (Date.now() - this.recordingStartTime) / 1000;
            const movementExamples = this.recordingData.filter(e => e.gameMode === 'movement').length;
            const levelUpExamples = this.recordingData.filter(e => e.gameMode === 'levelup').length;
            console.log(`⏹️ DUAL-MODE RECORDING STOPPED: ${this.currentSessionName}`);
            console.log(`📊 Captured ${this.recordingData.length} examples (${movementExamples} movement, ${levelUpExamples} level-up) over ${duration.toFixed(1)}s`);
        }

        this.updateUI();
    }

    // Toggle imitation mode
    toggleImitationMode() {
        if (this.isTraining) {
            console.log("⚠️ Cannot toggle imitation mode while training is in progress");
            this.showTrainingOverlay("Cannot toggle mode - training in progress", 2000);
            return;
        }

        console.log(`🎭 Toggle request - Movement model trained: ${this.isMovementModelTrained}, Level-up model trained: ${this.isLevelUpModelTrained}`);

        this.isUsingImitationMode = !this.isUsingImitationMode;

        if (this.isUsingImitationMode) {
            if (!this.isMovementModelTrained) {
                console.log("⚠️ No trained movement model available!");
                console.log(`🔍 Debug - Movement model exists: ${!!this.movementModel}, Is trained flag: ${this.isMovementModelTrained}`);
                this.isUsingImitationMode = false;
                this.showTrainingOverlay("No trained movement model available!", 2000);
                return;
            }

            // Disable the reinforcement learning AI if it's active
            if (window.gameAI?.aiActive) {
                console.log("🔄 Disabling reinforcement learning AI");
                window.gameAI.aiActive = false;
                window.gameAI.releaseAllMovementKeys();
            }
            console.log("🎭 Dual-mode imitation: ON");
        } else {
            console.log("🎭 Dual-mode imitation: OFF");
            this.releaseAllMovementKeys();
        }

        this.updateUI();
    }

    // Manual training on current session
    async trainOnCurrentSession() {
        if (this.isTraining) {
            console.log("⚠️ Training already in progress! Waiting for completion...");
            this.showTrainingOverlay("Training already in progress - please wait", 2000);
            return false;
        }

        if (!this.tfLoaded) {
            console.error("❌ TensorFlow.js not loaded!");
            this.showTrainingOverlay("TensorFlow.js not loaded", 2000);
            return false;
        }

        if (this.recordingData.length < 50) {
            console.error(`❌ Not enough training data! Need at least 50 examples, got ${this.recordingData.length}.`);
            this.showTrainingOverlay(`Need at least 50 examples for training (have ${this.recordingData.length})`, 3000);
            return false;
        }

        console.log(`🧠 Manual dual-mode training: ${this.recordingData.length} examples`);

        this.isTraining = true;
        this.showTrainingOverlay("Manual dual-mode training in progress...");

        try {
            // Use the same processing as automatic training
            await this.processDualModeTrainingInternal();
            this.showTrainingOverlay("Manual training complete!", 2000);
            return true;
        } catch (error) {
            console.error("Manual training error:", error);
            this.showTrainingOverlay("Manual training error - check console", 3000);
            return false;
        } finally {
            this.isTraining = false;
            console.log("🔄 Manual training state reset");
        }
    }

    // Internal training logic - NO AUTO-TRIGGER
    async processDualModeTrainingInternal() {
        // Separate data into movement and level-up examples
        const separatedData = this.separateTrainingData();

        console.log(`📊 Separated data: ${separatedData.movement.length} movement, ${separatedData.levelUp.length} level-up`);

        let trainingSuccess = false;

        // Train movement model if we have enough data
        if (separatedData.movement.length >= this.movementDataThreshold) {
            console.log("🏃 Training movement model...");
            const movementSuccess = await this.trainMovementModel(separatedData.movement);
            trainingSuccess = trainingSuccess || movementSuccess;
        } else {
            console.log(`📊 Not enough movement data: ${separatedData.movement.length} < ${this.movementDataThreshold}`);
        }

        // Train level-up model if we have enough data
        if (separatedData.levelUp.length >= this.levelUpDataThreshold) {
            console.log("🎯 Training level-up model...");
            const levelUpSuccess = await this.trainLevelUpModel(separatedData.levelUp);
            trainingSuccess = trainingSuccess || levelUpSuccess;
        } else {
            console.log(`📊 Not enough level-up data: ${separatedData.levelUp.length} < ${this.levelUpDataThreshold}`);
        }

        return trainingSuccess;
    }

    // Utility methods (carried over from original)
    getCurrentHumanAction() {
        const inputSystem = window.InputSystem;
        if (!inputSystem?.keyboard?.cursors || !inputSystem?.keyboard?.wasdKeys) return null;

        const cursors = inputSystem.keyboard.cursors;
        const wasd = inputSystem.keyboard.wasdKeys;

        let vx = 0, vy = 0;

        if (cursors.left.isDown || wasd.left.isDown) vx = -1;
        if (cursors.right.isDown || wasd.right.isDown) vx = 1;
        if (cursors.up.isDown || wasd.up.isDown) vy = -1;
        if (cursors.down.isDown || wasd.down.isDown) vy = 1;

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

    executeAction(actionIndex) {
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
                    this.pressedKeys.add(key);
                }
            });
        });
    }

    releaseAllMovementKeys() {
        this.pressedKeys.forEach(key => {
            if (key) {
                key.isDown = false;
                key.isUp = true;
            }
        });
        this.pressedKeys.clear();
    }

    // Navigation methods for level-up
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

    selectRandomPerk() {
        const gameWidth = window.game?.config?.width || 1200;
        const gameHeight = window.game?.config?.height || 800;
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;

        this.clickAtGamePosition(centerX, centerY);
        return true;
    }

    emergencyLevelUpExit() {
        const gameWidth = window.game?.config?.width || 1200;
        const gameHeight = window.game?.config?.height || 800;
        this.clickAtGamePosition(gameWidth / 2, gameHeight / 2);
        setTimeout(() => this.simulateKeyPress('Enter'), 200);
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

    simulateKeyPress(key) {
        const downEvent = new KeyboardEvent('keydown', { key, bubbles: true });
        const upEvent = new KeyboardEvent('keyup', { key, bubbles: true });
        document.dispatchEvent(downEvent);
        setTimeout(() => document.dispatchEvent(upEvent), 100);
    }

    // Utility methods
    calculateOptimalEpochs(dataSize) {
        if (dataSize < 200) return 50;
        if (dataSize < 1000) return 40;
        if (dataSize < 5000) return 35;
        return 30;
    }

    calculateOptimalBatchSize(dataSize) {
        return Math.min(64, Math.max(16, Math.floor(dataSize / 50)));
    }

    actionsToOneHot(actions, numActions) {
        const oneHot = [];
        actions.forEach(action => {
            const vector = new Array(numActions).fill(0);
            vector[action] = 1;
            oneHot.push(vector);
        });
        return oneHot;
    }

    sampleFromProbabilities(probabilities) {
        const random = Math.random();
        let sum = 0;

        for (let i = 0; i < probabilities.length; i++) {
            sum += probabilities[i];
            if (random <= sum) {
                return i;
            }
        }

        return 0;
    }

    randomSample(array, size) {
        if (array.length <= size) return array;

        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled.slice(0, size);
    }

    showTrainingOverlay(message, duration = null) {
        if (this.trainingOverlay) {
            this.trainingOverlay.remove();
        }

        this.trainingOverlay = document.createElement('div');
        this.trainingOverlay.style.cssText = `
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9); color: white;
            padding: 20px 40px; border-radius: 8px;
            font-family: Arial, sans-serif; font-size: 16px;
            z-index: 2000; border: 2px solid #9C27B0;
            text-align: center; min-width: 300px;
        `;

        const statusColor = this.isTraining ? '#ffaa00' : '#9C27B0';
        this.trainingOverlay.innerHTML = `
            <div style="margin-bottom: 15px; color: ${statusColor};">🤖 Dual-Mode AI Training</div>
            <div>${message}</div>
            ${this.isTraining ? '<div style="margin-top: 10px; font-size: 12px; color: #aaa;">Separating movement and level-up training...</div>' : ''}
        `;

        document.body.appendChild(this.trainingOverlay);

        if (duration) {
            setTimeout(() => {
                if (this.trainingOverlay) {
                    this.trainingOverlay.remove();
                    this.trainingOverlay = null;
                }
            }, duration);
        }
    }

    createDualModeUI() {
        const existing = document.getElementById('imitation-interface');
        if (existing) existing.remove();

        const ui = document.createElement('div');
        ui.id = 'imitation-interface';
        ui.style.cssText = `
            position: fixed;
            top: 50%; right: 20px;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.9); color: white;
            padding: 15px; border-radius: 8px;
            font-family: Arial, sans-serif; font-size: 12px;
            z-index: 1000; border: 2px solid #9C27B0;
            min-width: 280px;
        `;

        ui.innerHTML = `
            <div style="margin-bottom: 10px;">
                <div><strong>🎬 Dual-Mode Imitation</strong></div>
                <div>Recording: <span id="recording-status">Off</span></div>
                <div>Training: <span id="training-status">Ready</span></div>
                <div>Movement Model: <span id="movement-model-status">Not Trained</span></div>
                <div>Level-up Model: <span id="levelup-model-status">Not Trained</span></div>
                <div>Mode: <span id="imitation-mode">Human Control</span></div>
                <div>Game Mode: <span id="game-mode">Movement</span></div>
                <div>Current: <span id="current-examples">0</span> examples</div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <button id="toggle-recording" style="padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Start Recording (V)
                </button>
                <button id="train-current" style="padding: 8px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Train Current (B)
                </button>
                <button id="toggle-imitation" style="padding: 8px; background: #9C27B0; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Toggle Imitation (N)
                </button>
                
                <div style="display: flex; gap: 3px;">
                    <button id="export-session" style="flex: 1; padding: 6px; background: #607D8B; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Export
                    </button>
                    <button id="toggle-debug" style="flex: 1; padding: 6px; background: #795548; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Debug
                    </button>
                </div>
                
                <div style="display: flex; gap: 3px;">
                    <button id="save-movement" style="flex: 1; padding: 6px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Save Move
                    </button>
                    <button id="load-movement" style="flex: 1; padding: 6px; background: #E91E63; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Load Move
                    </button>
                </div>
            </div>
            
            <div style="margin-top: 8px; font-size: 10px; color: #aaa;">
                Manual training only - Enhanced boundary awareness
            </div>
        `;

        document.body.appendChild(ui);

        // Add event listeners
        document.getElementById('toggle-recording').onclick = () => {
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        };

        document.getElementById('train-current').onclick = () => this.trainOnCurrentSession();
        document.getElementById('toggle-imitation').onclick = () => this.toggleImitationMode();
        document.getElementById('export-session').onclick = () => this.exportCurrentSession();
        document.getElementById('toggle-debug').onclick = () => {
            this.debugMode = !this.debugMode;
            console.log(`🔍 Dual-mode debug: ${this.debugMode ? 'ON' : 'OFF'}`);
        };
        document.getElementById('save-movement').onclick = () => this.saveMovementModel();
        document.getElementById('load-movement').onclick = () => this.loadMovementModel();
    }

    updateUI() {
        const recordingStatus = document.getElementById('recording-status');
        const trainingStatus = document.getElementById('training-status');
        const movementModelStatus = document.getElementById('movement-model-status');
        const levelupModelStatus = document.getElementById('levelup-model-status');
        const imitationMode = document.getElementById('imitation-mode');
        const gameMode = document.getElementById('game-mode');
        const currentExamples = document.getElementById('current-examples');
        const toggleRecordingBtn = document.getElementById('toggle-recording');

        if (recordingStatus) {
            recordingStatus.textContent = this.isRecording ? 'Recording...' : 'Off';
            recordingStatus.style.color = this.isRecording ? '#ff4444' : '#888';
        }

        if (trainingStatus) {
            if (this.isTraining) {
                trainingStatus.textContent = 'Training...';
                trainingStatus.style.color = '#ffaa00';
            } else if (this.trainingQueued) {
                trainingStatus.textContent = 'Queued';
                trainingStatus.style.color = '#ff9800';
            } else {
                trainingStatus.textContent = 'Ready';
                trainingStatus.style.color = '#888';
            }
        }

        if (movementModelStatus) {
            movementModelStatus.textContent = this.isMovementModelTrained ? 'Trained' : 'Not Trained';
            movementModelStatus.style.color = this.isMovementModelTrained ? '#44ff44' : '#888';
        }

        if (levelupModelStatus) {
            levelupModelStatus.textContent = this.isLevelUpModelTrained ? 'Trained' : 'Not Trained';
            levelupModelStatus.style.color = this.isLevelUpModelTrained ? '#44ff44' : '#888';
        }

        if (imitationMode) {
            if (this.isUsingImitationMode) {
                if (this.isInLevelUpMode) {
                    imitationMode.textContent = 'AI Level-up';
                } else {
                    imitationMode.textContent = 'AI Movement';
                }
                imitationMode.style.color = '#9C27B0';
            } else {
                imitationMode.textContent = 'Human Control';
                imitationMode.style.color = '#44ff44';
            }
        }

        if (gameMode) {
            gameMode.textContent = this.currentGameMode.charAt(0).toUpperCase() + this.currentGameMode.slice(1);
            gameMode.style.color = this.currentGameMode === 'movement' ? '#00ff00' : '#ffaa00';
        }

        if (currentExamples) {
            const movementCount = this.recordingData.filter(e => e.gameMode === 'movement').length;
            const levelUpCount = this.recordingData.filter(e => e.gameMode === 'levelup').length;
            currentExamples.textContent = `${this.recordingData.length} (${movementCount}M, ${levelUpCount}L)`;
        }

        if (toggleRecordingBtn) {
            const isDisabled = this.isTraining;
            toggleRecordingBtn.disabled = isDisabled;
            toggleRecordingBtn.style.opacity = isDisabled ? '0.6' : '1';

            if (isDisabled) {
                toggleRecordingBtn.textContent = 'Training... (V)';
                toggleRecordingBtn.style.background = '#666';
            } else {
                toggleRecordingBtn.textContent = this.isRecording ? 'Stop Recording (V)' : 'Start Recording (V)';
                toggleRecordingBtn.style.background = this.isRecording ? '#ff4444' : '#4CAF50';
            }
        }
    }

    // Model saving/loading
    async saveMovementModel() {
        if (!this.movementModel) {
            console.log("❌ No movement model to save!");
            return;
        }

        const modelName = prompt("Movement model name:", `dual_movement_${Date.now()}`);
        if (!modelName) return;

        try {
            await this.movementModel.save(`localstorage://${modelName}`);
            console.log(`✅ Movement model saved: ${modelName}`);
        } catch (error) {
            console.error("Save failed:", error);
        }
    }

    async loadMovementModel() {
        if (this.isTraining) {
            console.log("⚠️ Cannot load model while training is in progress");
            return;
        }

        const modelName = prompt("Movement model name to load:");
        if (!modelName) return;

        try {
            this.movementModel = await tf.loadLayersModel(`localstorage://${modelName}`);
            this.isMovementModelTrained = true;
            console.log(`✅ Movement model loaded: ${modelName}`);
            this.updateUI();
        } catch (error) {
            console.error("Load failed:", error);
        }
    }

    exportCurrentSession() {
        if (this.recordingData.length === 0) {
            console.log("❌ No current session data to export");
            return;
        }

        const separatedData = this.separateTrainingData();

        const exportData = {
            version: 'dual-mode',
            count: this.recordingData.length,
            movementData: separatedData.movement,
            levelUpData: separatedData.levelUp,
            metadata: {
                sessionDuration: this.recordingData.length > 0 ?
                    (this.recordingData[this.recordingData.length - 1].timestamp - this.recordingData[0].timestamp) / 1000 : 0,
                movementExamples: separatedData.movement.length,
                levelUpExamples: separatedData.levelUp.length,
                dualMode: true
            }
        };

        const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `dual_mode_session_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`📥 Exported dual-mode session: ${separatedData.movement.length} movement, ${separatedData.levelUp.length} level-up`);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            if (window.levelUpInProgress || window.gameOver) return;

            switch (event.key.toLowerCase()) {
                case 'v':
                    event.preventDefault();
                    if (this.isRecording) {
                        this.stopRecording();
                    } else {
                        this.startRecording();
                    }
                    break;
                case 'b':
                    event.preventDefault();
                    this.trainOnCurrentSession();
                    break;
                case 'n':
                    event.preventDefault();
                    this.toggleImitationMode();
                    break;
            }
        });
    }

    update() {
        this.recordFrame();
        this.controlMovement();
        this.updateUI();
    }

    cleanup() {
        if (this.movementModel) {
            this.movementModel.dispose();
            this.movementModel = null;
        }

        if (this.levelUpModel) {
            this.levelUpModel.dispose();
            this.levelUpModel = null;
        }

        if (this.trainingOverlay) {
            this.trainingOverlay.remove();
            this.trainingOverlay = null;
        }

        this.releaseAllMovementKeys();

        const ui = document.getElementById('imitation-interface');
        if (ui) ui.remove();

        this.isTraining = false;
        this.trainingQueued = false;
    }
}

/**
 * DUAL-MODE STATE EXTRACTOR
 * Provides different state representations for movement vs level-up
 */
class DualModeStateExtractor {
    constructor() {
        this.gameWidth = 1200;
        this.gameHeight = 800;
        this.lastMovementState = null;
        this.lastLevelUpState = null;
    }

    initialize(scene) {
        this.scene = scene;
        if (scene?.game?.config) {
            this.gameWidth = scene.game.config.width;
            this.gameHeight = scene.game.config.height;
        }
        console.log("🧠 Dual-mode state extractor initialized (29 features - enhanced boundary awareness)");
    }

    getState(mode = 'movement') {
        try {
            if (mode === 'movement') {
                return this.getMovementState();
            } else if (mode === 'levelup') {
                return this.getLevelUpState();
            }

            return this.getMovementState(); // Default to movement
        } catch (error) {
            console.error("Dual-mode state extraction error:", error);
            return mode === 'movement' ? this.lastMovementState : this.lastLevelUpState;
        }
    }

    getMovementState() {
        const gamePlayer = window.player || player;
        if (!gamePlayer) return this.lastMovementState;

        if (window.gameOver ?? gameOver) return this.lastMovementState;

        const state = [
            // Player position and status
            gamePlayer.x / this.gameWidth,
            gamePlayer.y / this.gameHeight,
            (window.playerHealth || playerHealth || 100) / (window.maxPlayerHealth || maxPlayerHealth || 100),
            Math.min((window.playerDamage || playerDamage || 10) / 100, 1),
            Math.min((window.playerSpeed || playerSpeed || 8) / 20, 1),
            Math.min((window.elapsedTime || elapsedTime || 0) / 1800, 1),

            // Enhanced boundary awareness
            ...this.getEnhancedBoundaryInfo(gamePlayer),

            // Simplified enemy threats (8 directions)
            ...this.getDirectionalThreats(gamePlayer),

            // Additional context
            Math.min((window.score || score || 0) / 1000, 1),
            Math.min((window.playerLevel || playerLevel || 1) / 20, 1)
        ];

        this.lastMovementState = state;
        return state;
    }

    getEnhancedBoundaryInfo(player) {
        const normalizedX = player.x / this.gameWidth;
        const normalizedY = player.y / this.gameHeight;

        // Basic boundary distances
        const leftDist = normalizedX;
        const rightDist = 1 - normalizedX;
        const topDist = normalizedY;
        const bottomDist = 1 - normalizedY;

        // Minimum distance to any boundary (danger indicator)
        const minBoundaryDist = Math.min(leftDist, rightDist, topDist, bottomDist);

        // Explicit corner detection (these should be strong danger signals)
        const cornerThreshold = 0.15; // Within 15% of any corner
        const inTopLeftCorner = leftDist < cornerThreshold && topDist < cornerThreshold ? 1 : 0;
        const inTopRightCorner = rightDist < cornerThreshold && topDist < cornerThreshold ? 1 : 0;
        const inBottomLeftCorner = leftDist < cornerThreshold && bottomDist < cornerThreshold ? 1 : 0;
        const inBottomRightCorner = rightDist < cornerThreshold && bottomDist < cornerThreshold ? 1 : 0;

        // Edge proximity warnings (closer to boundaries)
        const edgeThreshold = 0.1; // Within 10% of edge
        const nearLeftEdge = leftDist < edgeThreshold ? 1 : 0;
        const nearRightEdge = rightDist < edgeThreshold ? 1 : 0;
        const nearTopEdge = topDist < edgeThreshold ? 1 : 0;
        const nearBottomEdge = bottomDist < edgeThreshold ? 1 : 0;

        return [
            leftDist, rightDist, topDist, bottomDist,     // 4 features: basic distances
            minBoundaryDist,                              // 1 feature: overall danger
            inTopLeftCorner, inTopRightCorner,           // 2 features: corner detection
            inBottomLeftCorner, inBottomRightCorner,     // 2 features: corner detection  
            nearLeftEdge, nearRightEdge,                 // 2 features: edge proximity
            nearTopEdge, nearBottomEdge                  // 2 features: edge proximity
        ]; // Total: 13 features (was 4)
    }

    getLevelUpState() {
        // Simplified state for level-up context
        const state = [
            // Basic game context
            Math.min((window.playerLevel || playerLevel || 1) / 20, 1),
            (window.playerHealth || playerHealth || 100) / (window.maxPlayerHealth || maxPlayerHealth || 100),
            Math.min((window.playerDamage || playerDamage || 10) / 100, 1),
            Math.min((window.playerSpeed || playerSpeed || 8) / 20, 1),
            Math.min((window.playerLuck || playerLuck || 10) / 50, 1),
            Math.min((window.elapsedTime || elapsedTime || 0) / 1800, 1),
            Math.min((window.score || score || 0) / 1000, 1),

            // Placeholder values for future perk analysis
            0, 0, 0
        ];

        this.lastLevelUpState = state;
        return state;
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
}

// Replace the global imitation learning system
window.imitationLearning = new DualModeImitationLearningSystem();

// Auto-initialize when the game starts
document.addEventListener('DOMContentLoaded', () => {
    const checkGameReady = () => {
        if (window.game && window.game.scene && window.game.scene.scenes.length > 0) {
            const scene = window.game.scene.scenes[0];
            window.imitationLearning.initialize(scene);
        } else {
            setTimeout(checkGameReady, 1000);
        }
    };

    setTimeout(checkGameReady, 2000);
});

console.log("🎬 Dual-Mode Imitation Learning System loaded - Separate movement and level-up training!");