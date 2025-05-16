// score.js - Score calculation and animation system for Word Survivors
// Handles score calculation and animated display on game end screens

// Score System namespace
const ScoreSystem = {
    // Calculate final score based on game outcome (victory or defeat)
    calculateScore: function (isVictory) {
        // Get boss spawn time from global configuration
        const bossSpawnTime = rankEnemyStartTimes[BOSS_CONFIG.max_rank] || 1200; // Default to 20 minutes (1200 seconds)
        const maximumScoreTime = bossSpawnTime * 2; // Cap at twice the boss spawn time

        let finalScore;

        if (isVictory) {
            // For victory:
            // 1. Calculate maximum possible points (time-capped score * 3)
            const maximumPoints = maximumScoreTime * 3;

            // 2. Subtract 1 point for each second on the timer (faster = better)
            // But ensure we don't go below 2x the maximum death score
            const timeDeduction = Math.min(elapsedTime - bossSpawnTime, maximumScoreTime);

            finalScore = Math.floor(maximumPoints - timeDeduction);
        } else {
            // For defeat: 1 point per second survived, capped at twice boss spawn time
            const cappedTime = Math.min(elapsedTime, maximumScoreTime);
            finalScore = Math.floor(cappedTime);
        }

        // Debug log the calculation
        console.log(
            "Score calculation:",
            isVictory ? "Victory" : "Defeat",
            "Boss spawn time:", bossSpawnTime,
            "Maximum score time:", maximumScoreTime,
            "Elapsed time:", elapsedTime,
            "Final score:", finalScore
        );

        return finalScore;
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

        // Parse the text to get the two segments (survived/in time and defeated/freed count)
        const textParts = originalText.split(/\s{2,}/); // Split on multiple spaces
        if (textParts.length !== 2) {
            console.error("Stats text doesn't have expected format:", originalText);
            return;
        }

        // Create two separate text objects for the stats (time and kills)
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

                // Create score text with larger font
                const scoreText = scene.add.text(
                    originalX,
                    originalY,
                    "0", // Start with 0
                    {
                        fontFamily: 'Arial',
                        fontSize: parseInt(statsText.style.fontSize) * 2, // Twice as large
                        color: '#FFD700', // Gold color
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

                        // Use a simple tween to count up from 0 to finalScore
                        this.animateScoreCounter(scene, scoreText, finalScore, createdObjects);
                    }
                });
            }
        });
    },

    // Completely rewritten animation using Phaser's built-in tween system
    animateScoreCounter: function (scene, textObject, finalScore, createdObjects) {
        if (!scene || !textObject) {
            console.error("Missing scene or textObject in animateScoreCounter");
            return;
        }

        // Round finalScore to an integer to avoid decimal issues
        finalScore = Math.floor(finalScore);
        console.log("Starting counter animation to:", finalScore);

        // Create a counter object that we'll tween
        const counter = { value: 0 };

        // The animation duration scales with the score
        const duration = Math.min(2000, 1000 + finalScore * 10);

        // Create the tween
        scene.tweens.add({
            targets: counter,
            value: finalScore,
            duration: duration,
            ease: 'Linear',

            // This will run on each frame update of the tween
            onUpdate: function () {
                // Update the text with the current integer value
                const currentValue = Math.floor(counter.value);
                textObject.setText(currentValue.toString());
                console.log("Counter update:", currentValue);
            },

            // When the tween completes
            onComplete: function () {
                console.log("Counter animation complete!");

                // Ensure the final value is displayed correctly
                textObject.setText(finalScore.toString());

                // Add a small celebration effect
                scene.tweens.add({
                    targets: textObject,
                    scale: 1.2,
                    duration: 200,
                    yoyo: true
                });
            }
        });
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

// Export the score system for use in other files
window.ScoreSystem = ScoreSystem;