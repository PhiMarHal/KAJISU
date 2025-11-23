// Unified Entity Firing System for KAJISU
// Works with orbitals, droppers, or any entity that needs to fire projectiles

// Unified firing behaviors - work with any entity that has x/y coordinates
const EntityFiringBehaviors = {
    sniper: function (scene, entity, time, maxDistance = 400) {
        // Damage was playerDamage * 2 -> (Effective + Luck) * 1.0
        const damage = (getEffectiveDamage() + playerLuck) * 1.0;
        const speed = 800;
        const projectileColor = '#FF55AA';

        const target = findRandomVisibleEnemy(scene, maxDistance);
        if (target) {
            fireProjectileFromEntity(scene, entity, target, {
                damage: damage,
                speed: speed,
                color: projectileColor
            });
            return true;
        }
        return false;
    },

    copy: function (scene, entity, time, maxDistance = 400) {
        // Damage was playerDamage * 0.5 -> (Effective + Luck) * 0.25
        const damage = (getEffectiveDamage() + playerLuck) * 0.25;
        const target = findClosestVisibleEnemy(scene, maxDistance);

        if (target) {
            fireProjectileFromEntity(scene, entity, target, {
                damage: damage
            });
            return true;
        }
        return false;
    },

    cold: function (scene, entity, time, maxDistance = 400) {
        // Damage was playerDamage * 0.5 -> (Effective + Luck) * 0.25
        const damage = (getEffectiveDamage() + playerLuck) * 0.25;
        const projectileColor = '#00FFFF';
        const target = findClosestVisibleEnemy(scene, maxDistance);

        if (target) {
            const projectile = fireProjectileFromEntity(scene, entity, target, {
                damage: damage,
                color: projectileColor
            });

            if (projectile) {
                ProjectileComponentSystem.addComponent(projectile, 'slowEffect');
            }
            return true;
        }
        return false;
    },

    fun: function (scene, entity, time, maxDistance = 400) {
        // Damage was playerDamage * 0.5 -> (Effective + Luck) * 0.25
        const damage = (getEffectiveDamage() + playerLuck) * 0.25;
        const availableEffects = [
            { component: 'slowEffect', color: '#00FFFF', symbol: '❄' },
            { component: 'poisonEffect', color: '#2AAD27', symbol: '☠' },
            { component: 'fireEffect', color: '#FF4500', symbol: '🔥' },
            { component: 'explosionEffect', color: '#FF9500', symbol: '💥' },
            { component: 'splitEffect', color: '#1E90FF', symbol: '✧' }
        ];

        const randomEffect = availableEffects[Math.floor(Math.random() * availableEffects.length)];
        const target = findRandomVisibleEnemy(scene, maxDistance);

        if (target) {
            const projectile = fireProjectileFromEntity(scene, entity, target, {
                damage: damage,
                color: randomEffect.color,
                symbol: randomEffect.symbol
            });

            if (projectile) {
                ProjectileComponentSystem.addComponent(projectile, randomEffect.component);
            }
            return true;
        }
        return false;
    },

    berserk: function (scene, entity, time, maxDistance = 400) {
        // Damage was playerDamage * 0.5 -> (Effective + Luck) * 0.25
        const damage = (getEffectiveDamage() + playerLuck) * 0.25;
        const target = findRandomVisibleEnemy(scene, maxDistance);

        if (target) {
            fireProjectileFromEntity(scene, entity, target, {
                damage: damage
            });
            return true;
        }
        return false;
    },

    healer: function (scene, entity, time, maxDistance = 400) {
        // Damage was playerDamage * 0.5 -> (Effective + Luck) * 0.25
        const damage = (getEffectiveDamage() + playerLuck) * 0.25;
        const projectileColor = '#00ff00';
        const projectileSymbol = '癒';
        const speed = 100;
        const target = findRandomVisibleEnemy(scene, maxDistance);

        if (target) {
            const projectile = fireProjectileFromEntity(scene, entity, target, {
                damage: damage,
                color: projectileColor,
                symbol: projectileSymbol,
                speed: speed
            });

            if (projectile) {
                ProjectileComponentSystem.addComponent(projectile, 'healingAuraEffect');
            }
            return true;
        }
        return false;
    },

    finger: function (scene, entity, time, maxDistance = Infinity, options = {}) {
        const defaults = {
            damage: (getEffectiveDamage() + playerLuck) * 0.5, // Default to 0.5x scale
            speed: 1000,
            color: '#FFFF00',
            symbol: '　',
            componentName: null
        };

        const config = { ...defaults, ...options };
        const angle = entity.angle || 0;

        const projectile = fireProjectileFromEntity(scene, entity, null, {
            damage: config.damage,
            color: config.color,
            symbol: config.symbol,
            piercing: true,
            speed: config.speed,
            overrideAngle: angle
        });

        if (projectile) {
            ProjectileComponentSystem.addComponent(projectile, 'piercingEffect');

            if (config.componentName && ProjectileComponentSystem.componentTypes[config.componentName]) {
                ProjectileComponentSystem.addComponent(projectile, config.componentName);
            }
        }
        return true;
    },

    deathFinger: function (scene, entity, time, maxDistance = Infinity) {
        return EntityFiringBehaviors.finger(scene, entity, time, maxDistance, {
            // Damage was playerDamage / 2 (0.5 scale) -> (Effective + Luck) * 0.25
            damage: (getEffectiveDamage() + playerLuck) * 0.25,
            speed: 1000,
            color: '#FFFF00',
            symbol: '　',
            componentName: null
        });
    },

    decayFinger: function (scene, entity, time, maxDistance = Infinity) {
        return EntityFiringBehaviors.finger(scene, entity, time, maxDistance, {
            // Damage was playerDamage * 0.2 (0.2 scale) -> (Effective + Luck) * 0.1
            damage: (getEffectiveDamage() + playerLuck) * 0.1,
            speed: 1000,
            color: '#88AA22',
            symbol: '　',
            componentName: 'poisonEffect'
        });
    },

    heroStatue: function (scene, entity, time, maxDistance = 400) {
        const target = findClosestVisibleEnemy(scene, maxDistance, entity);

        if (target) {
            fireProjectileFromEntity(scene, entity, target, {
                // Damage was playerDamage * 0.5 -> (Effective + Luck) * 0.25
                damage: (getEffectiveDamage() + playerLuck) * 0.25,
                speed: 400,
                color: '#FFFF00',
                symbol: '★'
            });
            return true;
        }
        return false;
    },

    burningTotem: function (scene, entity, time, maxDistance = 400) {
        // Always fire (no enemy targeting needed)
        // Generate random angle (0 to 2π radians for full 360° coverage)
        const randomAngle = Math.random() * Math.PI * 2;

        const projectile = fireProjectileFromEntity(scene, entity, null, {
            // Damage was playerDamage (1.0 scale) -> (Effective + Luck) * 0.5
            damage: (getEffectiveDamage() + playerLuck) * 0.5,
            speed: 400, // Initial speed before deceleration  
            color: '#FF4500', // Orange-red fire color
            symbol: '火', // Fire symbol
            overrideAngle: randomAngle // Use random direction instead of targeting
        });

        if (projectile) {
            ProjectileComponentSystem.addComponent(projectile, 'fireEffect');
            // Add enhanced stasisEffect with custom parameters
            ProjectileComponentSystem.addComponent(projectile, 'stasisEffect', {
                damageMultiplier: 1.0, // No damage bonus (instead of default 1.5x)
                onZeroSpeed: function (projectile, scene) {
                    // Add fireEffect component to the projectile and trigger it manually
                    ProjectileComponentSystem.addComponent(projectile, 'fireEffect');

                    // Create a fake "enemy" position object at the projectile's location
                    const fakeHitTarget = {
                        x: projectile.x,
                        y: projectile.y,
                        active: true
                    };

                    // Manually trigger the fireEffect's onHit method
                    const fireComponent = projectile.components.fireEffect;
                    if (fireComponent && fireComponent.onHit) {
                        fireComponent.onHit(projectile, fakeHitTarget, scene);
                    }

                    // Destroy the projectile now that it's become fire
                    projectile.destroy();
                }
            });
        }

        return true; // Always return true since we always fire
    }
};

