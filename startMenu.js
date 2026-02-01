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
        strangeMusicEnabled: false,
        sharedSeedEnabled: false,
        sharedSeed: null,
        selectedDemo: null,  // Demo timestamp to play back
        initialized: false
    },

    // UI elements
    elements: {
        menuContainer: null,
        learningToggle: null,
        seedToggle: null,
        demoSelector: null,
        infoMessage: null,
        backgroundCanvas: null,
        circlesAnimation: null
    },

    // Info messages for each toggle state
    infoMessages: {
        sharedSeed: {
            on: "Fixed seed run. Share seeds for identical challenges",
            off: "Random seed each run"
        },
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
        },
        watchDemo: {
            on: "Watching a recorded run",
            off: "Play the game yourself"
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

        // === 3. Toggles Container: Positioned at 50vh ===
        const containerWidth = Math.min(600, screenWidth * 0.9);
        const togglesContainer = document.createElement('div');
        togglesContainer.style.cssText = `
        position: absolute;
        top: 50vh;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        gap: ${sizes.lineSpacing * 1.25}px;
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
            toggleLabel.dataset.toggleLabel = '';
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

        // Helper to create seed toggle with input field
        const createSeedToggle = (label, isEnabled, onToggle, onSeedChange) => {
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
            toggleLabel.dataset.toggleLabel = '';
            toggleLabel.style.cssText = `
            font-size: ${sizes.toggleSize}px;
            color: ${isEnabled ? '#FFD700' : '#FFFFFF'};
            transition: all 0.3s ease;
        `;

            const rightSide = document.createElement('div');
            rightSide.style.cssText = `
            display: flex;
            align-items: center;
            gap: ${sizes.toggleSize * 0.5}px;
        `;

            const seedInput = document.createElement('input');
            seedInput.type = 'text';
            seedInput.placeholder = 'seed';
            seedInput.style.cssText = `
            width: ${sizes.toggleSize * 4}px;
            height: ${sizes.toggleSize * 1.2}px;
            font-size: ${sizes.toggleSize * 0.7}px;
            padding: 0 ${sizes.toggleSize * 0.3}px;
            border: 2px solid #FFD700;
            border-radius: ${sizes.toggleSize * 0.3}px;
            background-color: #333;
            color: #FFF;
            outline: none;
            visibility: ${isEnabled ? 'visible' : 'hidden'};
            text-align: center;
            font-family: monospace;
        `;
            seedInput.addEventListener('click', (e) => e.stopPropagation());
            seedInput.addEventListener('input', (e) => onSeedChange(e.target.value));

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
            rightSide.appendChild(seedInput);
            rightSide.appendChild(toggleBg);
            container.appendChild(toggleLabel);
            container.appendChild(rightSide);

            container.toggleBg = toggleBg;
            container.toggleCircle = toggleCircle;
            container.toggleLabel = toggleLabel;
            container.seedInput = seedInput;
            container.isEnabled = isEnabled;

            container.addEventListener('click', (e) => {
                if (e.target === seedInput) return;
                const newState = !container.isEnabled;
                this.updateToggleState(container, newState, sizes);
                seedInput.style.visibility = newState ? 'visible' : 'hidden';
                if (newState) setTimeout(() => seedInput.focus(), 50);
                onToggle(newState);
            });

            return container;
        };

        // Add seed toggle first
        const seedToggle = createSeedToggle(
            'Shared Seed',
            this.state.sharedSeedEnabled,
            (enabled) => {
                this.state.sharedSeedEnabled = enabled;
                if (!enabled) this.state.sharedSeed = null;
                this.showInfoMessage(this.infoMessages.sharedSeed[enabled ? 'on' : 'off']);
            },
            (value) => {
                if (value.trim() === '') {
                    this.state.sharedSeed = null;
                } else {
                    const num = parseInt(value, 10);
                    this.state.sharedSeed = !isNaN(num) ? num :
                        value.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0) >>> 0;
                }
            }
        );
        this.elements.seedToggle = seedToggle;
        togglesContainer.appendChild(seedToggle);

        // Add toggles
        if (!this.isFarcadeMode()) {
            const portraitToggle = createToggleWithLabel('Portrait Screen', this.state.kajisuliMode, (enabled) => {
                this.selectMode(enabled);
                this.showInfoMessage(this.infoMessages.portraitScreen[enabled ? 'on' : 'off']);
            });
            togglesContainer.appendChild(portraitToggle);

            // Learning Challenge toggle intentionally disabled - legacy mode no longer used
            // Keeping code for potential future use
            /*
            const learningToggle = createToggleWithLabel('Learning Challenge', this.state.learningChallengeEnabled, (enabled) => {
                this.toggleLearningChallenge(enabled);
                this.showInfoMessage(this.infoMessages.learningChallenge[enabled ? 'on' : 'off']);
            });
            this.elements.learningToggle = learningToggle;
            togglesContainer.appendChild(learningToggle);
            */
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

        // Add difficulty selector
        const difficultySelector = this.createDifficultySelector(sizes);
        togglesContainer.appendChild(difficultySelector);

        // Add demo selector (only if DemoSystem exists and has saved demos)
        if (window.DemoSystem) {
            const demoSelector = this.createDemoSelector(sizes);
            if (demoSelector) {
                togglesContainer.appendChild(demoSelector);
                this.elements.demoSelector = demoSelector;
            }
        }

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

    // Create demo selector dropdown
    createDemoSelector: function (sizes) {
        const demos = DemoSystem.listSavedDemos();

        // Don't show selector if no demos available
        if (demos.length === 0) {
            return null;
        }

        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.2s ease;
            width: 100%;
        `;

        const label = document.createElement('div');
        label.textContent = 'Watch Demo';
        label.dataset.toggleLabel = '';
        label.style.cssText = `
            font-size: ${sizes.toggleSize}px;
            color: ${this.state.selectedDemo ? '#FFD700' : '#FFFFFF'};
            transition: all 0.3s ease;
        `;

        const selectContainer = document.createElement('div');
        selectContainer.style.cssText = `
            display: flex;
            align-items: center;
        `;

        // Create dropdown select
        const select = document.createElement('select');
        select.style.cssText = `
            width: ${sizes.toggleSize * 6}px;
            height: ${sizes.toggleSize * 1.4}px;
            font-size: ${sizes.toggleSize * 0.65}px;
            padding: 0 ${sizes.toggleSize * 0.3}px;
            border: 2px solid #666;
            border-radius: ${sizes.toggleSize * 0.3}px;
            background-color: #333;
            color: #FFF;
            outline: none;
            cursor: pointer;
            font-family: monospace;
        `;

        // Add "None" option
        const noneOption = document.createElement('option');
        noneOption.value = '';
        noneOption.textContent = '— None —';
        select.appendChild(noneOption);

        // Add demo options
        demos.forEach(timestamp => {
            const option = document.createElement('option');
            option.value = timestamp;
            // Format: "01/31 18:30" for readability
            const formatted = DemoSystem.formatTimestamp(timestamp);
            const info = DemoSystem.getDemoInfo(timestamp);
            const duration = info ? `${Math.floor(info.duration / 60)}:${String(info.duration % 60).padStart(2, '0')}` : '??';
            option.textContent = `${formatted} (${duration})`;
            select.appendChild(option);
        });

        select.addEventListener('change', (e) => {
            const value = e.target.value;
            this.state.selectedDemo = value || null;

            // Update label color
            label.style.color = value ? '#FFD700' : '#FFFFFF';
            select.style.borderColor = value ? '#FFD700' : '#666';

            if (value) {
                const info = DemoSystem.getDemoInfo(value);
                if (info) {
                    this.showInfoMessage(`Demo from ${info.formatted} - ${info.duration}s run`);
                }
            } else {
                this.showInfoMessage(this.infoMessages.watchDemo.off);
            }
        });

        selectContainer.appendChild(select);
        container.appendChild(label);
        container.appendChild(selectContainer);

        container.label = label;
        container.select = select;

        return container;
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

        const positions = [
            sizes.toggleSize * 1,
            sizes.toggleSize * 3,
            sizes.toggleSize * 5,
            sizes.toggleSize * 7
        ];

        const romanNumerals = ['I', 'II', 'III', 'IV'];
        romanNumerals.forEach((numeral, index) => {
            const numeralElement = document.createElement('div');
            numeralElement.style.cssText = `
            position: absolute;
            left: ${positions[index]}px;
            top: 50%;
            transform: translate(-50%, -50%);
            color: #FFFFFF;
            font-size: ${sizes.toggleSize * 0.7}px;
            font-weight: bold;
            pointer-events: none;
            transition: all 0.3s ease;
        `;
            numeralElement.textContent = numeral;
            selectorBg.appendChild(numeralElement);
        });

        const slidingBackground = document.createElement('div');
        const backgroundWidth = sizes.toggleSize * 2.2;
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

        selectorBg.addEventListener('click', (e) => {
            const rect = selectorBg.getBoundingClientRect();
            const clickX = e.clientX - rect.left;

            let newDifficulty = 1;
            const sectionWidth = (sizes.toggleSize * 8) / 4;

            for (let i = 0; i < 4; i++) {
                if (clickX >= i * sectionWidth && clickX < (i + 1) * sectionWidth) {
                    newDifficulty = i + 1;
                    break;
                }
            }

            this.setDifficulty(newDifficulty);
            this.updateDifficultySlider(slidingDot, slidingBackground, newDifficulty, positions, sizes);
            this.showInfoMessage(this.infoMessages.difficulty[newDifficulty]);
        });

        selectorContainer.appendChild(selectorBg);
        container.appendChild(difficultyLabel);
        container.appendChild(selectorContainer);

        container.selectorBg = selectorBg;
        container.difficultyLabel = difficultyLabel;
        container.slidingDot = slidingDot;
        container.slidingBackground = slidingBackground;
        container.positions = positions;

        return container;
    },

    updateDifficultySlider: function (slidingDot, slidingBackground, difficulty, positions, sizes) {
        const position = positions[difficulty - 1];
        const backgroundWidth = sizes.toggleSize * 2.2;

        slidingDot.style.left = `${position - (sizes.toggleSize * 0.4)}px`;
        slidingBackground.style.left = `${position - backgroundWidth / 2}px`;
    },

    updateDifficultySelectorSizes: function (container, sizes) {
        if (!container.selectorBg || !container.slidingDot || !container.slidingBackground) return;

        const selectorBg = container.selectorBg;
        const slidingDot = container.slidingDot;
        const slidingBackground = container.slidingBackground;

        const newPositions = [
            sizes.toggleSize * 1,
            sizes.toggleSize * 3,
            sizes.toggleSize * 5,
            sizes.toggleSize * 7
        ];

        selectorBg.style.width = `${sizes.toggleSize * 8}px`;
        selectorBg.style.height = `${sizes.toggleSize * 1.2}px`;
        selectorBg.style.borderRadius = `${sizes.toggleSize * 0.6}px`;

        const numeralElements = selectorBg.querySelectorAll('div');
        let numeralIndex = 0;
        numeralElements.forEach(element => {
            if (element !== slidingBackground && element !== slidingDot && numeralIndex < 4) {
                element.style.left = `${newPositions[numeralIndex]}px`;
                element.style.fontSize = `${sizes.toggleSize * 0.7}px`;
                numeralIndex++;
            }
        });

        const backgroundWidth = sizes.toggleSize * 2.2;
        slidingBackground.style.width = `${backgroundWidth}px`;
        slidingBackground.style.height = `${sizes.toggleSize * 1.2}px`;
        slidingBackground.style.borderRadius = `${sizes.toggleSize * 0.6}px`;

        slidingDot.style.width = `${sizes.toggleSize * 0.8}px`;
        slidingDot.style.height = `${sizes.toggleSize * 0.8}px`;
        slidingDot.style.top = `${sizes.toggleSize * 0.2}px`;

        this.updateDifficultySlider(slidingDot, slidingBackground, this.state.difficultyLevel, newPositions, sizes);

        container.positions = newPositions;
    },

    updateDifficultyDisplay: function (selectorBg, selectedDifficulty, sizes) {
        const segments = selectorBg.querySelectorAll('[data-difficulty]');
        segments.forEach((segment, index) => {
            const difficulty = index + 1;
            const isSelected = difficulty === selectedDifficulty;
            segment.style.backgroundColor = isSelected ? '#FFD700' : 'transparent';
        });
    },

    setDifficulty: function (level) {
        this.state.difficultyLevel = level;
        window.DIFFICULTY_LEVEL = level;
        console.log(`Difficulty set to level ${level}`);
    },

    handleResize: function () {
        const sizes = this.getResponsiveSizes();
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        if (this.titleElement) {
            this.titleElement.style.fontSize = `${sizes.titleSize}px`;
            this.titleElement.style.padding = `${sizes.padding}px ${sizes.padding * 2}px`;
        }

        const toggleLabels = document.querySelectorAll('[data-toggle-label]');
        toggleLabels.forEach(label => {
            label.style.fontSize = `${sizes.toggleSize}px`;
        });

        if (this.elements.infoMessage) {
            const infoContainerWidth = Math.min(600, screenWidth * 0.9);
            this.elements.infoMessage.style.fontSize = `${sizes.infoSize}px`;
            this.elements.infoMessage.style.width = `${infoContainerWidth}px`;
            this.elements.infoMessage.style.bottom = `${sizes.padding * 2}px`;
            this.elements.infoMessage.style.padding = `${sizes.padding / 2}px ${sizes.padding}px`;
        }

        if (this.elements.backgroundCanvas) {
            this.elements.backgroundCanvas.width = screenWidth;
            this.elements.backgroundCanvas.height = screenHeight;
        }

        if (this.elements.circlesAnimation) {
            const screenSize = Math.min(screenWidth, screenHeight);
            const aspectRatio = screenHeight / screenWidth;

            const baseRadiusMultiplier = Math.max(0.08, Math.min(0.18, 0.08 + (aspectRatio - 1) * 0.05));
            const incrementMultiplier = Math.max(0.02, Math.min(0.05, 0.02 + (aspectRatio - 1) * 0.015));

            let center = { x: screenWidth / 2, y: screenHeight * 0.25 };
            if (this.titleElement) {
                const rect = this.titleElement.getBoundingClientRect();
                if (rect.width > 0) {
                    center = {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2
                    };
                }
            }

            // Only call updateOptions if the method exists
            if (typeof this.elements.circlesAnimation.updateOptions === 'function') {
                this.elements.circlesAnimation.updateOptions({
                    x: center.x,
                    y: center.y,
                    baseRadius: screenSize * baseRadiusMultiplier,
                    radiusIncrement: screenSize * incrementMultiplier
                });
            }
        }
    },

    createBackgroundCanvas: function () {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

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

        if (this.elements.menuContainer.firstChild) {
            this.elements.menuContainer.insertBefore(this.elements.backgroundCanvas, this.elements.menuContainer.firstChild);
        } else {
            this.elements.menuContainer.appendChild(this.elements.backgroundCanvas);
        }

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

        const sizes = this.getResponsiveSizes();
        const screenSize = Math.min(screenWidth, screenHeight);
        const aspectRatio = screenHeight / screenWidth;

        const baseRadiusMultiplier = Math.max(0.08, Math.min(0.18, 0.08 + (aspectRatio - 1) * 0.05));
        const incrementMultiplier = Math.max(0.02, Math.min(0.05, 0.02 + (aspectRatio - 1) * 0.015));

        const center = getCenter();

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

        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }

        this.resizeHandler = () => {
            this.handleResize();
        };

        window.addEventListener('resize', this.resizeHandler);

        setTimeout(() => {
            this.handleResize();
        }, 100);
    },

    updateToggleState: function (toggle, isEnabled, sizes) {
        toggle.isEnabled = isEnabled;
        toggle.toggleBg.style.backgroundColor = isEnabled ? '#FFD700' : '#666666';
        toggle.toggleCircle.style.left = isEnabled ?
            `${sizes.toggleSize * 1.5}px` : `${sizes.toggleSize * 0.2}px`;
        toggle.toggleLabel.style.color = isEnabled ? '#FFD700' : '#FFFFFF';
    },

    toggleLearningChallenge: function (enabled) {
        this.state.learningChallengeEnabled = enabled;
        window.LEARNING_CHALLENGE_ENABLED = enabled;
        console.log(`Learning Challenge: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    },

    toggleBossRush: function (enabled) {
        this.state.bossRushMode = enabled;
        window.BOSS_RUSH_MODE = enabled;
        console.log(`Boss Rush Mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    },

    toggleStrangeMusic: function (enabled) {
        this.state.strangeMusicEnabled = enabled;
        window.STRANGE_MUSIC_ENABLED = enabled;
        console.log(`Stranger Music: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    },

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

        // Check if we're playing back a demo
        if (this.state.selectedDemo) {
            const demo = DemoSystem.loadFromLocalStorage(this.state.selectedDemo);
            if (demo) {
                // Start playback - this returns seed and settings
                const playbackInfo = DemoSystem.startPlayback(demo);

                // Use demo's seed and settings
                window.GAME_SEED = playbackInfo.seed;
                window.KAJISULI_MODE = playbackInfo.settings.portrait || false;
                window.BOSS_RUSH_MODE = playbackInfo.settings.bossRush || false;
                window.DIFFICULTY_LEVEL = playbackInfo.settings.difficulty || 2;

                // Apply CSS mode from demo settings
                if (window.KAJISULI_MODE) {
                    document.body.classList.add('kajisuli-mode');
                } else {
                    document.body.classList.remove('kajisuli-mode');
                }

                // Disable learning challenge during playback
                window.LEARNING_CHALLENGE_ENABLED = false;

                // Always use alt music during demo playback
                window.STRANGE_MUSIC_ENABLED = true;

                console.log(`Starting demo playback - Seed: ${window.GAME_SEED}`);
            } else {
                console.error('Failed to load demo');
                this.state.selectedDemo = null;
            }
        }

        // Normal game start (or if demo load failed)
        if (!this.state.selectedDemo) {
            window.KAJISULI_MODE = this.state.kajisuliMode;
            window.LEARNING_CHALLENGE_ENABLED = this.state.learningChallengeEnabled;
            window.DIFFICULTY_LEVEL = this.state.difficultyLevel;
            window.BOSS_RUSH_MODE = this.state.bossRushMode;
            window.STRANGE_MUSIC_ENABLED = this.state.strangeMusicEnabled;

            // Set and initialize the game seed
            if (this.state.sharedSeedEnabled && this.state.sharedSeed !== null) {
                window.GAME_SEED = this.state.sharedSeed;
            } else {
                window.GAME_SEED = Date.now();
            }
        }

        SeededRNG.init(window.GAME_SEED);

        const config = {
            type: Phaser.AUTO,
            width: window.KAJISULI_MODE ? 800 : 1200,
            height: window.KAJISULI_MODE ? 1200 : 800,
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

    setupKeyboardHandler: function () {
        this.keyHandler = (event) => {
            if (document.activeElement === this.elements.seedToggle?.seedInput) {
                return;
            }
            if (event.key === 'Enter' || event.key === ' ') {
                this.startGame();
                document.removeEventListener('keydown', this.keyHandler);
                this.keyHandler = null;
            }
        };
        document.addEventListener('keydown', this.keyHandler);
    },

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

    cleanup: function () {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }

        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }

        if (this.elements.circlesAnimation) {
            this.elements.circlesAnimation.destroy();
            this.elements.circlesAnimation = null;
        }

        if (this.elements.menuContainer) {
            document.body.removeChild(this.elements.menuContainer);
            this.elements.menuContainer = null;
        }

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