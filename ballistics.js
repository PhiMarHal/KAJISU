// Projectile Perk Registry System for Word Survivors
// This system maps perks to projectile components and handles their automatic application

// Projectile perk registry - maps perks to their projectile effects
const ProjectilePerkRegistry = {
    // Store perk-to-component mappings
    perkEffects: {},

    // Register a perk effect that can apply components to projectiles
    registerPerkEffect: function (perkId, options) {
        this.perkEffects[perkId] = {
            componentName: options.componentName ?? null,
            chanceMultiplier: options.chanceMultiplier ?? 1.0,
            applyChance: options.applyChance ?? true,
            configGenerator: options.configGenerator ?? null
        };
    },

    // Apply all registered perk effects to a new projectile
    applyPerkEffects: function (projectile, scene) {
        // Go through all registered perk effects
        Object.entries(this.perkEffects).forEach(([perkId, effectInfo]) => {
            // Check if player has this perk
            if (hasPerk(perkId)) {
                let shouldApply = true;

                // Check if we should apply a chance calculation
                if (effectInfo.applyChance) {
                    // Calculate chance based on luck and any multiplier
                    const chance = calculateProcChance(playerLuck, baseProcChance) * effectInfo.chanceMultiplier;
                    shouldApply = Math.random() < chance;
                }

                // Apply the component if conditions are met
                if (shouldApply && effectInfo.componentName) {
                    // Generate config if needed
                    let config = {};
                    if (effectInfo.configGenerator) {
                        config = effectInfo.configGenerator(scene);
                    }

                    // Add the component to the projectile
                    ProjectileComponentSystem.addComponent(projectile, effectInfo.componentName, config);
                }
            }
        });

        return projectile;
    }
};

// Register built-in perk effects
ProjectilePerkRegistry.registerPerkEffect('CRIMSON_SCATTER', {
    componentName: 'distanceDamage',
    applyChance: false, // Always apply, not chance-based
    configGenerator: (scene) => ({
        startX: player.x, // Use the global player variable
        startY: player.y, // Use the global player variable
        baseDamage: playerDamage
    })
});

ProjectilePerkRegistry.registerPerkEffect('SLOW_SHOT', {
    componentName: 'slowEffect',
    applyChance: true // Apply based on chance
});

ProjectilePerkRegistry.registerPerkEffect('GREEN_VENOM', {
    componentName: 'poisonEffect',
    applyChance: true
});

ProjectilePerkRegistry.registerPerkEffect('AZURE_FORK', {
    componentName: 'splitEffect',
    applyChance: true
});

ProjectilePerkRegistry.registerPerkEffect('SCARLET_EMBER', {
    componentName: 'fireEffect',
    applyChance: true
});

ProjectilePerkRegistry.registerPerkEffect('PURPLE_OWL', {
    componentName: 'multiShot',
    applyChance: true, // Use standard chance calculation
    configGenerator: function (scene) {
        return {
            maxExtraShots: 1 // Just one extra shot
        };
    }
});

ProjectilePerkRegistry.registerPerkEffect('PIERCING_SHOTS', {
    componentName: 'piercingEffect',
    applyChance: true,  // Use standard chance calculation based on luck
});


// Register the Yellow Boomerang perk effect
ProjectilePerkRegistry.registerPerkEffect('YELLOW_BOOMERANG', {
    componentName: 'boomerangEffect',
    applyChance: true, // Apply based on chance
});