function findClosestVisibleEnemy(scene, maxDistance = 400, sourceEntity = player) {
    const activeEnemies = EnemySystem.enemiesGroup.getChildren().filter(enemy => {
        return enemy && enemy.active;
    });

    if (activeEnemies.length === 0) return null;

    let closestEnemy = null;
    let closestDistance = maxDistance;

    activeEnemies.forEach(enemy => {
        const dx = sourceEntity.x - enemy.x;
        const dy = sourceEntity.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestEnemy = enemy;
        }
    });

    return closestEnemy;
}

function findRandomVisibleEnemy(scene, maxDistance = 400, sourceEntity = player) {
    const activeEnemies = EnemySystem.enemiesGroup.getChildren().filter(enemy => {
        if (!enemy || !enemy.active) return false;

        if (maxDistance !== Infinity) {
            const dx = sourceEntity.x - enemy.x;
            const dy = sourceEntity.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= maxDistance;
        }
        return true;
    });

    if (activeEnemies.length === 0) return null;
    return Phaser.Utils.Array.GetRandom(activeEnemies);
}

// Unified projectile firing function
function fireProjectileFromEntity(scene, entity, target, options = {}) {
    const config = {
        // Default: (Effective + Luck) * 0.25 (approx half player damage with standard stats)
        damage: (getEffectiveDamage() + playerLuck) * 0.25,
        speed: 400,
        color: '#ffff00',
        symbol: '★',
        piercing: false,
        ...options
    };

    if (config.symbol === undefined || config.symbol === null) {
        config.symbol = '★';
    }

    const angle = target ? Phaser.Math.Angle.Between(
        entity.x, entity.y,
        target.x, target.y
    ) : config.overrideAngle ?? 0;

    const projectileSize = getEffectiveSize(projectileSizeFactor, config.damage);
    const finalSize = Math.max(12, projectileSize);

    const projectile = WeaponSystem.createProjectile(scene, {
        x: entity.x,
        y: entity.y,
        angle: angle,
        symbol: config.symbol,
        color: config.color,
        speed: config.speed,
        damage: config.damage,
        fontSize: finalSize,
        skipComponents: true
    });

    if (!projectile) {
        console.warn('Failed to create entity projectile:', config);
        return null;
    }

    const originalVelocityX = projectile.body.velocity.x;
    const originalVelocityY = projectile.body.velocity.y;

    if (config.piercing) {
        ProjectileComponentSystem.addComponent(projectile, 'piercingEffect');

        if (projectile.piercing) {
            WeaponSystem.projectilesGroup.remove(projectile);
            WeaponSystem.piercingProjectilesGroup.add(projectile);
            projectile.body.setVelocity(originalVelocityX, originalVelocityY);
        }
    }

    scene.tweens.add({
        targets: projectile,
        alpha: { from: 0.7, to: 1 },
        scale: { from: 0.7, to: 1 },
        duration: 200
    });

    return projectile;
}

