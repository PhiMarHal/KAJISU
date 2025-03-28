// Hero kanji with readings and translation
const HERO_CHARACTER = '勇';
const HERO_HIRAGANA = 'ゆう';
const HERO_ROMAJI = 'yuu';
const HERO_ENGLISH = 'Brave';

// Base player stats
const BASE_STATS = {
    POW: 4,
    AGI: 4,
    LUK: 4,
    END: 4,
};

// Player Status Component System for Word Survivors
// This system manages special behaviors and status effects for the player

// Player status component system
const PlayerComponentSystem = {
    // Component definitions
    componentTypes: {},

    // Active components on player
    activeComponents: {},

    // Register a new component type
    registerComponent: function (name, componentDef) {
        this.componentTypes[name] = componentDef;
    },

    // Add a component to the player
    addComponent: function (componentName, config = {}) {
        // Skip if component already exists or type not registered
        if (this.activeComponents[componentName] || !this.componentTypes[componentName]) {
            return false;
        }

        // Create component from registered type
        const componentDef = this.componentTypes[componentName];
        const component = { ...componentDef };

        // Apply configuration
        Object.assign(component, config);

        // Store component reference
        this.activeComponents[componentName] = component;

        // Call initialize function if it exists
        if (component.initialize) {
            component.initialize(player);
        }

        return true;
    },

    // Remove a component from the player
    removeComponent: function (componentName) {
        const component = this.activeComponents[componentName];
        if (!component) return false;

        // Call cleanup function if it exists
        if (component.cleanup) {
            component.cleanup(player);
        }

        // Remove the component
        delete this.activeComponents[componentName];
        return true;
    },

    // Process a specific event for all components
    processEvent: function (eventName, ...args) {
        // Call the event handler on each component that has it
        Object.values(this.activeComponents).forEach(component => {
            if (component[eventName]) {
                component[eventName](player, ...args);
            }
        });
    },

    // Check if a component is active
    hasComponent: function (componentName) {
        return !!this.activeComponents[componentName];
    },

    // Get an active component
    getComponent: function (componentName) {
        return this.activeComponents[componentName];
    },

    // Reset all components
    resetAll: function () {
        // Clean up each component
        Object.keys(this.activeComponents).forEach(name => {
            this.removeComponent(name);
        });

        // Ensure activeComponents is empty
        this.activeComponents = {};
    }
};

// Register component for berserker state (Crimson Fury)
PlayerComponentSystem.registerComponent('berserkerState', {
    // Store original values for restoration
    originalColor: null,
    damageMultiplier: 2.0,
    colorTween: null,

    initialize: function (player) {
        console.log("Activating berserker state");

        // Store original color
        this.originalColor = player.style.color || '#ffffff';

        // Create color pulsing tween
        const scene = game.scene.scenes[0];
        if (scene) {
            this.colorTween = scene.tweens.add({
                targets: player,
                colorTween: { from: 0, to: 1 },
                duration: 1000, // 1 second in each direction
                yoyo: true,
                repeat: -1,
                onUpdate: function (tween, target) {
                    // Interpolate between white and red based on tween value
                    const value = target.colorTween;
                    const r = Math.floor(255); // Red always at max
                    const g = Math.floor(255 * (1 - value)); // Green reduces to 0
                    const b = Math.floor(255 * (1 - value)); // Blue reduces to 0

                    player.setColor(`rgb(${r},${g},${b})`);
                }
            });
        }

        // Set global berserk multiplier
        berserkMultiplier = this.damageMultiplier;

        // Update player stats display to show new values
        updatePlayerStatsText();
    },

    update: function (player) {
        // Check if we should deactivate (health above threshold)
        const healthPercentage = playerHealth / maxPlayerHealth;
        if (healthPercentage > 0.25) {
            PlayerComponentSystem.removeComponent('berserkerState');
        }
    },

    cleanup: function (player) {
        console.log("Deactivating berserker state");

        // Reset multiplier
        berserkMultiplier = 1.0;

        // Stop color tween if it exists
        if (this.colorTween) {
            this.colorTween.stop();
            this.colorTween = null;
        }

        // Restore original color
        player.setColor(this.originalColor || '#ffffff');

        // Update player stats display
        updatePlayerStatsText();
    }
});

// Add more player components here as needed
// For example: shield, invulnerability, speed boost, etc.

// Registry for mapping perks to player components
const PlayerPerkRegistry = {
    // Store perk-to-component mappings
    perkEffects: {},

    // Register a perk effect that applies a component to the player
    registerPerkEffect: function (perkId, options) {
        this.perkEffects[perkId] = {
            componentName: options.componentName || null,
            configGenerator: options.configGenerator || null,
            condition: options.condition || null
        };
    },

    // Check and apply perk effects based on conditions
    checkAndApplyEffects: function () {
        // Process all registered perk effects
        Object.entries(this.perkEffects).forEach(([perkId, effectInfo]) => {
            // Check if player has this perk
            if (hasPerk(perkId)) {
                // Check if there's a condition function
                let conditionMet = true;
                if (effectInfo.condition) {
                    conditionMet = effectInfo.condition();
                }

                // Apply or remove component based on condition
                if (conditionMet) {
                    // Only add if it's not already active
                    if (!PlayerComponentSystem.hasComponent(effectInfo.componentName)) {
                        // Generate config if needed
                        let config = {};
                        if (effectInfo.configGenerator) {
                            config = effectInfo.configGenerator();
                        }

                        // Add the component
                        PlayerComponentSystem.addComponent(effectInfo.componentName, config);
                    }
                } else {
                    // Remove if active but condition no longer met
                    if (PlayerComponentSystem.hasComponent(effectInfo.componentName)) {
                        PlayerComponentSystem.removeComponent(effectInfo.componentName);
                    }
                }
            }
        });
    }
};

// Register known perk effects
PlayerPerkRegistry.registerPerkEffect('CRIMSON_FURY', {
    componentName: 'berserkerState',
    condition: function () {
        // Active when health is below 25%
        return playerHealth / maxPlayerHealth <= 0.25;
    }
});

// Function to update player status in game loop
function updatePlayerStatus() {
    // Skip if game is over or paused
    if (gameOver || gamePaused) return;

    // Check perk conditions and apply/remove components
    PlayerPerkRegistry.checkAndApplyEffects();

    // Process update event for all active components
    PlayerComponentSystem.processEvent('update');
}

// Function to reset player status (call during game restart)
function resetPlayerStatus() {
    PlayerComponentSystem.resetAll();
    berserkMultiplier = 1.0;
}