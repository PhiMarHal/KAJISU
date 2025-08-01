// Orbital Component System for Word Survivors
// Manages orbital entities that circle around the player with various movement patterns

// Global list to store all orbital entities
const orbitals = [];

// Movement pattern implementations
const MovementPatterns = {
    // Standard circular orbit
    standard: function (orbital, time) {
        // Update the orbit angle based on speed
        orbital.angle += orbital.speed * (orbital.direction === 'clockwise' ? 1 : -1);

        // Calculate new position based on player position and orbit angle
        const x = player.x + Math.cos(orbital.angle) * orbital.radius;
        const y = player.y + Math.sin(orbital.angle) * orbital.radius;

        // Update orbital position
        orbital.entity.setPosition(x, y);
    },

    // Elliptical orbit (stretched circle)
    elliptical: function (orbital, time) {
        // Update the orbit angle based on speed
        orbital.angle += orbital.speed * (orbital.direction === 'clockwise' ? 1 : -1);

        // Calculate position with horizontal stretch
        const stretchX = orbital.options.stretchX ?? 1.5;
        const stretchY = orbital.options.stretchY ?? 1;

        const x = player.x + Math.cos(orbital.angle) * orbital.radius * stretchX;
        const y = player.y + Math.sin(orbital.angle) * orbital.radius * stretchY;

        // Update orbital position
        orbital.entity.setPosition(x, y);
    },

    // Figure-8 movement pattern
    figureEight: function (orbital, time) {
        // Update the orbit angle based on speed
        orbital.angle += orbital.speed * (orbital.direction === 'clockwise' ? 1 : -1);

        // Calculate figure-8 pattern using lemniscate of Bernoulli
        const scale = orbital.radius;
        const t = orbital.angle;
        const denominator = 1 + Math.sin(t) * Math.sin(t);

        const x = player.x + scale * Math.cos(t) / denominator;
        const y = player.y + scale * Math.sin(t) * Math.cos(t) / denominator;

        // Update orbital position
        orbital.entity.setPosition(x, y);
    },

    // Spiral in and out
    spiral: function (orbital, time) {
        // Update the orbit angle based on speed
        orbital.angle += orbital.speed * (orbital.direction === 'clockwise' ? 1 : -1);

        // Calculate pulsing radius
        const pulseSpeed = orbital.options.pulseSpeed ?? 0.02;
        const minRadius = orbital.options.minRadius ?? orbital.radius * 0.5;
        const maxRadius = orbital.options.maxRadius ?? orbital.radius * 1.5;

        // Use sine wave to oscillate between min and max radius
        const currentRadius = minRadius + (Math.sin(time * pulseSpeed) + 1) / 2 * (maxRadius - minRadius);

        // Calculate new position
        const x = player.x + Math.cos(orbital.angle) * currentRadius;
        const y = player.y + Math.sin(orbital.angle) * currentRadius;

        // Update orbital position
        orbital.entity.setPosition(x, y);
    },

    spiralOut: function (orbital, time) {
        // Skip if game is paused
        if (gamePaused || gameOver) {
            // Update lastUpdateTime to current time to prevent large delta when resuming
            orbital.lastUpdateTime = time;
            return;
        }

        // Update the orbit angle based on speed
        orbital.angle += orbital.speed * (orbital.direction === 'clockwise' ? 1 : -1);

        // Initialize currentRadius if not set
        if (orbital.currentRadius === undefined) {
            orbital.currentRadius = orbital.options.startRadius ?? 8;
        }

        // Initialize lastUpdate time if not set
        if (orbital.lastUpdateTime === undefined) {
            orbital.lastUpdateTime = time;
            return; // Skip first frame to avoid large delta
        }

        // Calculate actual delta time since last update
        const deltaTime = time - orbital.lastUpdateTime;
        orbital.lastUpdateTime = time;

        // Cap delta time to prevent huge jumps (e.g., after tab switching or long pauses)
        const cappedDelta = Math.min(deltaTime, 50); // Maximum 50ms delta

        // Expand radius based on actual elapsed time
        const expansionRate = orbital.options.expansionRate ?? 60; // pixels per second
        const expansionAmount = expansionRate * (cappedDelta / 1000); // Convert ms to seconds

        orbital.currentRadius += expansionAmount;

        // Calculate new position based on player position and current radius
        const x = player.x + Math.cos(orbital.angle) * orbital.currentRadius;
        const y = player.y + Math.sin(orbital.angle) * orbital.currentRadius;

        // Update orbital position
        orbital.entity.setPosition(x, y);
    },

    // Oscillating orbit (wobbles in and out while orbiting)
    oscillating: function (orbital, time) {
        // Update the orbit angle based on speed
        orbital.angle += orbital.speed * (orbital.direction === 'clockwise' ? 1 : -1);

        // Calculate wobbling radius
        const wobbleFrequency = orbital.options.wobbleFrequency ?? 5;
        const wobbleAmplitude = orbital.options.wobbleAmplitude ?? orbital.radius * 0.2;
        const baseRadius = orbital.radius;

        const currentRadius = baseRadius + Math.sin(orbital.angle * wobbleFrequency) * wobbleAmplitude;

        // Calculate new position
        const x = player.x + Math.cos(orbital.angle) * currentRadius;
        const y = player.y + Math.sin(orbital.angle) * currentRadius;

        // Update orbital position
        orbital.entity.setPosition(x, y);
    },

    directionFollowing: function (orbital, time) {
        // Skip if player is destroyed or has no velocity
        if (!player || !player.body || !player.active) return;

        // Get player velocity
        const velocity = player.body.velocity;

        // Only update angle if player is actually moving
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        const movementThreshold = 10; // Minimum velocity to consider player moving

        if (speed > movementThreshold) {
            // Calculate angle from velocity
            const newAngle = Math.atan2(velocity.y, velocity.x);

            // If we haven't stored a previous angle, initialize it
            if (orbital.lastAngle === undefined) {
                orbital.lastAngle = newAngle;
            }

            // Normalize both angles to 0-2π range for consistent comparison
            const normalizedCurrent = orbital.lastAngle % (Math.PI * 2);
            const normalizedNew = newAngle % (Math.PI * 2);

            // Ensure positive values (0 to 2π)
            const currentAngle = normalizedCurrent >= 0 ? normalizedCurrent : normalizedCurrent + Math.PI * 2;
            const targetAngle = normalizedNew >= 0 ? normalizedNew : normalizedNew + Math.PI * 2;

            // Calculate both possible rotation directions
            const clockwiseDiff = (targetAngle <= currentAngle) ?
                (targetAngle + Math.PI * 2) - currentAngle :
                targetAngle - currentAngle;

            const counterClockwiseDiff = (targetAngle >= currentAngle) ?
                (currentAngle + Math.PI * 2) - targetAngle :
                currentAngle - targetAngle;

            // Choose the smaller angle difference and correct sign
            let angleDiff = (clockwiseDiff <= counterClockwiseDiff) ?
                clockwiseDiff : -counterClockwiseDiff;

            // Apply smooth rotation using orbital.speed as the rotation speed factor
            orbital.lastAngle += angleDiff * orbital.speed;

            // Keep lastAngle in reasonable range to prevent floating point issues over time
            orbital.lastAngle = orbital.lastAngle % (Math.PI * 2);

            // Store last computed angle to use as the facing direction
            orbital.angle = orbital.lastAngle;
        }

        // Calculate new position based on player position and orbit angle
        // Add a small oscillation on the radius to make it "breathe"
        const oscillationSpeed = orbital.options.oscillationSpeed ?? 0.002;
        const oscillationAmount = orbital.options.oscillationAmount ?? 20;
        const oscillation = Math.sin(time * oscillationSpeed) * oscillationAmount;
        const currentRadius = orbital.radius + oscillation;

        const x = player.x + Math.cos(orbital.angle) * currentRadius;
        const y = player.y + Math.sin(orbital.angle) * currentRadius;

        // Update orbital position
        orbital.entity.setPosition(x, y);

        // Rotate the text to match the direction
        orbital.entity.setAngle((orbital.angle * 180 / Math.PI));
    }
};

