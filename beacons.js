// Beacon System for Word Survivors
// Manages collectible entities that spawn periodically and trigger effects

const BeaconSystem = {
    // Create a standardized beacon spawning component
    createBeaconComponent: function (config) {
        const defaults = {
            beaconType: 'generic',
            symbol: '★',
            fontSize: '20px',
            color: '#FFD700',
            strokeColor: '#FFFFFF',
            strokeThickness: 4,
            baseCooldown: 60000,
            cooldownStat: 'luck',
            cooldownFormula: 'sqrt',
            maxBeacons: null, // null means use playerLuck
            paddingX: 0.017, // 20/1200
            paddingY: 0.025, // 20/800
            onCollect: function () { }, // Function to call when collected
            shadowConfig: {
                offsetX: 0,
                offsetY: 0,
                color: '#FFFFFF',
                blur: 10,
                stroke: true,
                fill: true
            }
        };

        const beaconConfig = { ...defaults, ...config };

        return {
            // Store timer reference and config
            beaconTimer: null,
            config: beaconConfig,

            initialize: function (player) {
                // Get the scene
                const scene = game.scene.scenes[0];
                if (!scene) return;

                // Store reference to this component for the callback
                const beaconComponent = this;

                // Create and register timer
                this.beaconTimer = CooldownManager.createTimer({
                    statName: this.config.cooldownStat,
                    baseCooldown: this.config.baseCooldown,
                    formula: this.config.cooldownFormula,
                    component: this,
                    callback: function () {
                        // Call spawnBeacon with proper context
                        beaconComponent.spawnBeacon.call(scene, beaconComponent.config);
                    },
                    callbackScope: scene,
                    loop: true
                });

                // Spawn first beacon immediately
                this.spawnBeacon.call(scene, this.config);
            },

            spawnBeacon: function (config) {
                // Skip if game is over or paused
                if (gameOver || gamePaused) return;

                // Limit beacons of this type
                BeaconSystem.limitBeaconsByType(config.beaconType, config.maxBeacons);

                // Calculate spawn position with padding
                const x = Phaser.Math.Between(
                    game.config.width * config.paddingX,
                    game.config.width * (1 - config.paddingX)
                );
                const y = Phaser.Math.Between(
                    game.config.height * config.paddingY,
                    game.config.height * (1 - config.paddingY)
                );

                // Create the beacon
                const beacon = this.add.text(x, y, config.symbol, {
                    fontFamily: 'Arial',
                    fontSize: config.fontSize,
                    color: config.color,
                    stroke: config.strokeColor,
                    strokeThickness: config.strokeThickness,
                    shadow: config.shadowConfig
                }).setOrigin(0.5);

                // Add physics body
                this.physics.world.enable(beacon);
                beacon.body.setSize(beacon.width * 0.8, beacon.height * 0.8);
                beacon.body.immovable = true;

                // Mark beacon type and create unique ID
                beacon.beaconType = config.beaconType;
                beacon.beaconId = `${config.beaconType}_${Date.now()}_${Math.random()}`;

                // Track in activeEffects.entities
                if (!activeEffects.entities) {
                    activeEffects.entities = [];
                }

                // Register for cleanup
                window.registerEffect('entity', beacon);

                // Add overlap with player
                this.physics.add.overlap(beacon, player, function (beacon, player) {
                    // Only collect if not already collected
                    if (beacon.collected) return;

                    // Mark as collected to prevent multiple triggers
                    beacon.collected = true;

                    // Call the custom effect
                    config.onCollect.call(this, beacon);

                    // Standard collection visual effects
                    BeaconSystem.createCollectionEffects.call(this, beacon);

                }.bind(this), null, this);

                // Add pulsing animation
                VisualEffects.createPulsing(this, beacon);

                return beacon;
            },

            cleanup: function (player) {
                // Remove timer
                if (this.beaconTimer) {
                    CooldownManager.removeTimer(this.beaconTimer);
                    this.beaconTimer = null;
                }
            }
        };
    },

    // Limit the number of beacons of a specific type
    limitBeaconsByType: function (beaconType, maxBeacons) {
        if (!activeEffects.entities) return;

        // Use custom limit or default to playerLuck
        const limit = maxBeacons ?? playerLuck;

        // Get all beacons of this type
        const beaconsOfType = activeEffects.entities.filter(entity =>
            entity && entity.active && entity.beaconType === beaconType
        );


        // Remove oldest beacons if over limit
        while (beaconsOfType.length >= limit) {
            const oldestBeacon = beaconsOfType.shift();
            if (oldestBeacon && oldestBeacon.active) {
                oldestBeacon.destroy();
            }
        }
    },

    // Standard collection visual effects
    createCollectionEffects: function (beacon) {
        // Fade out and scale up
        this.tweens.add({
            targets: beacon,
            alpha: 0,
            scale: 2,
            duration: 500,
            onComplete: function () {
                beacon.destroy();
            }
        });

        // Create radial flash effect
        const flashColor = beacon.style.color === '#00CC00' ? 0x00FF00 :
            beacon.style.color === '#00FFFF' ? 0x00FFFF : 0xFFFFFF;

        const flash = this.add.circle(beacon.x, beacon.y, 5, flashColor, 1);
        this.tweens.add({
            targets: flash,
            radius: 100,
            alpha: 0,
            duration: 500,
            onComplete: function () {
                flash.destroy();
            }
        });
    }
};

