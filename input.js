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
        currentX: 0,
        currentY: 0,
        directionX: 0,  // Normalized direction (-1 to 1)
        directionY: 0,  // Normalized direction (-1 to 1)
        minDistance: 10, // Minimum distance before registering movement
        // Sliding window for recent positions
        positionHistory: [],
        maxHistoryLength: 2, // Keep last 5 positions
        historyTimeWindow: 20 // Use positions from last 150ms
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
            this.touch.currentX = pointer.x;
            this.touch.currentY = pointer.y;
            // Reset position history
            this.touch.positionHistory = [{
                x: pointer.x,
                y: pointer.y,
                timestamp: Date.now()
            }];
            this.updateTouchDirection();
            console.log('Touch started at:', pointer.x, pointer.y);
        });

        scene.input.on('pointermove', (pointer) => {
            if (this.touch.isActive) {
                this.touch.currentX = pointer.x;
                this.touch.currentY = pointer.y;

                // Add to position history
                this.touch.positionHistory.push({
                    x: pointer.x,
                    y: pointer.y,
                    timestamp: Date.now()
                });

                // Trim history to max length
                if (this.touch.positionHistory.length > this.touch.maxHistoryLength) {
                    this.touch.positionHistory.shift();
                }

                this.updateTouchDirection();
            }
        });

        scene.input.on('pointerup', () => {
            if (this.touch.isActive) {
                console.log('Touch ended');
                this.touch.isActive = false;
                this.touch.directionX = 0;
                this.touch.directionY = 0;
                this.touch.positionHistory = [];
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

    // Snap angle to nearest cardinal direction (with biased ranges)
    snapToCardinalDirection: function (rawDirectionX, rawDirectionY) {
        // Calculate angle from raw direction
        let angle = Math.atan2(rawDirectionY, rawDirectionX) * (180 / Math.PI);

        // Normalize angle to 0-360 range
        if (angle < 0) angle += 360;

        // Find matching direction range
        for (const range of this.touch.cardinalRanges) {
            if (range.wrapsAround) {
                // Handle wrap-around case (e.g., East: 330° to 30°)
                if (angle >= range.minAngle || angle <= range.maxAngle) {
                    const length = Math.sqrt(range.x * range.x + range.y * range.y);
                    return {
                        x: range.x / length,
                        y: range.y / length
                    };
                }
            } else {
                // Normal case
                if (angle > range.minAngle && angle <= range.maxAngle) {
                    const length = Math.sqrt(range.x * range.x + range.y * range.y);
                    return {
                        x: range.x / length,
                        y: range.y / length
                    };
                }
            }
        }

        // Fallback to East (shouldn't happen)
        return { x: 1, y: 0 };
    },

    // Update touch direction based on recent finger movement
    updateTouchDirection: function () {
        if (this.touch.positionHistory.length < 2) {
            // Not enough history, no direction
            this.touch.directionX = 0;
            this.touch.directionY = 0;
            return;
        }

        const currentTime = Date.now();

        // Find the oldest position within our time window
        let referencePosition = null;
        for (let i = this.touch.positionHistory.length - 1; i >= 0; i--) {
            const pos = this.touch.positionHistory[i];
            if (currentTime - pos.timestamp <= this.touch.historyTimeWindow) {
                referencePosition = pos;
            } else {
                break; // Positions are chronological, so we can stop here
            }
        }

        // If no reference position found, use the second-to-last position
        if (!referencePosition && this.touch.positionHistory.length >= 2) {
            referencePosition = this.touch.positionHistory[this.touch.positionHistory.length - 2];
        }

        if (!referencePosition) {
            this.touch.directionX = 0;
            this.touch.directionY = 0;
            return;
        }

        // Calculate vector from reference position to current position
        const deltaX = this.touch.currentX - referencePosition.x;
        const deltaY = this.touch.currentY - referencePosition.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance < this.touch.minDistance) {
            // Not enough movement, keep previous direction or set to zero
            // Don't change direction if movement is too small
            return;
        }

        // Calculate raw direction
        const rawDirectionX = deltaX / distance;
        const rawDirectionY = deltaY / distance;

        // Snap to cardinal direction if enabled
        if (this.touch.useCardinalDirections) {
            const snappedDirection = this.snapToCardinalDirection(rawDirectionX, rawDirectionY);
            this.touch.directionX = snappedDirection.x;
            this.touch.directionY = snappedDirection.y;
        } else {
            // Use raw direction
            this.touch.directionX = rawDirectionX;
            this.touch.directionY = rawDirectionY;
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
            this.touch.positionHistory = [];
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
        this.touch.positionHistory = [];
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
        this.touch.positionHistory = [];

        // Reset initialization flag
        this.isInitialized = false;
        this.scene = null;
    }
};

// Export the system for use in other files
window.InputSystem = InputSystem;