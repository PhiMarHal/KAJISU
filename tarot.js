// tarot.js - Generic Card Creation Logic for Word Survivors
// Provides reusable functions for creating and displaying cards across the game

// Global constants for card styling
const CARD_STYLES = {
    default: {
        width: 200,
        height: 300,
        backgroundColor: 0x444444,
        strokeWidth: 2,
        strokeColor: 0xeeeeee,
        fontFamily: 'Arial',
        kanjiSize: '36px',
        kanjiColor: '#ffffff',
        kanaSize: '18px',
        kanaColor: '#ffffff',
        romajiSize: '16px',
        romajiColor: '#dddddd',
        englishSize: '20px',
        englishColor: '#ffffff',
        descriptionSize: '16px',
        descriptionColor: '#ffffff'
    },
    // Add more styles here for different card types
    small: {
        width: 160,
        height: 240,
        backgroundColor: 0x444444,
        strokeWidth: 1,
        strokeColor: 0xdddddd,
        fontFamily: 'Arial',
        kanjiSize: '32px',
        kanjiColor: '#ffffff',
        kanaSize: '16px',
        kanaColor: '#ffffff',
        romajiSize: '14px',
        romajiColor: '#dddddd',
        englishSize: '18px',
        englishColor: '#ffffff',
        descriptionSize: '14px',
        descriptionColor: '#ffffff'
    },
    large: {
        width: 250,
        height: 350,
        backgroundColor: 0x444444,
        strokeWidth: 3,
        strokeColor: 0xffdd00,
        fontFamily: 'Arial',
        kanjiSize: '48px',
        kanjiColor: '#ffffff',
        kanaSize: '20px',
        kanaColor: '#ffffff',
        romajiSize: '18px',
        romajiColor: '#dddddd',
        englishSize: '24px',
        englishColor: '#ffffff',
        descriptionSize: '18px',
        descriptionColor: '#ffffff'
    }
};

