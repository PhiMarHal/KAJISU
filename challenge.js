// challenge.js - Level-up Challenge System for Word Survivors
// Manages the level-up card selection and romaji typing challenge

// Configuration for challenge system
const CHALLENGE_CONFIG = {
    background: {
        alpha: 0.7,
        color: 0x000000
    },
    title: {
        text: "LEVEL UP!",
        fontSize: "32px",
        color: "#ffffff",
        y: 150
    },
    cards: {
        startY: 330,        // Y position for cards
        width: 220,         // Width of each card
        spacing: 240,       // Spacing between cards (width + 20 padding)
        backgroundColor: 0x444444
    },
    input: {
        width: 300,         // Width of input box
        height: 40,         // Height of input box
        y: 580,             // Y position of input box
        promptY: 530,       // Y position for prompt text
        buttonY: 630,       // Y position for submit button
        promptText: "TYPE ROMAJI TO UNLOCK MORE",
        submitText: "Submit",
        backgroundColor: 0x333333,
        borderColor: 0xaaaaaa,
        textColor: "#ffffff",
        errorColor: 0xff0000,
        successColor: 0x00ff00
    }
};

// Define depth constants for UI layers
const UI_DEPTHS = {
    BACKGROUND: 900,    // Background overlay
    CARDS: 950,         // Cards and main UI elements
    TEXT: 980,          // Text elements
    BUTTONS: 990,       // Interactive buttons
    MODAL: 1000         // Highest level for special alerts/notifications
};

