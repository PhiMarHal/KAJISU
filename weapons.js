// Updated weapons.js with canvas texture support for projectiles
const PROJECTILE_KNOCKBACK = 200; // px/s added to enemy velocity on hit

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

        // Register collisions via CollisionRegistry for deterministic tick-based checking
        CollisionRegistry.register({
            objectA: this.projectilesGroup,
            objectB: EnemySystem.enemiesGroup,
            callback: this.projectileHitEnemy,
            scope: scene,
            type: 'manual'
        });

        CollisionRegistry.register({
            objectA: this.piercingProjectilesGroup,
            objectB: EnemySystem.enemiesGroup,
            callback: this.projectileHitEnemy,
            scope: scene,
            type: 'manual'
        });
    },

    // Handle projectile collision with enemy
    projectileHitEnemy: function (projectile, enemy) {
        const scene = this;

        if (!projectile.active || !enemy.active) return;

        if (!projectile.damageSourceId) {
            projectile.damageSourceId = `proj_${Date.now()}_${Math.random()}`;
        }

        // Apply knockback: push enemy away from the projectile's impact point.
        // Both positions are deterministic at this point (fixed-tick integration).
        if (!projectile.piercing) {
            const dx = enemy.x - projectile.x;
            const dy = enemy.y - projectile.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                enemy.body.velocity.x += (dx / dist) * PROJECTILE_KNOCKBACK;
                enemy.body.velocity.y += (dy / dist) * PROJECTILE_KNOCKBACK;
                // moveEnemies caps speed each tick, so knockback naturally decays.
            }
        }


        if (projectile.components) {
            ProjectileComponentSystem.processEvent(projectile, 'onHit', enemy, scene);
        }

        applyContactDamage.call(scene, projectile, enemy, projectile.damage, 1000);

        if (!projectile.piercing) {
            projectile.destroy();
        }
    },

    // Create the weapon firing timer
    createWeaponTimer: function (scene) {
        // Remove existing timer if any
        if (this.weaponTimer) {
            CooldownManager.removeTimer(this.weaponTimer);
        }

        // Calculate firing interval based on current stats
        const firingDelay = this.calculateFiringDelay();

        // Create tick-based timer for deterministic firing
        this.weaponTimer = CooldownManager.createTimer({
            statName: null,
            baseCooldown: firingDelay,
            formula: 'fixed',
            callback: function () {
                if (gameOver || gamePaused) return;
                WeaponSystem.fireWeapon(scene);
            },
            callbackScope: scene,
            loop: true,
            isPerkEffect: false
        });

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
            // Adjust delay in-place preserving progress
            const progress = this.weaponTimer.elapsed / currentDelay;
            this.weaponTimer.delay = newDelay;
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
    // Moving manually
    updateProjectileGroup: function (group) {
        if (!group) return;

        const dt = GameClock.FIXED_TIMESTEP;
        const timeScale = window.TimeDilationSystem?.gameplayTimeScale ?? 1;
        const delta = dt * timeScale;

        group.getChildren().forEach(projectile => {
            if (!projectile || !projectile.active) return;

            // Advance position deterministically (one step per simulateTick)
            projectile.x += projectile.body.velocity.x * (delta / 1000);
            projectile.y += projectile.body.velocity.y * (delta / 1000);
            projectile.body.position.x = projectile.x - projectile.body.halfWidth;
            projectile.body.position.y = projectile.y - projectile.body.halfHeight;
            projectile.body.updateCenter();

            if (projectile.y < -50 || projectile.y > game.config.height + 50 ||
                projectile.x < -50 || projectile.x > game.config.width + 50) {
                projectile.destroy();
                return;
            }

            if (projectile.components && Object.keys(projectile.components).length > 0) {
                ProjectileComponentSystem.processEvent(projectile, 'update');
            }
        });
    },

    // Fire the current weapon
    // Comment this out for quick testing of side perks!
    fireWeapon: function (scene) {
        // Find the closest enemy
        distance = (Math.sqrt(playerFireRate / BASE_STATS.AGI)) * 400;
        const closestEnemy = this.findClosestEnemy(scene, distance);

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
        }
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
            fontSize: getEffectiveSize(),
            skipComponents: false
        };

        // Merge config with defaults
        const projConfig = { ...defaults, ...config };

        // Create the projectile sprite using the texture system
        const projectile = KanjiTextureSystem.createProjectileSprite(scene, {
            x: projConfig.x,
            y: projConfig.y,
            symbol: projConfig.symbol,
            color: projConfig.color,
            fontSize: projConfig.fontSize
        });

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
        // Use actualWidth/actualHeight for proper collision detection with sprites
        const collisionWidth = projectile.actualWidth || projectile.width / 2;
        const collisionHeight = projectile.actualHeight || projectile.height / 2;
        projectile.body.setSize(collisionWidth, collisionHeight);
        projectile.damage = projConfig.damage;

        // Set velocity based on angle
        projectile.body.setVelocity(
            Math.cos(projConfig.angle) * projConfig.speed,
            Math.sin(projConfig.angle) * projConfig.speed
        );

        // Disable Phaser movement
        projectile.body.moves = false;

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
            CooldownManager.removeTimer(this.weaponTimer);
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