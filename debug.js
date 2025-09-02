// debug.js - Debug utilities and performance monitoring for KAJISU
// Manages debug mode, performance stats, and debug keyboard shortcuts

// Debug System namespace
const DebugSystem = {
    // State tracking
    debugModeEnabled: false,
    statsVisible: false,
    statsText: null,

    // Initialize the debug system
    init: function (scene) {
        // Create stats text display (initially hidden)
        this.setupPerformanceMonitor(scene);

        // Always setup normal keys (P for pause, M for music)
        this.setupNormalKeys(scene);

        // Only setup debug/cheat keys if DEBUG_MODE is enabled
        if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) {
            this.setupDebugKeys(scene);
            console.log("Debug system initialized with cheat keys enabled (O = stats, T = spawn 1 enemy, K = skip to next phase, R = levelup");
        } else {
            console.log("Debug system initialized in normal mode (no cheat keys)");
        }
    },

    // Toggle debug mode and stats visibility
    toggleDebugMode: function (scene) {
        // Toggle debug mode
        this.debugModeEnabled = !this.debugModeEnabled;

        // Toggle stats visibility
        if (this.statsText) {
            this.statsText.visible = this.debugModeEnabled;
            this.statsVisible = this.debugModeEnabled;
        }

        // Toggle physics debug rendering
        scene.physics.world.drawDebug = this.debugModeEnabled;

        // When enabling debug mode, we need to create the debug graphics if it doesn't exist
        if (this.debugModeEnabled && !scene.physics.world.debugGraphic) {
            scene.physics.world.createDebugGraphic();
        }

        // Toggle the visibility of the debug graphics
        if (scene.physics.world.debugGraphic) {
            scene.physics.world.debugGraphic.visible = this.debugModeEnabled;
        }

        console.log(`Debug mode ${this.debugModeEnabled ? 'enabled' : 'disabled'}`);
    },

    // Setup performance monitoring display
    setupPerformanceMonitor: function (scene) {
        // Create stats text display (initially hidden)
        // Position in top-right corner with padding
        const rightPadding = 20;
        const topPadding = 10;
        const statsX = game.config.width - rightPadding;
        const statsY = topPadding;

        this.statsText = scene.add.text(statsX, statsY, 'FPS: 0', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        });
        // Set origin to right-align text against the right edge
        this.statsText.setOrigin(1, 0);
        this.statsText.setDepth(1000);
        this.statsText.visible = false;
        this.statsVisible = false;
    },

    // Update performance statistics display
    updatePerformanceStats: function (scene, time, delta) {
        if (this.statsText && this.statsVisible) {
            const fps = Math.round(scene.game.loop.actualFps);

            // Get physics bodies count
            let bodyCount = 0;
            if (scene.physics && scene.physics.world) {
                bodyCount = scene.physics.world.bodies.size;
            }

            // Count active game objects by type
            const totalObjects = scene.children.list.length;
            let enemyCount = 0;
            let projectileCount = 0;

            if (window.EnemySystem && window.EnemySystem.enemiesGroup) {
                enemyCount = window.EnemySystem.enemiesGroup.getChildren().length;
            }
            if (window.projectiles) {
                projectileCount = window.projectiles.getChildren().length;
            }

            // Calculate frame time from delta
            const frameTime = delta.toFixed(2);

            // Get memory usage if available
            let memoryUsage = "N/A";
            if (window.performance && window.performance.memory) {
                memoryUsage = Math.round(window.performance.memory.usedJSHeapSize / 1048576) + " MB";
            }

            // Update stats text
            this.statsText.setText(
                `DEBUG MODE ON\n` +
                `FPS: ${fps}\n` +
                `Frame Time: ${frameTime}ms\n` +
                `Memory: ${memoryUsage}\n` +
                `Total Objects: ${totalObjects}\n` +
                `Enemies: ${enemyCount}\n` +
                `Projectiles: ${projectileCount}\n` +
                `Physics Bodies: ${bodyCount}`
            );
        }
    },

    // Setup normal keys available in all modes (P for pause, M for music)
    setupNormalKeys: function (scene) {
        // Add pause key (P key)
        scene.input.keyboard.on('keydown-P', function () {
            if (!gameOver) {
                if (gamePaused) {
                    PauseSystem.resumeGame();
                } else {
                    PauseSystem.pauseGameWithOverlay();
                }
            }
        }, scene);

        // Add music toggle key (M key)
        scene.input.keyboard.on('keydown-M', function () {
            // Skip if debug keys are disabled
            if (this.debugKeysDisabled) return;

            // Toggle music if MusicSystem is available
            if (window.MusicSystem) {
                const musicEnabled = MusicSystem.setMusicEnabled(!MusicSystem.musicEnabled);
                console.log(`Music ${musicEnabled ? 'enabled' : 'disabled'}`);
            } else {
                console.log("MusicSystem not available");
            }
        }, scene);

        // Add instant level up key (R key) - ONLY for pure DEBUG_MODE now
        scene.input.keyboard.on('keydown-R', function () {
            // Skip if debug keys are disabled
            if (this.debugKeysDisabled) return;

            if (!gamePaused && !gameOver) {
                if (isDebugMode) {
                    // Add enough XP to level up
                    const xpNeeded = xpForNextLevel(playerLevel) - heroExp;
                    heroExp += xpNeeded;
                    GameUI.updateExpBar(this);

                    console.log("Debug: Free level up used");
                }
            }
        }, scene);
    },

    // Setup debug/cheat keys (only available when DEBUG_MODE is true)
    setupDebugKeys: function (scene) {

        // Add debug key (T key for instant enemy spawn)
        scene.input.keyboard.on('keydown-T', function () {
            // Skip if debug keys are disabled
            if (this.debugKeysDisabled) return;

            if (!gamePaused && !gameOver) {
                // Access the main game scene and call spawnEnemyOfRank on it with rank 1
                const activeScene = this;
                if (activeScene) {
                    window.spawnEnemyOfRank.call(activeScene, 1);
                    console.log("Debug: Rank 1 enemy spawned");
                }
            }
        }, scene);

        // Add debug key (K key for skipping to next enemy phase)
        scene.input.keyboard.on('keydown-K', function () {
            // Skip if debug keys are disabled
            if (this.debugKeysDisabled) return;

            if (!gamePaused && !gameOver) {
                // Skip to next phase based on current elapsed time
                DebugSystem.skipToNextPhase.call(this);
            }
        }, scene);

        // Add debug key (O key for performance monitor toggle)
        scene.input.keyboard.on('keydown-O', function () {
            // Skip if debug keys are disabled
            if (this.debugKeysDisabled) return;

            // Toggle debug mode and stats visibility
            DebugSystem.toggleDebugMode(this);
        }, scene);
    },

    // Skip to the next enemy phase for testing
    skipToNextPhase: function () {
        // Get the current minutes elapsed
        const currentMinutes = elapsedTime / 60;

        // Find the next phase timing based on rankConfigs
        // Convert the start times from seconds to minutes
        const phaseTimings = Object.values(rankConfigs).map(config => config.startTime / 60);

        // Sort the phase timings to ensure they're in ascending order
        phaseTimings.sort((a, b) => a - b);

        // Find the next phase timing
        let nextPhaseMinutes = null;
        for (const phaseTime of phaseTimings) {
            if (phaseTime > currentMinutes) {
                nextPhaseMinutes = phaseTime;
                break;
            }
        }

        // If no next phase was found, add 12 minutes (common phase interval)
        if (nextPhaseMinutes === null) {
            // Find the highest phase timing and add 12 minutes
            const highestPhase = Math.max(...phaseTimings);
            nextPhaseMinutes = Math.floor(currentMinutes / 12) * 12 + 12;

            // Ensure we're actually advancing time
            if (nextPhaseMinutes <= currentMinutes) {
                nextPhaseMinutes = currentMinutes + 12;
            }
        }

        // Update elapsedTime to the new phase time (in seconds)
        const oldElapsedTime = elapsedTime;
        elapsedTime = nextPhaseMinutes * 60;

        // Log the action
        console.log(`Debug: Time skipped from ${Math.floor(oldElapsedTime / 60)} minutes to ${nextPhaseMinutes} minutes`);

        // Update the level display
        GameUI.updateStatusDisplay(this, elapsedTime, score);

        // Update enemy spawners to reflect the new time
        EnemySystem.updateEnemySpawners();
    },

    // Disable debug keys during special game states (e.g., level up)
    disableDebugKeys: function (scene) {
        // Set the flag to disable debug keys (same flag used by RomajiChallengeSystem)
        scene.debugKeysDisabled = true;
    },

    // Restore debug keys to their original state
    restoreDebugKeys: function (scene) {
        // Set the flag to enable debug keys
        scene.debugKeysDisabled = false;
    },

    // Clean up resources (call during game restart)
    cleanup: function () {
        // Clean up performance monitor
        if (this.statsText) {
            this.statsText.destroy();
            this.statsText = null;
        }

        // Reset state
        this.debugModeEnabled = false;
        this.statsVisible = false;
    }
};

// Export the debug system
window.DebugSystem = DebugSystem;