// UNIFIED setup function - works for both orbitals and droppers
function setupEntityFiringTimer(scene, entityWrapper, behaviorType, baseCooldown = 4000, options = {}) {
    // entityWrapper could be:
    // - orbital (has orbital.entity)
    // - drop (has drop.entity) 
    // - any object with .entity property

    if (!entityWrapper || !entityWrapper.entity || !entityWrapper.entity.active) return null;

    const behaviorFn = EntityFiringBehaviors[behaviorType];
    if (!behaviorFn) {
        console.warn(`Unknown firing behavior type: ${behaviorType}`);
        return null;
    }

    // Default to multi-stat configuration
    const config = {
        statName: 'luck', // Fallback stat name
        statFunction: options.statFunction,
        statDependencies: options.statDependencies,
        baseStatFunction: options.baseStatFunction,
        formula: options.formula || 'sqrt',
        maxDistance: 400,
        rangeModifier: 1.0,
        rangeScaling: true, // Whether to scale range with fire rate
        ...options
    };

    // If using divide formula and no baseCooldown is calculated externally (passed as raw ms),
    // we assume the baseCooldown passed in is the TARGET time at default stats (8),
    // so we multiply by 8 to get the actual mathematical base.
    // HOWEVER, in nexus.js we are already passing in the pre-calculated base (e.g., 32000).
    // So we use baseCooldown as is.

    const firingTimer = CooldownManager.createTimer({
        statName: config.statName,
        statFunction: config.statFunction,
        statDependencies: config.statDependencies,
        baseStatFunction: config.baseStatFunction,
        baseCooldown: baseCooldown,
        formula: config.formula,
        component: entityWrapper,
        callback: function () {
            if (gameOver || gamePaused ||
                !entityWrapper || entityWrapper.destroyed ||
                !entityWrapper.entity || !entityWrapper.entity.active) {
                return;
            }

            // Calculate max distance
            let maxDistance = config.maxDistance;

            // Apply fire rate scaling if enabled
            if (config.rangeScaling && config.statName !== 'fireRate') {
                maxDistance = 400 * Math.sqrt(playerFireRate / BASE_STATS.AGI);
            }

            // Apply range modifier
            maxDistance *= config.rangeModifier;

            // Execute the behavior - pass the entity directly
            behaviorFn(scene, entityWrapper.entity, scene.time.now, maxDistance);
        },
        callbackScope: scene,
        loop: true
    });

    return firingTimer;
}

