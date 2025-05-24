// challenge.js - Romaji Challenge System for Word Survivors
// Manages the romaji typing challenge during level-up

// Romaji Challenge System namespace
const RomajiChallengeSystem = {
    // Challenge state tracking
    state: {
        currentCards: 1,        // Start with 1 card
        maxCards: 4,            // Maximum of 4 cards
        selectedPerks: [],      // Perks selected for this challenge
        inputActive: true,      // Whether input is active
        attempts: 0,            // Number of failed attempts on current card
        currentIndex: 0,        // Current perk being challenged
        cardElements: []        // Store card elements for updating
    },

    // UI elements
    elements: {
        inputBox: null,
        inputText: null,
        submitButton: null,
        inputPrompt: null,
        levelUpContainer: null, // Main container for level up UI
        perkCardContainer: null // Container for perk cards
    },

    // Event handlers
    handlers: {
        keydownHandler: null,   // Keyboard event handler
    },

    // Debug keys state
    originalDebugKeysState: null,

    // Initialize the challenge system with a scene
    init: function (scene) {
        // Reset state
        this.resetState();

        console.log("Romaji Challenge System initialized");
    },

    // Reset challenge state
    resetState: function () {
        this.state = {
            currentCards: 1,
            maxCards: 4,
            selectedPerks: [],
            inputActive: true,
            attempts: 0,
            currentIndex: 0,
            cardElements: []
        };

        // Clean up UI elements references
        this.elements = {
            inputBox: null,
            inputText: null,
            submitButton: null,
            inputPrompt: null,
            levelUpContainer: null,
            perkCardContainer: null
        };

        // Clean up event handlers
        if (this.handlers.keydownHandler) {
            window.removeEventListener('keydown', this.handlers.keydownHandler);
            this.handlers.keydownHandler = null;
        }

        // Restore debug keys if they were disabled
        this.restoreDebugKeys();
    },

    // Show the level up challenge
    showLevelUpChallenge: function (scene) {
        // Pause the game
        PauseSystem.pauseGame();

        // Create a container with high depth for all level-up elements
        this.elements.levelUpContainer = scene.add.container(0, 0);
        this.elements.levelUpContainer.setDepth(1000); // Same depth as pause screen for consistency

        // Create semi-transparent background
        const centerX = game.config.width / 2;
        const centerY = game.config.height / 2;
        const levelUpBackground = scene.add.rectangle(centerX, centerY, game.config.width, game.config.height, 0x000000, 0.7);

        // Create level up title with improved styling
        const levelUpTitle = scene.add.text(
            centerX, game.config.height * 0.1875, // 150/800 = 0.1875
            'LEVEL UP!',
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);

        // Add background and title to container
        this.elements.levelUpContainer.add(levelUpBackground);
        this.elements.levelUpContainer.add(levelUpTitle);

        // Get random perks (excluding already acquired ones)
        this.state.selectedPerks = PerkSystem.getRandomPerks(4, acquiredPerks);

        // Create a container for cards (nested inside the main container)
        this.elements.perkCardContainer = scene.add.container(0, 0);
        this.elements.levelUpContainer.add(this.elements.perkCardContainer);

        // Create input field for romaji typing
        this.createRomajiInput(scene, centerX, game.config.height * 0.725); // 580/800 = 0.725

        // Create initial card(s)
        this.updatePerkCardDisplay(scene);

        // Store all level up UI elements in the global array for cleanup
        levelUpCards = [
            this.elements.levelUpContainer,
            // No need to add individual elements as they'll be destroyed with the container
        ];

        // Disable debug keys during the challenge
        this.disableDebugKeys(scene);
    },

    // Disable debug keys - improved without hardcoding specific keys
    disableDebugKeys: function (scene) {
        // Store the original debug keys state
        this.originalDebugKeysState = scene.debugKeysDisabled;

        // Disable debug keys flag
        scene.debugKeysDisabled = true;

        // No hardcoded key handling - just use the scene flag
        //console.log("Debug keys disabled for romaji challenge");
    },

    // Restore debug keys to their original state
    restoreDebugKeys: function () {
        const scene = game.scene.scenes[0];
        if (!scene) return;

        // If we have a saved state, restore it
        if (this.originalDebugKeysState !== null) {
            scene.debugKeysDisabled = this.originalDebugKeysState;
            this.originalDebugKeysState = null;
        } else {
            // Otherwise, default to enabling them
            scene.debugKeysDisabled = false;
        }

        //console.log("Debug keys restored after romaji challenge");
    },

    // Create romaji input field
    createRomajiInput: function (scene, x, y) {
        // Create input prompt
        this.elements.inputPrompt = scene.add.text(
            x, y - game.config.height * 0.0625, // 50/800 = 0.0625
            'TYPE ROMAJI TO UNLOCK MORE',
            {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        // Create input box background
        const inputBoxWidth = game.config.width * 0.25; // 300/1200 = 0.25
        this.elements.inputBox = scene.add.rectangle(x, y, inputBoxWidth, 40, 0x333333, 1)
            .setStrokeStyle(2, 0xaaaaaa);

        // Create input text (positioned relative to the left of the input box)
        this.elements.inputText = scene.add.text(
            x - (inputBoxWidth / 2) + 10, y - 15,
            '',
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#ffffff'
            }
        );

        // Create submit button - below the input box
        this.elements.submitButton = scene.add.text(
            x, y + game.config.height * 0.0625, // 50/800 = 0.0625
            'Submit',
            {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff',
                backgroundColor: '#008800',
                padding: { left: 15, right: 15, top: 8, bottom: 8 }
            }
        ).setOrigin(0.5);

        // Add all elements to the level-up container
        this.elements.levelUpContainer.add(this.elements.inputPrompt);
        this.elements.levelUpContainer.add(this.elements.inputBox);
        this.elements.levelUpContainer.add(this.elements.inputText);
        this.elements.levelUpContainer.add(this.elements.submitButton);

        this.elements.submitButton.setInteractive({ useHandCursor: true });

        // Add button hover effects
        this.elements.submitButton.on('pointerover', function () {
            this.setStyle({ backgroundColor: '#00aa00' });
        });

        this.elements.submitButton.on('pointerout', function () {
            this.setStyle({ backgroundColor: '#008800' });
        });

        // Add click event
        this.elements.submitButton.on('pointerdown', () => {
            this.validateRomajiInput(scene);
        });

        // Create a one-time-use generic keyboard event handler
        this.handlers.keydownHandler = (event) => {
            // Only process if the challenge is active
            if (!this.state.inputActive) return;

            // Handle different key types
            if (event.key === 'Backspace') {
                // Backspace - remove last character
                if (this.elements.inputText.text.length > 0) {
                    this.elements.inputText.setText(this.elements.inputText.text.slice(0, -1));
                }
            }
            else if (event.key === 'Enter') {
                // Enter - submit answer
                this.validateRomajiInput(scene);
            }
            else if (/^[a-zA-Z\-]$/.test(event.key)) {
                // Letters and dash - add to input
                this.elements.inputText.setText(this.elements.inputText.text + event.key.toLowerCase());
            }
        };

        // Add the handler to the window keydown event
        window.addEventListener('keydown', this.handlers.keydownHandler);
    },

    // Update the perk card display
    updatePerkCardDisplay: function (scene) {
        //console.log("Updating perk card display, cards: " + this.state.currentCards);

        // First, completely clear the container
        this.elements.perkCardContainer.removeAll(true); // true means destroy children
        this.state.cardElements = [];

        // Calculate positions for cards
        const cardCount = this.state.currentCards;
        const cardWidth = 220; // Fixed card width
        const cardSpacing = game.config.width * 0.0167; // 20/1200 = 0.0167
        const totalWidth = cardCount * cardWidth + (cardCount - 1) * cardSpacing;
        const centerX = game.config.width / 2;
        const startX = centerX - (totalWidth / 2) + (cardWidth / 2);

        //console.log("Creating " + cardCount + " cards");

        // Create each card
        for (let i = 0; i < cardCount; i++) {
            const cardX = startX + i * (cardWidth + cardSpacing);
            const perk = this.state.selectedPerks[i];

            if (!perk) {
                console.log("Warning: No perk found for index " + i);
                continue;
            }

            //console.log("Creating card for perk: " + perk.id + " at position " + i);

            // Determine what to show based on state
            const isCurrentChallenge = (i === this.state.currentCards - 1 &&
                this.state.inputActive &&
                i === this.state.currentIndex);

            // Show partial or full details based on attempts
            const showKana = !isCurrentChallenge || this.state.attempts >= 1;
            const showRomaji = !isCurrentChallenge || this.state.attempts >= 2;
            const showEnglish = !isCurrentChallenge || this.state.attempts >= 2;
            const showDescription = !isCurrentChallenge || this.state.attempts >= 2;

            // Create card elements with appropriate options
            const cardElements = window.CardSystem.createPerkCardElements(perk, cardX, game.config.height * 0.4125, { // 330/800 = 0.4125
                container: this.elements.perkCardContainer,
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
            this.state.cardElements.push({
                background: cardElements[0], // First element is the background
                elements: cardElements.slice(1) // Rest are text elements
            });
        }

        // Update input visibility based on challenge state
        this.updateInputVisibility();

        //console.log("Card display updated, now showing " + this.state.cardElements.length + " cards");
    },

    // Function to validate romaji input
    validateRomajiInput: function (scene) {
        if (!this.state.inputActive) return;

        const userInput = this.elements.inputText.text.trim().toLowerCase();
        const currentPerk = this.state.selectedPerks[this.state.currentIndex];

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
        this.elements.inputText.setText('');
    },

    // Function to handle correct romaji input
    handleCorrectRomaji: function (scene) {
        // Store a local reference to the input box to use in the tween callback
        // This prevents errors if elements are cleared before the tween completes
        const inputBox = this.elements.inputBox;

        if (!inputBox) return; // Safety check

        // Play success sound/effect with improved callback safety
        scene.tweens.add({
            targets: inputBox,
            strokeStyle: { value: 0x00ff00 },
            alpha: { value: 0.8 },
            yoyo: true,
            duration: 200,
            repeat: 1,
            onComplete: function () {
                // Check if the input box still exists before manipulating it
                if (inputBox && inputBox.active) {
                    inputBox.setStrokeStyle(2, 0xaaaaaa);
                    inputBox.alpha = 1;
                }
            }
        });

        // Show success message
        const centerX = game.config.width / 2;
        const successY = game.config.height * 0.8125; // 650/800 = 0.8125
        const successText = scene.add.text(
            centerX, successY,
            'Correct!',
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#00ff00',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // Add success text to container
        this.elements.levelUpContainer.add(successText);

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
        this.state.attempts = 2; // Force full details

        // If this is the final card (4th), give XP reward
        if (this.state.currentCards >= this.state.maxCards) {
            // Award 25% of XP needed for next level
            const currentLevel = playerLevel;
            const currentExpToLevel = xpForNextLevel(playerLevel);
            const currentExp = heroExp;

            const xpReward = Math.ceil(xpForNextLevel(playerLevel) * 0.25);
            //console.log(`Level ${currentLevel}: Calculating reward as 25% of ${currentExpToLevel} = ${xpReward}`);

            heroExp += xpReward;
            //console.log(`XP before: ${currentExp}, after: ${heroExp}, needed: ${xpForNextLevel(playerLevel)}`);

            // After updating the XP bar, check if something unexpected happened
            setTimeout(() => {
                console.log(`Post-update check: Level ${playerLevel}, XP ${heroExp}/${xpForNextLevel(playerLevel)}`);
                if (playerLevel > currentLevel) {
                    console.log(`WARNING: Level changed from ${currentLevel} to ${playerLevel} after challenge reward!`);
                }
            }, 100);
            GameUI.updateExpBar(scene);

            // Show XP reward
            const rewardY = game.config.height * 0.85; // 680/800 = 0.85
            const rewardText = scene.add.text(
                centerX, rewardY,
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
            this.state.inputActive = false;
        } else {
            // Increment current card count
            this.state.currentCards = Math.min(
                this.state.currentCards + 1,
                this.state.maxCards
            );

            // Update current challenge index
            this.state.currentIndex = this.state.currentCards - 1;
            this.state.attempts = 0;
        }

        // Update card display
        this.updatePerkCardDisplay(scene);
    },

    // Function to handle incorrect romaji input
    handleWrongRomaji: function (scene) {
        //console.log("Wrong romaji input, attempts: " + this.state.attempts);

        // Store a local reference to the input box to use in the tween callback
        const inputBox = this.elements.inputBox;

        if (!inputBox) return; // Safety check

        // Play failure sound/effect with improved callback safety
        scene.tweens.add({
            targets: inputBox,
            strokeStyle: { value: 0xff0000 },
            alpha: { value: 0.8 },
            yoyo: true,
            duration: 200,
            repeat: 1,
            onComplete: function () {
                // Check if the input box still exists before manipulating it
                if (inputBox && inputBox.active) {
                    inputBox.setStrokeStyle(2, 0xaaaaaa);
                    inputBox.alpha = 1;
                }
            }
        });

        // Increment attempts
        this.state.attempts++;
        //console.log("Attempts increased to: " + this.state.attempts);

        const centerX = game.config.width / 2;
        const messageY = game.config.height * 0.8125; // 650/800 = 0.8125

        if (this.state.attempts === 1) {
            // First wrong attempt - show kana hint
            const hintText = scene.add.text(
                centerX, messageY,
                'Hint: Check the kana!',
                {
                    fontFamily: 'Arial',
                    fontSize: '18px',
                    color: '#ffff00'
                }
            ).setOrigin(0.5);

            // Add to container
            this.elements.levelUpContainer.add(hintText);

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
            const currentPerk = this.state.selectedPerks[this.state.currentIndex];
            const cardX = this.state.cardElements[this.state.currentIndex].background.x;

            // Add kana text directly
            const kanaY = game.config.height * 0.39375; // 315/800 = 0.39375
            const kanaText = scene.add.text(
                cardX, kanaY,
                currentPerk.kana,
                { fontFamily: 'Arial', fontSize: '20px', color: '#ffffff' }
            ).setOrigin(0.5);

            this.elements.perkCardContainer.add(kanaText);
            this.state.cardElements[this.state.currentIndex].elements.push(kanaText);

            //console.log("Added kana hint:", currentPerk.kana);
        } else {
            // Second wrong attempt - end input challenge
            const failText = scene.add.text(
                centerX, messageY,
                'Challenge ended - pick a perk',
                {
                    fontFamily: 'Arial',
                    fontSize: '18px',
                    color: '#ff6666'
                }
            ).setOrigin(0.5);

            // Add to container
            this.elements.levelUpContainer.add(failText);

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
            this.state.inputActive = false;

            // Clear and rebuild all cards
            this.elements.perkCardContainer.removeAll(true);
            this.updatePerkCardDisplay(scene);

            //console.log("Challenge ended after second failure");
        }
    },

    // Function to update input visibility
    updateInputVisibility: function () {
        const isInputVisible = this.state.inputActive;

        // Safety check - make sure elements exist before trying to set visibility
        if (this.elements.inputBox) {
            this.elements.inputBox.setVisible(isInputVisible);
        }
        if (this.elements.inputText) {
            this.elements.inputText.setVisible(isInputVisible);
        }
        if (this.elements.submitButton) {
            this.elements.submitButton.setVisible(isInputVisible);
        }
        if (this.elements.inputPrompt) {
            this.elements.inputPrompt.setVisible(isInputVisible);
        }

        // If no longer active, show encouraging message
        if (!isInputVisible) {
            // Change subtitle text
            levelUpCards.forEach(element => {
                if (element && element.text === 'Type romaji to unlock more choices') {
                    element.setText('Choose a perk to continue');
                }
            });
        }
    },

    // Function to select a card and acquire the perk
    selectCard: function (scene, perkType) {
        //console.log("Card selected with perk: " + perkType);

        // Acquire the selected perk
        acquirePerk(scene, perkType);

        // Update player stats text
        GameUI.updateStatCircles(scene);

        // Update health bar
        GameUI.updateHealthBar(scene);

        // First make all the elements invisible for cleaner transition
        levelUpCards.forEach(element => {
            if (element && element.setVisible) {
                element.setVisible(false);
            }
        });

        if (this.elements.perkCardContainer) {
            this.elements.perkCardContainer.setVisible(false);
        }

        // Close the cards and resume the game
        this.closeLevelUpCards(scene);

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

                // Reset the level up lock
                window.levelUpInProgress = false;

                // Check if we have enough XP for another level up
                if (heroExp >= xpForNextLevel(playerLevel)) {
                    // Use the scene parameter passed to selectCard instead of looking up game.scene
                    setTimeout(() => {
                        if (heroExp >= xpForNextLevel(playerLevel) && !window.levelUpInProgress) {
                            window.levelUpInProgress = true;
                            levelUp.call(scene);
                        }
                    }, 100);
                }
            }
        });

        console.log("Level up complete, game resumed");
    },

    // Function to close level up cards and clean up resources
    closeLevelUpCards: function (scene) {
        //console.log("Closing level up cards and cleaning up UI elements");

        // Clean up the window key handler
        if (this.handlers.keydownHandler) {
            window.removeEventListener('keydown', this.handlers.keydownHandler);
            this.handlers.keydownHandler = null;
        }

        // Restore debug keys
        this.restoreDebugKeys();

        // Extra safety: check if we're in a valid scene
        if (!scene.add) {
            console.log("Not in a valid scene, forcing cleanup");
            levelUpCards = [];
            this.resetState();
            return;
        }

        // Destroy the main container which will destroy all child elements
        if (this.elements.levelUpContainer) {
            this.elements.levelUpContainer.destroy();
            this.elements.levelUpContainer = null;
        }

        // Reset references
        this.resetState();

        // Reset global array
        levelUpCards = [];

        // Resume game
        PauseSystem.resumeGame();
    }
};

// Export the system for use in other files
window.RomajiChallengeSystem = RomajiChallengeSystem;