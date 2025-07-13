// imitationLearning.js - Enhanced Behavioral Cloning System for Game AI
// Records human gameplay and trains AI to imitate human decisions
// Version 2.1 - Preserves long sessions, handles level-ups intelligently

/**
 * ENHANCED IMITATION LEARNING SYSTEM - Full session training with smart level-up handling
 */
class ImitationLearningSystem {
    constructor() {
        this.isRecording = false;
        this.recordingData = [];
        this.recordingStartTime = null;
        this.lastRecordTime = 0;
        this.recordingInterval = 150; // Record every 150ms (matching AI decision frequency)

        // State extractor
        this.stateExtractor = null;

        // Behavioral cloning model
        this.imitationModel = null;
        this.isModelTrained = false;
        this.tfLoaded = false;

        // Integration state
        this.isUsingImitationMode = false;
        this.lastDecisionTime = 0;
        this.decisionInterval = 150; // Make decisions every 150ms

        // Training state management
        this.isTraining = false;
        this.trainingQueued = false;
        this.lastGameOverState = false;
        this.sessionRecorded = false;

        // Improved data quality - keep long sessions!
        this.dataQualityThreshold = 100; // Minimum examples needed for training
        this.maxConsecutiveStillActions = 5; // Limit consecutive "stay still" to reduce noise

        // Level-up state management
        this.lastGamePausedState = false;
        this.lastLevelUpState = false;
        this.isInLevelUpMode = false;

        // Simple level-up handling (based on automataCore.js)
        this.levelUpStartTime = null;
        this.levelUpHandled = false;
        this.perkScrollPhase = null;
        this.perksViewed = 0;

        // Training overlay
        this.trainingOverlay = null;

        // Movement control
        this.pressedKeys = new Set();

        // Debug mode
        this.debugMode = false;

        console.log("🎬 Enhanced Imitation Learning System v2.1 - Full sessions with smart level-up handling");
    }

    // Initialize the system with a game scene
    async initialize(scene) {
        this.scene = scene;

        // Load TensorFlow.js if not already loaded
        await this.ensureTensorFlowLoaded();

        // Create comprehensive state extractor
        this.stateExtractor = new ComprehensiveGameStateExtractor();
        this.stateExtractor.initialize(scene);

        // Create UI
        this.createImitationUI();

        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Setup auto-training detection with enhanced logic
        this.setupEnhancedAutoTraining();

        console.log("🎬 Enhanced imitation learning system ready - preserves full sessions");
    }

    // Ensure TensorFlow.js is loaded
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

    // Enhanced auto-training setup with better state management
    setupEnhancedAutoTraining() {
        setInterval(() => {
            this.checkForGameOverEnhanced();
        }, 500); // Check more frequently for better responsiveness
    }

    // Enhanced game over detection with safer variable access
    checkForGameOverEnhanced() {
        const currentGameOverState = window.gameOver ?? (typeof gameOver !== 'undefined' ? gameOver : false);
        const currentPausedState = window.gamePaused ?? (typeof gamePaused !== 'undefined' ? gamePaused : false);
        const currentLevelUpState = window.levelUpInProgress ?? (typeof levelUpInProgress !== 'undefined' ? levelUpInProgress : false);

        // Safer level-up detection
        let hasLevelUpCards = false;
        try {
            const cards = window.levelUpCards;
            hasLevelUpCards = cards && cards.length > 0;
        } catch (e) {
            // levelUpCards not available, skip this check
        }

        const isActuallyInLevelUp = currentLevelUpState || hasLevelUpCards;

        // Game just ended and we have recorded data
        if (currentGameOverState && !this.lastGameOverState && this.sessionRecorded && this.recordingData.length > 0) {
            console.log("🎮 Game over detected - managing training...");

            if (this.isRecording) {
                this.stopRecording();
            }

            // Check if we're already training
            if (this.isTraining) {
                console.log("⚠️ Training already in progress - queuing this session");
                this.trainingQueued = true;
                return;
            }

            // Start training after a brief delay
            setTimeout(() => {
                this.autoTrainOnGameOverEnhanced();
            }, 1000);
        }

        // Update level-up state tracking
        this.isInLevelUpMode = isActuallyInLevelUp;

        // Reset level-up handling when level-up ends
        if (!isActuallyInLevelUp && this.lastLevelUpState) {
            this.levelUpStartTime = null;
            this.levelUpHandled = false;
            this.perkScrollPhase = null;
            this.perksViewed = 0;
        }

        // Update state tracking
        this.lastGameOverState = currentGameOverState;
        this.lastGamePausedState = currentPausedState;
        this.lastLevelUpState = isActuallyInLevelUp;

        // Reset session tracking when game starts again
        if (!currentGameOverState && this.lastGameOverState) {
            this.sessionRecorded = false;
            // If we have queued training, start it now
            if (this.trainingQueued && !this.isTraining) {
                console.log("🎯 Starting queued training session");
                this.trainingQueued = false;
                setTimeout(() => {
                    this.autoTrainOnGameOverEnhanced();
                }, 1000);
            }
        }
    }

