// menu.js - UI Elements for Word Survivors

// UI Element constants with relative positioning
const UI = {
    kajisuli: {
        enabled: function () {
            // Access the global KAJISULI_MODE defined in index.html
            return (typeof KAJISULI_MODE !== 'undefined') ? KAJISULI_MODE : false;
        }
    },

    // Functions to get current game dimensions
    game: {
        getWidth: function () {
            return 1200; // Default width if no game instance available
        },
        getHeight: function () {
            return 800; // Default height if no game instance available
        },
        init: function (scene) {
            // Update getters to use actual canvas dimensions instead of config
            if (scene && scene.sys && scene.sys.game) {
                // Get the actual rendered canvas size rather than the config size
                this.getWidth = function () {
                    const canvas = scene.sys.game.canvas;
                    return canvas ? canvas.width : scene.sys.game.config.width;
                };
                this.getHeight = function () {
                    const canvas = scene.sys.game.canvas;
                    return canvas ? canvas.height : scene.sys.game.config.height;
                };

                // Log the dimensions for debugging
                //console.log(`UI initialized with dimensions: ${this.getWidth()}x${this.getHeight()}`);
            }
        }
    },

    // Helper functions for relative positioning
    rel: {
        width: function (percentage) {
            return UI.game.getWidth() * (percentage / 100);
        },
        height: function (percentage) {
            return UI.game.getHeight() * (percentage / 100);
        },
        x: function (percentage) {
            return UI.game.getWidth() * (percentage / 100);
        },
        y: function (percentage) {
            return UI.game.getHeight() * (percentage / 100);
        },
        // Function to calculate font size relative to screen height
        fontSize: function (percentage) {
            return Math.floor(UI.game.getHeight() * (percentage / 100));
        }
    },

    // Health bar configuration
    healthBar: {
        width: function () { return UI.rel.width(25); },       // 25% of screen width
        height: function () { return UI.rel.height(1.25); },   // 1.25% of screen height
        borderWidth: 2,
        innerMargin: 2,
        segmentGap: function () { return UI.rel.width(0.33); }, // 0.33% of screen width
        y: function () { return UI.rel.y(2.5); },              // 2.5% from top
        centerX: function () { return UI.rel.x(50); },         // Center of screen
        startX: function () { return UI.rel.x(37.5); }         // 37.5% of screen width
    },

    // Experience bar configuration
    expBar: {
        width: function () { return UI.rel.width(16.7); },     // 16.7% of screen width
        height: function () { return UI.rel.height(0.625); },  // 0.625% of screen height
        borderWidth: 2,
        innerMargin: 1,
        y: function () { return UI.rel.y(5.5); },              // 5.5% from top
        centerX: function () { return UI.rel.x(50); },         // Center of screen
        startX: function () { return UI.rel.x(41.7); },        // 41.7% from left
        textColor: "#00ffff",
        barColor: 0x00ffff,
        bgColor: 0x333333
    },

    // Status display (timer and kills)
    statusDisplay: {
        timerY: function () { return UI.rel.y(3.75); },        // 3.75% from top
        killsY: function () { return UI.rel.y(3.75); },        // Same Y as timer
        x: function () { return UI.rel.x(1.33); },             // 1.33% from left
        timerWidth: function () { return UI.rel.width(10); },  // 10% of screen width
        killsWidth: function () { return UI.rel.width(10); },  // Same width as timer
        killsX: function () { return UI.rel.x(13.33); },       // Position to right of timer
        height: function () { return UI.rel.height(2.5); },    // 2.5% of screen height
        borderWidth: 2,
        textPadding: function () { return UI.rel.width(0.33); }, // 0.33% of screen width
        clockSymbol: "時",  // Kanji for time/clock
        deathSymbol: "殺",  // Kanji for kill/death
        fontSize: function () { return UI.rel.fontSize(2); }   // 2% of screen height
    },

    // Stat display (POW, AGI, LUK, END)
    statDisplay: {
        y: function () { return UI.rel.y(3.75); },            // 3.75% from top
        x: function () { return UI.rel.x(76.7); },            // 76.7% from left (right side)
        spacing: function () { return UI.rel.width(5.83); },  // 5.83% of screen width
        width: function () { return UI.rel.width(4.17); },    // 4.17% of screen width
        height: function () { return UI.rel.height(3); },     // 3% of screen height
        borderWidth: 2,
        textPadding: function () { return UI.rel.width(0.33); }, // 0.33% of screen width
        fontSize: function () { return UI.rel.fontSize(2.5); }, // 2.5% of screen height
        symbols: {
            POW: "力", // Kanji for power/strength
            AGI: "速", // Kanji for speed
            LUK: "運", // Kanji for luck
            END: "耐"  // Kanji for endurance
        },
        symbolColors: {
            POW: "#cc0000", // Red
            AGI: "#0088ff", // Blue
            LUK: "#aa55cc", // Purple
            END: "#00aa00"  // Green
        }
    },

    // Pause/Music buttons
    buttons: {
        // Pause button configuration
        pause: {
            symbol: "休", // Kanji for "rest/break" - perfect for pause
            x: function () {
                if (UI.kajisuli.enabled()) {
                    // KAJISULI: Between timer and HP bar
                    const timerEnd = UI.rel.x(6) + (UI.statusDisplay.timerWidth() * 1.4); // Right edge of timer
                    const healthStart = UI.healthBar.centerX() - (UI.healthBar.width() * 1.5 / 2); // Left edge of HP bar
                    return (timerEnd + healthStart) / 2;
                } else {
                    // Normal: Between kill counter and HP bar
                    const killsEnd = UI.statusDisplay.killsX() + UI.statusDisplay.killsWidth(); // Right edge of kills
                    const healthStart = UI.healthBar.centerX() - (UI.healthBar.width() / 2); // Left edge of HP bar
                    return (killsEnd + healthStart) / 2;
                }
            },
            y: function () { return UI.statusDisplay.killsY() - UI.rel.height(0.3); }, // Slightly higher
            fontSize: function () {
                // Same size as kill counter box outer dimension
                const kajisuliScale = UI.kajisuli.enabled() ? 1.4 : 1;
                return UI.statusDisplay.height() + (UI.statusDisplay.borderWidth * 2) * kajisuliScale;
            }
        },

        // Music button configuration  
        music: {
            symbol: "音", // Kanji for "sound/music"
            mutedSymbol: "静", // Kanji for "quiet/silence"
            x: function () {
                if (UI.kajisuli.enabled()) {
                    // KAJISULI: Between HP bar and kill count
                    const healthEnd = UI.healthBar.centerX() + (UI.healthBar.width() * 1.5 / 2); // Right edge of HP bar
                    const killsStart = UI.game.getWidth() - UI.rel.x(6) - (UI.statusDisplay.killsWidth() * 1.4); // Left edge of kills
                    return (healthEnd + killsStart) / 2;
                } else {
                    // Normal: Between HP bar and first stat (POW)
                    const healthEnd = UI.healthBar.centerX() + (UI.healthBar.width() / 2); // Right edge of HP bar
                    const statsStart = UI.statDisplay.x(); // Left edge of stats
                    return (healthEnd + statsStart) / 2;
                }
            },
            y: function () { return UI.statusDisplay.killsY() - UI.rel.height(0.3); }, // Same as pause button
            fontSize: function () {
                // Same size as pause button
                const kajisuliScale = UI.kajisuli.enabled() ? 1.4 : 1;
                return UI.statusDisplay.height() + (UI.statusDisplay.borderWidth * 2) * kajisuliScale;
            }
        }
    },


    // Color constants
    colors: {
        gold: 0xFFD700,
        green: 0x00cc00,
        black: 0x000000,
        grey: 0x333333
    },

    // Depth constants
    depth: {
        ui: 100
    },

    // Font definitions
    fonts: {
        level: {
            size: function () { return `${UI.rel.fontSize(2.25)}px`; },
            family: 'Arial',
            color: '#FFD700'
        },
        xpNeeded: {
            size: function () { return `${UI.rel.fontSize(1.5)}px`; },
            family: 'Arial',
            color: '#00ffff'
        },
        stats: {
            size: function () { return `${UI.rel.fontSize(2.5)}px`; },
            family: 'Arial',
            color: '#FFFFFF'
        },
        timer: {
            size: function () { return `${UI.rel.fontSize(2.25)}px`; },
            family: 'Arial',
            color: '#FFFFFF'
        },
        kills: {
            size: function () { return `${UI.rel.fontSize(2.25)}px`; },
            family: 'Arial',
            color: '#FFFFFF'
        }
    }
};

