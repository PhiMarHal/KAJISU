// Beam System for Word Survivors
// Manages directional beam entities that deal continuous damage

// Global list to store all active beams
const activeBeams = [];

// Beam directions (cardinal only for clean gameplay)
const BEAM_DIRECTIONS = {
    NORTH: { angle: -Math.PI / 2, name: 'north' },
    EAST: { angle: 0, name: 'east' },
    SOUTH: { angle: Math.PI / 2, name: 'south' },
    WEST: { angle: Math.PI, name: 'west' }
};

// Helper function to determine beam direction from player movement
function getBeamDirectionFromMovement() {
    if (!player || !player.body) return BEAM_DIRECTIONS.EAST; // Default to east

    const velocity = player.body.velocity;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

    // If player isn't moving much, default to east
    if (speed < 10) return BEAM_DIRECTIONS.EAST;

    // Determine the dominant direction
    const absX = Math.abs(velocity.x);
    const absY = Math.abs(velocity.y);

    if (absX > absY) {
        // Horizontal movement dominates
        return velocity.x > 0 ? BEAM_DIRECTIONS.EAST : BEAM_DIRECTIONS.WEST;
    } else {
        // Vertical movement dominates
        return velocity.y > 0 ? BEAM_DIRECTIONS.SOUTH : BEAM_DIRECTIONS.NORTH;
    }
}

// Helper function to calculate beam dimensions and position
function calculateBeamGeometry(direction, originX, originY, beamWidth) {
    const gameWidth = game.config.width;
    const gameHeight = game.config.height;

    // Use fixed beam length that extends well beyond screen in all directions
    const fixedBeamLength = Math.max(gameWidth, gameHeight) + 200;
    let beamX, beamY, physicsWidth, physicsHeight;

    switch (direction.name) {
        case 'north':
            beamX = originX;
            beamY = originY - fixedBeamLength / 2; // Physics center is half the beam length north of player
            physicsWidth = beamWidth;
            physicsHeight = fixedBeamLength;
            break;
        case 'south':
            beamX = originX;
            beamY = originY + fixedBeamLength / 2; // Physics center is half the beam length south of player
            physicsWidth = beamWidth;
            physicsHeight = fixedBeamLength;
            break;
        case 'east':
            beamX = originX + fixedBeamLength / 2; // Physics center is half the beam length east of player
            beamY = originY;
            physicsWidth = fixedBeamLength;
            physicsHeight = beamWidth;
            break;
        case 'west':
            beamX = originX - fixedBeamLength / 2; // Physics center is half the beam length west of player
            beamY = originY;
            physicsWidth = fixedBeamLength;
            physicsHeight = beamWidth;
            break;
    }

    return { beamLength: fixedBeamLength, beamX, beamY, physicsWidth, physicsHeight };
}

