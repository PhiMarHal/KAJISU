// Maps perks to dropper effects like landmines and traps

// Registry system for dropper perks
const DropperPerkRegistry = {
    // Map perks to their dropper configurations
    perkDropperConfigs: {},

    // Register a perk that creates drops
    // Updated to accept cooldownStat and cooldownFormula and advanced stat functions
    registerDropperPerk: function (perkId, config) {
        this.perkDropperConfigs[perkId] = {
            getConfig: config.getConfig ?? function () { return {}; }, // Function that returns drop config
            cooldown: config.cooldown ?? 4000,                        // Base Cooldown in ms (now a number)
            cooldownStat: config.cooldownStat ?? null,                // Stat that affects cooldown (e.g., 'luck', 'fireRate')
            cooldownFormula: config.cooldownFormula ?? null,          // Formula for stat scaling ('sqrt', 'divide', 'multiply')
            statFunction: config.statFunction ?? null,                // Custom stat calculation function
            statDependencies: config.statDependencies ?? null,        // Dependencies for the custom function
            baseStatFunction: config.baseStatFunction ?? null,        // Base stat calculation (optional for 'divide' but good for completeness)
            positionMode: config.positionMode ?? 'player',            // How drops are positioned
            activationMethod: config.activationMethod ?? 'periodic',  // How drops are created
            trailInterval: config.trailInterval ?? 32                 // Distance for trail mode
        };
    },

    // Apply a perk's dropper effect
    applyDropperPerk: function (scene, perkId) {
        // Check if we have a configuration for this perk
        const perkConfig = this.perkDropperConfigs[perkId];
        if (!perkConfig) return false;

        console.log(`Applying dropper perk: ${perkId}`);

        // Handle different activation methods
        switch (perkConfig.activationMethod) {
            case 'immediate':
                // Create a single drop immediately
                const dropConfig = perkConfig.getConfig();
                dropConfig.x = player.x;
                dropConfig.y = player.y;
                DropperSystem.create(scene, dropConfig);
                break;

            case 'periodic':
                // Set up periodic drops using the new cooldown properties
                return DropperSystem.setupPeriodicDrops(scene, {
                    getConfig: perkConfig.getConfig,
                    cooldown: perkConfig.cooldown,             // Pass base cooldown
                    cooldownStat: perkConfig.cooldownStat,     // Pass stat name
                    cooldownFormula: perkConfig.cooldownFormula, // Pass formula
                    statFunction: perkConfig.statFunction,       // Pass custom stat function
                    statDependencies: perkConfig.statDependencies, // Pass dependencies
                    baseStatFunction: perkConfig.baseStatFunction, // Pass base stat function
                    positionMode: perkConfig.positionMode,
                    trailInterval: perkConfig.trailInterval // Pass trail interval for trail mode
                });

            default:
                console.log(`Unknown activation method: ${perkConfig.activationMethod}`);
                return false;
        }

        return true;
    }
};

// Register the Amber Beetle perk (landmines)
DropperPerkRegistry.registerDropperPerk('AMBER_BEETLE', {
    getConfig: function () {
        return {
            symbol: '★',
            color: '#ffbf00', // Amber color
            fontSize: getEffectiveSize(),
            behaviorType: 'projectile',
            // Damage: (Effective + Luck) * 0.5
            damage: (getEffectiveDamage() + playerLuck) * 0.5,
            // Lifespan: sqrt(playerLuck), target 20s at 4 LUK -> sqrt(4)*X=20000 -> 2*X=20000 -> X=10000
            lifespan: Math.sqrt(playerLuck) * 10000,
            options: {
                visualEffect: 'createPulsing',
                effectComponent: 'explosionEffect'
            }
        };
    },
    // Cooldown: (FR+Luck), target 4s at 4 LUK + 4 AGI -> Base/8 = 4000 -> Base = 32000
    cooldown: 32000,
    cooldownFormula: 'divide',
    statFunction: () => getEffectiveFireRate() + playerLuck,
    statDependencies: ['fireRate', 'luck'],

    positionMode: 'player',
    activationMethod: 'periodic'
});

// Function to activate the Amber Beetle perk (landmines)
// This replaces the activateLandmines function in index.html
window.activateLandmines = function () {
    // Get the current active scene
    const scene = game.scene.scenes[0];
    if (scene) {
        // Apply the dropper perk
        DropperPerkRegistry.applyDropperPerk(scene, 'AMBER_BEETLE');
    }
};

