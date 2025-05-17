// On-Hit Effect System for Word Survivors
// Manages effects that trigger when the player is hit by enemies

// Component system for on-hit effects
const OnHitEffectSystem = {
    // Component definitions
    componentTypes: {},

    // Active components
    activeComponents: {},

    // Register a new component type
    registerComponent: function (name, componentDef) {
        this.componentTypes[name] = componentDef;
    },

    // Add a component to the system
    addComponent: function (componentName, config = {}) {
        // Skip if component already exists or type not registered
        if (this.activeComponents[componentName] || !this.componentTypes[componentName]) {
            return false;
        }

        // Create component from registered type
        const componentDef = this.componentTypes[componentName];
        const component = { ...componentDef };

        // Apply configuration
        Object.assign(component, config);

        // Store component reference
        this.activeComponents[componentName] = component;

        // Call initialize function if it exists
        if (component.initialize) {
            component.initialize();
        }

        return true;
    },

    getComponent: function (componentName) {
        // Return the component if it exists, or null if it doesn't
        return this.activeComponents[componentName] || null;
    },

    // Remove a component from the system
    removeComponent: function (componentName) {
        const component = this.activeComponents[componentName];
        if (!component) return false;

        // Call cleanup function if it exists
        if (component.cleanup) {
            component.cleanup();
        }

        // Remove the component
        delete this.activeComponents[componentName];
        return true;
    },

    // Process the player being hit
    processHit: function (scene, enemy) {
        // Call the onHit handler on each active component
        Object.values(this.activeComponents).forEach(component => {
            if (component.onHit) {
                component.onHit(scene, enemy);
            }
        });
    },

    // Check if a component is active
    hasComponent: function (componentName) {
        return !!this.activeComponents[componentName];
    },

    // Reset all components
    resetAll: function () {
        // Clean up each component
        Object.keys(this.activeComponents).forEach(name => {
            this.removeComponent(name);
        });

        // Ensure activeComponents is empty
        this.activeComponents = {};
    }
};

// Generalized defensive burst function that can be called from anywhere
window.createDefensiveBurst = function (scene, x, y, options = {}) {
    // Default options
    const defaults = {
        projectileCount: playerLuck * 2, // Default to 2 * LUCK projectiles
        color: '#9370db',                // Default purple color
        symbol: '★',                     // Default star symbol
        speed: 400,                      // Default speed
        damage: playerDamage,            // Default to player damage
        visualEffect: true               // Whether to show burst visual effect
    };

    // Merge provided options with defaults
    const config = { ...defaults, ...options };

    // Visual effect at the position
    if (config.visualEffect) {
        const burstEffect = scene.add.circle(x, y, 40, 0x9370db, 0.5);
        scene.tweens.add({
            targets: burstEffect,
            alpha: 0,
            scale: 2,
            duration: 300,
            onComplete: function () {
                burstEffect.destroy();
            }
        });
    }

    // Create each projectile in the burst
    const projectiles = [];
    for (let i = 0; i < config.projectileCount; i++) {
        // Calculate angle for even distribution (in radians)
        const angle = (i / config.projectileCount) * Math.PI * 2;

        // Create projectile using WeaponSystem
        const projectile = WeaponSystem.createProjectile(scene, {
            x: x,
            y: y,
            angle: angle,
            symbol: config.symbol,
            color: config.color,
            speed: config.speed,
            damage: config.damage,
            skipComponents: false // 
        });

        // Add special property
        projectile.isDefensiveBurst = true;

        // Add to return array
        projectiles.push(projectile);
    }

    // Return created projectiles for any additional processing
    return projectiles;
};

// Update the existing defensiveBurst component to use the new function
OnHitEffectSystem.registerComponent('defensiveBurst', {
    // No need to store state for this simple component
    onHit: function (scene, enemy) {
        // Simply call the generalized function at player position
        window.createDefensiveBurst(scene, player.x, player.y);
    }
});


