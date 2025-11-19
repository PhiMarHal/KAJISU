// bestiary.js - Enemy Configuration
// Defines which kanji from the dictionary are used as enemies and their gameplay properties
// Requires: dictionary.js

// Get current difficulty level (1-4)
function getCurrentDifficulty() {
    return window.DIFFICULTY_LEVEL ?? 2; // Default to difficulty 2
}

// Calculate speed ranges based on difficulty
function getDifficultySpeedRange(difficulty) {
    const speedMin = 10 + (difficulty * 10);
    const speedMax = speedMin + (difficulty * 10) + 10;
    return { speedMin, speedMax };
}

// Get difficulty-based boss configuration
function getDifficultyBossConfig(difficulty) {
    return {
        max_rank: 4,
        health_multiplier: Math.pow(2, difficulty - 1), // 1, 2, 4, 8
        speed: 20 + (difficulty * 20) // 40, 60, 80, 100
    };
}

// Rank-based defaults for enemies
const ENEMY_RANK_DEFAULTS = {
    1: {
        healthMultiplier: 1.0,
        get speedMin() { return getDifficultySpeedRange(getCurrentDifficulty()).speedMin; },
        get speedMax() { return getDifficultySpeedRange(getCurrentDifficulty()).speedMax; },
        damage: 1,
        color: '#ff5555',
        size: 32,
        expValue: 1
    },
    2: {
        healthMultiplier: 4.0,
        get speedMin() { return getDifficultySpeedRange(getCurrentDifficulty()).speedMin; },
        get speedMax() { return getDifficultySpeedRange(getCurrentDifficulty()).speedMax; },
        damage: 1,
        color: '#ff5555',
        size: 48,
        expValue: 4
    },
    3: {
        healthMultiplier: 16.0,
        get speedMin() { return getDifficultySpeedRange(getCurrentDifficulty()).speedMin; },
        get speedMax() { return getDifficultySpeedRange(getCurrentDifficulty()).speedMax; },
        damage: 1,
        color: '#ff5555',
        size: 64,
        expValue: 16
    },
    4: {
        healthMultiplier: 64.0,
        get speedMin() { return getDifficultySpeedRange(getCurrentDifficulty()).speedMin; },
        get speedMax() { return getDifficultySpeedRange(getCurrentDifficulty()).speedMax; },
        damage: 1,
        color: '#ff5555',
        size: 80,
        expValue: 64
    },
    5: {
        healthMultiplier: 256.0,
        get speedMin() { return getDifficultySpeedRange(getCurrentDifficulty()).speedMin; },
        get speedMax() { return getDifficultySpeedRange(getCurrentDifficulty()).speedMax; },
        damage: 1,
        color: '#ff5555',
        size: 96,
        expValue: 256
    },
    6: {
        healthMultiplier: 1024.0,
        get speedMin() { return getDifficultySpeedRange(getCurrentDifficulty()).speedMin; },
        get speedMax() { return getDifficultySpeedRange(getCurrentDifficulty()).speedMax; },
        damage: 1,
        color: '#ff5555',
        size: 128,
        expValue: 1024
    }
};

// Updated boss configuration with difficulty scaling
const BOSS_CONFIG = {
    get max_rank() { return getDifficultyBossConfig(getCurrentDifficulty()).max_rank; },
    get health_multiplier() { return getDifficultyBossConfig(getCurrentDifficulty()).health_multiplier; },
    get speed() { return getDifficultyBossConfig(getCurrentDifficulty()).speed; }
};

// Rank names using kanji characters
const ENEMY_RANK_NAMES = {
    1: "壱", // Formal number 1 (ichi)
    2: "弐", // Formal number 2 (ni)
    3: "参", // Formal number 3 (san)
    4: "肆", // Formal number 4 (shi)
    5: "伍", // Formal number 5 (go)
    6: "陸"  // Formal number 6 (roku)
};

// Dynamic tier assignments - will store enemy types for each rank
let ENEMY_TIER_ASSIGNMENTS = {
    1: [], // Will hold enemy kanji characters assigned to rank 1
    2: [], // Will hold enemy kanji characters assigned to rank 2
    3: [], // Will hold enemy kanji characters assigned to rank 3
    4: [], // Will hold enemy kanji characters assigned to rank 4
    5: [], // Will hold enemy kanji characters assigned to rank 5
    6: []  // Will hold enemy kanji characters assigned to rank 6
};