DropperPerkRegistry.registerDropperPerk('MAGMA_FLOOR', {
    getConfig: function () {
        return {
            symbol: '熔', // Kanji for "magma/melting"
            color: '#FF4400', // Orange-red color for magma
            fontSize: 64, // Very large size as requested
            behaviorType: 'persistent', // Persistent type to stay and deal damage
            // Damage: (Effective + Luck) * 0.5
            damage: (getEffectiveDamage() + playerLuck) * 0.5,
            damageInterval: 1000, // 1 second between damage applications
            // Lifespan: sqrt(playerLuck), target 4s at 4 LUK -> sqrt(4)*X=4000 -> 2*X=4000 -> X=2000
            lifespan: Math.sqrt(playerLuck) * 2000,
            options: {
                visualEffect: 'createPulsing', // Add pulsing animation for better visibility
                opacity: 0.8 // Slightly transparent
            }
        };
    },
    cooldown: 8000 * 8,
    cooldownFormula: 'divide',
    statFunction: () => getEffectiveFireRate() + playerLuck,
    statDependencies: ['fireRate', 'luck'],

    positionMode: 'player', // Drop at player position
    activationMethod: 'periodic' // Periodically create magma floors
});

// Function to activate the MAGMA_FLOOR perk
window.activateMagmaFloor = function () {
    // Get the current active scene
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Create a magma floor configuration
    const magmaConfig = DropperPerkRegistry.perkDropperConfigs['MAGMA_FLOOR'].getConfig();

    // Create the first magma floor immediately
    magmaConfig.x = player.x;
    magmaConfig.y = player.y;
    DropperSystem.create(scene, magmaConfig);

    // Apply the dropper perk for future magma floors
    return DropperPerkRegistry.applyDropperPerk(scene, 'MAGMA_FLOOR');
};

// Register the Green Dream perk (afterimages)
DropperPerkRegistry.registerDropperPerk('GREEN_DREAM', {
    getConfig: function () {
        return {
            symbol: HERO_CHARACTER, // Use the player's character (dynamically)
            color: '#00cc66', // Green color
            fontSize: 32, // Same size as player
            initialScale: 1, // Start at full size (no grow animation)
            behaviorType: 'persistent', // Deals continuous damage on overlap

            // Updated Damage Formula: (Effective Damage + Luck) * 0.5
            damage: (getEffectiveDamage() + playerLuck) * 0.5,
            damageInterval: 500, // Half second between damage applications

            // Lifespan: sqrt(playerLuck), target 4s at 4 LUK -> sqrt(4)*X=4000 -> 2*X=4000 -> X=2000
            lifespan: Math.sqrt(playerLuck) * 2000,

            options: {
                opacity: 0.5 // Half opacity
            }
        };
    },

    cooldown: 2000 * 8,
    cooldownFormula: 'divide',
    statFunction: () => getEffectiveFireRate() + playerLuck,
    statDependencies: ['fireRate', 'luck'],

    positionMode: 'player', // Drop at player position
    activationMethod: 'periodic'
});

// Function to activate the Green Dream perk (afterimages)
// This replaces the activateAfterImages function in index.html
window.activateAfterImages = function () {
    // Get the current active scene
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Apply the dropper perk
    DropperPerkRegistry.applyDropperPerk(scene, 'GREEN_DREAM');
};

// Register the Blooming Flower perk
DropperPerkRegistry.registerDropperPerk('BLOOMING_FLOWER', {
    getConfig: function () {
        return {
            symbol: '花', // Kanji for "flower"
            color: '#FF66AA', // Pink color for flower
            fontSize: 24, // Smaller size as requested
            behaviorType: 'projectile', // Dies on enemy contact
            // Damage was playerDamage (1.0 scale) -> (Effective + Luck) * 0.5
            damage: (getEffectiveDamage() + playerLuck) * 0.5,
            lifespan: 60000,
            options: {
                hasPeriodicEffect: true, // Generic flag for drops with periodic effects
                periodicEffectCooldown: 4600 * 8,
                periodicEffectFormula: 'divide',
                periodicEffectStatFunction: () => getEffectiveFireRate() + playerLuck,
                periodicEffectStatDependencies: ['fireRate', 'luck'],

                fireImmediately: true, // Flag to indicate it should fire immediately on spawn
                visualEffect: 'createPulsing' // Flag for visual pulsing effect
            }
        };
    },
    // Updated cooldown to be a base number, with stat and formula
    cooldown: 10000,
    cooldownStat: 'luck',
    cooldownFormula: 'sqrt',
    positionMode: 'random', // Random position on screen
    activationMethod: 'periodic'
});

// Function to activate the Blooming Flower perk
window.activateBloomingFlower = function () {
    // Get the current active scene
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Setup periodic effects for drops (only needs to be done once)
    //setupPeriodicEffectsSystem(scene);

    // Create a flower configuration
    const flowerConfig = DropperPerkRegistry.perkDropperConfigs['BLOOMING_FLOWER'].getConfig();

    // Explicitly set random position for the first flower
    flowerConfig.x = Phaser.Math.Between(0, game.config.width);
    flowerConfig.y = Phaser.Math.Between(0, game.config.height);

    // Create the first flower immediately
    DropperSystem.create(scene, flowerConfig);

    // Apply the dropper perk for future flowers
    const controller = DropperPerkRegistry.applyDropperPerk(scene, 'BLOOMING_FLOWER');

    return controller;
};

