// Hero kanji with readings and translation
const HERO_CHARACTER = '勇';
const HERO_KANA = 'ゆう';
const HERO_ROMAJI = 'yuu';
const HERO_ENGLISH = 'Brave';

// Base player stats
const BASE_STATS = {
    POW: 4,
    AGI: 4,
    LUK: 4,
    END: 4,
};

// Perk cooldowns in milliseconds - divide by 4 for real base time
const shieldBaseCd = 80000;
const godHammerBaseCd = 120000;
const fatedShieldBaseCd = 60000;

// Player Status Component System for KAJISU
// This system manages special behaviors and status effects for the player

// Player status component system
const PlayerComponentSystem = {
    // Component definitions
    componentTypes: {},

    // Active components on player
    activeComponents: {},

    // Register a new component type
    registerComponent: function (name, componentDef) {
        this.componentTypes[name] = componentDef;
    },

    // Add a component to the player
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
            component.initialize(player);
        }

        return true;
    },

    // Remove a component from the player
    removeComponent: function (componentName) {
        const component = this.activeComponents[componentName];
        if (!component) return false;

        console.log(`Removing component: ${componentName}`);

        // Call cleanup function if it exists
        if (component.cleanup) {
            component.cleanup(player);
        }

        // Check for and clean up timers created by CooldownManager
        // Components typically store timer references in properties
        for (const key in component) {
            const value = component[key];

            // Check if property is a timer from CooldownManager
            if (value &&
                (typeof value === 'object') &&
                (value.delay !== undefined || value.paused !== undefined || value.elapsed !== undefined)) {

                console.log(`Found potential timer in ${componentName}.${key}`);

                // Try to remove via CooldownManager first
                if (window.CooldownManager && window.CooldownManager.removeTimer) {
                    window.CooldownManager.removeTimer(value);
                }

                // Also try directly removing the timer as backup
                if (value.remove) {
                    value.remove();
                }

                // Clear reference
                component[key] = null;
            }
        }

        // Remove the component
        delete this.activeComponents[componentName];
        return true;
    },


    // Process a specific event for all components
    processEvent: function (eventName, ...args) {
        // Call the event handler on each component that has it
        Object.values(this.activeComponents).forEach(component => {
            if (component[eventName]) {
                component[eventName](player, ...args);
            }
        });
    },

    // Check if a component is active
    hasComponent: function (componentName) {
        return !!this.activeComponents[componentName];
    },

    // Get an active component
    getComponent: function (componentName) {
        return this.activeComponents[componentName];
    },

    // Reset all components
    resetAll: function () {
        console.log("Resetting all player components...");

        // Get a list of all component names first to avoid modification during iteration
        const componentNames = Object.keys(this.activeComponents);

        // Clean up each component
        componentNames.forEach(name => {
            this.removeComponent(name);
        });

        // Ensure activeComponents is empty
        this.activeComponents = {};

        console.log("All player components reset complete");
    }
};

// Register component for berserker state (Crimson Fury)
PlayerComponentSystem.registerComponent('berserkerState', {
    // Store original values for restoration
    originalColor: null,

    // Track our contribution to the global berserkMultiplier
    damageMultiplier: 1.0, // Changed from 2.0 to 1.0 (represents +100%)
    colorTween: null,

    initialize: function (player) {
        // Store original color
        this.originalColor = player.style.color || '#ffffff';

        // Create color pulsing tween
        const scene = game.scene.scenes[0];
        if (scene) {
            this.colorTween = scene.tweens.add({
                targets: player,
                colorTween: { from: 0, to: 1 },
                duration: 1000, // 1 second in each direction
                yoyo: true,
                repeat: -1,
                onUpdate: function (tween, target) {
                    // Interpolate between white and red based on tween value
                    const value = target.colorTween;
                    const r = Math.floor(255); // Red always at max
                    const g = Math.floor(255 * (1 - value)); // Green reduces to 0
                    const b = Math.floor(255 * (1 - value)); // Blue reduces to 0

                    player.setColor(`rgb(${r},${g},${b})`);
                }
            });
        }

        // Add our multiplier to the global value
        // Now we're adding our contribution rather than directly setting it
        berserkMultiplier += this.damageMultiplier;

        console.log("BERSERK!");

        // Update player stats display to show new values
        GameUI.updateStatCircles(scene);
    },

    update: function (player) {
        // Check if we should deactivate (health above threshold)
        const healthPercentage = playerHealth / maxPlayerHealth;
        if (healthPercentage > 0.5) {
            PlayerComponentSystem.removeComponent('berserkerState');
        }
    },

    cleanup: function (player) {
        // Subtract our contribution from the multiplier
        berserkMultiplier -= this.damageMultiplier;

        // Ensure multiplier doesn't go below 1.0
        if (berserkMultiplier < 1.0) {
            berserkMultiplier = 1.0;
        }

        // Stop color tween if it exists
        if (this.colorTween) {
            this.colorTween.stop();
            this.colorTween = null;
        }

        // Restore original color
        player.setColor(this.originalColor || '#ffffff');

        // Update player stats display
        const scene = game.scene.scenes[0];
        if (scene) {
            GameUI.updateStatCircles(scene);
        }
    }
});

