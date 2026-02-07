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

    processAll: function () {
        const scene = this.scene;
        if (!scene) return;

        for (var i = this.pairs.length - 1; i >= 0; i--) {
            var pair = this.pairs[i];

            if (!this.isValid(pair.objectA) || !this.isValid(pair.objectB)) {
                this.pairs.splice(i, 1);
                continue;
            }

            if (pair.type === 'collide') {
                scene.physics.collide(
                    pair.objectA, pair.objectB,
                    pair.callback, pair.processCallback, pair.scope
                );
            } else {
                scene.physics.overlap(
                    pair.objectA, pair.objectB,
                    pair.callback, pair.processCallback, pair.scope
                );
            }
        }
    },

    reset: function () {
        this.pairs = [];
        this.nextId = 0;
    }
};

window.CollisionRegistry = CollisionRegistry;