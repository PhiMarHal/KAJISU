// Projectile Component System for Word Survivors
// This system manages special behaviors for projectiles through a component architecture

// Component system for projectiles
const ProjectileComponentSystem = {
    // Component definitions
    componentTypes: {},

    // Register a new component type
    registerComponent: function (name, componentDef) {
        this.componentTypes[name] = componentDef;
    },

    // Add a component to a projectile
    addComponent: function (projectile, componentName, config = {}) {
        // Initialize components object if it doesn't exist
        projectile.components = projectile.components || {};

        // Skip if component already exists or type not registered
        if (projectile.components[componentName] || !this.componentTypes[componentName]) {
            return projectile;
        }

        // Create component from registered type
        const componentDef = this.componentTypes[componentName];
        const component = { ...componentDef };

        // Apply configuration
        Object.assign(component, config);

        // Store component reference
        projectile.components[componentName] = component;

        // Call initialize function if it exists
        if (component.initialize) {
            component.initialize(projectile);
        }

        return projectile;
    },

    // Process a specific event for all components on a projectile
    processEvent: function (projectile, eventName, ...args) {
        if (!projectile || !projectile.components) return;

        // Call the event handler on each component that has it
        Object.values(projectile.components).forEach(component => {
            if (component[eventName]) {
                // Pass the scene as a context if needed
                component[eventName](projectile, ...[...args, projectile.scene]);
            }
        });
    }
};

// Configuration variables for Crimson Scatter (distance-based damage)
const CRIMSON_SCATTER_CONFIG = {
    maxDamageMultiplier: 1.6,  // Maximum multiplier at close range
    minDamageMultiplier: 0.4,  // Minimum multiplier at maximum distance
    distanceMultiplier: 400
};

// Register component for distance-based damage (Crimson Scatter)
ProjectileComponentSystem.registerComponent('distanceDamage', {
    initialize: function (projectile) {
        // Store our start position and base damage in the component
        this.startX = projectile.x;
        this.startY = projectile.y;
        this.baseDamage = playerDamage;

        // Calculate maxDistance dynamically based on current playerFireRate
        this.maxDistance = (Math.sqrt(playerFireRate / BASE_STATS.AGI)) * CRIMSON_SCATTER_CONFIG.distanceMultiplier;

        // Set initial scale and damage for max effect at close range
        projectile.setScale(CRIMSON_SCATTER_CONFIG.maxDamageMultiplier);
        projectile.damage = this.baseDamage * CRIMSON_SCATTER_CONFIG.maxDamageMultiplier;
    },

    update: function (projectile) {
        // Calculate distance from starting position
        const dx = projectile.x - this.startX;
        const dy = projectile.y - this.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate the damage range (difference between max and min multipliers)
        const damageRange = CRIMSON_SCATTER_CONFIG.maxDamageMultiplier - CRIMSON_SCATTER_CONFIG.minDamageMultiplier;

        // Calculate damage multiplier based on distance
        let damageMultiplier = CRIMSON_SCATTER_CONFIG.maxDamageMultiplier -
            (damageRange * Math.min(distance, this.maxDistance) / this.maxDistance);

        // Update projectile damage
        projectile.damage = this.baseDamage * damageMultiplier;

        // Update projectile scale to reflect damage (visual feedback)
        projectile.setScale(damageMultiplier);
    }
});

// Register component for slow effect
ProjectileComponentSystem.registerComponent('slowEffect', {
    initialize: function (projectile) {
        // Visual indicator
        projectile.setColor('#00ffff');
    },

    onHit: function (projectile, enemy, scene) {
        // Slow the enemy by half
        enemy.speed = Math.max(10, enemy.speed * 0.5);

        // Visual indication of slowed enemy
        enemy.setColor('#00ffff');
    }
});

