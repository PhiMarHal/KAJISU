// Music System for Word Survivors
// Handles background music with smooth transitions and shuffled playlists

const MusicSystem = {
    // Music tracks and playback state
    tracks: [],             // List of all available music tracks
    playQueue: [],          // Current shuffled play order
    currentTrackIndex: -1,  // Index of currently playing track in playQueue
    currentTrack: null,     // Reference to the currently playing Phaser Sound object
    fadeInTween: null,      // Reference to fade-in tween
    fadeOutTween: null,     // Reference to fade-out tween
    silenceTimer: null,     // Timer for silence between tracks

    // Configuration
    silenceDuration: 4000,  // 4 seconds of silence between tracks
    fadeDuration: 4000,     // 4 seconds fade in/out
    volume: 0.7,            // Default maximum volume (0-1)
    musicEnabled: true,     // Music enabled/disabled flag
    currentRate: 1.0,       // Current playback rate (affected by time dilation)

    // Low pass
    pausedVolume: 0.3,      // Volume level when paused (30% of normal)
    savedVolume: null,      // Store the original volume during pause
    pausePulseTween: null,  // Reference to pulse effect tween
    lowPassFilter: null,    // Reference to Web Audio low-pass filter

    // Boss time
    bossFilterNode: null,      // High-pass filter for boss fights
    chorusNodes: [],           // Array of delay nodes for chorus effect
    isInBossFight: false,      // Track if boss fight mode is active
    originalAudioPath: null,   // Store original audio routing

    // Initialize the music system
    initialize: function (scene) {
        console.log("Initializing music system");

        // Clear any existing tracks
        this.tracks = [];
        this.playQueue = [];
        this.currentTrackIndex = -1;
        this.currentRate = 1.0;

        // Store scene reference for later use
        this.scene = scene;

        return this;
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

    // Preload music tracks
    preload: function (scene) {
        // Load all music tracks with the given pattern
        // Example usage: scene.load.audio('track-01', 'assets/audio/track-01.mp3');

        // Add tracks to the list as they're loaded
        for (let i = 1; i <= 23; i++) {
            const trackId = `track-${String(i).padStart(2, '0')}`;
            const trackPath = `music/${trackId}.mp3`;

            scene.load.audio(trackId, trackPath);
            this.tracks.push(trackId);
        }
    },

    // Called after preload to create sound objects
    create: function (scene) {
        // Create the actual sound objects once loading is complete
        this.tracks.forEach(trackId => {
            // Create with volume 0 - we'll control volume with tweens
            scene.sound.add(trackId, {
                loop: false,
                volume: 0
            });
        });

        // Create initial shuffled queue
        this.createNewPlayQueue();

        return this;
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

    // Start playing music from the queue
    start: function () {
        if (!this.musicEnabled || !this.scene) return;

        // If nothing playing, start
        if (!this.currentTrack) {
            this.playNextTrack();
        }
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

    // Create a new shuffled play queue
    createNewPlayQueue: function () {
        // Clone the tracks array
        const newQueue = [...this.tracks];

        // Shuffle using Fisher-Yates algorithm
        for (let i = newQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
        }

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

    // Play the next track in the queue
    playNextTrack: function () {
        if (!this.musicEnabled || !this.scene) return;

        // If we've reached the end of the queue, create a new shuffled queue
        if (this.currentTrackIndex >= this.playQueue.length - 1) {
            this.createNewPlayQueue();
        }

        // Move to next track
        this.currentTrackIndex++;

        // Get the next track ID
        const nextTrackId = this.playQueue[this.currentTrackIndex];

        // Start a silence period before playing
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

        // Use JavaScript setTimeout instead of Phaser timer
        // This continues to run even when game is paused
        this.silenceTimer = setTimeout(() => {
            console.log("Silence period complete, starting track");
            this.startTrackWithFadeIn(trackId);
        }, this.silenceDuration);
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

                // Use JavaScript setTimeout instead of Phaser timer
                // This continues to run even when game is paused
                setTimeout(() => {
                    console.log("Time to start fade-out (from real timer)");
                    this.startFadeOut();
                }, fadeOutTime);
            }
        });
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
                } catch (err) {
                    console.log("Error removing filter:", err);
                }
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

    // Apply boss fight audio effect
    applyBossFightEffect: function () {
        //if (!this.currentTrack || !this.scene) return;

        console.log("Applying boss fight audio effect");

        try {
            const audioContext = this.scene.sound.context;
            if (!audioContext) {
                console.log("No audio context available");
                return;
            }

            // Store track's original source and destination
            if (this.currentTrack.source) {
                this.originalAudioPath = {
                    source: this.currentTrack.source,
                    destination: this.currentTrack.source.destination || audioContext.destination
                };

                // Disconnect the original path
                this.currentTrack.source.disconnect();

                // 1. Create high-pass filter
                this.bossFilterNode = audioContext.createBiquadFilter();
                this.bossFilterNode.type = 'highpass';
                this.bossFilterNode.frequency.value = 200; // Adjust as needed
                this.bossFilterNode.Q.value = 1.0;

                // 2. Create chorus effect with multiple delay nodes
                const chorusCount = 8; // Number of chorus voices
                this.chorusNodes = [];

                for (let i = 0; i < chorusCount; i++) {
                    // Create delay node for chorus
                    const delayNode = audioContext.createDelay();

                    // Set delay time - slightly different for each voice
                    // Base delay of 20ms plus a variation up to 10ms
                    const delayTime = 0.02 + (i * 0.01);
                    delayNode.delayTime.value = delayTime;

                    // Create gain node to control chorus voice level
                    const gainNode = audioContext.createGain();
                    gainNode.gain.value = 0.3; // Each voice at 30% volume

                    // Store both nodes as a pair
                    this.chorusNodes.push({ delay: delayNode, gain: gainNode });
                }

                // 3. Connect everything together
                // First connect source to the high-pass filter
                this.currentTrack.source.connect(this.bossFilterNode);

                // Connect filter directly to destination (dry signal)
                this.bossFilterNode.connect(this.originalAudioPath.destination);

                // Also connect filter to each chorus voice
                this.chorusNodes.forEach(chorusVoice => {
                    // Connect filter to delay
                    this.bossFilterNode.connect(chorusVoice.delay);

                    // Connect delay to gain
                    chorusVoice.delay.connect(chorusVoice.gain);

                    // Connect gain to destination
                    chorusVoice.gain.connect(this.originalAudioPath.destination);
                });

                // Optional: Add slight modulation to chorus delay times
                // This makes the effect more interesting over time
                this.chorusNodes.forEach((voice, index) => {
                    // Create an oscillator for modulation
                    const oscillator = audioContext.createOscillator();
                    const oscGain = audioContext.createGain();

                    // Set oscillator properties
                    oscillator.type = 'sine';
                    oscillator.frequency.value = 0.1 + (index * 0.05); // Different for each voice

                    // Set modulation amount
                    oscGain.gain.value = 0.001; // Small modulation amount

                    // Connect oscillator through gain to delay time
                    oscillator.connect(oscGain);
                    oscGain.connect(voice.delay.delayTime);

                    // Start the oscillator
                    oscillator.start();

                    // Store oscillator for later cleanup
                    voice.oscillator = oscillator;
                    voice.oscGain = oscGain;
                });

                this.isInBossFight = true;
                console.log("Boss fight audio effect applied");
            }
        } catch (err) {
            console.log("Error applying boss fight effect:", err);
        }
    },

    // Remove boss fight audio effect
    removeBossFightEffect: function () {
        //if (!this.isInBossFight || !this.currentTrack) return;

        console.log("Removing boss fight audio effect");

        try {
            if (this.originalAudioPath && this.originalAudioPath.source) {
                // First, stop all oscillators
                this.chorusNodes.forEach(voice => {
                    if (voice.oscillator) {
                        voice.oscillator.stop();
                    }
                });

                // Disconnect everything
                this.originalAudioPath.source.disconnect();

                if (this.bossFilterNode) {
                    this.bossFilterNode.disconnect();
                }

                this.chorusNodes.forEach(voice => {
                    voice.delay.disconnect();
                    voice.gain.disconnect();
                });

                // Reconnect source directly to destination
                this.originalAudioPath.source.connect(this.originalAudioPath.destination);

                console.log("Boss fight audio effect removed");
            }
        } catch (err) {
            console.log("Error removing boss fight effect:", err);
        }

        // Reset state
        this.bossFilterNode = null;
        this.chorusNodes = [];
        this.isInBossFight = false;
        this.originalAudioPath = null;
    },
};

// Export the music system
window.MusicSystem = MusicSystem;