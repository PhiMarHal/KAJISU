// One-Time Effect System for Word Survivors
// Handles effects that occur once when a perk is acquired

// Registry of one-time effects
const OneTimeEffects = {
    // Renamed to 終焉 (The End/Final Catastrophe)
    // Renamed to 終焉 (The End/Final Catastrophe)
    shuuen: function (scene) {
        if (!scene) return;

        // Create visual effect first
        const flash = scene.add.rectangle(600, 400, 1200, 800, 0xFFFFFF, 0.8);
        flash.setDepth(1000); // Ensure it appears on top

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
            const megaDamage = playerDamage * 50; // Extremely high damage

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
                radius: 1600, // Expand to cover the screen
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
                const delay = distance / 2; // 2 pixels per ms propagation

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
                        0 // No cooldown needed for one-time catastrophic event
                    );

                    // The visual effects will still run regardless of whether the enemy dies
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
            const boomText = scene.add.text(600, 400, '終焉', {
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

    // Purple Chaos effect - moved from perks.js
    purpleChaos: function (scene) {
        // Store current stat values
        const stats = {
            damage: playerDamage,
            health: maxPlayerHealth,
            luck: playerLuck,
            fireRate: playerFireRate
        };

        // Create an array of stat names
        const statNames = Object.keys(stats);

        // Shuffle the array
        for (let i = statNames.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [statNames[i], statNames[j]] = [statNames[j], statNames[i]];
        }

        // Create a shuffled mapping
        const newValues = {};
        const originalOrder = ['damage', 'health', 'luck', 'fireRate'];

        for (let i = 0; i < originalOrder.length; i++) {
            newValues[originalOrder[i]] = stats[statNames[i]];
        }

        // Apply the new values (need to reset first)
        window.modifyStat('damage', newValues.damage - playerDamage);
        window.modifyStat('health', newValues.health - maxPlayerHealth);
        window.modifyStat('luck', newValues.luck - playerLuck);
        window.modifyStat('fireRate', newValues.fireRate - playerFireRate);

        // Now add +2 to luck
        window.modifyStat('luck', 2);

        // Visual effect for chaos
        if (scene) {
            const chaosEffect = scene.add.text(player.x, player.y, '⚡ CHAOS! ⚡', {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#9932cc',
                stroke: '#ffffff',
                strokeThickness: 2
            }).setOrigin(0.5);

            scene.tweens.add({
                targets: chaosEffect,
                alpha: { from: 1, to: 0 },
                y: chaosEffect.y - 50,
                scale: { from: 1, to: 2 },
                duration: 1500,
                onComplete: function () {
                    chaosEffect.destroy();
                }
            });
        }
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

        // Calculate total stat points (1.5 per perk, rounded up)
        const totalStatPoints = Math.ceil(perkCount * 1.5);

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
        // Create a memory fade effect
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
                '記憶', // Memory in kanji
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
        PlayerComponentSystem.resetAll();
        OnHitEffectSystem.resetAll();
        OrbitalSystem.clearAll();
        DropperSystem.clearAll();

        // Add this line to reinitialize the player hit system:
        PlayerHitSystem.init(scene);

        // Set perk array to just this perk
        acquiredPerks = ['OBLIVION_BLOSSOM'];
    }

    // Add more one-time effects here as needed
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

// Export the effects registry if needed
window.OneTimeEffects = OneTimeEffects;