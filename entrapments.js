// Maps perks to dropper effects like landmines and traps

// Registry system for dropper perks
const DropperPerkRegistry = {
    // Map perks to their dropper configurations
    perkDropperConfigs: {},

    // Register a perk that creates drops
    // Updated to accept cooldownStat and cooldownFormula
    registerDropperPerk: function (perkId, config) {
        this.perkDropperConfigs[perkId] = {
            getConfig: config.getConfig ?? function () { return {}; }, // Function that returns drop config
            cooldown: config.cooldown ?? 4000,                        // Base Cooldown in ms (now a number)
            cooldownStat: config.cooldownStat ?? null,                // Stat that affects cooldown (e.g., 'luck', 'fireRate')
            cooldownFormula: config.cooldownFormula ?? null,          // Formula for stat scaling ('sqrt', 'divide', 'multiply')
            positionMode: config.positionMode ?? 'player',            // How drops are positioned
            activationMethod: config.activationMethod ?? 'periodic'   // How drops are created
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
                    positionMode: perkConfig.positionMode,
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
        const amberDamage = playerDamage * 2;

        return {
            symbol: '★',
            color: '#ffbf00', // Amber color
            fontSize: getEffectiveSize(projectileSizeFactor, amberDamage),
            behaviorType: 'projectile',
            damage: amberDamage,
            lifespan: 60000,
            options: {
                visualEffect: 'createPulsing'
            }
        };
    },
    // Updated cooldown to be a base number, with stat and formula
    cooldown: 4000, // Base cooldown for Amber Beetle
    cooldownStat: 'fireRate',
    cooldownFormula: 'sqrt',
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
            damage: playerDamage, // Full player damage
            damageInterval: 1000, // 1 second between damage applications
            lifespan: playerLuck * 1000, // Lasts for playerLuck seconds
            options: {
                visualEffect: 'createPulsing', // Add pulsing animation for better visibility
                opacity: 0.8 // Slightly transparent
            }
        };
    },
    // Updated cooldown to be a base number, with stat and formula
    cooldown: 8000, // Base cooldown for Magma Floor
    cooldownStat: 'luck',
    cooldownFormula: 'sqrt',
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
            damage: playerDamage,
            damageInterval: 500, // Half second between damage applications
            lifespan: playerLuck * 1000, // Last for playerLuck seconds
            options: {
                opacity: 0.5 // Half opacity
            }
        };
    },
    // Cooldown is a fixed number, so no stat/formula needed
    cooldown: 2000, // Drop a new afterimage every 2 seconds
    cooldownStat: null, // No stat scaling
    cooldownFormula: null, // No formula
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
            damage: playerDamage, // Full player damage on contact
            lifespan: 240000, // more of a sanity check than anything
            options: {
                hasPeriodicEffect: true, // Generic flag for drops with periodic effects
                periodicEffectCooldown: 6000, // Base cooldown for the effect
                fireImmediately: true, // Flag to indicate it should fire immediately on spawn
                visualEffect: 'createPulsing' // Flag for visual pulsing effect
            }
        };
    },
    // Updated cooldown to be a base number, with stat and formula
    cooldown: 31000, // Base 31 second cooldown
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
    setupPeriodicEffectsSystem(scene);

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
            color: '#FFD700', // Cyan color like laser cannon
            fontSize: 24, // Medium size like other flowers
            behaviorType: 'projectile', // Stays around to keep firing
            damage: playerDamage, // Base damage
            damageInterval: 1000, // Not really used for laser flowers
            lifespan: 240000, // Long lifespan like other flowers
            options: {
                hasPeriodicEffect: true, // Uses the periodic effect system
                periodicEffectCooldown: 13000,
                fireImmediately: true, // Fire immediately when spawned
                visualEffect: 'createPulsing', // Pulsing animation
                isLaserFlower: true // Flag to identify this as a laser flower
            }
        };
    },
    cooldown: 35000, // Base 33 second cooldown for spawning new flowers
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
    setupPeriodicEffectsSystem(scene);

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
            damage: playerDamage * 1,
            damageInterval: 0, // Not used for area effects
            lifespan: 240000, // sanity check
            options: {
                areaEffectInterval: 9000, //
                areaEffectRadius: 320, // Base radius
                pulseColor: 0x2aad27, // Green color for the pulse effect
                visualEffect: 'createPulsing', // Add pulsing animation
                effectComponent: 'poisonEffect' // Use the poisonEffect component
            }
        };
    },
    // Updated cooldown to be a base number, with stat and formula
    cooldown: 15000, // Base 15 second cooldown
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
            damage: playerDamage,
            damageInterval: 0, // Not used for area effects
            lifespan: 240000, // sanity check
            options: {
                areaEffectInterval: 7000, //
                areaEffectRadius: 240, //
                pulseColor: 0x00ffff, // Cyan color for the pulse effect
                visualEffect: 'createPulsing', // Add pulsing animation
                effectComponent: 'slowEffect' // Use the slowEffect component
            }
        };
    },
    // Updated cooldown to be a base number, with stat and formula
    cooldown: 20000, // Base 20 second cooldown
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

DropperPerkRegistry.registerDropperPerk('FROST_SHRAPNEL', {
    getConfig: function () {
        return {
            symbol: '氷',  // Kanji for "ice"
            color: '#00FFFF', // Cyan color for frost
            fontSize: 16, // Medium size for visibility
            behaviorType: 'projectile', // Projectile type as requested
            damage: playerDamage * 0.2, // 1/5th of player damage
            damageInterval: 1000, // 1 second between damage applications
            lifespan: 60000, //
            options: {
                effectComponent: 'slowEffect' // Apply slow effect like Azure Frost
            }
        };
    },
    // Updated cooldown to be a base number, with stat and formula
    cooldown: 4000, // Base cooldown is 4 seconds
    cooldownStat: 'fireRate',
    cooldownFormula: 'sqrt',
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
            damage: playerDamage * 0.5,
            lifespan: Math.ceil(4000 * Math.sqrt(playerLuck / BASE_STATS.LUK)), // This lifespan is still dynamically calculated
            options: {
                effectComponent: 'poisonEffect', // Apply poison effect component
                visualEffect: 'createPulsing' // Add pulsing visual effect
            }
        };
    },
    // This perk has a fixed cooldown, so no stat/formula needed for the cooldown itself.
    // Lifespan is scaled by luck, but the droplet creation cooldown is fixed.
    cooldown: 200, // Fixed 200ms cooldown (very fast)
    cooldownStat: null, // No stat scaling for the cooldown
    cooldownFormula: null, // No formula for the cooldown
    positionMode: 'trail', // Follow player's movement
    trailInterval: 32, // Minimum 32px distance between drops
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
            damage: playerDamage,
            damageInterval: 400,
            colliderSize: 1.0, // Full size collision
            lifespan: null, // Permanent
            health: 999999999, // Effectively indestructible
        };
    },
    cooldown: null, // No periodic spawning
    cooldownStat: null,
    cooldownFormula: null,
    positionMode: 'player', // Spawn near player
    activationMethod: 'immediate' // Create once immediately
});

// Add this to entrapments.js - activation function
window.activateGoldenAge = function () {
    // Get the current active scene
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Apply the dropper perk (will create one ball immediately)
    DropperPerkRegistry.applyDropperPerk(scene, 'GOLDEN_AGE');
};

// Export the registry for use in other files
window.DropperPerkRegistry = DropperPerkRegistry;
