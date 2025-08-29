// cards.js - Enhanced Card Management System for KAJISU

// Colors for various UI elements
const CARD_COLORS = {
    DEFAULT_BG: 0x1a1a1a,  // Soft black instead of harsh gray
    HOVER_BG: 0x666666,
    STROKE: 0xffd700,      // Gold border
    STROKE_HOVER: 0xffed4e,
    INSET: 0xb8860b        // Darker gold for inset
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
 * Creates four diamond shapes on the card borders
 * @param {Phaser.Scene} scene - The active scene
 * @param {number} x - Card center X
 * @param {number} y - Card center Y  
 * @param {number} width - Card width
 * @param {number} height - Card height
 * @param {number} borderWidth - Width of the card border
 * @param {Object} container - Container to add diamonds to
 * @returns {Array} Array of diamond elements
 */
function createCardDiamonds(scene, x, y, width, height, borderWidth = 5, container = null) {
    const diamonds = [];
    const diamondSize = 12;

    // Try positioning diamonds exactly at the card boundary - no offset
    // This should put them in the center of the stroke since Phaser strokes are centered on boundaries

    // Create four diamond positions - exactly at card edges
    const positions = [
        { x: x, y: y - height / 2, name: 'top' },           // Top edge
        { x: x, y: y + height / 2, name: 'bottom' },        // Bottom edge
        { x: x - width / 2, y: y, name: 'left' },           // Left edge  
        { x: x + width / 2, y: y, name: 'right' }           // Right edge
    ];

    positions.forEach(pos => {
        const diamond = scene.add.rectangle(pos.x, pos.y, diamondSize, diamondSize, CARD_COLORS.STROKE);
        diamond.setRotation(Math.PI / 4); // 45 degree rotation
        diamond.setDepth(1000); // High depth so diamonds appear above everything

        if (container && container.add) {
            container.add(diamond);
        }

        diamonds.push(diamond);
    });

    return diamonds;
}

/**
 * Creates a pulse effect using HTML DOM element with CSS gradient (like our mockups!)
 * @param {Phaser.Scene} scene - The active scene
 * @param {number} x - Card center X
 * @param {number} y - Card center Y
 * @param {number} width - Card width
 * @param {number} height - Card height
 * @param {string} color - Pulse color theme ('gold', 'fire', 'ice', etc.)
 * @param {number} speed - Pulse speed in seconds (default 4)
 * @param {Object} container - Container to add pulse to
 * @returns {Object} The pulse DOM element with cleanup function
 */
function createCardPulse(scene, x, y, width, height, color = 'gold', speed = 4, container = null) {
    // Color gradients for different themes (exact same as HTML mockups!)
    const pulseGradients = {
        gold: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.08) 25%, rgba(255, 237, 78, 0.18) 50%, rgba(255, 215, 0, 0.08) 75%, transparent 100%)',
        fire: 'linear-gradient(90deg, transparent 0%, rgba(255, 107, 107, 0.08) 25%, rgba(238, 90, 36, 0.18) 50%, rgba(255, 107, 107, 0.08) 75%, transparent 100%)',
        ice: 'linear-gradient(90deg, transparent 0%, rgba(116, 185, 255, 0.08) 25%, rgba(9, 132, 227, 0.18) 50%, rgba(116, 185, 255, 0.08) 75%, transparent 100%)',
        nature: 'linear-gradient(90deg, transparent 0%, rgba(0, 184, 148, 0.08) 25%, rgba(0, 206, 201, 0.18) 50%, rgba(0, 184, 148, 0.08) 75%, transparent 100%)',
        magic: 'linear-gradient(90deg, transparent 0%, rgba(162, 155, 254, 0.08) 25%, rgba(108, 92, 231, 0.18) 50%, rgba(162, 155, 254, 0.08) 75%, transparent 100%)',
        lightning: 'linear-gradient(90deg, transparent 0%, rgba(255, 234, 167, 0.08) 25%, rgba(250, 211, 144, 0.18) 50%, rgba(255, 234, 167, 0.08) 75%, transparent 100%)',
        shadow: 'linear-gradient(90deg, transparent 0%, rgba(99, 110, 114, 0.08) 25%, rgba(45, 52, 54, 0.18) 50%, rgba(99, 110, 114, 0.08) 75%, transparent 100%)'
    };

    const gradient = pulseGradients[color] || pulseGradients.gold;

    // Get canvas position and scale, accounting for different orientations
    const canvas = scene.game.canvas;
    const canvasBounds = canvas.getBoundingClientRect();
    const gameConfig = scene.game.config;

    // Calculate scale factor between game coordinates and actual canvas size
    const scaleX = canvasBounds.width / gameConfig.width;
    const scaleY = canvasBounds.height / gameConfig.height;

    const pulseWidth = (width - 10) * scaleX;
    const pulseHeight = (height - 10) * scaleY;

    // Calculate position accounting for scaling and orientation
    const screenX = (x * scaleX) + canvasBounds.left;
    const screenY = (y * scaleY) + canvasBounds.top;

    // Create HTML div element with CSS gradient
    const pulseDiv = document.createElement('div');
    pulseDiv.style.position = 'fixed'; // Use fixed positioning for better cross-device compatibility
    pulseDiv.style.left = (screenX - pulseWidth / 2) + 'px';
    pulseDiv.style.top = (screenY - pulseHeight / 2) + 'px';
    pulseDiv.style.width = pulseWidth + 'px';
    pulseDiv.style.height = pulseHeight + 'px';
    pulseDiv.style.background = gradient;
    pulseDiv.style.pointerEvents = 'none'; // Don't interfere with game clicks
    pulseDiv.style.zIndex = '1'; // Above canvas background, below UI
    pulseDiv.className = 'card-pulse-overlay'; // For easier debugging/identification

    // Add CSS animation for the pulse effect
    const animationName = `cardPulse${speed}s`;
    pulseDiv.style.animation = `${animationName} ${speed}s ease-in-out infinite`;

    // Create the CSS animation if it doesn't exist
    const styleId = `pulse-animation-${speed}s`;
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @keyframes ${animationName} {
                0%, 100% { 
                    opacity: 0.1; 
                    transform: scaleX(0.9) scaleY(0.95); 
                }
                50% { 
                    opacity: 0.5; 
                    transform: scaleX(1.1) scaleY(1.05); 
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Add to document
    document.body.appendChild(pulseDiv);

    console.log(`HTML DOM pulse created with ${color} gradient at ${screenX}, ${screenY}`);

    // Store in global cleanup array for failsafe cleanup
    if (!window.activeCardPulses) {
        window.activeCardPulses = [];
    }
    window.activeCardPulses.push(pulseDiv);

    // Create wrapper object with cleanup functionality
    const pulseWrapper = {
        element: pulseDiv,
        destroy: function () {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);

                // Remove from global array
                if (window.activeCardPulses) {
                    const index = window.activeCardPulses.indexOf(this.element);
                    if (index !== -1) {
                        window.activeCardPulses.splice(index, 1);
                    }
                }

                console.log('HTML pulse element cleaned up');
            }
        }
    };

    return pulseWrapper;
}

