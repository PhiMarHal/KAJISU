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
            "SLIDE THEN HOLD TO MOVE",
            "",
            "SHIFT DIRECTION AT WILL",
            "",
            "RELEASE TO STOP",
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

    // Create the help screen
    show: function (scene) {
        if (this.isOpen) return;
        this.isOpen = true;

        // Clean up any existing help screen first
        this.hide();

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

        // Create navigation arrows at the bottom
        const arrowConfig = {
            fontSize: '60px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        };

        const arrowY = centerY + this.panelHeight * 0.4; // Bottom area
        const arrowSpacing = this.panelWidth * 0.2; // Distance from center

        this.elements.leftArrow = scene.add.text(
            centerX - arrowSpacing,
            arrowY,
            '◀',
            arrowConfig
        ).setOrigin(0.5);
        this.elements.leftArrow.setInteractive({ useHandCursor: true });
        this.elements.leftArrow.on('pointerdown', () => this.previousPage(scene));
        this.elements.container.add(this.elements.leftArrow);

        this.elements.rightArrow = scene.add.text(
            centerX + arrowSpacing,
            arrowY,
            '▶',
            arrowConfig
        ).setOrigin(0.5);
        this.elements.rightArrow.setInteractive({ useHandCursor: true });
        this.elements.rightArrow.on('pointerdown', () => this.nextPage(scene));
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

        // Make clicking outside close the help screen
        const fullscreenBg = this.elements.container.list.find(obj => obj.width === game.config.width);
        if (fullscreenBg) {
            fullscreenBg.setInteractive();
            fullscreenBg.on('pointerdown', () => this.hide());
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

    // Create help button elements
    createHelpButton: function (scene) {
        const position = this.getButtonPosition();

        // Match the actual size used by pause/music buttons
        // UI.buttons.common.size() = UI.rel.height(5) = 5% of screen height
        // In KAJISULI mode (1280px height): 5% = 64px
        // In normal mode (800px height): 5% = 40px
        const buttonSize = Math.floor(game.config.height * 0.05); // 5% of screen height
        const borderWidth = 2; // UI.buttons.common.borderWidth
        const fontSize = Math.floor(buttonSize * 0.6); // 60% of button size (same as commonConfig.fontSize)

        // Create help button background and border (same style as other buttons)
        scene.helpButtonBorder = scene.add.rectangle(
            position.x,
            position.y,
            buttonSize + (borderWidth * 2),
            buttonSize + (borderWidth * 2),
            UI.colors.gold
        ).setDepth(2001); // High depth to stay above pause overlays

        scene.helpButtonBg = scene.add.rectangle(
            position.x,
            position.y,
            buttonSize,
            buttonSize,
            UI.colors.black
        ).setDepth(2001); // High depth to stay above pause overlays

        // Create help button with ? symbol - use same font size calculation as other buttons
        scene.helpButton = scene.add.text(
            position.x,
            position.y,
            '?',
            {
                fontFamily: 'Arial',
                fontSize: `${fontSize}px`, // 60% of button size, same as other buttons
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5).setDepth(2001); // High depth to stay above pause overlays

        // Make help button interactive - use the border for larger click area
        scene.helpButtonBorder.setInteractive({ useHandCursor: true });

        scene.helpButtonBorder.on('pointerover', function () {
            scene.helpButton.setColor('#ffff00'); // Yellow on hover
            scene.helpButton.setScale(1.1);
        });

        scene.helpButtonBorder.on('pointerout', function () {
            scene.helpButton.setColor('#ffffff'); // White normally
            scene.helpButton.setScale(1);
        });

        scene.helpButtonBorder.on('pointerdown', function () {
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
            if (scene.pauseButton) scene.pauseButton.setVisible(false);
            if (scene.pauseButtonBg) scene.pauseButtonBg.setVisible(false);
            if (scene.pauseButtonBorder) scene.pauseButtonBorder.setVisible(false);
        }

        // Show help button elements and ensure they're not darkened
        if (scene.helpButton) {
            scene.helpButton.setVisible(true);
            scene.helpButton.setDepth(2001); // Higher than help screen container
        }
        if (scene.helpButtonBg) {
            scene.helpButtonBg.setVisible(true);
            scene.helpButtonBg.setDepth(2001); // Higher than help screen container
        }
        if (scene.helpButtonBorder) {
            scene.helpButtonBorder.setVisible(true);
            scene.helpButtonBorder.setDepth(2001); // Higher than help screen container
        }
    },

    // Show pause button (hide help if needed)
    showPauseButton: function (scene) {
        if (!this.isFarcadeMode()) {
            // In normal mode, hide help button elements
            if (scene.helpButton) scene.helpButton.setVisible(false);
            if (scene.helpButtonBg) scene.helpButtonBg.setVisible(false);
            if (scene.helpButtonBorder) scene.helpButtonBorder.setVisible(false);

            // Show pause button elements
            if (scene.pauseButton) scene.pauseButton.setVisible(true);
            if (scene.pauseButtonBg) scene.pauseButtonBg.setVisible(true);
            if (scene.pauseButtonBorder) scene.pauseButtonBorder.setVisible(true);
        }
        // In Farcade mode, help button stays visible and pause button doesn't exist
    },

    // Update button positions if needed (for responsive design)
    updatePosition: function (scene) {
        const position = this.getButtonPosition();

        if (scene.helpButton && scene.helpButtonBg && scene.helpButtonBorder) {
            scene.helpButton.setPosition(position.x, position.y);
            scene.helpButtonBg.setPosition(position.x, position.y);
            scene.helpButtonBorder.setPosition(position.x, position.y);
        }
    }
};

// Export help button manager
window.HelpButtonManager = HelpButtonManager;

// Game state management for button switching
const ButtonStateManager = {
    // Called when game starts (after "ENTER THE LOOP")
    onGameStart: function (scene) {
        if (!HelpButtonManager.isFarcadeMode()) {
            // First, clean up any existing help button from start screen
            if (scene.helpButton) scene.helpButton.destroy();
            if (scene.helpButtonBg) scene.helpButtonBg.destroy();
            if (scene.helpButtonBorder) scene.helpButtonBorder.destroy();

            // Create new help button in the game scene
            HelpButtonManager.createHelpButton(scene);

            // Then switch to pause button
            HelpButtonManager.showPauseButton(scene);
        }
    },

    // Called when game is paused (manual pause or level up)
    onGamePause: function (scene) {
        if (!HelpButtonManager.isFarcadeMode()) {
            HelpButtonManager.showHelpButton(scene);
        }
        // In Farcade mode, help button stays visible
    },

    // Called when game resumes from pause
    onGameResume: function (scene) {
        if (!HelpButtonManager.isFarcadeMode()) {
            HelpButtonManager.showPauseButton(scene);
        }
        // In Farcade mode, help button stays visible
    }
};

// Export button state manager
window.ButtonStateManager = ButtonStateManager;