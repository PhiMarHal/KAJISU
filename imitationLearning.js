// imitationLearning.js - Enhanced Imitation Learning System with Better Training
// Fixes: model persistence, boundary handling, save/load, training quality

/**
 * ENHANCED IMITATION LEARNING SYSTEM
 * Key improvements:
 * - Better model architecture and persistence
 * - Simplified but effective boundary handling
 * - Robust save/load with JSON export/import
 * - Improved training with data quality checks
 * - Better diagnostics and debugging
 */
class EnhancedImitationLearningSystem {
    constructor() {
        this.isRecording = false;
        this.recordingData = [];
        this.recordingStartTime = null;
        this.lastRecordTime = 0;
        this.recordingInterval = 150;

        // Training data storage
        this.movementData = [];
        this.levelUpData = [];

        // State extractor
        this.stateExtractor = null;

        // Model management
        this.movementModel = null;
        this.levelUpModel = null;
        this.isMovementModelTrained = false;
        this.isLevelUpModelTrained = false;
        this.tfLoaded = false;
        this.modelVersion = "v1.0";

        // Training state
        this.isTraining = false;
        this.trainingQueued = false;
        this.trainingHistory = [];
        this.lastTrainingMetrics = null;

        // AI control state
        this.isUsingImitationMode = false;
        this.lastDecisionTime = 0;
        this.decisionInterval = 150;

        // Game state tracking
        this.currentGameMode = 'movement';
        this.isInLevelUpMode = false;

        // Level-up handling
        this.levelUpStartTime = null;
        this.levelUpHandled = false;
        this.perkScrollPhase = null;
        this.perksViewed = 0;

        // Movement control
        this.pressedKeys = new Set();

        // Enhanced training parameters
        this.minTrainingData = 100;
        this.dataQualityThreshold = 0.8;

        // Enhanced enemy avoidance
        this.useEnhancedEnemyAvoidance = true; // Can be toggled
        this.useEscapeRouteAnalysis = true;

        // Debug and diagnostics
        this.debugMode = false;
        this.performanceMetrics = {
            trainingCount: 0,
            bestAccuracy: 0,
            bestLoss: Infinity,
            lastImprovement: null
        };

        console.log("🎬 Enhanced Imitation Learning System - Better training & persistence");
    }

