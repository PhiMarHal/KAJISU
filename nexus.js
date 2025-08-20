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
            cooldown: config.cooldown ?? null,                       // Base Cooldown (now a number)
            cooldownStat: config.cooldownStat ?? null,               // Stat that affects cooldown (e.g., 'luck', 'fireRate')
            cooldownFormula: config.cooldownFormula ?? null,         // Formula for stat scaling ('sqrt', 'divide', 'multiply')
            activationMethod: config.activationMethod ?? 'immediate', // How the orbital is activated (immediate, onHit, etc.)
            customCallback: config.customCallback ?? null            // Custom callback function for complex perks
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

        // Use properties directly from perkConfig
        const baseCooldownValue = perkConfig.cooldown;
        const statNameForCooldown = perkConfig.cooldownStat;
        const formulaForCooldown = perkConfig.cooldownFormula;

        // Determine callback function to use
        let timerCallback;

        if (perkConfig.customCallback) {
            // Use custom callback for complex perks like TENTACLE_GRASP
            timerCallback = function () {
                perkConfig.customCallback(scene);
            };
        } else {
            // Use standard orbital creation for simple perks
            timerCallback = function () {
                // Get fresh configuration each time (in case player stats changed)
                const orbitalConfig = perkConfig.getConfig();

                // Create the orbital(s)
                if (perkConfig.count > 1) {
                    OrbitalSystem.createMultiple(scene, perkConfig.count, orbitalConfig);
                } else {
                    OrbitalSystem.create(scene, orbitalConfig);
                }
            };
        }

        // Create timer to spawn orbitals using CooldownManager
        const timer = CooldownManager.createTimer({
            baseCooldown: baseCooldownValue,
            statName: statNameForCooldown,
            formula: formulaForCooldown,
            component: perkConfig, // Pass perkConfig as component for potential future reference/cleanup
            callback: timerCallback,
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
            damageInterval: 500,
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
            fontSize: getEffectiveSize(projectileSizeFactor, playerDamage),
            radius: 64 * (Math.sqrt(playerLuck / BASE_STATS.LUK)),
            speed: 0.02,
            pattern: 'standard',
            collisionType: 'projectile', // Destroyed on hit
            damage: playerDamage,
            damageInterval: 0, // Not used for projectiles
            lifespan: 16000, // Delete after 20 seconds, to avoid infinite stacking
            options: {}
        };
    },
    count: 1,
    // Updated cooldown to be a base number, with stat and formula
    cooldown: 1200, // Base cooldown for Teal Octopus
    cooldownStat: 'fireRate',
    cooldownFormula: 'sqrt',
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

OrbitalPerkRegistry.registerPerkOrbital('INVERTED_OCTOPUS', {
    getConfig: function () {
        return {
            symbol: '★',
            fontSize: getEffectiveSize(projectileSizeFactor, playerDamage),
            radius: 64 * (Math.sqrt(playerLuck / BASE_STATS.LUK)),
            speed: 0.02,
            direction: 'counterclockwise', // Key difference: counter-clockwise rotation
            pattern: 'standard',
            collisionType: 'projectile', // Destroyed on hit
            damage: playerDamage,
            damageInterval: 0, // Not used for projectiles
            lifespan: 16000, //
            options: {}
        };
    },
    count: 1,
    // Updated cooldown to be a base number, with stat and formula
    cooldown: 1200, // Base cooldown for Inverted Octopus
    cooldownStat: 'fireRate',
    cooldownFormula: 'sqrt',
    activationMethod: 'timer'
});

// Create activation function in nexus.js
window.activateInvertedOctopus = function () {
    // Get the current active scene
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Create initial orbital immediately
    const orbitalConfig = OrbitalPerkRegistry.perkOrbitalConfigs['INVERTED_OCTOPUS'].getConfig();
    OrbitalSystem.create(scene, orbitalConfig);

    // Set up timer for subsequent orbitals
    OrbitalPerkRegistry.applyPerkOrbital(scene, 'INVERTED_OCTOPUS');
};