// Registry for mapping perks to player components
const PlayerPerkRegistry = {
    // Store perk-to-component mappings
    perkEffects: {},

    // Register a perk effect that applies a component to the player
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
                    if (!PlayerComponentSystem.hasComponent(effectInfo.componentName)) {
                        // Generate config if needed
                        let config = {};
                        if (effectInfo.configGenerator) {
                            config = effectInfo.configGenerator();
                        }

                        // Add the component
                        PlayerComponentSystem.addComponent(effectInfo.componentName, config);
                    }
                } else {
                    // Remove if active but condition no longer met
                    if (PlayerComponentSystem.hasComponent(effectInfo.componentName)) {
                        PlayerComponentSystem.removeComponent(effectInfo.componentName);
                    }
                }
            }
        });
    }
};

// Register known perk effects
PlayerPerkRegistry.registerPerkEffect('CRIMSON_FURY', {
    componentName: 'berserkerState',
    condition: function () {
        // Active when health is below 50%
        return playerHealth / maxPlayerHealth <= 0.5;
    }
});

// Register component for archer state (Eternal Rhythm)
PlayerComponentSystem.registerComponent('eternalRhythmState', {
    // Store original values and state
    maxMultiplier: 2.0,
    currentMultiplier: 1.0,
    isActive: false,
    accumulator: 0,
    lastUpdateTime: 0,
    velocityThreshold: 10, // Minimum velocity to consider player moving
    particles: [],
    particleTimer: null,

    // Track our contribution to the global archerMultiplier
    archerContribution: 0,

    initialize: function (player) {

        // Reset accumulator and multiplier
        this.accumulator = 0;
        this.currentMultiplier = 1.0;
        this.archerContribution = 0;

        // Remember the time
        this.lastUpdateTime = game.scene.scenes[0].time.now;

        // Get the scene
        const scene = game.scene.scenes[0];
        if (!scene) return;

        // Initialize particle array
        this.particles = [];

        // Set up particle creation timer (but initially paused/inactive)
        if (this.particleTimer) {
            this.particleTimer.remove();
        }

        this.particleTimer = scene.time.addEvent({
            delay: (this.currentMultiplier - 1),
            callback: this.createParticle,
            callbackScope: this,
            loop: true,
            paused: true // Start paused
        });

        // Register for cleanup
        window.registerEffect('timer', this.particleTimer);
    },

    // Function to create a single particle
    createParticle: function () {
        const scene = game.scene.scenes[0];
        if (!scene || !player || !player.active) return;

        // Create a particle
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 10;
        const x = player.x + Math.cos(angle) * distance;
        const y = player.y + Math.sin(angle) * distance;

        // Create particle as a small text
        const particle = scene.add.text(x, y, '✦', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#FFDD00'
        }).setOrigin(0.5);

        // Add to our tracking array
        this.particles.push(particle);

        // Create animation for particle
        scene.tweens.add({
            targets: particle,
            alpha: { from: 0.7, to: 0 },
            scale: { from: 0.5, to: 1.5 },
            x: particle.x + (Math.random() - 0.5) * 30,
            y: particle.y + (Math.random() - 0.5) * 30,
            duration: 500,
            onComplete: () => {
                // Remove from array and destroy
                const index = this.particles.indexOf(particle);
                if (index !== -1) {
                    this.particles.splice(index, 1);
                }
                particle.destroy();
            }
        });
    },

    update: function (player) {
        // Get current time and calculate delta time in seconds
        const scene = game.scene.scenes[0];
        const currentTime = scene.time.now;
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
        this.lastUpdateTime = currentTime;

        // Skip if delta time is unreasonably large (e.g., after tab switching)
        if (deltaTime > 0.5) return;

        // Check player velocity directly
        const velocity = player.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

        // Determine if player is moving based on velocity
        const isPlayerMoving = speed > this.velocityThreshold;

        // Calculate the rate of change
        const maxTimeSeconds = 60 / playerLuck;
        const changeRate = deltaTime / maxTimeSeconds;

        if (isPlayerMoving) {
            // Player is moving - increase accumulator
            this.accumulator = Math.min(1.0, this.accumulator + changeRate);
        } else {
            // Player stopped moving - decrease accumulator at same rate
            this.accumulator = Math.max(0.0, this.accumulator - changeRate);
        }

        // Calculate new multiplier based on current accumulator
        const newMultiplier = 1.0 + (this.accumulator * (this.maxMultiplier - 1.0));

        // Update if there's a meaningful change
        if (Math.abs(this.currentMultiplier - newMultiplier) > 0.01) {
            this.currentMultiplier = newMultiplier;

            // Remove our previous contribution
            archerMultiplier -= this.archerContribution;

            // Calculate our new contribution (currentMultiplier - 1.0 gives us the bonus)
            this.archerContribution = this.currentMultiplier - 1.0;

            // Add our new contribution
            archerMultiplier += this.archerContribution;

            // Update the projectile firer with new delay
            this.updateProjectileFiringRate(scene);

            // Update particle timer frequency based on multiplier
            if (this.particleTimer) {
                // Adjust delay - faster particles at higher multiplier
                const newDelay = Math.max(50, 150 - (this.currentMultiplier - 1.0) * 100);

                if (Math.abs(this.particleTimer.delay - newDelay) > 10) {
                    this.particleTimer.delay = newDelay;
                    this.particleTimer.reset({
                        delay: newDelay,
                        callback: this.createParticle,
                        callbackScope: this,
                        loop: true
                    });
                }

                // Control timer based on whether we have any bonus
                if (this.currentMultiplier > 1.01) {
                    if (this.particleTimer.paused) {
                        this.particleTimer.paused = false;
                    }
                } else {
                    if (!this.particleTimer.paused) {
                        this.particleTimer.paused = true;
                    }
                }
            }
        }

        // Visual effect when reaching full speed
        if (!this.isActive && this.accumulator >= 0.99) {
            this.isActive = true;

            // Create burst effect when reaching max speed
            for (let i = 0; i < 15; i++) {
                this.createParticle();
            }
        } else if (this.isActive && this.accumulator < 0.99) {
            this.isActive = false;
        }
    },

    // Helper function to update projectile firing rate
    updateProjectileFiringRate: function (scene) {
        // Previously referenced projectileFirer directly
        // Now we'll use the WeaponSystem

        if (!scene || !WeaponSystem) return;

        // Calculate new delay based on current multiplier
        const effectiveFireRate = playerFireRate * archerMultiplier;

        // Log the values to understand what's happening

        // Instead of manipulating the timer directly, we'll use WeaponSystem's updateFiringRate
        WeaponSystem.updateFiringRate(scene);

        GameUI.updateStatCircles(scene);
    },

    cleanup: function (player) {

        // Remove our contribution from the global multiplier
        archerMultiplier -= this.archerContribution;

        // Stop and destroy particle timer
        if (this.particleTimer) {
            this.particleTimer.remove();
            this.particleTimer = null;
        }

        // Clean up any remaining particles
        this.particles.forEach(particle => {
            if (particle && particle.active) {
                particle.destroy();
            }
        });
        this.particles = [];
    }
});

