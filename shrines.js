// Shrine System for Word Survivors
// Manages immovable shrine objects with area effects that trigger when player enters

const ShrineSystem = {
    // Create a standardized shrine spawning component
    createShrineComponent: function (config) {
        const defaults = {
            shrineType: 'generic',
            symbol: '⛩',
            fontSize: '32px',
            color: '#FFD700',
            strokeColor: '#000000',
            strokeThickness: 2,
            baseCooldown: 16000, // 16 seconds default
            cooldownStat: 'luck',
            cooldownFormula: 'sqrt',
            paddingX: 0.1, // 10% padding from edges
            paddingY: 0.1,
            lifespan: null, // Will be calculated as playerLuck * 1000
            baseAuraRadius: 64, // Base radius for 4 luck (halved from 128)
            auraColor: 0xFFD700, // Color of aura visual
            auraAlpha: 0.3, // Transparency of aura
            effectInterval: 1000, // How often effect triggers (ms)
            onEnterAura: function () { }, // Called when player enters aura
            onExitAura: function () { }, // Called when player exits aura
            onEffectTrigger: function () { }, // Called periodically while in aura
            shadowConfig: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 4,
                stroke: true,
                fill: false
            }
        };

        const shrineConfig = { ...defaults, ...config };

        return {
            // Store timer reference and config
            shrineTimer: null,
            config: shrineConfig,
            activeShrines: [], // Track active shrines for this component

            initialize: function (player) {
                // Get the scene
                const scene = game.scene.scenes[0];
                if (!scene) return;

                // Store reference to this component for the callback
                const shrineComponent = this;

                // Create and register timer
                this.shrineTimer = CooldownManager.createTimer({
                    statName: this.config.cooldownStat,
                    baseCooldown: this.config.baseCooldown,
                    formula: this.config.cooldownFormula,
                    component: this,
                    callback: function () {
                        // Call spawnShrine with proper context
                        shrineComponent.spawnShrine.call(scene, shrineComponent.config, shrineComponent);
                    },
                    callbackScope: scene,
                    loop: true
                });

                // Spawn first shrine immediately
                this.spawnShrine.call(scene, this.config, this);
            },

            spawnShrine: function (config, component) {
                // Skip if game is over or paused
                if (gameOver || gamePaused) return;

                // Calculate dynamic values based on current player stats
                const actualLifespan = config.lifespan ?? (playerLuck * 1000);
                const actualAuraRadius = config.baseAuraRadius * Math.sqrt(playerLuck / BASE_STATS.LUK);

                // Calculate spawn position with padding
                const x = Phaser.Math.Between(
                    game.config.width * config.paddingX,
                    game.config.width * (1 - config.paddingX)
                );
                const y = Phaser.Math.Between(
                    game.config.height * config.paddingY,
                    game.config.height * (1 - config.paddingY)
                );

                // Create the shrine
                const shrine = this.add.text(x, y, config.symbol, {
                    fontFamily: 'Arial',
                    fontSize: config.fontSize,
                    color: config.color,
                    stroke: config.strokeColor,
                    strokeThickness: config.strokeThickness,
                    shadow: config.shadowConfig
                }).setOrigin(0.5);

                // Create aura visual using calculated radius
                const aura = this.add.circle(x, y, actualAuraRadius, config.auraColor, config.auraAlpha);
                aura.setStrokeStyle(2, config.auraColor, 0.6);

                // Add physics body to shrine
                this.physics.world.enable(shrine);
                shrine.body.setSize(shrine.width * 0.8, shrine.height * 0.8);
                shrine.body.immovable = true;

                // Add physics body to aura for overlap detection using calculated radius
                this.physics.world.enable(aura);
                aura.body.setCircle(actualAuraRadius);
                aura.body.immovable = true;

                // Mark shrine type and create unique ID
                shrine.shrineType = config.shrineType;
                shrine.shrineId = `${config.shrineType}_${Date.now()}_${Math.random()}`;
                shrine.aura = aura;
                shrine.playerInAura = false;
                shrine.effectTimer = null;
                shrine.actualAuraRadius = actualAuraRadius; // Store for later use
                shrine.config = config; // Store config reference for cleanup

                // Link aura back to shrine
                aura.shrine = shrine;

                // Add to component's active shrines list
                component.activeShrines.push(shrine);

                // Register for cleanup
                window.registerEffect('entity', shrine);
                window.registerEffect('entity', aura);

                // Add overlap detection with player for aura
                const overlapCollider = this.physics.add.overlap(aura, player, function (aura, player) {
                    const shrine = aura.shrine;

                    // Only trigger if player wasn't already in aura
                    if (!shrine.playerInAura) {
                        shrine.playerInAura = true;

                        // Call onEnterAura effect
                        config.onEnterAura.call(this, shrine);

                        // Start effect timer if effectInterval is set
                        if (config.effectInterval > 0) {
                            shrine.effectTimer = this.time.addEvent({
                                delay: config.effectInterval,
                                callback: function () {
                                    if (shrine.playerInAura && shrine.active && !gameOver && !gamePaused) {
                                        config.onEffectTrigger.call(this, shrine);
                                    }
                                },
                                callbackScope: this,
                                loop: true
                            });

                            // Register effect timer
                            window.registerEffect('timer', shrine.effectTimer);
                        }
                    }
                }.bind(this), null, this);

                // Store overlap collider reference for cleanup
                shrine.overlapCollider = overlapCollider;

                // Add pulsing animation to shrine
                VisualEffects.createPulsing(this, shrine, {
                    scaleFrom: 0.95,
                    scaleTo: 1.05,
                    duration: 2000
                });

                // Add subtle pulsing to aura
                VisualEffects.createPulsing(this, aura, {
                    scaleFrom: 0.98,
                    scaleTo: 1.02,
                    duration: 3000
                });

                // Set up shrine destruction timer using calculated lifespan
                const destructionTimer = this.time.delayedCall(actualLifespan, function () {
                    ShrineSystem.destroyShrine(shrine, component);
                });

                // Register destruction timer
                window.registerEffect('timer', destructionTimer);
                shrine.destructionTimer = destructionTimer;

                // Set up update loop to check if player left aura
                const updateTimer = this.time.addEvent({
                    delay: 100, // Check every 100ms
                    callback: function () {
                        if (!shrine.active || gameOver || gamePaused) return;

                        // Check if player is still in aura
                        if (shrine.playerInAura) {
                            const dx = player.x - shrine.x;
                            const dy = player.y - shrine.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);

                            // If player left aura
                            if (distance > shrine.actualAuraRadius) {
                                shrine.playerInAura = false;

                                // Stop effect timer
                                if (shrine.effectTimer) {
                                    shrine.effectTimer.remove();
                                    shrine.effectTimer = null;
                                }

                                // Call onExitAura effect
                                config.onExitAura.call(this, shrine);
                            }
                        }
                    },
                    callbackScope: this,
                    loop: true
                });

                // Register update timer
                window.registerEffect('timer', updateTimer);
                shrine.updateTimer = updateTimer;

                return shrine;
            },

            cleanup: function (player) {
                // Remove timer
                if (this.shrineTimer) {
                    CooldownManager.removeTimer(this.shrineTimer);
                    this.shrineTimer = null;
                }

                // Clean up all active shrines
                this.activeShrines.forEach(shrine => {
                    if (shrine && shrine.active) {
                        ShrineSystem.destroyShrine(shrine, this);
                    }
                });
                this.activeShrines = [];
            }
        };
    },

    // Destroy a shrine and clean up all associated elements
    destroyShrine: function (shrine, component) {
        if (!shrine || !shrine.active) return;

        // Remove from component's active list
        if (component && component.activeShrines) {
            const index = component.activeShrines.indexOf(shrine);
            if (index !== -1) {
                component.activeShrines.splice(index, 1);
            }
        }

        // Call exit effect if player was in aura
        if (shrine.playerInAura && shrine.config) {
            shrine.config.onExitAura.call(shrine.scene, shrine);
        }

        // Clean up timers
        if (shrine.effectTimer) {
            shrine.effectTimer.remove();
            shrine.effectTimer = null;
        }

        if (shrine.updateTimer) {
            shrine.updateTimer.remove();
            shrine.updateTimer = null;
        }

        if (shrine.destructionTimer) {
            shrine.destructionTimer.remove();
            shrine.destructionTimer = null;
        }

        // Remove overlap collider
        if (shrine.overlapCollider) {
            shrine.overlapCollider.destroy();
        }

        // Create destruction effect
        if (shrine.scene && shrine.scene.tweens) {
            // Fade out shrine
            shrine.scene.tweens.add({
                targets: shrine,
                alpha: 0,
                scale: 0.5,
                duration: 500,
                onComplete: function () {
                    if (shrine.active) shrine.destroy();
                }
            });

            // Fade out aura
            if (shrine.aura && shrine.aura.active) {
                shrine.scene.tweens.add({
                    targets: shrine.aura,
                    alpha: 0,
                    scale: 1.5,
                    duration: 500,
                    onComplete: function () {
                        if (shrine.aura.active) shrine.aura.destroy();
                    }
                });
            }
        } else {
            // Fallback cleanup
            shrine.destroy();
            if (shrine.aura && shrine.aura.active) {
                shrine.aura.destroy();
            }
        }
    }
};

