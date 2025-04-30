// Maps perks to dropper effects like landmines and traps

// Registry system for dropper perks
const DropperPerkRegistry = {
    // Map perks to their dropper configurations
    perkDropperConfigs: {},

    // Register a perk that creates drops
    registerDropperPerk: function (perkId, config) {
        this.perkDropperConfigs[perkId] = {
            getConfig: config.getConfig ?? function () { return {}; }, // Function that returns drop config
            cooldown: config.cooldown ?? 4000,                        // Cooldown between drops
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
                // Set up periodic drops
                return DropperSystem.setupPeriodicDrops(scene, {
                    getConfig: perkConfig.getConfig,
                    cooldown: perkConfig.cooldown,
                    positionMode: perkConfig.positionMode
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
            lifespan: null,
            options: {}
        };
    },
    cooldown: function () {
        // Calculate cooldown based on Agility
        return 4000 / (Math.sqrt(playerFireRate / BASE_STATS.AGI));
    },
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
    cooldown: 2000, // Drop a new afterimage every 2 seconds
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
            lifespan: null, // Indefinite lifespan until touched by enemy
            options: {
                hasPeriodicEffect: true, // Generic flag for drops with periodic effects
                periodicEffectCooldown: 15000, // Base cooldown for the effect
                fireImmediately: true, // Flag to indicate it should fire immediately on spawn
                needsPulsing: true // Flag for visual pulsing effect
            }
        };
    },
    cooldown: function () {
        // Base 32 second cooldown, scaled by luck
        return 32000 / (Math.sqrt(playerLuck / BASE_STATS.LUK));
    },
    positionMode: 'random', // Random position on screen
    activationMethod: 'periodic' // Periodically spawn flowers
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
    flowerConfig.x = Phaser.Math.Between(0, 1200);
    flowerConfig.y = Phaser.Math.Between(0, 800);

    // Create the first flower immediately
    DropperSystem.create(scene, flowerConfig);

    // Apply the dropper perk for future flowers
    const controller = DropperPerkRegistry.applyDropperPerk(scene, 'BLOOMING_FLOWER');

    return controller;
};

// Register a simple Area Effect Perk for testing
// Updated area effect perk with custom color
DropperPerkRegistry.registerDropperPerk('AREA_PULSE', {
    getConfig: function () {
        return {
            symbol: '◯', // Simple circle symbol
            color: '#ff00ff', // Magenta color for the symbol
            fontSize: 24,
            behaviorType: 'areaEffect', // Use the area effect behavior
            damage: playerDamage * 5, // 5x player damage per pulse
            damageInterval: 0, // Not used for area effects
            lifespan: null, // 
            options: {
                areaEffectInterval: 6000, // Pulse every 2 seconds
                areaEffectRadius: 400, // 400px radius
                pulseColor: 0xff00ff // Magenta color for the pulse effect
            }
        };
    },
    cooldown: 3500, // 15 seconds between drops
    positionMode: 'player', // Drop at player position
    activationMethod: 'periodic' // Periodically create pulses
});

// Function to activate the Area Pulse perk
window.activateAreaPulse = function () {
    // Get the current active scene
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Apply the dropper perk
    DropperPerkRegistry.applyDropperPerk(scene, 'AREA_PULSE');
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
            lifespan: null, // Permanent until touched by enemy
            options: {
                areaEffectInterval: 8000, //
                areaEffectRadius: 160, // Base radius
                pulseColor: 0x2aad27, // Green color for the pulse effect
                needsPulsing: true, // Add pulsing animation
                effectComponent: 'poisonEffect' // Use the poisonEffect component
            }
        };
    },
    cooldown: function () {
        // Base 15 second cooldown, scaled by luck
        return 15000 / (Math.sqrt(playerLuck / BASE_STATS.LUK));
    },
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
    flowerConfig.x = Phaser.Math.Between(0, 1200);
    flowerConfig.y = Phaser.Math.Between(0, 800);

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
            lifespan: null, // Permanent until touched by enemy
            options: {
                areaEffectInterval: 12000, //
                areaEffectRadius: 240, //
                pulseColor: 0x00ffff, // Cyan color for the pulse effect
                needsPulsing: true, // Add pulsing animation
                effectComponent: 'slowEffect' // Use the slowEffect component
            }
        };
    },
    cooldown: function () {
        // Base 12 second cooldown, scaled by luck
        return 20000 / (Math.sqrt(playerLuck / BASE_STATS.LUK));
    },
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
    flowerConfig.x = Phaser.Math.Between(0, 1200);
    flowerConfig.y = Phaser.Math.Between(0, 800);

    // Create the first flower immediately
    DropperSystem.create(scene, flowerConfig);

    // Apply the dropper perk for future flowers
    return DropperPerkRegistry.applyDropperPerk(scene, 'COLD_FLOWER');
};

// Export the registry for use in other files
window.DropperPerkRegistry = DropperPerkRegistry;