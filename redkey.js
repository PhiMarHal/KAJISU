// Red Key System for Word Survivors
// Enables the player to break out of the game window into an expanded world

// Variables to track Red Key state
let redKeyActive = false;
let hasRedKey = false;
let breakingOutTransitionActive = false;
let worldBroken = false;

// References to visual elements
let originalGameWindow = null;
let gameWindowBorder = null;
let crackEffects = [];
let outsideWorldObjects = [];

// Configuration for Red Key behavior
const RedKeyConfig = {
    breakoutDistance: 50,        // How far past the boundary player must push
    crackEffectDuration: 1500,   // Duration of crack effect animation
    transitionDuration: 2000,    // Camera transition time
    outsideWorldScale: 3,        // How much larger the outside world is
    borderWidth: 8,              // Width of the game window border when visible
    worldBgColor: 0x333333       // Background color for the outside world
};

// Helper function to get the active scene
function getActiveScene() {
    // Access the first active scene from the global game object
    if (game && game.scene && game.scene.scenes && game.scene.scenes.length > 0) {
        return game.scene.scenes[0];
    }
    return null;
}

// Initialize Red Key system
function initRedKeySystem() {
    // Reset state when initialized
    redKeyActive = false;
    hasRedKey = false;
    breakingOutTransitionActive = false;
    worldBroken = false;

    // Clean up any existing elements
    if (gameWindowBorder) gameWindowBorder.destroy();
    crackEffects.forEach(effect => effect.destroy());
    crackEffects = [];
    outsideWorldObjects.forEach(obj => obj.destroy());
    outsideWorldObjects = [];

    console.log("Red Key system initialized");
}

// Activate Red Key when perk is acquired
window.activateRedKey = function () {
    hasRedKey = true;
    redKeyActive = true;

    const scene = getActiveScene();
    if (!scene) {
        console.error("Could not get active scene for Red Key activation");
        return;
    }

    // Visual effect when acquiring the key
    const keyEffect = scene.add.text(
        player.x,
        player.y - 40,
        "赤鍵", // Red Key kanji
        {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#FF3333',
            stroke: '#000000',
            strokeThickness: 4
        }
    ).setOrigin(0.5);

    // Glow effect on the player
    scene.tweens.add({
        targets: player,
        alpha: 0.2,
        scale: 1.5,
        duration: 300,
        yoyo: true,
        repeat: 2,
        onComplete: function () {
            player.alpha = 1;
            player.setScale(1);
        }
    });

    // Float up and fade out the key text
    scene.tweens.add({
        targets: keyEffect,
        y: keyEffect.y - 60,
        alpha: 0,
        duration: 1500,
        ease: 'Power2',
        onComplete: function () {
            keyEffect.destroy();
        }
    });

    // Add to player status effects
    addRedKeyStatusEffect();

    console.log("Red Key activated. Reach the game boundary to break free.");
};

// Add Red Key status effect to player
function addRedKeyStatusEffect() {
    const scene = getActiveScene();
    if (!scene) return;

    // Create a small red key icon that follows the player
    const keyIcon = scene.add.text(
        player.x,
        player.y - 30,
        "鍵", // Key kanji
        {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#FF3333'
        }
    ).setOrigin(0.5);

    // Register for cleanup
    window.registerEffect('entity', keyIcon);

    // Update key position in game loop
    scene.events.on('update', function () {
        if (keyIcon && keyIcon.active && player && player.active) {
            keyIcon.setPosition(player.x, player.y - 30);
        }
    });
}

