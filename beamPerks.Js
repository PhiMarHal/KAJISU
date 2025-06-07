// Beam Perk Registry for Word Survivors
// Maps perks to their beam configurations and activation functions

// Registry system for beam perks
const BeamPerkRegistry = {
    // Map perks to their beam configurations
    perkBeamConfigs: {},

    // Register a perk that creates beams
    registerPerkBeam: function (perkId, config) {
        this.perkBeamConfigs[perkId] = {
            getConfig: config.getConfig ?? function () { return {}; }, // Function that returns beam config
            cooldown: config.cooldown ?? 60000,                      // Cooldown between beam uses
            activationMethod: config.activationMethod ?? 'timer'     // How the beam is activated
        };
    },

    // Apply a perk's beam effect
    applyPerkBeam: function (scene, perkId) {
        const perkConfig = this.perkBeamConfigs[perkId];
        if (!perkConfig) return false;

        console.log(`Applying beam perk: ${perkId}`);

        // Handle different activation methods
        switch (perkConfig.activationMethod) {
            case 'immediate':
                this.createBeamImmediately(scene, perkConfig);
                break;

            case 'timer':
                this.setupBeamTimer(scene, perkConfig);
                break;

            default:
                console.log(`Unknown activation method: ${perkConfig.activationMethod}`);
                return false;
        }

        return true;
    },

    // Create a beam immediately
    createBeamImmediately: function (scene, perkConfig) {
        const beamConfig = perkConfig.getConfig();
        BeamSystem.create(scene, beamConfig);
    },

    // Setup a timer to periodically create beams
    setupBeamTimer: function (scene, perkConfig) {
        if (!perkConfig.cooldown) return;

        // Calculate cooldown based on player stats if needed
        let cooldown = perkConfig.cooldown;
        if (typeof cooldown === 'function') {
            cooldown = cooldown();
        }

        // Create timer to spawn beams
        const timer = CooldownManager.createTimer({
            statName: 'luck',
            baseCooldown: cooldown,
            formula: 'sqrt', // Cooldown decreases with luck (square root scaling)
            callback: function () {
                // Get fresh configuration each time
                const beamConfig = perkConfig.getConfig();
                BeamSystem.create(scene, beamConfig);
            },
            callbackScope: scene,
            loop: true
        });

        // Register timer for cleanup
        window.registerEffect('timer', timer);
    }
};

// Register the LASER_CANNON_TWO perk
BeamPerkRegistry.registerPerkBeam('LASER_CANNON_TWO', {
    getConfig: function () {
        return {
            symbol: '光線',           // "Light beam" in kanji
            color: '#00FFFF',         // Bright cyan color
            fontSize: 32,             // Medium size for visibility
            damage: playerDamage, // Double player damage
            damageInterval: 100,       // Very fast damage ticks (10 per second)
            duration: 2000,           // 2 second beam duration
            beamWidth: 32,            // 32px beam width as requested
            followPlayer: true,      // Beam stays where it was fired
            chargeTime: 4000,         // 4 second charge time
            onChargeStart: function (scene) {
                // Simple charge effect without screen shake
                console.log("Laser cannon charging...");
            },
            onBeamStart: function (scene, beam) {
                // Simple beam start effect without screen shake
                console.log("LASER CANNON FIRED!");
            },
            onBeamEnd: function (scene, beam) {
                // Simple beam end effect
                console.log("Laser cannon beam ended.");
            }
        };
    },
    cooldown: function () {
        // 60 second base cooldown that scales with luck
        return 60000;
    },
    activationMethod: 'timer'
});

// Function to activate the LASER_CANNON_TWO perk
window.activateLaserCannonTwo = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Fire the first beam immediately
    const beamConfig = BeamPerkRegistry.perkBeamConfigs['LASER_CANNON_TWO'].getConfig();
    BeamSystem.create(scene, beamConfig);

    // Set up the timer system for future beams
    BeamPerkRegistry.applyPerkBeam(scene, 'LASER_CANNON_TWO');
};

// Register a simpler test beam for debugging/comparison
BeamPerkRegistry.registerPerkBeam('SIMPLE_BEAM', {
    getConfig: function () {
        return {
            symbol: '一',             // Simple horizontal line kanji
            color: '#FFFF00',         // Yellow color
            fontSize: 32,             // Large size
            damage: playerDamage,     // Normal damage
            damageInterval: 200,      // 5 ticks per second
            duration: 1500,           // 1.5 second duration
            beamWidth: 32,            // Narrow beam
            followPlayer: true,       // Follows player movement
            chargeTime: 1000          // Quick 1 second charge
        };
    },
    cooldown: 10000, // 10 second cooldown for testing
    activationMethod: 'timer'
});

// Function to activate the simple test beam
window.activateSimpleBeam = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;

    BeamPerkRegistry.applyPerkBeam(scene, 'SIMPLE_BEAM');
};

// Export the registry for use in other files
window.BeamPerkRegistry = BeamPerkRegistry;