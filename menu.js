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
        y: 40,
        centerX: 600,
        startX: 500,
        textColor: "#00ffff",
        barColor: 0x00ffff,
        bgColor: 0x333333
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
        xpNeeded: { size: '12px', family: 'Arial', color: '#00ffff' }
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


// Function to create all UI elements
function createUI(scene) {
    HealthBar.create(scene);
    ExpBar.create(scene);
}

// Export for use in the main game
window.GameUI = {
    createUI: createUI,
    updateHealthBar: HealthBar.update,
    updateExpBar: ExpBar.update
};