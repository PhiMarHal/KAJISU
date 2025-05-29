// Music System for Word Survivors
// Handles background music with smooth transitions and shuffled playlists
// Uses dynamic position checking and proxy objects for reliable fading

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
    silenceDuration: 4000,  // 4 seconds of silence between tracks
    fadeDuration: 4000,     // 4 seconds fade in/out
    volume: 0.7,            // Default maximum volume (0-1)
    musicEnabled: true,     // Music enabled/disabled flag

    // Timing configuration
    fadeOutBuffer: 8000,    // Start fade out 8 seconds before end (fade + silence)
    preloadBuffer: 20000,   // Start preloading next track 20 seconds before end
    updateInterval: 100,    // Check position every 100ms

    // Pause settings
    pausedVolume: 0.3,      // Volume level when paused (30% of normal)
    savedVolume: null,      // Store the original volume during pause
    pausePulseTween: null,  // Reference to pulse effect tween
    lowPassFilter: null,    // Reference to Web Audio low-pass filter

    // Boss fight effect settings
    isInBossFight: false,   // Track if boss fight mode is active

    // Separate timer tracking for music (not affected by game pause)
    musicTimers: [],        // Store all music-specific timers

    // Initialize the music system
    initialize: function (scene) {
        console.log("Initializing music system");

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

        return this;
    },

    // Helper to create a music-specific timer that ignores game pause
    createMusicTimer: function (delay, callback) {
        const timer = this.scene.time.addEvent({
            delay: delay,
            callback: callback,
            callbackScope: this
        });

        this.musicTimers.push(timer);
        return timer;
    },

    // Clear all music timers
    clearMusicTimers: function () {
        this.musicTimers.forEach(timer => {
            if (timer && timer.remove) {
                timer.remove();
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
        for (let i = 1; i <= 23; i++) {
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

        const trackPath = `music/${trackId}.mp3`;

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

    // Start playing a track with fade-in
    startTrackWithFadeIn: function (trackId) {
        if (!this.musicEnabled || !this.scene) return;

        // Get the sound object for this track
        const track = this.scene.sound.get(trackId);
        if (!track) {
            console.error(`Track not found: ${trackId}`);
            this.playNextTrack(); // Skip to next track
            return;
        }

        // DIAGNOSTIC: Log sound manager state
        console.log('=== DIAGNOSTIC: Before playing new track ===');
        console.log(`Sound manager volume: ${this.scene.sound.volume}`);
        console.log(`Sound manager mute: ${this.scene.sound.mute}`);
        console.log(`Using Web Audio: ${this.scene.sound.usingWebAudio}`);
        console.log(`Number of sounds in manager: ${this.scene.sound.sounds.length}`);

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

            // Create quick fade out (500ms)
            this.fadeOutTween = this.scene.tweens.add({
                targets: fadeData,
                progress: 1,
                duration: 500,
                ease: 'Linear',
                onUpdate: () => {
                    // Apply volume based on progress
                    if (trackToStop && trackToStop.isPlaying) {
                        const newVolume = fadeData.startVolume * (1 - fadeData.progress);
                        trackToStop.setVolume(newVolume);
                    }
                },
                onComplete: () => {
                    // Stop the old track
                    if (trackToStop) {
                        trackToStop.stop();
                    }
                    this.fadeOutTween = null;
                }
            });
        }

        // Store reference to current track
        this.currentTrack = track;

        // Start playing at 0 volume
        track.setVolume(0);
        track.play();

        // DIAGNOSTIC: Verify the track is the one we think it is
        console.log(`Started playing: ${trackId}, duration: ${track.duration}s`);
        console.log(`Track object ID: ${track.key}`);
        console.log(`Track initial volume: ${track.volume}`);
        console.log(`Is same object: ${track === this.currentTrack}`);

        // DIAGNOSTIC: Check all playing sounds
        const playingSounds = this.scene.sound.sounds.filter(s => s.isPlaying);
        console.log(`Total playing sounds: ${playingSounds.length}`);
        playingSounds.forEach((s, i) => {
            console.log(`  Sound ${i}: ${s.key}, volume: ${s.volume}, mute: ${s.mute}`);
        });

        // Start position monitoring
        this.startPositionMonitoring();

        // Re-apply boss fight effect if it was active
        if (this.isInBossFight) {
            console.log("Re-applying boss fight effect to new track");
            this.applyBossFightEffect();
        }

        // Create fade-in tween
        const targetVolume = gamePaused ? this.pausedVolume : this.volume;
        const fadeData = {
            progress: 0,
            targetVolume: targetVolume
        };

        console.log(`Fade in starting to volume: ${targetVolume}`);

        this.fadeInTween = this.scene.tweens.add({
            targets: fadeData,
            progress: 1,
            duration: this.fadeDuration,
            ease: 'Linear',
            onUpdate: (tween) => {
                // Calculate and apply volume based on progress
                if (track && track.isPlaying) {
                    const newVolume = fadeData.targetVolume * fadeData.progress;
                    track.setVolume(newVolume);

                    // DIAGNOSTIC: Log actual vs expected
                    if (Math.floor(tween.progress * 10) !== Math.floor((tween.progress - 0.1) * 10)) {
                        const actualVolume = track.volume;
                        console.log(`Fade in ${Math.floor(tween.progress * 100)}% - Set: ${newVolume.toFixed(3)}, Actual: ${actualVolume.toFixed(3)}`);

                        // Check if volume is being overridden
                        if (Math.abs(actualVolume - newVolume) > 0.01) {
                            console.warn(`VOLUME MISMATCH! Expected ${newVolume}, got ${actualVolume}`);

                            // Check sound manager
                            console.log(`Sound manager volume: ${this.scene.sound.volume}`);
                            console.log(`Track mute: ${track.mute}`);
                        }
                    }
                }
            },
            onComplete: () => {
                console.log("Fade-in complete");
                this.fadeInTween = null;

                // Ensure we're at target volume
                if (track && track.isPlaying) {
                    track.setVolume(targetVolume);
                }

                // Apply pause effect if game is paused
                if (gamePaused) {
                    this.onGamePause();
                }
            }
        });
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

        console.log(`Fade out starting from volume: ${startVolume}`);

        // Create fade-out tween on the progress value
        this.fadeOutTween = this.scene.tweens.add({
            targets: fadeData,
            progress: 1,
            duration: this.fadeDuration,
            ease: 'Linear',
            onUpdate: (tween) => {
                // Calculate and apply volume based on progress
                if (this.currentTrack && this.currentTrack.isPlaying) {
                    const newVolume = fadeData.startVolume * (1 - fadeData.progress);
                    this.currentTrack.setVolume(newVolume);

                    // Log periodically to debug
                    if (Math.floor(tween.progress * 10) !== Math.floor((tween.progress - 0.1) * 10)) {
                        console.log(`Fade progress: ${Math.floor(tween.progress * 100)}%, volume: ${newVolume.toFixed(3)}`);
                    }
                }
            },
            onComplete: () => {
                console.log("Fade out complete");

                // Stop the track
                if (this.currentTrack) {
                    this.currentTrack.stop();
                }

                // Clean up
                this.fadeOutTween = null;
                this.currentTrack = null;
                this.isFadingOut = false;

                // Play the next track
                this.playNextTrack();
            }
        });
    },

    // Stop the current track and clean up
    stopCurrentTrack: function () {
        // Clean up tweens
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
            this.currentTrack.setVolume(this.volume);
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
    },

    // Pause effect for music
    onGamePause: function () {
        console.log("Game paused, applying muffled effect to music");

        // Skip if no track is playing
        if (!this.currentTrack || !this.currentTrack.isPlaying) {
            return;
        }

        // DIAGNOSTIC: Log pause state
        console.log('=== DIAGNOSTIC: Pause effect ===');
        console.log(`Current track volume before pause: ${this.currentTrack.volume}`);
        console.log(`Pause volume target: ${this.pausedVolume}`);
        console.log(`Sound manager volume: ${this.scene.sound.volume}`);

        try {
            // Save the current volume
            this.savedVolume = this.currentTrack.volume;

            // Apply volume reduction for muffled effect
            currentTrack.setVolume(this.pausedVolume);

            // DIAGNOSTIC: Verify volume was set
            console.log(`Volume after setVolume: ${this.currentTrack.volume}`);
            if (Math.abs(this.currentTrack.volume - this.pausedVolume) > 0.01) {
                console.error(`PAUSE VOLUME NOT SET! Expected ${this.pausedVolume}, got ${this.currentTrack.volume}`);
            }

            // Try to apply low-pass filter (advanced effect)
            if (this.scene && this.scene.sound && this.scene.sound.context &&
                this.currentTrack.source && this.currentTrack.source.disconnect) {

                const audioContext = this.scene.sound.context;

                // Create a low-pass filter
                this.lowPassFilter = audioContext.createBiquadFilter();
                this.lowPassFilter.type = 'lowpass';
                this.lowPassFilter.frequency.value = 800; // Lower = more muffled
                this.lowPassFilter.Q.value = 0.5;

                // Get the current destination
                const destination = this.currentTrack.source.destination || audioContext.destination;

                // Connect through the filter
                this.currentTrack.source.disconnect();
                this.currentTrack.source.connect(this.lowPassFilter);
                this.lowPassFilter.connect(destination);

                console.log("Applied low-pass filter");
            }

            // Create a simple volume pulse effect
            const pulseData = { volume: this.pausedVolume };

            // Create a slow pulsing effect
            this.pausePulseTween = this.scene.tweens.add({
                targets: pulseData,
                volume: this.pausedVolume * 0.7, // Pulse to 70% of pause volume
                duration: 2000,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    // Only modify volume if track still exists
                    if (this.currentTrack && gamePaused) {
                        this.currentTrack.setVolume(pulseData.volume);
                    }
                }
            });
        } catch (err) {
            console.log("Error applying pause effects:", err);
        }
    },

    // Remove the muffled effect when game is resumed
    onGameResume: function () {
        console.log("Game resumed, removing muffled effect");

        // Skip if no track exists
        if (!this.currentTrack) {
            return;
        }

        try {
            // Stop the pulse effect if it exists
            if (this.pausePulseTween) {
                this.pausePulseTween.stop();
                this.pausePulseTween = null;
            }

            // Restore volume
            if (this.savedVolume !== null && this.savedVolume !== undefined) {
                this.currentTrack.setVolume(this.savedVolume);
                this.savedVolume = null;
            } else {
                // Fallback to normal volume
                this.currentTrack.setVolume(this.volume);
            }

            // Remove low-pass filter if we applied one
            if (this.lowPassFilter && this.currentTrack.source &&
                this.currentTrack.source.disconnect) {
                try {
                    const audioContext = this.scene.sound.context;
                    const destination = this.currentTrack.source.destination || audioContext.destination;

                    // Reconnect without the filter
                    this.currentTrack.source.disconnect();
                    this.currentTrack.source.connect(destination);
                    this.lowPassFilter = null;

                    console.log("Removed low-pass filter from track");
                } catch (err) {
                    console.log("Error removing filter:", err);
                }
            }

            // Re-apply boss fight effect if needed
            if (this.isInBossFight) {
                this.applyBossFightEffect();
            }
        } catch (err) {
            console.log("Error removing pause effects:", err);
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

    // DIAGNOSTIC: Function to check current music state
    diagnose: function () {
        console.log('=== MUSIC SYSTEM DIAGNOSTIC ===');
        console.log(`Music enabled: ${this.musicEnabled}`);
        console.log(`Current track exists: ${!!this.currentTrack}`);

        if (this.currentTrack) {
            console.log(`Track key: ${this.currentTrack.key}`);
            console.log(`Track volume: ${this.currentTrack.volume}`);
            console.log(`Track mute: ${this.currentTrack.mute}`);
            console.log(`Track isPlaying: ${this.currentTrack.isPlaying}`);
            console.log(`Track isPaused: ${this.currentTrack.isPaused}`);
        }

        console.log(`Scene exists: ${!!this.scene}`);
        if (this.scene && this.scene.sound) {
            console.log(`Sound manager volume: ${this.scene.sound.volume}`);
            console.log(`Sound manager mute: ${this.scene.sound.mute}`);
            console.log(`Using Web Audio: ${this.scene.sound.usingWebAudio}`);
            console.log(`Total sounds: ${this.scene.sound.sounds.length}`);

            const playingSounds = this.scene.sound.sounds.filter(s => s.isPlaying);
            console.log(`Playing sounds: ${playingSounds.length}`);
            playingSounds.forEach((s, i) => {
                console.log(`  ${i}: ${s.key} - vol: ${s.volume}, mute: ${s.mute}`);
            });
        }

        console.log(`Is fading out: ${this.isFadingOut}`);
        console.log(`Configured volume: ${this.volume}`);
        console.log(`Configured pause volume: ${this.pausedVolume}`);

        // Try a direct volume test
        if (this.currentTrack && this.currentTrack.isPlaying) {
            const testVol = 0.1;
            console.log(`\nTesting setVolume(${testVol})...`);
            this.currentTrack.setVolume(testVol);
            console.log(`Result: ${this.currentTrack.volume}`);
        }
    }
};

// Export the music system
window.MusicSystem = MusicSystem;