// Check if player is trying to break out
function checkForBreakout() {
    if (!hasRedKey || !redKeyActive || breakingOutTransitionActive || worldBroken) return;

    const bounds = {
        left: 0,
        right: 1200,
        top: 0,
        bottom: 800
    };

    // Detect if player is pushing against a boundary
    const pushingLeft = player.x <= bounds.left + 20 && wasdKeys.left.isDown;
    const pushingRight = player.x >= bounds.right - 20 && wasdKeys.right.isDown;
    const pushingTop = player.y <= bounds.top + 20 && wasdKeys.up.isDown;
    const pushingBottom = player.y >= bounds.bottom - 20 && wasdKeys.down.isDown;

    if (pushingLeft || pushingRight || pushingTop || pushingBottom) {
        // Determine which boundary is being pushed
        let breakPosition = { x: player.x, y: player.y };
        let breakDirection = { x: 0, y: 0 };

        if (pushingLeft) {
            breakPosition.x = bounds.left;
            breakDirection.x = -1;
        } else if (pushingRight) {
            breakPosition.x = bounds.right;
            breakDirection.x = 1;
        }

        if (pushingTop) {
            breakPosition.y = bounds.top;
            breakDirection.y = -1;
        } else if (pushingBottom) {
            breakPosition.y = bounds.bottom;
            breakDirection.y = 1;
        }

        // Start the break out process
        startBreakoutTransition(breakPosition, breakDirection);
    }
}

// Start the breakout transition
function startBreakoutTransition(position, direction) {
    // Prevent multiple transitions
    if (breakingOutTransitionActive) return;
    breakingOutTransitionActive = true;

    const scene = getActiveScene();
    if (!scene) {
        console.error("Could not get active scene for breakout transition");
        breakingOutTransitionActive = false;
        return;
    }

    console.log("Starting breakout transition at position:", position);

    // Pause the game during transition
    pauseGame();

    // Create a snapshot of the current game window
    createGameWindowVisual();

    // Create crack effects around the break position
    createCrackEffects(position, direction);

    // After crack effects, perform the actual breakout
    scene.time.delayedCall(RedKeyConfig.crackEffectDuration, function () {
        performBreakout();
    });
}

// Create visual representation of the game window
function createGameWindowVisual() {
    const scene = getActiveScene();
    if (!scene) return;

    console.log("Creating game window visual");

    // Create background rectangle
    const windowBg = scene.add.rectangle(
        600, 400, 1200, 800, 0x000000, 0.3
    );

    // Create border
    gameWindowBorder = scene.add.rectangle(
        600, 400, 1200, 800, 0xFFD700, 0
    ).setStrokeStyle(RedKeyConfig.borderWidth, 0xFFD700);

    // Store references
    originalGameWindow = windowBg;

    // Make them invisible initially
    windowBg.setAlpha(0);
    gameWindowBorder.setAlpha(0);

    // Add to our tracking array
    outsideWorldObjects.push(windowBg);
    outsideWorldObjects.push(gameWindowBorder);
}

// Create crack effect visuals
function createCrackEffects(position, direction) {
    const scene = getActiveScene();
    if (!scene) return;

    // Calculate crack starting positions
    const crackCount = 8;
    const crackStartX = position.x;
    const crackStartY = position.y;

    // Create cracks emanating from the breaking point
    for (let i = 0; i < crackCount; i++) {
        // Calculate angles for crack lines
        const angle = (i / crackCount) * Math.PI * 2;
        const length = 30 + Math.random() * 50;

        // Create line graphic for crack
        const crack = scene.add.graphics();
        crack.lineStyle(3, 0xFF3333);
        crack.beginPath();
        crack.moveTo(crackStartX, crackStartY);

        // Create jagged line with segments
        let currentX = crackStartX;
        let currentY = crackStartY;
        const segments = 3 + Math.floor(Math.random() * 3);

        for (let j = 0; j < segments; j++) {
            // Add randomness to crack direction
            const segmentAngle = angle + (Math.random() - 0.5) * 0.5;
            const segmentLength = length / segments;

            // Calculate endpoint
            const endX = currentX + Math.cos(segmentAngle) * segmentLength;
            const endY = currentY + Math.sin(segmentAngle) * segmentLength;

            crack.lineTo(endX, endY);
            currentX = endX;
            currentY = endY;
        }

        crack.strokePath();
        crackEffects.push(crack);
    }

    // Animate cracks growing
    scene.tweens.add({
        targets: crackEffects,
        scale: { from: 0.2, to: 1 },
        duration: RedKeyConfig.crackEffectDuration * 0.8,
        ease: 'Power2'
    });

    // Add glow effect around breaking point
    const glow = scene.add.circle(
        crackStartX, crackStartY, 20, 0xFF3333, 0.6
    );
    crackEffects.push(glow);

    // Pulse the glow
    scene.tweens.add({
        targets: glow,
        scale: 2,
        alpha: 0,
        duration: RedKeyConfig.crackEffectDuration,
        ease: 'Sine.easeOut'
    });
}

