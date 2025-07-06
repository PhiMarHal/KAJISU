// CooldownManager - a system to track and update timers based on stat changes
const CooldownManager = {
    // Store registered timers with their configuration
    registeredTimers: [],

    // Last known player stats
    lastStats: {
        luck: null,
        fireRate: null,
        damage: null,
        health: null
    },

    // Initialize the system
    initialize: function () {
        // Reset registered timers array
        this.registeredTimers = [];

        // Store initial stats
        this.lastStats.luck = playerLuck;
        this.lastStats.fireRate = playerFireRate;
        this.lastStats.damage = playerDamage;
        this.lastStats.health = maxPlayerHealth;

        console.log("CooldownManager initialized with stats:", this.lastStats);
    },

    // Create and register a timer
    createTimer: function (options) {
        const scene = game.scene.scenes[0];
        if (!scene) return null;

        // Get current stat value
        const currentStatValue = options.statName === 'luck' ? playerLuck :
            options.statName === 'fireRate' ? playerFireRate :
                options.statName === 'damage' ? playerDamage :
                    options.statName === 'health' ? maxPlayerHealth : 1;

        // Calculate initial cooldown
        let initialCooldown;
        if (options.formula === 'fixed') {
            initialCooldown = options.baseCooldown; // Fixed cooldown ignores stats
        } else if (options.formula === 'multiply') {
            initialCooldown = options.baseCooldown * currentStatValue;
        } else if (options.formula === 'sqrt') {
            // Use BASE_STATS reference for better code maintenance
            const baseStatValue = options.statName === 'luck' ? BASE_STATS.LUK :
                options.statName === 'fireRate' ? BASE_STATS.AGI :
                    options.statName === 'damage' ? BASE_STATS.POW :
                        options.statName === 'health' ? BASE_STATS.END : 4;
            initialCooldown = options.baseCooldown / (Math.sqrt(currentStatValue / baseStatValue));
        } else if (options.formula === 'divide') {
            initialCooldown = options.baseCooldown / currentStatValue;
        } else {
            // No formula specified - use fixed cooldown
            initialCooldown = options.baseCooldown;
        }

        // Create the timer
        const timer = scene.time.addEvent({
            delay: initialCooldown,
            callback: options.callback,
            callbackScope: options.callbackScope,
            loop: options.loop ?? true
        });

        // Register with effect system
        window.registerEffect('timer', timer);

        // Store configuration - DO NOT use defaults for statName/formula when null
        const config = {
            timer: timer,
            statName: options.statName, // Keep original null value
            baseCooldown: options.baseCooldown ?? 30000,
            formula: options.formula, // Keep original null value
            component: options.component ?? null,
            callback: options.callback,
            callbackScope: options.callbackScope,
            loop: options.loop ?? true
        };

        // Add to registered timers
        this.registeredTimers.push(config);

        return timer;
    },

    // Remove a timer
    removeTimer: function (timer) {
        if (!timer) return;

        // Find and remove the timer from registry
        this.registeredTimers = this.registeredTimers.filter(config => config.timer !== timer);

        // Stop the timer
        if (timer && !timer.hasOwnProperty('removed')) {
            timer.remove();
        }
    },

    // Check for stat changes and update timers accordingly
    update: function () {
        let statsChanged = false;
        const changedStats = {};

        // Check each stat for significant changes (10% or more)
        if (Math.abs(this.lastStats.luck - playerLuck) >= this.lastStats.luck * 0.1) {
            changedStats.luck = playerLuck;
            statsChanged = true;
        }

        if (Math.abs(this.lastStats.fireRate - playerFireRate) >= this.lastStats.fireRate * 0.1) {
            changedStats.fireRate = playerFireRate;
            statsChanged = true;
        }

        if (Math.abs(this.lastStats.damage - playerDamage) >= this.lastStats.damage * 0.1) {
            changedStats.damage = playerDamage;
            statsChanged = true;
        }

        if (Math.abs(this.lastStats.health - maxPlayerHealth) >= this.lastStats.health * 0.1) {
            changedStats.health = maxPlayerHealth;
            statsChanged = true;
        }

        // If no significant changes, exit early
        if (!statsChanged) return;

        console.log("Significant stat changes detected:", changedStats);

        // Update each affected timer
        this.registeredTimers.forEach(config => {
            // Check if this timer depends on a changed stat
            if (config.statName && changedStats.hasOwnProperty(config.statName)) {
                this.updateTimer(config, changedStats[config.statName]);
            }
        });

        // Update stored stats
        Object.assign(this.lastStats, changedStats);
    },

    // Update a specific timer with new stat value
    updateTimer: function (config, newStatValue) {
        // Skip if timer was removed
        if (!config.timer || config.timer.hasOwnProperty('removed')) return;

        // Skip if no statName or formula specified (fixed cooldown)
        if (!config.statName || !config.formula) return;

        // Calculate new cooldown based on formula
        let newCooldown;
        if (config.formula === 'fixed') {
            newCooldown = config.baseCooldown; // Fixed cooldown ignores stat changes
        } else if (config.formula === 'multiply') {
            newCooldown = config.baseCooldown * newStatValue;
        } else if (config.formula === 'sqrt') {
            // Use BASE_STATS reference for better code maintenance
            const baseStatValue = config.statName === 'luck' ? BASE_STATS.LUK :
                config.statName === 'fireRate' ? BASE_STATS.AGI :
                    config.statName === 'damage' ? BASE_STATS.POW :
                        config.statName === 'health' ? BASE_STATS.END : 4;
            newCooldown = config.baseCooldown / (Math.sqrt(newStatValue / baseStatValue));
        } else if (config.formula === 'divide') {
            newCooldown = config.baseCooldown / newStatValue;
        } else {
            // Unknown formula - don't update
            return;
        }

        // Store elapsed time and progress
        const elapsed = config.timer.elapsed;
        const progress = elapsed / config.timer.delay;

        console.log(`Updating timer: old delay=${config.timer.delay}ms, new delay=${newCooldown}ms, progress=${progress.toFixed(2)}`);

        // Get the scene
        const scene = game.scene.scenes[0];
        if (!scene) return;

        // Remove old timer
        config.timer.remove();

        // Create new timer with updated cooldown
        const newTimer = scene.time.addEvent({
            delay: newCooldown,
            callback: config.callback,
            callbackScope: config.callbackScope,
            loop: config.loop
        });

        // Preserve progress in the cooldown cycle
        newTimer.elapsed = progress * newCooldown;

        // Register with effect system
        window.registerEffect('timer', newTimer);

        // Update reference in config
        config.timer = newTimer;

        // If component exists, update its reference too
        if (config.component && typeof config.component === 'object') {
            // For familiar timers, store reference directly
            if (config.component.firingTimer === config.timer) {
                config.component.firingTimer = newTimer;
            }
            // Find timer property in component for other types
            else {
                for (const key in config.component) {
                    if (config.component[key] === config.timer) {
                        config.component[key] = newTimer;
                        break;
                    }
                }
            }
        }
    }
};

// Export the manager for use in other files
window.CooldownManager = CooldownManager;