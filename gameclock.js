// gameclock.js - Deterministic Game Clock for KAJISU
// Provides tick-based time consistent between recording and playback
// Use GameClock.now() instead of scene.time.now for any gameplay-affecting timing

const GameClock = {
    _tickCount: 0,
    FIXED_TIMESTEP: 1000 / 60, // ~16.667ms per tick

    // Call once at the start of each simulateTick
    tick: function () {
        this._tickCount++;
    },

    // Get deterministic game time in milliseconds
    now: function () {
        return this._tickCount * this.FIXED_TIMESTEP;
    },

    // Get current tick number
    getTick: function () {
        return this._tickCount;
    },

    // Reset on game restart
    reset: function () {
        this._tickCount = 0;
    }
};

window.GameClock = GameClock;

// Deterministic delay queue
const DelayQueue = {
    pending: [],

    schedule: function (delayMs, callback, scope) {
        const triggerTick = GameClock.getTick() + Math.ceil(delayMs / GameClock.FIXED_TIMESTEP);
        const entry = { triggerTick, callback, scope, cancelled: false };
        this.pending.push(entry);
        return { remove: () => { entry.cancelled = true; } };
    },

    processTick: function () {
        const tick = GameClock.getTick();
        for (let i = this.pending.length - 1; i >= 0; i--) {
            const e = this.pending[i];
            if (e.cancelled || tick >= e.triggerTick) {
                this.pending.splice(i, 1);
                if (!e.cancelled) {
                    try {
                        e.scope ? e.callback.call(e.scope) : e.callback();
                    } catch (err) {
                        console.error('DelayQueue callback error:', err);
                    }
                }
            }
        }
    },

    reset: function () { this.pending = []; }
};

window.DelayQueue = DelayQueue;