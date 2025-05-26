// input.js - Custom input handling enhancements for Word Survivors

// Input system for managing extended behavior beyond Phaser's defaults
const InputSystem = {
    // Variables to track cursor state
    lastMouseX: 0,
    lastMouseY: 0,
    cursorHideTimer: null,
    isCursorHidden: false,
    cursorHideDelay: 1000, // 1 second delay before hiding
    isInitialized: false,
    isTabActive: true,     // Track if tab is active/visible

    // Directional touch control variables
    touch: {
        isActive: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        directionX: 0,  // Normalized direction (-1 to 1)
        directionY: 0,  // Normalized direction (-1 to 1)
        minDistance: 10 // Minimum distance before registering movement
    },

    // Initialize the input system
    setupCursorHiding: function (scene) {
        // Skip if already initialized
        if (this.isInitialized) return;

        // Store reference to the scene
        this.scene = scene;

        // Setup cursor hiding for desktop
        this.initializeCursorHiding(scene);

        // Setup directional touch control (works alongside keyboard)
        this.initializeDirectionalTouch(scene);

        // Common initialization
        this.initializeCommonHandlers();

        // Mark as initialized
        this.isInitialized = true;

        console.log("Enhanced input system initialized with cursor hiding and directional touch control");
    },

    // Initialize cursor hiding functionality for desktop
    initializeCursorHiding: function (scene) {
        // Pointer move handler
        scene.input.on('pointermove', this.handlePointerMove, this);

        // Show cursor when pressing any button
        scene.input.on('pointerdown', this.handlePointerDown, this);

        // Always show cursor when leaving game area
        scene.game.canvas.addEventListener('mouseout', this.handleMouseOut.bind(this));

        // Force cursor state reset on initialization
        this.resetCursorState();
    },

    // Initialize directional touch control for mobile
    initializeDirectionalTouch: function (scene) {
        scene.input.on('pointerdown', (pointer) => {
            this.touch.isActive = true;
            this.touch.startX = pointer.x;
            this.touch.startY = pointer.y;
            this.touch.currentX = pointer.x;
            this.touch.currentY = pointer.y;
            this.updateTouchDirection();
            console.log('Touch started at:', pointer.x, pointer.y);
        });

        scene.input.on('pointermove', (pointer) => {
            if (this.touch.isActive) {
                this.touch.currentX = pointer.x;
                this.touch.currentY = pointer.y;
                this.updateTouchDirection();
            }
        });

        scene.input.on('pointerup', () => {
            if (this.touch.isActive) {
                console.log('Touch ended');
                this.touch.isActive = false;
                this.touch.directionX = 0;
                this.touch.directionY = 0;
            }
        });
    },

    // Initialize common event handlers
    initializeCommonHandlers: function () {
        // Handle tab visibility changes
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

        // Handle window focus/blur
        window.addEventListener('focus', this.handleWindowFocus.bind(this));
        window.addEventListener('blur', this.handleWindowBlur.bind(this));
    },

    // Update touch direction based on finger movement
    updateTouchDirection: function () {
        // Calculate vector from start to current position
        const deltaX = this.touch.currentX - this.touch.startX;
        const deltaY = this.touch.currentY - this.touch.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance < this.touch.minDistance) {
            // Not enough movement, no direction
            this.touch.directionX = 0;
            this.touch.directionY = 0;
        } else {
            // Normalize direction vector
            this.touch.directionX = deltaX / distance;
            this.touch.directionY = deltaY / distance;
        }
    },

    // Get current touch input values
    getTouchInput: function () {
        if (!this.touch.isActive) {
            return { x: 0, y: 0 };
        }

        return {
            x: this.touch.directionX,
            y: this.touch.directionY
        };
    },

    // Handle pointer movement (for cursor hiding)
    handlePointerMove: function (pointer) {
        // If the cursor position has changed
        if (pointer.x !== this.lastMouseX || pointer.y !== this.lastMouseY) {
            // Update last known position
            this.lastMouseX = pointer.x;
            this.lastMouseY = pointer.y;

            // Show cursor if it was hidden
            if (this.isCursorHidden) {
                document.body.style.cursor = 'auto';
                this.isCursorHidden = false;
            }

            // Reset the hide timer
            this.resetCursorTimer();
        }
    },

    // Handle pointer button press (for cursor hiding)
    handlePointerDown: function (pointer) {
        if (this.isCursorHidden) {
            document.body.style.cursor = 'auto';
            this.isCursorHidden = false;
        }

        // Reset the timer
        this.resetCursorTimer();
    },

    // Handle mouse leaving the game area
    handleMouseOut: function () {
        document.body.style.cursor = 'auto';
        this.isCursorHidden = false;
        this.clearCursorTimer();
    },

    // Handle tab visibility changes
    handleVisibilityChange: function () {
        if (document.hidden) {
            this.isTabActive = false;
            // Show cursor when tab is hidden
            document.body.style.cursor = 'auto';
            this.isCursorHidden = false;
            this.clearCursorTimer();
            // Stop touch input when tab is hidden
            this.touch.isActive = false;
            this.touch.directionX = 0;
            this.touch.directionY = 0;
        } else {
            this.isTabActive = true;
            // Reset cursor timer when tab becomes visible
            this.resetCursorState();
        }
    },

    // Handle window focus
    handleWindowFocus: function () {
        // Reset cursor state when window regains focus
        this.resetCursorState();
    },

    // Handle window blur
    handleWindowBlur: function () {
        // Show cursor when window loses focus
        document.body.style.cursor = 'auto';
        this.isCursorHidden = false;
        this.clearCursorTimer();
        // Stop touch input when window loses focus
        this.touch.isActive = false;
        this.touch.directionX = 0;
        this.touch.directionY = 0;
    },

    // Helper function to reset the cursor hiding timer
    resetCursorTimer: function () {
        // Don't set timers if tab is not active
        if (!this.isTabActive) return;

        // Clear existing timer if any
        this.clearCursorTimer();

        // Set new timer to hide cursor after delay
        this.cursorHideTimer = this.scene.time.delayedCall(
            this.cursorHideDelay,
            function () {
                if (this.isTabActive) {
                    document.body.style.cursor = 'none';
                    this.isCursorHidden = true;
                }
            },
            [],
            this
        );
    },

    // Helper function to clear the cursor timer
    clearCursorTimer: function () {
        if (this.cursorHideTimer) {
            if (this.scene && this.scene.time && this.scene.time.removeEvent) {
                this.scene.time.removeEvent(this.cursorHideTimer);
            }
            this.cursorHideTimer = null;
        }
    },

    // Force a complete reset of cursor state
    resetCursorState: function () {
        // Show cursor initially
        document.body.style.cursor = 'auto';
        this.isCursorHidden = false;

        // Reset timer
        this.clearCursorTimer();
        this.resetCursorTimer();

        // Manually check for mouse movement after a short delay
        if (this.scene) {
            this.scene.time.delayedCall(100, function () {
                // Get the current pointer position
                const pointer = this.scene.input.activePointer;
                if (pointer) {
                    // Force an update of the last position
                    this.lastMouseX = pointer.x;
                    this.lastMouseY = pointer.y;
                }
            }, [], this);
        }
    },

    // Clean up event listeners (call this on game reset if needed)
    cleanup: function () {
        if (!this.isInitialized || !this.scene) return;

        // Remove event listeners
        this.scene.input.off('pointermove', this.handlePointerMove, this);
        this.scene.input.off('pointerdown', this.handlePointerDown, this);

        // Remove canvas listener
        if (this.scene.game && this.scene.game.canvas) {
            this.scene.game.canvas.removeEventListener('mouseout', this.handleMouseOut);
        }

        // Remove document and window listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('focus', this.handleWindowFocus);
        window.removeEventListener('blur', this.handleWindowBlur);

        // Clear timer
        this.clearCursorTimer();

        // Reset cursor visibility
        document.body.style.cursor = 'auto';
        this.isCursorHidden = false;

        // Reset touch state
        this.touch.isActive = false;
        this.touch.directionX = 0;
        this.touch.directionY = 0;

        // Reset initialization flag
        this.isInitialized = false;
        this.scene = null;
    }
};

// Export the system for use in other files
window.InputSystem = InputSystem;