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

// Perk cooldowns in milliseconds
const shieldBaseCd = 80000;
const godHammerBaseCd = 120000;
const divineBeaconBaseCd = 120000;
const fatedShieldBaseCd = 60000;
const angelHoneyBaseCd = 180000;

// Player Status Component System for Word Survivors
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

        // Call cleanup function if it exists
        if (component.cleanup) {
            component.cleanup(player);
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
        // Clean up each component
        Object.keys(this.activeComponents).forEach(name => {
            this.removeComponent(name);
        });

        // Ensure activeComponents is empty
        this.activeComponents = {};
    }
};

// Register component for berserker state (Crimson Fury)
PlayerComponentSystem.registerComponent('berserkerState', {
    // Store original values for restoration
    originalColor: null,
    damageMultiplier: 2.0,
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

        // Set global berserk multiplier
        berserkMultiplier = this.damageMultiplier;

        // Update player stats display to show new values
        updatePlayerStatsText();
    },

    update: function (player) {
        // Check if we should deactivate (health above threshold)
        const healthPercentage = playerHealth / maxPlayerHealth;
        if (healthPercentage > 0.25) {
            PlayerComponentSystem.removeComponent('berserkerState');
        }
    },

    cleanup: function (player) {

        // Reset multiplier
        berserkMultiplier = 1.0;

        // Stop color tween if it exists
        if (this.colorTween) {
            this.colorTween.stop();
            this.colorTween = null;
        }

        // Restore original color
        player.setColor(this.originalColor || '#ffffff');

        // Update player stats display
        updatePlayerStatsText();
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
        // Active when health is below 25%
        return playerHealth / maxPlayerHealth <= 0.25;
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

    initialize: function (player) {

        // Reset accumulator and multiplier
        this.accumulator = 0;
        this.currentMultiplier = 1.0;

        // Reset global multiplier
        archerMultiplier = 1.0;

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

        // Only log changes in movement state to reduce spam
        const wasMoving = this.accumulator > 0 && this.currentMultiplier > 1.01;
        if (isPlayerMoving) {
            // Player is moving - increase multiplier
            const maxTimeSeconds = 60 / playerLuck;

            // Calculate increment based on delta time and max time
            const increment = deltaTime / maxTimeSeconds;

            // Increase accumulator
            this.accumulator = Math.min(1.0, this.accumulator + increment);

            // Calculate new multiplier (linear interpolation from 1.0 to maxMultiplier)
            const newMultiplier = 1.0 + (this.accumulator * (this.maxMultiplier - 1.0));

            // Only update if there's a meaningful change
            if (Math.abs(this.currentMultiplier - newMultiplier) > 0.01) {
                this.currentMultiplier = newMultiplier;
                archerMultiplier = this.currentMultiplier;

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

                    // Ensure timer is running
                    if (this.particleTimer.paused) {
                        this.particleTimer.paused = false;
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
            }
        } else {
            // Player stopped moving - reset multiplier IMMEDIATELY
            if (this.accumulator > 0 || this.currentMultiplier > 1.0) {
                // Instant reset
                this.accumulator = 0;
                this.currentMultiplier = 1.0;
                archerMultiplier = 1.0;
                this.isActive = false;

                // Pause particle creation
                if (this.particleTimer && !this.particleTimer.paused) {
                    this.particleTimer.paused = true;
                }

                // Update projectile firer
                this.updateProjectileFiringRate(scene);
            }
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
    },

    cleanup: function (player) {

        // Reset multiplier
        archerMultiplier = 1.0;

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
function dropGodHammer() {
    // Skip if no enemies
    if (!enemies || enemies.getChildren().length === 0) return;

    // Get all active enemies on screen
    const activeEnemies = enemies.getChildren().filter(enemy =>
        enemy.active &&
        enemy.x >= 0 && enemy.x <= 1200 &&
        enemy.y >= 0 && enemy.y <= 800
    );

    if (activeEnemies.length === 0) return;

    // Select a random enemy to target
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
    this.physics.add.overlap(hammer, enemies, function (hammer, enemy) {
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

// Register component for Divine Beacon ability
PlayerComponentSystem.registerComponent('divineBeaconAbility', {
    // Store timer reference
    beaconTimer: null,

    initialize: function (player) {

        // Get the scene
        const scene = game.scene.scenes[0];
        if (!scene) return;

        // Create and register timer in one step
        this.beaconTimer = CooldownManager.createTimer({
            statName: 'luck',
            baseCooldown: divineBeaconBaseCd,
            formula: 'divide',
            component: this,
            callback: this.spawnBeacon,
            callbackScope: scene
        });

        // Immediately spawn first beacon
        this.spawnBeacon.call(scene);
    },

    spawnBeacon: function () {
        // Skip if game is over or paused
        if (gameOver || gamePaused) return;

        // Random position on screen (with padding from edges)
        const x = Phaser.Math.Between(20, 1180);
        const y = Phaser.Math.Between(20, 780);

        // Create the beacon using the kanji for "heaven/sky": 天
        const beacon = this.add.text(x, y, '天', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#FFD700', // Gold color
            stroke: '#FFFFFF',
            strokeThickness: 4,
            shadow: {
                offsetX: 0,
                offsetY: 0,
                color: '#FFFFFF',
                blur: 10,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);

        // Add physics body for collision detection
        this.physics.world.enable(beacon);
        beacon.body.setSize(beacon.width * 0.8, beacon.height * 0.8);

        // Set as immovable
        beacon.body.immovable = true;

        // Add a unique ID to prevent duplicate collection
        beacon.beaconId = 'beacon_' + Date.now() + '_' + Math.random();

        // Register entity for cleanup
        window.registerEffect('entity', beacon);

        // Add overlap with player
        this.physics.add.overlap(beacon, player, function (beacon, player) {
            // Only collect if not already collected
            if (beacon.collected) return;

            // Mark as collected to prevent multiple triggers
            beacon.collected = true;

            // Trigger hammer drop
            dropGodHammer.call(this);

            // Visual effect for collection
            this.tweens.add({
                targets: beacon,
                alpha: 0,
                scale: 2,
                duration: 500,
                onComplete: function () {
                    beacon.destroy();
                }
            });

            // Create radial flash effect
            const flash = this.add.circle(beacon.x, beacon.y, 5, 0xFFFFFF, 1);
            this.tweens.add({
                targets: flash,
                radius: 100,
                alpha: 0,
                duration: 500,
                onComplete: function () {
                    flash.destroy();
                }
            });

        }, null, this);

        // Add pulsing animation
        this.tweens.add({
            targets: beacon,
            scale: { from: 0.9, to: 1.1 },
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    },

    cleanup: function (player) {
        // Remove timer from CooldownManager's registry
        CooldownManager.removeTimer(this.beaconTimer);

        // Also directly remove the timer to ensure it's destroyed
        if (this.beaconTimer && this.beaconTimer.remove) {
            this.beaconTimer.remove();
        }

        this.beaconTimer = null;
    }
});

// Register the perk with the PlayerPerkRegistry
PlayerPerkRegistry.registerPerkEffect('DIVINE_BEACON', {
    componentName: 'divineBeaconAbility',
    condition: function () {
        // Always active when perk is acquired
        return true;
    }
});

// Register component for Angel Honey ability
PlayerComponentSystem.registerComponent('angelHoneyAbility', {
    // Store timer reference
    honeyTimer: null,

    initialize: function (player) {
        // Get the scene
        const scene = game.scene.scenes[0];
        if (!scene) return;

        // Create and register timer in one step
        this.honeyTimer = CooldownManager.createTimer({
            statName: 'luck',
            baseCooldown: angelHoneyBaseCd,
            formula: 'divide',
            component: this,
            callback: this.spawnHoney,
            callbackScope: scene
        });

        // Immediately spawn first honey
        this.spawnHoney.call(scene);
    },

    spawnHoney: function () {
        // Skip if game is over or paused
        if (gameOver || gamePaused) return;

        // Random position on screen (with padding from edges)
        const x = Phaser.Math.Between(20, 1180);
        const y = Phaser.Math.Between(20, 780);

        // Create the honey using the kanji for "honey": 蜜
        const honey = this.add.text(x, y, '蜜', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#00CC00', // Green color
            stroke: '#FFFFFF',
            strokeThickness: 4,
            shadow: {
                offsetX: 0,
                offsetY: 0,
                color: '#FFFFFF',
                blur: 10,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);

        // Add physics body for collision detection
        this.physics.world.enable(honey);
        honey.body.setSize(honey.width * 0.8, honey.height * 0.8);

        // Set as immovable
        honey.body.immovable = true;

        // Add a unique ID to prevent duplicate collection
        honey.honeyId = 'honey_' + Date.now() + '_' + Math.random();

        // Register entity for cleanup
        window.registerEffect('entity', honey);

        // Add overlap with player
        this.physics.add.overlap(honey, player, function (honey, player) {
            // Only collect if not already collected
            if (honey.collected) return;

            // Mark as collected to prevent multiple triggers
            honey.collected = true;

            // Use the global fullHeal function
            window.fullHeal();

            // Visual effect for collection
            this.tweens.add({
                targets: honey,
                alpha: 0,
                scale: 2,
                duration: 500,
                onComplete: function () {
                    honey.destroy();
                }
            });

            // Create radial flash effect
            const flash = this.add.circle(honey.x, honey.y, 5, 0x00FF00, 1);
            this.tweens.add({
                targets: flash,
                radius: 100,
                alpha: 0,
                duration: 500,
                onComplete: function () {
                    flash.destroy();
                }
            });

        }, null, this);

        // Add pulsing animation
        this.tweens.add({
            targets: honey,
            scale: { from: 0.9, to: 1.1 },
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    },

    cleanup: function (player) {
        // Remove timer from CooldownManager's registry
        CooldownManager.removeTimer(this.honeyTimer);

        // Also directly remove the timer to ensure it's destroyed
        if (this.honeyTimer && this.honeyTimer.remove) {
            this.honeyTimer.remove();
        }

        this.honeyTimer = null;
    }
});

// Register the perk with the PlayerPerkRegistry
PlayerPerkRegistry.registerPerkEffect('ANGEL_HONEY', {
    componentName: 'angelHoneyAbility',
    condition: function () {
        // Always active when perk is acquired
        return true;
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
}