// Registry for mapping perks to on-hit components
const OnHitPerkRegistry = {
    // Store perk-to-component mappings
    perkEffects: {},

    // Register a perk effect that applies an on-hit component
    registerPerkEffect: function (perkId, options) {
        this.perkEffects[perkId] = {
            componentName: options.componentName || null,
            configGenerator: options.configGenerator || null,
            condition: options.condition || null
        };
    },

    // Check and apply perk effects based on conditions
    checkAndApplyEffects: function () {
        // Process all registered perk effects
        Object.entries(this.perkEffects).forEach(([perkId, effectInfo]) => {
            // Check if player has this perk
            if (hasPerk(perkId)) {
                // Check if there's a condition function
                let conditionMet = true;
                if (effectInfo.condition) {
                    conditionMet = effectInfo.condition();
                }

                // Apply or remove component based on condition
                if (conditionMet) {
                    // Only add if it's not already active
                    if (!OnHitEffectSystem.hasComponent(effectInfo.componentName)) {
                        // Generate config if needed
                        let config = {};
                        if (effectInfo.configGenerator) {
                            config = effectInfo.configGenerator();
                        }

                        // Add the component
                        OnHitEffectSystem.addComponent(effectInfo.componentName, config);
                    }
                } else {
                    // Remove if active but condition no longer met
                    if (OnHitEffectSystem.hasComponent(effectInfo.componentName)) {
                        OnHitEffectSystem.removeComponent(effectInfo.componentName);
                    }
                }
            }
        });
    }
};

// Register the Purple Hedgehog perk effect
OnHitPerkRegistry.registerPerkEffect('PURPLE_HEDGEHOG', {
    componentName: 'defensiveBurst',
    condition: function () {
        // Always active when perk is acquired
        return true;
    }
});

OnHitEffectSystem.registerComponent('stormVengeanceEffect', {
    // Initialize component with default configuration
    initialize: function () {
        // Nothing needed here - configuration is set at creation time
    },

    // Handle the player being hit
    onHit: function (scene, enemy) {
        // Calculate number of lightning strikes based on player luck
        const strikeCount = playerLuck;

        // Create lightning strikes in a circle around the player
        this.createVengeanceStorm(scene, strikeCount);
    },

    // Helper method to create multiple lightning strikes in a circle
    createVengeanceStorm: function (scene, count) {
        // Define the radius of the lightning storm
        const radius = 192;

        // Create unique damage source ID for this storm
        const stormId = `vengeance_storm_${Date.now()}_${Math.random()}`;

        // Create lightning strikes at random positions within the circle
        for (let i = 0; i < count; i++) {
            // Calculate random angle and distance within the circle
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;

            // Calculate position
            const x = player.x + Math.cos(angle) * distance;
            const y = player.y + Math.sin(angle) * distance;

            // Add a delay based on index to stagger the lightning strikes
            scene.time.delayedCall(i * 200, function () {
                // Create lightning strike using the existing function from hero.js
                createLightningStrike(scene, x, y, {
                    segmentCount: 4,
                });
            }, [], scene);
        }
    },

    // Clean up component
    cleanup: function () {
        // Nothing to clean up here
    }
});

OnHitPerkRegistry.registerPerkEffect('STORM_VENGEANCE', {
    componentName: 'stormVengeanceEffect',
    condition: function () {
        // Always active when perk is acquired
        return true;
    }
});


