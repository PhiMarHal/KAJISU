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