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

// Helper function to find a random visible enemy
function findRandomVisibleEnemy(scene) {
    // Get all active enemies on screen
    const activeEnemies = enemies.getChildren().filter(enemy => {
        if (!enemy || !enemy.active) return false;

        // Check if enemy is on screen (with some margin)
        return (enemy.x >= -50 && enemy.x <= 1250 &&
            enemy.y >= -50 && enemy.y <= 850);
    });

    // Return a random enemy from the list, or null if none found
    if (activeEnemies.length === 0) return null;

    return Phaser.Utils.Array.GetRandom(activeEnemies);
}

// Helper function to find the closest visible enemy to the player
function findClosestVisibleEnemy(scene) {
    // Get all active enemies on screen
    const activeEnemies = enemies.getChildren().filter(enemy => {
        if (!enemy || !enemy.active) return false;

        // Check if enemy is on screen (with some margin)
        return (enemy.x >= -50 && enemy.x <= 1250 &&
            enemy.y >= -50 && enemy.y <= 850);
    });

    if (activeEnemies.length === 0) return null;

    let closestEnemy = null;
    let closestDistance = Infinity;

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
        damage: playerDamage,
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

    // Adjust size to match the actual damage (right after setting damage)
    projectile.setFontSize(projectileSizeFactor * config.damage);

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

    // Create firing timer using CooldownManager
    const firingTimer = CooldownManager.createTimer({
        statName: 'luck',
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

            // Execute the behavior
            behaviorFn(scene, orbital, scene.time.now);
        },
        callbackScope: scene,
        loop: true
    });

    return firingTimer;
}

// Export the familiar system
window.FamiliarSystem = {
    behaviors: FamiliarBehaviors,
    findRandomVisibleEnemy: findRandomVisibleEnemy,
    findClosestVisibleEnemy: findClosestVisibleEnemy,
    fireFamiliarProjectile: fireFamiliarProjectile,
    setupFamiliarFiringTimer: setupFamiliarFiringTimer
};