// Enhanced Familiar System for Word Survivors
// Manages orbital entities that have firing behavior

// Registry for different familiar behaviors
const FamiliarBehaviors = {
    // Sniper behavior - fires high-damage shots at random enemies
    sniper: function (scene, orbital, time) {
        // Calculate shot properties (can be moved to config)
        const damage = playerDamage * 2;
        const speed = 800; // 2x normal speed
        const projectileColor = '#FF55AA';

        // Find a random enemy to target
        const target = findRandomVisibleEnemy(scene);

        // If a target was found, fire at it
        if (target) {
            fireFamiliarProjectile(scene, orbital, target, {
                damage: damage,
                speed: speed,
                color: projectileColor
            });

            return true; // Shot fired successfully
        }

        return false; // No shot fired
    },

    // Copy behavior - fires weaker shots at the closest enemy
    copy: function (scene, orbital, time) {
        // Calculate shot properties
        const damage = playerDamage * 0.5; // Half player damage


        // Find the closest enemy to the player
        const target = findClosestVisibleEnemy(scene);

        // If a target was found, fire at it
        if (target) {
            fireFamiliarProjectile(scene, orbital, target, {
                damage: damage
            });

            return true; // Shot fired successfully
        }

        return false; // No shot fired
    },

    cold: function (scene, orbital, time) {
        // Calculate shot properties
        const damage = playerDamage * 0.5; // Half player damage
        const projectileColor = '#00FFFF'; // Cyan color for cold theme

        // Find the closest enemy to the player
        const target = findClosestVisibleEnemy(scene);

        // If a target was found, fire at it
        if (target) {
            const projectile = fireFamiliarProjectile(scene, orbital, target, {
                damage: damage,
                color: projectileColor
            });

            // Add slow effect component to the projectile
            if (projectile) {
                ProjectileComponentSystem.addComponent(projectile, 'slowEffect');
            }

            return true; // Shot fired successfully
        }

        return false; // No shot fired
    },

    // fun behavior - fires random effect projectiles
    fun: function (scene, orbital, time) {
        // Calculate shot properties
        const damage = playerDamage * 0.5; // Half player damage
        const speed = 400; // Normal speed

        // Available effect components with their colors
        const availableEffects = [
            { component: 'slowEffect', color: '#00FFFF' },         // Cyan for slow
            { component: 'poisonEffect', color: '#2AAD27' },       // Green for poison
            { component: 'fireEffect', color: '#FF4500' },         // Orange-red for fire
            { component: 'explosionEffect', color: '#FF9500' },    // Amber for explosion
            { component: 'splitEffect', color: '#1E90FF' }          // Blue for split
        ];

        // Select a random effect
        const randomEffect = availableEffects[Math.floor(Math.random() * availableEffects.length)];

        // Find a random enemy to target
        const target = findRandomVisibleEnemy(scene);

        // If a target was found, fire at it
        if (target) {
            const projectile = fireFamiliarProjectile(scene, orbital, target, {
                damage: damage,
                color: randomEffect.color, // Color based on effect
                symbol: randomEffect.symbol // Symbol based on effect
            });

            // Add the selected effect component to the projectile
            if (projectile) {
                ProjectileComponentSystem.addComponent(projectile, randomEffect.component);
            }

            return true; // Shot fired successfully
        }

        return false; // No shot fired
    },

    // Berserk behavior - fires at random enemies at higher rate
    berserk: function (scene, orbital, time) {
        // Calculate shot properties
        const damage = playerDamage * 0.5; // Half player damage
        const speed = 400; // Faster than normal

        // Find a random enemy to target
        const target = findRandomVisibleEnemy(scene);

        // If a target was found, fire at it
        if (target) {
            fireFamiliarProjectile(scene, orbital, target, {
                damage: damage
            });

            return true; // Shot fired successfully
        }

        return false; // No shot fired
    }
};

// Helper function to find a random visible enemy within a maximum distance
function findRandomVisibleEnemy(scene, maxDistance = 400) {
    // Get all active enemies 
    const activeEnemies = enemies.getChildren().filter(enemy => {
        if (!enemy || !enemy.active) return false;

        // If maxDistance is specified, check distance from player
        if (maxDistance !== Infinity) {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= maxDistance;
        }

        return true;
    });

    // Return a random enemy from the list, or null if none found
    if (activeEnemies.length === 0) return null;

    return Phaser.Utils.Array.GetRandom(activeEnemies);
}

// Helper function to find the closest visible enemy to the player within a maximum distance
function findClosestVisibleEnemy(scene, maxDistance = 400) {
    // Get all active enemies
    const activeEnemies = enemies.getChildren().filter(enemy => {
        return enemy && enemy.active;
    });

    if (activeEnemies.length === 0) return null;

    let closestEnemy = null;
    let closestDistance = maxDistance;

    // Find the closest enemy to the player
    activeEnemies.forEach(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestEnemy = enemy;
        }
    });

    return closestEnemy;
}


