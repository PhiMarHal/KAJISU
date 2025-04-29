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

        // Create projectile using shared base
        const projectile = createProjectileBase(scene, x, y, config.color, config.symbol);

        // Set velocity based on angle
        projectile.body.setVelocity(
            Math.cos(angle) * config.speed,
            Math.sin(angle) * config.speed
        );

        // Set damage
        projectile.damage = config.damage;

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

    // Initialize the system
    initialize: function () {
        this.isActive = false;
        this.currentTimeScale = 1.0;
        this.playerSpeedFactor = 1.0;
        this.enemySlowdown = 1.0;
        this.originalPlayerSpeed = playerSpeed;
    },

    // Function to enter slow motion gradually
    enterSlowMotion: function (scene, duration = null) {
        // Cancel any existing tween to avoid conflicts
        if (this.slowMoTween) {
            this.slowMoTween.stop();
        }

        // Store original player speed if not already stored
        if (!this.originalPlayerSpeed) {
            this.originalPlayerSpeed = playerSpeed;
        }

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
                enemySpeedFactor = this.enemySlowdown;

                // Update player speed
                playerSpeed = this.originalPlayerSpeed * this.playerSpeedFactor;
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
                enemySpeedFactor = this.enemySlowdown;

                // Update player speed
                playerSpeed = this.originalPlayerSpeed * this.playerSpeedFactor;
            },
            onComplete: () => {
                this.isActive = false;

                // Reset global enemy speed factor (redundant but safe)
                enemySpeedFactor = 1.0;

                // Ensure player speed is fully restored
                playerSpeed = this.originalPlayerSpeed;
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
        enemySpeedFactor = 1.0;

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

        // Restore player speed
        if (this.originalPlayerSpeed) {
            playerSpeed = this.originalPlayerSpeed;
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

    // Initialize the system if needed
    if (!window.TimeDilationSystem.isActive) {
        window.TimeDilationSystem.initialize();
    }

    // Calculate duration based on luck if none provided
    const actualDuration = duration ?? Math.sqrt(playerLuck / BASE_STATS.LUK) * 1000;

    // If already active, just reset/extend the timer
    if (window.TimeDilationSystem.isActive) {
        // Clear existing exit timer
        if (window.TimeDilationSystem.exitTimer) {
            window.TimeDilationSystem.exitTimer.remove();
            window.TimeDilationSystem.exitTimer = null;
        }

        // Set a new exit timer with the full duration
        window.TimeDilationSystem.setExitTimer(scene, actualDuration);
    } else {
        // Not active yet, enter slow motion with duration
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