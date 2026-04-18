// demosync.js - Deterministic Replay Diagnostic System for KAJISU
// Captures game state snapshots during recording, compares during playback.
// On first mismatch, logs a detailed diff showing exactly which values diverged.

const DemoSync = {
    SNAPSHOT_INTERVAL: 60, // Every 60 ticks (~1 second)
    enabled: true,
    desyncDetected: false,
    desyncTick: null,
    desyncCount: 0,
    POST_DESYNC_INTERVAL: 3600, // Every 3600 ticks (~1 minute) after first desync

    // Capture a snapshot of all gameplay-relevant state
    captureSnapshot: function () {
        const rngCounters = SeededRNG.getCounters();
        const enemyCount = (window.EnemySystem && EnemySystem.enemiesGroup)
            ? EnemySystem.enemiesGroup.countActive() : 0;
        const orbitalCount = (window.OrbitalSystem) ? OrbitalSystem.getCount() : 0;
        const dropCount = (window.DropperSystem) ? DropperSystem.getCount() : 0;
        const projectileCount = (window.WeaponSystem && WeaponSystem.projectilesGroup)
            ? WeaponSystem.projectilesGroup.countActive() : 0;
        const beamCount = (window.activeBeams) ? activeBeams.length : 0;

        return {
            // Player state
            px: Math.round(player.x * 100) / 100,
            py: Math.round(player.y * 100) / 100,
            hp: playerHealth,
            maxHp: maxPlayerHealth,
            xp: heroExp,
            lvl: playerLevel,
            spd: Math.round(playerSpeed * 1000) / 1000,
            dmg: Math.round(playerDamage * 100) / 100,
            luk: playerLuck,
            fr: Math.round(playerFireRate * 100) / 100,

            // Game state
            score: ScoreSystem.calculateCurrentScore(),
            time: Math.round(elapsedTime * 100) / 100,
            perkCount: acquiredPerks ? acquiredPerks.length : 0,

            // Entity counts
            enemies: enemyCount,
            orbitals: orbitalCount,
            orbitalDetails: this.getOrbitalDetails(),
            drops: dropCount,
            projectiles: projectileCount,
            beams: beamCount,

            // Pushable positions and velocities — diagnostic for pushable determinism.
            // Sorted by damageSourceId so list ordering is stable across runs.
            pushables: this.getPushableStates(),

            // RNG counters (the most important diagnostic)
            rng_enemy: rngCounters.enemy,
            rng_perk: rngCounters.perk,
            rng_drop: rngCounters.drop,
            rng_effect: rngCounters.effect,
            rng_visual: rngCounters.visual,
            rng_drawing: rngCounters.drawing
        };
    },

    // Generate a simple hash string for quick comparison
    hashSnapshot: function (snap) {
        // Include all determinism-critical values (skip visual-only counts like projectiles).
        // Pushable positions hash in as a pipe-joined string so any drift triggers mismatch.
        const pushHash = snap.pushables
            ? snap.pushables.map(function (p) { return p.x + ',' + p.y; }).join('|')
            : '';
        return `${snap.px},${snap.py},${snap.hp},${snap.xp},${snap.lvl},${snap.score},${snap.time},${snap.enemies},${snap.rng_enemy},${snap.rng_perk},${snap.rng_drop},${snap.rng_effect},${snap.rng_drawing},P[${pushHash}]`;
    },

    // Get detailed info about active orbitals for debugging
    getOrbitalDetails: function () {
        if (typeof OrbitalSystem === 'undefined') return [];

        try {
            const orbitals = OrbitalSystem.getAll();
            return orbitals.map(orbital => {
                const entity = orbital.entity;
                return {
                    symbol: entity ? entity.text : '?',
                    pattern: orbital.pattern || 'unknown',
                    familiarType: orbital.options?.familiarType || null,
                    collisionType: orbital.collisionType || 'unknown',
                    lifespan: orbital.lifespan
                };
            });
        } catch (e) {
            return [];
        }
    },

    // Gather pushable entity states for drift diagnostics.
    // Returns [{id, x, y, vx, vy}, ...] sorted by id so ordering is deterministic.
    // Note: damageSourceId is currently non-deterministic between runs (uses Date.now()
    // and Math.random()), so IDs won't match across record/playback. The hash still
    // catches any position drift correctly, but the drift readout can't cleanly pair
    // balls across runs — it can only say "something in the pushable set drifted."
    getPushableStates: function () {
        if (typeof DropperSystem === 'undefined') return [];

        try {
            const pushables = DropperSystem.getAll().filter(function (d) {
                return d.entity && d.entity.isPlayerPushable;
            });
            return pushables.map(function (d) {
                const body = d.entity.body;
                return {
                    id: d.entity.damageSourceId,
                    x: Math.round(d.entity.x * 100) / 100,
                    y: Math.round(d.entity.y * 100) / 100,
                    vx: body ? Math.round(body.velocity.x * 100) / 100 : 0,
                    vy: body ? Math.round(body.velocity.y * 100) / 100 : 0
                };
            }).sort(function (a, b) {
                return a.id.localeCompare(b.id);
            });
        } catch (e) {
            return [];
        }
    },

    // Called every tick from simulateTick
    checkTick: function (tick) {
        if (!this.enabled) return;
        if (tick === 0) return; // Skip tick 0

        // Use normal interval before desync, reduced frequency after
        const interval = this.desyncDetected ? this.POST_DESYNC_INTERVAL : this.SNAPSHOT_INTERVAL;
        if (tick % interval !== 0) return;

        const snap = this.captureSnapshot();

        if (DemoSystem.isRecording) {
            // Store snapshot in the recording
            if (!DemoSystem.recording.snapshots) {
                DemoSystem.recording.snapshots = [];
            }
            DemoSystem.recording.snapshots.push([tick, snap]);

        } else if (DemoSystem.isPlaying) {
            // Compare against recorded snapshot
            const demo = DemoSystem.playback.demo;
            if (!demo || !demo.snapshots) return;

            // Find the matching recorded snapshot for this tick
            const recorded = demo.snapshots.find(function (s) { return s[0] === tick; });
            if (!recorded) return;

            const recSnap = recorded[1];
            const recHash = this.hashSnapshot(recSnap);
            const playHash = this.hashSnapshot(snap);

            if (recHash !== playHash) {
                this.desyncCount++;
                if (!this.desyncDetected) {
                    this.desyncDetected = true;
                    this.desyncTick = tick;
                    this.reportDesync(tick, recSnap, snap);
                } else {
                    this.reportDrift(tick, recSnap, snap);
                }
            }
        }
    },

    // Compact drift report for ongoing desync tracking
    reportDrift: function (tick, rec, play) {
        const timeStr = (tick / 60).toFixed(1);
        const sinceTick = tick - this.desyncTick;
        const sinceStr = (sinceTick / 60).toFixed(1);

        const diffs = [];
        Object.keys(rec).forEach(function (key) {
            // Skip structured fields — they get their own dedicated readouts below
            if (key === 'orbitalDetails' || key === 'pushables') return;
            if (rec[key] !== play[key]) {
                const delta = typeof rec[key] === 'number' ? (play[key] - rec[key]).toFixed(4) : 'changed';
                diffs.push(key + ':' + delta);
            }
        });

        console.warn(
            `[DRIFT #${this.desyncCount}] tick ${tick} (~${timeStr}s, +${sinceStr}s since first): ${diffs.join(', ')}`
        );

        // Pushable drift readout — compares ball counts and per-ball positions.
        // IDs don't match across runs (see getPushableStates note), so we show
        // aggregate count changes and a compact position list for each side.
        this.reportPushableDrift(rec.pushables, play.pushables);
    },

    // Emit a focused drift line for pushable positions/counts.
    reportPushableDrift: function (recPushables, playPushables) {
        const rec = recPushables || [];
        const play = playPushables || [];

        if (rec.length === 0 && play.length === 0) return;

        // Count mismatch is the most important signal
        if (rec.length !== play.length) {
            console.warn(
                `  pushable count diverged: record=${rec.length}, playback=${play.length}`
            );
        }

        // Per-ball position listing: since IDs don't match, we show both sides sorted
        // by x+y so a human can spot whether positions look similar or totally different.
        const fmt = function (list) {
            return list
                .slice()
                .sort(function (a, b) { return (a.x + a.y) - (b.x + b.y); })
                .map(function (p) { return `(${p.x},${p.y})`; })
                .join(' ');
        };

        const recStr = fmt(rec);
        const playStr = fmt(play);
        if (recStr !== playStr) {
            console.warn(`  pushable positions [rec]: ${recStr}`);
            console.warn(`  pushable positions [play]: ${playStr}`);
        }
    },

    // Detailed desync report
    reportDesync: function (tick, rec, play) {
        const timeStr = (tick / 60).toFixed(1);
        const seed = (DemoSystem.isPlaying && DemoSystem.playback.demo) ? DemoSystem.playback.demo.seed : (DemoSystem.recording ? DemoSystem.recording.seed : '?');

        console.error(`%c DESYNC DETECTED at tick ${tick} (~${timeStr}s) | seed: ${seed} `, 'background: #ff0000; color: #fff; font-size: 14px; padding: 4px;');

        // Log acquired perks
        const perks = (typeof acquiredPerks !== 'undefined' && Array.isArray(acquiredPerks)) ? acquiredPerks : [];
        if (perks.length > 0) {
            console.log('PERKS AT DESYNC: ', perks.join(', '));
        }

        // Build diff table for console.table
        const rows = [];
        Object.keys(rec).forEach(function (key) {
            // Skip structured fields — they get their own dedicated readouts below
            if (key === 'orbitalDetails' || key === 'pushables') return;
            if (rec[key] !== play[key]) {
                rows.push({ field: key, recorded: rec[key], playback: play[key] });
            }
        });

        if (rows.length > 0) {
            console.warn('DIVERGENT VALUES: ');
            console.table(rows);
        }

        // Show matching values for context
        const matching = [];
        Object.keys(rec).forEach(function (key) {
            if (key === 'orbitalDetails' || key === 'pushables') return;
            if (rec[key] === play[key]) {
                matching.push(key);
            }
        });
        if (matching.length > 0) {
            console.log('Matching values:', matching.join(', '));
        }

        // Pushable-specific readout on the first desync
        this.reportPushableDrift(rec.pushables, play.pushables);

        // Diagnosis
        this.logDiagnosis(rec, play);
    },

    // Provide guidance based on what diverged
    logDiagnosis: function (rec, play) {
        console.log('--- DIAGNOSIS ---');

        const pushablesDiverged =
            this.hashPushables(rec.pushables) !== this.hashPushables(play.pushables);
        if (pushablesDiverged) {
            console.log('Pushable positions diverged. Likely causes: non-deterministic motion integration, non-deterministic collision timing, or non-deterministic damageSourceId generation affecting a downstream branch.');
        }

        if (rec.rng_enemy !== play.rng_enemy) {
            console.log('Enemy RNG counter diverged. Enemy spawning consumed a different number of random values — check for non-deterministic spawn conditions.');
        }
        if (rec.rng_effect !== play.rng_effect) {
            console.log('Effect RNG counter diverged. Effects (familiar fires, random angles, etc.) consumed different numbers of random values.');
        }
        if (rec.rng_perk !== play.rng_perk) {
            console.log('Perk RNG counter diverged. Perk offering consumed a different number of random values.');
        }

        if (rec.enemies !== play.enemies) {
            console.log('Enemy count diverged. Check if enemy spawning or destruction depends on non-deterministic timing.');
        }
        if (rec.drops !== play.drops) {
            console.log('Drop count diverged. Check if drop spawning or destruction depends on non-deterministic timing (see pushable readout if applicable).');
        }
        if (rec.orbitals !== play.orbitals) {
            console.log('Orbital count diverged.');
        }
        if (rec.score !== play.score || rec.xp !== play.xp) {
            console.log('Score/XP divergence is likely a consequence of the above issues.');
        }
    },

    // Helper for diagnosis: hash just the pushable list
    hashPushables: function (list) {
        if (!list) return '';
        return list.map(function (p) { return p.x + ',' + p.y; }).join('|');
    },

    // Reset state on new game
    reset: function () {
        this.desyncDetected = false;
        this.desyncTick = null;
        this.desyncCount = 0;
    }
};

window.DemoSync = DemoSync;