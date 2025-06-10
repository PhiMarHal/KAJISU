// Canvas Texture Rendering System for Kanji Enemies
// Dynamically generates texture once per kanji, then uses fast sprite rendering

const KanjiTextureSystem = {
    // Cache for generated textures
    textureCache: new Map(),

    // Track which textures we've created this session
    sessionTextures: new Set(),

    // Configuration for texture generation
    config: {
        textureSize: 128,        // Base texture size (will scale based on font size)
        padding: 16,             // Padding around kanji in texture
        backgroundColor: null,    // Transparent background
        antiAlias: true          // Smooth text rendering
    },

    // Initialize the system
    init: function (scene) {
        this.scene = scene;
        console.log("KanjiTextureSystem initialized");
    },

    // Generate a unique texture key for caching
    generateTextureKey: function (kanji, fontSize, color) {
        // Remove # from color if present and normalize
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

        // Calculate texture size based on font size with padding
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
            context.textRenderingOptimization = 'optimizeSpeed';

            // Enable antialiasing for better quality
            if (this.config.antiAlias) {
                context.imageSmoothingEnabled = true;
                context.imageSmoothingQuality = 'high';
            }

            // Clear canvas with transparent background
            context.clearRect(0, 0, textureSize, textureSize);

            // Draw the kanji centered in the texture
            const centerX = textureSize / 2;
            const centerY = textureSize / 2;
            context.fillText(kanji, centerX, centerY);

            // Refresh the canvas texture to make it available to Phaser
            canvas.refresh();

            // Cache the texture key
            this.textureCache.set(textureKey, textureKey);
            this.sessionTextures.add(textureKey);

            console.log(`✅ Generated texture for kanji: ${kanji} (${textureKey})`);
            return textureKey;

        } catch (error) {
            console.error(`Failed to create texture for kanji ${kanji}:`, error);
            return null;
        }
    },

    // Create an optimized enemy sprite using canvas texture
    createEnemySprite: function (scene, enemyType, x, y) {
        // Get enemy data (same as before)
        const enemyData = getEnemyData(enemyType);

        // Generate or retrieve texture
        const textureKey = this.createKanjiTexture(
            enemyType,
            enemyData.size,
            enemyData.color
        );

        if (!textureKey) {
            console.log(`❌ Canvas texture failed for ${enemyType}, falling back to text`);
            return this.createFallbackTextEnemy(scene, enemyType, x, y, enemyData);
        }

        // Create sprite using the generated texture
        const enemy = scene.add.sprite(x, y, textureKey);
        enemy.setOrigin(0.5);

        // Store the actual kanji font size for collision calculation
        enemy.actualFontSize = enemyData.size;
        enemy.actualWidth = enemyData.size * 0.8;  // Approximate kanji width (80% of font size)
        enemy.actualHeight = enemyData.size * 0.8; // Approximate kanji height (80% of font size)

        // Store the kanji character as text property for compatibility
        enemy.text = enemyType;
        enemy.kanjiCharacter = enemyType;
        enemy.originalTint = 0xffffff;
        enemy.enemyType = 'sprite';

        // Store enemy data properties
        enemy.health = Math.ceil(currentEnemyHealth * enemyData.healthMultiplier);
        enemy.speed = Phaser.Math.Between(enemyData.speedMin, enemyData.speedMax);
        enemy.damage = enemyData.damage;
        enemy.rank = enemyData.rank;
        enemy.expValue = enemyData.expValue || 1;

        // Store language properties
        enemy.kana = enemyData.kana;
        enemy.romaji = enemyData.romaji;
        enemy.english = enemyData.english;

        console.log(`✅ Created sprite enemy: ${enemyType} using texture ${textureKey} (collision: ${enemy.actualWidth}x${enemy.actualHeight})`);
        return enemy;
    },

    // Fallback to text rendering if canvas texture fails
    createFallbackTextEnemy: function (scene, enemyType, x, y, enemyData) {
        const enemy = scene.add.text(x, y, enemyType, {
            fontFamily: 'Arial',
            fontSize: `${enemyData.size}px`,
            color: enemyData.color
        }).setOrigin(0.5);

        enemy.enemyType = 'text';

        // Store enemy data properties for fallback text enemies too
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

    // Clean up session textures (call when game restarts)
    clearSessionTextures: function () {
        console.log(`Clearing ${this.sessionTextures.size} session textures`);

        // Remove textures from Phaser's texture manager
        this.sessionTextures.forEach(textureKey => {
            if (this.scene && this.scene.textures.exists(textureKey)) {
                this.scene.textures.remove(textureKey);
            }
        });

        // Clear our caches
        this.textureCache.clear();
        this.sessionTextures.clear();
    },

    // Get cache statistics for debugging
    getCacheStats: function () {
        return {
            cachedTextures: this.textureCache.size,
            sessionTextures: this.sessionTextures.size,
            memoryEstimate: `${(this.sessionTextures.size * 0.064).toFixed(1)}MB`
        };
    }
};