// Shrine configurations for different perk types
const ShrineConfigs = {
    BERSERK_SHRINE: {
        shrineType: 'berserk',
        symbol: '怒',
        fontSize: '40px',
        color: '#FF0000',
        baseCooldown: 16000, // 16 seconds
        baseAuraRadius: 64, // Base radius for luck scaling (halved)
        auraColor: 0xFF0000,
        effectInterval: 0, // No periodic effect, just enter/exit
        onEnterAura: function (shrine) {
            berserkMultiplier += 1.0;
            console.log("Entered berserk shrine - damage boost active!");
            GameUI.updateStatCircles(shrine.scene);
        },
        onExitAura: function (shrine) {
            berserkMultiplier -= 1.0;
            if (berserkMultiplier < 1.0) berserkMultiplier = 1.0;
            console.log("Left berserk shrine - damage boost ended");
            GameUI.updateStatCircles(shrine.scene);
        }
    },

    ARCHER_SHRINE: {
        shrineType: 'archer',
        symbol: '弓',
        fontSize: '40px',
        color: '#00FF00',
        baseCooldown: 16000, // 16 seconds
        baseAuraRadius: 64, // Base radius for luck scaling (halved)
        auraColor: 0x00FF00,
        effectInterval: 0, // No periodic effect, just enter/exit
        onEnterAura: function (shrine) {
            archerMultiplier += 1.0;
            console.log("Entered archer shrine - fire rate boost active!");
            GameUI.updateStatCircles(shrine.scene);
            WeaponSystem.updateFiringRate(shrine.scene);
        },
        onExitAura: function (shrine) {
            archerMultiplier -= 1.0;
            if (archerMultiplier < 1.0) archerMultiplier = 1.0;
            console.log("Left archer shrine - fire rate boost ended");
            GameUI.updateStatCircles(shrine.scene);
            WeaponSystem.updateFiringRate(shrine.scene);
        }
    },

    HEALING_SHRINE: {
        shrineType: 'healing',
        symbol: '癒',
        fontSize: '40px',
        color: '#00FFFF',
        baseCooldown: 24000,
        baseAuraRadius: 64, // Base radius for luck scaling (halved)
        auraColor: 0x00FFFF,
        effectInterval: 1000, // Heal every second
        onEnterAura: function (shrine) {
            console.log("Entered healing shrine - regeneration active!");
        },
        onExitAura: function (shrine) {
            console.log("Left healing shrine - regeneration ended");
        },
        onEffectTrigger: function (shrine) {
            if (playerHealth < maxPlayerHealth) {
                LifeSystem.heal(1);

                // Create heal visual effect
                const healText = shrine.scene.add.text(player.x, player.y - 30, '+1', {
                    fontFamily: 'Arial',
                    fontSize: '20px',
                    color: '#00FFFF',
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(0.5);

                shrine.scene.tweens.add({
                    targets: healText,
                    y: healText.y - 50,
                    alpha: 0,
                    duration: 1000,
                    onComplete: function () {
                        healText.destroy();
                    }
                });
            }
        }
    },

    STORM_SHRINE: {
        shrineType: 'storm',
        symbol: '雷',
        fontSize: '40px',
        color: '#FFFF00',
        baseCooldown: 16000, // 16 seconds
        baseAuraRadius: 64, // Base radius for luck scaling (halved)
        auraColor: 0xFFFF00,
        effectInterval: 200, // Lightning every 200ms
        onEnterAura: function (shrine) {
            console.log("Entered storm shrine - lightning storm active!");
        },
        onExitAura: function (shrine) {
            console.log("Left storm shrine - lightning storm ended");
        },
        onEffectTrigger: function (shrine) {
            // Create lightning at random position on screen
            const x = Phaser.Math.Between(
                game.config.width * 0.1,
                game.config.width * 0.9
            );
            const y = Phaser.Math.Between(
                game.config.height * 0.1,
                game.config.height * 0.9
            );

            createLightningStrike(shrine.scene, x, y);
        }
    },

    GOD_HAMMER_SHRINE: {
        shrineType: 'godHammer',
        symbol: '鎚',
        fontSize: '40px',
        color: '#FFD700',
        baseCooldown: 24000,
        baseAuraRadius: 64, // Base radius for luck scaling (halved)
        auraColor: 0xFFD700,
        effectInterval: 2000, // God hammer every 2 seconds
        onEnterAura: function (shrine) {
            console.log("Entered god hammer shrine - divine hammers active!");
        },
        onExitAura: function (shrine) {
            console.log("Left god hammer shrine - divine hammers ended");
        },
        onEffectTrigger: function (shrine) {
            dropGodHammer.call(shrine.scene);
        }
    }
};

// Export the system and configs
window.ShrineSystem = ShrineSystem;
window.ShrineConfigs = ShrineConfigs;