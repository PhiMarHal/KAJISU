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

// Register the Wild Fairy perk
OrbitalPerkRegistry.registerPerkOrbital('WILD_FAIRY', {
    getConfig: function () {
        return {
            symbol: '妖', // Kanji for "fairy/spirit"
            color: '#FF66CC', // Bright pink color
            fontSize: 20, // Smaller size as requested
            radius: 240, // Medium orbit radius
            speed: 0.006, //
            direction: 'counterclockwise',
            pattern: 'oscillating', // Erratic wobbling pattern
            collisionType: 'persistent', // Stays after hitting enemies
            damage: playerDamage * 0.5, // Half player damage as requested
            damageInterval: 200, // 200ms between damage ticks as requested
            lifespan: null, // Permanent
            options: {
                wobbleFrequency: 6,  // Higher frequency for more erratic movement
                wobbleAmplitude: 180  // Larger amplitude for more dramatic wobbles
            }
        };
    },
    count: 1,
    activationMethod: 'immediate' // Create instantly when perk is acquired
});

// Function to activate the Wild Fairy perk
window.activateWildFairy = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Apply the perk orbital
    OrbitalPerkRegistry.applyPerkOrbital(scene, 'WILD_FAIRY');
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
        // Calculate cooldown based on Agi
        return 4000 / playerFireRate;
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

// Track the current angle of immortal body parts
let immortalBodyAngle = Math.random() * Math.PI * 2; // Initial random angle

// Register the Immortal Arm perk (updated)
OrbitalPerkRegistry.registerPerkOrbital('IMMORTAL_ARM', {
    getConfig: function () {
        return {
            symbol: '腕', // Kanji for "arm"
            color: '#9932CC', // Deep purple color
            fontSize: 32, // Fixed size
            radius: 100, // Standard orbit radius
            angle: immortalBodyAngle, // Use the tracked angle
            speed: 0.01,
            pattern: 'standard',
            collisionType: 'persistent', // Stays after hitting enemies
            damage: playerDamage,
            damageInterval: 500, // Half second cooldown between damage applications
            lifespan: null, // Permanent
            options: {}
        };
    },
    count: 1,
    activationMethod: 'immediate' // Create instantly when perk is acquired
});

// Register the Immortal Head perk (updated)
OrbitalPerkRegistry.registerPerkOrbital('IMMORTAL_HEAD', {
    getConfig: function () {
        return {
            symbol: '頭', // Kanji for "head"
            color: '#9932CC', // Deep purple color
            fontSize: 32, // Fixed size
            radius: 50, // Close orbit radius
            angle: immortalBodyAngle, // Use the tracked angle
            speed: 0.01,
            pattern: 'standard',
            collisionType: 'persistent', // Stays after hitting enemies
            damage: playerDamage,
            damageInterval: 500, // Half second cooldown between damage applications
            lifespan: null, // Permanent
            options: {}
        };
    },
    count: 1,
    activationMethod: 'immediate' // Create instantly when perk is acquired
});

// Register the Immortal Leg perk (updated)
OrbitalPerkRegistry.registerPerkOrbital('IMMORTAL_LEG', {
    getConfig: function () {
        return {
            symbol: '脚', // Kanji for "leg"
            color: '#9932CC', // Deep purple color
            fontSize: 32, // Fixed size
            radius: 150, // Far orbit radius
            angle: immortalBodyAngle, // Use the tracked angle
            speed: 0.01,
            pattern: 'standard',
            collisionType: 'persistent', // Stays after hitting enemies
            damage: playerDamage,
            damageInterval: 500, // Half second cooldown between damage applications
            lifespan: null, // Permanent
            options: {}
        };
    },
    count: 1,
    activationMethod: 'immediate' // Create instantly when perk is acquired
});

// Function to track the current immortal body parts
function updateImmortalBodyAngle() {
    // Get all active orbital entities
    const activeOrbitals = OrbitalSystem.getAll();

    // Find any immortal body part
    const immortalPart = activeOrbitals.find(orbital =>
        orbital.entity.text === '腕' ||
        orbital.entity.text === '頭' ||
        orbital.entity.text === '脚'
    );

    // If found, update the tracked angle
    if (immortalPart) {
        immortalBodyAngle = immortalPart.angle;
    }
}

// Modify the activation functions to update the angle first
window.activateImmortalArm = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;
    updateImmortalBodyAngle();
    OrbitalPerkRegistry.applyPerkOrbital(scene, 'IMMORTAL_ARM');
};

window.activateImmortalHead = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;
    updateImmortalBodyAngle();
    OrbitalPerkRegistry.applyPerkOrbital(scene, 'IMMORTAL_HEAD');
};

window.activateImmortalLeg = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;
    updateImmortalBodyAngle();
    OrbitalPerkRegistry.applyPerkOrbital(scene, 'IMMORTAL_LEG');
};

// Export the registry for use in other files
window.OrbitalPerkRegistry = OrbitalPerkRegistry;