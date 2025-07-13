// imitationLearning.js - Complete Enhanced Dual-Mode Behavioral Cloning System
// Enhanced boundary awareness and rational game space representation

/**
 * DUAL-MODE IMITATION LEARNING SYSTEM
 * Separates movement training from level-up training for better AI performance
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

        // Training state management
        this.isTraining = false;
        this.trainingQueued = false;
        this.lastGameOverState = false;
        this.sessionRecorded = false;

        // Game state tracking
        this.lastGamePausedState = false;
        this.lastLevelUpState = false;
        this.isInLevelUpMode = false;
        this.currentGameMode = 'movement';

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

        console.log("🎬 Enhanced Dual-Mode Imitation Learning System - Rational boundary awareness");
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

        console.log("🎬 Enhanced dual-mode imitation learning system ready");
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
            this.updateGameModeDetection();
        }, 200);
    }

    updateGameModeDetection() {
        const isLevelUpInProgress = window.levelUpInProgress ?? (typeof levelUpInProgress !== 'undefined' ? levelUpInProgress : false);

        let hasLevelUpCards = false;
        try {
            const cards = window.levelUpCards ?? (typeof levelUpCards !== 'undefined' ? levelUpCards : null);
            hasLevelUpCards = cards && cards.length > 0;
        } catch (e) { }

        const isActuallyInLevelUp = isLevelUpInProgress || hasLevelUpCards;

        if (this.debugMode && isActuallyInLevelUp !== this.isInLevelUpMode) {
            console.log(`🎯 Level-up state change: ${this.isInLevelUpMode} → ${isActuallyInLevelUp} (inProgress: ${isLevelUpInProgress}, hasCards: ${hasLevelUpCards})`);
        }

        this.updateGameMode(isActuallyInLevelUp);
        this.isInLevelUpMode = isActuallyInLevelUp;
    }

    checkForGameOverEnhanced() {
        const currentGameOverState = window.gameOver ?? (typeof gameOver !== 'undefined' ? gameOver : false);
        this.lastGameOverState = currentGameOverState;

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

    separateTrainingData() {
        const movementExamples = [];
        const levelUpExamples = [];

        console.log(`📊 Analyzing ${this.recordingData.length} recorded examples...`);

        let movementDetected = 0;
        let levelUpDetected = 0;
        let pausedDetected = 0;

        for (const example of this.recordingData) {
            const isLevelUpExample = example.gameMode === 'levelup' ||
                example.isLevelUp ||
                example.levelUpInProgress ||
                example.hasLevelUpCards;

            if (isLevelUpExample) {
                levelUpDetected++;
                levelUpExamples.push({
                    state: example.state.slice(),
                    action: example.action,
                    isClick: example.isClick || false,
                    clickX: example.clickX || 0,
                    clickY: example.clickY || 0
                });
            } else {
                movementDetected++;
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

        const balancedMovement = this.balanceMovementData(movementExamples);

        console.log(`📊 Final separation: ${balancedMovement.length} movement (balanced), ${levelUpExamples.length} level-up`);

        return {
            movement: balancedMovement,
            levelUp: levelUpExamples
        };
    }

    isImportantStillAction(example, existingExamples) {
        const recentStillCount = existingExamples.slice(-10).filter(e => e.action === 0).length;
        return recentStillCount < 2 || example.playerHealth < 50;
    }

    // Enhanced movement data balancing - much less aggressive
    balanceMovementData(movementData) {
        const actionCounts = {};
        movementData.forEach(ex => {
            actionCounts[ex.action] = (actionCounts[ex.action] || 0) + 1;
        });

        console.log("📊 Movement action distribution:", actionCounts);

        // Only filter if "stay still" is extremely over-represented (>60%)
        const totalActions = movementData.length;
        const maxStillAllowed = Math.floor(totalActions * 0.6);

        if (actionCounts[0] > maxStillAllowed) {
            console.log(`📊 Reducing excessive "stay still" actions: ${actionCounts[0]} → ${maxStillAllowed}`);

            const stillActions = movementData.filter(ex => ex.action === 0);
            const nonStillActions = movementData.filter(ex => ex.action !== 0);

            // Simple random sampling - no strategic assumptions
            const sampledStill = this.randomSample(stillActions, maxStillAllowed);

            return [...nonStillActions, ...sampledStill];
        }

        return movementData;
    }

    // Train the movement model with enhanced features
    async trainMovementModel(movementData) {
        if (!this.tfLoaded) {
            console.error("❌ TensorFlow.js not loaded!");
            return false;
        }

        try {
            console.log(`🏃 Starting enhanced movement model training with ${movementData.length} examples`);

            const states = movementData.map(ex => ex.state);
            const actions = movementData.map(ex => ex.action);
            const oneHotActions = this.actionsToOneHot(actions, 9);

            console.log(`🏃 Enhanced state dimensions: ${states[0].length}, Action examples: ${actions.length}`);

            // Better model reuse logic with explicit checking
            let isNewModel = false;
            if (!this.movementModel || !this.isMovementModelTrained) {
                console.log("🏃 Creating NEW enhanced movement model...");
                this.movementModel = await this.createMovementModel(states[0].length);
                this.modelTrainingCount = 0;
                isNewModel = true;
            } else {
                console.log(`🏃 REUSING existing movement model (previous training sessions: ${this.modelTrainingCount || 0})`);
                isNewModel = false;
            }

            // Increment training counter
            this.modelTrainingCount = (this.modelTrainingCount || 0) + 1;

            const statesTensor = tf.tensor2d(states);
            const actionsTensor = tf.tensor2d(oneHotActions);

            // Test current model performance before training
            let initialLoss = "N/A";
            if (!isNewModel) {
                try {
                    const testPrediction = await this.movementModel.predict(statesTensor.slice([0, 0], [Math.min(10, states.length), -1]));
                    const testLoss = await tf.losses.softmaxCrossEntropy(
                        actionsTensor.slice([0, 0], [Math.min(10, states.length), -1]),
                        testPrediction
                    ).data();
                    initialLoss = testLoss[0].toFixed(4);
                    testPrediction.dispose();
                } catch (e) {
                    console.log("Could not test initial loss:", e.message);
                }
            }

            const epochs = this.calculateOptimalEpochs(movementData.length);
            const batchSize = this.calculateOptimalBatchSize(movementData.length);

            console.log(`🏃 Training session ${this.modelTrainingCount}: ${epochs} epochs, batch ${batchSize}, initial loss: ${initialLoss}`);

            const history = await this.movementModel.fit(statesTensor, actionsTensor, {
                epochs: epochs,
                batchSize: batchSize,
                validationSplit: 0.15,
                shuffle: true,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        if (epoch % 5 === 0 || epoch === epochs - 1) {
                            console.log(`🏃 Session ${this.modelTrainingCount} Epoch ${epoch}: loss=${logs.loss.toFixed(4)}, acc=${logs.acc.toFixed(4)}`);
                        }
                    }
                }
            });

            // Clean up tensors
            statesTensor.dispose();
            actionsTensor.dispose();

            const finalLoss = history.history.loss[history.history.loss.length - 1];
            const finalAcc = history.history.acc[history.history.acc.length - 1];

            console.log(`✅ Training session ${this.modelTrainingCount} complete!`);
            console.log(`📊 ${isNewModel ? 'New model' : 'Continued training'}: Loss ${initialLoss} → ${finalLoss.toFixed(4)}, Accuracy: ${finalAcc.toFixed(4)}`);

            // Ensure the trained flag is set and persists
            this.isMovementModelTrained = true;

            // Force UI update
            this.updateUI();

            return true;

        } catch (error) {
            console.error("Enhanced movement model training error:", error);
            // Don't clear the model on error - keep it for next attempt
            return false;
        }
    }

    async trainLevelUpModel(levelUpData) {
        if (!this.tfLoaded) {
            console.error("❌ TensorFlow.js not loaded!");
            return false;
        }

        try {
            if (!this.levelUpModel) {
                this.levelUpModel = await this.createLevelUpModel();
            }

            console.log(`🎯 Level-up model created with ${levelUpData.length} examples`);
            this.isLevelUpModelTrained = true;
            this.updateUI();

            return true;

        } catch (error) {
            console.error("Level-up model training error:", error);
            return false;
        }
    }

    // Also replace createMovementModel to add diagnostics
    async createMovementModel(stateSize) {
        console.log(`🏗️ Creating enhanced movement model with state size: ${stateSize}`);

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
                    units: 32,
                    activation: 'relu'
                }),
                tf.layers.dense({
                    units: 9,
                    activation: 'softmax'
                })
            ]
        });

        // Compile the model (only done once when creating)
        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        console.log(`🏗️ Model created with ${model.weights.length} weight tensors`);

        // Test that the model works
        try {
            const testInput = tf.tensor2d([[...new Array(stateSize).fill(0.5)]]);
            const testPrediction = await model.predict(testInput);
            const testOutput = await testPrediction.data();
            console.log(`🏗️ New model test prediction: ${testOutput.slice(0, 3).map(x => x.toFixed(3)).join(',')}... (random weights)`);
            testInput.dispose();
            testPrediction.dispose();
        } catch (e) {
            console.log(`🏗️ New model test FAILED: ${e.message}`);
        }

        return model;
    }

    async createLevelUpModel() {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [10],
                    units: 32,
                    activation: 'relu'
                }),
                tf.layers.dense({
                    units: 4,
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

    // Enhanced debug output for movement constraints
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

                // Show movement constraints for debugging
                const constraints = state.slice(10, 18); // Features 10-17 are the movement constraints
                const blockedDirections = constraints.map((constraint, i) =>
                    constraint === 0 ? actionNames[i + 1] : null
                ).filter(d => d);

                const constrainedDirections = constraints.map((constraint, i) =>
                    constraint === 0.5 ? actionNames[i + 1] : null
                ).filter(d => d);

                console.log(`🏃 MOVEMENT AI: ${actionNames[action]} (${(probabilities[action] * 100).toFixed(1)}%)`);
                if (blockedDirections.length > 0) {
                    console.log(`🚫 BLOCKED directions: ${blockedDirections.join(', ')}`);
                }
                if (constrainedDirections.length > 0) {
                    console.log(`⚠️ CONSTRAINED directions: ${constrainedDirections.join(', ')}`);
                }
            }

            stateTensor.dispose();
            prediction.dispose();

            return action;
        } catch (error) {
            console.error("Movement action error:", error);
            return 0;
        }
    }

    handleLevelUpWithModel() {
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

    async processDualModeTrainingInternal() {
        const separatedData = this.separateTrainingData();

        console.log(`📊 Separated data: ${separatedData.movement.length} movement, ${separatedData.levelUp.length} level-up`);

        let trainingSuccess = false;

        if (separatedData.movement.length >= this.movementDataThreshold) {
            console.log("🏃 Training movement model...");
            const movementSuccess = await this.trainMovementModel(separatedData.movement);
            trainingSuccess = trainingSuccess || movementSuccess;
        } else {
            console.log(`📊 Not enough movement data: ${separatedData.movement.length} < ${this.movementDataThreshold}`);
        }

        if (separatedData.levelUp.length >= this.levelUpDataThreshold) {
            console.log("🎯 Training level-up model...");
            const levelUpSuccess = await this.trainLevelUpModel(separatedData.levelUp);
            trainingSuccess = trainingSuccess || levelUpSuccess;
        } else {
            console.log(`📊 Not enough level-up data: ${separatedData.levelUp.length} < ${this.levelUpDataThreshold}`);
        }

        return trainingSuccess;
    }

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

    navigateToNextPerk() {
        const gameWidth = window.game?.config?.width || (window.KAJISULI_MODE ? 720 : 1280);
        const gameHeight = window.game?.config?.height || (window.KAJISULI_MODE ? 1200 : 800);
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;
        const kajisuliMode = window.KAJISULI_MODE ?? false;
        const arrowDistance = kajisuliMode ? gameWidth * 0.32 : gameWidth * 0.16;
        const rightArrowX = centerX + arrowDistance;
        const rightArrowY = centerY;

        this.clickAtGamePosition(rightArrowX, rightArrowY);
    }

    selectRandomPerk() {
        const gameWidth = window.game?.config?.width || (window.KAJISULI_MODE ? 720 : 1280);
        const gameHeight = window.game?.config?.height || (window.KAJISULI_MODE ? 1200 : 800);
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;

        this.clickAtGamePosition(centerX, centerY);
        return true;
    }

    emergencyLevelUpExit() {
        const gameWidth = window.game?.config?.width || (window.KAJISULI_MODE ? 720 : 1280);
        const gameHeight = window.game?.config?.height || (window.KAJISULI_MODE ? 1200 : 800);
        this.clickAtGamePosition(gameWidth / 2, gameHeight / 2);
        setTimeout(() => this.simulateKeyPress('Enter'), 200);
    }

    clickAtGamePosition(gameX, gameY) {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const gameWidth = window.game?.config?.width || (window.KAJISULI_MODE ? 720 : 1280);
        const gameHeight = window.game?.config?.height || (window.KAJISULI_MODE ? 1200 : 800);
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
            <div style="margin-bottom: 15px; color: ${statusColor};">🤖 Enhanced Dual-Mode AI Training</div>
            <div>${message}</div>
            ${this.isTraining ? '<div style="margin-top: 10px; font-size: 12px; color: #aaa;">Enhanced boundary awareness and rational movement...</div>' : ''}
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
                <div><strong>🎬 Enhanced Dual-Mode Imitation</strong></div>
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
                Enhanced boundary awareness - Rational movement training
            </div>
        `;

        document.body.appendChild(ui);

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
            console.log(`🔍 Enhanced dual-mode debug: ${this.debugMode ? 'ON' : 'OFF'}`);
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
            if (this.isMovementModelTrained) {
                const sessions = this.modelTrainingCount || 0;
                movementModelStatus.textContent = sessions > 0 ? `Trained (${sessions}x)` : 'Trained';
                movementModelStatus.style.color = '#44ff44';
            } else {
                movementModelStatus.textContent = 'Not Trained';
                movementModelStatus.style.color = '#888';
            }
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

    async saveMovementModel() {
        if (!this.movementModel) {
            console.log("❌ No movement model to save!");
            return;
        }

        const modelName = prompt("Movement model name:", `enhanced_movement_${Date.now()}`);
        if (!modelName) return;

        try {
            await this.movementModel.save(`localstorage://${modelName}`);
            console.log(`✅ Enhanced movement model saved: ${modelName}`);
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
            console.log(`✅ Enhanced movement model loaded: ${modelName}`);
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
            version: 'enhanced-dual-mode',
            count: this.recordingData.length,
            movementData: separatedData.movement,
            levelUpData: separatedData.levelUp,
            metadata: {
                sessionDuration: this.recordingData.length > 0 ?
                    (this.recordingData[this.recordingData.length - 1].timestamp - this.recordingData[0].timestamp) / 1000 : 0,
                movementExamples: separatedData.movement.length,
                levelUpExamples: separatedData.levelUp.length,
                enhancedBoundaryAwareness: true
            }
        };

        const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `enhanced_dual_mode_session_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`📥 Exported enhanced dual-mode session: ${separatedData.movement.length} movement, ${separatedData.levelUp.length} level-up`);
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
 * ENHANCED DUAL-MODE STATE EXTRACTOR
 * Enhanced boundary awareness and rational game space representation
 */
