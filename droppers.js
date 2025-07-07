// Dropper Component System for Word Survivors
// Manages entities that are dropped by the player and remain in the world

// Global list to store all active drops
const drops = [];

// Behavior definitions for different types of drops
const DropBehaviors = {
    // projectile behavior - detonates on enemy contact
    projectile: function (scene, drop, enemy) {
        // Apply damage to the enemy using the contact damage system
        applyContactDamage.call(
            scene,
            drop.entity,
            enemy,
            drop.entity.damage,
            drop.damageInterval
        );

        // Apply effect component if specified
        if (drop.options && drop.options.effectComponent) {
            const componentName = drop.options.effectComponent;
            const component = ProjectileComponentSystem.componentTypes[componentName];

            if (component && component.onHit) {
                // Create a minimal synthetic projectile with necessary properties
                const syntheticProjectile = {
                    damage: drop.entity.damage,
                    x: drop.entity.x,
                    y: drop.entity.y,
                    damageSourceId: drop.entity.damageSourceId + '_effect'
                };

                // Apply the effect
                component.onHit(syntheticProjectile, enemy, scene);
            }
        }

        // Reduce drop health by 1
        drop.health -= 1;

        // Show damage visual effect
        VisualEffects.createDamageFlash(scene, drop.entity);

        // Only destroy if health reaches 0 or below
        if (drop.health <= 0) {
            DropperSystem.destroyDrop(drop);
        }
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
        // Reduce drop health by 1
        drop.health -= 1;

        // Show damage visual effect
        VisualEffects.createDamageFlash(scene, drop.entity);

        // Only destroy if health reaches 0 or below
        if (drop.health <= 0) {
            DropperSystem.destroyDrop(drop);
        }
    },

    // Player pushable behavior - entities that can be pushed by player and bounce off enemies
    playerPushable: function (scene, drop, enemy) {
        // Apply damage to the enemy using the contact damage system
        applyContactDamage.call(
            scene,
            drop.entity,
            enemy,
            drop.entity.damage,
            drop.damageInterval
        );
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
            behaviorType: 'projectile',  // Behavior type ('projectile', 'persistent', 'areaEffect')
            damage: playerDamage,        // Damage dealt to enemies
            damageInterval: 500,         // Minimum time between damage instances in ms
            colliderSize: 0.8,           // Size multiplier for collision detection
            lifespan: null,              // Time in ms before auto-destruction (null for permanent)
            health: 1,                   // NEW: Health points (1 = dies on first hit)
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
                fontStyle: dropConfig.fontStyle ?? 'bold' // Allow override, default to bold for compatibility
            }
        ).setOrigin(0.5);

        if (dropConfig.options.opacity !== undefined) {
            entity.setAlpha(dropConfig.options.opacity);
        }

        // Add physics to the drop for enemy overlap detection
        scene.physics.world.enable(entity);
        entity.body.setSize(entity.width * dropConfig.colliderSize, entity.height * dropConfig.colliderSize);
        entity.body.setImmovable(true);  // Drops don't move when collided with

        // Special physics setup for player pushable entities
        if (dropConfig.behaviorType === 'playerPushable') {
            // Override immovable setting - these entities should move when hit
            entity.body.setImmovable(false);
            entity.body.setCollideWorldBounds(true);
            entity.body.setBounce(0.8, 0.8);
            entity.body.setDrag(10, 10);
            entity.body.setMass(0.04);
            entity.body.setMaxVelocity(800, 800);

            // Add physics collider with player (for pushing with random deflection)
            scene.physics.add.collider(entity, player, function (ballEntity, player) {
                // Calculate base push direction (away from player)
                const dx = ballEntity.x - player.x;
                const dy = ballEntity.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0) {
                    // Calculate base angle
                    const baseAngle = Math.atan2(dy, dx);

                    // Add random deflection (±10 degrees in radians)
                    const randomDeflection = (Math.random() - 0.5) * (Math.PI / 9); // ±20 degrees total range
                    const finalAngle = baseAngle + randomDeflection;

                    // Apply push force with the randomized angle
                    const pushForce = 800;
                    const pushX = Math.cos(finalAngle) * pushForce;
                    const pushY = Math.sin(finalAngle) * pushForce;

                    ballEntity.body.setVelocity(pushX, pushY);
                }
            }, null, scene);
        }
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
            health: dropConfig.health,   // NEW: Store health in the drop object
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
                statName: 'luck', // Assuming area effect radius/frequency scales with luck
                baseCooldown: drop.areaEffectInterval,
                formula: 'sqrt',
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
        const behavior = DropBehaviors[dropConfig.behaviorType] ?? DropBehaviors.projectile;

        // Add overlap with enemies based on behavior
        scene.physics.add.overlap(entity, EnemySystem.enemiesGroup, function (dropEntity, enemy) {
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

        // Any custom visual effect is applied here
        applyVisualEffects(scene, entity, dropConfig.options);

        // Set up auto-destruction timer if lifespan is specified
        if (drop.lifespan !== null) {
            const timer = scene.time.delayedCall(drop.lifespan, function () {
                DropperSystem.destroyDrop(drop);
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
    processAreaEffect: function (scene, drop, time) {
        // Get all active enemies
        const allEnemies = EnemySystem.enemiesGroup.getChildren();

        // Get center position of the drop
        const centerX = drop.entity.x;
        const centerY = drop.entity.y;

        // Calculate radius based on base radius and playerLuck
        let radius = drop.areaEffectRadius;
        // If radiusScalesWithLuck flag is set, apply luck scaling
        if (drop.options.radiusScalesWithLuck) {
            radius = radius * Math.sqrt(playerLuck / BASE_STATS.LUK);
        }

        // Get the color from drop options or use default yellow
        const effectColor = drop.options.pulseColor ?? 0xffff00;

        // Always create visual effect regardless of enemy hits
        this.createPulseEffect(scene, centerX, centerY, radius, effectColor);

        // Apply damage or effects to all enemies in range
        let hitCount = 0;

        // Check if this area effect has a component
        const componentName = drop.options.effectComponent;
        const component = componentName ?
            ProjectileComponentSystem.componentTypes[componentName] : null;

        allEnemies.forEach(enemy => {
            if (!enemy.active) return;

            // Calculate distance from the drop
            const dx = enemy.x - centerX;
            const dy = enemy.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If within effect radius, apply effect
            if (distance <= radius) {
                // Always apply regular damage
                const damageAmount = drop.entity.damage;
                const areaSourceId = `${drop.entity.damageSourceId}_area_${enemy.id ?? Math.random()}`;

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

                // If there's a component with onHit method, call it as well
                if (component && component.onHit) {
                    // Create a synthetic projectile with minimal required properties
                    const syntheticProjectile = {
                        damage: drop.entity.damage,
                        x: centerX,
                        y: centerY,
                        // Add other properties that might be needed
                        damageSourceId: `${drop.entity.damageSourceId}_component_${Date.now()}_${Math.random()}`
                    };

                    // Call the component's onHit method directly
                    component.onHit(syntheticProjectile, enemy, scene);
                }

                hitCount++;
            }
        });
    },

    // New helper method to create the pulse visual effect
    createPulseEffect: function (scene, x, y, radius, color) {
        return VisualEffects.createExplosion(scene, x, y, radius, color);
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
    // Modified setupPeriodicDrops function for droppers.js
    // This now correctly uses baseCooldown, statName, and formula from the perk config.
    setupPeriodicDrops: function (scene, config) {
        // Default options
        const defaults = {
            getConfig: function () { return {}; },  // Function that returns drop config
            cooldown: 4000,                        // Base Cooldown in ms
            cooldownStat: null,                    // Stat that affects cooldown
            cooldownFormula: null,                 // Formula for stat scaling
            positionMode: 'player',                // 'player', 'random', or 'trail'
            trailInterval: 32,                    // For 'trail' mode, min distance to place new drop
            lastDropPos: { x: 0, y: 0 },           // For 'trail' mode, last position where we dropped
            enabled: true                          // Whether drops are currently enabled
        };

        // Merge provided config with defaults
        const dropperConfig = { ...defaults, ...config };

        // Initialize lastDropPos with player's current position for trail mode
        if (dropperConfig.positionMode === 'trail' && player) {
            dropperConfig.lastDropPos.x = player.x;
            dropperConfig.lastDropPos.y = player.y;
        }

        // Create timer to spawn drops using CooldownManager
        const timer = CooldownManager.createTimer({
            baseCooldown: dropperConfig.cooldown,
            statName: dropperConfig.cooldownStat,
            formula: dropperConfig.cooldownFormula,
            component: dropperConfig, // Pass the config object as component for potential future reference
            callback: function () {
                // Skip if disabled
                if (!dropperConfig.enabled) return;

                // Skip if game state prevents updates
                if (gameOver || gamePaused) return;

                // Get fresh configuration each time (in case player stats changed)
                const dropConfig = dropperConfig.getConfig();

                // Determine position based on mode
                let x, y;
                let shouldCreateDrop = true; // Flag to determine if we create a drop this cycle

                switch (dropperConfig.positionMode) {
                    case 'random':
                        // Random position on screen without padding
                        x = Phaser.Math.Between(0, game.config.width);
                        y = Phaser.Math.Between(0, game.config.height);
                        break;

                    case 'trail':
                        // Make sure player exists
                        if (!player || !player.active) {
                            shouldCreateDrop = false;
                            break;
                        }

                        // Calculate distance moved since last drop
                        const dx = player.x - dropperConfig.lastDropPos.x;
                        const dy = player.y - dropperConfig.lastDropPos.y;
                        const distanceMoved = Math.sqrt(dx * dx + dy * dy);

                        // Debug info - uncomment if needed for troubleshooting
                        //console.log(`Trail check: moved ${distanceMoved.toFixed(2)}px, need ${dropperConfig.trailInterval}px`);

                        if (distanceMoved >= dropperConfig.trailInterval) {
                            // Far enough to place a new drop
                            x = player.x;
                            y = player.y;

                            // Update last drop position
                            dropperConfig.lastDropPos.x = x;
                            dropperConfig.lastDropPos.y = y;
                        } else {
                            // Not far enough from last drop, skip this cycle
                            shouldCreateDrop = false;
                        }
                        break;

                    case 'player':
                    default:
                        // Place at player position
                        x = player.x;
                        y = player.y;
                        break;
                }

                // Only create the drop if our flag is still true
                if (shouldCreateDrop) {
                    // Assign position to drop config
                    dropConfig.x = x;
                    dropConfig.y = y;

                    // Create the drop
                    DropperSystem.create(scene, dropConfig);
                }
            },
            callbackScope: scene,
            loop: true
        });

        // Register timer for cleanup (this will now register the timer managed by CooldownManager)
        window.registerEffect('timer', timer);

        // Return a controller object
        return {
            timer: timer,
            config: dropperConfig,

            // Enable/disable drops
            setEnabled: function (enabled) {
                dropperConfig.enabled = enabled;
            },

            // Change cooldown (this will now interact with CooldownManager's timer)
            // This will update the baseCooldown of the existing timer. CooldownManager
            // will then re-apply any stat scaling.
            setCooldown: function (newCooldown) {
                if (this.timer) {
                    CooldownManager.updateTimer(
                        {
                            timer: this.timer,
                            baseCooldown: newCooldown,
                            statName: this.timer.statName, // Preserve existing statName
                            formula: this.timer.formula,   // Preserve existing formula
                            callback: this.timer.callback,
                            callbackScope: this.timer.callbackScope,
                            loop: this.timer.loop
                        },
                        // Pass the current value of the stat if statName exists, otherwise newCooldown
                        this.timer.statName ? window[this.timer.statName] : newCooldown
                    );
                }
            }
        };
    },

    // Process drop effect based on type
    processDropEffect: function (scene, drop) {
        // Check if this is a laser flower
        if (drop.options && drop.options.isLaserFlower) {
            // Initialize direction tracking if not set
            if (drop.currentDirectionIndex === undefined) {
                drop.currentDirectionIndex = 0; // Start with east (index 0)
            }

            // Direction sequence: east → south → west → north (clockwise)
            const directionSequence = [
                BEAM_DIRECTIONS.EAST,
                BEAM_DIRECTIONS.SOUTH,
                BEAM_DIRECTIONS.WEST,
                BEAM_DIRECTIONS.NORTH
            ];

            const currentDirection = directionSequence[drop.currentDirectionIndex];

            // Create beam using the enhanced BeamSystem
            BeamSystem.create(scene, {
                symbol: '線', // Light beam kanji like laser cannon
                color: '#00FFFF', // Cyan color to match the flower
                fontSize: 24, // Medium size
                damage: drop.entity.damage, // Use the flower's damage
                damageInterval: 100, // Fast damage ticks
                duration: 2000, // 2 second beam duration
                beamWidth: 24, // Medium beam width
                followPlayer: false, // Static beam from flower position
                chargeTime: 1000, // 1 second charge time
                direction: currentDirection, // Force specific direction
                originX: drop.entity.x, // Fire from flower position
                originY: drop.entity.y, // Fire from flower position
                onChargeStart: function (scene) {
                    // Small charging effect at flower position
                    VisualEffects.createChargingEffect(scene, {
                        color: '#00FFFF',
                        duration: 2000,
                        originX: drop.entity.x, // Charge effect at flower position
                        originY: drop.entity.y  // Charge effect at flower position
                    });
                }
            });

            // Advance to next direction (clockwise)
            drop.currentDirectionIndex = (drop.currentDirectionIndex + 1) % directionSequence.length;
        }
        // Existing flower logic
        else if (drop.entity.text === '花') { // Regular blooming flower
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
            drop.hasInitiallyFially = true;

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

function applyVisualEffects(scene, entity, options) {
    if (!options || !window.VisualEffects) return;

    // Check for standard pulsing effect (for backward compatibility)
    if (options.needsPulsing) {
        VisualEffects.createPulsing(scene, entity);
    }

    // Process any effects specified in visualEffect object
    if (options.visualEffect) {
        // If it's a string, assume it's the name of a VisualEffects function
        if (typeof options.visualEffect === 'string') {
            const effectName = options.visualEffect;

            // Check if the effect exists in VisualEffects
            if (typeof VisualEffects[effectName] === 'function') {
                // Handle special case for createPulsing which takes entity directly
                if (effectName === 'createPulsing') {
                    VisualEffects[effectName](scene, entity);
                } else {
                    // Call the effect function with position
                    VisualEffects[effectName](scene, entity.x, entity.y);
                }
            }
        }
        // If it's an object, it should have a type and optionally config
        else if (typeof options.visualEffect === 'object') {
            const effectName = options.visualEffect.type;
            const effectConfig = options.visualEffect.config || {};

            // Check if the effect exists
            if (typeof VisualEffects[effectName] === 'function') {
                // Handle special case for createPulsing which takes entity directly
                if (effectName === 'createPulsing') {
                    VisualEffects[effectName](scene, entity, effectConfig);
                } else {
                    // Call the effect function with position and config
                    VisualEffects[effectName](scene, entity.x, entity.y, effectConfig);
                }
            }
        }
    }
}

// Export for use in other files
window.setupPeriodicEffectsSystem = DropperSystem.setupPeriodicEffectsSystem.bind(DropperSystem);

// Export the system for use in other files
window.DropperSystem = DropperSystem;
