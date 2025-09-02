// Updated help.js - Simplified and Fixed Help Button System

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

// Unified Button Management System - Replaces the complex multi-manager system
const UnifiedButtonManager = {
    // Button references for easy management (removed levelup)
    buttons: {
        pause: { hexagon: null, text: null },
        music: { hexagon: null, text: null },
        help: { hexagon: null, text: null }
    },

    // Current button state
    currentState: 'normal', // 'normal', 'paused', 'farcade'

    // Check if we're in FARCADE mode
    isFarcadeMode: function () {
        return typeof FARCADE_MODE !== 'undefined' && FARCADE_MODE;
    },

    // Create all button types (called from ButtonDisplay.create)
    createAllButtons: function (scene) {
        // Ensure UI is initialized
        try {
            if (typeof UI !== 'undefined' && UI.game && typeof UI.game.init === 'function') {
                UI.game.init(scene);
            } else {
                console.warn('UI system not properly initialized, some positioning may be incorrect');
            }
        } catch (error) {
            console.error('Error initializing UI system:', error);
        }

        // Clean up existing buttons
        this.destroyAllButtons(scene);

        // Create pause button
        this.buttons.pause = this.createButton(scene, 'pause', () => {
            if (!gameOver) {
                if (gamePaused) {
                    PauseSystem.resumeGame();
                } else {
                    PauseSystem.pauseGameWithOverlay();
                }
            }
        });

        // Create music button
        this.buttons.music = this.createButton(scene, 'music', () => {
            if (window.MusicSystem) {
                const newState = !window.MusicSystem.musicEnabled;
                window.MusicSystem.setMusicEnabled(newState);
                this.updateMusicButtonSymbol(scene);
                console.log(`Music ${newState ? 'enabled' : 'disabled'}`);
            }
        });

        // Create help button
        this.buttons.help = this.createButton(scene, 'help', () => {
            if (HelpSystem.elements.container && HelpSystem.elements.container.visible) {
                HelpSystem.hide();
            } else {
                HelpSystem.show(scene);
            }
        });

        // Set initial visibility state
        this.updateButtonVisibility(scene);
    },

    // Update button visibility based on current state (simplified without levelup logic)
    updateButtonVisibility: function (scene) {
        // Hide all buttons first
        this.setButtonVisible('pause', false);
        this.setButtonVisible('music', false);
        this.setButtonVisible('help', false);

        if (this.currentState === 'paused') {
            // PAUSED STATE
            if (this.isFarcadeMode()) {
                // FARCADE + PAUSED: Pause stays in left, Help goes to right
                this.setButtonVisible('pause', true); // Keep pause in bottom left
                this.setButtonVisible('help', true);  // Help in bottom right
                this.positionHelpButton(scene, 'music'); // Help replaces music position
            } else {
                // NORMAL + PAUSED: Help replaces Pause in left, Music in right
                this.setButtonVisible('help', true); // Help in bottom left (pause position)
                this.positionHelpButton(scene, 'pause');
                this.setButtonVisible('music', true); // Music in bottom right
            }
        } else {
            // UNPAUSED STATE
            this.setButtonVisible('pause', true); // Pause always in bottom left when unpaused

            if (this.isFarcadeMode()) {
                // FARCADE mode: Help permanently replaces Music
                this.setButtonVisible('help', true);
                this.positionHelpButton(scene, 'music');
            } else {
                // Normal mode: Music in bottom right
                this.setButtonVisible('music', true);
            }
        }
    },

    // Helper to position help button at another button's position
    positionHelpButton: function (scene, targetButtonType) {
        if (!this.buttons.help || !this.buttons.help.hexagon || !this.buttons.help.text) {
            return;
        }

        const targetConfig = UI.buttons[targetButtonType];
        if (!targetConfig) {
            console.warn(`Cannot position help button: target button type '${targetButtonType}' not found`);
            return;
        }

        const x = targetConfig.x();
        const y = targetConfig.y();

        this.buttons.help.hexagon.x = x;
        this.buttons.help.hexagon.y = y;
        this.buttons.help.text.setPosition(x, y);
    },

    // Helper to set button visibility
    setButtonVisible: function (buttonType, visible) {
        const button = this.buttons[buttonType];
        if (button && button.hexagon && button.text) {
            button.hexagon.setVisible(visible);
            button.text.setVisible(visible);
        }
    },

    // Destroy all buttons (updated to not include levelup)
    destroyAllButtons: function (scene) {
        Object.keys(this.buttons).forEach(buttonType => {
            const button = this.buttons[buttonType];
            if (button && button.hexagon) button.hexagon.destroy();
            if (button && button.text) button.text.destroy();

            // Also clean up scene references
            if (scene && scene[`${buttonType}Hexagon`]) {
                scene[`${buttonType}Hexagon`] = null;
            }
            if (scene && scene[`${buttonType}ButtonText`]) {
                scene[`${buttonType}ButtonText`] = null;
            }
        });

        // Reset button references (removed levelup)
        this.buttons = {
            pause: { hexagon: null, text: null },
            music: { hexagon: null, text: null },
            help: { hexagon: null, text: null }
        };
    },

    // Update button positions (for resize handling)
    updateButtonPositions: function (scene) {
        Object.keys(this.buttons).forEach(buttonType => {
            const button = this.buttons[buttonType];
            const config = UI.buttons[buttonType];

            if (button && button.hexagon && button.text && config) {
                const x = config.x();
                const y = config.y();

                button.hexagon.x = x;
                button.hexagon.y = y;
                button.text.setPosition(x, y);
            }
        });
    },

    // Create a single button using the unified createHexagon function
    createButton: function (scene, buttonType, onClickCallback) {
        // Defensive checks
        if (!scene || !scene.add) {
            console.error(`Invalid scene provided for button creation: ${buttonType}`);
            return { hexagon: null, text: null };
        }

        if (!UI || !UI.buttons || !UI.buttons[buttonType]) {
            console.error(`Button configuration not found for type: ${buttonType}. Available types:`, Object.keys(UI?.buttons || {}));
            return { hexagon: null, text: null };
        }

        const config = UI.buttons[buttonType];
        const commonConfig = UI.buttons.common;

        if (!commonConfig || typeof commonConfig.size !== 'function') {
            console.error(`Button common configuration invalid for type: ${buttonType}`);
            return { hexagon: null, text: null };
        }

        const hexSize = commonConfig.size() * 1.32;

        // Use the unified createHexagon function from menu.js
        let hexagon;
        let x, y;

        // Get position with error handling
        try {
            x = typeof config.x === 'function' ? config.x() : (config.x || 0);
            y = typeof config.y === 'function' ? config.y() : (config.y || 0);
        } catch (error) {
            console.error(`Error getting position for button ${buttonType}:`, error);
            x = 100; // fallback position
            y = 100;
        }

        if (typeof createHexagon === 'function') {
            hexagon = createHexagon(scene, x, y, hexSize, 0x000000, 0.5);
        } else {
            // Fallback if createHexagon is not available
            console.warn('createHexagon function not available, using circle fallback');
            hexagon = scene.add.circle(x, y, hexSize / 2, 0x000000, 0.5);
        }

        hexagon.setDepth(2001);

        // Get button symbol
        let symbol = config.symbol || '?';
        if (buttonType === 'music' && window.MusicSystem) {
            symbol = window.MusicSystem.musicEnabled ? config.symbol : (config.mutedSymbol || config.symbol);
        }

        // Get font size with error handling
        let fontSize;
        try {
            fontSize = typeof config.fontSize === 'function' ? config.fontSize() : (config.fontSize || '24px');
            if (typeof fontSize === 'number') {
                fontSize = fontSize + 'px';
            }
        } catch (error) {
            console.error(`Error getting font size for button ${buttonType}:`, error);
            fontSize = '24px';
        }

        // Create button text
        const text = scene.add.text(x, y, symbol, {
            fontFamily: 'Arial',
            fontSize: fontSize,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2001);

        // Make interactive - use the hexagon instead of text for larger hit area
        const hitAreaRadius = hexSize * 0.6; // Circular hit area that fits within hexagon
        hexagon.setInteractive(
            new Phaser.Geom.Circle(0, 0, hitAreaRadius),
            Phaser.Geom.Circle.Contains,
            { useHandCursor: true }
        );

        // Add hover effects to hexagon (affects text visually)
        hexagon.on('pointerover', function () {
            text.setColor('#ffff00'); // Yellow text on hover
            text.setScale(1.1); // Scale text on hover
        });

        hexagon.on('pointerout', function () {
            text.setColor('#ffffff'); // White text normally
            text.setScale(1); // Reset text scale
        });

        // Add click handler to hexagon
        if (onClickCallback) {
            hexagon.on('pointerdown', onClickCallback);
        }

        // Store references on scene for compatibility
        scene[`${buttonType}Hexagon`] = hexagon;
        scene[`${buttonType}ButtonText`] = text;

        return { hexagon, text };
    },

    // Update music button symbol
    updateMusicButtonSymbol: function (scene) {
        if (this.buttons.music && this.buttons.music.text && window.MusicSystem) {
            const config = UI.buttons.music;
            const symbol = window.MusicSystem.musicEnabled ? config.symbol : config.mutedSymbol;
            this.buttons.music.text.setText(symbol);
        }
    },

    // State change handlers
    onGameStart: function (scene) {
        this.currentState = 'normal';
        this.updateButtonVisibility(scene);
        console.log(`Button state: ${this.currentState} (FARCADE: ${this.isFarcadeMode()})`);
    },

    onGamePause: function (scene) {
        this.currentState = 'paused';
        this.updateButtonVisibility(scene);
        console.log(`Button state: ${this.currentState} (FARCADE: ${this.isFarcadeMode()})`);
    },

    onGameResume: function (scene) {
        this.currentState = 'normal';
        this.updateButtonVisibility(scene);
        console.log(`Button state: ${this.currentState} (FARCADE: ${this.isFarcadeMode()})`);
    }
};

// Export the unified system
window.UnifiedButtonManager = UnifiedButtonManager;

// Updated backward compatibility - remove levelup manager
window.HelpButtonManager = {
    isFarcadeMode: () => UnifiedButtonManager.isFarcadeMode(),
    createHelpButton: (scene) => {
        console.log('HelpButtonManager.createHelpButton called - handled by UnifiedButtonManager');
    },
    showHelpButton: (scene) => {
        UnifiedButtonManager.currentState = 'paused';
        UnifiedButtonManager.updateButtonVisibility(scene);
    },
    showPauseButton: (scene) => {
        UnifiedButtonManager.currentState = UnifiedButtonManager.isFarcadeMode() ? 'farcade' : 'normal';
        UnifiedButtonManager.updateButtonVisibility(scene);
    },
    updatePosition: (scene) => UnifiedButtonManager.updateButtonPositions(scene)
};

window.ButtonStateManager = {
    onGameStart: (scene) => UnifiedButtonManager.onGameStart(scene),
    onGamePause: (scene) => UnifiedButtonManager.onGamePause(scene),
    onGameResume: (scene) => UnifiedButtonManager.onGameResume(scene)
};

// Export the unified system
window.UnifiedButtonManager = UnifiedButtonManager;

// Backward compatibility - redirect old managers to new unified system
window.HelpButtonManager = {
    isFarcadeMode: () => UnifiedButtonManager.isFarcadeMode(),
    createHelpButton: (scene) => {
        // This is now handled by createAllButtons
        console.log('HelpButtonManager.createHelpButton called - handled by UnifiedButtonManager');
    },
    showHelpButton: (scene) => {
        UnifiedButtonManager.currentState = 'paused';
        UnifiedButtonManager.updateButtonVisibility(scene);
    },
    showPauseButton: (scene) => {
        UnifiedButtonManager.currentState = UnifiedButtonManager.isFarcadeMode() ? 'farcade' : 'normal';
        UnifiedButtonManager.updateButtonVisibility(scene);
    },
    updatePosition: (scene) => UnifiedButtonManager.updateButtonPositions(scene)
};

window.ButtonStateManager = {
    onGameStart: (scene) => UnifiedButtonManager.onGameStart(scene),
    onGamePause: (scene) => UnifiedButtonManager.onGamePause(scene),
    onGameResume: (scene) => UnifiedButtonManager.onGameResume(scene)
};
