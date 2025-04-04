// Dropper Component System for Word Survivors
// Manages entities that are dropped by the player and remain in the world

// Global list to store all active drops
const drops = [];

// Behavior definitions for different types of drops
const DropBehaviors = {
    // Explosive behavior - detonates on enemy contact
    explosive: function (scene, drop, enemy) {
        // Apply damage to the enemy
        enemy.health -= drop.entity.damage;

        // Visual effect for the enemy taking damage
        scene.tweens.add({
            targets: enemy,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 1
        });

        // Check if enemy is defeated
        if (enemy.health <= 0) {
            defeatedEnemy.call(scene, enemy);
        }

        // Destroy the drop
        destroyDrop(drop);
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

// Helper function to destroy a drop
function destroyDrop(drop) {
    if (drop.entity && drop.entity.active) {
        drop.entity.destroy();
    }

    // Mark as destroyed for cleanup
    drop.destroyed = true;
}

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
            lastAreaEffect: 0,           // Timestamp of last area effect (for areaEffect behavior)
            areaEffectInterval: dropConfig.options.areaEffectInterval ?? 1000,
            areaEffectRadius: dropConfig.options.areaEffectRadius ?? 100,
            options: dropConfig.options,
            destroyed: false             // Flag to mark for cleanup
        };

        // Add to global list
        drops.push(drop);

        // Register for cleanup
        window.registerEffect('entity', entity);

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
                        destroyDrop(drop);
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

        // Process area effects for relevant drops
        drops.forEach(drop => {
            // Skip if not an area effect or already destroyed
            if (drop.behaviorType !== 'areaEffect' || drop.destroyed ||
                !drop.entity || !drop.entity.active) return;

            // Check if it's time for another area effect
            const timeSinceLastEffect = time - drop.lastAreaEffect;
            if (timeSinceLastEffect < drop.areaEffectInterval) return;

            // Apply area effect
            this.processAreaEffect(scene, drop, time);
            drop.lastAreaEffect = time;
        });

        // Clean up destroyed drops
        this.cleanupInactive();
    },

    // Process area effect for a drop
    processAreaEffect: function (scene, drop, time) {
        // Get all active enemies
        const allEnemies = enemies.getChildren();

        // Get center position of the drop
        const centerX = drop.entity.x;
        const centerY = drop.entity.y;

        // Apply damage to all enemies in range
        let hitCount = 0;

        allEnemies.forEach(enemy => {
            if (!enemy.active) return;

            // Calculate distance from the drop
            const dx = enemy.x - centerX;
            const dy = enemy.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If within effect radius, apply damage
            if (distance <= drop.areaEffectRadius) {
                // Visual effect for enemy being affected
                scene.tweens.add({
                    targets: enemy,
                    alpha: 0.7,
                    duration: 100,
                    yoyo: true
                });

                // Apply damage (with falloff based on distance)
                const falloff = 1 - (distance / drop.areaEffectRadius) * 0.5; // 50% falloff at max range
                const damageAmount = drop.entity.damage * falloff;

                enemy.health -= damageAmount;
                hitCount++;

                // Check if enemy is defeated
                if (enemy.health <= 0) {
                    defeatedEnemy.call(scene, enemy);
                }
            }
        });

        // If any enemies were hit, show area effect animation
        if (hitCount > 0) {
            // Create pulse animation
            const pulse = scene.add.circle(
                centerX,
                centerY,
                drop.areaEffectRadius,
                0xffaa00,
                0.2
            );

            scene.tweens.add({
                targets: pulse,
                alpha: 0,
                scale: 1.2,
                duration: 500,
                onComplete: function () {
                    pulse.destroy();
                }
            });
        }
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
    }
};

// Export the system for use in other files
window.DropperSystem = DropperSystem;