// First, register the perk with the registry
OrbitalPerkRegistry.registerPerkOrbital('TENTACLE_GRASP', {
    getConfig: function () {
        return {
            symbol: '✧', // Star symbol for tentacle segment
            color: '#8800AA', // Purple color
            fontSize: 24,
            radius: 80, // Medium orbit radius
            angle: Math.random() * Math.PI * 2, // Random starting angle
            speed: 0.01, // Moderate speed
            pattern: 'oscillating', // Use oscillating pattern for organic movement
            collisionType: 'projectile', // Destroyed on hit with enemies
            damage: playerDamage,
            damageInterval: 0, // Not used for projectiles
            lifespan: 60000, // avoid too much stacking. cd / 2 should be min at luck=1
            options: {
                wobbleFrequency: 6,  // Higher frequency for more erratic movement
                wobbleAmplitude: 180  // Larger amplitude for more dramatic wobbles
            }
        };
    },
    count: 1, // This is ignored when customCallback is used
    cooldown: 30000, // Base cooldown for Tentacle Grasp
    cooldownStat: 'luck',
    cooldownFormula: 'sqrt',
    activationMethod: 'timer',
    // Add custom callback that creates the full tentacle pattern
    customCallback: function (scene) {
        launchTentacles(scene);
    }
});

// Then modify the activateTentacleGrasp function to use the registry
window.activateTentacleGrasp = function () {
    // Get the current active scene
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Launch tentacles immediately (this part is for initial spawn, not periodic)
    launchTentacles(scene);

    // Apply the orbital perk using the registry (this ensures proper cleanup and periodic spawning)
    OrbitalPerkRegistry.applyPerkOrbital(scene, 'TENTACLE_GRASP');
};

// Helper function to launch tentacles with oscillating pattern
function launchTentacles(scene) {
    const tentacleCount = 4;

    // Define our radii
    const radii = [30, 50, 70, 90];

    // Create tentacles in evenly distributed angles
    for (let i = 0; i < tentacleCount; i++) {
        // Calculate the base angle for this tentacle
        const baseAngle = (i / tentacleCount) * Math.PI * 2;

        // Create each segment with slightly varied angles based on the same base
        radii.forEach((radius, index) => {
            // Add a small random variation to the angle for organic feel
            // More variation for outer segments
            const angleVariation = (Math.random() * 0.2 - 0.1) * (index * 0.5 + 1);
            const segmentAngle = baseAngle + angleVariation;

            // Customize wobble parameters for each segment
            // Outer segments wobble more for a more organic feel
            const wobbleFrequency = 2; // Increases with distance
            const wobbleAmplitude = radius * 0.1 * (index + 1); // Proportional to radius

            const orbitalConfig = {
                symbol: '✧', // Star symbol for tentacle segment
                color: '#8800AA', // Purple color
                fontSize: 24,
                radius: radius, // Use the current radius
                angle: segmentAngle, // Use the varied angle
                speed: 0.01, // Slower speed for better tentacle effect
                direction: 'clockwise',
                pattern: 'oscillating', // Use oscillating pattern for organic movement
                collisionType: 'projectile', // Destroyed on hit with enemies
                damage: playerDamage, //
                damageInterval: 0, // Not used for projectiles
                lifespan: 60000, // avoid too much stacking. cd / 2 should be min at luck=1
                options: {
                    wobbleFrequency: wobbleFrequency, // How quickly it oscillates
                    wobbleAmplitude: wobbleAmplitude // How far it oscillates
                }
            };

            // Create the orbital segment
            OrbitalSystem.create(scene, orbitalConfig);
        });
    }

    // Visual effect when launching tentacles
    scene.tweens.add({
        targets: player,
        scale: 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Cubic.easeOut'
    });
}

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
            damageInterval: 500,
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
            damageInterval: 500,
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

// Register the Sniper Fairy perk
OrbitalPerkRegistry.registerPerkOrbital('SNIPER_FAIRY', {
    getConfig: function () {
        return {
            symbol: '狙', // Kanji for "aim/target"
            color: '#FF55AA', // Pinkish color
            fontSize: 20, // Medium size
            radius: 80, // Medium orbit radius
            speed: 0.01, // Moderate speed
            pattern: 'standard', // Standard circular orbit
            collisionType: 'persistent', // Stays after hitting enemies
            damage: playerDamage * 0.1, // Very low contact damage
            damageInterval: 500, // Half second between damage ticks
            lifespan: null, // Permanent
            options: {
                isFamiliar: true,
                familiarType: 'sniper',
                rangeModifier: 2 // 100% extra range
            }
        };
    },
    count: 1,
    activationMethod: 'immediate' // Create instantly when perk is acquired
});

