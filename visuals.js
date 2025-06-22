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

            // Skip if player doesn't exist
            if (!player || !player.active) return;

            // Random position within radius around player
            const angle = Math.random() * Math.PI * 2;
            const radius = maxRadius;
            const x = player.x + Math.cos(angle) * radius;
            const y = player.y + Math.sin(angle) * radius;

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