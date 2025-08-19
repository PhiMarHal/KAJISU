// help.js - Help System for Word Survivors

const HELP_PAGES = [
    {
        title: "THE YEAR IS 2077",
        content: [
            "HUMANITY TOOK TO THE STARS",
            "",
            "YOU ARE   " + HERO_CHARACTER,
            "",
            "YOU TRAVEL THROUGH SPACE",
            "",
            "SURVIVAL IS YOUR GOAL"
        ]
    },
    {
        title: "TO LEARN IS TO ERR",
        content: [
            "DO NOT READ ANY FURTHER",
            "",
            "THERE IS STILL TIME TO STOP",
            "",
            "CLICK ELSEWHERE TO CLOSE THIS",
            "",
            "IGNORANCE IS BLISS"
        ]
    },
    {
        title: "THEY ARE COMING",
        content: [
            "YOUR ENEMIES ARE MANY",
            "",
            "KNOWLEDGE WILL HARASS YOU",
            "",
            "DO NOT LET THEM TOUCH YOU",
            "",
            "DO NOT MAKE THEM TEACH YOU"
        ]
    },
    {
        title: "FLY, " + HERO_CHARACTER,
        content: [
            "TAP ONCE TO MOVE",
            "",
            "SLIDE TO KEEP MOVING",
            "",
            "NEVER STOP MOVING",
            "",
            "DO NOT EVER STOP"
        ]
    },
    {
        title: "FIGHT, " + HERO_CHARACTER,
        content: [
            "IGNORANCE IS YOUR STRENGTH",
            "",
            "YOU WILL FIRE ON YOUR OWN",
            "",
            "YOUR MIND TARGETS CLOSE",
            "",
            "USE MOVEMENT TO AIM"
        ]
    },
    {
        title: "GROW, " + HERO_CHARACTER,
        content: [
            "THE CARDS HOLD THE TRUTH",
            "",
            "VICTORIES WILL REVEAL THEM",
            "",
            "ONLY ONE CAN BE PICKED",
            "",
            "EVERY CHOICE MATTERS"
        ]
    },
    {
        title: "THE FOUR PILLARS",
        content: [
            STAT_DEFINITIONS.POW.kanji + " = MORE DAMAGE",
            "",
            STAT_DEFINITIONS.AGI.kanji + " = FASTER SHOTS",
            "",
            STAT_DEFINITIONS.LUK.kanji + " = SPECIAL EFFECTS",
            "",
            STAT_DEFINITIONS.END.kanji + " = GREATER LIFE",
        ]
    },
    {
        title: "TIME IS FLEETING",
        content: [
            "TO WIN THE GAME",
            "",
            "SHOOT AT YOUR ENEMIES",
            "",
            "NOTHING ELSE MATTERS",
            "",
            "GOOD LUCK,   " + HERO_CHARACTER,
        ]
    },
];

