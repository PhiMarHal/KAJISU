// enemy.js - Enemy management system for Word Survivors

// Enemy-related global variables
let enemySpeedFactor = 1.0;           // Global modifier for enemy speed
let currentEnemyRank = 1;             // Current highest enemy rank
let currentEnemyHealth = 40;          // Current base enemy health value

// Boss state tracking
let bossMode = false;
let activeBoss = null;
let bossSpawned = false;

// Consolidated rank configurations
const rankConfigs = {
    1: {
        startTime: 0,           // Start immediately
        baseDelay: 4000,        // Base spawn delay in ms
        minDelay: 400,          // Minimum spawn delay in ms
        scaleMinutes: 16         // Scale over 8 minutes
    },
    2: {
        startTime: 8 * 60,      // Start after 8 minutes
        baseDelay: 8000,        // Base spawn delay in ms
        minDelay: 800,          // Minimum spawn delay in ms
        scaleMinutes: 16         // Scale over 8 minutes
    },
    3: {
        startTime: 14 * 60,     // Start after 14 minutes
        baseDelay: 16000,       // Base spawn delay in ms
        minDelay: 1600,         // Minimum spawn delay in ms
        scaleMinutes: 16         // Scale over 8 minutes
    },
    4: {
        startTime: 20 * 60,     // Start after 20 minutes
        baseDelay: 16000,       // Base spawn delay in ms
        minDelay: 2000,         // Minimum spawn delay in ms
        scaleMinutes: 8         // Scale over 8 minutes
    },
    5: {
        startTime: 30 * 60,     // Start after 30 minutes
        baseDelay: 20000,       // Base spawn delay in ms
        minDelay: 3000,         // Minimum spawn delay in ms
        scaleMinutes: 8         // Scale over 8 minutes
    },
    6: {
        startTime: 36 * 60,     // Start after 36 minutes
        baseDelay: 24000,       // Base spawn delay in ms
        minDelay: 4000,         // Minimum spawn delay in ms
        scaleMinutes: 8         // Scale over 8 minutes
    }
};

// Calculate dynamic scale factor for each rank
function getRankScaleFactor(rank) {
    const config = rankConfigs[rank];
    if (!config) return 1;

    // Calculate the scale factor needed to go from baseDelay to minDelay over scaleMinutes
    const targetRatio = config.baseDelay / config.minDelay;
    return Math.pow(targetRatio, 1 / config.scaleMinutes);
}