// Centralized time dilation functionality
window.TimeDilationSystem = {
    // Current state tracking
    isActive: false,
    currentTimeScale: 1.0,
    playerSpeedFactor: 1.0,
    enemySlowdown: 1.0,
    originalPlayerSpeed: null,
    exitTimer: null,
    slowMoTween: null,
    isExiting: false,

    // Initialize the system
    initialize: function () {
        this.isActive = false;
        this.currentTimeScale = 1.0;
        this.playerSpeedFactor = 1.0;
        this.enemySlowdown = 1.0;
    },

    // Function to enter slow motion gradually
    enterSlowMotion: function (scene, duration = null) {
        // Cancel any existing tween to avoid conflicts
        if (this.slowMoTween) {
            this.slowMoTween.stop();
        }

        // Reset the exiting flag
        this.isExiting = false;

        // Create tween to gradually slow down time
        this.slowMoTween = scene.tweens.add({
            targets: this,
            currentTimeScale: 0.5,    // Slow game to 50% speed
            playerSpeedFactor: 0.5,   // Player at 50% speed
            enemySlowdown: 0.25,      // Enemies at 25% speed
            duration: 500,
            ease: 'Sine.easeOut',
            onUpdate: () => {
                // Apply time scale to scene for timers and tweens
                scene.time.timeScale = this.currentTimeScale;

                // Update the global enemy speed factor
                EnemySystem.setEnemySpeedFactor(this.enemySlowdown);

                // Update player speed
                playerSpeed = basePlayerSpeed * this.playerSpeedFactor;
            },
            onComplete: () => {
                this.isActive = true;

                // If duration is provided, set timer to exit slow motion
                if (duration !== null) {
                    this.setExitTimer(scene, duration);
                }
            }
        });
    },

    // Function to exit slow motion gradually
    exitSlowMotion: function (scene) {
        // Set the exiting flag
        this.isExiting = true;

        // Cancel any existing tween
        if (this.slowMoTween) {
            this.slowMoTween.stop();
        }

        // Create tween to restore normal time
        this.slowMoTween = scene.tweens.add({
            targets: this,
            currentTimeScale: 1.0,    // Return to normal speed
            playerSpeedFactor: 1.0,   // Return player speed to normal
            enemySlowdown: 1.0,       // Return enemy speed to normal
            duration: 500,
            ease: 'Sine.easeIn',
            onUpdate: () => {
                // Apply time scale to scene
                scene.time.timeScale = this.currentTimeScale;

                // Update the global enemy speed factor
                EnemySystem.setEnemySpeedFactor(this.enemySlowdown);

                // Update player speed
                playerSpeed = basePlayerSpeed * this.playerSpeedFactor;
            },
            onComplete: () => {
                this.isActive = false;
                this.isExiting = false; // Reset the exiting flag

                // Reset global enemy speed factor (redundant but safe)
                EnemySystem.setEnemySpeedFactor(this.enemySlowdown);

                // Ensure player speed is fully restored
                playerSpeed = basePlayerSpeed;
            }
        });
    },

    // Helper to set a timer for exiting slow motion
    setExitTimer: function (scene, duration) {
        // Clear existing exit timer if any
        if (this.exitTimer) {
            this.exitTimer.remove();
            this.exitTimer = null;
        }

        // Set timer to exit slow motion after duration - create a real-time timer
        const realTimeDuration = duration / this.currentTimeScale;
        this.exitTimer = scene.time.addEvent({
            delay: realTimeDuration,
            callback: () => { this.exitSlowMotion(scene); },
            callbackScope: this
        });

        // Register for cleanup
        registerTimer(this.exitTimer);
    },

    // Display visual effect (optional)
    showVisualEffect: function (scene) {
        const kanji = scene.add.text(player.x, player.y - 40, '異世界', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#00ffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        scene.tweens.add({
            targets: kanji,
            y: kanji.y - 30,
            alpha: 0,
            scale: 1.5,
            duration: 1000,
            onComplete: function () {
                kanji.destroy();
            }
        });
    },

    // Clean up resources
    cleanup: function () {
        const scene = game.scene.scenes[0];
        if (!scene) return;

        // Reset time scale
        scene.time.timeScale = 1.0;

        // Reset enemy speed factor
        EnemySystem.setEnemySpeedFactor(this.enemySlowdown);

        // Clear any tween
        if (this.slowMoTween) {
            this.slowMoTween.stop();
            this.slowMoTween = null;
        }

        // Clear exit timer
        if (this.exitTimer) {
            this.exitTimer.remove();
            this.exitTimer = null;
        }

        this.isActive = false;
        this.currentTimeScale = 1.0;
        this.playerSpeedFactor = 1.0;
        this.enemySlowdown = 1.0;
    }
};

// Add a public function to activate time dilation from anywhere
window.activateTimeDilation = function (duration = null, showVisualEffect = true) {
    const scene = game.scene.scenes[0];
    if (!scene) return false;

    // Calculate duration based on luck if none provided
    const actualDuration = duration ?? Math.sqrt(playerLuck / BASE_STATS.LUK) * 1000;

    // Initialize the system if needed
    if (!window.TimeDilationSystem.isActive && !window.TimeDilationSystem.isExiting) {
        window.TimeDilationSystem.initialize();
    }

    // If we're in the process of exiting, we want to restart the slow motion effect
    if (window.TimeDilationSystem.isExiting) {
        // Cancel any exit tweens and start a fresh slow motion effect
        window.TimeDilationSystem.enterSlowMotion(scene, actualDuration);
    }
    // If already active (but not exiting), just extend the timer
    else if (window.TimeDilationSystem.isActive) {
        // Clear existing exit timer
        if (window.TimeDilationSystem.exitTimer) {
            window.TimeDilationSystem.exitTimer.remove();
            window.TimeDilationSystem.exitTimer = null;
        }

        // Set a new exit timer with the full duration
        window.TimeDilationSystem.setExitTimer(scene, actualDuration);
    }
    // Not active at all, start a fresh effect
    else {
        window.TimeDilationSystem.enterSlowMotion(scene, actualDuration);
    }

    // Show visual effect if requested
    if (showVisualEffect) {
        window.TimeDilationSystem.showVisualEffect(scene);
    }

    return true;
};

