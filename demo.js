// demo.js - Demo Recording and Playback System for KAJISU
// Records player positions and game events for deterministic replay

const DemoSystem = {
    // Version for compatibility checking
    VERSION: 2,  // Bumped for position-based format

    // State
    isRecording: false,
    isPlaying: false,
    currentTick: 0,

    // Demo data during recording
    recording: {
        version: 2,
        timestamp: '',
        seed: 0,
        settings: {
            portrait: false,
            bossRush: false,
            difficulty: 1
        },
        positions: [],   // [[tick, x, y], ...] - player positions (only when changed)
        events: [],      // [[tick, type, ...data], ...]
        strokes: [],     // [[tick, mistakes], ...] - drawing challenge mistake counts
    },

    // Playback data
    playback: {
        demo: null,
        positionIndex: 0,
        eventIndex: 0,
        strokeIndex: 0,
        currentPosition: { x: 0, y: 0 },
        lastPosition: { x: 0, y: 0 }
    },

    // Last recorded position (for change detection)
    lastRecordedX: 0,
    lastRecordedY: 0,
    positionThreshold: 0.5,  // Only record if moved more than this many pixels

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
            positions: [],
            events: [],
            strokes: []
        };

        this.lastRecordedX = 0;
        this.lastRecordedY = 0;

        console.log(`Demo recording started - Seed: ${seed}, Timestamp: ${timestamp}`);
    },

    // Record player position (only when it changes significantly)
    recordPosition: function (x, y) {
        if (!this.isRecording) return;

        // Check if position changed enough to record
        const dx = x - this.lastRecordedX;
        const dy = y - this.lastRecordedY;
        const distSq = dx * dx + dy * dy;

        if (distSq >= this.positionThreshold * this.positionThreshold) {
            // Quantize to 1 decimal place for compression
            const qX = Math.round(x * 10) / 10;
            const qY = Math.round(y * 10) / 10;

            this.recording.positions.push([this.currentTick, qX, qY]);
            this.lastRecordedX = x;
            this.lastRecordedY = y;
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
        this.recording.strokes.push([this.currentTick, mistakes]);
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

        console.log(`Demo recording stopped - ${this.currentTick} ticks, ${demo.positions.length} position changes, ${demo.events.length} events`);

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

        // Get initial position from first position record or default to center
        const initialPos = demo.positions.length > 0 ?
            { x: demo.positions[0][1], y: demo.positions[0][2] } :
            { x: 600, y: 400 };

        this.playback = {
            demo: demo,
            positionIndex: 0,
            eventIndex: 0,
            strokeIndex: 0,
            currentPosition: { ...initialPos },
            lastPosition: { ...initialPos }
        };

        console.log(`Demo playback started - Seed: ${demo.seed}, ${demo.positions.length} position records`);

        return {
            seed: demo.seed,
            settings: demo.settings
        };
    },

    // Get player position for current tick during playback
    getPlaybackPosition: function () {
        if (!this.isPlaying || !this.playback.demo) {
            return null;
        }

        const demo = this.playback.demo;

        // Process all position records up to current tick
        while (this.playback.positionIndex < demo.positions.length) {
            const pos = demo.positions[this.playback.positionIndex];
            if (pos[0] <= this.currentTick) {
                this.playback.lastPosition = { ...this.playback.currentPosition };
                this.playback.currentPosition.x = pos[1];
                this.playback.currentPosition.y = pos[2];
                this.playback.positionIndex++;
            } else {
                break;
            }
        }

        return {
            x: this.playback.currentPosition.x,
            y: this.playback.currentPosition.y
        };
    },

    // Get next perk selection for playback (consumes in order, ignores tick)
    getPlaybackPerkSelection: function () {
        if (!this.isPlaying || !this.playback.demo) return null;

        const demo = this.playback.demo;

        // Find the next perk event (consume in order, regardless of tick)
        for (let i = 0; i < demo.events.length; i++) {
            const event = demo.events[i];
            if (event[1] === 'perk') {
                // Remove from array and return the perk index
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

        // Consume the next stroke event in order
        if (demo.strokes.length > 0) {
            const stroke = demo.strokes.shift();
            return stroke[1]; // mistake count
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

    // Get list of saved demos from localStorage
    listSavedDemos: function () {
        const demos = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('kajisu_demo_')) {
                const timestamp = key.replace('kajisu_demo_', '');
                demos.push(timestamp);
            }
        }
        // Sort newest first
        demos.sort((a, b) => b.localeCompare(a));
        return demos;
    },

    // Save demo to localStorage
    saveToLocalStorage: function (demo) {
        if (!demo || !demo.timestamp) return false;

        try {
            const key = `kajisu_demo_${demo.timestamp}`;
            const data = this.compressDemo(demo);
            localStorage.setItem(key, data);
            console.log(`Demo saved: ${key} (${data.length} chars)`);
            return true;
        } catch (e) {
            console.error('Failed to save demo:', e);
            return false;
        }
    },

    // Load demo from localStorage
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

    // Delete demo from localStorage
    deleteFromLocalStorage: function (timestamp) {
        const key = `kajisu_demo_${timestamp}`;
        localStorage.removeItem(key);
    },

    // Export demo as shareable text
    exportAsText: function (demo) {
        return this.compressDemo(demo);
    },

    // Import demo from text
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

    // Compress demo to Base64 string
    compressDemo: function (demo) {
        // Convert to JSON and then to Base64
        const json = JSON.stringify(demo);
        return btoa(unescape(encodeURIComponent(json)));
    },

    // Decompress demo from Base64 string
    decompressDemo: function (data) {
        const json = decodeURIComponent(escape(atob(data)));
        return JSON.parse(json);
    },

    // =====================
    // UTILITY
    // =====================

    // Format timestamp for display
    formatTimestamp: function (timestamp) {
        if (timestamp.length !== 12) return timestamp;

        const year = timestamp.substring(0, 4);
        const month = timestamp.substring(4, 6);
        const day = timestamp.substring(6, 8);
        const hour = timestamp.substring(8, 10);
        const minute = timestamp.substring(10, 12);

        return `${year}-${month}-${day} ${hour}:${minute}`;
    },

    // Get demo info without loading full data
    getDemoInfo: function (timestamp) {
        const demo = this.loadFromLocalStorage(timestamp);
        if (!demo) return null;

        return {
            timestamp: timestamp,
            formatted: this.formatTimestamp(timestamp),
            seed: demo.seed,
            settings: demo.settings,
            tickCount: demo.positions.length > 0 ?
                demo.positions[demo.positions.length - 1][0] : 0,
            duration: demo.positions.length > 0 ?
                Math.round(demo.positions[demo.positions.length - 1][0] / 60) : 0 // seconds
        };
    },

    // Reset system state
    reset: function () {
        this.isRecording = false;
        this.isPlaying = false;
        this.currentTick = 0;
        this.recording = {
            version: this.VERSION,
            timestamp: '',
            seed: 0,
            settings: {},
            positions: [],
            events: [],
            strokes: []
        };
        this.playback = {
            demo: null,
            positionIndex: 0,
            eventIndex: 0,
            strokeIndex: 0,
            currentPosition: { x: 0, y: 0 },
            lastPosition: { x: 0, y: 0 }
        };
        this.lastRecordedX = 0;
        this.lastRecordedY = 0;
    }
};

// Export
window.DemoSystem = DemoSystem;