DropperPerkRegistry.registerDropperPerk('LASER_FLOWER', {
    getConfig: function () {
        return {
            symbol: '光', // Kanji for "light flower"
            color: '#FF00FF',
            fontSize: 24, // Medium size like other flowers
            behaviorType: 'projectile', // Stays around to keep firing
            // Damage was playerDamage (1.0 scale) -> (Effective + Luck) * 0.5
            damage: (getEffectiveDamage() + playerLuck) * 0.5,
            damageInterval: 1000, // Not really used for laser flowers
            lifespan: 60000,
            options: {
                hasPeriodicEffect: true, // Uses the periodic effect system
                // Periodic Effect Cooldown: (FR+Luck), target 11800ms at 4 LUK + 4 AGI -> Base/8 = 11800 -> Base = 94400
                periodicEffectCooldown: 94400,
                periodicEffectFormula: 'divide',
                periodicEffectStatFunction: () => getEffectiveFireRate() + playerLuck,
                periodicEffectStatDependencies: ['fireRate', 'luck'],

                fireImmediately: true, // Fire immediately when spawned
                visualEffect: 'createPulsing', // Pulsing animation
                isLaserFlower: true // Flag to identify this as a laser flower
            }
        };
    },
    cooldown: 18000,
    cooldownStat: 'luck',
    cooldownFormula: 'sqrt',
    positionMode: 'random', // Random position on screen
    activationMethod: 'periodic' // Periodically create laser flowers
});

// Add this to entrapments.js - Activation function
window.activateLaserFlower = function () {
    // Get the current active scene
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Setup periodic effects for drops (only needs to be done once)
    //setupPeriodicEffectsSystem(scene);

    // Create a laser flower configuration
    const flowerConfig = DropperPerkRegistry.perkDropperConfigs['LASER_FLOWER'].getConfig();

    // Explicitly set random position for the first flower
    flowerConfig.x = Phaser.Math.Between(0, game.config.width);
    flowerConfig.y = Phaser.Math.Between(0, game.config.height);

    // Create the first flower immediately
    DropperSystem.create(scene, flowerConfig);

    // Apply the dropper perk for future flowers
    const controller = DropperPerkRegistry.applyDropperPerk(scene, 'LASER_FLOWER');

    return controller;
};

// Register the perk with DropperPerkRegistry in entrapments.js
DropperPerkRegistry.registerDropperPerk('POISON_FLOWER', {
    getConfig: function () {
        return {
            symbol: '毒', // Kanji for "poison"
            color: '#2aad27', // Green color for poison
            fontSize: 28, // Medium size
            behaviorType: 'areaEffect', // Use area effect behavior
            // Damage was playerDamage (1.0 scale) -> (Effective + Luck) * 0.5
            damage: (getEffectiveDamage() + playerLuck) * 0.5,
            damageInterval: 0, // Not used for area effects
            lifespan: 60000,
            options: {
                // Area Effect Interval: (FR+Luck), target 9200ms at 4 LUK + 4 AGI -> Base/8 = 9200 -> Base = 73600
                areaEffectInterval: 73600,
                areaEffectFormula: 'divide',
                areaEffectStatFunction: () => getEffectiveFireRate() + playerLuck,
                areaEffectStatDependencies: ['fireRate', 'luck'],

                areaEffectRadius: 260, // Base radius
                pulseColor: 0x2aad27, // Green color for the pulse effect
                visualEffect: 'createPulsing', // Add pulsing animation
                effectComponent: 'poisonEffect' // Use the poisonEffect component
            }
        };
    },
    // Updated cooldown to be a base number, with stat and formula
    cooldown: 12000,
    cooldownStat: 'luck',
    cooldownFormula: 'sqrt',
    positionMode: 'random', // Random position on screen
    activationMethod: 'periodic' // Periodically create poison flowers
});

// Function to activate the poison flower perk
window.activatePoisonFlower = function () {
    // Get the current active scene
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Create a flower configuration
    const flowerConfig = DropperPerkRegistry.perkDropperConfigs['POISON_FLOWER'].getConfig();

    // Explicitly set random position for the first flower
    flowerConfig.x = Phaser.Math.Between(0, game.config.width);
    flowerConfig.y = Phaser.Math.Between(0, game.config.height);

    // Create the first flower immediately
    DropperSystem.create(scene, flowerConfig);

    // Apply the dropper perk for future flowers
    return DropperPerkRegistry.applyDropperPerk(scene, 'POISON_FLOWER');
};