/**
 * Creates a perk card with enhanced visual design
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
        backgroundColor: CARD_COLORS.DEFAULT_BG,    // Enhanced soft black
        width: 200,
        height: 300,
        strokeWidth: 5,          // Enhanced thick gold border
        strokeColor: CARD_COLORS.STROKE,  // Enhanced gold
        makeInteractive: false,
        perkCallback: null,
        fontSize: 1,
        showDiamonds: true,      // Enable diamonds by default
        enablePulse: true,       // Enable pulse by default
        pulseColor: 'gold',      // Default pulse color
        pulseSpeed: 4,           // Default pulse speed
        useEnhancedStyling: true // New flag to enable enhanced styling
    };

    // Merge options with defaults
    let settings = { ...defaults, ...options };

    // Apply enhanced styling unless explicitly disabled
    if (settings.useEnhancedStyling && !options.legacyMode) {
        settings.backgroundColor = CARD_COLORS.DEFAULT_BG;   // Force soft black
        settings.strokeColor = CARD_COLORS.STROKE;           // Force gold
        settings.strokeWidth = 5;                            // Force thick border
        settings.showDiamonds = settings.showDiamonds !== false; // Default true
        settings.enablePulse = settings.enablePulse !== false;   // Default true
    }

    // Elements array to return
    const elements = [];

    // Create card background with gold border and inset effect
    if (settings.showBackground) {
        const cardBg = scene.add.rectangle(x, y, settings.width, settings.height, settings.backgroundColor, 1)
            .setStrokeStyle(settings.strokeWidth, settings.strokeColor);

        cardBg.setDepth(0); // Lowest depth - background layer

        // Create inset effect using a second rectangle with more gap
        const insetGap = 12; // Larger gap between borders
        const insetBorder = scene.add.rectangle(x, y, settings.width - insetGap, settings.height - insetGap, settings.backgroundColor, 0)
            .setStrokeStyle(2, CARD_COLORS.INSET);

        insetBorder.setDepth(1); // Above background, below pulse

        // Add to container if provided
        if (settings.container && settings.container.add) {
            settings.container.add(cardBg);
            settings.container.add(insetBorder);
        }

        // Make interactive if requested
        if (settings.makeInteractive && perk) {
            cardBg.setInteractive({ useHandCursor: true });
            cardBg.perkId = perk.id;

            // Add hover effects
            cardBg.on('pointerover', function () {
                this.fillColor = perk.hoverColor ?? CARD_COLORS.HOVER_BG;
                this.setStrokeStyle(settings.strokeWidth + 1, CARD_COLORS.STROKE_HOVER);
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

        elements.push(cardBg, insetBorder);
    }

    // Create diamonds if enabled
    if (settings.showDiamonds) {
        const diamonds = createCardDiamonds(scene, x, y, settings.width, settings.height, settings.strokeWidth, settings.container);
        elements.push(...diamonds);
    }

    // Check if we're in KAJISULI mode for position adjustments
    const isKajisuli = (typeof KAJISULI_MODE !== 'undefined') ? KAJISULI_MODE : false;

    // Fixed positions relative to card center - adjusted for KAJISULI mode
    const positions = {
        kanji: isKajisuli ? y - 90 : y - 60,
        kana: isKajisuli ? y - 44 : y - 15,
        romaji: isKajisuli ? y - 16 : y + 10,
        english: y + 40,
        description: isKajisuli ? y + 120 : y + 85
    };

    // Always show kanji with enhanced styling
    if (perk) {
        const kanjiText = scene.add.text(
            x, positions.kanji,
            perk.kanji,
            {
                fontFamily: 'Arial',
                fontSize: `${36 * settings.fontSize}px`,
                color: '#ffffff',  // White kanji
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4,
                shadow: perk.color ? {
                    offsetX: 0,
                    offsetY: 0,
                    color: perk.color,
                    blur: 8,
                    stroke: false,
                    fill: true
                } : undefined
            }
        ).setOrigin(0.5);

        kanjiText.setDepth(10); // High depth to appear above pulse

        if (settings.container && settings.container.add) {
            settings.container.add(kanjiText);
        }

        elements.push(kanjiText);

        // Show kana if requested
        if (settings.showKana) {
            const kanaText = scene.add.text(
                x, positions.kana,
                perk.kana || '',
                { fontFamily: 'Arial', fontSize: `${18 * settings.fontSize}px`, color: '#cccccc' }
            ).setOrigin(0.5);

            kanaText.setDepth(10); // High depth to appear above pulse

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
                { fontFamily: 'Arial', fontSize: `${16 * settings.fontSize}px`, color: '#aaaaaa', fontStyle: 'italic' }
            ).setOrigin(0.5);

            romajiText.setDepth(10); // High depth to appear above pulse

            if (settings.container && settings.container.add) {
                settings.container.add(romajiText);
            }

            elements.push(romajiText);
        }

        // Show english with perk color if requested
        if (settings.showEnglish) {
            const englishText = scene.add.text(
                x, positions.english,
                perk.english || '',
                {
                    fontFamily: 'Arial',
                    fontSize: `${20 * settings.fontSize}px`,
                    color: perk.color || '#ffd700',  // Use perk color or default gold
                    fontStyle: 'bold'
                }
            ).setOrigin(0.5);

            englishText.setDepth(10); // High depth to appear above pulse

            if (settings.container && settings.container.add) {
                settings.container.add(englishText);
            }

            elements.push(englishText);
        }

        // Show description if requested
        if (settings.showDescription) {
            const descText = scene.add.text(
                x, positions.description,
                perk.description || '',
                {
                    fontFamily: 'Arial',
                    fontSize: `${16 * settings.fontSize}px`,
                    color: '#e0e0e0',  // Improved readability
                    align: 'center',
                    wordWrap: { width: settings.width - 20 }
                }
            ).setOrigin(0.5);

            descText.setDepth(10); // High depth to appear above pulse

            if (settings.container && settings.container.add) {
                settings.container.add(descText);
            }

            elements.push(descText);
        }
    }

    // Add pulse effect if enabled
    if (settings.enablePulse) {
        // Determine pulse color based on perk
        let pulseColorTheme = settings.pulseColor;
        if (perk.color) {
            // Map perk colors to pulse themes
            const colorMap = {
                '#ff6b6b': 'fire',
                '#74b9ff': 'ice',
                '#00b894': 'nature',
                '#a29bfe': 'magic',
                '#fdcb6e': 'lightning',
                '#636e72': 'shadow'
            };
            pulseColorTheme = colorMap[perk.color] || 'gold';
        }

        // Create beautiful gradient pulse overlay
        const pulseWrapper = createCardPulse(
            scene, x, y, settings.width, settings.height,
            pulseColorTheme, settings.pulseSpeed, settings.container
        );

        if (pulseWrapper) {
            // Add the wrapper to elements so it gets cleaned up when card is destroyed
            elements.push(pulseWrapper);
        }
    }

    return elements;
}

/**
 * Helper function to create a perk card using the enhanced card element creator
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
 * Shows a mobile-friendly level up screen with all cards displayed in a square formation
 * @param {Phaser.Scene} scene - The active game scene
 */
