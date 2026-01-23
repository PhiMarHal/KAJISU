// rng.js - Seeded Random Number Generator for KAJISU
// Provides deterministic randomness based on a seed value
// All game systems should use SeededRNG.method() instead of Math.random()

const SeededRNG = {
    // The master seed for the entire game session
    masterSeed: null,

    // Individual RNG streams for different game systems
    // Using separate streams ensures that changes in one system don't affect others
    streams: {
        enemy: null,      // Enemy spawns (position, type, timing)
        perk: null,       // Perk/upgrade offerings
        drop: null,       // Drop positions (beacons, shrines, droppers)
        effect: null,     // Combat effects (lightning positions, familiar angles)
        visual: null,     // Visual-only effects (debris, particles)
        drawing: null     // Drawing challenge kanji selection
    },

    // Stream counters for debugging/replay
    counters: {
        enemy: 0,
        perk: 0,
        drop: 0,
        effect: 0,
        visual: 0,
        drawing: 0
    },

    // Initialize the RNG system with a master seed
    // Call this at game start before any random operations
    init: function (seed = null) {
        // If no seed provided, generate one from current time
        // This allows both seeded runs and "random" runs
        this.masterSeed = seed ?? Date.now();

        // Initialize each stream with a derived seed
        // Using different multipliers ensures streams don't correlate
        this.streams.enemy = this.createGenerator(this.masterSeed * 1);
        this.streams.perk = this.createGenerator(this.masterSeed * 2);
        this.streams.drop = this.createGenerator(this.masterSeed * 3);
        this.streams.effect = this.createGenerator(this.masterSeed * 4);
        this.streams.visual = this.createGenerator(this.masterSeed * 5);
        this.streams.drawing = this.createGenerator(this.masterSeed * 6);

        // Reset counters
        Object.keys(this.counters).forEach(key => this.counters[key] = 0);

        console.log(`SeededRNG initialized with master seed: ${this.masterSeed}`);
        return this.masterSeed;
    },

    // Create a Mulberry32 generator function from a seed
    // Mulberry32 is fast and has good statistical properties for games
    createGenerator: function (seed) {
        // Ensure seed is a valid 32-bit integer
        let state = Math.floor(seed) >>> 0;

        return function () {
            state |= 0;
            state = state + 0x6D2B79F5 | 0;
            let t = Math.imul(state ^ state >>> 15, 1 | state);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    },

    // Get a random float [0, 1) from a specific stream
    random: function (stream = 'effect') {
        if (!this.streams[stream]) {
            console.warn(`SeededRNG: Unknown stream '${stream}', using 'effect'`);
            stream = 'effect';
        }
        this.counters[stream]++;
        return this.streams[stream]();
    },

    // Get a random integer in range [min, max] (inclusive)
    between: function (min, max, stream = 'effect') {
        const range = max - min + 1;
        return Math.floor(this.random(stream) * range) + min;
    },

    // Get a random float in range [min, max]
    floatBetween: function (min, max, stream = 'effect') {
        return this.random(stream) * (max - min) + min;
    },

    // Get a random element from an array
    pick: function (array, stream = 'effect') {
        if (!array || array.length === 0) return undefined;
        const index = Math.floor(this.random(stream) * array.length);
        return array[index];
    },

    // Shuffle an array in place using Fisher-Yates
    shuffle: function (array, stream = 'effect') {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(this.random(stream) * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    // Get a random angle in radians [0, 2π)
    angle: function (stream = 'effect') {
        return this.random(stream) * Math.PI * 2;
    },

    // Get a random boolean with optional probability
    bool: function (probability = 0.5, stream = 'effect') {
        return this.random(stream) < probability;
    },

    // Get a random point within a circle
    pointInCircle: function (centerX, centerY, radius, stream = 'effect') {
        const angle = this.angle(stream);
        const distance = this.random(stream) * radius;
        return {
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance
        };
    },

    // Get the current seed (for saving/displaying)
    getSeed: function () {
        return this.masterSeed;
    },

    // Get current counter values (for debugging/replay verification)
    getCounters: function () {
        return { ...this.counters };
    },

    // Reset a specific stream (useful for syncing specific systems)
    resetStream: function (stream) {
        if (!this.streams[stream]) {
            console.warn(`SeededRNG: Cannot reset unknown stream '${stream}'`);
            return;
        }
        const multipliers = { enemy: 1, perk: 2, drop: 3, effect: 4, visual: 5, drawing: 6 };
        this.streams[stream] = this.createGenerator(this.masterSeed * multipliers[stream]);
        this.counters[stream] = 0;
    }
};

// Export the system
window.SeededRNG = SeededRNG;