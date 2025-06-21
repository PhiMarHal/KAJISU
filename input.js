// input.js - Enhanced input handling with multiple movement schemes

const InputSystem = {
    // Variables to track cursor state
    lastMouseX: 0,
    lastMouseY: 0,
    cursorHideTimer: null,
    isCursorHidden: false,
    cursorHideDelay: 1000,
    isInitialized: false,
    isTabActive: true,

    // Movement scheme configuration
    movementSchemes: {
        keyboard: true,
        directionalTouch: true,
        tapToMove: true
    },

    // Keyboard movement state
    keyboard: {
        cursors: null,
        wasdKeys: null,
        layout: 'qwerty', // 'qwerty' or 'azerty'
        velocity: { x: 0, y: 0 }
    },

    // Directional touch control variables (existing system)
    touch: {
        isActive: false,
        currentX: 0,
        currentY: 0,
        directionX: 0,
        directionY: 0,
        minDistance: 10,
        positionHistory: [],
        maxHistoryLength: 2,
        historyTimeWindow: 20
    },

    // Tap-to-move system with smart tap/drag detection
    tapToMove: {
        enabled: true,
        targetX: null,
        targetY: null,
        isMoving: false,
        moveSpeed: 400,
        arrivalThreshold: 5,

        // Smart detection properties
        tapStartTime: 0,
        tapStartX: 0,
        tapStartY: 0,
        tapHoldThreshold: 150, // ms - how long before we consider it a potential drag
        tapMoveThreshold: 1500,  // pixels - how far before we consider it a drag
        hasMoved: false,
        isDragging: false,
        isWaitingForIntent: false // waiting to see if it's a tap or drag
    },

    // Initialize tap-to-move system (both systems work)
    initializeTapToMove: function (scene) {
        scene.input.on('pointerdown', (pointer) => {
            if (!this.movementSchemes.tapToMove || gamePaused || gameOver) return;

            console.log(`Touch down at (${pointer.x}, ${pointer.y})`);

            // Store start position
            this.tapToMove.tapStartX = pointer.x;
            this.tapToMove.tapStartY = pointer.y;
            this.tapToMove.tapStartTime = Date.now();
            this.tapToMove.hasMovedDuringThisTouch = false;

            // ALWAYS set tap target immediately (optimistic)
            this.handleSingleTap(pointer.x, pointer.y);

            // ALWAYS start directional touch tracking
            this.touch.isActive = true;
            this.touch.currentX = pointer.x;
            this.touch.currentY = pointer.y;
            this.touch.directionX = 0;
            this.touch.directionY = 0;
            this.touch.positionHistory = [{
                x: pointer.x,
                y: pointer.y,
                timestamp: Date.now()
            }];
        });

        scene.input.on('pointermove', (pointer) => {
            if (!this.touch.isActive || gamePaused || gameOver) return;

            // ALWAYS update directional touch position and direction
            this.touch.currentX = pointer.x;
            this.touch.currentY = pointer.y;

            this.touch.positionHistory.push({
                x: pointer.x,
                y: pointer.y,
                timestamp: Date.now()
            });

            if (this.touch.positionHistory.length > this.touch.maxHistoryLength) {
                this.touch.positionHistory.shift();
            }

            // ALWAYS update direction (this makes directional touch work)
            this.updateTouchDirection();

            // Check if we've moved significantly from the START of this touch
            const deltaX = pointer.x - this.tapToMove.tapStartX;
            const deltaY = pointer.y - this.tapToMove.tapStartY;
            const distanceFromStart = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // Only cancel tap-to-move if we've moved significantly from where we started
            if (distanceFromStart > this.tapToMove.tapMoveThreshold && !this.tapToMove.hasMovedDuringThisTouch) {
                console.log(`Significant movement from start (${distanceFromStart}px) - canceling tap-to-move`);
                this.tapToMove.hasMovedDuringThisTouch = true;

                // Cancel tap-to-move
                this.tapToMove.isMoving = false;
                this.tapToMove.targetX = null;
                this.tapToMove.targetY = null;
            }
        });

        scene.input.on('pointerup', (pointer) => {
            if (gamePaused || gameOver) return;

            console.log("Touch up");

            // ALWAYS stop directional touch
            this.touch.isActive = false;
            this.touch.directionX = 0;
            this.touch.directionY = 0;
            this.touch.positionHistory = [];

            // Reset movement tracking for next touch
            this.tapToMove.hasMovedDuringThisTouch = false;
        });
    },

    // Update movement (simplified directional check)
    updateMovement: function (player, delta) {
        if (!player || !player.body || gamePaused || gameOver) {
            return;
        }

        // Reset keyboard velocity
        this.keyboard.velocity.x = 0;
        this.keyboard.velocity.y = 0;

        // Handle keyboard movement
        if (this.movementSchemes.keyboard) {
            this.updateKeyboardMovement();
        }

        // Check what input we have
        const hasKeyboardInput = this.keyboard.velocity.x !== 0 || this.keyboard.velocity.y !== 0;
        // Check for any directional input while touch is active
        const hasDirectionalInput = this.touch.isActive &&
            (Math.abs(this.touch.directionX) > 0.1 || Math.abs(this.touch.directionY) > 0.1);

        // Priority: Keyboard > Directional Touch > Tap-to-Move
        if (hasKeyboardInput) {
            // Cancel tap-to-move if keyboard is used
            if (this.tapToMove.isMoving) {
                this.tapToMove.isMoving = false;
                this.tapToMove.targetX = null;
                this.tapToMove.targetY = null;
            }

            player.body.setVelocity(
                this.keyboard.velocity.x * playerSpeed * 50,
                this.keyboard.velocity.y * playerSpeed * 50
            );
        } else if (hasDirectionalInput) {
            // Use directional touch (this will work now)
            player.body.setVelocity(
                this.touch.directionX * playerSpeed * 50,
                this.touch.directionY * playerSpeed * 50
            );
        } else if (this.tapToMove.isMoving) {
            // Use tap-to-move
            this.updateTapToMoveMovement(player, delta);
        } else {
            // No input
            player.body.setVelocity(0, 0);
        }
    },

    // Initialize directional touch control (modified to work with smart detection)
    initializeDirectionalTouch: function (scene) {
        // Most of the directional touch logic is now handled in initializeTapToMove
        // This function mainly handles the ongoing drag movement calculation

        scene.input.on('pointermove', (pointer) => {
            // Only process if we're in active drag mode and directional touch is enabled
            if (!this.movementSchemes.directionalTouch || !this.touch.isActive || !this.tapToMove.isDragging) return;

            this.touch.currentX = pointer.x;
            this.touch.currentY = pointer.y;

            this.touch.positionHistory.push({
                x: pointer.x,
                y: pointer.y,
                timestamp: Date.now()
            });

            if (this.touch.positionHistory.length > this.touch.maxHistoryLength) {
                this.touch.positionHistory.shift();
            }

            this.updateTouchDirection();
        });
    },

    // Handle single-tap to move (only called for confirmed taps)
    handleSingleTap: function (x, y) {
        if (gamePaused || gameOver) return;
        //console.log(`Confirmed tap-to-move at (${x}, ${y})`);

        // Set movement target
        this.tapToMove.targetX = x;
        this.tapToMove.targetY = y;
        this.tapToMove.isMoving = true;

        // Make sure we're not in drag mode
        this.touch.isActive = false;
        this.touch.directionX = 0;
        this.touch.directionY = 0;
        this.touch.positionHistory = [];

        // Visual feedback - create a brief target indicator
        if (this.scene) {
            const targetIndicator = this.scene.add.circle(x, y, 15, 0xFFD700, 0.7);
            targetIndicator.setDepth(1000);

            this.scene.tweens.add({
                targets: targetIndicator,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 500,
                onComplete: () => targetIndicator.destroy()
            });
        }
    },

    // Initialize the enhanced input system
    setupCursorHiding: function (scene) {
        if (this.isInitialized) return;

        this.scene = scene;
        this.initializeCursorHiding(scene);
        this.initializeKeyboardControls(scene);
        this.initializeDirectionalTouch(scene);
        this.initializeTapToMove(scene);
        this.initializeCommonHandlers();
        this.isInitialized = true;

        console.log("Enhanced input system initialized with keyboard, directional touch, and tap-to-move");
    },

    // Initialize keyboard controls
    initializeKeyboardControls: function (scene) {
        // Create cursor keys
        this.keyboard.cursors = scene.input.keyboard.createCursorKeys();

        // Detect and set up WASD based on layout
        this.detectKeyboardLayout(scene);
        this.updateWASDKeys(scene);

        // Add keyboard layout toggle (L key)
        scene.input.keyboard.on('keydown-L', () => {
            this.toggleKeyboardLayout(scene);
        });
    },

    // Detect keyboard layout
    detectKeyboardLayout: function (scene) {
        const isLocalEnvironment =
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.startsWith('192.168.1.') ||
            window.location.protocol === 'file:';

        this.keyboard.layout = isLocalEnvironment ? 'azerty' : 'qwerty';

        if (window.isSecureContext && !isLocalEnvironment && navigator.keyboard?.getLayoutMap) {
            navigator.keyboard.getLayoutMap()
                .then(keyboardLayoutMap => {
                    const qKey = keyboardLayoutMap.get('KeyQ');
                    if (qKey === 'a' || qKey === 'A') {
                        this.keyboard.layout = 'azerty';
                        this.updateWASDKeys(scene);
                        console.log("AZERTY keyboard detected via API");
                    }
                })
                .catch(error => {
                    console.log('Error in keyboard API detection:', error);
                });
        }
    },

    // Update WASD keys based on layout
    updateWASDKeys: function (scene) {
        if (this.keyboard.layout === 'azerty') {
            this.keyboard.wasdKeys = scene.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.Z,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.Q,
                right: Phaser.Input.Keyboard.KeyCodes.D
            });
        } else {
            this.keyboard.wasdKeys = scene.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D
            });
        }
    },

    // Toggle keyboard layout
    toggleKeyboardLayout: function (scene) {
        this.keyboard.layout = this.keyboard.layout === 'qwerty' ? 'azerty' : 'qwerty';
        this.updateWASDKeys(scene);

        const confirmation = scene.add.text(
            scene.game.config.width / 2,
            scene.game.config.height / 2,
            `Switched to ${this.keyboard.layout.toUpperCase()} layout`,
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                backgroundColor: '#333333',
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5).setDepth(1000);

        scene.tweens.add({
            targets: confirmation,
            alpha: 0,
            y: confirmation.y - 30,
            duration: 2000,
            onComplete: () => confirmation.destroy()
        });
    },

    // Initialize cursor hiding functionality
    initializeCursorHiding: function (scene) {
        scene.input.on('pointermove', this.handlePointerMove, this);
        scene.input.on('pointerdown', this.handlePointerDown, this);
        scene.game.canvas.addEventListener('mouseout', this.handleMouseOut.bind(this));
        this.resetCursorState();
    },

    // Update touch direction (existing system)
    updateTouchDirection: function () {
        if (this.touch.positionHistory.length < 2) {
            this.touch.directionX = 0;
            this.touch.directionY = 0;
            return;
        }

        const currentTime = Date.now();
        let referencePosition = null;

        for (let i = this.touch.positionHistory.length - 1; i >= 0; i--) {
            const pos = this.touch.positionHistory[i];
            if (currentTime - pos.timestamp <= this.touch.historyTimeWindow) {
                referencePosition = pos;
            } else {
                break;
            }
        }

        if (!referencePosition && this.touch.positionHistory.length >= 2) {
            referencePosition = this.touch.positionHistory[this.touch.positionHistory.length - 2];
        }

        if (!referencePosition) {
            this.touch.directionX = 0;
            this.touch.directionY = 0;
            return;
        }

        const deltaX = this.touch.currentX - referencePosition.x;
        const deltaY = this.touch.currentY - referencePosition.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance < this.touch.minDistance) {
            return;
        }

        this.touch.directionX = deltaX / distance;
        this.touch.directionY = deltaY / distance;
    },

    // Simplified movement update
    updateMovement: function (player, delta) {
        if (!player || !player.body || gamePaused || gameOver) {
            return;
        }

        // Reset keyboard velocity
        this.keyboard.velocity.x = 0;
        this.keyboard.velocity.y = 0;

        // Handle keyboard movement
        if (this.movementSchemes.keyboard) {
            this.updateKeyboardMovement();
        }

        // Check what input we have
        const hasKeyboardInput = this.keyboard.velocity.x !== 0 || this.keyboard.velocity.y !== 0;
        const hasDirectionalInput = this.touch.isActive &&
            (Math.abs(this.touch.directionX) > 0.1 || Math.abs(this.touch.directionY) > 0.1);

        // Priority: Keyboard > Directional Touch > Tap-to-Move
        if (hasKeyboardInput) {
            // Cancel tap-to-move if keyboard is used
            if (this.tapToMove.isMoving) {
                this.tapToMove.isMoving = false;
                this.tapToMove.targetX = null;
                this.tapToMove.targetY = null;
            }

            player.body.setVelocity(
                this.keyboard.velocity.x * playerSpeed * 50,
                this.keyboard.velocity.y * playerSpeed * 50
            );
        } else if (hasDirectionalInput) {
            // Use directional touch
            player.body.setVelocity(
                this.touch.directionX * playerSpeed * 50,
                this.touch.directionY * playerSpeed * 50
            );
        } else if (this.tapToMove.isMoving) {
            // Use tap-to-move
            this.updateTapToMoveMovement(player, delta);
        } else {
            // No input
            player.body.setVelocity(0, 0);
        }
    },

    // Update keyboard movement
    updateKeyboardMovement: function () {
        if (this.keyboard.cursors.left.isDown || this.keyboard.wasdKeys.left.isDown) {
            this.keyboard.velocity.x = -1;
        } else if (this.keyboard.cursors.right.isDown || this.keyboard.wasdKeys.right.isDown) {
            this.keyboard.velocity.x = 1;
        }

        if (this.keyboard.cursors.up.isDown || this.keyboard.wasdKeys.up.isDown) {
            this.keyboard.velocity.y = -1;
        } else if (this.keyboard.cursors.down.isDown || this.keyboard.wasdKeys.down.isDown) {
            this.keyboard.velocity.y = 1;
        }
    },

    // Update tap-to-move movement
    updateTapToMoveMovement: function (player, delta) {
        if (!this.tapToMove.isMoving || this.tapToMove.targetX === null) {
            return;
        }

        const deltaX = this.tapToMove.targetX - player.x;
        const deltaY = this.tapToMove.targetY - player.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Check if we've arrived at the target
        if (distance <= this.tapToMove.arrivalThreshold) {
            this.tapToMove.isMoving = false;
            this.tapToMove.targetX = null;
            this.tapToMove.targetY = null;
            player.body.setVelocity(0, 0);
            return;
        }

        // Calculate direction and move towards target
        const directionX = deltaX / distance;
        const directionY = deltaY / distance;

        const velocityX = directionX * this.tapToMove.moveSpeed;
        const velocityY = directionY * this.tapToMove.moveSpeed;

        player.body.setVelocity(velocityX, velocityY);
    },

    // Update directional touch movement
    updateDirectionalTouchMovement: function () {
        // Direction is already calculated in updateTouchDirection
        // Values are stored in this.touch.directionX/Y
    },

    // Get current touch input (for backward compatibility)
    getTouchInput: function () {
        if (this.tapToMove.isMoving) {
            return { x: 0, y: 0 }; // Don't interfere with tap-to-move
        }

        if (!this.touch.isActive) {
            return { x: 0, y: 0 };
        }

        return {
            x: this.touch.directionX,
            y: this.touch.directionY
        };
    },

    // Configuration methods
    setMovementScheme: function (scheme, enabled) {
        if (this.movementSchemes.hasOwnProperty(scheme)) {
            this.movementSchemes[scheme] = enabled;
            console.log(`Movement scheme '${scheme}': ${enabled ? 'enabled' : 'disabled'}`);
        }
    },

    getMovementSchemes: function () {
        return { ...this.movementSchemes };
    },

    // Existing cursor hiding methods (unchanged)
    initializeCommonHandlers: function () {
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        window.addEventListener('focus', this.handleWindowFocus.bind(this));
        window.addEventListener('blur', this.handleWindowBlur.bind(this));
    },

    handlePointerMove: function (pointer) {
        if (pointer.x !== this.lastMouseX || pointer.y !== this.lastMouseY) {
            this.lastMouseX = pointer.x;
            this.lastMouseY = pointer.y;

            if (this.isCursorHidden) {
                document.body.style.cursor = 'auto';
                this.isCursorHidden = false;
            }

            this.resetCursorTimer();
        }
    },

    handlePointerDown: function (pointer) {
        if (this.isCursorHidden) {
            document.body.style.cursor = 'auto';
            this.isCursorHidden = false;
        }
        this.resetCursorTimer();
    },

    handleMouseOut: function () {
        document.body.style.cursor = 'auto';
        this.isCursorHidden = false;
        this.clearCursorTimer();
    },

    handleVisibilityChange: function () {
        if (document.hidden) {
            this.isTabActive = false;
            document.body.style.cursor = 'auto';
            this.isCursorHidden = false;
            this.clearCursorTimer();
            this.touch.isActive = false;
            this.touch.directionX = 0;
            this.touch.directionY = 0;
            this.touch.positionHistory = [];
            this.tapToMove.isMoving = false;
        } else {
            this.isTabActive = true;
            this.resetCursorState();
        }
    },

    handleWindowFocus: function () {
        this.resetCursorState();
    },

    handleWindowBlur: function () {
        document.body.style.cursor = 'auto';
        this.isCursorHidden = false;
        this.clearCursorTimer();
        this.touch.isActive = false;
        this.touch.directionX = 0;
        this.touch.directionY = 0;
        this.touch.positionHistory = [];
        this.tapToMove.isMoving = false;
    },

    resetCursorTimer: function () {
        if (!this.isTabActive) return;

        this.clearCursorTimer();
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

    clearCursorTimer: function () {
        if (this.cursorHideTimer) {
            if (this.scene?.time?.removeEvent) {
                this.scene.time.removeEvent(this.cursorHideTimer);
            }
            this.cursorHideTimer = null;
        }
    },

    resetCursorState: function () {
        document.body.style.cursor = 'auto';
        this.isCursorHidden = false;
        this.clearCursorTimer();
        this.resetCursorTimer();

        if (this.scene) {
            this.scene.time.delayedCall(100, function () {
                const pointer = this.scene.input.activePointer;
                if (pointer) {
                    this.lastMouseX = pointer.x;
                    this.lastMouseY = pointer.y;
                }
            }, [], this);
        }
    },

    // Cleanup method
    cleanup: function () {
        if (!this.isInitialized || !this.scene) return;

        this.scene.input.off('pointermove', this.handlePointerMove, this);
        this.scene.input.off('pointerdown', this.handlePointerDown, this);

        if (this.scene.game?.canvas) {
            this.scene.game.canvas.removeEventListener('mouseout', this.handleMouseOut);
        }

        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('focus', this.handleWindowFocus);
        window.removeEventListener('blur', this.handleWindowBlur);

        this.clearCursorTimer();
        document.body.style.cursor = 'auto';
        this.isCursorHidden = false;

        // Reset all movement state
        this.keyboard.velocity = { x: 0, y: 0 };
        this.touch.isActive = false;
        this.touch.directionX = 0;
        this.touch.directionY = 0;
        this.touch.positionHistory = [];
        this.tapToMove.isMoving = false;
        this.tapToMove.targetX = null;
        this.tapToMove.targetY = null;

        this.isInitialized = false;
        this.scene = null;
    }
};

// Export the system
window.InputSystem = InputSystem;