// Modified timeDilationEffect component - now only handles on-hit triggering
OnHitEffectSystem.registerComponent('timeDilationEffect', {
    // Initialize component
    initialize: function () {
        // Nothing needed here - system will be initialized when activated
    },

    // Handle player being hit
    onHit: function (scene, enemy) {
        // Calculate slow motion duration based on luck
        const baseSlowdownDuration = Math.sqrt(playerLuck / BASE_STATS.LUK) * 1000;

        // Activate time dilation with the calculated duration
        window.activateTimeDilation(baseSlowdownDuration);
    },

    // Clean up component
    cleanup: function () {
        // Cleanup the time dilation system
        window.TimeDilationSystem.cleanup();
    }
});

// Register the perk with the OnHitPerkRegistry
OnHitPerkRegistry.registerPerkEffect('ALIEN_WORLD', {
    componentName: 'timeDilationEffect',
    condition: function () {
        // Always active when perk is acquired
        return true;
    }
});

// Register component for Flawless Fight ability
OnHitEffectSystem.registerComponent('flawlessFightEffect', {
    // Store component state
    stepTimer: null,
    stepCount: 0,
    maxSteps: 10, // 10 steps of 5% = 50% max boost
    stepInterval: 4000, // 4 seconds between steps
    stepSize: 0.05, // 5% increase per step
    // Store contribution from this perk
    berserkContribution: 0,
    archerContribution: 0,

    // Initialize component
    initialize: function () {
        // Reset contributions
        this.berserkContribution = 0;
        this.archerContribution = 0;
        this.stepCount = 0;

        // Start the step timer
        this.startStepTimer();
    },

    // Handle player being hit
    onHit: function (scene, enemy) {
        // Reset step counter
        this.stepCount = 0;

        // Remove our contribution from the global multipliers
        berserkMultiplier -= this.berserkContribution;
        archerMultiplier -= this.archerContribution;

        // Reset our contributions
        this.berserkContribution = 0;
        this.archerContribution = 0;

        // Restart the timer after being hit
        this.restartStepTimer(scene);

        // Update UI to reflect new damage values
        GameUI.updateStatCircles(scene);
    },

    // Start/restart the step timer
    startStepTimer: function () {
        const scene = game.scene.scenes[0];
        if (!scene) return;

        // Clear existing timer if any
        this.clearStepTimer();

        // Create new timer
        this.stepTimer = scene.time.addEvent({
            delay: this.stepInterval,
            callback: this.incrementStep,
            callbackScope: this,
            loop: true
        });

        // Register for cleanup
        window.registerEffect('timer', this.stepTimer);
    },

    // Restart the timer (convenience method)
    restartStepTimer: function (scene) {
        this.clearStepTimer();
        this.startStepTimer();
    },

    // Clear the step timer
    clearStepTimer: function () {
        if (this.stepTimer) {
            this.stepTimer.remove();
            this.stepTimer = null;
        }
    },

    // Increment the step counter and boost multipliers
    incrementStep: function () {
        // Skip if game is over or paused
        if (gameOver || gamePaused) return;

        // Only increase if below max steps
        if (this.stepCount < this.maxSteps) {
            // Increment step count
            this.stepCount++;

            // Remove previous contribution
            berserkMultiplier -= this.berserkContribution;
            archerMultiplier -= this.archerContribution;

            // Calculate new contributions
            this.berserkContribution = this.stepCount * this.stepSize;
            this.archerContribution = this.stepCount * this.stepSize;

            // Apply to global multipliers
            berserkMultiplier += this.berserkContribution;
            archerMultiplier += this.archerContribution;

            // Get scene for visual effects
            const scene = game.scene.scenes[0];
            if (scene && player && player.active) {
                // Store original color
                const originalColor = player.style.color || '#ffffff';

                // Create a smooth glowing animation
                const glowTween = scene.tweens.add({
                    targets: { value: 0 },
                    value: 1,
                    duration: 600,
                    yoyo: true, // Important for smooth pulse
                    onUpdate: function (tween) {
                        if (!player || !player.active) return;

                        // Get the tween progress (0 to 1, then back to 0)
                        const value = tween.getValue();

                        // Create a blended color that shifts between blue and original
                        // Convert blue components to RGB
                        const blueR = 0x00;
                        const blueG = 0x88;
                        const blueB = 0xFF;

                        // Simple way to get RGB from original color (this works with hex strings)
                        let origR = 255, origG = 255, origB = 255; // Default to white
                        if (originalColor.startsWith('#')) {
                            // Parse hex color
                            const hex = originalColor.slice(1);
                            if (hex.length >= 6) {
                                origR = parseInt(hex.slice(0, 2), 16);
                                origG = parseInt(hex.slice(2, 4), 16);
                                origB = parseInt(hex.slice(4, 6), 16);
                            }
                        }

                        // Blend colors based on tween value
                        // Use more blue at the peak of the tween (value=1)
                        const r = Math.floor(origR * (1 - value) + blueR * value);
                        const g = Math.floor(origG * (1 - value) + blueG * value);
                        const b = Math.floor(origB * (1 - value) + blueB * value);

                        // Set the blended color
                        const blendedColor = `rgb(${r},${g},${b})`;
                        player.setColor(blendedColor);
                    },
                    onComplete: function () {
                        // Ensure color is reset to original when complete
                        if (player && player.active) {
                            player.setColor(originalColor);
                        }
                    }
                });

                // Update UI to reflect new damage values
                GameUI.updateStatCircles(scene);
            }
        }
    },

    // Clean up component
    cleanup: function () {
        // Remove our contribution from the global multipliers
        berserkMultiplier -= this.berserkContribution;
        archerMultiplier -= this.archerContribution;

        // Clear timer
        this.clearStepTimer();

        // Update the game UI if possible
        const scene = game.scene.scenes[0];
        if (scene) {
            GameUI.updateStatCircles(scene);
        }
    }
});

