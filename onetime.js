// One-Time Effect System for KAJISU
// Handles effects that occur once when a perk is acquired

// Utility functions for stat manipulation
const StatManipulation = {
    // Get current stats as a structured object
    getCurrentStats: function () {
        return {
            damage: { value: playerDamage, name: 'damage' },
            fireRate: { value: playerFireRate, name: 'fireRate' },
            luck: { value: playerLuck, name: 'luck' },
            health: { value: maxPlayerHealth, name: 'health' }
        };
    },

    // Find highest and lowest stats with improved logic
    findExtremeStats: function () {
        const stats = this.getCurrentStats();
        const statArray = Object.values(stats);

        // Sort stats by value, maintaining original order for ties
        const sortedStats = [...statArray].sort((a, b) => {
            if (a.value !== b.value) {
                return a.value - b.value;
            }
            // For ties, maintain deterministic order based on stat name
            const nameOrder = ['damage', 'fireRate', 'luck', 'health'];
            return nameOrder.indexOf(a.name) - nameOrder.indexOf(b.name);
        });

        const lowest = sortedStats[0];
        const highest = sortedStats[sortedStats.length - 1];

        return { highest, lowest };
    },

    // Apply multiple stat changes efficiently
    applyStatChanges: function (changes) {
        Object.entries(changes).forEach(([statName, change]) => {
            window.modifyStat(statName, change);
        });
    }
};