    // Enhanced auto-training with full session preservation
    async autoTrainOnGameOverEnhanced() {
        if (this.isTraining) {
            console.log("⚠️ Training already in progress - skipping");
            return;
        }

        if (this.recordingData.length < this.dataQualityThreshold) {
            console.log(`📊 Session too short for training: ${this.recordingData.length} < ${this.dataQualityThreshold}`);
            return;
        }

        console.log("🤖 ENHANCED AUTO-TRAINING: Starting full session training...");
        this.isTraining = true;
        this.showTrainingOverlay("Training on full session...");

        try {
            // Prepare high-quality training data (but keep the full session length!)
            const cleanedData = this.prepareFullSessionData();

            if (cleanedData.length < this.dataQualityThreshold) {
                console.log(`📊 Cleaned data too small: ${cleanedData.length} examples`);
                this.isTraining = false;
                this.showTrainingOverlay("Training skipped - insufficient clean data", 3000);
                return;
            }

            console.log(`📊 Training on ${cleanedData.length} examples from full session (${this.recordingData.length} raw)`);

            const success = await this.trainOnCleanedData(cleanedData);

            if (success) {
                console.log("✅ ENHANCED TRAINING: Model updated successfully!");
                this.showTrainingOverlay("Enhanced training complete! AI learned from your full session.", 3000);

                // Auto-save the model
                await this.saveImitationModel(`full_session_trained_${Date.now()}`);
            } else {
                console.log("❌ ENHANCED TRAINING: Training failed");
                this.showTrainingOverlay("Training failed - data preserved for manual training", 3000);
            }

        } catch (error) {
            console.error("ENHANCED TRAINING ERROR:", error);
            this.showTrainingOverlay("Training error - data preserved", 3000);
        } finally {
            this.isTraining = false;
            // Clear current session data after training
            this.recordingData = [];
            this.currentSessionName = null;
        }
    }

    // NEW: Prepare full session data with smart filtering (no length limits!)
    prepareFullSessionData() {
        console.log(`🧹 Preparing full session data: ${this.recordingData.length} raw examples`);

        let cleanedData = [...this.recordingData];

        // Step 1: Only reduce excessive consecutive "stay still" actions, don't remove level-ups
        cleanedData = this.reduceExcessiveStillActions(cleanedData);

        // Step 2: Light balancing - prevent extreme action bias but keep natural distribution
        cleanedData = this.lightActionBalancing(cleanedData);

        console.log(`🧹 Full session prepared: ${cleanedData.length} examples (preserved ${((cleanedData.length / this.recordingData.length) * 100).toFixed(1)}% of original)`);
        return cleanedData;
    }

    // NEW: Reduce excessive consecutive "stay still" but keep level-up examples
    reduceExcessiveStillActions(data) {
        if (data.length === 0) return data;

        const filtered = [data[0]]; // Always keep first example
        let consecutiveStillCount = data[0].action === 0 ? 1 : 0;

        for (let i = 1; i < data.length; i++) {
            const current = data[i];
            const previous = data[i - 1];

            if (current.action === 0 && previous.action === 0) {
                consecutiveStillCount++;
                // Allow more still actions during level-ups, fewer during normal gameplay
                const maxConsecutive = this.isLikelyLevelUpPeriod(data, i) ? 10 : this.maxConsecutiveStillActions;

                // Keep every nth consecutive "stay still" action
                if (consecutiveStillCount <= maxConsecutive || consecutiveStillCount % 3 === 0) {
                    filtered.push(current);
                }
            } else {
                consecutiveStillCount = current.action === 0 ? 1 : 0;
                filtered.push(current);
            }
        }

        console.log(`📊 Reduced excessive still actions: ${data.length} → ${filtered.length}`);
        return filtered;
    }

    // NEW: Detect if we're likely in a level-up period based on context
    isLikelyLevelUpPeriod(data, index) {
        // Look at a window around this index to see if we're in a period of mostly staying still
        const windowSize = 10;
        const start = Math.max(0, index - windowSize);
        const end = Math.min(data.length, index + windowSize);

        let stillCount = 0;
        for (let i = start; i < end; i++) {
            if (data[i].action === 0) stillCount++;
        }

        // If most actions in this window are "stay still", likely a level-up period
        return stillCount / (end - start) > 0.8;
    }

    // NEW: Light action balancing - prevent extreme bias but keep natural distribution
    lightActionBalancing(data) {
        // Count actions
        const actionCounts = {};
        data.forEach(example => {
            actionCounts[example.action] = (actionCounts[example.action] || 0) + 1;
        });

        console.log(`📊 Action distribution before balancing:`, actionCounts);

        // More aggressive balancing - if any action >40% of total, balance it
        const totalActions = data.length;
        const maxAllowedPercent = 0.4; // 40% max for any single action
        const maxAllowed = Math.floor(totalActions * maxAllowedPercent);

        // Find overrepresented actions
        const overrepresentedActions = Object.keys(actionCounts).filter(action =>
            actionCounts[action] > maxAllowed
        );

        if (overrepresentedActions.length === 0) {
            console.log(`📊 Action distribution is reasonable, keeping all ${data.length} examples`);
            return data;
        }

        // Balance overrepresented actions
        const actionBuckets = {};
        data.forEach(example => {
            if (!actionBuckets[example.action]) {
                actionBuckets[example.action] = [];
            }
            actionBuckets[example.action].push(example);
        });

        const balanced = [];
        for (const [action, examples] of Object.entries(actionBuckets)) {
            if (overrepresentedActions.includes(action)) {
                // Randomly sample from overrepresented action
                const sampled = this.randomSample(examples, maxAllowed);
                balanced.push(...sampled);
                console.log(`📊 Balanced action ${action}: ${examples.length} → ${sampled.length}`);
            } else {
                balanced.push(...examples);
            }
        }

        // Count again for logging
        const balancedCounts = {};
        balanced.forEach(example => {
            balancedCounts[example.action] = (balancedCounts[example.action] || 0) + 1;
        });

        console.log(`📊 Action distribution after balancing:`, balancedCounts);
        return balanced;
    }