// Beacon configurations for each perk type
const BeaconConfigs = {
    DIVINE_BEACON: {
        beaconType: 'divine',
        symbol: '天',
        fontSize: '16px',
        color: '#FFD700',
        baseCooldown: 60000, // Half of old 120000
        maxBeacons: null, // Use playerLuck
        onCollect: function (beacon) {
            // Trigger hammer drop
            dropGodHammer.call(this);
        }
    },

    ANGEL_HONEY: {
        beaconType: 'honey',
        symbol: '蜜',
        fontSize: '20px',
        color: '#00CC00',
        baseCooldown: 40000, // Half of old 80000
        maxBeacons: null, // Use playerLuck
        onCollect: function (beacon) {
            // Heal player
            LifeSystem.heal(1);
        }
    },

    ALIEN_CLOCK: {
        beaconType: 'time',
        symbol: '時',
        fontSize: '20px',
        color: '#00FFFF',
        strokeColor: '#000000',
        strokeThickness: 2,
        baseCooldown: 60000, // Half of old 120000
        maxBeacons: null, // Use playerLuck
        onCollect: function (beacon) {
            // Calculate slow motion duration based on luck
            const slowdownDuration = Math.sqrt(playerLuck / BASE_STATS.LUK) * 1000;
            // Activate time dilation
            window.activateTimeDilation(slowdownDuration);
        }
    },

    STORM_BRINGER: {
        beaconType: 'storm',
        symbol: '嵐',
        fontSize: '24px',
        color: '#00DDFF',
        baseCooldown: 20000,
        maxBeacons: null, // Use playerLuck
        paddingX: 0.2, // Storm beacons use different padding
        paddingY: 0.2,
        strokeThickness: 2,
        onCollect: function (beacon) {
            // Create lightning storm
            const centerX = beacon.x;
            const centerY = beacon.y;
            const lightningCount = 8;
            const radius = 360;

            // Create first lightning at center
            createLightningStrike(this, centerX, centerY);

            // Create remaining lightning strikes with delays
            for (let i = 1; i < lightningCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * radius;
                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;

                this.time.delayedCall(i * 300, function () {
                    if (gameOver || gamePaused) return;
                    createLightningStrike(this, x, y);
                }, [], this);
            }

            // Create special storm collection effect
            const flash = this.add.circle(beacon.x, beacon.y, 50, 0x00DDFF, 0.7);
            window.registerEffect('entity', flash);

            this.tweens.add({
                targets: flash,
                radius: 200,
                alpha: 0,
                duration: 800,
                onComplete: function () {
                    flash.destroy();
                }
            });
        }
    }
};

// Export the system and configs
window.BeaconSystem = BeaconSystem;
window.BeaconConfigs = BeaconConfigs;