// Function to activate the Sniper Fairy perk (updated to use generic function)
window.activateSniperFairy = function () {
    // Get the current active scene
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Apply the perk orbital
    const orbitalConfig = OrbitalPerkRegistry.perkOrbitalConfigs['SNIPER_FAIRY'].getConfig();
    const orbital = OrbitalSystem.create(scene, orbitalConfig);

    // Create firing timer for the orbital using the generic function
    if (orbital && orbital.options && orbital.options.isFamiliar) {
        // Cooldown for FamiliarSystem.setupFamiliarFiringTimer is not defined in nexus.js for Sniper Fairy,
        // Assuming a base cooldown here, it should be defined in FamiliarSystem or in the perk config if dynamic.
        // For now, using a placeholder of 4000ms as per your original hero.js for general timers.
        orbital.firingTimer = FamiliarSystem.setupFamiliarFiringTimer(
            scene,
            orbital,
            orbital.options.familiarType,
            4000 // Placeholder: Replace with actual base cooldown if specified
        );
    }
};

// Register the Copy Fairy perk
OrbitalPerkRegistry.registerPerkOrbital('COPY_FAIRY', {
    getConfig: function () {
        return {
            symbol: '写', // Kanji for "copy"
            color: '#55FFAA', // Greenish color
            fontSize: 20, // Small size
            radius: 40, // Close orbit radius
            speed: 0.01, // Standard speed
            pattern: 'standard', // Standard circular orbit
            collisionType: 'persistent', // Stays after hitting enemies
            damage: playerDamage * 0.1, // Very low contact damage
            damageInterval: 500, // Half second between damage ticks
            lifespan: null, // Permanent
            options: {
                isFamiliar: true,
                familiarType: 'copy'
            }
        };
    },
    count: 1,
    activationMethod: 'immediate' // Create instantly when perk is acquired
});

// Register the Berserk Fairy perk
OrbitalPerkRegistry.registerPerkOrbital('BERSERK_FAIRY', {
    getConfig: function () {
        return {
            symbol: '狂', // Kanji for "mad/crazy"
            color: '#FF5500', // Orange-red color
            fontSize: 20, // Small size
            radius: 200, // Far orbit radius
            speed: 0.02, // Faster speed
            pattern: 'standard', // Standard circular orbit
            collisionType: 'persistent', // Stays after hitting enemies
            damage: playerDamage * 0.1, // Very low contact damage
            damageInterval: 500, // Half second between damage ticks
            lifespan: null, // Permanent
            options: {
                isFamiliar: true,
                familiarType: 'berserk'
            }
        };
    },
    count: 1,
    activationMethod: 'immediate' // Create instantly when perk is acquired
});

// Function to activate the Copy Fairy perk
window.activateCopyFairy = function () {
    // Get the current active scene
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Apply the perk orbital
    const orbitalConfig = OrbitalPerkRegistry.perkOrbitalConfigs['COPY_FAIRY'].getConfig();
    const orbital = OrbitalSystem.create(scene, orbitalConfig);

    // Create firing timer for the orbital using the generic function
    if (orbital && orbital.options && orbital.options.isFamiliar) {
        orbital.firingTimer = FamiliarSystem.setupFamiliarFiringTimer(
            scene,
            orbital,
            orbital.options.familiarType,
            1200 // Base cooldown for Copy Fairy
        );
    }
};

// Function to activate the Berserk Fairy perk
window.activateBerserkFairy = function () {
    // Get the current active scene
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Apply the perk orbital
    const orbitalConfig = OrbitalPerkRegistry.perkOrbitalConfigs['BERSERK_FAIRY'].getConfig();
    const orbital = OrbitalSystem.create(scene, orbitalConfig);

    // Create firing timer for the orbital using the generic function
    if (orbital && orbital.options && orbital.options.isFamiliar) {
        orbital.firingTimer = FamiliarSystem.setupFamiliarFiringTimer(
            scene,
            orbital,
            orbital.options.familiarType,
            600 // Base cooldown for Berserk Fairy
        );
    }
};

