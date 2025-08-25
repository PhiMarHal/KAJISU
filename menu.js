// menu.js - UI Elements for KAJISU

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

    // Timer and Score
    statusDisplay: {
        timerY: function () { return UI.rel.y(3.75); },        // 3.75% from top
        scoreY: function () { return UI.rel.y(3.75); },        // Same Y as timer (renamed from killsY)
        x: function () { return UI.rel.x(1.33); },             // 1.33% from left
        timerWidth: function () { return UI.rel.width(10); },  // 10% of screen width
        scoreWidth: function () { return UI.rel.width(10); },  // Same width as timer (renamed from killsWidth)
        scoreX: function () { return UI.rel.x(13.33); },       // Position to right of timer (renamed from killsX)
        height: function () { return UI.rel.height(2.5); },    // 2.5% of screen height
        borderWidth: 2,
        textPadding: function () { return UI.rel.width(0.33); }, // 0.33% of screen width
        clockSymbol: "時",  // Kanji for time/clock
        scoreSymbol: "点",  // Kanji for score/points (changed from deathSymbol)
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

    // Pause/Music/Levelup/Help buttons
    buttons: {
        // Common button styling configuration
        common: {
            size: function () { return UI.rel.height(5); }, //
            borderWidth: 2,
            // Calculate margin based on longest dimension for even spacing
            margin: function () {
                const longestDimension = Math.max(UI.game.getWidth(), UI.game.getHeight());
                return longestDimension * 0.02; // 2% of longest dimension
            },
            fontSize: function () {
                return UI.buttons.common.size() * 0.6; // 60% of button size
            }
        },

        // Pause button configuration
        pause: {
            symbol: "休", // Kanji for "rest/break" - perfect for pause
            x: function () {
                // Bottom left positioning using longest dimension for margin
                return UI.buttons.common.margin() + (UI.buttons.common.size() / 2);
            },
            y: function () {
                // Bottom positioning using longest dimension for margin
                return UI.game.getHeight() - UI.buttons.common.margin() - (UI.buttons.common.size() / 2);
            },
            fontSize: function () {
                return UI.buttons.common.fontSize();
            }
        },

        // Music button configuration  
        music: {
            symbol: "音", // Kanji for "sound/music"
            mutedSymbol: "静", // Kanji for "quiet/silence"
            x: function () {
                // Bottom right positioning using longest dimension for margin
                return UI.game.getWidth() - UI.buttons.common.margin() - (UI.buttons.common.size() / 2);
            },
            y: function () {
                // Bottom positioning using longest dimension for margin
                return UI.game.getHeight() - UI.buttons.common.margin() - (UI.buttons.common.size() / 2);
            },
            fontSize: function () {
                return UI.buttons.common.fontSize();
            }
        },

        // Help button configuration
        help: {
            symbol: "?", // Question mark for help
            x: function () {
                // Dynamic positioning - will be set by UnifiedButtonManager based on mode
                // Default to pause button position
                return UI.buttons.common.margin() + (UI.buttons.common.size() / 2);
            },
            y: function () {
                // Bottom positioning using longest dimension for margin
                return UI.game.getHeight() - UI.buttons.common.margin() - (UI.buttons.common.size() / 2);
            },
            fontSize: function () {
                return UI.buttons.common.fontSize();
            }
        },

        // Levelup button configuration (Boss Rush mode)
        levelup: {
            symbol: "UP", // Letters for level up
            x: function () {
                // Same position as music button (bottom right)
                return UI.game.getWidth() - UI.buttons.common.margin() - (UI.buttons.common.size() / 2);
            },
            y: function () {
                // Same position as music button (bottom positioning)
                return UI.game.getHeight() - UI.buttons.common.margin() - (UI.buttons.common.size() / 2);
            },
            fontSize: function () {
                return UI.buttons.common.fontSize() * 0.7; // Slightly smaller for "UP" text
            }
        },

        // Resume button configuration (for pause screen)
        resume: {
            symbol: "続", // Kanji for "continue"
            x: function () {
                return UI.game.getWidth() / 2; // Center horizontally
            },
            y: function () {
                return UI.game.getHeight() * 0.875; // Same position as old resume button
            },
            fontSize: function () {
                return UI.buttons.common.fontSize() * 1.2; // Slightly larger for resume
            },
            size: function () {
                return UI.buttons.common.size() * 1.5; // Larger hexagon for resume
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

// Updated ButtonDisplay section from menu.js - Integration with UnifiedButtonManager
const ButtonDisplay = {
    create: function (scene) {
        // Initialize relative dimensions
        UI.game.init(scene);

        // Use the unified button manager for all button creation and management
        if (window.UnifiedButtonManager) {
            window.UnifiedButtonManager.createAllButtons(scene);
        } else {
            // Fallback to old system if UnifiedButtonManager is not available
            console.warn('UnifiedButtonManager not available, falling back to legacy button creation');
            this.createLegacyButtons(scene);
        }
    },

    // Legacy button creation (fallback)
    createLegacyButtons: function (scene) {
        // Clean up existing buttons and hit areas
        if (scene.pauseHexagon) scene.pauseHexagon.destroy();
        if (scene.pauseButtonText) scene.pauseButtonText.destroy();
        if (scene.pauseHitArea) scene.pauseHitArea.destroy();
        if (scene.musicHexagon) scene.musicHexagon.destroy();
        if (scene.musicButtonText) scene.musicButtonText.destroy();
        if (scene.musicHitArea) scene.musicHitArea.destroy();
        if (scene.levelupHexagon) scene.levelupHexagon.destroy();
        if (scene.levelupButtonText) scene.levelupButtonText.destroy();
        if (scene.levelupHitArea) scene.levelupHitArea.destroy();

        // Get button configurations
        const pauseConfig = UI.buttons.pause;
        const musicConfig = UI.buttons.music;
        const levelupConfig = UI.buttons.levelup;
        const commonConfig = UI.buttons.common;

        const hexSize = commonConfig.size() * 1.32; // Even bigger hexagons (110% of previous)

        // Create pause button hexagon
        scene.pauseHexagon = createHexagon(
            scene,
            pauseConfig.x(),
            pauseConfig.y(),
            hexSize,
            0x000000,
            0.5  // 50% opacity so game elements show through
        );
        scene.pauseHexagon.setDepth(2001);

        // Create pause button text
        scene.pauseButtonText = scene.add.text(
            pauseConfig.x(),
            pauseConfig.y(), // Adjusted for better centering
            pauseConfig.symbol,
            {
                fontFamily: 'Arial',
                fontSize: `${pauseConfig.fontSize()}px`,
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5).setDepth(2001);

        // Create pause button hit area - use the button text as the interactive element
        scene.pauseButtonText.setInteractive({ useHandCursor: true });

        scene.pauseButtonText.on('pointerover', function () {
            this.setColor('#ffff00'); // Yellow on hover
            this.setScale(1.1);
        });

        scene.pauseButtonText.on('pointerout', function () {
            this.setColor('#ffffff'); // White normally
            this.setScale(1);
        });

        scene.pauseButtonText.on('pointerdown', function () {
            if (!gameOver) {
                if (gamePaused) {
                    PauseSystem.resumeGame();
                } else {
                    PauseSystem.pauseGameWithOverlay();
                }
            }
        });

        // Create music button hexagon
        scene.musicHexagon = createHexagon(
            scene,
            musicConfig.x(),
            musicConfig.y(),
            hexSize,
            0x000000,
            0.5  // 50% opacity so game elements show through
        );
        scene.musicHexagon.setDepth(2001);

        // Create music button text
        const initialSymbol = (window.MusicSystem && window.MusicSystem.musicEnabled) ?
            musicConfig.symbol : musicConfig.mutedSymbol;

        scene.musicButtonText = scene.add.text(
            musicConfig.x(),
            musicConfig.y(), // Adjusted for better centering
            initialSymbol,
            {
                fontFamily: 'Arial',
                fontSize: `${musicConfig.fontSize()}px`,
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5).setDepth(2001);

        // Create music button hit area - use the button text as the interactive element
        scene.musicButtonText.setInteractive({ useHandCursor: true });

        scene.musicButtonText.on('pointerover', function () {
            this.setColor('#ffff00'); // Yellow on hover
            this.setScale(1.1);
        });

        scene.musicButtonText.on('pointerout', function () {
            this.setColor('#ffffff'); // White normally
            this.setScale(1);
        });

        scene.musicButtonText.on('pointerdown', function () {
            if (window.MusicSystem) {
                // Toggle music state
                const newState = !window.MusicSystem.musicEnabled;
                window.MusicSystem.setMusicEnabled(newState);

                // Update button symbol to show new state immediately
                const symbol = newState ? musicConfig.symbol : musicConfig.mutedSymbol;
                this.setText(symbol);

                console.log(`Music ${newState ? 'enabled' : 'disabled'}`);
            }
        });

        // Handle Farcade mode - hide music button after it's created
        if (window.FARCADE_MODE) {
            scene.musicHexagon.setVisible(false);
            scene.musicButtonText.setVisible(false);
            console.log("Music button hidden for Farcade deployment");
        }

        // Only create levelup button if Boss Rush mode is enabled
        if (window.BOSS_RUSH_MODE) {
            // Create levelup button hexagon
            scene.levelupHexagon = createHexagon(
                scene,
                levelupConfig.x(),
                levelupConfig.y(),
                hexSize,
                0x000000,
                0.5  // 50% opacity so game elements show through
            );
            scene.levelupHexagon.setDepth(2001);

            // Create levelup button text
            scene.levelupButtonText = scene.add.text(
                levelupConfig.x(),
                levelupConfig.y(), // Adjusted for better centering
                levelupConfig.symbol,
                {
                    fontFamily: 'Arial',
                    fontSize: `${levelupConfig.fontSize()}px`,
                    color: '#ffffff',
                    fontStyle: 'bold'
                }
            ).setOrigin(0.5).setDepth(2001);

            // Create levelup button hit area - use the button text as the interactive element
            scene.levelupButtonText.setInteractive({ useHandCursor: true });

            scene.levelupButtonText.on('pointerover', function () {
                this.setColor('#ffff00'); // Yellow on hover
                this.setScale(1.1);
            });

            scene.levelupButtonText.on('pointerout', function () {
                this.setColor('#ffffff'); // White normally
                this.setScale(1);
            });

            scene.levelupButtonText.on('pointerdown', function () {
                if (!gamePaused && !gameOver && window.BOSS_RUSH_MODE) {
                    // Apply penalty if the function exists
                    if (window.applyFreeLeveUpPenalty) {
                        window.applyFreeLeveUpPenalty();
                    }

                    // Add remaining XP needed for this level
                    const xpNeeded = xpForNextLevel(playerLevel) - heroExp;
                    heroExp += xpNeeded;

                    // Update the experience bar
                    if (typeof GameUI !== 'undefined' && GameUI.updateExpBar) {
                        GameUI.updateExpBar(scene);
                    }

                    console.log('Boss Rush: Free level up used (penalty applied)');
                }
            });
        }

        // Initial update to set positions
        this.update(scene);
    },

    // Create a single button (for use by other systems like pause screen)
    createButton: function (scene, buttonType, onClickCallback, options = {}) {
        // Initialize relative dimensions if not already done
        UI.game.init(scene);

        // Get button configuration
        const buttonConfig = UI.buttons[buttonType];
        if (!buttonConfig) {
            console.error(`Unknown button type: ${buttonType}`);
            return null;
        }

        // Set up default options
        const defaults = {
            depth: 1002,
            visible: true,
            size: buttonConfig.size ? buttonConfig.size() : UI.buttons.common.size() * 1.32
        };
        const config = { ...defaults, ...options };

        // Create hexagon
        const hexagon = createHexagon(
            scene,
            buttonConfig.x(),
            buttonConfig.y(),
            config.size,
            0x000000,
            0.5
        );
        hexagon.setDepth(config.depth - 1);
        hexagon.setVisible(config.visible);

        // Create button text
        const buttonText = scene.add.text(
            buttonConfig.x(),
            buttonConfig.y(),
            buttonConfig.symbol,
            {
                fontFamily: 'Arial',
                fontSize: `${buttonConfig.fontSize()}px`,
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5).setDepth(config.depth);
        buttonText.setVisible(config.visible);

        // Make interactive
        buttonText.setInteractive({ useHandCursor: true });

        // Add hover effects
        buttonText.on('pointerover', function () {
            this.setColor('#ffff00'); // Yellow on hover
            this.setScale(1.1);
        });

        buttonText.on('pointerout', function () {
            this.setColor('#ffffff'); // White normally
            this.setScale(1);
        });

        // Add click handler
        if (onClickCallback) {
            buttonText.on('pointerdown', onClickCallback);
        }

        // Return both elements so they can be managed together
        return {
            hexagon: hexagon,
            text: buttonText,
            setVisible: function (visible) {
                hexagon.setVisible(visible);
                buttonText.setVisible(visible);
            },
            destroy: function () {
                if (hexagon) hexagon.destroy();
                if (buttonText) buttonText.destroy();
            }
        };
    },

    update: function (scene) {
        // If using UnifiedButtonManager, delegate to it
        if (window.UnifiedButtonManager && window.UnifiedButtonManager.buttons) {
            window.UnifiedButtonManager.updateButtonPositions(scene);
            return;
        }

        // Legacy update code (fallback)
        const pauseConfig = UI.buttons.pause;
        const musicConfig = UI.buttons.music;
        const levelupConfig = UI.buttons.levelup;

        // Update pause button position
        if (scene.pauseHexagon && scene.pauseButtonText) {
            scene.pauseHexagon.x = pauseConfig.x();
            scene.pauseHexagon.y = pauseConfig.y();
            scene.pauseButtonText.setPosition(pauseConfig.x(), pauseConfig.y());
        }

        // Update music button position and visibility
        if (scene.musicHexagon && scene.musicButtonText) {
            // Handle special visibility rules for Boss Rush mode
            if (window.BOSS_RUSH_MODE && !gamePaused) {
                // Hide music button during active Boss Rush gameplay
                scene.musicHexagon.setVisible(false);
                scene.musicButtonText.setVisible(false);
            } else if (window.FARCADE_MODE) {
                // Always hide music button in Farcade mode
                scene.musicHexagon.setVisible(false);
                scene.musicButtonText.setVisible(false);
            } else {
                // Show music button and update its position and state
                scene.musicHexagon.setVisible(true);
                scene.musicButtonText.setVisible(true);

                scene.musicHexagon.x = musicConfig.x();
                scene.musicHexagon.y = musicConfig.y();
                scene.musicButtonText.setPosition(musicConfig.x(), musicConfig.y());

                // Update music button symbol if MusicSystem is available
                if (window.MusicSystem) {
                    const symbol = window.MusicSystem.musicEnabled ?
                        musicConfig.symbol : musicConfig.mutedSymbol;
                    scene.musicButtonText.setText(symbol);
                }
            }
        }

        // Update levelup button position
        if (scene.levelupHexagon && scene.levelupButtonText) {
            scene.levelupHexagon.x = levelupConfig.x();
            scene.levelupHexagon.y = levelupConfig.y();
            scene.levelupButtonText.setPosition(levelupConfig.x(), levelupConfig.y());
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

// Health bar functions with transparency
const HealthBar = {
    create: function (scene) {
        // Initialize relative dimensions
        UI.game.init(scene);

        // Remove old health bar elements if they exist
        if (scene.healthBarBg) scene.healthBarBg.destroy();
        if (scene.healthSegments) {
            scene.healthSegments.clear(true, true);
            scene.healthSegments.destroy();
        }
        if (scene.healthSeparators) {
            scene.healthSeparators.clear(true, true);
            scene.healthSeparators.destroy();
        }

        // Get kajisuli scale factors
        const kajisuliScaleWidth = UI.kajisuli.enabled() ? 1.5 : 1;
        const kajisuliScaleHeight = 1;

        scene.healthBarScales = {
            width: kajisuliScaleWidth,
            height: kajisuliScaleHeight
        };

        // Get calculated dimensions
        const width = UI.healthBar.width() * kajisuliScaleWidth;
        const height = UI.healthBar.height() * kajisuliScaleHeight;
        const borderWidth = UI.healthBar.borderWidth;

        // KAJISULI-specific adjustments
        const innerMargin = UI.kajisuli.enabled() ? 4 : UI.healthBar.innerMargin;

        const centerX = UI.healthBar.centerX();
        const y = UI.healthBar.y();

        // Create ONLY the background with transparency (separate from segments)
        scene.healthBarBg = scene.add.graphics();
        scene.healthBarBg.x = centerX;
        scene.healthBarBg.y = y;

        // Draw transparent black fill FIRST
        scene.healthBarBg.fillStyle(UI.colors.black, 0.5);
        scene.healthBarBg.fillRect(
            -(width / 2),
            -(height / 2),
            width,
            height
        );

        // Draw ONLY border lines on top
        scene.healthBarBg.lineStyle(borderWidth, UI.colors.gold);
        scene.healthBarBg.strokeRect(
            -(width / 2),
            -(height / 2),
            width,
            height
        );
        scene.healthBarBg.setDepth(UI.depth.ui);

        // Create containers for segments and separators
        scene.healthSegments = scene.add.group();
        scene.healthSeparators = scene.add.group();

        // Store the inner margin for use in update
        scene.healthBarInnerMargin = innerMargin;

        // Initial health segments
        this.update(scene);
    },

    update: function (scene) {
        if (!scene.healthSegments || !scene.healthSegments.scene) return;

        // COMPLETELY clear existing segments and separators
        scene.healthSegments.clear(true, true);
        scene.healthSeparators.clear(true, true);

        const kajisuliScaleWidth = scene.healthBarScales?.width ?? (UI.kajisuli.enabled() ? 1.5 : 1);

        const width = UI.healthBar.width() * kajisuliScaleWidth;
        const height = UI.healthBar.height();
        const innerMargin = scene.healthBarInnerMargin || UI.healthBar.innerMargin;
        const centerX = UI.healthBar.centerX();
        const y = UI.healthBar.y();

        const contentWidth = width - (innerMargin * 2);
        const contentHeight = height - (innerMargin * 2);

        // KAJISULI-specific segment gap
        const segmentGapWidth = UI.kajisuli.enabled() ?
            UI.rel.width(0.5) :
            UI.healthBar.segmentGap() * kajisuliScaleWidth;

        const totalGapWidth = (maxPlayerHealth - 1) * segmentGapWidth;
        const segmentWidth = (contentWidth - totalGapWidth) / maxPlayerHealth;

        const startX = centerX - (width / 2) + innerMargin;

        // Create each segment using SEPARATE graphics (not overlapping with background)
        for (let i = 0; i < maxPlayerHealth; i++) {
            const isFilled = i < playerHealth;
            const segmentX = startX + (i * (segmentWidth + segmentGapWidth));

            // Create segment with transparency using SEPARATE graphics object
            const segment = scene.add.graphics();
            segment.x = segmentX;
            segment.y = y;

            const segmentColor = isFilled ? UI.colors.green : UI.colors.grey;
            segment.fillStyle(segmentColor, 1.0); // FULL opacity for colored segments!
            segment.fillRect(0, -contentHeight / 2, segmentWidth, contentHeight);
            segment.setDepth(UI.depth.ui + 1); // Above background

            scene.healthSegments.add(segment);

            // Add golden separator ONLY between segments (not after last one)
            if (i < maxPlayerHealth - 1) {
                const separatorX = segmentX + segmentWidth + (segmentGapWidth / 2);
                const separator = scene.add.graphics();
                separator.fillStyle(UI.colors.gold);
                separator.fillRect(0, 0, 2, contentHeight);
                separator.setPosition(separatorX - 1, y - contentHeight / 2);
                separator.setDepth(UI.depth.ui + 1);
                scene.healthSeparators.add(separator);
            }
        }
    }
};

// Experience bar, no transparency
const ExpBar = {
    create: function (scene) {
        // Initialize relative dimensions
        UI.game.init(scene);

        // Remove old experience bar elements if they exist
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

// Unified hexagon creation function supporting both regular and elongated hexagons
function createHexagon(scene, x, y, size, fillColor = 0x000000, fillAlpha = 1.0, width = null, height = null) {
    const graphics = scene.add.graphics();
    let points;

    // Position the graphics at the center
    graphics.x = x;
    graphics.y = y;

    if (width !== null && height !== null) {
        // Create elongated hexagon (hexagonal rectangle) with explicit dimensions
        // Use proper 30° hexagon angles: horizontal chamfer = vertical chamfer * √3
        const chamferY = height * 0.25; // Vertical chamfer (keep Y positions reasonable)
        const chamferX = chamferY * Math.sqrt(3); // Horizontal chamfer for 30° angle

        points = [
            { x: -width / 2 + chamferX, y: -height / 2 },        // Top-left chamfered
            { x: width / 2 - chamferX, y: -height / 2 },         // Top-right chamfered
            { x: width / 2, y: -height / 2 + chamferY },         // Top-right corner
            { x: width / 2, y: height / 2 - chamferY },          // Bottom-right corner
            { x: width / 2 - chamferX, y: height / 2 },          // Bottom-right chamfered
            { x: -width / 2 + chamferX, y: height / 2 },         // Bottom-left chamfered
            { x: -width / 2, y: height / 2 - chamferY },         // Bottom-left corner
            { x: -width / 2, y: -height / 2 + chamferY }         // Top-left corner
        ];
    } else {
        // Create regular hexagon with size parameter
        const hexWidth = size * 0.85; // Reduced width (existing behavior)
        const hexHeight = size * 0.866; // Proper hexagon aspect ratio

        points = [
            { x: 0, y: -hexHeight / 2 },                    // Top
            { x: hexWidth / 2, y: -hexHeight / 4 },         // Top-right
            { x: hexWidth / 2, y: hexHeight / 4 },          // Bottom-right
            { x: 0, y: hexHeight / 2 },                     // Bottom
            { x: -hexWidth / 2, y: hexHeight / 4 },         // Bottom-left
            { x: -hexWidth / 2, y: -hexHeight / 4 }         // Top-left
        ];
    }

    // Draw filled hexagon (same for both types)
    graphics.fillStyle(fillColor, fillAlpha);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.closePath();
    graphics.fillPath();

    // Draw the 4 L borders (same pattern for both types)
    graphics.lineStyle(3, 0xFFD700);

    if (width !== null && height !== null) {
        // Elongated hexagon border indices
        // Left side (bottom-left corner to top-left corner)
        graphics.beginPath();
        graphics.moveTo(points[6].x, points[6].y);
        graphics.lineTo(points[7].x, points[7].y);
        graphics.strokePath();

        // Bottom-left side (bottom-left chamfered to bottom-left corner)
        graphics.beginPath();
        graphics.moveTo(points[5].x, points[5].y);
        graphics.lineTo(points[6].x, points[6].y);
        graphics.strokePath();

        // Right side (top-right corner to bottom-right corner)
        graphics.beginPath();
        graphics.moveTo(points[2].x, points[2].y);
        graphics.lineTo(points[3].x, points[3].y);
        graphics.strokePath();

        // Top-right side (top-right chamfered to top-right corner)
        graphics.beginPath();
        graphics.moveTo(points[1].x, points[1].y);
        graphics.lineTo(points[2].x, points[2].y);
        graphics.strokePath();
    } else {
        // Regular hexagon border indices
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
    }

    return graphics;
}

// Updated StatusDisplay using the unified hexagon function
const StatusDisplay = {
    create: function (scene) {
        // Initialize relative dimensions
        UI.game.init(scene);

        // Clean up existing elements if they exist
        if (scene.timerHexagon) scene.timerHexagon.destroy();
        if (scene.timerText) scene.timerText.destroy();
        if (scene.timerSymbol) scene.timerSymbol.destroy();

        if (scene.scoreHexagon) scene.scoreHexagon.destroy();
        if (scene.scoreText) scene.scoreText.destroy();
        if (scene.scoreSymbol) scene.scoreSymbol.destroy();

        // Size and position adjustments for kajisuli mode
        const kajisuliScale = UI.kajisuli.enabled() ? 1.4 : 1; // 40% wider in kajisuli mode
        const fontSizeScale = UI.kajisuli.enabled() ? 0.9 : 1; // Slightly smaller font in kajisuli mode

        // Edge margin - further from edges in kajisuli mode
        const edgeMargin = UI.kajisuli.enabled() ?
            UI.rel.x(6) : // 6% from edges in kajisuli mode
            UI.statusDisplay.x(); // Default in normal mode

        // Create timer display with elongated hexagon
        const timerX = UI.kajisuli.enabled() ?
            edgeMargin + (UI.statusDisplay.timerWidth() * kajisuliScale / 2) : // Left side in kajisuli mode
            UI.statusDisplay.x() + (UI.statusDisplay.timerWidth() * kajisuliScale / 2); // Standard position

        // Timer elongated hexagon using unified function
        scene.timerHexagon = createHexagon(
            scene,
            timerX,
            UI.statusDisplay.timerY(),
            null, // size parameter not used when width/height provided
            UI.colors.black,
            0.5,  // 50% opacity so game elements show through
            UI.statusDisplay.timerWidth() * kajisuliScale, // width
            UI.buttons.common.size() * (UI.kajisuli.enabled() ? 0.8 : 1) // height - full size in normal, 80% in kajisuli
        );
        scene.timerHexagon.setDepth(UI.depth.ui);

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
                UI.statusDisplay.x() + UI.statusDisplay.textPadding() + UI.rel.width(0.75), // Add left margin
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
                UI.statusDisplay.x() + UI.statusDisplay.timerWidth() - UI.statusDisplay.textPadding() - UI.rel.width(0.75), // Add right margin
                UI.statusDisplay.timerY(),
                "00:00", // Shorter time format
                {
                    fontFamily: UI.fonts.timer.family,
                    fontSize: UI.fonts.timer.size(),
                    color: UI.fonts.timer.color
                }
            ).setDepth(UI.depth.ui).setOrigin(1, 0.5);
        }

        // Adjust score display positioning for kajisuli mode
        let scoreX = UI.kajisuli.enabled() ?
            // Right side in kajisuli mode - further from edge
            UI.game.getWidth() - edgeMargin - (UI.statusDisplay.scoreWidth() * kajisuliScale / 2) :
            // Normal position
            UI.statusDisplay.scoreX() + (UI.statusDisplay.scoreWidth() * kajisuliScale / 2);

        // Score elongated hexagon using unified function
        scene.scoreHexagon = createHexagon(
            scene,
            scoreX,
            UI.statusDisplay.scoreY(),
            null, // size parameter not used when width/height provided
            UI.colors.black,
            0.5,  // 50% opacity so game elements show through
            UI.statusDisplay.scoreWidth() * kajisuliScale, // width
            UI.buttons.common.size() * (UI.kajisuli.enabled() ? 0.8 : 1) // height - full size in normal, 80% in kajisuli
        );
        scene.scoreHexagon.setDepth(UI.depth.ui);

        if (UI.kajisuli.enabled()) {
            // Create centered score text in kajisuli mode
            scene.scoreText = scene.add.text(
                scoreX,
                UI.statusDisplay.scoreY(),
                "0",
                {
                    fontFamily: UI.fonts.kills.family, // Reuse kills font settings
                    fontSize: parseInt(UI.fonts.kills.size()) * fontSizeScale + 'px',
                    color: UI.fonts.kills.color
                }
            ).setDepth(UI.depth.ui).setOrigin(0.5);
        } else {
            // Create the score kanji symbol
            scene.scoreSymbol = scene.add.text(
                UI.statusDisplay.scoreX() + UI.statusDisplay.textPadding() + UI.rel.width(0.75), // Add left margin
                UI.statusDisplay.scoreY(),
                UI.statusDisplay.scoreSymbol,
                {
                    fontFamily: UI.fonts.kills.family, // Reuse kills font settings
                    fontSize: UI.fonts.kills.size(),
                    color: UI.fonts.kills.color
                }
            ).setDepth(UI.depth.ui).setOrigin(0, 0.5);

            // Create the score text
            scene.scoreText = scene.add.text(
                UI.statusDisplay.scoreX() + UI.statusDisplay.scoreWidth() - UI.statusDisplay.textPadding() - UI.rel.width(0.75), // Add right margin
                UI.statusDisplay.scoreY(),
                "0",
                {
                    fontFamily: UI.fonts.kills.family, // Reuse kills font settings
                    fontSize: UI.fonts.kills.size(),
                    color: UI.fonts.kills.color
                }
            ).setDepth(UI.depth.ui).setOrigin(1, 0.5);
        }

        // Initial update
        this.update(scene);
    },

    update: function (scene, time, scoreValue) {
        // Update timer text if it exists
        if (scene.timerText) {
            scene.timerText.setText(formatTime(time ?? elapsedTime));
        }

        // Update score text if it exists - get current dynamic score
        if (scene.scoreText) {
            let currentScore = 0;

            // Get dynamic score from ScoreSystem if available
            if (window.ScoreSystem && typeof window.ScoreSystem.calculateCurrentScore === 'function') {
                currentScore = window.ScoreSystem.calculateCurrentScore();
            } else {
                // Fallback to passed scoreValue or global score
                currentScore = scoreValue ?? score ?? 0;
            }

            // Format and display the score
            scene.scoreText.setText(formatLargeNumber(currentScore));

            // Color the score red if negative (Boss Rush penalties)
            if (currentScore < 0) {
                scene.scoreText.setColor('#FF4444');
            } else {
                scene.scoreText.setColor(UI.fonts.kills.color);
            }
        }
    }
};

// Updated StatDisplay with hexagons
const StatDisplay = {
    create: function (scene) {
        // Initialize relative dimensions
        UI.game.init(scene);

        // Clean up existing elements
        if (scene.statHexagons) {
            scene.statHexagons.forEach(stat => {
                if (stat.hexagon) stat.hexagon.destroy();
                if (stat.symbolText) stat.symbolText.destroy();
                if (stat.valueText) stat.valueText.destroy();
            });
        }

        // If in kajisuli mode, don't show stats on main screen
        if (UI.kajisuli.enabled()) {
            scene.statHexagons = [];
            return;
        }

        // Initialize the stat hexagons array
        scene.statHexagons = [];

        // Define stat order
        const stats = ['POW', 'AGI', 'LUK', 'END'];

        // Create each stat hexagon
        stats.forEach((stat, index) => {
            const x = UI.statDisplay.x() + (index * UI.statDisplay.spacing()) + UI.statDisplay.width() / 2;
            const y = UI.statDisplay.y();
            const size = UI.statDisplay.width() * 0.8; // Slightly smaller than the old rectangle

            // Create hexagon with 4 L borders
            const hexagon = createHexagon(scene, x, y, size, 0x000000, 0.5);
            hexagon.setDepth(UI.depth.ui);

            // Create the symbol text (background, semi-transparent)
            const symbolText = scene.add.text(
                x,
                y, // Slightly up for better centering
                UI.statDisplay.symbols[stat],
                {
                    fontFamily: 'Arial',
                    fontSize: UI.statDisplay.fontSize() * 1.25,
                    color: UI.statDisplay.symbolColors[stat]
                }
            ).setOrigin(0.5).setDepth(UI.depth.ui);
            symbolText.setAlpha(0.5); // Higher opacity for kanji

            // Create the value text (foreground, full opacity, same position)
            const valueText = scene.add.text(
                x,
                y, // Same position as symbol
                "0",
                {
                    fontFamily: 'Arial',
                    fontSize: UI.fonts.stats.size(),
                    color: UI.fonts.stats.color,
                    stroke: '#000000',        // Black stroke
                    strokeThickness: 4,
                }
            ).setOrigin(0.5).setDepth(UI.depth.ui + 1);

            // Make hexagon interactive for hover effects
            const hitArea = new Phaser.Geom.Rectangle(-size / 2, -size * 0.433, size, size * 0.866);
            hexagon.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

            hexagon.on('pointerover', function () {
                symbolText.setAlpha(1.0); // Full opacity on hover
                valueText.setScale(1.1);  // Scale number on hover
            });

            hexagon.on('pointerout', function () {
                symbolText.setAlpha(0.8); // Reset kanji transparency
                valueText.setScale(1);    // Reset number scale
            });

            // Add hover interaction for tooltips if StatTooltipSystem is available
            if (window.StatTooltipSystem) {
                // Create a getBounds method for the graphics object so StatTooltipSystem can use it
                hexagon.getBounds = function () {
                    return new Phaser.Geom.Rectangle(
                        this.x - size * 0.425, // Half of narrowed width
                        this.y - size * 0.433, // Half of height
                        size * 0.85,           // Narrowed width
                        size * 0.866           // Height
                    );
                };

                StatTooltipSystem.addStatHoverInteraction(scene, hexagon, stat, {
                    onHover: (element) => {
                        // Additional hover effects handled above
                    },
                    onHoverOut: (element) => {
                        // Additional hover out effects handled above
                    }
                });
            }

            // Store references
            scene.statHexagons[index] = {
                stat: stat,
                hexagon: hexagon,
                symbolText: symbolText,
                valueText: valueText
            };
        });

        // Initial update
        this.update(scene);
    },

    update: function (scene) {
        // Exit if elements don't exist
        if (!scene.statHexagons) return;

        // Update each stat value
        scene.statHexagons.forEach(item => {
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

// Export ButtonDisplay for use by other systems
window.ButtonDisplay = ButtonDisplay;

// Game End Menu System for KAJISU
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
        this.elements.restartButtonBorder.setInteractive({ useHandCursor: true });

        // Add hover effect to border instead of text
        this.elements.restartButtonBorder.on('pointerover', () => {
            this.elements.restartButton.setColor('#FFFFFF');
            this.elements.restartButtonBorder.setStrokeStyle(3, 0xFFD700);
            scene.tweens.add({
                targets: [this.elements.restartButton, this.elements.restartButtonBorder],
                scale: 1.05,
                duration: 100
            });
        });

        this.elements.restartButtonBorder.on('pointerout', () => {
            this.elements.restartButton.setColor('#FFD700');
            this.elements.restartButtonBorder.setStrokeStyle(2, 0xFFD700);
            scene.tweens.add({
                targets: [this.elements.restartButton, this.elements.restartButtonBorder],
                scale: 1,
                duration: 100
            });
        });

        this.elements.restartButtonBorder.on('pointerdown', function () {
            const animationSkipped = window.ScoreSystem?.skipToFinalScore?.(scene) || false;
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

// Function to create start screen buttons (called from create() in index.html)
const StartButtonsDisplay = {
    create: function (scene) {
        // Initialize the UI system with the scene so we get proper dimensions
        UI.game.init(scene);

        // Now we can safely create the help button with correct positioning and sizing
        if (window.HelpButtonManager) {
            window.HelpButtonManager.createHelpButton(scene);
            window.HelpButtonManager.showHelpButton(scene);
        }
    }
};

// Export the start buttons system
window.StartButtonsDisplay = StartButtonsDisplay;