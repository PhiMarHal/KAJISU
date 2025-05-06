// life.js - Health and life management system for Word Survivors
// Manages player health regeneration and healing

// LifeSystem namespace
const LifeSystem = {
    // State tracking
    healthRegenTimer: null,
    isInitialized: false,

    // Initialize the life system
    initialize: function (scene) {
        // Skip if already initialized
        if (this.isInitialized) return;

        // Set up health regeneration
        this.setupHealthRegeneration(scene);

        // Mark as initialized
        this.isInitialized = true;

        console.log("Life system initialized");
    },

    // Setup health regeneration
    setupHealthRegeneration: function (scene) {
        // Calculate delay based on max health (100s / maxHealth)
        const regenDelay = Math.ceil(100000 / maxPlayerHealth); // In milliseconds

        // Remove any existing regen timer
        if (this.healthRegenTimer) {
            this.healthRegenTimer.remove();
        }

        // Create and register health regeneration timer
        this.healthRegenTimer = registerTimer(scene.time.addEvent({
            delay: regenDelay,
            callback: this.regenerateHealth,
            callbackScope: scene,
            loop: true
        }));

        GameUI.updateHealthBar(scene);

        console.log(`Health regeneration timer set: +1 HP every ${regenDelay / 1000} seconds`);
    },

    // Regenerate health
    regenerateHealth: function () {
        // This function is called with scene as context (via callbackScope)
        if (gameOver || gamePaused) return;

        // Only regenerate if health is below max
        if (playerHealth < maxPlayerHealth) {
            // Add 1 HP
            playerHealth = Math.min(playerHealth + 1, maxPlayerHealth);

            // Update health bar and text
            GameUI.updateHealthBar(this);

            // Show visual effect
            LifeSystem.showRegenEffect(this);
        }
    },

    // Show visual effect for health regeneration
    showRegenEffect: function (scene) {
        // Create a healing indicator
        const healEffect = scene.add.text(player.x, player.y - 20, '+1', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#00ff00'
        }).setOrigin(0.5);

        // Animate the healing indicator
        scene.tweens.add({
            targets: healEffect,
            y: healEffect.y - 15,
            alpha: 0,
            duration: 800,
            onComplete: function () {
                healEffect.destroy();
            }
        });
    },

    // Fully heal the player
    fullHeal: function () {
        // Set health to maximum
        playerHealth = maxPlayerHealth;

        // Update the health bar (get active scene)
        const scene = game.scene.scenes[0];
        if (scene) {
            GameUI.updateHealthBar(scene);

            // Show healing particles or effect
            const healEffect = scene.add.text(player.x, player.y - 40, '+HEAL', {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#00ff00'
            }).setOrigin(0.5);

            // Animate the effect
            scene.tweens.add({
                targets: healEffect,
                y: healEffect.y - 30,
                alpha: 0,
                duration: 1000,
                onComplete: function () {
                    healEffect.destroy();
                }
            });
        }
    },

    // Reset the life system (call during game restart)
    reset: function () {
        // Remove health regen timer
        if (this.healthRegenTimer) {
            this.healthRegenTimer.remove();
            this.healthRegenTimer = null;
        }

        // Reset state
        this.isInitialized = false;

        console.log("Life system reset");
    }
};

// Export for use in other files
window.LifeSystem = LifeSystem;

// Export legacy function reference to maintain backward compatibility
window.fullHeal = LifeSystem.fullHeal;