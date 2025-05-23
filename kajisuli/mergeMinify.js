// merge-minify.js
// Script to merge all game files into a single index.html file and minify the result
const fs = require('fs');
const path = require('path');

// Try to require Terser from global location
let minify;
try {
    // First try normal require
    minify = require('terser').minify;
} catch (err) {
    try {
        // If that fails, try finding it in the global npm directory
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

// Configuration (customize these paths as needed)
const config = {
    // Base directory where your files are stored (one level up from this script)
    baseDir: '../',

    // The main HTML template file
    indexTemplate: 'index.html',

    // Output files (will be created in the same folder as this script)
    outputFile: 'kajisuli.html',
    outputMinified: '../kajisuli.min.html',

    // Minification options
    minify: true,
    useAdvancedMinify: true, // Set to false to force simple minification
    removeConsoleLog: false, // Set to true to remove console.log statements

    // Terser options (used if Terser is available)
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

    // List of JS files (alphabetically ordered for easy checking)
    jsFiles: [
        'artillery.js',
        'backgrounds.js',
        'ballistics.js',
        'bestiary.js',
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
        'visuals.js',
        'weapons.js'
    ],

    // No external dependencies needed for simple minification
};

// Function to read file contents
function readFile(filePath) {
    try {
        return fs.readFileSync(path.join(config.baseDir, filePath), 'utf8');
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error.message);
        return '';
    }
}

// Function to merge JS files into a single script block
function mergeJsFiles() {
    console.log('Merging JS files...');

    let mergedJs = '';

    // Read each file and append its content
    config.jsFiles.forEach(file => {
        const content = readFile(file);
        if (content) {
            // Fix relative paths to music files for build subfolder
            const fixedContent = content.replace(/music\//g, '../music/');
            mergedJs += `// ======= ${file} =======\n${fixedContent}\n\n`;
        }
    });

    return mergedJs;
}

// Advanced minification using Terser (if available)
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

// Simple minification using regex (fallback)
function simpleMinify(code) {
    if (!config.minify) {
        return code;
    }

    console.log('Using simple minification...');

    let minified = code;

    // Remove single-line comments (but preserve URLs and regex patterns)
    minified = minified.replace(/(?<!:)\/\/(?![\/\s]*@).*$/gm, '');

    // Remove multi-line comments (/* ... */)
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove console.log statements if requested
    if (config.removeConsoleLog) {
        minified = minified.replace(/console\.log\s*\([^)]*\)\s*;?/g, '');
    }

    // Remove extra whitespace and newlines
    minified = minified.replace(/\s+/g, ' '); // Multiple spaces to single space
    minified = minified.replace(/\s*;\s*/g, ';'); // Clean up semicolons
    minified = minified.replace(/\s*\{\s*/g, '{'); // Clean up opening braces
    minified = minified.replace(/\s*\}\s*/g, '}'); // Clean up closing braces
    minified = minified.replace(/\s*,\s*/g, ','); // Clean up commas
    minified = minified.replace(/\s*\(\s*/g, '('); // Clean up opening parentheses
    minified = minified.replace(/\s*\)\s*/g, ')'); // Clean up closing parentheses

    // Remove leading/trailing whitespace
    minified = minified.trim();

    const reduction = Math.round((1 - minified.length / code.length) * 100);
    console.log(`Simple minification complete. Size reduction: ${reduction}%`);

    return minified;
}

// Function to inject script into the HTML template
function injectScript(html, script) {
    // Find where to inject the script - look for the first script tag that loads a game file
    // or if no match is found, insert before the closing body tag

    // Look for any external script tags loading JS files from our list
    const scriptPattern = new RegExp(`<script src=["'](?:./|/)?(${config.jsFiles.join('|')})["'].*?>\\s*</script>`, 'i');
    const match = html.match(scriptPattern);

    if (match) {
        // Replace the first script tag with our merged content
        console.log(`Injecting at location of script: ${match[1]}`);
        return html.replace(match[0], `<script>\n${script}\n</script>`);
    } else {
        // If no specific script tag is found, insert before closing body
        console.log('No specific script tag found, injecting before </body>');
        return html.replace('</body>', `<script>\n${script}\n</script>\n</body>`);
    }
}

// Function to clean up remaining script tags
function removeRemainingScripts(html) {
    // Create a pattern to match any remaining script tags that load our JS files
    const scriptPattern = new RegExp(`\\s*<script src=["'](?:./|/)?(${config.jsFiles.join('|')})["'].*?>\\s*</script>\\s*`, 'gi');
    return html.replace(scriptPattern, '');
}

// Main function to merge all files
async function mergeFiles() {
    console.log('Starting merge process...');

    // Read the HTML template
    let htmlTemplate = readFile(config.indexTemplate);
    if (!htmlTemplate) {
        console.error('Could not read HTML template. Aborting.');
        return;
    }

    // Set KAJISULI_MODE to true in the template
    htmlTemplate = htmlTemplate.replace(/const KAJISULI_MODE = [^;]+;/g, 'const KAJISULI_MODE = true;');
    console.log('Set KAJISULI_MODE to true');

    // Merge all JS files
    const mergedJs = mergeJsFiles();

    // Inject merged JS into HTML (unminified version)
    let mergedHtml = injectScript(htmlTemplate, mergedJs);
    mergedHtml = removeRemainingScripts(mergedHtml);

    // Write the unminified merged file
    try {
        fs.writeFileSync(config.outputFile, mergedHtml);
        console.log(`Successfully created merged file: ${config.outputFile}`);
    } catch (error) {
        console.error('Error writing merged file:', error.message);
    }

    // Create minified version if requested
    if (config.minify) {
        // Try advanced minification first, fall back to simple if needed
        const minifiedJs = await advancedMinify(mergedJs);

        // Inject minified JS into HTML
        let minifiedHtml = injectScript(htmlTemplate, minifiedJs);
        minifiedHtml = removeRemainingScripts(minifiedHtml);

        // Write the minified merged file
        try {
            fs.writeFileSync(config.outputMinified, minifiedHtml);
            console.log(`Successfully created minified file: ${config.outputMinified}`);
        } catch (error) {
            console.error('Error writing minified file:', error.message);
        }
    }
}

// Execute the merge
mergeFiles();