// Perform the actual breakout
function performBreakout() {
    const scene = getActiveScene();
    if (!scene) return;

    console.log("Performing breakout");

    // Expand world bounds
    expandWorldBounds();

    // Make game window visual visible
    if (originalGameWindow) originalGameWindow.setAlpha(0.2);
    if (gameWindowBorder) gameWindowBorder.setAlpha(1);

    // Transition camera to follow player
    transitionCameraToFollowPlayer();

    // Create outside world elements
    createOutsideWorldElements();

    // Set state
    worldBroken = true;
    breakingOutTransitionActive = false;

    // Resume game
    resumeGame();
}

// Expand the physics world bounds
function expandWorldBounds() {
    const scene = getActiveScene();
    if (!scene) return;

    // Determine new world size based on configuration
    const expandedWidth = 1200 * RedKeyConfig.outsideWorldScale;
    const expandedHeight = 800 * RedKeyConfig.outsideWorldScale;

    // Center the expanded world on the original window
    const offsetX = (expandedWidth - 1200) / 2;
    const offsetY = (expandedHeight - 800) / 2;

    // Set new physics world bounds
    scene.physics.world.setBounds(
        -offsetX, -offsetY, expandedWidth, expandedHeight
    );

    // Update player collision bounds
    player.body.setCollideWorldBounds(true);

    console.log("World bounds expanded to", -offsetX, -offsetY, expandedWidth, expandedHeight);
}

// Transition camera to follow player
function transitionCameraToFollowPlayer() {
    const scene = getActiveScene();
    if (!scene) return;

    // Create a deadzone around the player for camera
    scene.cameras.main.setDeadzone(100, 100);

    // Start following the player
    scene.cameras.main.startFollow(player, true, 0.05, 0.05);

    // Smooth transition
    scene.tweens.add({
        targets: scene.cameras.main,
        zoom: 0.9, // Slightly zoom out to show more of the world
        duration: RedKeyConfig.transitionDuration,
        ease: 'Sine.easeOut'
    });

    console.log("Camera now following player");
}

// Create visual elements for the outside world
function createOutsideWorldElements() {
    const scene = getActiveScene();
    if (!scene) return;

    // Create a background for the outside world
    const worldWidth = 1200 * RedKeyConfig.outsideWorldScale;
    const worldHeight = 800 * RedKeyConfig.outsideWorldScale;

    const outsideWorldBg = scene.add.rectangle(
        600, 400,
        worldWidth,
        worldHeight,
        RedKeyConfig.worldBgColor
    ).setOrigin(0.5).setDepth(-10);

    outsideWorldObjects.push(outsideWorldBg);

    // Add some decorative elements in the outside world
    const decorCount = 20;

    for (let i = 0; i < decorCount; i++) {
        // Random position outside the original game window
        let x, y;
        do {
            x = -worldWidth / 2 + Math.random() * worldWidth;
            y = -worldHeight / 2 + Math.random() * worldHeight;
        } while (x > -600 && x < 600 && y > -400 && y < 400);

        // Adjust coordinates to be centered
        x += 600;
        y += 400;

        // Create a decorative kanji
        const decorKanji = scene.add.text(
            x, y,
            "外", // "Outside" kanji
            {
                fontFamily: 'Arial',
                fontSize: '48px',
                color: '#666666',
                alpha: 0.3
            }
        ).setOrigin(0.5);

        outsideWorldObjects.push(decorKanji);
    }

    console.log("Outside world elements created");
}

// Export functions and variables
window.RedKeySystem = {
    init: initRedKeySystem,
    checkForBreakout: checkForBreakout,
    hasRedKey: function () { return hasRedKey; },
    isWorldBroken: function () { return worldBroken; }
};