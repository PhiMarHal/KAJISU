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

// Set hard mode preference - default to false
window.HARD_MODE_ENABLED = false;

// Set stranger music preference - default to false
window.STRANGE_MUSIC_ENABLED = false;

const StartMenuSystem = {
    // Menu state
    state: {
        kajisuliMode: false,
        learningChallengeEnabled: false,
        hardModeEnabled: false,
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
        hardMode: {
            on: "Enemies spawn faster",
            off: "Normal spawn rate for enemies"
        },
        bossRush: {
            on: "Warp to the boss fight. Trade score penalties for lvlups",
            off: "Start at the beginning"
        },
        strangeMusic: {
            on: "Early suno.ai experiments. Only for the strongest ears",
            off: "Back to the regular tunes"
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
        this.state.hardModeEnabled = window.HARD_MODE_ENABLED;
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

    // Create background canvas for concentric circles
    createBackgroundCanvas: function () {
        const sizes = this.getResponsiveSizes();

        // Create canvas element
        this.elements.backgroundCanvas = document.createElement('canvas');
        this.elements.backgroundCanvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            pointer-events: none;
        `;

        // Set canvas size
        this.elements.backgroundCanvas.width = window.innerWidth;
        this.elements.backgroundCanvas.height = window.innerHeight;

        // Add to menu container
        this.elements.menuContainer.appendChild(this.elements.backgroundCanvas);

        // Calculate title center position
        const getTitleCenter = () => {
            if (this.titleElement) {
                const rect = this.titleElement.getBoundingClientRect();
                // Check if we got valid coordinates (element is properly laid out)
                if (rect.width > 0 && rect.height > 0) {
                    return {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2
                    };
                }
            }
            // Fallback to screen center if title isn't positioned yet
            return {
                x: window.innerWidth / 2,
                y: window.innerHeight * 0.4 // Slightly higher than center to match button position
            };
        };

        const titleCenter = getTitleCenter();

        // Smart responsive circle sizing based on screen dimensions
        const screenSize = Math.min(window.innerWidth, window.innerHeight);
        const aspectRatio = window.innerHeight / window.innerWidth;

        // Scale circles bigger for smaller screens and tall aspect ratios
        const baseRadiusMultiplier = Math.max(0.08, Math.min(0.18, 0.08 + (aspectRatio - 1) * 0.05));
        const incrementMultiplier = Math.max(0.02, Math.min(0.05, 0.02 + (aspectRatio - 1) * 0.015));

        // Create concentric circles animation - 8 circles, 4 segments each
        this.elements.circlesAnimation = VisualEffects.createConcentricCirclesCanvas(
            this.elements.backgroundCanvas,
            {
                x: titleCenter.x,
                y: titleCenter.y,
                circleCount: 8,
                baseRadius: screenSize * baseRadiusMultiplier,
                radiusIncrement: screenSize * incrementMultiplier,
                gapRatio: 0.4,
                rotationSpeed: 0.0004,
                color: '#FFD700',
                strokeWidth: 4,
                segmentCount: 4 // Fixed 4 segments for all circles
            }
        );

        // Start the animation
        this.elements.circlesAnimation.start();

        // Handle window resize
        const resizeHandler = () => {
            this.elements.backgroundCanvas.width = window.innerWidth;
            this.elements.backgroundCanvas.height = window.innerHeight;
            if (this.elements.circlesAnimation) {
                const newCenter = getTitleCenter();
                this.elements.circlesAnimation.setPosition(newCenter.x, newCenter.y);
            }
        };

        window.addEventListener('resize', resizeHandler);

        // Store resize handler for cleanup
        this.resizeHandler = resizeHandler;
    },

    // Create HTML-based start menu
    createHTMLMenu: function () {
        const sizes = this.getResponsiveSizes();
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const aspectRatio = screenHeight / screenWidth;

        // Create main menu container with aspect-ratio-based positioning
        this.elements.menuContainer = document.createElement('div');
        this.elements.menuContainer.id = 'start-menu';

        // For tall screens (aspect ratio > 1.5), start from top with padding
        // For square/wide screens, use center alignment
        const justifyContent = 'center'
        const paddingTop = `${sizes.padding}px`;

        this.elements.menuContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #1a1a1a;
            display: flex;
            flex-direction: column;
            justify-content: ${justifyContent};
            align-items: center;
            z-index: 1000;
            font-family: Arial, sans-serif;
            color: white;
            padding: ${sizes.padding}px;
            padding-top: ${paddingTop};
            box-sizing: border-box;
        `;

        // Create title first (so we can get its position for the circles)
        const title = document.createElement('div');
        title.textContent = 'ENTER THE LOOP';

        // Responsive positioning - adjust margin based on aspect ratio
        const topMargin = aspectRatio > 1.5 ? sizes.padding * 6 : sizes.padding * 2;

        title.style.cssText = `
            font-size: ${sizes.titleSize}px;
            font-weight: bold;
            color: #FFD700;
            margin-bottom: ${sizes.padding * 3}px;
            margin-top: -${topMargin}px;
            border: 4px solid #FFD700;
            padding: ${sizes.padding}px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: center;
            line-height: 1.1;
            max-width: 90%;
            box-shadow: 0 0 0 0 #FFD700;
            background-color: rgba(26, 26, 26, 0.8);
            backdrop-filter: blur(5px);
            z-index: 1001;
            position: relative;
        `;

        this.elements.menuContainer.appendChild(title);

        // Store reference to title for positioning circles
        this.titleElement = title;

        // Create background canvas after DOM layout (small delay to ensure layout is complete)
        setTimeout(() => {
            this.createBackgroundCanvas();
        }, 50);

        title.addEventListener('mouseenter', () => {
            title.style.color = '#FFFFFF';
            title.style.boxShadow = '0 0 0 2px #FFD700';
            title.style.backgroundColor = 'rgba(26, 26, 26, 0.9)';
        });

        title.addEventListener('mouseleave', () => {
            title.style.color = '#FFD700';
            title.style.boxShadow = '0 0 0 0 #FFD700';
            title.style.backgroundColor = 'rgba(26, 26, 26, 0.8)';
        });

        title.addEventListener('click', () => {
            this.startGame();
        });

        this.elements.menuContainer.appendChild(title);

        // Create toggles container
        const togglesContainer = document.createElement('div');
        const containerWidth = Math.min(600, screenWidth * 0.9); // More responsive container width
        togglesContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: ${sizes.lineSpacing}px;
            margin-top: ${sizes.padding * 4}px;
            width: ${containerWidth}px;
            max-width: 95%;
            z-index: 1001;
            position: relative;
        `;

        // Only show portrait screen and learning challenge toggles if not in FARCADE mode
        if (!this.isFarcadeMode()) {
            // Create portrait screen toggle
            const portraitToggle = this.createToggle('Portrait Screen', this.state.kajisuliMode, (enabled) => {
                this.selectMode(enabled);
                this.showInfoMessage(this.infoMessages.portraitScreen[enabled ? 'on' : 'off']);
            }, sizes);
            togglesContainer.appendChild(portraitToggle);

            // Create learning challenge toggle
            const learningToggle = this.createToggle('Learning Challenge', this.state.learningChallengeEnabled, (enabled) => {
                this.toggleLearningChallenge(enabled);
                this.showInfoMessage(this.infoMessages.learningChallenge[enabled ? 'on' : 'off']);
            }, sizes);
            this.elements.learningToggle = learningToggle;
            togglesContainer.appendChild(learningToggle);
        }

        // Create hard mode toggle (always show)
        const hardModeToggle = this.createToggle('Hard Mode', this.state.hardModeEnabled, (enabled) => {
            this.toggleHardMode(enabled);
            this.showInfoMessage(this.infoMessages.hardMode[enabled ? 'on' : 'off']);
        }, sizes);
        togglesContainer.appendChild(hardModeToggle);

        // Create Boss Rush toggle (always show)
        const bossRushToggle = this.createToggle('Boss Rush', this.state.bossRushMode, (enabled) => {
            this.toggleBossRush(enabled);
            this.showInfoMessage(this.infoMessages.bossRush[enabled ? 'on' : 'off']);
        }, sizes);
        togglesContainer.appendChild(bossRushToggle);

        // Create Strangerer Music toggle (always show)
        const strangeMusicToggle = this.createToggle('Strange Music', this.state.strangeMusicEnabled, (enabled) => {
            this.toggleStrangeMusic(enabled);
            this.showInfoMessage(this.infoMessages.strangeMusic[enabled ? 'on' : 'off']);
        }, sizes);
        togglesContainer.appendChild(strangeMusicToggle);

        this.elements.menuContainer.appendChild(togglesContainer);

        // Create info message element
        const infoContainerWidth = Math.min(600, screenWidth * 0.9); // Match toggles container width
        this.elements.infoMessage = document.createElement('div');
        this.elements.infoMessage.style.cssText = `
            position: fixed;
            bottom: ${sizes.padding * 2}px;
            left: 50%;
            width: ${infoContainerWidth}px;
            max-width: 95%;
            transform: translateX(-50%) translateY(10px);
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

        // Add to page
        document.body.appendChild(this.elements.menuContainer);

        // Setup keyboard handler and start animations
        this.setupKeyboardHandler();
        this.startAnimations();

        // Show initial info message after a short delay
        setTimeout(() => {
            this.showInfoMessage('Welcome, Looper');
        }, 1000);
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
        window.HARD_MODE_ENABLED = this.state.hardModeEnabled;
        window.BOSS_RUSH_MODE = this.state.bossRushMode;
        window.STRANGE_MUSIC_ENABLED = this.state.strangeMusicEnabled;

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