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

        // Create timer to spawn beams - use the EXACT same pattern as droppers/orbitals
        const timer = scene.time.addEvent({
            delay: cooldown,
            callback: function () {
                // Get fresh configuration each time
                const beamConfig = perkConfig.getConfig();
                BeamSystem.create(scene, beamConfig);
            },
            callbackScope: scene,
            loop: true
        });

        // Register timer for cleanup - EXACT same as other perk systems
        window.registerEffect('timer', timer);
    }
};

// Register the LASER_CANNON perk
BeamPerkRegistry.registerPerkBeam('LASER_CANNON', {
    getConfig: function () {
        return {
            symbol: '光線',           // "Light beam" in kanji
            color: '#FF00FF',
            fontSize: 32,             // Medium size for visibility
            damage: playerDamage, // 
            damageInterval: 100,       // Very fast damage ticks (10 per second)
            duration: 2000,           // 2 second beam duration
            beamWidth: 32,            // 32px beam width as requested
            followPlayer: true,      // Beam stays where it was fired
            chargeTime: 4000,         // 4 second charge time
            onChargeStart: function (scene) {
                VisualEffects.createChargingEffect(scene, {
                    color: '#FF00FF',     // Bright red to match beam
                    duration: 4000       // Match charge time
                });
            },
            onBeamStart: function (scene, beam) {
            },
            onBeamEnd: function (scene, beam) {
            }
        };
    },
    cooldown: function () {
        // 60 second base cooldown that scales with luck
        return 60000;
    },
    activationMethod: 'timer'
});

// Function to activate the LASER_CANNON perk
window.activateLaserBlast = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Fire the first beam immediately
    const beamConfig = BeamPerkRegistry.perkBeamConfigs['LASER_CANNON'].getConfig();
    BeamSystem.create(scene, beamConfig);

    // Set up the timer system for future beams
    BeamPerkRegistry.applyPerkBeam(scene, 'LASER_CANNON');
};

// Register the EYE_BEAM perk
BeamPerkRegistry.registerPerkBeam('EYE_BEAM', {
    getConfig: function () {
        return {
            symbol: '眼光',           // "Eye light" in kanji
            color: '#FF0000',         // Bright red color
            fontSize: 16,             // Thin beam - smaller font size
            damage: playerDamage * 6, // 6x player damage
            damageInterval: 201,     // Single damage tick (slightly over 1s to avoid double-tick)
            duration: 200,           // 1 second beam duration
            beamWidth: 16,            // 16px beam width (thin)
            followPlayer: false,      // Static beam - stays where fired
            chargeTime: 2000,         // 2 second charge time (faster than laser cannon)
            onChargeStart: function (scene) {
                // Red charging effect to distinguish from laser cannon
                VisualEffects.createChargingEffect(scene, {
                    color: '#FF0000',     // Bright red to match beam
                    duration: 2000       // Match charge time
                });
            },
            onBeamStart: function (scene, beam) {
            },
            onBeamEnd: function (scene, beam) {
            }
        };
    },
    cooldown: function () {
        // 12 second base cooldown
        return 12000;
    },
    activationMethod: 'timer'
});

// Function to activate the EYE_BEAM perk
window.activateEyeBeam = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Fire the first beam immediately
    const beamConfig = BeamPerkRegistry.perkBeamConfigs['EYE_BEAM'].getConfig();
    BeamSystem.create(scene, beamConfig);

    // Set up the timer system for future beams
    BeamPerkRegistry.applyPerkBeam(scene, 'EYE_BEAM');
};

// Register the CAUSTIC_RAY perk
BeamPerkRegistry.registerPerkBeam('CAUSTIC_RAY', {
    getConfig: function () {
        return {
            symbol: '線線',             // Line/beam kanji
            color: '#2aad27',         // Green color to match poison theme
            fontSize: 24,             // Medium beam thickness
            damage: playerDamage * 0.2, // 60% damage per laser tick in total due to poison
            damageInterval: 200,      // Damage every 200ms
            duration: 4000,           // 4 second beam duration
            beamWidth: 24,            // 32px beam width
            followPlayer: true,
            chargeTime: 2000,         // 2 second charge time
            physicsComponents: ['poisonEffect'], // Apply poison effect to hit enemies
            onChargeStart: function (scene) {
                // Green charging effect to match caustic theme
                VisualEffects.createChargingEffect(scene, {
                    color: '#2aad27',     // Green to match beam color
                    duration: 2000        // Match charge time
                });
            },
            onBeamStart: function (scene, beam) {
                // Optional: Add beam start effect here
            },
            onBeamEnd: function (scene, beam) {
                // Optional: Add beam end effect here
            }
        };
    },
    cooldown: function () {
        return 36000;
    },
    activationMethod: 'timer'
});

// Function to activate the CAUSTIC_RAY perk
window.activateCausticRay = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Fire the first beam immediately
    const beamConfig = BeamPerkRegistry.perkBeamConfigs['CAUSTIC_RAY'].getConfig();
    BeamSystem.create(scene, beamConfig);

    // Set up the timer system for future beams
    BeamPerkRegistry.applyPerkBeam(scene, 'CAUSTIC_RAY');
};

// Export the registry for use in other files
window.BeamPerkRegistry = BeamPerkRegistry;