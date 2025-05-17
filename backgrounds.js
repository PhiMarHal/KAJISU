// backgrounds.js - Background visual effects for Word Survivors
// Uses Phaser's built-in particle system for backgrounds

// Background Animation System using Phaser
const BackgroundAnimationSystem = {
    // Configuration
    config: {
        particleCount: 200,  // Default count, will be adjusted based on screen size
        particleSize: { min: 1, max: 3 },
        particleSpeed: { min: 20, max: 50 },
        baseColor: 0xdddddd, // Light gray for normal mode (hex format for Phaser)
        bossColor: 0xff2828, // Red for boss mode (hex format for Phaser)
        globalOpacity: 0.8,  // Overall opacity
        bossModeActive: false // Tracks if boss mode is active
    },

    // State references
    scene: null,
    emitter: null,
    particles: null,
    isInitialized: false,

    // Initialize the background animation system
    init: function (scene) {
        // Skip if already initialized
        if (this.isInitialized) return;

        console.log("Initializing background particle system...");

        // Store scene reference
        this.scene = scene;

        // Calculate appropriate particle count based on screen size
        this.calculateParticleCount();

        // Create the particle system using Phaser
        this.createParticleSystem();

        // Mark as initialized
        this.isInitialized = true;

        console.log("Background system initialized with", this.config.particleCount, "particles");

        return this;
    },

    // Calculate appropriate particle count
    calculateParticleCount: function () {
        if (!this.scene) return;

        // Scale particle count based on screen area (roughly 1 particle per 1500 pixels)
        const width = this.scene.sys.game.config.width;
        const height = this.scene.sys.game.config.height;
        const area = width * height;

        this.config.particleCount = Math.floor(area / 1500);

        // Cap the particle count to avoid performance issues
        this.config.particleCount = Math.min(Math.max(this.config.particleCount, 100), 1000);
    },

    // Create the Phaser particle system
    createParticleSystem: function () {
        // Create particle manager - this will automatically be rendered by Phaser
        this.particles = this.scene.add.particles('particle');

        // If the built-in 'particle' texture doesn't exist, create a circle texture at runtime
        if (!this.scene.textures.exists('particle')) {
            this.createParticleTexture();
        }

        // Calculate depth to ensure it's behind other game elements
        // Use a very low depth value to ensure it's behind everything
        const bgDepth = -100;

        // Create particle emitter with initial configuration
        this.emitter = this.particles.createEmitter({
            x: { min: 0, max: this.scene.sys.game.config.width },
            y: { min: 0, max: this.scene.sys.game.config.height },
            scale: {
                start: { min: this.config.particleSize.min / 16, max: this.config.particleSize.max / 16 },
                end: { min: this.config.particleSize.min / 16, max: this.config.particleSize.max / 16 }
            },
            speed: { min: this.config.particleSpeed.min, max: this.config.particleSpeed.max },
            angle: { min: 0, max: 360 },
            lifespan: { min: 20000, max: 30000 }, // Particles live for 20-30 seconds
            quantity: 1,
            frequency: 50, // Spawn a new particle every 50ms
            alpha: { start: this.config.globalOpacity, end: this.config.globalOpacity },
            blendMode: Phaser.BlendModes.NORMAL,
            on: true // Start emitting immediately
        });

        // Set current color
        this.updateParticleColor();

        // Set emitter to be active across the whole screen
        this.emitter.setEmitZone({
            type: 'random',
            source: new Phaser.Geom.Rectangle(
                0, 0,
                this.scene.sys.game.config.width,
                this.scene.sys.game.config.height
            )
        });

        // Ensure particles wrap around the screen
        this.emitter.setBounds(
            -50, -50,
            this.scene.sys.game.config.width + 100,
            this.scene.sys.game.config.height + 100,
            true // Collide with bounds = wrap around
        );

        // Set the depth to ensure it's behind game elements
        this.particles.setDepth(bgDepth);
    },

    // Create a particle texture at runtime if needed
    createParticleTexture: function () {
        const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });

        // Draw a circle for the particle
        graphics.fillStyle(0xffffff, 1); // White color, we'll tint it later
        graphics.fillCircle(8, 8, 8);    // Circle with radius 8 in a 16x16 texture

        // Generate a texture from the graphics object
        graphics.generateTexture('particle', 16, 16);

        // Clean up the graphics object
        graphics.destroy();
    },

    // Update particle color based on boss mode
    updateParticleColor: function () {
        if (!this.emitter) return;

        // Set color based on boss mode
        const color = this.config.bossModeActive ?
            this.config.bossColor : this.config.baseColor;

        // Apply tint to particles
        this.emitter.setTint(color);
    },

    // Set boss mode (changing the color to red)
    setBossMode: function (active) {
        // Don't do anything if already in the correct mode
        if (this.config.bossModeActive === active) return;

        this.config.bossModeActive = active;

        // Update particle color
        this.updateParticleColor();

        console.log("Background animation boss mode:", active ? "ACTIVE" : "INACTIVE");
    },

    // Set overall opacity of the effect
    setOpacity: function (opacity) {
        if (!this.emitter) return;

        // Clamp opacity between 0 and 1
        this.config.globalOpacity = Math.max(0, Math.min(1, opacity));

        // Update particle alpha
        this.emitter.setAlpha(this.config.globalOpacity);

        console.log("Background opacity set to:", this.config.globalOpacity);
    },

    // Handle window or game resize
    handleResize: function (width, height) {
        if (!this.emitter) return;

        // Update emitter bounds
        this.emitter.setEmitZone({
            type: 'random',
            source: new Phaser.Geom.Rectangle(0, 0, width, height)
        });

        // Update wrap bounds
        this.emitter.setBounds(-50, -50, width + 100, height + 100, true);

        // Recalculate particle count and update emitter if needed
        const oldCount = this.config.particleCount;
        this.calculateParticleCount();

        // If particle count changed significantly, update frequency
        if (Math.abs(oldCount - this.config.particleCount) > oldCount * 0.2) {
            const newFrequency = 10000 / this.config.particleCount; // Adjust for desired particles on screen
            this.emitter.frequency = newFrequency;
        }
    },

    // Clean up resources
    cleanup: function () {
        console.log("Cleaning up background system");

        // Stop and destroy the emitter
        if (this.emitter) {
            this.emitter.stop();
            this.emitter = null;
        }

        // Destroy the particle manager
        if (this.particles) {
            this.particles.destroy();
            this.particles = null;
        }

        // Clear references
        this.scene = null;
        this.isInitialized = false;
    }
};

// Export the background animation system
window.BackgroundAnimationSystem = BackgroundAnimationSystem;