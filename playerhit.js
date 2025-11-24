// playerhit.js - Player damage handling and visual effects

// Track whether player is currently invincible (to prevent multiple rapid hits)
let playerInvincible = false;

// Visual effect elements
let damageVignette = null;

// Helper function to calculate invincibility duration based on END (maxPlayerHealth)
// 4 END = 960ms -> 240ms per point
function getInvincibilityDuration() {
    return maxPlayerHealth * 240;
}

// Helper function to calculate flash repeats based on END
// 4 END = 8 repeats -> 2 repeats per point
function getFlashRepeats() {
    return Math.max(1, Math.floor(maxPlayerHealth * 2));
}

// Initialize the player hit system
function initPlayerHitSystem(scene) {
    // Cleanup any existing vignette elements
    cleanupDamageEffects();

    // Create the vignette container (invisible by default)
    createDamageVignette(scene);

    console.log("Player hit system initialized");
}

// Create the blood vignette effect (initially invisible)
function createDamageVignette(scene) {
    // Create a container for all vignette elements
    damageVignette = scene.add.container(0, 0);
    damageVignette.setDepth(900); // High depth to appear over game but under UI
    damageVignette.setAlpha(0); // Start invisible

    // Get screen dimensions from config
    const screenWidth = game.config.width; // 1200
    const screenHeight = game.config.height; // 800

    // Create more rectangles for a smoother gradient
    const totalBands = 10; // Keeping the same number of bands

    // Create bands with smooth alpha transition
    for (let i = 0; i < totalBands; i++) {
        // Calculate percentage of edge (0.05 to 0.4 - from 5% to 40% of the screen)
        const percent = (0.20 * i / (totalBands - 1));

        // Calculate alpha (0.6 for outermost to 0.01 for innermost)
        const alpha = 0.5 * (1 - (i / totalBands));

        const thickness = percent * Math.min(screenWidth, screenHeight) / 2;
        const bandThickness = (0.35 / totalBands) * Math.min(screenWidth, screenHeight) / 2;

        // Top edge - FULL WIDTH
        const topRect = scene.add.rectangle(
            screenWidth / 2, thickness - bandThickness / 2,
            screenWidth,
            bandThickness,
            0xff0000, alpha
        );
        topRect.setOrigin(0.5, 0.5);
        damageVignette.add(topRect);

        // Bottom edge - FULL WIDTH
        const bottomRect = scene.add.rectangle(
            screenWidth / 2, screenHeight - (thickness - bandThickness / 2),
            screenWidth,
            bandThickness,
            0xff0000, alpha
        );
        bottomRect.setOrigin(0.5, 0.5);
        damageVignette.add(bottomRect);

        // Left edge - FULL HEIGHT
        const leftRect = scene.add.rectangle(
            thickness - bandThickness / 2, screenHeight / 2,
            bandThickness,
            screenHeight, // Full height now
            0xff0000, alpha
        );
        leftRect.setOrigin(0.5, 0.5);
        damageVignette.add(leftRect);

        // Right edge - FULL HEIGHT
        const rightRect = scene.add.rectangle(
            screenWidth - (thickness - bandThickness / 2), screenHeight / 2,
            bandThickness,
            screenHeight, // Full height now
            0xff0000, alpha
        );
        rightRect.setOrigin(0.5, 0.5);
        damageVignette.add(rightRect);
    }

    // Register for cleanup
    window.registerEffect('entity', damageVignette);
}

// Show damage vignette with animation - keeping the same timing logic
function showDamageVignette(scene, intensity = 1.0) {
    if (!damageVignette) {
        createDamageVignette(scene);
    }

    // Cancel any existing tween
    if (damageVignette.fadeTween) {
        damageVignette.fadeTween.stop();
    }

    // Immediately set alpha based on intensity
    damageVignette.setAlpha(0.9 * intensity);

    // Calculate duration dynamically based on current stats
    const duration = getInvincibilityDuration();

    // Create fade-out animation that matches invincibility duration
    damageVignette.fadeTween = scene.tweens.add({
        targets: damageVignette,
        alpha: 0,
        duration: duration * 0.95, // Slightly shorter than invincibility for safety
        ease: 'Sine.easeOut',
        onComplete: function () {
            // Ensure we're completely invisible
            damageVignette.setAlpha(0);
        }
    });
}