// Helper function to process component events during collision
function processOrbitalComponentEvent(scene, orbital, enemy, eventName) {
    // Skip if entity doesn't exist or has no components
    if (!orbital.entity || !orbital.entity.components) return;

    // Process event for all components
    Object.values(orbital.entity.components).forEach(component => {
        if (component[eventName]) {
            component[eventName](orbital.entity, enemy, scene);
        }
    });
}

// Collision behavior implementations
const CollisionBehaviors = {
    // Persistent orbital that deals contact damage and stays after hitting enemies
    persistent: function (scene, orbital, enemy) {
        // Process onhit components if any
        processOrbitalComponentEvent(scene, orbital, enemy, 'onHit');

        // Apply contact damage with the specified cooldown interval
        applyContactDamage.call(
            scene,
            orbital.entity,
            enemy,
            orbital.entity.damage,
            orbital.entity.damageInterval
        );
    },

    // Projectile-like orbital that deals damage once and is destroyed on impact
    projectile: function (scene, orbital, enemy) {
        // Process onhit components if any
        processOrbitalComponentEvent(scene, orbital, enemy, 'onHit');

        // Apply damage using the contact damage system
        applyContactDamage.call(
            scene,
            orbital.entity,
            enemy,
            orbital.entity.damage,
            0 // No cooldown for single-hit projectiles
        );

        // Destroy the orbital
        destroyOrbital(orbital);
    },

    // Explosive orbital that deals area damage and is destroyed on impact
    explosive: function (scene, orbital, enemy) {
        // Process onhit components if any
        processOrbitalComponentEvent(scene, orbital, enemy, 'onHit');

        // Get position of impact (where the enemy was hit)
        const centerX = enemy.x;
        const centerY = enemy.y;

        // Get blast radius from options or use default
        const blastRadius = orbital.options.blastRadius ?? 128;

        // Create a unique explosion ID for this blast
        const explosionId = `orbital_explosion_${Date.now()}_${Math.random()}`;

        // Get all active enemies
        const allEnemies = EnemySystem.enemiesGroup.getChildren();

        // Apply damage to all enemies in blast radius
        allEnemies.forEach(nearbyEnemy => {
            if (!nearbyEnemy.active) return;

            // Calculate distance from explosion
            const dx = nearbyEnemy.x - centerX;
            const dy = nearbyEnemy.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If within blast radius, apply damage
            if (distance <= blastRadius) {
                // Create a unique ID for each affected enemy
                const enemySpecificExplosionId = `${explosionId}_${nearbyEnemy.x}_${nearbyEnemy.y}`;

                // Apply damage using the contact damage system
                applyContactDamage.call(
                    scene,
                    {
                        damageSourceId: enemySpecificExplosionId,
                        damage: orbital.entity.damage,
                        active: true
                    },
                    nearbyEnemy,
                    orbital.entity.damage,
                    0 // No cooldown for explosion effects
                );
            }
        });

        // Create explosion effect with converted color
        const explosionColor = VisualEffects.convertToColorValue(orbital.entity.style.color);
        VisualEffects.createExplosion(scene, centerX, centerY, blastRadius, explosionColor, {
            startScale: 0.2
        });

        // Destroy the orbital
        destroyOrbital(orbital);
    }
};

