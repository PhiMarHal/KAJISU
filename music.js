// Music System for Word Survivors
// Handles background music with smooth transitions and shuffled playlists
// Loads only one track at a time, when needed

const MusicSystem = {
    // Music tracks and playback state
    tracks: [],             // List of available track IDs (not loaded yet)
    playQueue: [],          // Shuffled play order
    currentTrackIndex: -1,  // Index of currently playing track in playQueue
    currentTrack: null,     // Reference to the currently playing Phaser Sound object
    fadeInTween: null,      // Reference to fade-in tween
    fadeOutTween: null,     // Reference to fade-out tween
    silenceTimer: null,     // Timer for silence between tracks
    nextTrackToPlay: null,  // The next track we plan to play
    isLoading: false,       // Flag to track if we're currently loading a track

    // Configuration
    silenceDuration: 4000,  // 4 seconds of silence between tracks
    fadeDuration: 4000,     // 4 seconds fade in/out
    volume: 0.7,            // Default maximum volume (0-1)
    musicEnabled: true,     // Music enabled/disabled flag
    currentRate: 1.0,       // Current playback rate (affected by time dilation)

    // Boss fight effect settings
    pausedVolume: 0.3,      // Volume level when paused (30% of normal)
    savedVolume: null,      // Store the original volume during pause
    pausePulseTween: null,  // Reference to pulse effect tween
    lowPassFilter: null,    // Reference to Web Audio low-pass filter
    bossFilterNode: null,   // High-pass filter for boss fights
    chorusNodes: [],        // Array of delay nodes for chorus effect
    isInBossFight: false,   // Track if boss fight mode is active
    originalAudioPath: null, // Store original audio routing

    // Initialize the music system
    initialize: function (scene) {
        console.log("Initializing music system");

        // Clear any existing tracks
        this.tracks = [];
        this.playQueue = [];
        this.currentTrackIndex = -1;
        this.currentRate = 1.0;
        this.nextTrackToPlay = null;
        this.isLoading = false;

        // Store scene reference for later use
        this.scene = scene;

        return this;
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
        if (!this.currentTrack) {
            this.playNextTrack();
        }
    },

    // Load and play the next track
    playNextTrack: function () {
        if (!this.musicEnabled || !this.scene || this.isLoading) return;

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

        // Start silence period - we'll load the track during this time
        this.startSilencePeriod(nextTrackId);
    },

    // Start a silence period before playing the specified track
    startSilencePeriod: function (trackId) {
        console.log(`Starting silence period before track: ${trackId}`);

        // Clear any existing silence timer
        if (this.silenceTimer) {
            if (typeof this.silenceTimer === 'number') {
                clearTimeout(this.silenceTimer);
            } else if (this.silenceTimer.remove) {
                this.silenceTimer.remove();
            }
            this.silenceTimer = null;
        }

        // Start loading the track immediately
        this.loadTrack(trackId);

        // Schedule playback after the silence period
        this.silenceTimer = setTimeout(() => {
            // Check if track loaded successfully
            if (this.scene.sound.get(trackId)) {
                console.log("Silence period complete, starting track");
                this.startTrackWithFadeIn(trackId);
            } else {
                // If track isn't loaded yet, wait a bit more or skip
                console.log(`Track ${trackId} not loaded yet, waiting...`);
                this.silenceTimer = setTimeout(() => {
                    if (this.scene.sound.get(trackId)) {
                        this.startTrackWithFadeIn(trackId);
                    } else {
                        console.log(`Giving up on track ${trackId}, skipping to next`);
                        this.playNextTrack();
                    }
                }, 2000); // Wait 2 more seconds
            }
        }, this.silenceDuration);
    },

    // Load a track just-in-time
    loadTrack: function (trackId) {
        // Skip if already loaded
        if (this.scene.sound.get(trackId)) {
            console.log(`Track ${trackId} already loaded`);
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

            // If this is the track we're waiting to play and we're in silence, 
            // we can reduce the silence duration
            if (trackId === this.nextTrackToPlay && this.silenceTimer) {
                clearTimeout(this.silenceTimer);
                this.silenceTimer = setTimeout(() => {
                    this.startTrackWithFadeIn(trackId);
                }, 500); // Just wait half a second
            }
        });

        // Handle errors
        loader.once('loaderror', (fileObj) => {
            console.error(`Error loading track: ${trackId}`, fileObj);
            this.isLoading = false;

            // If this is the track we're waiting to play, skip to next
            if (trackId === this.nextTrackToPlay) {
                console.log("Skipping to next track due to load error");
                this.playNextTrack();
            }
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

        // Stop any currently playing track with immediate fade out
        if (this.currentTrack && this.currentTrack.isPlaying) {
            // Cancel existing fade out if any
            if (this.fadeOutTween) {
                this.fadeOutTween.stop();
                this.fadeOutTween = null;
            }

            // Create quick fade out (500ms)
            this.fadeOutTween = this.scene.tweens.add({
                targets: this.currentTrack,
                volume: 0,
                duration: 500,
                ease: 'Linear',
                onComplete: () => {
                    // Stop the old track
                    this.currentTrack.stop();
                    this.fadeOutTween = null;
                }
            });
        }

        // Store reference to current track
        this.currentTrack = track;

        // Set the initial playback rate based on current time dilation
        track.setRate(this.currentRate);

        // Start playing at 0 volume
        track.setVolume(0);
        track.play();

        // Re-apply boss fight effect if it was active
        if (this.isInBossFight) {
            console.log("Re-applying boss fight effect to new track");
            this.applyBossFightEffect();
        }

        // Create fade-in tween
        this.fadeInTween = this.scene.tweens.add({
            targets: track,
            volume: this.volume,
            duration: this.fadeDuration,
            ease: 'Linear',
            onComplete: () => {
                console.log("Fade-in complete");
                this.fadeInTween = null;

                // Calculate when to start fade-out
                const trackDuration = track.totalDuration * 1000; // Convert to ms
                const adjustedDuration = trackDuration / this.currentRate; // Adjust for time dilation
                const fadeOutTime = Math.max(0, adjustedDuration - this.fadeDuration);

                console.log(`Scheduling fade-out in ${fadeOutTime}ms (real time)`);

                // Early load the next track when we're about 20 seconds from the end
                if (fadeOutTime > 25000) {
                    setTimeout(() => {
                        const nextIdx = this.currentTrackIndex + 1;
                        if (nextIdx < this.playQueue.length) {
                            const nextTrackId = this.playQueue[nextIdx];
                            this.loadTrack(nextTrackId);
                        }
                    }, fadeOutTime - 20000);
                }

                // Use JavaScript setTimeout instead of Phaser timer
                // This continues to run even when game is paused
                setTimeout(() => {
                    console.log("Time to start fade-out (from real timer)");
                    this.startFadeOut();
                }, fadeOutTime);
            }
        });
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
        // Skip if no track is currently playing
        if (!this.currentTrack || !this.currentTrack.isPlaying) return;

        // Store the current rate for reference
        this.currentRate = timeScale;

        // Apply time scale to music - this will affect both speed and pitch
        this.currentTrack.setRate(timeScale);
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

        // Update volume of currently playing track during fade-in/fade-out
        if (this.currentTrack && this.currentTrack.isPlaying) {
            // For simplicity, we don't modify existing tweens, just cap their target value
            if (this.fadeInTween && this.fadeInTween.isPlaying()) {
                // Let the tween continue, but cap at new volume
                this.fadeInTween.updateTo('volume', this.volume, true);
            } else if (!this.fadeOutTween || !this.fadeOutTween.isPlaying()) {
                // If not in a transition, set to current volume directly
                this.currentTrack.setVolume(this.volume);
            }
        }

        return this.volume;
    },

    // Stop all music playback
    stop: function () {
        this.stopCurrentTrack();

        // Also clear any pending timers
        if (this.silenceTimer) {
            if (typeof this.silenceTimer === 'number') {
                clearTimeout(this.silenceTimer);
            } else if (this.silenceTimer.remove) {
                this.silenceTimer.remove();
            }
            this.silenceTimer = null;
        }
    },

    // Start fading out the current track
    startFadeOut: function () {
        if (!this.currentTrack || !this.currentTrack.isPlaying) return;

        // Create fade-out tween
        this.fadeOutTween = this.scene.tweens.add({
            targets: this.currentTrack,
            volume: 0,
            duration: this.fadeDuration,
            ease: 'Linear',
            onComplete: () => {
                // Stop the track and clean up
                this.stopCurrentTrack();

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

        // Stop the track
        if (this.currentTrack && this.currentTrack.isPlaying) {
            this.currentTrack.stop();
        }

        this.currentTrack = null;
    },

    // Update method (call from scene's update)
    update: function (time, delta) {
        // Nothing to update - tweens and timers are handled automatically
    },

    // Clean up resources (call when changing scenes)
    cleanup: function () {
        this.stop();

        // Clear any silence timer
        if (this.silenceTimer) {
            if (typeof this.silenceTimer === 'number') {
                clearTimeout(this.silenceTimer);
            } else if (this.silenceTimer.remove) {
                this.silenceTimer.remove();
            }
            this.silenceTimer = null;
        }
    },

    onGamePause: function () {
        console.log("Game paused, applying muffled effect to music");

        // Skip if no track is playing
        if (!this.currentTrack || (!this.currentTrack.isPlaying && !this.currentTrack.isPaused)) {
            return;
        }

        try {
            // Save the current volume
            this.savedVolume = this.currentTrack.volume;

            // Apply volume reduction for muffled effect
            this.currentTrack.setVolume(this.pausedVolume || 0.3);

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
            const pulseData = { volume: this.pausedVolume || 0.3 };

            // Create a slow pulsing effect
            this.pausePulseTween = this.scene.tweens.add({
                targets: pulseData,
                volume: (this.pausedVolume || 0.3) * 0.7, // Pulse to 70% of pause volume
                duration: 2000,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    // Only modify volume if track still exists
                    if (this.currentTrack) {
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
            if (this.savedVolume !== undefined) {
                this.currentTrack.setVolume(this.savedVolume);
                this.savedVolume = undefined;
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

                    console.log("Removed low-pass filter from track");

                    // If we're in boss fight mode, re-apply the boss fight effect
                    if (this.isInBossFight) {
                        console.log("Re-applying boss fight effect after pause");
                        this.applyBossFightEffect();
                    }
                } catch (err) {
                    console.log("Error removing filter:", err);
                }
            } else if (this.isInBossFight) {
                // If we didn't have a low-pass filter but we're in boss mode,
                // make sure the boss effect is applied
                console.log("Re-applying boss fight effect after pause (no low-pass filter)");
                this.applyBossFightEffect();
            }
        } catch (err) {
            console.log("Error removing pause effects:", err);
        }
    },

    // Helper method to apply low-pass filter
    applyLowPassFilter: function () {
        // Only attempt if Web Audio API is available
        if (!this.scene || !this.scene.sound || !this.scene.sound.context) {
            return;
        }

        try {
            const audioContext = this.scene.sound.context;

            // Create a low-pass filter
            if (!this.lowPassFilter) {
                this.lowPassFilter = audioContext.createBiquadFilter();
                this.lowPassFilter.type = 'lowpass';
                this.lowPassFilter.frequency.value = 800; // Lower = more muffled
                this.lowPassFilter.Q.value = 0.5;
            }

            // Only try to connect if we have access to the source
            if (this.currentTrack.source &&
                typeof this.currentTrack.source.disconnect === 'function' &&
                typeof this.currentTrack.source.connect === 'function') {

                // Get the current destination
                const destination = this.currentTrack.source.destination || audioContext.destination;

                // Connect through the filter
                this.currentTrack.source.disconnect();
                this.currentTrack.source.connect(this.lowPassFilter);
                this.lowPassFilter.connect(destination);

                console.log("Applied low-pass filter");
            }
        } catch (err) {
            console.log("Low-pass filter not supported:", err);
        }
    },

    // Helper method to create volume pulse effect
    createPauseVolumeEffect: function () {
        // Skip if we don't have a scene or the track isn't playing
        if (!this.scene || !this.currentTrack) {
            return;
        }

        // Clean up any existing pulse effect
        if (this.pausePulseTween) {
            this.pausePulseTween.stop();
            this.pausePulseTween = null;
        }

        // Create a simple data object to tween
        const pulseData = { volume: this.pausedVolume };

        try {
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
                    if (this.currentTrack) {
                        this.currentTrack.setVolume(pulseData.volume);
                    }
                }
            });

            console.log("Created pause pulse effect");
        } catch (err) {
            console.log("Error creating pulse effect:", err);
        }
    },

    // Helper to remove low-pass filter
    removeLowPassFilter: function () {
        if (!this.lowPassFilter || !this.currentTrack || !this.currentTrack.source) {
            return;
        }

        try {
            // Only attempt if we have the necessary methods
            if (typeof this.currentTrack.source.disconnect === 'function' &&
                typeof this.currentTrack.source.connect === 'function') {

                const audioContext = this.scene.sound.context;
                const destination = this.currentTrack.source.destination || audioContext.destination;

                // Reconnect without the filter
                this.currentTrack.source.disconnect();
                this.currentTrack.source.connect(destination);

                console.log("Removed low-pass filter");
            }
        } catch (err) {
            console.log("Error removing filter:", err);
        }
    },

    // Boss effect with multiband processing to preserve beat clarity
    applyBossFightEffect: function () {
        if (!this.currentTrack || !this.scene) {
            console.log("Cannot apply boss fight effect: missing currentTrack or scene");
            return false;
        }

        console.log("Applying boss fight audio effect");

        try {
            const audioContext = this.scene.sound.context;
            if (!audioContext) {
                console.log("No audio context available");
                return false;
            }

            // Store track's original source and destination
            if (this.currentTrack.source) {
                this.originalAudioPath = {
                    source: this.currentTrack.source,
                    destination: this.currentTrack.source.destination || audioContext.destination
                };

                // Disconnect the original path
                this.currentTrack.source.disconnect();

                // Master gain control to prevent volume increase
                this.bossMasterGain = audioContext.createGain();
                this.bossMasterGain.gain.value = 0.9; // Slight reduction to 90%

                // MULTIBAND APPROACH:
                // 1. Create three filters to split the frequency spectrum
                // Low band: keeps drums/bass (below 200Hz) 
                this.lowpassFilter = audioContext.createBiquadFilter();
                this.lowpassFilter.type = 'lowpass';
                this.lowpassFilter.frequency.value = 200;
                this.lowpassFilter.Q.value = 0.7;

                // Mid band: voices, most instruments (200Hz to 2000Hz)
                this.bandpass1 = audioContext.createBiquadFilter();
                this.bandpass1.type = 'bandpass';
                this.bandpass1.frequency.value = 800; // Center frequency
                this.bandpass1.Q.value = 0.5; // Wide band

                // High band: cymbals, high harmonics (above 2000Hz)
                this.highpassFilter = audioContext.createBiquadFilter();
                this.highpassFilter.type = 'highpass';
                this.highpassFilter.frequency.value = 2000;
                this.highpassFilter.Q.value = 0.7;

                // 2. Create chorus effect ONLY for the mid and high bands
                const chorusCount = 4; // Just 4 chorus voices
                this.chorusNodes = [];

                for (let i = 0; i < chorusCount; i++) {
                    // Create delay node for chorus
                    const delayNode = audioContext.createDelay();

                    // Slightly longer but subtle delays
                    const delayTime = 0.04 + (i * 0.02);
                    delayNode.delayTime.value = delayTime;

                    // Create gain node with lower volume
                    const gainNode = audioContext.createGain();
                    gainNode.gain.value = 0.25; // 25% volume for chorus effect

                    // Store both nodes as a pair
                    this.chorusNodes.push({ delay: delayNode, gain: gainNode });
                }

                // 3. Create gain nodes to control each frequency band
                this.lowBandGain = audioContext.createGain();
                this.midBandGain = audioContext.createGain();
                this.highBandGain = audioContext.createGain();

                // Adjust levels of each band - preserve low end (beat), reduce mids slightly
                this.lowBandGain.gain.value = 1.0;   // Keep low end at full volume
                this.midBandGain.gain.value = 0.85;  // Slightly reduce mids
                this.highBandGain.gain.value = 0.9;  // Slightly reduce highs

                // 4. Connect everything together:
                // First connect source to all three filters
                this.currentTrack.source.connect(this.lowpassFilter);
                this.currentTrack.source.connect(this.bandpass1);
                this.currentTrack.source.connect(this.highpassFilter);

                // Connect each filter to its band gain
                this.lowpassFilter.connect(this.lowBandGain);
                this.bandpass1.connect(this.midBandGain);
                this.highpassFilter.connect(this.highBandGain);

                // Connect the low band directly to master (no effects) to preserve beat clarity
                this.lowBandGain.connect(this.bossMasterGain);

                // Apply chorus effect ONLY to mid and high bands
                // Mid band chorus
                this.chorusNodes.forEach(chorusVoice => {
                    // Connect mid band to delay
                    this.midBandGain.connect(chorusVoice.delay);

                    // Connect delay to gain
                    chorusVoice.delay.connect(chorusVoice.gain);

                    // Connect gain to master
                    chorusVoice.gain.connect(this.bossMasterGain);
                });

                // Also connect mid band directly (dry signal)
                this.midBandGain.connect(this.bossMasterGain);

                // High band (just send direct to master, or optionally add to chorus)
                this.highBandGain.connect(this.bossMasterGain);

                // Add subtle chorus to high band (optional)
                this.highChorusGain = audioContext.createGain();
                this.highChorusGain.gain.value = 0.12; // Just 12% chorus for high frequencies

                this.highBandGain.connect(this.chorusNodes[0].delay);
                this.chorusNodes[0].delay.connect(this.highChorusGain);
                this.highChorusGain.connect(this.bossMasterGain);

                // Finally connect master gain to destination
                this.bossMasterGain.connect(this.originalAudioPath.destination);

                // 5. Add very gentle modulation to delay times
                this.chorusNodes.forEach((voice, index) => {
                    const oscillator = audioContext.createOscillator();
                    const oscGain = audioContext.createGain();

                    oscillator.type = 'sine';
                    oscillator.frequency.value = 0.08 + (index * 0.04); // Slower modulation

                    oscGain.gain.value = 0.0006; // Very subtle modulation amount

                    oscillator.connect(oscGain);
                    oscGain.connect(voice.delay.delayTime);

                    oscillator.start();

                    voice.oscillator = oscillator;
                    voice.oscGain = oscGain;
                });

                this.isInBossFight = true;
                console.log("Multiband boss fight audio effect applied");
                return true;
            } else {
                console.log("No audio source available");
                return false;
            }
        } catch (err) {
            console.log("Error applying boss fight effect:", err);
            return false;
        }
    },

    // Updated removeBossFightEffect to clean up all multiband nodes
    removeBossFightEffect: function () {
        if (!this.isInBossFight || !this.currentTrack) {
            console.log("Cannot remove boss fight effect: not in boss fight or no current track");
            return false;
        }

        console.log("Removing boss fight audio effect");

        try {
            if (this.originalAudioPath && this.originalAudioPath.source) {
                // Stop all oscillators
                this.chorusNodes.forEach(voice => {
                    if (voice.oscillator) {
                        voice.oscillator.stop();
                    }
                });

                // Disconnect everything
                this.originalAudioPath.source.disconnect();

                if (this.bossMasterGain) this.bossMasterGain.disconnect();

                // Disconnect all frequency band filters
                if (this.lowpassFilter) this.lowpassFilter.disconnect();
                if (this.bandpass1) this.bandpass1.disconnect();
                if (this.highpassFilter) this.highpassFilter.disconnect();

                // Disconnect all band gain nodes
                if (this.lowBandGain) this.lowBandGain.disconnect();
                if (this.midBandGain) this.midBandGain.disconnect();
                if (this.highBandGain) this.highBandGain.disconnect();

                // Disconnect high chorus gain if it exists
                if (this.highChorusGain) this.highChorusGain.disconnect();

                // Disconnect all chorus nodes
                this.chorusNodes.forEach(voice => {
                    if (voice.delay) voice.delay.disconnect();
                    if (voice.gain) voice.gain.disconnect();
                });

                // Reconnect source directly to destination
                this.originalAudioPath.source.connect(this.originalAudioPath.destination);

                console.log("Boss fight audio effect removed");

                // Reset all state
                this.bossMasterGain = null;
                this.lowpassFilter = null;
                this.bandpass1 = null;
                this.highpassFilter = null;
                this.lowBandGain = null;
                this.midBandGain = null;
                this.highBandGain = null;
                this.highChorusGain = null;
                this.chorusNodes = [];
                this.isInBossFight = false;
                this.originalAudioPath = null;

                return true;
            } else {
                console.log("No original audio path available");
                return false;
            }
        } catch (err) {
            console.log("Error removing boss fight effect:", err);
            return false;
        }
    }
};

// Export the music system
window.MusicSystem = MusicSystem;