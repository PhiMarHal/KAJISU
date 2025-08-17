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
        pausePerksContainer: null,
        statsContainer: null,
        statCircles: []
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

        // Create resume button (remove backgroundColor, we'll use border instead)
        this.elements.resumeButton = scene.add.text(
            centerX,
            game.config.height * 0.875, // 700/800 = 0.875
            'RESUME GAME',
            {
                fontFamily: 'Arial',
                fontSize: '36px',
                color: '#ffffff',
                fontStyle: 'bold',
                padding: { left: 15, right: 15, top: 10, bottom: 10 }
            }
        ).setOrigin(0.5);
        this.elements.resumeButton.setVisible(false);
        this.elements.resumeButton.setDepth(1002); // Higher than border

        // Create gold border for resume button
        const buttonWidth = this.elements.resumeButton.width + 30; // Extra padding
        const buttonHeight = this.elements.resumeButton.height + 20;

        this.elements.resumeButtonBorder = scene.add.rectangle(
            centerX,
            game.config.height * 0.875,
            buttonWidth,
            buttonHeight
        );
        this.elements.resumeButtonBorder.setStrokeStyle(3, 0xFFD700); // Gold border
        this.elements.resumeButtonBorder.setFillStyle(0x000000, 0.8); // Semi-transparent black background
        this.elements.resumeButtonBorder.setVisible(false);
        this.elements.resumeButtonBorder.setDepth(1001); // Behind text

        // Add resume button functionality
        this.elements.resumeButtonBorder.setInteractive({ useHandCursor: true });

        this.elements.resumeButtonBorder.on('pointerdown', function (pointer, localX, localY, event) {
            event.stopPropagation();
            PauseSystem.resumeGame();
        });

        this.elements.resumeButtonBorder.on('pointerover', function () {
            PauseSystem.elements.resumeButton.setColor('#FFD700'); // Gold text on hover
            // Make border thicker on hover
            this.setStrokeStyle(4, 0xFFD700);
        });

        this.elements.resumeButtonBorder.on('pointerout', function () {
            PauseSystem.elements.resumeButton.setColor('#ffffff'); // White text normally
            // Reset border thickness
            this.setStrokeStyle(3, 0xFFD700);
        });
        // Create container for perks display
        this.elements.pausePerksContainer = scene.add.container(0, 0);
        this.elements.pausePerksContainer.setDepth(1001);
        this.elements.pausePerksContainer.setVisible(false);

        // Create container for stats display (used in kajisuli mode)
        this.elements.statsContainer = scene.add.container(0, 0);
        this.elements.statsContainer.setDepth(1001);
        this.elements.statsContainer.setVisible(false);

        // Create perks title (adjusted for kajisuli mode to make room for stats)
        const perksTitleY = KAJISULI_MODE ?
            game.config.height * 0.32 : // Move down in kajisuli mode
            game.config.height * 0.25;  // Standard position

        const perksTitle = scene.add.text(
            centerX,
            perksTitleY,
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
        // Don't pause again if already paused
        if (gamePaused) {
            console.log("Game already paused, skipping redundant pause");
            return;
        }

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

        // Pause music
        if (window.MusicSystem) {
            window.MusicSystem.onGamePause();
        }
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

        // Resume music
        if (window.MusicSystem) {
            window.MusicSystem.onGameResume();
        }

        // Check if we have valid UI elements before trying to hide them
        if (!this.elements.pauseScreen) {
            return;
        }

        // Hide pause screen elements including the border
        this.elements.pauseScreen.setVisible(false);
        this.elements.pauseMessage.setVisible(false);
        this.elements.resumeButton.setVisible(false);
        this.elements.resumeButtonBorder.setVisible(false); // Hide the border

        // Hide perks container
        if (this.elements.pausePerksContainer) {
            this.elements.pausePerksContainer.setVisible(false);
        }

        // Hide stats container if it exists
        if (this.elements.statsContainer) {
            this.elements.statsContainer.setVisible(false);
        }

        if (window.ButtonStateManager) {
            window.ButtonStateManager.onGameResume(this.scene || activeScene);
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

        // Show pause screen elements including the border
        this.elements.pauseScreen.setVisible(true);
        this.elements.pauseMessage.setVisible(true);
        this.elements.resumeButton.setVisible(true);
        this.elements.resumeButtonBorder.setVisible(true); // Show the border

        // Get the active scene
        const scene = game.scene.scenes[0];
        if (scene) {
            // In kajisuli mode, show stats before perks
            if (KAJISULI_MODE) {
                this.showStatsDisplay(scene);
            }

            // Update and show perks
            this.updatePauseScreenPerks(scene);
        }

        if (window.ButtonStateManager) {
            window.ButtonStateManager.onGamePause(this.scene || scene);
        }

        console.log("Game paused with overlay");
    },


    // Create and show stats display (for kajisuli mode)
    showStatsDisplay: function (scene, options = {}) {
        // Default options that preserve original pause screen behavior
        const config = {
            container: options.container ?? this.elements.statsContainer,
            positionY: options.positionY ?? game.config.height * 0.2,
            storeInElements: options.storeInElements ?? true,
            clearContainer: options.clearContainer ?? true,
            setVisible: options.setVisible ?? true,
            // Match the 150% scaling from cards.js for KAJISULI mode
            fontSize: options.fontSize ?? (KAJISULI_MODE ? '36px' : '24px')
        };

        // Clear any existing stats display if requested (original behavior)
        if (config.clearContainer && config.container) {
            config.container.removeAll(true);
        }

        // Define stat info with kanji and values (same as original)
        const stats = [
            { symbol: UI.statDisplay.symbols.POW, value: getEffectiveDamage(), color: UI.statDisplay.symbolColors.POW },
            { symbol: UI.statDisplay.symbols.AGI, value: getEffectiveFireRate(), color: UI.statDisplay.symbolColors.AGI },
            { symbol: UI.statDisplay.symbols.LUK, value: playerLuck, color: UI.statDisplay.symbolColors.LUK },
            { symbol: UI.statDisplay.symbols.END, value: maxPlayerHealth, color: UI.statDisplay.symbolColors.END }
        ];

        // Get center X position
        const centerX = game.config.width / 2;

        // Use provided Y position
        const statsY = config.positionY;

        // Set container position and visibility if using the original container
        if (config.container === this.elements.statsContainer) {
            config.container.setPosition(0, 0);
            if (config.setVisible) {
                config.container.setVisible(true);
            }
        }

        // Calculate spacing and box dimensions (same as original)
        const boxWidth = game.config.width * 0.15;    // 15% of screen width per box
        const boxHeight = game.config.height * 0.05;  // 5% of screen height
        const spacing = game.config.width * 0.06;     // 6% of screen width between boxes
        const totalWidth = (boxWidth * stats.length) + (spacing * (stats.length - 1));
        const startX = centerX - (totalWidth / 2) + (boxWidth / 2);

        // Store created elements for return (new functionality)
        const createdElements = [];

        // Add each stat in its own gold-bordered box (same as original)
        stats.forEach((stat, index) => {
            // Calculate x position with even spacing
            const x = startX + (spacing + boxWidth) * index;

            // Create gold border for this stat
            const border = scene.add.rectangle(
                x, statsY,
                boxWidth, boxHeight,
                UI.colors.gold
            );

            // Create inner black background
            const background = scene.add.rectangle(
                x, statsY,
                boxWidth - 4, boxHeight - 4,
                0x000000
            );

            // Create the stat text: kanji and value on the same line
            const statText = scene.add.text(
                x, statsY,
                `${stat.symbol} ${Math.floor(stat.value)}`,
                {
                    fontFamily: 'Arial',
                    fontSize: config.fontSize, // Use the configurable fontSize (36px in KAJISULI mode)
                    color: stat.color,
                    fontStyle: 'bold'
                }
            ).setOrigin(0.5);

            // Store elements for return
            const statGroup = { border, background, statText };
            createdElements.push(statGroup);

            // Add all elements to the container (original behavior)
            if (config.container) {
                config.container.add([border, background, statText]);
            }

            // Add hover interaction for tooltips if StatTooltipSystem is available
            if (window.StatTooltipSystem && scene) {
                StatTooltipSystem.addStatHoverInteraction(scene, border, stats[index].stat ?? ['POW', 'AGI', 'LUK', 'END'][index], {
                    container: config.container,
                    isKajisuli: true,  // Add this flag
                    onHover: (element) => {
                        // Highlight border on hover
                        element.setStrokeStyle(4, UI.colors.gold);
                        statText.setScale(1.1);
                    },
                    onHoverOut: (element) => {
                        // Reset border and text
                        element.setStrokeStyle(2, UI.colors.gold);
                        statText.setScale(1);
                    }
                });
            }
        });

        // Return created elements for external use (new functionality)
        return createdElements;
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

        // Configuration for paginated layout - adjust for kajisuli mode
        const perksPerRow = KAJISULI_MODE ? 4 : 8; // Fewer perks per row in kajisuli mode 
        const rowsPerPage = KAJISULI_MODE ? 5 : 4; // More rows in kajisuli mode due to taller screen
        const perksPerPage = perksPerRow * rowsPerPage;

        // Adjust spacing and positioning for different screen sizes
        const spacing = game.config.width * 0.04; // Relative spacing
        const rowHeight = game.config.height * 0.075; // Relative row height

        // Adjust startY based on kajisuli mode and stats display
        const startY = KAJISULI_MODE ?
            game.config.height * 0.4 : // Higher in kajisuli mode to make room for stats
            game.config.height * 0.35; // Normal position

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
                    // Adjust card position for kajisuli mode
                    const cardY = KAJISULI_MODE ?
                        Math.min(y + game.config.height * 0.15, game.config.height * 0.7) : // Keep within bounds
                        y + game.config.height * 0.1875; // Normal position

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
            // Adjust pagination position for kajisuli mode
            const paginationY = KAJISULI_MODE ?
                game.config.height * 0.8 : // Lower in kajisuli mode
                game.config.height * 0.725; // Normal position

            // Create left arrow (if not on first page)
            if (this.currentPerkPage > 0) {
                const leftArrow = scene.add.text(
                    centerX - game.config.width * 0.15, // Relative positioning
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
                    centerX + game.config.width * 0.15, // Relative positioning
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
            strokeColor: 0xeeeeee,
            // Adjust card size for kajisuli mode
            width: KAJISULI_MODE ? 220 : 200,   // 10% wider (200 * 1.1 = 220)
            height: KAJISULI_MODE ? 330 : 300,  // 10% taller (300 * 1.1 = 330)
            fontSize: KAJISULI_MODE ? 1.2 : 1 // 120% size in kajisuli mode
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
            pausePerksContainer: null,
            statsContainer: null
        };

        // Reset state
        this.currentPerkPage = 0;
        this.isInitialized = false;
    }
};

// Export the system for use in other files
window.PauseSystem = PauseSystem;