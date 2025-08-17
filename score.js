// Updated score.js - Universal dynamic scoring system

// Add to score.js global variables
let freeLevelUpsUsed = 0;
let scoreUpdateTimer = null;
let freeUsePenalty = 20;
let versionBonus = 4;
let victoryBonus = 3;

// Enhanced Score System
const ScoreSystem = {
    // Calculate score continuously (universal) 
    calculateCurrentScore: function (isVictory = false, timeOverride = null) {
        const currentTime = timeOverride ?? elapsedTime;

        // Get boss spawn time from global configuration
        const bossSpawnTime = rankConfigs[BOSS_CONFIG.max_rank]?.startTime || 1200;
        const maximumScoreTime = bossSpawnTime * 2;

        let baseScore;

        if (isVictory) {
            // Victory: use the original high-base calculation
            baseScore = this.calculateVictoryBonus(currentTime, bossSpawnTime, maximumScoreTime);
        } else {
            // Defeat: use time-based calculation
            const cappedTime = Math.min(currentTime, maximumScoreTime);
            baseScore = Math.floor(versionBonus * cappedTime);
        }

        // Subtract penalties for free levelups (Boss Rush only)
        if (window.BOSS_RUSH_MODE) {
            const levelUpPenalty = freeLevelUpsUsed * freeUsePenalty * versionBonus;
            baseScore -= levelUpPenalty + Math.floor(versionBonus * (bossSpawnTime - 120));
        }

        return baseScore;
    },

    // Calculate victory bonus that decreases over time
    calculateVictoryBonus: function (currentTime, bossSpawnTime, maximumScoreTime) {
        // Use the original victory calculation logic
        const timeDeduction = Math.min(currentTime - bossSpawnTime, maximumScoreTime);
        return Math.floor(versionBonus * victoryBonus * (maximumScoreTime - timeDeduction));
    },

    // Initialize dynamic scoring (universal)
    initializeDynamicScoring: function (scene) {
        // Reset counter
        freeLevelUpsUsed = 0;

        console.log("Initializing dynamic scoring, scene:", scene ? "found" : "missing");

        // Start score update timer
        scoreUpdateTimer = scene.time.addEvent({
            delay: 1000, // Update every second
            callback: this.updateCurrentScore,
            callbackScope: this,
            loop: true
        });

        console.log("Score update timer created:", scoreUpdateTimer ? "success" : "failed");
        console.log("Dynamic scoring initialized");
    },

    // Update current score every second
    updateCurrentScore: function () {
        if (gameOver || gamePaused) return;

        // Just calculate the score, don't update UI here
        // The UI will get updated by the main game loop calling GameUI.updateStatusDisplay
        const score = this.calculateCurrentScore();
    },

    // Update score display in the UI
    updateScoreDisplay: function (scoreValue) {
        const scene = game.scene.scenes[0];
        if (!scene || !scene.statusText) return;

        const timeText = formatTime(elapsedTime);
        scene.statusText.setText(`Survived: ${timeText}  Score: ${scoreValue}`);
    },

    // Apply penalty for free levelup (Boss Rush only)
    applyFreeLeveUpPenalty: function () {
        if (!window.BOSS_RUSH_MODE) return;

        freeLevelUpsUsed++;
        console.log(`Free levelup used. Total penalties: ${freeLevelUpsUsed * freeUsePenalty * versionBonus}`);

        // Don't update UI here - let the main game loop handle it
    },

    // Get final score (for game end)
    getFinalScore: function (isVictory) {
        const finalScore = this.calculateCurrentScore(isVictory);
        // Don't normalize negative scores here - let the animation handle it
        return finalScore;
    },

    // Cleanup dynamic scoring
    cleanupDynamicScoring: function () {
        if (scoreUpdateTimer) {
            scoreUpdateTimer.remove();
            scoreUpdateTimer = null;
        }
        freeLevelUpsUsed = 0;
    },

    // Calculate final score based on game outcome (legacy method for compatibility)
    calculateScore: function (isVictory) {
        return this.calculateCurrentScore(isVictory);
    },

    // Animate the score with a counting effect where digits animate at different speeds
    animateScoreReveal: function (scene, statsText, finalScore) {
        if (!scene || !statsText) {
            console.error("Missing scene or statsText in animateScoreReveal");
            return;
        }

        // Ensure we have a valid score to animate to
        if (typeof finalScore !== 'number' || isNaN(finalScore)) {
            console.error("Invalid finalScore:", finalScore);
            finalScore = 0;
        }

        console.log("Starting score animation with finalScore:", finalScore);

        // Store original text info
        const originalText = statsText.text;
        const originalX = statsText.x;
        const originalY = statsText.y;
        const originalDepth = statsText.depth || 0;
        const originalContainer = statsText.parentContainer;

        // Parse the text to get the two segments (survived/in time and score)
        const textParts = originalText.split(/\s{2,}/); // Split on multiple spaces
        if (textParts.length !== 2) {
            console.error("Stats text doesn't have expected format:", originalText);
            return;
        }

        // Create two separate text objects for the stats (time and score)
        const leftSegment = scene.add.text(
            originalX - 150, // Position left of center
            originalY,
            textParts[0],
            {
                fontFamily: 'Arial',
                fontSize: statsText.style.fontSize,
                color: '#FFD700' // Gold color
            }
        ).setOrigin(0.5);

        const rightSegment = scene.add.text(
            originalX + 150, // Position right of center
            originalY,
            textParts[1],
            {
                fontFamily: 'Arial',
                fontSize: statsText.style.fontSize,
                color: '#FFD700' // Gold color
            }
        ).setOrigin(0.5);

        // Set depth and add to container if needed
        leftSegment.setDepth(originalDepth);
        rightSegment.setDepth(originalDepth);

        if (originalContainer) {
            originalContainer.add(leftSegment);
            originalContainer.add(rightSegment);
        }

        // Hide the original text
        statsText.setVisible(false);

        // Store references to all created objects
        const createdObjects = [leftSegment, rightSegment];

        // Animate the two segments toward the center
        scene.tweens.add({
            targets: leftSegment,
            x: originalX,
            alpha: 0,
            duration: 1000,
            delay: 500 // Wait half a second before starting
        });

        scene.tweens.add({
            targets: rightSegment,
            x: originalX,
            alpha: 0,
            duration: 1000,
            delay: 500, // Wait half a second before starting
            onComplete: () => {
                // Both segments now merged and faded out
                console.log("Segments merged, creating score text");

                // Calculate starting value and final display value
                // For defeats: show the journey from negative to 0 (if negative)
                // For victories: show the journey from penalty to final positive score
                const baseScore = this.calculateCurrentScore(false); // Get score without victory bonus
                const startValue = Math.min(baseScore, 0);

                // For defeats with negative scores, normalize final display to 0
                const displayScore = finalScore < 0 ? 0 : finalScore;

                // Create score text with larger font
                const scoreText = scene.add.text(
                    originalX,
                    originalY,
                    startValue.toString(), // Start with the minimum value
                    {
                        fontFamily: 'Arial',
                        fontSize: parseInt(statsText.style.fontSize) * 2, // Twice as large
                        color: startValue < 0 ? '#FF4444' : '#FFD700', // Red for negative, gold for positive
                        fontStyle: 'bold'
                    }
                ).setOrigin(0.5).setAlpha(0);

                // Add to our cleanup array
                createdObjects.push(scoreText);

                // Set depth and add to container if needed
                scoreText.setDepth(originalDepth);
                if (originalContainer) {
                    originalContainer.add(scoreText);
                }

                // Fade in the score text
                scene.tweens.add({
                    targets: scoreText,
                    alpha: 1,
                    duration: 500,
                    onComplete: () => {
                        console.log("Score text fade-in complete, starting counter animation");

                        // Animate from startValue to displayScore
                        this.animateScoreCounter(scene, scoreText, displayScore, createdObjects, startValue);
                    }
                });
            }
        });
    },

    // Add this property to track active animations:
    activeAnimation: null,

    // Add this helper method for showing final score with celebration effect:
    showFinalScore: function (scene, textObject, finalScore) {
        if (!scene || !textObject || textObject.active === false) return;

        // Set the final score immediately
        textObject.setText(finalScore.toString());

        // Update color based on score
        textObject.setColor(finalScore <= 0 ? '#FF4444' : '#FFD700');

        // Add celebration effect (scaling pulse)
        scene.tweens.add({
            targets: textObject,
            scale: 1.2,
            duration: 200,
            yoyo: true
        });
    },

    // Method to skip directly to the end result
    skipToFinalScore: function (scene) {
        // If no active animation, do nothing
        if (!this.activeAnimation) {
            return false;
        }

        // Stop the active tween
        if (this.activeAnimation.tween) {
            this.activeAnimation.tween.stop();
        }

        // Show the final score with celebration
        this.showFinalScore(
            scene,
            this.activeAnimation.textObject,
            this.activeAnimation.displayScore
        );

        // Clear animation reference
        this.activeAnimation = null;

        return true;
    },

    // Updated animateScoreCounter that accepts a custom start value
    animateScoreCounter: function (scene, textObject, finalScore, createdObjects, startValue = 0) {
        if (!scene || !textObject) {
            console.error("Missing scene or textObject in animateScoreCounter");
            return;
        }

        // Round values to integers
        finalScore = Math.floor(finalScore);
        startValue = Math.floor(startValue);
        console.log("Starting counter animation from:", startValue, "to:", finalScore);

        // Create counter object and configure animation
        const counter = { value: startValue };
        const totalChange = Math.abs(finalScore - startValue);
        const duration = Math.min(3000, 1000 + totalChange * 2);

        // Create the tween
        const scoreTween = scene.tweens.add({
            targets: counter,
            value: finalScore,
            duration: duration,
            ease: 'Cubic.easeOut',
            onUpdate: function () {
                // Only update if the text object is still valid
                if (textObject && textObject.active !== false) {
                    const currentValue = Math.floor(counter.value);
                    textObject.setText(currentValue.toString());

                    // Update color during animation
                    const color = currentValue <= 0 ? '#FF4444' : '#FFD700';
                    textObject.setColor(color);
                }
            },
            onComplete: () => {
                console.log("Counter animation complete!");

                // Clear the active animation reference
                this.activeAnimation = null;

                // Show final score with celebration effect
                this.showFinalScore(scene, textObject, finalScore);
            }
        });

        // Store animation details for potential skipping
        this.activeAnimation = {
            tween: scoreTween,
            textObject: textObject,
            finalScore: finalScore,
            displayScore: finalScore // Store the display score for skipping
        };

        return scoreTween;
    },

    // Cleanup method to destroy all created objects
    cleanup: function (createdObjects) {
        if (!createdObjects || !Array.isArray(createdObjects)) return;

        createdObjects.forEach(obj => {
            if (obj && obj.destroy) {
                obj.destroy();
            }
        });
    }
};

// Export additional functions
window.ScoreSystem = ScoreSystem;
window.applyFreeLeveUpPenalty = ScoreSystem.applyFreeLeveUpPenalty.bind(ScoreSystem);
window.initializeDynamicScoring = ScoreSystem.initializeDynamicScoring.bind(ScoreSystem);
window.cleanupDynamicScoring = ScoreSystem.cleanupDynamicScoring.bind(ScoreSystem);