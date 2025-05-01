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
 * Creates a level-up screen with perk cards and romaji challenge
 * @param {Phaser.Scene} scene - The active game scene
 */
function showLevelUpScreen(scene) {
    // Delegate to the RomajiChallengeSystem
    if (window.RomajiChallengeSystem) {
        window.RomajiChallengeSystem.showLevelUpChallenge(scene);
    } else {
        console.error("RomajiChallengeSystem not found, falling back to original implementation");
        // Legacy fallback method - in case the implementation is incomplete or unavailable
        if (typeof showLevelUpCards === 'function') {
            showLevelUpCards.call(scene);
        } else {
            console.error("No level up card system available");
        }
    }
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

// Enhanced CardSystem object
const CardSystem = {
    createPerkCardElements,
    createPerkCard,
    getActiveScene,
    showLevelUpScreen,
    generateRandomPerkCards,
    CARD_COLORS
};

// Export CardSystem for use in other files
window.CardSystem = CardSystem;