    async initialize(scene) {
        this.scene = scene;
        await this.ensureTensorFlowLoaded();

        this.stateExtractor = new SimplifiedStateExtractor();
        this.stateExtractor.initialize(scene);

        this.createEnhancedUI();
        this.setupKeyboardShortcuts();
        this.setupAutoTraining();

        // Try to load any existing model
        await this.attemptAutoLoad();

        console.log("🎬 Enhanced imitation learning system ready");
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

    async attemptAutoLoad() {
        try {
            // First try to load from our enhanced storage
            const modelData = localStorage.getItem('imitationLearning_enhanced_model');
            if (modelData) {
                console.log("🔄 Found existing enhanced model data");
                await this.loadFromJSON(JSON.parse(modelData));
                return;
            }

            console.log("📝 No existing model found - starting fresh");
        } catch (error) {
            console.log("📝 Could not load existing model:", error.message);
        }
    }

    setupAutoTraining() {
        setInterval(() => {
            this.updateGameModeDetection();
            this.checkForAutoTraining();
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

        if (isActuallyInLevelUp !== this.isInLevelUpMode) {
            this.isInLevelUpMode = isActuallyInLevelUp;
            this.currentGameMode = isActuallyInLevelUp ? 'levelup' : 'movement';

            if (this.debugMode) {
                console.log(`🎯 Game mode: ${this.currentGameMode}`);
            }
        }
    }

    checkForAutoTraining() {
        // Auto-training removed - manual training only
        // This prevents endless training loops and gives user control
    }

    // ENHANCED MODEL CREATION with better architecture
    async createMovementModel(stateSize) {
        console.log(`🏗️ Creating enhanced movement model (state size: ${stateSize})`);

        const model = tf.sequential({
            layers: [
                // Input layer with L2 regularization
                tf.layers.dense({
                    inputShape: [stateSize],
                    units: 128,
                    activation: 'relu',
                    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
                    kernelInitializer: 'heNormal'
                }),
                tf.layers.dropout({ rate: 0.3 }),

                // Hidden layers
                tf.layers.dense({
                    units: 96,
                    activation: 'relu',
                    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
                }),
                tf.layers.dropout({ rate: 0.2 }),

                tf.layers.dense({
                    units: 64,
                    activation: 'relu'
                }),
                tf.layers.dropout({ rate: 0.1 }),

                // Output layer
                tf.layers.dense({
                    units: 9,
                    activation: 'softmax'
                })
            ]
        });

        // Compile with adaptive learning rate
        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        console.log(`🏗️ Enhanced model created with ${model.countParams()} parameters`);
        return model;
    }

    // IMPROVED TRAINING with better data quality and model persistence
    async trainMovementModel(movementData) {
        if (!this.tfLoaded) {
            console.error("❌ TensorFlow.js not loaded!");
            return false;
        }

        try {
            console.log(`🏃 Training enhanced movement model with ${movementData.length} examples`);

            // Data quality check
            const qualityScore = this.assessDataQuality(movementData);
            console.log(`📊 Data quality score: ${(qualityScore * 100).toFixed(1)}%`);

            if (qualityScore < this.dataQualityThreshold) {
                console.log(`⚠️ Data quality below threshold (${this.dataQualityThreshold}), filtering...`);
                movementData = this.filterLowQualityData(movementData);
                console.log(`📊 After filtering: ${movementData.length} examples`);
            }

            const states = movementData.map(ex => ex.state);
            const actions = movementData.map(ex => ex.action);
            const oneHotActions = this.actionsToOneHot(actions, 9);

            // Create or reuse model
            if (!this.movementModel) {
                this.movementModel = await this.createMovementModel(states[0].length);
                console.log("🏃 Created new enhanced model");
            } else {
                console.log("🏃 Reusing existing model for continued training");
            }

            // Prepare training data
            const statesTensor = tf.tensor2d(states);
            const actionsTensor = tf.tensor2d(oneHotActions);

            // Calculate optimal training parameters
            const epochs = this.calculateOptimalEpochs(movementData.length);
            const batchSize = this.calculateOptimalBatchSize(movementData.length);
            const learningRate = this.calculateLearningRate();

            console.log(`🏃 Training: ${epochs} epochs, batch ${batchSize}, lr ${learningRate}`);

            // Update learning rate if this is continued training
            if (this.isMovementModelTrained) {
                this.movementModel.optimizer.learningRate = learningRate;
            }

            // Track training progress
            const epochLosses = [];
            const epochAccuracies = [];

            const history = await this.movementModel.fit(statesTensor, actionsTensor, {
                epochs: epochs,
                batchSize: batchSize,
                validationSplit: 0.2,
                shuffle: true,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        epochLosses.push(logs.loss);
                        epochAccuracies.push(logs.acc);

                        if (epoch % Math.max(1, Math.floor(epochs / 5)) === 0 || epoch === epochs - 1) {
                            console.log(`🏃 Epoch ${epoch}: loss=${logs.loss.toFixed(4)}, acc=${logs.acc.toFixed(4)}, val_loss=${logs.val_loss.toFixed(4)}, val_acc=${logs.val_acc.toFixed(4)}`);
                        }
                    }
                }
            });

            // Clean up tensors
            statesTensor.dispose();
            actionsTensor.dispose();

            // Update training metrics
            const finalLoss = history.history.loss[history.history.loss.length - 1];
            const finalAcc = history.history.acc[history.history.acc.length - 1];
            const finalValLoss = history.history.val_loss[history.history.val_loss.length - 1];
            const finalValAcc = history.history.val_acc[history.history.val_acc.length - 1];

            this.updatePerformanceMetrics(finalLoss, finalAcc, finalValLoss, finalValAcc);

            console.log(`✅ Training complete!`);
            console.log(`📊 Final: loss=${finalLoss.toFixed(4)}, acc=${finalAcc.toFixed(4)}, val_loss=${finalValLoss.toFixed(4)}, val_acc=${finalValAcc.toFixed(4)}`);
            console.log(`📊 Best ever: acc=${this.performanceMetrics.bestAccuracy.toFixed(4)}, loss=${this.performanceMetrics.bestLoss.toFixed(4)}`);

            this.isMovementModelTrained = true;
            this.performanceMetrics.trainingCount++;

            // Auto-save after successful training
            await this.autoSaveModel();

            return true;

        } catch (error) {
            console.error("❌ Enhanced training error:", error);
            return false;
        }
    }

    // DATA QUALITY ASSESSMENT
    assessDataQuality(data) {
        if (data.length === 0) return 0;

        let qualityScore = 0;
        const checks = {
            actionVariety: this.checkActionVariety(data),
            boundaryAwareness: this.checkBoundaryAwareness(data),
            consistentState: this.checkStateConsistency(data),
            reasonableLength: Math.min(data.length / this.minTrainingData, 1)
        };

        // Weighted quality score
        qualityScore = (
            checks.actionVariety * 0.3 +
            checks.boundaryAwareness * 0.3 +
            checks.consistentState * 0.2 +
            checks.reasonableLength * 0.2
        );

        if (this.debugMode) {
            console.log("📊 Quality breakdown:", checks);
        }

        return qualityScore;
    }

    checkActionVariety(data) {
        const actionCounts = {};
        data.forEach(ex => {
            actionCounts[ex.action] = (actionCounts[ex.action] || 0) + 1;
        });

        const totalActions = Object.keys(actionCounts).length;
        const maxCount = Math.max(...Object.values(actionCounts));
        const avgCount = data.length / totalActions;

        // Good variety = many different actions, not too dominated by one
        const varietyScore = Math.min(totalActions / 9, 1);
        const balanceScore = Math.max(0, 1 - (maxCount / data.length - 0.4) / 0.4);

        return (varietyScore + balanceScore) / 2;
    }

    checkBoundaryAwareness(data) {
        let nearBoundaryCount = 0;
        let goodMovementCount = 0;

        data.forEach(ex => {
            if (ex.state && ex.state.length >= 2) {
                const x = ex.state[0];
                const y = ex.state[1];
                const isNearBoundary = x < 0.15 || x > 0.85 || y < 0.15 || y > 0.85;

                if (isNearBoundary) {
                    nearBoundaryCount++;
                    // Check if movement is away from boundary
                    const action = ex.action;
                    const isGoodMove = this.isMovementAwayFromBoundary(x, y, action);
                    if (isGoodMove) goodMovementCount++;
                }
            }
        });

        return nearBoundaryCount > 0 ? goodMovementCount / nearBoundaryCount : 1;
    }

    isMovementAwayFromBoundary(x, y, action) {
        // Action mapping: 0=stay, 1=up, 2=up-right, 3=right, 4=down-right, 5=down, 6=down-left, 7=left, 8=up-left
        const actionMap = [
            [0, 0], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]
        ];

        const [dx, dy] = actionMap[action] || [0, 0];

        // Check if movement is away from the closest boundary
        if (x < 0.15 && dx > 0) return true;  // Near left, moving right
        if (x > 0.85 && dx < 0) return true;  // Near right, moving left
        if (y < 0.15 && dy > 0) return true;  // Near top, moving down
        if (y > 0.85 && dy < 0) return true;  // Near bottom, moving up

        return false;
    }

    checkStateConsistency(data) {
        if (data.length < 2) return 1;

        let validTransitions = 0;
        const expectedStateSize = data[0].state?.length;

        for (let i = 1; i < data.length; i++) {
            const current = data[i];
            const previous = data[i - 1];

            if (current.state?.length === expectedStateSize &&
                previous.state?.length === expectedStateSize) {
                validTransitions++;
            }
        }

        return validTransitions / (data.length - 1);
    }