const HelpSystem = {
    // UI elements
    elements: {
        container: null,
        background: null,
        borderRect: null,
        titleText: null,
        contentLines: [],
        leftArrow: null,
        rightArrow: null,
        pageIndicator: null,
        closeButton: null
    },

    // Current page tracking
    currentPage: 0,
    isOpen: false,

    // Store panel dimensions for relative positioning
    panelWidth: 0,
    panelHeight: 0,

    // Track if we paused the game when opening help
    pausedGameForHelp: false,

    // Create the help screen
    show: function (scene) {
        if (this.isOpen) return;

        // Clean up any existing help screen first
        this.hide();

        // Check if game is currently running (not paused and not game over)
        const gameIsRunning = !gamePaused && !gameOver && gameStarted;

        // If game is running, pause it and remember that we did
        if (gameIsRunning && window.PauseSystem) {
            this.pausedGameForHelp = true;
            window.PauseSystem.pauseGame();
        } else {
            this.pausedGameForHelp = false;
        }

        this.isOpen = true;

        // Create a container with very high depth for all elements
        this.elements.container = scene.add.container(0, 0);
        this.elements.container.setDepth(2000); // Higher than pause screen (1000)

        // Only create background if there isn't already a pause screen visible
        const pauseScreenVisible = scene.pauseScreen && scene.pauseScreen.visible;
        if (!pauseScreenVisible) {
            // Create black semi-transparent background for full screen
            const fullscreenBg = scene.add.rectangle(
                game.config.width / 2,
                game.config.height / 2,
                game.config.width,
                game.config.height,
                0x000000, 0.7
            );
            this.elements.container.add(fullscreenBg);
        }

        // Use fixed dimensions instead of relative positioning for consistency
        this.panelWidth = Math.max(600, game.config.width * 0.5); // 50% of screen width, min 600px
        const heightPercent = (typeof KAJISULI_MODE !== 'undefined' && KAJISULI_MODE) ? 0.6 : 0.8;
        this.panelHeight = Math.max(480, game.config.height * heightPercent);
        const centerX = game.config.width / 2;
        const centerY = game.config.height / 2;

        // Create panel black background
        this.elements.background = scene.add.rectangle(
            centerX, centerY,
            this.panelWidth, this.panelHeight,
            0x000000
        );
        this.elements.container.add(this.elements.background);

        // Create golden border
        this.elements.borderRect = scene.add.rectangle(
            centerX, centerY,
            this.panelWidth, this.panelHeight
        );
        this.elements.borderRect.setStrokeStyle(4, 0xFFD700);
        this.elements.container.add(this.elements.borderRect);

        // Create navigation arrows at the bottom with larger tap areas
        const arrowConfig = {
            fontSize: '60px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        };

        const arrowY = centerY + this.panelHeight * 0.4; // Bottom area
        const arrowSpacing = this.panelWidth * 0.2; // Distance from center
        const arrowTapSize = 100; // Larger tap area around arrows

        // Create invisible tap area for left arrow
        const leftArrowTapArea = scene.add.rectangle(
            centerX - arrowSpacing,
            arrowY,
            arrowTapSize,
            arrowTapSize,
            0x000000, 0 // Transparent
        );
        leftArrowTapArea.setInteractive({ useHandCursor: true });
        leftArrowTapArea.on('pointerdown', () => this.previousPage(scene));
        this.elements.container.add(leftArrowTapArea);

        this.elements.leftArrow = scene.add.text(
            centerX - arrowSpacing,
            arrowY,
            '◀',
            arrowConfig
        ).setOrigin(0.5);
        this.elements.container.add(this.elements.leftArrow);

        // Create invisible tap area for right arrow
        const rightArrowTapArea = scene.add.rectangle(
            centerX + arrowSpacing,
            arrowY,
            arrowTapSize,
            arrowTapSize,
            0x000000, 0 // Transparent
        );
        rightArrowTapArea.setInteractive({ useHandCursor: true });
        rightArrowTapArea.on('pointerdown', () => this.nextPage(scene));
        this.elements.container.add(rightArrowTapArea);

        this.elements.rightArrow = scene.add.text(
            centerX + arrowSpacing,
            arrowY,
            '▶',
            arrowConfig
        ).setOrigin(0.5);
        this.elements.container.add(this.elements.rightArrow);

        // Create page indicator between the arrows
        this.elements.pageIndicator = scene.add.text(
            centerX,
            arrowY,
            '',
            {
                fontFamily: 'Arial',
                fontSize: '32px', // Larger to match arrows better
                color: '#ffffff'
            }
        ).setOrigin(0.5);
        this.elements.container.add(this.elements.pageIndicator);

        // Make clicking outside the panel (but inside the background) close the help screen
        const fullscreenBg = this.elements.container.list.find(obj => obj.width === game.config.width);
        if (fullscreenBg) {
            fullscreenBg.setInteractive();
            fullscreenBg.on('pointerdown', (pointer, localX, localY) => {
                // Calculate if click was outside the panel
                const clickX = pointer.x;
                const clickY = pointer.y;

                // Panel boundaries
                const panelLeft = centerX - this.panelWidth / 2;
                const panelRight = centerX + this.panelWidth / 2;
                const panelTop = centerY - this.panelHeight / 2;
                const panelBottom = centerY + this.panelHeight / 2;

                // Only close if click was outside the panel
                if (clickX < panelLeft || clickX > panelRight ||
                    clickY < panelTop || clickY > panelBottom) {
                    this.hide();
                }
            });
        }

        // Set up keyboard handler for escape key
        this.setupKeyboardHandler(scene);

        // Display the first page
        this.updatePage(scene);
    },

    // Hide the help screen
    hide: function () {
        this.isOpen = false;
        this.cleanupKeyboardHandler();

        // If we paused the game when opening help, resume it now
        if (this.pausedGameForHelp && window.PauseSystem) {
            this.pausedGameForHelp = false;
            window.PauseSystem.resumeGame();
        }

        if (this.elements.container) {
            this.elements.container.destroy();
        }

        // Reset all element references
        Object.keys(this.elements).forEach(key => {
            this.elements[key] = null;
        });
    },

    // Navigate to previous page
    previousPage: function (scene) {
        this.currentPage = (this.currentPage - 1 + HELP_PAGES.length) % HELP_PAGES.length;
        this.updatePage(scene);
    },

    // Navigate to next page
    nextPage: function (scene) {
        this.currentPage = (this.currentPage + 1) % HELP_PAGES.length;
        this.updatePage(scene);
    },

    // Update the displayed page content
    updatePage: function (scene) {
        const page = HELP_PAGES[this.currentPage];
        const centerX = game.config.width / 2;
        const centerY = game.config.height / 2;

        // Use stored panel dimensions, with fallback
        const panelHeight = this.panelHeight || Math.max(480, game.config.height * 0.6);

        // Clear existing content - safely handle null arrays
        if (this.elements.contentLines && Array.isArray(this.elements.contentLines)) {
            this.elements.contentLines.forEach(line => {
                if (line && line.destroy) line.destroy();
            });
        }
        this.elements.contentLines = [];

        if (this.elements.titleText) {
            this.elements.titleText.destroy();
            this.elements.titleText = null;
        }

        // Create title - position relative to panel
        this.elements.titleText = scene.add.text(
            centerX,
            centerY - panelHeight * 0.35, // 35% up from center of panel
            page.title,
            {
                fontFamily: 'Arial',
                fontSize: '48px',
                color: '#FFD700',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        this.elements.container.add(this.elements.titleText);

        // Create content lines - position relative to panel
        const lineHeight = 40;
        const startY = centerY - panelHeight * 0.15; // 15% up from center of panel

        page.content.forEach((line, index) => {
            const contentLine = scene.add.text(
                centerX,
                startY + (index * lineHeight),
                line,
                {
                    fontFamily: 'Arial',
                    fontSize: '32px',
                    color: '#ffffff',
                    align: 'center'
                }
            ).setOrigin(0.5);

            this.elements.contentLines.push(contentLine);
            this.elements.container.add(contentLine);
        });

        // Update page indicator
        this.elements.pageIndicator.setText(`${this.currentPage + 1} / ${HELP_PAGES.length}`);

        // Update arrow visibility
        this.updateArrowVisibility();
    },

    // Update arrow visibility based on current page
    updateArrowVisibility: function () {
        if (HELP_PAGES.length <= 1) {
            if (this.elements.leftArrow) this.elements.leftArrow.setVisible(false);
            if (this.elements.rightArrow) this.elements.rightArrow.setVisible(false);
        } else {
            if (this.elements.leftArrow) this.elements.leftArrow.setVisible(true);
            if (this.elements.rightArrow) this.elements.rightArrow.setVisible(true);
        }
    },

    // Setup keyboard handler for escape key
    setupKeyboardHandler: function (scene) {
        this.cleanupKeyboardHandler();

        this.escapeKeyHandler = function (event) {
            if (event.key === 'Escape') {
                HelpSystem.hide();
            }
        };

        window.addEventListener('keydown', this.escapeKeyHandler);
    },

    // Cleanup keyboard handler
    cleanupKeyboardHandler: function () {
        if (this.escapeKeyHandler) {
            window.removeEventListener('keydown', this.escapeKeyHandler);
            this.escapeKeyHandler = null;
        }
    }
};

// Export the help system
window.HelpSystem = HelpSystem;

// Helper function to create hexagon (import from menu.js logic)
function createHexagonButton(scene, x, y, size, fillColor = 0x000000, fillAlpha = 0.5) {
    const graphics = scene.add.graphics();

    // Calculate hexagon points - make it narrower (same as menu.js)
    const width = size * 0.85; // Reduced width
    const height = size * 0.866; // Proper hexagon aspect ratio

    // Hexagon vertices (pointy-top orientation)
    const points = [
        { x: 0, y: -height / 2 },           // Top
        { x: width / 2, y: -height / 4 },     // Top-right
        { x: width / 2, y: height / 4 },      // Bottom-right
        { x: 0, y: height / 2 },            // Bottom
        { x: -width / 2, y: height / 4 },     // Bottom-left
        { x: -width / 2, y: -height / 4 }     // Top-left
    ];

    // Position the graphics at the center
    graphics.x = x;
    graphics.y = y;

    // Draw filled hexagon
    graphics.fillStyle(fillColor, fillAlpha);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.closePath();
    graphics.fillPath();

    // Draw the 4 L borders (left + bottom-left + right + top-right)
    graphics.lineStyle(3, 0xFFD700);

    // Left side (bottom-left point to top-left point)
    graphics.beginPath();
    graphics.moveTo(points[4].x, points[4].y);
    graphics.lineTo(points[5].x, points[5].y);
    graphics.strokePath();

    // Bottom-left side (bottom point to bottom-left point)
    graphics.beginPath();
    graphics.moveTo(points[3].x, points[3].y);
    graphics.lineTo(points[4].x, points[4].y);
    graphics.strokePath();

    // Right side (top-right point to bottom-right point)
    graphics.beginPath();
    graphics.moveTo(points[1].x, points[1].y);
    graphics.lineTo(points[2].x, points[2].y);
    graphics.strokePath();

    // Top-right side (top point to top-right point)
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    graphics.lineTo(points[1].x, points[1].y);
    graphics.strokePath();

    return graphics;
}

// Add help button management to ButtonDisplay
const HelpButtonManager = {
    // Check if we're in Farcade mode (would be detected by mergeMinify.js)
    isFarcadeMode: function () {
        return typeof FARCADE_MODE !== 'undefined' && FARCADE_MODE;
    },

    // Get the appropriate button position based on mode
    getButtonPosition: function () {
        if (this.isFarcadeMode()) {
            // Use music button position for Farcade mode
            return {
                x: UI.buttons.music.x(),
                y: UI.buttons.music.y()
            };
        } else {
            // Use exact same positioning calculation as pause button
            return {
                x: UI.buttons.pause.x(),
                y: UI.buttons.pause.y()
            };
        }
    },

    // Create help button elements using hexagon
    createHelpButton: function (scene) {
        const position = this.getButtonPosition();

        // Use the same size calculation as other buttons in menu.js
        const buttonSize = UI.buttons.common.size() * 1.32; // Same scaling as other hexagons
        const fontSize = UI.buttons.common.fontSize(); // Same font size calculation

        // Create hexagonal help button
        scene.helpButtonHexagon = createHexagonButton(
            scene,
            position.x,
            position.y,
            buttonSize,
            0x000000,
            0.5  // 50% opacity so game elements show through
        );
        scene.helpButtonHexagon.setDepth(2001); // High depth to stay above pause overlays

        // Create help button text with ? symbol
        scene.helpButtonText = scene.add.text(
            position.x,
            position.y,
            '?',
            {
                fontFamily: 'Arial',
                fontSize: `${fontSize}px`,
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5).setDepth(2001);

        // Make help button interactive using the hexagon (same pattern as menu.js)
        const hitAreaRadius = buttonSize * 0.6; // Circular hit area that fits within hexagon
        scene.helpButtonHexagon.setInteractive(
            new Phaser.Geom.Circle(0, 0, hitAreaRadius),
            Phaser.Geom.Circle.Contains,
            { useHandCursor: true }
        );

        scene.helpButtonHexagon.on('pointerover', function () {
            scene.helpButtonText.setColor('#ffff00'); // Yellow on hover
            scene.helpButtonText.setScale(1.1);
        });

        scene.helpButtonHexagon.on('pointerout', function () {
            scene.helpButtonText.setColor('#ffffff'); // White normally
            scene.helpButtonText.setScale(1);
        });

        scene.helpButtonHexagon.on('pointerdown', function () {
            // Toggle the help screen
            if (HelpSystem.elements.container && HelpSystem.elements.container.visible) {
                HelpSystem.hide();
            } else {
                HelpSystem.show(scene);
            }
        });
    },

    // Show help button (hide pause if needed)
    showHelpButton: function (scene) {
        if (!this.isFarcadeMode()) {
            // In normal mode, hide pause button elements
            if (scene.pauseHexagon) scene.pauseHexagon.setVisible(false);
            if (scene.pauseButtonText) scene.pauseButtonText.setVisible(false);
        }

        // Show help button elements
        if (scene.helpButtonHexagon) {
            scene.helpButtonHexagon.setVisible(true);
            scene.helpButtonHexagon.setDepth(2001);
            scene.helpButtonHexagon.setAlpha(1);
        }
        if (scene.helpButtonText) {
            scene.helpButtonText.setVisible(true);
            scene.helpButtonText.setDepth(2001);
            scene.helpButtonText.setAlpha(1);
        }
    },

    // Show pause button (hide help if needed)
    showPauseButton: function (scene) {
        if (!this.isFarcadeMode()) {
            // In normal mode, hide help button elements
            if (scene.helpButtonHexagon) scene.helpButtonHexagon.setVisible(false);
            if (scene.helpButtonText) scene.helpButtonText.setVisible(false);

            // Show pause button elements
            if (scene.pauseHexagon) {
                scene.pauseHexagon.setVisible(true);
                scene.pauseHexagon.setAlpha(1);
            }
            if (scene.pauseButtonText) {
                scene.pauseButtonText.setVisible(true);
                scene.pauseButtonText.setAlpha(1);
            }
        }
        // In Farcade mode, help button stays visible and pause button doesn't exist
    },

    // Update button positions if needed (for responsive design)
    updatePosition: function (scene) {
        const position = this.getButtonPosition();

        if (scene.helpButtonText && scene.helpButtonHexagon) {
            scene.helpButtonText.setPosition(position.x, position.y);
            scene.helpButtonHexagon.x = position.x;
            scene.helpButtonHexagon.y = position.y;
        }
    }
};

// Export help button manager
window.HelpButtonManager = HelpButtonManager;

// Game state management for button switching
const ButtonStateManager = {
    // Called when game starts (after "ENTER THE LOOP")
    onGameStart: function (scene) {
        // Check Boss Rush mode first - it takes priority over other modes
        if (window.BOSS_RUSH_MODE) {
            // In Boss Rush mode, we need both help and pause buttons (for switching)
            if (!HelpButtonManager.isFarcadeMode()) {
                // Clean up any existing help button from start screen
                if (scene.helpButtonHexagon) scene.helpButtonHexagon.destroy();
                if (scene.helpButtonText) scene.helpButtonText.destroy();

                // Create help button (will be hidden initially)
                HelpButtonManager.createHelpButton(scene);
                // Show pause button in bottom left initially
                HelpButtonManager.showPauseButton(scene);
            }
            // Show levelup button in bottom right
            if (window.LevelupButtonManager) {
                window.LevelupButtonManager.showLevelupButton(scene);
            }
        } else if (HelpButtonManager.isFarcadeMode()) {
            // In FARCADE mode (no Boss Rush), help button stays in bottom right
            HelpButtonManager.createHelpButton(scene);
            console.log('FARCADE mode: Help button created on game start');
        } else {
            // Normal mode (no Boss Rush, no FARCADE)
            // Clean up any existing help button from start screen
            if (scene.helpButtonHexagon) scene.helpButtonHexagon.destroy();
            if (scene.helpButtonText) scene.helpButtonText.destroy();

            // Create new help button in the game scene
            HelpButtonManager.createHelpButton(scene);
            // Show pause button in bottom left, music button in bottom right
            HelpButtonManager.showPauseButton(scene);
        }
    },

    // Called when game is paused (manual pause or level up)
    onGamePause: function (scene) {
        if (window.BOSS_RUSH_MODE) {
            // Hide levelup button, show music/help button in bottom right
            if (window.LevelupButtonManager) {
                window.LevelupButtonManager.hideLevelupButton(scene);
            }
            // Show help button in bottom left (unless FARCADE mode)
            if (!HelpButtonManager.isFarcadeMode()) {
                HelpButtonManager.showHelpButton(scene);
            }
        } else if (HelpButtonManager.isFarcadeMode()) {
            // In FARCADE mode, help button stays visible (do nothing)
            console.log('FARCADE mode: Help button remains visible during pause');
        } else {
            // Normal mode - show help button in bottom left
            HelpButtonManager.showHelpButton(scene);
        }
    },

    // Called when game resumes from pause
    onGameResume: function (scene) {
        if (window.BOSS_RUSH_MODE) {
            // Show levelup button in bottom right
            if (window.LevelupButtonManager) {
                window.LevelupButtonManager.showLevelupButton(scene);
            }
            // Show pause button in bottom left (unless FARCADE mode)
            if (!HelpButtonManager.isFarcadeMode()) {
                HelpButtonManager.showPauseButton(scene);
            }
        } else if (HelpButtonManager.isFarcadeMode()) {
            // In FARCADE mode, help button stays visible (do nothing)
            console.log('FARCADE mode: Help button remains visible after resume');
        } else {
            // Normal mode - show pause button in bottom left, music in bottom right
            HelpButtonManager.showPauseButton(scene);
        }
    }
};

// Export button state manager
window.ButtonStateManager = ButtonStateManager;

// Levelup button manager for Boss Rush mode
const LevelupButtonManager = {
    // Check if Boss Rush mode is enabled
    isBossRushMode: function () {
        return window.BOSS_RUSH_MODE === true;
    },

    // Show levelup button (hide music/help buttons in bottom right)
    showLevelupButton: function (scene) {
        if (!this.isBossRushMode()) return;

        // Hide music button elements (hexagon version)
        if (scene.musicHexagon) scene.musicHexagon.setVisible(false);
        if (scene.musicButtonText) scene.musicButtonText.setVisible(false);

        // Hide help button elements if they're in the music position (FARCADE mode)
        if (HelpButtonManager.isFarcadeMode()) {
            if (scene.helpButtonHexagon) scene.helpButtonHexagon.setVisible(false);
            if (scene.helpButtonText) scene.helpButtonText.setVisible(false);
        }

        // Show levelup button elements (hexagon version)
        if (scene.levelupHexagon) {
            scene.levelupHexagon.setVisible(true);
            scene.levelupHexagon.setAlpha(1);
        }
        if (scene.levelupButtonText) {
            scene.levelupButtonText.setVisible(true);
            scene.levelupButtonText.setAlpha(1);
        }
    },

    // Hide levelup button (show music/help buttons in bottom right)
    hideLevelupButton: function (scene) {
        // Hide levelup button elements (hexagon version)
        if (scene.levelupHexagon) scene.levelupHexagon.setVisible(false);
        if (scene.levelupButtonText) scene.levelupButtonText.setVisible(false);

        // Show appropriate button for bottom right corner
        if (HelpButtonManager.isFarcadeMode()) {
            // In FARCADE mode, show help button
            if (scene.helpButtonHexagon) {
                scene.helpButtonHexagon.setVisible(true);
                scene.helpButtonHexagon.setAlpha(1);
            }
            if (scene.helpButtonText) {
                scene.helpButtonText.setVisible(true);
                scene.helpButtonText.setAlpha(1);
            }
        } else {
            // In normal mode, show music button
            if (scene.musicHexagon) scene.musicHexagon.setVisible(true);
            if (scene.musicButtonText) scene.musicButtonText.setVisible(true);
        }
    }
};

// Export levelup button manager
window.LevelupButtonManager = LevelupButtonManager;