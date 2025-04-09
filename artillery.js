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
    maxDistance: 400           // Distance at which minimum damage is reached
};

// Register component for distance-based damage (Crimson Scatter)
ProjectileComponentSystem.registerComponent('distanceDamage', {
    initialize: function (projectile) {
        console.log("Initializing distance damage component");

        // Store our start position and base damage in the component
        this.startX = projectile.x;
        this.startY = projectile.y;
        this.baseDamage = playerDamage;

        // Set initial scale and damage for max effect at close range
        projectile.setScale(CRIMSON_SCATTER_CONFIG.maxDamageMultiplier);
        projectile.damage = this.baseDamage * CRIMSON_SCATTER_CONFIG.maxDamageMultiplier;

        console.log("Distance damage initialized:", {
            startX: this.startX,
            startY: this.startY,
            baseDamage: this.baseDamage,
            currentDamage: projectile.damage
        });
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
            (damageRange * Math.min(distance, CRIMSON_SCATTER_CONFIG.maxDistance) / CRIMSON_SCATTER_CONFIG.maxDistance);

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

        // Reset color after a while
        scene.time.delayedCall(2000, function () {
            if (enemy && enemy.active) {
                enemy.setColor('#ff5555');
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
            applyPoisonEffect.call(scene, enemy, projectile.damage);
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

// Register component for fire effect
ProjectileComponentSystem.registerComponent('fireEffect', {
    initialize: function (projectile) {
        // Visual indicator for the projectile itself
        projectile.setColor('#FF4500');
        this.fireDamage = playerDamage; // Store damage based on player state when projectile was created
        this.fireDuration = 8000; // 4s
        this.fireTickInterval = 2000; // 2 seconds
    },

    onHit: function (projectile, enemy, scene) {
        // Don't create fire if enemy is already dead
        if (!enemy || !enemy.active || enemy.health <= 0) return;

        // Create fire at the enemy's last known position (or projectile impact)
        const fireX = projectile.x;
        const fireY = projectile.y;

        // --- Fire Object Logic START ---
        const fire = scene.add.text(fireX, fireY, '火', {
            fontFamily: 'Arial',
            fontSize: `${projectileSizeFactor * this.fireDamage}px`, // Use stored damage
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
        // Visual indicator
        projectile.setColor('#FFA500');

        // Mark as piercing
        projectile.piercing = true;

        // Store initial position and set up state
        this.startX = projectile.x;
        this.startY = projectile.y;
        this.maxDistance = 400; // Maximum distance before turning back
        this.returning = false; // Track if the boomerang is returning
        this.initialized = false; // Flag to track full initialization

        // Debug flag
        this.debug = true;

        // Use a slightly different symbol for boomerang
        projectile.setText('↺');

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

            if (this.debug) {
                console.log("Boomerang initialized with velocity:", this.originalVelocity);
                console.log("Original speed:", this.originalSpeed);
                console.log("Direction:", this.direction);
            }
        }
    },

    update: function (projectile) {
        console.log("hello?");
        if (!projectile.active || !projectile.body) return;
        console.log("are we ok?");

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

                if (this.debug) {
                    console.log("Boomerang late-initialized with velocity:", this.originalVelocity);
                }
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

            if (this.debug && distanceTraveled > 390) {
                console.log("Current distance:", distanceTraveled);
            }

            // If we've reached the maximum distance, start returning
            if (distanceTraveled >= this.maxDistance) {
                this.returning = true;

                if (this.debug) {
                    console.log("Boomerang turning at distance:", distanceTraveled);
                }

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

            if (this.debug && Math.random() < 0.01) {  // Only log occasionally
                console.log("Returning to player, distance:", distance);
            }

            // If we're close enough to the player, destroy the projectile
            if (distance < 30) {
                if (this.debug) {
                    console.log("Boomerang reached player, destroying");
                }
                projectile.destroy();
                return;
            }

            // Calculate new velocity toward player
            const returnSpeed = this.originalSpeed * 1.25; // 25% faster on return
            const newVelocityX = (dx / distance) * returnSpeed;
            const newVelocityY = (dy / distance) * returnSpeed;

            // Update velocity
            projectile.body.setVelocity(newVelocityX, newVelocityY);
        }
    }
});