// Register component for explosion area damage effect
ProjectileComponentSystem.registerComponent('explosionEffect', {
    initialize: function (projectile) {
        // Visual indicator for the projectile
        projectile.setColor('#FF9500'); // Orange color for explosive feel

        // Set default properties
        this.damageMultiplier = 1; // 100% of player damage in AOE
        this.radiusMultiplier = 64; // 64 * sqrt luck
        this.falloffMultiplier = 0; // No falloff by default

        // Calculate radius based on player luck at creation time
        this.radius = this.radiusMultiplier * (Math.sqrt(playerLuck / BASE_STATS.LUK));

        // Create unique damage source ID for this explosion
        projectile.explosionSourceId = `explosion_${Date.now()}_${Math.random()}`;
    },

    onHit: function (projectile, enemy, scene) {
        // Store the hit position (enemy's location)
        const hitX = enemy.x;
        const hitY = enemy.y;

        // Create explosion visual effect
        this.createExplosionEffect(hitX, hitY, scene);

        // Calculate damage amount
        const explosionDamage = playerDamage * this.damageMultiplier;

        // Get all active enemies
        const allEnemies = enemies.getChildren();

        // Track primary target to avoid double-counting
        const primaryTarget = enemy;

        // Apply damage to all enemies in explosion radius
        allEnemies.forEach(targetEnemy => {
            // Skip the primary target as it already received damage from the projectile
            if (targetEnemy === primaryTarget || !targetEnemy.active) return;

            // Calculate distance from explosion center to enemy
            const dx = targetEnemy.x - hitX;
            const dy = targetEnemy.y - hitY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If enemy is within radius, apply damage
            if (distance <= this.radius) {
                // Calculate damage with optional falloff
                let damageAmount = explosionDamage;

                // Apply falloff if enabled
                if (this.falloffMultiplier > 0) {
                    const falloff = 1 - (distance / this.radius) * this.falloffMultiplier;
                    damageAmount = explosionDamage * falloff;
                }

                // Use the existing contact damage system
                applyContactDamage.call(
                    scene,
                    {
                        damageSourceId: projectile.explosionSourceId,
                        damage: damageAmount,
                        active: true
                    },
                    targetEnemy,
                    damageAmount,
                    0 // No cooldown needed for one-time explosion
                );
            }
        });
    },

    createExplosionEffect: function (x, y, scene) {
        // Create an outlined circle
        const explosion = scene.add.circle(x, y, this.radius * 0.8, 0xFF9500, 0);

        // Set a stroke (outline) instead of a fill
        explosion.setStrokeStyle(4, 0xFF9500, 1); // 3px width, amber color, 70% opacity

        // Start with a very small scale
        explosion.setScale(0.2);

        // Animate from small to full size with fade-out
        scene.tweens.add({
            targets: explosion,
            scale: 1, // Expand to exactly the intended radius
            alpha: 0, // Fade out as it reaches full size
            duration: 1000,
            ease: 'Power2', // Gives a bit of physics feel to the expansion
            onComplete: function () {
                explosion.destroy();
            }
        });
    }

});

// Register component for poison effect
ProjectileComponentSystem.registerComponent('poisonEffect', {
    initialize: function (projectile) {
        // Visual indicator
        projectile.setColor('#2aad27');
    },

    onHit: function (projectile, enemy, scene) {
        if (enemy.health > 0) {
            // Store original color to reset after poison
            enemy.originalColor = enemy.style.color || '#ff5555';

            // Set enemy color to indicate poison
            enemy.setColor('#2aad27');

            // Calculate poison tick damage
            const tickDamage = playerDamage * 0.5;

            // Track completed ticks (for timer completion detection)
            let completedTicks = 0;
            const totalTicks = 4;

            // Create and register the poison timer
            const poisonTimer = registerTimer(scene.time.addEvent({
                delay: 1000, // 1 second between ticks
                callback: function () {
                    // Skip if enemy is destroyed
                    if (!enemy || !enemy.active) {
                        return;
                    }

                    // Apply poison damage
                    enemy.health -= tickDamage;

                    // Flash enemy to show damage
                    scene.tweens.add({
                        targets: enemy,
                        alpha: 0.6,
                        duration: 100,
                        yoyo: true
                    });

                    // Count this tick
                    completedTicks++;

                    // Check if enemy is defeated by poison
                    if (enemy.health <= 0) {
                        defeatedEnemy.call(scene, enemy);
                    }
                    // Reset color if this is the last tick and enemy still alive
                    else if (completedTicks === totalTicks && enemy.active) {
                        enemy.setColor(enemy.originalColor);
                    }
                },
                callbackScope: scene,
                repeat: totalTicks - 1 // 4 ticks total (first run + 3 repeats)
            }));

            // Register the timer for proper cleanup
            window.registerEffect('timer', poisonTimer);
        }
    }
});