// Helper function to fire a projectile from a familiar
function fireFamiliarProjectile(scene, orbital, target, options = {}) {
    // Default options
    const config = {
        damage: playerDamage * 0.5, // Default to half player damage for familiars
        speed: 400,
        color: '#ffff00',
        symbol: '★',
        ...options
    };

    // Calculate direction to the target
    const angle = Phaser.Math.Angle.Between(
        orbital.entity.x, orbital.entity.y,
        target.x, target.y
    );

    // Create the projectile
    const projectile = createProjectileBase(scene, orbital.entity.x, orbital.entity.y, config.color, config.symbol);

    // Set damage
    projectile.damage = config.damage;

    // Calculate the appropriate size based on the actual damage
    const familiarProjectileSize = getEffectiveSize(projectileSizeFactor, config.damage);

    // Set the size explicitly
    projectile.setFontSize(familiarProjectileSize);

    // Set velocity
    projectile.body.setVelocity(
        Math.cos(angle) * config.speed,
        Math.sin(angle) * config.speed
    );

    // Add visual effect for the shot
    scene.tweens.add({
        targets: projectile,
        alpha: { from: 0.7, to: 1 },
        scale: { from: 0.7, to: 1 },
        duration: 200
    });

    return projectile;
}

// Generic function to setup a familiar firing timer
function setupFamiliarFiringTimer(scene, orbital, behaviorType, baseCooldown = 4000) {
    // Skip if familiar is invalid
    if (!orbital || !orbital.entity || !orbital.entity.active) return null;

    // Get the behavior function
    const behaviorFn = FamiliarBehaviors[behaviorType];
    if (!behaviorFn) {
        console.warn(`Unknown familiar behavior type: ${behaviorType}`);
        return null;
    }

    // Set up orbital properties needed for proper cooldown management
    orbital.baseCooldown = baseCooldown;
    orbital.behaviorType = behaviorType;

    // Create firing timer using CooldownManager - keeping this LUK-based as before
    const firingTimer = CooldownManager.createTimer({
        statName: 'luck', // LUK-based timing
        baseCooldown: baseCooldown,
        formula: 'sqrt',
        component: orbital,  // Store reference to the orbital
        callback: function () {
            // Skip if game is over/paused or orbital is destroyed
            if (gameOver || gamePaused ||
                !orbital || orbital.destroyed ||
                !orbital.entity || !orbital.entity.active) {
                return;
            }

            // Calculate max distance based on player's AGI (fire rate)
            const baseDistance = 400; // Base distance
            let maxDistance = baseDistance * (Math.sqrt(playerFireRate / BASE_STATS.AGI));

            // Apply range modifier from options if available
            const rangeModifier = orbital.options?.rangeModifier ?? 1.0;
            maxDistance *= rangeModifier;

            // Add time-based variation if specified in options
            if (orbital.options?.useRangeVariation) {
                const variation = Math.sin(scene.time.now * 0.001) * 0.2; // ±20% variation
                maxDistance *= (1.0 + variation);
            }

            // Execute the behavior with the calculated max distance
            behaviorFn(scene, orbital, scene.time.now, maxDistance);
        },
        callbackScope: scene,
        loop: true
    });

    return firingTimer;
}

// Helper function to set up color-changing for a fairy
function setupFairyColorChanger(scene, orbital) {
    if (!orbital || !orbital.entity || !scene) return;

    // Array of vibrant colors for the fun fairy
    const colors = [
        '#FF55FF', // Pink
        '#55FFFF', // Cyan
        '#FFFF55', // Yellow
        '#55FF55', // Green
        '#FF5555', // Red
        '#5555FF'  // Blue
    ];

    let colorIndex = 0;

    // Create the color change timer (every 2 seconds as requested)
    const colorTimer = scene.time.addEvent({
        delay: 2000,
        callback: function () {
            if (!orbital.entity || !orbital.entity.active) {
                colorTimer.remove();
                return;
            }

            // Move to next color
            colorIndex = (colorIndex + 1) % colors.length;

            // Apply new color with tween for smooth transition
            scene.tweens.add({
                targets: orbital.entity,
                duration: 500,
                onUpdate: function () {
                    orbital.entity.setColor(colors[colorIndex]);
                }
            });
        },
        callbackScope: scene,
        loop: true
    });

    // Register the timer for cleanup
    window.registerEffect('timer', colorTimer);

    // Store reference to timer on orbital for cleanup
    orbital.colorTimer = colorTimer;

    return colorTimer;
}

window.FamiliarSystem = {
    behaviors: FamiliarBehaviors,
    findRandomVisibleEnemy: findRandomVisibleEnemy,
    findClosestVisibleEnemy: findClosestVisibleEnemy,
    fireFamiliarProjectile: fireFamiliarProjectile,
    setupFamiliarFiringTimer: setupFamiliarFiringTimer,
    setupFairyColorChanger: setupFairyColorChanger
};