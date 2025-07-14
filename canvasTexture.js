// Canvas Texture Rendering System for Kanji Enemies and Projectiles
// Generates optimized sprite textures for kanji characters and projectiles

const KanjiTextureSystem = {
    // Cache for generated textures
    textureCache: new Map(),
    sessionTextures: new Set(),

    // Configuration
    config: {
        textureSize: 128,
        antiAlias: true
    },

    // Initialize the system
    init: function (scene) {
        this.scene = scene;
        console.log("KanjiTextureSystem initialized");
    },

    // Generate a unique texture key for caching
    generateTextureKey: function (kanji, fontSize, color) {
        const normalizedColor = color.replace('#', '').toLowerCase();
        return `kanji_${kanji}_${fontSize}_${normalizedColor}`;
    },

    // Generate a unique texture key for projectiles
    generateProjectileTextureKey: function (symbol, fontSize, color) {
        const normalizedColor = color.replace('#', '').toLowerCase();
        return `projectile_${symbol}_${fontSize}_${normalizedColor}`;
    },

    // Create a canvas texture for a kanji character
    createKanjiTexture: function (kanji, fontSize, color) {
        const textureKey = this.generateTextureKey(kanji, fontSize, color);

        // Return existing texture if already cached
        if (this.textureCache.has(textureKey)) {
            return textureKey;
        }

        // Calculate texture size based on font size
        const textureSize = Math.max(this.config.textureSize, fontSize * 2);

        try {
            // Create canvas texture in Phaser
            const canvas = this.scene.textures.createCanvas(textureKey, textureSize, textureSize);
            const context = canvas.getContext();

            // Configure text rendering
            context.font = `${fontSize}px Arial`;
            context.fillStyle = color;
            context.textAlign = 'center';
            context.textBaseline = 'middle';

            if (this.config.antiAlias) {
                context.imageSmoothingEnabled = true;
                context.imageSmoothingQuality = 'high';
            }

            // Clear canvas
            context.clearRect(0, 0, textureSize, textureSize);

            // Calculate position with baseline adjustment to match Phaser text behavior
            const centerX = textureSize / 2;
            const centerY = textureSize / 2;
            const baselineAdjustment = fontSize * 0.05; // Fine-tuned for proper alignment
            const adjustedY = centerY + baselineAdjustment;

            // Draw the kanji
            context.fillText(kanji, centerX, adjustedY);

            // Refresh the canvas texture
            canvas.refresh();

            // Cache the texture
            this.textureCache.set(textureKey, textureKey);
            this.sessionTextures.add(textureKey);

            return textureKey;

        } catch (error) {
            console.error(`Failed to create texture for kanji ${kanji}:`, error);
            return null;
        }
    },

    // Create a canvas texture for a projectile
    createProjectileTexture: function (symbol, fontSize, color) {
        const textureKey = this.generateProjectileTextureKey(symbol, fontSize, color);

        // Return existing texture if already cached
        if (this.textureCache.has(textureKey)) {
            return textureKey;
        }

        // Calculate texture size based on font size
        const textureSize = Math.max(this.config.textureSize, fontSize * 2);

        try {
            // Create canvas texture in Phaser
            const canvas = this.scene.textures.createCanvas(textureKey, textureSize, textureSize);
            const context = canvas.getContext();

            // Check if this is an invisible projectile
            const isInvisible = this.isInvisibleSymbol(symbol);

            if (isInvisible) {
                // For invisible projectiles, just create a transparent texture
                // Clear canvas (already transparent by default)
                context.clearRect(0, 0, textureSize, textureSize);
                // Don't draw anything - leave it transparent
            } else {
                // Configure text rendering with bold style for projectiles
                context.font = `bold ${fontSize}px Arial`;
                context.fillStyle = color;
                context.textAlign = 'center';
                context.textBaseline = 'middle';

                if (this.config.antiAlias) {
                    context.imageSmoothingEnabled = true;
                    context.imageSmoothingQuality = 'high';
                }

                // Clear canvas
                context.clearRect(0, 0, textureSize, textureSize);

                // Calculate position with baseline adjustment
                const centerX = textureSize / 2;
                const centerY = textureSize / 2;
                const baselineAdjustment = fontSize * 0.05;
                const adjustedY = centerY + baselineAdjustment;

                // Draw the projectile symbol
                context.fillText(symbol, centerX, adjustedY);
            }

            // Refresh the canvas texture
            canvas.refresh();

            // Cache the texture
            this.textureCache.set(textureKey, textureKey);
            this.sessionTextures.add(textureKey);

            return textureKey;

        } catch (error) {
            console.error(`Failed to create texture for projectile ${symbol}:`, error);
            return null;
        }
    },

    // Helper function to check if a symbol should be invisible
    isInvisibleSymbol: function (symbol) {
        // Check for invisible characters or empty strings
        return !symbol ||
            symbol === '' ||
            symbol === '　' || // Full-width space (invisible character)
            symbol.trim() === '';
    },

    // Create an enemy sprite using canvas texture
    createEnemySprite: function (scene, enemyType, x, y) {
        const enemyData = getEnemyData(enemyType);

        // Generate texture
        const textureKey = this.createKanjiTexture(
            enemyType,
            enemyData.size,
            enemyData.color
        );

        if (!textureKey) {
            throw new Error(`Failed to create texture for enemy: ${enemyType}`);
        }

        // Create sprite
        const enemy = scene.add.sprite(x, y, textureKey);
        enemy.setOrigin(0.5);

        // Store properties for compatibility and collision
        enemy.text = enemyType; // For compatibility with existing systems
        enemy.actualWidth = enemyData.size;
        enemy.actualHeight = enemyData.size;
        enemy.enemyType = 'sprite';
        enemy.originalTint = 0xffffff;

        // Store enemy data
        enemy.health = Math.ceil(currentEnemyHealth * enemyData.healthMultiplier);
        enemy.speed = Phaser.Math.Between(enemyData.speedMin, enemyData.speedMax);
        enemy.damage = enemyData.damage;
        enemy.rank = enemyData.rank;
        enemy.expValue = enemyData.expValue || 1;
        enemy.kana = enemyData.kana;
        enemy.romaji = enemyData.romaji;
        enemy.english = enemyData.english;

        return enemy;
    },

    // Create a projectile sprite using canvas texture
    createProjectileSprite: function (scene, config) {
        const defaults = {
            symbol: '★',
            color: '#ffff00',
            fontSize: 16
        };

        const projConfig = { ...defaults, ...config };

        // Generate texture
        const textureKey = this.createProjectileTexture(
            projConfig.symbol,
            projConfig.fontSize,
            projConfig.color
        );

        if (!textureKey) {
            throw new Error(`Failed to create texture for projectile: ${projConfig.symbol}`);
        }

        // Create sprite
        const projectile = scene.add.sprite(projConfig.x, projConfig.y, textureKey);
        projectile.setOrigin(0.5);

        // Store properties for compatibility
        projectile.text = projConfig.symbol; // For compatibility with existing systems
        projectile.actualWidth = projConfig.fontSize;
        projectile.actualHeight = projConfig.fontSize;
        projectile.projectileType = 'sprite';
        projectile.originalTint = 0xffffff;

        // Store the original texture key for effect helpers
        projectile.originalTexture = textureKey;

        return projectile;
    },

    // Clean up session textures
    clearSessionTextures: function () {
        this.sessionTextures.forEach(textureKey => {
            if (this.scene && this.scene.textures.exists(textureKey)) {
                this.scene.textures.remove(textureKey);
            }
        });

        this.textureCache.clear();
        this.sessionTextures.clear();
        console.log("Canvas textures cleared");
    },

    // Get cache statistics
    getCacheStats: function () {
        return {
            cachedTextures: this.textureCache.size,
            sessionTextures: this.sessionTextures.size
        };
    }
};