// Main Beam System
const BeamSystem = {
    // Initialize the system
    init: function () {
        this.clearAll();
        console.log("Beam system initialized");
    },

    // Create a new beam
    create: function (scene, config) {
        // Default configuration
        const defaults = {
            symbol: '光',              // Default kanji for light
            color: '#00FFFF',          // Default cyan color
            fontSize: 32,              // Size of each kanji character
            damage: playerDamage,      // Damage per tick
            damageInterval: 100,       // Time between damage ticks (ms)
            duration: 2000,            // How long the beam lasts (ms)
            beamWidth: 32,             // Width of the beam collision
            followPlayer: false,       // Whether beam follows player position
            chargeTime: 4000,          // Time to charge before firing (ms)
            direction: null,           // Auto-determined if null
            originX: null,             // Custom origin X (defaults to player.x)
            originY: null,             // Custom origin Y (defaults to player.y)
            onChargeStart: null,       // Callback when charge begins
            onBeamStart: null,         // Callback when beam fires
            onBeamEnd: null            // Callback when beam ends
        };

        // Merge provided config with defaults
        const beamConfig = { ...defaults, ...config };

        // Start the charge sequence
        this.startCharge(scene, beamConfig);

        return beamConfig; // Return config for reference
    },

    // Start the charge sequence
    startCharge: function (scene, config) {
        let trackedDirection = BEAM_DIRECTIONS.EAST; // Default direction

        // Call charge start callback if provided
        if (config.onChargeStart) {
            config.onChargeStart(scene);
        }

        // Track player movement during charge to determine direction
        const directionTracker = registerTimer(scene.time.addEvent({
            delay: 100, // Check every 100ms
            callback: function () {
                if (!player?.body?.velocity) return;

                const velocity = player.body.velocity;
                const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

                // Only update direction if player is moving significantly
                if (speed > 10) {
                    trackedDirection = getBeamDirectionFromMovement();
                }
            },
            callbackScope: scene,
            loop: true
        }));

        // After exact charge time, stop tracking and fire the beam
        const chargeTimer = registerTimer(scene.time.addEvent({
            delay: config.chargeTime,
            callback: function () {
                // Stop direction tracking
                directionTracker.remove();

                // Fire the beam in the tracked direction
                BeamSystem.fireBeam(scene, config, trackedDirection);
            },
            callbackScope: scene,
            loop: false
        }));

        // Store references for cleanup
        config._directionTracker = directionTracker;
        config._chargeTimer = chargeTimer;
    },

    // Fire the actual beam
    fireBeam: function (scene, config, direction) {
        // Use provided direction or the tracked direction
        const beamDirection = config.direction || direction;

        // Get origin position (custom origin or player position)
        const originX = config.originX ?? player.x;
        const originY = config.originY ?? player.y;

        // Calculate beam geometry
        const geometry = calculateBeamGeometry(beamDirection, originX, originY, config.beamWidth);

        // Create the visual beam using repeated symbol text
        const beamVisual = this.createBeamVisual(scene, config, beamDirection, geometry, originX, originY);

        // Create the physics body for collision detection
        const beamPhysics = this.createBeamPhysics(scene, config, geometry);

        // Create the beam object
        const beam = {
            visual: beamVisual,
            physics: beamPhysics,
            config: config,
            direction: beamDirection,
            geometry: geometry,
            originX: originX,
            originY: originY,
            createdAt: scene.time.now,
            duration: config.duration,
            followPlayer: config.followPlayer,
            lastDamageTime: {},
            destroyed: false
        };

        // Add visual components if specified
        if (config.visualComponents && Array.isArray(config.visualComponents)) {
            beamVisual.components = {};
            config.visualComponents.forEach(componentName => {
                if (ProjectileComponentSystem.componentTypes[componentName]) {
                    ProjectileComponentSystem.addComponent(beamVisual, componentName);
                }
            });
        }

        // Add physics components if specified  
        if (config.physicsComponents && Array.isArray(config.physicsComponents)) {
            beamPhysics.components = {};
            config.physicsComponents.forEach(componentName => {
                if (ProjectileComponentSystem.componentTypes[componentName]) {
                    ProjectileComponentSystem.addComponent(beamPhysics, componentName);
                }
            });
        }

        // Add to active beams list
        activeBeams.push(beam);

        // Register for cleanup
        window.registerEffect('entity', beamVisual);
        window.registerEffect('entity', beamPhysics); // Register physics body for cleanup too

        // Set up collision with enemies
        const overlapCollider = scene.physics.add.overlap(beamPhysics, EnemySystem.enemiesGroup, function (beamBody, enemy) {
            BeamSystem.handleBeamHit(beam, enemy, scene);
        }, null, scene);

        // Register the overlap collider for cleanup using the same pattern
        window.registerEffect('entity', overlapCollider);

        // Store reference for manual cleanup too
        beam.overlapCollider = overlapCollider;

        // Call beam start callback if provided
        if (config.onBeamStart) {
            config.onBeamStart(scene, beam);
        }

        // Set up beam duration timer - beam deals damage for exact duration then fades
        const durationTimer = registerTimer(scene.time.addEvent({
            delay: config.duration,
            callback: function () {
                // Stop the beam from dealing damage immediately
                beam.destroyed = true;

                // Destroy physics body immediately (don't wait for fade)
                if (beam.physics && beam.physics.active) {
                    // Remove overlap collider first
                    if (beam.overlapCollider) {
                        beam.overlapCollider.destroy();
                        beam.overlapCollider = null;
                    }

                    // Disable and remove physics body immediately
                    beam.physics.body.enable = false;
                    if (beam.physics.body.world) {
                        beam.physics.body.world.remove(beam.physics.body);
                    }
                    beam.physics.destroy();
                    beam.physics = null;
                }

                // Start fade out effect for visual only
                scene.tweens.add({
                    targets: beam.visual,
                    alpha: 0,
                    duration: 500, // 0.5 second fade out
                    onComplete: function () {
                        BeamSystem.destroyBeam(beam);
                    }
                });
            },
            callbackScope: scene,
            loop: false
        }));

        beam._durationTimer = durationTimer;

        return beam;
    },

    // Create visual representation of the beam
    createBeamVisual: function (scene, config, direction, geometry, originX, originY) {
        // Fixed number of repetitions for consistent beam length
        const repetitions = 32;
        const beamText = config.symbol.repeat(repetitions);

        // Create the beam as a single text object positioned at origin
        const beamVisual = scene.add.text(originX, originY, beamText, {
            fontFamily: 'Arial',
            fontSize: `${config.fontSize}px`,
            color: config.color,
            fontStyle: 'bold',
            letterSpacing: '0px' // Ensure no extra spacing between characters
        }).setOrigin(0, 0.5); // Anchor at left edge, vertically centered

        // Rotate based on direction
        switch (direction.name) {
            case 'north':
                beamVisual.setRotation(-Math.PI / 2); // 90° counter-clockwise
                break;
            case 'south':
                beamVisual.setRotation(Math.PI / 2);  // 90° clockwise
                break;
            case 'west':
                beamVisual.setRotation(Math.PI);      // 180°
                break;
            case 'east':
            default:
                beamVisual.setRotation(0);            // No rotation (default)
                break;
        }

        // Add spawn animation
        beamVisual.setAlpha(0);
        scene.tweens.add({
            targets: beamVisual,
            alpha: 1,
            duration: 200,
            ease: 'Cubic.easeOut'
        });

        return beamVisual;
    },

    // Create physics body for the beam
    createBeamPhysics: function (scene, config, geometry) {
        // Create an invisible rectangle for physics
        const physicsBody = scene.add.rectangle(
            geometry.beamX,
            geometry.beamY,
            geometry.physicsWidth,
            geometry.physicsHeight
        );

        physicsBody.setVisible(false); // Make it invisible
        scene.physics.world.enable(physicsBody);
        physicsBody.body.setImmovable(true);

        // Store damage properties on the physics body
        physicsBody.damage = config.damage;
        physicsBody.damageInterval = config.damageInterval;
        physicsBody.damageSourceId = `beam_${Date.now()}_${Math.random()}`;

        return physicsBody;
    },

    // Handle beam hitting an enemy - now with components
    handleBeamHit: function (beam, enemy, scene) {
        if (beam.destroyed || !enemy.active) return;

        // Use the contact damage system for consistent damage handling
        applyContactDamage.call(
            scene,
            beam.physics,
            enemy,
            beam.config.damage,
            beam.config.damageInterval
        );

        // Process component events (like onHit for poison effect)
        if (beam.physics.components && Object.keys(beam.physics.components).length > 0) {
            ProjectileComponentSystem.processEvent(beam.physics, 'onHit', enemy, scene);
        }
    },

    // Update all active beams
    update: function (scene, time) {
        if (gameOver || gamePaused || activeBeams.length === 0) return;

        // Update each beam
        for (let i = activeBeams.length - 1; i >= 0; i--) {
            const beam = activeBeams[i];

            if (beam.destroyed) {
                activeBeams.splice(i, 1);
                continue;
            }

            // Update beam position if it follows the player
            if (beam.followPlayer && player) {
                //console.log(`Updating beam position from (${beam.visual.x}, ${beam.visual.y}) to (${player.x}, ${player.y})`);

                // Update visual position to current player position
                beam.visual.x = player.x;
                beam.visual.y = player.y;

                // Update physics position - recalculate geometry for current player position
                const newGeometry = calculateBeamGeometry(beam.direction, player.x, player.y, beam.config.beamWidth);
                beam.physics.x = newGeometry.beamX;
                beam.physics.y = newGeometry.beamY;

                //console.log(`Physics updated to (${beam.physics.x}, ${beam.physics.y})`);
            }
        }
    },

    // Destroy a beam
    destroyBeam: function (beam) {
        if (beam.destroyed) return;

        // Mark as destroyed first to prevent multiple calls
        beam.destroyed = true;

        // Remove overlap collider first - check if it exists and is active
        if (beam.overlapCollider && beam.overlapCollider.active) {
            beam.overlapCollider.destroy();
            beam.overlapCollider = null;
        }

        // Clean up all timers
        if (beam._directionTracker && beam._directionTracker.active) {
            beam._directionTracker.remove();
        }
        if (beam._chargeTimer && beam._chargeTimer.active) {
            beam._chargeTimer.remove();
        }
        if (beam._durationTimer && beam._durationTimer.active) {
            beam._durationTimer.remove();
        }

        // Destroy physics body properly
        if (beam.physics && beam.physics.active) {
            // Disable physics body first
            beam.physics.body.enable = false;
            // Remove from any groups
            if (beam.physics.body.world) {
                beam.physics.body.world.remove(beam.physics.body);
            }
            // Destroy the game object
            beam.physics.destroy();
            beam.physics = null;
        }

        // Destroy visual if not already destroyed
        if (beam.visual && beam.visual.active) {
            beam.visual.destroy();
            beam.visual = null;
        }

        // Call end callback if provided
        if (beam.config.onBeamEnd) {
            const scene = game.scene.scenes[0];
            if (scene) {
                beam.config.onBeamEnd(scene, beam);
            }
        }

        // Remove from active beams array
        const index = activeBeams.indexOf(beam);
        if (index > -1) {
            activeBeams.splice(index, 1);
        }
    },

    // Clear all active beams
    clearAll: function () {
        // Destroy all beams
        activeBeams.forEach(beam => {
            this.destroyBeam(beam);
        });

        // Clear the array
        activeBeams.length = 0;
    },

    // Get all active beams
    getAll: function () {
        return activeBeams.filter(beam => !beam.destroyed);
    },

    // Get count of active beams
    getCount: function () {
        return this.getAll().length;
    }
};

// Export the system for use in other files
window.BeamSystem = BeamSystem;