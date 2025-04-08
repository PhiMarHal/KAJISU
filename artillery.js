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
                component[eventName](projectile, ...args);
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
// Register component for multi-shot effect (Purple Owl)
ProjectileComponentSystem.registerComponent('multiShot', {
    // Configuration properties (will be set when component is added)
    maxExtraShots: 1,      // Default to just one extra shot

    initialize: function (projectile) {
        // No special initialization needed - we'll create shots when the projectile is fired
        // Store reference to the initial projectile to avoid loops
        this.initialProjectile = projectile;

        // Add this component to the onFire event queue
        projectile.needsOnFireEvent = true;
    },

    // This will be called once when the projectile is fired
    onFire: function (projectile, scene, angle) {
        // Skip if not the initial projectile (prevents cascading shots)
        if (projectile !== this.initialProjectile) return;

        // Create shot(s) based on config (usually 1)
        for (let i = 0; i < this.maxExtraShots; i++) {
            // Create angle variation for more natural spread
            const angleVariation = (Math.random() - 0.5) * 0.6;

            // Create the duplicate projectile
            const extraProjectile = WeaponSystem.createProjectile(scene, {
                x: player.x,
                y: player.y,
                angle: angle + angleVariation,
                piercing: projectile.piercing, // Inherit piercing status
                // This is crucial to prevent infinite recursion - no component processing
                skipComponents: true
            });

            // Visual effect to indicate it's an extra shot
            scene.tweens.add({
                targets: extraProjectile,
                alpha: { from: 0.6, to: 1 },
                duration: 150
            });
        }
    }
});