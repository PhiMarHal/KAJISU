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

    // --- Per-tick RNG draw tracking (earliest-possible desync detection) ---
    // Snapshots every 60 ticks only catch a desync once it has propagated into player
    // stats or entity counts. The per-tick RNG trace catches the tick a divergence is
    // BORN: if a stream consumed a different number of values on tick T, the offending
    // call site ran during tick T.
    RNG_TRACE_ENABLED: true, // Set false to omit the per-tick trace from recorded demos
    MAX_RNG_REPORTS: 10,     // Cap console output once divergences start cascading
    rngDesyncTick: null,
    rngDesyncCount: 0,

    // Single-letter stream codes keep the recorded trace compact in localStorage.
    RNG_STREAM_CODES: {
        enemy: 'e',
        perk: 'p',
        drop: 'd',
        effect: 'f',
        visual: 'v',
        drawing: 'w'
    },

    // Internal per-tick tracking state (cleared by reset())
    _prevCounters: null,
    _traceIndex: 0,
    _rngReports: 0,
    _traceWarned: false,

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
        // Pushable states hash in as an id:pos string so any drift triggers mismatch.
        const pushHash = snap.pushables
            ? snap.pushables.map(function (p) { return p.id + ':' + p.x + ',' + p.y; }).join('|')
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
    // damageSourceId comes from DamageSourceRegistry (a deterministic counter), so the
    // same ball carries the same id across record and playback — the drift readout can
    // therefore pair balls by id and report exact per-ball deltas (see reportPushableDrift).
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

    // Per-tick RNG draw tracking.
    // Runs every tick, before the snapshot interval gate. During recording it stores
    // how many values each stream consumed on each tick; during playback it recomputes
    // the same deltas and compares. A mismatch pins the divergence to an exact tick AND
    // an exact stream, which is usually one call site away from the real bug.
    //
    // Deltas are measured between consecutive checkTick calls, so the tracking is
    // self-consistent no matter where in simulateTick checkTick is invoked — as long as
    // it is invoked at the same point every tick.
    trackRngDeltas: function (tick) {
        if (!this.RNG_TRACE_ENABLED) return;
        if (typeof SeededRNG === 'undefined') return;

        const counters = SeededRNG.getCounters();

        // First tracked tick establishes a baseline; no delta to emit yet.
        if (!this._prevCounters) {
            this._prevCounters = counters;
            return;
        }

        const sig = this.encodeDeltas(this._prevCounters, counters);
        this._prevCounters = counters;

        if (DemoSystem.isRecording) {
            // Ticks with no draws are omitted entirely — this keeps the trace small
            // enough for localStorage (typically a few hundred KB for a long run).
            if (sig === '') return;
            if (!DemoSystem.recording.rngTrace) {
                DemoSystem.recording.rngTrace = [];
            }
            DemoSystem.recording.rngTrace.push([tick, sig]);
            return;
        }

        if (!DemoSystem.isPlaying) return;

        const demo = DemoSystem.playback.demo;
        if (!demo) return;

        if (!demo.rngTrace) {
            if (!this._traceWarned) {
                this._traceWarned = true;
                console.log('DemoSync: demo has no rngTrace (recorded before per-tick RNG tracking existed) — per-tick RNG checks skipped.');
            }
            return;
        }

        // Walk the recorded trace in order. Entries are sparse: an absent tick means
        // "expected zero draws", so a playback draw on a silent tick is caught too.
        const trace = demo.rngTrace;
        let recSig = '';
        while (this._traceIndex < trace.length && trace[this._traceIndex][0] < tick) {
            // Defensive: recorded draws on a tick already passed (should not happen).
            this._traceIndex++;
        }
        if (this._traceIndex < trace.length && trace[this._traceIndex][0] === tick) {
            recSig = trace[this._traceIndex][1];
            this._traceIndex++;
        }

        if (sig !== recSig) {
            this.reportRngDivergence(tick, recSig, sig);
        }
    },

    // Encode per-stream deltas as a compact signature, e.g. "e2f1" = 2 enemy draws and
    // 1 effect draw this tick. Streams with no draws are omitted; a silent tick -> ''.
    encodeDeltas: function (prev, curr) {
        const codes = this.RNG_STREAM_CODES;
        let sig = '';
        // Key order on a fixed object literal is insertion order — stable across runs.
        Object.keys(codes).forEach(function (stream) {
            const delta = (curr[stream] ?? 0) - (prev[stream] ?? 0);
            if (delta !== 0) sig += codes[stream] + delta;
        });
        return sig;
    },

    // Decode a signature back into {streamName: count} for readable diffs.
    decodeSig: function (sig) {
        const out = {};
        if (!sig) return out;

        const codes = this.RNG_STREAM_CODES;
        const byCode = {};
        Object.keys(codes).forEach(function (s) { byCode[codes[s]] = s; });

        const re = /([a-z])(-?\d+)/g;
        let m;
        while ((m = re.exec(sig)) !== null) {
            const stream = byCode[m[1]] ?? m[1];
            out[stream] = parseInt(m[2], 10);
        }
        return out;
    },

    // Report a per-tick RNG divergence: the exact tick and the exact streams that drew
    // a different number of values than when recorded.
    reportRngDivergence: function (tick, recSig, playSig) {
        this.rngDesyncCount++;
        if (this.rngDesyncTick === null) {
            this.rngDesyncTick = tick;
        }

        if (this._rngReports >= this.MAX_RNG_REPORTS) return;
        this._rngReports++;

        const timeStr = (tick / 60).toFixed(1);
        const rec = this.decodeSig(recSig);
        const play = this.decodeSig(playSig);

        const streams = Object.keys(rec).concat(Object.keys(play))
            .filter(function (s, i, arr) { return arr.indexOf(s) === i; })
            .sort();

        const parts = [];
        streams.forEach(function (s) {
            const r = rec[s] ?? 0;
            const p = play[s] ?? 0;
            if (r !== p) parts.push(`${s}: recorded ${r}, playback ${p}`);
        });
        if (parts.length === 0) {
            parts.push(`raw: recorded "${recSig}", playback "${playSig}"`);
        }

        const isFirst = this.rngDesyncCount === 1;
        if (isFirst) {
            console.warn(
                `%c RNG DIVERGENCE at tick ${tick} (~${timeStr}s) `,
                'background:#a00;color:#fff;padding:2px;'
            );
            console.warn(`  ${parts.join(' | ')}`);
            console.log(`  Earliest detectable divergence: on tick ${tick} these streams consumed a different number of random values than when recorded. The responsible call site ran during this tick — inspect systems drawing from these streams.`);
        } else {
            console.warn(`[rng #${this.rngDesyncCount}] tick ${tick} (~${timeStr}s) — ${parts.join(' | ')}`);
        }

        if (this._rngReports === this.MAX_RNG_REPORTS) {
            console.log(`  (further per-tick RNG divergences suppressed; first was tick ${this.rngDesyncTick})`);
        }
    },

    // Called every tick from simulateTick
    checkTick: function (tick) {
        if (!this.enabled) return;
        if (tick === 0) return; // Skip tick 0

        // Per-tick RNG delta check runs EVERY tick, before the snapshot interval gate.
        // This is the earliest divergence signal available.
        this.trackRngDeltas(tick);

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

        // Pushable drift readout — pairs balls by deterministic id and reports
        // per-ball position/velocity deltas (see reportPushableDrift).
        this.reportPushableDrift(rec.pushables, play.pushables);
    },

    // Emit a focused drift line for pushable positions/counts.
    // IDs are deterministic (DamageSourceRegistry counter), so the same ball carries
    // the same id across record and playback. We pair by id and report each ball's
    // exact delta, plus any ball present on only one side.
    reportPushableDrift: function (recPushables, playPushables) {
        const rec = recPushables || [];
        const play = playPushables || [];

        if (rec.length === 0 && play.length === 0) return;

        // Count mismatch is the strongest single signal.
        if (rec.length !== play.length) {
            console.warn(
                `  pushable count diverged: record=${rec.length}, playback=${play.length}`
            );
        }

        // Index each side by id for direct pairing.
        const recById = {};
        rec.forEach(function (p) { recById[p.id] = p; });
        const playById = {};
        play.forEach(function (p) { playById[p.id] = p; });

        // Union of all ids, sorted for stable readout order.
        const allIds = Object.keys(recById)
            .concat(Object.keys(playById))
            .filter(function (id, i, arr) { return arr.indexOf(id) === i; })
            .sort();

        allIds.forEach(function (id) {
            const r = recById[id];
            const p = playById[id];

            if (r && !p) {
                console.warn(`  ${id}: present in record only @ (${r.x},${r.y})`);
                return;
            }
            if (p && !r) {
                console.warn(`  ${id}: present in playback only @ (${p.x},${p.y})`);
                return;
            }

            // Both sides have this ball — report any drift in position or velocity.
            if (r.x !== p.x || r.y !== p.y || r.vx !== p.vx || r.vy !== p.vy) {
                const dx = (p.x - r.x).toFixed(2);
                const dy = (p.y - r.y).toFixed(2);
                const dvx = (p.vx - r.vx).toFixed(2);
                const dvy = (p.vy - r.vy).toFixed(2);
                console.warn(
                    `  ${id}: Δpos=(${dx},${dy}) Δvel=(${dvx},${dvy})  ` +
                    `rec=(${r.x},${r.y}) play=(${p.x},${p.y})`
                );
            }
        });
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

        // If the per-tick RNG trace already flagged a divergence, that tick is a far
        // better starting point: the snapshot shows the consequence, the RNG trace
        // caught the cause.
        if (this.rngDesyncTick !== null && this.rngDesyncTick < tick) {
            console.log(`NOTE: per-tick RNG divergence was first detected at tick ${this.rngDesyncTick} (~${(this.rngDesyncTick / 60).toFixed(1)}s) — investigate there first, not here.`);
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

        if (this.rngDesyncTick !== null) {
            console.log(`Per-tick RNG trace flagged tick ${this.rngDesyncTick} as the first divergence (${this.rngDesyncCount} divergent ticks so far). That tick localises the bug far better than the counter totals below.`);
        } else if (this.RNG_TRACE_ENABLED) {
            console.log('Per-tick RNG trace found no divergence, so every stream drew the same number of values on every tick. The cause is therefore NOT a differing random draw — look at non-RNG state instead (motion integration, collision order, floating-point drift).');
        }

        const pushablesDiverged =
            this.hashPushables(rec.pushables) !== this.hashPushables(play.pushables);
        if (pushablesDiverged) {
            console.log('Pushable positions diverged. Likely causes: non-deterministic motion integration, or non-deterministic collision timing/order (e.g. a collision pair still routed through Phaser physics rather than the manual AABB path).');
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

    // Helper for diagnosis: hash just the pushable list.
    // Includes id so the hash is tied to ball identity, not just the set of positions.
    hashPushables: function (list) {
        if (!list) return '';
        return list.map(function (p) { return p.id + ':' + p.x + ',' + p.y; }).join('|');
    },

    // Reset state on new game
    reset: function () {
        this.desyncDetected = false;
        this.desyncTick = null;
        this.desyncCount = 0;

        // Per-tick RNG trace state
        this.rngDesyncTick = null;
        this.rngDesyncCount = 0;
        this._prevCounters = null;
        this._traceIndex = 0;
        this._rngReports = 0;
        this._traceWarned = false;
    }
};

window.DemoSync = DemoSync;