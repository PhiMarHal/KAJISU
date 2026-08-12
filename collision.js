// collision.js - Deterministic Collision Registry for KAJISU
// Moves all physics overlap/collider checks into simulateTick for deterministic timing

const CollisionRegistry = {
    pairs: [],
    nextId: 0,
    scene: null,

    init: function (scene) {
        this.scene = scene;
        this.reset();
        console.log("CollisionRegistry initialized");
    },

    register: function (config) {
        const id = this.nextId++;
        this.pairs.push({
            id: id,
            objectA: config.objectA,
            objectB: config.objectB,
            callback: config.callback,
            processCallback: config.processCallback ?? null,
            scope: config.scope ?? this.scene,
            type: config.type ?? 'overlap'
        });
        return id;
    },

    unregister: function (id) {
        const index = this.pairs.findIndex(function (p) { return p.id === id; });
        if (index !== -1) {
            this.pairs.splice(index, 1);
        }
    },

    isValid: function (obj) {
        if (!obj) return false;
        if (typeof obj.getChildren === 'function') return true;
        return obj.active !== false;
    },

    // Normalize an objectA/objectB to an array of game objects.
    // Groups are expanded via getChildren(); single objects are wrapped in an array.
    toList: function (obj) {
        if (typeof obj.getChildren === 'function') return obj.getChildren();
        return [obj];
    },

    // Manual AABB check between two physics bodies.
    aabbOverlap: function (bodyA, bodyB) {
        return bodyA.right > bodyB.left &&
            bodyA.left < bodyB.right &&
            bodyA.bottom > bodyB.top &&
            bodyA.top < bodyB.bottom;
    },

    // Process a 'manual' pair: nested loop in deterministic array order.
    // Works with groups (projectiles) and single entities (orbitals, drops).
    processManual: function (pair) {
        var childrenA = this.toList(pair.objectA);
        var childrenB = this.toList(pair.objectB);

        for (var i = 0; i < childrenA.length; i++) {
            var a = childrenA[i];
            if (!a || !a.active || !a.body) continue;

            for (var j = 0; j < childrenB.length; j++) {
                var b = childrenB[j];
                if (!b || !b.active || !b.body) continue;

                if (this.aabbOverlap(a.body, b.body)) {
                    // Honor an optional Phaser-style processCallback as a filter,
                    // so pairs migrated off scene.physics.overlap keep identical
                    // semantics. Returning falsy skips this collision entirely.
                    if (pair.processCallback &&
                        !pair.processCallback.call(pair.scope, a, b)) {
                        continue;
                    }

                    pair.callback.call(pair.scope, a, b);

                    // If a was destroyed by the callback (non-piercing projectile),
                    // stop checking further enemies for this projectile.
                    if (!a.active) break;
                }
            }
        }
    },

    processAll: function () {
        var scene = this.scene;
        if (!scene) return;

        var inDemo = !!(window.DemoSystem &&
            (window.DemoSystem.isRecording || window.DemoSystem.isPlaying));

        for (var i = this.pairs.length - 1; i >= 0; i--) {
            var pair = this.pairs[i];

            if (!this.isValid(pair.objectA) || !this.isValid(pair.objectB)) {
                this.pairs.splice(i, 1);
                continue;
            }

            // All overlap detection runs through the deterministic manual AABB
            // path. Phaser's scene.physics.overlap resolves callbacks in an order
            // derived from its internal spatial tree, which is NOT guaranteed
            // stable across record/playback — routing 'overlap' (and the default)
            // through processManual closes that desync hole.
            if (pair.type === 'collide') {
                // 'collide' implies physical separation/bounce, which only Phaser's
                // solver provides — and it is non-deterministic. Warn once per pair
                // during a demo so any straggler that genuinely relies on it can be
                // migrated to manual handling or removed.
                if (inDemo && !pair._warnedNonDeterministic) {
                    pair._warnedNonDeterministic = true;
                    console.warn('CollisionRegistry: pair id ' + pair.id +
                        " uses non-deterministic 'collide' during a demo. " +
                        "Migrate this collision to 'manual'.");
                }
                scene.physics.collide(
                    pair.objectA, pair.objectB,
                    pair.callback, pair.processCallback, pair.scope
                );
            } else {
                // 'manual', 'overlap', and any unspecified type → deterministic AABB.
                this.processManual(pair);
            }
        }
    },

    reset: function () {
        this.pairs = [];
        this.nextId = 0;
    }
};

window.CollisionRegistry = CollisionRegistry;