// Register component for split effect
ProjectileComponentSystem.registerComponent('splitEffect', {
    initialize: function (projectile) {
        // Visual indicator
        projectile.setColor('#1E90FF');
    },

    onHit: function (projectile, enemy, scene) {
        if (enemy.health > 0 && !projectile.hasSplit) {

            // Set projectile to split, avoids multiple trigger if projectile is piercing
            projectile.hasSplit = true;

            // Calculate the original trajectory angle
            let angle = 0;

            // If projectile has velocity, calculate angle from it
            if (projectile.body.velocity.x !== 0 || projectile.body.velocity.y !== 0) {
                angle = Math.atan2(projectile.body.velocity.y, projectile.body.velocity.x);
            }

            // Calculate perpendicular angles (90 degrees to each side)
            const angle1 = angle + Math.PI / 2;
            const angle2 = angle - Math.PI / 2;

            // Create the two split projectiles
            for (const splitAngle of [angle1, angle2]) {
                // Create a new projectile at the enemy's position
                const splitProjectile = createProjectileBase(scene, enemy.x, enemy.y, '#1E90FF', '✧');

                // Set half damage for split projectiles
                splitProjectile.damage = projectile.damage / 2;

                // Mark that this is a split projectile to prevent infinite splitting
                splitProjectile.hasSplit = true;

                // Set velocity based on the calculated angles
                const speed = 300; // Slightly slower than regular projectiles
                splitProjectile.body.setVelocity(
                    Math.cos(splitAngle) * speed,
                    Math.sin(splitAngle) * speed
                );

                // Add visual effect
                scene.tweens.add({
                    targets: splitProjectile,
                    alpha: { from: 0.7, to: 1 },
                    scale: { from: 0.7, to: 1 },
                    duration: 200
                });
            }
        }
    }
});

// Register component for Titan Stomp effect
ProjectileComponentSystem.registerComponent('stompEffect', {
    initialize: function (projectile) {
        // Create immediate explosion at player position
        this.createStompEffect(projectile, projectile.scene);

        // Mark this projectile as having triggered its effect
        projectile.stompTriggered = true;
    },

    createStompEffect: function (projectile, scene) {
        // Calculate radius based on player luck
        const radius = 80 * Math.sqrt(playerLuck / BASE_STATS.LUK)

        // Get player position
        const x = player.x;
        const y = player.y;

        // Create a unique damage source ID that's available in this scope
        const damageId = `stomp_${Date.now()}_${Math.random()}`;

        // Create an outlined circle for stomp effect
        const explosion = scene.add.circle(x, y, radius * 0.8, 0x8B4513, 0);

        // Set a stroke (outline) instead of a fill - using brown color for stomp
        explosion.setStrokeStyle(4, 0x8B4513, 1);

        // Start with a very small scale
        explosion.setScale(0.2);

        // Animate from small to full size with fade-out
        scene.tweens.add({
            targets: explosion,
            scale: 1, // Expand to exactly the intended radius
            alpha: 0, // Fade out as it reaches full size
            duration: 1000, // Match the duration of the explosion effect
            ease: 'Power2', // Same easing for consistency
            onComplete: function () {
                explosion.destroy();
            }
        });

        // Get all active enemies
        const allEnemies = enemies.getChildren();

        // Apply damage to enemies in range
        allEnemies.forEach(enemy => {
            if (!enemy.active) return;

            // Calculate distance from stomp to enemy
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If enemy is within radius, apply damage
            if (distance <= radius) {
                applyContactDamage.call(
                    scene,
                    {
                        damageSourceId: damageId, // Using local variable
                        damage: playerDamage,
                        active: true // Adding active: true property
                    },
                    enemy,
                    playerDamage,
                    0 // No cooldown needed
                );
            }
        });
    }
});

