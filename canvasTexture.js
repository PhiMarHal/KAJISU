// Canvas Texture Rendering System for Kanji Enemies
// Generates optimized sprite textures for kanji characters

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

    // Reset to original appearance
    resetEffectColor: function (enemy) {
        if (enemy.enemyType === 'sprite') {
            // Reset blend mode method
            if (enemy.originalBlendMode !== undefined) {
                enemy.setBlendMode(enemy.originalBlendMode);
                enemy.setTint(enemy.originalTint);
            }

            // Reset overlay method
            if (enemy.colorOverlay) {
                enemy.colorOverlay.destroy();
                enemy.colorOverlay = null;
                enemy.updateOverlay = null;
            }

            // Reset texture method
            if (enemy.originalTexture) {
                enemy.setTexture(enemy.originalTexture);
            }
        } else if (enemy.originalColor) {
            enemy.setColor(enemy.originalColor);
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

console.log("Lean canvas texture system loaded");