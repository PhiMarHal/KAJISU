// unifiedCards.js - Unified Card Generation System for KAJISULI

const UnifiedCardSystem = {
    // Card type definitions
    CARD_TYPES: {
        PERK: 'perk',
        STAT: 'stat',
        CUSTOM: 'custom'
    },

    // Context definitions for different usage scenarios
    CONTEXTS: {
        LEVELUP: 'levelup',
        TOOLTIP: 'tooltip',
        PAUSE_GRID: 'pause_grid',
        PAUSE_STATS: 'pause_stats'
    },

    // Default configurations for different contexts
    contextConfigs: {
        levelup: {
            width: 200,
            height: 300,
            fontSize: 1,
            backgroundColor: 0x444444,
            strokeColor: 0xeeeeee,
            strokeWidth: 2,
            showBackground: true,
            showKana: true,
            showRomaji: true,
            showEnglish: true,
            showDescription: true,
            kajisuliScale: { width: 1.5, height: 1.5, fontSize: 1.5 }
        },
        tooltip: {
            width: 180,
            height: 240,
            fontSize: 0.9,
            backgroundColor: 0x222222,
            strokeColor: 0xeeeeee,
            strokeWidth: 2,
            showBackground: true,
            showKana: true,
            showRomaji: true,
            showEnglish: true,
            showDescription: true,
            kajisuliScale: { width: 1.25, height: 1.25, fontSize: 1.25 }
        },
        pause_grid: {
            width: 200,
            height: 300,
            fontSize: 1,
            backgroundColor: 0x333333,
            strokeColor: 0xeeeeee,
            strokeWidth: 3,
            showBackground: true,
            showKana: true,
            showRomaji: true,
            showEnglish: true,
            showDescription: true,
            kajisuliScale: { width: 1.1, height: 1.1, fontSize: 1.2 }
        },
        pause_stats: {
            width: 150,
            height: 60,
            fontSize: 1,
            backgroundColor: 0x000000,
            strokeColor: 0xFFD700,
            strokeWidth: 2,
            showBackground: true,
            showKana: false,
            showRomaji: false,
            showEnglish: false,
            showDescription: false,
            kajisuliScale: { width: 1, height: 1, fontSize: 1.5 }
        }
    },

    // Scaling utilities for flexible KAJISULI adjustments
    scaling: {
        // Apply scaling to a config object
        applyScale: function (config, scaleOverrides = null, forceKajisuli = null) {
            const isKajisuli = forceKajisuli ?? ((typeof KAJISULI_MODE !== 'undefined') ? KAJISULI_MODE : false);

            if (!isKajisuli) return config;

            const result = { ...config };

            // Use override scale if provided, otherwise use context scale
            const scale = scaleOverrides ?? config.kajisuliScale;

            if (scale) {
                if (scale.width !== undefined) result.width *= scale.width;
                if (scale.height !== undefined) result.height *= scale.height;
                if (scale.fontSize !== undefined) result.fontSize *= scale.fontSize;
                if (scale.strokeWidth !== undefined) result.strokeWidth *= scale.strokeWidth;
            }

            return result;
        },

        // Create custom scale object
        createScale: function (widthScale = 1, heightScale = 1, fontScale = 1, strokeScale = 1) {
            return {
                width: widthScale,
                height: heightScale,
                fontSize: fontScale,
                strokeWidth: strokeScale
            };
        },

        // Common scale presets
        presets: {
            NONE: { width: 1, height: 1, fontSize: 1, strokeWidth: 1 },
            LARGE: { width: 1.5, height: 1.5, fontSize: 1.5, strokeWidth: 1 },
            MEDIUM: { width: 1.25, height: 1.25, fontSize: 1.25, strokeWidth: 1 },
            SMALL: { width: 1.1, height: 1.1, fontSize: 1.2, strokeWidth: 1 },
            FONT_ONLY: { width: 1, height: 1, fontSize: 1.5, strokeWidth: 1 },
            THIN: { width: 1.4, height: 1, fontSize: 0.9, strokeWidth: 1 }
        }
    },

    // Position calculation utilities
    positioning: {
        // Calculate grid positions
        calculateGridPositions: function (itemCount, perRow, spacing, containerWidth, containerHeight, startY) {
            const positions = [];
            const rows = Math.ceil(itemCount / perRow);
            const totalWidth = perRow * spacing.item + (perRow - 1) * spacing.gap;
            const startX = (containerWidth - totalWidth) / 2 + spacing.item / 2;

            for (let i = 0; i < itemCount; i++) {
                const row = Math.floor(i / perRow);
                const col = i % perRow;
                positions.push({
                    x: startX + col * (spacing.item + spacing.gap),
                    y: startY + row * spacing.row
                });
            }

            return positions;
        },

        // Calculate tooltip position
        calculateTooltipPosition: function (targetX, targetY, cardWidth, cardHeight, screenWidth, screenHeight, isKajisuli, isLevelUp) {
            let x, y;

            if (isKajisuli) {
                x = screenWidth / 2;
                if (isLevelUp) {
                    // Position tooltip below level-up card but above stats
                    // Level-up card is around centerY, stats are at bottom
                    const centerY = screenHeight / 2;
                    const statsY = screenHeight * 0.85; // Approximate stats position
                    y = centerY + (statsY - centerY) * 0.85; // 30% of the way down from center to stats
                } else {
                    y = targetY + cardHeight / 2 + 20; // Position below for pause mode
                }
            } else {
                // Desktop mode - center in stat display area
                const statDisplayStart = screenWidth * 0.767;
                const statDisplayEnd = screenWidth * 0.9836;
                x = (statDisplayStart + statDisplayEnd) / 2;
                y = targetY + 150;
            }

            // Keep within bounds
            x = Math.max(cardWidth / 2, Math.min(x, screenWidth - cardWidth / 2));
            y = Math.max(cardHeight / 2, Math.min(y, screenHeight - cardHeight / 2));

            return { x, y };
        },

        // Calculate modal center position
        calculateModalPosition: function (screenWidth, screenHeight) {
            return {
                x: screenWidth / 2,
                y: screenHeight / 2
            };
        }
    },

    // Hover interaction management
    hoverSystem: {
        activeHovers: new Map(),

        // Add hover interaction to an element
        addHover: function (element, config) {
            const hoverId = Symbol('hover');

            element.setInteractive({ useHandCursor: true });

            const overHandler = () => {
                if (config.onHover) config.onHover(element);
                if (config.showTooltip) {
                    config.showTooltip();
                }
            };

            const outHandler = () => {
                if (config.onHoverOut) config.onHoverOut(element);
                if (config.hideTooltip) {
                    config.hideTooltip();
                }
            };

            element.on('pointerover', overHandler);
            element.on('pointerout', outHandler);

            this.activeHovers.set(hoverId, {
                element,
                overHandler,
                outHandler
            });

            return hoverId;
        },

        // Remove hover interaction
        removeHover: function (hoverId) {
            const hover = this.activeHovers.get(hoverId);
            if (hover) {
                hover.element.off('pointerover', hover.overHandler);
                hover.element.off('pointerout', hover.outHandler);
                this.activeHovers.delete(hoverId);
            }
        },

        // Clear all hover interactions
        clearAll: function () {
            this.activeHovers.forEach((hover, id) => {
                this.removeHover(id);
            });
        }
    },

    // Main card creation function
    createCard: function (scene, data, position, context = 'tooltip', options = {}) {
        if (!scene || !scene.add) {
            console.error("Invalid scene provided to createCard");
            return null;
        }

        // Get base config for context
        const baseConfig = this.contextConfigs[context] || this.contextConfigs.tooltip;

        // Handle scaling options
        const scaleOptions = {
            override: options.kajisuliScale,
            force: options.forceKajisuli,
            disable: options.disableKajisuliScale
        };

        // Apply scaling (or not) based on options
        let config = { ...baseConfig };
        if (!scaleOptions.disable) {
            config = this.scaling.applyScale(config, scaleOptions.override, scaleOptions.force);
        }

        // Apply custom options (after scaling so they can override)
        config = { ...config, ...options };

        // Convert data to card format if needed
        const cardData = this.normalizeCardData(data, config.cardType || this.CARD_TYPES.PERK);

        // Create card elements using existing system
        const elements = this.createCardElements(scene, cardData, position, config);

        return {
            elements,
            config,
            data: cardData,
            position
        };
    },

    // Create multiple cards with automatic positioning
    createCardGrid: function (scene, dataArray, gridConfig, context = 'pause_grid', options = {}) {
        const { container, perRow = 4, spacing = { item: 220, gap: 20, row: 80 }, startY = 200 } = gridConfig;

        const positions = this.positioning.calculateGridPositions(
            dataArray.length,
            perRow,
            spacing,
            scene.game.config.width,
            scene.game.config.height,
            startY
        );

        const cards = [];
        dataArray.forEach((data, index) => {
            if (positions[index]) {
                const card = this.createCard(scene, data, positions[index], context, {
                    container,
                    ...options
                });
                cards.push(card);
            }
        });

        return cards;
    },

    // Create tooltip card
    createTooltip: function (scene, data, targetElement, options = {}) {
        const bounds = targetElement.getBounds ? targetElement.getBounds() :
            { centerX: targetElement.x, centerY: targetElement.y };

        const position = this.positioning.calculateTooltipPosition(
            bounds.centerX,
            bounds.centerY,
            this.contextConfigs.tooltip.width,
            this.contextConfigs.tooltip.height,
            scene.game.config.width,
            scene.game.config.height,
            options.isKajisuli || false,
            options.isLevelUp || false
        );

        return this.createCard(scene, data, position, 'tooltip', options);
    },

    // Normalize different data types to card format
    normalizeCardData: function (data, cardType) {
        switch (cardType) {
            case this.CARD_TYPES.STAT:
                return this.convertStatToCard(data);
            case this.CARD_TYPES.PERK:
                return this.convertPerkToCard(data);
            case this.CARD_TYPES.CUSTOM:
                return data; // Assume already in correct format
            default:
                return data;
        }
    },

    // Convert stat data to card format
    convertStatToCard: function (statKey) {
        const statDef = window.STAT_DEFINITIONS?.[statKey];
        if (!statDef) return null;

        return {
            id: statKey,
            kanji: statDef.kanji,
            kana: statDef.kana,
            romaji: statDef.romaji,
            english: statDef.english,
            description: statDef.description,
            color: statDef.color
        };
    },

    // Convert perk data to card format
    convertPerkToCard: function (perkId) {
        const PERKS = window.PERKS || {};
        const perk = PERKS[perkId];
        if (!perk) return null;

        return {
            id: perkId,
            ...perk
        };
    },

    // Core card element creation (delegates to existing system)
    createCardElements: function (scene, cardData, position, config) {
        if (!cardData) {
            console.error("No card data provided");
            return [];
        }

        // Use existing CardSystem.createPerkCardElements
        return window.CardSystem.createPerkCardElements(cardData, position.x, position.y, {
            container: config.container,
            showBackground: config.showBackground,
            showKana: config.showKana,
            showRomaji: config.showRomaji,
            showEnglish: config.showEnglish,
            showDescription: config.showDescription,
            backgroundColor: config.backgroundColor,
            width: config.width,
            height: config.height,
            strokeWidth: config.strokeWidth,
            strokeColor: config.strokeColor,
            makeInteractive: config.makeInteractive,
            perkCallback: config.perkCallback,
            fontSize: config.fontSize
        });
    },

    // Utility functions for common operations
    utils: {
        // Get responsive font size with flexible scaling
        getResponsiveSize: function (baseSize, context = 'tooltip', scaleOverride = null) {
            const config = UnifiedCardSystem.contextConfigs[context];
            const scaledConfig = UnifiedCardSystem.scaling.applyScale(
                { fontSize: baseSize },
                scaleOverride ?? config?.kajisuliScale
            );
            return scaledConfig.fontSize;
        },

        // Calculate card bounds with potential scaling
        getCardBounds: function (position, width, height, context = null, scaleOverride = null) {
            let finalWidth = width;
            let finalHeight = height;

            if (context) {
                const config = UnifiedCardSystem.contextConfigs[context];
                const scaled = UnifiedCardSystem.scaling.applyScale(
                    { width, height },
                    scaleOverride ?? config?.kajisuliScale
                );
                finalWidth = scaled.width;
                finalHeight = scaled.height;
            }

            return {
                x: position.x - finalWidth / 2,
                y: position.y - finalHeight / 2,
                width: finalWidth,
                height: finalHeight,
                centerX: position.x,
                centerY: position.y
            };
        },

        // Destroy card elements safely
        destroyCard: function (card) {
            if (card && card.elements) {
                card.elements.forEach(element => {
                    if (element && element.destroy) {
                        element.destroy();
                    }
                });
            }
        },

        // Create a scale override for specific situations
        createCustomScale: function (options = {}) {
            return UnifiedCardSystem.scaling.createScale(
                options.width,
                options.height,
                options.fontSize,
                options.strokeWidth
            );
        }
    }
};

// Export the unified system
window.UnifiedCardSystem = UnifiedCardSystem;