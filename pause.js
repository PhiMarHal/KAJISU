// pause.js - Pause System for Word Survivors

const PauseSystem = {
    // --- State Variables ---
    isPaused: false,        // Tracks the current pause state
    pauseScreen: null,      // Semi-transparent background overlay
    pauseMessage: null,     // "GAME PAUSED" text
    resumeButton: null,     // Button to resume the game
    pauseKeyP: null,        // Phaser Key object for 'P'
    pausePerksContainer: null, // Container for displaying perks on pause screen
    perkIcons: [],          // Array to hold perk icon text objects
    paginationControls: [], // Array to hold pagination arrows/text
    activePerkCard: null,   // Array holding elements of the currently displayed perk card
    currentPerkPage: 0,     // Current page number for perk display pagination

    // --- Initialization ---

    /**
     * Initializes the Pause System.
     * Sets up keyboard listeners and creates the UI elements (initially hidden).
     * @param {Phaser.Scene} scene - The main game scene.
     */
    init: function (scene) {
        console.log("Initializing Pause System...");

        // Reset state variables
        this.isPaused = false;
        this.perkIcons = [];
        this.paginationControls = [];
        this.activePerkCard = null;
        this.currentPerkPage = 0;

        // Create pause key (P)
        this.pauseKeyP = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        this.pauseKeyP.on('down', () => {
            if (!gameOver) { // Check global gameOver flag
                this.togglePause(scene);
            }
        });

        // Setup visibility change detection
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && !gameOver && !this.isPaused) {
                // Tab/window is hidden, pause the game with overlay
                this.showOverlay(scene);
            }
            // We don't auto-resume when tab becomes visible again
        });

        // Create pause overlay UI elements (initially hidden)
        this.createUI(scene);

        console.log("Pause System initialized.");
    },

    /**
     * Creates the core UI elements for the pause screen (background, message, button, perk container).
     * These elements start hidden.
     * @param {Phaser.Scene} scene - The main game scene.
     */
    createUI: function (scene) {
        const screenCenterX = scene.cameras.main.width / 2;
        const screenCenterY = scene.cameras.main.height / 2;
        const screenWidth = scene.cameras.main.width;
        const screenHeight = scene.cameras.main.height;

        // Create semi-transparent background
        this.pauseScreen = scene.add.rectangle(screenCenterX, screenCenterY, screenWidth, screenHeight, 0x000000, 0.7)
            .setVisible(false)
            .setDepth(1000); // High depth to be on top

        // Create pause message
        this.pauseMessage = scene.add.text(
            screenCenterX, 100,
            'GAME PAUSED',
            { fontFamily: 'Arial', fontSize: '40px', color: '#ffffff', fontStyle: 'bold' }
        )
            .setOrigin(0.5)
            .setVisible(false)
            .setDepth(1001);

        // Create resume button
        this.resumeButton = scene.add.text(
            screenCenterX, screenHeight - 100, // Positioned lower
            'RESUME GAME',
            {
                fontFamily: 'Arial',
                fontSize: '36px',
                color: '#ffffff',
                backgroundColor: '#008800',
                padding: { left: 15, right: 15, top: 10, bottom: 10 }
            }
        )
            .setOrigin(0.5)
            .setVisible(false)
            .setDepth(1001)
            .setInteractive({ useHandCursor: true });

        // Add resume button functionality
        this.resumeButton.on('pointerdown', () => this.hideOverlay(scene));
        this.resumeButton.on('pointerover', function () { this.setStyle({ backgroundColor: '#00aa00' }); });
        this.resumeButton.on('pointerout', function () { this.setStyle({ backgroundColor: '#008800' }); });

        // Create container for perks display
        this.pausePerksContainer = scene.add.container(0, 0)
            .setDepth(1001)
            .setVisible(false);

        // Create perks title
        const perksTitle = scene.add.text(
            screenCenterX, 200,
            'MY PERKS',
            { fontFamily: 'Arial', fontSize: '32px', color: '#ffffff', fontStyle: 'bold' }
        ).setOrigin(0.5);

        // Add title to the perks container
        this.pausePerksContainer.add(perksTitle);
    },

    // --- Core Pause/Resume Logic ---

    /**
     * Toggles the pause state of the game, showing or hiding the overlay.
     * @param {Phaser.Scene} scene - The main game scene.
     */
    togglePause: function (scene) {
        if (this.isPaused) {
            this.hideOverlay(scene);
        } else {
            this.showOverlay(scene);
        }
    },

    /**
     * Pauses the game systems (physics, tweens, timers).
     * @param {Phaser.Scene} scene - The main game scene.
     */
    _internalPause: function (scene) {
        if (scene && scene.physics) {
            scene.physics.pause();
        }
        if (scene && scene.tweens) {
            scene.tweens.pauseAll();
        }

        // Pause all registered global game timers (from index.html)
        if (window.gameTimers && Array.isArray(window.gameTimers)) {
            window.gameTimers.forEach(timer => {
                if (timer && timer.paused !== undefined && !timer.removed) {
                    timer.paused = true;
                }
            });
        }

        // Pause all registered effect timers (global from window.registerEffect)
        if (window.activeEffects && window.activeEffects.timers && Array.isArray(window.activeEffects.timers)) {
            console.log(`[PauseSystem] Attempting to pause ${window.activeEffects.timers.length} timers from activeEffects.timers`); // ADDED
            window.activeEffects.timers.forEach(timer => {
                if (timer && timer.paused !== undefined && !timer.removed) {
                    // ADD THIS LOG:
                    console.log(`[PauseSystem] Pausing effect timer (ID: ${timer.__proto__.constructor.name}-${timer.delay}ms), removed: ${timer.removed}`);
                    timer.paused = true; // Pauses activeEffects.timers
                } else {
                    // ADD THIS LOG (Optional, might be noisy):
                    // console.log(`[PauseSystem] Skipping effect timer (invalid, removed, or no pause property):`, timer);
                }
            });
        }
    },

    /**
     * Resumes the game systems (physics, tweens, timers).
     * @param {Phaser.Scene} scene - The main game scene.
     */
    _internalResume: function (scene) {
        if (scene && scene.physics) {
            scene.physics.resume();
        }
        if (scene && scene.tweens) {
            scene.tweens.resumeAll();
        }

        // Resume all registered global game timers
        if (window.gameTimers && Array.isArray(window.gameTimers)) {
            window.gameTimers.forEach(timer => {
                if (timer && timer.paused !== undefined && !timer.removed) {
                    timer.paused = false;
                }
            });
        }

        // Resume all registered effect timers
        if (window.activeEffects && window.activeEffects.timers && Array.isArray(window.activeEffects.timers)) {
            window.activeEffects.timers.forEach(timer => {
                if (timer && timer.paused !== undefined && !timer.removed) {
                    timer.paused = false;
                }
            });
        }
    },

    /**
     * Pauses the game and displays the pause overlay with perks.
     * @param {Phaser.Scene} scene - The main game scene.
     */
    showOverlay: function (scene) {
        if (gameOver || this.isPaused) return; // Don't pause if already paused or game over

        console.log("Showing Pause Overlay");
        this.isPaused = true;
        this._internalPause(scene);

        // Show pause screen elements
        this.pauseScreen?.setVisible(true);
        this.pauseMessage?.setVisible(true);
        this.resumeButton?.setVisible(true);
        this.pausePerksContainer?.setVisible(true);

        // Update and show perks
        this.updatePerksDisplay(scene);
    },

    /**
     * Resumes the game and hides the pause overlay.
     * @param {Phaser.Scene} scene - The main game scene.
     */
    hideOverlay: function (scene) {
        if (gameOver || !this.isPaused) return; // Don't resume if not paused or game over

        // Check if level up is in progress (using global variable)
        if (window.levelUpCards && window.levelUpCards.length > 0) {
            console.log("Cannot resume, level up screen is active");
            return;
        }

        console.log("Hiding Pause Overlay and Resuming Game");
        this.isPaused = false;
        this._internalResume(scene);

        // Hide pause screen elements
        this.pauseScreen?.setVisible(false);
        this.pauseMessage?.setVisible(false);
        this.resumeButton?.setVisible(false);
        this.pausePerksContainer?.setVisible(false);

        // Hide the detailed perk card if it's visible
        this.hidePerkCard(scene);
    },

    // --- Perk Display Logic ---

    /**
     * Updates the display of acquired perks on the pause screen, including pagination.
     * @param {Phaser.Scene} scene - The main game scene.
     */
    updatePerksDisplay: function (scene) {
        // Ensure the container is visible first
        this.pausePerksContainer?.setVisible(true);

        // --- Cleanup previous elements ---
        this.perkIcons.forEach(icon => icon.destroy());
        this.perkIcons = [];
        this.paginationControls.forEach(control => control.destroy());
        this.paginationControls = [];
        this.hidePerkCard(scene); // Hide any lingering card


        // If no perks, show a message
        if (!window.acquiredPerks || window.acquiredPerks.length === 0) {
            const noPerkText = scene.add.text(
                scene.cameras.main.width / 2, 350,
                'No perks acquired yet',
                { fontFamily: 'Arial', fontSize: '20px', color: '#aaaaaa' }
            ).setOrigin(0.5);
            this.perkIcons.push(noPerkText); // Track it for cleanup
            this.pausePerksContainer.add(noPerkText);
            return;
        }

        // --- Prepare Perk Data for Layout ---
        const measurements = [];
        window.acquiredPerks.forEach(perkId => {
            const perk = window.PERKS[perkId]; // Access global PERKS
            if (!perk) return;
            const tempText = scene.add.text(0, 0, perk.kanji, {
                fontFamily: 'Arial', fontSize: '32px', fontStyle: 'bold'
            });
            measurements.push({ perkId: perkId, width: tempText.width });
            tempText.destroy();
        });

        // --- Pagination and Layout Configuration ---
        const spacing = 20;
        const perksPerRow = 8;
        const rowsPerPage = 4;
        const perksPerPage = perksPerRow * rowsPerPage;
        const rowHeight = 70;
        const startY = 280; // Starting Y position for the first row
        const totalPages = Math.ceil(measurements.length / perksPerPage);

        // Ensure current page is valid
        this.currentPerkPage = Math.min(this.currentPerkPage, totalPages - 1);
        this.currentPerkPage = Math.max(0, this.currentPerkPage);

        // Get perks for the current page
        const startIndex = this.currentPerkPage * perksPerPage;
        const currentPagePerks = measurements.slice(startIndex, startIndex + perksPerPage);

        // --- Render Perks for Current Page ---
        const rows = [];
        for (let i = 0; i < currentPagePerks.length; i += perksPerRow) {
            rows.push(currentPagePerks.slice(i, i + perksPerRow));
        }

        rows.forEach((row, rowIndex) => {
            const rowWidth = row.reduce((sum, item) => sum + item.width, 0) + (spacing * (row.length - 1));
            let currentX = (scene.cameras.main.width / 2) - (rowWidth / 2);
            const y = startY + (rowIndex * rowHeight);

            row.forEach(item => {
                const perkId = item.perkId;
                const perk = window.PERKS[perkId];
                const centerX = currentX + (item.width / 2);

                const perkIcon = scene.add.text(
                    centerX, y,
                    perk.kanji,
                    {
                        fontFamily: 'Arial', fontSize: '32px', color: perk.color,
                        fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
                    }
                )
                    .setOrigin(0.5)
                    .setInteractive({ useHandCursor: true });

                perkIcon.on('pointerover', function () {
                    this.setScale(1.2);
                    // Pass 'scene' context explicitly
                    PauseSystem.showPerkCard(scene, perkId, centerX, y + 150); // Position card below
                });

                perkIcon.on('pointerout', function () {
                    this.setScale(1);
                    PauseSystem.hidePerkCard(scene); // Pass 'scene' context
                });

                this.perkIcons.push(perkIcon);
                this.pausePerksContainer.add(perkIcon);
                currentX += item.width + spacing;
            });
        });

        // --- Render Pagination Controls ---
        if (totalPages > 1) {
            const paginationY = 580; // Position for pagination controls
            const screenCenterX = scene.cameras.main.width / 2;

            // Left Arrow
            if (this.currentPerkPage > 0) {
                const leftArrow = scene.add.text(screenCenterX - 80, paginationY, '◀', { fontSize: '48px', color: '#ffffff' })
                    .setOrigin(0.5)
                    .setInteractive({ useHandCursor: true });
                leftArrow.on('pointerdown', () => { this.currentPerkPage--; this.updatePerksDisplay(scene); });
                leftArrow.on('pointerover', function () { this.setColor('#aaffaa').setScale(1.2); });
                leftArrow.on('pointerout', function () { this.setColor('#ffffff').setScale(1); });
                this.paginationControls.push(leftArrow);
                this.pausePerksContainer.add(leftArrow);
            }

            // Page Counter
            const pageCounter = scene.add.text(screenCenterX, paginationY, `${this.currentPerkPage + 1}/${totalPages}`, { fontSize: '40px', color: '#ffffff' })
                .setOrigin(0.5);
            this.paginationControls.push(pageCounter);
            this.pausePerksContainer.add(pageCounter);

            // Right Arrow
            if (this.currentPerkPage < totalPages - 1) {
                const rightArrow = scene.add.text(screenCenterX + 80, paginationY, '▶', { fontSize: '48px', color: '#ffffff' })
                    .setOrigin(0.5)
                    .setInteractive({ useHandCursor: true });
                rightArrow.on('pointerdown', () => { this.currentPerkPage++; this.updatePerksDisplay(scene); });
                rightArrow.on('pointerover', function () { this.setColor('#aaffaa').setScale(1.2); });
                rightArrow.on('pointerout', function () { this.setColor('#ffffff').setScale(1); });
                this.paginationControls.push(rightArrow);
                this.pausePerksContainer.add(rightArrow);
            }
        }
    },

    /**
     * Shows the detailed perk card when hovering over a perk icon.
     * @param {Phaser.Scene} scene - The main game scene.
     * @param {string} perkId - The ID of the perk to display.
     * @param {number} x - The X coordinate for the card center.
     * @param {number} y - The Y coordinate for the card center.
     */
    showPerkCard: function (scene, perkId, x, y) {
        this.hidePerkCard(scene); // Clear existing card first

        // Use the CardSystem to create the card elements
        // Ensure CardSystem is available globally (it should be via window.CardSystem)
        if (window.CardSystem && window.CardSystem.createPerkCard) {
            this.activePerkCard = window.CardSystem.createPerkCard(perkId, x, y, {
                container: this.pausePerksContainer, // Add elements to the pause container
                backgroundColor: 0x333333,
                strokeWidth: 3,
                strokeColor: 0xeeeeee,
                width: 200, // Standard card dimensions
                height: 300
            });
        } else {
            console.error("CardSystem not found or createPerkCard is missing!");
        }
    },

    /**
     * Hides the currently displayed detailed perk card.
     * @param {Phaser.Scene} scene - The main game scene.
     */
    hidePerkCard: function (scene) {
        if (this.activePerkCard) {
            this.activePerkCard.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            this.activePerkCard = null;
        }
    }
};

// Export the system for global access
window.PauseSystem = PauseSystem;

// Optional: Helper function for external checks (though checking PauseSystem.isPaused directly is fine)
// window.isGamePaused = function() {
//     return PauseSystem.isPaused;
// };