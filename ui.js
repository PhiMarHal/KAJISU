// ui.js - UI System Integration for Word Survivors
// Central file to import and initialize all UI subsystems

// Load order is important - load more basic components first
window.addEventListener('DOMContentLoaded', function () {
    console.log("UI systems loading...");
});

// Initialize all UI systems when the game starts
function initializeUISystems(scene) {
    console.log("Initializing UI systems");

    // Initialize Card System (no scene-specific initialization needed)
    console.log("Card system ready");

    // Initialize Pause System
    if (window.PauseSystem) {
        window.PauseSystem.init(scene);
        console.log("Pause system initialized");
    }

    // Initialize Challenge System
    if (window.ChallengeSystem) {
        window.ChallengeSystem.init(scene);
        console.log("Challenge system initialized");
    }

    console.log("All UI systems initialized");

    // Setup key bindings - this is critical for the P key to work
    setupKeyBindings(scene);
}

// Setup key bindings for UI systems
function setupKeyBindings(scene) {
    // Setup P key for pause
    scene.input.keyboard.on('keydown-P', function () {
        console.log("P key pressed from UI system");
        if (window.PauseSystem) {
            window.PauseSystem.handlePauseKey();
        } else {
            console.warn("PauseSystem not available");
        }
    });
}

// Handle game resets
function resetUISystems() {
    console.log("Resetting UI systems");

    // Reset Challenge System
    if (window.ChallengeSystem) {
        // Clean up any active challenges
        if (window.ChallengeSystem.perkChallenge) {
            window.ChallengeSystem.cleanupLevelUpCards();
        }
    }

    // Reset Pause System
    if (window.PauseSystem) {
        // Ensure game is not paused on reset
        if (window.PauseSystem.isPaused) {
            window.PauseSystem.resumeGame();
        }
    }
}

// Export UI management functions
window.UISystems = {
    initialize: initializeUISystems,
    reset: resetUISystems
};