// Challenge System - Manages level-up challenges and perk selection
const ChallengeSystem = {
    // Properties
    levelUpCards: [],       // Array to store all level-up UI elements
    perkCardContainer: null, // Container for perk cards
    inputBox: null,         // Input box for romaji typing
    inputText: null,        // Input text object
    submitButton: null,     // Submit button
    inputPrompt: null,      // Prompt text for input
    perkChallenge: null,    // Current challenge state
    romajiKeyHandler: null, // Keyboard event handler
    isRomajiInputActive: false, // Flag for input activity
    UI_DEPTHS: UI_DEPTHS,

    // Initialize the challenge system
    init: function (scene) {
        // Nothing needed on init - each challenge is created on demand
        console.log("Challenge system initialized");
    },

    // Start a level-up challenge
    startLevelUpChallenge: function (scene) {
        console.log("Starting level-up challenge");

        // First, explicitly ensure the game is paused
        gamePaused = true;

        // Pause the game physics and other systems
        if (window.PauseSystem) {
            // Force pause regardless of current state
            window.PauseSystem.pauseGame(true);
        } else {
            // Fallback pause implementation
            scene.physics.pause();

            // Pause all timers
            gameTimers.forEach(timer => {
                if (timer && timer.paused !== undefined) {
                    timer.paused = true;
                }
            });

            // Pause all effect timers
            activeEffects.timers.forEach(timer => {
                if (timer && timer.paused !== undefined) {
                    timer.paused = true;
                }
            });
        }

        // Ensure we don't have any lingering elements
        this.cleanupLevelUpCards();

        // Create semi-transparent background with high depth
        const levelUpBackground = scene.add.rectangle(
            600, 400, 1200, 800,
            CHALLENGE_CONFIG.background.color,
            CHALLENGE_CONFIG.background.alpha
        ).setDepth(UI_DEPTHS.BACKGROUND);

        // Create level up title with improved styling and high depth
        const levelUpTitle = scene.add.text(
            600, CHALLENGE_CONFIG.title.y,
            CHALLENGE_CONFIG.title.text,
            {
                fontFamily: 'Arial',
                fontSize: CHALLENGE_CONFIG.title.fontSize,
                color: CHALLENGE_CONFIG.title.color,
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setDepth(UI_DEPTHS.TEXT);

        // Get random perks (excluding already acquired ones)
        const selectedPerks = PerkSystem.getRandomPerks(4, acquiredPerks);

        // Create tracking variables for the challenge
        scene.perkChallenge = {
            currentCards: 1,        // Start with 1 card
            maxCards: 4,            // Maximum of 4 cards
            selectedPerks: selectedPerks,
            inputActive: true,      // Whether input is active
            attempts: 0,            // Number of failed attempts on current card
            currentIndex: 0,        // Current perk being challenged
            cardElements: []        // Store card elements for updating
        };

        // Store reference to the challenge
        this.perkChallenge = scene.perkChallenge;

        // Create a container for cards with high depth
        scene.perkCardContainer = scene.add.container(0, 0);
        scene.perkCardContainer.setDepth(UI_DEPTHS.CARDS);
        this.perkCardContainer = scene.perkCardContainer;

        // Create input field for romaji typing with appropriate depth
        this.createRomajiInput(scene, 600, CHALLENGE_CONFIG.input.y);

        // Create initial card(s)
        this.updatePerkCardDisplay(scene);

        // Store all level up UI elements in the global array
        this.levelUpCards = [
            levelUpBackground,
            levelUpTitle,
            scene.perkCardContainer,
            this.inputBox,
            this.inputText,
            this.submitButton,
            this.inputPrompt
        ];

        // Also store in the global levelUpCards variable for compatibility
        window.levelUpCards = this.levelUpCards;

        // Double check that the game is paused
        console.log("Level-up challenge started - game paused state:", gamePaused);
    },

    // Update the perk card display
    updatePerkCardDisplay: function (scene) {
        if (!scene.perkChallenge) return;

        console.log("Updating perk card display, cards: " + scene.perkChallenge.currentCards);

        // First, completely clear the container and element tracking
        scene.perkCardContainer.removeAll(true); // true means destroy children
        scene.perkChallenge.cardElements = [];

        // Calculate positions for cards
        const cardCount = scene.perkChallenge.currentCards;
        const totalWidth = cardCount * CHALLENGE_CONFIG.cards.width +
            (cardCount - 1) * (CHALLENGE_CONFIG.cards.spacing - CHALLENGE_CONFIG.cards.width);
        const startX = 600 - (totalWidth / 2) + (CHALLENGE_CONFIG.cards.width / 2);

        console.log("Creating " + cardCount + " cards");

        // Create each card
        for (let i = 0; i < cardCount; i++) {
            const cardX = startX + i * CHALLENGE_CONFIG.cards.spacing;
            const perk = scene.perkChallenge.selectedPerks[i];

            if (!perk) {
                console.log("Warning: No perk found for index " + i);
                continue;
            }

            console.log("Creating card for perk: " + perk.id + " at position " + i);

            // Determine what to show based on state
            const isCurrentChallenge = (i === scene.perkChallenge.currentCards - 1 &&
                scene.perkChallenge.inputActive &&
                i === scene.perkChallenge.currentIndex);

            // Show partial or full details based on attempts
            const showKana = !isCurrentChallenge || scene.perkChallenge.attempts >= 1;
            const showRomaji = !isCurrentChallenge || scene.perkChallenge.attempts >= 2;
            const showEnglish = !isCurrentChallenge || scene.perkChallenge.attempts >= 2;
            const showDescription = !isCurrentChallenge || scene.perkChallenge.attempts >= 2;

            // Create card elements with appropriate options
            const cardElements = window.CardSystem.createPerkCardElements(scene, perk, cardX, CHALLENGE_CONFIG.cards.startY, {
                container: scene.perkCardContainer,
                showKana: showKana,
                showRomaji: showRomaji,
                showEnglish: showEnglish,
                showDescription: showDescription,
                makeInteractive: true,
                perkCallback: (perkId) => {
                    this.selectCard(scene, perkId);
                }
            });

            // Store card elements including background
            scene.perkChallenge.cardElements.push({
                background: cardElements[0], // First element is the background
                elements: cardElements.slice(1) // Rest are text elements
            });
        }

        // Update input visibility based on challenge state
        this.updateInputVisibility(scene);

        console.log("Card display updated, now showing " + scene.perkChallenge.cardElements.length + " cards");
    },

    // Function to create the input field for romaji typing
    createRomajiInput: function (scene, x, y) {
        // Create input prompt with depth
        this.inputPrompt = scene.add.text(
            x, y - 50,
            CHALLENGE_CONFIG.input.promptText,
            {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff'
            }
        ).setOrigin(0.5).setDepth(UI_DEPTHS.TEXT);

        // Create input box background with depth
        this.inputBox = scene.add.rectangle(
            x, y,
            CHALLENGE_CONFIG.input.width,
            CHALLENGE_CONFIG.input.height,
            CHALLENGE_CONFIG.input.backgroundColor, 1
        ).setStrokeStyle(2, CHALLENGE_CONFIG.input.borderColor).setDepth(UI_DEPTHS.CARDS);

        // Create input text with depth
        this.inputText = scene.add.text(
            x - (CHALLENGE_CONFIG.input.width / 2) + 10,
            y - 15,
            '',
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: CHALLENGE_CONFIG.input.textColor
            }
        ).setDepth(UI_DEPTHS.TEXT);

        // Create submit button with depth
        this.submitButton = scene.add.text(
            x, y + 50,
            CHALLENGE_CONFIG.input.submitText,
            {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff',
                backgroundColor: '#008800',
                padding: { left: 15, right: 15, top: 8, bottom: 8 }
            }
        ).setOrigin(0.5).setDepth(UI_DEPTHS.BUTTONS);

        this.submitButton.setInteractive({ useHandCursor: true });

        // Add button hover effects
        this.submitButton.on('pointerover', function () {
            this.setStyle({ backgroundColor: '#00aa00' });
        });

        this.submitButton.on('pointerout', function () {
            this.setStyle({ backgroundColor: '#008800' });
        });

        // Store reference to this for use in callbacks
        const self = this;

        // Add click event
        this.submitButton.on('pointerdown', function () {
            self.validateRomajiInput(scene);
        });

        // Set a flag to track our custom keyboard handler
        scene.isRomajiInputActive = true;
        this.isRomajiInputActive = true;

        // Disable debug keys during the challenge
        this.disableDebugKeys(scene);

        // Create a one-time-use generic keyboard event handler
        this.romajiKeyHandler = function (event) {
            // Only process if the challenge is active
            if (!self.isRomajiInputActive || !scene.perkChallenge || !scene.perkChallenge.inputActive) return;

            // Handle different key types
            if (event.key === 'Backspace') {
                // Backspace - remove last character
                if (self.inputText.text.length > 0) {
                    self.inputText.setText(self.inputText.text.slice(0, -1));
                }
            }
            else if (event.key === 'Enter') {
                // Enter - submit answer
                self.validateRomajiInput(scene);
            }
            else if (/^[a-zA-Z\-]$/.test(event.key)) {
                // Letters and dash - add to input
                self.inputText.setText(self.inputText.text + event.key.toLowerCase());
            }
        };

        // Add the handler to the window keydown event
        window.addEventListener('keydown', this.romajiKeyHandler);
    },

    // Function to validate romaji input
    validateRomajiInput: function (scene) {
        if (!scene.perkChallenge || !scene.perkChallenge.inputActive) return;

        const userInput = this.inputText.text.trim().toLowerCase();
        const currentPerk = scene.perkChallenge.selectedPerks[scene.perkChallenge.currentIndex];

        if (!currentPerk) return;

        const correctRomaji = currentPerk.romaji.toLowerCase();

        if (userInput === correctRomaji) {
            // Correct answer
            this.handleCorrectRomaji(scene);
        } else {
            // Wrong answer
            this.handleWrongRomaji(scene);
        }

        // Clear input field
        this.inputText.setText('');
    },

    // Function to handle correct romaji input
    handleCorrectRomaji: function (scene) {
        // Play success sound/effect
        scene.tweens.add({
            targets: this.inputBox,
            strokeStyle: { value: CHALLENGE_CONFIG.input.successColor },
            alpha: { value: 0.8 },
            yoyo: true,
            duration: 200,
            repeat: 1,
            onComplete: () => {
                this.inputBox.setStrokeStyle(2, CHALLENGE_CONFIG.input.borderColor);
                this.inputBox.alpha = 1;
            }
        });

        // Show success message
        const successText = scene.add.text(
            600, 650,
            'Correct!',
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#00ff00',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        scene.tweens.add({
            targets: successText,
            y: successText.y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: function () {
                successText.destroy();
            }
        });

        // Unlock the current card (show full details)
        scene.perkChallenge.attempts = 2; // Force full details

        // If this is the final card (4th), give XP reward
        if (scene.perkChallenge.currentCards >= scene.perkChallenge.maxCards) {
            // Award 25% of XP needed for next level
            const xpReward = Math.ceil(heroExpToLevel * 0.25);
            console.log(`Calculating reward as 25% of ${heroExpToLevel} = ${xpReward}`);

            heroExp += xpReward;
            console.log(`XP before: ${heroExp - xpReward}, after: ${heroExp}, needed: ${heroExpToLevel}`);

            // Update the XP bar
            GameUI.updateExpBar(scene);

            // Show XP reward
            const rewardText = scene.add.text(
                600, 680,
                `+${xpReward} XP Bonus!`,
                {
                    fontFamily: 'Arial',
                    fontSize: '20px',
                    color: '#00ffff',
                    fontStyle: 'bold'
                }
            ).setOrigin(0.5);

            scene.tweens.add({
                targets: rewardText,
                y: rewardText.y - 30,
                alpha: 0,
                duration: 1500,
                onComplete: function () {
                    rewardText.destroy();
                }
            });

            // End the input challenge
            scene.perkChallenge.inputActive = false;
        } else {
            // Increment current card count
            scene.perkChallenge.currentCards = Math.min(
                scene.perkChallenge.currentCards + 1,
                scene.perkChallenge.maxCards
            );

            // Update current challenge index
            scene.perkChallenge.currentIndex = scene.perkChallenge.currentCards - 1;
            scene.perkChallenge.attempts = 0;
        }

        // Update card display
        this.updatePerkCardDisplay(scene);
    },

    // Function to handle incorrect romaji input
    handleWrongRomaji: function (scene) {
        console.log("Wrong romaji input, attempts: " + scene.perkChallenge.attempts);

        // Play failure sound/effect
        scene.tweens.add({
            targets: this.inputBox,
            strokeStyle: { value: CHALLENGE_CONFIG.input.errorColor },
            alpha: { value: 0.8 },
            yoyo: true,
            duration: 200,
            repeat: 1,
            onComplete: () => {
                this.inputBox.setStrokeStyle(2, CHALLENGE_CONFIG.input.borderColor);
                this.inputBox.alpha = 1;
            }
        });

        // Increment attempts
        scene.perkChallenge.attempts++;
        console.log("Attempts increased to: " + scene.perkChallenge.attempts);

        if (scene.perkChallenge.attempts === 1) {
            // First wrong attempt - show kana hint
            const hintText = scene.add.text(
                600, 650,
                'Hint: Check the kana!',
                {
                    fontFamily: 'Arial',
                    fontSize: '18px',
                    color: '#ffff00'
                }
            ).setOrigin(0.5);

            scene.tweens.add({
                targets: hintText,
                y: hintText.y - 20,
                alpha: 0,
                duration: 1500,
                onComplete: function () {
                    hintText.destroy();
                }
            });

            // Force show kana for the current card
            const currentPerk = scene.perkChallenge.selectedPerks[scene.perkChallenge.currentIndex];
            const cardX = scene.perkChallenge.cardElements[scene.perkChallenge.currentIndex].background.x;

            // Add kana text directly
            const kanaText = scene.add.text(
                cardX, 315,
                currentPerk.kana,
                { fontFamily: 'Arial', fontSize: '20px', color: '#ffffff' }
            ).setOrigin(0.5);

            scene.perkCardContainer.add(kanaText);
            scene.perkChallenge.cardElements[scene.perkChallenge.currentIndex].elements.push(kanaText);

            console.log("Added kana hint:", currentPerk.kana);
        } else {
            // Second wrong attempt - end input challenge
            const failText = scene.add.text(
                600, 650,
                'Challenge ended - pick a perk',
                {
                    fontFamily: 'Arial',
                    fontSize: '18px',
                    color: '#ff6666'
                }
            ).setOrigin(0.5);

            scene.tweens.add({
                targets: failText,
                y: failText.y - 20,
                alpha: 0,
                duration: 1500,
                onComplete: function () {
                    failText.destroy();
                }
            });

            // End input challenge and rebuild all cards with full details
            scene.perkChallenge.inputActive = false;

            // Clear and rebuild all cards
            scene.perkCardContainer.removeAll(true);
            this.updatePerkCardDisplay(scene);

            console.log("Challenge ended after second failure");
        }
    },

    // Function to update input visibility
    updateInputVisibility: function (scene) {
        const isInputVisible = scene.perkChallenge.inputActive;

        // Show/hide input elements
        this.inputBox.setVisible(isInputVisible);
        this.inputText.setVisible(isInputVisible);
        this.submitButton.setVisible(isInputVisible);
        this.inputPrompt.setVisible(isInputVisible);

        // If no longer active, show encouraging message
        if (!isInputVisible) {
            // Change prompt text
            this.inputPrompt.setText('Choose a perk to continue');
            this.inputPrompt.setVisible(true);
            this.inputPrompt.setColor('#aaaaaa');
        }
    },

    // Function to select a card and acquire the perk
    selectCard: function (scene, perkType) {
        console.log("Card selected with perk: " + perkType);

        // Acquire the selected perk
        acquirePerk(scene, perkType);

        // Update player stats text
        updatePlayerStatsText();

        // Update health bar
        GameUI.updateHealthBar(scene);

        // First make all the elements invisible for cleaner transition
        this.levelUpCards.forEach(element => {
            if (element && element.setVisible) {
                element.setVisible(false);
            }
        });

        if (scene.perkCardContainer) {
            scene.perkCardContainer.setVisible(false);
        }

        // Close the cards and resume the game
        this.cleanupLevelUpCards();

        // Flash the hero when completing level up
        scene.tweens.add({
            targets: player,
            alpha: 0.2,
            scale: 1.5,
            duration: 200,
            yoyo: true,
            repeat: 1,
            onComplete: function () {
                player.setScale(1);
                player.alpha = 1;
            }
        });

        console.log("Level up complete, game resumed");
    },

    // Clean up level up cards
    cleanupLevelUpCards: function () {
        console.log("Closing level up cards and cleaning up UI elements");

        // Clean up the window key handler
        if (this.romajiKeyHandler) {
            window.removeEventListener('keydown', this.romajiKeyHandler);
            this.romajiKeyHandler = null;
        }

        // Disable our custom handler
        this.isRomajiInputActive = false;

        // Re-enable debug keys
        this.restoreDebugKeys();

        const scene = game.scene.scenes[0];
        if (!scene || !scene.add) {
            console.log("Not in a valid scene, forcing cleanup");
            this.levelUpCards = [];
            window.levelUpCards = [];
            return;
        }

        if (scene.isRomajiInputActive) {
            scene.isRomajiInputActive = false;
        }

        // First, make all elements invisible for cleaner transition
        if (Array.isArray(this.levelUpCards)) {
            this.levelUpCards.forEach(element => {
                if (element && element.setVisible) {
                    element.setVisible(false);
                }
            });
        }

        // Then destroy all tracked UI elements
        if (Array.isArray(this.levelUpCards)) {
            this.levelUpCards.forEach(element => {
                if (element && typeof element !== 'undefined') {
                    if (element.destroy) {
                        element.destroy();
                    } else if (element.removeAll) {
                        element.removeAll(true);
                        element.destroy();
                    }
                }
            });
        }

        // Extra safety to clean up specific elements that might be missed
        if (this.perkCardContainer) {
            this.perkCardContainer.removeAll(true);
            this.perkCardContainer.destroy();
            this.perkCardContainer = null;
        }

        if (this.inputBox) {
            this.inputBox.destroy();
            this.inputBox = null;
        }

        if (this.inputText) {
            this.inputText.destroy();
            this.inputText = null;
        }

        if (this.submitButton) {
            this.submitButton.destroy();
            this.submitButton = null;
        }

        if (this.inputPrompt) {
            this.inputPrompt.destroy();
            this.inputPrompt = null;
        }

        // Reset challenge state
        this.perkChallenge = null;
        if (scene) {
            scene.perkChallenge = null;
        }

        // Reset global array
        this.levelUpCards = [];
        window.levelUpCards = [];

        // Resume game
        if (window.PauseSystem) {
            window.PauseSystem.resumeGame();
        } else {
            resumeGame(); // Fallback to global function
        }

        console.log("Level up cards cleanup complete");
    },

    // Helper function to disable debug keys
    disableDebugKeys: function (scene) {
        try {
            if (typeof disableDebugKeys === 'function') {
                disableDebugKeys.call(scene);
            } else {
                // Fallback implementation
                scene.debugKeysDisabled = true;
            }
        } catch (error) {
            console.error("Error disabling debug keys:", error);
        }
    },

    // Helper function to restore debug keys
    restoreDebugKeys: function () {
        try {
            const scene = game.scene.scenes[0];
            if (!scene) return;

            if (typeof restoreDebugKeys === 'function') {
                restoreDebugKeys.call(scene);
            } else {
                // Fallback implementation
                scene.debugKeysDisabled = false;
            }
        } catch (error) {
            console.error("Error restoring debug keys:", error);
        }
    }
};

// Export the challenge system for use in other files
window.ChallengeSystem = ChallengeSystem;

// This is the key part - defining a function that will replace the original showLevelUpCards
window.showLevelUpCards = function () {
    console.log("showLevelUpCards called - delegating to ChallengeSystem");
    ChallengeSystem.startLevelUpChallenge(this);
};