DropperPerkRegistry.registerDropperPerk('COLD_FLOWER', {
    getConfig: function () {
        return {
            symbol: '冷', // Kanji for "cold"
            color: '#00ffff', // Cyan color for frost
            fontSize: 28, // Medium size
            behaviorType: 'areaEffect', // Use area effect behavior
            // Damage was playerDamage (1.0 scale) -> (Effective + Luck) * 0.5
            damage: (getEffectiveDamage() + playerLuck) * 0.5,
            damageInterval: 0, // Not used for area effects
            lifespan: 60000,
            options: {
                // Area Effect Interval: (FR+Luck), target 7100ms at 4 LUK + 4 AGI -> Base/8 = 7100 -> Base = 56800
                areaEffectInterval: 56800,
                areaEffectFormula: 'divide',
                areaEffectStatFunction: () => getEffectiveFireRate() + playerLuck,
                areaEffectStatDependencies: ['fireRate', 'luck'],

                areaEffectRadius: 220, //
                pulseColor: 0x00ffff, // Cyan color for the pulse effect
                visualEffect: 'createPulsing', // Add pulsing animation
                effectComponent: 'slowEffect' // Use the slowEffect component
            }
        };
    },
    // Updated cooldown to be a base number, with stat and formula
    cooldown: 12000,
    cooldownStat: 'luck',
    cooldownFormula: 'sqrt',
    positionMode: 'random', // Random position on screen
    activationMethod: 'periodic' // Periodically create frost flowers
});

// Function to activate the Cold Flower perk
window.activateColdFlower = function () {
    // Get the current active scene
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Create a flower configuration
    const flowerConfig = DropperPerkRegistry.perkDropperConfigs['COLD_FLOWER'].getConfig();

    // Explicitly set random position for the first flower
    flowerConfig.x = Phaser.Math.Between(0, game.config.width);
    flowerConfig.y = Phaser.Math.Between(0, game.config.height);

    // Create the first flower immediately
    DropperSystem.create(scene, flowerConfig);

    // Apply the dropper perk for future flowers
    return DropperPerkRegistry.applyDropperPerk(scene, 'COLD_FLOWER');
};

// EXPLODING_FLOWER - Grows for 4 seconds then explodes into projectiles
DropperPerkRegistry.registerDropperPerk('EXPLODING_FLOWER', {
    getConfig: function () {
        return {
            symbol: '爆',
            color: '#FF6600',
            fontSize: 16,
            behaviorType: 'projectile',
            damage: (getEffectiveDamage() + playerLuck),
            lifespan: 4010,
            health: 1,
            options: {
                hasPeriodicEffect: true,
                fireImmediately: false,
                periodicEffectCooldown: 4000,
                periodicEffectFormula: 'fixed',
                isExplodingFlower: true,
                visualEffect: {
                    type: 'createGrowing',
                    config: { targetScale: 2, duration: 4000 }
                }
            }
        };
    },
    cooldown: 8000,
    cooldownStat: 'luck',
    cooldownFormula: 'sqrt',
    positionMode: 'random',
    activationMethod: 'periodic'
});

window.activateExplodingFlower = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;

    const config = DropperPerkRegistry.perkDropperConfigs['EXPLODING_FLOWER'].getConfig();
    config.x = Phaser.Math.Between(50, game.config.width - 50);
    config.y = Phaser.Math.Between(50, game.config.height - 50);

    DropperSystem.create(scene, config);

    return DropperPerkRegistry.applyDropperPerk(scene, 'EXPLODING_FLOWER');
};

DropperPerkRegistry.registerDropperPerk('FROST_SHRAPNEL', {
    getConfig: function () {
        return {
            symbol: '氷',  // Kanji for "ice"
            color: '#00FFFF', // Cyan color for frost
            fontSize: 16, // Medium size for visibility
            behaviorType: 'projectile', // Projectile type as requested
            // Damage was playerDamage * 0.2 (0.2 scale) -> (Effective + Luck) * 0.1
            damage: (getEffectiveDamage() + playerLuck) * 0.1,
            damageInterval: 1000, // 1 second between damage applications
            // Lifespan: sqrt(playerLuck), target 20s at 4 LUK -> sqrt(4)*X=20000 -> 2*X=20000 -> X=10000
            lifespan: Math.sqrt(playerLuck) * 10000,
            options: {
                effectComponent: 'slowEffect' // Apply slow effect like Azure Frost
            }
        };
    },
    // Cooldown: (FR+Luck), target 4s at 4 LUK + 4 AGI -> Base/8 = 4000 -> Base = 32000
    cooldown: 32000,
    cooldownFormula: 'divide',
    statFunction: () => getEffectiveFireRate() + playerLuck,
    statDependencies: ['fireRate', 'luck'],

    positionMode: 'player', // Drop at player position
    activationMethod: 'periodic' // Periodically create shrapnel
});