// Register the perk with the OnHitPerkRegistry
OnHitPerkRegistry.registerPerkEffect('FLAWLESS_FIGHT', {
    componentName: 'flawlessFightEffect',
    condition: function () {
        // Always active when perk is acquired
        return true;
    }
});

// Register component for Anger Rising ability
OnHitEffectSystem.registerComponent('angerRisingEffect', {
    // Track the multiplier contribution from this perk
    multiplierContribution: 0,
    maxMultiplier: 1.0,
    multiplierStep: 0.1,
    decayTimer: null,
    decayInterval: 30000, // 30 seconds between decay steps
    originalColor: null,   // Store the player's original color

    // Initialize component
    initialize: function () {
        this.multiplierContribution = 0;

        // Store player's original color
        this.originalColor = player.style ? player.style.color : '#ffffff';

        // Start the decay timer
        this.startDecayTimer();
    },

    // Start the decay timer with fixed interval
    startDecayTimer: function () {
        const scene = game.scene.scenes[0];
        if (!scene) return;

        // Create a timer that decreases rage over time with fixed interval
        this.decayTimer = scene.time.addEvent({
            delay: this.decayInterval,
            callback: this.decayRage,
            callbackScope: this,
            loop: true
        });

        // Register for cleanup
        window.registerEffect('timer', this.decayTimer);
    },

    // Decrease rage by one step
    decayRage: function () {
        if (this.multiplierContribution <= 0) return;

        // Get scene for visual effects
        const scene = game.scene.scenes[0];
        if (!scene) return;

        // Decrease by one step
        this.multiplierContribution -= this.multiplierStep;
        berserkMultiplier -= this.multiplierStep;

        // Ensure we don't go negative
        if (this.multiplierContribution < 0) {
            berserkMultiplier -= this.multiplierContribution; // Correct any overshoot
            this.multiplierContribution = 0;
        }

        // Update player color to reflect rage level
        this.updatePlayerColor();

        // Update UI to reflect new damage values
        GameUI.updateStatCircles(scene);
    },

    // Handle the player being hit
    onHit: function (scene, enemy) {
        // Only increase if below max
        if (this.multiplierContribution < this.maxMultiplier) {
            // Increase our contribution
            this.multiplierContribution += this.multiplierStep;

            // Apply to global berserkMultiplier
            berserkMultiplier += this.multiplierStep;

            // Cap at our maximum contribution
            if (this.multiplierContribution > this.maxMultiplier) {
                const excess = this.multiplierContribution - this.maxMultiplier;
                this.multiplierContribution = this.maxMultiplier;
                berserkMultiplier -= excess;
            }

            // Flash the player to indicate hit
            scene.tweens.add({
                targets: player,
                alpha: 0.6,
                scale: 1.1,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    // Update player color to new rage level
                    this.updatePlayerColor();
                }
            });

            // Update UI to reflect new damage values
            GameUI.updateStatCircles(scene);
        }
    },

    // Update player color based on current rage level
    updatePlayerColor: function () {
        if (!player || !player.active) return;

        // No color change if no rage built up
        if (this.multiplierContribution <= 0) {
            // Reset to original color
            player.setColor(this.originalColor);
            return;
        }

        // Calculate color based on rage level - white to orange to red
        // Start with pure white (255, 255, 255)
        // Full rage will be bright orange-red (255, 100, 0)

        // Calculate green component (255 → 100 as rage increases)
        const greenValue = Math.floor(255 - (155 * (this.multiplierContribution / this.maxMultiplier)));

        // Calculate blue component (255 → 0 as rage increases)
        const blueValue = Math.floor(255 - (255 * (this.multiplierContribution / this.maxMultiplier)));

        // Create the color string
        const rageColor = `rgb(255,${greenValue},${blueValue})`;

        // Apply the color to the player
        player.setColor(rageColor);
    },

    // Clean up component
    cleanup: function () {
        // Remove decay timer if it exists
        if (this.decayTimer) {
            this.decayTimer.remove();
            this.decayTimer = null;
        }

        // Remove our contribution from the global multiplier
        berserkMultiplier -= this.multiplierContribution;

        // Ensure multiplier doesn't go below 1.0
        if (berserkMultiplier < 1.0) {
            berserkMultiplier = 1.0;
        }

        // Reset player color to original
        if (player && player.active && this.originalColor) {
            player.setColor(this.originalColor);
        }

        this.multiplierContribution = 0;
    }
});

