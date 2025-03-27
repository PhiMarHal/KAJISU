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

// Register component for distance-based damage (Crimson Scatter)
// Updated distanceDamage component for Crimson Scatter
ProjectileComponentSystem.registerComponent('distanceDamage', {
    initialize: function (projectile) {
        console.log("Initializing distance damage component");

        // Store our start position and base damage in the component
        this.startX = projectile.x;
        this.startY = projectile.y;
        this.baseDamage = playerDamage;

        // Set initial scale and damage for max effect at close range
        projectile.setScale(2.0);
        projectile.damage = this.baseDamage * 2.0;

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

        // Maximum distance for damage scaling
        const maxDistance = 400;

        // Calculate damage multiplier based on distance (2.0 at distance 0, 0.4 at maxDistance)
        let damageMultiplier = 2.0 - (1.6 * Math.min(distance, maxDistance) / maxDistance);

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
        // Visual indicator
        projectile.setColor('#FF4500');
    },

    onHit: function (projectile, enemy, scene) {
        // Create fire at the enemy's position
        // Create the fire object using the kanji for fire: 火
        const fire = scene.add.text(enemy.x, enemy.y, '火', {
            fontFamily: 'Arial',
            fontSize: `${projectileSizeFactor * playerDamage}px`,
            color: '#FF4500',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Add physics to fire for enemy overlap detection
        scene.physics.world.enable(fire);
        fire.body.setSize(fire.width * 0.8, fire.height * 0.8);
        fire.body.setImmovable(true);

        // Set fire properties
        fire.damage = playerDamage; // Damage per tick
        fire.lastTickTime = 0; // Track the last time damage was applied
        fire.tickInterval = 1000; // Damage every 1 second (in ms)

        // Calculate duration based on player luck (in ms)
        const duration = playerLuck * 1000;

        // Create an array to track enemies already in the fire
        fire.burningEnemies = [];

        // Register entity for cleanup
        window.registerEffect('entity', fire);

        // Add overlap with enemies
        const fireCollider = scene.physics.add.overlap(fire, enemies, enemyInFire, null, scene);

        // Add pulsing animation for visual effect
        scene.tweens.add({
            targets: fire,
            scale: { from: 0.9, to: 1.1 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Gradually fade out and remove after duration
        scene.tweens.add({
            targets: fire,
            alpha: { from: 1, to: 0.2 },
            duration: duration,
            onComplete: function () {
                // Remove collider before destroying fire
                fireCollider.destroy();
                fire.destroy();
            }
        });

        // For dramatic effect, add a brief expansion animation on creation
        fire.setScale(0.5);
        scene.tweens.add({
            targets: fire,
            scale: 1,
            duration: 200,
            ease: 'Back.out'
        });
    }
});