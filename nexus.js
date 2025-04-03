// Orbital Component Registry for Word Survivors
// Maps perks to orbital effects and configurations

// Registry system for orbital perks
const OrbitalPerkRegistry = {
    // Map perks to their orbital configurations
    perkOrbitalConfigs: {},

    // Register a perk that creates orbitals
    registerPerkOrbital: function (perkId, config) {
        this.perkOrbitalConfigs[perkId] = {
            getConfig: config.getConfig ?? function () { return {}; }, // Function that returns orbital config
            count: config.count ?? 1,                                // Number of orbitals to create
            cooldown: config.cooldown ?? null,                       // Cooldown between creating orbitals (null for one-time)
            activationMethod: config.activationMethod ?? 'immediate' // How the orbital is activated (immediate, onHit, etc.)
        };
    },

    // Apply a perk's orbital effect
    applyPerkOrbital: function (scene, perkId) {
        // Check if we have a configuration for this perk
        const perkConfig = this.perkOrbitalConfigs[perkId];
        if (!perkConfig) return false;

        console.log(`Applying orbital perk: ${perkId}`);

        // Handle different activation methods
        switch (perkConfig.activationMethod) {
            case 'immediate':
                this.createOrbitalImmediately(scene, perkConfig);
                break;

            case 'timer':
                this.setupOrbitalTimer(scene, perkConfig);
                break;

            default:
                console.log(`Unknown activation method: ${perkConfig.activationMethod}`);
                return false;
        }

        return true;
    },

    // Create an orbital immediately
    createOrbitalImmediately: function (scene, perkConfig) {
        // Get the configuration for this orbital
        const orbitalConfig = perkConfig.getConfig();

        // Create the orbital(s)
        if (perkConfig.count > 1) {
            OrbitalSystem.createMultiple(scene, perkConfig.count, orbitalConfig);
        } else {
            OrbitalSystem.create(scene, orbitalConfig);
        }
    },

    // Setup a timer to periodically create orbitals
    setupOrbitalTimer: function (scene, perkConfig) {
        if (!perkConfig.cooldown) return;

        // Calculate cooldown based on player stats if needed
        let cooldown = perkConfig.cooldown;
        if (typeof cooldown === 'function') {
            cooldown = cooldown();
        }

        // Create timer to spawn orbitals
        const timer = scene.time.addEvent({
            delay: cooldown,
            callback: function () {
                // Get fresh configuration each time (in case player stats changed)
                const orbitalConfig = perkConfig.getConfig();

                // Create the orbital(s)
                if (perkConfig.count > 1) {
                    OrbitalSystem.createMultiple(scene, perkConfig.count, orbitalConfig);
                } else {
                    OrbitalSystem.create(scene, orbitalConfig);
                }
            },
            callbackScope: scene,
            loop: true
        });

        // Register timer for cleanup
        window.registerEffect('timer', timer);
    }
};

// Register the Teal Octopus perk (orbiting projectiles)
OrbitalPerkRegistry.registerPerkOrbital('TEAL_OCTOPUS', {
    getConfig: function () {
        return {
            symbol: '★',
            color: '#00FFFF', // Teal color
            fontSize: projectileSizeFactor * playerDamage,
            radius: 16 * playerLuck, // Scale radius with luck
            speed: 0.02,
            pattern: 'standard',
            collisionType: 'projectile', // Destroyed on hit
            damage: playerDamage,
            damageInterval: 0, // Not used for projectiles
            lifespan: null, // Permanent until hit
            options: {}
        };
    },
    count: 1,
    cooldown: function () {
        // Calculate cooldown based on Luck
        return 4000 / playerLuck;
    },
    activationMethod: 'timer'
});

// Function to activate the Teal Octopus perk
// This replaces the activateOrbitingProjectile function in index.html
window.activateOrbitingProjectile = function () {
    // Get the current active scene
    const scene = game.scene.scenes[0];
    if (scene) {
        // Create initial orbital immediately
        const orbitalConfig = OrbitalPerkRegistry.perkOrbitalConfigs['TEAL_OCTOPUS'].getConfig();
        OrbitalSystem.create(scene, orbitalConfig);

        // Set up timer for subsequent orbitals
        OrbitalPerkRegistry.applyPerkOrbital(scene, 'TEAL_OCTOPUS');
    }
};

// Export the registry for use in other files
window.OrbitalPerkRegistry = OrbitalPerkRegistry;