// Register the perk with the OnHitPerkRegistry
OnHitPerkRegistry.registerPerkEffect('ANGER_RISING', {
    componentName: 'angerRisingEffect',
    condition: function () {
        // Always active when perk is acquired
        return true;
    }
});

// Main handler for player hit events - coordinates the entire hit response
function handlePlayerHit(scene, enemy) {
    // First trigger any on-hit effects that should happen regardless of shields
    // (like the Purple Hedgehog defensive burst)
    processPlayerHit(scene, enemy);

    // Check if shield is active
    if (window.isShieldActive()) {
        // Shield absorbs the hit - this will handle cooldown for permanent shields
        window.triggerShieldHit();

        // Flash the shield effect
        scene.tweens.add({
            targets: player,
            alpha: 0.5,
            scale: 1.2,
            duration: 100,
            yoyo: true,
            repeat: 1
        });

        // Return true to indicate hit was absorbed by shield
        return true;
    }

    // If we reach here, no shield was active
    // Return false to indicate hit should apply damage
    return false;
}

// Process on-hit effects (doesn't handle shield or damage)
function processPlayerHit(scene, enemy) {
    // Process all registered on-hit effects
    OnHitEffectSystem.processHit(scene, enemy);
}

// Function to reset the system (call during game restart)
function resetOnHitEffects() {
    OnHitEffectSystem.resetAll();
}

// Call this during the game update loop to ensure perk effects are applied/removed as needed
function updateOnHitEffects() {
    // Skip if game is over or paused
    if (gameOver || gamePaused) return;

    // Check perk conditions and apply/remove components
    OnHitPerkRegistry.checkAndApplyEffects();
}

// Export API for use in other files
window.OnHitEffectSystem = OnHitEffectSystem;
window.OnHitPerkRegistry = OnHitPerkRegistry;
window.handlePlayerHit = handlePlayerHit;
window.processPlayerHit = processPlayerHit;
window.resetOnHitEffects = resetOnHitEffects;
window.updateOnHitEffects = updateOnHitEffects;