// Helper function to destroy an orbital
function destroyOrbital(orbital) {
    if (orbital.entity && orbital.entity.active) {
        // Process onDestroy event for components if they exist
        if (orbital.entity.components) {
            const scene = game.scene.scenes[0];
            if (scene) {
                Object.values(orbital.entity.components).forEach(component => {
                    if (component.onDestroy) {
                        component.onDestroy(orbital.entity, scene);
                    }
                });
            }
        }

        // Destroy the entity
        orbital.entity.destroy();
    }

    // Mark as destroyed
    orbital.destroyed = true;
}

// Main Orbital System
const OrbitalSystem = {
    // Initialize the system
    init: function () {
        // Clear any existing orbitals
        this.clearAll();
        console.log("Orbital system initialized");
    },

    // Create a new orbital entity
    // Create a new orbital entity
    create: function (scene, config) {
        // Default configuration with fallbacks
        const defaults = {
            symbol: '★',                 // Text symbol to display
            color: '#ffff00',            // Color of the orbital
            fontSize: 32,                // Size of the font
            radius: 80,                  // Distance from player
            angle: Math.random() * Math.PI * 2, // Starting angle (random by default)
            speed: 0.02,                 // Rotation speed
            direction: 'clockwise',      // Direction of rotation ('clockwise' or 'counterclockwise')
            pattern: 'standard',         // Movement pattern
            collisionType: 'persistent', // Collision behavior type ('persistent', 'projectile', 'explosive')
            damage: playerDamage,        // Damage dealt to enemies
            damageInterval: 500,         // Minimum time between damage instances in ms
            colliderSize: 0.8,           // Size multiplier for collision detection
            lifespan: null,              // Time in ms before auto-destruction (null for permanent)
            options: {}                  // Additional options for specific movement patterns and collision behavior
        };

        // Merge provided config with defaults
        const orbitalConfig = { ...defaults, ...config };

        // Create the orbital entity as a text object
        const entity = scene.add.text(
            player.x + Math.cos(orbitalConfig.angle) * orbitalConfig.radius,
            player.y + Math.sin(orbitalConfig.angle) * orbitalConfig.radius,
            orbitalConfig.symbol,
            {
                fontFamily: 'Arial',
                fontSize: `${orbitalConfig.fontSize}px`,
                color: orbitalConfig.color,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // Add physics to the orbital for enemy overlap detection
        scene.physics.world.enable(entity);
        entity.body.setSize(entity.width * orbitalConfig.colliderSize, entity.height * orbitalConfig.colliderSize);

        // Store unique ID for damage source (used for cooldown tracking)
        entity.damageSourceId = `orbital_${Date.now()}_${Math.random()}`;

        // Store damage value and interval on the entity
        entity.damage = orbitalConfig.damage;
        entity.damageInterval = orbitalConfig.damageInterval;

        // Initialize components object if components are specified
        if (orbitalConfig.options && orbitalConfig.options.components) {
            entity.components = {};

            // Add each specified component to the entity
            orbitalConfig.options.components.forEach(component => {
                if (component.name && ProjectileComponentSystem.componentTypes[component.name]) {
                    // Add the component to the entity
                    ProjectileComponentSystem.addComponent(
                        entity,
                        component.name,
                        component.config || {}
                    );
                }
            });
        }

        // Create the orbital object that tracks all properties
        const orbital = {
            entity: entity,
            radius: orbitalConfig.radius,
            angle: orbitalConfig.angle,
            speed: orbitalConfig.speed,
            direction: orbitalConfig.direction,
            pattern: orbitalConfig.pattern,
            collisionType: orbitalConfig.collisionType,
            damageInterval: orbitalConfig.damageInterval,
            createdAt: scene.time.now,
            lifespan: orbitalConfig.lifespan,
            options: orbitalConfig.options,
            lastUpdate: 0,               // Timestamp of last update
            destroyed: false             // Flag to mark for cleanup
        };

        // Add to global list
        orbitals.push(orbital);

        // Register for cleanup
        window.registerEffect('entity', entity);

        // Get the appropriate collision behavior function
        const collisionBehavior = CollisionBehaviors[orbitalConfig.collisionType] ?? CollisionBehaviors.persistent;

        // Add overlap with enemies
        scene.physics.add.overlap(entity, EnemySystem.enemiesGroup, function (orbitalEntity, enemy) {
            // Skip if orbital is already marked as destroyed
            if (orbital.destroyed) return;

            // Call the appropriate collision behavior function
            collisionBehavior(scene, orbital, enemy);
        }, null, scene);

        // Visual effect when spawning (optional)
        if (!orbitalConfig.options.disableSpawnTween) {
            scene.tweens.add({
                targets: entity,
                scale: { from: 0, to: 1 },
                duration: 500,
                ease: 'Back.out'
            });
        }

        // Set up auto-destruction timer if lifespan is specified
        if (orbital.lifespan !== null) {
            const timer = scene.time.delayedCall(orbital.lifespan, function () {
                // Create a fade-out effect
                scene.tweens.add({
                    targets: entity,
                    alpha: 0,
                    scale: 0,
                    duration: 300,
                    onComplete: function () {
                        destroyOrbital(orbital);
                    }
                });
            });

            // Register the timer for cleanup
            window.registerEffect('timer', timer);
        }

        return orbital;
    },

    // Update all orbitals
    update: function (scene, time) {
        // Skip if no orbitals or game state prevents updates
        if (gameOver || gamePaused || orbitals.length === 0) return;

        // Update each orbital
        orbitals.forEach(orbital => {
            // Skip if the entity was destroyed
            if (orbital.destroyed || !orbital.entity || !orbital.entity.active) return;

            // Get the movement function based on pattern
            const movementFn = MovementPatterns[orbital.pattern] ?? MovementPatterns.standard;

            // Update orbital position
            movementFn(orbital, time);

            // Update the last update time
            orbital.lastUpdate = time;
        });

        // Clean up destroyed orbitals
        this.cleanupInactive();
    },

    // Clean up inactive orbitals
    cleanupInactive: function () {
        for (let i = orbitals.length - 1; i >= 0; i--) {
            const orbital = orbitals[i];
            if (orbital.destroyed || !orbital.entity || !orbital.entity.active) {
                orbitals.splice(i, 1);
            }
        }
    },

    // Clear all orbitals
    clearAll: function () {
        // Destroy all orbital entities
        orbitals.forEach(orbital => {
            // Clean up firing timer if it exists
            if (orbital.firingTimer) {
                CooldownManager.removeTimer(orbital.firingTimer);
                orbital.firingTimer = null;
            }

            // Destroy the entity
            if (orbital.entity && orbital.entity.active) {
                orbital.entity.destroy();
            }
        });

        // Clear the array
        orbitals.length = 0;
    },

    // Get all active orbitals
    getAll: function () {
        return orbitals.filter(orbital => !orbital.destroyed && orbital.entity && orbital.entity.active);
    },

    // Get count of active orbitals
    getCount: function () {
        return this.getAll().length;
    },

    // Create multiple orbitals at once with even angle distribution
    createMultiple: function (scene, count, config) {
        const createdOrbitals = [];

        for (let i = 0; i < count; i++) {
            // Calculate evenly distributed angles
            const angle = (i / count) * Math.PI * 2;

            // Create the orbital with the calculated angle
            const orbitalConfig = { ...config, angle: angle };
            const orbital = this.create(scene, orbitalConfig);
            createdOrbitals.push(orbital);
        }

        return createdOrbitals;
    }
};

// Export the system for use in other files
window.OrbitalSystem = OrbitalSystem;