// Register the Cold Fairy perk
OrbitalPerkRegistry.registerPerkOrbital('COLD_FAIRY', {
    getConfig: function () {
        return {
            symbol: '冷', // Kanji for "cold"
            color: '#00FFFF', // Cyan color
            fontSize: 20, // Small size like other fairies
            radius: 60, // Medium-close orbit radius
            speed: 0.01, // Standard speed
            direction: 'counterclockwise', // Counter-clockwise as requested
            pattern: 'standard', // Standard circular orbit
            collisionType: 'persistent', // Stays after hitting enemies
            damage: playerDamage * 0.1, // Very low contact damage
            damageInterval: 500, // Half second between damage ticks
            lifespan: null, // Permanent
            options: {
                isFamiliar: true,
                familiarType: 'cold' // Use our new cold behavior
            }
        };
    },
    count: 1,
    activationMethod: 'immediate' // Create instantly when perk is acquired
});

// Function to activate the Cold Fairy perk
window.activateColdFairy = function () {
    // Get the current active scene
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Apply the perk orbital
    const orbitalConfig = OrbitalPerkRegistry.perkOrbitalConfigs['COLD_FAIRY'].getConfig();
    const orbital = OrbitalSystem.create(scene, orbitalConfig);

    // Create firing timer for the orbital using the generic function
    if (orbital && orbital.options && orbital.options.isFamiliar) {
        orbital.firingTimer = FamiliarSystem.setupFamiliarFiringTimer(
            scene,
            orbital,
            orbital.options.familiarType,
            6000 // cold is very powerful, so we won't have her shoot too often
        );
    }
};

// Register the Fun Fairy perk
OrbitalPerkRegistry.registerPerkOrbital('FUN_FAIRY', {
    getConfig: function () {
        return {
            symbol: '遊', // Kanji for "play/fun"
            color: '#FF55FF', // Pink color initially
            fontSize: 22, // Slightly larger than other fairies
            radius: 100, // Medium-far orbit radius as requested
            speed: 0.015, // Faster rotation as requested
            direction: 'clockwise',
            pattern: 'standard', // Standard circular orbit
            collisionType: 'persistent', // Stays after hitting enemies
            damage: playerDamage * 0.1, // Very low contact damage
            damageInterval: 500, // Half second between damage ticks
            lifespan: null, // Permanent
            options: {
                isFamiliar: true,
                familiarType: 'fun' // Use our new fun behavior
            }
        };
    },
    count: 1,
    activationMethod: 'immediate' // Create instantly when perk is acquired
});

// Function to activate the Fun Fairy perk
window.activateFunFairy = function () {
    // Get the current active scene
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Apply the perk orbital
    const orbitalConfig = OrbitalPerkRegistry.perkOrbitalConfigs['FUN_FAIRY'].getConfig();
    const orbital = OrbitalSystem.create(scene, orbitalConfig);

    // Create firing timer for the orbital using the generic function
    if (orbital && orbital.options && orbital.options.isFamiliar) {
        orbital.firingTimer = FamiliarSystem.setupFamiliarFiringTimer(
            scene,
            orbital,
            orbital.options.familiarType,
            4000 // need high cd because the effect is 100%
        );

        // Add color-changing effect to the fairy kanji using the exported function
        orbital.colorTimer = setupFairyColorChanger(scene, orbital);
    }
};

OrbitalPerkRegistry.registerPerkOrbital('DEATH_FINGER', {
    getConfig: function () {
        return {
            symbol: '指', // Kanji for "finger"
            color: '#FF0000', // Red color
            fontSize: 16, // Small size
            radius: 32, // Close to player
            angle: 0, // Starting angle (will be updated by directionFollowing)
            speed: 0.2, // Speed for rotation
            direction: 'clockwise',
            pattern: 'directionFollowing', // Follows player movement direction
            collisionType: 'persistent', // Never dies from collisions
            damage: 0, // No contact damage
            damageInterval: 0, // Not used
            lifespan: null, // Permanent
            options: {
                isFamiliar: true,
                familiarType: 'deathFinger',
                oscillationSpeed: 0.01, // Control oscillation frequency
                oscillationAmount: 2 // Control oscillation amplitude
            }
        };
    },
    count: 1,
    activationMethod: 'immediate' // Create instantly when perk is acquired
});