// Function to activate the FROST_SHRAPNEL perk
window.activateFrostShrapnel = function () {
    // Get the current active scene
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Create a shrapnel configuration
    const shrapnelConfig = DropperPerkRegistry.perkDropperConfigs['FROST_SHRAPNEL'].getConfig();

    // Create the first shrapnel immediately
    shrapnelConfig.x = player.x;
    shrapnelConfig.y = player.y;
    DropperSystem.create(scene, shrapnelConfig);

    // Apply the dropper perk for future shrapnel pieces
    return DropperPerkRegistry.applyDropperPerk(scene, 'FROST_SHRAPNEL');
};

// Register TOXIC_TRAIL perk with DropperPerkRegistry
DropperPerkRegistry.registerDropperPerk('TOXIC_TRAIL', {
    getConfig: function () {
        return {
            symbol: '毒', // Kanji for "toxic"
            color: '#33cc33', // Green color for poison theme
            fontSize: 16, // Small size for trail elements
            behaviorType: 'projectile', // Dies on enemy contact
            // Damage was playerDamage * 0.5 (0.5 scale) -> (Effective + Luck) * 0.25
            damage: (getEffectiveDamage() + playerLuck) * 0.25,
            // Existing lifespan formula uses sqrt(luck), kept as requested
            lifespan: Math.ceil(4000 * Math.sqrt(playerLuck / BASE_STATS.LUK)),
            options: {
                effectComponent: 'poisonEffect', // Apply poison effect component
                visualEffect: 'createPulsing' // Add pulsing visual effect
            }
        };
    },
    // Cooldown: (FR+Luck), target 200ms at 4 LUK + 4 AGI -> Base/8 = 200 -> Base = 1600
    cooldown: 1600,
    cooldownFormula: 'divide',
    statFunction: () => getEffectiveFireRate() + playerLuck,
    statDependencies: ['fireRate', 'luck'],

    positionMode: 'trail', // Follow player's movement
    trailInterval: 16, // Updated to 16 as requested
    activationMethod: 'periodic' // Periodically create drops
});

// Function to activate the TOXIC_TRAIL perk
window.activateToxicTrail = function () {
    // Get the current active scene
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Create a trail configuration
    const trailConfig = DropperPerkRegistry.perkDropperConfigs['TOXIC_TRAIL'].getConfig();

    // Explicitly set initial position to player's position
    trailConfig.x = player.x;
    trailConfig.y = player.y;

    // Create the first drop immediately
    DropperSystem.create(scene, trailConfig);

    // Apply the dropper perk for future trail elements
    return DropperPerkRegistry.applyDropperPerk(scene, 'TOXIC_TRAIL');
};

DropperPerkRegistry.registerDropperPerk('GOLDEN_AGE', {
    getConfig: function () {
        return {
            symbol: '球',
            color: '#ffd700', // Gold/yellow color
            fontSize: 32, // Same size as player
            behaviorType: 'playerPushable',
            // Damage was playerDamage (1.0 scale) -> (Effective + Luck) * 0.5
            damage: (getEffectiveDamage() + playerLuck) * 0.5,
            damageMultiplier: 1.0, // Dynamic scaling
            damageInterval: 400,
            colliderSize: 1.0, // Full size collision
            lifespan: null, // Permanent
            health: 999999999, // Effectively indestructible
        };
    },
    cooldown: null,
    cooldownStat: null,
    cooldownFormula: null,
    positionMode: 'player',
    activationMethod: 'immediate'
});

