// Dropper Component System for KAJISU
// Manages entities that are dropped by the player and remain in the world

// Global list to store all active drops
const drops = [];

// Behavior definitions for different types of drops
const DropBehaviors = {
    // projectile behavior - detonates on enemy contact
    projectile: function (scene, drop, enemy) {
        // Calculate current damage
        let currentDamage;
        if (drop.damageMultiplier !== undefined) {
            currentDamage = (getEffectiveDamage() + playerLuck) * drop.damageMultiplier;
        } else {
            currentDamage = drop.entity.damage;
        }

        // Apply damage to the enemy using the contact damage system
        applyContactDamage.call(
            scene,
            drop.entity,
            enemy,
            currentDamage,  // Use calculated damage
            drop.damageInterval
        );

        // Apply effect component if specified
        if (drop.options && drop.options.effectComponent) {
            const componentName = drop.options.effectComponent;
            const component = ProjectileComponentSystem.componentTypes[componentName];

            if (component && component.onHit) {
                // Create a minimal synthetic projectile with necessary properties
                const syntheticProjectile = {
                    damage: drop.entity.damage,
                    x: drop.entity.x,
                    y: drop.entity.y,
                    damageSourceId: drop.entity.damageSourceId + '_effect'
                };

                // Apply the effect
                component.onHit(syntheticProjectile, enemy, scene);
            }
        }

        // Reduce drop health by 1
        drop.health -= 1;

        // Show damage visual effect
        VisualEffects.createDamageFlash(scene, drop.entity);

        // Only destroy if health reaches 0 or below
        if (drop.health <= 0) {
            DropperSystem.destroyDrop(drop);
        }
    },

    // Persistent behavior - deals continuous damage while enemies overlap
    persistent: function (scene, drop, enemy) {
        // Calculate current damage
        let currentDamage;
        if (drop.damageMultiplier !== undefined) {
            currentDamage = (getEffectiveDamage() + playerLuck) * drop.damageMultiplier;
        } else {
            currentDamage = drop.entity.damage;
        }

        // Apply damage to the enemy using the contact damage system
        applyContactDamage.call(
            scene,
            drop.entity,
            enemy,
            currentDamage,  // Use calculated damage
            drop.damageInterval
        );
    },

    // Area effect behavior - deals damage to all enemies in range periodically
    areaEffect: function (scene, drop, enemy) {
        // Reduce drop health by 1
        drop.health -= 1;

        // Show damage visual effect
        VisualEffects.createDamageFlash(scene, drop.entity);

        // Only destroy if health reaches 0 or below
        if (drop.health <= 0) {
            DropperSystem.destroyDrop(drop);
        }
    },

    // Player pushable behavior - entities that can be pushed by player
    playerPushable: function (scene, drop, enemy) {
        const body = drop.entity.body;
        if (!body) return;

        const velocityMagnitude = Math.sqrt(body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y);
        const velocityThreshold = drop.options?.velocityThreshold ?? 1;

        if (velocityMagnitude > velocityThreshold) {
            // Calculate current damage
            let currentDamage;
            if (drop.damageMultiplier !== undefined) {
                currentDamage = (getEffectiveDamage() + playerLuck) * drop.damageMultiplier;
            } else {
                currentDamage = drop.entity.damage;
            }

            // Apply damage to the enemy using the contact damage system
            applyContactDamage.call(
                scene,
                drop.entity,
                enemy,
                currentDamage,  // Use calculated damage
                drop.damageInterval
            );
        }
    }
};

