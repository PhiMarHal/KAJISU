// startMenu.js - Pre-Game Start Menu System for KAJISU

// IMMEDIATELY set the global variable before any other scripts can access it
window.KAJISULI_MODE = (() => {
    // If FARCADE_MODE is on, always use KAJISULI mode
    if (typeof FARCADE_MODE !== 'undefined' && FARCADE_MODE) {
        return true;
    }

    // Default to false (desktop mode) when no FARCADE_MODE
    return false;
})();

// Set learning challenge preference - default to false
window.LEARNING_CHALLENGE_ENABLED = false;

// Set difficulty mode - default to 2
window.DIFFICULTY_LEVEL = 2;

// Set stranger music preference - default to false
window.STRANGE_MUSIC_ENABLED = false;

const StartMenuSystem = {
    // Menu state
    state: {
        kajisuliMode: false,
        learningChallengeEnabled: false,
        difficultyLevel: 2,
        bossRushMode: false,
        strangedMusicEnabled: false,
        initialized: false
    },

    // UI elements
    elements: {
        menuContainer: null,
        learningToggle: null,
        infoMessage: null,
        backgroundCanvas: null,
        circlesAnimation: null
    },

    // Info messages for each toggle state
    infoMessages: {
        portraitScreen: {
            on: "Better for phones",
            off: "Better for desktops"
        },
        learningChallenge: {
            on: "Type to unlock perks. Gain XP for success",
            off: "Select perks freely on lvlup. No extra EXP"
        },
        difficulty: {
            1: "A relaxing, casual run. Your foes are few and slow",
            2: "Start here. Discover the loop",
            3: "The original KAJISULI experience. More aggressive enemies",
            4: "Only for veteran loopers. Kanjis are out for blood."
        },
        bossRush: {
            on: "Warp to the boss fight. Trade score penalties for lvlups",
            off: "Start at the beginning"
        },
        strangeMusic: {
            on: "Early suno.ai experiments. Only for the strongest ears",
            off: "Back to our regular soundtrack"
        }
    },

    // Check if we're in FARCADE mode
    isFarcadeMode: function () {
        return typeof FARCADE_MODE !== 'undefined' && FARCADE_MODE;
    },

    // Get responsive font sizes based on screen dimensions
    getResponsiveSizes: function () {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const minDimension = Math.min(screenWidth, screenHeight);

        // Use the original scaling approach that worked perfectly
        const scaleFactor = Math.max(0.5, Math.min(1.2, minDimension / 600));

        return {
            titleSize: Math.floor(48 * scaleFactor),
            toggleSize: Math.floor(24 * scaleFactor),
            infoSize: Math.floor(16 * scaleFactor),
            spacing: Math.floor(60 * scaleFactor),
            padding: Math.floor(20 * scaleFactor),
            lineSpacing: Math.floor(12 * scaleFactor)
        };
    },

    // Initialize the pre-game start menu
    init: function () {
        this.state.kajisuliMode = window.KAJISULI_MODE;
        this.state.learningChallengeEnabled = window.LEARNING_CHALLENGE_ENABLED;
        this.state.difficultyLevel = window.DIFFICULTY_LEVEL;
        this.state.bossRushMode = window.BOSS_RUSH_MODE;
        this.state.strangeMusicEnabled = window.STRANGE_MUSIC_ENABLED;
        this.applyCSSMode();
        this.createHTMLMenu();
        this.state.initialized = true;
    },

    // Apply CSS mode class
    applyCSSMode: function () {
        if (this.state.kajisuliMode) {
            document.body.classList.add('kajisuli-mode');
        } else {
            document.body.classList.remove('kajisuli-mode');
        }
    },

    // Show info message
    showInfoMessage: function (message) {
        if (this.elements.infoMessage) {
            this.elements.infoMessage.textContent = message;
            this.elements.infoMessage.style.opacity = '1';
            this.elements.infoMessage.style.transform = 'translateX(-50%) translateY(0)';
        }
    },

    // Hide info message
    hideInfoMessage: function () {
        if (this.elements.infoMessage) {
            this.elements.infoMessage.style.opacity = '0';
            this.elements.infoMessage.style.transform = 'translateX(-50%) translateY(10px)';
        }
    },

    // Create HTML-based start menu
    createHTMLMenu: function () {
        const sizes = this.getResponsiveSizes();
        const screenWidth = window.innerWidth;

        // Create main menu container
        this.elements.menuContainer = document.createElement('div');
        this.elements.menuContainer.id = 'start-menu';
        this.elements.menuContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #1a1a1a;
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 1000;
        font-family: Arial, sans-serif;
        color: white;
        padding: 0;
        margin: 0;
        box-sizing: border-box;
        overflow: hidden;
    `;

        // === 1. Title: Positioned at 25vh ===
        this.titleElement = document.createElement('div');
        this.titleElement.textContent = 'ENTER THE LOOP';

        this.titleElement.style.cssText = `
        font-size: ${sizes.titleSize}px;
        font-weight: bold;
        color: #FFD700;
        border: 4px solid #FFD700;
        padding: ${sizes.padding}px ${sizes.padding * 2}px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
        line-height: 1.1;
        max-width: 90%;
        width: fit-content;
        box-shadow: 0 0 0 0 #FFD700;
        background-color: rgba(26, 26, 26, 0.8);
        backdrop-filter: blur(5px);
        z-index: 1001;
        position: absolute;
        top: 25vh;
        left: 50%;
        transform: translateX(-50%);
        white-space: nowrap;
    `;

        this.titleElement.addEventListener('mouseenter', () => {
            this.titleElement.style.color = '#FFFFFF';
            this.titleElement.style.boxShadow = '0 0 0 2px #FFD700';
            this.titleElement.style.backgroundColor = 'rgba(26, 26, 26, 0.9)';
        });

        this.titleElement.addEventListener('mouseleave', () => {
            this.titleElement.style.color = '#FFD700';
            this.titleElement.style.boxShadow = '0 0 0 0 #FFD700';
            this.titleElement.style.backgroundColor = 'rgba(26, 26, 26, 0.8)';
        });

        this.titleElement.addEventListener('click', () => {
            this.startGame();
        });

        this.elements.menuContainer.appendChild(this.titleElement);

        // === 3. Toggles Container: Positioned at 55vh ===
        const containerWidth = Math.min(600, screenWidth * 0.9);
        const togglesContainer = document.createElement('div');
        togglesContainer.style.cssText = `
        position: absolute;
        top: 55vh;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        gap: ${sizes.lineSpacing * 1.5}px;
        width: ${containerWidth}px;
        max-width: 95%;
        z-index: 1001;
    `;

        // Helper to create toggle with data attribute for resize updates
        const createToggleWithLabel = (label, isEnabled, onToggle) => {
            const container = document.createElement('div');
            container.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all 0.2s ease;
            width: 100%;
        `;

            const toggleLabel = document.createElement('div');
            toggleLabel.textContent = label;
            toggleLabel.dataset.toggleLabel = ''; // Mark for resize updates
            toggleLabel.style.cssText = `
            font-size: ${sizes.toggleSize}px;
            color: ${isEnabled ? '#FFD700' : '#FFFFFF'};
            transition: all 0.3s ease;
        `;

            const toggleContainer = document.createElement('div');
            toggleContainer.style.cssText = `
            display: flex;
            align-items: center;
        `;

            const toggleBg = document.createElement('div');
            toggleBg.style.cssText = `
            width: ${sizes.toggleSize * 2.5}px;
            height: ${sizes.toggleSize * 1.2}px;
            background-color: ${isEnabled ? '#FFD700' : '#666666'};
            border-radius: ${sizes.toggleSize}px;
            position: relative;
            transition: all 0.3s ease;
        `;

            const toggleCircle = document.createElement('div');
            toggleCircle.style.cssText = `
            width: ${sizes.toggleSize * 0.8}px;
            height: ${sizes.toggleSize * 0.8}px;
            background-color: #FFFFFF;
            border-radius: 50%;
            position: absolute;
            top: ${sizes.toggleSize * 0.2}px;
            left: ${isEnabled ? sizes.toggleSize * 1.5 : sizes.toggleSize * 0.2}px;
            transition: all 0.3s ease;
        `;

            toggleBg.appendChild(toggleCircle);
            toggleContainer.appendChild(toggleBg);
            container.appendChild(toggleLabel);
            container.appendChild(toggleContainer);

            // Store references
            container.toggleBg = toggleBg;
            container.toggleCircle = toggleCircle;
            container.toggleLabel = toggleLabel;
            container.isEnabled = isEnabled;

            container.addEventListener('click', () => {
                const newState = !container.isEnabled;
                this.updateToggleState(container, newState, sizes);
                onToggle(newState);
            });

            return container;
        };

        // Add toggles
        if (!this.isFarcadeMode()) {
            const portraitToggle = createToggleWithLabel('Portrait Screen', this.state.kajisuliMode, (enabled) => {
                this.selectMode(enabled);
                this.showInfoMessage(this.infoMessages.portraitScreen[enabled ? 'on' : 'off']);
            });
            togglesContainer.appendChild(portraitToggle);

            const learningToggle = createToggleWithLabel('Learning Challenge', this.state.learningChallengeEnabled, (enabled) => {
                this.toggleLearningChallenge(enabled);
                this.showInfoMessage(this.infoMessages.learningChallenge[enabled ? 'on' : 'off']);
            });
            this.elements.learningToggle = learningToggle;
            togglesContainer.appendChild(learningToggle);
        }

        const bossRushToggle = createToggleWithLabel('Boss Rush', this.state.bossRushMode, (enabled) => {
            this.toggleBossRush(enabled);
            this.showInfoMessage(this.infoMessages.bossRush[enabled ? 'on' : 'off']);
        });
        togglesContainer.appendChild(bossRushToggle);

        const strangeMusicToggle = createToggleWithLabel('Strange Music', this.state.strangeMusicEnabled, (enabled) => {
            this.toggleStrangeMusic(enabled);
            this.showInfoMessage(this.infoMessages.strangeMusic[enabled ? 'on' : 'off']);
        });
        togglesContainer.appendChild(strangeMusicToggle);

        // Add difficulty selector at the bottom
        const difficultySelector = this.createDifficultySelector(sizes);
        togglesContainer.appendChild(difficultySelector);

        this.elements.menuContainer.appendChild(togglesContainer);

        // === 4. Info Message ===
        const infoContainerWidth = Math.min(600, screenWidth * 0.9);
        this.elements.infoMessage = document.createElement('div');
        this.elements.infoMessage.style.cssText = `
        position: absolute;
        bottom: ${sizes.padding * 2}px;
        left: 50%;
        transform: translateX(-50%);
        width: ${infoContainerWidth}px;
        max-width: 95%;
        font-size: ${sizes.infoSize}px;
        color: #FFD700;
        text-align: center;
        opacity: 0;
        transition: all 0.3s ease;
        pointer-events: none;
        line-height: 1.4;
        padding: ${sizes.padding / 2}px ${sizes.padding}px;
        background-color: rgba(0, 0, 0, 0.8);
        border: 1px solid #FFD700;
        border-radius: 4px;
        box-sizing: border-box;
        backdrop-filter: blur(5px);
        z-index: 1001;
    `;
        this.elements.infoMessage.textContent = 'Welcome, Looper';
        this.elements.menuContainer.appendChild(this.elements.infoMessage);

        // === Add to DOM ===
        document.body.appendChild(this.elements.menuContainer);

        // === Create background canvas immediately (after DOM insertion) ===
        this.createBackgroundCanvas();

        // Setup keyboard and animations
        this.setupKeyboardHandler();
        this.startAnimations();

        // Initial message
        setTimeout(() => {
            this.showInfoMessage('Welcome, Looper');
        }, 1000);
    },

    // Create a 4-level difficulty selector with sliding dot and background
    createDifficultySelector: function (sizes) {
        const container = document.createElement('div');
        container.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.2s ease;
        width: 100%;
    `;

        const difficultyLabel = document.createElement('div');
        difficultyLabel.textContent = 'Difficulty';
        difficultyLabel.dataset.toggleLabel = '';
        difficultyLabel.style.cssText = `
        font-size: ${sizes.toggleSize}px;
        color: #FFD700;
        transition: all 0.3s ease;
    `;

        const selectorContainer = document.createElement('div');
        selectorContainer.style.cssText = `
        display: flex;
        align-items: center;
    `;

        // Create the main selector background (gray)
        const selectorBg = document.createElement('div');
        selectorBg.style.cssText = `
        width: ${sizes.toggleSize * 8}px;
        height: ${sizes.toggleSize * 1.2}px;
        background-color: #666666;
        border-radius: ${sizes.toggleSize * 0.6}px;
        position: relative;
        transition: all 0.3s ease;
        cursor: pointer;
    `;

        // Calculate positions for the 4 difficulty levels
        const positions = [
            sizes.toggleSize * 1,    // Position 1
            sizes.toggleSize * 3,    // Position 2
            sizes.toggleSize * 5,    // Position 3
            sizes.toggleSize * 7     // Position 4
        ];

        // Add roman numerals at fixed positions
        const romanNumerals = ['I', 'II', 'III', 'IV'];
        romanNumerals.forEach((numeral, index) => {
            const numeralElement = document.createElement('div');
            numeralElement.style.cssText = `
            position: absolute;
            left: ${positions[index]}px;
            top: 50%;
            transform: translate(-50%, -50%);
            color: #FFFFFF;
            font-size: ${sizes.toggleSize * 0.7}px; // Slightly bigger numerals
            font-weight: bold;
            pointer-events: none;
            transition: all 0.3s ease;
        `;
            numeralElement.textContent = numeral;
            selectorBg.appendChild(numeralElement);
        });

        // Create sliding gold background that follows the dot
        const slidingBackground = document.createElement('div');
        const backgroundWidth = sizes.toggleSize * 2.2; // Wider to fill gray space at extremes
        slidingBackground.style.cssText = `
        position: absolute;
        width: ${backgroundWidth}px;
        height: ${sizes.toggleSize * 1.2}px;
        background-color: #FFD700;
        border-radius: ${sizes.toggleSize * 0.6}px;
        left: ${positions[this.state.difficultyLevel - 1] - backgroundWidth / 2}px;
        top: 0;
        transition: all 0.3s ease;
        pointer-events: none;
    `;
        selectorBg.appendChild(slidingBackground);

        // Create the sliding white dot
        const slidingDot = document.createElement('div');
        slidingDot.style.cssText = `
        position: absolute;
        width: ${sizes.toggleSize * 0.8}px;
        height: ${sizes.toggleSize * 0.8}px;
        background-color: #FFFFFF;
        border-radius: 50%;
        left: ${positions[this.state.difficultyLevel - 1] - (sizes.toggleSize * 0.4)}px;
        top: ${sizes.toggleSize * 0.2}px;
        transition: all 0.3s ease;
        pointer-events: none;
        z-index: 1;
    `;
        selectorBg.appendChild(slidingDot);

        // Add click handler to the main background
        selectorBg.addEventListener('click', (e) => {
            const rect = selectorBg.getBoundingClientRect();
            const clickX = e.clientX - rect.left;

            // Determine which section was clicked
            let newDifficulty = 1;
            const sectionWidth = (sizes.toggleSize * 8) / 4;

            for (let i = 0; i < 4; i++) {
                if (clickX >= i * sectionWidth && clickX < (i + 1) * sectionWidth) {
                    newDifficulty = i + 1;
                    break;
                }
            }

            // Update difficulty and animate
            this.setDifficulty(newDifficulty);
            this.updateDifficultySlider(slidingDot, slidingBackground, newDifficulty, positions, sizes);
            this.showInfoMessage(this.infoMessages.difficulty[newDifficulty]);
        });

        selectorContainer.appendChild(selectorBg);
        container.appendChild(difficultyLabel);
        container.appendChild(selectorContainer);

        // Store references for resize updates
        container.selectorBg = selectorBg;
        container.difficultyLabel = difficultyLabel;
        container.slidingDot = slidingDot;
        container.slidingBackground = slidingBackground;
        container.positions = positions;

        return container;
    },

    // Add this new helper function to update the slider position
    updateDifficultySlider: function (slidingDot, slidingBackground, difficulty, positions, sizes) {
        const position = positions[difficulty - 1];
        const backgroundWidth = sizes.toggleSize * 2.2; // Match the wider background

        // Move the dot
        slidingDot.style.left = `${position - (sizes.toggleSize * 0.4)}px`;

        // Move the gold background
        slidingBackground.style.left = `${position - backgroundWidth / 2}px`;
    },

    // Update difficulty selector sizes during resize
    updateDifficultySelectorSizes: function (container, sizes) {
        if (!container.selectorBg || !container.slidingDot || !container.slidingBackground) return;

        const selectorBg = container.selectorBg;
        const slidingDot = container.slidingDot;
        const slidingBackground = container.slidingBackground;

        // Recalculate positions
        const newPositions = [
            sizes.toggleSize * 1,
            sizes.toggleSize * 3,
            sizes.toggleSize * 5,
            sizes.toggleSize * 7
        ];

        // Update main background size
        selectorBg.style.width = `${sizes.toggleSize * 8}px`;
        selectorBg.style.height = `${sizes.toggleSize * 1.2}px`;
        selectorBg.style.borderRadius = `${sizes.toggleSize * 0.6}px`;

        // Update roman numerals positions and sizes
        const numeralElements = selectorBg.querySelectorAll('div');
        let numeralIndex = 0;
        numeralElements.forEach(element => {
            if (element !== slidingBackground && element !== slidingDot && numeralIndex < 4) {
                element.style.left = `${newPositions[numeralIndex]}px`;
                element.style.fontSize = `${sizes.toggleSize * 0.7}px`; // Match the bigger font size
                numeralIndex++;
            }
        });

        // Update sliding background size and position
        const backgroundWidth = sizes.toggleSize * 2.2; // Match the wider background
        slidingBackground.style.width = `${backgroundWidth}px`;
        slidingBackground.style.height = `${sizes.toggleSize * 1.2}px`;
        slidingBackground.style.borderRadius = `${sizes.toggleSize * 0.6}px`;

        // Update sliding dot size
        slidingDot.style.width = `${sizes.toggleSize * 0.8}px`;
        slidingDot.style.height = `${sizes.toggleSize * 0.8}px`;
        slidingDot.style.top = `${sizes.toggleSize * 0.2}px`;

        // Update positions for current difficulty
        this.updateDifficultySlider(slidingDot, slidingBackground, this.state.difficultyLevel, newPositions, sizes);

        // Store updated positions
        container.positions = newPositions;
    },

    // Update difficulty display with dots - keep dots white always
    updateDifficultyDisplay: function (selectorBg, selectedDifficulty, sizes) {
        const segments = selectorBg.querySelectorAll('[data-difficulty]');
        segments.forEach((segment, index) => {
            const difficulty = index + 1;
            const isSelected = difficulty === selectedDifficulty;

            // Only change the background, keep dots white
            segment.style.backgroundColor = isSelected ? '#FFD700' : 'transparent';
        });
    },

    // Set difficulty level
    setDifficulty: function (level) {
        this.state.difficultyLevel = level;
        window.DIFFICULTY_LEVEL = level;
        console.log(`Difficulty set to level ${level}`);
    },

    // Handle window resize: update sizes and re-center circles
    handleResize: function () {
        // Step 1: Recalculate responsive sizes
        const sizes = this.getResponsiveSizes();

        // Step 2: Update title styles
        if (this.titleElement) {
            this.titleElement.style.fontSize = `${sizes.titleSize}px`;
            this.titleElement.style.padding = `${sizes.padding}px ${sizes.padding * 2}px`;
        }

        // Step 3: Update toggle labels
        const toggleLabels = this.elements.menuContainer?.querySelectorAll('[data-toggle-label]');
        if (toggleLabels) {
            toggleLabels.forEach(label => {
                label.style.fontSize = `${sizes.toggleSize}px`;
            });
        }

        // Step 4: Update info message
        if (this.elements.infoMessage) {
            this.elements.infoMessage.style.fontSize = `${sizes.infoSize}px`;
        }

        // Step 5: Force layout flush – critical!
        this.titleElement?.offsetHeight;

        // Step 6: Use setTimeout + rAF to wait for full layout
        // This ensures even complex reflows (like mobile/desktop switch) settle
        setTimeout(() => {
            requestAnimationFrame(() => {
                if (!this.titleElement || !this.elements.circlesAnimation) return;

                // Re-measure after layout is *truly* done
                const rect = this.titleElement.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) return; // Skip if not visible

                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                // Also resize canvas to match current viewport
                this.elements.backgroundCanvas.width = window.innerWidth;
                this.elements.backgroundCanvas.height = window.innerHeight;

                // Reposition animation
                this.elements.circlesAnimation.setPosition(centerX, centerY);
            });
        }, 10); // Tiny delay to allow mobile layout engines to catch up
    },

    // Create background canvas with dynamic centering
    createBackgroundCanvas: function () {
        // Remove old canvas if exists
        if (this.elements.backgroundCanvas) {
            this.elements.backgroundCanvas.remove();
        }

        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // Create new canvas
        this.elements.backgroundCanvas = document.createElement('canvas');
        this.elements.backgroundCanvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        pointer-events: none;
    `;
        this.elements.backgroundCanvas.width = screenWidth;
        this.elements.backgroundCanvas.height = screenHeight;

        // Insert behind all UI
        if (this.elements.menuContainer.firstChild) {
            this.elements.menuContainer.insertBefore(this.elements.backgroundCanvas, this.elements.menuContainer.firstChild);
        } else {
            this.elements.menuContainer.appendChild(this.elements.backgroundCanvas);
        }

        // Get initial center after layout
        const getCenter = () => {
            if (this.titleElement) {
                const rect = this.titleElement.getBoundingClientRect();
                if (rect.width > 0) {
                    return {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2
                    };
                }
            }
            return { x: screenWidth / 2, y: screenHeight * 0.25 };
        };

        // Use current sizes
        const sizes = this.getResponsiveSizes();
        const screenSize = Math.min(screenWidth, screenHeight);
        const aspectRatio = screenHeight / screenWidth;

        const baseRadiusMultiplier = Math.max(0.08, Math.min(0.18, 0.08 + (aspectRatio - 1) * 0.05));
        const incrementMultiplier = Math.max(0.02, Math.min(0.05, 0.02 + (aspectRatio - 1) * 0.015));

        const center = getCenter();

        // Create animation
        this.elements.circlesAnimation = VisualEffects.createConcentricCirclesCanvas(
            this.elements.backgroundCanvas,
            {
                x: center.x,
                y: center.y,
                circleCount: 8,
                baseRadius: screenSize * baseRadiusMultiplier,
                radiusIncrement: screenSize * incrementMultiplier,
                gapRatio: 0.4,
                rotationSpeed: 0.0004,
                color: '#FFD700',
                strokeWidth: 4,
                segmentCount: 4
            }
        );

        this.elements.circlesAnimation.start();

        // Clean up old resize handler
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }

        // Debounced resize using setTimeout + rAF
        this.resizeHandler = () => {
            // Immediately update sizes and styles
            this.handleResize();
        };

        window.addEventListener('resize', this.resizeHandler);

        // One-time post-init check in case layout wasn't ready
        setTimeout(() => {
            this.handleResize();
        }, 100);
    },

    // Update toggle visual state
    updateToggleState: function (toggle, isEnabled, sizes) {
        toggle.isEnabled = isEnabled;
        toggle.toggleBg.style.backgroundColor = isEnabled ? '#FFD700' : '#666666';
        toggle.toggleCircle.style.left = isEnabled ?
            `${sizes.toggleSize * 1.5}px` : `${sizes.toggleSize * 0.2}px`;
        toggle.toggleLabel.style.color = isEnabled ? '#FFD700' : '#FFFFFF';
    },

    // Toggle learning challenge setting
    toggleLearningChallenge: function (enabled) {
        this.state.learningChallengeEnabled = enabled;
        window.LEARNING_CHALLENGE_ENABLED = enabled;
        console.log(`Learning Challenge: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    },

    // Toggle boss rush setting
    toggleBossRush: function (enabled) {
        this.state.bossRushMode = enabled;
        window.BOSS_RUSH_MODE = enabled;
        console.log(`Boss Rush Mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    },

    // Toggle stranger music setting
    toggleStrangeMusic: function (enabled) {
        this.state.strangeMusicEnabled = enabled;
        window.STRANGE_MUSIC_ENABLED = enabled;
        console.log(`Stranger Music: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    },

    // Select a mode
    selectMode: function (isKajisuliMode) {
        if (this.state.kajisuliMode === isKajisuliMode) return;

        this.state.kajisuliMode = isKajisuliMode;
        window.KAJISULI_MODE = isKajisuliMode;
        this.applyCSSMode();

        console.log(`Mode selected: ${isKajisuliMode ? 'KAJISULI (mobile)' : 'Normal (desktop)'}`);
    },

    // Start the game
    startGame: function () {
        this.cleanup();
        window.KAJISULI_MODE = this.state.kajisuliMode;
        window.LEARNING_CHALLENGE_ENABLED = this.state.learningChallengeEnabled;
        window.DIFFICULTY_LEVEL = this.state.difficultyLevel;
        window.BOSS_RUSH_MODE = this.state.bossRushMode;
        window.STRANGE_MUSIC_ENABLED = this.state.strangeMusicEnabled;

        const config = {
            type: Phaser.AUTO,
            width: this.state.kajisuliMode ? 800 : 1200,
            height: this.state.kajisuliMode ? 1200 : 800,
            parent: 'game-container',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            scene: {
                preload: preload,
                create: create,
                update: update
            },
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
            }
        };

        window.game = new Phaser.Game(config);
    },

    // Setup keyboard handler
    setupKeyboardHandler: function () {
        // Store the handler so we can remove it during cleanup
        this.keyHandler = (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                this.startGame();
                // Remove the handler after use
                document.removeEventListener('keydown', this.keyHandler);
                this.keyHandler = null;
            }
        };
        document.addEventListener('keydown', this.keyHandler);
    },

    // Start CSS animations
    startAnimations: function () {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(0.8); }
                100% { transform: scale(1.2); }
            }
        `;
        document.head.appendChild(style);
    },

    // Clean up the HTML menu
    cleanup: function () {
        // Remove the keyboard event listener first
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }

        // Remove the resize handler
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }

        // Stop and destroy concentric circles animation
        if (this.elements.circlesAnimation) {
            this.elements.circlesAnimation.destroy();
            this.elements.circlesAnimation = null;
        }

        // Remove the HTML menu container
        if (this.elements.menuContainer) {
            document.body.removeChild(this.elements.menuContainer);
            this.elements.menuContainer = null;
        }

        // Reset all element references
        Object.keys(this.elements).forEach(key => {
            this.elements[key] = null;
        });
    }
};

// Auto-initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    StartMenuSystem.init();
});

// Export for use in other files
window.StartMenuSystem = StartMenuSystem;