// Register Golden Age component with PlayerComponentSystem
PlayerComponentSystem.registerComponent('goldenAgeAbility', {
    checkTimer: null,

    // Calculate how many balls should exist based on current stats
    getTargetBallCount: function () {
        return Math.max(1, Math.floor((getEffectiveFireRate() + playerLuck) / 8));
    },

    // Count existing golden balls using DropperSystem
    getCurrentBallCount: function () {
        return DropperSystem.getAll().filter(drop => drop.isGoldenAgeBall).length;
    },

    // Spawn a single golden ball
    spawnBall: function (scene) {
        const config = DropperPerkRegistry.perkDropperConfigs['GOLDEN_AGE'].getConfig();
        config.x = player.x;
        config.y = player.y;

        const drop = DropperSystem.create(scene, config);
        if (drop) {
            drop.isGoldenAgeBall = true;
        }
        return drop;
    },

    // Check and spawn new balls if needed
    checkAndSpawn: function () {
        if (gameOver || gamePaused) return;

        const scene = game.scene.scenes[0];
        if (!scene) return;

        const targetCount = this.getTargetBallCount();
        let currentCount = this.getCurrentBallCount();

        // Spawn new balls if below target
        for (let i = currentCount; i < targetCount; i++) {
            this.spawnBall(scene);
        }

        // Remove oldest balls if over target
        while (currentCount > targetCount) {
            const goldenBalls = DropperSystem.getAll()
                .filter(drop => drop.isGoldenAgeBall)
                .sort((a, b) => a.createdAt - b.createdAt);

            if (goldenBalls.length > 0) {
                DropperSystem.destroyDrop(goldenBalls[0]);
                currentCount--;
            } else {
                break;
            }
        }
    },

    initialize: function (player) {
        const scene = game.scene.scenes[0];
        if (!scene) return;

        // Spawn initial ball(s)
        this.checkAndSpawn();

        // Set up periodic check timer (every 1 second)
        this.checkTimer = scene.time.addEvent({
            delay: 1000,
            callback: this.checkAndSpawn,
            callbackScope: this,
            loop: true
        });

        window.registerEffect('timer', this.checkTimer);
    },

    cleanup: function (player) {
        if (this.checkTimer) {
            this.checkTimer.remove();
            this.checkTimer = null;
        }

        // Destroy all golden balls
        DropperSystem.getAll()
            .filter(drop => drop.isGoldenAgeBall)
            .forEach(drop => DropperSystem.destroyDrop(drop));
    }
});

// Register with PlayerPerkRegistry for automatic activation/deactivation
PlayerPerkRegistry.registerPerkEffect('GOLDEN_AGE', {
    componentName: 'goldenAgeAbility',
    condition: function () {
        return true; // Always active when perk is acquired
    }
});

// Activation function for GOLDEN_AGE
window.activateGoldenAge = function () {
    // Explicitly add the component (PlayerPerkRegistry also handles this on update)
    PlayerComponentSystem.addComponent('goldenAgeAbility');
};

// Update CLOUD_KING config in entrapments.js to include physics options
DropperPerkRegistry.registerDropperPerk('CLOUD_KING', {
    getConfig: function () {
        return {
            symbol: '位', // Kanji for "crown"
            color: '#00DDFF', // Blue color like Storm Beacon
            fontSize: 32, // Same size as player
            behaviorType: 'playerPushable',
            // Damage was playerDamage * 0.4 (0.4 scale) -> (Effective + Luck) * 0.2
            damage: (getEffectiveDamage() + playerLuck) * 0.2,
            damageMultiplier: 0.4, // Dynamic scaling
            damageInterval: 400,
            colliderSize: 1.0, // Full size collision
            lifespan: null, // Permanent
            health: 999999999, // Effectively indestructible
            options: {
                hasPeriodicEffect: true, // Enable periodic lightning
                periodicEffectCooldown: 2000, // Base 2 second cooldown
                fireImmediately: false, // Don't fire immediately on spawn
                isCloudKing: true, // Flag to identify this as a cloud king
                // Physics configuration for more ponderous movement
                physics: {
                    bounce: 0.5, // Lower bounce than GOLDEN_AGE
                    drag: 100, // Higher drag to slow it down more
                    mass: 0.1, //
                    maxVelocity: 200 // Lower max velocity
                }
            }
        };
    },
    cooldown: null, // No periodic spawning
    cooldownStat: null,
    cooldownFormula: null,
    positionMode: 'player', // Spawn near player
    activationMethod: 'immediate' // Create once immediately
});

// Add to entrapments.js - activation function
window.activateCloudKing = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Apply the dropper perk (will create one crown immediately)
    DropperPerkRegistry.applyDropperPerk(scene, 'CLOUD_KING');
};

// Add to entrapments.js - HAMMER_QUEEN perk registration
DropperPerkRegistry.registerDropperPerk('HAMMER_QUEEN', {
    getConfig: function () {
        return {
            symbol: '位', // Same kanji for "crown" as CLOUD_KING
            color: '#FFD700', // Gold color like God Hammer
            fontSize: 32, // Same size as player
            behaviorType: 'playerPushable',
            // Damage was playerDamage * 0.4 (0.4 scale) -> (Effective + Luck) * 0.2
            damage: (getEffectiveDamage() + playerLuck) * 0.2,
            damageMultiplier: 0.4, // Dynamic scaling
            damageInterval: 400,
            colliderSize: 1.0, // Full size collision
            lifespan: null, // Permanent
            health: 999999999, // Effectively indestructible
            options: {
                hasPeriodicEffect: true, // Enable periodic hammers
                periodicEffectCooldown: 20000,
                fireImmediately: false, // Don't fire immediately on spawn
                isHammerQueen: true,
                // Same physics configuration as CLOUD_KING
                physics: {
                    bounce: 0.5, // Lower bounce than GOLDEN_AGE
                    drag: 100, // Higher drag to slow it down more
                    mass: 0.1,
                    maxVelocity: 200 // Lower max velocity
                }
            }
        };
    },
    cooldown: null, // No periodic spawning
    cooldownStat: null,
    cooldownFormula: null,
    positionMode: 'player', // Spawn near player
    activationMethod: 'immediate' // Create once immediately
});