// Initialize enemy tier assignments
function initializeEnemyTiers(tierCounts = { 1: 4, 2: 4, 3: 4, 4: 1, 5: 1, 6: 1 }) {
    // Reset assignments
    ENEMY_TIER_ASSIGNMENTS = {
        1: [], 2: [], 3: [], 4: [], 5: [], 6: []
    };

    // Get all kanji characters from dictionary
    const allEnemyTypes = getAllKanjiCharacters();

    // Shuffle array to randomize assignments
    const shuffledEnemies = [...allEnemyTypes];
    for (let i = shuffledEnemies.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledEnemies[i], shuffledEnemies[j]] = [shuffledEnemies[j], shuffledEnemies[i]];
    }

    // Assign enemies to tiers based on specified counts
    let usedCount = 0;

    // Start assigning from tier 1 to 6
    for (let tier = 1; tier <= 6; tier++) {
        // Get the count for this tier (or default to 0)
        const tierCount = tierCounts[tier] ?? 0;

        // Check if we have enough enemies left
        if (usedCount + tierCount <= shuffledEnemies.length) {
            // Assign enemies to this tier
            ENEMY_TIER_ASSIGNMENTS[tier] = shuffledEnemies.slice(usedCount, usedCount + tierCount);
            usedCount += tierCount;
        } else {
            // Not enough enemies left, assign remaining ones
            ENEMY_TIER_ASSIGNMENTS[tier] = shuffledEnemies.slice(usedCount);
            console.log(`Warning: Not enough enemy types for tier ${tier}. Requested ${tierCount}, assigned ${shuffledEnemies.length - usedCount}`);
            break;
        }
    }

    // Log the assignments for debugging
    console.log("Enemy tier assignments initialized:",
        Object.entries(ENEMY_TIER_ASSIGNMENTS).map(([tier, enemies]) =>
            `Tier ${tier}: ${enemies.length} enemies`).join(', '));

    return ENEMY_TIER_ASSIGNMENTS;
}

// Helper function to get complete enemy data with defaults applied
function getEnemyData(enemyCharacter) {
    // Get kanji data from dictionary
    const kanjiData = getKanji(enemyCharacter);

    // If kanji doesn't exist in dictionary, use a random one
    if (!kanjiData) {
        const randomKanji = getRandomKanji();
        enemyCharacter = randomKanji.character;
    }

    // Re-fetch in case we had to use random
    const finalKanjiData = getKanji(enemyCharacter);

    // Find which rank this enemy is assigned to
    let enemyRank = 1; // Default to rank 1 if not found
    for (let rank = 1; rank <= 6; rank++) {
        if (ENEMY_TIER_ASSIGNMENTS[rank].includes(enemyCharacter)) {
            enemyRank = rank;
            break;
        }
    }

    // Get the defaults for this rank
    const rankDefaults = ENEMY_RANK_DEFAULTS[enemyRank] ?? ENEMY_RANK_DEFAULTS[1];

    // Merge rank defaults with kanji dictionary data
    return {
        ...rankDefaults,
        ...finalKanjiData,
        type: enemyCharacter,
        rank: enemyRank // Include the assigned rank
    };
}

// Get all enemy types as an array
function getAllEnemyTypes() {
    return getAllKanjiCharacters();
}

// Get enemy types by rank (from dynamic assignments)
function getEnemyTypesByRank(rank) {
    return ENEMY_TIER_ASSIGNMENTS[rank] ?? [];
}

// Choose a random enemy type
function getRandomEnemyType() {
    const randomKanji = getRandomKanji();
    return randomKanji.character;
}

// Choose a random enemy type of a specific rank
function getRandomEnemyTypeByRank(rank) {
    const types = getEnemyTypesByRank(rank);
    if (types.length === 0) return getRandomEnemyType(); // Fallback if no enemies of this rank
    return types[Math.floor(Math.random() * types.length)];
}