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
    }

    // Additional visual effects can be added here
};

// Export the entire namespace to window
window.VisualEffects = VisualEffects;