// Enemy System namespace
const EnemySystem = {
    // References to Phaser groups
    enemiesGroup: null,

    // Track spawners for different ranks
    enemySpawners: {},

    // Reference to the active scene
    scene: null,

    // Batching updates
    updateFrameCounter: 0,
    enemyUpdateInterval: 4,

    // Initialize the enemy system
    initialize: function (scene) {
        // Store scene reference
        this.scene = scene;

        // Create enemy group (or use existing one)
        this.enemiesGroup = scene.physics.add.group();

        // Make global reference available (for backward compatibility)
        window.enemies = this.enemiesGroup;

        // Initialize enemy tier assignments
        initializeEnemyTiers();

        console.log("Enemy system initialized");

        return this;
    },

    // Function to spawn enemy of specific rank
    spawnEnemyOfRank: function (rank) {
        // Skip if game is over
        if (gameOver) return null;

        // Ensure we have a valid scene
        const scene = this.scene;
        if (!scene) return null;

        // Get a random enemy type of this rank
        const enemyType = getRandomEnemyTypeByRank(rank);

        // Choose a random spawn position outside the screen
        let x, y;
        if (Math.random() < 0.5) {
            // Spawn on left or right side
            x = Math.random() < 0.5 ? -50 : game.config.width + 50;
            y = Phaser.Math.Between(50, game.config.height - 50);
        } else {
            // Spawn on top or bottom
            x = Phaser.Math.Between(50, game.config.width - 50);
            y = Math.random() < 0.5 ? -50 : game.config.height + 50;
        }

        // Create enemy using optimized sprite system
        const enemy = KanjiTextureSystem.createEnemySprite(scene, enemyType, x, y);

        // Add to physics group
        this.enemiesGroup.add(enemy);

        // Set enemy physics properties
        enemy.body.setSize(enemy.actualWidth, enemy.actualHeight);
        enemy.body.setCollideWorldBounds(false);
        enemy.body.setImmovable(false);
        enemy.body.pushable = true;
        enemy.body.setMass(1);
        enemy.body.setDrag(1);
        enemy.body.setBounce(0.5);

        return enemy;
    },

    // Apply damage to an enemy
    applyDamage: function (source, enemy, damage, cooldownMs = 1000) {
        // Skip if either object is already destroyed
        if (!source.active || !enemy.active) return false;

        // Ensure the cooldown tracking property exists on the enemy
        enemy.lastContactDamage = enemy.lastContactDamage ?? {};

        // Create a unique key for this damage source
        const sourceKey = source.damageSourceId ?? (source.damageSourceId = `damage_${Date.now()}_${Math.random()}`);

        // Check if we're still in the cooldown period for this damage source
        const currentTime = this.scene.time.now;
        if (!enemy.lastContactDamage[sourceKey] || (currentTime - enemy.lastContactDamage[sourceKey] > cooldownMs)) {
            // Apply damage to enemy
            enemy.health -= damage;
            enemy.lastContactDamage[sourceKey] = currentTime;

            // Show visual damage effect
            this.showDamageEffect(enemy);

            // Check if enemy is defeated
            if (enemy.health <= 0) {
                this.defeatEnemy(enemy);
                return true; // Signal that enemy was defeated
            }

            // If damage was applied and this is the boss, update health bar
            if (enemy.isBoss) {
                this.updateBossHealthBar(enemy);
            }

            return true; // Signal that damage was applied
        }

        return false; // Signal that no damage was applied (cooldown)
    },

    // Handle enemy defeat
    defeatEnemy: function (enemy) {
        // Check if this is the boss
        if (enemy.isBoss) {
            // Handle boss defeat before calling the original method
            this.onBossDefeated();
        }

        // Only show learning feedback for enemies of the current (highest) rank
        if (this.scene.learningFeedback && enemy.rank === currentEnemyRank) {
            // Update the text
            this.scene.learningFeedback.setText(
                `${enemy.text} (${enemy.kana}) [${enemy.romaji}] - ${enemy.english}`
            );

            // Reset scale for animation
            this.scene.learningFeedback.setScale(1);

            // Create subtle scale animation (grow, then back to normal)
            this.scene.tweens.add({
                targets: this.scene.learningFeedback,
                scale: { from: 0.95, to: 1 }, // Grow slightly
                duration: 80, // Fast animation
                ease: 'Sine.easeOut'
            });
        }

        // Destroy the enemy entity
        enemy.destroy();

        // Increment score
        score++;

        // Add experience
        heroExp += enemy.expValue;

        // Update exp bar
        GameUI.updateExpBar(this.scene);
    },

    // Show visual effect for enemy damage
    showDamageEffect: function (enemy) {
        if (!enemy || !enemy.active) return;
        VisualEffects.createDamageFlash(this.scene, enemy);
    },

    // Update the enemy spawners with dynamic scaling
    updateEnemySpawners: function () {
        // Skip if game is over or paused
        if (gameOver || gamePaused) return;

        // Check if it's time to spawn the boss (based on elapsed time reaching the boss rank's start time)
        if (!bossSpawned && elapsedTime >= rankConfigs[BOSS_CONFIG.max_rank].startTime) {
            console.log("Boss spawn condition met - spawning boss!");
            bossSpawned = true;
            this.spawnBoss();

            // Update currentEnemyRank for consistency
            currentEnemyRank = BOSS_CONFIG.max_rank;

            // Remove any existing spawners for max rank or above
            for (let rank = BOSS_CONFIG.max_rank; rank <= 6; rank++) {
                if (this.enemySpawners[rank]) {
                    console.log(`Removing spawner for rank ${rank}`);
                    this.enemySpawners[rank].remove();
                    delete this.enemySpawners[rank];
                }
            }
        }

        // Process each rank for spawner updates
        Object.keys(rankConfigs).forEach(rankStr => {
            const rank = parseInt(rankStr);

            // Skip ranks at or above max_rank if boss has spawned
            if (bossSpawned && rank >= BOSS_CONFIG.max_rank) {
                return;
            }

            const config = rankConfigs[rank];

            // Check if this rank's enemies should start spawning yet
            if (elapsedTime >= config.startTime) {
                // Create a spawner if it doesn't exist
                if (!this.enemySpawners[rank]) {
                    // Create the spawner with initial delay
                    this.enemySpawners[rank] = registerTimer(this.scene.time.addEvent({
                        delay: config.baseDelay,
                        callback: () => { this.spawnEnemyOfRank(rank); },
                        callbackScope: this,
                        loop: true
                    }));

                    // If it's not rank 1, show an introduction and update current enemy rank
                    if (rank > 1) {
                        this.showRankIntroduction(rank);
                    }
                } else {
                    // Update existing spawner's delay based on elapsed time
                    // Calculate time since this rank started
                    const rankMinutesActive = (elapsedTime - config.startTime) / 60;

                    // Use dynamic scale factor for this specific rank
                    const scaleFactor = getRankScaleFactor(rank);
                    const scalingMinutes = Math.min(config.scaleMinutes, rankMinutesActive);

                    // Calculate new delay
                    const newSpawnDelay = Math.max(
                        config.minDelay,
                        config.baseDelay / Math.pow(scaleFactor, scalingMinutes)
                    );

                    // Update the timer if needed (with some threshold to avoid constant updates)
                    if (Math.abs(this.enemySpawners[rank].delay - newSpawnDelay) > (this.enemySpawners[rank].delay * 0.1)) {
                        this.enemySpawners[rank].delay = newSpawnDelay;
                        this.enemySpawners[rank].reset({
                            delay: newSpawnDelay,
                            callback: () => { this.spawnEnemyOfRank(rank); },
                            callbackScope: this,
                            loop: true
                        });
                    }
                }
            }
        });
    },

    // Show a dramatic introduction when a new rank appears
    showRankIntroduction: function (rank) {
        // Update the current enemy rank when a new rank is introduced
        currentEnemyRank = rank;

        // Threat kanji: 危 (ki) - meaning danger/threat/peril
        const threatKanji = '危';

        // Create a more atmospheric introduction with multiple kanji
        const kanjiCount = 8; // Number of kanji to show
        const duration = 4000; // Total duration: 4 seconds

        // Scale kanji size based on rank
        const baseSize = 128; // Base font size for kanji
        const sizeFactor = Math.min(1.5, 1 + (rank - 1) * 0.25); // Increase size for higher ranks

        // Create multiple kanji at different positions
        for (let i = 0; i < kanjiCount; i++) {
            // Calculate random position weighted toward the center
            const randomAngle = Math.random() * Math.PI * 2;
            const randomDistance = Math.random() * 300 + 100;

            const x = game.config.width / 2 + Math.cos(randomAngle) * randomDistance;
            const y = game.config.height / 2 + Math.sin(randomAngle) * randomDistance;

            // Randomize appearance time within the duration
            const delay = Math.random() * 3000; // Random delay up to 3 seconds

            // Create the kanji text with varying properties
            const kanji = this.scene.add.text(x, y, threatKanji, {
                fontFamily: 'Arial',
                fontSize: `${baseSize * sizeFactor}px`,
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 6
            }).setOrigin(0.5);

            // Set initial alpha to 0
            kanji.setAlpha(0);

            // Fast fade in then fast fade out - total 1 second per kanji
            this.scene.tweens.add({
                targets: kanji,
                alpha: { from: 0, to: 0.7 }, // Not fully opaque
                scale: { from: 0.8, to: 1.2 },
                duration: 500, // 0.5 second fade in
                delay: delay,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: kanji,
                        alpha: { from: 0.7, to: 0 },
                        scale: { from: 1.2, to: 1.5 },
                        duration: 500, // 0.5 second fade out
                        ease: 'Sine.easeInOut',
                        onComplete: () => {
                            kanji.destroy();
                        }
                    });
                }
            });
        }

        // After all kanji effects, show rank name briefly
        // Get the rank name from bestiary.js
        const rankName = ENEMY_RANK_NAMES[rank] || `${rank}`;

        // Wait for most of the kanji to appear, then show the rank
        this.scene.time.delayedCall(2500, () => {
            const rankText = this.scene.add.text(game.config.width / 2, game.config.height / 2, rankName, {
                fontFamily: 'Arial',
                fontSize: '200px',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 8
            }).setOrigin(0.5);
            rankText.setAlpha(0);

            // Dramatic appearance of the rank number
            this.scene.tweens.add({
                targets: rankText,
                alpha: { from: 0, to: 0.9 },
                scale: { from: 0.5, to: 1.2 },
                duration: 800,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: rankText,
                        alpha: { from: 0.9, to: 0 },
                        scale: { from: 1.2, to: 1.5 },
                        duration: 700,
                        delay: 300,
                        ease: 'Cubic.easeIn',
                        onComplete: () => {
                            rankText.destroy();
                        }
                    });
                }
            });
        });
    },

    // Initialize enemy spawners
    initializeEnemySpawners: function () {
        // Clean up any existing spawners
        Object.values(this.enemySpawners).forEach(spawner => {
            if (spawner) {
                spawner.remove();
            }
        });

        // Reset the spawners object
        this.enemySpawners = {};

        // Rank 1 spawner will be created in the first update
        // Other ranks will be created when their time comes
    },

    // Update all enemies (movement, etc.)
    updateEnemies: function () {
        // Skip if game is over or paused
        if (gameOver || gamePaused) return;

        // Increment frame counter
        this.updateFrameCounter++;

        // Only update enemies every N frames
        if (this.updateFrameCounter % this.enemyUpdateInterval !== 0) {
            return; // Skip this frame
        }

        // Get all active enemies
        const activeEnemies = this.enemiesGroup.getChildren();

        // Update each enemy
        activeEnemies.forEach(enemy => {
            // Ensure enemy and its body are valid and active
            if (enemy && enemy.active && enemy.body) {
                // Target position (player)
                const targetX = player.x;
                const targetY = player.y;

                // Vector from enemy to player
                const dx = targetX - enemy.x;
                const dy = targetY - enemy.y;

                // Distance to player
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Define the maximum speed
                const maxSpeed = enemy.speed * enemySpeedFactor;

                // Define the acceleration rate
                const accelerationRate = maxSpeed * 8;

                // Avoid division by zero
                if (distance > 1) {
                    // Normalize the direction vector
                    const dirX = dx / distance;
                    const dirY = dy / distance;

                    // Calculate acceleration components
                    const accelX = dirX * accelerationRate;
                    const accelY = dirY * accelerationRate;

                    // Apply the calculated acceleration
                    enemy.body.setAcceleration(accelX, accelY);
                } else {
                    // If very close, stop accelerating
                    enemy.body.setAcceleration(0, 0);
                }

                // Manually cap speed
                const velocity = enemy.body.velocity;
                const currentSpeedSq = velocity.lengthSq();

                if (currentSpeedSq > maxSpeed * maxSpeed) {
                    const currentSpeed = Math.sqrt(currentSpeedSq);
                    const scale = maxSpeed / currentSpeed;
                    enemy.body.setVelocity(velocity.x * scale, velocity.y * scale);
                }
            }
        });
    },

    // Count enemies by rank
    countEnemiesByRank: function (rank) {
        return this.enemiesGroup.getChildren().filter(enemy =>
            enemy && enemy.active && enemy.rank === rank
        ).length;
    },

    // Get total enemy count
    getEnemyCount: function () {
        return this.enemiesGroup.getChildren().filter(enemy =>
            enemy && enemy.active
        ).length;
    },

    spawnBoss: function () {
        // Get the scene
        const scene = this.scene;
        if (!scene) return null;

        // Choose a random boss type from the highest rank
        const bossType = getRandomEnemyTypeByRank(BOSS_CONFIG.max_rank);

        // Get the enemy data
        const enemyData = getEnemyData(bossType);

        // Spawn position (center of screen)
        const x = game.config.width / 2;
        const y = -250;

        // Create the boss with data-driven properties
        const boss = scene.add.text(x, y, bossType, {
            fontFamily: 'Arial',
            fontSize: `${enemyData.size}px`,
            color: enemyData.color,
        }).setOrigin(0.5);

        // Add to physics group
        this.enemiesGroup.add(boss);

        // Set physics properties
        boss.body.setSize(boss.width, boss.height);
        boss.body.setCollideWorldBounds(false);
        boss.body.setImmovable(false);
        boss.body.pushable = true;
        boss.body.setMass(4);  // Make boss harder to push
        boss.body.setDrag(1);
        boss.body.setBounce(0.5);

        // Calculate boss health (normal health * boss multiplier)
        boss.health = Math.ceil(currentEnemyHealth * enemyData.healthMultiplier * BOSS_CONFIG.health_multiplier);
        boss.maxHealth = boss.health; // Store max health for UI bar

        // Set boss speed to fixed value from config
        boss.speed = BOSS_CONFIG.speed;

        // Store additional properties from data
        boss.damage = enemyData.damage;
        boss.rank = enemyData.rank;
        boss.expValue = enemyData.expValue;

        // Store all language and educational properties
        boss.kana = enemyData.kana;
        boss.romaji = enemyData.romaji;
        boss.english = enemyData.english;

        // Mark as boss for special handling
        boss.isBoss = true;

        // Store reference to active boss
        activeBoss = boss;

        // Set background to boss mode
        if (window.BackgroundAnimationSystem) BackgroundAnimationSystem.setBossMode(true);

        // Set music to boss mode
        MusicSystem.applyBossFightEffect();

        // Update UI to show boss name and health
        this.showBossUI(boss);

        return boss;
    },

    // Show boss UI (name and health bar)
    showBossUI: function (boss) {
        const scene = this.scene;
        if (!scene) return;

        // Store the original feedback text if we need to restore it later
        if (scene.learningFeedback && !scene.originalFeedbackText) {
            scene.originalFeedbackText = scene.learningFeedback.text;
        }

        // Update learning feedback to show boss info
        if (scene.learningFeedback) {
            scene.learningFeedback.setText(
                `${boss.text} (${boss.kana}) [${boss.romaji}] - ${boss.english}`
            );
        }

        // Create boss health bar
        this.createBossHealthBar(scene);

        // Update health bar to full
        this.updateBossHealthBar(boss);
    },

    // Create boss health bar elements
    createBossHealthBar: function (scene) {
        // Clean up existing health bar if any
        if (scene.bossHealthBar) {
            scene.bossHealthBar.destroy();
        }
        if (scene.bossHealthBarBg) {
            scene.bossHealthBarBg.destroy();
        }
        if (scene.bossHealthBarBorder) {
            scene.bossHealthBarBorder.destroy();
        }

        // Get dimensions from UI health bar constants for consistency
        const kajisuliScale = (typeof KAJISULI_MODE !== 'undefined' && KAJISULI_MODE) ? 1.5 : 1;
        const width = UI.healthBar.width() * kajisuliScale;
        const height = UI.healthBar.height();
        const borderWidth = UI.healthBar.borderWidth;
        const innerMargin = UI.healthBar.innerMargin;
        const centerX = UI.healthBar.centerX();
        const y = game.config.height * 0.9125; // Position near the bottom for boss health bar

        // Create gold border with black background (like the player health bar)
        scene.bossHealthBarBorder = scene.add.rectangle(
            centerX,
            y,
            width + (borderWidth * 2),
            height + (borderWidth * 2),
            UI.colors.gold
        ).setDepth(100);

        // Create inner black background
        scene.bossHealthBarBg = scene.add.rectangle(
            centerX,
            y,
            width,
            height,
            UI.colors.black
        ).setDepth(100);

        // Calculate the starting position for the health bar (accounting for margin)
        const startX = centerX - (width / 2) + innerMargin;

        // Create health bar foreground (initially full)
        scene.bossHealthBar = scene.add.rectangle(
            startX,
            y,
            width - (innerMargin * 2), // Account for margin on both sides
            height - (innerMargin * 2), // Account for margin on both sides
            0xff0000 // Red color for health
        ).setOrigin(0, 0.5).setDepth(101);
    },

    // Update boss health bar based on current health
    updateBossHealthBar: function (boss) {
        const scene = this.scene;
        if (!scene || !scene.bossHealthBar || !boss) return;

        // Calculate health percentage
        const healthPercent = boss.health / boss.maxHealth;

        // Get width from UI health bar constants (minus margins)
        const kajisuliScale = (typeof KAJISULI_MODE !== 'undefined' && KAJISULI_MODE) ? 1.5 : 1;
        const fullWidth = UI.healthBar.width() * kajisuliScale - (UI.healthBar.innerMargin * 2);

        // Update health bar width based on percentage
        scene.bossHealthBar.width = fullWidth * healthPercent;
    },

    // Handle boss defeat
    onBossDefeated: function () {
        const scene = this.scene;
        if (!scene) return;

        // Reset background to normal
        if (window.BackgroundAnimationSystem) BackgroundAnimationSystem.setBossMode(false);

        // Reset music to normal
        MusicSystem.removeBossFightEffect();

        // End the game with victory
        this.showVictoryScreen();

        // Clean up all boss-related UI objects thoroughly
        this.cleanupBossUI(scene);

        // Reset boss state
        bossMode = false;
        activeBoss = null;
    },

    cleanupBossUI: function (scene) {
        // Clean up health bar elements
        if (scene.bossHealthBar) {
            scene.bossHealthBar.destroy();
            scene.bossHealthBar = null;
        }
        if (scene.bossHealthBarBg) {
            scene.bossHealthBarBg.destroy();
            scene.bossHealthBarBg = null;
        }
        if (scene.bossHealthBarBorder) {
            scene.bossHealthBarBorder.destroy();
            scene.bossHealthBarBorder = null;
        }

        // Restore original feedback text if needed
        if (scene.learningFeedback && scene.originalFeedbackText) {
            scene.learningFeedback.setText(scene.originalFeedbackText);
            scene.originalFeedbackText = null;
        }
    },

    // Show victory screen
    showVictoryScreen: function () {
        const scene = this.scene;
        if (!scene) return;

        // Set game over state
        gameOver = true;

        // Pause the game physics to stop all movement
        PauseSystem.pauseGame();

        // Show victory screen using our new GameEndMenu
        window.GameEndMenu.showVictoryScreen(scene);

        // Old code - legacy support for direct DOM elements
        // This can be removed once the new GameEndMenu is fully integrated
        if (typeof gameOverText !== 'undefined' && gameOverText.setVisible) {
            gameOverText.setVisible(false);
        }
        if (typeof restartButton !== 'undefined' && restartButton.setVisible) {
            restartButton.setVisible(false);
        }
    },

    // Reset the enemy system
    reset: function () {
        // Clear existing enemies
        if (this.enemiesGroup) {
            this.enemiesGroup.clear(true, true);
        }

        // Clean up spawners
        Object.values(this.enemySpawners).forEach(spawner => {
            if (spawner) {
                spawner.remove();
            }
        });

        // Reset spawners
        this.enemySpawners = {};

        // Reset boss-related state
        bossMode = false;
        activeBoss = null;
        bossSpawned = false;

        // Reset backgrounds
        if (window.BackgroundAnimationSystem) BackgroundAnimationSystem.setBossMode(false);

        // Reset frame counter (batching)
        this.updateFrameCounter = 0;

        // Clean up any boss UI elements
        const scene = this.scene;
        if (scene) {
            this.cleanupBossUI(scene);
        }

        // Reset enemy rank
        currentEnemyRank = 1;

        // Initialize enemy tiers with dynamic assignments
        initializeEnemyTiers();

        console.log("Enemy system reset");
    }
};