// Add this function to nexus.js
window.activateDeathFinger = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Apply the perk orbital to create the familiar
    const orbitalConfig = OrbitalPerkRegistry.perkOrbitalConfigs['DEATH_FINGER'].getConfig();
    const orbital = OrbitalSystem.create(scene, orbitalConfig);

    // Set up timer for the death finger to fire
    if (orbital && orbital.options && orbital.options.isFamiliar) {
        orbital.firingTimer = FamiliarSystem.setupFamiliarFiringTimer(
            scene,
            orbital,
            orbital.options.familiarType,
            500
        );
    }
};

OrbitalPerkRegistry.registerPerkOrbital('FINGER_OF_DECAY', {
    getConfig: function () {
        return {
            symbol: '朽', // Kanji for "decay/rot" - single kanji for the orbital
            color: '#88AA22', // Sickly greenish-yellow color
            fontSize: 16, // Small size
            radius: 48, // Slightly larger than Death Finger
            angle: 0, // Starting angle (will be updated by directionFollowing)
            speed: 0.2, // Speed for rotation
            direction: 'clockwise',
            pattern: 'directionFollowing', // Follows player movement direction
            collisionType: 'persistent', // Never dies from collisions
            damage: 0, // No contact damage
            damageInterval: 0, // Not used
            lifespan: null, // Permanent
            options: {
                isFamiliar: true,
                familiarType: 'decayFinger', // Use our new decayFinger behavior
                oscillationSpeed: 0.01, // Control oscillation frequency
                oscillationAmount: 2 // Control oscillation amplitude
            }
        };
    },
    count: 1,
    activationMethod: 'immediate' // Create instantly when perk is acquired
});

// Add this function to nexus.js
window.activateFingerOfDecay = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Apply the perk orbital to create the familiar
    const orbitalConfig = OrbitalPerkRegistry.perkOrbitalConfigs['FINGER_OF_DECAY'].getConfig();
    const orbital = OrbitalSystem.create(scene, orbitalConfig);

    // Set up timer for the finger to fire
    if (orbital && orbital.options && orbital.options.isFamiliar) {
        orbital.firingTimer = FamiliarSystem.setupFamiliarFiringTimer(
            scene,
            orbital,
            orbital.options.familiarType,
            500
        );
    }
};


OrbitalPerkRegistry.registerPerkOrbital('BRIGHT_LANCE', {
    getConfig: function () {
        return {
            symbol: '光槍', // Kanji for "Bright Lance"
            color: '#ffff00',
            fontSize: 32, // Standard size
            radius: 96, //
            angle: Math.random() * Math.PI * 2, // Random starting angle
            speed: 0.1, // Use this value as rotation speed factor for direction following
            direction: 'clockwise', // Not really used due to custom movement
            pattern: 'directionFollowing', // Use our custom pattern
            collisionType: 'persistent', // Stays after hitting enemies
            damage: playerDamage * 1, //
            damageInterval: 500, //
            lifespan: null, // Permanent
            options: {
                oscillationSpeed: 0.004, // Speed of the breathing effect
                oscillationAmount: 32 // Amplitude of oscillation
            }
        };
    },
    count: 1,
    activationMethod: 'immediate' // Create instantly when perk is acquired
});

window.activateBrightLance = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Apply the perk orbital
    OrbitalPerkRegistry.applyPerkOrbital(scene, 'BRIGHT_LANCE');
};

// Updated HEALING_FAIRY registration in nexus.js
OrbitalPerkRegistry.registerPerkOrbital('HEALING_FAIRY', {
    getConfig: function () {
        return {
            symbol: '癒', // Kanji for "healing"
            color: '#00ff00', // Bright green color
            fontSize: 22, // Medium size
            radius: 100, // Medium orbit radius
            speed: 0.01, // Moderate speed
            pattern: 'oscillating', // More dynamic movement pattern
            collisionType: 'persistent', //
            damage: playerDamage * 0.1, // Very low contact damage
            damageInterval: 500, // Half second between damage ticks
            lifespan: null, //
            options: {
                isFamiliar: true,
                familiarType: 'healer',
                wobbleFrequency: 4, // Control oscillation frequency
                wobbleAmplitude: 20 // Control oscillation amplitude
            }
        };
    },
    count: 1,
    activationMethod: 'immediate' // Create instantly when perk is acquired
});