class DualModeStateExtractor {
    constructor() {
        this.updateResolution();
        this.lastMovementState = null;
        this.lastLevelUpState = null;
    }

    updateResolution() {
        const isKajisuli = window.KAJISULI_MODE ?? false;
        if (isKajisuli) {
            this.gameWidth = 720;
            this.gameHeight = 1200;
        } else {
            this.gameWidth = 1280;
            this.gameHeight = 800;
        }
    }

    initialize(scene) {
        this.scene = scene;

        this.updateResolution();

        if (scene?.game?.config) {
            this.gameWidth = scene.game.config.width;
            this.gameHeight = scene.game.config.height;
        }

        console.log(`🧠 Enhanced state extractor initialized (${this.gameWidth}x${this.gameHeight}, 38 features - rational game space)`);
    }

    getState(mode = 'movement') {
        try {
            this.updateResolution();

            if (mode === 'movement') {
                return this.getMovementState();
            } else if (mode === 'levelup') {
                return this.getLevelUpState();
            }
            return this.getMovementState();
        } catch (error) {
            console.error("State extraction error:", error);
            return mode === 'movement' ? this.lastMovementState : this.lastLevelUpState;
        }
    }

    getMovementState() {
        const gamePlayer = window.player || player;
        if (!gamePlayer) return this.lastMovementState;

        if (window.gameOver ?? gameOver) return this.lastMovementState;

        const state = [
            // Player position and status (6 features)
            gamePlayer.x / this.gameWidth,
            gamePlayer.y / this.gameHeight,
            (window.playerHealth || playerHealth || 100) / (window.maxPlayerHealth || maxPlayerHealth || 100),
            Math.min((window.playerDamage || playerDamage || 10) / 100, 1),
            Math.min((window.playerSpeed || playerSpeed || 8) / 20, 1),
            Math.min((window.elapsedTime || elapsedTime || 0) / 1800, 1),

            // Clear boundary representation (12 features)
            ...this.getClearBoundaryInfo(gamePlayer),

            // Enhanced enemy positioning (16 features) 
            ...this.getEnemyPositionInfo(gamePlayer),

            // Movement context (4 features)
            ...this.getMovementContext(gamePlayer)
        ];

        this.lastMovementState = state;
        return state;
    }

