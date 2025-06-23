// merge-minify.js
// Script to merge all game files into a single index.html file and minify the result
// Enhanced with Farcade SDK integration - fixed score calculation
const fs = require('fs');
const path = require('path');

// Try to require Terser from global location
let minify;
try {
    minify = require('terser').minify;
} catch (err) {
    try {
        const { execSync } = require('child_process');
        const globalPath = execSync('npm root -g', { encoding: 'utf8' }).trim();
        const terserPath = path.join(globalPath, 'terser');
        minify = require(terserPath).minify;
        console.log('Found Terser in global npm directory');
    } catch (err2) {
        console.log('Terser not found, will use simple minification instead');
        minify = null;
    }
}

// Configuration
const config = {
    baseDir: '../',
    indexTemplate: 'index.html',
    outputFile: 'kajisuli.html',
    outputMinified: 'kajisuli.min.html',
    outputFarcade: 'kajisuli.min.farcade.html',
    minify: true,
    useAdvancedMinify: true,
    removeConsoleLog: false,
    terserOptions: {
        compress: {
            dead_code: true,
            drop_debugger: true,
            drop_console: false,
            conditionals: true,
            evaluate: true,
            unused: true,
            sequences: true
        },
        mangle: true,
        output: {
            comments: false
        }
    },
    jsFiles: [
        'startMenu.js',
        'artillery.js',
        'backgrounds.js',
        'ballistics.js',
        'beamLogic.js',
        'beamPerks.js',
        'bestiary.js',
        'canvasTexture.js',
        'cards.js',
        'challenge.js',
        'cooldown.js',
        'debug.js',
        'droppers.js',
        'enemy.js',
        'entrapments.js',
        'familiars.js',
        'hero.js',
        'input.js',
        'life.js',
        'menu.js',
        'music.js',
        'nexus.js',
        'onetime.js',
        'onhit.js',
        'orbitals.js',
        'pause.js',
        'perks.js',
        'playerhit.js',
        'score.js',
        'statdefs.js',
        'visuals.js',
        'weapons.js',
        'help.js',
    ],
    serviceWorkerFile: 'serviceworker.js',
};

function readFile(filePath) {
    try {
        return fs.readFileSync(path.join(config.baseDir, filePath), 'utf8');
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error.message);
        return '';
    }
}

