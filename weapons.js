// weapons.js - Minimal Weapon System for Word Survivors

const BASE_PROJECTILE_MASS = 10000; // Adjust this value to tune knockback strength

// Main Weapon System object
const WeaponSystem = {
    // Currently active weapon type
    activeWeaponType: 'BASIC_PROJECTILE',

    // Firing timer reference
    weaponTimer: null,

    // Initialize the system
    initialize: function (scene) {
        console.log("Initializing weapon system");

        // Create the firing timer
        this.createWeaponTimer(scene);

        return this;
    },

    // Create the weapon firing timer
    createWeaponTimer: function (scene) {
        // Remove existing timer if any
        if (this.weaponTimer) {
            this.weaponTimer.remove();
        }

        // Calculate firing interval based on current stats
        const firingDelay = this.calculateFiringDelay();

        // Create timer for automatic firing
        this.weaponTimer = registerTimer(scene.time.addEvent({
            delay: firingDelay,
            callback: function () {
                if (gameOver || gamePaused) return;
                WeaponSystem.fireWeapon(this);
            },
            callbackScope: scene,
            loop: true
        }));

        console.log(`Weapon timer created with delay: ${firingDelay}ms`);
    },

    // Calculate firing delay based on player stats
    calculateFiringDelay: function () {
        return shootingDelay / getEffectiveFireRate();
    },

    // Update the firing rate when stats change
    updateFiringRate: function (scene) {
        if (!this.weaponTimer) return;

        // Calculate new delay
        const newDelay = this.calculateFiringDelay();

        // Only update if significant change (>10%)
        const currentDelay = this.weaponTimer.delay;
        if (Math.abs(currentDelay - newDelay) > (currentDelay * 0.1)) {
            // Remember elapsed time to preserve firing cycle
            const elapsed = this.weaponTimer.elapsed;
            const progress = elapsed / currentDelay;

            // Update timer with new delay
            this.weaponTimer.delay = newDelay;
            this.weaponTimer.reset({
                delay: newDelay,
                callback: function () {
                    if (gameOver || gamePaused) return;
                    WeaponSystem.fireWeapon(this);
                },
                callbackScope: scene,
                loop: true
            });

            // Restore progress to avoid reset
            this.weaponTimer.elapsed = progress * newDelay;

            console.log(`Firing rate updated: ${currentDelay}ms -> ${newDelay}ms`);
        }
    },

    // Fire the current weapon
    fireWeapon: function (scene) {
        // Find the closest enemy
        const closestEnemy = this.findClosestEnemy(scene, 400);

        if (closestEnemy) {
            // Calculate direction to the enemy
            const angle = Phaser.Math.Angle.Between(
                player.x, player.y,
                closestEnemy.x, closestEnemy.y
            );

            // Fire projectile based on active weapon type
            if (this.activeWeaponType === 'BASIC_PROJECTILE') {
                this.fireBasicProjectile(scene, angle);

                // Check for double shot if we have that perk
                if (hasPerk('PURPLE_OWL')) {
                    // Base chance calculation
                    const doubleChance = calculateProcChance(playerLuck, baseProcChance);

                    if (Math.random() < doubleChance) {
                        // Fire a second projectile with slight angle variation
                        const angleVariation = (Math.random() - 0.5) * 0.2;
                        this.fireBasicProjectile(scene, angle + angleVariation);
                    }
                }
            }
        }
    },

    // Fire a basic projectile
    fireBasicProjectile: function (scene, angle) {
        // Determine if should be piercing (based on perks)
        const piercing = this.shouldFirePiercingProjectile();

        // Create with the correct physics group
        const projectile = this.createProjectile(scene, {
            x: player.x,
            y: player.y,
            angle: angle,
            piercing: piercing
        });

        return projectile;
    },

    // Helper to determine if a projectile should be piercing
    shouldFirePiercingProjectile: function () {
        // Base piercing chance from perks
        let piercingChance = 0;

        // Add chance from perks
        if (hasPerk('PIERCING_SHOTS')) {
            piercingChance += 0.3; // 30% chance from perk
        }

        // Add from other perks here...

        // Random roll
        return Math.random() < piercingChance;
    },

    // Create a projectile with the appropriate properties
    createProjectile: function (scene, config) {
        const defaults = {
            x: player.x,
            y: player.y,
            symbol: '★',
            color: '#ffff00',
            piercingColor: '#00ff88',
            piercing: false,
            angle: 0,
            speed: 400,
            damage: getEffectiveDamage()
        };

        // Merge config with defaults
        const projConfig = { ...defaults, ...config };

        // Set color based on piercing status
        const color = projConfig.piercing ? projConfig.piercingColor : projConfig.color;

        // Create the projectile text object
        const projectile = scene.add.text(
            projConfig.x,
            projConfig.y,
            projConfig.symbol,
            {
                fontFamily: 'Arial',
                fontSize: `${projectileSizeFactor * projConfig.damage}px`,
                color: color,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // Add to the appropriate physics group
        if (projConfig.piercing) {
            piercingProjectiles.add(projectile);
        } else {
            projectiles.add(projectile);
        }

        const projectileMass = BASE_PROJECTILE_MASS * playerFireRate;

        // Set projectile properties
        projectile.body.setSize(projectile.width / 2, projectile.height / 2);
        projectile.body.setMass(projectileMass);
        projectile.damage = projConfig.damage;
        projectile.piercing = projConfig.piercing;

        // Make projectile movable so it can transfer momentum, but give it high drag/low bounce
        projectile.body.setImmovable(false);
        projectile.body.setDrag(0); // No air resistance unless desired
        projectile.body.setBounce(0); // No bouncing off enemies/world

        // Set velocity based on angle
        projectile.body.setVelocity(
            Math.cos(projConfig.angle) * projConfig.speed,
            Math.sin(projConfig.angle) * projConfig.speed
        );

        // Initialize empty components object
        projectile.components = {};

        // Apply perk effects through component system
        ProjectilePerkRegistry.applyPerkEffects(projectile, scene);

        return projectile;
    },

    // Find the closest enemy within range
    findClosestEnemy: function (scene, maxDistance) {
        if (!enemies || enemies.getChildren().length === 0) {
            return null;
        }

        let closestEnemy = null;
        let closestDistance = maxDistance;

        enemies.getChildren().forEach(enemy => {
            if (!enemy || !enemy.active) return;

            const distance = Phaser.Math.Distance.Between(
                player.x, player.y,
                enemy.x, enemy.y
            );

            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        });

        return closestEnemy;
    },

    // Reset the weapon system
    reset: function (scene) {
        // Remove weapon timer
        if (this.weaponTimer) {
            this.weaponTimer.remove();
            this.weaponTimer = null;
        }

        // Reset to default weapon
        this.activeWeaponType = 'BASIC_PROJECTILE';

        console.log("Weapon system reset");
    }
};

// Export the weapon system
window.WeaponSystem = WeaponSystem;