// pause.js - Pause Screen Functionality for Word Survivors
// Manages the game pause system, UI, and interactions

// Configuration for pause screen
const PAUSE_CONFIG = {
    background: {
        alpha: 0.7,
        color: 0x000000
    },
    title: {
        text: "GAME PAUSED",
        fontSize: "40px",
        color: "#ffffff",
        y: 100
    },
    resumeButton: {
        text: "RESUME GAME",
        fontSize: "36px",
        color: "#ffffff",
        backgroundColor: "#008800",
        hoverColor: "#00aa00",
        y: 700
    },
    perks: {
        title: {
            text: "MY PERKS",
            fontSize: "32px",
            color: "#ffffff",
            y: 200
        },
        perPage: 32,           // Perks per page
        perksPerRow: 8,        // Perks per row
        rowsPerPage: 4,        // Rows per page
        rowHeight: 70,         // Height between rows
        startY: 280,           // Starting Y position
        iconSpacing: 20,       // Spacing between kanji icons
        fontSize: "32px",      // Font size for perk icons
        detailCardY: 150,      // Y offset for detail card when hovering
        paginationY: 580       // Y position for pagination controls
    }
};

// Main pause system
const PauseSystem = {
    // Properties
    isPaused: false,
    pauseScreen: null,
    pauseMessage: null,
    resumeButton: null,
    pauseKeyP: null,
    pausePerksContainer: null,
    perkIcons: [],
    paginationControls: [],
    activePerkCard: null,
    currentPerkPage: 0,

    // Initialize the pause system
    init: function (scene) {
        // Don't create our own key handler - we'll use a direct method instead
        // Store a reference to the scene for later
        this.scene = scene;

        // Setup visibility change detection
        const self = this;
        document.addEventListener('visibilitychange', function () {
            if (document.hidden && !gameOver && !self.isPaused) {
                // Tab/window is hidden, pause the game
                self.pauseGameWithOverlay();
            }
            // We don't auto-resume when tab becomes visible again
        });

        // Create pause overlay elements (initially hidden)
        this.createPauseScreen(scene);

        console.log("Pause system initialized");
    },

    // Handle P key press - this should be called from the main input handler in index.html
    handlePauseKey: function () {
        console.log("Pause key handler called, current state:", this.isPaused);
        if (!gameOver) {
            if (this.isPaused) {
                this.resumeGame();
            } else {
                this.pauseGameWithOverlay();
            }
        }
    },

    // Create the pause screen UI elements
    createPauseScreen: function (scene) {
        // Create semi-transparent background
        this.pauseScreen = scene.add.rectangle(
            600, 400, 1200, 800,
            PAUSE_CONFIG.background.color,
            PAUSE_CONFIG.background.alpha
        );
        this.pauseScreen.setVisible(false);
        this.pauseScreen.setDepth(1000); // Make sure it appears on top

        // Create pause message
        this.pauseMessage = scene.add.text(
            600, PAUSE_CONFIG.title.y,
            PAUSE_CONFIG.title.text,
            {
                fontFamily: 'Arial',
                fontSize: PAUSE_CONFIG.title.fontSize,
                color: PAUSE_CONFIG.title.color,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        this.pauseMessage.setVisible(false);
        this.pauseMessage.setDepth(1001);

        // Create resume button
        this.resumeButton = scene.add.text(
            600, PAUSE_CONFIG.resumeButton.y,
            PAUSE_CONFIG.resumeButton.text,
            {
                fontFamily: 'Arial',
                fontSize: PAUSE_CONFIG.resumeButton.fontSize,
                color: PAUSE_CONFIG.resumeButton.color,
                backgroundColor: PAUSE_CONFIG.resumeButton.backgroundColor,
                padding: { left: 15, right: 15, top: 10, bottom: 10 }
            }
        ).setOrigin(0.5);
        this.resumeButton.setVisible(false);
        this.resumeButton.setDepth(1001);
        this.resumeButton.setInteractive();

        // Store reference to this for use in event handlers
        const self = this;

        // Add resume button functionality with proper binding
        this.resumeButton.on('pointerdown', function () {
            self.resumeGame();
        });

        this.resumeButton.on('pointerover', function () {
            this.setStyle({ backgroundColor: PAUSE_CONFIG.resumeButton.hoverColor });
        });

        this.resumeButton.on('pointerout', function () {
            this.setStyle({ backgroundColor: PAUSE_CONFIG.resumeButton.backgroundColor });
        });

        // Create container for perks display
        this.pausePerksContainer = scene.add.container(0, 0);
        this.pausePerksContainer.setDepth(1001);
        this.pausePerksContainer.setVisible(false);

        // Create perks title
        const perksTitle = scene.add.text(
            600, PAUSE_CONFIG.perks.title.y,
            PAUSE_CONFIG.perks.title.text,
            {
                fontFamily: 'Arial',
                fontSize: PAUSE_CONFIG.perks.title.fontSize,
                color: PAUSE_CONFIG.perks.title.color,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // Add to container
        this.pausePerksContainer.add(perksTitle);
    },

    // Pause the game
    pauseGame: function (isLevelUpPause = false) {
        console.log("PauseSystem.pauseGame called");

        // Set the flag
        this.isPaused = true;
        gamePaused = true;

        // Pause physics
        const activeScene = game.scene.scenes[0];
        if (activeScene && activeScene.physics) {
            activeScene.physics.pause();
        }
        if (activeScene.tweens) {
            activeScene.tweens.pauseAll();
        }

        // Pause all registered timers
        gameTimers.forEach(timer => {
            if (timer && timer.paused !== undefined) {
                timer.paused = true;
            }
        });

        // Pause all effect timers
        activeEffects.timers.forEach(timer => {
            if (timer && timer.paused !== undefined) {
                timer.paused = true;
            }
        });
    },

    // Resume the game
    resumeGame: function () {
        console.log("PauseSystem.resumeGame called");

        if (gameOver) return;

        // If level up is in progress, don't resume
        if (levelUpCards && levelUpCards.length > 0) {
            console.log("Cannot resume, level up screen is active");
            return;
        }

        // Hide pause screen elements
        if (this.pauseScreen) this.pauseScreen.setVisible(false);
        if (this.pauseMessage) this.pauseMessage.setVisible(false);
        if (this.resumeButton) this.resumeButton.setVisible(false);

        // Hide perks container
        if (this.pausePerksContainer) {
            this.pausePerksContainer.setVisible(false);
        }

        // Set pause flags
        this.isPaused = false;
        gamePaused = false;

        // Resume physics
        const activeScene = game.scene.scenes[0];
        if (activeScene && activeScene.physics) {
            activeScene.physics.resume();
        }
        if (activeScene.tweens) {
            activeScene.tweens.resumeAll();
        }

        // Resume all registered timers
        gameTimers.forEach(timer => {
            if (timer && timer.paused !== undefined) {
                timer.paused = false;
            }
        });

        // Resume all effect timers
        activeEffects.timers.forEach(timer => {
            if (timer && timer.paused !== undefined) {
                timer.paused = false;
            }
        });

        console.log("Game resumed");
    },

    // Pause game and show overlay
    pauseGameWithOverlay: function () {
        console.log("PauseSystem.pauseGameWithOverlay called");

        if (gameOver) return;

        // Pause game systems
        this.pauseGame();

        // Show pause screen elements
        this.pauseScreen.setVisible(true);
        this.pauseMessage.setVisible(true);
        this.resumeButton.setVisible(true);

        // Update and show perks
        this.updatePauseScreenPerks();

        console.log("Game paused with overlay");
    },

    // Update perks display on pause screen
    updatePauseScreenPerks: function () {
        const scene = game.scene.scenes[0];

        // Clear existing perk icons first
        this.perkIcons.forEach(icon => {
            icon.destroy();
        });
        this.perkIcons = [];

        // Clear existing perk card if any
        if (this.activePerkCard) {
            this.activePerkCard.forEach(element => {
                element.destroy();
            });
            this.activePerkCard = null;
        }

        // Clear pagination controls
        this.paginationControls.forEach(control => {
            control.destroy();
        });
        this.paginationControls = [];

        // Set or initialize current page
        if (this.currentPerkPage === undefined) {
            this.currentPerkPage = 0;
        }

        // Set container visible
        this.pausePerksContainer.setVisible(true);

        // If no perks, show a message
        if (acquiredPerks.length === 0) {
            const noPerkText = scene.add.text(
                600, 350,
                'No perks acquired yet',
                { fontFamily: 'Arial', fontSize: '20px', color: '#aaaaaa' }
            ).setOrigin(0.5);
            this.perkIcons.push(noPerkText);
            this.pausePerksContainer.add(noPerkText);
            return;
        }

        // Create temporary text objects to measure each kanji's width
        const measurements = [];
        acquiredPerks.forEach(perkId => {
            const perk = PERKS[perkId];
            if (!perk) return;

            // Create temp text for measurement
            const tempText = scene.add.text(0, 0, perk.kanji, {
                fontFamily: 'Arial',
                fontSize: PAUSE_CONFIG.perks.fontSize,
                fontStyle: 'bold'
            });

            // Store the width and perk info
            measurements.push({
                perkId: perkId,
                width: tempText.width
            });

            // Remove the temp text
            tempText.destroy();
        });

        // Calculate total number of pages
        const perksPerPage = PAUSE_CONFIG.perks.perPage;
        const totalPages = Math.ceil(measurements.length / perksPerPage);

        // Ensure current page is valid
        this.currentPerkPage = Math.min(this.currentPerkPage, totalPages - 1);
        this.currentPerkPage = Math.max(0, this.currentPerkPage);

        // Get perks for the current page
        const startIndex = this.currentPerkPage * perksPerPage;
        const currentPagePerks = measurements.slice(startIndex, startIndex + perksPerPage);

        // Split current page perks into rows
        const rows = [];
        for (let i = 0; i < currentPagePerks.length; i += PAUSE_CONFIG.perks.perksPerRow) {
            rows.push(currentPagePerks.slice(i, i + PAUSE_CONFIG.perks.perksPerRow));
        }

        // Store reference to 'this' for use in event handlers
        const self = this;

        // Process each row
        rows.forEach((row, rowIndex) => {
            // Calculate total width of this row with spacing
            const rowWidth = row.reduce((sum, item) => sum + item.width, 0) +
                (PAUSE_CONFIG.perks.iconSpacing * (row.length - 1));

            // Calculate starting X position to center this row
            let currentX = 600 - (rowWidth / 2);
            const y = PAUSE_CONFIG.perks.startY + (rowIndex * PAUSE_CONFIG.perks.rowHeight);

            // Create perk icons for this row
            row.forEach(item => {
                const perkId = item.perkId;
                const perk = PERKS[perkId];

                // Position this kanji centered on its width
                const centerX = currentX + (item.width / 2);

                // Create the perk icon (kanji) with improved visual styling
                const perkIcon = scene.add.text(
                    centerX, y,
                    perk.kanji,
                    {
                        fontFamily: 'Arial',
                        fontSize: PAUSE_CONFIG.perks.fontSize,
                        color: perk.color,
                        fontStyle: 'bold',
                        stroke: '#000000',
                        strokeThickness: 4
                    }
                ).setOrigin(0.5);

                // Make interactive
                perkIcon.setInteractive({ useHandCursor: true });

                // Add enhanced hover effects
                perkIcon.on('pointerover', function () {
                    // Scale effect on hover
                    this.setScale(1.2);

                    // Always place card below, regardless of row position
                    const cardY = y + PAUSE_CONFIG.perks.detailCardY;

                    self.showPerkCard(perkId, centerX, cardY);
                });

                perkIcon.on('pointerout', function () {
                    // Reset scale
                    this.setScale(1);
                    self.hidePerkCard();
                });

                // Store reference
                self.perkIcons.push(perkIcon);

                // Add to container
                self.pausePerksContainer.add(perkIcon);

                // Move currentX position for the next kanji
                currentX += item.width + PAUSE_CONFIG.perks.iconSpacing;
            });
        });

        // Only show pagination if we have multiple pages
        if (totalPages > 1) {
            // Create left arrow (if not on first page)
            if (this.currentPerkPage > 0) {
                const leftArrow = scene.add.text(
                    520, PAUSE_CONFIG.perks.paginationY,
                    '◀',
                    {
                        fontFamily: 'Arial',
                        fontSize: '48px',
                        color: '#ffffff'
                    }
                ).setOrigin(0.5);

                leftArrow.setInteractive({ useHandCursor: true });

                leftArrow.on('pointerdown', () => {
                    self.currentPerkPage--;
                    self.updatePauseScreenPerks();
                });

                // Enhanced hover effects
                leftArrow.on('pointerover', function () {
                    this.setColor('#aaffaa');
                    // Scale effect
                    this.setScale(1.2);
                });

                leftArrow.on('pointerout', function () {
                    this.setColor('#ffffff');
                    // Reset scale
                    this.setScale(1);
                });

                this.paginationControls.push(leftArrow);
                this.pausePerksContainer.add(leftArrow);
            }

            // Create page counter
            const pageCounter = scene.add.text(
                600, PAUSE_CONFIG.perks.paginationY,
                `${this.currentPerkPage + 1}/${totalPages}`,
                {
                    fontFamily: 'Arial',
                    fontSize: '40px',
                    color: '#ffffff'
                }
            ).setOrigin(0.5);

            this.paginationControls.push(pageCounter);
            this.pausePerksContainer.add(pageCounter);

            // Create right arrow (if not on last page)
            if (this.currentPerkPage < totalPages - 1) {
                const rightArrow = scene.add.text(
                    680, PAUSE_CONFIG.perks.paginationY,
                    '▶',
                    {
                        fontFamily: 'Arial',
                        fontSize: '48px',
                        color: '#ffffff'
                    }
                ).setOrigin(0.5);

                rightArrow.setInteractive({ useHandCursor: true });

                rightArrow.on('pointerdown', () => {
                    self.currentPerkPage++;
                    self.updatePauseScreenPerks();
                });

                // Enhanced hover effects
                rightArrow.on('pointerover', function () {
                    this.setColor('#aaffaa');
                    // Scale effect
                    this.setScale(1.2);
                });

                rightArrow.on('pointerout', function () {
                    this.setColor('#ffffff');
                    // Reset scale
                    this.setScale(1);
                });

                this.paginationControls.push(rightArrow);
                this.pausePerksContainer.add(rightArrow);
            }
        }
    },

    // Function to show detailed perk card with improved visuals
    showPerkCard: function (perkId, x, y) {
        const scene = game.scene.scenes[0];

        // Clear any existing perk card
        this.hidePerkCard();

        // Create card elements using the shared function
        this.activePerkCard = window.CardSystem.createPerkCard(scene, perkId, x, y, {
            container: this.pausePerksContainer,
            backgroundColor: 0x333333,
            strokeWidth: 3,
            strokeColor: 0xeeeeee
        });
    },

    // Function to hide perk card
    hidePerkCard: function () {
        if (!this.activePerkCard) return;

        this.activePerkCard.forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        this.activePerkCard = null;
    }
};

// Export the pause system for use in other files
window.PauseSystem = PauseSystem;