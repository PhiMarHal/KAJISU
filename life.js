// life.js - Health and life management system for KAJISU
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

    // Regenerate health (used by timer)
    regenerateHealth: function () {
        // This function is called with scene as context (via callbackScope)
        if (gameOver || gamePaused) return;

        // Use the heal function for +1 HP
        LifeSystem.heal(1);
    },

    // Heal the player by a specific amount
    heal: function (hp) {
        // Get the active scene
        const scene = game.scene.scenes[0];

        // Add HP (capped at max)
        playerHealth = Math.min(playerHealth + hp, maxPlayerHealth);

        // Update health bar
        GameUI.updateHealthBar(scene);

        // Show visual effect using the same function as regeneration
        this.showRegenEffect(scene);
    },

    // Show visual effect for health regeneration
    showRegenEffect: function (scene) {
        // Ensure we have a valid scene and player
        if (!scene || !scene.add || !player || !player.active) return;

        // Create a healing indicator using the kanji for "heal"
        const healEffect = scene.add.text(player.x, player.y - 20, '癒', {
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
        LifeSystem.heal(maxPlayerHealth);
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