// Register perk effect
PlayerPerkRegistry.registerPerkEffect('ETERNAL_RHYTHM', {
    componentName: 'eternalRhythmState',
    condition: function () {
        // Always active when perk is acquired
        return true;
    }
});

// Shield system - core functionality for all shield types
const ShieldSystem = {
    // Track if a shield is currently active
    isShieldActive: false,

    // Activate a shield effect
    activateShield: function (options = {}) {

        // Set shield as active
        this.isShieldActive = true;

        // Make shield visual visible
        if (shieldVisual) {
            shieldVisual.setVisible(true);

            // Add a visual effect if we're in a scene
            const scene = game.scene.scenes[0];
            if (scene) {
                scene.tweens.add({
                    targets: shieldVisual,
                    scale: { from: options.startScale ?? 0.5, to: options.endScale ?? 1 },
                    alpha: { from: options.startAlpha ?? 0.8, to: options.endAlpha ?? 0.4 },
                    duration: options.animDuration ?? 500,
                    ease: options.easeFunction ?? 'Cubic.out'
                });
            }
        }

        // Return true for successful activation
        return true;
    },

    // Deactivate the shield (without starting cooldown)
    deactivateShield: function () {

        // Set shield as inactive
        this.isShieldActive = false;

        // Hide shield visual
        if (shieldVisual) {
            shieldVisual.setVisible(false);
        }
    },

    // Called when a shield absorbs a hit
    onShieldHit: function () {

        // Deactivate the shield
        this.deactivateShield();

        // Notify any permanent shield component to start cooldown
        if (PlayerComponentSystem.hasComponent('permanentShieldAbility')) {
            const shieldComponent = PlayerComponentSystem.getComponent('permanentShieldAbility');
            shieldComponent.startCooldown();
        }
    },

    // Check if shield is currently active
    isActive: function () {
        return this.isShieldActive;
    }
};

// Register component for the second chance shield ability
PlayerComponentSystem.registerComponent('secondChanceShieldAbility', {
    // Store properties
    cooldownTimer: null,
    readyForUse: true, // Initially ready to use

    initialize: function (player) {
        this.readyForUse = true;
    },

    update: function (player) {
        // Check if we're ready to use and player is at 1 HP
        if (this.readyForUse && playerHealth === 1) {
            this.activateEmergencyShield();
        }
    },

    activateEmergencyShield: function () {
        // Mark as used
        this.readyForUse = false;

        // Activate shield
        ShieldSystem.activateShield();

        // Get the scene
        const scene = game.scene.scenes[0];
        if (!scene) return;

        // Remove any existing cooldown timer
        if (this.cooldownTimer) {
            CooldownManager.removeTimer(this.cooldownTimer);
        }

        // Create cooldown timer
        this.cooldownTimer = CooldownManager.createTimer({
            statName: 'luck',
            baseCooldown: fatedShieldBaseCd,
            formula: 'divide',
            component: this,
            callback: this.resetAbility,
            callbackScope: this,
            loop: false
        });
    },

    resetAbility: function () {
        this.readyForUse = true;
    },

    cleanup: function () {
        // Remove cooldown timer if it exists
        if (this.cooldownTimer) {
            // First remove from CooldownManager's registry
            CooldownManager.removeTimer(this.cooldownTimer);

            // Also directly remove the timer to ensure it's destroyed
            if (this.cooldownTimer.remove) {
                this.cooldownTimer.remove();
            }

            this.cooldownTimer = null;
        }

        // Deactivate shield if this was the only shield provider
        ShieldSystem.deactivateShield();
    }
});

