// Updated weapons.js with consolidated collision handling

const WeaponSystem = {
    // Currently active weapon type
    activeWeaponType: 'BASIC_PROJECTILE',

    // Firing timer reference
    weaponTimer: null,

    // Physics groups
    projectilesGroup: null,
    piercingProjectilesGroup: null,

    // Initialize the system
    initialize: function (scene) {
        console.log("Initializing weapon system");

        // Create physics groups
        this.initPhysicsGroups(scene);

        // Create the firing timer
        this.createWeaponTimer(scene);

        return this;
    },

    // Initialize physics groups
    initPhysicsGroups: function (scene) {
        // Create regular projectiles group (instead of using global projectiles)
        this.projectilesGroup = scene.physics.add.group();

        // Create piercing projectiles group
        this.piercingProjectilesGroup = scene.physics.add.group();

        // Make global references available for backward compatibility
        window.projectiles = this.projectilesGroup;
        window.piercingProjectiles = this.piercingProjectilesGroup;

        // Set up collisions for regular projectiles
        scene.physics.add.collider(
            this.projectilesGroup,
            EnemySystem.enemiesGroup,
            this.projectileHitEnemy,
            null,
            scene
        );

        // Set up overlap for piercing projectiles
        scene.physics.add.overlap(
            this.piercingProjectilesGroup,
            EnemySystem.enemiesGroup,
            this.projectileHitEnemy,
            null,
            scene
        );
    },

    // Handle projectile collision with enemy
    projectileHitEnemy: function (projectile, enemy) {
        // "this" is the scene due to the function context in physics.add.collider
        const scene = this;

        // Skip if projectile is already destroyed
        if (!projectile.active || !enemy.active) return;

        // Ensure projectile has a damage source ID
        if (!projectile.damageSourceId) {
            projectile.damageSourceId = `proj_${Date.now()}_${Math.random()}`;
        }

        // Process hit event for all components
        if (projectile.components) {
            ProjectileComponentSystem.processEvent(projectile, 'onHit', enemy, scene);
        }

        // Apply damage using the contact damage system with a very short cooldown
        // (Regular projectiles are destroyed on hit, so cooldown is mostly irrelevant)
        applyContactDamage.call(scene, projectile, enemy, projectile.damage, 1000);

        // Destroy non-piercing projectiles after hit
        if (!projectile.piercing) {
            projectile.destroy();
        }
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

    updateProjectiles: function (scene) {
        // Process both regular and piercing projectiles
        this.updateProjectileGroup(this.projectilesGroup);
        this.updateProjectileGroup(this.piercingProjectilesGroup);
    },

    // Helper method to update a projectile group
    updateProjectileGroup: function (group) {
        if (!group) return;

        group.getChildren().forEach(projectile => {
            // Skip if destroyed during processing
            if (!projectile || !projectile.active) return;

            // Check if out of bounds
            if (projectile.y < -50 || projectile.y > game.config.height + 50 ||
                projectile.x < -50 || projectile.x > game.config.width + 50) {
                projectile.destroy();
                return;
            }

            // Process component updates
            if (projectile.components && Object.keys(projectile.components).length > 0) {
                if (projectile.components.boomerangEffect) {
                    //console.log("Processing boomerang update"); // Debug log
                }
                ProjectileComponentSystem.processEvent(projectile, 'update');
            }
        });
    },

    // Fire the current weapon
    fireWeapon: function (scene) {
        // Find the closest enemy
        distance = (Math.sqrt(playerFireRate / BASE_STATS.AGI)) * 400;
        const closestEnemy = this.findClosestEnemy(scene, distance);
        /*
        if (closestEnemy) {
            // Calculate direction to the enemy
            const angle = Phaser.Math.Angle.Between(
                player.x, player.y,
                closestEnemy.x, closestEnemy.y
            );

            // Fire projectile based on active weapon type
            if (this.activeWeaponType === 'BASIC_PROJECTILE') {
                this.fireBasicProjectile(scene, angle);
            }
        }*/
    },

    // Fire a basic projectile
    fireBasicProjectile: function (scene, angle) {
        // Create the projectile
        const projectile = this.createProjectile(scene, {
            x: player.x,
            y: player.y,
            angle: angle
        });

        return projectile;
    },

    // Create a projectile with the appropriate properties
    createProjectile: function (scene, config) {
        const defaults = {
            x: player.x,
            y: player.y,
            symbol: '★',
            color: '#ffff00',
            angle: 0,
            speed: 400,
            damage: getEffectiveDamage(),
            fontSize: getEffectiveSize(), // Add fontSize with getEffectiveSize
            skipComponents: false
        };

        // Merge config with defaults
        const projConfig = { ...defaults, ...config };

        // Create the projectile text object
        const projectile = scene.add.text(
            projConfig.x,
            projConfig.y,
            projConfig.symbol,
            {
                fontFamily: 'Arial',
                fontSize: `${projConfig.fontSize}px`, // Use the calculated or provided fontSize
                color: projConfig.color,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // Default to non-piercing
        projectile.piercing = false;

        // Initialize empty components object
        projectile.components = {};

        // Apply perk effects before adding to physics group
        if (!projConfig.skipComponents) {
            // Apply all registered perk effects
            ProjectilePerkRegistry.applyPerkEffects(projectile, scene);
        }

        // Add to the appropriate physics group based on piercing status
        if (projectile.piercing) {
            this.piercingProjectilesGroup.add(projectile);
        } else {
            this.projectilesGroup.add(projectile);
        }

        // NOW we can safely set physics body properties
        projectile.body.setSize(projectile.width / 2, projectile.height / 2);
        projectile.damage = projConfig.damage;

        // Set velocity based on angle
        projectile.body.setVelocity(
            Math.cos(projConfig.angle) * projConfig.speed,
            Math.sin(projConfig.angle) * projConfig.speed
        );

        // Process onFire event if needed
        if (projectile.needsOnFireEvent && projectile.components) {
            Object.values(projectile.components).forEach(component => {
                if (component.onFire) {
                    component.onFire(projectile, scene, projConfig.angle);
                }
            });
        }

        return projectile;
    },

    // Find the closest enemy within range
    findClosestEnemy: function (scene, maxDistance) {
        if (!EnemySystem.enemiesGroup || EnemySystem.enemiesGroup.getChildren().length === 0) {
            return null;
        }

        let closestEnemy = null;
        let closestDistance = maxDistance;

        EnemySystem.enemiesGroup.getChildren().forEach(enemy => {
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

        // Clear the projectile groups
        if (this.projectilesGroup) {
            this.projectilesGroup.clear(true, true);
        }

        if (this.piercingProjectilesGroup) {
            this.piercingProjectilesGroup.clear(true, true);
        }

        // Reset to default weapon
        this.activeWeaponType = 'BASIC_PROJECTILE';

        console.log("Weapon system reset");
    }
};

// Export the weapon system
window.WeaponSystem = WeaponSystem;