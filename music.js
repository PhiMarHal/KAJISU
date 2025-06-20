// Music System for Word Survivors
// Handles background music with smooth transitions and shuffled playlists
// Uses dynamic position checking and proxy objects for reliable fading

function detectMusicUrl() {
    const hostname = window.location.hostname;

    console.log(`Detecting music URL for hostname: ${hostname}`);

    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
        // Local development
        console.log('Local development detected, using relative paths');
        return 'music/';
    } else {
        // External hosting (any other platform) - use Cloudflare R2 for music
        const cloudflareR2Url = 'https://kajisumu.loiyaa.com/music/';
        console.log(`External hosting detected, using Cloudflare R2: ${cloudflareR2Url}`);
        return cloudflareR2Url;
    }
}

// Dynamic configuration
const MUSIC_CONFIG = {
    baseUrl: detectMusicUrl(),
    trackCount: 23
};

const MusicSystem = {
    // Music tracks and playback state
    tracks: [],             // List of available track IDs (not loaded yet)
    playQueue: [],          // Shuffled play order
    currentTrackIndex: -1,  // Index of currently playing track in playQueue
    currentTrack: null,     // Reference to the currently playing Phaser Sound object
    fadeInTween: null,      // Reference to fade-in tween
    fadeOutTween: null,     // Reference to fade-out tween
    nextTrackToPlay: null,  // The next track we plan to play
    isLoading: false,       // Flag to track if we're currently loading a track
    isFadingOut: false,     // Flag to prevent multiple fade-outs
    updateTimer: null,      // Timer for checking track position

    // Configuration
    silenceDuration: 4000,  // 1 second of silence between tracks
    fadeDuration: 4000,    // 40 seconds fade in/out
    volume: 0.7,            // Default maximum volume (0-1)
    musicEnabled: true,     // Music enabled/disabled flag

    // Timing configuration
    fadeOutBuffer: 8000,    // Start fade out 8 seconds before end (fade + silence)
    preloadBuffer: 20000,   // Start preloading next track 20 seconds before end
    updateInterval: 100,    // Check position every 100ms

    // Pause settings
    pausePulseTween: null,  // Reference to pulse effect tween
    lowPassFilter: null,    // Reference to Web Audio low-pass filter
    pauseGainNode: null,    // Reference to gain node for volume control with filter

    // Boss fight effect settings
    isInBossFight: false,   // Track if boss fight mode is active

    // Separate timer tracking for music (not affected by game pause)
    musicTimers: [],        // Store all music-specific timers

    // FIXED VOLUME CONTROL SYSTEM
    customVolumeGainNode: null,  // Our own gain node for reliable volume control
    originalSetVolume: null,     // Store original setVolume function
    forcedAudioContext: null,    // Store reference to forced AudioContext

    // Initialize the music system with forced Web Audio
    initialize: function (scene) {
        console.log("Initializing music system with forced Web Audio");

        // Clear any existing tracks
        this.tracks = [];
        this.playQueue = [];
        this.currentTrackIndex = -1;
        this.nextTrackToPlay = null;
        this.isLoading = false;
        this.isFadingOut = false;

        // Store scene reference for later use
        this.scene = scene;

        // Clear any existing music timers
        this.clearMusicTimers();

        // FORCE WEB AUDIO: Create our own AudioContext if needed
        this.setupForcedWebAudio();

        return this;
    },

    // NEW: Setup forced Web Audio context
    setupForcedWebAudio: function () {
        try {
            // Create our own AudioContext if Phaser doesn't have one or is using HTML5
            if (!this.scene.sound.context || !this.isUsingWebAudio()) {
                console.log("Setting up forced Web Audio context");

                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                this.forcedAudioContext = new AudioContextClass();

                // Resume if suspended
                if (this.forcedAudioContext.state === 'suspended') {
                    this.forcedAudioContext.resume().then(() => {
                        console.log('Forced AudioContext resumed');
                    });
                }

                // If Phaser has a setAudioContext method, use it
                if (this.scene.sound.setAudioContext) {
                    this.scene.sound.setAudioContext(this.forcedAudioContext);
                    console.log("Applied forced AudioContext to Phaser sound manager");
                }
            }

            // Verify we're using Web Audio
            console.log(`Sound manager type: ${this.scene.sound.constructor.name}`);
            console.log(`Using Web Audio: ${this.isUsingWebAudio()}`);

        } catch (error) {
            console.error("Failed to setup forced Web Audio:", error);
        }
    },

    // NEW: Check if we're using Web Audio (more reliable than usingWebAudio property)
    isUsingWebAudio: function () {
        if (!this.scene || !this.scene.sound) return false;

        return this.scene.sound.constructor.name === 'WebAudioSoundManager' ||
            this.scene.sound instanceof Phaser.Sound.WebAudioSoundManager ||
            (this.scene.sound.context && this.scene.sound.destination);
    },

    // NEW: Setup custom volume control system for a track
    setupCustomVolumeControl: function (track) {
        if (!this.isUsingWebAudio() || !track) {
            console.warn('Cannot setup custom volume control - not using Web Audio or no track');
            return false;
        }

        try {
            const audioContext = this.scene.sound.context || this.forcedAudioContext;
            if (!audioContext) {
                console.warn('No AudioContext available');
                return false;
            }

            // Create our custom gain node for volume control
            this.customVolumeGainNode = audioContext.createGain();
            this.customVolumeGainNode.gain.value = track.volume;

            // Try to find the audio source and connect our gain node
            if (this.connectCustomVolumeNode(track, audioContext)) {
                // Override the track's setVolume method
                this.overrideTrackVolumeControl(track);
                console.log('✓ Custom volume control system active');
                return true;
            } else {
                // Clean up on failure
                if (this.customVolumeGainNode) {
                    this.customVolumeGainNode.disconnect();
                    this.customVolumeGainNode = null;
                }
                return false;
            }

        } catch (error) {
            console.error('Failed to setup custom volume control:', error);
            return false;
        }
    },

    // NEW: Try to connect our custom gain node into the audio graph
    connectCustomVolumeNode: function (track, audioContext) {
        try {
            // Get destination (Phaser's master node or audio destination)
            const destination = this.scene.sound.destination || audioContext.destination;

            // Method 1: Try direct source connection
            if (track.source && track.source.connect && track.source.disconnect) {
                console.log('Connecting via track.source');
                track.source.disconnect();
                track.source.connect(this.customVolumeGainNode);
                this.customVolumeGainNode.connect(destination);
                return true;
            }

            // Method 2: Try Phaser's volume node
            if (track.volumeNode || track.gainNode) {
                const volumeNode = track.volumeNode || track.gainNode;
                console.log('Connecting via Phaser volume node');

                volumeNode.disconnect();
                volumeNode.connect(this.customVolumeGainNode);
                this.customVolumeGainNode.connect(destination);
                return true;
            }

            // Method 3: Look for source in track properties
            for (const prop in track) {
                const value = track[prop];
                if (value && typeof value === 'object' &&
                    value.connect && value.disconnect) {
                    try {
                        console.log(`Trying to connect via track.${prop}`);
                        value.disconnect();
                        value.connect(this.customVolumeGainNode);
                        this.customVolumeGainNode.connect(destination);
                        return true;
                    } catch (e) {
                        // Continue trying other properties
                    }
                }
            }

            console.warn('Could not find audio source to connect custom volume node');
            return false;

        } catch (error) {
            console.error('Error connecting custom volume node:', error);
            return false;
        }
    },

    // NEW: Override track's setVolume method to use our gain node
    overrideTrackVolumeControl: function (track) {
        // Don't store originalSetVolume - instead use a more robust approach

        // Store the track's current volume property descriptor
        const volumeDescriptor = Object.getOwnPropertyDescriptor(track, 'volume') ||
            Object.getOwnPropertyDescriptor(Object.getPrototypeOf(track), 'volume');

        // Create our own volume property that always works
        Object.defineProperty(track, '_internalVolume', {
            value: track.volume,
            writable: true,
            enumerable: false
        });

        // Override setVolume with a version that always updates both places
        track.setVolume = (value) => {
            // Update our internal tracking
            track._internalVolume = value;

            // Update the custom gain node if available
            if (this.customVolumeGainNode) {
                this.customVolumeGainNode.gain.value = value;
            }

            // Try to update Phaser's internal volume using multiple methods
            try {
                // Method 1: Try the original volume property
                if (volumeDescriptor && volumeDescriptor.set) {
                    volumeDescriptor.set.call(track, value);
                } else {
                    // Method 2: Direct property assignment
                    track.volume = value;
                }
            } catch (e) {
                // Method 3: Last resort - just log that we couldn't update Phaser
                console.warn('Could not update Phaser volume, using gain node only');
            }

            return track; // For chaining
        };

        // Override the volume getter to return our tracked value
        Object.defineProperty(track, 'volume', {
            get: function () {
                return this._internalVolume;
            },
            set: function (value) {
                this.setVolume(value);
            },
            enumerable: true,
            configurable: true
        });

        console.log('✓ Robust volume control override installed');
    },

    // NEW: Clean up custom volume control
    cleanupCustomVolumeControl: function () {
        if (this.customVolumeGainNode) {
            try {
                this.customVolumeGainNode.disconnect();
            } catch (e) {
                // Ignore disconnect errors
            }
            this.customVolumeGainNode = null;
        }

        // No need to restore originalSetVolume since we don't store it anymore
        // Our robust override should continue working
    },

    // Clear all music timers
    clearMusicTimers: function () {
        this.musicTimers.forEach(timer => {
            if (timer && timer.remove) {
                timer.remove();
            } else if (timer && timer.stop) {
                // Handle tweens that were added to musicTimers
                timer.stop();
            }
        });
        this.musicTimers = [];

        if (this.updateTimer) {
            this.updateTimer.remove();
            this.updateTimer = null;
        }
    },

    // Preload just track metadata, not actual audio content
    preload: function (scene) {
        // Just build a list of track IDs without loading them
        for (let i = 1; i <= MUSIC_CONFIG.trackCount; i++) {
            const trackId = `track-${String(i).padStart(2, '0')}`;
            this.tracks.push(trackId);
        }

        // Shuffle the tracks for initial play order
        this.shuffleArray(this.tracks);

        // Set up the play queue
        this.playQueue = [...this.tracks];
        this.currentTrackIndex = -1;

        console.log("Music system ready (tracks will load as needed)");
    },

    // Helper to shuffle an array
    shuffleArray: function (array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    // Called after preload to set up the system
    create: function (scene) {
        // Nothing to do here - we'll load tracks as needed
        return this;
    },

    // Start playing music
    start: function () {
        if (!this.musicEnabled || !this.scene) return;

        // If nothing playing, start
        if (!this.currentTrack || !this.currentTrack.isPlaying) {
            this.playNextTrack();
        }
    },

    // Load and play the next track
    playNextTrack: function () {
        if (!this.musicEnabled || !this.scene || this.isLoading) return;

        // Reset fade out flag
        this.isFadingOut = false;

        // If we've reached the end of the queue, create a new shuffled queue
        if (this.currentTrackIndex >= this.playQueue.length - 1) {
            this.createNewPlayQueue();
        }

        // Move to next track
        this.currentTrackIndex++;

        // Get the next track ID
        const nextTrackId = this.playQueue[this.currentTrackIndex];
        this.nextTrackToPlay = nextTrackId;

        console.log(`Preparing to play next track: ${nextTrackId}`);

        // Load the track if needed
        this.loadTrack(nextTrackId, () => {
            // Start silence period before playing
            this.startSilencePeriod(nextTrackId);
        });
    },

    // CONSERVATIVE: Replace only the tween creation with timer-based fades
    createMusicTimer: function (delay, callback) {
        const timer = this.scene.time.addEvent({
            delay: delay,
            callback: callback,
            callbackScope: this,
            paused: false  // Keep music timers running during game pause
        });

        this.musicTimers.push(timer);
        return timer;
    },

    // FIXED: Create a timer-based fade (corrected timer logic)
    createTimerFade: function (startVolume, endVolume, duration, onUpdate, onComplete) {
        const steps = Math.ceil(duration / 50); // Update every 50ms
        const volumeStep = (endVolume - startVolume) / steps;
        let currentStep = 0;

        console.log(`Creating timer fade: ${startVolume} → ${endVolume} over ${duration}ms (${steps} steps)`);

        // Create a repeating timer that calls our fade function
        const fadeTimer = this.scene.time.addEvent({
            delay: 50,
            callback: () => {
                currentStep++;
                const progress = currentStep / steps;
                const currentVolume = startVolume + (volumeStep * currentStep);

                //console.log(`Fade step ${currentStep}/${steps}: volume ${currentVolume.toFixed(3)}, progress ${(progress * 100).toFixed(1)}%`);

                // Call update callback
                if (onUpdate) {
                    onUpdate(currentVolume, progress);
                }

                // Check if complete
                if (currentStep >= steps) {
                    console.log(`Fade complete! Removing timer.`);
                    fadeTimer.remove();
                    if (onComplete) {
                        onComplete();
                    }
                }
            },
            callbackScope: this,
            repeat: steps - 1, // Repeat for the total number of steps
            paused: false  // Keep running during game pause
        });

        // Add to our music timers for tracking
        this.musicTimers.push(fadeTimer);

        return {
            stop: () => {
                if (fadeTimer) {
                    fadeTimer.remove();
                }
            },
            remove: () => {
                if (fadeTimer) {
                    fadeTimer.remove();
                }
            }
        };
    },

    // UPDATED: Centralized volume setting with robust approach
    setTrackVolume: function (track, volume) {
        if (!track) return;

        // Use the track's setVolume method (which we've overridden to be robust)
        if (typeof track.setVolume === 'function') {
            track.setVolume(volume);
        } else {
            // Fallback: direct manipulation
            if (track._internalVolume !== undefined) {
                track._internalVolume = volume;
            }

            if (this.customVolumeGainNode) {
                this.customVolumeGainNode.gain.value = volume;
            }

            if (track.volume !== undefined) {
                track.volume = volume;
            }
        }

        // Diagnostic logging (reduced threshold to catch smaller mismatches)
        const actualVolume = track.volume || track._internalVolume || 0;
        const gainValue = this.customVolumeGainNode ? this.customVolumeGainNode.gain.value : 0;

        if (Math.abs(actualVolume - volume) > 0.01 || Math.abs(gainValue - volume) > 0.01) {
            console.warn(`Volume check - Target: ${volume.toFixed(3)}, Track: ${actualVolume.toFixed(3)}, Gain: ${gainValue.toFixed(3)}`);
        }
    },

    // Start a silence period before playing the specified track
    startSilencePeriod: function (trackId) {
        console.log(`Starting ${this.silenceDuration}ms silence period before track: ${trackId}`);

        // Use music-specific timer
        this.createMusicTimer(this.silenceDuration, () => {
            console.log("Silence period complete, starting track");
            this.startTrackWithFadeIn(trackId);
        });
    },

    // Load a track just-in-time with callback
    loadTrack: function (trackId, onComplete) {
        // Skip if already loaded
        if (this.scene.sound.get(trackId)) {
            console.log(`Track ${trackId} already loaded`);
            if (onComplete) onComplete();
            return;
        }

        // Mark as loading
        this.isLoading = true;
        console.log(`Loading track: ${trackId}`);

        const trackPath = `${MUSIC_CONFIG.baseUrl}${trackId}.mp3`;

        // Create a loader for just this track
        const loader = new Phaser.Loader.LoaderPlugin(this.scene);

        // Load the track
        loader.audio(trackId, trackPath);

        // Handle completion
        loader.once('complete', () => {
            console.log(`Finished loading track: ${trackId}`);

            // Add to sound manager
            this.scene.sound.add(trackId, {
                loop: false,
                volume: 0
            });

            this.isLoading = false;
            if (onComplete) onComplete();
        });

        // Handle errors
        loader.once('loaderror', (fileObj) => {
            console.error(`Error loading track: ${trackId}`, fileObj);
            this.isLoading = false;

            // Skip to next track on error
            this.playNextTrack();
        });

        // Start loading
        loader.start();
    },

    // UPDATED: Start playing a track with fade-in and custom volume control
    startTrackWithFadeIn: function (trackId) {
        if (!this.musicEnabled || !this.scene) return;

        // Get the sound object for this track
        const track = this.scene.sound.get(trackId);
        if (!track) {
            console.error(`Track not found: ${trackId}`);
            this.playNextTrack(); // Skip to next track
            return;
        }

        // Clean up previous track's custom volume control
        this.cleanupCustomVolumeControl();

        // Stop any currently playing track with immediate fade out
        if (this.currentTrack && this.currentTrack.isPlaying) {
            // Cancel existing fade out if any
            if (this.fadeOutTween) {
                this.fadeOutTween.stop();
                this.fadeOutTween = null;
            }

            // Store reference to track we're fading out
            const trackToStop = this.currentTrack;
            const fadeData = {
                progress: 0,
                startVolume: trackToStop.volume
            };

            // CONSERVATIVE: Replace just the tween with timer fade
            this.fadeOutTween = this.createTimerFade(
                fadeData.startVolume, // start
                0, // end  
                500, // duration
                (volume) => {
                    // onUpdate - keep same logic as before
                    if (trackToStop && trackToStop.isPlaying) {
                        this.setTrackVolume(trackToStop, volume);
                    }
                },
                () => {
                    // onComplete - keep same logic as before
                    if (trackToStop) {
                        trackToStop.stop();
                    }
                    this.fadeOutTween = null;
                }
            );
        }

        // Store reference to current track
        this.currentTrack = track;

        // Start playing at 0 volume
        this.setTrackVolume(track, 0);
        track.play();

        // WAIT for track to actually start, then setup custom volume control
        // This is important because the source node isn't available until playback starts
        this.scene.time.delayedCall(100, () => {
            if (track.isPlaying) {
                this.setupCustomVolumeControl(track);
            }
        });

        console.log(`Started playing: ${trackId}, duration: ${track.duration}s`);

        // Start position monitoring
        this.startPositionMonitoring();

        // Re-apply boss fight effect if it was active
        if (this.isInBossFight) {
            console.log("Re-applying boss fight effect to new track");
            this.applyBossFightEffect();
        }

        // Create fade-in tween
        const targetVolume = this.volume;
        const fadeData = {
            progress: 0,
            targetVolume: targetVolume
        };

        // CONSERVATIVE: Replace just the tween with timer fade  
        this.fadeInTween = this.createTimerFade(
            0, // start
            targetVolume, // end
            this.fadeDuration, // duration
            (volume, progress) => {
                // onUpdate - keep same logic as before
                if (track && track.isPlaying) {
                    this.setTrackVolume(track, volume);

                    // Keep the same logging as before
                    if (Math.floor(progress * 10) !== Math.floor((progress - 0.1) * 10)) {
                        const actualVolume = track.volume;
                        //console.log(`Fade in ${Math.floor(progress * 100)}% - Set: ${volume.toFixed(3)}, Actual: ${actualVolume.toFixed(3)}`);
                    }
                }
            },
            () => {
                // onComplete - keep same logic as before
                console.log("Fade-in complete");
                this.fadeInTween = null;

                if (track && track.isPlaying) {
                    this.setTrackVolume(track, targetVolume);
                }
            }
        );
    },

    // Start monitoring track position for fade-out timing
    startPositionMonitoring: function () {
        // Clear any existing update timer
        if (this.updateTimer) {
            this.updateTimer.remove();
            this.updateTimer = null;
        }

        let hasPreloaded = false;
        let hasFadedOut = false;

        // Create a repeating timer to check position
        this.updateTimer = this.scene.time.addEvent({
            delay: this.updateInterval,
            callback: () => {
                if (!this.currentTrack || !this.currentTrack.isPlaying || this.isFadingOut) {
                    return;
                }

                const currentTime = this.currentTrack.seek;
                const duration = this.currentTrack.duration;
                const timeRemaining = (duration - currentTime) * 1000; // Convert to ms

                // Preload next track when appropriate
                if (!hasPreloaded && timeRemaining <= this.preloadBuffer) {
                    hasPreloaded = true;
                    const nextIdx = this.currentTrackIndex + 1;
                    if (nextIdx < this.playQueue.length) {
                        const nextTrackId = this.playQueue[nextIdx];
                        console.log(`Preloading next track: ${nextTrackId}`);
                        this.loadTrack(nextTrackId);
                    }
                }

                // Start fade out when appropriate
                if (!hasFadedOut && !this.isFadingOut && timeRemaining <= this.fadeOutBuffer) {
                    hasFadedOut = true;
                    console.log(`Starting fade out with ${timeRemaining}ms remaining`);
                    this.startFadeOut();
                }
            },
            loop: true,
            callbackScope: this
        });

        // Keep this timer running during game pause
        this.musicTimers.push(this.updateTimer);
    },

    // Create a new shuffled play queue
    createNewPlayQueue: function () {
        // Clone the tracks array
        const newQueue = [...this.tracks];

        // Shuffle using Fisher-Yates algorithm
        this.shuffleArray(newQueue);

        // If we already had a queue and it's not empty, make sure we don't repeat the last song
        if (this.playQueue.length > 0 && this.currentTrackIndex >= 0) {
            const lastPlayedTrack = this.playQueue[this.currentTrackIndex];

            // If the first track in our new queue is the same as the last played track
            if (newQueue[0] === lastPlayedTrack) {
                // Swap with a random track that's not at index 0
                const swapIndex = 1 + Math.floor(Math.random() * (newQueue.length - 1));
                [newQueue[0], newQueue[swapIndex]] = [newQueue[swapIndex], newQueue[0]];
            }
        }

        // Set the new queue
        this.playQueue = newQueue;
        this.currentTrackIndex = -1; // Reset to start of queue
    },

    // Apply time dilation to current music
    applyTimeDilation: function (timeScale) {
        // No time dilation applied to music - keeping it at normal speed
        return;
    },

    // Start fading out the current track
    startFadeOut: function () {
        if (!this.currentTrack || !this.currentTrack.isPlaying || this.isFadingOut) {
            return;
        }

        console.log("Starting fade out");
        this.isFadingOut = true;

        // Stop position monitoring
        if (this.updateTimer) {
            this.updateTimer.remove();
            this.updateTimer = null;
        }

        // Store initial volume and create fade progress tracker
        const startVolume = this.currentTrack.volume;
        const fadeData = {
            progress: 0,
            startVolume: startVolume
        };

        // CONSERVATIVE: Replace just the tween with timer fade
        this.fadeOutTween = this.createTimerFade(
            startVolume, // start
            0, // end
            this.fadeDuration, // duration
            (volume, progress) => {
                // onUpdate - keep same logic as before
                if (this.currentTrack && this.currentTrack.isPlaying) {
                    this.setTrackVolume(this.currentTrack, volume);
                    /*
                    // Keep the same logging as before
                    if (Math.floor(progress * 10) !== Math.floor((progress - 0.1) * 10)) {
                        console.log(`Fade progress: ${Math.floor(progress * 100)}%, volume: ${volume.toFixed(3)}`);
                    }*/
                }
            },
            () => {
                // onComplete - keep same logic as before
                console.log("Fade out complete");

                if (this.currentTrack) {
                    this.currentTrack.stop();
                }

                this.fadeOutTween = null;
                this.currentTrack = null;
                this.isFadingOut = false;

                this.playNextTrack();
            }
        );
    },

    // Stop the current track and clean up
    stopCurrentTrack: function () {
        // Clean up fade timers (no longer tweens)
        if (this.fadeInTween) {
            this.fadeInTween.stop();
            this.fadeInTween = null;
        }

        if (this.fadeOutTween) {
            this.fadeOutTween.stop();
            this.fadeOutTween = null;
        }

        // Stop position monitoring
        if (this.updateTimer) {
            this.updateTimer.remove();
            this.updateTimer = null;
        }

        // Clean up custom volume control
        this.cleanupCustomVolumeControl();

        // Stop the track
        if (this.currentTrack && this.currentTrack.isPlaying) {
            this.currentTrack.stop();
        }

        this.currentTrack = null;
        this.isFadingOut = false;
    },

    // Enable or disable music
    setMusicEnabled: function (enabled) {
        this.musicEnabled = enabled;

        // If disabling, stop current playback
        if (!enabled && this.currentTrack) {
            this.stopCurrentTrack();
        } else if (enabled && !this.currentTrack && this.scene) {
            // If enabling and nothing is playing, start playback
            this.playNextTrack();
        }

        return this.musicEnabled;
    },

    // Set music volume (affects maximum volume during playback)
    setVolume: function (volume) {
        this.volume = Phaser.Math.Clamp(volume, 0, 1);

        // Update volume of currently playing track
        if (this.currentTrack && this.currentTrack.isPlaying && !gamePaused) {
            this.setTrackVolume(this.currentTrack, this.volume);
        }

        return this.volume;
    },

    // Stop all music playback
    stop: function () {
        this.stopCurrentTrack();
        this.clearMusicTimers();
    },

    // Update method (call from scene's update)
    update: function (time, delta) {
        // Keep music timers running regardless of game pause state
        // This is handled automatically by Phaser
    },

    // Clean up resources (call when changing scenes)
    cleanup: function () {
        this.stop();
        this.clearMusicTimers();
        this.cleanupCustomVolumeControl();
    },

    // CONSERVATIVE: Remove the complex tween resume logic since we're using timers now
    onGamePause: function () {
        console.log("Game paused, applying muffled effect to music");

        if (!this.currentTrack || !this.currentTrack.isPlaying) {
            return;
        }

        try {
            if (this.isUsingWebAudio() && this.currentTrack) {
                const audioContext = this.scene.sound.context || this.forcedAudioContext;

                this.lowPassFilter = audioContext.createBiquadFilter();
                this.lowPassFilter.type = 'lowpass';
                this.lowPassFilter.frequency.value = 800;
                this.lowPassFilter.Q.value = 0.5;

                const destination = this.scene.sound.destination || audioContext.destination;

                if (this.customVolumeGainNode) {
                    this.customVolumeGainNode.disconnect();
                    this.customVolumeGainNode.connect(this.lowPassFilter);
                    this.lowPassFilter.connect(destination);
                    console.log("Applied low-pass filter with existing custom volume control");
                } else {
                    console.warn("No custom volume control found, using fallback filter connection");
                    if (this.currentTrack.source && this.currentTrack.source.disconnect) {
                        this.pauseGainNode = audioContext.createGain();
                        this.pauseGainNode.gain.value = this.currentTrack.volume;

                        this.currentTrack.source.disconnect();
                        this.currentTrack.source.connect(this.lowPassFilter);
                        this.lowPassFilter.connect(this.pauseGainNode);
                        this.pauseGainNode.connect(destination);
                    }
                }

                console.log("Applied low-pass filter successfully");
            }
        } catch (err) {
            console.error("Error applying pause effects:", err);
        }
    },

    // UPDATED: Remove the muffled effect when game is resumed
    onGameResume: function () {
        console.log("Game resumed, removing muffled effect");

        // Skip if no track exists
        if (!this.currentTrack) {
            return;
        }

        try {
            // Remove low-pass filter and restore normal audio routing
            if (this.lowPassFilter && this.isUsingWebAudio()) {
                const audioContext = this.scene.sound.context || this.forcedAudioContext;
                const destination = this.scene.sound.destination || audioContext.destination;

                if (this.customVolumeGainNode) {
                    // Restore normal routing: disconnect filter and reconnect directly
                    this.customVolumeGainNode.disconnect();

                    if (this.lowPassFilter) {
                        this.lowPassFilter.disconnect();
                    }

                    // Reconnect without filter
                    this.customVolumeGainNode.connect(destination);

                    console.log("Restored normal audio routing");
                } else if (this.currentTrack.source && this.currentTrack.source.disconnect) {
                    // Fallback: reconnect source directly
                    this.currentTrack.source.disconnect();
                    this.currentTrack.source.connect(destination);
                }

                // Clean up filter references
                this.lowPassFilter = null;
                if (this.pauseGainNode) {
                    this.pauseGainNode.disconnect();
                    this.pauseGainNode = null;
                }

                console.log("Removed low-pass filter from track");
            }

            // Re-apply boss fight effect if needed
            if (this.isInBossFight) {
                this.applyBossFightEffect();
            }
        } catch (err) {
            console.error("Error removing pause effects:", err);
        }
    },

    // Boss fight effects (placeholder for now)
    applyBossFightEffect: function () {
        this.isInBossFight = true;
        return true;
    },

    removeBossFightEffect: function () {
        this.isInBossFight = false;
        return true;
    },
};

// Export the music system
window.MusicSystem = MusicSystem;