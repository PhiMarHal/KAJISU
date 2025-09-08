// backgrounds.js - Background visual effects for KAJISU
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

// L Pattern Background System for full-viewport coverage
const LPatternBackgroundSystem = {
    canvas: null,
    isInitialized: false,

    // Configuration
    config: {
        size: 6,
        thickness: 4,
        spacing: 4,
        color: '#FFD700',
        opacity: 0.5  // Low opacity so it doesn't interfere with game
    },

    // Initialize the L pattern background
    init: function () {
        if (this.isInitialized) return;

        console.log("Initializing L pattern background...");

        // Create full-viewport canvas
        this.createCanvas();

        // Draw the pattern
        this.drawPattern();

        // Listen for window resize
        window.addEventListener('resize', () => this.handleResize());

        this.isInitialized = true;
        console.log("L pattern background initialized");
    },

    // Create the background canvas
    createCanvas: function () {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'l-pattern-background';

        // Style the canvas to cover the full viewport behind everything
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.zIndex = '-1000';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.opacity = this.config.opacity;

        // Set actual canvas size to viewport size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Add to body
        document.body.appendChild(this.canvas);
    },

    // Draw the L pattern
    drawPattern: function () {
        if (!this.canvas) return;

        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = this.config.color;

        // Calculate L dimensions with 3:2 ratio (standing up)
        const verticalHeight = this.config.size * 3;
        const horizontalWidth = this.config.size * 2;
        const thickness = this.config.thickness;

        // Interlocking pattern dimensions
        const overlapOffset = horizontalWidth * 0.6;
        const pairWidth = horizontalWidth * 1.6;
        const patternWidth = pairWidth + this.config.spacing;
        const verticalSpacing = verticalHeight + this.config.spacing;

        const numPatternsPerRow = Math.ceil(this.canvas.width / patternWidth) + 2;
        const rows = Math.ceil(this.canvas.height / verticalSpacing) + 1;

        for (let row = 0; row < rows; row++) {
            // Calculate row offset
            const rowOffset = (row % 2 === 1) ? patternWidth / 3 : 0;

            // Create temporary canvas for this row to avoid opacity compounding
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = verticalHeight;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.fillStyle = this.config.color;

            for (let patternIndex = 0; patternIndex < numPatternsPerRow; patternIndex++) {
                const patternStartX = patternIndex * patternWidth - rowOffset;
                const tempY = 0;

                if (patternStartX > this.canvas.width + patternWidth) continue;

                // Normal L position
                const normalLX = patternStartX;
                // Inverted L position
                const invertedLX = patternStartX + overlapOffset;

                // Draw normal L on temp canvas
                if (normalLX + horizontalWidth > 0 && normalLX < this.canvas.width) {
                    tempCtx.fillRect(normalLX, tempY, thickness, verticalHeight);
                    tempCtx.fillRect(normalLX, tempY + verticalHeight - thickness, horizontalWidth, thickness);
                }

                // Draw inverted L on temp canvas
                if (invertedLX + horizontalWidth > 0 && invertedLX < this.canvas.width) {
                    tempCtx.fillRect(invertedLX, tempY, horizontalWidth, thickness);
                    tempCtx.fillRect(invertedLX + horizontalWidth - thickness, tempY, thickness, verticalHeight);
                }
            }

            // Draw temp canvas to main canvas with row-based opacity
            const y = row * verticalSpacing;
            if (y <= this.canvas.height) {
                ctx.globalAlpha = (row % 2 === 0) ? 0.5 : 1.0;
                ctx.drawImage(tempCanvas, 0, y);
                ctx.globalAlpha = 1.0;
            }
        }
    },

    // Handle window resize
    handleResize: function () {
        if (!this.canvas) return;

        // Update canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Redraw pattern
        this.drawPattern();
    },

    // Set opacity
    setOpacity: function (opacity) {
        this.config.opacity = Math.max(0, Math.min(1, opacity));
        if (this.canvas) {
            this.canvas.style.opacity = this.config.opacity;
        }
    },

    // Clean up
    cleanup: function () {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.canvas = null;
        this.isInitialized = false;
        window.removeEventListener('resize', this.handleResize);
        console.log("L pattern background cleaned up");
    }
};

// Export both systems
window.BackgroundAnimationSystem = BackgroundAnimationSystem;
window.LPatternBackgroundSystem = LPatternBackgroundSystem;