// Clean up visual effects
function cleanupDamageEffects() {
    if (damageVignette) {
        // Stop any running tweens
        if (damageVignette.fadeTween) {
            damageVignette.fadeTween.stop();
            damageVignette.fadeTween = null;
        }

        // Destroy the container and all children
        if (damageVignette.destroy) {
            damageVignette.destroy();
        }
        damageVignette = null;
    }
}

// Make player invincible with visual effects
function makePlayerInvincible(scene) {
    // Always grant invincibility, regardless of current state
    playerInvincible = true;

    // Calculate dynamic values based on current END
    const duration = getInvincibilityDuration();
    const repeats = getFlashRepeats();

    // Flash the player (visual feedback)
    scene.tweens.add({
        targets: player,
        alpha: 0.5,
        scale: 1.2,
        // Time per flash is total duration divided by number of flashes
        duration: duration / repeats,
        yoyo: true,
        repeat: repeats,
        onComplete: function () {
            // Ensure alpha and scale are reset properly
            player.alpha = 1;
            player.scale = 1;
        }
    });

    // Remove invincibility after the calculated duration
    scene.time.delayedCall(duration, function () {
        playerInvincible = false;

        // Double-check alpha is reset even if tween was interrupted
        if (player.active) {
            player.alpha = 1;
            player.scale = 1;
        }
    });
}

// Main function called when player is hit by an enemy
function playerIsHit(player, enemy) {
    const scene = this;

    // Check if player is already invincible from a recent hit
    if (playerInvincible) return;

    // Apply invincibility with visual effects
    makePlayerInvincible(scene);

    // Handle hit effects including shield check
    // If hit was absorbed by shield, skip damage application
    if (window.handlePlayerHit(scene, enemy)) {
        return;
    }

    // Apply damage to player
    const damageAmount = enemy.damage ?? 1;
    playerHealth -= damageAmount;

    // Show damage vignette effect
    showDamageVignette(scene, 1);

    // Update health text and bar
    window.GameUI.updateHealthBar(scene);

    // Check if player is dead
    if (playerHealth < 1) {
        // Pass the enemy that killed the player to playerDeath
        playerDeath.call(scene, enemy);
    }
}

// Handle player death
function playerDeath(killerEnemy) {
    // Set game over state
    gameOver = true;

    // Pause the game physics to stop all movement
    PauseSystem.pauseGame();

    // Make sure music plays at normal timescale, if we were in time dilation
    if (window.MusicSystem) {
        window.MusicSystem.applyTimeDilation(1.0);
    }

    // Resume music to normal if we were in boss mode
    MusicSystem.removeBossFightEffect();

    // Get the scene
    const scene = this;

    // Get the kanji of the enemy that killed the player
    const enemyKanji = killerEnemy ? killerEnemy.text : null;

    // Show game over screen with the enemy kanji
    window.GameEndMenu.showDefeatScreen(scene, enemyKanji);

    // Old code - legacy support for direct DOM elements
    // This can be removed once the new GameEndMenu is fully integrated
    if (typeof gameOverText !== 'undefined' && gameOverText.setVisible) {
        gameOverText.setVisible(false);
    }
    if (typeof restartButton !== 'undefined' && restartButton.setVisible) {
        restartButton.setVisible(false);
    }
}


// Reset the player hit system (call during game restart)
function resetPlayerHitSystem() {
    playerInvincible = false;
    cleanupDamageEffects();
}

// Export API
window.PlayerHitSystem = {
    init: initPlayerHitSystem,
    playerIsHit: playerIsHit,
    playerDeath: playerDeath,
    reset: resetPlayerHitSystem,
    makePlayerInvincible: makePlayerInvincible
};