// Register the perk with the PlayerPerkRegistry
PlayerPerkRegistry.registerPerkEffect('FATED_SHIELD', {
    componentName: 'secondChanceShieldAbility',
    condition: function () {
        // Always active when perk is acquired
        return true;
    }
});

// Register component for permanent shield ability (from Blue Whale perk)
PlayerComponentSystem.registerComponent('permanentShieldAbility', {
    // Store cooldown timer
    cooldownTimer: null,

    initialize: function (player) {

        // Activate shield immediately when component is created
        ShieldSystem.activateShield();
    },

    startCooldown: function () {

        // Remove any existing cooldown timer
        if (this.cooldownTimer) {
            CooldownManager.removeTimer(this.cooldownTimer);
        }

        // Create cooldown timer
        const scene = game.scene.scenes[0];
        if (!scene) return;

        this.cooldownTimer = CooldownManager.createTimer({
            statName: 'luck',
            baseCooldown: shieldBaseCd,
            formula: 'divide',
            component: this,
            callback: this.reactivateShield,
            callbackScope: this,
            loop: false
        });
    },

    reactivateShield: function () {
        // Shield cooldown is over, reactivate the shield
        ShieldSystem.activateShield();
    },

    cleanup: function () {
        // Remove cooldown timer if it exists
        if (this.cooldownTimer) {
            // First remove from CooldownManager's registry
            CooldownManager.removeTimer(this.cooldownTimer);

            // Also directly remove the timer to ensure it's destroyed
            if (this.cooldownTimer.remove) {
                this.cooldownTimer.remove();
            }

            this.cooldownTimer = null;
        }

        // Deactivate shield if this was the only shield provider
        ShieldSystem.deactivateShield();
    }
});

// Register the permanent shield perk with the PlayerPerkRegistry
PlayerPerkRegistry.registerPerkEffect('BLUE_WHALE', {
    componentName: 'permanentShieldAbility',
    condition: function () {
        // Always active when perk is acquired
        return true;
    }
});

// Example of a one-off shield component (for future perks)
PlayerComponentSystem.registerComponent('temporaryShieldAbility', {
    // This is just an example - not used yet
    initialize: function (player) {

        // Activate shield with special visual effect
        ShieldSystem.activateShield({
            startScale: 0.2,
            endScale: 1.2,
            startAlpha: 1.0,
            endAlpha: 0.3,
            animDuration: 800,
            notificationText: 'TEMPORARY SHIELD ACTIVE!',
            notificationColor: '#FF9900'
        });
    },

    cleanup: function () {
        // No need to deactivate shield here, as it's handled by ShieldSystem.onShieldHit
    }
});

// Export shield interface for other files to use
window.isShieldActive = function () {
    return ShieldSystem.isActive();
};

window.triggerShieldHit = function () {
    ShieldSystem.onShieldHit();
};

window.activateShield = function (options) {
    return ShieldSystem.activateShield(options);
};

// God Hammer component
PlayerComponentSystem.registerComponent('godHammerAbility', {
    // Store timer reference
    hammerTimer: null,
    sceneReference: null, // Add explicit scene reference storage

    initialize: function (player) {
        // Get the scene and store reference
        const scene = game.scene.scenes[0];
        if (!scene) return;

        this.sceneReference = scene;

        // Create and register timer in one step
        this.hammerTimer = CooldownManager.createTimer({
            statName: 'luck',
            baseCooldown: godHammerBaseCd,
            formula: 'divide',
            component: this,
            callback: this.dropHammer, // Use component method instead of global function
            callbackScope: this, // Use this component as the scope
            loop: true // Ensure it's marked as looping
        });

        // Immediately drop first hammer using our own method
        this.dropHammer();
    },

    // Internal method to drop the hammer
    dropHammer: function () {
        const scene = this.sceneReference ?? game.scene.scenes[0];
        if (!scene || gameOver || gamePaused) return;

        // Call the original function but with proper context
        dropGodHammer.call(scene);
    },

    cleanup: function (player) {
        // Remove timer from CooldownManager's registry
        if (this.hammerTimer) {
            CooldownManager.removeTimer(this.hammerTimer);

            // Direct cleanup with additional safeguards
            if (this.hammerTimer.remove) {
                this.hammerTimer.remove();
            }

            // If the timer has a countdown event, also remove that
            if (this.hammerTimer.countdown) {
                this.hammerTimer.countdown.remove(false);
            }

            this.hammerTimer = null;
        }

        // Clear scene reference
        this.sceneReference = null;
    }
});

