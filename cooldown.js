// CooldownManager - Tick-based timer system for deterministic gameplay
// All timers advance inside simulateTick via processTick() for consistent recording/playback
// Timer objects have a Phaser-compatible interface (.remove(), .delay, .elapsed, .paused)

const CooldownManager = {
    registeredTimers: [],
    FIXED_TIMESTEP: 1000 / 60,

    lastStats: {
        luck: null,
        fireRate: null,
        damage: null,
        health: null
    },

    initialize: function () {
        this.registeredTimers = [];
        this.lastStats.luck = playerLuck;
        this.lastStats.fireRate = playerFireRate;
        this.lastStats.damage = playerDamage;
        this.lastStats.health = maxPlayerHealth;
        console.log("CooldownManager initialized with stats:", this.lastStats);
    },

    getStatValue: function (statName) {
        switch (statName) {
            case 'luck': return playerLuck;
            case 'fireRate': return playerFireRate;
            case 'damage': return playerDamage;
            case 'health': return maxPlayerHealth;
            default: return 1;
        }
    },

    getBaseStatValue: function (statName) {
        switch (statName) {
            case 'luck': return BASE_STATS.LUK;
            case 'fireRate': return BASE_STATS.AGI;
            case 'damage': return BASE_STATS.POW;
            case 'health': return BASE_STATS.END;
            default: return 4;
        }
    },

    getCurrentStatValue: function (config) {
        if (config.statFunction) {
            return config.statFunction();
        }
        if (config.statName) {
            return this.getStatValue(config.statName);
        }
        if (config.statDependencies && config.statDependencies.length > 0) {
            console.warn('Timer has statDependencies but no statFunction');
            return this.getStatValue(config.statDependencies[0]);
        }
        return 1;
    },

    getBaseStatValueForConfig: function (config) {
        if (config.baseStatFunction) {
            return config.baseStatFunction();
        }
        if (config.statName) {
            return this.getBaseStatValue(config.statName);
        }
        if (config.statDependencies && config.statDependencies.length > 0) {
            return config.statDependencies.reduce(function (sum, statName) {
                return sum + CooldownManager.getBaseStatValue(statName);
            }, 0);
        }
        return 4;
    },

    createTimer: function (options) {
        var currentStatValue = this.getCurrentStatValue(options);

        var initialCooldown;
        if (options.formula === 'fixed' || !options.formula) {
            initialCooldown = options.baseCooldown ?? 30000;
        } else if (options.formula === 'multiply') {
            initialCooldown = options.baseCooldown * currentStatValue;
        } else if (options.formula === 'sqrt') {
            var baseStatValue = this.getBaseStatValueForConfig(options);
            initialCooldown = options.baseCooldown / (Math.sqrt(currentStatValue / baseStatValue));
        } else if (options.formula === 'divide') {
            initialCooldown = options.baseCooldown / currentStatValue;
        } else {
            initialCooldown = options.baseCooldown ?? 30000;
        }

        // Create tick-based timer with Phaser-compatible interface
        // Note: 'removed' property is NOT set initially.
        // Calling timer.remove() adds it, so hasOwnProperty('removed') returns true.
        // This matches Phaser.Time.TimerEvent behavior that existing code checks for.
        var timer = {
            delay: initialCooldown,
            elapsed: 0,
            paused: false,
            remove: function () {
                this.removed = true;
            }
        };

        var config = {
            timer: timer,
            statName: options.statName ?? null,
            statDependencies: options.statDependencies ?? null,
            statFunction: options.statFunction ?? null,
            baseStatFunction: options.baseStatFunction ?? null,
            baseCooldown: options.baseCooldown ?? 30000,
            formula: options.formula ?? null,
            component: options.component ?? null,
            callback: options.callback,
            callbackScope: options.callbackScope,
            loop: options.loop ?? true
        };

        this.registeredTimers.push(config);

        // Register with effect system for pause/cleanup compatibility
        if (window.registerEffect) {
            window.registerEffect('timer', timer);
        }

        return timer;
    },

    removeTimer: function (timer) {
        if (!timer) return;
        timer.removed = true;
    },

    // Advance all timers by one tick — call once per simulateTick
    processTick: function (timeScale) {
        var dt = this.FIXED_TIMESTEP * (timeScale ?? 1);
        for (var i = this.registeredTimers.length - 1; i >= 0; i--) {
            var config = this.registeredTimers[i];
            var timer = config.timer;

            // Clean up removed timers
            if (timer.removed) {
                this.registeredTimers.splice(i, 1);
                continue;
            }

            if (timer.paused) continue;

            timer.elapsed += dt;

            if (timer.elapsed >= timer.delay) {
                config.callback.call(config.callbackScope);

                if (config.loop && !timer.removed) {
                    timer.elapsed -= timer.delay;
                    if (timer.elapsed < 0) timer.elapsed = 0;
                } else if (!timer.removed) {
                    timer.removed = true;
                    this.registeredTimers.splice(i, 1);
                }
            }
        }
    },

    getTimerDependencies: function (config) {
        if (config.statDependencies) {
            return config.statDependencies;
        }
        if (config.statName) {
            return [config.statName];
        }
        return [];
    },

    // Check for stat changes and update timer delays accordingly
    update: function () {
        var statsChanged = false;
        var changedStats = {};

        if (this.lastStats.luck !== playerLuck) {
            changedStats.luck = playerLuck;
            statsChanged = true;
        }
        if (this.lastStats.fireRate !== playerFireRate) {
            changedStats.fireRate = playerFireRate;
            statsChanged = true;
        }
        if (this.lastStats.damage !== playerDamage) {
            changedStats.damage = playerDamage;
            statsChanged = true;
        }
        if (this.lastStats.health !== maxPlayerHealth) {
            changedStats.health = maxPlayerHealth;
            statsChanged = true;
        }

        if (!statsChanged) return;

        console.log("Stat changes detected:", changedStats);

        this.registeredTimers.forEach(function (config) {
            var dependencies = CooldownManager.getTimerDependencies(config);
            var shouldUpdate = dependencies.some(function (dep) {
                return changedStats.hasOwnProperty(dep);
            });

            if (shouldUpdate) {
                CooldownManager.updateTimer(config);
            }
        });

        Object.assign(this.lastStats, changedStats);
    },

    // Update a timer's delay in-place based on current stats (no timer recreation needed)
    updateTimer: function (config) {
        if (!config.timer || config.timer.removed) return;
        if (!config.formula) return;

        var currentStatValue = this.getCurrentStatValue(config);

        var newCooldown;
        if (config.formula === 'fixed') {
            newCooldown = config.baseCooldown;
        } else if (config.formula === 'multiply') {
            newCooldown = config.baseCooldown * currentStatValue;
        } else if (config.formula === 'sqrt') {
            var baseStatValue = this.getBaseStatValueForConfig(config);
            newCooldown = config.baseCooldown / (Math.sqrt(currentStatValue / baseStatValue));
        } else if (config.formula === 'divide') {
            newCooldown = config.baseCooldown / currentStatValue;
        } else {
            return;
        }

        var timer = config.timer;
        var progress = timer.delay > 0 ? timer.elapsed / timer.delay : 0;

        console.log('Updating timer: old delay=' + timer.delay + 'ms, new delay=' + newCooldown + 'ms, progress=' + progress.toFixed(2));

        timer.delay = newCooldown;
        timer.elapsed = progress * newCooldown;
    }
};

window.CooldownManager = CooldownManager;