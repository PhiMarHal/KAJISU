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
        // Apply cyan color to projectile to indicate slow effect
        SpriteEffectHelpers.applyEffectColor(projectile, '#00ffff');
    },

    onHit: function (projectile, enemy, scene) {
        if (!enemy || !enemy.active || enemy.health <= 0) return;
        if (enemy.isSlowed) return; // Avoid stacking slow effects

        // Mark enemy as slowed
        enemy.isSlowed = true;
        enemy.originalSpeed = enemy.speed || 50;

        // Reduce enemy speed
        enemy.speed = Math.max(10, enemy.speed * 0.5);

        // Apply cyan tint to enemy to show slow effect
        SpriteEffectHelpers.applyEffectColorTexture(enemy, '#00ffff', scene);

        console.log(`Enemy slowed: ${enemy.text || enemy.kanjiCharacter}`);
    }
});

// Register component for explosion area damage effect
ProjectileComponentSystem.registerComponent('explosionEffect', {
    initialize: function (projectile) {
        // Visual indicator for the projectile
        projectile.setColor('#FF9500'); // Orange color for explosive feel

        // Set default properties
        this.damageMultiplier = 1; // 100% of player damage in AOE
        this.radiusMultiplier = 80; // 80 * sqrt luck
        this.falloffMultiplier = 0; // No falloff by default

        // Calculate radius based on player luck at creation time
        this.radius = this.radiusMultiplier * (Math.sqrt(playerLuck / BASE_STATS.LUK));

        // Create unique damage source ID for this explosion
        projectile.explosionSourceId = `explosion_${Date.now()}_${Math.random()}`;
    },

    onHit: function (projectile, enemy, scene) {
        // Prevent multiple triggers for piercing projectiles
        if (projectile.effectTriggered) return;
        projectile.effectTriggered = true;

        // Store the hit position (enemy's location)
        const hitX = enemy.x;
        const hitY = enemy.y;

        // Create explosion visual effect
        this.createExplosionEffect(hitX, hitY, scene);

        // Calculate damage amount
        const explosionDamage = playerDamage * this.damageMultiplier;

        // Get all active enemies
        const allEnemies = EnemySystem.enemiesGroup.getChildren();

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
        return VisualEffects.createExplosion(scene, x, y, this.radius, 0xFF9500, {
            startScale: 0.2
        });
    }

});

function applyPoisonEffect(scene, enemy, baseDamage) {
    if (!enemy || enemy.health <= 0) return;

    // Apply green tint to show poison effect
    SpriteEffectHelpers.applyEffectColorTexture(enemy, '#2aad27', scene);

    const tickDamage = baseDamage * 0.5;
    let completedTicks = 0;
    const totalTicks = 4;

    const poisonSourceId = `poison_${Date.now()}_${Math.random()}`;

    const poisonTimer = registerTimer(scene.time.addEvent({
        delay: 1000,
        callback: function () {
            if (!enemy || !enemy.active) return;

            // Apply poison damage using EnemySystem
            EnemySystem.applyDamage(
                {
                    damageSourceId: poisonSourceId,
                    active: true
                },
                enemy,
                tickDamage,
                0 // No cooldown for poison ticks
            );

            completedTicks++;

            // Reset color after poison ends
            if (completedTicks === totalTicks && enemy.active) {
                SpriteEffectHelpers.resetEffectColor(enemy);
            }
        },
        callbackScope: scene,
        repeat: totalTicks - 1
    }));

    window.registerEffect('timer', poisonTimer);
}

// Make the function globally accessible
window.applyPoisonEffect = applyPoisonEffect;