// Generalized function to create perk card elements with consistent positioning
function createPerkCardElements(scene, perk, x, y, options = {}) {
    const defaults = {
        container: null,
        showBackground: true,
        showKana: true,
        showRomaji: true,
        showEnglish: true,
        showDescription: true,
        backgroundColor: 0x444444,
        width: 200,
        height: 300,
        strokeWidth: 2,
        strokeColor: 0xeeeeee,
        makeInteractive: false,
        perkCallback: null,
        stylePreset: 'default',
        glowEffect: false,
        hoverAnimation: true
    };

    // Get style preset if specified
    const stylePreset = options.stylePreset ?? 'default';
    const presetStyles = CARD_STYLES[stylePreset] ?? CARD_STYLES.default;

    // Merge options with defaults and preset styles
    const settings = { ...defaults, ...presetStyles, ...options };

    // Elements array to return
    const elements = [];

    // Create card background if requested
    if (settings.showBackground) {
        const cardBg = scene.add.rectangle(x, y, settings.width, settings.height, settings.backgroundColor, 1)
            .setStrokeStyle(settings.strokeWidth, settings.strokeColor);

        // Add to container if provided
        if (settings.container) {
            settings.container.add(cardBg);
        }

        // Make interactive if requested
        if (settings.makeInteractive && perk) {
            cardBg.setInteractive({ useHandCursor: true });
            cardBg.perkId = perk.id;

            // Add hover effects
            if (settings.hoverAnimation) {
                cardBg.on('pointerover', function () {
                    this.fillColor = perk.hoverColor ?? 0x666666;
                    this.setStrokeStyle(4, 0xffffff);

                    // Optional scale effect
                    if (settings.hoverScale) {
                        this.scaleX = 1.05;
                        this.scaleY = 1.05;
                    }
                });

                cardBg.on('pointerout', function () {
                    this.fillColor = settings.backgroundColor;
                    this.setStrokeStyle(settings.strokeWidth, settings.strokeColor);

                    // Reset scale if needed
                    if (settings.hoverScale) {
                        this.scaleX = 1;
                        this.scaleY = 1;
                    }
                });
            }

            // Add click handler if provided
            if (settings.perkCallback) {
                cardBg.on('pointerdown', function () {
                    settings.perkCallback(perk.id);
                });
            }
        }

        elements.push(cardBg);
    }

    // Fixed positions relative to card center
    const positions = {
        kanji: y - 60,        // Kanji position
        kana: y - 15,         // Kana position 
        romaji: y + 10,       // Romaji position
        english: y + 40,      // English position
        description: y + 85   // Description position - 145 from kanji
    };

    // Always show kanji
    if (perk) {
        const kanjiText = scene.add.text(
            x, positions.kanji,
            perk.kanji,
            {
                fontFamily: settings.fontFamily,
                fontSize: settings.kanjiSize,
                color: perk.color,
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);

        if (settings.container) {
            settings.container.add(kanjiText);
        }

        elements.push(kanjiText);

        // Show kana if requested
        if (settings.showKana) {
            const kanaText = scene.add.text(
                x, positions.kana,
                perk.kana,
                {
                    fontFamily: settings.fontFamily,
                    fontSize: settings.kanaSize,
                    color: settings.kanaColor
                }
            ).setOrigin(0.5);

            if (settings.container) {
                settings.container.add(kanaText);
            }

            elements.push(kanaText);
        }

        // Show romaji if requested
        if (settings.showRomaji) {
            const romajiText = scene.add.text(
                x, positions.romaji,
                perk.romaji,
                {
                    fontFamily: settings.fontFamily,
                    fontSize: settings.romajiSize,
                    color: settings.romajiColor,
                    fontStyle: 'italic'
                }
            ).setOrigin(0.5);

            if (settings.container) {
                settings.container.add(romajiText);
            }

            elements.push(romajiText);
        }

        // Show english if requested
        if (settings.showEnglish) {
            const englishText = scene.add.text(
                x, positions.english,
                perk.english,
                {
                    fontFamily: settings.fontFamily,
                    fontSize: settings.englishSize,
                    color: perk.color,
                    fontStyle: 'bold'
                }
            ).setOrigin(0.5);

            if (settings.container) {
                settings.container.add(englishText);
            }

            elements.push(englishText);
        }

        // Show description if requested - always in the same position
        if (settings.showDescription) {
            const descText = scene.add.text(
                x, positions.description,
                perk.description,
                {
                    fontFamily: settings.fontFamily,
                    fontSize: settings.descriptionSize,
                    color: settings.descriptionColor,
                    align: 'center',
                    wordWrap: { width: settings.width - 20 }
                }
            ).setOrigin(0.5);

            if (settings.container) {
                settings.container.add(descText);
            }

            elements.push(descText);
        }

        // Add optional glow effect
        if (settings.glowEffect) {
            const glowIntensity = settings.glowIntensity ?? 0.3;
            const glow = scene.add.rectangle(
                x, y,
                settings.width + 10,
                settings.height + 10,
                parseInt(perk.color.replace('#', '0x')),
                glowIntensity
            );

            // Add pulse animation
            scene.tweens.add({
                targets: glow,
                alpha: { from: glowIntensity, to: glowIntensity * 0.5 },
                width: { from: settings.width + 10, to: settings.width + 20 },
                height: { from: settings.height + 10, to: settings.height + 20 },
                duration: 1500,
                yoyo: true,
                repeat: -1
            });

            // Ensure glow is behind card
            if (settings.container) {
                settings.container.add(glow);
                glow.sendToBack();
            }

            elements.unshift(glow); // Add to start of array
        }
    }

    return elements;
}

// Wrapper function to create a perk card using our generalized function
function createPerkCard(scene, perkId, x, y, options = {}) {
    const perk = PERKS[perkId];
    if (!perk) return [];

    return createPerkCardElements(scene, perk, x, y, {
        ...options,
        showKana: true,
        showRomaji: true,
        showEnglish: true,
        showDescription: true
    });
}

// Function to create multiple perk cards in a layout
function createPerkCardLayout(scene, perkIds, options = {}) {
    const defaults = {
        x: 600,                 // Center X position
        y: 400,                 // Center Y position  
        columns: 3,             // Number of columns
        spacing: 220,           // Spacing between cards
        container: null,        // Container to add cards to
        rowSpacing: 320,        // Spacing between rows
        makeInteractive: true,  // Make cards interactive
        perkCallback: null,     // Callback for card selection
        stylePreset: 'default', // Style preset to use
        animation: true,        // Animate cards in
        staggerDelay: 100       // Delay between card animations
    };

    // Merge options with defaults
    const settings = { ...defaults, ...options };

    // Create container if not provided
    const cardContainer = settings.container ?? scene.add.container(0, 0);

    // Calculate layout
    const totalCards = perkIds.length;
    const rows = Math.ceil(totalCards / settings.columns);

    // Calculate starting position for first card
    const startX = settings.x - ((Math.min(totalCards, settings.columns) - 1) * settings.spacing / 2);
    const startY = settings.y - ((rows - 1) * settings.rowSpacing / 2);

    // Create all cards
    const cardElements = [];

    perkIds.forEach((perkId, index) => {
        // Calculate position
        const col = index % settings.columns;
        const row = Math.floor(index / settings.columns);

        const cardX = startX + (col * settings.spacing);
        const cardY = startY + (row * settings.rowSpacing);

        // Create card with animation if enabled
        const initialScale = settings.animation ? 0 : 1;
        const initialAlpha = settings.animation ? 0 : 1;

        // Create the card
        const cardElems = createPerkCard(scene, perkId, cardX, cardY, {
            container: cardContainer,
            makeInteractive: settings.makeInteractive,
            perkCallback: settings.perkCallback,
            stylePreset: settings.stylePreset
        });

        // Apply initial animation state
        if (settings.animation) {
            cardElems.forEach(elem => {
                elem.setScale(initialScale);
                elem.setAlpha(initialAlpha);
            });

            // Animate in with stagger
            scene.tweens.add({
                targets: cardElems,
                scale: 1,
                alpha: 1,
                delay: index * settings.staggerDelay,
                duration: 500,
                ease: 'Back.out'
            });
        }

        cardElements.push(cardElems);
    });

    return {
        container: cardContainer,
        elements: cardElements
    };
}

// Export functions
window.CardSystem = {
    createPerkCardElements: createPerkCardElements,
    createPerkCard: createPerkCard,
    createPerkCardLayout: createPerkCardLayout,
    CARD_STYLES: CARD_STYLES
};