// Main Dropper System
const DropperSystem = {
    // Initialize the system
    init: function () {
        // Clear any existing drops
        this.clearAll();
        console.log("Dropper system initialized");
    },

    // Create a new drop entity
    create: function (scene, config) {
        // Default configuration with fallbacks
        const defaults = {
            symbol: '★',                 // Text symbol to display
            color: '#ffff00',            // Color of the drop
            fontSize: 32,                // Size of the font
            x: player.x,                 // X position (default to player position)
            y: player.y,                 // Y position (default to player position)
            behaviorType: 'projectile',  // Behavior type ('projectile', 'persistent', 'areaEffect')
            damage: (getEffectiveDamage() + playerLuck),        // Damage dealt to enemies
            damageInterval: 500,         // Minimum time between damage instances in ms
            colliderSize: 0.8,           // Size multiplier for collision detection
            lifespan: null,              // Time in ms before auto-destruction (null for permanent)
            health: 1,                   // NEW: Health points (1 = dies on first hit)
            options: {}                  // Additional options for specific behaviors
        };

        // Merge provided config with defaults
        const dropConfig = { ...defaults, ...config };

        // Create the drop entity as a text object
        const entity = scene.add.text(
            dropConfig.x,
            dropConfig.y,
            dropConfig.symbol,
            {
                fontFamily: 'Arial',
                fontSize: `${dropConfig.fontSize}px`,
                color: dropConfig.color,
                fontStyle: dropConfig.fontStyle ?? 'bold' // Allow override, default to bold for compatibility
            }
        ).setOrigin(0.5);

        if (dropConfig.options.opacity !== undefined) {
            entity.setAlpha(dropConfig.options.opacity);
        }

        // Add physics to the drop for enemy overlap detection
        scene.physics.world.enable(entity);
        entity.body.setSize(entity.width * dropConfig.colliderSize, entity.height * dropConfig.colliderSize);
        entity.body.setImmovable(true);  // Drops don't move when collided with

        // Special setup for player pushable entities - deterministic tick-based motion.
        // Phaser arcade integration is disabled; DropperSystem.checkPushableCollisions
        // handles motion, drag, world-bounce, collision detection, and separation.
        if (dropConfig.behaviorType === 'playerPushable') {
            // Disable Phaser's physics integration on this body - we own its motion.
            entity.body.moves = false;

            // Store physics parameters on the entity for the tick integrator to read.
            // Defaults preserve the feel of the previous Phaser-driven setup.
            const physics = dropConfig.options?.physics || {};
            entity._pushableDrag = physics.drag ?? 10;
            entity._pushableBounce = physics.bounce ?? 0.8;
            entity._pushableMaxVelocity = physics.maxVelocity ?? 800;

            entity.isPlayerPushable = true;
        }

        // Store unique ID for damage source (used for cooldown tracking)
        entity.damageSourceId = DamageSourceRegistry.nextId('drop');

        // Store damage value on the entity
        entity.damage = dropConfig.damage;

        // Create the drop object that tracks all properties
        const drop = {
            entity: entity,
            behaviorType: dropConfig.behaviorType,
            damageInterval: dropConfig.damageInterval,
            damageMultiplier: dropConfig.damageMultiplier,
            createdAt: GameClock.now(),
            lifespan: dropConfig.lifespan,
            areaEffectInterval: dropConfig.options.areaEffectInterval ?? 1000,
            areaEffectRadius: dropConfig.options.areaEffectRadius ?? 100,
            health: dropConfig.health,   // NEW: Store health in the drop object
            options: dropConfig.options,
            destroyed: false             // Flag to mark for cleanup
        };

        // Add to global list
        drops.push(drop);

        // Register for cleanup
        window.registerEffect('entity', entity);

        // If this is an area effect, set up its timer using CooldownManager
        if (drop.behaviorType === 'areaEffect') {
            // UPDATED: Use options for stat scaling of area effect interval if provided
            drop.areaEffectTimer = CooldownManager.createTimer({
                statName: drop.options.areaEffectStatName ?? 'luck',
                statFunction: drop.options.areaEffectStatFunction,
                statDependencies: drop.options.areaEffectStatDependencies,
                baseStatFunction: drop.options.areaEffectBaseStatFunction,
                baseCooldown: drop.areaEffectInterval,
                formula: drop.options.areaEffectFormula ?? 'sqrt',
                component: drop, // Reference for cleanup
                callback: function () {
                    if (gameOver || gamePaused || drop.destroyed ||
                        !drop.entity || !drop.entity.active) return;

                    // Process the area effect
                    DropperSystem.processAreaEffect(scene, drop, GameClock.now());
                },
                callbackScope: scene,
                loop: true
            });
        }

        // Get the appropriate behavior function
        const behavior = DropBehaviors[dropConfig.behaviorType] ?? DropBehaviors.projectile;

        // Register overlap with enemies via CollisionRegistry for deterministic checking
        drop.collisionId = CollisionRegistry.register({
            objectA: entity,
            objectB: EnemySystem.enemiesGroup,
            callback: function (dropEntity, enemy) {
                if (drop.destroyed) return;
                behavior(scene, drop, enemy);
            },
            scope: scene,
            type: dropConfig.behaviorType === 'projectile' ? 'manual' : 'overlap'
        });

        // Visual effect when spawning
        scene.tweens.add({
            targets: entity,
            scale: { from: dropConfig.initialScale, to: 1 },
            duration: 500,
            ease: 'Back.out'
        });

        // Any custom visual effect is applied here
        applyVisualEffects(scene, entity, dropConfig.options);

        // Set up auto-destruction timer if lifespan is specified
        if (drop.lifespan !== null) {
            const timer = CooldownManager.createTimer({
                statName: null,
                baseCooldown: drop.lifespan,
                formula: 'fixed',
                callback: function () {
                    DropperSystem.destroyDrop(drop);
                },
                callbackScope: scene,
                loop: false
            });
        }

        if (drop.options && drop.options.hasPeriodicEffect) {
            DropperSystem.createDropEffectTimer(scene, drop);

            // Fire immediately if requested
            if (drop.options.fireImmediately && !drop.hasInitiallyFired) {
                drop.hasInitiallyFired = true;
                DropperSystem.processDropEffect(scene, drop);
            }
        }

        return drop;
    },

    // Update all drops — call from simulateTick for deterministic timing
    update: function (scene) {
        // Skip if no drops or game state prevents updates
        if (gameOver || gamePaused || drops.length === 0) return;

        // Manual collision detection for playerPushable entities
        this.checkPushableCollisions(scene);

        // Clean up destroyed drops
        this.cleanupInactive();
    },

    // Manual collision checking for playerPushable entities
    // Deterministic motion, drag, world-bounce, and player collision for all
    // playerPushable entities. Called once per tick from DropperSystem.update.
    checkPushableCollisions: function (scene) {
        if (!player || !player.body) return;

        const dt = GameClock.FIXED_TIMESTEP / 1000;
        const currentTime = GameClock.now();
        const playerRadius = player.body.halfWidth ?? 20;
        const worldW = game.config.width;
        const worldH = game.config.height;

        for (const drop of drops) {
            const entity = drop.entity;
            if (!entity || !entity.active || !entity.isPlayerPushable) continue;

            const body = entity.body;
            if (!body) continue;

            const halfW = body.halfWidth;
            const halfH = body.halfHeight;
            let vx = body.velocity.x;
            let vy = body.velocity.y;

            // Cap velocity
            const maxV = entity._pushableMaxVelocity;
            const speedSq = vx * vx + vy * vy;
            if (speedSq > maxV * maxV) {
                const scale = maxV / Math.sqrt(speedSq);
                vx *= scale;
                vy *= scale;
            }

            // Integrate position
            let nx = entity.x + vx * dt;
            let ny = entity.y + vy * dt;

            // Bounce off world edges (reflect velocity, clamp position)
            const bounce = entity._pushableBounce;
            if (nx < halfW) { nx = halfW; vx = -vx * bounce; }
            else if (nx > worldW - halfW) { nx = worldW - halfW; vx = -vx * bounce; }
            if (ny < halfH) { ny = halfH; vy = -vy * bounce; }
            else if (ny > worldH - halfH) { ny = worldH - halfH; vy = -vy * bounce; }

            // Apply linear drag (Phaser arcade drag semantics: v decays by drag*dt per tick)
            const dragStep = entity._pushableDrag * dt;
            const currentSpeed = Math.sqrt(vx * vx + vy * vy);
            if (currentSpeed > 0) {
                if (currentSpeed <= dragStep) {
                    vx = 0; vy = 0;
                } else {
                    const scale = (currentSpeed - dragStep) / currentSpeed;
                    vx *= scale;
                    vy *= scale;
                }
            }

            // Player collision with push and immediate separation
            const dx = nx - player.x;
            const dy = ny - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const entityRadius = halfW ?? entity.width / 2 ?? 16;
            const collisionThreshold = playerRadius + entityRadius + 2;

            if (distance < collisionThreshold && distance > 0) {
                if (!entity.lastPushTime || (currentTime - entity.lastPushTime > 250)) {
                    entity.lastPushTime = currentTime;

                    const baseAngle = Math.atan2(dy, dx);
                    const randomDeflection = (SeededRNG.random('effect') - 0.5) * (Math.PI * 8 / 180);
                    const finalAngle = baseAngle + randomDeflection;
                    const pushForce = 800;

                    vx = Math.cos(finalAngle) * pushForce;
                    vy = Math.sin(finalAngle) * pushForce;

                    // Separate: place the ball exactly at the collision threshold distance
                    // along the push direction so it exits contact cleanly this tick.
                    nx = player.x + Math.cos(finalAngle) * collisionThreshold;
                    ny = player.y + Math.sin(finalAngle) * collisionThreshold;
                }
            }

            // Commit integrated state back to the entity and its physics body
            entity.x = nx;
            entity.y = ny;
            body.velocity.x = vx;
            body.velocity.y = vy;
            body.position.x = nx - halfW;
            body.position.y = ny - halfH;
            body.updateCenter();
        }
    },

    // Process area effect for a drop
    processAreaEffect: function (scene, drop, time) {
        // Get all active enemies
        const allEnemies = EnemySystem.enemiesGroup.getChildren();

        // Get center position of the drop
        const centerX = drop.entity.x;
        const centerY = drop.entity.y;

        // Calculate radius based on base radius and playerLuck
        let radius = drop.areaEffectRadius;
        // If radiusScalesWithLuck flag is set, apply luck scaling
        if (drop.options.radiusScalesWithLuck) {
            radius = radius * Math.sqrt(playerLuck / BASE_STATS.LUK);
        }

        // Get the color from drop options or use default yellow
        const effectColor = drop.options.pulseColor ?? 0xffff00;

        // Always create visual effect regardless of enemy hits
        this.createPulseEffect(scene, centerX, centerY, radius, effectColor);

        // Apply damage or effects to all enemies in range
        let hitCount = 0;

        // Check if this area effect has a component
        const componentName = drop.options.effectComponent;
        const component = componentName ?
            ProjectileComponentSystem.componentTypes[componentName] : null;

        allEnemies.forEach(enemy => {
            if (!enemy.active) return;

            // Calculate distance from the drop
            const dx = enemy.x - centerX;
            const dy = enemy.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If within effect radius, apply effect
            if (distance <= radius) {
                // Always apply regular damage
                let damageAmount;
                if (drop.damageMultiplier !== undefined) {
                    damageAmount = (getEffectiveDamage() + playerLuck) * drop.damageMultiplier;
                } else {
                    damageAmount = drop.entity.damage;
                }
                const areaSourceId = DamageSourceRegistry.nextId(drop.entity.damageSourceId + '_area');



                applyContactDamage.call(
                    scene,
                    {
                        damageSourceId: areaSourceId,
                        damage: damageAmount,
                        active: true
                    },
                    enemy,
                    damageAmount,
                    0 // No cooldown since the area effect has its own interval timing
                );

                // If there's a component with onHit method, call it as well
                if (component && component.onHit) {
                    // Create a synthetic projectile with minimal required properties
                    const syntheticProjectile = {
                        damage: drop.entity.damage,
                        x: centerX,
                        y: centerY,
                        // Add other properties that might be needed
                        damageSourceId: DamageSourceRegistry.nextId(drop.entity.damageSourceId + '_component')
                    };

                    // Call the component's onHit method directly
                    component.onHit(syntheticProjectile, enemy, scene);
                }

                hitCount++;
            }
        });
    },

    // New helper method to create the pulse visual effect
    createPulseEffect: function (scene, x, y, radius, color) {
        return VisualEffects.createExplosion(scene, x, y, radius, color);
    },

    // Clean up inactive drops
    cleanupInactive: function () {
        for (let i = drops.length - 1; i >= 0; i--) {
            const drop = drops[i];
            if (drop.destroyed || !drop.entity || !drop.entity.active) {
                drops.splice(i, 1);
            }
        }
    },

    // Clear all drops
    clearAll: function () {
        // Destroy all drop entities
        drops.forEach(drop => {
            if (drop.entity && drop.entity.active) {
                drop.entity.destroy();
            }
        });

        // Clear the array
        drops.length = 0;
    },

    // Get all active drops
    getAll: function () {
        return drops.filter(drop => !drop.destroyed && drop.entity && drop.entity.active);
    },

    // Get count of active drops
    getCount: function () {
        return this.getAll().length;
    },

    // Setup periodic drops
    // Modified setupPeriodicDrops function for droppers.js
    // This now correctly uses baseCooldown, statName, and formula from the perk config.
    setupPeriodicDrops: function (scene, config) {
        // Default options
        const defaults = {
            getConfig: function () { return {}; },  // Function that returns drop config
            cooldown: 4000,                        // Base Cooldown in ms
            cooldownStat: null,                    // Stat that affects cooldown
            cooldownFormula: null,                 // Formula for stat scaling
            statFunction: null,                    // Custom function for calculating current stat value
            statDependencies: null,                // Array of stat names this depends on
            baseStatFunction: null,                // Function for calculating base stat value
            positionMode: 'player',                // 'player', 'random', or 'trail'
            trailInterval: 32,                    // For 'trail' mode, min distance to place new drop
            lastDropPos: { x: 0, y: 0 },           // For 'trail' mode, last position where we dropped
            enabled: true                          // Whether drops are currently enabled
        };

        // Merge provided config with defaults
        const dropperConfig = { ...defaults, ...config };

        // Initialize lastDropPos with player's current position for trail mode
        if (dropperConfig.positionMode === 'trail' && player) {
            dropperConfig.lastDropPos.x = player.x;
            dropperConfig.lastDropPos.y = player.y;
        }

        // Create timer to spawn drops using CooldownManager
        const timer = CooldownManager.createTimer({
            baseCooldown: dropperConfig.cooldown,
            statName: dropperConfig.cooldownStat,
            statFunction: dropperConfig.statFunction,        // Pass custom stat function
            statDependencies: dropperConfig.statDependencies, // Pass dependencies
            baseStatFunction: dropperConfig.baseStatFunction, // Pass base stat function
            formula: dropperConfig.cooldownFormula,
            component: dropperConfig, // Pass the config object as component for potential future reference
            callback: function () {
                // Skip if disabled
                if (!dropperConfig.enabled) return;

                // Skip if game state prevents updates
                if (gameOver || gamePaused) return;

                // Get fresh configuration each time (in case player stats changed)
                const dropConfig = dropperConfig.getConfig();

                // Determine position based on mode
                let x, y;
                let shouldCreateDrop = true; // Flag to determine if we create a drop this cycle

                switch (dropperConfig.positionMode) {
                    case 'random':
                        // Random position on screen without padding
                        x = SeededRNG.between(0, game.config.width, 'drop');
                        y = SeededRNG.between(0, game.config.height, 'drop');
                        break;

                    case 'trail':
                        // Make sure player exists
                        if (!player || !player.active) {
                            shouldCreateDrop = false;
                            break;
                        }

                        // Calculate distance moved since last drop
                        const dx = player.x - dropperConfig.lastDropPos.x;
                        const dy = player.y - dropperConfig.lastDropPos.y;
                        const distanceMoved = Math.sqrt(dx * dx + dy * dy);

                        // Debug info - uncomment if needed for troubleshooting
                        //console.log(`Trail check: moved ${distanceMoved.toFixed(2)}px, need ${dropperConfig.trailInterval}px`);

                        if (distanceMoved >= dropperConfig.trailInterval) {
                            // Far enough to place a new drop
                            x = player.x;
                            y = player.y;

                            // Update last drop position
                            dropperConfig.lastDropPos.x = x;
                            dropperConfig.lastDropPos.y = y;
                        } else {
                            // Not far enough from last drop, skip this cycle
                            shouldCreateDrop = false;
                        }
                        break;

                    case 'player':
                    default:
                        // Place at player position
                        x = player.x;
                        y = player.y;
                        break;
                }

                // Only create the drop if our flag is still true
                if (shouldCreateDrop) {
                    // Assign position to drop config
                    dropConfig.x = x;
                    dropConfig.y = y;

                    // Create the drop
                    DropperSystem.create(scene, dropConfig);
                }
            },
            callbackScope: scene,
            loop: true
        });

        // Register timer for cleanup (this will now register the timer managed by CooldownManager)
        window.registerEffect('timer', timer);

        // Return a controller object
        return {
            timer: timer,
            config: dropperConfig,

            // Enable/disable drops
            setEnabled: function (enabled) {
                dropperConfig.enabled = enabled;
            },

            // Change cooldown (this will now interact with CooldownManager's timer)
            // This will update the baseCooldown of the existing timer. CooldownManager
            // will then re-apply any stat scaling.
            setCooldown: function (newCooldown) {
                if (this.timer) {
                    CooldownManager.updateTimer(
                        {
                            timer: this.timer,
                            baseCooldown: newCooldown,
                            statName: this.timer.statName,
                            statFunction: this.timer.statFunction,
                            statDependencies: this.timer.statDependencies,
                            baseStatFunction: this.timer.baseStatFunction,
                            formula: this.timer.formula,
                            callback: this.timer.callback,
                            callbackScope: this.timer.callbackScope,
                            loop: this.timer.loop
                        },
                        // Pass the current value of the stat if statName exists, otherwise newCooldown
                        this.timer.statName ? window[this.timer.statName] : newCooldown
                    );
                }
            }
        };
    },

    // Process drop effect based on type
    processDropEffect: function (scene, drop) {
        // Check if this is a laser flower
        if (drop.options && drop.options.isLaserFlower) {
            // Initialize direction tracking if not set
            if (drop.currentDirectionIndex === undefined) {
                drop.currentDirectionIndex = 0; // Start with east (index 0)
            }

            // Direction sequence: east → south → west → north (clockwise)
            const directionSequence = [
                BEAM_DIRECTIONS.EAST,
                BEAM_DIRECTIONS.SOUTH,
                BEAM_DIRECTIONS.WEST,
                BEAM_DIRECTIONS.NORTH
            ];

            const currentDirection = directionSequence[drop.currentDirectionIndex];

            // Store flower reference for the charging effect (like player beams store player reference)
            const flowerEntity = drop.entity;

            // Create beam using the enhanced BeamSystem
            BeamSystem.create(scene, {
                symbol: '光線', // Light beam kanji like laser cannon
                color: '#FF00FF',
                fontSize: 20, // Medium size
                damage: drop.entity.damage, // Use the flower's damage
                damageInterval: 100, // Fast damage ticks
                duration: 1000, // 1 second beam duration
                beamWidth: 20, // Medium beam width
                followPlayer: false, // Static beam from flower position
                chargeTime: 2000, // 2 second charge time
                direction: currentDirection, // Force specific direction
                originX: drop.entity.x, // Fire from flower position
                originY: drop.entity.y, // Fire from flower position
                onChargeStart: function (scene) {
                    // Mimic player beam pattern - pass entity reference, not coordinates
                    VisualEffects.createChargingEffect(scene, {
                        color: '#FF00FF',
                        duration: 2000, // Match charge time exactly
                        maxRadius: 32, // Smaller radius than player charging
                        targetEntity: flowerEntity // Let it evaluate position fresh each time
                    });
                }
            });

            // Advance to next direction (clockwise)
            drop.currentDirectionIndex = (drop.currentDirectionIndex + 1) % directionSequence.length;
        }

        // Cloud King lightning effect
        else if (drop.options && drop.options.isCloudKing) {
            // Create lightning strike at random position within radius
            const radius = 192;
            const angle = SeededRNG.angle('effect');
            const distance = SeededRNG.random('effect') * radius;
            const x = drop.entity.x + Math.cos(angle) * distance;
            const y = drop.entity.y + Math.sin(angle) * distance;

            // Ensure position is within game bounds
            const clampedX = Math.max(0, Math.min(game.config.width, x));
            const clampedY = Math.max(0, Math.min(game.config.height, y));

            // Create lightning strike
            createLightningStrike(scene, clampedX, clampedY);
        }

        // Hammer Queen effect
        else if (drop.options && drop.options.isHammerQueen) {
            // Call god hammer with range checking (192px radius from crown)
            dropGodHammer.call(scene, {
                originX: drop.entity.x,
                originY: drop.entity.y,
                maxRange: 192
            });
        }

        // Existing flower logic
        else if (drop.entity.text === '花') { // Regular blooming flower
            // Fire defensive burst for flowers
            window.createDefensiveBurst(scene, drop.entity.x, drop.entity.y, {
                projectileCount: playerLuck * 2,
                visualEffect: true
            });
        }

        // Generic firing behavior for droppers
        else if (drop.options && drop.options.firingBehavior) {
            // Use the generalized entity firing system
            const behaviorName = drop.options.firingBehavior;
            const firingRange = drop.options.firingRange || 400;

            if (EntityFiringSystem.behaviors[behaviorName]) {
                EntityFiringSystem.behaviors[behaviorName](
                    scene,
                    drop.entity,
                    GameClock.now(),
                    firingRange
                );
            } else {
                console.warn(`Unknown firing behavior: ${behaviorName}`);
            }
        }

        else if (drop.options && drop.options.isExplodingFlower) {
            const x = drop.entity.x;
            const y = drop.entity.y;
            const projectileCount = Math.floor(getEffectiveFireRate() + playerLuck) * 2;
            const damage = (getEffectiveDamage() + playerLuck) * 0.5;

            for (let i = 0; i < projectileCount; i++) {
                const angle = SeededRNG.angle('effect');
                const speed = 200 + SeededRNG.random('effect') * 400;

                WeaponSystem.createProjectile(scene, {
                    x, y, angle,
                    symbol: '★',
                    color: '#ffff00',
                    speed: speed,
                    damage: damage,
                    fontSize: getEffectiveSize(projectileSizeFactor, damage)
                });
            }
        }

        // Can add more effect types here as needed
    },

    // Create a timer for a drop's periodic effect
    createDropEffectTimer: function (scene, drop) {
        // Get cooldown from options or use default
        const baseCooldown = drop.options.periodicEffectCooldown ?? 10000;

        // Create timer using CooldownManager
        // UPDATED: Use options for stat scaling if provided, default to 'luck'/'sqrt' for backward compat
        drop.effectTimer = CooldownManager.createTimer({
            statName: drop.options.periodicEffectStatName ?? 'luck',
            statFunction: drop.options.periodicEffectStatFunction,
            statDependencies: drop.options.periodicEffectStatDependencies,
            baseStatFunction: drop.options.periodicEffectBaseStatFunction,
            baseCooldown: baseCooldown,
            formula: drop.options.periodicEffectFormula ?? 'sqrt',
            component: drop, // Store reference for easier cleanup
            callback: function () {
                if (gameOver || gamePaused) return;

                // Check if drop still exists
                if (!drop.entity || !drop.entity.active || drop.destroyed) {
                    // Timer will be cleaned up automatically by destroyDrop
                    return;
                }

                // Process the effect
                DropperSystem.processDropEffect(scene, drop);
            },
            callbackScope: scene,
            loop: true
        });
    },

    // Setup system for drops with periodic effects
    setupPeriodicEffectsSystem: function (scene) {
        // Create a timer to periodically check all drops with effects
        const checkTimer = CooldownManager.createTimer({
            statName: null,
            baseCooldown: 1000, // Check every second
            formula: 'fixed',
            callback: function () {
                if (gameOver || gamePaused) return;

                // Get all active drops
                const allDrops = DropperSystem.getAll();

                // Filter for drops with periodic effects
                const dropsWithEffects = allDrops.filter(drop =>
                    drop.options && drop.options.hasPeriodicEffect);

                // Process each drop
                dropsWithEffects.forEach(drop => {
                    // Skip if already destroyed
                    if (drop.destroyed) return;

                    // Initialize effect timer if it doesn't exist
                    if (!drop.effectTimer) {
                        DropperSystem.createDropEffectTimer(scene, drop);
                    }
                });
            },
            callbackScope: scene,
            loop: true
        });

        // Register for cleanup
        window.registerEffect('timer', checkTimer);
    },

    // Enhanced destroyDrop function that cleans up timers
    destroyDrop: function (drop) {
        // Unregister collision pairs
        if (drop.collisionId !== undefined) {
            CollisionRegistry.unregister(drop.collisionId);
        }
        if (drop.playerCollisionId !== undefined) {
            CollisionRegistry.unregister(drop.playerCollisionId);
        }

        // Clean up effect timer if it exists
        if (drop.effectTimer) {
            CooldownManager.removeTimer(drop.effectTimer);
            drop.effectTimer = null;
        }

        // Also clean up area effect timer if it exists
        if (drop.areaEffectTimer) {
            CooldownManager.removeTimer(drop.areaEffectTimer);
            drop.areaEffectTimer = null;
        }

        // Destroy the entity if it exists
        if (drop.entity && drop.entity.active) {
            drop.entity.destroy();
        }

        // Mark as destroyed for cleanup
        drop.destroyed = true;
    }
};

function applyVisualEffects(scene, entity, options) {
    if (!options || !window.VisualEffects) return;

    if (options.needsPulsing) {
        VisualEffects.createPulsing(scene, entity);
    }

    if (options.visualEffect) {
        if (typeof options.visualEffect === 'string') {
            const effectName = options.visualEffect;
            if (typeof VisualEffects[effectName] === 'function') {
                VisualEffects[effectName](scene, entity);
            }
        }
        else if (typeof options.visualEffect === 'object') {
            const effectName = options.visualEffect.type;
            const effectConfig = options.visualEffect.config || {};
            if (typeof VisualEffects[effectName] === 'function') {
                VisualEffects[effectName](scene, entity, effectConfig);
            }
        }
    }
}

// Export for use in other files
window.setupPeriodicEffectsSystem = DropperSystem.setupPeriodicEffectsSystem.bind(DropperSystem);

// Export the system for use in other files
window.DropperSystem = DropperSystem;