// Button display functions
const ButtonDisplay = {
    create: function (scene) {
        // Initialize relative dimensions
        UI.game.init(scene);

        // Clean up existing buttons
        if (scene.pauseButton) scene.pauseButton.destroy();
        if (scene.musicButton) scene.musicButton.destroy();

        // Create pause button
        const pauseConfig = UI.buttons.pause;
        scene.pauseButton = scene.add.text(
            pauseConfig.x(),
            pauseConfig.y(),
            pauseConfig.symbol,
            {
                fontFamily: 'Arial',
                fontSize: `${pauseConfig.fontSize()}px`,
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5).setDepth(UI.depth.ui);
        scene.pauseButton.setAlpha(0.8);

        // Make pause button interactive
        scene.pauseButton.setInteractive({ useHandCursor: true });

        scene.pauseButton.on('pointerover', function () {
            this.setColor('#ffff00'); // Yellow on hover
            this.setScale(1.1);
        });

        scene.pauseButton.on('pointerout', function () {
            this.setColor('#ffffff'); // White normally
            this.setScale(1);
        });

        scene.pauseButton.on('pointerdown', function () {
            if (!gameOver) {
                if (gamePaused) {
                    PauseSystem.resumeGame();
                } else {
                    PauseSystem.pauseGameWithOverlay();
                }
            }
        });

        // Create music button with creative monochrome forcing
        const musicConfig = UI.buttons.music;
        const initialSymbol = (window.MusicSystem && window.MusicSystem.musicEnabled) ?
            musicConfig.symbol : musicConfig.mutedSymbol;

        scene.musicButton = scene.add.text(
            musicConfig.x(),
            musicConfig.y(),
            initialSymbol,
            {
                fontFamily: 'Arial',
                fontSize: `${musicConfig.fontSize()}px`,
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5).setDepth(UI.depth.ui);
        scene.musicButton.setAlpha(0.8);

        // Simple white text - no special effects needed with kanji
        // (Remove all the emoji tinting approaches)

        // Make music button interactive
        scene.musicButton.setInteractive({ useHandCursor: true });

        scene.musicButton.on('pointerover', function () {
            this.setColor('#ffff00'); // Yellow on hover
            this.setScale(1.1);
        });

        scene.musicButton.on('pointerout', function () {
            this.setColor('#ffffff'); // White normally
            this.setScale(1);
        });

        scene.musicButton.on('pointerdown', function () {
            if (window.MusicSystem) {
                // Toggle music state
                const newState = !window.MusicSystem.musicEnabled;
                window.MusicSystem.setMusicEnabled(newState);

                // Update button symbol to show new state immediately
                const symbol = newState ? musicConfig.symbol : musicConfig.mutedSymbol;
                scene.musicButton.setText(symbol);

                console.log(`Music ${newState ? 'enabled' : 'disabled'}`);
            }
        });

        // Initial update
        this.update(scene);
    },

    update: function (scene) {
        // Update button positions if needed (for responsive design)
        if (scene.pauseButton) {
            const pauseConfig = UI.buttons.pause;
            scene.pauseButton.setPosition(pauseConfig.x(), pauseConfig.y());
        }

        if (scene.musicButton) {
            const musicConfig = UI.buttons.music;
            scene.musicButton.setPosition(musicConfig.x(), musicConfig.y());

            // Ensure music button shows correct state
            if (window.MusicSystem) {
                const symbol = window.MusicSystem.musicEnabled ?
                    musicConfig.symbol : musicConfig.mutedSymbol;
                scene.musicButton.setText(symbol);
            }
        }
    }
};

// Health bar functions
const HealthBar = {
    create: function (scene) {
        // Initialize relative dimensions
        UI.game.init(scene);

        // Remove old health bar elements if they exist
        if (scene.healthBar) scene.healthBar.destroy();
        if (scene.healthBarBg) scene.healthBarBg.destroy();
        if (scene.healthText) scene.healthText.destroy();

        // Get kajisuli scale factors - wider not thicker
        const kajisuliScaleWidth = UI.kajisuli.enabled() ? 1.5 : 1;
        const kajisuliScaleHeight = 1; // Keep the same height

        // Store the scale factors for later use
        scene.healthBarScales = {
            width: kajisuliScaleWidth,
            height: kajisuliScaleHeight
        };

        // Get calculated dimensions
        const width = UI.healthBar.width() * kajisuliScaleWidth;
        const height = UI.healthBar.height() * kajisuliScaleHeight;
        const borderWidth = UI.healthBar.borderWidth;
        const innerMargin = UI.healthBar.innerMargin;
        const centerX = UI.healthBar.centerX();
        const y = UI.healthBar.y();

        // Create new container with golden border
        scene.healthBarBg = scene.add.rectangle(
            centerX,
            y,
            width + (borderWidth * 2),
            height + (borderWidth * 2),
            UI.colors.gold
        ).setDepth(UI.depth.ui);

        // Create inner black background
        scene.healthBarInnerBg = scene.add.rectangle(
            centerX,
            y,
            width,
            height,
            UI.colors.black
        ).setDepth(UI.depth.ui);

        // Create a container for segments
        scene.healthSegments = scene.add.group();

        // Container for separators
        scene.healthSeparators = scene.add.group();

        // Initial health segments
        this.update(scene);
    },

    update: function (scene) {
        // If segments don't exist yet or scene is not available, exit
        if (!scene.healthSegments || !scene.healthSegments.scene) return;

        // Clear existing segments and separators
        scene.healthSegments.clear(true, true);
        if (scene.healthSeparators) scene.healthSeparators.clear(true, true);

        // Get the scale factors from the scene
        const kajisuliScaleWidth = scene.healthBarScales?.width ?? (UI.kajisuli.enabled() ? 1.5 : 1);
        const kajisuliScaleHeight = scene.healthBarScales?.height ?? 1;

        // Get calculated dimensions
        const width = UI.healthBar.width() * kajisuliScaleWidth;
        const height = UI.healthBar.height() * kajisuliScaleHeight;
        const innerMargin = UI.healthBar.innerMargin;
        const centerX = UI.healthBar.centerX();
        const y = UI.healthBar.y();

        // Calculate content dimensions (accounting for margin)
        const contentWidth = width - (innerMargin * 2);
        const contentHeight = height - (innerMargin * 2);

        // Calculate segment dimensions
        const segmentGapWidth = UI.healthBar.segmentGap() * kajisuliScaleWidth;
        const totalGapWidth = (maxPlayerHealth - 1) * segmentGapWidth;
        const segmentWidth = (contentWidth - totalGapWidth) / maxPlayerHealth;

        // Calculate the starting position for the first segment (like the boss health bar)
        const startX = centerX - (width / 2) + innerMargin;

        // Create each segment
        for (let i = 0; i < maxPlayerHealth; i++) {
            // Only create filled segments for current health
            const isFilled = i < playerHealth;

            // Calculate segment position - important: this is where the proper spacing happens
            const segmentX = startX + (i * (segmentWidth + segmentGapWidth));

            // Create segment with high depth
            const segment = scene.add.rectangle(
                segmentX + (segmentWidth / 2), // Center the segment at its position
                y,
                segmentWidth,
                contentHeight,
                isFilled ? UI.colors.green : UI.colors.grey
            ).setDepth(UI.depth.ui);

            // Add to group for easy management
            scene.healthSegments.add(segment);

            // Add golden separator after each segment (except the last one)
            if (i < maxPlayerHealth - 1) {
                const separatorX = segmentX + segmentWidth + (segmentGapWidth / 2);
                const separator = scene.add.rectangle(
                    separatorX,
                    y,
                    2, // Fixed width for separator
                    contentHeight,
                    UI.colors.gold
                ).setDepth(UI.depth.ui);
                scene.healthSeparators.add(separator);
            }
        }
    }
};


// Helper function to format large numbers with 4 significant digits + kanji
function formatLargeNumber(number) {
    // Return original number if it's less than 5 digits
    if (number < 10000) {
        return number.toString();
    }

    // Kanji units for powers of 10
    const kanjiUnits = [
        { value: 1000000000000, kanji: '兆' },  // trillion
        { value: 100000000000, kanji: '千億' }, // 100 billion
        { value: 10000000000, kanji: '百億' },  // 10 billion
        { value: 1000000000, kanji: '十億' },   // billion
        { value: 100000000, kanji: '億' },      // 100 million
        { value: 10000000, kanji: '千万' },     // 10 million
        { value: 1000000, kanji: '百万' },      // million
        { value: 100000, kanji: '十万' },       // 100 thousand
        { value: 10000, kanji: '万' },          // 10 thousand
        { value: 1000, kanji: '千' },           // thousand
        { value: 100, kanji: '百' },            // hundred
        { value: 10, kanji: '十' }              // ten
    ];

    // Find the appropriate unit
    for (const unit of kanjiUnits) {
        if (number >= unit.value) {
            // Calculate the significant part (keeping 4 digits)
            const scaleFactor = unit.value / 1000; // We want 4 significant digits (1000-9999)
            const significantPart = Math.floor(number / scaleFactor);

            // Format with the unit
            return `${significantPart}${unit.kanji}`;
        }
    }

    // Fallback to original number (shouldn't reach here given our units cover all cases)
    return number.toString();
}

// Experience bar functions
const ExpBar = {
    create: function (scene) {
        // Initialize relative dimensions
        UI.game.init(scene);

        // Remove old exp bar elements if they exist
        if (scene.expBar) scene.expBar.destroy();
        if (scene.expBarBg) scene.expBarBg.destroy();
        if (scene.expText) scene.expText.destroy();
        if (scene.levelText) scene.levelText.destroy();
        if (scene.xpNeededText) scene.xpNeededText.destroy();

        // Get kajisuli scale factors - wider not thicker
        const kajisuliScaleWidth = UI.kajisuli.enabled() ? 1.5 : 1;
        const kajisuliScaleHeight = 1; // Keep the same height

        // Store the scale factors for later use
        scene.expBarScales = {
            width: kajisuliScaleWidth,
            height: kajisuliScaleHeight
        };

        // Get calculated dimensions
        const width = UI.expBar.width() * kajisuliScaleWidth;
        const height = UI.expBar.height() * kajisuliScaleHeight;
        const borderWidth = UI.expBar.borderWidth;
        const innerMargin = UI.expBar.innerMargin;
        const centerX = UI.expBar.centerX();
        const y = UI.expBar.y();

        // Create new container with golden border
        scene.expBarBg = scene.add.rectangle(
            centerX,
            y,
            width + (borderWidth * 2),
            height + (borderWidth * 2),
            UI.colors.gold
        ).setDepth(UI.depth.ui);

        // Create inner black background
        scene.expBarInnerBg = scene.add.rectangle(
            centerX,
            y,
            width,
            height,
            UI.colors.black
        ).setDepth(UI.depth.ui);

        // Calculate the starting position for the exp bar (at the left edge)
        const startX = centerX - (width / 2) + innerMargin;

        // Create the exp bar itself (initially empty)
        scene.expBar = scene.add.rectangle(
            startX, // Left edge
            y,
            0, // Initial width is 0
            height - (innerMargin * 2),
            UI.expBar.barColor
        ).setOrigin(0, 0.5).setDepth(UI.depth.ui);

        // Increase spacing in kajisuli mode
        const textSpacing = UI.kajisuli.enabled() ? UI.rel.width(5) : UI.rel.width(2.5);

        // Create level text to the left of the bar
        scene.levelText = scene.add.text(
            centerX - (width / 2) - textSpacing,
            y,
            "1",
            {
                fontFamily: UI.fonts.level.family,
                fontSize: UI.kajisuli.enabled() ?
                    parseInt(UI.fonts.level.size()) * 1.2 + 'px' :
                    UI.fonts.level.size(),
                color: UI.fonts.level.color
            }
        ).setOrigin(0.5).setDepth(UI.depth.ui);

        // Create XP needed text to the right of the bar
        scene.xpNeededText = scene.add.text(
            centerX + (width / 2) + textSpacing,
            y,
            "5",
            {
                fontFamily: UI.fonts.xpNeeded.family,
                fontSize: UI.kajisuli.enabled() ?
                    parseInt(UI.fonts.xpNeeded.size()) * 1.2 + 'px' :
                    UI.fonts.xpNeeded.size(),
                color: UI.fonts.xpNeeded.color
            }
        ).setOrigin(0.5).setDepth(UI.depth.ui);

        // Initial update
        this.update(scene);
    },

    update: function (scene) {
        // If elements don't exist yet, exit
        if (!scene.expBar || !scene.levelText || !scene.xpNeededText) return;

        // Get scale factors
        const kajisuliScaleWidth = scene.expBarScales?.width ?? (UI.kajisuli.enabled() ? 1.5 : 1);
        const kajisuliScaleHeight = scene.expBarScales?.height ?? 1;

        // Get width with scaling
        const width = UI.expBar.width() * kajisuliScaleWidth;
        const innerMargin = UI.expBar.innerMargin;
        const contentWidth = width - (innerMargin * 2);

        // Calculate experience percentage
        const expPercentage = Math.max(0, Math.min(1, heroExp / xpForNextLevel(playerLevel)));

        // Set the width of the exp bar based on percentage
        scene.expBar.width = expPercentage * contentWidth;

        // Update the level text
        scene.levelText.setText(`${playerLevel}`);

        // Calculate and update the XP REMAINING text with formatting for large numbers
        const xpRemaining = xpForNextLevel(playerLevel) - heroExp;
        scene.xpNeededText.setText(formatLargeNumber(xpRemaining));
    }
};

// Status display for timer and kills
const StatusDisplay = {
    create: function (scene) {
        // Initialize relative dimensions
        UI.game.init(scene);

        // Clean up existing elements if they exist
        if (scene.timerBox) scene.timerBox.destroy();
        if (scene.timerBoxInner) scene.timerBoxInner.destroy();
        if (scene.timerText) scene.timerText.destroy();
        if (scene.timerSymbol) scene.timerSymbol.destroy();

        if (scene.killsBox) scene.killsBox.destroy();
        if (scene.killsBoxInner) scene.killsBoxInner.destroy();
        if (scene.killsText) scene.killsText.destroy();
        if (scene.killsSymbol) scene.killsSymbol.destroy();

        // Size and position adjustments for kajisuli mode
        const kajisuliScale = UI.kajisuli.enabled() ? 1.4 : 1; // 40% wider in kajisuli mode
        const fontSizeScale = UI.kajisuli.enabled() ? 0.9 : 1; // Slightly smaller font in kajisuli mode

        // Edge margin - further from edges in kajisuli mode
        const edgeMargin = UI.kajisuli.enabled() ?
            UI.rel.x(6) : // 6% from edges in kajisuli mode
            UI.statusDisplay.x(); // Default in normal mode

        // Create timer display with gold border
        const timerX = UI.kajisuli.enabled() ?
            edgeMargin + (UI.statusDisplay.timerWidth() * kajisuliScale / 2) : // Left side in kajisuli mode
            UI.statusDisplay.x() + (UI.statusDisplay.timerWidth() * kajisuliScale / 2); // Standard position

        scene.timerBox = scene.add.rectangle(
            timerX,
            UI.statusDisplay.timerY(),
            UI.statusDisplay.timerWidth() * kajisuliScale + (UI.statusDisplay.borderWidth * 2),
            UI.statusDisplay.height() + (UI.statusDisplay.borderWidth * 2),
            UI.colors.gold
        ).setDepth(UI.depth.ui).setOrigin(0.5);

        // Create inner black background for timer
        scene.timerBoxInner = scene.add.rectangle(
            timerX,
            UI.statusDisplay.timerY(),
            UI.statusDisplay.timerWidth() * kajisuliScale,
            UI.statusDisplay.height(),
            UI.colors.black
        ).setDepth(UI.depth.ui).setOrigin(0.5);

        // Create the timer text - centered in kajisuli mode
        if (UI.kajisuli.enabled()) {
            // Center time text in kajisuli mode without kanji
            scene.timerText = scene.add.text(
                timerX,
                UI.statusDisplay.timerY(),
                "00:00", // Shorter time format
                {
                    fontFamily: UI.fonts.timer.family,
                    fontSize: parseInt(UI.fonts.timer.size()) * fontSizeScale + 'px',
                    color: UI.fonts.timer.color
                }
            ).setDepth(UI.depth.ui).setOrigin(0.5);
        } else {
            // Create the timer kanji symbol in normal mode
            scene.timerSymbol = scene.add.text(
                UI.statusDisplay.x() + UI.statusDisplay.textPadding(),
                UI.statusDisplay.timerY(),
                UI.statusDisplay.clockSymbol,
                {
                    fontFamily: UI.fonts.timer.family,
                    fontSize: UI.fonts.timer.size(),
                    color: UI.fonts.timer.color
                }
            ).setDepth(UI.depth.ui).setOrigin(0, 0.5);

            // Create the timer text
            scene.timerText = scene.add.text(
                UI.statusDisplay.x() + UI.statusDisplay.timerWidth() - UI.statusDisplay.textPadding(),
                UI.statusDisplay.timerY(),
                "00:00", // Shorter time format
                {
                    fontFamily: UI.fonts.timer.family,
                    fontSize: UI.fonts.timer.size(),
                    color: UI.fonts.timer.color
                }
            ).setDepth(UI.depth.ui).setOrigin(1, 0.5);
        }

        // Adjust kills display positioning for kajisuli mode
        let killsX = UI.kajisuli.enabled() ?
            // Right side in kajisuli mode - further from edge
            UI.game.getWidth() - edgeMargin - (UI.statusDisplay.killsWidth() * kajisuliScale / 2) :
            // Normal position
            UI.statusDisplay.killsX() + (UI.statusDisplay.killsWidth() * kajisuliScale / 2);

        // Create kills display with gold border
        scene.killsBox = scene.add.rectangle(
            killsX,
            UI.statusDisplay.killsY(),
            UI.statusDisplay.killsWidth() * kajisuliScale + (UI.statusDisplay.borderWidth * 2),
            UI.statusDisplay.height() + (UI.statusDisplay.borderWidth * 2),
            UI.colors.gold
        ).setDepth(UI.depth.ui).setOrigin(0.5);

        // Create inner black background for kills
        scene.killsBoxInner = scene.add.rectangle(
            killsX,
            UI.statusDisplay.killsY(),
            UI.statusDisplay.killsWidth() * kajisuliScale,
            UI.statusDisplay.height(),
            UI.colors.black
        ).setDepth(UI.depth.ui).setOrigin(0.5);

        if (UI.kajisuli.enabled()) {
            // Create centered kills text in kajisuli mode
            scene.killsText = scene.add.text(
                killsX,
                UI.statusDisplay.killsY(),
                "0",
                {
                    fontFamily: UI.fonts.kills.family,
                    fontSize: parseInt(UI.fonts.kills.size()) * fontSizeScale + 'px',
                    color: UI.fonts.kills.color
                }
            ).setDepth(UI.depth.ui).setOrigin(0.5);
        } else {
            // Create the kills kanji symbol
            scene.killsSymbol = scene.add.text(
                UI.statusDisplay.killsX() + UI.statusDisplay.textPadding(),
                UI.statusDisplay.killsY(),
                UI.statusDisplay.deathSymbol,
                {
                    fontFamily: UI.fonts.kills.family,
                    fontSize: UI.fonts.kills.size(),
                    color: UI.fonts.kills.color
                }
            ).setDepth(UI.depth.ui).setOrigin(0, 0.5);

            // Create the kills text
            scene.killsText = scene.add.text(
                UI.statusDisplay.killsX() + UI.statusDisplay.killsWidth() - UI.statusDisplay.textPadding(),
                UI.statusDisplay.killsY(),
                "0",
                {
                    fontFamily: UI.fonts.kills.family,
                    fontSize: UI.fonts.kills.size(),
                    color: UI.fonts.kills.color
                }
            ).setDepth(UI.depth.ui).setOrigin(1, 0.5);
        }

        // Initial update
        this.update(scene);
    },

    update: function (scene, time, kills) {
        // Update timer text if it exists
        if (scene.timerText) {
            scene.timerText.setText(formatTime(time ?? elapsedTime));
        }

        // Update kills text if it exists
        if (scene.killsText) {
            scene.killsText.setText(formatLargeNumber(kills ?? score));
        }
    }
};

// Stat display rectangles for POW, AGI, LUK, END
const StatDisplay = {
    create: function (scene) {
        // Initialize relative dimensions
        UI.game.init(scene);

        // Clean up existing elements
        if (scene.statRects) {
            scene.statRects.forEach(stat => {
                if (stat.rectBg) stat.rectBg.destroy();
                if (stat.rectInner) stat.rectInner.destroy();
                if (stat.symbolText) stat.symbolText.destroy();
                if (stat.valueText) stat.valueText.destroy();
            });
        }

        // If in kajisuli mode, don't show stats on main screen
        if (UI.kajisuli.enabled()) {
            scene.statRects = [];
            return;
        }

        // Initialize the stat rectangles array
        scene.statRects = [];

        // Define stat order
        const stats = ['POW', 'AGI', 'LUK', 'END'];

        // Create each stat rectangle
        stats.forEach((stat, index) => {
            const x = UI.statDisplay.x() + (index * UI.statDisplay.spacing());

            // Create gold border rectangle
            const rectBg = scene.add.rectangle(
                x + UI.statDisplay.width() / 2,
                UI.statDisplay.y(),
                UI.statDisplay.width() + (UI.statDisplay.borderWidth * 2),
                UI.statDisplay.height() + (UI.statDisplay.borderWidth * 2),
                UI.colors.gold
            ).setDepth(UI.depth.ui).setOrigin(0.5);

            // Create inner black rectangle
            const rectInner = scene.add.rectangle(
                x + UI.statDisplay.width() / 2,
                UI.statDisplay.y(),
                UI.statDisplay.width(),
                UI.statDisplay.height(),
                UI.colors.black
            ).setDepth(UI.depth.ui).setOrigin(0.5);

            // Create the symbol text
            const symbolText = scene.add.text(
                x + UI.statDisplay.textPadding(),
                UI.statDisplay.y(),
                UI.statDisplay.symbols[stat],
                {
                    fontFamily: 'Arial',
                    fontSize: UI.statDisplay.fontSize(),
                    color: UI.statDisplay.symbolColors[stat]
                }
            ).setDepth(UI.depth.ui).setOrigin(0, 0.5);

            // Create the value text
            const valueText = scene.add.text(
                x + UI.statDisplay.width() - UI.statDisplay.textPadding(),
                UI.statDisplay.y(),
                "0",
                {
                    fontFamily: 'Arial',
                    fontSize: UI.fonts.stats.size(),
                    color: UI.fonts.stats.color
                }
            ).setDepth(UI.depth.ui).setOrigin(1, 0.5);

            // Store references
            scene.statRects[index] = {
                stat: stat,
                rectBg: rectBg,
                rectInner: rectInner,
                symbolText: symbolText,
                valueText: valueText
            };

            // Add hover interaction for tooltips if StatTooltipSystem is available
            if (window.StatTooltipSystem) {
                // Make the background rectangle interactive for hover
                StatTooltipSystem.addStatHoverInteraction(scene, rectBg, stat, {
                    onHover: (element) => {
                        // Highlight border on hover
                        element.setStrokeStyle(UI.statDisplay.borderWidth * 2, UI.colors.gold);
                    },
                    onHoverOut: (element) => {
                        // Reset border
                        element.setStrokeStyle(UI.statDisplay.borderWidth, UI.colors.gold);
                    }
                });
            }
        });

        // Initial update
        this.update(scene);
    },

    update: function (scene) {
        // Exit if elements don't exist
        if (!scene.statRects) return;

        // Update each stat value
        scene.statRects.forEach(item => {
            if (!item || !item.valueText) return;

            let value = 0;

            // Get the current value for each stat
            switch (item.stat) {
                case 'POW':
                    value = getEffectiveDamage() ?? 0;
                    break;
                case 'AGI':
                    value = getEffectiveFireRate() ?? 0;
                    break;
                case 'LUK':
                    value = playerLuck ?? 0;
                    break;
                case 'END':
                    value = maxPlayerHealth ?? 0;
                    break;
            }

            // Update the display
            item.valueText.setText(Math.floor(value).toString());
        });
    }
};

// Function to create all UI elements
function createUI(scene) {
    // Initialize relative dimensions with the scene
    UI.game.init(scene);

    HealthBar.create(scene);
    ExpBar.create(scene);
    StatusDisplay.create(scene);
    StatDisplay.create(scene);
    ButtonDisplay.create(scene);
}

// Method to update UI on window resize (to be called when game canvas is resized)
function resizeUI(scene) {
    // Re-create all UI elements with new dimensions
    createUI(scene);
}

// Export for use in the main game
window.GameUI = {
    createUI: createUI,
    updateHealthBar: HealthBar.update,
    updateExpBar: ExpBar.update,
    updateStatusDisplay: StatusDisplay.update,
    updateStatCircles: StatDisplay.update,
    updateButtons: ButtonDisplay.update,
    resize: resizeUI
};

// Game End Menu System for Word Survivors
// Manages both victory and defeat end screens

UI.gameEndScreen = {
    // Width with minimum size to prevent squashing on small screens
    width: function () {
        const calculatedWidth = UI.rel.width(50); // Original 50% of screen width
        return Math.max(calculatedWidth, 600); // Minimum 480px width
    },
    height: function () { return UI.rel.height(64); },   // 60% of screen height
    y: function () { return UI.rel.y(50); },             // Center of screen vertically
    x: function () { return UI.rel.x(50); },             // Center of screen horizontally
    borderWidth: 4,
    innerPadding: function () { return UI.rel.width(2); }, // 2% padding inside
    // Scale factor for text based on screen width relative to baseline 1200px
    scaleFactor: function () {
        // Calculate based on actual width and baseline of 1200px
        const minScale = 0.8; // Minimum scale factor (used at 480px width)
        const baselineWidth = 1200;
        const currentWidth = UI.game.getWidth();

        // Scale relative to the baseline, but not below minimum
        return Math.max(minScale, currentWidth / baselineWidth);
    },
    fontSizes: {
        title: function () {
            // Scale the font size by the scale factor
            return `${UI.rel.fontSize(4) * UI.gameEndScreen.scaleFactor()}px`;
        },
        kanjiLarge: function () {
            // 50% larger than title for hero and boss kanji
            return `${UI.rel.fontSize(6) * UI.gameEndScreen.scaleFactor()}px`;
        },
        subtitle: function () {
            return `${UI.rel.fontSize(3) * UI.gameEndScreen.scaleFactor()}px`;
        },
        stats: function () {
            return `${UI.rel.fontSize(2.5) * UI.gameEndScreen.scaleFactor()}px`;
        },
        button: function () {
            return `${UI.rel.fontSize(3) * UI.gameEndScreen.scaleFactor()}px`;
        }
    }
};

// Game End Menu component - modified for vertical centered layout
const GameEndMenu = {
    // UI elements
    elements: {
        container: null,         // Container for all elements
        background: null,        // Background rectangle
        borderRect: null,        // Golden border
        heroKanji: null,         // Hero kanji (white)
        titleText: null,         // Main title text (gold)
        subtitleText: null,      // Subtitle text (gold)
        enemyKanji: null,        // Enemy kanji (enemy color)
        statsText: null,         // Time and kills (gold)
        restartButton: null,     // Restart button
        restartButtonBorder: null // Button border
    },

    enterKeyHandler: null,

    // Create the game end screen (victory or defeat)
    create: function (scene, isVictory = false, enemyKanji = null, bossKanji = null) {
        // Clean up any existing menu first
        this.destroy();

        // Create a container with high depth for all elements
        this.elements.container = scene.add.container(0, 0);
        this.elements.container.setDepth(1000); // Same depth as pause screen

        // Create black semi-transparent background for full screen
        const fullscreenBg = scene.add.rectangle(
            UI.game.getWidth() / 2,
            UI.game.getHeight() / 2,
            UI.game.getWidth(),
            UI.game.getHeight(),
            0x000000, 0.7
        );
        this.elements.container.add(fullscreenBg);

        // Create panel black background (solid black)
        this.elements.background = scene.add.rectangle(
            UI.gameEndScreen.x(),
            UI.gameEndScreen.y(),
            UI.gameEndScreen.width(),
            UI.gameEndScreen.height(),
            0x000000
        );
        this.elements.container.add(this.elements.background);

        // Create golden border - as a stroke around the black background
        this.elements.borderRect = scene.add.rectangle(
            UI.gameEndScreen.x(),
            UI.gameEndScreen.y(),
            UI.gameEndScreen.width(),
            UI.gameEndScreen.height()
        );
        this.elements.borderRect.setStrokeStyle(UI.gameEndScreen.borderWidth, 0xFFD700); // Explicit gold color
        this.elements.container.add(this.elements.borderRect);

        // Determine content based on victory or defeat
        if (isVictory) {
            this.createVictoryContent(scene, bossKanji);
        } else {
            this.createDefeatContent(scene, enemyKanji);
        }

        // Create restart button (same for both victory and defeat)
        this.createRestartButton(scene);

        // Add keyboard handler for Enter key to restart
        this.setupKeyboardHandler(scene);

        return this.elements.container;
    },

    createEndGameContent: function (scene, options) {
        // Default options
        const defaults = {
            isVictory: false,           // Victory or defeat
            titleText: "",              // Main title text
            subtitleText: "",           // Subtitle text
            enemyKanji: "敵",           // Kanji to show for enemy
            statsTemplate: ""           // Template for stats text
        };

        // Merge with provided options
        const config = { ...defaults, ...options };
        const centerX = UI.gameEndScreen.x();
        const centerY = UI.gameEndScreen.y();

        // Calculate vertical spacing for 4 lines plus stats
        const lineSpacing = UI.gameEndScreen.height() / 8; // Dividing into 8 sections for better spacing

        // Positions for each line (centered vertically around the panel center)
        const heroKanjiY = centerY - lineSpacing * 3;
        const titleY = centerY - lineSpacing * 2;
        const subtitleY = centerY - lineSpacing;
        const enemyKanjiY = centerY;

        // Create hero kanji in WHITE (centered, larger)
        this.elements.heroKanji = scene.add.text(
            centerX,
            heroKanjiY,
            HERO_CHARACTER,
            {
                fontFamily: 'Arial',
                fontSize: UI.gameEndScreen.fontSizes.kanjiLarge(),
                color: '#FFFFFF', // White for hero
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        this.elements.container.add(this.elements.heroKanji);

        // Create title text in GOLD (centered)
        this.elements.titleText = scene.add.text(
            centerX,
            titleY,
            config.titleText,
            {
                fontFamily: 'Arial',
                fontSize: UI.gameEndScreen.fontSizes.title(),
                color: '#FFD700', // Gold color
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        this.elements.container.add(this.elements.titleText);

        // Create subtitle text in GOLD (centered)
        this.elements.subtitleText = scene.add.text(
            centerX,
            subtitleY,
            config.subtitleText,
            {
                fontFamily: 'Arial',
                fontSize: UI.gameEndScreen.fontSizes.subtitle(),
                color: '#FFD700', // Gold color
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        this.elements.container.add(this.elements.subtitleText);

        // Create enemy kanji (centered, larger)
        this.elements.enemyKanji = scene.add.text(
            centerX,
            enemyKanjiY,
            config.enemyKanji,
            {
                fontFamily: 'Arial',
                fontSize: UI.gameEndScreen.fontSizes.kanjiLarge(),
                color: '#FF5555', // Red color for enemy
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        this.elements.container.add(this.elements.enemyKanji);

        // Create stats line (below the main content)
        this.elements.statsText = scene.add.text(
            centerX,
            centerY + lineSpacing * 1.5,
            config.statsTemplate,
            {
                fontFamily: 'Arial',
                fontSize: UI.gameEndScreen.fontSizes.stats(),
                color: '#FFD700', // Gold color
                align: 'center'
            }
        ).setOrigin(0.5);
        this.elements.container.add(this.elements.statsText);

        // If score system is available, animate the stats into score
        if (window.ScoreSystem) {
            // Calculate score based on victory condition
            const score = ScoreSystem.calculateScore(config.isVictory);

            // Animate the score reveal
            ScoreSystem.animateScoreReveal(scene, this.elements.statsText, score);
        }
    },

    // Create content for victory screen
    createVictoryContent: function (scene, bossKanji) {
        // The boss kanji to display (use a generic one if not specified)
        const bossSymbol = bossKanji ?? (activeBoss?.text ?? '魔');

        // Create victory screen content
        this.createEndGameContent(scene, {
            isVictory: true,
            titleText: 'ESCAPED THE LOOP',
            subtitleText: 'VANQUISHING',
            enemyKanji: bossSymbol,
            statsTemplate: `IN ${formatTime(elapsedTime)}          FREED ${score}`
        });
    },

    // Create content for defeat screen
    createDefeatContent: function (scene, enemyKanji) {
        // The enemy kanji to display (use a generic one if not specified)
        const enemySymbol = enemyKanji ?? '敵';

        // Create defeat screen content
        this.createEndGameContent(scene, {
            isVictory: false,
            titleText: 'FOUND THEIR DEMISE',
            subtitleText: 'AT THE HANDS OF',
            enemyKanji: enemySymbol,
            statsTemplate: `SURVIVED ${formatTime(elapsedTime)}          DEFEATED ${score}`
        });
    },

    // Create restart button for both screens
    createRestartButton: function (scene) {
        const buttonY = UI.gameEndScreen.y() + UI.gameEndScreen.height() / 2.5;
        const buttonX = UI.gameEndScreen.x();
        const buttonPadding = 20;

        // Create button text in GOLD
        this.elements.restartButton = scene.add.text(
            buttonX,
            buttonY,
            'RESTART THE LOOP',
            {
                fontFamily: 'Arial',
                fontSize: UI.gameEndScreen.fontSizes.button(),
                color: '#FFD700', // Explicit gold color
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // Create button border as a rectangle with GOLD stroke
        const buttonWidth = this.elements.restartButton.width + buttonPadding * 2;
        const buttonHeight = this.elements.restartButton.height + buttonPadding * 2;

        this.elements.restartButtonBorder = scene.add.rectangle(
            buttonX,
            buttonY,
            buttonWidth,
            buttonHeight
        );
        this.elements.restartButtonBorder.setStrokeStyle(2, 0xFFD700); // Explicit gold color
        this.elements.container.add(this.elements.restartButtonBorder);
        this.elements.container.add(this.elements.restartButton);

        // Make button interactive - use the text element for interaction
        this.elements.restartButton.setInteractive({ useHandCursor: true });

        // Add hover effect - white text and thicker border
        this.elements.restartButton.on('pointerover', () => {
            // Change text to white
            this.elements.restartButton.setColor('#FFFFFF');
            // Make border thicker
            this.elements.restartButtonBorder.setStrokeStyle(3, 0xFFD700);
            // Scale up slightly
            scene.tweens.add({
                targets: [this.elements.restartButton, this.elements.restartButtonBorder],
                scale: 1.05,
                duration: 100
            });
        });

        // Reset on pointer out
        this.elements.restartButton.on('pointerout', () => {
            // Change text back to gold
            this.elements.restartButton.setColor('#FFD700');
            // Reset border thickness
            this.elements.restartButtonBorder.setStrokeStyle(2, 0xFFD700);
            // Scale back to normal
            scene.tweens.add({
                targets: [this.elements.restartButton, this.elements.restartButtonBorder],
                scale: 1,
                duration: 100
            });
        });

        this.elements.restartButton.on('pointerdown', function () {
            // Try to skip any active animation, with delay if successful
            const animationSkipped = window.ScoreSystem?.skipToFinalScore?.(scene) || false;

            // Restart immediately or with delay based on whether animation was skipped
            if (animationSkipped) {
                scene.time.delayedCall(250, () => startGame.call(scene));
            } else {
                startGame.call(scene);
            }
        });
    },

    // Setup keyboard handler for Enter key
    setupKeyboardHandler: function (scene) {
        // Clean up any existing handler first
        this.cleanupKeyboardHandler();

        // Create new enter key handler
        this.enterKeyHandler = function (event) {
            if (event.key === 'Enter') {
                // Remove this listener before restarting
                GameEndMenu.cleanupKeyboardHandler();

                // Start the game
                startGame.call(scene);
            }
        };

        // Add global keydown listener for Enter
        window.addEventListener('keydown', this.enterKeyHandler);
    },

    // Show the victory screen
    showVictoryScreen: function (scene) {
        // Get the boss kanji if available
        const bossKanji = activeBoss ? activeBoss.text : null;

        // Create the victory screen
        return this.create(scene, true, null, bossKanji);
    },

    // Show the defeat screen
    showDefeatScreen: function (scene, enemyKanji) {
        // Create the defeat screen
        return this.create(scene, false, enemyKanji);
    },

    // Add a cleanup function
    cleanupKeyboardHandler: function () {
        if (this.enterKeyHandler) {
            window.removeEventListener('keydown', this.enterKeyHandler);
            this.enterKeyHandler = null;
        }
    },

    // Modify destroy to use the cleanup function
    destroy: function () {
        this.cleanupKeyboardHandler();

        if (this.elements.container) {
            this.elements.container.destroy();
        }

        // Reset all element references
        Object.keys(this.elements).forEach(key => {
            this.elements[key] = null;
        });
    }
};

// Export the menu system for use in other files
window.GameEndMenu = GameEndMenu;