// Register component for fire effect
ProjectileComponentSystem.registerComponent('fireEffect', {
    initialize: function (projectile) {
        // Visual indicator for the projectile itself
        projectile.setColor('#FF4500');
        this.fireDamage = playerDamage / 10; // Store damage based on player state when projectile was created
        this.fireDuration = 4000; // 4s
        this.fireTickInterval = 200; // 0.2 seconds
    },

    onHit: function (projectile, enemy, scene) {
        // Don't create fire if enemy is already dead
        if (!enemy || !enemy.active || enemy.health <= 0) return;

        // Also make sure to do this check, in case origin proj is piercing
        if (projectile.effectTriggered) return;
        projectile.effectTriggered = true;

        // Create fire at the enemy's last known position (or projectile impact)
        const fireX = projectile.x;
        const fireY = projectile.y;

        // --- Fire Object Logic START ---
        const fire = scene.add.text(fireX, fireY, '火', {
            fontFamily: 'Arial',
            fontSize: `${projectileSizeFactor * playerDamage * 2 / 3}px`, // Use stored damage, but scale it to 66%
            color: '#FF4500',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        scene.physics.world.enable(fire);
        fire.body.setSize(fire.width * 0.8, fire.height * 0.8);
        fire.body.setAllowGravity(false); // Ensure it doesn't fall if gravity is ever enabled
        fire.body.setImmovable(true);

        // Custom properties for the fire object
        fire.damagePerTick = this.fireDamage; // Use damage from the projectile component
        fire.tickInterval = this.fireTickInterval;
        fire.damageSourceId = `fire_${Date.now()}_${Math.random()}`; // Unique ID for contact damage cooldown

        // Register the fire entity for cleanup on game reset
        window.registerEffect('entity', fire);

        // --- Damage Ticking Timer ---
        const damageTimer = registerTimer(scene.time.addEvent({
            delay: fire.tickInterval,
            callback: function () {
                if (!fire.active) return; // Stop if fire is gone

                // Find enemies overlapping the fire
                scene.physics.overlap(fire, enemies, (fireInstance, overlappedEnemy) => {
                    // Use the generic contact damage function from index.html
                    // Pass a shorter cooldown specific to fire ticks (e.g., slightly less than tick interval)
                    applyContactDamage.call(scene, fireInstance, overlappedEnemy, fireInstance.damagePerTick, fireInstance.tickInterval - 100);
                });
            },
            callbackScope: scene, // Ensure 'this' is the scene inside callback
            loop: true
        }));

        // --- Visual Tweens (Managed by Scene Tween Manager) ---
        const pulseTween = scene.tweens.add({
            targets: fire,
            scale: { from: 0.9, to: 1.1 },
            duration: 500,
            yoyo: true,
            repeat: -1 // Loop indefinitely until stopped
        });

        const fadeTween = scene.tweens.add({
            targets: fire,
            alpha: { from: 1, to: 0 },
            duration: this.fireDuration, // Use stored duration
            delay: 100, // Start fade slightly after creation
            onComplete: function () {
                // Cleanup when fade is complete
                damageTimer.remove(); // Stop the damage timer
                pulseTween.stop(); // Stop the pulse tween
                // Remove from effect registry? (Optional, depends on how reset works)
                // const index = activeEffects.entities.indexOf(fire);
                // if (index > -1) activeEffects.entities.splice(index, 1);
                fire.destroy(); // Destroy the fire object
            }
        });

        // Initial spawn effect
        fire.setScale(0.5);
        scene.tweens.add({
            targets: fire,
            scale: 1,
            duration: 200,
            ease: 'Back.out'
        });
        // --- Fire Object Logic END ---
    }
});

// Register component for multi-shot effect (Purple Owl)
ProjectileComponentSystem.registerComponent('piercingEffect', {
    initialize: function (projectile) {
        // Mark the projectile as piercing
        projectile.piercing = true;

        // Visual indicator for piercing projectiles
        projectile.setColor('#00ff88');
    }
});

// Register component for boomerang effect
ProjectileComponentSystem.registerComponent('boomerangEffect', {
    initialize: function (projectile) {
        // Mark as piercing
        projectile.piercing = true;

        // Store initial position and set up state
        this.startX = projectile.x;
        this.startY = projectile.y;
        this.maxDistance = 400; // Maximum distance before turning back
        this.returning = false; // Track if the boomerang is returning
        this.initialized = false; // Flag to track full initialization

        // Add rotation animation
        projectile.scene.tweens.add({
            targets: projectile,
            angle: 360,
            duration: 1000,
            repeat: -1,
            ease: 'Linear'
        });

        // Set flag for a deferred velocity capture
        projectile.needsOnFireEvent = true;
    },

    // Capture velocity when the projectile is fully created
    onFire: function (projectile, scene, angle) {
        // Now we can safely access the velocity
        if (projectile.body && projectile.body.velocity) {
            const velocity = projectile.body.velocity;

            // Store original velocity for direction
            this.originalVelocity = {
                x: velocity.x,
                y: velocity.y
            };

            // Store original speed
            this.originalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

            // Calculate original direction (normalized)
            this.direction = {
                x: velocity.x / this.originalSpeed,
                y: velocity.y / this.originalSpeed
            };

            this.initialized = true;
        }
    },

    update: function (projectile) {
        if (!projectile.active || !projectile.body) return;

        // Skip until fully initialized
        if (!this.initialized) {
            // Try to initialize if possible
            if (projectile.body && projectile.body.velocity) {
                const velocity = projectile.body.velocity;

                this.originalVelocity = {
                    x: velocity.x,
                    y: velocity.y
                };

                // Store original speed
                this.originalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

                // Calculate original direction (normalized)
                this.direction = {
                    x: velocity.x / this.originalSpeed,
                    y: velocity.y / this.originalSpeed
                };

                this.initialized = true;
            } else {
                return; // Skip until initialized
            }
        }

        // Check if player is destroyed (game over)
        if (!player || !player.active) {
            projectile.destroy();
            return;
        }

        if (!this.returning) {
            // Calculate distance from starting position
            const dx = projectile.x - this.startX;
            const dy = projectile.y - this.startY;
            const distanceTraveled = Math.sqrt(dx * dx + dy * dy);

            // If we've reached the maximum distance, start returning
            if (distanceTraveled >= this.maxDistance) {
                this.returning = true;

                // Flash effect when turning
                projectile.scene.tweens.add({
                    targets: projectile,
                    alpha: 0.3,
                    scale: 1.5,
                    duration: 100,
                    yoyo: true,
                    repeat: 1
                });
            }
        }

        if (this.returning) {
            // Calculate direction to player
            const dx = player.x - projectile.x;
            const dy = player.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If we're close enough to the player, destroy the projectile
            if (distance < 30) {
                projectile.destroy();
                return;
            }

            // Calculate new velocity toward player
            const returnSpeed = this.originalSpeed * 1;
            const newVelocityX = (dx / distance) * returnSpeed;
            const newVelocityY = (dy / distance) * returnSpeed;

            // Update velocity
            projectile.body.setVelocity(newVelocityX, newVelocityY);
        }
    }
});