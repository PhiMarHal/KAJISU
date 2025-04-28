// Dropper Component System for Word Survivors
// Manages entities that are dropped by the player and remain in the world

// Global list to store all active drops
const drops = [];

// Behavior definitions for different types of drops
const DropBehaviors = {
    // Explosive behavior - detonates on enemy contact
    explosive: function (scene, drop, enemy) {
        // Apply damage to the enemy using the contact damage system
        applyContactDamage.call(
            scene,
            drop.entity,
            enemy,
            drop.entity.damage,
            0 // No cooldown for explosives as they destroy themselves after contact
        );

        // Destroy the drop
        DropperSystem.destroyDrop(drop);
    },

    // Persistent behavior - deals continuous damage while enemies overlap
    persistent: function (scene, drop, enemy) {
        // Apply contact damage with the specified cooldown
        applyContactDamage.call(
            scene,
            drop.entity,
            enemy,
            drop.entity.damage,
            drop.damageInterval
        );
    },

    // Area effect behavior - deals damage to all enemies in range periodically
    areaEffect: function (scene, drop, enemy) {
        // We don't need to do anything here since area effects 
        // are processed by the update loop, not by collision
    }
};

// Main Dropper System
const DropperSystem = {
    // Initialize the system
    init: function () {
        // Clear any existing drops
        this.clearAll();
        console.log("Dropper system initialized");
    },

    // Create a new drop entity
    create: function (scene, config) {
        // Default configuration with fallbacks
        const defaults = {
            symbol: '★',                 // Text symbol to display
            color: '#ffff00',            // Color of the drop
            fontSize: 32,                // Size of the font
            x: player.x,                 // X position (default to player position)
            y: player.y,                 // Y position (default to player position)
            behaviorType: 'explosive',   // Behavior type ('explosive', 'persistent', 'areaEffect')
            damage: playerDamage,        // Damage dealt to enemies
            damageInterval: 500,         // Minimum time between damage instances in ms
            colliderSize: 0.8,           // Size multiplier for collision detection
            lifespan: null,              // Time in ms before auto-destruction (null for permanent)
            options: {}                  // Additional options for specific behaviors
        };

        // Merge provided config with defaults
        const dropConfig = { ...defaults, ...config };

        // Create the drop entity as a text object
        const entity = scene.add.text(
            dropConfig.x,
            dropConfig.y,
            dropConfig.symbol,
            {
                fontFamily: 'Arial',
                fontSize: `${dropConfig.fontSize}px`,
                color: dropConfig.color,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        if (dropConfig.options.opacity !== undefined) {
            entity.setAlpha(dropConfig.options.opacity);
        }

        // Add physics to the drop for enemy overlap detection
        scene.physics.world.enable(entity);
        entity.body.setSize(entity.width * dropConfig.colliderSize, entity.height * dropConfig.colliderSize);
        entity.body.setImmovable(true);  // Drops don't move when collided with

        // Store unique ID for damage source (used for cooldown tracking)
        entity.damageSourceId = `drop_${Date.now()}_${Math.random()}`;

        // Store damage value on the entity
        entity.damage = dropConfig.damage;

        // Create the drop object that tracks all properties
        const drop = {
            entity: entity,
            behaviorType: dropConfig.behaviorType,
            damageInterval: dropConfig.damageInterval,
            createdAt: scene.time.now,
            lifespan: dropConfig.lifespan,
            areaEffectInterval: dropConfig.options.areaEffectInterval ?? 1000,
            areaEffectRadius: dropConfig.options.areaEffectRadius ?? 100,
            options: dropConfig.options,
            destroyed: false             // Flag to mark for cleanup
        };

        // Add to global list
        drops.push(drop);

        // Register for cleanup
        window.registerEffect('entity', entity);

        // If this is an area effect, set up its timer using CooldownManager
        if (drop.behaviorType === 'areaEffect') {
            drop.areaEffectTimer = CooldownManager.createTimer({
                statName: 'luck',
                baseCooldown: drop.areaEffectInterval,
                formula: 'divide',
                component: drop, // Reference for cleanup
                callback: function () {
                    if (gameOver || gamePaused || drop.destroyed ||
                        !drop.entity || !drop.entity.active) return;

                    // Process the area effect
                    DropperSystem.processAreaEffect(scene, drop, scene.time.now);
                },
                callbackScope: scene,
                loop: true
            });
        }

        // Get the appropriate behavior function
        const behavior = DropBehaviors[dropConfig.behaviorType] ?? DropBehaviors.explosive;

        // Add overlap with enemies based on behavior
        scene.physics.add.overlap(entity, enemies, function (dropEntity, enemy) {
            // Skip if drop is already marked as destroyed
            if (drop.destroyed) return;

            // Call the appropriate behavior function
            behavior(scene, drop, enemy);
        }, null, scene);

        // Visual effect when spawning
        scene.tweens.add({
            targets: entity,
            scale: { from: dropConfig.initialScale, to: 1 },
            duration: 500,
            ease: 'Back.out'
        });

        // Set up auto-destruction timer if lifespan is specified
        if (drop.lifespan !== null) {
            const timer = scene.time.delayedCall(drop.lifespan, function () {
                // Create a fade-out effect
                scene.tweens.add({
                    targets: entity,
                    alpha: 0,
                    // Only change scale if initialScale wasn't already 1
                    scale: dropConfig.initialScale !== 1 ? dropConfig.initialScale : entity.scale,
                    duration: 300,
                    onComplete: function () {
                        DropperSystem.destroyDrop(drop);
                    }
                });
            });

            // Register the timer for cleanup
            window.registerEffect('timer', timer);
        }

        return drop;
    },

    // Update all drops
    update: function (scene, time) {
        // Skip if no drops or game state prevents updates
        if (gameOver || gamePaused || drops.length === 0) return;

        // Clean up destroyed drops
        this.cleanupInactive();
    },

    // Process area effect for a drop
    // Updated processAreaEffect function in DropperSystem
    processAreaEffect: function (scene, drop, time) {
        // Get all active enemies
        const allEnemies = enemies.getChildren();

        // Get center position of the drop
        const centerX = drop.entity.x;
        const centerY = drop.entity.y;

        // Get the radius for this effect
        const radius = drop.areaEffectRadius;

        // Get the color from drop options or use default yellow
        const effectColor = drop.options.pulseColor ?? 0xffff00;

        // Always create visual effect regardless of enemy hits
        this.createPulseEffect(scene, centerX, centerY, radius, effectColor);

        // Apply damage to all enemies in range
        let hitCount = 0;

        allEnemies.forEach(enemy => {
            if (!enemy.active) return;

            // Calculate distance from the drop
            const dx = enemy.x - centerX;
            const dy = enemy.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If within effect radius, apply damage
            if (distance <= radius) {
                // Apply full damage without falloff
                const damageAmount = drop.entity.damage;

                // Create a unique source ID for each enemy in each pulse
                const areaSourceId = `${drop.entity.damageSourceId}_area_${enemy.id ?? Math.random()}`;

                // Apply damage using the contact damage system
                applyContactDamage.call(
                    scene,
                    {
                        damageSourceId: areaSourceId,
                        damage: damageAmount,
                        active: true
                    },
                    enemy,
                    damageAmount,
                    0 // No cooldown since the area effect has its own interval timing
                );

                hitCount++;
            }
        });
    },

    // New helper method to create the pulse visual effect
    createPulseEffect: function (scene, x, y, radius, color) {
        // Create an outlined circle for pulse effect
        const pulse = scene.add.circle(x, y, radius * 0.8, color, 0);

        // Set a stroke (outline) instead of a fill
        pulse.setStrokeStyle(4, color, 1);

        // Start with a very small scale
        pulse.setScale(0.01);

        // Animate from small to full size with fade-out
        scene.tweens.add({
            targets: pulse,
            scale: 1, // Expand to exactly the intended radius
            alpha: 0, // Fade out as it reaches full size
            duration: 1000,
            ease: 'Power2', // Physics feel to the expansion
            onComplete: function () {
                pulse.destroy();
            }
        });

        return pulse;
    },

    // Clean up inactive drops
    cleanupInactive: function () {
        for (let i = drops.length - 1; i >= 0; i--) {
            const drop = drops[i];
            if (drop.destroyed || !drop.entity || !drop.entity.active) {
                drops.splice(i, 1);
            }
        }
    },

    // Clear all drops
    clearAll: function () {
        // Destroy all drop entities
        drops.forEach(drop => {
            if (drop.entity && drop.entity.active) {
                drop.entity.destroy();
            }
        });

        // Clear the array
        drops.length = 0;
    },

    // Get all active drops
    getAll: function () {
        return drops.filter(drop => !drop.destroyed && drop.entity && drop.entity.active);
    },

    // Get count of active drops
    getCount: function () {
        return this.getAll().length;
    },

    // Setup periodic drops
    setupPeriodicDrops: function (scene, config) {
        const defaults = {
            getConfig: function () { return {}; },  // Function that returns drop configuration
            cooldown: 4000,                        // Time between drops in ms
            positionMode: 'player',                // 'player', 'random', or 'trail'
            trailInterval: 500,                    // For 'trail' mode, min distance to place new drop
            lastDropPos: { x: 0, y: 0 },           // For 'trail' mode, last position where we dropped
            enabled: true                          // Whether drops are currently enabled
        };

        // Merge provided config with defaults
        const dropperConfig = { ...defaults, ...config };

        // Calculate cooldown based on player stats if needed
        let cooldown = dropperConfig.cooldown;
        if (typeof cooldown === 'function') {
            cooldown = cooldown();
        }

        // Create timer to spawn drops
        const timer = scene.time.addEvent({
            delay: cooldown,
            callback: function () {
                // Skip if disabled
                if (!dropperConfig.enabled) return;

                // Get fresh configuration each time (in case player stats changed)
                const dropConfig = dropperConfig.getConfig();

                // Determine position based on mode
                let x, y;

                switch (dropperConfig.positionMode) {
                    case 'random':
                        // Random position on screen no padding
                        x = Phaser.Math.Between(0, 1200);
                        y = Phaser.Math.Between(0, 800);
                        break;

                    case 'trail':
                        // Place at player position if sufficiently far from last drop
                        const dx = player.x - dropperConfig.lastDropPos.x;
                        const dy = player.y - dropperConfig.lastDropPos.y;
                        const distanceMoved = Math.sqrt(dx * dx + dy * dy);

                        if (distanceMoved >= dropperConfig.trailInterval) {
                            x = player.x;
                            y = player.y;

                            // Update last drop position
                            dropperConfig.lastDropPos.x = x;
                            dropperConfig.lastDropPos.y = y;
                        } else {
                            // Not far enough from last drop, skip this one
                            return;
                        }
                        break;

                    case 'player':
                    default:
                        // At player position
                        x = player.x;
                        y = player.y;
                        break;
                }

                // Create the drop
                dropConfig.x = x;
                dropConfig.y = y;
                DropperSystem.create(scene, dropConfig);
            },
            callbackScope: scene,
            loop: true
        });

        // Register timer for cleanup
        window.registerEffect('timer', timer);

        // Return a controller object
        return {
            timer: timer,
            config: dropperConfig,

            // Enable/disable drops
            setEnabled: function (enabled) {
                dropperConfig.enabled = enabled;
            },

            // Change cooldown
            setCooldown: function (newCooldown) {
                if (timer && timer.delay) {
                    timer.delay = newCooldown;
                    timer.reset({
                        delay: newCooldown,
                        callback: timer.callback,
                        callbackScope: timer.callbackScope,
                        loop: timer.loop
                    });
                }
            }
        };
    },

    // Process drop effect based on type
    processDropEffect: function (scene, drop) {
        // Check symbol to determine effect type
        if (drop.entity.text === '花') { // Flower
            // Fire defensive burst for flowers
            window.createDefensiveBurst(scene, drop.entity.x, drop.entity.y, {
                projectileCount: playerLuck * 2,
                visualEffect: true
            });
        }
        // Can add more effect types here as needed
    },

    // Create a timer for a drop's periodic effect
    createDropEffectTimer: function (scene, drop) {
        // Get cooldown from options or use default
        const baseCooldown = drop.options.periodicEffectCooldown ?? 10000;

        // If drop should fire immediately, process effect now
        if (drop.options.fireImmediately && !drop.hasInitiallyFired) {
            // Mark as having fired to prevent duplicates
            drop.hasInitiallyFired = true;

            // Process effect immediately
            this.processDropEffect(scene, drop);
        }

        // Create timer using CooldownManager
        drop.effectTimer = CooldownManager.createTimer({
            statName: 'luck',
            baseCooldown: baseCooldown,
            formula: 'sqrt',
            component: drop, // Store reference for easier cleanup
            callback: function () {
                if (gameOver || gamePaused) return;

                // Check if drop still exists
                if (!drop.entity || !drop.entity.active || drop.destroyed) {
                    // Timer will be cleaned up automatically by destroyDrop
                    return;
                }

                // Process the effect
                DropperSystem.processDropEffect(scene, drop);
            },
            callbackScope: scene,
            loop: true
        });
    },

    // Setup system for drops with periodic effects
    setupPeriodicEffectsSystem: function (scene) {
        // Create a timer to periodically check all drops with effects
        const checkTimer = CooldownManager.createTimer({
            statName: 'luck',
            baseCooldown: 1000, // Check every second
            formula: 'divide',
            callback: function () {
                if (gameOver || gamePaused) return;

                // Get all active drops
                const allDrops = DropperSystem.getAll();

                // Filter for drops with periodic effects
                const dropsWithEffects = allDrops.filter(drop =>
                    drop.options && drop.options.hasPeriodicEffect);

                // Process each drop
                dropsWithEffects.forEach(drop => {
                    // Skip if already destroyed
                    if (drop.destroyed) return;

                    // Initialize effect timer if it doesn't exist
                    if (!drop.effectTimer) {
                        DropperSystem.createDropEffectTimer(scene, drop);
                    }
                });
            },
            callbackScope: scene,
            loop: true
        });

        // Register for cleanup
        window.registerEffect('timer', checkTimer);
    },

    // Enhanced destroyDrop function that cleans up timers
    destroyDrop: function (drop) {
        // Clean up effect timer if it exists
        if (drop.effectTimer) {
            CooldownManager.removeTimer(drop.effectTimer);
            drop.effectTimer = null;
        }

        // Also clean up area effect timer if it exists
        if (drop.areaEffectTimer) {
            CooldownManager.removeTimer(drop.areaEffectTimer);
            drop.areaEffectTimer = null;
        }

        // Destroy the entity if it exists
        if (drop.entity && drop.entity.active) {
            drop.entity.destroy();
        }

        // Mark as destroyed for cleanup
        drop.destroyed = true;
    }
};

// Export the system for use in other files
window.DropperSystem = DropperSystem;

// Export for use in other files
window.setupPeriodicEffectsSystem = DropperSystem.setupPeriodicEffectsSystem.bind(DropperSystem);