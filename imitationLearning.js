// imitationLearning.js - Complete Behavioral Cloning System for Game AI
// Records human gameplay and trains AI to imitate human decisions

/**
 * IMITATION LEARNING SYSTEM - Records human gameplay for behavioral cloning
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

        // Auto-training settings
        this.autoTrainingEnabled = true;
        this.lastGameOverState = false;
        this.sessionRecorded = false;

        // Training overlay
        this.trainingOverlay = null;

        // Movement control
        this.pressedKeys = new Set();

        // Debug mode
        this.debugMode = false;

        console.log("🎬 Complete Imitation Learning System initialized");
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

        // Setup auto-training detection
        this.setupAutoTraining();

        console.log("🎬 Imitation learning system ready with 60-feature state extraction");
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

    // Setup auto-training on game over detection
    setupAutoTraining() {
        setInterval(() => {
            this.checkForGameOver();
        }, 1000);
    }

    // Check if game just ended and trigger auto-training
    checkForGameOver() {
        const currentGameOverState = window.gameOver ?? (typeof gameOver !== 'undefined' ? gameOver : false);

        // Game just ended and we have recorded data
        if (currentGameOverState && !this.lastGameOverState && this.sessionRecorded && this.recordingData.length > 0) {
            console.log("🎮 Game over detected - triggering auto-training...");

            if (this.isRecording) {
                this.stopRecording();
            }

            setTimeout(() => {
                this.autoTrainOnGameOver();
            }, 2000);
        }

        this.lastGameOverState = currentGameOverState;

        // Reset session tracking when game starts again
        if (!currentGameOverState && this.lastGameOverState) {
            this.sessionRecorded = false;
        }
    }

    // Auto-train on the current session
    async autoTrainOnGameOver() {
        if (this.recordingData.length < 50) {
            console.log("📊 Session too short for auto-training, skipping...");
            return;
        }

        console.log("🤖 AUTO-TRAINING: Starting incremental model update...");
        this.showTrainingOverlay("Auto-training on your gameplay...");

        try {
            const success = await this.trainOnCurrentSession();

            if (success) {
                console.log("✅ AUTO-TRAINING: Model updated successfully!");
                this.showTrainingOverlay("Training complete! AI learned from your gameplay.", 3000);

                // Auto-save the model
                await this.saveImitationModel(`auto_trained_${Date.now()}`);
            } else {
                console.log("❌ AUTO-TRAINING: Training failed");
                this.showTrainingOverlay("Training failed - data preserved for manual training", 3000);
            }

            // Clear current session data after training
            this.recordingData = [];
            this.currentSessionName = null;

        } catch (error) {
            console.error("AUTO-TRAINING ERROR:", error);
            this.showTrainingOverlay("Auto-training error - data preserved", 3000);
        }
    }

    // Show training progress overlay
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
        this.trainingOverlay.innerHTML = `
            <div style="margin-bottom: 15px;">🤖 AI Training</div>
            <div>${message}</div>
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

        const defaultName = `session_${Date.now()}`;
        sessionName = sessionName || defaultName;

        this.isRecording = true;
        this.recordingData = [];
        this.recordingStartTime = Date.now();
        this.lastRecordTime = 0;
        this.currentSessionName = sessionName;
        this.sessionRecorded = true;

        console.log(`🔴 RECORDING STARTED: ${sessionName}`);
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
            console.log(`⏹️ RECORDING STOPPED: ${this.currentSessionName}`);
            console.log(`📊 Captured ${this.recordingData.length} examples over ${duration.toFixed(1)}s`);
        }

        this.updateUI();
    }

    // Record a single frame of gameplay
    recordFrame() {
        if (!this.isRecording || !this.scene) return;

        const now = Date.now();
        if (now - this.lastRecordTime < this.recordingInterval) return;

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
                score: window.score || 0
            };

            this.recordingData.push(example);
            this.lastRecordTime = now;

            if (this.recordingData.length % 100 === 0) {
                console.log(`📊 Recorded ${this.recordingData.length} examples`);
            }

        } catch (error) {
            console.error("Recording error:", error);
        }
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

    // Train on current session data
    async trainOnCurrentSession() {
        if (!this.tfLoaded) {
            console.error("❌ TensorFlow.js not loaded!");
            return false;
        }

        if (this.recordingData.length < 50) {
            console.error(`❌ Not enough training data! Need at least 50 examples, got ${this.recordingData.length}.`);
            return false;
        }

        console.log(`🧠 Training on current session: ${this.recordingData.length} examples`);

        try {
            const states = this.recordingData.map(ex => ex.state);
            const actions = this.recordingData.map(ex => ex.action);
            const oneHotActions = this.actionsToOneHot(actions);

            if (!this.imitationModel) {
                this.imitationModel = await this.createBehavioralCloningModel(states[0].length);
            }

            const statesTensor = tf.tensor2d(states);
            const actionsTensor = tf.tensor2d(oneHotActions);

            const history = await this.imitationModel.fit(statesTensor, actionsTensor, {
                epochs: this.isModelTrained ? 20 : 50,
                batchSize: 32,
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
            this.updateUI();

            return true;

        } catch (error) {
            console.error("Training error:", error);
            return false;
        }
    }

    // Create behavioral cloning neural network
    async createBehavioralCloningModel(stateSize) {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [stateSize],
                    units: 64,
                    activation: 'relu'
                }),
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

        model.compile({
            optimizer: tf.train.adam(0.001),
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

    // Use imitation model to choose action
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
                console.log(`🎭 IMITATION: Action ${action} (${actionNames[action]})`);
            }

            stateTensor.dispose();
            prediction.dispose();

            return action;
        } catch (error) {
            console.error("Imitation action error:", error);
            return 0;
        }
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
            console.log("🎭 Imitation mode: ON");
        } else {
            console.log("🎭 Imitation mode: OFF");
            this.releaseAllMovementKeys();
        }

        this.updateUI();
    }

    // Control player movement when in imitation mode
    async controlMovement() {
        if (!this.isUsingImitationMode || !this.isModelTrained) return;

        const now = Date.now();
        if (now - this.lastDecisionTime < this.decisionInterval) return;

        const state = this.stateExtractor?.getState();
        if (!state) return;

        const action = await this.chooseImitationAction(state);
        this.executeAction(action);

        this.lastDecisionTime = now;
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

    // Save trained model
    async saveImitationModel(name = null) {
        if (!this.imitationModel) {
            console.log("❌ No model to save!");
            return;
        }

        const modelName = name || `imitation_model_${Date.now()}`;

        try {
            await this.imitationModel.save(`localstorage://${modelName}`);
            console.log(`✅ Imitation model saved: ${modelName}`);
        } catch (error) {
            console.error("Save failed:", error);
        }
    }

    // Load trained model
    async loadImitationModel(name = null) {
        const modelName = name || prompt("Model name to load:");
        if (!modelName) return;

        try {
            this.imitationModel = await tf.loadLayersModel(`localstorage://${modelName}`);
            this.isModelTrained = true;
            console.log(`✅ Imitation model loaded: ${modelName}`);
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
        if (!this.importedData || this.importedData.length < 50) {
            console.log("❌ No imported data or not enough examples");
            return false;
        }

        console.log(`🧠 Training on imported data: ${this.importedData.length} examples`);
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

            const history = await this.imitationModel.fit(statesTensor, actionsTensor, {
                epochs: 50,
                batchSize: 32,
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
        }
    }

    // Export current session data
    exportCurrentSession() {
        if (this.recordingData.length === 0) {
            console.log("❌ No current session data to export");
            return;
        }

        const compressed = {
            version: 2,
            count: this.recordingData.length,
            states: this.recordingData.map(ex => ex.state),
            actions: this.recordingData.map(ex => ex.action)
        };

        const blob = new Blob([JSON.stringify(compressed)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `imitation_session_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`📥 Exported ${this.recordingData.length} examples`);
    }

    // Create UI for imitation learning controls
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
            min-width: 240px;
        `;

        ui.innerHTML = `
            <div style="margin-bottom: 10px;">
                <div><strong>🎬 Imitation Learning</strong></div>
                <div>Recording: <span id="recording-status">Off</span></div>
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
                Records, trains, and imitates your gameplay
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
            console.log(`🔍 Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
        };
        document.getElementById('save-model').onclick = () => this.saveImitationModel();
        document.getElementById('load-model').onclick = () => this.loadImitationModel();
    }

    // Update UI display
    updateUI() {
        const recordingStatus = document.getElementById('recording-status');
        const modelStatus = document.getElementById('model-status');
        const imitationMode = document.getElementById('imitation-mode');
        const currentExamples = document.getElementById('current-examples');
        const importedExamples = document.getElementById('imported-examples');
        const toggleRecordingBtn = document.getElementById('toggle-recording');

        if (recordingStatus) {
            recordingStatus.textContent = this.isRecording ? 'Recording...' : 'Off';
            recordingStatus.style.color = this.isRecording ? '#ff4444' : '#888';
        }

        if (modelStatus) {
            modelStatus.textContent = this.isModelTrained ? 'Trained' : 'Not Trained';
            modelStatus.style.color = this.isModelTrained ? '#44ff44' : '#888';
        }

        if (imitationMode) {
            if (this.isUsingImitationMode) {
                imitationMode.textContent = 'AI Imitating';
                imitationMode.style.color = '#9C27B0';
            } else {
                imitationMode.textContent = 'Human Control';
                imitationMode.style.color = '#44ff44';
            }
        }

        if (currentExamples) {
            currentExamples.textContent = this.recordingData.length.toString();
        }

        if (importedExamples) {
            importedExamples.textContent = (this.importedData?.length || 0).toString();
        }

        if (toggleRecordingBtn) {
            toggleRecordingBtn.textContent = this.isRecording ? 'Stop Recording (V)' : 'Start Recording (V)';
            toggleRecordingBtn.style.background = this.isRecording ? '#ff4444' : '#4CAF50';
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
    }
}

/**
 * COMPREHENSIVE GAME STATE EXTRACTOR - 60 features for detailed game state
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
        console.log("🧠 Comprehensive state extractor initialized (60 features)");
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
            console.error("State extraction error:", error);
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

console.log("🎬 Complete Imitation Learning System loaded!");