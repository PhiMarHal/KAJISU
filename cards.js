// cards.js - Enhanced Card Management System for Word Survivors

// Colors for various UI elements
const CARD_COLORS = {
    DEFAULT_BG: 0x444444,
    HOVER_BG: 0x666666,
    STROKE: 0xeeeeee,
    STROKE_HOVER: 0xffffff
};

/**
 * Helper function to get the active scene
 * @returns {Phaser.Scene} The active Phaser scene
 */
function getActiveScene() {
    // Access the first active scene from the global game object
    if (window.game && window.game.scene && window.game.scene.scenes && window.game.scene.scenes.length > 0) {
        return window.game.scene.scenes[0];
    }

    // If that fails, try without window prefix
    if (typeof game !== 'undefined' && game && game.scene && game.scene.scenes && game.scene.scenes.length > 0) {
        return game.scene.scenes[0];
    }

    console.error("Unable to access active game scene");
    return null;
}

/**
 * Helper function to safely access PERKS
 * @returns {Object} The PERKS object
 */
function getPerks() {
    // Try accessing PERKS from window
    if (window.PERKS) {
        return window.PERKS;
    }

    // Try accessing without window prefix
    if (typeof PERKS !== 'undefined') {
        return PERKS;
    }

    console.error("PERKS object not found in global scope");
    return {};
}

/**
 * Creates a perk card with consistent styling and positioning
 * 
 * @param {Object} perk - Perk data object containing kanji, kana, romaji, etc.
 * @param {number} x - X position for card center
 * @param {number} y - Y position for card center
 * @param {Object} options - Configuration options for card appearance and behavior
 * @returns {Array} - Array of created elements, with first element being the background
 */