// Color changing function for fun fairy
function setupFairyColorChanger(scene, orbital) {
    if (!orbital || !orbital.entity || !scene) return;

    const colors = ['#FF55FF', '#55FFFF', '#FFFF55', '#55FF55', '#FF5555', '#5555FF'];
    let colorIndex = 0;

    const colorTimer = scene.time.addEvent({
        delay: 2000,
        callback: function () {
            if (!orbital.entity || !orbital.entity.active) {
                colorTimer.remove();
                return;
            }

            colorIndex = (colorIndex + 1) % colors.length;
            try {
                orbital.entity.setColor(colors[colorIndex]);
            } catch (error) {
                console.warn('Failed to change fairy color:', error);
            }
        },
        callbackScope: scene,
        loop: true
    });

    window.registerEffect('timer', colorTimer);
    orbital.colorTimer = colorTimer;
    return colorTimer;
}

// BACKWARD COMPATIBILITY for existing orbital code
function fireFamiliarProjectile(scene, orbital, target, options = {}) {
    return fireProjectileFromEntity(scene, orbital.entity, target, options);
}

function setupFamiliarFiringTimer(scene, orbital, behaviorType, baseCooldown = 4000) {
    // Convert baseCooldown to new system if using 'divide' logic
    // If baseCooldown is small (e.g. 4000ms), multiply by 8
    // But since we call this from nexus.js which might pass raw values, we handle it there or here.
    // For now, we assume nexus.js is passing the "target" time (e.g., 4000) and we need to scale it up
    // if we switch to 'divide'.

    // UPDATED: Switch to new stat formula: (FireRate + Luck)
    // Base Cooldown calculation: Target * 8 (since 4+4=8)
    const scaledBaseCooldown = baseCooldown * 8;

    const options = {
        statFunction: () => getEffectiveFireRate() + playerLuck,
        statDependencies: ['fireRate', 'luck'],
        formula: 'divide',
        rangeModifier: orbital.options?.rangeModifier ?? 1.0,
        rangeScaling: true
    };

    return setupEntityFiringTimer(scene, orbital, behaviorType, scaledBaseCooldown, options);
}

// Export unified system
window.EntityFiringSystem = {
    behaviors: EntityFiringBehaviors,
    findRandomVisibleEnemy: findRandomVisibleEnemy,
    findClosestVisibleEnemy: findClosestVisibleEnemy,
    fireProjectileFromEntity: fireProjectileFromEntity,
    setupEntityFiringTimer: setupEntityFiringTimer
};

// Export backward compatibility
window.FamiliarSystem = {
    behaviors: EntityFiringBehaviors, // Same behaviors now
    findRandomVisibleEnemy: findRandomVisibleEnemy,
    findClosestVisibleEnemy: findClosestVisibleEnemy,
    fireFamiliarProjectile: fireFamiliarProjectile,
    setupFamiliarFiringTimer: setupFamiliarFiringTimer,
    setupFairyColorChanger: setupFairyColorChanger
};