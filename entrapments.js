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
        return {
            symbol: '✧',
            color: '#ffbf00', // Amber color
            fontSize: projectileSizeFactor * playerDamage * 2,
            behaviorType: 'explosive',
            damage: playerDamage * 2,
            lifespan: null,
            options: {}
        };
    },
    cooldown: function () {
        // Calculate cooldown based on Agility
        return 16000 / playerFireRate;
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

// Export the registry for use in other files
window.DropperPerkRegistry = DropperPerkRegistry;