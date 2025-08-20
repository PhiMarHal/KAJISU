// statdefs.js - Stat definitions and tooltip system

// Stat definitions with explanations
const STAT_DEFINITIONS = {
    POW: {
        kanji: '力',
        kana: 'ちから',
        romaji: 'chikara',
        english: 'Power',
        description: 'Damage on all powers',
        color: '#cc0000'
    },
    AGI: {
        kanji: '速',
        kana: 'はやさ',
        romaji: 'hayasa',
        english: 'Agility',
        description: 'Firing rate and distance',
        color: '#0088ff'
    },
    LUK: {
        kanji: '運',
        kana: 'うん',
        romaji: 'un',
        english: 'Luck',
        description: 'Chance for effects, cooldowns',
        color: '#aa55cc'
    },
    END: {
        kanji: '耐',
        kana: 'たいきゅう',
        romaji: 'taikyuu',
        english: 'Endurance',
        description: 'Health and regeneration',
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
        const scene = game.scene.scenes[0];
        if (!scene) return null;

        return UnifiedCardSystem.createCard(scene, statKey, { x, y }, 'tooltip', {
            cardType: UnifiedCardSystem.CARD_TYPES.STAT,
            container: options.container,
            width: options.width,
            height: options.height,
            fontSize: options.fontSize
        });
    },

    // Show tooltip for a stat
    showTooltip: function (scene, statKey, x, y, container = null, isKajisuli = false, isLevelUp = false) {
        // Hide existing
        this.hideTooltip();

        // Create tooltip using unified system
        const mockElement = {
            x,
            y,
            getBounds: () => ({ centerX: x, centerY: y })
        };

        const card = UnifiedCardSystem.createTooltip(scene, statKey, mockElement, {
            container,
            cardType: UnifiedCardSystem.CARD_TYPES.STAT,
            isKajisuli,
            isLevelUp
        });

        this.activeTooltip = card.elements;
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

        return UnifiedCardSystem.hoverSystem.addHover(element, {
            onHover: options.onHover,
            onHoverOut: options.onHoverOut,
            showTooltip: () => {
                const bounds = element.getBounds();
                this.showTooltip(
                    scene,
                    statKey,
                    bounds.centerX,
                    bounds.centerY,
                    options.container,
                    options.isKajisuli ?? false,
                    options.isLevelUp ?? false
                );
            },
            hideTooltip: () => {
                this.hideTooltip();
            }
        });
    },

    // Clean up all tooltips
    cleanup: function () {
        this.hideTooltip();
    }
};

// Export for use in other files
window.StatTooltipSystem = StatTooltipSystem;
window.STAT_DEFINITIONS = STAT_DEFINITIONS;