// Export the system for use in other files
window.EnemySystem = EnemySystem;

// Export the enemy-related variables for global access
window.enemySpeedFactor = enemySpeedFactor;
window.currentEnemyRank = currentEnemyRank;
window.currentEnemyHealth = currentEnemyHealth;
window.rankConfigs = rankConfigs; // Export the consolidated config

// Make boss variables accessible globally
window.bossMode = bossMode;
window.activeBoss = activeBoss;
window.bossSpawned = bossSpawned;
window.BOSS_CONFIG = BOSS_CONFIG;

// Export the helper function
window.getRankScaleFactor = getRankScaleFactor;

// Setter functions to modify variables
EnemySystem.setEnemySpeedFactor = function (value) {
    enemySpeedFactor = value;
    window.enemySpeedFactor = value;
};

EnemySystem.setCurrentEnemyHealth = function (value) {
    currentEnemyHealth = value;
    window.currentEnemyHealth = value;
};

// Legacy wrapper function for backward compatibility
window.applyContactDamage = function (source, enemy, damage, cooldownMs = 1000) {
    if (!EnemySystem.scene) {
        // If not initialized, use this as scene context
        EnemySystem.scene = this;
    }

    return EnemySystem.applyDamage(source, enemy, damage, cooldownMs);
};

// Direct function to spawn enemies (for easy referencing)
window.spawnEnemyOfRank = function (rank) {
    return EnemySystem.spawnEnemyOfRank(rank);
};