// Now modify the poisonEffect component to use this function
ProjectileComponentSystem.registerComponent('poisonEffect', {
    initialize: function (projectile) {
        // Visual indicator
        projectile.setColor('#2aad27');
    },

    onHit: function (projectile, enemy, scene) {
        if (enemy.health > 0) {
            // Use the extracted function
            applyPoisonEffect(scene, enemy, projectile.damage);
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
                // Create a new projectile at the enemy's position using WeaponSystem
                const splitProjectile = WeaponSystem.createProjectile(scene, {
                    x: enemy.x,
                    y: enemy.y,
                    angle: splitAngle,
                    color: '#1E90FF',
                    symbol: '✧',
                    damage: projectile.damage / 2,
                    speed: 300, // Slightly slower than regular projectiles
                    skipComponents: true // Skip components to prevent infinite splitting
                });

                // Mark that this is a split projectile to prevent infinite splitting
                splitProjectile.hasSplit = true;

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
        const radius = 96 * Math.sqrt(playerLuck / BASE_STATS.LUK);

        // Get player position
        const x = player.x;
        const y = player.y;

        // Create a unique damage source ID that's available in this scope
        const damageId = `stomp_${Date.now()}_${Math.random()}`;

        // Use our generic explosion effect with brown color (0x8B4513) for stomp
        VisualEffects.createExplosion(scene, x, y, radius, 0x8B4513, {
            startScale: 0.2
        });

        // The rest of the damage logic remains unchanged
        // Get all active enemies
        const allEnemies = EnemySystem.enemiesGroup.getChildren();

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

// Create a persistent damage-over-time effect at a specific position
function createPersistentEffect(scene, x, y, config = {}) {
    // Default configuration
    const defaults = {
        symbol: '火', // Default is fire kanji
        color: '#FF4500', // Default is orange-red
        fontSize: '24px', // Default size
        damage: playerDamage / 10, // Default damage
        tickInterval: 200, // Default interval between damage ticks (ms)
        duration: 4000, // Default duration (ms)
        pulsing: true, // Whether to add pulsing animation
        bodyScale: 0.8, // Scale factor for physics body
        startScale: 0.5, // Initial scale for spawn animation
        alpha: 1.0, // Opacity
        sourceEffect: null // For tracking which effect created this
    };

    // Merge with provided config
    const effectConfig = { ...defaults, ...config };

    // Create the effect object
    const effect = scene.add.text(x, y, effectConfig.symbol, {
        fontFamily: 'Arial',
        fontSize: effectConfig.fontSize,
        color: effectConfig.color,
        fontStyle: 'bold'
    }).setOrigin(0.5);

    // Set initial alpha
    effect.setAlpha(effectConfig.alpha);

    // Add physics body
    scene.physics.world.enable(effect);
    effect.body.setSize(effect.width * effectConfig.bodyScale, effect.height * effectConfig.bodyScale);
    effect.body.setAllowGravity(false);
    effect.body.setImmovable(true);

    // Custom properties
    effect.damagePerTick = effectConfig.damage;
    effect.tickInterval = effectConfig.tickInterval;
    effect.damageSourceId = `effect_${Date.now()}_${Math.random()}`;
    effect.sourceEffect = effectConfig.sourceEffect;

    // Register for cleanup
    window.registerEffect('entity', effect);

    // Damage tick timer
    const damageTimer = registerTimer(scene.time.addEvent({
        delay: effectConfig.tickInterval,
        callback: function () {
            if (!effect.active) return;

            // Apply damage to overlapping enemies
            scene.physics.overlap(effect, EnemySystem.enemiesGroup, (effectObj, enemy) => {
                applyContactDamage.call(
                    scene,
                    effectObj,
                    enemy,
                    effectObj.damagePerTick,
                    effectObj.tickInterval - 100
                );
            });
        },
        callbackScope: scene,
        loop: true
    }));

    // Add visual effects
    let pulseTween = null;
    if (effectConfig.pulsing) {
        pulseTween = scene.tweens.add({
            targets: effect,
            scale: { from: 0.9, to: 1.1 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    // Fade out over duration
    const fadeTween = scene.tweens.add({
        targets: effect,
        alpha: { from: effectConfig.alpha, to: 0 },
        duration: effectConfig.duration,
        delay: 100,
        onComplete: function () {
            // Cleanup when fade completes
            damageTimer.remove();
            if (pulseTween) pulseTween.stop();
            effect.destroy();
        }
    });

    // Initial spawn animation
    effect.setScale(effectConfig.startScale);
    scene.tweens.add({
        targets: effect,
        scale: 1,
        duration: 200,
        ease: 'Back.out'
    });

    return effect;
}

// Make the function globally accessible
window.createPersistentEffect = createPersistentEffect;

// Update the fireEffect component in artillery.js to use the generalized function
ProjectileComponentSystem.registerComponent('fireEffect', {
    initialize: function (projectile) {
        // Visual indicator for the projectile itself
        projectile.setColor('#FF4500');
        this.fireDamage = playerDamage / 10; // Default fire damage
        this.fireDuration = 4000; // 4s default duration
        this.fireTickInterval = 200; // 0.2 seconds default tick interval
    },

    onHit: function (projectile, enemy, scene) {
        // Don't create fire if enemy is already dead
        if (!enemy || !enemy.active || enemy.health <= 0) return;

        // Prevent multiple triggers for piercing projectiles
        if (projectile.effectTriggered) return;
        projectile.effectTriggered = true;

        // Use the generalized function to create fire
        createPersistentEffect(scene, projectile.x, projectile.y, {
            symbol: '火', // Fire kanji
            color: '#FF4500', // Orange-red color
            fontSize: '24px',
            damage: this.fireDamage,
            tickInterval: this.fireTickInterval,
            duration: this.fireDuration,
            sourceEffect: 'fire'
        });
    }
});

// Create magmaDropEffect component using the generalized function
ProjectileComponentSystem.registerComponent('magmaDropEffect', {
    initialize: function (projectile) {
        // Visual indicator for the projectile itself
        projectile.setColor('#FF6600');
        this.magmaDamage = playerDamage; // Full damage for magma
        this.magmaDuration = playerLuck * 1000; // Duration scales with luck
        this.magmaTickInterval = 1000; // 1 second between ticks
    },

    onHit: function (projectile, enemy, scene) {
        // Don't create magma if enemy is already dead
        if (!enemy || !enemy.active || enemy.health <= 0) return;

        // Prevent multiple triggers for piercing projectiles
        if (projectile.effectTriggered) return;
        projectile.effectTriggered = true;

        // Use the generalized function to create magma
        createPersistentEffect(scene, projectile.x, projectile.y, {
            symbol: '熔', // Magma kanji
            color: '#FF4400', // Orange-red color
            fontSize: '32px', // Larger size
            damage: this.magmaDamage,
            tickInterval: this.magmaTickInterval,
            duration: this.magmaDuration,
            sourceEffect: 'magma'
        });
    }
});

ProjectileComponentSystem.registerComponent('piercingEffect', {
    initialize: function (projectile) {
        // Mark the projectile as piercing
        projectile.piercing = true;
    }
});

ProjectileComponentSystem.registerComponent('healingAuraEffect', {
    initialize: function (projectile) {
        // Visual indicator for healing projectile
        projectile.setColor('#00ff00'); // Light green color

        // Set default properties
        this.healRadius = 128; // 128px healing radius
    },

    onHit: function (projectile, enemy, scene) {
        // Get hit position (enemy's location)
        const hitX = enemy.x;
        const hitY = enemy.y;

        // Create healing aura visual
        const healColor = VisualEffects.convertToColorValue('#00ff00');
        VisualEffects.createExplosion(scene, hitX, hitY, this.healRadius, healColor, {
            startScale: 0.2,
            duration: 1000
        });

        // Check if player is within healing radius
        const dx = player.x - hitX;
        const dy = player.y - hitY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= this.healRadius) {
            // Use LifeSystem's regenerateHealth
            LifeSystem.regenerateHealth.call(scene);
        }
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
            const returnSpeed = this.originalSpeed * 1.2; // faster, else we can outrun forever and get infinite shots!!
            const newVelocityX = (dx / distance) * returnSpeed;
            const newVelocityY = (dy / distance) * returnSpeed;

            // Update velocity
            projectile.body.setVelocity(newVelocityX, newVelocityY);
        }
    }
});