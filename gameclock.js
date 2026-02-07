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