    filterLowQualityData(data) {
        // Remove excessive "stay still" actions
        const actionCounts = {};
        data.forEach(ex => {
            actionCounts[ex.action] = (actionCounts[ex.action] || 0) + 1;
        });

        const stayStillCount = actionCounts[0] || 0;
        const maxStayStillAllowed = Math.floor(data.length * 0.3); // Max 30% stay still

        let filtered = data;
        if (stayStillCount > maxStayStillAllowed) {
            const nonStayStill = data.filter(ex => ex.action !== 0);
            const stayStillFiltered = data.filter(ex => ex.action === 0)
                .sort(() => Math.random() - 0.5)
                .slice(0, maxStayStillAllowed);

            filtered = [...nonStayStill, ...stayStillFiltered];
            console.log(`📊 Filtered stay-still actions: ${stayStillCount} → ${maxStayStillAllowed}`);
        }

        return filtered;
    }

    updatePerformanceMetrics(loss, acc, valLoss, valAcc) {
        this.lastTrainingMetrics = { loss, acc, valLoss, valAcc };

        if (acc > this.performanceMetrics.bestAccuracy) {
            this.performanceMetrics.bestAccuracy = acc;
            this.performanceMetrics.lastImprovement = new Date();
            console.log(`🎉 New best accuracy: ${acc.toFixed(4)}`);
        }

        if (loss < this.performanceMetrics.bestLoss) {
            this.performanceMetrics.bestLoss = loss;
            this.performanceMetrics.lastImprovement = new Date();
            console.log(`🎉 New best loss: ${loss.toFixed(4)}`);
        }

        this.trainingHistory.push({
            timestamp: new Date(),
            loss, acc, valLoss, valAcc
        });

        // Keep only last 20 training sessions
        if (this.trainingHistory.length > 20) {
            this.trainingHistory.shift();
        }
    }

    calculateOptimalEpochs(dataSize) {
        // Adaptive epochs based on data size and training history
        let baseEpochs = 30;

        if (dataSize < 200) baseEpochs = 50;
        else if (dataSize < 500) baseEpochs = 40;
        else if (dataSize > 2000) baseEpochs = 25;

        // Reduce epochs if we're continuing training
        if (this.isMovementModelTrained && this.trainingHistory.length > 0) {
            baseEpochs = Math.max(15, Math.floor(baseEpochs * 0.7));
        }

        return baseEpochs;
    }

    calculateOptimalBatchSize(dataSize) {
        return Math.min(64, Math.max(16, Math.floor(dataSize / 50)));
    }

    calculateLearningRate() {
        // Adaptive learning rate
        if (!this.isMovementModelTrained) {
            return 0.001; // Initial learning rate
        }

        // Reduce learning rate for continued training
        const trainingsSinceImprovement = this.performanceMetrics.lastImprovement ?
            this.performanceMetrics.trainingCount - this.trainingHistory.findIndex(h =>
                h.timestamp.getTime() === this.performanceMetrics.lastImprovement.getTime()
            ) : this.performanceMetrics.trainingCount;

        if (trainingsSinceImprovement > 3) {
            return 0.0005; // Lower learning rate if no recent improvement
        }

        return 0.001;
    }

    // ENHANCED MODEL SAVE/LOAD with size optimization and JSON support
    async saveMovementModelAdvanced() {
        if (!this.movementModel) {
            alert("No movement model to save!");
            return;
        }

        const modelName = prompt("Model name:", `enhanced_movement_${Date.now()}`);
        if (!modelName) return;

        try {
            // First, try the compact JSON format
            const success = await this.saveToJSON(modelName);
            if (success) {
                alert(`Model saved as JSON: ${modelName}`);
                return;
            }

            // Fallback to browser storage for smaller models
            await this.movementModel.save(`localstorage://${modelName}`);
            alert(`Model saved to local storage: ${modelName}`);

        } catch (error) {
            console.error("Save failed:", error);

            if (error.message.includes("quota") || error.message.includes("storage")) {
                alert("Local storage full! Model saved as JSON download instead.");
                await this.saveToJSON(modelName, true); // Force download
            } else {
                alert("Failed to save model: " + error.message);
            }
        }
    }

    async loadMovementModelAdvanced() {
        const option = prompt("Load from:\n1. Enter '1' for local storage\n2. Enter '2' for JSON file upload\n3. Enter model name for local storage");

        if (!option) return;

        try {
            if (option === "2") {
                // JSON file upload
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const text = await file.text();
                        const success = await this.loadFromJSON(JSON.parse(text));
                        alert(success ? "Model loaded successfully!" : "Failed to load model");
                    }
                };
                input.click();
                return;
            }

            // Local storage load
            const modelName = option === "1" ? prompt("Model name to load:") : option;
            if (!modelName) return;

