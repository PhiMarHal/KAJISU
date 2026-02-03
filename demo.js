// demo.js - Demo Recording and Playback System for KAJISU
// Records player input and game events for deterministic replay

const DemoSystem = {
    // Version for compatibility checking
    VERSION: 3,  // Bumped for input-based deterministic format

    // State
    isRecording: false,
    isPlaying: false,
    currentTick: 0,

    // Demo data during recording
    recording: {
        version: 3,
        timestamp: '',
        seed: 0,
        settings: {
            portrait: false,
            bossRush: false,
            difficulty: 1
        },
        inputs: [],      // [[tick, dirX, dirY], ...] - only when input changes
        events: [],      // [[tick, type, ...data], ...]
        drawings: []     // [[tick, mistakes], ...] - drawing challenge mistake counts
    },

    // Playback data
    playback: {
        demo: null,
        inputIndex: 0,
        currentInput: { x: 0, y: 0 }
    },

    // Last recorded input (for change detection)
    lastInput: { x: 0, y: 0 },

    // =====================
    // RECORDING FUNCTIONS
    // =====================

    startRecording: function (seed, settings) {
        this.isRecording = true;
        this.isPlaying = false;
        this.currentTick = 0;

        const now = new Date();
        const timestamp = now.getFullYear().toString() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0');

        this.recording = {
            version: this.VERSION,
            timestamp: timestamp,
            seed: seed,
            settings: { ...settings },
            inputs: [],
            events: [],
            drawings: []
        };

        this.lastInput = { x: 0, y: 0 };

        console.log(`Demo recording started - Seed: ${seed}, Timestamp: ${timestamp}`);
    },

    // Record directional input (only when it changes)
    recordInput: function (dirX, dirY) {
        if (!this.isRecording) return;

        // Quantize to signed bytes (-127 to 127) for compression
        const qX = Math.round(dirX * 127);
        const qY = Math.round(dirY * 127);

        // Only record if input changed
        if (qX !== this.lastInput.x || qY !== this.lastInput.y) {
            this.recording.inputs.push([this.currentTick, qX, qY]);
            this.lastInput.x = qX;
            this.lastInput.y = qY;
        }
    },

    // Record perk selection
    recordPerkSelection: function (perkIndex) {
        if (!this.isRecording) return;
        this.recording.events.push([this.currentTick, 'perk', perkIndex]);
    },

    // Record drawing challenge completion with mistake count
    recordDrawingMistakes: function (mistakes) {
        if (!this.isRecording) return;
        this.recording.drawings.push([this.currentTick, mistakes]);
    },

    // Called each tick during recording
    tickRecording: function () {
        if (!this.isRecording) return;
        this.currentTick++;
    },

    // Stop recording and return the demo data
    stopRecording: function () {
        if (!this.isRecording) return null;

        this.isRecording = false;

        const demo = { ...this.recording };

        console.log(`Demo recording stopped - ${this.currentTick} ticks, ${demo.inputs.length} input changes, ${demo.events.length} events`);

        return demo;
    },

    // =====================
    // PLAYBACK FUNCTIONS
    // =====================

    startPlayback: function (demo) {
        if (!demo || demo.version !== this.VERSION) {
            console.error('Invalid or incompatible demo version');
            return false;
        }

        this.isPlaying = true;
        this.isRecording = false;
        this.currentTick = 0;

        this.playback = {
            demo: demo,
            inputIndex: 0,
            currentInput: { x: 0, y: 0 }
        };

        console.log(`Demo playback started - Seed: ${demo.seed}, ${demo.inputs.length} input changes`);

        return {
            seed: demo.seed,
            settings: demo.settings
        };
    },

    // Get input for current tick during playback
    getPlaybackInput: function () {
        if (!this.isPlaying || !this.playback.demo) {
            return { x: 0, y: 0 };
        }

        const demo = this.playback.demo;

        // Process all input changes up to current tick
        while (this.playback.inputIndex < demo.inputs.length) {
            const input = demo.inputs[this.playback.inputIndex];
            if (input[0] <= this.currentTick) {
                this.playback.currentInput.x = input[1] / 127;
                this.playback.currentInput.y = input[2] / 127;
                this.playback.inputIndex++;
            } else {
                break;
            }
        }

        return {
            x: this.playback.currentInput.x,
            y: this.playback.currentInput.y
        };
    },

    // Get next perk selection for playback (consumes in order)
    getPlaybackPerkSelection: function () {
        if (!this.isPlaying || !this.playback.demo) return null;

        const demo = this.playback.demo;

        // Find the next perk event (consume in order)
        for (let i = 0; i < demo.events.length; i++) {
            const event = demo.events[i];
            if (event[1] === 'perk') {
                demo.events.splice(i, 1);
                return event[2];
            }
        }

        return null;
    },

    // Get next drawing challenge mistake count for playback (consumes in order)
    getPlaybackDrawingMistakes: function () {
        if (!this.isPlaying || !this.playback.demo) return null;

        const demo = this.playback.demo;

        if (demo.drawings && demo.drawings.length > 0) {
            const drawing = demo.drawings.shift();
            return drawing[1];
        }

        return null;
    },

    // Called each tick during playback
    tickPlayback: function () {
        if (!this.isPlaying) return;
        this.currentTick++;
    },

    stopPlayback: function () {
        this.isPlaying = false;
        this.playback.demo = null;
        console.log('Demo playback stopped');
    },

    // Check if demo is active (recording or playing)
    isActive: function () {
        return this.isRecording || this.isPlaying;
    },

    // =====================
    // STORAGE FUNCTIONS
    // =====================

    listSavedDemos: function () {
        const demos = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('kajisu_demo_')) {
                const timestamp = key.replace('kajisu_demo_', '');
                demos.push(timestamp);
            }
        }
        demos.sort((a, b) => b.localeCompare(a));
        return demos;
    },

    saveToLocalStorage: function (demo) {
        if (!demo || !demo.timestamp) return false;

        try {
            const key = `kajisu_demo_${demo.timestamp}`;
            const data = this.compressDemo(demo);
            const sizeKB = (data.length / 1024).toFixed(1);

            // Check approximate size before trying to save
            if (data.length > 4 * 1024 * 1024) {
                console.error(`Demo too large to save: ${sizeKB}KB (max ~4MB)`);
                return false;
            }

            localStorage.setItem(key, data);
            console.log(`Demo saved: ${key} (${sizeKB}KB, ${demo.inputs.length} inputs)`);
            return true;
        } catch (e) {
            // Handle quota exceeded error
            if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
                console.error(`localStorage quota exceeded. Demo size: ${(this.compressDemo(demo).length / 1024).toFixed(1)}KB`);
                console.error('Try deleting old demos to free up space.');
            } else {
                console.error('Failed to save demo:', e);
            }
            return false;
        }
    },

    loadFromLocalStorage: function (timestamp) {
        try {
            const key = `kajisu_demo_${timestamp}`;
            const data = localStorage.getItem(key);
            if (!data) return null;
            return this.decompressDemo(data);
        } catch (e) {
            console.error('Failed to load demo:', e);
            return null;
        }
    },

    deleteFromLocalStorage: function (timestamp) {
        const key = `kajisu_demo_${timestamp}`;
        localStorage.removeItem(key);
    },

    exportAsText: function (demo) {
        return this.compressDemo(demo);
    },

    importFromText: function (text) {
        try {
            return this.decompressDemo(text);
        } catch (e) {
            console.error('Failed to import demo:', e);
            return null;
        }
    },

    // =====================
    // COMPRESSION
    // =====================

    compressDemo: function (demo) {
        const json = JSON.stringify(demo);
        return btoa(unescape(encodeURIComponent(json)));
    },

    decompressDemo: function (data) {
        const json = decodeURIComponent(escape(atob(data)));
        return JSON.parse(json);
    },

    // =====================
    // UTILITY
    // =====================

    formatTimestamp: function (timestamp) {
        if (timestamp.length !== 12) return timestamp;

        const year = timestamp.substring(0, 4);
        const month = timestamp.substring(4, 6);
        const day = timestamp.substring(6, 8);
        const hour = timestamp.substring(8, 10);
        const minute = timestamp.substring(10, 12);

        return `${year}-${month}-${day} ${hour}:${minute}`;
    },

    getDemoInfo: function (timestamp) {
        const demo = this.loadFromLocalStorage(timestamp);
        if (!demo) return null;

        return {
            timestamp: timestamp,
            formatted: this.formatTimestamp(timestamp),
            seed: demo.seed,
            settings: demo.settings,
            inputCount: demo.inputs ? demo.inputs.length : 0,
            duration: demo.inputs && demo.inputs.length > 0 ?
                Math.round(demo.inputs[demo.inputs.length - 1][0] / 60) : 0
        };
    },

    reset: function () {
        this.isRecording = false;
        this.isPlaying = false;
        this.currentTick = 0;
        this.recording = {
            version: this.VERSION,
            timestamp: '',
            seed: 0,
            settings: {},
            inputs: [],
            events: [],
            drawings: []
        };
        this.playback = {
            demo: null,
            inputIndex: 0,
            currentInput: { x: 0, y: 0 }
        };
        this.lastInput = { x: 0, y: 0 };
    }
};

window.DemoSystem = DemoSystem;