    // Random sampling helper
    randomSample(array, size) {
        if (array.length <= size) return array;

        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled.slice(0, size);
    }

    // Train on cleaned data with improved training parameters
    async trainOnCleanedData(cleanedData) {
        if (!this.tfLoaded) {
            console.error("❌ TensorFlow.js not loaded!");
            return false;
        }

        console.log(`🧠 Training on cleaned data: ${cleanedData.length} examples`);

        try {
            const states = cleanedData.map(ex => ex.state);
            const actions = cleanedData.map(ex => ex.action);
            const oneHotActions = this.actionsToOneHot(actions);

            if (!this.imitationModel) {
                this.imitationModel = await this.createBehavioralCloningModel(states[0].length);
            }

            const statesTensor = tf.tensor2d(states);
            const actionsTensor = tf.tensor2d(oneHotActions);

            // Adaptive training parameters based on data size
            const epochs = this.calculateOptimalEpochs(cleanedData.length);
            const batchSize = this.calculateOptimalBatchSize(cleanedData.length);

            console.log(`🔧 Training with ${epochs} epochs, batch size ${batchSize}`);

            // Add early stopping to prevent overfitting
            const earlyStopping = tf.callbacks.earlyStopping({
                monitor: 'val_loss',
                patience: 8, // Stop if validation loss doesn't improve for 8 epochs
                restoreBestWeights: true
            });

            const history = await this.imitationModel.fit(statesTensor, actionsTensor, {
                epochs: epochs,
                batchSize: batchSize,
                validationSplit: 0.15, // Smaller validation split for large datasets
                shuffle: true,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        if (epoch % 5 === 0 || epoch === epochs - 1) {
                            console.log(`🔄 Epoch ${epoch}: loss=${logs.loss.toFixed(4)}, accuracy=${logs.acc.toFixed(4)}, val_loss=${logs.val_loss?.toFixed(4) || 'N/A'}`);
                        }
                    },
                    // Add early stopping
                    earlyStopping
                }
            });

            statesTensor.dispose();
            actionsTensor.dispose();

            const finalLoss = history.history.loss[history.history.loss.length - 1];
            const finalAcc = history.history.acc[history.history.acc.length - 1];
            const finalValLoss = history.history.val_loss ? history.history.val_loss[history.history.val_loss.length - 1] : null;

            console.log(`✅ Full session training complete! Final - Loss: ${finalLoss.toFixed(4)}, Accuracy: ${finalAcc.toFixed(4)}, Val Loss: ${finalValLoss?.toFixed(4) || 'N/A'}`);

            // Analyze final action distribution to debug behavior
            if (this.debugMode) {
                console.log("🔍 Analyzing trained model behavior...");
                const testPredictions = await this.imitationModel.predict(statesTensor.slice([0, 0], [Math.min(100, statesTensor.shape[0]), -1]));
                const predData = await testPredictions.data();
                const actionCounts = {};

                for (let i = 0; i < Math.min(100, statesTensor.shape[0]); i++) {
                    const startIdx = i * 9;
                    const actionProbs = predData.slice(startIdx, startIdx + 9);
                    const predictedAction = actionProbs.indexOf(Math.max(...actionProbs));
                    actionCounts[predictedAction] = (actionCounts[predictedAction] || 0) + 1;
                }

                console.log("🔍 Model prediction distribution on sample:", actionCounts);
                testPredictions.dispose();
            }

            // Check for overfitting but be more lenient with large datasets
            if (finalValLoss && finalValLoss > finalLoss * 3) {
                console.log("⚠️ Possible overfitting detected - validation loss significantly higher than training loss");
            } else if (finalLoss > 0.5) {
                console.log("⚠️ High training loss detected - model may need more training or better data quality");
            }

            this.isModelTrained = true;
            this.updateUI();

