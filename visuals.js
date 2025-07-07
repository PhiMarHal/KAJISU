// visuals.js - Simple visual effects for Word Survivors
// Provides reusable visual effects to reduce code duplication

// Define a namespace for all visual effects
const VisualEffects = {
    // Create an explosion/pulse visual effect
    createExplosion: function (scene, x, y, radius, color = 0xFFFF00, options = {}) {
        // Default options
        const duration = options.duration ?? 1000;
        const startScale = options.startScale ?? 0.01;
        const strokeWidth = options.strokeWidth ?? 4;
        const alpha = options.alpha ?? 1;

        // Create the pulse circle with no fill by default
        const pulse = scene.add.circle(x, y, radius * 1, color, 0);

        // Set a stroke (outline) instead of a fill
        pulse.setStrokeStyle(strokeWidth, color, alpha);

        // Start with a very small scale
        pulse.setScale(startScale);

        // Animate from small to full size with fade-out
        scene.tweens.add({
            targets: pulse,
            scale: 1, // Expand to exactly the intended radius
            alpha: 0, // Fade out as it reaches full size
            duration: duration,
            ease: 'Power2', // Physics feel to the expansion
            onComplete: function () {
                pulse.destroy();
            }
        });

        // Return the pulse object for further customization if needed
        return pulse;
    },

    // Create a pulsing animation effect (for beacons, items, etc.)
    createPulsing: function (scene, target, options = {}) {
        // Default options
        const scaleFrom = options.scaleFrom ?? 0.9;
        const scaleTo = options.scaleTo ?? 1.1;
        const duration = options.duration ?? 1000;
        const yoyo = options.yoyo ?? true;
        const repeat = options.repeat ?? -1; // -1 means infinite loop
        const ease = options.ease ?? 'Sine.InOut';
        const delay = options.delay ?? 0;

        // Create the tween
        const tween = scene.tweens.add({
            targets: target,
            scale: { from: scaleFrom, to: scaleTo },
            duration: duration,
            yoyo: yoyo,
            repeat: repeat,
            ease: ease,
            delay: delay
        });

        // Return the tween in case the caller wants to modify it
        return tween;
    },

    createDamageFlash: function (scene, entity) {
        if (!entity || !entity.active) return;

        // Store original alpha if not already stored
        if (entity.originalAlpha === undefined) {
            entity.originalAlpha = entity.alpha;
        }

        // If there's already a damage animation in progress, stop it and reset alpha
        if (entity.damageAnimation && !entity.damageAnimation.isDestroyed) {
            entity.damageAnimation.stop();
            // Important: Reset alpha before starting new animation
            entity.alpha = entity.originalAlpha;
        }

        // Create a flash animation
        entity.damageAnimation = scene.tweens.add({
            targets: entity,
            alpha: { from: entity.originalAlpha, to: 0.3 },
            duration: 100,  // Faster fade-out
            yoyo: true,    // Return to original
            repeat: 1,     // Single blink
            onComplete: function () {
                // Ensure alpha is reset properly
                if (entity.active && !entity.alphaControlledByEffect) {
                    entity.alpha = entity.originalAlpha;
                }
                entity.damageAnimation = null;
            },
            onStop: function () {
                // Also handle alpha reset if animation is stopped prematurely
                if (entity.active && !entity.alphaControlledByEffect) {
                    entity.alpha = entity.originalAlpha;
                }
            }
        });

        return entity.damageAnimation;
    },

    // Add this to the VisualEffects object in visuals.js
    createLightningFlash: function (scene, x, y, options = {}) {
        // Default options
        const radius = options.radius ?? 48;  // 96px circle by default
        const color = options.color ?? 0xFFFF66; // Yellow-white color
        const alpha = options.alpha ?? 0.5;
        const duration = options.duration ?? 1000;

        // Create flash effect as a circle
        const flash = scene.add.circle(x, y, radius, color, alpha);

        // Animate fade-out with expansion
        scene.tweens.add({
            targets: flash,
            alpha: 0,
            radius: radius * 1.5, // Expand slightly
            duration: duration,
            onComplete: function () {
                flash.destroy();
            }
        });

        return flash;
    },

    // Add this to the VisualEffects object in visuals.js
    createLightningStrike: function (scene, x, y, options = {}) {
        // Default options
        const damage = options.damage ?? playerDamage;
        const color = options.color ?? '#FFDD00';
        const size = options.size ?? 32;
        const symbol = options.symbol ?? '雷';

        // Create the lightning bolt starting above the target
        const lightning = scene.add.text(x, y - 300, symbol, {
            fontFamily: 'Arial',
            fontSize: `${size}px`,
            color: color,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Add falling animation
        scene.tweens.add({
            targets: lightning,
            y: y,
            duration: 500,
            ease: 'Bounce.easeOut',
            onComplete: function () {
                // Create flash effect on impact
                VisualEffects.createLightningFlash(scene, x, y);

                // Create the actual dropper
                const dropConfig = {
                    symbol: symbol,
                    color: color,
                    fontSize: size,
                    x: x,
                    y: y,
                    behaviorType: 'persistent',
                    damage: damage,
                    damageInterval: 1000,
                    lifespan: 1000
                };

                DropperSystem.create(scene, dropConfig);

                // Remove the falling lightning
                lightning.destroy();
            }
        });

        return lightning;
    },

    createChargingEffect: function (scene, options = {}) {
        // Default options
        const symbol = options.symbol ?? '充';
        const fontSize = options.fontSize ?? '12px';
        const color = options.color ?? '#FFFF00';
        const duration = options.duration ?? 4000;
        const maxRadius = options.maxRadius ?? 32;

        // Support for targetEntity (like player) that gets evaluated fresh each time
        const targetEntity = options.targetEntity ?? player;
        const originX = options.originX ?? null; // Explicit coordinates override targetEntity
        const originY = options.originY ?? null;

        const startInterval = 400; // between spawns
        const endInterval = 60;    // 
        let currentInterval = startInterval;
        let elapsed = 0; // Track elapsed effect time (not real time)

        function spawnChargeKanji() {
            // Stop if game is over or duration reached
            if (gameOver || elapsed >= duration) return;

            // If paused, reschedule for later without advancing elapsed time
            if (gamePaused) {
                scene.time.delayedCall(16, spawnChargeKanji); // Check again in 16ms
                return;
            }

            // Evaluate position fresh each time (like player beams do)
            const centerX = originX ?? targetEntity.x;
            const centerY = originY ?? targetEntity.y;

            // Random position within radius around center
            const angle = Math.random() * Math.PI * 2;
            const radius = maxRadius;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            const text = scene.add.text(x, y, symbol, {
                fontFamily: 'Arial',
                fontSize: fontSize,
                color: color,
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(100);

            // Fade in and scale up, then fade out
            scene.tweens.add({
                targets: text,
                alpha: { from: 0, to: 0.8 },
                scale: { from: 0.8, to: 1.2 },
                duration: 600,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    scene.tweens.add({
                        targets: text,
                        alpha: 0,
                        scale: 1.4,
                        duration: 200,
                        onComplete: () => text.destroy()
                    });
                }
            });

            // NOW advance the elapsed time by the current interval
            elapsed += currentInterval;

            // Calculate next interval based on current progress
            const progress = elapsed / duration;
            currentInterval = startInterval + (endInterval - startInterval) * progress;

            // Schedule next spawn
            if (elapsed < duration) {
                scene.time.delayedCall(currentInterval, spawnChargeKanji);
            }
        }

        // Start the spawning sequence
        spawnChargeKanji();
    },

    createDeathAnimation: function (scene, enemy, options = {}) {
        if (!scene || !enemy) return;

        const enemyX = enemy.x;
        const enemyY = enemy.y;

        let color = 0xdddddd; // Default gray
        let enemySize = 32; // Default size

        // Detect enemy properties based on type
        if (enemy.enemyType === 'sprite') {
            // Sprite enemies from KanjiTextureSystem
            enemySize = enemy.actualWidth || enemy.actualHeight || 32;

            // Extract color from texture key: kanji_char_size_color
            if (enemy.texture && enemy.texture.key) {
                const parts = enemy.texture.key.split('_');
                if (parts.length >= 4) {
                    const colorHex = parts[parts.length - 1];
                    if (colorHex.match(/^[0-9a-f]{6}$/i)) {
                        color = parseInt('0x' + colorHex);
                    }
                }
            }
        } else {
            // Text-based enemies (bosses, etc.)
            if (enemy.style && enemy.style.fontSize) {
                enemySize = parseInt(enemy.style.fontSize);
            }

            if (enemy.style && enemy.style.color) {
                if (enemy.style.color.startsWith('#')) {
                    color = parseInt('0x' + enemy.style.color.substring(1));
                }
            } else if (enemy.fillColor !== undefined) {
                color = enemy.fillColor;
            }
        }

        // Override with tint if present (status effects)
        if (enemy.tint !== undefined && enemy.tint !== 0xffffff) {
            color = enemy.tint;
        }

        const sizeScale = enemySize / 32;

        // Animation configuration
        const pieceCount = options.pieceCount ?? 4;
        const maxDistance = options.maxDistance ?? (200 * sizeScale);
        const animationDuration = options.duration ?? 1800;
        const fadeDelay = options.fadeDelay ?? 200;

        // Create debris pieces
        for (let i = 0; i < pieceCount; i++) {
            // Random piece dimensions (thin rectangles scaled by enemy size)
            const baseWidth = 2 * sizeScale;
            const width = Phaser.Math.FloatBetween(baseWidth, baseWidth * 2);
            const length = Phaser.Math.FloatBetween(width * 2, width * 8);

            // Create piece
            const piece = scene.add.rectangle(enemyX, enemyY, length, width, color);
            piece.setDepth(10);

            // Random trajectory
            const angle = Math.random() * Math.PI * 2;
            const distance = Phaser.Math.FloatBetween(maxDistance * 0.2, maxDistance);
            const targetX = enemyX + Math.cos(angle) * distance;
            const targetY = enemyY + Math.sin(angle) * distance;

            // Random rotation
            const initialRotation = Math.random() * Math.PI * 4;
            const rotationSpeed = Phaser.Math.FloatBetween(-16, 16);
            const spinDuration = Phaser.Math.Between(200, 1400);

            piece.setRotation(initialRotation);

            // Movement animation
            scene.tweens.add({
                targets: piece,
                x: targetX,
                y: targetY,
                duration: animationDuration * 0.7,
                ease: 'Quad.easeOut'
            });

            // Spinning animation
            scene.tweens.add({
                targets: piece,
                rotation: piece.rotation + (rotationSpeed * spinDuration / 1000),
                duration: spinDuration,
                ease: 'Power2.easeOut'
            });

            // Fade out animation
            scene.tweens.add({
                targets: piece,
                alpha: { from: 1, to: 0 },
                duration: animationDuration - fadeDelay,
                delay: fadeDelay,
                ease: 'Quad.easeIn',
                onComplete: function () {
                    if (piece.active) {
                        piece.destroy();
                    }
                }
            });

            // Safety cleanup
            scene.time.delayedCall(animationDuration + 100, () => {
                if (piece && piece.active) {
                    piece.destroy();
                }
            });
        }
    },

    // Add this function to the VisualEffects object in visuals.js
    createPowerBoostEffect: function (scene, x, y, duration) {
        // Create golden halo using the hero character itself
        const halo = scene.add.text(x, y, HERO_CHARACTER, {
            fontFamily: 'Arial',
            fontSize: '36px',
            color: '#FFD700'
        }).setOrigin(0.5).setAlpha(1);

        // Position in front of the player
        halo.setDepth(player.depth + 1);

        // Register for cleanup
        window.registerEffect('entity', halo);

        // Create pulsing animation
        const pulseAnimation = VisualEffects.createPulsing(scene, halo, {
            scaleFrom: 1.0,
            scaleTo: 1.2,
            duration: 200,
            ease: 'Sine.InOut'
        });

        // Update halo position to follow player
        const updateTimer = scene.time.addEvent({
            delay: 8, // High frequency for smooth following
            callback: function () {
                if (halo.active && player.active) {
                    halo.x = player.x;
                    halo.y = player.y;
                    // Match player's current font size and scale slightly larger
                    const playerSize = parseInt(player.style.fontSize) || 32;
                    halo.setFontSize(playerSize * 1.1);
                }
            },
            repeat: Math.floor(duration / 8),
            callbackScope: scene
        });

        window.registerEffect('timer', updateTimer);

        // Remove halo when duration expires
        scene.time.delayedCall(duration, function () {
            // Stop pulsing animation
            if (pulseAnimation && !pulseAnimation.isDestroyed) {
                pulseAnimation.stop();
            }

            // Fade out halo
            if (halo.active) {
                scene.tweens.add({
                    targets: halo,
                    alpha: 0,
                    scale: 2,
                    duration: 500,
                    onComplete: function () {
                        halo.destroy();
                    }
                });
            }
        });

        return { halo, pulseAnimation };
    },

    convertToColorValue: function (color) {
        // If it's already a number, return it directly
        if (typeof color === 'number') {
            return color;
        }

        // If it's a string in hex format (e.g., '#FF0000' or 'FF0000')
        if (typeof color === 'string') {
            // Remove # prefix if present
            const hex = color.startsWith('#') ? color.substring(1) : color;
            // Convert hex string to number
            return parseInt(hex, 16);
        }

        // Default to white if conversion fails
        return 0xFFFFFF;
    }

    // Additional visual effects can be added here
};

// Export the entire namespace to window
window.VisualEffects = VisualEffects;