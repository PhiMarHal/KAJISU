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
        perkCallback: null
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

    // Fixed positions relative to card center
    const positions = {
        kanji: y - 60,      // Kanji position
        kana: y - 15,       // Kana position 
        romaji: y + 10,     // Romaji position
        english: y + 40,    // English position
        description: y + 85 // Description position - 145 from kanji
    };

    // Always show kanji
    if (perk) {
        const kanjiText = scene.add.text(
            x, positions.kanji,
            perk.kanji,
            {
                fontFamily: 'Arial',
                fontSize: '36px',
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
                { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' }
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
                { fontFamily: 'Arial', fontSize: '16px', color: '#dddddd', fontStyle: 'italic' }
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
                    fontSize: '20px',
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
                    fontSize: '16px',
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

// Add this to cards.js

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
        game.config.height * 0.15,
        'LEVEL UP!',
        {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }
    ).setOrigin(0.5);

    // Create subtitle text
    const subtitle = scene.add.text(
        centerX,
        game.config.height * 0.22,
        'Choose a perk to continue',
        {
            fontFamily: 'Arial',
            fontSize: '18px',
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
        PauseSystem.showStatsDisplay(scene, {
            container: levelUpContainer,           // Add to our level up container instead
            positionY: game.config.height * 0.28, // Position below subtitle
            storeInElements: false,                // Don't store in pause system's elements
            clearContainer: false,                 // Don't clear our level up container
            setVisible: false                      // We'll handle visibility via the container
        });
    }

    // Current perk index being displayed
    let currentPerkIndex = 0;

    // Create perk card at the center
    let currentCardElements = [];

    // Function to create or update the displayed card
    function updateDisplayedCard() {
        // Remove previous card elements if they exist
        currentCardElements.forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        currentCardElements = [];

        // Create new card with the current perk
        const currentPerk = availablePerks[currentPerkIndex];
        if (currentPerk) {
            currentCardElements = CardSystem.createPerkCardElements(
                currentPerk,
                centerX,
                centerY,
                {
                    showKana: true,
                    showRomaji: true,
                    showEnglish: true,
                    showDescription: true,
                    width: Math.min(200, game.config.width * 0.6),
                    height: 300
                }
            );

            // Add all card elements to the container
            currentCardElements.forEach(element => {
                levelUpContainer.add(element);
            });

            // Make the background clickable to select this perk
            const cardBackground = currentCardElements[0];
            cardBackground.setInteractive({ useHandCursor: true });
            cardBackground.on('pointerdown', () => {
                selectPerk(currentPerk.id);
            });

            // Add a highlight effect to emphasize it's selectable
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

    // Create navigation arrows
    const arrowConfig = {
        fontSize: '40px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
    };

    // Left arrow - only shown if not on first card
    const leftArrow = scene.add.text(
        centerX - (game.config.width * 0.25),
        centerY,
        '◀',
        arrowConfig
    ).setOrigin(0.5);
    leftArrow.setInteractive({ useHandCursor: true });
    leftArrow.on('pointerdown', () => {
        currentPerkIndex = (currentPerkIndex - 1 + numPerkOptions) % numPerkOptions;
        updateDisplayedCard();
        updateArrowVisibility();
    });

    // Right arrow - only shown if not on last card
    const rightArrow = scene.add.text(
        centerX + (game.config.width * 0.25),
        centerY,
        '▶',
        arrowConfig
    ).setOrigin(0.5);
    rightArrow.setInteractive({ useHandCursor: true });
    rightArrow.on('pointerdown', () => {
        currentPerkIndex = (currentPerkIndex + 1) % numPerkOptions;
        updateDisplayedCard();
        updateArrowVisibility();
    });

    // Add arrows to container
    levelUpContainer.add(leftArrow);
    levelUpContainer.add(rightArrow);

    // Add card counter text (e.g., "1/3")
    const counterText = scene.add.text(
        centerX,
        centerY + 180, // Below the card
        `${currentPerkIndex + 1}/${numPerkOptions}`,
        {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff'
        }
    ).setOrigin(0.5);
    levelUpContainer.add(counterText);

    // Function to update arrow visibility and counter text
    function updateArrowVisibility() {
        // Update counter text
        counterText.setText(`${currentPerkIndex + 1}/${numPerkOptions}`);

        // Make both arrows visible but with different alpha based on position
        leftArrow.setVisible(true);
        rightArrow.setVisible(true);

        if (numPerkOptions <= 1) {
            // Hide both if only one card
            leftArrow.setVisible(false);
            rightArrow.setVisible(false);
        } else {
            // Set alpha based on position
            leftArrow.setAlpha(currentPerkIndex === 0 ? 0.5 : 1);
            rightArrow.setAlpha(currentPerkIndex === numPerkOptions - 1 ? 0.5 : 1);
        }
    }

    // Create a select button at the bottom
    const selectButton = scene.add.text(
        centerX,
        game.config.height * 0.8,
        'Select This Perk',
        {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#008800',
            padding: { left: 15, right: 15, top: 10, bottom: 10 }
        }
    ).setOrigin(0.5);
    selectButton.setInteractive({ useHandCursor: true });

    // Add hover effects
    selectButton.on('pointerover', function () {
        this.setStyle({ backgroundColor: '#00aa00' });
    });
    selectButton.on('pointerout', function () {
        this.setStyle({ backgroundColor: '#008800' });
    });

    // Add click event
    selectButton.on('pointerdown', () => {
        const currentPerk = availablePerks[currentPerkIndex];
        if (currentPerk) {
            selectPerk(currentPerk.id);
        }
    });

    levelUpContainer.add(selectButton);

    // Function to handle perk selection
    function selectPerk(perkId) {
        // Acquire the selected perk
        acquirePerk(scene, perkId);

        // Update UI elements
        GameUI.updateStatCircles(scene);
        GameUI.updateHealthBar(scene);

        // Flash the hero when completing level up
        scene.tweens.add({
            targets: player,
            alpha: 0.2,
            scale: 1.5,
            duration: 200,
            yoyo: true,
            repeat: 1,
            onComplete: function () {
                player.setScale(1);
                player.alpha = 1;

                // Reset the level up lock
                window.levelUpInProgress = false;

                // Check if we have enough XP for another level up
                if (heroExp >= xpForNextLevel(playerLevel)) {
                    // Process next level up after a short delay
                    setTimeout(() => {
                        if (heroExp >= xpForNextLevel(playerLevel) && !window.levelUpInProgress) {
                            window.levelUpInProgress = true;
                            levelUp.call(scene);
                        }
                    }, 100);
                }
            }
        });

        // Clean up and close the level up screen
        levelUpContainer.destroy();
        levelUpCards = []; // Clear global array

        // Resume the game
        PauseSystem.resumeGame();
    }

    // Initial display setup
    updateDisplayedCard();
    updateArrowVisibility();

    // Add container to global level up cards for potential cleanup
    levelUpCards = [levelUpContainer];
}

/**
 * Modified showLevelUpScreen function with screen size detection
 * @param {Phaser.Scene} scene - The active game scene
 */
function showLevelUpScreen(scene) {
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