            return true;

        } catch (error) {
            console.error("Enhanced training error:", error);
            return false;
        }
    }

    // NEW: Calculate optimal epochs based on dataset size
    calculateOptimalEpochs(dataSize) {
        if (dataSize < 500) return 60;
        if (dataSize < 2000) return 50;
        if (dataSize < 5000) return 40;
        if (dataSize < 10000) return 35;
        return 30; // More epochs for large datasets to learn complex patterns
    }

    // NEW: Calculate optimal batch size based on dataset size
    calculateOptimalBatchSize(dataSize) {
        const batchSize = Math.min(64, Math.max(16, Math.floor(dataSize / 50)));
        return batchSize;
    }

    // Smart recording that handles level-ups appropriately
    recordFrame() {
        if (!this.isRecording || !this.scene) return;

        const now = Date.now();
        if (now - this.lastRecordTime < this.recordingInterval) return;

        // Check game states - improved level-up detection with safer access
        const isPaused = window.gamePaused ?? (typeof gamePaused !== 'undefined' ? gamePaused : false);
        const isLevelUp = window.levelUpInProgress ?? (typeof levelUpInProgress !== 'undefined' ? levelUpInProgress : false);
        const isGameOver = window.gameOver ?? (typeof gameOver !== 'undefined' ? gameOver : false);

        // Safer level-up detection
        let hasLevelUpCards = false;
        let hasLevelUpUI = false;

        try {
            const cards = window.levelUpCards;
            hasLevelUpCards = cards && cards.length > 0;
        } catch (e) {
            // levelUpCards not available
        }

        try {
            // Quick DOM check for level-up UI
            const hasLevelUpText = document.body.textContent.includes('LEVEL UP') ||
                document.body.textContent.includes('CHOOSE A PERK');
            hasLevelUpUI = hasLevelUpText;
        } catch (e) {
            // DOM scanning failed
        }

        const isActuallyInLevelUp = isLevelUp || hasLevelUpCards || hasLevelUpUI;

        // Skip recording only during game over
        if (isGameOver) {
            if (this.debugMode) {
                console.log("⏸️ Skipping recording during game over");
            }
            return;
        }

        try {
            const state = this.stateExtractor.getState();
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
                isLevelUp: isActuallyInLevelUp // Use the safer detection
            };

            this.recordingData.push(example);
            this.lastRecordTime = now;

            if (this.recordingData.length % 200 === 0) {
                const movementExamples = this.recordingData.filter(e => e.action !== 0).length;
                const levelUpExamples = this.recordingData.filter(e => e.isLevelUp).length;
                console.log(`📊 Recorded ${this.recordingData.length} examples (${movementExamples} movement, ${levelUpExamples} level-up)`);

                // Debug: show action distribution every 1000 examples
                if (this.recordingData.length % 1000 === 0 && this.debugMode) {
                    const actionCounts = {};
                    this.recordingData.slice(-1000).forEach(ex => { // Only check last 1000 to avoid performance issues
                        actionCounts[ex.action] = (actionCounts[ex.action] || 0) + 1;
                    });
                    console.log("🔍 Recent 1000 action distribution:", actionCounts);
                }
            }

        } catch (error) {
            console.error("Recording error:", error);
        }
    }

    // Use imitation model for movement decisions
    async chooseImitationAction(state) {
        if (!this.imitationModel || !this.isModelTrained) {
            return 0;
        }

        try {
            const stateTensor = tf.tensor2d([state]);
            const prediction = await this.imitationModel.predict(stateTensor);
            const probabilities = await prediction.data();

            const action = this.sampleFromProbabilities(probabilities);

            if (this.debugMode) {
                const actionNames = ['Stay', 'Up', 'Up-Right', 'Right', 'Down-Right', 'Down', 'Down-Left', 'Left', 'Up-Left'];
                console.log(`🎭 IMITATION: Action ${action} (${actionNames[action]}) - Confidence: ${(probabilities[action] * 100).toFixed(1)}%`);
            }

            stateTensor.dispose();
            prediction.dispose();

            return action;
        } catch (error) {
            console.error("Imitation action error:", error);
            return 0;
        }
    }

    // Control player movement when in imitation mode
    async controlMovement() {
        if (!this.isUsingImitationMode || !this.isModelTrained) return;

        // Handle level-ups with simple browsing then selection
        if (this.isInLevelUpMode) {
            this.handleSimpleLevelUp();
            return;
        }

        const now = Date.now();
        if (now - this.lastDecisionTime < this.decisionInterval) return;

        const state = this.stateExtractor?.getState();
        if (!state) return;

        const action = await this.chooseImitationAction(state);
        this.executeAction(action);

        this.lastDecisionTime = now;
    }

    // Simple level-up handling (based on automataCore.js approach)
    handleSimpleLevelUp() {
        if (!this.levelUpStartTime) {
            this.levelUpStartTime = Date.now();
            this.levelUpHandled = false;
            this.perkScrollPhase = 'browsing';
            this.perksViewed = 0;
            console.log("🎭 Imitation AI: Level up started - browsing perks");
        }

        if (this.levelUpHandled) return;

        const elapsed = Date.now() - this.levelUpStartTime;
        if (elapsed < 1000) return; // Wait 1 second before starting

        if (this.perkScrollPhase === 'browsing') {
            if (this.perksViewed < 4) {
                this.navigateToNextPerk();
                this.perksViewed++;
                return;
            } else {
                console.log("🎭 Imitation AI: Finished browsing, selecting random perk");
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
                console.log("🎭 Imitation AI: Random perk selected");
            } else if (elapsed > 15000) {
                console.log("🎭 Imitation AI: Perk selection timeout");
                this.emergencyLevelUpExit();
                this.levelUpHandled = true;
                this.levelUpStartTime = null;
                this.perkScrollPhase = null;
            }
        }
    }

    // Navigate to next perk (click right arrow)
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

    // Select random perk (click center)
    selectRandomPerk() {
        const gameWidth = window.game?.config?.width || 1200;
        const gameHeight = window.game?.config?.height || 800;
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;

        this.clickAtGamePosition(centerX, centerY);
        return true;
    }

    // Emergency exit if stuck
    emergencyLevelUpExit() {
        const gameWidth = window.game?.config?.width || 1200;
        const gameHeight = window.game?.config?.height || 800;
        this.clickAtGamePosition(gameWidth / 2, gameHeight / 2);
        setTimeout(() => this.simulateKeyPress('Enter'), 200);
    }

    // Click at specific game position (from automataCore.js)
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

    // Simulate key press (from automataCore.js)
    simulateKeyPress(key) {
        const downEvent = new KeyboardEvent('keydown', { key, bubbles: true });
        const upEvent = new KeyboardEvent('keyup', { key, bubbles: true });
        document.dispatchEvent(downEvent);
        setTimeout(() => document.dispatchEvent(upEvent), 100);
    }

    // Show training progress overlay with enhanced messaging
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
            <div style="margin-bottom: 15px; color: ${statusColor};">🤖 Enhanced AI Training</div>
            <div>${message}</div>
            ${this.isTraining ? '<div style="margin-top: 10px; font-size: 12px; color: #aaa;">Training on full session data...</div>' : ''}
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

    // Start recording human gameplay
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

        const defaultName = `full_session_${Date.now()}`;
        sessionName = sessionName || defaultName;

        this.isRecording = true;
        this.recordingData = [];
        this.recordingStartTime = Date.now();
        this.lastRecordTime = 0;
        this.currentSessionName = sessionName;
        this.sessionRecorded = true;

        console.log(`🔴 FULL SESSION RECORDING STARTED: ${sessionName}`);
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
            const movementExamples = this.recordingData.filter(e => e.action !== 0).length;
            const levelUpExamples = this.recordingData.filter(e => e.isLevelUp).length;
            console.log(`⏹️ FULL SESSION RECORDING STOPPED: ${this.currentSessionName}`);
            console.log(`📊 Captured ${this.recordingData.length} examples (${movementExamples} movement, ${levelUpExamples} level-up) over ${duration.toFixed(1)}s`);
        }

        this.updateUI();
    }

    // Get the current human action from input state
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

        // Convert to action index
        if (vx === 0 && vy === 0) return 0;      // Stay
        if (vx === 0 && vy === -1) return 1;     // Up
        if (vx === 1 && vy === -1) return 2;     // Up-right
        if (vx === 1 && vy === 0) return 3;      // Right
        if (vx === 1 && vy === 1) return 4;      // Down-right
        if (vx === 0 && vy === 1) return 5;      // Down
        if (vx === -1 && vy === 1) return 6;     // Down-left
        if (vx === -1 && vy === 0) return 7;     // Left
        if (vx === -1 && vy === -1) return 8;    // Up-left

        return 0;
    }

    // Train on current session data with enhanced error handling
    async trainOnCurrentSession() {
        if (this.isTraining) {
            console.log("⚠️ Training already in progress!");
            this.showTrainingOverlay("Training already in progress", 2000);
            return false;
        }

        if (!this.tfLoaded) {
            console.error("❌ TensorFlow.js not loaded!");
            return false;
        }

        if (this.recordingData.length < this.dataQualityThreshold) {
            console.error(`❌ Not enough training data! Need at least ${this.dataQualityThreshold} examples, got ${this.recordingData.length}.`);
            this.showTrainingOverlay(`Need at least ${this.dataQualityThreshold} examples for training`, 3000);
            return false;
        }

        console.log(`🧠 Manual training on current session: ${this.recordingData.length} examples`);
        this.isTraining = true;
        this.showTrainingOverlay("Manual training in progress...");

        try {
            // Use the same enhanced data preparation
            const cleanedData = this.prepareFullSessionData();
            const success = await this.trainOnCleanedData(cleanedData);

            if (success) {
                this.showTrainingOverlay("Manual training complete!", 2000);
            } else {
                this.showTrainingOverlay("Manual training failed!", 2000);
            }

            return success;

        } catch (error) {
            console.error("Manual training error:", error);
            this.showTrainingOverlay("Manual training error!", 2000);
            return false;
        } finally {
            this.isTraining = false;
        }
    }

    // Create behavioral cloning neural network with improved architecture
    async createBehavioralCloningModel(stateSize) {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [stateSize],
                    units: 256, // Increased capacity for complex patterns
                    activation: 'relu',
                    kernelRegularizer: tf.regularizers.l2({ l2: 0.0001 }) // Reduced regularization
                }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({
                    units: 128,
                    activation: 'relu',
                    kernelRegularizer: tf.regularizers.l2({ l2: 0.0001 })
                }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({
                    units: 64, // Additional layer for better pattern learning
                    activation: 'relu',
                    kernelRegularizer: tf.regularizers.l2({ l2: 0.0001 })
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({
                    units: 9,
                    activation: 'softmax'
                })
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.001), // Slightly higher learning rate
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        return model;
    }

    // Convert action indices to one-hot encoding
    actionsToOneHot(actions) {
        const oneHot = [];
        actions.forEach(action => {
            const vector = new Array(9).fill(0);
            vector[action] = 1;
            oneHot.push(vector);
        });
        return oneHot;
    }

    // Sample action from probability distribution
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

    // Enable/disable imitation mode
    toggleImitationMode() {
        if (this.isTraining) {
            console.log("⚠️ Cannot toggle imitation mode while training is in progress");
            this.showTrainingOverlay("Cannot toggle mode - training in progress", 2000);
            return;
        }

        this.isUsingImitationMode = !this.isUsingImitationMode;

        if (this.isUsingImitationMode && !this.isModelTrained) {
            console.log("⚠️ No trained model available!");
            this.isUsingImitationMode = false;
            return;
        }

        if (this.isUsingImitationMode) {
            // Disable the reinforcement learning AI if it's active
            if (window.gameAI?.aiActive) {
                console.log("🔄 Disabling reinforcement learning AI");
                window.gameAI.aiActive = false;
                window.gameAI.releaseAllMovementKeys();
            }
            console.log("🎭 Enhanced imitation mode: ON (with level-up integration)");
        } else {
            console.log("🎭 Enhanced imitation mode: OFF");
            this.releaseAllMovementKeys();
        }

        this.updateUI();
    }

    // Execute movement action
    executeAction(actionIndex) {
        const actionMap = [
            { keys: [] },                    // 0: Stay
            { keys: ['up'] },               // 1: Up
            { keys: ['up', 'right'] },      // 2: Up-right
            { keys: ['right'] },            // 3: Right
            { keys: ['down', 'right'] },    // 4: Down-right
            { keys: ['down'] },             // 5: Down
            { keys: ['down', 'left'] },     // 6: Down-left
            { keys: ['left'] },             // 7: Left
            { keys: ['up', 'left'] }        // 8: Up-left
        ];

        const action = actionMap[actionIndex];
        if (action) {
            this.releaseAllMovementKeys();
            if (action.keys.length > 0) {
                this.pressMovementKeys(action.keys);
            }
        }
    }

    // Press movement keys
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

    // Release all movement keys
    releaseAllMovementKeys() {
        this.pressedKeys.forEach(key => {
            if (key) {
                key.isDown = false;
                key.isUp = true;
            }
        });
        this.pressedKeys.clear();
    }

    // Save trained model with storage quota handling
    async saveImitationModel(name = null) {
        if (!this.imitationModel) {
            console.log("❌ No model to save!");
            return;
        }

        const modelName = name || `full_session_imitation_model_${Date.now()}`;

        try {
            await this.imitationModel.save(`localstorage://${modelName}`);
            console.log(`✅ Full session imitation model saved: ${modelName}`);
        } catch (error) {
            if (error.message.includes('quota') || error.message.includes('storage')) {
                console.log(`⚠️ Storage quota exceeded, model too large for localStorage: ${modelName}`);
                console.log(`💡 Model trained successfully but not saved. Consider using a smaller model or external storage.`);

                // Try to save just the training metadata
                try {
                    const metadata = {
                        timestamp: Date.now(),
                        modelName: modelName,
                        trained: true,
                        note: 'Model too large for localStorage but training completed'
                    };
                    localStorage.setItem(`${modelName}_metadata`, JSON.stringify(metadata));
                    console.log(`📝 Saved training metadata for: ${modelName}`);
                } catch (metaError) {
                    console.log("Could not save even metadata due to storage limits");
                }
            } else {
                console.error("Save failed:", error);
            }
        }
    }

    // Load trained model
    async loadImitationModel(name = null) {
        if (this.isTraining) {
            console.log("⚠️ Cannot load model while training is in progress");
            return;
        }

        const modelName = name || prompt("Model name to load:");
        if (!modelName) return;

        try {
            this.imitationModel = await tf.loadLayersModel(`localstorage://${modelName}`);
            this.isModelTrained = true;
            console.log(`✅ Full session imitation model loaded: ${modelName}`);
            this.updateUI();
        } catch (error) {
            console.error("Load failed:", error);
        }
    }

    // Import training data from JSON file
    importTrainingData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    console.log(`📥 Importing training data from ${file.name}`);

                    // Handle different data formats
                    let examples = [];
                    if (data.states && data.actions) {
                        // Compressed format
                        for (let i = 0; i < data.states.length; i++) {
                            examples.push({
                                state: data.states[i],
                                action: data.actions[i]
                            });
                        }
                    } else if (data.examples) {
                        // Standard format
                        examples = data.examples.map(ex => ({
                            state: ex.s || ex.state,
                            action: ex.a || ex.action
                        }));
                    }

                    if (examples.length > 0) {
                        this.importedData = examples;
                        console.log(`✅ Imported ${examples.length} training examples`);
                        this.updateUI();
                    } else {
                        console.log("❌ No valid training data found in file");
                    }

                } catch (error) {
                    console.error("Failed to parse JSON file:", error);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    // Train on imported data
    async trainOnImportedData() {
        if (this.isTraining) {
            console.log("⚠️ Training already in progress!");
            return false;
        }

        if (!this.importedData || this.importedData.length < this.dataQualityThreshold) {
            console.log("❌ No imported data or not enough examples");
            return false;
        }

        console.log(`🧠 Training on imported data: ${this.importedData.length} examples`);
        this.isTraining = true;
        this.showTrainingOverlay("Training on imported data...");

        try {
            const states = this.importedData.map(ex => ex.state);
            const actions = this.importedData.map(ex => ex.action);
            const oneHotActions = this.actionsToOneHot(actions);

            if (!this.imitationModel) {
                this.imitationModel = await this.createBehavioralCloningModel(states[0].length);
            }

            const statesTensor = tf.tensor2d(states);
            const actionsTensor = tf.tensor2d(oneHotActions);

            const epochs = this.calculateOptimalEpochs(this.importedData.length);
            const batchSize = this.calculateOptimalBatchSize(this.importedData.length);

            const history = await this.imitationModel.fit(statesTensor, actionsTensor, {
                epochs: epochs,
                batchSize: batchSize,
                validationSplit: 0.2,
                shuffle: true,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        if (epoch % 10 === 0) {
                            console.log(`🔄 Epoch ${epoch}: loss=${logs.loss.toFixed(4)}, accuracy=${logs.acc.toFixed(4)}`);
                        }
                    }
                }
            });

            statesTensor.dispose();
            actionsTensor.dispose();

            const finalLoss = history.history.loss[history.history.loss.length - 1];
            const finalAcc = history.history.acc[history.history.acc.length - 1];

            console.log(`✅ Training complete! Final loss: ${finalLoss.toFixed(4)}, accuracy: ${finalAcc.toFixed(4)}`);

            this.isModelTrained = true;
            this.showTrainingOverlay("Training complete!", 2000);
            this.updateUI();

            return true;

        } catch (error) {
            console.error("Training error:", error);
            this.showTrainingOverlay("Training failed!", 2000);
            return false;
        } finally {
            this.isTraining = false;
        }
    }

    // Export current session data
    exportCurrentSession() {
        if (this.recordingData.length === 0) {
            console.log("❌ No current session data to export");
            return;
        }

        const compressed = {
            version: 4, // Full session version
            count: this.recordingData.length,
            states: this.recordingData.map(ex => ex.state),
            actions: this.recordingData.map(ex => ex.action),
            metadata: {
                sessionDuration: this.recordingData.length > 0 ?
                    (this.recordingData[this.recordingData.length - 1].timestamp - this.recordingData[0].timestamp) / 1000 : 0,
                movementExamples: this.recordingData.filter(ex => ex.action !== 0).length,
                levelUpExamples: this.recordingData.filter(ex => ex.isLevelUp).length,
                fullSession: true
            }
        };

        const blob = new Blob([JSON.stringify(compressed)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `full_session_imitation_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`📥 Exported ${this.recordingData.length} full session examples`);
    }

    // Create UI for imitation learning controls with full session focus
    createImitationUI() {
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
            min-width: 260px;
        `;

        ui.innerHTML = `
            <div style="margin-bottom: 10px;">
                <div><strong>🎬 Full Session Imitation</strong></div>
                <div>Recording: <span id="recording-status">Off</span></div>
                <div>Training: <span id="training-status">Ready</span></div>
                <div>Model: <span id="model-status">Not Trained</span></div>
                <div>Mode: <span id="imitation-mode">Human Control</span></div>
                <div>Current: <span id="current-examples">0</span> examples</div>
                <div>Imported: <span id="imported-examples">0</span> examples</div>
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
                    <button id="import-data" style="flex: 1; padding: 6px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Import JSON
                    </button>
                    <button id="train-imported" style="flex: 1; padding: 6px; background: #FF5722; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Train JSON
                    </button>
                </div>
                
                <div style="display: flex; gap: 3px;">
                    <button id="export-session" style="flex: 1; padding: 6px; background: #607D8B; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Export
                    </button>
                    <button id="toggle-debug" style="flex: 1; padding: 6px; background: #795548; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Debug
                    </button>
                </div>
                
                <div style="display: flex; gap: 3px;">
                    <button id="save-model" style="flex: 1; padding: 6px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Save Model
                    </button>
                    <button id="load-model" style="flex: 1; padding: 6px; background: #E91E63; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Load Model
                    </button>
                </div>
            </div>
            
            <div style="margin-top: 8px; font-size: 10px; color: #aaa;">
                v2.1: Full session training, improved architecture, better action balancing
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
        document.getElementById('import-data').onclick = () => this.importTrainingData();
        document.getElementById('train-imported').onclick = () => this.trainOnImportedData();
        document.getElementById('export-session').onclick = () => this.exportCurrentSession();
        document.getElementById('toggle-debug').onclick = () => {
            this.debugMode = !this.debugMode;
            console.log(`🔍 Full session debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
        };
        document.getElementById('save-model').onclick = () => this.saveImitationModel();
        document.getElementById('load-model').onclick = () => this.loadImitationModel();
    }

    // Update UI display with enhanced training status
    updateUI() {
        const recordingStatus = document.getElementById('recording-status');
        const trainingStatus = document.getElementById('training-status');
        const modelStatus = document.getElementById('model-status');
        const imitationMode = document.getElementById('imitation-mode');
        const currentExamples = document.getElementById('current-examples');
        const importedExamples = document.getElementById('imported-examples');
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

        if (modelStatus) {
            modelStatus.textContent = this.isModelTrained ? 'Trained' : 'Not Trained';
            modelStatus.style.color = this.isModelTrained ? '#44ff44' : '#888';
        }

        if (imitationMode) {
            if (this.isUsingImitationMode) {
                if (this.isInLevelUpMode) {
                    const phase = this.perkScrollPhase === 'browsing' ?
                        `Browsing ${this.perksViewed}/4` :
                        this.perkScrollPhase === 'selecting' ? 'Selecting' : 'Level-up';
                    imitationMode.textContent = `AI Level-up (${phase})`;
                } else {
                    imitationMode.textContent = 'AI Imitating';
                }
                imitationMode.style.color = '#9C27B0';
            } else {
                imitationMode.textContent = 'Human Control';
                imitationMode.style.color = '#44ff44';
            }
        }

        if (currentExamples) {
            const movementCount = this.recordingData.filter(e => e.action !== 0).length;
            const levelUpCount = this.recordingData.filter(e => e.isLevelUp).length;
            currentExamples.textContent = `${this.recordingData.length} (${movementCount}M, ${levelUpCount}L)`;
        }

        if (importedExamples) {
            importedExamples.textContent = (this.importedData?.length || 0).toString();
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

    // Setup keyboard shortcuts
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

    // Update method to be called from main game loop
    update() {
        this.recordFrame();
        this.controlMovement();
        this.updateUI();
    }

    // Clean up resources
    cleanup() {
        if (this.imitationModel) {
            this.imitationModel.dispose();
            this.imitationModel = null;
        }

        if (this.trainingOverlay) {
            this.trainingOverlay.remove();
            this.trainingOverlay = null;
        }

        this.releaseAllMovementKeys();

        const ui = document.getElementById('imitation-interface');
        if (ui) ui.remove();

        // Reset training state
        this.isTraining = false;
        this.trainingQueued = false;
    }
}

/**
 * COMPREHENSIVE GAME STATE EXTRACTOR - Same as before 
 */
class ComprehensiveGameStateExtractor {
    constructor() {
        this.gameWidth = 1200;
        this.gameHeight = 800;
        this.lastState = null;
        this.maxEnemyTracking = 10;
        this.maxBeaconDistance = 300;
        this.maxEnemyDistance = 400;
    }

    initialize(scene) {
        this.scene = scene;
        if (scene?.game?.config) {
            this.gameWidth = scene.game.config.width;
            this.gameHeight = scene.game.config.height;
        }
        console.log("🧠 Full session state extractor initialized (60 features)");
    }

    getState() {
        try {
            const gamePlayer = window.player || player;
            if (!gamePlayer) return this.lastState;

            if (window.gameOver ?? gameOver) return this.lastState;

            const state = [
                ...this.getPlayerState(gamePlayer),    // 12 features
                ...this.getEnemyState(gamePlayer),     // 40 features
                ...this.getBoundaryState(gamePlayer),  // 4 features
                ...this.getBeaconState(gamePlayer)     // 4 features
            ];

            this.lastState = state;
            return state;

        } catch (error) {
            console.error("Full session state extraction error:", error);
            return this.lastState;
        }
    }

    getPlayerState(player) {
        let currentDirection = 0;
        const inputSystem = window.InputSystem;
        if (inputSystem?.keyboard?.cursors && inputSystem?.keyboard?.wasdKeys) {
            const cursors = inputSystem.keyboard.cursors;
            const wasd = inputSystem.keyboard.wasdKeys;

            let vx = 0, vy = 0;
            if (cursors.left.isDown || wasd.left.isDown) vx = -1;
            if (cursors.right.isDown || wasd.right.isDown) vx = 1;
            if (cursors.up.isDown || wasd.up.isDown) vy = -1;
            if (cursors.down.isDown || wasd.down.isDown) vy = 1;

            if (vx === 0 && vy === 0) currentDirection = 0;
            else if (vx === 0 && vy === -1) currentDirection = 1;
            else if (vx === 1 && vy === -1) currentDirection = 2;
            else if (vx === 1 && vy === 0) currentDirection = 3;
            else if (vx === 1 && vy === 1) currentDirection = 4;
            else if (vx === 0 && vy === 1) currentDirection = 5;
            else if (vx === -1 && vy === 1) currentDirection = 6;
            else if (vx === -1 && vy === 0) currentDirection = 7;
            else if (vx === -1 && vy === -1) currentDirection = 8;
        }

        return [
            player.x / this.gameWidth,
            player.y / this.gameHeight,
            (window.playerHealth || playerHealth || 100) / (window.maxPlayerHealth || maxPlayerHealth || 100),
            Math.min((window.playerDamage || playerDamage || 10) / 100, 1),
            Math.min((window.playerSpeed || playerSpeed || 8) / 20, 1),
            Math.min((window.playerLuck || playerLuck || 10) / 50, 1),
            Math.min((window.playerFireRate || playerFireRate || 10) / 50, 1),
            Math.min((window.elapsedTime || elapsedTime || 0) / 1800, 1),
            Math.min((window.score || score || 0) / 1000, 1),
            currentDirection / 8,
            0, // Stuck status placeholder
            Math.min((window.playerLevel || playerLevel || 1) / 20, 1)
        ];
    }

    getEnemyState(player) {
        const enemies = [];

        try {
            const allEnemies = window.EnemySystem?.enemiesGroup?.getChildren() || [];
            const nearbyEnemies = [];

            for (const enemy of allEnemies) {
                if (enemy?.active && enemy.x !== undefined) {
                    const dx = enemy.x - player.x;
                    const dy = enemy.y - player.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance <= this.maxEnemyDistance) {
                        nearbyEnemies.push({
                            distance: distance,
                            angle: Math.atan2(dy, dx) / Math.PI,
                            enemy: enemy
                        });
                    }
                }
            }

            nearbyEnemies.sort((a, b) => a.distance - b.distance);
            const closestEnemies = nearbyEnemies.slice(0, this.maxEnemyTracking);

            for (let i = 0; i < this.maxEnemyTracking; i++) {
                if (i < closestEnemies.length) {
                    const enemyData = closestEnemies[i];
                    const enemy = enemyData.enemy;

                    enemies.push(
                        enemyData.distance / this.maxEnemyDistance,
                        enemyData.angle,
                        this.getEnemyTypeEncoding(enemy),
                        this.getEnemyThreatLevel(enemy)
                    );
                } else {
                    enemies.push(1, 0, 0, 0);
                }
            }

        } catch (error) {
            for (let i = 0; i < this.maxEnemyTracking * 4; i++) {
                enemies.push(i % 4 === 0 ? 1 : 0);
            }
        }

        return enemies;
    }

    getBoundaryState(player) {
        const normalizedX = player.x / this.gameWidth;
        const normalizedY = player.y / this.gameHeight;

        return [
            normalizedX,
            1 - normalizedX,
            normalizedY,
            1 - normalizedY
        ];
    }

    getBeaconState(player) {
        return [1, 0, 0, 0]; // Placeholder for beacon detection
    }

    getEnemyTypeEncoding(enemy) {
        try {
            const rank = enemy.rank || 1;
            return Math.min(rank / 6, 1);
        } catch (error) {
            return 0.5;
        }
    }

    getEnemyThreatLevel(enemy) {
        try {
            let threat = 0.5;

            if (enemy.rank) {
                threat += (enemy.rank - 1) * 0.1;
            }

            if (enemy.health) {
                threat += Math.min(enemy.health / 100, 0.3);
            }

            if (enemy.isBoss) {
                threat = 1.0;
            }

            return Math.min(threat, 1);
        } catch (error) {
            return 0.5;
        }
    }

    getStateSize() {
        return 60;
    }
}

// Global instance
window.imitationLearning = new ImitationLearningSystem();

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

console.log("🎬 Full Session Imitation Learning System v2.1 loaded - Preserves long sessions with smart level-up integration!");