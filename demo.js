// demo.js - Demo Recording and Playback System for KAJISU
// Records player input and game events for deterministic replay

const DemoSystem = {
    // Version for compatibility checking
    VERSION: 3,  // Bumped for input-based deterministic format

    // IndexedDB configuration
    DB_NAME: 'kajisu_demos',
    DB_VERSION: 1,
    STORE_NAME: 'demos',

    // Cached DB open promise (opened once, reused)
    _dbPromise: null,

    // Cached init promise (opens DB + runs legacy migration, runs once)
    _initPromise: null,

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
        demo.totalTicks = this.currentTick;
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
    // STORAGE FUNCTIONS (IndexedDB)
    // =====================
    // Demos are stored in IndexedDB, one record per demo keyed by timestamp.
    // Each record holds denormalized metadata (seed, settings, counts) alongside
    // the gzip-compressed demo payload, so listing/dropdowns never have to
    // decompress data. This is the "determinism-irrelevant" side of the system -
    // the in-memory demo object fed to playback is unchanged by any of this.

    // Open (or create) the IndexedDB database. Cached so we only open once.
    _openDB: function () {
        if (this._dbPromise) return this._dbPromise;

        this._dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    // keyPath = timestamp so we can put/get by timestamp directly
                    db.createObjectStore(this.STORE_NAME, { keyPath: 'timestamp' });
                }
            };

            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => {
                console.error('Failed to open demo IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });

        return this._dbPromise;
    },

    // One-time initialization: open DB and migrate any legacy localStorage demos.
    // All *public* storage methods await this internally. Internal helpers
    // (_writeDemo, _openDB) must NOT await init - they're what init uses to do
    // its work, so awaiting init from inside them would deadlock.
    init: function () {
        if (this._initPromise) return this._initPromise;
        this._initPromise = (async () => {
            try {
                await this._openDB();
                await this._migrateFromLocalStorage();
            } catch (e) {
                console.error('Failed to initialize DemoSystem storage:', e);
            }
        })();
        return this._initPromise;
    },

    // Migrate any demos still stored in localStorage (old base64 format) to
    // IndexedDB, then remove the localStorage copies. Safe to run more than
    // once - it's a no-op when no legacy keys remain.
    //
    // NOTE: This runs as part of init, so it MUST use _writeDemo directly
    // rather than the public saveDemo (which would await init and deadlock).
    _migrateFromLocalStorage: async function () {
        const legacyKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('kajisu_demo_')) {
                legacyKeys.push(key);
            }
        }

        if (legacyKeys.length === 0) return;

        console.log(`Migrating ${legacyKeys.length} legacy demo(s) from localStorage to IndexedDB...`);

        let migrated = 0;
        for (const key of legacyKeys) {
            try {
                const data = localStorage.getItem(key);
                if (!data) continue;
                // Legacy format was btoa(utf-8 JSON) - decode it the old way
                const json = decodeURIComponent(escape(atob(data)));
                const demo = JSON.parse(json);
                if (demo && demo.timestamp) {
                    await this._writeDemo(demo);
                    localStorage.removeItem(key);
                    migrated++;
                }
            } catch (e) {
                console.warn(`Failed to migrate legacy demo ${key}:`, e);
            }
        }

        console.log(`Migration complete: ${migrated}/${legacyKeys.length} demo(s) moved to IndexedDB.`);
    },

    // Gzip-encode a demo object to a Uint8Array using the native CompressionStream API.
    // Falls back to plain UTF-8 JSON bytes if the API is unavailable (very old browsers).
    _encodeDemo: async function (demo) {
        const json = JSON.stringify(demo);
        const bytes = new TextEncoder().encode(json);

        if (typeof CompressionStream === 'undefined') {
            return bytes;
        }

        try {
            const stream = new Blob([bytes]).stream()
                .pipeThrough(new CompressionStream('gzip'));
            return new Uint8Array(await new Response(stream).arrayBuffer());
        } catch (e) {
            console.warn('Gzip compression failed, storing uncompressed:', e);
            return bytes;
        }
    },

    // Decode a Uint8Array back into the demo object. Auto-detects gzip via
    // magic bytes (0x1f 0x8b) so uncompressed fallback payloads still work.
    _decodeDemo: async function (bytes) {
        const isGzip = bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;

        let jsonBytes = bytes;
        if (isGzip && typeof DecompressionStream !== 'undefined') {
            const stream = new Blob([bytes]).stream()
                .pipeThrough(new DecompressionStream('gzip'));
            jsonBytes = new Uint8Array(await new Response(stream).arrayBuffer());
        }

        const json = new TextDecoder().decode(jsonBytes);
        return JSON.parse(json);
    },

    // Internal IDB write. Does NOT await init(), so this is the safe path for
    // migration to use (migration runs inside init itself - awaiting init from
    // there would deadlock). Public saveDemo wraps this with init + logging.
    _writeDemo: async function (demo) {
        const data = await this._encodeDemo(demo);

        const record = {
            timestamp: demo.timestamp,
            version: demo.version,
            seed: demo.seed,
            settings: demo.settings,
            totalTicks: demo.totalTicks ?? 0,
            inputCount: demo.inputs ? demo.inputs.length : 0,
            eventCount: demo.events ? demo.events.length : 0,
            drawingCount: demo.drawings ? demo.drawings.length : 0,
            data: data
        };

        const db = await this._openDB();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_NAME, 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);
            const req = store.put(record);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });

        return data.length;
    },

    // List all saved demo timestamps (newest first).
    // Uses getAllKeys so no demo payloads are transferred.
    listSavedDemos: async function () {
        try {
            await this.init();
            const db = await this._openDB();
            return await new Promise((resolve, reject) => {
                const tx = db.transaction(this.STORE_NAME, 'readonly');
                const store = tx.objectStore(this.STORE_NAME);
                const request = store.getAllKeys();
                request.onsuccess = () => {
                    const keys = request.result || [];
                    keys.sort((a, b) => b.localeCompare(a));
                    resolve(keys);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error('Failed to list demos:', e);
            return [];
        }
    },

    // Save a demo to IndexedDB. Returns true on success, false on failure.
    // Metadata fields are denormalized onto the record so getDemoInfo()
    // never has to decompress the payload.
    saveDemo: async function (demo) {
        if (!demo || !demo.timestamp) return false;

        try {
            await this.init();
            const size = await this._writeDemo(demo);
            const sizeKB = (size / 1024).toFixed(1);
            console.log(`Demo saved: ${demo.timestamp} (${sizeKB}KB gzip, ${demo.inputs.length} inputs)`);
            return true;
        } catch (e) {
            // Handle quota exceeded error
            if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
                console.error('IndexedDB quota exceeded. Try deleting old demos to free up space.');
            } else {
                console.error('Failed to save demo:', e);
            }
            return false;
        }
    },

    // Load a full demo (decompressed, ready for playback) from IndexedDB.
    loadDemo: async function (timestamp) {
        try {
            await this.init();
            const db = await this._openDB();
            const record = await new Promise((resolve, reject) => {
                const tx = db.transaction(this.STORE_NAME, 'readonly');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.get(timestamp);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
            if (!record || !record.data) return null;
            return await this._decodeDemo(record.data);
        } catch (e) {
            console.error('Failed to load demo:', e);
            return null;
        }
    },

    // Delete a demo from IndexedDB by timestamp.
    deleteDemo: async function (timestamp) {
        try {
            await this.init();
            const db = await this._openDB();
            await new Promise((resolve, reject) => {
                const tx = db.transaction(this.STORE_NAME, 'readwrite');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.delete(timestamp);
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        } catch (e) {
            console.error('Failed to delete demo:', e);
        }
    },

    // Export a demo as a portable text string (base64-encoded gzip bytes).
    // Much shorter than the old btoa(JSON) format for the same content.
    exportAsText: async function (demo) {
        const bytes = await this._encodeDemo(demo);
        // Convert Uint8Array -> base64. Chunked to avoid blowing the call stack
        // on very large demos (String.fromCharCode(...bytes) would spread millions of args).
        let binary = '';
        const CHUNK = 0x8000;
        for (let i = 0; i < bytes.length; i += CHUNK) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
        }
        return btoa(binary);
    },

    // Import a demo from the text format produced by exportAsText.
    importFromText: async function (text) {
        try {
            const binary = atob(text);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            return await this._decodeDemo(bytes);
        } catch (e) {
            console.error('Failed to import demo:', e);
            return null;
        }
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

    // Return summary info for a demo WITHOUT decompressing the payload -
    // reads denormalized metadata fields directly off the IDB record.
    getDemoInfo: async function (timestamp) {
        try {
            await this.init();
            const db = await this._openDB();
            const record = await new Promise((resolve, reject) => {
                const tx = db.transaction(this.STORE_NAME, 'readonly');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.get(timestamp);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
            if (!record) return null;

            return {
                timestamp: record.timestamp,
                formatted: this.formatTimestamp(record.timestamp),
                seed: record.seed,
                settings: record.settings,
                inputCount: record.inputCount ?? 0,
                duration: record.totalTicks ? Math.round(record.totalTicks / 60) : 0
            };
        } catch (e) {
            console.error('Failed to get demo info:', e);
            return null;
        }
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

// Kick off storage init on page load. Non-blocking - all storage methods
// await this.init() internally so everything serializes correctly.
DemoSystem.init();