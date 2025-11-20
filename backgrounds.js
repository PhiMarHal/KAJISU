// backgrounds.js - Background visual effects for KAJISU
// Uses Phaser's built-in graphics and game objects for backgrounds

// Background Animation System using Phaser primitives
const BackgroundAnimationSystem = {
    // Configuration
    config: {
        particleCount: 200,
        particleSize: { min: 1, max: 3 },
        particleSpeed: { min: 5, max: 50 },
        baseColor: 0xdddddd,
        bossColor: 0xff3838,
        normalOpacity: 0.2,
        bossOpacity: 0.3,
        bossModeActive: false,
        debugMode: false
    },

    // State references
    scene: null,
    particles: [],
    particleContainer: null,
    testParticle: null,
    isInitialized: false,

    // Initialize the background animation system
    init: function (scene) {
        if (this.isInitialized) return;

        console.log("Initializing background system...");

        this.scene = scene;
        this.calculateParticleCount();
        this.createParticleContainer();
        this.createParticles();

        if (this.config.debugMode) {
            this.createTestParticle();
        }

        this.isInitialized = true;
        console.log("Background system initialized with", this.particles.length, "particles");

        return this;
    },

    // Calculate appropriate particle count
    calculateParticleCount: function () {
        if (!this.scene) return;

        const width = this.scene.sys.game.config.width;
        const height = this.scene.sys.game.config.height;
        const area = width * height;

        this.config.particleCount = Math.floor(area / 4000);
        this.config.particleCount = Math.min(Math.max(this.config.particleCount, 100), 1000);
    },

    // Create a container for all particles
    createParticleContainer: function () {
        this.particleContainer = this.scene.add.container(0, 0);
        this.particleContainer.setDepth(-1000);
    },

    // Create individual particles
    createParticles: function () {
        this.particles.forEach(p => p.destroy());
        this.particles = [];

        for (let i = 0; i < this.config.particleCount; i++) {
            this.createOneParticle();
        }
    },

    // Create a single particle
    createOneParticle: function () {
        const x = Math.random() * this.scene.sys.game.config.width;
        const y = Math.random() * this.scene.sys.game.config.height;

        const size = Phaser.Math.Between(
            this.config.particleSize.min,
            this.config.particleSize.max
        );

        const speed = Phaser.Math.FloatBetween(
            this.config.particleSpeed.min,
            this.config.particleSpeed.max
        );

        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;

        const opacity = this.config.bossModeActive ?
            this.config.bossOpacity : this.config.normalOpacity;

        const color = this.config.bossModeActive ?
            this.config.bossColor : this.config.baseColor;

        const particle = this.scene.add.circle(x, y, size, color, opacity);

        particle.velocityX = velocityX;
        particle.velocityY = velocityY;

        this.particleContainer.add(particle);
        this.particles.push(particle);

        return particle;
    },

    // Create a test particle for debugging
    createTestParticle: function () {
        this.testParticle = this.scene.add.circle(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2,
            20,
            0xff0000,
            1
        );

        this.particleContainer.add(this.testParticle);

        console.log("Created test particle at center of screen");
    },

    // Update all particles
    update: function (time, delta) {
        if (!this.isInitialized || !this.particleContainer) return;

        const dt = delta / 1000;

        this.particles.forEach(particle => {
            particle.x += particle.velocityX * dt;
            particle.y += particle.velocityY * dt;

            // Wrap around screen with radius for smoother transitions
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

        if (this.config.debugMode && this.testParticle) {
            this.testParticle.fillColor = (time % 2000 < 1000) ? 0xff0000 : 0x00ff00;
        }
    },

    // Set boss mode (changing the color and opacity)
    setBossMode: function (active) {
        if (this.config.bossModeActive === active) return;

        this.config.bossModeActive = active;

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
        if (isBossMode) {
            this.config.bossOpacity = Math.max(0, Math.min(1, opacity));
        } else {
            this.config.normalOpacity = Math.max(0, Math.min(1, opacity));
        }

        if (this.config.bossModeActive === isBossMode) {
            this.particles.forEach(particle => {
                particle.fillAlpha = opacity;
            });
        }

        console.log(`Background ${isBossMode ? 'boss' : 'normal'} opacity set to:`, opacity);
    },

    // Clean up resources
    cleanup: function () {
        console.log("Cleaning up background system");

        this.particles.forEach(particle => particle.destroy());
        this.particles = [];

        if (this.testParticle) {
            this.testParticle.destroy();
            this.testParticle = null;
        }

        if (this.particleContainer) {
            this.particleContainer.destroy();
            this.particleContainer = null;
        }

        this.scene = null;
        this.isInitialized = false;
    }
};

// Gold Border System for game canvas (simplified from L Pattern Background System)
const LPatternBackgroundSystem = {
    borderCanvas: null,
    isInitialized: false,

    // Configuration
    config: {
        color: '#FFD700',
        borderWidth: 8
    },

    // Initialize the border system
    init: function () {
        if (this.isInitialized) return;

        console.log("Initializing gold border system...");

        this.createCanvas();

        setTimeout(() => {
            this.updateBorders();
        }, 200);

        window.addEventListener('resize', () => this.handleResize());

        this.isInitialized = true;
        console.log("Gold border system initialized");
    },

    // Create border canvas
    createCanvas: function () {
        this.borderCanvas = document.createElement('canvas');
        this.borderCanvas.id = 'gold-border-canvas';
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

        // Ensure body background is black
        document.body.style.backgroundColor = '#000000';
    },

    // Find the actual Phaser canvas element
    findPhaserCanvas: function () {
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
        if (!this.borderCanvas) return;

        this.borderCanvas.width = window.innerWidth;
        this.borderCanvas.height = window.innerHeight;

        setTimeout(() => {
            this.updateBorders();
        }, 50);
    },

    // Clean up
    cleanup: function () {
        if (this.borderCanvas?.parentNode) {
            this.borderCanvas.parentNode.removeChild(this.borderCanvas);
        }
        this.borderCanvas = null;
        this.isInitialized = false;
        window.removeEventListener('resize', this.handleResize);

        console.log("Gold border system cleaned up");
    }
};

// Export both systems
window.BackgroundAnimationSystem = BackgroundAnimationSystem;
window.LPatternBackgroundSystem = LPatternBackgroundSystem;