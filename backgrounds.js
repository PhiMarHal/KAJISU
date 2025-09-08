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
    patternCanvas: null,
    borderCanvas: null,
    isInitialized: false,

    // Configuration
    config: {
        size: 6,
        thickness: 4,
        spacing: 4,
        color: '#FFD700',
        opacity: 0.5,
        borderWidth: 8
    },

    // Initialize the L pattern background
    init: function () {
        if (this.isInitialized) return;

        console.log("Initializing L pattern background...");

        // Create canvases
        this.createCanvases();

        // Draw the pattern immediately
        this.drawPattern();

        // Wait for Phaser canvas to be ready, then handle borders
        setTimeout(() => {
            this.updateBorders();
        }, 200);

        // Listen for window resize
        window.addEventListener('resize', () => this.handleResize());

        this.isInitialized = true;
        console.log("L pattern background initialized");
    },

    // Create separate canvases for pattern and border
    createCanvases: function () {
        // Create pattern canvas
        this.patternCanvas = document.createElement('canvas');
        this.patternCanvas.id = 'l-pattern-background';
        this.patternCanvas.style.position = 'fixed';
        this.patternCanvas.style.top = '0';
        this.patternCanvas.style.left = '0';
        this.patternCanvas.style.width = '100vw';
        this.patternCanvas.style.height = '100vh';
        this.patternCanvas.style.zIndex = '-1000';
        this.patternCanvas.style.pointerEvents = 'none';
        this.patternCanvas.style.opacity = this.config.opacity;
        this.patternCanvas.width = window.innerWidth;
        this.patternCanvas.height = window.innerHeight;
        document.body.appendChild(this.patternCanvas);

        // Create border canvas (full opacity)
        this.borderCanvas = document.createElement('canvas');
        this.borderCanvas.id = 'l-border-background';
        this.borderCanvas.style.position = 'fixed';
        this.borderCanvas.style.top = '0';
        this.borderCanvas.style.left = '0';
        this.borderCanvas.style.width = '100vw';
        this.borderCanvas.style.height = '100vh';
        this.borderCanvas.style.zIndex = '-999';
        this.borderCanvas.style.pointerEvents = 'none';
        this.borderCanvas.style.opacity = '1.0';
        this.borderCanvas.width = window.innerWidth;
        this.borderCanvas.height = window.innerHeight;
        document.body.appendChild(this.borderCanvas);
    },

    // Find the actual Phaser canvas element
    findPhaserCanvas: function () {
        // Try multiple selectors to find the Phaser canvas
        const selectors = [
            '#game-container canvas',
            '.phaser-canvas',
            'canvas[data-phaser="true"]',
            '#game-container > canvas'
        ];

        for (const selector of selectors) {
            const canvas = document.querySelector(selector);
            if (canvas) {
                console.log("Found Phaser canvas with selector:", selector);
                return canvas;
            }
        }

        // Fallback: find any canvas inside game-container
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            const canvas = gameContainer.querySelector('canvas');
            if (canvas) {
                console.log("Found canvas in game-container");
                return canvas;
            }
        }

        console.warn("Could not find Phaser canvas");
        return null;
    },

    // Check letterboxing and determine which sides need borders
    getLetterboxingSides: function () {
        const phaserCanvas = this.findPhaserCanvas();
        if (!phaserCanvas) {
            return { top: false, bottom: false, left: false, right: false };
        }

        const canvasRect = phaserCanvas.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        console.log("Canvas rect:", canvasRect);
        console.log("Viewport:", viewportWidth, "x", viewportHeight);

        const sides = {
            left: canvasRect.left > 10,
            right: (viewportWidth - canvasRect.right) > 10,
            top: canvasRect.top > 10,
            bottom: (viewportHeight - canvasRect.bottom) > 10
        };

        console.log("Letterboxing sides:", sides);
        return sides;
    },

    // Check if any letterboxing exists
    hasAnyLetterboxing: function () {
        const sides = this.getLetterboxingSides();
        return sides.left || sides.right || sides.top || sides.bottom;
    },

    // Update borders based on current layout
    updateBorders: function () {
        const letterboxingSides = this.getLetterboxingSides();
        const hasAnyBoxing = this.hasAnyLetterboxing();

        if (hasAnyBoxing) {
            this.drawGameBorder(letterboxingSides);
        } else {
            this.clearBorder();
        }
    },

    // Draw the L pattern
    drawPattern: function () {
        if (!this.patternCanvas) return;

        const ctx = this.patternCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.patternCanvas.width, this.patternCanvas.height);
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

        const numPatternsPerRow = Math.ceil(this.patternCanvas.width / patternWidth) + 2;
        const rows = Math.ceil(this.patternCanvas.height / verticalSpacing) + 1;

        for (let row = 0; row < rows; row++) {
            // Calculate row offset
            const rowOffset = (row % 2 === 1) ? patternWidth / 3 : 0;

            // Create temporary canvas for this row to avoid opacity compounding
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.patternCanvas.width;
            tempCanvas.height = verticalHeight;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.fillStyle = this.config.color;

            for (let patternIndex = 0; patternIndex < numPatternsPerRow; patternIndex++) {
                const patternStartX = patternIndex * patternWidth - rowOffset;
                const tempY = 0;

                if (patternStartX > this.patternCanvas.width + patternWidth) continue;

                // Normal L position
                const normalLX = patternStartX;
                // Inverted L position
                const invertedLX = patternStartX + overlapOffset;

                // Draw normal L on temp canvas
                if (normalLX + horizontalWidth > 0 && normalLX < this.patternCanvas.width) {
                    tempCtx.fillRect(normalLX, tempY, thickness, verticalHeight);
                    tempCtx.fillRect(normalLX, tempY + verticalHeight - thickness, horizontalWidth, thickness);
                }

                // Draw inverted L on temp canvas
                if (invertedLX + horizontalWidth > 0 && invertedLX < this.patternCanvas.width) {
                    tempCtx.fillRect(invertedLX, tempY, horizontalWidth, thickness);
                    tempCtx.fillRect(invertedLX + horizontalWidth - thickness, tempY, thickness, verticalHeight);
                }
            }

            // Draw temp canvas to main canvas with row-based opacity
            const y = row * verticalSpacing;
            if (y <= this.patternCanvas.height) {
                ctx.globalAlpha = (row % 2 === 0) ? 0.5 : 1.0;
                ctx.drawImage(tempCanvas, 0, y);
                ctx.globalAlpha = 1.0;
            }
        }
    },

    // Draw border around game area only on needed sides
    drawGameBorder: function (sides) {
        const phaserCanvas = this.findPhaserCanvas();
        if (!phaserCanvas) return;

        const ctx = this.borderCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.borderCanvas.width, this.borderCanvas.height);

        const canvasRect = phaserCanvas.getBoundingClientRect();
        const borderWidth = this.config.borderWidth;

        ctx.fillStyle = this.config.color;

        const x = canvasRect.left;
        const y = canvasRect.top;
        const width = canvasRect.width;
        const height = canvasRect.height;

        console.log("Drawing border around canvas at:", x, y, width, height);

        // Draw only the sides that have letterboxing
        if (sides.top) {
            ctx.fillRect(x - borderWidth, y - borderWidth, width + (borderWidth * 2), borderWidth);
        }

        if (sides.bottom) {
            ctx.fillRect(x - borderWidth, y + height, width + (borderWidth * 2), borderWidth);
        }

        if (sides.left) {
            ctx.fillRect(x - borderWidth, y, borderWidth, height);
        }

        if (sides.right) {
            ctx.fillRect(x + width, y, borderWidth, height);
        }

        console.log("Drew game border - letterboxing on sides:", sides);
    },

    // Clear the border canvas
    clearBorder: function () {
        if (!this.borderCanvas) return;
        const ctx = this.borderCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.borderCanvas.width, this.borderCanvas.height);
    },

    // Handle window resize
    handleResize: function () {
        if (!this.patternCanvas || !this.borderCanvas) return;

        // Update canvas sizes
        this.patternCanvas.width = window.innerWidth;
        this.patternCanvas.height = window.innerHeight;
        this.borderCanvas.width = window.innerWidth;
        this.borderCanvas.height = window.innerHeight;

        // Redraw pattern
        this.drawPattern();

        // Update borders after a short delay to let layout settle
        setTimeout(() => {
            this.updateBorders();
        }, 50);
    },

    // Set opacity (only affects pattern, not border)
    setOpacity: function (opacity) {
        this.config.opacity = Math.max(0, Math.min(1, opacity));
        if (this.patternCanvas) {
            this.patternCanvas.style.opacity = this.config.opacity;
        }
    },

    // Clean up
    cleanup: function () {
        if (this.patternCanvas && this.patternCanvas.parentNode) {
            this.patternCanvas.parentNode.removeChild(this.patternCanvas);
        }
        if (this.borderCanvas && this.borderCanvas.parentNode) {
            this.borderCanvas.parentNode.removeChild(this.borderCanvas);
        }
        this.patternCanvas = null;
        this.borderCanvas = null;
        this.isInitialized = false;
        window.removeEventListener('resize', this.handleResize);

        // Restore CSS decorations
        this.showCSSBorderDecorations();

        console.log("L pattern background cleaned up");
    }
};

// Export both systems
window.BackgroundAnimationSystem = BackgroundAnimationSystem;
window.LPatternBackgroundSystem = LPatternBackgroundSystem;