// Function to drop the God Hammer on enemies
function dropGodHammer(options = {}) {
    // Extract options with defaults
    const {
        originX = null,
        originY = null,
        maxRange = null
    } = options;

    // Skip if no enemies
    if (!EnemySystem.enemiesGroup || EnemySystem.enemiesGroup.getChildren().length === 0) return;

    // Get all active enemies on screen
    let activeEnemies = EnemySystem.enemiesGroup.getChildren().filter(enemy =>
        enemy.active &&
        enemy.x >= 0 && enemy.x <= game.config.width && enemy.y >= 0 && enemy.y <= game.config.height
    );

    // If range checking is requested, filter enemies by distance from origin
    if (originX !== null && originY !== null && maxRange !== null) {
        activeEnemies = activeEnemies.filter(enemy => {
            const dx = enemy.x - originX;
            const dy = enemy.y - originY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= maxRange;
        });
    }

    // If no valid enemies found (either none on screen or none in range), return
    if (activeEnemies.length === 0) return;

    // Select a random enemy to target from the filtered list
    const targetEnemy = Phaser.Utils.Array.GetRandom(activeEnemies);

    // Create the hammer at a position above the enemy
    const hammerX = targetEnemy.x;
    const hammerY = targetEnemy.y - 300;

    // Create the hammer object using the kanji for "hammer": 鎚
    const hammer = this.add.text(hammerX, hammerY, '鎚', {
        fontFamily: 'Arial',
        fontSize: '96px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(0.5);

    // Add physics body for collision detection
    this.physics.world.enable(hammer);
    hammer.body.setSize(hammer.width * 1, hammer.height * 1);

    // Set properties for the hammer
    hammer.damage = playerDamage * 10;
    hammer.damageSourceId = 'godHammer';

    // Register entity for cleanup
    window.registerEffect('entity', hammer);

    // Add overlap with enemies
    this.physics.add.overlap(hammer, EnemySystem.enemiesGroup, function (hammer, enemy) {
        applyContactDamage.call(this, hammer, enemy, hammer.damage);
    }, null, this);

    // Add falling animation
    this.tweens.add({
        targets: hammer,
        y: targetEnemy.y,
        duration: 500,
        ease: 'Bounce.easeOut',
        onComplete: function () {
            // Fade out and remove the hammer after a short delay
            this.parent.scene.tweens.add({
                targets: hammer,
                alpha: 0,
                duration: 500,
                delay: 500,
                onComplete: function () {
                    hammer.destroy();
                }
            });
        }
    });
}

// Register the perk with the PlayerPerkRegistry
PlayerPerkRegistry.registerPerkEffect('GOD_HAMMER', {
    componentName: 'godHammerAbility',
    condition: function () {
        // Always active when perk is acquired
        return true;
    }
});

// Activation function (will be called from perks.js)
window.activateGodHammer = function () {
    // Simply add the component through the component system
    PlayerComponentSystem.addComponent('godHammerAbility');
};

// Lightning strike function in hero.js (outside the component)
function createLightningStrike(scene, x, y, options = {}) {
    // Skip if game is over or paused
    if (gameOver || gamePaused) return;

    // Default options
    const damage = options.damage ?? (playerDamage * 4); // 4x damage as in your code
    const color = options.color ?? '#FFDD00';
    const size = options.size ?? 32;
    const symbol = options.symbol ?? '雷';
    const segmentCount = options.segmentCount ?? 8; // 8 segments as in your code

    // Create a lightning column of kanjis with decreasing opacity
    const lightningSegments = [];

    // Create the main lightning at the impact point
    const mainLightning = scene.add.text(x, y, symbol, {
        fontFamily: 'Arial',
        fontSize: `${size}px`,
        color: color,
        fontStyle: 'bold'
    }).setOrigin(0.5);

    // Register for cleanup
    window.registerEffect('entity', mainLightning);
    lightningSegments.push(mainLightning);

    // Create lightning segments above with decreasing opacity
    for (let i = 1; i < segmentCount; i++) {
        const opacity = 0.8 - (i * 0.1); // From 0.8 down to 0.1 as in your code
        const segment = scene.add.text(x, y - (i * size), symbol, {
            fontFamily: 'Arial',
            fontSize: `${size}px`,
            color: color,
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(opacity);

        // Register for cleanup
        window.registerEffect('entity', segment);
        lightningSegments.push(segment);
    }

    // Create flash effect simultaneously with the lightning
    VisualEffects.createLightningFlash(scene, x, y, {
        radius: 48, // 48px radius as in your code
        color: 0xFFFF66,
        alpha: 0.7,
        duration: 1000 // Match the fade-out duration of the lightning
    });

    // Apply damage to nearby enemies immediately
    const hitRadius = 64; // 64px hit radius as in your code
    const targets = scene.physics.overlapCirc(x, y, hitRadius, true, true);

    // Create unique ID for this lightning strike
    const strikeId = `lightning_${Date.now()}_${Math.random()}`;

    // Apply damage to all enemies in radius, but filter to only actual enemies
    targets.forEach(body => {
        if (body.gameObject && body.gameObject.active) {
            // Check if this game object is actually an enemy by seeing if it's in the enemies group
            const isEnemy = EnemySystem.enemiesGroup.children.entries.includes(body.gameObject);

            if (isEnemy) {
                applyContactDamage.call(
                    scene,
                    {
                        damageSourceId: strikeId,
                        damage: damage,
                        active: true
                    },
                    body.gameObject,
                    damage,
                    0 // No cooldown needed for one-time effect
                );
            }
        }
    });

    // Fade everything out together
    scene.tweens.add({
        targets: lightningSegments,
        alpha: 0,
        duration: 1000,
        onComplete: function () {
            // Clean up all elements
            lightningSegments.forEach(segment => segment.destroy());
        }
    });

    // Return the segments array for any additional manipulation
    return lightningSegments;
}

// Register component for Storm Caller ability in hero.js
PlayerComponentSystem.registerComponent('stormCallerAbility', {
    // Store timer reference
    stormTimer: null,

    initialize: function () {
        // Get the scene
        const scene = game.scene.scenes[0];
        if (!scene) return;

        // Create and register timer
        this.stormTimer = CooldownManager.createTimer({
            statName: 'luck',
            baseCooldown: 2000, //
            formula: 'sqrt',
            component: this,
            callback: function () {
                // Skip if game is over or paused
                if (gameOver || gamePaused) return;

                // Get a random target position on screen
                const targetX = Phaser.Math.Between(game.config.width * 0.083, game.config.width * 0.917); // 100/1200 to 1100/1200
                const targetY = Phaser.Math.Between(game.config.height * 0.125, game.config.height * 0.875); // 100/800 to 700/800

                // Call the lightning strike function
                createLightningStrike(scene, targetX, targetY);
            },
            callbackScope: scene,
            loop: true
        });

        // Create initial lightning immediately
        const targetX = Phaser.Math.Between(game.config.width * 0.083, game.config.width * 0.917); // 100/1200 to 1100/1200
        const targetY = Phaser.Math.Between(game.config.height * 0.125, game.config.height * 0.875); // 100/800 to 700/800
        createLightningStrike(scene, targetX, targetY);
    },

    // Cleanup on removal
    cleanup: function () {
        // Remove timer
        if (this.stormTimer) {
            CooldownManager.removeTimer(this.stormTimer);
            this.stormTimer = null;
        }
    }
});

// Register the perk with the PlayerPerkRegistry
PlayerPerkRegistry.registerPerkEffect('STORM_CALLER', {
    componentName: 'stormCallerAbility',
    condition: function () {
        // Always active when perk is acquired
        return true;
    }
});

// Function to activate storm caller
window.activateStormCaller = function () {
    // Simply add the component through the component system
    PlayerComponentSystem.addComponent('stormCallerAbility');
};

// Make the function globally accessible for other perks
window.createLightningStrike = createLightningStrike;


// Create a factory function for random shots components
function createRandomShotsComponent(baseCooldown, damageMultiplier, options = {}) {
    // Extract options with defaults
    const {
        burstDuration = null,
        burstInterval = null,
        speed = 400,
        color = '#ffff00',
        symbol = '★',
        components = [],
        cooldownStat = 'fireRate'
    } = options;

    return {
        // Store timer reference
        shotsTimer: null,

        // Configuration
        baseCooldown: baseCooldown,
        damageMultiplier: damageMultiplier,
        burstDuration: burstDuration,
        burstInterval: burstInterval,
        speed: speed,
        color: color,
        symbol: symbol,
        components: components,
        cooldownStat: cooldownStat,

        // Track if we need to fire initial shot/burst when game resumes
        needsInitialAction: false,

        initialize: function (player) {
            const scene = game.scene.scenes[0];
            if (!scene) return;

            if (this.burstDuration) {
                // Burst mode: create timer for burst cycles
                this.shotsTimer = CooldownManager.createTimer({
                    statName: this.cooldownStat,
                    baseCooldown: this.baseCooldown,
                    formula: 'sqrt',
                    component: this,
                    callback: this.startBurst,
                    callbackScope: this,
                    loop: true
                });

                // Start first burst immediately if not paused, otherwise defer
                if (gamePaused) {
                    this.needsInitialAction = true;
                } else {
                    this.startBurst();
                }
            } else {
                // Continuous mode: create timer for regular shots
                this.shotsTimer = CooldownManager.createTimer({
                    statName: this.cooldownStat,
                    baseCooldown: this.baseCooldown,
                    formula: 'sqrt',
                    component: this,
                    callback: this.fireRandomShot,
                    callbackScope: this,
                    loop: true
                });

                // Fire first shot immediately if not paused, otherwise defer
                if (gamePaused) {
                    this.needsInitialAction = true;
                } else {
                    this.fireRandomShot();
                }
            }
        },

        // Add update method to handle deferred initial actions
        update: function (player) {
            // Fire initial action when game resumes
            if (this.needsInitialAction && !gamePaused) {
                this.needsInitialAction = false;
                if (this.burstDuration) {
                    this.startBurst();
                } else {
                    this.fireRandomShot();
                }
            }
        },

        // Method to start a burst of shots
        startBurst: function () {
            if (gameOver || gamePaused) return;

            const scene = game.scene.scenes[0];
            if (!scene) return;

            const shotsInBurst = Math.floor(this.burstDuration / this.burstInterval);
            let shotsFired = 0;

            // Fire first shot immediately
            this.fireRandomShot();
            shotsFired++;

            // Create burst timer if more shots needed
            if (shotsFired < shotsInBurst) {
                const burstTimer = scene.time.addEvent({
                    delay: this.burstInterval,
                    callback: () => {
                        this.fireRandomShot();
                        shotsFired++;
                        if (shotsFired >= shotsInBurst) {
                            burstTimer.remove();
                        }
                    },
                    callbackScope: this,
                    repeat: shotsInBurst - shotsFired - 1
                });

                window.registerEffect('timer', burstTimer);
            }
        },

        // Method to fire a projectile in a random direction
        fireRandomShot: function () {
            if (gameOver || gamePaused) return;

            const scene = game.scene.scenes[0];
            if (!scene) return;

            const randomAngle = Math.random() * Math.PI * 2;
            const actualDamage = getEffectiveDamage() * this.damageMultiplier;

            const projectile = WeaponSystem.createProjectile.call(WeaponSystem, scene, {
                x: player.x,
                y: player.y,
                angle: randomAngle,
                symbol: this.symbol,
                color: this.color,
                speed: this.speed,
                damage: actualDamage,
                fontSize: getEffectiveSize(projectileSizeFactor, actualDamage)
            });

            // Attach any specified components
            if (projectile && this.components.length > 0) {
                this.components.forEach(componentName => {
                    if (ProjectileComponentSystem.componentTypes[componentName]) {
                        ProjectileComponentSystem.addComponent(projectile, componentName);
                    }
                });
            }

            return projectile;
        },

        // Cleanup on removal
        cleanup: function (player) {
            if (this.shotsTimer) {
                CooldownManager.removeTimer(this.shotsTimer);
                this.shotsTimer = null;
            }
        }
    };
}

// Register separate components for each perk to allow stacking
PlayerComponentSystem.registerComponent('shootingStarAbility', createRandomShotsComponent(600, 1));
PlayerComponentSystem.registerComponent('meteorAbility', createRandomShotsComponent(3000, 4));

// Register the Shooting Star perk
PlayerPerkRegistry.registerPerkEffect('SHOOTING_STAR', {
    componentName: 'shootingStarAbility',
    condition: function () {
        return true;
    }
});

// Register the Meteor perk  
PlayerPerkRegistry.registerPerkEffect('METEOR', {
    componentName: 'meteorAbility',
    condition: function () {
        return true;
    }
});

// Function to activate shooting star
window.activateShootingStar = function () {
    PlayerComponentSystem.addComponent('shootingStarAbility');
};

// Function to activate meteor
window.activateMeteor = function () {
    PlayerComponentSystem.addComponent('meteorAbility');
};

// Register the volcano component with burst mode
PlayerComponentSystem.registerComponent('volcanoAbility', createRandomShotsComponent(60000, 2, {
    burstDuration: 8000,        // 8 seconds of eruption
    burstInterval: 200,         // Shot every 200ms (40 shots total)
    speed: 200,                 // Slower projectiles for dramatic effect
    components: ['fireEffect'], // Attach fire effect to each projectile
    cooldownStat: 'luck'        // Cooldown scales with luck instead of fireRate
}));

// Register the perk
PlayerPerkRegistry.registerPerkEffect('VOLCANO', {
    componentName: 'volcanoAbility',
    condition: function () { return true; }
});

// Activation function
window.activateVolcano = function () {
    PlayerComponentSystem.addComponent('volcanoAbility');
};

// Add this to hero.js - Generic factory function for HP-based multiplier perks
function createHealthMultiplierComponent(multiplierName, getMultiplierRef, setMultiplierRef) {
    return {
        // Track our contribution to the specified multiplier
        currentContribution: 0,
        multiplierName: multiplierName,

        initialize: function (player) {
            // Calculate initial contribution based on current health
            this.currentContribution = playerHealth * 0.05;

            // Add our contribution to the specified multiplier
            setMultiplierRef(getMultiplierRef() + this.currentContribution);

            console.log(`${this.multiplierName} activated! Initial contribution: +${this.currentContribution.toFixed(1)} (${playerHealth} HP)`);

            // Update player stats display
            const scene = game.scene.scenes[0];
            if (scene) {
                GameUI.updateStatCircles(scene);
            }
        },

        update: function (player) {
            // Calculate what our contribution should be based on current health
            const newContribution = playerHealth * 0.05;

            // Only update if there's a meaningful change
            if (Math.abs(this.currentContribution - newContribution) > 0.01) {
                // Remove our old contribution
                setMultiplierRef(getMultiplierRef() - this.currentContribution);

                // Apply our new contribution
                this.currentContribution = newContribution;
                setMultiplierRef(getMultiplierRef() + this.currentContribution);

                // Update player stats display
                const scene = game.scene.scenes[0];
                if (scene) {
                    GameUI.updateStatCircles(scene);
                }
            }
        },

        cleanup: function (player) {
            // Remove our contribution from the multiplier
            setMultiplierRef(getMultiplierRef() - this.currentContribution);

            // Ensure multiplier doesn't go below 1.0
            const currentValue = getMultiplierRef();
            if (currentValue < 1.0) {
                setMultiplierRef(1.0);
            }

            // Update player stats display
            const scene = game.scene.scenes[0];
            if (scene) {
                GameUI.updateStatCircles(scene);
            }

            this.currentContribution = 0;
        }
    };
}

// Register components using the factory function
PlayerComponentSystem.registerComponent('judokaState',
    createHealthMultiplierComponent(
        'JUDOKA',
        () => berserkMultiplier,
        (value) => { berserkMultiplier = value; }
    )
);

PlayerComponentSystem.registerComponent('karatekaState',
    createHealthMultiplierComponent(
        'KARATEKA',
        () => archerMultiplier,
        (value) => { archerMultiplier = value; }
    )
);

// Register the JUDOKA perk with the PlayerPerkRegistry
PlayerPerkRegistry.registerPerkEffect('JUDOKA', {
    componentName: 'judokaState',
    condition: function () {
        // Always active when perk is acquired
        return true;
    }
});

// Register the KARATEKA perk with the PlayerPerkRegistry
PlayerPerkRegistry.registerPerkEffect('KARATEKA', {
    componentName: 'karatekaState',
    condition: function () {
        // Always active when perk is acquired
        return true;
    }
});

// BEACONS.JS

PlayerComponentSystem.registerComponent('divineBeaconAbility',
    BeaconSystem.createBeaconComponent(BeaconConfigs.DIVINE_BEACON)
);

PlayerComponentSystem.registerComponent('angelHoneyAbility',
    BeaconSystem.createBeaconComponent(BeaconConfigs.ANGEL_HONEY)
);

PlayerComponentSystem.registerComponent('alienClockAbility',
    BeaconSystem.createBeaconComponent(BeaconConfigs.ALIEN_CLOCK)
);

PlayerComponentSystem.registerComponent('stormBringerAbility',
    BeaconSystem.createBeaconComponent(BeaconConfigs.STORM_BRINGER)
);

PlayerPerkRegistry.registerPerkEffect('DIVINE_BEACON', {
    componentName: 'divineBeaconAbility',
    condition: function () {
        return true;
    }
});

PlayerPerkRegistry.registerPerkEffect('ANGEL_HONEY', {
    componentName: 'angelHoneyAbility',
    condition: function () {
        return true;
    }
});

PlayerPerkRegistry.registerPerkEffect('ALIEN_CLOCK', {
    componentName: 'alienClockAbility',
    condition: function () {
        return true;
    }
});

PlayerPerkRegistry.registerPerkEffect('STORM_BRINGER', {
    componentName: 'stormBringerAbility',
    condition: function () {
        return true;
    }
});

PlayerComponentSystem.registerComponent('augmentationBeaconAbility',
    BeaconSystem.createBeaconComponent(BeaconConfigs.AUGMENTATION)
);

PlayerPerkRegistry.registerPerkEffect('AUGMENTATION', {
    componentName: 'augmentationBeaconAbility',
    condition: function () {
        return true;
    }
});

// SHRINES.JS

// Register shrine components using ShrineSystem.createShrineComponent
PlayerComponentSystem.registerComponent('berserkShrineAbility',
    ShrineSystem.createShrineComponent(ShrineConfigs.BERSERK_SHRINE)
);

PlayerComponentSystem.registerComponent('archerShrineAbility',
    ShrineSystem.createShrineComponent(ShrineConfigs.ARCHER_SHRINE)
);

PlayerComponentSystem.registerComponent('healingShrineAbility',
    ShrineSystem.createShrineComponent(ShrineConfigs.HEALING_SHRINE)
);

PlayerComponentSystem.registerComponent('stormShrineAbility',
    ShrineSystem.createShrineComponent(ShrineConfigs.STORM_SHRINE)
);

PlayerComponentSystem.registerComponent('godHammerShrineAbility',
    ShrineSystem.createShrineComponent(ShrineConfigs.GOD_HAMMER_SHRINE)
);

// Register perk effects with PlayerPerkRegistry
PlayerPerkRegistry.registerPerkEffect('BERSERK_SHRINE', {
    componentName: 'berserkShrineAbility',
    condition: function () {
        return true; // Always active when perk is acquired
    }
});

PlayerPerkRegistry.registerPerkEffect('ARCHER_SHRINE', {
    componentName: 'archerShrineAbility',
    condition: function () {
        return true; // Always active when perk is acquired
    }
});

PlayerPerkRegistry.registerPerkEffect('HEALING_SHRINE', {
    componentName: 'healingShrineAbility',
    condition: function () {
        return true; // Always active when perk is acquired
    }
});

PlayerPerkRegistry.registerPerkEffect('STORM_SHRINE', {
    componentName: 'stormShrineAbility',
    condition: function () {
        return true; // Always active when perk is acquired
    }
});

PlayerPerkRegistry.registerPerkEffect('GOD_HAMMER_SHRINE', {
    componentName: 'godHammerShrineAbility',
    condition: function () {
        return true; // Always active when perk is acquired
    }
});

// Function to update player status in game loop
function updatePlayerStatus() {
    // Skip if game is over or paused
    if (gameOver || gamePaused) return;

    // Check perk conditions and apply/remove components
    PlayerPerkRegistry.checkAndApplyEffects();

    // Process update event for all active components
    PlayerComponentSystem.processEvent('update');

    // Update cooldowns based on stat changes
    CooldownManager.update();
}

// Function to reset player status (call during game restart)
function resetPlayerStatus() {
    PlayerComponentSystem.resetAll();
    berserkMultiplier = 1.0;
    archerMultiplier = 1.0;
}