    // Replace the trainMovementModel method with this heavily instrumented version
    async trainMovementModel(movementData) {
        if (!this.tfLoaded) {
            console.error("❌ TensorFlow.js not loaded!");
            return false;
        }

        try {
            console.log(`🏃 Starting enhanced movement model training with ${movementData.length} examples`);

            const states = movementData.map(ex => ex.state);
            const actions = movementData.map(ex => ex.action);
            const oneHotActions = this.actionsToOneHot(actions, 9);

            console.log(`🏃 Enhanced state dimensions: ${states[0].length}, Action examples: ${actions.length}`);

            // HEAVY DIAGNOSTICS: Check model state thoroughly
            console.log("🔍 DIAGNOSTIC: Model existence check:");
            console.log(`  - this.movementModel exists: ${!!this.movementModel}`);
            console.log(`  - this.isMovementModelTrained: ${this.isMovementModelTrained}`);
            console.log(`  - this.modelTrainingCount: ${this.modelTrainingCount || 0}`);

            if (this.movementModel) {
                console.log(`  - Model object type: ${typeof this.movementModel}`);
                console.log(`  - Model has weights: ${!!this.movementModel.weights}`);
                console.log(`  - Model weights length: ${this.movementModel.weights ? this.movementModel.weights.length : 'N/A'}`);
                console.log(`  - Model compiled: ${!!this.movementModel.optimizer}`);

                // Test if model can make predictions (sign that weights exist)
                try {
                    const testInput = tf.tensor2d([[...new Array(states[0].length).fill(0.5)]]);
                    const testPrediction = await this.movementModel.predict(testInput);
                    const testOutput = await testPrediction.data();
                    console.log(`  - Model prediction test: ${testOutput.slice(0, 3).map(x => x.toFixed(3)).join(',')}... (first 3 values)`);
                    testInput.dispose();
                    testPrediction.dispose();
                } catch (e) {
                    console.log(`  - Model prediction test FAILED: ${e.message}`);
                }
            }

            let isNewModel = false;
            let modelCreationReason = "";

            // Determine if we need a new model
            if (!this.movementModel) {
                isNewModel = true;
                modelCreationReason = "movementModel is null/undefined";
            } else if (!this.isMovementModelTrained) {
                isNewModel = true;
                modelCreationReason = "isMovementModelTrained is false";
            } else if (!this.movementModel.weights || this.movementModel.weights.length === 0) {
                isNewModel = true;
                modelCreationReason = "model has no weights";
            } else {
                isNewModel = false;
            }

            if (isNewModel) {
                console.log(`🏃 Creating NEW model because: ${modelCreationReason}`);
                this.movementModel = await this.createMovementModel(states[0].length);
                this.modelTrainingCount = 0;
            } else {
                console.log(`🏃 REUSING existing movement model (previous sessions: ${this.modelTrainingCount || 0})`);
            }

            // CRITICAL: Test the model BEFORE training to get baseline
            const statesTensor = tf.tensor2d(states);
            const actionsTensor = tf.tensor2d(oneHotActions);

            let initialLoss = "N/A";
            let initialAcc = "N/A";

            if (!isNewModel) {
                try {
                    console.log("🔍 Testing model performance BEFORE training...");

                    // Use a small subset for initial testing
                    const testSize = Math.min(32, states.length);
                    const testStates = statesTensor.slice([0, 0], [testSize, -1]);
                    const testActions = actionsTensor.slice([0, 0], [testSize, -1]);

                    const prediction = await this.movementModel.predict(testStates);

                    // Calculate loss manually
                    const loss = await tf.losses.softmaxCrossEntropy(testActions, prediction).data();
                    initialLoss = loss[0].toFixed(4);

                    // Calculate accuracy manually
                    const predictionArgMax = tf.argMax(prediction, 1);
                    const actualArgMax = tf.argMax(testActions, 1);
                    const correct = tf.equal(predictionArgMax, actualArgMax);
                    const accuracy = await tf.mean(tf.cast(correct, 'float32')).data();
                    initialAcc = accuracy[0].toFixed(4);

                    console.log(`🔍 PRE-TRAINING: Loss=${initialLoss}, Acc=${initialAcc}`);

                    // Cleanup test tensors
                    testStates.dispose();
                    testActions.dispose();
                    prediction.dispose();
                    predictionArgMax.dispose();
                    actualArgMax.dispose();
                    correct.dispose();

                } catch (e) {
                    console.log(`🔍 PRE-TRAINING test failed: ${e.message}`);
                }
            }

            // Increment training counter
            this.modelTrainingCount = (this.modelTrainingCount || 0) + 1;

            const epochs = this.calculateOptimalEpochs(movementData.length);
            const batchSize = this.calculateOptimalBatchSize(movementData.length);

            console.log(`🏃 Training session ${this.modelTrainingCount}: ${epochs} epochs, batch ${batchSize}`);
            console.log(`🏃 Expected: ${isNewModel ? 'Loss should start high (new model)' : `Loss should start around ${initialLoss} (continuing training)`}`);

            const history = await this.movementModel.fit(statesTensor, actionsTensor, {
                epochs: epochs,
                batchSize: batchSize,
                validationSplit: 0.15,
                shuffle: true,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        if (epoch === 0) {
                            // Log epoch 0 specifically to see if it matches our expectation
                            console.log(`🏃 EPOCH 0: loss=${logs.loss.toFixed(4)}, acc=${logs.acc.toFixed(4)} ${isNewModel ? '(new model)' : '(should match pre-training)'}`);

                            if (!isNewModel && initialLoss !== "N/A") {
                                const lossDiff = Math.abs(logs.loss - parseFloat(initialLoss));
                                if (lossDiff > 0.1) {
                                    console.log(`⚠️ WARNING: Epoch 0 loss (${logs.loss.toFixed(4)}) differs significantly from pre-training loss (${initialLoss}). This suggests weights were reset!`);
                                } else {
                                    console.log(`✅ Good: Epoch 0 loss matches pre-training loss (diff: ${lossDiff.toFixed(4)})`);
                                }
                            }
                        } else if (epoch % 5 === 0 || epoch === epochs - 1) {
                            console.log(`🏃 Session ${this.modelTrainingCount} Epoch ${epoch}: loss=${logs.loss.toFixed(4)}, acc=${logs.acc.toFixed(4)}`);
                        }
                    }
                }
            });

