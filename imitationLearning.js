// imitationLearning.js - Enhanced Imitation Learning System with Fixed UI and Spatial Grid
// Fixes: UI element references, spatial grid implementation, enemy tracking

/**
 * ENHANCED IMITATION LEARNING SYSTEM
 * Key improvements:
 * - Fixed UI element references
 * - Improved spatial grid enemy tracking with debugging
 * - Better boundary handling and state extraction
 * - Robust save/load with JSON export/import
 * - Enhanced diagnostics for troubleshooting
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
        this.modelVersion = "v1.1";

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

        // Enhanced enemy avoidance options
        this.useEnhancedEnemyAvoidance = false; // DISABLED by default for pure learning
        this.useEscapeRouteAnalysis = false;    // DISABLED by default for pure learning
        this.useSpatialGrid = true;
        this.usePureImitation = true;           // NEW: Pure imitation mode

        // Perk learning system
        this.perkLearningEnabled = true;
        this.perkSelectionData = [];            // Record player's perk choices
        this.perkModel = null;                  // Neural network for perk selection
        this.isPerkModelTrained = false;

        // Debug and diagnostics
        this.debugMode = false;
        this.performanceMetrics = {
            trainingCount: 0,
            bestAccuracy: 0,
            bestLoss: Infinity,
            lastImprovement: null
        };

        // Spatial grid diagnostics
        this.spatialGridStats = {
            lastCallTime: 0,
            callCount: 0,
            lastEnemyCount: 0,
            lastGridOccupancy: 0
        };

        console.log("🎬 Enhanced Imitation Learning System v1.1 - Fixed UI and spatial grid");
        console.log("🗺️ Spatial grid: 8×8 grid (64 cells) with proper enemy tracking");
        console.log("🧠 Neural network input: 136 features (8 basic + 128 spatial grid)");
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

    // ENHANCED MODEL CREATION with better architecture for spatial inputs
    async createMovementModel(stateSize) {
        console.log(`🏗️ Creating spatial grid movement model (state size: ${stateSize})`);

        const model = tf.sequential({
            layers: [
                // Input layer with larger capacity for spatial data
                tf.layers.dense({
                    inputShape: [stateSize],
                    units: 256, // Increased for spatial grid processing
                    activation: 'relu',
                    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
                    kernelInitializer: 'heNormal'
                }),
                tf.layers.dropout({ rate: 0.4 }),

                // Second layer - spatial pattern recognition
                tf.layers.dense({
                    units: 128,
                    activation: 'relu',
                    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
                }),
                tf.layers.dropout({ rate: 0.3 }),

                // Third layer - decision making
                tf.layers.dense({
                    units: 64,
                    activation: 'relu'
                }),
                tf.layers.dropout({ rate: 0.2 }),

                // Output layer
                tf.layers.dense({
                    units: 9,
                    activation: 'softmax'
                })
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        console.log(`🏗️ Spatial grid model created with ${model.countParams()} parameters`);
        return model;
    }

    // IMPROVED TRAINING with better diagnostics and crowd situation analysis
    async trainMovementModel(movementData) {
        if (!this.tfLoaded) {
            console.error("❌ TensorFlow.js not loaded!");
            return false;
        }

        try {
            console.log(`🏃 Training enhanced movement model with ${movementData.length} examples`);

            // ANALYZE TRAINING DATA for crowd situations
            const dataAnalysis = this.analyzeTrainingData(movementData);
            console.log(`📊 Training Data Analysis:`);
            console.log(`   👥 Crowd situations (4+ enemies): ${dataAnalysis.crowdSituations} examples (${dataAnalysis.crowdPercentage.toFixed(1)}%)`);
            console.log(`   🎯 Action variety: ${dataAnalysis.actionVariety}/9 different actions`);
            console.log(`   🏃 Movement vs staying still: ${dataAnalysis.movementPercentage.toFixed(1)}% vs ${dataAnalysis.stillPercentage.toFixed(1)}%`);
            console.log(`   ⚡ High-danger examples: ${dataAnalysis.highDangerSituations} (${dataAnalysis.highDangerPercentage.toFixed(1)}%)`);

            // Data quality check
            const qualityScore = this.assessDataQuality(movementData);
            console.log(`📊 Data quality score: ${(qualityScore * 100).toFixed(1)}%`);

            if (qualityScore < this.dataQualityThreshold) {
                console.log(`⚠️ Data quality below threshold (${this.dataQualityThreshold}), filtering...`);
                movementData = this.filterLowQualityData(movementData);
                console.log(`📊 After filtering: ${movementData.length} examples`);
            }

            if (dataAnalysis.crowdPercentage < 10) {
                console.log(`⚠️ WARNING: Only ${dataAnalysis.crowdPercentage.toFixed(1)}% of training data contains crowd situations!`);
                console.log(`💡 For better crowd handling, record more gameplay with 4+ enemies nearby`);
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
            if (this.usePureImitation) {
                console.log(`🎭 Pure Imitation Mode: Model will learn ONLY from your patterns (no hardcoded rules)`);
            }

            // Update learning rate if this is continued training
            if (this.isMovementModelTrained) {
                this.movementModel.optimizer.learningRate = learningRate;
            }

            const history = await this.movementModel.fit(statesTensor, actionsTensor, {
                epochs: epochs,
                batchSize: batchSize,
                validationSplit: 0.2,
                shuffle: true,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
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

            // TRAINING RESULT ANALYSIS
            if (finalAcc < 0.3) {
                console.log(`⚠️ LOW ACCURACY (${(finalAcc * 100).toFixed(1)}%) - AI may not have learned your patterns well`);
                console.log(`💡 Try: More training data, or check if you're using consistent movement patterns`);
            } else if (finalAcc > 0.7) {
                console.log(`🎉 HIGH ACCURACY (${(finalAcc * 100).toFixed(1)}%) - AI should imitate your behavior well!`);
            }

            if (Math.abs(finalAcc - finalValAcc) > 0.2) {
                console.log(`⚠️ OVERFITTING: Training acc=${(finalAcc * 100).toFixed(1)}% vs Validation acc=${(finalValAcc * 100).toFixed(1)}%`);
                console.log(`💡 Try: More diverse training data or reduce model complexity`);
            }

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

    analyzeTrainingData(movementData) {
        const actionCounts = {};
        let crowdSituations = 0;
        let highDangerSituations = 0;
        let movementActions = 0;

        movementData.forEach(example => {
            // Count actions
            actionCounts[example.action] = (actionCounts[example.action] || 0) + 1;

            // Count movement vs staying still
            if (example.action !== 0) {
                movementActions++;
            }

            // Analyze spatial grid for crowd detection
            if (example.state && example.state.length >= 136) {
                const spatialGridStart = 8; // After basic + boundary features
                const spatialFeatures = example.state.slice(spatialGridStart);

                // Count occupied grid cells (even indices are enemy counts)
                let totalEnemies = 0;
                let occupiedCells = 0;
                for (let i = 0; i < spatialFeatures.length; i += 2) {
                    const enemyCount = spatialFeatures[i];
                    if (enemyCount > 0) {
                        occupiedCells++;
                        totalEnemies += enemyCount * 10; // Denormalize (we normalized by dividing by 10)
                    }
                }

                // Crowd situation: 4+ enemies nearby OR 3+ occupied cells
                if (totalEnemies >= 4 || occupiedCells >= 3) {
                    crowdSituations++;
                }

                // High danger: 6+ enemies OR 4+ occupied cells
                if (totalEnemies >= 6 || occupiedCells >= 4) {
                    highDangerSituations++;
                }
            }
        });

        return {
            actionVariety: Object.keys(actionCounts).length,
            crowdSituations: crowdSituations,
            crowdPercentage: (crowdSituations / movementData.length) * 100,
            highDangerSituations: highDangerSituations,
            highDangerPercentage: (highDangerSituations / movementData.length) * 100,
            movementPercentage: (movementActions / movementData.length) * 100,
            stillPercentage: ((movementData.length - movementActions) / movementData.length) * 100,
            actionDistribution: actionCounts
        };
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
                    const action = ex.action;
                    const isGoodMove = this.isMovementAwayFromBoundary(x, y, action);
                    if (isGoodMove) goodMovementCount++;
                }
            }
        });

        return nearBoundaryCount > 0 ? goodMovementCount / nearBoundaryCount : 1;
    }

    isMovementAwayFromBoundary(x, y, action) {
        const actionMap = [
            [0, 0], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]
        ];

        const [dx, dy] = actionMap[action] || [0, 0];

        if (x < 0.15 && dx > 0) return true;
        if (x > 0.85 && dx < 0) return true;
        if (y < 0.15 && dy > 0) return true;
        if (y > 0.85 && dy < 0) return true;

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
        const actionCounts = {};
        data.forEach(ex => {
            actionCounts[ex.action] = (actionCounts[ex.action] || 0) + 1;
        });

        const stayStillCount = actionCounts[0] || 0;
        const maxStayStillAllowed = Math.floor(data.length * 0.3);

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

        if (this.trainingHistory.length > 20) {
            this.trainingHistory.shift();
        }
    }

    calculateOptimalEpochs(dataSize) {
        let baseEpochs = 30;

        if (dataSize < 200) baseEpochs = 50;
        else if (dataSize < 500) baseEpochs = 40;
        else if (dataSize > 2000) baseEpochs = 25;

        if (this.isMovementModelTrained && this.trainingHistory.length > 0) {
            baseEpochs = Math.max(15, Math.floor(baseEpochs * 0.7));
        }

        return baseEpochs;
    }

    calculateOptimalBatchSize(dataSize) {
        return Math.min(64, Math.max(16, Math.floor(dataSize / 50)));
    }

    calculateLearningRate() {
        if (!this.isMovementModelTrained) {
            return 0.001;
        }

        const trainingsSinceImprovement = this.performanceMetrics.lastImprovement ?
            this.performanceMetrics.trainingCount - this.trainingHistory.findIndex(h =>
                h.timestamp.getTime() === this.performanceMetrics.lastImprovement.getTime()
            ) : this.performanceMetrics.trainingCount;

        if (trainingsSinceImprovement > 3) {
            return 0.0005;
        }

        return 0.001;
    }

    // MODEL SAVE/LOAD with JSON support
    async saveMovementModelAdvanced() {
        if (!this.movementModel) {
            alert("No movement model to save!");
            return;
        }

        const modelName = prompt("Model name:", `enhanced_movement_${Date.now()}`);
        if (!modelName) return;

        try {
            // For models this size, we know they'll likely exceed storage quota
            // So default to JSON download for user models
            console.log("💾 Saving model as JSON download (recommended for model portability)");
            const success = await this.saveToJSON(modelName, true); // Force download
            if (success) {
                alert(`✅ Model saved as download: ${modelName}.json\n\nThis is the recommended format for sharing and backup.`);
                return;
            }

            // If JSON save fails, try browser storage as fallback
            console.log("⚠️ JSON save failed, trying browser storage...");
            await this.movementModel.save(`localstorage://${modelName}`);
            alert(`✅ Model saved to browser storage: ${modelName}\n\nNote: This may not work for large models.`);

        } catch (error) {
            console.error("Save failed:", error);

            if (error.message.includes("quota") || error.message.includes("storage") || error.message.includes("QuotaExceededError")) {
                // Storage is full - force download
                console.log("💾 Storage full, forcing download...");
                try {
                    await this.saveToJSON(modelName, true);
                    alert(`⚠️ Browser storage full!\n\n✅ Model saved as download: ${modelName}.json\n\nUse the JSON file to reload your model later.`);
                } catch (downloadError) {
                    alert(`❌ Failed to save model: ${downloadError.message}`);
                }
            } else {
                alert(`❌ Failed to save model: ${error.message}`);
            }
        }
    }

    async loadMovementModelAdvanced() {
        const option = prompt(`Load model from:
1. Local storage (enter '1' or storage name)
2. JSON file upload (enter '2')
3. Enter a specific storage name

Recommended: Use option 2 for JSON files`);

        if (!option) return;

        try {
            if (option === "2") {
                // JSON file upload with better error handling
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    try {
                        console.log(`📥 Loading JSON file: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
                        const text = await file.text();
                        const modelData = JSON.parse(text);

                        // Validate JSON structure
                        if (!modelData.architecture || !modelData.weights) {
                            throw new Error("Invalid model file: missing required data");
                        }

                        const success = await this.loadFromJSON(modelData);
                        if (success) {
                            alert(`✅ Model loaded successfully!\n\nModel: ${modelData.modelName || 'Unknown'}\nTraining sessions: ${modelData.trainingMetrics?.trainingCount || 0}`);
                        } else {
                            alert("❌ Failed to load model - check console for details");
                        }
                    } catch (parseError) {
                        console.error("File loading error:", parseError);
                        alert(`❌ Failed to load file: ${parseError.message}`);
                    }
                };
                input.click();
                return;
            }

            // Local storage load
            const modelName = option === "1" ? prompt("Storage model name to load:") : option;
            if (!modelName) return;

            console.log(`📥 Loading from storage: ${modelName}`);
            this.movementModel = await tf.loadLayersModel(`localstorage://${modelName}`);
            this.isMovementModelTrained = true;
            console.log(`✅ Model loaded from storage: ${modelName}`);
            alert(`✅ Model loaded from storage: ${modelName}`);

        } catch (error) {
            console.error("Load failed:", error);
            if (error.message.includes("localstorage://")) {
                alert(`❌ Model not found in storage: ${error.message}\n\nTry using option 2 to load a JSON file instead.`);
            } else {
                alert(`❌ Failed to load model: ${error.message}`);
            }
        }
    }

    async saveToJSON(modelName, forceDownload = false) {
        try {
            // Use the proper TensorFlow.js save format instead of toJSON()
            const saveResult = await this.movementModel.save(tf.io.withSaveHandler(async (artifacts) => {
                const modelData = {
                    version: this.modelVersion,
                    modelName: modelName,
                    timestamp: new Date().toISOString(),
                    modelArtifacts: artifacts,  // This is the correct TF.js format
                    trainingMetrics: this.performanceMetrics,
                    trainingHistory: this.trainingHistory.slice(-5),
                    // Add diagnostics for debugging
                    diagnostics: {
                        stateSize: 136,
                        actionSize: 9,
                        usePureImitation: this.usePureImitation,
                        spatialGridEnabled: this.useSpatialGrid
                    }
                };

                const jsonString = JSON.stringify(modelData);
                const blob = new Blob([jsonString], { type: 'application/json' });

                // Always force download for models > 300KB to avoid storage issues
                const sizeLimit = 300 * 1024; // 300KB limit
                if (forceDownload || blob.size > sizeLimit) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${modelName}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    console.log(`📥 Model saved as download: ${modelName}.json (${(blob.size / 1024).toFixed(2)}KB)`);
                    return { responses: [{ status: 200 }] };
                }

                try {
                    localStorage.setItem(`imitationLearning_${modelName}`, jsonString);
                    console.log(`💾 Model saved to localStorage: ${modelName} (${(blob.size / 1024).toFixed(2)}KB)`);
                    return { responses: [{ status: 200 }] };
                } catch (storageError) {
                    // Fallback to download if storage fails
                    console.log(`⚠️ Storage failed, downloading instead: ${storageError.message}`);
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${modelName}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    console.log(`📥 Model saved as download (fallback): ${modelName}.json`);
                    return { responses: [{ status: 200 }] };
                }
            }));

            return true;

        } catch (error) {
            console.error("JSON save error:", error);
            return false;
        }
    }

    async loadFromJSON(modelData) {
        try {
            console.log(`📥 Loading model: ${modelData.modelName} (version ${modelData.version})`);

            // Validate the data structure - check for TensorFlow.js model artifacts
            if (!modelData.modelArtifacts) {
                throw new Error("Invalid model data: missing TensorFlow.js model artifacts");
            }

            // Load model using TensorFlow.js IO handler
            this.movementModel = await tf.loadLayersModel(tf.io.fromMemory(modelData.modelArtifacts));

            // Restore training state
            if (modelData.trainingMetrics) {
                this.performanceMetrics = { ...this.performanceMetrics, ...modelData.trainingMetrics };
            }

            if (modelData.trainingHistory) {
                this.trainingHistory = modelData.trainingHistory.map(h => ({
                    ...h,
                    timestamp: new Date(h.timestamp)
                }));
            }

            // Log diagnostics if available
            if (modelData.diagnostics) {
                console.log(`📊 Model diagnostics:`, modelData.diagnostics);
            }

            this.isMovementModelTrained = true;
            console.log(`✅ Model loaded successfully with ${this.performanceMetrics.trainingCount || 0} training sessions`);
            console.log(`📊 Model accuracy: ${(this.performanceMetrics.bestAccuracy * 100).toFixed(1)}%`);
            return true;

        } catch (error) {
            console.error("JSON load error:", error);
            // Clean up any partially loaded model
            if (this.movementModel) {
                try {
                    this.movementModel.dispose();
                } catch (e) {
                    // Ignore cleanup errors
                }
                this.movementModel = null;
            }
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

            const jsonString = JSON.stringify(autoSaveData);
            const sizeKB = jsonString.length / 1024;

            // Only auto-save to localStorage if it's small enough (< 200KB)
            if (sizeKB < 200) {
                try {
                    localStorage.setItem('imitationLearning_enhanced_model', jsonString);
                    console.log(`💾 Model auto-saved (${sizeKB.toFixed(1)}KB)`);
                } catch (storageError) {
                    console.log(`⚠️ Auto-save skipped - storage full (model: ${sizeKB.toFixed(1)}KB)`);
                }
            } else {
                console.log(`⚠️ Auto-save skipped - model too large (${sizeKB.toFixed(1)}KB > 200KB limit)`);
                console.log("💡 Use manual save to download model as JSON file");
            }

        } catch (error) {
            console.log("⚠️ Auto-save failed:", error.message);
        }
    }

    // AI MOVEMENT with enhanced action selection
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

            const action = this.selectSmartAction(state, probabilities);

            if (this.debugMode && Math.random() < 0.1) {
                const actionNames = ['Stay', 'Up', 'Up-Right', 'Right', 'Down-Right', 'Down', 'Down-Left', 'Left', 'Up-Left'];
                console.log(`🏃 AI: ${actionNames[action]} (${(probabilities[action] * 100).toFixed(1)}%)`);
            }

            stateTensor.dispose();
            prediction.dispose();

            return action;

        } catch (error) {
            console.error("Action choice error:", error);
            return 0;
        }
    }

    selectSmartAction(state, probabilities) {
        const playerX = state[0];
        const playerY = state[1];

        const smartProbabilities = Array.from(probabilities);

        if (this.usePureImitation) {
            // PURE IMITATION MODE: Only apply critical boundary safety, let NN handle everything else
            this.applyMinimalBoundarySafety(playerX, playerY, smartProbabilities);

            if (this.debugMode && Math.random() < 0.05) {
                console.log("🎭 Pure Imitation: Letting neural network decide based on learned patterns");
            }
        } else {
            // ASSISTED MODE: Apply hardcoded rules
            this.applyBoundarySafety(playerX, playerY, smartProbabilities);

            if (this.useEnhancedEnemyAvoidance) {
                this.stateExtractor.updateResolution();
                const absoluteX = playerX * this.stateExtractor.gameWidth;
                const absoluteY = playerY * this.stateExtractor.gameHeight;
                this.applyEnemyAvoidance(absoluteX, absoluteY, smartProbabilities);
            }
        }

        return this.sampleFromProbabilities(smartProbabilities);
    }

    applyMinimalBoundarySafety(playerX, playerY, probabilities) {
        // Only prevent immediate boundary collisions - much more permissive
        const criticalThreshold = 0.05; // Only 5% from edge (vs 12% before)

        const actionMap = [
            [0, 0], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]
        ];

        actionMap.forEach((dir, actionIndex) => {
            const [dx, dy] = dir;
            const newX = playerX + dx * 0.02; // Smaller prediction step
            const newY = playerY + dy * 0.02;

            // Only penalize if it would cause immediate boundary collision
            if (newX < criticalThreshold || newX > (1 - criticalThreshold) ||
                newY < criticalThreshold || newY > (1 - criticalThreshold)) {
                probabilities[actionIndex] *= 0.3; // Less severe penalty (30% vs 5%)
            }
        });
    }

    applyBoundarySafety(playerX, playerY, probabilities) {
        const boundaryThreshold = 0.12;

        const actionMap = [
            [0, 0], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]
        ];

        actionMap.forEach((dir, actionIndex) => {
            const [dx, dy] = dir;
            const newX = playerX + dx * 0.05;
            const newY = playerY + dy * 0.05;

            if (newX < boundaryThreshold || newX > (1 - boundaryThreshold) ||
                newY < boundaryThreshold || newY > (1 - boundaryThreshold)) {
                probabilities[actionIndex] *= 0.05;
            }
        });
    }

    applyEnemyAvoidance(playerX, playerY, probabilities) {
        try {
            const enemies = window.EnemySystem?.enemiesGroup?.getChildren() || [];
            const activeEnemies = enemies.filter(enemy => enemy?.active && enemy.x !== undefined);

            if (activeEnemies.length === 0) return;

            // Calculate overall danger density around player
            const dangerRadius = 120;
            const nearbyEnemies = activeEnemies.filter(enemy => {
                const dist = Math.sqrt(
                    Math.pow(enemy.x - playerX, 2) +
                    Math.pow(enemy.y - playerY, 2)
                );
                return dist < dangerRadius;
            });

            const dangerDensity = nearbyEnemies.length;
            const isCrowded = dangerDensity >= 4; // 4+ enemies = crowded situation

            if (this.debugMode && isCrowded && Math.random() < 0.1) {
                console.log(`🚨 CROWDED: ${dangerDensity} enemies within ${dangerRadius}px`);
            }

            const actionMap = [
                [0, 0], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]
            ];

            if (isCrowded) {
                // CROWDED SITUATION: Use enhanced escape logic
                this.applyCrowdedEscape(playerX, playerY, nearbyEnemies, probabilities, actionMap);
            } else {
                // NORMAL SITUATION: Use standard avoidance
                this.applyStandardAvoidance(playerX, playerY, activeEnemies, probabilities, actionMap);
            }

        } catch (e) {
            // Silent fail
        }
    }

    applyCrowdedEscape(playerX, playerY, nearbyEnemies, probabilities, actionMap) {
        // In crowded situations, find the direction with the lowest enemy density
        const escapeRadius = 80;
        const actionDangers = [];

        actionMap.forEach((dir, actionIndex) => {
            const moveDistance = 40; // Look further ahead when crowded
            const futureX = playerX + dir[0] * moveDistance;
            const futureY = playerY + dir[1] * moveDistance;

            let totalDanger = 0;
            let enemyCount = 0;

            nearbyEnemies.forEach(enemy => {
                // Predict enemy position (they move toward player)
                const enemyToPlayerX = playerX - enemy.x;
                const enemyToPlayerY = playerY - enemy.y;
                const enemyToPlayerDist = Math.sqrt(enemyToPlayerX * enemyToPlayerX + enemyToPlayerY * enemyToPlayerY);

                let futureEnemyX = enemy.x;
                let futureEnemyY = enemy.y;

                if (enemyToPlayerDist > 0) {
                    const enemySpeed = 20; // Assume slightly faster enemy movement
                    futureEnemyX += (enemyToPlayerX / enemyToPlayerDist) * enemySpeed;
                    futureEnemyY += (enemyToPlayerY / enemyToPlayerDist) * enemySpeed;
                }

                const futureDist = Math.sqrt(
                    Math.pow(futureEnemyX - futureX, 2) +
                    Math.pow(futureEnemyY - futureY, 2)
                );

                if (futureDist < escapeRadius) {
                    enemyCount++;
                    const dangerIntensity = (escapeRadius - futureDist) / escapeRadius;
                    totalDanger += dangerIntensity * 2; // Higher penalty in crowded situations
                }
            });

            actionDangers.push({ actionIndex, danger: totalDanger, enemyCount });
        });

        // Find the least dangerous directions
        actionDangers.sort((a, b) => a.danger - b.danger);
        const safestActions = actionDangers.slice(0, 3); // Top 3 safest directions

        // Heavily penalize dangerous actions
        actionDangers.forEach(actionData => {
            if (actionData.danger > 0) {
                // More severe penalties for crowded situations
                const penaltyMultiplier = Math.min(actionData.danger * 3, 0.95); // Up to 95% penalty
                probabilities[actionData.actionIndex] *= (1 - penaltyMultiplier);
            }
        });

        // Boost the safest actions significantly
        safestActions.forEach((actionData, index) => {
            if (actionData.danger < safestActions[0].danger + 0.5) { // If reasonably safe
                const boost = index === 0 ? 5.0 : (index === 1 ? 3.0 : 2.0); // Bigger boosts
                probabilities[actionData.actionIndex] *= boost;
            }
        });

        // NEVER stay still when crowded
        probabilities[0] *= 0.001; // 99.9% penalty for staying still

        if (this.debugMode && Math.random() < 0.1) {
            const safest = safestActions[0];
            const actionNames = ['Stay', 'Up', 'Up-Right', 'Right', 'Down-Right', 'Down', 'Down-Left', 'Left', 'Up-Left'];
            console.log(`🏃 Crowded escape: ${actionNames[safest.actionIndex]} (danger: ${safest.danger.toFixed(2)})`);
        }
    }

    applyStandardAvoidance(playerX, playerY, activeEnemies, probabilities, actionMap) {
        // Standard avoidance logic for normal situations
        actionMap.forEach((dir, actionIndex) => {
            const moveDistance = 25;
            const futureX = playerX + dir[0] * moveDistance;
            const futureY = playerY + dir[1] * moveDistance;

            let totalDanger = 0;

            activeEnemies.forEach(enemy => {
                const currentDist = Math.sqrt(
                    Math.pow(enemy.x - playerX, 2) +
                    Math.pow(enemy.y - playerY, 2)
                );

                // Only consider enemies within reasonable distance
                if (currentDist > 150) return;

                const enemyMoveDistance = 15;
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

                const dangerRadius = 80;
                if (futureDist < dangerRadius) {
                    const dangerIntensity = (dangerRadius - futureDist) / dangerRadius;
                    totalDanger += dangerIntensity;

                    // Extra penalty if we're moving toward the enemy
                    if (futureDist < currentDist) {
                        totalDanger += 0.5;
                    }
                }
            });

            // Apply danger penalty to action probability
            if (totalDanger > 0) {
                const penaltyFactor = Math.max(0.1, 1 - totalDanger);
                probabilities[actionIndex] *= penaltyFactor;
            }
        });
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

            if (this.currentGameMode === 'movement') {
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

            } else if (this.currentGameMode === 'levelup' && this.perkLearningEnabled) {
                // Record level-up state for potential perk selection learning
                this.recordLevelUpState(state, now);
            }

        } catch (error) {
            console.error("Recording error:", error);
        }
    }

    recordLevelUpState(state, timestamp) {
        // Record the game state when level-up happens
        // We'll capture the perk choice when it actually occurs
        this.pendingLevelUpState = {
            state: state.slice(),
            timestamp: timestamp - this.recordingStartTime,
            playerLevel: window.playerLevel || 1,
            playerHealth: window.playerHealth || 100,
            elapsedTime: window.elapsedTime || 0
        };
    }

    recordPerkSelection(perkId) {
        // This should be called when a perk is selected
        if (!this.perkLearningEnabled || !this.pendingLevelUpState) return;

        const perkExample = {
            ...this.pendingLevelUpState,
            selectedPerk: perkId,
            gameMode: 'levelup'
        };

        this.perkSelectionData.push(perkExample);
        this.recordingData.push(perkExample);

        console.log(`🎯 Recorded perk choice: ${perkId} (total: ${this.perkSelectionData.length})`);
        this.pendingLevelUpState = null;
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
        console.log(`🧠 Training on ${this.recordingData.length} examples (Pure Imitation Mode: ${this.usePureImitation ? 'ON' : 'OFF'})`);

        try {
            const movementData = this.recordingData.filter(ex => ex.gameMode === 'movement');
            const perkData = this.recordingData.filter(ex => ex.gameMode === 'levelup' && ex.selectedPerk);

            let success = false;

            // Train movement model
            if (movementData.length >= this.minTrainingData) {
                console.log(`🏃 Training movement model with ${movementData.length} examples`);
                success = await this.trainMovementModel(movementData);
            }

            // Train perk selection model if we have enough data
            if (perkData.length >= 10) { // Need fewer examples for perk selection
                console.log(`🎯 Training perk model with ${perkData.length} examples`);
                // TODO: Implement perk model training
                console.log("🎯 Perk learning: Coming soon!");
            } else if (perkData.length > 0) {
                console.log(`🎯 Perk data collected: ${perkData.length}/10 examples needed`);
            }

            if (success) {
                console.log("✅ Training completed successfully");
                if (this.usePureImitation) {
                    console.log("🎭 Model trained in PURE IMITATION mode - learned your patterns without hardcoded rules");
                }
                return true;
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

    // DATA EXPORT
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
            modelMetrics: this.performanceMetrics,
            spatialGridStats: this.spatialGridStats
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

    // LEVEL UP HANDLING
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

    // FIXED UI - removed problematic element references
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
                <div><strong>🎭 Pure Imitation Learning v1.1</strong></div>
                <div>Recording: <span id="recording-status">Off</span></div>
                <div>Training: <span id="training-status">Ready</span></div>
                <div>Movement Model: <span id="model-status">Not Trained</span></div>
                <div>Perk Learning: <span id="perk-learning-status">OFF</span></div>
                <div>Mode: <span id="imitation-mode">Human Control</span></div>
                <div>Pure Imitation: <span id="pure-imitation-status">ON</span></div>
                <div>Examples: <span id="current-examples">0</span></div>
                <div>Perk Data: <span id="perk-examples">0</span></div>
                <div>Best Acc: <span id="best-accuracy">0.000</span></div>
                <div>Training #: <span id="training-count">0</span></div>
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
                    <button id="toggle-pure-mode" style="flex: 1; padding: 6px; background: #E91E63; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Pure Mode
                    </button>
                    <button id="toggle-perk-learning" style="flex: 1; padding: 6px; background: #FF5722; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Perk Learn
                    </button>
                </div>
                
                <div style="display: flex; gap: 3px;">
                    <button id="save-model-adv" style="flex: 1; padding: 6px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Save Model
                    </button>
                    <button id="load-model-adv" style="flex: 1; padding: 6px; background: #E91E63; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Load Model
                    </button>
                </div>
                
                <div style="display: flex; gap: 3px;">
                    <button id="test-grid" style="flex: 1; padding: 6px; background: #9E9E9E; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Test Grid
                    </button>
                    <button id="toggle-debug" style="flex: 1; padding: 6px; background: #795548; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        Debug
                    </button>
                </div>
            </div>
            
            <div style="margin-top: 8px; font-size: 10px; color: #aaa;">
                ${this.usePureImitation ?
                "🎭 PURE MODE: AI learns only from your behavior" :
                "🤖 ASSISTED: AI uses learned patterns + safety rules"}
            </div>
        `;

        document.body.appendChild(ui);

        // FIXED: Only set onclick for elements that actually exist
        const toggleRecording = document.getElementById('toggle-recording');
        if (toggleRecording) {
            toggleRecording.onclick = () => {
                if (this.isRecording) this.stopRecording();
                else this.startRecording();
            };
        }

        const trainCurrent = document.getElementById('train-current');
        if (trainCurrent) {
            trainCurrent.onclick = () => this.trainOnCurrentSession();
        }

        const toggleImitation = document.getElementById('toggle-imitation');
        if (toggleImitation) {
            toggleImitation.onclick = () => this.toggleImitationMode();
        }

        const saveModel = document.getElementById('save-model-adv');
        if (saveModel) {
            saveModel.onclick = () => this.saveMovementModelAdvanced();
        }

        const loadModel = document.getElementById('load-model-adv');
        if (loadModel) {
            loadModel.onclick = () => this.loadMovementModelAdvanced();
        }

        const exportSession = document.getElementById('export-session-adv');
        if (exportSession) {
            exportSession.onclick = () => this.exportAdvancedSession();
        }

        const toggleSpatialGrid = document.getElementById('toggle-spatial-grid');
        if (toggleSpatialGrid) {
            toggleSpatialGrid.onclick = () => {
                this.useSpatialGrid = !this.useSpatialGrid;
                console.log(`🗺️ Spatial grid: ${this.useSpatialGrid ? 'ON' : 'OFF'}`);
                this.updateUI();
            };
        }

        const togglePureMode = document.getElementById('toggle-pure-mode');
        if (togglePureMode) {
            togglePureMode.onclick = () => {
                this.usePureImitation = !this.usePureImitation;
                // When switching to pure mode, disable hardcoded assists
                if (this.usePureImitation) {
                    this.useEnhancedEnemyAvoidance = false;
                    this.useEscapeRouteAnalysis = false;
                    console.log("🎭 Pure Imitation Mode: ON - AI will learn only from your behavior");
                } else {
                    console.log("🤖 Assisted Mode: ON - AI uses learned patterns + safety rules");
                }
                this.updateUI();
            };
        }

        const togglePerkLearning = document.getElementById('toggle-perk-learning');
        if (togglePerkLearning) {
            togglePerkLearning.onclick = () => {
                this.perkLearningEnabled = !this.perkLearningEnabled;
                console.log(`🎯 Perk learning: ${this.perkLearningEnabled ? 'ON' : 'OFF'}`);
                this.updateUI();
            };
        }

        const testGrid = document.getElementById('test-grid');
        if (testGrid) {
            testGrid.onclick = () => this.testSpatialGrid();
        }

        const toggleDebug = document.getElementById('toggle-debug');
        if (toggleDebug) {
            toggleDebug.onclick = () => {
                this.debugMode = !this.debugMode;
                console.log(`🔍 Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
                this.updateUI();
            };
        }
    }

    testSpatialGrid() {
        console.log("🧪 Testing spatial grid...");
        try {
            const state = this.stateExtractor.getState('movement');
            if (state) {
                console.log(`🧪 State generated: ${state.length} features`);
                console.log(`🧪 First 10 features: [${state.slice(0, 10).map(f => f.toFixed(3)).join(', ')}]`);
                console.log(`🧪 Spatial grid stats: ${JSON.stringify(this.spatialGridStats)}`);
            } else {
                console.log("🧪 Failed to generate state");
            }
        } catch (error) {
            console.error("🧪 Test failed:", error);
        }
    }

    updateUI() {
        const perkDataCount = this.recordingData.filter(ex => ex.gameMode === 'levelup' && ex.selectedPerk).length;

        const elements = {
            'recording-status': this.isRecording ? 'Recording...' : 'Off',
            'training-status': this.isTraining ? 'Training...' : 'Ready',
            'model-status': this.isMovementModelTrained ? 'Trained' : 'Not Trained',
            'perk-learning-status': this.perkLearningEnabled ? 'ON' : 'OFF',
            'imitation-mode': this.isUsingImitationMode ? 'AI Control' : 'Human Control',
            'pure-imitation-status': this.usePureImitation ? 'ON' : 'OFF',
            'current-examples': this.recordingData.length.toString(),
            'perk-examples': perkDataCount.toString(),
            'best-accuracy': this.performanceMetrics.bestAccuracy.toFixed(3),
            'training-count': this.performanceMetrics.trainingCount.toString()
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

        const perkLearningEl = document.getElementById('perk-learning-status');
        if (perkLearningEl) perkLearningEl.style.color = this.perkLearningEnabled ? '#44ff44' : '#888';

        const modeEl = document.getElementById('imitation-mode');
        if (modeEl) modeEl.style.color = this.isUsingImitationMode ? '#9C27B0' : '#44ff44';

        const pureEl = document.getElementById('pure-imitation-status');
        if (pureEl) pureEl.style.color = this.usePureImitation ? '#E91E63' : '#888';

        // Update footer text based on mode
        const footerDiv = document.querySelector('#imitation-interface div:last-child');
        if (footerDiv) {
            footerDiv.innerHTML = this.usePureImitation ?
                "🎭 PURE MODE: AI learns only from your behavior" :
                "🤖 ASSISTED: AI uses learned patterns + safety rules";
        }
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
 * SIMPLIFIED STATE EXTRACTOR with FIXED spatial grid
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

        console.log(`🧠 State extractor initialized (${this.gameWidth}x${this.gameHeight})`);
        console.log(`🗺️ Spatial grid: 8×8 = 64 cells × 2 features = 128 spatial features`);
        console.log(`🧠 Total state: 8 basic + 128 spatial = 136 features`);
    }

    getState(mode = 'movement') {
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

        this.updateResolution();

        try {
            const state = [
                // Basic player info (8 features - expanded from 4)
                gamePlayer.x / this.gameWidth,  // 0: normalized x position
                gamePlayer.y / this.gameHeight, // 1: normalized y position
                (window.playerHealth || playerHealth || 100) / (window.maxPlayerHealth || maxPlayerHealth || 100), // 2: health ratio
                Math.min((window.elapsedTime || elapsedTime || 0) / 1800, 1), // 3: time progress (0-30min)

                // Boundary distances (4 features)
                gamePlayer.x / this.gameWidth, // 4: distance to left edge
                (this.gameWidth - gamePlayer.x) / this.gameWidth, // 5: distance to right edge
                gamePlayer.y / this.gameHeight, // 6: distance to top edge
                (this.gameHeight - gamePlayer.y) / this.gameHeight, // 7: distance to bottom edge

                // Enhanced spatial grid enemy tracking (128 features)
                ...this.getSpatialGridEnemyData(gamePlayer)
            ];

            this.lastState = state;
            return state;

        } catch (error) {
            console.error("State extraction error:", error);
            return this.lastState;
        }
    }

    getSpatialGridEnemyData(player) {
        // Update call tracking for diagnostics
        const imitationSystem = window.imitationLearning;
        if (imitationSystem) {
            imitationSystem.spatialGridStats.callCount++;
            imitationSystem.spatialGridStats.lastCallTime = Date.now();
        }

        try {
            // Enhanced enemy system access with better error handling
            const enemySystem = window.EnemySystem;
            if (!enemySystem) {
                console.warn("🗺️ EnemySystem not found");
                return new Array(128).fill(0.5);
            }

            const enemiesGroup = enemySystem.enemiesGroup;
            if (!enemiesGroup) {
                console.warn("🗺️ enemiesGroup not found");
                return new Array(128).fill(0.5);
            }

            const allEnemies = enemiesGroup.getChildren();
            if (!allEnemies) {
                console.warn("🗺️ getChildren() returned null/undefined");
                return new Array(128).fill(0.5);
            }

            const activeEnemies = allEnemies.filter(enemy => enemy?.active && enemy.x !== undefined && enemy.y !== undefined);

            // Update enemy count for diagnostics
            if (imitationSystem) {
                imitationSystem.spatialGridStats.lastEnemyCount = activeEnemies.length;
            }

            // Debug logging
            if (imitationSystem?.debugMode && Math.random() < 0.05) { // 5% chance to log
                console.log(`🗺️ Spatial Grid Debug: ${activeEnemies.length} enemies found (${allEnemies.length} total)`);
            }

            // Create 8x8 spatial grid = 64 cells
            const gridSize = 8;
            const cellWidth = this.gameWidth / gridSize;
            const cellHeight = this.gameHeight / gridSize;

            // Initialize grid: each cell tracks [enemyCount, closestEnemyDistance]
            const grid = [];
            for (let i = 0; i < gridSize * gridSize; i++) {
                grid.push({ count: 0, closestDistance: Infinity });
            }

            // Populate grid with enemy data
            activeEnemies.forEach(enemy => {
                // Determine which grid cell this enemy is in
                const cellX = Math.floor(Math.min(Math.max(enemy.x / cellWidth, 0), gridSize - 1));
                const cellY = Math.floor(Math.min(Math.max(enemy.y / cellHeight, 0), gridSize - 1));
                const cellIndex = cellY * gridSize + cellX;

                if (cellIndex >= 0 && cellIndex < grid.length) {
                    grid[cellIndex].count++;

                    // Calculate distance from player to this enemy
                    const distanceToPlayer = Math.sqrt(
                        Math.pow(enemy.x - player.x, 2) +
                        Math.pow(enemy.y - player.y, 2)
                    );

                    // Track closest enemy in this cell
                    if (distanceToPlayer < grid[cellIndex].closestDistance) {
                        grid[cellIndex].closestDistance = distanceToPlayer;
                    }
                }
            });

            // Convert grid to feature array (128 features: 64 cells × 2 features per cell)
            const features = [];
            const maxDistance = Math.sqrt(this.gameWidth * this.gameWidth + this.gameHeight * this.gameHeight);

            grid.forEach(cell => {
                // Feature 1: Normalized enemy count (cap at 10 enemies per cell for normalization)
                const normalizedCount = Math.min(cell.count / 10, 1);
                features.push(normalizedCount);

                // Feature 2: Normalized distance (1 = far away, 0 = very close, 0.5 if no enemies)
                const normalizedDistance = cell.count > 0 ?
                    Math.min(cell.closestDistance / maxDistance, 1) :
                    0.5; // Neutral value when no enemies in cell
                features.push(normalizedDistance);
            });

            // Update grid occupancy for diagnostics
            if (imitationSystem) {
                const occupiedCells = grid.filter(cell => cell.count > 0).length;
                imitationSystem.spatialGridStats.lastGridOccupancy = occupiedCells;
            }

            // Enhanced debug logging
            if (imitationSystem?.debugMode && Math.random() < 0.02) { // 2% chance
                const occupiedCells = grid.filter(cell => cell.count > 0).length;
                const maxEnemiesInCell = Math.max(...grid.map(cell => cell.count));
                const totalEnemiesInGrid = grid.reduce((sum, cell) => sum + cell.count, 0);

                console.log(`🗺️ SPATIAL GRID DETAILED DEBUG:`);
                console.log(`   👾 ${activeEnemies.length} enemies detected`);
                console.log(`   📋 ${occupiedCells}/64 cells occupied`);
                console.log(`   📊 Max enemies in one cell: ${maxEnemiesInCell}`);
                console.log(`   🎯 Total enemies tracked in grid: ${totalEnemiesInGrid}`);
                console.log(`   📐 Features generated: ${features.length}`);
                console.log(`   📈 First 6 features: [${features.slice(0, 6).map(f => f.toFixed(3)).join(', ')}]`);

                if (totalEnemiesInGrid !== activeEnemies.length) {
                    console.warn(`   ⚠️ MISMATCH: ${activeEnemies.length} enemies detected but ${totalEnemiesInGrid} tracked in grid!`);
                }
            }

            return features; // Returns exactly 128 features (64 cells × 2 features per cell)

        } catch (e) {
            console.error("❌ Spatial grid error:", e);
            // Return safe fallback
            return new Array(128).fill(0.5);
        }
    }

    getLevelUpState() {
        // Simple level-up state expanded to match movement state size (136 features)
        const basicFeatures = [
            Math.min((window.playerLevel || playerLevel || 1) / 20, 1),
            (window.playerHealth || playerHealth || 100) / (window.maxPlayerHealth || maxPlayerHealth || 100),
            Math.min((window.elapsedTime || elapsedTime || 0) / 1800, 1)
        ];

        // Pad to match spatial grid state size (136 total features)
        const padding = new Array(133).fill(0); // 136 - 3 = 133
        return [...basicFeatures, ...padding];
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

console.log("🎬 Enhanced Imitation Learning System v1.1 loaded - Fixed UI and improved spatial grid!");