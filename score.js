// score.js

// global variables
let scoreUpdateTimer = null;
let versionBonus = 8;
let victoryBonus = 3;

// Get current difficulty level (1-4)
function getCurrentDifficulty() {
    return window.DIFFICULTY_LEVEL ?? 3; // Default to difficulty 3
}

// Get total bonus (versionBonus × difficulty)
function getTotalBonus() {
    return versionBonus * getCurrentDifficulty();
}

// Enhanced Score System
const ScoreSystem = {
    // Calculate score continuously (universal) 
    calculateCurrentScore: function (isVictory = false, timeOverride = null) {
        const currentTime = timeOverride ?? elapsedTime;

        // Get boss spawn time from global configuration
        const bossSpawnTime = rankConfigs[BOSS_CONFIG.max_rank]?.startTime || 1200;
        const maximumScoreTime = bossSpawnTime * 2;

        const totalBonus = getTotalBonus(); // versionBonus × difficulty

        let baseScore;

        if (isVictory) {
            // Victory: use the original high-base calculation
            baseScore = this.calculateVictoryBonus(currentTime, bossSpawnTime, maximumScoreTime);
        } else {
            // Defeat: use time-based calculation with totalBonus
            const cappedTime = Math.min(currentTime, maximumScoreTime);
            baseScore = Math.floor(totalBonus * cappedTime);
        }

        // Apply Boss Rush mode score zeroing at 12 minutes
        if (window.BOSS_RUSH_MODE) {
            // Zero out the score at boss spawn time minus 1 minute (12 minutes)
            baseScore -= Math.floor(totalBonus * (bossSpawnTime - 120));
        }

        // Ensure score never goes below 0
        return Math.max(0, baseScore);
    },

    // Calculate victory bonus that decreases over time
    calculateVictoryBonus: function (currentTime, bossSpawnTime, maximumScoreTime) {
        const totalBonus = getTotalBonus(); // versionBonus × difficulty

        // Use the original victory calculation logic with totalBonus
        const maxTimeDeduction = maximumScoreTime / 3;
        const timeDeduction = Math.min(currentTime - bossSpawnTime, maxTimeDeduction);
        let victoryScore = Math.floor(totalBonus * victoryBonus * (maximumScoreTime - timeDeduction));

        // Apply 50% reduction for Boss Rush mode
        if (window.BOSS_RUSH_MODE) {
            victoryScore = Math.floor(victoryScore * 0.5);
            console.log(`Boss Rush victory bonus reduced by 50%: ${victoryScore}`);
        }

        return victoryScore;
    },

    // Initialize dynamic scoring (universal)
    initializeDynamicScoring: function (scene) {
        console.log("Initializing dynamic scoring, scene:", scene ? "found" : "missing");

        const totalBonus = getTotalBonus();
        console.log(`Total bonus: ${totalBonus} (versionBonus: ${versionBonus} × difficulty: ${getCurrentDifficulty()})`);

        // Start score update timer (keep original 1000ms - the totalBonus handles the scaling)
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

    // Update score display in the UI (without comma formatting)
    updateScoreDisplay: function (scoreValue) {
        const scene = game.scene.scenes[0];
        if (!scene || !scene.statusText) return;

        const timeText = formatTime(elapsedTime);
        const difficultyLevel = getCurrentDifficulty();

        // Display score as plain number (no comma formatting)
        const formattedScore = scoreValue.toString();

        // Include difficulty level in the display
        scene.statusText.setText(`Survived: ${timeText}  Score: ${formattedScore} (D${difficultyLevel})`);
    },

    // Get final score (for game end)
    getFinalScore: function (isVictory) {
        const finalScore = this.calculateCurrentScore(isVictory);
        console.log(`Final score: ${finalScore} (totalBonus: ${getTotalBonus()})`);
        return finalScore;
    },

    // Cleanup dynamic scoring
    cleanupDynamicScoring: function () {
        if (scoreUpdateTimer) {
            scoreUpdateTimer.remove();
            scoreUpdateTimer = null;
        }
    },

    // Calculate final score based on game outcome (legacy method for compatibility)
    calculateScore: function (isVictory) {
        return this.calculateCurrentScore(isVictory);
    },

    // Updated animateScoreReveal with victory animation support
    animateScoreReveal: function (scene, statsText, finalScore, isVictory = false) {
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

                // Create score text with larger font, starting at 0
                const scoreText = scene.add.text(
                    originalX,
                    originalY,
                    "0", // Start at 0
                    {
                        fontFamily: 'Arial',
                        fontSize: parseInt(statsText.style.fontSize) * 2, // Twice as large
                        color: '#FFD700', // Gold color (no more red for negative)
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

                        if (isVictory) {
                            // Two-stage animation: survival score → pause → victory bonus
                            this.animateVictoryScore(scene, scoreText, finalScore, createdObjects);
                        } else {
                            // Single-stage animation for defeats
                            this.animateScoreCounter(scene, scoreText, finalScore, createdObjects, 0);
                        }
                    }
                });
            }
        });
    },

    // New function for two-stage victory score animation
    animateVictoryScore: function (scene, textObject, finalVictoryScore, createdObjects) {
        console.log("Starting victory score animation");

        // Calculate the survival score (without victory bonus)
        const survivalScore = this.calculateCurrentScore(false);

        console.log(`Victory animation: survival=${survivalScore}, final=${finalVictoryScore}`);

        // Stage 1: Animate to survival score (NOT final stage)
        this.animateScoreCounter(scene, textObject, survivalScore, createdObjects, 0, () => {
            // Stage 2: Pause for 1 second, then continue to victory bonus
            console.log("Survival score reached, pausing before victory bonus");

            scene.time.delayedCall(1000, () => {
                console.log("Adding victory bonus");

                // Continue animation from survival score to final victory score (IS final stage)
                this.animateScoreCounter(scene, textObject, finalVictoryScore, createdObjects, survivalScore, null, true);
            });
        }, false); // false = NOT the final stage
    },

    // Add this property to track active animations:
    activeAnimation: null,

    // Updated showFinalScore function without comma formatting
    showFinalScore: function (scene, textObject, finalScore, isFinalStage = true) {
        if (!scene || !textObject || textObject.active === false) return;

        // Display as plain number (no comma formatting)
        textObject.setText(finalScore.toString());

        // Always use gold color (no more negative score handling)
        textObject.setColor('#FFD700');

        // Add celebration effect (scaling pulse)
        scene.tweens.add({
            targets: textObject,
            scale: 1.2,
            duration: 200,
            yoyo: true
        });

        // Only trigger external integrations (like Farcade SDK) on the final stage
        if (isFinalStage) {
            console.log("Final stage reached - external integrations can now trigger");

            // This is where Farcade SDK integration will hook in
            // The merge script will inject the Farcade SDK call here, but only when isFinalStage is true
        }
    },

    // Updated skipToFinalScore function for two-stage animation
    skipToFinalScore: function (scene) {
        // If no active animation, do nothing
        if (!this.activeAnimation) {
            return false;
        }

        // Stop the active tween
        if (this.activeAnimation.tween) {
            this.activeAnimation.tween.stop();
        }

        // Show the final score with celebration (skip directly to final victory score)
        this.showFinalScore(
            scene,
            this.activeAnimation.textObject,
            this.activeAnimation.displayScore
        );

        // Clear animation reference
        this.activeAnimation = null;

        return true;
    },

    // Updated animateScoreCounter with callback support and no comma formatting
    animateScoreCounter: function (scene, textObject, finalScore, createdObjects, startValue = 0, onCompleteCallback = null, isFinalStage = true) {
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

                    // Display as plain number (no comma formatting)
                    textObject.setText(currentValue.toString());

                    // Keep gold color (no more negative score red)
                    textObject.setColor('#FFD700');
                }
            },
            onComplete: () => {
                console.log("Counter animation complete!");

                // Clear the active animation reference
                this.activeAnimation = null;

                // Show final score with celebration effect (pass isFinalStage)
                this.showFinalScore(scene, textObject, finalScore, isFinalStage);

                // Call the completion callback if provided
                if (onCompleteCallback) {
                    onCompleteCallback();
                }
            }
        });

        // Store animation details for potential skipping
        this.activeAnimation = {
            tween: scoreTween,
            textObject: textObject,
            finalScore: finalScore,
            displayScore: finalScore, // Store the display score for skipping
            isFinalStage: isFinalStage // Store whether this is the final stage
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
window.initializeDynamicScoring = ScoreSystem.initializeDynamicScoring.bind(ScoreSystem);
window.cleanupDynamicScoring = ScoreSystem.cleanupDynamicScoring.bind(ScoreSystem);