// Simplified activateHealingFairy function in nexus.js
window.activateHealingFairy = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Create initial fairy immediately 
    const orbitalConfig = OrbitalPerkRegistry.perkOrbitalConfigs['HEALING_FAIRY'].getConfig();
    const orbital = OrbitalSystem.create(scene, orbitalConfig);

    // Set up timer for the fairy to fire healing projectiles
    if (orbital && orbital.options && orbital.options.isFamiliar) {
        orbital.firingTimer = FamiliarSystem.setupFamiliarFiringTimer(
            scene,
            orbital,
            orbital.options.familiarType,
            10000 // 10 seconds cooldown base (will scale with luck)
        );
    }
}

// Add this to nexus.js
// Register the Lava Fairies perk
OrbitalPerkRegistry.registerPerkOrbital('LAVA_FAIRIES', {
    getConfig: function () {
        return {
            symbol: '溶', // Kanji for "melt/dissolve"
            color: '#FF6600', // Orange-red color for lava
            fontSize: 24, // Medium size
            radius: 64 * (Math.sqrt(playerLuck / BASE_STATS.LUK)),
            speed: 0.012, // Moderate speed
            pattern: 'standard', // Standard circular pattern as requested
            collisionType: 'projectile', // Dies when hit enemies
            damage: playerDamage * 0.5, // Half player damage
            damageInterval: 500, // Half second between damage ticks
            lifespan: 16000, // 16 seconds lifespan
            options: {
                // Specify components to attach
                components: [
                    {
                        name: 'magmaDropEffect'
                    }
                ]
            }
        };
    },
    // This perk has a fixed cooldown, so no stat/formula needed for the cooldown itself.
    cooldown: 4000, // Fixed 4 second cooldown
    cooldownStat: null, // No stat scaling for the cooldown
    cooldownFormula: null, // No formula for the cooldown
    activationMethod: 'timer' // Create periodically
});

// Function to activate the Lava Fairies perk
window.activateLavaFairies = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Create initial fairy immediately
    const orbitalConfig = OrbitalPerkRegistry.perkOrbitalConfigs['LAVA_FAIRIES'].getConfig();
    const orbital = OrbitalSystem.create(scene, orbitalConfig);

    // Apply the perk through the registry system for automatic spawning
    OrbitalPerkRegistry.applyPerkOrbital(scene, 'LAVA_FAIRIES');
};

OrbitalPerkRegistry.registerPerkOrbital('WRECKING_BALL', {
    getConfig: function () {
        return {
            symbol: '球', // Kanji for "ball" as a clear visual representation
            color: '#777777', // Iron/steel gray color
            fontSize: 32, // Standard size for visibility
            radius: 192, //
            speed: 0.015, //
            direction: 'clockwise',
            pattern: 'figureEight', //
            collisionType: 'explosive', // Use the explosive collision behavior
            damage: playerDamage * 4,
            damageInterval: 0, // Not used for explosive behavior
            lifespan: null, // Permanent until hit
            options: {
                blastRadius: 192 //
            }
        };
    },
    // Updated cooldown to be a base number, with stat and formula
    cooldown: 16000, // Base 16 second cooldown
    cooldownStat: 'luck',
    cooldownFormula: 'sqrt',
    activationMethod: 'timer' // Create periodically on a timer
});

window.activateWreckingBall = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Create a wrecking ball configuration
    const wreckingBallConfig = OrbitalPerkRegistry.perkOrbitalConfigs['WRECKING_BALL'].getConfig();

    // Create the first wrecking ball immediately
    OrbitalSystem.create(scene, wreckingBallConfig);

    // Apply the orbital perk for future wrecking balls
    OrbitalPerkRegistry.applyPerkOrbital(scene, 'WRECKING_BALL');
};

