// statdefs.js - Stat definitions and tooltip system

// Stat definitions with explanations
const STAT_DEFINITIONS = {
    POW: {
        kanji: '力',
        kana: 'ちから',
        romaji: 'chikara',
        english: 'Power',
        description: 'Increases damage dealt by all attacks',
        color: '#cc0000'
    },
    AGI: {
        kanji: '速',
        kana: 'はやさ',
        romaji: 'hayasa',
        english: 'Agility',
        description: 'Increases attack speed and firing rate',
        color: '#0088ff'
    },
    LUK: {
        kanji: '運',
        kana: 'うん',
        romaji: 'un',
        english: 'Luck',
        description: 'Increases chance of special effects',
        color: '#aa55cc'
    },
    END: {
        kanji: '耐',
        kana: 'たいきゅう',
        romaji: 'taikyuu',
        english: 'Endurance',
        description: 'Increases maximum health points',
        color: '#00aa00'
    }
};

// Stat Tooltip System
const StatTooltipSystem = {
    // Currently displayed tooltip elements
    activeTooltip: null,
    activeTooltipContainer: null,

    // Create a stat explanation card
    createStatCard: function (statKey, x, y, options = {}) {
        const stat = STAT_DEFINITIONS[statKey];
        if (!stat) {
            console.error('Invalid stat key:', statKey);
            return null;
        }

        // Format stat as a perk-like object for the card system
        const statAsPerk = {
            id: statKey,
            kanji: stat.kanji,
            kana: stat.kana,
            romaji: stat.romaji,
            english: stat.english,
            description: stat.description,
            color: stat.color
        };

        // Create card using the existing card system
        return CardSystem.createPerkCardElements(
            statAsPerk,
            x,
            y,
            {
                container: options.container,
                showBackground: true,
                showKana: true,
                showRomaji: true,
                showEnglish: true,
                showDescription: true,
                backgroundColor: 0x222222,
                width: options.width ?? 180,
                height: options.height ?? 240,
                strokeWidth: 2,
                strokeColor: stat.color.replace('#', '0x'),
                makeInteractive: false,
                fontSize: options.fontSize ?? 0.9
            }
        );
    },

    // Show tooltip for a stat
    showTooltip: function (scene, statKey, x, y, container = null, isKajisuli = false) {
        // Hide any existing tooltip
        this.hideTooltip();

        // Fixed position approach
        let tooltipX;
        if (isKajisuli) {
            // KAJISULI mode - center of screen
            tooltipX = scene.game.config.width / 2;
        } else {
            // Desktop mode - center of the stat display area
            // POW starts at x=76.7% 
            // Each stat is spaced 5.83% apart, and each stat is 4.17% wide
            // So END starts at 76.7% + (3 * 5.83%) = 94.19%
            // END ends at 94.19% + 4.17% = 98.36%
            // Center between POW start and END end: (76.7% + 98.36%) / 2 = 87.53%
            const statDisplayStart = scene.game.config.width * 0.767;
            const statDisplayEnd = scene.game.config.width * 0.9836;
            tooltipX = (statDisplayStart + statDisplayEnd) / 2;
        }

        // Position below the stats with more clearance
        let tooltipY;
        if (isKajisuli) {
            // In KAJISULI mode, position further down to avoid overlap
            tooltipY = y + 196; // 6 more pixels added
        } else {
            // Desktop mode - position below stats
            tooltipY = y + 150;
        }

        // Ensure tooltip stays within screen bounds
        const adjustedY = Math.min(tooltipY, scene.game.config.height - 150);

        // Scale factor for KAJISULI mode
        const fontSize = isKajisuli ? 1.25 : 0.9;
        const cardHeight = isKajisuli ? 300 : 240;
        const cardWidth = isKajisuli ? 225 : 180;

        // Create the tooltip at fixed position
        this.activeTooltip = this.createStatCard(statKey, tooltipX, adjustedY, {
            container: container,
            fontSize: fontSize,
            height: cardHeight,
            width: cardWidth
        });

        // Store reference to container if provided
        this.activeTooltipContainer = container;
    },

    // Hide current tooltip
    hideTooltip: function () {
        if (this.activeTooltip) {
            this.activeTooltip.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            this.activeTooltip = null;
        }
        this.activeTooltipContainer = null;
    },

    // Add hover interactions to a stat display element
    addStatHoverInteraction: function (scene, element, statKey, options = {}) {
        if (!element || !element.setInteractive) return;

        console.log(`Adding hover interaction for stat: ${statKey}`);

        // Make the element interactive
        element.setInteractive({ useHandCursor: true });

        // Hover in - show tooltip
        element.on('pointerover', () => {
            console.log(`Hover over ${statKey}`);
            const bounds = element.getBounds();
            this.showTooltip(
                scene,
                statKey,
                bounds.centerX,
                bounds.centerY,
                options.container,
                options.isKajisuli ?? false
            );

            // Visual feedback on the element
            if (options.onHover) {
                options.onHover(element);
            }
        });

        // Hover out - hide tooltip
        element.on('pointerout', () => {
            console.log(`Hover out ${statKey}`);
            this.hideTooltip();

            // Reset visual feedback
            if (options.onHoverOut) {
                options.onHoverOut(element);
            }
        });

        // Debug: Check if events are properly attached
        console.log(`Events attached to ${statKey}:`, element.eventNames());
    },

    // Clean up all tooltips
    cleanup: function () {
        this.hideTooltip();
    }
};

// Export for use in other files
window.StatTooltipSystem = StatTooltipSystem;
window.STAT_DEFINITIONS = STAT_DEFINITIONS;