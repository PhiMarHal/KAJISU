// backgrounds.js - Background visual effects for Word Survivors
// Uses Phaser's built-in graphics and game objects for backgrounds

// Background Animation System using Phaser primitives
const BackgroundAnimationSystem = {
    // Configuration
    config: {
        particleCount: 200,  // Default count, will be adjusted based on screen size
        particleSize: { min: 1, max: 3 },
        particleSpeed: { min: 5, max: 50 },
        baseColor: 0xdddddd, // Light gray for normal mode (hex format for Phaser)
        bossColor: 0xff3838, // Brighter red for boss mode (increased red component)
        normalOpacity: 0.2,  // Opacity for normal mode
        bossOpacity: 0.3,    // Increased opacity for boss mode for better visibility
        bossModeActive: false, // Tracks if boss mode is active
        debugMode: false     // Disable debug for production
    },

    // State references
    scene: null,
    particles: [],
    particleContainer: null,
    testParticle: null,
    isInitialized: false,

    // Initialize the background animation system
    init: function (scene) {
        // Skip if already initialized
        if (this.isInitialized) return;

        console.log("Initializing background system...");

        // Store scene reference
        this.scene = scene;

        // Calculate appropriate particle count based on screen size
        this.calculateParticleCount();

        // Create a container for all particles
        this.createParticleContainer();

        // Generate all particles
        this.createParticles();

        // Create test particle in debug mode only
        if (this.config.debugMode) {
            this.createTestParticle();
        }

        // Mark as initialized
        this.isInitialized = true;

        console.log("Background system initialized with", this.particles.length, "particles");

        return this;
    },

    // Calculate appropriate particle count
    calculateParticleCount: function () {
        if (!this.scene) return;

        // Scale particle count based on screen area (1 particle per 4000 pixels as you set)
        const width = this.scene.sys.game.config.width;
        const height = this.scene.sys.game.config.height;
        const area = width * height;

        this.config.particleCount = Math.floor(area / 4000);

        // Cap the particle count to avoid performance issues
        this.config.particleCount = Math.min(Math.max(this.config.particleCount, 100), 1000);
    },

    // Create a container for all particles
    createParticleContainer: function () {
        // Create a container at a very deep depth to ensure it's behind everything
        this.particleContainer = this.scene.add.container(0, 0);
        this.particleContainer.setDepth(-1000);
    },

    // Create individual particles
    createParticles: function () {
        // Clear existing particles
        this.particles.forEach(p => p.destroy());
        this.particles = [];

        // Create particles
        for (let i = 0; i < this.config.particleCount; i++) {
            this.createOneParticle();
        }
    },

    // Create a single particle
    createOneParticle: function () {
        // Random position
        const x = Math.random() * this.scene.sys.game.config.width;
        const y = Math.random() * this.scene.sys.game.config.height;

        // Random size
        const size = Phaser.Math.Between(
            this.config.particleSize.min,
            this.config.particleSize.max
        );

        // Random speed
        const speed = Phaser.Math.FloatBetween(
            this.config.particleSpeed.min,
            this.config.particleSpeed.max
        );

        // Random direction
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;

        // Create particle using a Circle graphics object
        // Use the current appropriate opacity based on boss mode
        const opacity = this.config.bossModeActive ?
            this.config.bossOpacity : this.config.normalOpacity;

        // Use the current appropriate color based on boss mode
        const color = this.config.bossModeActive ?
            this.config.bossColor : this.config.baseColor;

        const particle = this.scene.add.circle(x, y, size, color, opacity);

        // Store velocity
        particle.velocityX = velocityX;
        particle.velocityY = velocityY;

        // Add to container
        this.particleContainer.add(particle);

        // Store in our array
        this.particles.push(particle);

        return particle;
    },

    // Create a visible test particle (debug only)
    createTestParticle: function () {
        // Create a large, obvious test particle in the center of the screen
        this.testParticle = this.scene.add.circle(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2,
            20, // Large radius
            0xff0000, // Red color
            1 // Full opacity
        );

        // Add it to our container
        this.particleContainer.add(this.testParticle);

        console.log("Created test particle at center of screen");
    },

    // Update particles - to be called in the scene's update method
    update: function (time, delta) {
        if (!this.isInitialized || !this.particleContainer) return;

        // Convert delta to seconds for smoother movement
        const dt = delta / 1000;

        // Update each particle
        this.particles.forEach(particle => {
            // Move particle
            particle.x += particle.velocityX * dt;
            particle.y += particle.velocityY * dt;

            // Wrap around screen
            if (particle.x < -particle.radius) {
                particle.x = this.scene.sys.game.config.width + particle.radius;
            } else if (particle.x > this.scene.sys.game.config.width + particle.radius) {
                particle.x = -particle.radius;
            }

            if (particle.y < -particle.radius) {
                particle.y = this.scene.sys.game.config.height + particle.radius;
            } else if (particle.y > this.scene.sys.game.config.height + particle.radius) {
                particle.y = -particle.radius;
            }
        });

        // Animate test particle if in debug mode
        if (this.config.debugMode && this.testParticle) {
            this.testParticle.fillColor = (time % 2000 < 1000) ? 0xff0000 : 0x00ff00;
        }
    },

    // Set boss mode (changing the color and opacity)
    setBossMode: function (active) {
        // Don't do anything if already in the correct mode
        if (this.config.bossModeActive === active) return;

        this.config.bossModeActive = active;

        // Update all particles with new color and opacity
        const color = active ? this.config.bossColor : this.config.baseColor;
        const opacity = active ? this.config.bossOpacity : this.config.normalOpacity;

        this.particles.forEach(particle => {
            particle.fillColor = color;
            particle.fillAlpha = opacity;
        });

        console.log("Background animation boss mode:", active ? "ACTIVE" : "INACTIVE");
    },

    // Set overall opacity of the effect
    setOpacity: function (opacity, isBossMode = false) {
        // Store the new opacity in the appropriate config property
        if (isBossMode) {
            this.config.bossOpacity = Math.max(0, Math.min(1, opacity));
        } else {
            this.config.normalOpacity = Math.max(0, Math.min(1, opacity));
        }

        // Only update particles if we're in the corresponding mode
        if (this.config.bossModeActive === isBossMode) {
            // Update all particles with new opacity
            this.particles.forEach(particle => {
                particle.fillAlpha = opacity;
            });
        }

        console.log(`Background ${isBossMode ? 'boss' : 'normal'} opacity set to:`, opacity);
    },

    // Clean up resources
    cleanup: function () {
        console.log("Cleaning up background system");

        // Destroy all particles
        this.particles.forEach(particle => particle.destroy());
        this.particles = [];

        // Destroy test particle
        if (this.testParticle) {
            this.testParticle.destroy();
            this.testParticle = null;
        }

        // Destroy container
        if (this.particleContainer) {
            this.particleContainer.destroy();
            this.particleContainer = null;
        }

        // Clear references
        this.scene = null;
        this.isInitialized = false;
    }
};

// Export the background animation system
window.BackgroundAnimationSystem = BackgroundAnimationSystem;