function createPerkCardElements(perk, x, y, options = {}) {
    // Get the active scene directly
    const scene = getActiveScene();

    // Safety check for scene
    if (!scene || !scene.add) {
        console.error("Cannot access active scene in createPerkCardElements");
        return [];
    }

    // Safety check for perk
    if (!perk) {
        console.error("Invalid perk provided to createPerkCardElements");
        return [];
    }

    const defaults = {
        container: null,
        showBackground: true,
        showKana: true,
        showRomaji: true,
        showEnglish: true,
        showDescription: true,
        backgroundColor: CARD_COLORS.DEFAULT_BG,
        width: 200,
        height: 300,
        strokeWidth: 2,
        strokeColor: CARD_COLORS.STROKE,
        makeInteractive: false,
        perkCallback: null,
        fontSize: 1 // New fontSize scaling parameter
    };

    // Merge options with defaults
    const settings = { ...defaults, ...options };

    // Elements array to return
    const elements = [];

    // Create card background if requested
    if (settings.showBackground) {
        const cardBg = scene.add.rectangle(x, y, settings.width, settings.height, settings.backgroundColor, 1)
            .setStrokeStyle(settings.strokeWidth, settings.strokeColor);

        // Add to container if provided
        if (settings.container && settings.container.add) {
            settings.container.add(cardBg);
        }

        // Make interactive if requested
        if (settings.makeInteractive && perk) {
            cardBg.setInteractive({ useHandCursor: true });
            cardBg.perkId = perk.id;

            // Add hover effects
            cardBg.on('pointerover', function () {
                this.fillColor = perk.hoverColor ?? CARD_COLORS.HOVER_BG;
                this.setStrokeStyle(4, CARD_COLORS.STROKE_HOVER);
            });

            cardBg.on('pointerout', function () {
                this.fillColor = settings.backgroundColor;
                this.setStrokeStyle(settings.strokeWidth, settings.strokeColor);
            });

            // Add click handler if provided
            if (settings.perkCallback && typeof settings.perkCallback === 'function') {
                cardBg.on('pointerdown', function () {
                    settings.perkCallback(perk.id);
                });
            }
        }

        elements.push(cardBg);
    }

    // Check if we're in KAJISULI mode for position adjustments
    const isKajisuli = (typeof KAJISULI_MODE !== 'undefined') ? KAJISULI_MODE : false;

    // Fixed positions relative to card center - adjusted for KAJISULI mode
    const positions = {
        kanji: isKajisuli ? y - 90 : y - 60,        // Higher in KAJISULI mode
        kana: isKajisuli ? y - 44 : y - 15,         // Higher, 2px less gap from kanji (80-38=42 vs 60-15=45)
        romaji: isKajisuli ? y - 16 : y + 10,       // Higher but less so, more space from kana (38-15=23 vs 15+10=25)
        english: y + 40,                            // Same spot in both modes
        description: isKajisuli ? y + 120 : y + 85  // Lower in KAJISULI mode
    };

    // Always show kanji
    if (perk) {
        const kanjiText = scene.add.text(
            x, positions.kanji,
            perk.kanji,
            {
                fontFamily: 'Arial',
                fontSize: `${36 * settings.fontSize}px`, // Apply scaling
                color: perk.color || '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);

        if (settings.container && settings.container.add) {
            settings.container.add(kanjiText);
        }

        elements.push(kanjiText);

        // Show kana if requested
        if (settings.showKana) {
            const kanaText = scene.add.text(
                x, positions.kana,
                perk.kana || '',
                { fontFamily: 'Arial', fontSize: `${18 * settings.fontSize}px`, color: '#ffffff' }
            ).setOrigin(0.5);

            if (settings.container && settings.container.add) {
                settings.container.add(kanaText);
            }

            elements.push(kanaText);
        }

        // Show romaji if requested
        if (settings.showRomaji) {
            const romajiText = scene.add.text(
                x, positions.romaji,
                perk.romaji || '',
                { fontFamily: 'Arial', fontSize: `${16 * settings.fontSize}px`, color: '#dddddd', fontStyle: 'italic' }
            ).setOrigin(0.5);

            if (settings.container && settings.container.add) {
                settings.container.add(romajiText);
            }

            elements.push(romajiText);
        }

        // Show english if requested
        if (settings.showEnglish) {
            const englishText = scene.add.text(
                x, positions.english,
                perk.english || '',
                {
                    fontFamily: 'Arial',
                    fontSize: `${20 * settings.fontSize}px`,
                    color: perk.color || '#ffffff',
                    fontStyle: 'bold'
                }
            ).setOrigin(0.5);

            if (settings.container && settings.container.add) {
                settings.container.add(englishText);
            }

            elements.push(englishText);
        }

        // Show description if requested - always in the same position
        if (settings.showDescription) {
            const descText = scene.add.text(
                x, positions.description,
                perk.description || '',
                {
                    fontFamily: 'Arial',
                    fontSize: `${16 * settings.fontSize}px`,
                    color: '#ffffff',
                    align: 'center',
                    wordWrap: { width: settings.width - 20 }
                }
            ).setOrigin(0.5);

            if (settings.container && settings.container.add) {
                settings.container.add(descText);
            }

            elements.push(descText);
        }
    }

    return elements;
}

/**
 * Helper function to create a perk card using the generic card element creator
 * 
 * @param {string} perkId - ID of the perk to create a card for
 * @param {number} x - X position of the card center
 * @param {number} y - Y position of the card center
 * @param {Object} options - Additional configuration options
 * @returns {Array} Array of card elements
 */
function createPerkCard(perkId, x, y, options = {}) {
    const PERKS = getPerks();

    if (Object.keys(PERKS).length === 0) {
        console.error("PERKS not defined when calling createPerkCard");

        // Create a fallback dummy perk to avoid breaking UI
        const dummyPerk = {
            id: perkId || "undefined",
            kanji: "?",
            kana: "unknown",
            romaji: "unknown",
            english: "Unknown Perk",
            description: "Perk data could not be loaded",
            color: "#ff0000"
        };

        return createPerkCardElements(dummyPerk, x, y, options);
    }

    const perk = PERKS[perkId];
    if (!perk) {
        console.error("Invalid perk ID provided to createPerkCard:", perkId);

        // Create a fallback dummy perk specific to the ID
        const dummyPerk = {
            id: perkId,
            kanji: perkId.substring(0, 1),
            kana: perkId,
            romaji: perkId,
            english: `Unknown: ${perkId}`,
            description: "This perk data could not be found",
            color: "#ff0000"
        };

        return createPerkCardElements(dummyPerk, x, y, options);
    }

    return createPerkCardElements(perk, x, y, {
        ...options,
        showKana: true,
        showRomaji: true,
        showEnglish: true,
        showDescription: true
    });
}

/**
 * Creates and shuffles an array of perk cards for level up
 * @param {number} count - Number of cards to generate
 * @param {Array} excludeIds - Array of perk IDs to exclude
 * @returns {Array} Array of shuffled perk objects
 */
function generateRandomPerkCards(count, excludeIds = []) {
    // Use the existing PerkSystem if available
    if (window.PerkSystem && window.PerkSystem.getRandomPerks) {
        return window.PerkSystem.getRandomPerks(count, excludeIds);
    }

    // Fallback method if PerkSystem is not available
    const PERKS = getPerks();
    const availablePerks = Object.keys(PERKS)
        .filter(key => !excludeIds.includes(key))
        .map(key => ({
            id: key,
            ...PERKS[key]
        }));

    // Shuffle the array
    for (let i = availablePerks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availablePerks[i], availablePerks[j]] = [availablePerks[j], availablePerks[i]];
    }

    return availablePerks.slice(0, count);
}

/**
 * Shows a mobile-friendly level up screen with card navigation
 * @param {Phaser.Scene} scene - The active game scene
 */
function showMobileLevelUpScreen(scene) {
    // Pause the game
    PauseSystem.pauseGame();

    // Number of perk options to offer
    const numPerkOptions = 4;

    // Get random perks (excluding already acquired ones)
    const availablePerks = PerkSystem.getRandomPerks(numPerkOptions, acquiredPerks);

    // Create a container with high depth for all level-up elements
    const levelUpContainer = scene.add.container(0, 0);
    levelUpContainer.setDepth(1000);

    // Safety tracking - player must browse through all perks before selecting
    let viewedPerks = new Set();
    let hasViewedAllPerks = false;

    // Create semi-transparent background
    const centerX = game.config.width / 2;
    const centerY = game.config.height / 2;
    const levelUpBackground = scene.add.rectangle(
        centerX,
        centerY,
        game.config.width,
        game.config.height,
        0x000000,
        0.7
    );

    // Create level up title with improved styling
    const levelUpTitle = scene.add.text(
        centerX,
        game.config.height * 0.20,
        'LEVEL UP!',
        {
            fontFamily: 'Arial',
            fontSize: '64px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }
    ).setOrigin(0.5);

    // Create subtitle text with browsing instruction - positioned lower in normal mode
    const subtitleY = KAJISULI_MODE ?
        game.config.height * 0.82 :    // Original position for KAJISULI mode
        game.config.height * 0.86;     // Lower for normal mode

    const subtitle = scene.add.text(
        centerX,
        subtitleY,
        'Tap arrows to see perks',
        {
            fontFamily: 'Arial',
            fontSize: '36px',
            color: '#ffffff'
        }
    ).setOrigin(0.5);

    // Add background and text to container
    levelUpContainer.add(levelUpBackground);
    levelUpContainer.add(levelUpTitle);
    levelUpContainer.add(subtitle);

    // Show KAJISULI stats if in KAJISULI mode
    if (KAJISULI_MODE) {
        // Use the enhanced showStatsDisplay from pause.js with custom options
        const statsElements = PauseSystem.showStatsDisplay(scene, {
            container: levelUpContainer,
            positionY: game.config.height * 0.95,
            storeInElements: false,
            clearContainer: false,
            setVisible: false,
            fontSize: '36px' // 150% larger font for kanji and numbers
        });

        // Add hover interactions to the stats if StatTooltipSystem is available
        if (window.StatTooltipSystem && statsElements) {
            const statKeys = ['POW', 'AGI', 'LUK', 'END'];
            statsElements.forEach((statGroup, index) => {
                if (statGroup.border && statKeys[index]) {
                    StatTooltipSystem.addStatHoverInteraction(scene, statGroup.border, statKeys[index], {
                        container: levelUpContainer,
                        isKajisuli: true,
                        isLevelUp: true,
                        onHover: (element) => {
                            // Highlight border on hover
                            element.setStrokeStyle(4, UI.colors.gold);
                            if (statGroup.statText) {
                                statGroup.statText.setScale(1.1);
                            }
                        },
                        onHoverOut: (element) => {
                            // Reset border and text
                            element.setStrokeStyle(2, UI.colors.gold);
                            if (statGroup.statText) {
                                statGroup.statText.setScale(1);
                            }
                        }
                    });
                }
            });
        }
    }

    // Current perk index being displayed
    let currentPerkIndex = 0;

    // Create perk card at the center
    let currentCardElements = [];
    let selectionBorder = null; // Golden border for when selection is available

    // Function to create or update the displayed card
    function updateDisplayedCard() {
        // Remove previous card elements if they exist
        currentCardElements.forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        currentCardElements = [];

        // Remove previous selection border if it exists
        if (selectionBorder) {
            selectionBorder.destroy();
            selectionBorder = null;
        }

        // Create new card with the current perk
        const currentPerk = availablePerks[currentPerkIndex];
        if (currentPerk) {
            const cardWidth = KAJISULI_MODE ?
                Math.min(300, game.config.width * 0.9) : // 150% wider (200->300)
                Math.min(200, game.config.width * 0.6);
            const cardHeight = KAJISULI_MODE ? 450 : 300; // 150% taller (300->450)

            currentCardElements = CardSystem.createPerkCardElements(
                currentPerk,
                centerX,
                centerY,
                {
                    showKana: true,
                    showRomaji: true,
                    showEnglish: true,
                    showDescription: true,
                    width: cardWidth,
                    height: cardHeight,
                    fontSize: KAJISULI_MODE ? 1.5 : 1 // 150% font scaling
                }
            );

            // Add all card elements to the container
            currentCardElements.forEach(element => {
                levelUpContainer.add(element);
            });

            // Create selection border if all perks have been viewed
            if (hasViewedAllPerks) {
                createSelectionBorder(cardWidth, cardHeight);
            }

            // Make the background clickable to select this perk
            const cardBackground = currentCardElements[0];
            cardBackground.setInteractive({ useHandCursor: true });
            cardBackground.on('pointerdown', () => {
                selectPerk(currentPerk.id);
            });

            // Visual feedback for selection availability
            if (hasViewedAllPerks) {
                scene.tweens.add({
                    targets: cardBackground,
                    strokeStyle: { value: 0xffff00 },
                    easeParams: [1, 0.5],
                    yoyo: true,
                    duration: 700,
                    repeat: -1
                });
            }
        }
    }

    // Create navigation arrows
    const arrowConfig = {
        fontSize: '100px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
    };

    // Position arrows closer to cards in normal mode, further in KAJISULI mode
    const arrowDistance = KAJISULI_MODE ?
        game.config.width * 0.32 :  // Original distance for KAJISULI mode
        game.config.width * 0.16;   // Closer to cards for normal mode

    // Left arrow
    const leftArrow = scene.add.text(
        centerX - arrowDistance,
        centerY,
        '◀',
        arrowConfig
    ).setOrigin(0.5);
    leftArrow.setInteractive({ useHandCursor: true });
    leftArrow.on('pointerdown', () => {
        currentPerkIndex = (currentPerkIndex - 1 + numPerkOptions) % numPerkOptions;
        viewedPerks.add(currentPerkIndex);
        checkIfAllPerksViewed();
        updateDisplayedCard();
        updateArrowVisibility();
    });

    // Right arrow
    const rightArrow = scene.add.text(
        centerX + arrowDistance,
        centerY,
        '▶',
        arrowConfig
    ).setOrigin(0.5);
    rightArrow.setInteractive({ useHandCursor: true });
    rightArrow.on('pointerdown', () => {
        currentPerkIndex = (currentPerkIndex + 1) % numPerkOptions;
        viewedPerks.add(currentPerkIndex);
        checkIfAllPerksViewed();
        updateDisplayedCard();
        updateArrowVisibility();
    });

    // Add arrows to container
    levelUpContainer.add(leftArrow);
    levelUpContainer.add(rightArrow);

    // Store pulsing tweens for cleanup
    let arrowPulseTweens = [];

    // Start arrow pulsing
    function startArrowPulsing() {
        arrowPulseTweens.push(
            scene.tweens.add({
                targets: [leftArrow, rightArrow],
                scale: 1.1,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            })
        );
    }

    // Stop arrow pulsing
    function stopArrowPulsing() {
        arrowPulseTweens.forEach(tween => tween.remove());
        arrowPulseTweens = [];
        leftArrow.setScale(1);
        rightArrow.setScale(1);
    }

    // Start initial pulsing
    startArrowPulsing();

    // Add card counter text - positioned lower in normal mode
    const counterY = KAJISULI_MODE ?
        centerY + (game.config.height * 0.21) :  // Original position for KAJISULI mode
        centerY + (game.config.height * 0.25);   // Lower for normal mode

    const counterText = scene.add.text(
        centerX,
        counterY,
        `${currentPerkIndex + 1}/${numPerkOptions}`,
        {
            fontFamily: 'Arial',
            fontSize: '36px',
            color: '#ffffff'
        }
    ).setOrigin(0.5);
    levelUpContainer.add(counterText);

    // Function to update arrow visibility and counter text
    function updateArrowVisibility() {
        counterText.setText(`${currentPerkIndex + 1}/${numPerkOptions}`);
        if (numPerkOptions <= 1) {
            leftArrow.setVisible(false);
            rightArrow.setVisible(false);
        }
    }

    // Function to create the golden selection border
    function createSelectionBorder(cardWidth, cardHeight) {
        const borderGap = 4;
        const borderThickness = 4;

        selectionBorder = scene.add.rectangle(
            centerX,
            centerY,
            cardWidth + (borderGap * 2) + (borderThickness * 2),
            cardHeight + (borderGap * 2) + (borderThickness * 2)
        );
        selectionBorder.setStrokeStyle(borderThickness, 0xFFD700);
        selectionBorder.setFillStyle(0x000000, 0);

        levelUpContainer.add(selectionBorder);

        scene.tweens.add({
            targets: selectionBorder,
            alpha: 0.6,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    function checkIfAllPerksViewed() {
        if (viewedPerks.size >= numPerkOptions && !hasViewedAllPerks) {
            hasViewedAllPerks = true;
            updateSubtitleText();
            stopArrowPulsing();
        }
    }

    // Function to update subtitle text after viewing all perks
    function updateSubtitleText() {
        subtitle.setText('CHOOSE A PERK');
        subtitle.setColor('#FFD700');
    }

    // Function to trigger subtitle shake effect
    function triggerSubtitleShake() {
        scene.tweens.killTweensOf(subtitle);
        const originalY = subtitle.y;
        scene.tweens.add({
            targets: subtitle,
            y: originalY - 3,
            duration: 50,
            yoyo: true,
            repeat: 3,
            ease: 'Power2',
            onComplete: () => {
                subtitle.y = originalY;
            }
        });
    }

    // Function to trigger arrow gold blink effect
    function triggerArrowBlink() {
        // Turn arrows gold
        leftArrow.setColor('#FFD700');
        rightArrow.setColor('#FFD700');

        // Return to white after 1 second
        setTimeout(() => {
            leftArrow.setColor('#ffffff');
            rightArrow.setColor('#ffffff');
        }, 500);
    }

    // Function to handle perk selection
    function selectPerk(perkId) {
        if (!hasViewedAllPerks) {
            triggerSubtitleShake();
            triggerArrowBlink();
            return;
        }

        acquirePerk(scene, perkId);
        GameUI.updateStatCircles(scene);
        GameUI.updateHealthBar(scene);

        window.levelUpInProgress = false;
        PlayerHitSystem.makePlayerInvincible(scene);

        if (heroExp >= xpForNextLevel(playerLevel)) {
            setTimeout(() => {
                if (heroExp >= xpForNextLevel(playerLevel) && !window.levelUpInProgress) {
                    window.levelUpInProgress = true;
                    levelUp.call(scene);
                }
            }, 100);
        }

        levelUpContainer.destroy();
        levelUpCards = [];
        PauseSystem.resumeGame();

        if (window.ButtonStateManager) {
            window.ButtonStateManager.onGameResume(scene);
        }
    }

    // Initial display setup
    viewedPerks.add(currentPerkIndex);
    updateDisplayedCard();
    updateArrowVisibility();
    levelUpCards = [levelUpContainer];
}

/**
 * Modified showLevelUpScreen function with screen size detection
 * @param {Phaser.Scene} scene - The active game scene
 */
function showLevelUpScreen(scene) {
    if (window.ButtonStateManager) {
        window.ButtonStateManager.onGamePause(scene);
    }
    // Check if we're in kajisuli mode (mobile)
    const isMobileMode = typeof KAJISULI_MODE !== 'undefined' ? KAJISULI_MODE : false;

    if (isMobileMode) {
        // Call the mobile-optimized version for kajisuli mode
        showMobileLevelUpScreen(scene);
    } else {
        // Use the existing romaji challenge for desktop mode
        if (window.RomajiChallengeSystem) {
            window.RomajiChallengeSystem.showLevelUpChallenge(scene);
        } else {
            console.error("RomajiChallengeSystem not found, falling back to mobile implementation");
            // Fallback to mobile version if romaji system is missing
            showMobileLevelUpScreen(scene);
        }
    }
}

// Update CardSystem exports to include new function
const CardSystem = {
    createPerkCardElements,
    createPerkCard,
    getActiveScene,
    showLevelUpScreen,
    showMobileLevelUpScreen, // Add the new function to the exported object
    generateRandomPerkCards,
    CARD_COLORS
};

// Export CardSystem for use in other files
window.CardSystem = CardSystem;