// Add to entrapments.js - activation function
window.activateHammerQueen = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Apply the dropper perk (will create one crown immediately)
    DropperPerkRegistry.applyDropperPerk(scene, 'HAMMER_QUEEN');
};

// HERO_STATUE
DropperPerkRegistry.registerDropperPerk('HERO_STATUE', {
    getConfig: function () {
        return {
            symbol: HERO_CHARACTER,
            color: '#A08831',
            fontSize: 32,
            behaviorType: 'playerPushable',
            // Damage was playerDamage * 0.4 (0.4 scale) -> (Effective + Luck) * 0.2
            damage: (getEffectiveDamage() + playerLuck) * 0.2,
            damageMultiplier: 0.4, // Dynamic scaling
            damageInterval: 400,
            colliderSize: 1.0,
            lifespan: null, // Permanent
            health: 999999999, // Effectively indestructible
            options: {
                // Physics configuration
                physics: {
                    bounce: 0.5,
                    drag: 100,
                    mass: 0.1,
                    maxVelocity: 200
                },
                // Unified firing configuration - same as any familiar!
                isFiring: true,
                firingBehavior: 'heroStatue',
                firingCooldown: 1000, // Base cooldown
                firingCooldownStat: null, // Using custom stat function instead
                firingRange: 400,
            }
        };
    },
    cooldown: null,
    cooldownStat: null,
    cooldownFormula: null,
    positionMode: 'player',
    activationMethod: 'immediate'
});

window.activateHeroStatue = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Create the statue
    DropperPerkRegistry.applyDropperPerk(scene, 'HERO_STATUE');

    // Find the created statue and set up firing - same as any familiar!
    scene.time.delayedCall(100, function () {
        const heroStatue = DropperSystem.getAll().find(drop =>
            drop.options && drop.options.isFiring && drop.options.firingBehavior === 'heroStatue'
        );

        if (heroStatue) {
            // UPDATED: Using custom stat function for Hero Statue firing cooldown
            // Target: 1000ms at base?? 
            // Assuming the user wants the SAME logic as others: (FR+Luck)
            // Formula: Base / Stat = Target.
            // If target is 1000ms (original): Base = 1000 * 8 = 8000.
            heroStatue.firingTimer = EntityFiringSystem.setupEntityFiringTimer(
                scene,
                heroStatue, // Pass the drop object (has drop.entity)
                heroStatue.options.firingBehavior,
                8000, // Base cooldown adjusted for divide formula
                {
                    statFunction: () => getEffectiveFireRate() + playerLuck,
                    statDependencies: ['fireRate', 'luck'],
                    formula: 'divide',
                    maxDistance: heroStatue.options.firingRange,
                    rangeModifier: 1.0,
                    rangeScaling: false // Don't apply additional range scaling
                }
            );
        }
    });
};

DropperPerkRegistry.registerDropperPerk('FLAME_PILLAR', {
    getConfig: function () {
        return {
            symbol: '炎', // Fire symbol for the totem
            color: '#FF4500', // Orange-red fire color
            fontSize: 32,
            behaviorType: 'playerPushable',
            // Damage was playerDamage * 0.4 (0.4 scale) -> (Effective + Luck) * 0.2
            damage: (getEffectiveDamage() + playerLuck) * 0.2,
            damageMultiplier: 0.4, // Dynamic scaling
            damageInterval: 400,
            colliderSize: 1.0,
            lifespan: null, // Permanent
            health: 999999999, // Effectively indestructible
            options: {
                // Physics configuration similar to other totems
                physics: {
                    bounce: 0.5,
                    drag: 100,
                    mass: 0.1,
                    maxVelocity: 200
                },
                // Firing configuration
                firingBehavior: 'burningTotem',
                firingCooldown: 1000, // Base cooldown
                firingRange: 400
            }
        };
    },
    cooldown: null,
    cooldownStat: null,
    cooldownFormula: null,
    positionMode: 'player',
    activationMethod: 'immediate'
});

