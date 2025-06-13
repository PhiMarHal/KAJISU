// startMenu.js - Pre-Game Start Menu System for Word Survivors

// IMMEDIATELY set the global variable before any other scripts can access it
window.KAJISULI_MODE = (() => {
    // If FARCADE_MODE is on, always use KAJISULI mode
    if (typeof FARCADE_MODE !== 'undefined' && FARCADE_MODE) {
        return true;
    }

    const stored = localStorage.getItem('kajisuliMode');
    return stored === 'true';
})();

// Set learning challenge preference
window.LEARNING_CHALLENGE_ENABLED = (() => {
    const stored = localStorage.getItem('learningChallengeEnabled');
    return stored !== 'false'; // Default to true
})();

const StartMenuSystem = {
    // Menu state
    state: {
        kajisuliMode: false,
        learningChallengeEnabled: true,
        initialized: false
    },

    // UI elements
    elements: {
        menuContainer: null
    },

    // Kanji definitions
    kanji: {
        normal: "普", // Kanji for "normal/ordinary"
        light: "軽"   // Kanji for "light/lightweight"
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

        // Base scaling factor - smaller screens get smaller text
        const scaleFactor = Math.max(0.5, Math.min(1.2, minDimension / 600));

        return {
            titleSize: Math.floor(48 * scaleFactor),
            kanjiSize: Math.floor(64 * scaleFactor),
            descSize: Math.floor(16 * scaleFactor),
            toggleSize: Math.floor(18 * scaleFactor),
            spacing: Math.floor(120 * scaleFactor),
            padding: Math.floor(20 * scaleFactor)
        };
    },

    // Initialize the pre-game start menu
    init: function () {
        this.state.kajisuliMode = window.KAJISULI_MODE;
        this.state.learningChallengeEnabled = window.LEARNING_CHALLENGE_ENABLED;
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

    // Create HTML-based start menu
    createHTMLMenu: function () {
        const sizes = this.getResponsiveSizes();

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
            justify-content: center;
            align-items: center;
            z-index: 1000;
            font-family: Arial, sans-serif;
            color: white;
            padding: ${sizes.padding}px;
            box-sizing: border-box;
        `;

        // Create title
        const title = document.createElement('div');
        title.textContent = 'ENTER THE LOOP';
        title.style.cssText = `
            font-size: ${sizes.titleSize}px;
            font-weight: bold;
            color: #FFD700;
            margin-bottom: ${sizes.padding * 2}px;
            border: 4px solid #FFD700;
            padding: ${sizes.padding}px ${sizes.padding * 2}px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: center;
            line-height: 1.1;
            max-width: 90%;
        `;

        title.addEventListener('mouseenter', () => {
            title.style.color = '#FFFFFF';
            title.style.borderWidth = '6px';
        });

        title.addEventListener('mouseleave', () => {
            title.style.color = '#FFD700';
            title.style.borderWidth = '4px';
        });

        title.addEventListener('click', () => {
            this.startGame();
        });

        this.elements.menuContainer.appendChild(title);

        // Only show mode selector if not in FARCADE mode
        if (!this.isFarcadeMode()) {
            // Create mode selector container
            const modeContainer = document.createElement('div');
            modeContainer.style.cssText = `
                display: flex;
                gap: ${sizes.spacing}px;
                align-items: center;
                margin-top: ${sizes.padding}px;
                flex-wrap: wrap;
                justify-content: center;
            `;

            // Create normal mode option
            const normalOption = this.createModeOption(
                this.kanji.normal,
                'better for desktops',
                !this.state.kajisuliMode,
                () => this.selectMode(false),
                sizes
            );

            // Create light mode option
            const lightOption = this.createModeOption(
                this.kanji.light,
                'better for phones',
                this.state.kajisuliMode,
                () => this.selectMode(true),
                sizes
            );

            modeContainer.appendChild(normalOption);
            modeContainer.appendChild(lightOption);
            this.elements.menuContainer.appendChild(modeContainer);

            // Create learning challenge toggle
            const learningToggle = this.createLearningToggle(sizes);
            this.elements.menuContainer.appendChild(learningToggle);
        }

        // Add to page
        document.body.appendChild(this.elements.menuContainer);

        // Setup keyboard handler and start animations
        this.setupKeyboardHandler();
        this.startAnimations();
    },

    // Create a mode option (kanji + description)
    createModeOption: function (kanji, description, isSelected, clickHandler, sizes) {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
            transition: all 0.2s ease;
            margin: ${sizes.padding / 2}px;
        `;

        const kanjiElement = document.createElement('div');
        kanjiElement.textContent = kanji;
        kanjiElement.style.cssText = `
            font-size: ${sizes.kanjiSize}px;
            font-weight: bold;
            color: ${isSelected ? '#FFD700' : '#FFFFFF'};
            transition: all 0.2s ease;
            animation: pulse 2s ease-in-out infinite alternate;
        `;

        const descElement = document.createElement('div');
        descElement.textContent = description;
        descElement.style.cssText = `
            font-size: ${sizes.descSize}px;
            color: #FFFFFF;
            opacity: 0.5;
            margin-top: ${sizes.padding / 2}px;
            text-align: center;
        `;

        container.appendChild(kanjiElement);
        container.appendChild(descElement);
        container.addEventListener('click', clickHandler);
        container.kanjiElement = kanjiElement;

        return container;
    },

    // Create learning challenge toggle
    createLearningToggle: function (sizes) {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            align-items: center;
            margin-top: ${sizes.padding * 2}px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        // Toggle switch background
        const toggleBg = document.createElement('div');
        toggleBg.style.cssText = `
            width: ${sizes.toggleSize * 3}px;
            height: ${sizes.toggleSize * 1.5}px;
            background-color: ${this.state.learningChallengeEnabled ? '#FFD700' : '#666666'};
            border-radius: ${sizes.toggleSize}px;
            position: relative;
            transition: all 0.3s ease;
            margin-right: ${sizes.padding}px;
            opacity: ${this.state.kajisuliMode ? '0.5' : '1'};
        `;

        // Toggle switch circle
        const toggleCircle = document.createElement('div');
        toggleCircle.style.cssText = `
            width: ${sizes.toggleSize}px;
            height: ${sizes.toggleSize}px;
            background-color: #FFFFFF;
            border-radius: 50%;
            position: absolute;
            top: ${sizes.toggleSize * 0.25}px;
            left: ${this.state.learningChallengeEnabled ? sizes.toggleSize * 1.75 : sizes.toggleSize * 0.25}px;
            transition: all 0.3s ease;
        `;

        toggleBg.appendChild(toggleCircle);

        // Toggle label
        const toggleLabel = document.createElement('div');
        toggleLabel.textContent = 'Learning Challenge';
        toggleLabel.style.cssText = `
            font-size: ${sizes.toggleSize}px;
            color: #FFFFFF;
            opacity: ${this.state.kajisuliMode ? '0.5' : '1'};
            transition: all 0.3s ease;
        `;

        container.appendChild(toggleBg);
        container.appendChild(toggleLabel);

        // Store references for updates
        container.toggleBg = toggleBg;
        container.toggleCircle = toggleCircle;
        container.toggleLabel = toggleLabel;

        // Click handler
        container.addEventListener('click', () => {
            // Only allow toggle if in desktop mode
            if (!this.state.kajisuliMode) {
                this.toggleLearningChallenge(container, sizes);
            }
        });

        return container;
    },

    // Toggle learning challenge setting
    toggleLearningChallenge: function (container, sizes) {
        this.state.learningChallengeEnabled = !this.state.learningChallengeEnabled;
        window.LEARNING_CHALLENGE_ENABLED = this.state.learningChallengeEnabled;
        localStorage.setItem('learningChallengeEnabled', this.state.learningChallengeEnabled.toString());

        // Update visual state
        container.toggleBg.style.backgroundColor = this.state.learningChallengeEnabled ? '#FFD700' : '#666666';
        container.toggleCircle.style.left = this.state.learningChallengeEnabled ?
            `${sizes.toggleSize * 1.75}px` : `${sizes.toggleSize * 0.25}px`;

        console.log(`Learning Challenge: ${this.state.learningChallengeEnabled ? 'ENABLED' : 'DISABLED'}`);
    },

    // Update learning toggle state based on mode
    updateLearningToggleState: function (container, sizes) {
        if (!container) return;

        const isDisabled = this.state.kajisuliMode;
        const opacity = isDisabled ? '0.5' : '1';

        container.toggleBg.style.opacity = opacity;
        container.toggleLabel.style.opacity = opacity;
        container.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
    },

    // Select a mode
    selectMode: function (isKajisuliMode) {
        if (this.state.kajisuliMode === isKajisuliMode) return;

        this.state.kajisuliMode = isKajisuliMode;
        window.KAJISULI_MODE = isKajisuliMode;
        localStorage.setItem('kajisuliMode', isKajisuliMode.toString());
        this.applyCSSMode();

        // Update kanji colors
        const modeContainer = this.elements.menuContainer.children[1];
        const normalOption = modeContainer.children[0];
        const lightOption = modeContainer.children[1];

        normalOption.kanjiElement.style.color = isKajisuliMode ? '#FFFFFF' : '#FFD700';
        lightOption.kanjiElement.style.color = isKajisuliMode ? '#FFD700' : '#FFFFFF';

        // Update learning toggle state
        const learningToggle = this.elements.menuContainer.children[2];
        if (learningToggle) {
            this.updateLearningToggleState(learningToggle, this.getResponsiveSizes());
        }

        console.log(`Mode selected: ${isKajisuliMode ? 'KAJISULI (mobile)' : 'Normal (desktop)'}`);
    },

    // Start the game
    startGame: function () {
        this.cleanup();
        window.KAJISULI_MODE = this.state.kajisuliMode;
        window.LEARNING_CHALLENGE_ENABLED = this.state.learningChallengeEnabled;

        const config = {
            type: Phaser.AUTO,
            width: this.state.kajisuliMode ? 720 : 1200,
            height: this.state.kajisuliMode ? 1280 : 800,
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
                width: this.state.kajisuliMode ? 800 : 1200,
                height: this.state.kajisuliMode ? 1280 : 800,
                parent: 'game-container',
                expandParent: false
            }
        };

        window.game = new Phaser.Game(config);
    },

    // Setup keyboard handler
    setupKeyboardHandler: function () {
        const keyHandler = (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                this.startGame();
                document.removeEventListener('keydown', keyHandler);
            }
        };
        document.addEventListener('keydown', keyHandler);
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
        if (this.elements.menuContainer) {
            document.body.removeChild(this.elements.menuContainer);
            this.elements.menuContainer = null;
        }
    }
};

// Auto-initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    StartMenuSystem.init();
});

// Export for use in other files
window.StartMenuSystem = StartMenuSystem;