OrbitalPerkRegistry.registerPerkOrbital('COMET', {
    getConfig: function () {
        return {
            symbol: '★', // Standard projectile symbol
            color: '#ffff00', // Standard yellow color
            fontSize: getEffectiveSize(projectileSizeFactor, playerDamage),
            radius: 8, // Starting radius (will be overridden by spiralOut pattern)
            speed: 0.02, // Rotation speed
            direction: 'clockwise',
            pattern: 'spiralOut', // Use our new spiral out pattern
            collisionType: 'projectile', // Destroyed on hit
            damage: playerDamage,
            damageInterval: 0, // Not used for projectiles
            lifespan: playerLuck * 2000,
            options: {
                startRadius: 16, // Start close to the player
                expansionRate: 32 // Pixels per second expansion rate
            }
        };
    },
    count: 1,
    cooldown: 2000, // Base cooldown
    cooldownStat: 'fireRate',
    cooldownFormula: 'sqrt',
    activationMethod: 'timer'
});

window.activateComet = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Create initial comet immediately
    const orbitalConfig = OrbitalPerkRegistry.perkOrbitalConfigs['COMET'].getConfig();
    OrbitalSystem.create(scene, orbitalConfig);

    // Set up timer for subsequent comets
    OrbitalPerkRegistry.applyPerkOrbital(scene, 'COMET');
};

// Add this to nexus.js - INVERTED_COMET orbital perk

OrbitalPerkRegistry.registerPerkOrbital('INVERTED_COMET', {
    getConfig: function () {
        return {
            symbol: '★', // Standard projectile symbol
            color: '#ffff00', // Standard yellow color
            fontSize: getEffectiveSize(projectileSizeFactor, playerDamage),
            radius: 8, // Starting radius (will be overridden by spiralOut pattern)
            speed: 0.02, // Rotation speed
            direction: 'counterclockwise', // Key difference: counter-clockwise rotation
            pattern: 'spiralOut', // Use our new spiral out pattern
            collisionType: 'projectile', // Destroyed on hit
            damage: playerDamage,
            damageInterval: 0, // Not used for projectiles
            lifespan: playerLuck * 2000,
            options: {
                startRadius: 16, // Start close to the player
                expansionRate: 32 // Pixels per second expansion rate
            }
        };
    },
    count: 1,
    cooldown: 2000, // Base cooldown
    cooldownStat: 'fireRate',
    cooldownFormula: 'sqrt',
    activationMethod: 'timer'
});

// Activation function
window.activateInvertedComet = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Create initial inverted comet immediately
    const orbitalConfig = OrbitalPerkRegistry.perkOrbitalConfigs['INVERTED_COMET'].getConfig();
    OrbitalSystem.create(scene, orbitalConfig);

    // Set up timer for subsequent inverted comets
    OrbitalPerkRegistry.applyPerkOrbital(scene, 'INVERTED_COMET');
};

// Three Stars
OrbitalPerkRegistry.registerPerkOrbital('THREE_STARS', {
    getConfig: function () {
        return {
            symbol: '★',
            color: '#ffff00',
            fontSize: 48,
            radius: 128,
            speed: 0.04,
            direction: 'clockwise',
            pattern: 'standard',
            collisionType: 'persistent',
            damage: playerDamage * 2,
            damageInterval: 240,
            lifespan: 8000,
            options: {}
        };
    },
    count: 3, // Will create 3 orbitals with createMultiple
    cooldown: 60000,
    cooldownStat: 'luck',
    cooldownFormula: 'sqrt',
    activationMethod: 'timer'
});

// Activation function
window.activateThreeStars = function () {
    const scene = game.scene.scenes[0];
    if (!scene) return;

    // Create initial three stars immediately using createMultiple
    const orbitalConfig = OrbitalPerkRegistry.perkOrbitalConfigs['THREE_STARS'].getConfig();
    OrbitalSystem.createMultiple(scene, 3, orbitalConfig);

    // Set up timer for subsequent spawns
    OrbitalPerkRegistry.applyPerkOrbital(scene, 'THREE_STARS');
};


// Export the registry for use in other files
window.OrbitalPerkRegistry = OrbitalPerkRegistry;
