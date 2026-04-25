// leaderboard.js
// Handles leaderboard on web

(function () {

    const API = 'https://api.loiyaa.com';
    const GAME = 'kajisu';

    // ─────────────────────────────────────────────
    // Session token — fetched once on page load
    // ─────────────────────────────────────────────
    let sessionToken = null;
    let sessionExpiresAt = null;

    async function startSession() {
        if (location.hostname === '127.0.0.1' || location.hostname === 'localhost') return;
        try {
            const res = await fetch(`${API}/token?game=${GAME}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            sessionToken = data.token;
            sessionExpiresAt = data.expires_at;
            console.log('[Leaderboard] Session started.');
        } catch (err) {
            console.warn('[Leaderboard] Could not start session:', err.message);
        }
    }

    async function submitScore(player, score) {
        if (!sessionToken) {
            console.warn('[Leaderboard] No session token.');
            return null;
        }
        if (sessionExpiresAt && Math.floor(Date.now() / 1000) > sessionExpiresAt) {
            console.warn('[Leaderboard] Session expired.');
            return null;
        }
        try {
            const res = await fetch(`${API}/scores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: sessionToken, player, score, game: GAME })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            sessionToken = null; // consumed
            return data;         // { ok: true, rank: N }
        } catch (err) {
            console.warn('[Leaderboard] Submission failed:', err.message);
            return null;
        }
    }

    // ─────────────────────────────────────────────
    // Name-entry + result overlay (DOM-based)
    // Appears over the Phaser canvas after score animation
    // ─────────────────────────────────────────────
    function injectStyles() {
        if (document.getElementById('lb-styles')) return;
        const style = document.createElement('style');
        style.id = 'lb-styles';
        style.textContent = `
        #lb-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          background: rgba(0, 0, 0, 0.72);
          font-family: 'Arial', sans-serif;
          animation: lb-fadein 0.4s ease;
        }
        @keyframes lb-fadein {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        #lb-box {
          background: #1c1b19;
          border: 2px solid #FFD700;
          border-radius: 12px;
          padding: 2.2rem 2.8rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.1rem;
          min-width: 280px;
          max-width: 380px;
          text-align: center;
        }
        #lb-title {
          font-size: 0.7rem;
          letter-spacing: 0.25em;
          color: #7a7060;
          text-transform: uppercase;
        }
        #lb-score-display {
          font-size: 2rem;
          font-weight: bold;
          color: #FFD700;
          letter-spacing: 0.05em;
        }
        #lb-input {
          width: 100%;
          padding: 0.6rem 0.9rem;
          background: #2a2720;
          border: 1px solid #7a6400;
          border-radius: 7px;
          color: #e8ddb8;
          font-size: 1rem;
          text-align: center;
          outline: none;
          transition: border-color 0.2s;
        }
        #lb-input:focus { border-color: #FFD700; }
        #lb-input::placeholder { color: #7a7060; }
        #lb-submit {
          width: 100%;
          padding: 0.65rem 1rem;
          background: #FFD700;
          color: #111;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          border: none;
          border-radius: 7px;
          cursor: pointer;
          transition: background 0.15s;
        }
        #lb-submit:hover { background: #ffe033; }
        #lb-submit:disabled {
          background: #7a6400;
          color: #2a2720;
          cursor: default;
        }
        #lb-skip {
          background: none;
          border: none;
          color: #7a7060;
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.2s;
        }
        #lb-skip:hover { color: #e8ddb8; }
        #lb-result {
          font-size: 1rem;
          color: #e8ddb8;
          letter-spacing: 0.05em;
          min-height: 1.4em;
        }
        #lb-result.error { color: #ff6b6b; }
      `;
        document.head.appendChild(style);
    }

    function showSubmitOverlay(finalScore) {
        injectStyles();

        // Remove any existing overlay
        const existing = document.getElementById('lb-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'lb-overlay';
        overlay.innerHTML = `
        <div id="lb-box">
          <div id="lb-title">Submit your score</div>
          <div id="lb-score-display">${finalScore}</div>
          <input id="lb-input" type="text" maxlength="18"
                 placeholder="Your name" autocomplete="off" spellcheck="false"/>
          <button id="lb-submit">SUBMIT</button>
          <div id="lb-result"></div>
          <button id="lb-skip">Skip</button>
        </div>
      `;
        document.body.appendChild(overlay);

        const input = overlay.querySelector('#lb-input');
        const submit = overlay.querySelector('#lb-submit');
        const result = overlay.querySelector('#lb-result');
        const skip = overlay.querySelector('#lb-skip');

        // Disable Phaser's keyboard capture while typing so movement keys
        // (Z, Q, S, D on AZERTY / W, A, S, D on QWERTY) reach the input field.
        input.addEventListener('focus', () => {
            if (window.InputSystem?.disableForTextInput) window.InputSystem.disableForTextInput();
        });
        input.addEventListener('blur', () => {
            if (window.InputSystem?.enableAfterTextInput) window.InputSystem.enableAfterTextInput();
        });

        input.focus();

        // Strip any non-alphanumeric characters as the player types
        input.addEventListener('input', () => {
            const clean = input.value.replace(/[^a-zA-Z0-9]/g, '');
            if (input.value !== clean) input.value = clean;
        });

        // Submit on Enter key
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') submit.click();
        });

        const closeOverlay = () => {
            if (window.InputSystem?.enableAfterTextInput) window.InputSystem.enableAfterTextInput();
            overlay.remove();
        };

        submit.addEventListener('click', async () => {
            const name = input.value.trim();
            if (!name) {
                input.focus();
                return;
            }
            submit.disabled = true;
            skip.style.display = 'none';
            result.textContent = 'Submitting...';
            result.className = '';

            const response = await submitScore(name, finalScore);

            if (response && response.ok) {
                result.textContent = `You ranked #${response.rank}!`;
                submit.textContent = 'CLOSE';
                submit.disabled = false;
                submit.addEventListener('click', closeOverlay, { once: true });
            } else {
                result.textContent = 'Submission failed. Try again?';
                result.className = 'error';
                submit.textContent = 'RETRY';
                submit.disabled = false;
            }
        });

        skip.addEventListener('click', closeOverlay);
    }

    // ─────────────────────────────────────────────
    // Hook into ScoreSystem.showFinalScore
    // This is the single convergence point for both
    // victory and defeat score animations.
    // ─────────────────────────────────────────────
    function hookScoreSystem() {
        if (!window.ScoreSystem) {
            // ScoreSystem not ready yet — retry shortly
            setTimeout(hookScoreSystem, 100);
            return;
        }

        const originalShowFinalScore = window.ScoreSystem.showFinalScore.bind(window.ScoreSystem);

        window.ScoreSystem.showFinalScore = function (scene, textObject, finalScore, isFinalStage = true) {
            // Call the original function unchanged
            originalShowFinalScore(scene, textObject, finalScore, isFinalStage);

            // Only trigger submission UI on the final stage
            // (victory has two stages; we want the second one)
            if (isFinalStage && sessionToken) {
                // Small delay so the score animation settles before the overlay appears
                setTimeout(() => showSubmitOverlay(finalScore), 1200);
            }
        };

        console.log('[Leaderboard] ScoreSystem hooked.');
    }

    // ─────────────────────────────────────────────
    // Init
    // ─────────────────────────────────────────────
    startSession();
    hookScoreSystem();

})();