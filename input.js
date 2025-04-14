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

    // Initialize the cursor hiding feature
    setupCursorHiding: function (scene) {
        // Skip if already initialized
        if (this.isInitialized) return;

        // Store reference to the scene
        this.scene = scene;

        // Pointer move handler
        scene.input.on('pointermove', this.handlePointerMove, this);

        // Show cursor when pressing any button
        scene.input.on('pointerdown', this.handlePointerDown, this);

        // Always show cursor when leaving game area
        scene.game.canvas.addEventListener('mouseout', this.handleMouseOut.bind(this));

        // Handle tab visibility changes
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

        // Handle window focus/blur
        window.addEventListener('focus', this.handleWindowFocus.bind(this));
        window.addEventListener('blur', this.handleWindowBlur.bind(this));

        // Force cursor state reset on initialization
        this.resetCursorState();

        // Mark as initialized
        this.isInitialized = true;

        console.log("Enhanced cursor hiding system initialized");
    },

    // Handle pointer movement
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

    // Handle pointer button press
    handlePointerDown: function () {
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

        // Reset initialization flag
        this.isInitialized = false;
        this.scene = null;
    }
};

// Export the system for use in other files
window.InputSystem = InputSystem;