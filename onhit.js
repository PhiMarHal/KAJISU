// On-Hit Effect System for Word Survivors
// Manages effects that trigger when the player is hit by enemies

// Component system for on-hit effects
const OnHitEffectSystem = {
    // Component definitions
    componentTypes: {},

    // Active components
    activeComponents: {},

    // Register a new component type
    registerComponent: function (name, componentDef) {
        this.componentTypes[name] = componentDef;
    },

    // Add a component to the system
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
            component.initialize();
        }

        return true;
    },

    // Remove a component from the system
    removeComponent: function (componentName) {
        const component = this.activeComponents[componentName];
        if (!component) return false;

        // Call cleanup function if it exists
        if (component.cleanup) {
            component.cleanup();
        }

        // Remove the component
        delete this.activeComponents[componentName];
        return true;
    },

    // Process the player being hit
    processHit: function (scene, enemy) {
        // Call the onHit handler on each active component
        Object.values(this.activeComponents).forEach(component => {
            if (component.onHit) {
                component.onHit(scene, enemy);
            }
        });
    },

    // Check if a component is active
    hasComponent: function (componentName) {
        return !!this.activeComponents[componentName];
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

// Register component for Purple Hedgehog effect
OnHitEffectSystem.registerComponent('defensiveBurst', {
    // No need to store state for this simple component
    onHit: function (scene, enemy) {
        // Calculate number of projectiles based on luck (2 * LUCK)
        const projectileCount = playerLuck * 2;

        // Visual effect at player position
        const burstEffect = scene.add.circle(player.x, player.y, 40, 0x9370db, 0.5);
        scene.tweens.add({
            targets: burstEffect,
            alpha: 0,
            scale: 2,
            duration: 300,
            onComplete: function () {
                burstEffect.destroy();
            }
        });

        // Create each projectile in the burst
        for (let i = 0; i < projectileCount; i++) {
            // Calculate angle for even distribution (in radians)
            const angle = (i / projectileCount) * Math.PI * 2;

            // Create projectile using shared base
            const projectile = createProjectileBase(scene, player.x, player.y, '#9370db');

            // Set velocity based on angle
            const speed = 400;
            projectile.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );

            // Add special property
            projectile.isDefensiveBurst = true;
        }
    }
});

// Registry for mapping perks to on-hit components
const OnHitPerkRegistry = {
    // Store perk-to-component mappings
    perkEffects: {},

    // Register a perk effect that applies an on-hit component
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
                    if (!OnHitEffectSystem.hasComponent(effectInfo.componentName)) {
                        // Generate config if needed
                        let config = {};
                        if (effectInfo.configGenerator) {
                            config = effectInfo.configGenerator();
                        }

                        // Add the component
                        OnHitEffectSystem.addComponent(effectInfo.componentName, config);
                    }
                } else {
                    // Remove if active but condition no longer met
                    if (OnHitEffectSystem.hasComponent(effectInfo.componentName)) {
                        OnHitEffectSystem.removeComponent(effectInfo.componentName);
                    }
                }
            }
        });
    }
};

// Register the Purple Hedgehog perk effect
OnHitPerkRegistry.registerPerkEffect('PURPLE_HEDGEHOG', {
    componentName: 'defensiveBurst',
    condition: function () {
        // Always active when perk is acquired
        return true;
    }
});

// Main handler for player hit events - coordinates the entire hit response
function handlePlayerHit(scene, enemy) {
    // First trigger any on-hit effects that should happen regardless of shields
    // (like the Purple Hedgehog defensive burst)
    processPlayerHit(scene, enemy);

    // Check if shield is active
    if (window.isShieldActive()) {
        // Shield absorbs the hit - this will handle cooldown for permanent shields
        window.triggerShieldHit();

        // Flash the shield effect
        scene.tweens.add({
            targets: player,
            alpha: 0.5,
            scale: 1.2,
            duration: 100,
            yoyo: true,
            repeat: 1
        });

        // Return true to indicate hit was absorbed by shield
        return true;
    }

    // If we reach here, no shield was active
    // Return false to indicate hit should apply damage
    return false;
}

// Process on-hit effects (doesn't handle shield or damage)
function processPlayerHit(scene, enemy) {
    // Process all registered on-hit effects
    OnHitEffectSystem.processHit(scene, enemy);
}

// Function to reset the system (call during game restart)
function resetOnHitEffects() {
    OnHitEffectSystem.resetAll();
}

// Call this during the game update loop to ensure perk effects are applied/removed as needed
function updateOnHitEffects() {
    // Skip if game is over or paused
    if (gameOver || gamePaused) return;

    // Check perk conditions and apply/remove components
    OnHitPerkRegistry.checkAndApplyEffects();
}

// Export API for use in other files
window.OnHitEffectSystem = OnHitEffectSystem;
window.OnHitPerkRegistry = OnHitPerkRegistry;
window.handlePlayerHit = handlePlayerHit;
window.processPlayerHit = processPlayerHit;
window.resetOnHitEffects = resetOnHitEffects;
window.updateOnHitEffects = updateOnHitEffects;