function showMobileLevelUpScreen(scene) {
    // Safety check: clean up any existing level-up UI
    if (levelUpCards && levelUpCards.length > 0) {
        console.warn("Cleaning up existing level-up UI");
        levelUpCards.forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        levelUpCards = [];
    }

    // Pause the game
    PauseSystem.pauseGame();

    // Number of perk options to offer
    const numPerkOptions = 4;

    // Get random perks (excluding already acquired ones)
    const availablePerks = PerkSystem.getRandomPerks(numPerkOptions, acquiredPerks);

    // Create a container with high depth for all level-up elements
    const levelUpContainer = scene.add.container(0, 0);
    levelUpContainer.setDepth(1000);

    // Create concentric circles animation
    const centerX = game.config.width / 2;
    const centerY = game.config.height / 2;
    const screenSize = Math.min(game.config.width, game.config.height);
    const baseRadiusMultiplier = 0.08;
    const incrementMultiplier = 0.04;

    const concentricCircles = VisualEffects.createConcentricCircles(scene, {
        x: centerX,
        y: centerY,
        circleCount: 8,
        baseRadius: screenSize * baseRadiusMultiplier,
        radiusIncrement: screenSize * incrementMultiplier,
        gapRatio: 0.4,
        rotationSpeed: 24,
        color: 0xFFD700,
        strokeWidth: 4,
        segmentCount: 4,
        depth: 999
    });

    // Create semi-transparent background
    const levelUpBackground = scene.add.rectangle(
        centerX,
        centerY,
        game.config.width,
        game.config.height,
        0x000000,
        0.7
    );
    levelUpContainer.add(levelUpBackground);

    // Selection state tracking
    let selectedCardIndex = -1;
    let selectedCardElements = null;
    let selectionBorder = null;
    let selectionOverlay = null;
    let selectionPulseTween = null;
    let confirmationTween = null;

    // Create center text that alternates between "LEVEL UP!" and "CHOOSE A PERK"
    const centerText = scene.add.text(
        centerX,
        centerY,
        'LEVEL UP!',
        {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }
    ).setOrigin(0.5);
    levelUpContainer.add(centerText);

    // Coordinated text switching with fade transitions
    let textSwitchTimeline;

    function createTextSwitchSequence() {
        // Start with LEVEL UP
        centerText.setText('LEVEL UP!');
        centerText.setColor('#ffffff');
        centerText.setAlpha(1);

        textSwitchTimeline = scene.tweens.timeline({
            targets: centerText,
            loop: -1,
            tweens: [
                // 2 seconds of LEVEL UP (no fade)
                {
                    alpha: 1,
                    duration: 2000
                },
                // 0.5s fade out LEVEL UP
                {
                    alpha: 0,
                    duration: 500,
                    onComplete: function () {
                        if (selectedCardIndex === -1) {
                            centerText.setText('CHOOSE A PATH');
                        }
                    }
                },
                // 0.5s fade in CHOOSE A PATH
                {
                    alpha: 1,
                    duration: 500
                },
                // 2 seconds of CHOOSE A PATH (no fade)
                {
                    alpha: 1,
                    duration: 2000
                },
                // 0.5s fade out CHOOSE A PATH
                {
                    alpha: 0,
                    duration: 500,
                    onComplete: function () {
                        if (selectedCardIndex === -1) {
                            centerText.setText('LEVEL UP!');
                        }
                    }
                },
                // 0.5s fade in LEVEL UP
                {
                    alpha: 1,
                    duration: 500
                }
            ]
        });
    }

    // Start the sequence
    createTextSwitchSequence();

    // Show KAJISULI stats if in KAJISULI mode
    if (KAJISULI_MODE) {
        const statsElements = PauseSystem.showStatsDisplay(scene, {
            container: levelUpContainer,
            positionY: game.config.height * 0.95,
            storeInElements: false,
            clearContainer: false,
            setVisible: false,
            fontSize: '36px'
        });

        if (window.StatTooltipSystem && statsElements) {
            const statKeys = ['POW', 'AGI', 'LUK', 'END'];
            statsElements.forEach((statGroup, index) => {
                if (statGroup.border && statKeys[index]) {
                    StatTooltipSystem.addStatHoverInteraction(scene, statGroup.border, statKeys[index], {
                        container: levelUpContainer,
                        isKajisuli: true,
                        isLevelUp: true,
                        onHover: (element) => {
                            element.setStrokeStyle(4, UI.colors.gold);
                            if (statGroup.statText) {
                                statGroup.statText.setScale(1.1);
                            }
                        },
                        onHoverOut: (element) => {
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

    // Calculate card positions in a 2x2 square around center
    const isKajisuli = (typeof KAJISULI_MODE !== 'undefined') ? KAJISULI_MODE : false;

    // Base card dimensions
    let cardWidth = 200;
    let cardHeight = 300;
    let cardFontSize = 1;

    // Scale up for mobile/portrait mode
    if (isKajisuli) {
        cardWidth = 250;
        cardHeight = 375;
        cardFontSize = 1.25;
    }

    // Calculate offset from center to position cards in a square with equal gaps
    const cardOffsetX = cardWidth * 0.725; // Reduced to match vertical spacing
    const cardOffsetY = cardHeight * 0.65;

    const cardPositions = [
        { x: centerX - cardOffsetX, y: centerY - cardOffsetY }, // Top-left
        { x: centerX + cardOffsetX, y: centerY - cardOffsetY }, // Top-right
        { x: centerX - cardOffsetX, y: centerY + cardOffsetY }, // Bottom-left
        { x: centerX + cardOffsetX, y: centerY + cardOffsetY }  // Bottom-right
    ];

    // Create all card elements
    const allCardElements = [];

    availablePerks.forEach((perk, index) => {
        if (index >= 4) return; // Safety check

        const position = cardPositions[index];
        const cardElements = createPerkCardElements(perk, position.x, position.y, {
            container: levelUpContainer,
            makeInteractive: true,
            showDiamonds: true,
            enablePulse: true,
            pulseSpeed: 4,
            width: cardWidth,
            height: cardHeight,
            fontSize: cardFontSize,
            perkCallback: (perkId) => {
                handleCardSelection(index, perkId);
            }
        });

        allCardElements.push({
            index: index,
            perkId: perk.id,
            elements: cardElements,
            position: position
        });
    });

    function handleCardSelection(cardIndex, perkId) {
        if (selectedCardIndex === cardIndex) {
            // Second click on same card - confirm selection
            confirmSelection(perkId);
        } else {
            // First click or different card - show selection
            selectCard(cardIndex, perkId);
        }
    }

    function selectCard(cardIndex, perkId) {
        // Stop the text switching timeline FIRST
        if (textSwitchTimeline) {
            textSwitchTimeline.destroy();
            textSwitchTimeline = null;
        }

        // Remove previous selection effects if they exist
        if (selectionBorder) {
            selectionBorder.destroy();
            selectionBorder = null;
        }
        if (selectionOverlay) {
            selectionOverlay.destroy();
            selectionOverlay = null;
        }
        if (selectionPulseTween) {
            selectionPulseTween.remove();
            selectionPulseTween = null;
        }

        // Stop any existing confirmation tween - THIS FIXES THE BUG
        if (confirmationTween) {
            confirmationTween.remove();
            confirmationTween = null;
        }

        selectedCardIndex = cardIndex;
        selectedCardElements = allCardElements[cardIndex];

        // Get the selected perk to access its color
        const selectedPerk = availablePerks[cardIndex];
        const position = selectedCardElements.position;

        // Create golden selection border
        const borderGap = 4;
        const borderThickness = 4;

        selectionBorder = scene.add.rectangle(
            position.x,
            position.y,
            cardWidth + (borderGap * 2) + (borderThickness * 2),
            cardHeight + (borderGap * 2) + (borderThickness * 2)
        );
        selectionBorder.setStrokeStyle(borderThickness, 0xFFD700);
        selectionBorder.setFillStyle(0x000000, 0);
        levelUpContainer.add(selectionBorder);

        // Create pulsing colored overlay using the perk's hover color
        const overlayColor = selectedPerk.hoverColor ?? selectedPerk.color ?? 0x666666;

        selectionOverlay = scene.add.rectangle(
            position.x,
            position.y,
            cardWidth,
            cardHeight,
            overlayColor,
            0.3 // Starting alpha
        );
        levelUpContainer.add(selectionOverlay);

        // Animate both the border and the colored overlay
        scene.tweens.add({
            targets: selectionBorder,
            alpha: 0.6,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Pulsing colored overlay effect
        selectionPulseTween = scene.tweens.add({
            targets: selectionOverlay,
            alpha: 0.6,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // COMPLETELY reset text state, then set confirmation message
        scene.tweens.killTweensOf(centerText); // Kill any remaining tweens on the text object
        centerText.setText('SEAL YOUR FATE');
        centerText.setColor('#ffffff');
        centerText.setAlpha(1); // Force full opacity - no fading
        centerText.setScale(1); // Reset scale

        // Start trembling animation for confirmation text (matching colored overlay pulse timing)
        confirmationTween = scene.tweens.add({
            targets: centerText,
            scale: 1.04,
            duration: 1000, // Match the colored overlay pulse duration
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    function confirmSelection(perkId) {
        // Acquire the selected perk
        acquirePerk(scene, perkId);
        GameUI.updateStatCircles(scene);
        GameUI.updateHealthBar(scene);

        // Clean up concentric circles effect
        if (concentricCircles) {
            concentricCircles.destroy();
        }

        // Clean up all card elements (including pulse wrappers)
        allCardElements.forEach(cardGroup => {
            cardGroup.elements.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
        });

        // Clean up selection border and overlay
        if (selectionBorder) {
            selectionBorder.destroy();
            selectionBorder = null;
        }
        if (selectionOverlay) {
            selectionOverlay.destroy();
            selectionOverlay = null;
        }

        // Stop animations and timers
        if (textSwitchTimeline) {
            textSwitchTimeline.destroy();
        }
        if (confirmationTween) {
            confirmationTween.remove();
        }
        if (selectionPulseTween) {
            selectionPulseTween.remove();
        }

        // Destroy the container
        levelUpContainer.destroy();
        levelUpCards = [];

        window.levelUpInProgress = false;
        PlayerHitSystem.makePlayerInvincible(scene);

        setTimeout(() => {
            if (heroExp >= xpForNextLevel(playerLevel) && !window.levelUpInProgress) {
                window.levelUpInProgress = true;
                levelUp.call(scene);
            } else {
                PauseSystem.resumeGame();
                if (window.ButtonStateManager) {
                    window.ButtonStateManager.onGameResume(scene);
                }
            }
        }, 100);
    }

    // Store reference for cleanup
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

// Update CardSystem exports to include enhanced cleanup functionality
const CardSystem = {
    createPerkCardElements,
    createPerkCard,
    createCardDiamonds,
    createCardPulse,
    getActiveScene,
    showLevelUpScreen,
    showMobileLevelUpScreen,
    generateRandomPerkCards,
    CARD_COLORS,

    // Enhanced cleanup function that handles both Phaser and HTML elements
    cleanup: function (elements) {
        if (elements && elements.length > 0) {
            elements.forEach(element => {
                if (element && element.destroy) {
                    // Handle both Phaser elements and our custom pulse wrappers
                    element.destroy();
                } else if (element && element.parentNode) {
                    // Handle direct HTML elements (fallback)
                    element.parentNode.removeChild(element);
                }
            });
        }
    },

    // Clean up entire scene
    cleanupScene: function (scene) {
        if (scene.htmlPulses && scene.htmlPulses.length > 0) {
            scene.htmlPulses.forEach(pulseDiv => {
                if (pulseDiv.parentNode) {
                    pulseDiv.parentNode.removeChild(pulseDiv);
                }
            });
            scene.htmlPulses = [];
        }
    }
};

// Export CardSystem for use in other files
window.CardSystem = CardSystem;