window.activateBurningTotem = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Create the burning totem
    DropperPerkRegistry.applyDropperPerk(scene, 'FLAME_PILLAR');

    const burningTotem = DropperSystem.getAll().find(drop =>
        drop.options && drop.options.firingBehavior === 'burningTotem'
    );

    if (burningTotem) {
        // UPDATED: Using custom stat function for Flame Pillar firing cooldown
        // Assuming target 1000ms: Base = 1000 * 8 = 8000
        burningTotem.firingTimer = EntityFiringSystem.setupEntityFiringTimer(
            scene,
            burningTotem,
            burningTotem.options.firingBehavior,
            8000,
            {
                // NEW: Use custom function and dependencies
                statFunction: () => getEffectiveFireRate() + playerLuck,
                statDependencies: ['fireRate', 'luck'],
                formula: 'divide',
                maxDistance: burningTotem.options.firingRange,
                rangeModifier: 1.0,
                rangeScaling: false
            }
        );
    }
};

// TWIN_STRIKE - Two pillars that zap enemies between them when close
DropperPerkRegistry.registerDropperPerk('TWIN_STRIKE', {
    getConfig: function () {
        return {
            symbol: '双',
            color: '#FFD700',
            fontSize: 24,
            behaviorType: 'playerPushable',
            damage: (getEffectiveDamage() + playerLuck) * 0.2,
            damageMultiplier: 0.4,
            damageInterval: 400,
            colliderSize: 1.0,
            lifespan: null,
            health: 999999999,
            options: {
                physics: {
                    bounce: 0.5,
                    drag: 100,
                    mass: 0.1,
                    maxVelocity: 200
                }
            }
        };
    },
    cooldown: null,
    positionMode: 'player',
    activationMethod: 'immediate'
});

PlayerComponentSystem.registerComponent('twinStrikeAbility', {
    statues: [],
    arcTimer: null,
    maxRange: 480,

    initialize: function (player) {
        const scene = game.scene.scenes[0];
        if (!scene) return;

        this.statues = [];

        // Spawn 2 pillars with offset
        const offsets = [-40, 40];
        offsets.forEach(offsetX => {
            const config = DropperPerkRegistry.perkDropperConfigs['TWIN_STRIKE'].getConfig();
            config.x = player.x + offsetX;
            config.y = player.y;

            const drop = DropperSystem.create(scene, config);
            if (drop) {
                drop.isTwinStrikeStatue = true;
                this.statues.push(drop);
            }
        });

        // 16000 / (FR + Luck) = 2s at base stats (doubled frequency from original 32000)
        this.arcTimer = CooldownManager.createTimer({
            baseCooldown: 16000,
            statFunction: () => getEffectiveFireRate() + playerLuck,
            statDependencies: ['fireRate', 'luck'],
            formula: 'divide',
            callback: this.fireArc,
            callbackScope: this,
            loop: true
        });
    },

    fireArc: function () {
        if (gameOver || gamePaused) return;

        const activeStatues = this.statues.filter(s => s?.entity?.active);
        if (activeStatues.length < 2) return;

        const s1 = activeStatues[0].entity;
        const s2 = activeStatues[1].entity;

        const dx = s2.x - s1.x;
        const dy = s2.y - s1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > this.maxRange) return;

        const scene = game.scene.scenes[0];
        if (!scene) return;

        VisualEffects.createLightningArcFlash(scene, s1.x, s1.y, s2.x, s2.y, {
            color: 0xFFFF00,
            lineWidth: 3,
            duration: 400
        });

        const damage = getEffectiveDamage() + playerLuck;

        EnemySystem.enemiesGroup.getChildren().forEach(enemy => {
            if (!enemy?.active) return;

            const dist = this.pointToLineDistance(enemy.x, enemy.y, s1.x, s1.y, s2.x, s2.y);
            if (dist < 24) {
                EnemySystem.applyDamage(this.statues[0]?.entity ?? s1, enemy, damage, 500);
            }
        });
    },

    pointToLineDistance: function (px, py, x1, y1, x2, y2) {
        const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        const param = lenSq !== 0 ? dot / lenSq : -1;

        const xx = param < 0 ? x1 : param > 1 ? x2 : x1 + param * C;
        const yy = param < 0 ? y1 : param > 1 ? y2 : y1 + param * D;

        return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
    },

    cleanup: function () {
        if (this.arcTimer) {
            CooldownManager.removeTimer(this.arcTimer);
            this.arcTimer = null;
        }

        DropperSystem.getAll()
            .filter(drop => drop.isTwinStrikeStatue)
            .forEach(drop => DropperSystem.destroyDrop(drop));

        this.statues = [];
    }
});

PlayerPerkRegistry.registerPerkEffect('TWIN_STRIKE', {
    componentName: 'twinStrikeAbility',
    condition: () => true
});

window.activateTwinStrike = function () {
    PlayerComponentSystem.addComponent('twinStrikeAbility');
};

// Export the registry for use in other files
window.DropperPerkRegistry = DropperPerkRegistry;