            // Clean up tensors
            statesTensor.dispose();
            actionsTensor.dispose();

            const finalLoss = history.history.loss[history.history.loss.length - 1];
            const finalAcc = history.history.acc[history.history.acc.length - 1];

            console.log(`✅ Training session ${this.modelTrainingCount} complete!`);
            console.log(`📊 ${isNewModel ? 'New model' : 'Continued training'}: Loss ${initialLoss} → ${finalLoss.toFixed(4)}, Accuracy: ${initialAcc} → ${finalAcc.toFixed(4)}`);

            // Ensure the trained flag is set and persists
            this.isMovementModelTrained = true;

            // VERIFICATION: Test the model again after training to ensure weights persisted
            try {
                const testInput = tf.tensor2d([[...new Array(states[0].length).fill(0.5)]]);
                const testPrediction = await this.movementModel.predict(testInput);
                const testOutput = await testPrediction.data();
                console.log(`🔍 POST-TRAINING: Model can still predict: ${testOutput.slice(0, 3).map(x => x.toFixed(3)).join(',')}...`);
                testInput.dispose();
                testPrediction.dispose();
            } catch (e) {
                console.log(`🔍 POST-TRAINING test FAILED: ${e.message}`);
            }

            // Force UI update
            this.updateUI();

            return true;

        } catch (error) {
            console.error("Enhanced movement model training error:", error);
            // Don't clear the model on error - keep it for next attempt
            return false;
        }
    }

    // Fix 2: Replace boundary info with movement constraints
    getClearBoundaryInfo(player) {
        const normalizedX = player.x / this.gameWidth;
        const normalizedY = player.y / this.gameHeight;

        // Raw distances to each boundary (4 features)
        const leftDist = normalizedX;
        const rightDist = 1 - normalizedX;
        const topDist = normalizedY;
        const bottomDist = 1 - normalizedY;

        // Movement constraints for each direction (8 features)
        const movementConstraints = this.getMovementConstraints(normalizedX, normalizedY);

        return [
            leftDist, rightDist, topDist, bottomDist,  // Basic distances (4)
            ...movementConstraints                      // Movement constraints (8)
        ];
    }

    // New method: Movement constraints instead of dangers
    getMovementConstraints(normalizedX, normalizedY) {
        // For each of 8 movement directions, can we move there?
        // 1.0 = FREE to move this direction
        // 0.0 = BLOCKED (boundary prevents movement)
        // 0.5 = CONSTRAINED (can move a little but will hit boundary soon)

        const directions = [
            { dx: 0, dy: -1, name: 'up' },        // 0: Up
            { dx: 1, dy: -1, name: 'up-right' },  // 1: Up-right  
            { dx: 1, dy: 0, name: 'right' },      // 2: Right
            { dx: 1, dy: 1, name: 'down-right' }, // 3: Down-right
            { dx: 0, dy: 1, name: 'down' },       // 4: Down
            { dx: -1, dy: 1, name: 'down-left' }, // 5: Down-left
            { dx: -1, dy: 0, name: 'left' },      // 6: Left
            { dx: -1, dy: -1, name: 'up-left' }   // 7: Up-left
        ];

        const blockedThreshold = 0.05;     // Within 5% of boundary = blocked
        const constrainedThreshold = 0.15; // Within 15% of boundary = constrained

        const constraints = [];

        directions.forEach(dir => {
            // Simulate a small move in this direction
            const moveSize = 0.03; // Small test move
            const newX = normalizedX + dir.dx * moveSize;
            const newY = normalizedY + dir.dy * moveSize;

            // Check if this move would be out of bounds
            const wouldBeOutOfBounds = (newX < 0 || newX > 1 || newY < 0 || newY > 1);

            if (wouldBeOutOfBounds) {
                constraints.push(0.0); // BLOCKED - can't move this direction
                return;
            }

            // Check distances from new position to boundaries
            const newLeftDist = newX;
            const newRightDist = 1 - newX;
            const newTopDist = newY;
            const newBottomDist = 1 - newY;

            const minDistAfterMove = Math.min(newLeftDist, newRightDist, newTopDist, newBottomDist);

            if (minDistAfterMove < blockedThreshold) {
                constraints.push(0.0); // BLOCKED - would hit boundary immediately
            } else if (minDistAfterMove < constrainedThreshold) {
                constraints.push(0.5); // CONSTRAINED - can move but will hit boundary soon
            } else {
                constraints.push(1.0); // FREE - plenty of room to move
            }
        });

        return constraints;
    }

    getMovementViability(normalizedX, normalizedY) {
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

        const viability = [];
        const moveStepSize = 0.1;

        directions.forEach(dir => {
            let steps = 0;
            let testX = normalizedX;
            let testY = normalizedY;

            for (let i = 0; i < 5; i++) {
                testX += dir.dx * moveStepSize;
                testY += dir.dy * moveStepSize;

                if (testX < 0.05 || testX > 0.95 || testY < 0.05 || testY > 0.95) {
                    break;
                }
                steps++;
            }

            viability.push(Math.min(steps / 5, 1));
        });

        return viability;
    }

    getEnemyPositionInfo(player) {
        const enemies = this.getActiveEnemies();

        const threatDensity = this.getDirectionalThreatDensity(player, enemies);
        const closestEnemies = this.getClosestEnemiesInfo(player, enemies);
        const safeZones = this.getSafeZoneInfo(player, enemies);

        return [
            ...threatDensity,    // 8 features
            ...closestEnemies,   // 6 features  
            ...safeZones         // 2 features
        ];
    }

    getActiveEnemies() {
        try {
            const enemies = window.EnemySystem?.enemiesGroup?.getChildren() || [];
            return enemies.filter(enemy => enemy?.active && enemy.x !== undefined);
        } catch (e) {
            return [];
        }
    }

    getDirectionalThreatDensity(player, enemies) {
        const directions = [
            { dx: 0, dy: -1 }, { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 },
            { dx: 0, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: 0 }, { dx: -1, dy: -1 }
        ];

        const threats = [];
        const sectorRadius = 150;

        directions.forEach(dir => {
            let threatScore = 0;
            const sectorCenterX = player.x + dir.dx * sectorRadius;
            const sectorCenterY = player.y + dir.dy * sectorRadius;

            enemies.forEach(enemy => {
                const distToEnemy = Math.sqrt(
                    Math.pow(enemy.x - player.x, 2) +
                    Math.pow(enemy.y - player.y, 2)
                );

                if (distToEnemy < sectorRadius * 1.5) {
                    const distToSectorCenter = Math.sqrt(
                        Math.pow(enemy.x - sectorCenterX, 2) +
                        Math.pow(enemy.y - sectorCenterY, 2)
                    );

                    if (distToSectorCenter < sectorRadius) {
                        const threatIntensity = Math.max(0, 1 - distToEnemy / sectorRadius);
                        threatScore += threatIntensity;
                    }
                }
            });

            threats.push(Math.min(threatScore, 1));
        });

        return threats;
    }

    getClosestEnemiesInfo(player, enemies) {
        if (enemies.length === 0) {
            return [1, 0, 1, 0, 1, 0];
        }

        const enemyData = enemies.map(enemy => {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) / Math.PI;

            return { distance, angle };
        });

        enemyData.sort((a, b) => a.distance - b.distance);

        const result = [];
        for (let i = 0; i < 3; i++) {
            if (i < enemyData.length) {
                const enemy = enemyData[i];
                result.push(
                    Math.min(enemy.distance / 300, 1),
                    enemy.angle
                );
            } else {
                result.push(1, 0);
            }
        }

        return result;
    }

    getSafeZoneInfo(player, enemies) {
        const checkDirections = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];

        let safestDirection = 0;
        let maxSafety = -1;
        const checkDistance = 200;

        checkDirections.forEach((dir, index) => {
            const checkX = player.x + dir.dx * checkDistance;
            const checkY = player.y + dir.dy * checkDistance;

            let nearbyEnemies = 0;
            enemies.forEach(enemy => {
                const dist = Math.sqrt(
                    Math.pow(enemy.x - checkX, 2) +
                    Math.pow(enemy.y - checkY, 2)
                );
                if (dist < checkDistance) {
                    nearbyEnemies++;
                }
            });

            const safety = Math.max(0, 1 - nearbyEnemies / 10);
            if (safety > maxSafety) {
                maxSafety = safety;
                safestDirection = index;
            }
        });

        return [
            maxSafety,
            safestDirection / 7
        ];
    }

    getMovementContext(player) {
        const normalizedX = player.x / this.gameWidth;
        const normalizedY = player.y / this.gameHeight;

        const centerDist = Math.sqrt(
            Math.pow(normalizedX - 0.5, 2) +
            Math.pow(normalizedY - 0.5, 2)
        );

        const minBoundaryDist = Math.min(
            normalizedX, 1 - normalizedX,
            normalizedY, 1 - normalizedY
        );

        let nearbyEnemyCount = 0;
        try {
            const enemies = this.getActiveEnemies();
            enemies.forEach(enemy => {
                const dist = Math.sqrt(
                    Math.pow(enemy.x - player.x, 2) +
                    Math.pow(enemy.y - player.y, 2)
                );
                if (dist < 100) {
                    nearbyEnemyCount++;
                }
            });
        } catch (e) { }

        const enemyPressure = Math.min(nearbyEnemyCount / 5, 1);

        const healthRatio = (window.playerHealth || playerHealth || 100) /
            (window.maxPlayerHealth || maxPlayerHealth || 100);

        return [
            Math.min(centerDist / 0.7, 1),
            minBoundaryDist,
            enemyPressure,
            healthRatio
        ];
    }

    getLevelUpState() {
        const state = [
            Math.min((window.playerLevel || playerLevel || 1) / 20, 1),
            (window.playerHealth || playerHealth || 100) / (window.maxPlayerHealth || maxPlayerHealth || 100),
            Math.min((window.playerDamage || playerDamage || 10) / 100, 1),
            Math.min((window.playerSpeed || playerSpeed || 8) / 20, 1),
            Math.min((window.playerLuck || playerLuck || 10) / 50, 1),
            Math.min((window.elapsedTime || elapsedTime || 0) / 1800, 1),
            Math.min((window.score || score || 0) / 1000, 1),
            0, 0, 0
        ];

        this.lastLevelUpState = state;
        return state;
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

console.log("🎬 Enhanced Dual-Mode Imitation Learning System loaded - Rational boundary awareness and movement viability!");