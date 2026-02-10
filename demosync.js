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
            ? EnemySystem.enemiesGroup.getChildren().length : 0;
        const orbitalCount = (window.OrbitalSystem) ? OrbitalSystem.getCount() : 0;
        const dropCount = (window.DropperSystem) ? DropperSystem.getCount() : 0;
        const projectileCount = (window.projectiles) ? projectiles.getChildren().length : 0;
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
            score: score,
            time: Math.round(elapsedTime * 100) / 100,
            perkCount: acquiredPerks ? acquiredPerks.length : 0,

            // Entity counts
            enemies: enemyCount,
            orbitals: orbitalCount,
            drops: dropCount,
            projectiles: projectileCount,
            beams: beamCount,

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
        // Include all determinism-critical values (skip visual-only counts like projectiles)
        return `${snap.px},${snap.py},${snap.hp},${snap.xp},${snap.lvl},${snap.score},${snap.time},${snap.enemies},${snap.rng_enemy},${snap.rng_perk},${snap.rng_drop},${snap.rng_effect},${snap.rng_drawing}`;
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
            if (rec[key] !== play[key]) {
                const delta = typeof rec[key] === 'number' ? (play[key] - rec[key]).toFixed(4) : 'changed';
                diffs.push(key + ':' + delta);
            }
        });

        console.warn(
            `[DRIFT #${this.desyncCount}] tick ${tick} (~${timeStr}s, +${sinceStr}s since first): ${diffs.join(', ')}`
        );
    },

    // Detailed desync report
    reportDesync: function (tick, rec, play) {
        const timeStr = (tick / 60).toFixed(1);
        const seed = (DemoSystem.isPlaying && DemoSystem.playback.demo) ? DemoSystem.playback.demo.seed : (DemoSystem.recording ? DemoSystem.recording.seed : '?');

        console.error(`%c DESYNC DETECTED at tick ${tick} (~${timeStr}s) | seed: ${seed} `, 'background: #ff0000; color: #fff; font-size: 14px; padding: 4px;');

        // Build diff table
        const fields = Object.keys(rec);
        const diffs = [];
        const matches = [];

        fields.forEach(function (key) {
            const r = rec[key];
            const p = play[key];
            if (r !== p) {
                diffs.push({ field: key, recorded: r, playback: p });
            } else {
                matches.push(key);
            }
        });

        if (diffs.length > 0) {
            console.error('%c DIVERGENT VALUES: ', 'font-weight: bold; color: #ff4444;');
            console.table(diffs);
        }

        console.log('%c Matching values: ' + matches.join(', '), 'color: #44ff44;');

        // Provide diagnostic hints based on what diverged
        this.diagnose(diffs);
    },

    // Provide human-readable diagnostic hints
    diagnose: function (diffs) {
        const diffFields = diffs.map(function (d) { return d.field; });

        console.log('%c --- DIAGNOSIS --- ', 'font-weight: bold; color: #ffaa00;');

        // RNG divergence is the strongest signal
        const rngDiffs = diffFields.filter(function (f) { return f.startsWith('rng_'); });
        if (rngDiffs.length > 0) {
            console.warn('RNG streams diverged: ' + rngDiffs.join(', '));
            console.warn('This means something called SeededRNG a different number of times.');

            rngDiffs.forEach(function (field) {
                const stream = field.replace('rng_', '');
                const rec = diffs.find(function (d) { return d.field === field; });
                const delta = rec.playback - rec.recorded;
                console.warn('  ' + stream + ': ' + (delta > 0 ? '+' : '') + delta + ' extra calls in playback');
            });

            if (rngDiffs.length === 1) {
                var stream = rngDiffs[0].replace('rng_', '');
                console.warn('Only the "' + stream + '" stream diverged. Look for non-deterministic code that uses SeededRNG.random(\'' + stream + '\').');
                if (stream === 'visual') {
                    console.warn('The "visual" stream is for cosmetic effects. If ONLY visual diverged, gameplay may still be in sync — consider excluding it from the hash.');
                }
                if (stream === 'effect') {
                    console.warn('The "effect" stream is used by combat (lightning, familiars, push angles). Check orbital/dropper/beam effect code.');
                }
                if (stream === 'enemy') {
                    console.warn('The "enemy" stream is used for spawning. Check EnemySystem spawn logic and timing.');
                }
            }
        }

        // Position divergence without RNG divergence = movement bug
        if ((diffFields.indexOf('px') !== -1 || diffFields.indexOf('py') !== -1) && rngDiffs.length === 0) {
            console.warn('Player position diverged but RNG is in sync. Likely a movement calculation issue (playerSpeed, input quantization, or physics interaction).');
        }

        // Entity count divergence
        if (diffFields.indexOf('enemies') !== -1) {
            console.warn('Enemy count diverged. Check if enemy spawning or destruction depends on non-deterministic timing.');
        }
        if (diffFields.indexOf('orbitals') !== -1 || diffFields.indexOf('drops') !== -1) {
            console.warn('Orbital/drop count diverged. A perk effect may be firing at render-rate instead of tick-rate.');
        }

        // Score/XP divergence (consequence of other issues)
        if (diffFields.indexOf('score') !== -1 || diffFields.indexOf('xp') !== -1) {
            if (rngDiffs.length > 0 || diffFields.indexOf('enemies') !== -1) {
                console.warn('Score/XP divergence is likely a consequence of the above issues.');
            } else {
                console.warn('Score/XP diverged without other obvious causes. Check damage calculations or XP award logic.');
            }
        }

        // Time divergence
        if (diffFields.indexOf('time') !== -1) {
            var timeDiff = diffs.find(function (d) { return d.field === 'time'; });
            console.warn('Elapsed time diverged (rec=' + timeDiff.recorded + ' vs play=' + timeDiff.playback + '). This affects enemy spawning, rank progression, and boss timing.');
        }
    },

    // Reset on game start
    reset: function () {
        this.desyncDetected = false;
        this.desyncTick = null;
        this.desyncCount = 0;
    }
};

window.DemoSync = DemoSync;