// Updated effect system for sprite compatibility
const SpriteCompatibleEffects = {
    // Helper to apply colors to both sprites and text
    applyEffectColor: function (enemy, color) {
        if (enemy.enemyType === 'sprite') {
            // Store original tint if not already stored
            if (enemy.originalTint === undefined) {
                enemy.originalTint = enemy.tint || 0xffffff;
            }
            // Convert hex color to tint value and apply
            const tintValue = this.hexToTint(color);
            enemy.setTint(tintValue);
        } else {
            // Text-based enemy (fallback)
            if (!enemy.originalColor) {
                enemy.originalColor = enemy.style.color || '#ffffff';
            }
            enemy.setColor(color);
        }
    },

    // Helper to reset to original color
    resetEffectColor: function (enemy) {
        if (enemy.enemyType === 'sprite' && enemy.originalTint !== undefined) {
            enemy.setTint(enemy.originalTint);
        } else if (enemy.originalColor) {
            enemy.setColor(enemy.originalColor);
        }
    },

    // Convert hex color string to tint number
    hexToTint: function (hexColor) {
        if (typeof hexColor === 'string') {
            return parseInt(hexColor.replace('#', '0x'), 16);
        }
        return hexColor;
    },

    // Updated slow effect for sprite compatibility
    createSlowEffect: function () {
        return {
            initialize: function (projectile) {
                SpriteCompatibleEffects.applyEffectColor(projectile, '#00ffff');
            },

            onHit: function (projectile, enemy, scene) {
                if (!enemy || !enemy.active || enemy.health <= 0) return;
                if (enemy.isSlowed) return;

                enemy.isSlowed = true;
                enemy.originalSpeed = enemy.speed || 50;

                try {
                    enemy.speed = Math.max(10, enemy.speed * 0.5);
                    SpriteCompatibleEffects.applyEffectColor(enemy, '#00ffff');
                } catch (e) {
                    console.log("Error in slowEffect onHit:", e);
                }
            }
        };
    },

    // Updated poison effect for sprite compatibility
    createPoisonEffect: function () {
        return {
            initialize: function (projectile) {
                SpriteCompatibleEffects.applyEffectColor(projectile, '#2aad27');
            },

            onHit: function (projectile, enemy, scene) {
                if (enemy.health > 0) {
                    SpriteCompatibleEffects.applyPoisonEffect(scene, enemy, projectile.damage);
                }
            }
        };
    },

    // Updated poison application function
    applyPoisonEffect: function (scene, enemy, baseDamage) {
        if (enemy.health <= 0) return;

        // Apply poison color effect
        SpriteCompatibleEffects.applyEffectColor(enemy, '#2aad27');

        const tickDamage = baseDamage * 0.5;
        let completedTicks = 0;
        const totalTicks = 4;

        const poisonSourceId = `poison_${Date.now()}_${Math.random()}`;

        const poisonTimer = registerTimer(scene.time.addEvent({
            delay: 1000,
            callback: function () {
                if (!enemy || !enemy.active) return;

                applyContactDamage.call(scene,
                    {
                        damageSourceId: poisonSourceId,
                        damage: tickDamage,
                        active: true
                    },
                    enemy,
                    tickDamage,
                    0
                );

                completedTicks++;

                if (completedTicks === totalTicks && enemy.active) {
                    SpriteCompatibleEffects.resetEffectColor(enemy);
                }
            },
            callbackScope: scene,
            repeat: totalTicks - 1
        }));

        window.registerEffect('timer', poisonTimer);
    }
};

