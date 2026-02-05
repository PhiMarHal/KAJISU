// interpolation.js - Fixed Timestep System for KAJISU
// Provides deterministic game logic timing while letting Phaser handle physics

const FixedTimestepSystem = {
    // Configuration
    TICK_RATE: 60,                    // Ticks per second
    FIXED_TIMESTEP: 1000 / 60,        // ~16.667ms per tick

    // State
    accumulator: 0,
    currentTick: 0,
    isInitialized: false,

    // Initialize the system
    init: function () {
        this.accumulator = 0;
        this.currentTick = 0;
        this.isInitialized = true;
        console.log(`Fixed timestep system initialized at ${this.TICK_RATE} ticks/second`);
    },

    // Reset the system (on game restart)
    reset: function () {
        this.accumulator = 0;
        this.currentTick = 0;
    },

    // Main update function - call this from your update loop
    // simulateTickFn: function that runs one tick of game logic
    update: function (delta, simulateTickFn) {
        // Add frame time to accumulator
        this.accumulator += delta;

        // Cap accumulator to prevent spiral of death on slow devices
        // Max 10 ticks per frame
        const maxAccumulator = this.FIXED_TIMESTEP * 10;
        if (this.accumulator > maxAccumulator) {
            console.warn(`Accumulator capped: ${this.accumulator.toFixed(1)}ms -> ${maxAccumulator}ms`);
            this.accumulator = maxAccumulator;
        }

        // Run as many fixed ticks as needed
        let ticksThisFrame = 0;
        while (this.accumulator >= this.FIXED_TIMESTEP) {
            // Break if game was paused mid-batch (e.g. by level-up inside simulateTick).
            // This ensures no extra ticks run after a pause triggers, keeping
            // recording and playback synchronized at the exact same tick.
            if (gamePaused) break;

            // Run one tick of game logic with fixed delta
            simulateTickFn(this.FIXED_TIMESTEP);

            // Advance tick counter
            this.currentTick++;
            this.accumulator -= this.FIXED_TIMESTEP;
            ticksThisFrame++;
        }

        // Do NOT zero the accumulator when paused. The residual sub-tick time
        // is legitimate and will be consumed normally when the game resumes.
        // Zeroing it loses ticks, causing elapsed time to drift.

        return {
            ticksSimulated: ticksThisFrame,
            currentTick: this.currentTick
        };
    }
};

// Export
window.FixedTimestepSystem = FixedTimestepSystem;