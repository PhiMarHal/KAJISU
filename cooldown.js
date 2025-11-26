// CooldownManager - a system to track and update timers based on stat changes
// Now supports: single stats, multiple stats, and custom stat functions
const CooldownManager = {
    registeredTimers: [],

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
            return config.statDependencies.reduce((sum, statName) => {
                return sum + this.getBaseStatValue(statName);
            }, 0);
        }

        return 4;
    },

    createTimer: function (options) {
        const scene = game.scene.scenes[0];
        if (!scene) return null;

        const currentStatValue = this.getCurrentStatValue(options);

        let initialCooldown;
        if (options.formula === 'fixed' || !options.formula) {
            initialCooldown = options.baseCooldown ?? 30000;
        } else if (options.formula === 'multiply') {
            initialCooldown = options.baseCooldown * currentStatValue;
        } else if (options.formula === 'sqrt') {
            const baseStatValue = this.getBaseStatValueForConfig(options);
            initialCooldown = options.baseCooldown / (Math.sqrt(currentStatValue / baseStatValue));
        } else if (options.formula === 'divide') {
            initialCooldown = options.baseCooldown / currentStatValue;
        } else {
            initialCooldown = options.baseCooldown ?? 30000;
        }

        const timer = scene.time.addEvent({
            delay: initialCooldown,
            callback: options.callback,
            callbackScope: options.callbackScope,
            loop: options.loop ?? true
        });

        window.registerEffect('timer', timer);

        const config = {
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

        return timer;
    },

    removeTimer: function (timer) {
        if (!timer) return;
        this.registeredTimers = this.registeredTimers.filter(config => config.timer !== timer);
        if (timer && !timer.hasOwnProperty('removed')) {
            timer.remove();
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

    update: function () {
        let statsChanged = false;
        const changedStats = {};

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

        this.registeredTimers.forEach(config => {
            const dependencies = this.getTimerDependencies(config);
            const shouldUpdate = dependencies.some(dep => changedStats.hasOwnProperty(dep));

            if (shouldUpdate) {
                this.updateTimer(config);
            }
        });

        Object.assign(this.lastStats, changedStats);
    },

    updateTimer: function (config) {
        if (!config.timer || config.timer.hasOwnProperty('removed')) return;
        if (!config.formula) return;

        const currentStatValue = this.getCurrentStatValue(config);

        let newCooldown;
        if (config.formula === 'fixed') {
            newCooldown = config.baseCooldown;
        } else if (config.formula === 'multiply') {
            newCooldown = config.baseCooldown * currentStatValue;
        } else if (config.formula === 'sqrt') {
            const baseStatValue = this.getBaseStatValueForConfig(config);
            newCooldown = config.baseCooldown / (Math.sqrt(currentStatValue / baseStatValue));
        } else if (config.formula === 'divide') {
            newCooldown = config.baseCooldown / currentStatValue;
        } else {
            return;
        }

        const elapsed = config.timer.elapsed;
        const progress = elapsed / config.timer.delay;

        console.log(`Updating timer: old delay=${config.timer.delay}ms, new delay=${newCooldown}ms, progress=${progress.toFixed(2)}`);

        const scene = game.scene.scenes[0];
        if (!scene) return;

        config.timer.remove();

        const newTimer = scene.time.addEvent({
            delay: newCooldown,
            callback: config.callback,
            callbackScope: config.callbackScope,
            loop: config.loop
        });

        newTimer.elapsed = progress * newCooldown;

        window.registerEffect('timer', newTimer);

        config.timer = newTimer;

        if (config.component && typeof config.component === 'object') {
            if (config.component.firingTimer === config.timer) {
                config.component.firingTimer = newTimer;
            } else {
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

window.CooldownManager = CooldownManager;