// Integration with existing EnemySystem
const EnemySystemIntegration = {
    // Patch for existing EnemySystem.spawnEnemyOfRank to use canvas textures
    patchEnemySpawning: function () {
        // Store original function as backup
        EnemySystem.originalSpawnEnemyOfRank = EnemySystem.spawnEnemyOfRank;

        // Replace with optimized version - FIX: Proper context binding
        EnemySystem.spawnEnemyOfRank = function (rank) {
            if (gameOver) return null;

            // FIX: Use EnemySystem.scene instead of this.scene
            const scene = EnemySystem.scene;
            if (!scene) {
                console.error("❌ No scene available in EnemySystem for canvas texture spawning");
                return null;
            }

            console.log(`🎯 Canvas texture spawn function called for rank ${rank}`);

            // Get enemy type (same logic as original)
            const enemyType = getRandomEnemyTypeByRank(rank);

            // Choose spawn position (same logic as original)
            let x, y;
            if (Math.random() < 0.5) {
                x = Math.random() < 0.5 ? -50 : game.config.width + 50;
                y = Phaser.Math.Between(50, game.config.height - 50);
            } else {
                x = Phaser.Math.Between(50, game.config.width - 50);
                y = Math.random() < 0.5 ? -50 : game.config.height + 50;
            }

            // CREATE SPRITE INSTEAD OF TEXT
            const enemy = KanjiTextureSystem.createEnemySprite(scene, enemyType, x, y);

            // Add to physics group (same as original)
            EnemySystem.enemiesGroup.add(enemy);

            // Set physics properties - FIX: Use actual kanji size for collision
            if (enemy.actualWidth && enemy.actualHeight) {
                // Use the actual kanji dimensions for collision
                enemy.body.setSize(enemy.actualWidth, enemy.actualHeight);
            } else {
                // Fallback for text enemies - use the full width/height
                enemy.body.setSize(enemy.width, enemy.height);
            }
            enemy.body.setCollideWorldBounds(false);
            enemy.body.setImmovable(false);
            enemy.body.pushable = true;
            enemy.body.setMass(1);
            enemy.body.setDrag(1);
            enemy.body.setBounce(0.5);

            console.log(`✅ Canvas texture enemy spawned: ${enemyType} (${enemy.enemyType})`);
            return enemy;
        };

        console.log("✅ EnemySystem.spawnEnemyOfRank patched for canvas textures");
    },

    // Initialize the system when EnemySystem starts
    initOptimizedEnemySystem: function (scene) {
        console.log("🚀 Initializing optimized enemy system");

        // Initialize texture system
        KanjiTextureSystem.init(scene);

        // Update effect components to be sprite-compatible
        this.updateEffectComponents();

        // Patch the existing spawn function
        this.patchEnemySpawning();

        console.log("✅ Optimized enemy system initialized - EnemySystem.spawnEnemyOfRank updated");
    },

    // Update existing effect components for sprite compatibility
    updateEffectComponents: function () {
        // Update existing components in ProjectileComponentSystem
        if (window.ProjectileComponentSystem) {
            // Update slow effect
            ProjectileComponentSystem.componentTypes.slowEffect = SpriteCompatibleEffects.createSlowEffect();

            // Update poison effect  
            ProjectileComponentSystem.componentTypes.poisonEffect = SpriteCompatibleEffects.createPoisonEffect();

            console.log("✅ Updated ProjectileComponentSystem for sprite compatibility");
        }

        // Make poison function globally accessible
        window.applyPoisonEffect = SpriteCompatibleEffects.applyPoisonEffect;
    },

    // Clean up when game restarts
    cleanup: function () {
        console.log("🧹 Cleaning up canvas texture system");

        KanjiTextureSystem.clearSessionTextures();

        // Restore original function if it exists
        if (EnemySystem.originalSpawnEnemyOfRank) {
            EnemySystem.spawnEnemyOfRank = EnemySystem.originalSpawnEnemyOfRank;
            delete EnemySystem.originalSpawnEnemyOfRank;
            console.log("✅ Restored original spawn function");
        }
    }
};

// Easy integration - call this in startGame() function, NOT buildGame()
window.initKanjiOptimization = function (scene) {
    console.log("🚀 initKanjiOptimization called with scene:", !!scene);

    if (!scene) {
        console.error("❌ No scene provided to initKanjiOptimization");
        return;
    }

    try {
        EnemySystemIntegration.initOptimizedEnemySystem(scene);
        console.log("✅ Kanji optimization initialized successfully");
    } catch (error) {
        console.error("❌ Error in initKanjiOptimization:", error);
    }
};

// Only cleanup textures, but don't restore the original function on restart
window.cleanupKanjiOptimization = function () {
    console.log("🧹 Cleaning up canvas textures only (keeping system active)");
    // Only clear textures, don't restore the original spawn function
    KanjiTextureSystem.clearSessionTextures();
};

// Enhanced debugging function
window.checkCanvasTexture = function () {
    const enemies = EnemySystem.enemiesGroup?.getChildren() || [];
    const textCount = enemies.filter(e => e.type === 'Text').length;
    const spriteCount = enemies.filter(e => e.type === 'Sprite').length;
    const enemyTypes = enemies.map(e => ({
        type: e.type,
        enemyType: e.enemyType,
        text: e.text || e.kanjiCharacter
    }));

    console.log(`📊 Enemy rendering breakdown:`);
    console.log(`  - Sprites: ${spriteCount}`);
    console.log(`  - Text: ${textCount}`);
    console.log(`  - Total: ${enemies.length}`);
    console.log(`🔍 System status:`);
    console.log(`  - Canvas system initialized: ${!!KanjiTextureSystem?.scene}`);
    console.log(`  - EnemySystem patched: ${!!EnemySystem?.originalSpawnEnemyOfRank}`);
    console.log(`  - Texture cache: ${KanjiTextureSystem?.getCacheStats()?.cachedTextures ?? 0} textures`);

    if (enemyTypes.length > 0 && enemyTypes.length <= 10) {
        console.log(`🎯 Enemy details:`, enemyTypes);
    }

    return {
        sprites: spriteCount,
        text: textCount,
        total: enemies.length,
        systemActive: !!EnemySystem?.originalSpawnEnemyOfRank
    };
};

// Make systems globally accessible
window.KanjiTextureSystem = KanjiTextureSystem;
window.EnemySystemIntegration = EnemySystemIntegration;

console.log("✅ Fixed canvas texture system loaded");