            this.movementModel = await tf.loadLayersModel(`localstorage://${modelName}`);
            this.isMovementModelTrained = true;
            console.log(`✅ Model loaded: ${modelName}`);
            alert("Model loaded successfully!");

        } catch (error) {
            console.error("Load failed:", error);
            alert("Failed to load model: " + error.message);
        }
    }

    async saveToJSON(modelName, forceDownload = false) {
        try {
            const modelData = {
                version: this.modelVersion,
                modelName: modelName,
                timestamp: new Date().toISOString(),
                architecture: this.movementModel.toJSON(),
                weights: await this.movementModel.getWeights().map(async w => ({
                    shape: w.shape,
                    data: Array.from(await w.data())
                })),
                trainingMetrics: this.performanceMetrics,
                trainingHistory: this.trainingHistory.slice(-5) // Only keep recent history
            };

            // Wait for all weight data to be extracted
            modelData.weights = await Promise.all(modelData.weights);

            const jsonString = JSON.stringify(modelData);
            const blob = new Blob([jsonString], { type: 'application/json' });

            if (forceDownload || blob.size > 5 * 1024 * 1024) { // If larger than 5MB, download
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${modelName}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                console.log(`📥 Model saved as download: ${modelName}.json (${(blob.size / 1024 / 1024).toFixed(2)}MB)`);
                return true;
            }

            // Try to save to localStorage
            localStorage.setItem(`imitationLearning_${modelName}`, jsonString);
            console.log(`💾 Model saved to localStorage: ${modelName} (${(blob.size / 1024).toFixed(2)}KB)`);
            return true;

        } catch (error) {
            console.error("JSON save error:", error);
            return false;
        }
    }

    async loadFromJSON(modelData) {
        try {
            console.log(`📥 Loading model: ${modelData.modelName} (version ${modelData.version})`);

            // Recreate model from architecture
            this.movementModel = await tf.models.modelFromJSON(modelData.architecture);

            // Restore weights
            const weightTensors = modelData.weights.map(w =>
                tf.tensor(w.data, w.shape)
            );
            this.movementModel.setWeights(weightTensors);

            // Restore training state
            this.performanceMetrics = { ...this.performanceMetrics, ...modelData.trainingMetrics };
            if (modelData.trainingHistory) {
                this.trainingHistory = modelData.trainingHistory.map(h => ({
                    ...h,
                    timestamp: new Date(h.timestamp)
                }));
            }

            // Recompile the model
            this.movementModel.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'categoricalCrossentropy',
                metrics: ['accuracy']
            });

            this.isMovementModelTrained = true;
            console.log(`✅ Model loaded successfully with ${this.performanceMetrics.trainingCount} training sessions`);
            return true;

        } catch (error) {
            console.error("JSON load error:", error);
            return false;
        }
    }

    async autoSaveModel() {
        try {
            const autoSaveData = {
                version: this.modelVersion,
                modelName: "auto_save",
                timestamp: new Date().toISOString(),
                architecture: this.movementModel.toJSON(),
                weights: await Promise.all(this.movementModel.getWeights().map(async w => ({
                    shape: w.shape,
                    data: Array.from(await w.data())
                }))),
                trainingMetrics: this.performanceMetrics
            };

            localStorage.setItem('imitationLearning_enhanced_model', JSON.stringify(autoSaveData));
            console.log("💾 Model auto-saved");

        } catch (error) {
            console.log("⚠️ Auto-save failed (storage full?):", error.message);
        }
    }

    // SIMPLIFIED AI MOVEMENT with better boundary handling
    async controlMovement() {
        if (!this.isUsingImitationMode || !this.isMovementModelTrained) return;

        if (this.isInLevelUpMode) {
            this.handleLevelUpWithModel();
            return;
        }

        const now = Date.now();
        if (now - this.lastDecisionTime < this.decisionInterval) return;

        try {
            const state = this.stateExtractor.getState('movement');
            if (!state) return;

            const action = await this.chooseMovementAction(state);
            this.executeAction(action);

            this.lastDecisionTime = now;

        } catch (error) {
            console.error("Movement control error:", error);
        }
    }

    async chooseMovementAction(state) {
        try {
            const stateTensor = tf.tensor2d([state]);
            const prediction = await this.movementModel.predict(stateTensor);
            const probabilities = await prediction.data();

            // Enhanced action selection with boundary safety
            const action = this.selectSafeAction(state, probabilities);

            if (this.debugMode && Math.random() < 0.1) { // Debug 10% of decisions
                const actionNames = ['Stay', 'Up', 'Up-Right', 'Right', 'Down-Right', 'Down', 'Down-Left', 'Left', 'Up-Left'];
                console.log(`🏃 AI: ${actionNames[action]} (${(probabilities[action] * 100).toFixed(1)}%)`);
            }

            stateTensor.dispose();
            prediction.dispose();

            return action;

        } catch (error) {
            console.error("Action choice error:", error);
            return 0; // Stay still as fallback
        }
    }

    async chooseMovementAction(state) {
        try {
            const stateTensor = tf.tensor2d([state]);
            const prediction = await this.movementModel.predict(stateTensor);
            const probabilities = await prediction.data();

            // Enhanced action selection with deterministic enemy avoidance
            const action = this.selectSmartAction(state, probabilities);

            if (this.debugMode && Math.random() < 0.1) { // Debug 10% of decisions
                const actionNames = ['Stay', 'Up', 'Up-Right', 'Right', 'Down-Right', 'Down', 'Down-Left', 'Left', 'Up-Left'];
                console.log(`🏃 AI: ${actionNames[action]} (${(probabilities[action] * 100).toFixed(1)}%)`);
            }

            stateTensor.dispose();
            prediction.dispose();

            return action;

        } catch (error) {
            console.error("Action choice error:", error);
            return 0; // Stay still as fallback
        }
    }

    selectSmartAction(state, probabilities) {
        const playerX = state[0];
        const playerY = state[1];

        // Create a copy of probabilities for modification
        const smartProbabilities = Array.from(probabilities);

        // Get current player position in absolute coordinates
        this.stateExtractor.updateResolution();
        const absoluteX = playerX * this.stateExtractor.gameWidth;
        const absoluteY = playerY * this.stateExtractor.gameHeight;

        // Apply boundary safety (existing logic)
        this.applyBoundarySafety(playerX, playerY, smartProbabilities);

        // Apply enhanced enemy avoidance with predictive planning (optional)
        if (this.useEnhancedEnemyAvoidance) {
            this.applyEnemyAvoidance(absoluteX, absoluteY, smartProbabilities);
        }

        // Apply escape route analysis when surrounded (optional)
        if (this.useEscapeRouteAnalysis) {
            this.applyEscapeRouteAnalysis(absoluteX, absoluteY, smartProbabilities);
        }

        // Select action based on modified probabilities
        return this.sampleFromProbabilities(smartProbabilities);
    }

    applyBoundarySafety(playerX, playerY, probabilities) {
        const boundaryThreshold = 0.12; // 12% from edge

        const actionMap = [
            [0, 0], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]
        ];

        actionMap.forEach((dir, actionIndex) => {
            const [dx, dy] = dir;
            const newX = playerX + dx * 0.05; // Simulate small move
            const newY = playerY + dy * 0.05;

            // Heavy penalty for moves that would go near boundaries
            if (newX < boundaryThreshold || newX > (1 - boundaryThreshold) ||
                newY < boundaryThreshold || newY > (1 - boundaryThreshold)) {
                probabilities[actionIndex] *= 0.05; // 95% penalty
            }
        });
    }

    applyEnemyAvoidance(playerX, playerY, probabilities) {
        try {
            const enemies = window.EnemySystem?.enemiesGroup?.getChildren() || [];
            const activeEnemies = enemies.filter(enemy => enemy?.active && enemy.x !== undefined);

            if (activeEnemies.length === 0) return;

            const actionMap = [
                [0, 0], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]
            ];

            // Calculate danger for each possible move
            actionMap.forEach((dir, actionIndex) => {
                const moveDistance = 25; // How far to simulate the move
                const futureX = playerX + dir[0] * moveDistance;
                const futureY = playerY + dir[1] * moveDistance;

                let totalDanger = 0;

                activeEnemies.forEach(enemy => {
                    // Current distance to enemy
                    const currentDist = Math.sqrt(
                        Math.pow(enemy.x - playerX, 2) +
                        Math.pow(enemy.y - playerY, 2)
                    );

                    // Predicted future distance after our move
                    // Assume enemy moves toward our current position (simplified prediction)
                    const enemyMoveDistance = 15; // Approximate enemy speed
                    const enemyToPlayerX = playerX - enemy.x;
                    const enemyToPlayerY = playerY - enemy.y;
                    const enemyToPlayerDist = Math.sqrt(enemyToPlayerX * enemyToPlayerX + enemyToPlayerY * enemyToPlayerY);

                    let futureEnemyX = enemy.x;
                    let futureEnemyY = enemy.y;

                    if (enemyToPlayerDist > 0) {
                        futureEnemyX += (enemyToPlayerX / enemyToPlayerDist) * enemyMoveDistance;
                        futureEnemyY += (enemyToPlayerY / enemyToPlayerDist) * enemyMoveDistance;
                    }

                    const futureDist = Math.sqrt(
                        Math.pow(futureEnemyX - futureX, 2) +
                        Math.pow(futureEnemyY - futureY, 2)
                    );

                    // Calculate danger based on proximity
                    const dangerRadius = 80; // Danger zone around enemies
                    if (futureDist < dangerRadius) {
                        const dangerIntensity = (dangerRadius - futureDist) / dangerRadius;
                        totalDanger += dangerIntensity;

                        // Extra penalty if we're moving toward the enemy
                        if (futureDist < currentDist) {
                            totalDanger += 0.5; // Additional penalty for moving closer
                        }
                    }
                });

                // Apply danger penalty to action probability
                if (totalDanger > 0) {
                    const penaltyFactor = Math.max(0.1, 1 - totalDanger);
                    probabilities[actionIndex] *= penaltyFactor;
                }
            });

        } catch (e) {
            // Silent fail for enemy access issues
        }
    }

    applyEscapeRouteAnalysis(playerX, playerY, probabilities) {
        try {
            const enemies = window.EnemySystem?.enemiesGroup?.getChildren() || [];
            const activeEnemies = enemies.filter(enemy => enemy?.active && enemy.x !== undefined);

            if (activeEnemies.length === 0) return;

            // Count nearby enemies to detect "surrounded" situations
            const nearbyThreshold = 120;
            const nearbyEnemies = activeEnemies.filter(enemy => {
                const dist = Math.sqrt(
                    Math.pow(enemy.x - playerX, 2) +
                    Math.pow(enemy.y - playerY, 2)
                );
                return dist < nearbyThreshold;
            });

            // If surrounded by many enemies, find the best escape route
            if (nearbyEnemies.length >= 3) {
                console.log(`🆘 AI: Surrounded by ${nearbyEnemies.length} enemies - calculating escape route`);

                const actionMap = [
                    [0, 0], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]
                ];

                // Find the direction with the least enemy density
                let bestEscapeAction = 0;
                let lowestEnemyDensity = Infinity;

                actionMap.forEach((dir, actionIndex) => {
                    if (actionIndex === 0) return; // Skip "stay still"

                    const checkDistance = 150;
                    const escapeX = playerX + dir[0] * checkDistance;
                    const escapeY = playerY + dir[1] * checkDistance;

                    // Count enemies in this escape direction
                    let enemiesInDirection = 0;
                    activeEnemies.forEach(enemy => {
                        const dist = Math.sqrt(
                            Math.pow(enemy.x - escapeX, 2) +
                            Math.pow(enemy.y - escapeY, 2)
                        );
                        if (dist < checkDistance) {
                            enemiesInDirection += (checkDistance - dist) / checkDistance; // Weighted by proximity
                        }
                    });

                    if (enemiesInDirection < lowestEnemyDensity) {
                        lowestEnemyDensity = enemiesInDirection;
                        bestEscapeAction = actionIndex;
                    }
                });

                // Boost the probability of the best escape route
                if (bestEscapeAction > 0) {
                    probabilities[bestEscapeAction] *= 3.0; // 3x boost for best escape
                    console.log(`🆘 AI: Boosting escape action ${bestEscapeAction}`);
                }

                // Heavily penalize staying still when surrounded
                probabilities[0] *= 0.01;
            }

        } catch (e) {
            // Silent fail
        }
    }

    // RECORDING AND TRAINING
    startRecording(sessionName = null) {
        if (this.isRecording) {
            console.log("⚠️ Already recording!");
            return;
        }

        if (this.isTraining) {
            console.log("⚠️ Cannot start recording while training");
            return;
        }

        this.isRecording = true;
        this.recordingData = [];
        this.recordingStartTime = Date.now();
        this.currentSessionName = sessionName || `session_${Date.now()}`;

        console.log(`🔴 Recording started: ${this.currentSessionName}`);
        this.updateUI();
    }

    stopRecording() {
        if (!this.isRecording) return;

        this.isRecording = false;
        console.log(`⏹️ Recording stopped: ${this.recordingData.length} examples`);
        this.updateUI();
    }

    recordFrame() {
        if (!this.isRecording || !this.scene) return;

        const now = Date.now();
        if (now - this.lastRecordTime < this.recordingInterval) return;

        const isGameOver = window.gameOver ?? (typeof gameOver !== 'undefined' ? gameOver : false);
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
                gameMode: this.currentGameMode,
                playerHealth: window.playerHealth || 100,
                score: window.score || 0
            };

            this.recordingData.push(example);
            this.lastRecordTime = now;

        } catch (error) {
            console.error("Recording error:", error);
        }
    }

    async trainOnCurrentSession() {
        if (this.isTraining) {
            console.log("⚠️ Training already in progress!");
            return false;
        }

        if (this.recordingData.length < this.minTrainingData) {
            console.log(`❌ Need at least ${this.minTrainingData} examples, got ${this.recordingData.length}`);
            return false;
        }

        this.isTraining = true;
        console.log(`🧠 Training on ${this.recordingData.length} examples`);

        try {
            const movementData = this.recordingData.filter(ex => ex.gameMode === 'movement');

            if (movementData.length >= this.minTrainingData) {
                const success = await this.trainMovementModel(movementData);
                if (success) {
                    console.log("✅ Training completed successfully");
                    return true;
                }
            }

            console.log("❌ Training failed or insufficient data");
            return false;

        } catch (error) {
            console.error("Training error:", error);
            return false;
        } finally {
            this.isTraining = false;
        }
    }

    toggleImitationMode() {
        if (this.isTraining) {
            console.log("⚠️ Cannot toggle mode while training");
            return;
        }

        if (!this.isMovementModelTrained) {
            console.log("⚠️ No trained model available!");
            return;
        }

        this.isUsingImitationMode = !this.isUsingImitationMode;

        if (this.isUsingImitationMode) {
            if (window.gameAI?.aiActive) {
                window.gameAI.aiActive = false;
                window.gameAI.releaseAllMovementKeys?.();
            }
            console.log("🎭 Imitation mode: ON");
        } else {
            console.log("🎭 Imitation mode: OFF");
            this.releaseAllMovementKeys();
        }

        this.updateUI();
    }

    // ENHANCED DATA EXPORT with better structure
    exportAdvancedSession() {
        if (this.recordingData.length === 0) {
            console.log("❌ No session data to export");
            return;
        }

        const movementData = this.recordingData.filter(ex => ex.gameMode === 'movement');
        const levelUpData = this.recordingData.filter(ex => ex.gameMode === 'levelup');

        const exportData = {
            version: this.modelVersion,
            sessionName: this.currentSessionName,
            exportTimestamp: new Date().toISOString(),
            summary: {
                totalExamples: this.recordingData.length,
                movementExamples: movementData.length,
                levelUpExamples: levelUpData.length,
                qualityScore: this.assessDataQuality(movementData),
                duration: this.recordingData.length > 0 ?
                    (this.recordingData[this.recordingData.length - 1].timestamp / 1000) : 0
            },
            data: {
                movement: movementData,
                levelup: levelUpData
            },
            modelMetrics: this.performanceMetrics
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `enhanced_session_${this.currentSessionName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`📥 Exported: ${movementData.length} movement, ${levelUpData.length} level-up examples`);
    }

    // UTILITY METHODS
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

    actionsToOneHot(actions, numActions) {
        return actions.map(action => {
            const vector = new Array(numActions).fill(0);
            vector[action] = 1;
            return vector;
        });
    }

    sampleFromProbabilities(probabilities) {
        const sum = probabilities.reduce((a, b) => a + b, 0);
        if (sum === 0) return 0;

        const normalizedProbs = probabilities.map(p => p / sum);
        const random = Math.random();
        let cumSum = 0;

        for (let i = 0; i < normalizedProbs.length; i++) {
            cumSum += normalizedProbs[i];
            if (random <= cumSum) {
                return i;
            }
        }

        return 0;
    }

    // LEVEL UP HANDLING (simplified)
    handleLevelUpWithModel() {
        if (!this.levelUpStartTime) {
            this.levelUpStartTime = Date.now();
            this.levelUpHandled = false;
            this.perkScrollPhase = 'browsing';
            this.perksViewed = 0;
        }

        if (this.levelUpHandled) return;

        const elapsed = Date.now() - this.levelUpStartTime;
        if (elapsed < 1000) return;

        if (this.perkScrollPhase === 'browsing' && this.perksViewed < 3) {
            this.navigateToNextPerk();
            this.perksViewed++;
            return;
        }

        this.perkScrollPhase = 'selecting';
        const perkSelected = this.selectRandomPerk();

        if (perkSelected || elapsed > 10000) {
            this.levelUpHandled = true;
            this.levelUpStartTime = null;
            this.perkScrollPhase = null;
        }
    }

    navigateToNextPerk() {
        const gameWidth = window.game?.config?.width || (window.KAJISULI_MODE ? 720 : 1280);
        const gameHeight = window.game?.config?.height || (window.KAJISULI_MODE ? 1200 : 800);
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;
        const kajisuliMode = window.KAJISULI_MODE ?? false;
        const arrowDistance = kajisuliMode ? gameWidth * 0.32 : gameWidth * 0.16;
        this.clickAtGamePosition(centerX + arrowDistance, centerY);
    }

    selectRandomPerk() {
        const gameWidth = window.game?.config?.width || (window.KAJISULI_MODE ? 720 : 1280);
        const gameHeight = window.game?.config?.height || (window.KAJISULI_MODE ? 1200 : 800);
        this.clickAtGamePosition(gameWidth / 2, gameHeight / 2);
        return true;
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
            new MouseEvent('click', { bubbles: true, clientX: canvasX, clientY: canvasY })
        ];

        events.forEach((event, index) => {
            setTimeout(() => canvas.dispatchEvent(event), index * 50);
        });
    }

    // ENHANCED UI
    createEnhancedUI() {
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
            min-width: 300px;
        `;

        ui.innerHTML = `
            <div style="margin-bottom: 10px;">
                <div><strong>🎬 Enhanced Imitation Learning</strong></div>
                <div>Recording: <span id="recording-status">Off</span></div>
                <div>Training: <span id="training-status">Ready</span></div>
                <div>Model: <span id="model-status">Not Trained</span></div>
                <div>Mode: <span id="imitation-mode">Human Control</span></div>
                <div>Examples: <span id="current-examples">0</span></div>
                <div>Best Acc: <span id="best-accuracy">0.000</span></div>
                <div>Training #: <span id="training-count">0</span></div>
                <div>Enemy Avoid: <span id="enemy-avoidance-status">ON</span></div>
                <div>Escape Routes: <span id="escape-routes-status">ON</span></div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <button id="toggle-recording" style="padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Start Recording (V)
                </button>
                <button id="train-current" style="padding: 8px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Train Current (B)
                </button>
                <button id="toggle-imitation" style="padding: 8px; background: #9C27B0; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Toggle AI Control (N)
                </button>
                
                <div style="display: flex; gap: 3px;">
                    <button id="save-model-adv" style="flex: 1; padding: 6px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Save Model
                    </button>
                    <button id="load-model-adv" style="flex: 1; padding: 6px; background: #E91E63; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Load Model
                    </button>
                </div>
                
                <div style="display: flex; gap: 3px;">
                    <button id="toggle-enemy-avoid" style="flex: 1; padding: 6px; background: #FF5722; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Enemy Rules
                    </button>
                    <button id="export-session-adv" style="flex: 1; padding: 6px; background: #607D8B; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Export
                    </button>
                </div>
                
                <div style="display: flex; gap: 3px;">
                    <button id="toggle-escape-routes" style="flex: 1; padding: 6px; background: #FF5722; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Escape Routes
                    </button>
                    <button id="toggle-debug" style="flex: 1; padding: 6px; background: #795548; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Debug
                    </button>
                </div>
            </div>
            
            <div style="margin-top: 8px; font-size: 10px; color: #aaa;">
                Enhanced with predictive enemy avoidance and escape route analysis
            </div>
        `;

        document.body.appendChild(ui);

        // Event listeners
        document.getElementById('toggle-recording').onclick = () => {
            if (this.isRecording) this.stopRecording();
            else this.startRecording();
        };

        document.getElementById('train-current').onclick = () => this.trainOnCurrentSession();
        document.getElementById('toggle-imitation').onclick = () => this.toggleImitationMode();
        document.getElementById('save-model-adv').onclick = () => this.saveMovementModelAdvanced();
        document.getElementById('load-model-adv').onclick = () => this.loadMovementModelAdvanced();
        document.getElementById('export-session-adv').onclick = () => this.exportAdvancedSession();
        document.getElementById('toggle-enemy-avoid').onclick = () => {
            this.useEnhancedEnemyAvoidance = !this.useEnhancedEnemyAvoidance;
            console.log(`🤖 Enhanced enemy avoidance: ${this.useEnhancedEnemyAvoidance ? 'ON' : 'OFF'}`);
        };
        document.getElementById('toggle-escape-routes').onclick = () => {
            this.useEscapeRouteAnalysis = !this.useEscapeRouteAnalysis;
            console.log(`🛣️ Escape route analysis: ${this.useEscapeRouteAnalysis ? 'ON' : 'OFF'}`);
        };
        document.getElementById('toggle-debug').onclick = () => {
            this.debugMode = !this.debugMode;
            console.log(`🔍 Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
        };
    }

    updateUI() {
        const elements = {
            'recording-status': this.isRecording ? 'Recording...' : 'Off',
            'training-status': this.isTraining ? 'Training...' : 'Ready',
            'model-status': this.isMovementModelTrained ? 'Trained' : 'Not Trained',
            'imitation-mode': this.isUsingImitationMode ? 'AI Control' : 'Human Control',
            'current-examples': this.recordingData.length.toString(),
            'best-accuracy': this.performanceMetrics.bestAccuracy.toFixed(3),
            'training-count': this.performanceMetrics.trainingCount.toString(),
            'enemy-avoidance-status': this.useEnhancedEnemyAvoidance ? 'ON' : 'OFF',
            'escape-routes-status': this.useEscapeRouteAnalysis ? 'ON' : 'OFF'
        };

        Object.entries(elements).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = text;
        });

        // Color coding
        const recordingEl = document.getElementById('recording-status');
        if (recordingEl) recordingEl.style.color = this.isRecording ? '#ff4444' : '#888';

        const trainingEl = document.getElementById('training-status');
        if (trainingEl) trainingEl.style.color = this.isTraining ? '#ffaa00' : '#888';

        const modelEl = document.getElementById('model-status');
        if (modelEl) modelEl.style.color = this.isMovementModelTrained ? '#44ff44' : '#888';

        const modeEl = document.getElementById('imitation-mode');
        if (modeEl) modeEl.style.color = this.isUsingImitationMode ? '#9C27B0' : '#44ff44';

        const enemyAvoidEl = document.getElementById('enemy-avoidance-status');
        if (enemyAvoidEl) enemyAvoidEl.style.color = this.useEnhancedEnemyAvoidance ? '#44ff44' : '#888';

        const escapeRoutesEl = document.getElementById('escape-routes-status');
        if (escapeRoutesEl) escapeRoutesEl.style.color = this.useEscapeRouteAnalysis ? '#44ff44' : '#888';
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            if (window.levelUpInProgress || window.gameOver) return;

            switch (event.key.toLowerCase()) {
                case 'v':
                    event.preventDefault();
                    if (this.isRecording) this.stopRecording();
                    else this.startRecording();
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

        this.releaseAllMovementKeys();

        const ui = document.getElementById('imitation-interface');
        if (ui) ui.remove();

        this.isTraining = false;
        this.trainingQueued = false;
    }
}

/**
 * SIMPLIFIED STATE EXTRACTOR
 * Focuses on the most important features for better learning
 */
class SimplifiedStateExtractor {
    constructor() {
        this.updateResolution();
        this.lastState = null;
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

        console.log(`🧠 Enhanced state extractor initialized (${this.gameWidth}x${this.gameHeight}, 20 focused features)`);
    }

    getState(mode = 'movement') {
        // Ensure we have current resolution
        this.updateResolution();

        if (mode === 'levelup') {
            return this.getLevelUpState();
        }

        return this.getMovementState();
    }

    getMovementState() {
        const gamePlayer = window.player || player;
        if (!gamePlayer) return this.lastState;

        if (window.gameOver ?? gameOver) return this.lastState;

        // Ensure we have current resolution
        this.updateResolution();

        try {
            const state = [
                // Basic player info (4 features)
                gamePlayer.x / this.gameWidth,  // 0: normalized x position
                gamePlayer.y / this.gameHeight, // 1: normalized y position
                (window.playerHealth || playerHealth || 100) / (window.maxPlayerHealth || maxPlayerHealth || 100), // 2: health ratio
                Math.min((window.elapsedTime || elapsedTime || 0) / 1800, 1), // 3: time progress (0-30min)

                // Boundary distances (4 features) - key for boundary avoidance
                gamePlayer.x / this.gameWidth, // 4: distance to left edge
                (this.gameWidth - gamePlayer.x) / this.gameWidth, // 5: distance to right edge
                gamePlayer.y / this.gameHeight, // 6: distance to top edge
                (this.gameHeight - gamePlayer.y) / this.gameHeight, // 7: distance to bottom edge

                // Enhanced enemy analysis (8 features) - directional threats
                ...this.getEnhancedDirectionalThreats(gamePlayer),

                // Closest enemies analysis (4 features) - individual enemy tracking
                ...this.getClosestEnemiesAnalysis(gamePlayer)
            ];

            this.lastState = state;
            return state;

        } catch (error) {
            console.error("State extraction error:", error);
            return this.lastState;
        }
    }

    getEnhancedDirectionalThreats(player) {
        // Check for threats in 8 directions with better analysis
        const directions = [
            [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]
        ];

        const checkRadius = 100;
        const threats = [];

        directions.forEach(dir => {
            const checkX = player.x + dir[0] * checkRadius;
            const checkY = player.y + dir[1] * checkRadius;

            let threatLevel = 0;

            try {
                const enemies = window.EnemySystem?.enemiesGroup?.getChildren() || [];
                for (const enemy of enemies) {
                    if (enemy?.active && enemy.x !== undefined) {
                        const dist = Math.sqrt(
                            Math.pow(enemy.x - checkX, 2) +
                            Math.pow(enemy.y - checkY, 2)
                        );

                        if (dist < checkRadius) {
                            const baseThreat = Math.max(0, 1 - dist / checkRadius);

                            // Enhanced threat calculation considering enemy movement
                            const enemyToPlayerX = player.x - enemy.x;
                            const enemyToPlayerY = player.y - enemy.y;
                            const enemyToPlayerDist = Math.sqrt(enemyToPlayerX * enemyToPlayerX + enemyToPlayerY * enemyToPlayerY);

                            // Is enemy moving toward player? (they always do, but check direction alignment)
                            const directionAlignment = dir[0] * (enemyToPlayerX / enemyToPlayerDist) + dir[1] * (enemyToPlayerY / enemyToPlayerDist);

                            // Higher threat if enemy is approaching from this direction
                            const movementMultiplier = directionAlignment > 0 ? 1.5 : 1.0;

                            threatLevel += baseThreat * movementMultiplier;
                        }
                    }
                }
            } catch (e) {
                // Silent fail for enemy access issues
            }

            threats.push(Math.min(threatLevel, 1));
        });

        return threats;
    }

    getClosestEnemiesAnalysis(player) {
        try {
            const enemies = window.EnemySystem?.enemiesGroup?.getChildren() || [];
            const activeEnemies = enemies.filter(enemy => enemy?.active && enemy.x !== undefined);

            if (activeEnemies.length === 0) {
                return [1, 0, 1, 0]; // No enemies
            }

            // Find closest enemies
            const enemyDistances = activeEnemies.map(enemy => {
                const dx = enemy.x - player.x;
                const dy = enemy.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return {
                    distance,
                    normalizedX: dx / this.gameWidth,
                    normalizedY: dy / this.gameHeight
                };
            }).sort((a, b) => a.distance - b.distance);

            // Get info for 2 closest enemies
            const result = [];
            for (let i = 0; i < 2; i++) {
                if (i < enemyDistances.length) {
                    const enemy = enemyDistances[i];
                    result.push(
                        Math.min(enemy.distance / 200, 1), // Normalized distance (0-200 pixels)
                        Math.max(-1, Math.min(1, enemy.normalizedX)) // Relative X position
                    );
                } else {
                    result.push(1, 0); // No enemy = max distance, no direction
                }
            }

            return result;

        } catch (e) {
            return [1, 0, 1, 0]; // Safe fallback
        }
    }

    getLevelUpState() {
        // Simple level-up state expanded to match movement state size (20 features)
        return [
            Math.min((window.playerLevel || playerLevel || 1) / 20, 1),
            (window.playerHealth || playerHealth || 100) / (window.maxPlayerHealth || maxPlayerHealth || 100),
            Math.min((window.elapsedTime || elapsedTime || 0) / 1800, 1),
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 // Padding to maintain 20 features
        ];
    }
}

// Replace the global imitation learning system
window.imitationLearning = new EnhancedImitationLearningSystem();

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

console.log("🎬 Enhanced Imitation Learning System loaded - Better training, persistence, and boundary handling!");