// Registry of one-time effects
const OneTimeEffects = {
    shuuen: function (scene) {
        if (!scene) return;

        // Create visual effect first
        const flash = scene.add.rectangle(
            game.config.width / 2,
            game.config.height / 2,
            game.config.width,
            game.config.height,
            0xFFFFFF, 0.8
        );
        flash.setDepth(1000);

        // Flash animation
        scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            onComplete: function () {
                flash.destroy();
            }
        });

        // Apply damage after a slight delay for visual effect
        scene.time.delayedCall(100, function () {
            // Get all active enemies on screen
            const allEnemies = EnemySystem.enemiesGroup.getChildren();
            if (!allEnemies || allEnemies.length === 0) return;

            // Calculate massive damage
            const megaDamage = playerDamage * 50;

            // Calculate shockwave origin (player position)
            const originX = player.x;
            const originY = player.y;

            // Create a unique damage source ID for this catastrophic event
            const catastropheId = `shuuen_${Date.now()}_${Math.random()}`;

            // Create shockwave visual
            const shockwave = scene.add.circle(originX, originY, 10, 0xFF3300, 0.7);

            // Expand shockwave
            scene.tweens.add({
                targets: shockwave,
                radius: Math.max(game.config.width, game.config.height) * 1.2,
                alpha: 0,
                duration: 1600,
                onComplete: function () {
                    shockwave.destroy();
                }
            });

            // Apply damage to all enemies with delay based on distance
            allEnemies.forEach(enemy => {
                if (!enemy.active) return;

                // Calculate distance from player
                const dx = enemy.x - originX;
                const dy = enemy.y - originY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Create a small delay based on distance for wave effect
                const delay = distance / 2;

                // Apply damage after delay
                scene.time.delayedCall(delay, function () {
                    if (!enemy.active) return;

                    // Create a unique sub-ID for each enemy to ensure they all take damage
                    const enemySpecificId = `${catastropheId}_${enemy.x}_${enemy.y}`;

                    // Apply damage using the contact damage system
                    applyContactDamage.call(
                        scene,
                        {
                            damageSourceId: enemySpecificId,
                            damage: megaDamage,
                            active: true
                        },
                        enemy,
                        megaDamage,
                        0
                    );

                    // Visual effects
                    scene.tweens.add({
                        targets: enemy,
                        alpha: 0.2,
                        scale: 1.5,
                        duration: 200,
                        yoyo: true
                    });
                });

                // Create small explosion effect at each enemy
                scene.time.delayedCall(delay, function () {
                    if (!enemy.active) return;

                    const explosion = scene.add.circle(enemy.x, enemy.y, 30, 0xFF3300, 0.7);
                    scene.tweens.add({
                        targets: explosion,
                        radius: 60,
                        alpha: 0,
                        duration: 300,
                        onComplete: function () {
                            explosion.destroy();
                        }
                    });
                });
            });

            // Add dramatic sound effect text
            const boomText = scene.add.text(
                game.config.width / 2,
                game.config.height / 2,
                '終焉', {
                fontFamily: 'Arial',
                fontSize: '80px',
                color: '#FF3300',
                stroke: '#000000',
                strokeThickness: 6
            }).setOrigin(0.5);

            // Animate the text
            scene.tweens.add({
                targets: boomText,
                scale: 2,
                alpha: 0,
                duration: 1000,
                onComplete: function () {
                    boomText.destroy();
                }
            });
        });
    },

    purpleChaos: function (scene) {
        // Get current stats
        const stats = StatManipulation.getCurrentStats();
        const statNames = Object.keys(stats);
        const statValues = Object.values(stats).map(s => s.value);

        // Shuffle the values
        for (let i = statValues.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [statValues[i], statValues[j]] = [statValues[j], statValues[i]];
        }

        // Create change map
        const changes = {};
        statNames.forEach((name, i) => {
            changes[name] = statValues[i] - stats[name].value;
        });

        // Add +2 luck bonus
        changes.luck += 2;

        // Apply all changes
        StatManipulation.applyStatChanges(changes);

        // Visual effect
        VisualEffects.createStatChangeEffect(scene, '⚡ CHAOS! ⚡', '#9932cc');
    },

    indigoSwitch: function (scene) {
        // Find highest and lowest stats
        const { highest, lowest } = StatManipulation.findExtremeStats();

        // Handle edge case where all stats are equal
        if (highest.value === lowest.value) {
            // If all stats are equal, just give +1 to two different stats
            const changes = {};
            changes[highest.name] = 1;
            // Pick a different stat for the second bonus
            const statNames = ['damage', 'fireRate', 'luck', 'health'];
            const secondStat = statNames.find(name => name !== highest.name);
            changes[secondStat] = 1;

            StatManipulation.applyStatChanges(changes);

            // Visual effect
            VisualEffects.createStatChangeEffect(scene, '藍切替', '#B19CD9');

            console.log(`Indigo Switch: All stats equal (${highest.value}), gave +1 to ${highest.name} and ${secondStat}`);
            return;
        }

        // Normal case: swap values and add +1 to both
        const changes = {};
        changes[highest.name] = (lowest.value + 1) - highest.value;
        changes[lowest.name] = (highest.value + 1) - lowest.value;

        // Apply the changes
        StatManipulation.applyStatChanges(changes);

        // Visual effect with new color
        VisualEffects.createStatChangeEffect(scene, '藍切替', '#B19CD9');

        console.log(`Indigo Switch: Swapped ${highest.name} (${highest.value}) with ${lowest.name} (${lowest.value}), added +1 to both`);
    },

    oblivionBlossom: function (scene) {
        if (!scene) return;

        // Count current perks before removing them
        const perkCount = acquiredPerks.length;

        // Reset stats to base values
        playerDamage = BASE_STATS.POW;
        maxPlayerHealth = BASE_STATS.END;
        playerLuck = BASE_STATS.LUK;
        playerFireRate = BASE_STATS.AGI;

        // Also reset current health to match new max
        playerHealth = maxPlayerHealth;

        // Update UI to reflect new values
        GameUI.updateHealthBar(scene);
        LifeSystem.setupHealthRegeneration(scene);

        // Calculate total stat points (1.4 per perk, rounded up)
        const totalStatPoints = Math.ceil(perkCount * 1.4);

        // Distribute points randomly among all stats
        for (let i = 0; i < totalStatPoints; i++) {
            const statChoice = Math.floor(Math.random() * 4);
            switch (statChoice) {
                case 0:
                    window.modifyStat('damage', 1);
                    break;
                case 1:
                    window.modifyStat('health', 1);
                    break;
                case 2:
                    window.modifyStat('luck', 1);
                    break;
                case 3:
                    window.modifyStat('fireRate', 1);
                    break;
            }
        }

        // Create a visual effect for the transformation
        const forgottenText = scene.add.text(player.x, player.y, '忘', {
            fontFamily: 'Arial',
            fontSize: '64px',
            color: '#BBBBFF',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Animate the kanji for "forget"
        scene.tweens.add({
            targets: forgottenText,
            alpha: { from: 1, to: 0 },
            y: forgottenText.y - 100,
            scale: { from: 1, to: 3 },
            duration: 2000,
            onComplete: function () {
                forgottenText.destroy();
            }
        });

        // Create particle effects for each memory lost
        for (let i = 0; i < perkCount; i++) {
            const angle = (i / perkCount) * Math.PI * 2;
            const distance = 100;

            const memory = scene.add.text(
                player.x + Math.cos(angle) * distance,
                player.y + Math.sin(angle) * distance,
                '記憶',
                {
                    fontFamily: 'Arial',
                    fontSize: '24px',
                    color: '#DDDDFF'
                }
            ).setOrigin(0.5);

            // Animate memory particles fading away
            scene.tweens.add({
                targets: memory,
                scale: 0,
                alpha: 0,
                duration: 1500,
                delay: i * 100,
                onComplete: function () {
                    memory.destroy();
                }
            });
        }

        // Clear all perk effects
        window.clearAllPerkEffects();

        // Reset component systems
        CooldownManager.initialize();
        PlayerComponentSystem.resetAll();
        OnHitEffectSystem.resetAll();
        OrbitalSystem.clearAll();
        DropperSystem.clearAll();
        BeamSystem.clearAll();

        // Reinitialize the player hit system
        PlayerHitSystem.init(scene);

        // Set perk array to just this perk
        acquiredPerks = ['OBLIVION_BLOSSOM'];
    }
};

// Main interface function to trigger one-time effects
window.triggerOneTimeEffect = function (effectName) {
    const scene = game.scene.scenes[0];

    // Check if the effect exists
    if (OneTimeEffects[effectName]) {
        // Call the effect function
        OneTimeEffects[effectName](scene);
        return true;
    }

    console.log(`One-time effect '${effectName}' not found`);
    return false;
};

// Export the effects registry and utilities
window.OneTimeEffects = OneTimeEffects;
window.StatManipulation = StatManipulation;