function mergeJsFiles() {
    console.log('Merging JS files...');
    let mergedJs = '';
    config.jsFiles.forEach(file => {
        const content = readFile(file);
        if (content) {
            const fixedContent = content.replace(/music\//g, '../music/');
            mergedJs += `// ======= ${file} =======\n${fixedContent}\n\n`;
        }
    });
    return mergedJs;
}

function handleServiceWorkerForFarcade(mergedJs) {
    console.log('Handling service worker for Farcade deployment...');
    let modifiedJs = mergedJs;

    const serviceWorkerPattern = /(if\s*\(\s*['"`]serviceworker['"`]\s+in\s+navigator\s*\)\s*\{[\s\S]*?navigator\.serviceworker\.register\([^)]*\);[\s\S]*?\})/gi;

    modifiedJs = modifiedJs.replace(serviceWorkerPattern, (match) => {
        console.log('Found service worker registration, commenting out for Farcade');
        return `// Service worker disabled for Farcade single-file deployment
        // ${match.replace(/\n/g, '\n        // ')}`;
    });

    const specificPattern = /(\/\/ Set up a cache for music\s+if\s*\(\s*['"`]serviceworker['"`]\s+in\s+navigator\s*\)\s*\{[\s\S]*?\})/gi;

    modifiedJs = modifiedJs.replace(specificPattern, (match) => {
        console.log('Found specific music cache service worker, commenting out for Farcade');
        return `// Service worker for music cache disabled for Farcade single-file deployment
        // ${match.replace(/\n/g, '\n        // ')}`;
    });

    console.log('✓ Service worker registration disabled for Farcade deployment');

    // Hide the in-game music button since Farcade provides its own mute control
    modifiedJs = modifiedJs.replace(
        /(scene\.musicButton = scene\.add\.text\([\s\S]*?\)\.setOrigin\(0\.5\)\.setDepth\(UI\.depth\.ui\);)/,
        `$1
    
    // Hide music button on Farcade - platform provides its own mute control
    scene.musicButton.setVisible(false);
    console.log('Music button hidden for Farcade deployment');`
    );

    return modifiedJs;
}

// Clean injectFarcadeIntegrations function with exact pattern matching
function injectFarcadeIntegrations(htmlTemplate, mergedJs) {
    console.log('Injecting Farcade SDK integrations...');

    let modifiedJs = mergedJs;
    let modifiedHtml = htmlTemplate;

    // First, handle service worker for Farcade deployment
    modifiedJs = handleServiceWorkerForFarcade(modifiedJs);

    // 1. INJECT READY() CALL IN HTML TEMPLATE
    let createPatternFound = false;

    const buildGamePattern = /(function create\(\) \{[\s\S]*?buildGame\.call\(this\);)/;
    const buildGameMatch = modifiedHtml.match(buildGamePattern);

    if (buildGameMatch) {
        const originalFunction = buildGameMatch[0];
        const modifiedFunction = originalFunction + `
            
            // Farcade SDK: Signal that game is ready
            if (window.FarcadeSDK) {
                window.FarcadeSDK.singlePlayer.actions.ready();
                console.log('Farcade SDK: Game ready signal sent');
            }`;

        modifiedHtml = modifiedHtml.replace(originalFunction, modifiedFunction);
        console.log('✓ Injected Farcade ready() call in HTML create function');
        createPatternFound = true;
    }

    if (!createPatternFound) {
        console.warn('Could not find create() function in HTML template to inject ready() call');
    }

    // 2. MODIFY CREATERESTARTBUTTON TO SKIP IN FARCADE MODE
    const createRestartButtonPattern = /(createRestartButton: function \(scene\) \{)/;
    const createRestartButtonMatch = modifiedJs.match(createRestartButtonPattern);

    if (createRestartButtonMatch) {
        const originalFunction = createRestartButtonMatch[0];
        const modifiedFunction = originalFunction + `
        // Farcade SDK: Skip creating restart button in Farcade mode
        if (typeof FARCADE_MODE !== 'undefined' && FARCADE_MODE) {
            console.log('Farcade: Skipping restart button creation in Farcade mode');
            return;
        }`;

        modifiedJs = modifiedJs.replace(originalFunction, modifiedFunction);
        console.log('✓ Modified createRestartButton to skip in Farcade mode');
    } else {
        console.warn('Could not find createRestartButton function to modify');
    }

    // 3. INJECT FARCADE GAME OVER CALL AFTER SHOWFINALSCORE IN ONCOMPLETE
    const onCompletePattern = /(onComplete: \(\) => \{[\s\S]*?this\.showFinalScore\(scene, textObject, finalScore\);[\s\S]*?\})/;
    const onCompleteMatch = modifiedJs.match(onCompletePattern);

    if (onCompleteMatch) {
        const originalCallback = onCompleteMatch[0];
        const modifiedCallback = originalCallback.replace(
            /(this\.showFinalScore\(scene, textObject, finalScore\);)/,
            `$1

                // Farcade SDK: Send game over with final score after animation completes
                if (typeof FARCADE_MODE !== 'undefined' && FARCADE_MODE && window.FarcadeSDK) {
                    console.log('Farcade SDK: Sending game over with final score:', finalScore);
                    window.FarcadeSDK.singlePlayer.actions.gameOver({ score: finalScore });
                }`
        );

        modifiedJs = modifiedJs.replace(originalCallback, modifiedCallback);
        console.log('✓ Injected Farcade gameOver() call in animateScoreCounter completion');
    } else {
        console.warn('Could not find onComplete callback to inject Farcade gameOver() call');
    }

    // 4. INJECT FARCADE GAME OVER CALL IN SHOWFINALSCORE FOR SKIP FUNCTIONALITY
    const showFinalScorePattern = /(showFinalScore: function \(scene, textObject, finalScore\) \{[\s\S]*?yoyo: true[\s\S]*?\}\);[\s\S]*?\})/;
    const showFinalScoreMatch = modifiedJs.match(showFinalScorePattern);

    if (showFinalScoreMatch) {
        const originalFunction = showFinalScoreMatch[0];
        const modifiedFunction = originalFunction.replace(
            /(yoyo: true[\s\S]*?\}\);)/,
            `$1

        // Farcade SDK: Also send game over when score is shown immediately (skip case)
        if (typeof FARCADE_MODE !== 'undefined' && FARCADE_MODE && window.FarcadeSDK) {
            console.log('Farcade SDK: Sending game over with final score (skip):', finalScore);
            window.FarcadeSDK.singlePlayer.actions.gameOver({ score: finalScore });
        }`
        );

        modifiedJs = modifiedJs.replace(originalFunction, modifiedFunction);
        console.log('✓ Injected Farcade gameOver() call in showFinalScore for skip functionality');
    } else {
        console.warn('Could not find showFinalScore function to inject gameOver() call');
    }

    // 5. INJECT PLAY_AGAIN AND MUTE EVENT HANDLERS
    const windowGamePattern = /(window\.game = new Phaser\.Game\(config\);)/;
    const windowGameMatch = modifiedJs.match(windowGamePattern);

    if (windowGameMatch) {
        const originalCreate = windowGameMatch[0];
        const modifiedCreate = originalCreate + `

        // Farcade SDK: Handle play again requests
        if (window.FarcadeSDK) {
            window.FarcadeSDK.on('play_again', () => {
                console.log('Farcade SDK: Play again requested');
                const activeScene = game.scene.scenes[0];
                if (activeScene && typeof startGame === 'function') {
                    startGame.call(activeScene);
                } else {
                    console.warn('Could not restart game: no active scene or startGame function');
                }
            });
            console.log('Farcade SDK: Play again handler registered');
            
            // Farcade SDK: Handle mute toggle requests
            window.FarcadeSDK.on('toggle_mute', (data) => {
                console.log('Farcade SDK: Mute toggle requested, isMuted:', data.isMuted);
                if (window.MusicSystem) {
                    MusicSystem.setMusicEnabled(!data.isMuted);
                    
                    // Also update the in-game music button to match Farcade's state
                    const activeScene = game.scene.scenes[0];
                    if (activeScene && activeScene.musicButton) {
                        const musicConfig = UI.buttons.music;
                        const symbol = data.isMuted ? musicConfig.mutedSymbol : musicConfig.symbol;
                        activeScene.musicButton.setText(symbol);
                    }
                    
                    console.log('Music system updated, enabled:', !data.isMuted);
                } else {
                    console.warn('MusicSystem not available for mute toggle');
                }
            });
            console.log('Farcade SDK: Mute toggle handler registered');
        }`;

        modifiedJs = modifiedJs.replace(originalCreate, modifiedCreate);
        console.log('✓ Injected Farcade event handlers in merged JS');
    } else {
        console.warn('Could not find window.game = new Phaser.Game(config) to inject event handlers');
    }

    console.log('=== CLEAN FARCADE INTEGRATION COMPLETE ===\n');

    return { modifiedHtml, modifiedJs };
}

function injectFarcadeSDK(html) {
    console.log('Injecting Farcade SDK script tag...');

    const headPattern = /(<head>[\s\S]*?)(<script)/;
    const headMatch = html.match(headPattern);

    if (headMatch) {
        const beforeScripts = headMatch[1];
        const firstScript = headMatch[2];

        const farcadeScript = `    <script src="https://cdn.jsdelivr.net/npm/@farcade/game-sdk@latest/dist/index.min.js"></script>\n\n    `;

        const modifiedHead = beforeScripts + farcadeScript + firstScript;
        const modifiedHtml = html.replace(headPattern, modifiedHead);

        console.log('✓ Injected Farcade SDK script tag in head');
        return modifiedHtml;
    } else {
        console.warn('Could not find head section to inject Farcade SDK');
        return html;
    }
}

async function advancedMinify(code) {
    if (!config.minify || !config.useAdvancedMinify || !minify) {
        return simpleMinify(code);
    }

    console.log('Using Terser for advanced minification...');
    try {
        const result = await minify(code, config.terserOptions);
        console.log(`Advanced minification complete. Size reduction: ${Math.round((1 - result.code.length / code.length) * 100)}%`);
        return result.code;
    } catch (error) {
        console.error('Error during advanced minification, falling back to simple:', error.message);
        return simpleMinify(code);
    }
}

function simpleMinify(code) {
    if (!config.minify) {
        return code;
    }

    console.log('Using simple minification...');
    let minified = code;

    minified = minified.replace(/(?<!:)\/\/(?![\/\s]*@).*$/gm, '');
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');

    if (config.removeConsoleLog) {
        minified = minified.replace(/console\.log\s*\([^)]*\)\s*;?/g, '');
    }

    minified = minified.replace(/\s+/g, ' ');
    minified = minified.replace(/\s*;\s*/g, ';');
    minified = minified.replace(/\s*\{\s*/g, '{');
    minified = minified.replace(/\s*\}\s*/g, '}');
    minified = minified.replace(/\s*,\s*/g, ',');
    minified = minified.replace(/\s*\(\s*/g, '(');
    minified = minified.replace(/\s*\)\s*/g, ')');
    minified = minified.trim();

    const reduction = Math.round((1 - minified.length / code.length) * 100);
    console.log(`Simple minification complete. Size reduction: ${reduction}%`);

    return minified;
}

function injectScript(html, script) {
    const scriptPattern = new RegExp(`<script src=["'](?:./|/)?(${config.jsFiles.join('|')})["'].*?>\\s*</script>`, 'i');
    const match = html.match(scriptPattern);

    if (match) {
        console.log(`Injecting at location of script: ${match[1]}`);
        return html.replace(match[0], `<script>\n${script}\n</script>`);
    } else {
        console.log('No specific script tag found, injecting before </body>');
        return html.replace('</body>', `<script>\n${script}\n</script>\n</body>`);
    }
}

function removeRemainingScripts(html) {
    const scriptPattern = new RegExp(`\\s*<script src=["'](?:./|/)?(${config.jsFiles.join('|')})["'].*?>\\s*</script>\\s*`, 'gi');
    return html.replace(scriptPattern, '');
}

async function mergeFiles() {
    console.log('Starting merge process...');

    let htmlTemplate = readFile(config.indexTemplate);
    if (!htmlTemplate) {
        console.error('Could not read HTML template. Aborting.');
        return;
    }

    htmlTemplate = htmlTemplate.replace(/const KAJISULI_MODE = [^;]+;/g, 'const KAJISULI_MODE = true;');
    console.log('Set KAJISULI_MODE to true');

    htmlTemplate = htmlTemplate.replace(/const DEBUG_MODE = [^;]+;/g, 'const DEBUG_MODE = false;');
    console.log('Set DEBUG_MODE to false');

    htmlTemplate = htmlTemplate.replace(/const FARCADE_MODE = [^;]+;/g, 'const FARCADE_MODE = true;');
    console.log('Set FARCADE_MODE to true');

    const mergedJs = mergeJsFiles();

    let mergedHtml = injectScript(htmlTemplate, mergedJs);
    mergedHtml = removeRemainingScripts(mergedHtml);

    try {
        fs.writeFileSync(config.outputFile, mergedHtml);
        console.log(`Successfully created merged file: ${config.outputFile}`);
    } catch (error) {
        console.error('Error writing merged file:', error.message);
    }

    if (config.minify) {
        const minifiedJs = await advancedMinify(mergedJs);

        let minifiedHtml = injectScript(htmlTemplate, minifiedJs);
        minifiedHtml = removeRemainingScripts(minifiedHtml);

        try {
            fs.writeFileSync(config.outputMinified, minifiedHtml);
            console.log(`Successfully created minified file: ${config.outputMinified}`);
        } catch (error) {
            console.error('Error writing minified file:', error.message);
        }

        // NEW: Create Farcade version with SDK integrations
        console.log('\n=== Creating Farcade SDK Version ===');

        // Apply Farcade integrations to BOTH HTML template and merged JS (before minification)
        const { modifiedHtml: farcadeHtml, modifiedJs: farcadeJs } = injectFarcadeIntegrations(htmlTemplate, mergedJs);

        // Now minify the Farcade-integrated JS
        const minifiedFarcadeJs = await advancedMinify(farcadeJs);

        // Inject minified Farcade JS into the modified HTML
        let finalFarcadeHtml = injectScript(farcadeHtml, minifiedFarcadeJs);
        finalFarcadeHtml = removeRemainingScripts(finalFarcadeHtml);

        // Inject Farcade SDK script tag
        finalFarcadeHtml = injectFarcadeSDK(finalFarcadeHtml);

        try {
            fs.writeFileSync(config.outputFarcade, finalFarcadeHtml);
            console.log(`Successfully created Farcade version: ${config.outputFarcade}`);
            console.log('✓ Farcade SDK integration complete!');
        } catch (error) {
            console.error('Error writing Farcade file:', error.message);
        }
    }
}

mergeFiles();