// Helper functions for sprite effect compatibility
const SpriteEffectHelpers = {
    applyEffectColorTexture: function (enemy, color, scene) {
        if (enemy.enemyType === 'sprite') {
            // Store original texture
            if (!enemy.originalTexture) {
                enemy.originalTexture = enemy.texture.key;
            }

            // Create a new tinted texture key
            const tintedKey = `${enemy.originalTexture}_${color.replace('#', '')}`;

            // Check if we already have this tinted texture
            if (!scene.textures.exists(tintedKey)) {
                // Get the original kanji character from the texture key
                const kanjiMatch = enemy.originalTexture.match(/kanji_(.+)_\d+_/);
                if (kanjiMatch) {
                    const kanji = kanjiMatch[1];
                    const sizeMatch = enemy.originalTexture.match(/_(\d+)_/);
                    const fontSize = sizeMatch ? parseInt(sizeMatch[1]) : 32;

                    // Create new colored texture directly using the kanji rendering system
                    const canvas = scene.textures.createCanvas(tintedKey,
                        Math.max(KanjiTextureSystem.config.textureSize, fontSize * 2),
                        Math.max(KanjiTextureSystem.config.textureSize, fontSize * 2)
                    );
                    const context = canvas.getContext();

                    // Configure text rendering with the new color
                    context.font = `${fontSize}px Arial`;
                    context.fillStyle = color;
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';

                    if (KanjiTextureSystem.config.antiAlias) {
                        context.imageSmoothingEnabled = true;
                        context.imageSmoothingQuality = 'high';
                    }

                    // Clear and draw
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    const centerX = canvas.width / 2;
                    const centerY = canvas.height / 2;
                    const baselineAdjustment = fontSize * 0.05;
                    const adjustedY = centerY + baselineAdjustment;

                    context.fillText(kanji, centerX, adjustedY);
                    canvas.refresh();

                    // Track this texture for cleanup
                    KanjiTextureSystem.sessionTextures.add(tintedKey);
                }
            }

            // Switch to the tinted texture
            enemy.setTexture(tintedKey);
        } else {
            // Fallback for text enemies
            if (!enemy.originalColor) {
                enemy.originalColor = enemy.style.color || '#ffffff';
            }
            enemy.setColor(color);
        }
    },

    // Apply effect color to projectiles (similar to enemies)
    applyEffectColorProjectile: function (projectile, color, scene) {
        if (projectile.projectileType === 'sprite') {
            // Store original texture
            if (!projectile.originalTexture) {
                projectile.originalTexture = projectile.texture.key;
            }

            // Create a new tinted texture key
            const tintedKey = `${projectile.originalTexture}_${color.replace('#', '')}`;

            // Check if we already have this tinted texture
            if (!scene.textures.exists(tintedKey)) {
                // Parse the original texture key more robustly
                // Format: projectile_SYMBOL_FONTSIZE_COLOR
                const parts = projectile.originalTexture.split('_');

                if (parts.length >= 4 && parts[0] === 'projectile') {
                    // Get the last two parts (fontSize and originalColor)
                    const originalColor = parts[parts.length - 1];
                    const fontSize = parseInt(parts[parts.length - 2]);

                    // Everything between 'projectile_' and the last two parts is the symbol
                    const symbol = parts.slice(1, parts.length - 2).join('_');

                    if (!isNaN(fontSize) && symbol) {
                        // Create new colored texture
                        const canvas = scene.textures.createCanvas(tintedKey,
                            Math.max(KanjiTextureSystem.config.textureSize, fontSize * 2),
                            Math.max(KanjiTextureSystem.config.textureSize, fontSize * 2)
                        );
                        const context = canvas.getContext();

                        // Check if this should be invisible
                        const isInvisible = KanjiTextureSystem.isInvisibleSymbol(symbol);

                        if (isInvisible) {
                            // For invisible projectiles, just create a transparent texture
                            context.clearRect(0, 0, canvas.width, canvas.height);
                        } else {
                            // Configure text rendering with the new color
                            context.font = `bold ${fontSize}px Arial`;
                            context.fillStyle = color;
                            context.textAlign = 'center';
                            context.textBaseline = 'middle';

                            if (KanjiTextureSystem.config.antiAlias) {
                                context.imageSmoothingEnabled = true;
                                context.imageSmoothingQuality = 'high';
                            }

                            // Clear and draw
                            context.clearRect(0, 0, canvas.width, canvas.height);
                            const centerX = canvas.width / 2;
                            const centerY = canvas.height / 2;
                            const baselineAdjustment = fontSize * 0.05;
                            const adjustedY = centerY + baselineAdjustment;

                            context.fillText(symbol, centerX, adjustedY);
                        }

                        canvas.refresh();

                        // Track this texture for cleanup
                        KanjiTextureSystem.sessionTextures.add(tintedKey);
                    } else {
                        console.warn('Failed to parse projectile texture key:', projectile.originalTexture);
                        return; // Don't change texture if parsing failed
                    }
                } else {
                    console.warn('Invalid projectile texture key format:', projectile.originalTexture);
                    return; // Don't change texture if format is invalid
                }
            }

            // Switch to the tinted texture
            projectile.setTexture(tintedKey);
        } else {
            // Fallback for text projectiles
            if (!projectile.originalColor) {
                projectile.originalColor = projectile.style.color || '#ffffff';
            }
            projectile.setColor(color);
        }
    },

    // Reset to original appearance
    resetEffectColor: function (entity) {
        if (entity.enemyType === 'sprite' || entity.projectileType === 'sprite') {
            // Reset blend mode method
            if (entity.originalBlendMode !== undefined) {
                entity.setBlendMode(entity.originalBlendMode);
                entity.setTint(entity.originalTint);
            }

            // Reset overlay method
            if (entity.colorOverlay) {
                entity.colorOverlay.destroy();
                entity.colorOverlay = null;
                entity.updateOverlay = null;
            }

            // Reset texture method
            if (entity.originalTexture) {
                entity.setTexture(entity.originalTexture);
            }
        } else if (entity.originalColor) {
            entity.setColor(entity.originalColor);
        }
    },

    // Convert hex color to tint value
    hexToTint: function (hexColor) {
        if (typeof hexColor === 'string') {
            return parseInt(hexColor.replace('#', '0x'), 16);
        }
        return hexColor;
    }
};

// Export systems
window.KanjiTextureSystem = KanjiTextureSystem;
window.SpriteEffectHelpers = SpriteEffectHelpers;

// Initialize function for game startup
window.initKanjiOptimization = function (scene) {
    KanjiTextureSystem.init(scene);
    console.log("Canvas texture optimization initialized");
};

// Cleanup function for game restart
window.cleanupKanjiOptimization = function () {
    KanjiTextureSystem.clearSessionTextures();
};

console.log("Enhanced canvas texture system loaded");