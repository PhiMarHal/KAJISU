// pause.js - Pause system for Word Survivors
// Manages game pause functionality, UI, and perk display during pause

// Pause System namespace
const PauseSystem = {
    // UI elements
    elements: {
        pauseScreen: null,
        resumeButton: null,
        pauseMessage: null,
        perkIcons: [],
        paginationControls: [],
        activePerkCard: null,
        pausePerksContainer: null
    },

    // State tracking
    currentPerkPage: 0,
    isInitialized: false,

    // Initialize the pause system
    init: function (scene) {
        // Make sure we have a valid scene
        if (!scene || !scene.add) {
            console.error("Cannot initialize PauseSystem: Invalid scene provided");
            return;
        }

        // Create pause overlay elements (initially hidden)
        this.createPauseScreen(scene);

        // Setup pause key (P)
        const pauseKeyP = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        pauseKeyP.on('down', function () {
            if (!gameOver) {
                if (gamePaused) {
                    PauseSystem.resumeGame();
                } else {
                    PauseSystem.pauseGameWithOverlay();
                }
            }
        });

        // Setup visibility change detection
        document.addEventListener('visibilitychange', function () {
            if (document.hidden && !gameOver && !gamePaused) {
                // Tab/window is hidden, pause the game
                PauseSystem.pauseGameWithOverlay();
            }
            // We don't auto-resume when tab becomes visible again
        });

        // Mark as initialized
        this.isInitialized = true;

        console.log("Pause system initialized successfully");
    },

    // Create the pause screen UI elements
    createPauseScreen: function (scene) {
        // Safety check
        if (!scene || !scene.add) {
            console.error("Cannot create pause screen: Invalid scene");
            return;
        }

        const centerX = game.config.width / 2;
        const centerY = game.config.height / 2;

        // Create semi-transparent background
        this.elements.pauseScreen = scene.add.rectangle(
            centerX,
            centerY,
            game.config.width,
            game.config.height,
            0x000000, 0.7
        );
        this.elements.pauseScreen.setVisible(false);
        this.elements.pauseScreen.setDepth(1000); // Make sure it appears on top

        // Create pause message
        this.elements.pauseMessage = scene.add.text(
            centerX,
            game.config.height * 0.125, // 100/800 = 0.125
            'GAME PAUSED',
            { fontFamily: 'Arial', fontSize: '40px', color: '#ffffff', fontStyle: 'bold' }
        ).setOrigin(0.5);
        this.elements.pauseMessage.setVisible(false);
        this.elements.pauseMessage.setDepth(1001);

        // Create resume button
        this.elements.resumeButton = scene.add.text(
            centerX,
            game.config.height * 0.875, // 700/800 = 0.875
            'RESUME GAME',
            {
                fontFamily: 'Arial',
                fontSize: '36px',
                color: '#ffffff',
                backgroundColor: '#008800',
                padding: { left: 15, right: 15, top: 10, bottom: 10 }
            }
        ).setOrigin(0.5);
        this.elements.resumeButton.setVisible(false);
        this.elements.resumeButton.setDepth(1001);
        this.elements.resumeButton.setInteractive();

        // Add resume button functionality - important! Use a direct function reference, not a method
        this.elements.resumeButton.on('pointerdown', function () {
            // Call resumeGame directly using the PauseSystem namespace
            PauseSystem.resumeGame();
        });

        this.elements.resumeButton.on('pointerover', function () {
            this.setStyle({ backgroundColor: '#00aa00' });
        });

        this.elements.resumeButton.on('pointerout', function () {
            this.setStyle({ backgroundColor: '#008800' });
        });

        // Create container for perks display
        this.elements.pausePerksContainer = scene.add.container(0, 0);
        this.elements.pausePerksContainer.setDepth(1001);
        this.elements.pausePerksContainer.setVisible(false);

        // Create perks title
        const perksTitle = scene.add.text(
            centerX,
            game.config.height * 0.25, // 200/800 = 0.25
            'MY PERKS',
            { fontFamily: 'Arial', fontSize: '32px', color: '#ffffff', fontStyle: 'bold' }
        ).setOrigin(0.5);

        // Add to container
        this.elements.pausePerksContainer.add(perksTitle);

        console.log("Pause screen elements created successfully");
    },

    // Check if the system is properly initialized
    ensureInitialized: function () {
        if (!this.isInitialized || !this.elements.pauseScreen) {
            console.warn("PauseSystem not fully initialized, attempting to initialize now");
            const scene = game.scene.scenes[0];
            if (scene) {
                this.init(scene);
            } else {
                console.error("Cannot initialize PauseSystem: No active scene available");
                return false;
            }
        }
        return true;
    },

    // Pause the game
    pauseGame: function (isLevelUpPause = false) {
        // Set the flag
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

    // Resume the game and hide overlay
    resumeGame: function () {
        if (gameOver) return;

        // If level up is in progress, don't resume
        if (levelUpCards && levelUpCards.length > 0) {
            console.log("Cannot resume, level up screen is active");
            return;
        }

        // Set pause flag
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

        // Check if we have valid UI elements before trying to hide them
        if (!this.elements.pauseScreen) {
            return;
        }

        // Hide pause screen elements
        this.elements.pauseScreen.setVisible(false);
        this.elements.pauseMessage.setVisible(false);
        this.elements.resumeButton.setVisible(false);

        // Hide perks container
        if (this.elements.pausePerksContainer) {
            this.elements.pausePerksContainer.setVisible(false);
        }
        console.log("Game resumed");
    },

    // Pause game and show overlay
    pauseGameWithOverlay: function () {
        if (gameOver) return;

        // Check initialization before proceeding
        if (!this.elements.pauseScreen) {
            console.warn("Pause UI elements not initialized, recreating...");
            const scene = game.scene.scenes[0];
            if (scene) {
                this.createPauseScreen(scene);
            } else {
                console.error("Cannot access scene to create pause elements");
                return;
            }
        }

        // Pause game systems
        this.pauseGame();

        // Show pause screen elements
        this.elements.pauseScreen.setVisible(true);
        this.elements.pauseMessage.setVisible(true);
        this.elements.resumeButton.setVisible(true);

        // Update and show perks
        const scene = game.scene.scenes[0];
        if (scene) {
            this.updatePauseScreenPerks(scene);
        }

        console.log("Game paused with overlay");
    },

    // Update perks display in pause screen
    updatePauseScreenPerks: function (scene) {
        // Check initialization before proceeding
        if (!this.elements.pausePerksContainer) {
            console.warn("Pause perks container not initialized");
            return;
        }

        const centerX = game.config.width / 2;

        // Clear existing perk icons first
        if (this.elements.perkIcons) {
            this.elements.perkIcons.forEach(icon => {
                if (icon && icon.destroy) {
                    icon.destroy();
                }
            });
        }
        this.elements.perkIcons = [];

        // Clear existing perk card if any
        if (this.elements.activePerkCard) {
            this.elements.activePerkCard.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            this.elements.activePerkCard = null;
        }

        // Clear pagination controls if they exist
        if (this.elements.paginationControls) {
            this.elements.paginationControls.forEach(control => {
                if (control && control.destroy) {
                    control.destroy();
                }
            });
        }
        this.elements.paginationControls = [];

        // Set container visible
        this.elements.pausePerksContainer.setVisible(true);

        // If no perks, show a message
        if (acquiredPerks.length === 0) {
            const noPerkText = scene.add.text(
                centerX,
                game.config.height * 0.4375, // 350/800 = 0.4375
                'No perks acquired yet',
                { fontFamily: 'Arial', fontSize: '20px', color: '#aaaaaa' }
            ).setOrigin(0.5);
            this.elements.perkIcons.push(noPerkText);
            this.elements.pausePerksContainer.add(noPerkText);
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
                fontSize: '32px',
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

        // Configuration for paginated layout
        const spacing = game.config.width * 0.0167; // 20/1200 = 0.0167 (Pixels between kanji horizontally)
        const perksPerRow = 8; // Maximum perks per row
        const rowsPerPage = 4; // Maximum rows per page
        const perksPerPage = perksPerRow * rowsPerPage; // Perks per page (32)
        const rowHeight = game.config.height * 0.0875; // 70/800 = 0.0875 (Vertical spacing between rows)
        const startY = game.config.height * 0.35; // 280/800 = 0.35 (Starting Y position for the first row)

        // Calculate total number of pages
        const totalPages = Math.ceil(measurements.length / perksPerPage);

        // Ensure current page is valid
        this.currentPerkPage = Math.min(this.currentPerkPage, totalPages - 1);
        this.currentPerkPage = Math.max(0, this.currentPerkPage);

        // Get perks for the current page
        const startIndex = this.currentPerkPage * perksPerPage;
        const currentPagePerks = measurements.slice(startIndex, startIndex + perksPerPage);

        // Split current page perks into rows
        const rows = [];
        for (let i = 0; i < currentPagePerks.length; i += perksPerRow) {
            rows.push(currentPagePerks.slice(i, i + perksPerRow));
        }

        // Process each row
        rows.forEach((row, rowIndex) => {
            // Calculate total width of this row with spacing
            const rowWidth = row.reduce((sum, item) => sum + item.width, 0) +
                (spacing * (row.length - 1));

            // Calculate starting X position to center this row
            let currentX = centerX - (rowWidth / 2);
            const y = startY + (rowIndex * rowHeight);

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
                        fontSize: '32px',
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
                    const cardY = y + game.config.height * 0.1875; // 150/800 = 0.1875

                    PauseSystem.showPerkCard(scene, perkId, centerX, cardY);
                });

                perkIcon.on('pointerout', function () {
                    // Reset scale
                    this.setScale(1);
                    PauseSystem.hidePerkCard(scene);
                });

                // Store reference
                this.elements.perkIcons.push(perkIcon);

                // Add to container
                this.elements.pausePerksContainer.add(perkIcon);

                // Move currentX position for the next kanji
                currentX += item.width + spacing;
            });
        });

        // Only show pagination if we have multiple pages
        if (totalPages > 1) {
            const paginationY = game.config.height * 0.725; // 580/800 = 0.725

            // Create left arrow (if not on first page)
            if (this.currentPerkPage > 0) {
                const leftArrow = scene.add.text(
                    centerX - game.config.width * 0.067, // 80/1200 = 0.067 (shifted 80px left from center)
                    paginationY,
                    '◀',
                    {
                        fontFamily: 'Arial',
                        fontSize: '48px',
                        color: '#ffffff'
                    }
                ).setOrigin(0.5);

                leftArrow.setInteractive({ useHandCursor: true });

                leftArrow.on('pointerdown', () => {
                    this.currentPerkPage--;
                    this.updatePauseScreenPerks(scene);
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

                this.elements.paginationControls.push(leftArrow);
                this.elements.pausePerksContainer.add(leftArrow);
            }

            // Create page counter
            const pageCounter = scene.add.text(
                centerX,
                paginationY,
                `${this.currentPerkPage + 1}/${totalPages}`,
                {
                    fontFamily: 'Arial',
                    fontSize: '40px',
                    color: '#ffffff'
                }
            ).setOrigin(0.5);

            this.elements.paginationControls.push(pageCounter);
            this.elements.pausePerksContainer.add(pageCounter);

            // Create right arrow (if not on last page)
            if (this.currentPerkPage < totalPages - 1) {
                const rightArrow = scene.add.text(
                    centerX + game.config.width * 0.067, // 80/1200 = 0.067 (shifted 80px right from center)
                    paginationY,
                    '▶',
                    {
                        fontFamily: 'Arial',
                        fontSize: '48px',
                        color: '#ffffff'
                    }
                ).setOrigin(0.5);

                rightArrow.setInteractive({ useHandCursor: true });

                rightArrow.on('pointerdown', () => {
                    this.currentPerkPage++;
                    this.updatePauseScreenPerks(scene);
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

                this.elements.paginationControls.push(rightArrow);
                this.elements.pausePerksContainer.add(rightArrow);
            }
        }
    },

    // Show detailed perk card
    showPerkCard: function (scene, perkId, x, y) {
        // Clear any existing perk card
        this.hidePerkCard(scene);

        // Create card elements using the shared function with better styling
        this.elements.activePerkCard = window.CardSystem.createPerkCard(perkId, x, y, {
            container: this.elements.pausePerksContainer,
            backgroundColor: 0x333333,
            strokeWidth: 3,
            strokeColor: 0xeeeeee
        });
    },

    // Hide perk card
    hidePerkCard: function (scene) {
        if (this.elements.activePerkCard) {
            this.elements.activePerkCard.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            this.elements.activePerkCard = null;
        }
    },

    // Cleanup all UI elements
    cleanup: function () {
        // Clean up all UI elements
        Object.values(this.elements).forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            } else if (Array.isArray(element)) {
                element.forEach(item => {
                    if (item && item.destroy) {
                        item.destroy();
                    }
                });
            }
        });

        // Reset elements
        this.elements = {
            pauseScreen: null,
            resumeButton: null,
            pauseMessage: null,
            perkIcons: [],
            paginationControls: [],
            activePerkCard: null,
            pausePerksContainer: null
        };

        // Reset state
        this.currentPerkPage = 0;
        this.isInitialized = false;
    }
};

// Export the system for use in other files
window.PauseSystem = PauseSystem;