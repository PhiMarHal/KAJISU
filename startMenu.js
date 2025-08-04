// startMenu.js - Pre-Game Start Menu System for Word Survivors

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

// Set hard mode preference - default to false
window.HARD_MODE_ENABLED = false;

const StartMenuSystem = {
    // Menu state
    state: {
        kajisuliMode: false,
        learningChallengeEnabled: false,
        hardModeEnabled: false,
        bossRushMode: false,
        initialized: false
    },

    // UI elements
    elements: {
        menuContainer: null,
        learningToggle: null
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

        // Reduced scaling factor - keep text closer to desktop size on mobile
        const scaleFactor = Math.max(0.85, Math.min(1.2, minDimension / 600));

        return {
            titleSize: Math.floor(48 * scaleFactor),
            toggleSize: 24, // Fixed size for consistent toggle text
            spacing: Math.floor(60 * scaleFactor),
            padding: Math.floor(20 * scaleFactor),
            lineSpacing: 12
        };
    },

    // Initialize the pre-game start menu
    init: function () {
        this.state.kajisuliMode = window.KAJISULI_MODE;
        this.state.learningChallengeEnabled = window.LEARNING_CHALLENGE_ENABLED;
        this.state.hardModeEnabled = window.HARD_MODE_ENABLED;
        this.state.bossRushMode = window.BOSS_RUSH_MODE;
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
            box-shadow: 0 0 0 0 #FFD700;
        `;

        title.addEventListener('mouseenter', () => {
            title.style.color = '#FFFFFF';
            title.style.boxShadow = '0 0 0 2px #FFD700';
        });

        title.addEventListener('mouseleave', () => {
            title.style.color = '#FFD700';
            title.style.boxShadow = '0 0 0 0 #FFD700';
        });

        title.addEventListener('click', () => {
            this.startGame();
        });

        this.elements.menuContainer.appendChild(title);

        // Create toggles container
        const togglesContainer = document.createElement('div');
        togglesContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: ${sizes.lineSpacing}px;
            margin-top: ${sizes.padding}px;
            width: 600px;
            max-width: 90%;
        `;

        // Only show portrait screen and learning challenge toggles if not in FARCADE mode
        if (!this.isFarcadeMode()) {
            // Create portrait screen toggle
            const portraitToggle = this.createToggle('Portrait Screen', this.state.kajisuliMode, (enabled) => {
                this.selectMode(enabled);
            }, sizes);
            togglesContainer.appendChild(portraitToggle);

            // Create learning challenge toggle
            const learningToggle = this.createToggle('Learning Challenge', this.state.learningChallengeEnabled, (enabled) => {
                this.toggleLearningChallenge(enabled);
            }, sizes);
            this.elements.learningToggle = learningToggle;
            togglesContainer.appendChild(learningToggle);
        }

        // Create hard mode toggle (always show)
        const hardModeToggle = this.createToggle('Hard Mode', this.state.hardModeEnabled, (enabled) => {
            this.toggleHardMode(enabled);
        }, sizes);
        togglesContainer.appendChild(hardModeToggle);

        this.elements.menuContainer.appendChild(togglesContainer);

        // Create Boss Rush toggle (always show)
        const bossRushToggle = this.createToggle('Boss Rush', this.state.bossRushMode, (enabled) => {
            this.toggleBossRush(enabled);
        }, sizes);
        togglesContainer.appendChild(bossRushToggle);

        this.elements.menuContainer.appendChild(togglesContainer);

        // Add to page
        document.body.appendChild(this.elements.menuContainer);

        // Setup keyboard handler and start animations
        this.setupKeyboardHandler();
        this.startAnimations();
    },

    // Create a unified toggle component
    createToggle: function (label, isEnabled, onToggle, sizes) {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all 0.2s ease;
            width: 100%;
        `;

        // Toggle label (left aligned)
        const toggleLabel = document.createElement('div');
        toggleLabel.textContent = label;
        toggleLabel.style.cssText = `
            font-size: ${sizes.toggleSize}px;
            color: ${isEnabled ? '#FFD700' : '#FFFFFF'};
            transition: all 0.3s ease;
        `;

        // Toggle switch container (right aligned)
        const toggleContainer = document.createElement('div');
        toggleContainer.style.cssText = `
            display: flex;
            align-items: center;
        `;

        // Toggle switch background
        const toggleBg = document.createElement('div');
        toggleBg.style.cssText = `
            width: ${sizes.toggleSize * 2.5}px;
            height: ${sizes.toggleSize * 1.2}px;
            background-color: ${isEnabled ? '#FFD700' : '#666666'};
            border-radius: ${sizes.toggleSize}px;
            position: relative;
            transition: all 0.3s ease;
        `;

        // Toggle switch circle
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

        // Store references for updates
        container.toggleBg = toggleBg;
        container.toggleCircle = toggleCircle;
        container.toggleLabel = toggleLabel;
        container.isEnabled = isEnabled;

        // Click handler
        container.addEventListener('click', () => {
            const newState = !container.isEnabled;
            this.updateToggleState(container, newState, sizes);
            onToggle(newState);
        });

        return container;
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

    // Toggle hard mode setting
    toggleHardMode: function (enabled) {
        this.state.hardModeEnabled = enabled;
        window.HARD_MODE_ENABLED = enabled;
        console.log(`Hard Mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    },

    // Toggle boss rush setting
    toggleBossRush: function (enabled) {
        this.state.bossRushMode = enabled;
        window.BOSS_RUSH_MODE = enabled;
        console.log(`Boss Rush Mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
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
        window.HARD_MODE_ENABLED = this.state.hardModeEnabled;
        window.BOSS_RUSH_MODE = this.state.bossRushMode;

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
                width: this.state.kajisuliMode ? 720 : 1200,
                height: this.state.kajisuliMode ? 1280 : 800,
                parent: 'game-container',
                expandParent: false
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

        // Remove the HTML menu container
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