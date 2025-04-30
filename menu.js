// menu.js - UI Elements for Word Survivors

// UI Element constants
const UI = {
    healthBar: {
        width: 300,
        height: 10,
        borderWidth: 2,
        innerMargin: 2,
        segmentGap: 4,
        y: 20,
        centerX: 600,
        startX: 450
    },
    expBar: {
        width: 200,
        height: 5,
        borderWidth: 2,
        innerMargin: 1,
        y: 44,
        centerX: 600,
        startX: 500,
        textColor: "#00ffff",
        barColor: 0x00ffff,
        bgColor: 0x333333
    },
    statusDisplay: {
        timerY: 30,
        killsY: 30, // Same Y as timer for horizontal alignment
        x: 16,
        timerWidth: 120,
        killsWidth: 120,
        killsX: 160, // Position kill count box to the right of timer
        height: 20,
        borderWidth: 2,
        textPadding: 4,
        clockSymbol: "時",  // Kanji for time/clock
        deathSymbol: "殺",  // Kanji for kill/death
        fontSize: 16
    },
    statDisplay: {
        y: 30,        // Positioned at top of screen
        x: 920,       // Starting X position on right side
        spacing: 70,  // Spacing between stats
        width: 50,    // Width of each stat box
        height: 24,   // Height of each stat box
        borderWidth: 2,
        textPadding: 4,
        fontSize: 20,
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
    colors: {
        gold: 0xFFD700,
        green: 0x00cc00,
        black: 0x000000,
        grey: 0x333333
    },
    depth: {
        ui: 100
    },
    fonts: {
        level: { size: '18px', family: 'Arial', color: '#FFD700' },
        xpNeeded: { size: '12px', family: 'Arial', color: '#00ffff' },
        stats: { size: '20px', family: 'Arial', color: '#FFFFFF' },
        timer: { size: '18px', family: 'Arial', color: '#FFFFFF' },
        kills: { size: '18px', family: 'Arial', color: '#FFFFFF' }
    }
};

// Health bar functions
const HealthBar = {
    create: function (scene) {
        // Remove old health bar elements if they exist
        if (scene.healthBar) scene.healthBar.destroy();
        if (scene.healthBarBg) scene.healthBarBg.destroy();
        if (scene.healthText) scene.healthText.destroy();

        // Create new container with golden border
        scene.healthBarBg = scene.add.rectangle(
            UI.healthBar.centerX,
            UI.healthBar.y,
            UI.healthBar.width + (UI.healthBar.borderWidth * 2),
            UI.healthBar.height + (UI.healthBar.borderWidth * 2),
            UI.colors.gold
        ).setDepth(UI.depth.ui);

        // Create inner black background
        const innerBg = scene.add.rectangle(
            UI.healthBar.centerX,
            UI.healthBar.y,
            UI.healthBar.width,
            UI.healthBar.height,
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

        // Actual content width (excluding margins)
        const contentWidth = UI.healthBar.width - (UI.healthBar.innerMargin * 2);

        // Calculate segment width based on max health
        const totalGapWidth = (maxPlayerHealth - 1) * UI.healthBar.segmentGap;
        const segmentWidth = (contentWidth - totalGapWidth) / maxPlayerHealth;

        // Starting X position (accounting for margin)
        const startPosX = UI.healthBar.startX + UI.healthBar.innerMargin;

        // Create each segment
        for (let i = 0; i < maxPlayerHealth; i++) {
            // Only create filled segments for current health
            const isFilled = i < playerHealth;

            // Calculate segment position
            const segmentX = startPosX + (i * (segmentWidth + UI.healthBar.segmentGap));

            // Create segment with high depth
            const segment = scene.add.rectangle(
                segmentX + (segmentWidth / 2),
                UI.healthBar.y,
                segmentWidth,
                UI.healthBar.height - (UI.healthBar.innerMargin * 2),
                isFilled ? UI.colors.green : UI.colors.grey
            ).setDepth(UI.depth.ui);

            // Add to group for easy management
            scene.healthSegments.add(segment);

            // Add golden separator after each segment (except the last one)
            if (i < maxPlayerHealth - 1) {
                const separatorX = segmentX + segmentWidth + (UI.healthBar.segmentGap / 2);
                const separator = scene.add.rectangle(
                    separatorX,
                    UI.healthBar.y,
                    2,
                    UI.healthBar.height - (UI.healthBar.innerMargin * 2),
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
        // Remove old exp bar elements if they exist
        if (scene.expBar) scene.expBar.destroy();
        if (scene.expBarBg) scene.expBarBg.destroy();
        if (scene.expText) scene.expText.destroy();
        if (scene.levelText) scene.levelText.destroy();
        if (scene.xpNeededText) scene.xpNeededText.destroy();

        // Create new container with golden border
        scene.expBarBg = scene.add.rectangle(
            UI.expBar.centerX,
            UI.expBar.y,
            UI.expBar.width + (UI.expBar.borderWidth * 2),
            UI.expBar.height + (UI.expBar.borderWidth * 2),
            UI.colors.gold
        ).setDepth(UI.depth.ui);

        // Create inner black background
        const innerBg = scene.add.rectangle(
            UI.expBar.centerX,
            UI.expBar.y,
            UI.expBar.width,
            UI.expBar.height,
            UI.colors.black
        ).setDepth(UI.depth.ui);

        // Create the exp bar itself (initially empty)
        scene.expBar = scene.add.rectangle(
            UI.expBar.startX,
            UI.expBar.y,
            0,
            UI.expBar.height - (UI.expBar.innerMargin * 2),
            UI.expBar.barColor
        ).setOrigin(0, 0.5).setDepth(UI.depth.ui);

        // Create level text to the left of the bar
        scene.levelText = scene.add.text(
            UI.expBar.startX - 30,
            UI.expBar.y,
            "1",
            {
                fontFamily: UI.fonts.level.family,
                fontSize: UI.fonts.level.size,
                color: UI.fonts.level.color
            }
        ).setOrigin(0.5).setDepth(UI.depth.ui);

        // Create XP needed text to the right of the bar
        scene.xpNeededText = scene.add.text(
            UI.expBar.startX + UI.expBar.width + 30,
            UI.expBar.y,
            "5",
            {
                fontFamily: UI.fonts.xpNeeded.family,
                fontSize: UI.fonts.xpNeeded.size,
                color: UI.fonts.xpNeeded.color
            }
        ).setOrigin(0.5).setDepth(UI.depth.ui);

        // Initial update
        this.update(scene);
    },

    update: function (scene) {
        // If elements don't exist yet, exit
        if (!scene.expBar || !scene.levelText || !scene.xpNeededText) return;

        // Calculate experience percentage
        const expPercentage = Math.max(0, Math.min(1, heroExp / heroExpToLevel));

        // Set the width of the exp bar
        scene.expBar.width = expPercentage * UI.expBar.width;

        // Update the level text
        scene.levelText.setText(`${playerLevel}`);

        // Calculate and update the XP REMAINING text with formatting for large numbers
        const xpRemaining = heroExpToLevel - heroExp;
        scene.xpNeededText.setText(formatLargeNumber(xpRemaining));
    }
};

// Status display for timer and kills
const StatusDisplay = {
    create: function (scene) {
        // Clean up existing elements if they exist
        if (scene.timerBox) scene.timerBox.destroy();
        if (scene.timerBoxInner) scene.timerBoxInner.destroy();
        if (scene.timerText) scene.timerText.destroy();
        if (scene.timerSymbol) scene.timerSymbol.destroy();

        if (scene.killsBox) scene.killsBox.destroy();
        if (scene.killsBoxInner) scene.killsBoxInner.destroy();
        if (scene.killsText) scene.killsText.destroy();
        if (scene.killsSymbol) scene.killsSymbol.destroy();

        // Create timer display with gold border
        scene.timerBox = scene.add.rectangle(
            UI.statusDisplay.x + UI.statusDisplay.timerWidth / 2,
            UI.statusDisplay.timerY,
            UI.statusDisplay.timerWidth + (UI.statusDisplay.borderWidth * 2),
            UI.statusDisplay.height + (UI.statusDisplay.borderWidth * 2),
            UI.colors.gold
        ).setDepth(UI.depth.ui).setOrigin(0.5);

        // Create inner black background for timer
        scene.timerBoxInner = scene.add.rectangle(
            UI.statusDisplay.x + UI.statusDisplay.timerWidth / 2,
            UI.statusDisplay.timerY,
            UI.statusDisplay.timerWidth,
            UI.statusDisplay.height,
            UI.colors.black
        ).setDepth(UI.depth.ui).setOrigin(0.5);

        // Create the timer kanji symbol
        scene.timerSymbol = scene.add.text(
            UI.statusDisplay.x + UI.statusDisplay.textPadding,
            UI.statusDisplay.timerY,
            UI.statusDisplay.clockSymbol,
            {
                fontFamily: UI.fonts.timer.family,
                fontSize: UI.statusDisplay.fontSize,
                color: UI.fonts.timer.color
            }
        ).setDepth(UI.depth.ui).setOrigin(0, 0.5);

        // Create the timer text
        scene.timerText = scene.add.text(
            UI.statusDisplay.x + UI.statusDisplay.timerWidth - UI.statusDisplay.textPadding,
            UI.statusDisplay.timerY,
            "00:00:00",
            {
                fontFamily: UI.fonts.timer.family,
                fontSize: UI.statusDisplay.fontSize,
                color: UI.fonts.timer.color
            }
        ).setDepth(UI.depth.ui).setOrigin(1, 0.5);

        // Create kills display with gold border (to the right of timer)
        scene.killsBox = scene.add.rectangle(
            UI.statusDisplay.killsX + UI.statusDisplay.killsWidth / 2,
            UI.statusDisplay.killsY,
            UI.statusDisplay.killsWidth + (UI.statusDisplay.borderWidth * 2),
            UI.statusDisplay.height + (UI.statusDisplay.borderWidth * 2),
            UI.colors.gold
        ).setDepth(UI.depth.ui).setOrigin(0.5);

        // Create inner black background for kills
        scene.killsBoxInner = scene.add.rectangle(
            UI.statusDisplay.killsX + UI.statusDisplay.killsWidth / 2,
            UI.statusDisplay.killsY,
            UI.statusDisplay.killsWidth,
            UI.statusDisplay.height,
            UI.colors.black
        ).setDepth(UI.depth.ui).setOrigin(0.5);

        // Create the kills kanji symbol
        scene.killsSymbol = scene.add.text(
            UI.statusDisplay.killsX + UI.statusDisplay.textPadding,
            UI.statusDisplay.killsY,
            UI.statusDisplay.deathSymbol,
            {
                fontFamily: UI.fonts.kills.family,
                fontSize: UI.statusDisplay.fontSize,
                color: UI.fonts.kills.color
            }
        ).setDepth(UI.depth.ui).setOrigin(0, 0.5);

        // Create the kills text
        scene.killsText = scene.add.text(
            UI.statusDisplay.killsX + UI.statusDisplay.killsWidth - UI.statusDisplay.textPadding,
            UI.statusDisplay.killsY,
            "0",
            {
                fontFamily: UI.fonts.kills.family,
                fontSize: UI.statusDisplay.fontSize,
                color: UI.fonts.kills.color
            }
        ).setDepth(UI.depth.ui).setOrigin(1, 0.5);

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
        // Clean up existing elements
        if (scene.statRects) {
            scene.statRects.forEach(stat => {
                if (stat.rectBg) stat.rectBg.destroy();
                if (stat.rectInner) stat.rectInner.destroy();
                if (stat.symbolText) stat.symbolText.destroy();
                if (stat.valueText) stat.valueText.destroy();
            });
        }

        // Initialize the stat rectangles array
        scene.statRects = [];

        // Define stat order
        const stats = ['POW', 'AGI', 'LUK', 'END'];

        // Create each stat rectangle
        stats.forEach((stat, index) => {
            const x = UI.statDisplay.x + (index * UI.statDisplay.spacing);

            // Create gold border rectangle
            const rectBg = scene.add.rectangle(
                x + UI.statDisplay.width / 2,
                UI.statDisplay.y,
                UI.statDisplay.width + (UI.statDisplay.borderWidth * 2),
                UI.statDisplay.height + (UI.statDisplay.borderWidth * 2),
                UI.colors.gold
            ).setDepth(UI.depth.ui).setOrigin(0.5);

            // Create inner black rectangle
            const rectInner = scene.add.rectangle(
                x + UI.statDisplay.width / 2,
                UI.statDisplay.y,
                UI.statDisplay.width,
                UI.statDisplay.height,
                UI.colors.black
            ).setDepth(UI.depth.ui).setOrigin(0.5);

            // Create the symbol text
            const symbolText = scene.add.text(
                x + UI.statDisplay.textPadding,
                UI.statDisplay.y,
                UI.statDisplay.symbols[stat],
                {
                    fontFamily: 'Arial',
                    fontSize: UI.statDisplay.fontSize,
                    color: UI.statDisplay.symbolColors[stat]
                }
            ).setDepth(UI.depth.ui).setOrigin(0, 0.5);

            // Create the value text
            const valueText = scene.add.text(
                x + UI.statDisplay.width - UI.statDisplay.textPadding,
                UI.statDisplay.y,
                "0",
                {
                    fontFamily: 'Arial',
                    fontSize: UI.statDisplay.fontSize,
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
        });

        // Initial update
        this.update(scene);
    },

    update: function (scene) {
        // Exit if elements don't exist
        if (!scene.statRects) return;

        // Update each stat value
        scene.statRects.forEach(item => {
            let value = 0;

            // Get the current value for each stat
            switch (item.stat) {
                case 'POW':
                    value = playerDamage ?? 0;
                    break;
                case 'AGI':
                    value = playerFireRate ?? 0;
                    break;
                case 'LUK':
                    value = playerLuck ?? 0;
                    break;
                case 'END':
                    value = maxPlayerHealth ?? 0;
                    break;
            }

            // Update the display
            if (item.valueText) {
                item.valueText.setText(Math.floor(value).toString());
            }
        });
    }
};

// Function to create all UI elements
function createUI(scene) {
    HealthBar.create(scene);
    ExpBar.create(scene);
    StatusDisplay.create(scene);
    StatDisplay.create(scene);
}

// Export for use in the main game
window.GameUI = {
    createUI: createUI,
    updateHealthBar: HealthBar.update,
    updateExpBar: ExpBar.update,
    updateStatusDisplay: StatusDisplay.update,
    updateStatCircles: StatDisplay.update
};