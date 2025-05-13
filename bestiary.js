// Default values for different ranks of enemies
const ENEMY_RANK_DEFAULTS = {
    // Rank 1 (basic enemies)
    1: {
        healthMultiplier: 1.0,
        speedMin: 25,
        speedMax: 100,
        damage: 1,
        color: '#ff5555',
        size: 32,
        expValue: 1
    },
    // Rank 2 (stronger enemies)
    2: {
        healthMultiplier: 4.0,
        speedMin: 25,
        speedMax: 100,
        damage: 1,
        color: '#ff5555',
        size: 48,
        expValue: 4
    },
    // Rank 3 (even stronger enemies)
    3: {
        healthMultiplier: 16.0,
        speedMin: 25,
        speedMax: 100,
        damage: 1,
        color: '#ff5555',
        size: 64,
        expValue: 16
    },
    // Rank 4 (powerful enemies)
    4: {
        healthMultiplier: 64.0,
        speedMin: 25,
        speedMax: 100,
        damage: 1,
        color: '#ff5555',
        size: 80,
        expValue: 64
    },
    // Rank 5 (very powerful enemies)
    5: {
        healthMultiplier: 256.0,
        speedMin: 25,
        speedMax: 100,
        damage: 1,
        color: '#ff5555',
        size: 96,
        expValue: 256
    },
    // Rank 6 (elite enemies)
    6: {
        healthMultiplier: 1024.0,
        speedMin: 25,
        speedMax: 100,
        damage: 1,
        color: '#ff5555',
        size: 128,
        expValue: 1024
    }
    // Future ranks can be added here following the pattern
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

// Boss configuration
const BOSS_CONFIG = {
    max_rank: 4,                // Maximum rank at which the boss appears
    health_multiplier: 10.0,    // Boss health multiplier compared to normal enemies
    speed: 100                  // Fixed boss speed
};

// The enemy definitions - using kanji characters with readings and translations
// Note: Removed rank field as it will be assigned dynamically
const ENEMY_TYPES = {
    '鬼': {
        kana: 'おに',
        romaji: 'oni',
        english: 'Demon'
    },
    '幽': {
        kana: 'ゆう',
        romaji: 'yuu',
        english: 'Ghost'
    },
    '龍': {
        kana: 'りゅう',
        romaji: 'ryuu',
        english: 'Dragon'
    },
    '蛇': {
        kana: 'へび',
        romaji: 'hebi',
        english: 'Snake'
    },
    '魔': {
        kana: 'ま',
        romaji: 'ma',
        english: 'Devil'
    },
    '死': {
        kana: 'し',
        romaji: 'shi',
        english: 'Death'
    },
    '獣': {
        kana: 'けもの',
        romaji: 'kemono',
        english: 'Beast'
    },
    '骨': {
        kana: 'ほね',
        romaji: 'hone',
        english: 'Bone'
    },
    '影': {
        kana: 'かげ',
        romaji: 'kage',
        english: 'Shadow'
    },
    '鮫': {
        kana: 'さめ',
        romaji: 'same',
        english: 'Shark'
    },
    '妖': {
        kana: 'あやかし',
        romaji: 'ayakashi',
        english: 'Phantom'
    },
    '冥': {
        kana: 'めい',
        romaji: 'mei',
        english: 'Specter'
    },
    '霊': {
        kana: 'れい',
        romaji: 'rei',
        english: 'Spirit'
    },
    '怨': {
        kana: 'おん',
        romaji: 'on',
        english: 'Grudge'
    },
    '邪': {
        kana: 'じゃ',
        romaji: 'ja',
        english: 'Evil'
    },
    '呪': {
        kana: 'のろい',
        romaji: 'noroi',
        english: 'Curse'
    },
    '魂': {
        kana: 'たましい',
        romaji: 'tamashii',
        english: 'Soul'
    },
    '闇': {
        kana: 'やみ',
        romaji: 'yami',
        english: 'Darkness'
    },
    '妄': {
        kana: 'もう',
        romaji: 'mou',
        english: 'Delusion'
    },
    '憑': {
        kana: 'つき',
        romaji: 'tsuki',
        english: 'Possession'
    },
    '煉': {
        kana: 'れん',
        romaji: 'ren',
        english: 'Purgatory'
    },
    '殺': {
        kana: 'さつ',
        romaji: 'satsu',
        english: 'Slayer'
    },
    '魘': {
        kana: 'えん',
        romaji: 'en',
        english: 'Nightmare'
    },
    '禍': {
        kana: 'わざわい',
        romaji: 'wazawai',
        english: 'Calamity'
    },
    '鬣': {
        kana: 'たてがみ',
        romaji: 'tategami',
        english: 'Mane'
    },
    '悪': {
        kana: 'あく',
        romaji: 'aku',
        english: 'Malice'
    },
    '屍': {
        kana: 'しかばね',
        romaji: 'shikabane',
        english: 'Corpse'
    },
    '凶': {
        kana: 'きょう',
        romaji: 'kyou',
        english: 'Doom'
    },
    '鵺': {
        kana: 'ぬえ',
        romaji: 'nue',
        english: 'Chimera'
    },
    '餓': {
        kana: 'うえ',
        romaji: 'ue',
        english: 'Hunger'
    },
    '狂': {
        kana: 'きょう',
        romaji: 'kyou',
        english: 'Madness'
    },
    '兇': {
        kana: 'きょう',
        romaji: 'kyou',
        english: 'Savage'
    },
    '鬧': {
        kana: 'かまびすし',
        romaji: 'kamabisushi',
        english: 'Uproar'
    },
    // Additional enemies
    '災': {
        kana: 'わざわい',
        romaji: 'wazawai',
        english: 'Disaster'
    },
    '亡': {
        kana: 'ほろ',
        romaji: 'horo',
        english: 'Perish'
    },
    '滅': {
        kana: 'めつ',
        romaji: 'metsu',
        english: 'Destroy'
    },
    '崩': {
        kana: 'くず',
        romaji: 'kuzu',
        english: 'Collapse'
    },
    '破': {
        kana: 'やぶ',
        romaji: 'yabu',
        english: 'Break'
    },
    '裂': {
        kana: 'さ',
        romaji: 'sa',
        english: 'Tear'
    },
    '灰': {
        kana: 'はい',
        romaji: 'hai',
        english: 'Ash'
    },
    '焦': {
        kana: 'こ',
        romaji: 'ko',
        english: 'Scorch'
    },
    '血': {
        kana: 'ち',
        romaji: 'chi',
        english: 'Blood'
    },
    '斬': {
        kana: 'き',
        romaji: 'ki',
        english: 'Slash'
    },
    '穿': {
        kana: 'うが',
        romaji: 'uga',
        english: 'Pierce'
    },
    '刺': {
        kana: 'さ',
        romaji: 'sa',
        english: 'Stab'
    },
    '砕': {
        kana: 'くだ',
        romaji: 'kuda',
        english: 'Crush'
    },
    '毒': {
        kana: 'どく',
        romaji: 'doku',
        english: 'Poison'
    },
    '疫': {
        kana: 'えき',
        romaji: 'eki',
        english: 'Plague'
    },
    '病': {
        kana: 'やまい',
        romaji: 'yamai',
        english: 'Disease'
    },
    '腐': {
        kana: 'くさ',
        romaji: 'kusa',
        english: 'Rot'
    },
    '蝕': {
        kana: 'しょく',
        romaji: 'shoku',
        english: 'Erode'
    },
    '墓': {
        kana: 'はか',
        romaji: 'haka',
        english: 'Tomb'
    },
    '棺': {
        kana: 'かん',
        romaji: 'kan',
        english: 'Coffin'
    },
    '葬': {
        kana: 'ほうむ',
        romaji: 'houmu',
        english: 'Bury'
    },
    '鎖': {
        kana: 'くさり',
        romaji: 'kusari',
        english: 'Chain'
    },
    '縛': {
        kana: 'しば',
        romaji: 'shiba',
        english: 'Bind'
    },
    '罠': {
        kana: 'わな',
        romaji: 'wana',
        english: 'Trap'
    },
    '恐': {
        kana: 'おそ',
        romaji: 'oso',
        english: 'Fear'
    },
    '驚': {
        kana: 'おどろ',
        romaji: 'odoro',
        english: 'Surprise'
    },
    '脅': {
        kana: 'おど',
        romaji: 'odo',
        english: 'Threaten'
    },
    '絶': {
        kana: 'た',
        romaji: 'ta',
        english: 'Sever'
    },
    '終': {
        kana: 'お',
        romaji: 'o',
        english: 'End'
    },
    '喪': {
        kana: 'も',
        romaji: 'mo',
        english: 'Mourn'
    },
    '虚': {
        kana: 'きょ',
        romaji: 'kyo',
        english: 'Void'
    },
    '空': {
        kana: 'から',
        romaji: 'kara',
        english: 'Empty'
    },
    '虫': {
        kana: 'むし',
        romaji: 'mushi',
        english: 'Insect'
    },
    '蜘': {
        kana: 'くも',
        romaji: 'kumo',
        english: 'Spider'
    },
    '蛛': {
        kana: 'くも',
        romaji: 'kumo',
        english: 'Spider'
    },
    '蟲': {
        kana: 'むし',
        romaji: 'mushi',
        english: 'Bug'
    },
    '蠍': {
        kana: 'さそり',
        romaji: 'sasori',
        english: 'Scorpion'
    },
    '蜈': {
        kana: 'むかで',
        romaji: 'mukade',
        english: 'Centipede'
    },
    '蚣': {
        kana: 'むかで',
        romaji: 'mukade',
        english: 'Centipede'
    },
    '蝎': {
        kana: 'さそり',
        romaji: 'sasori',
        english: 'Scorpion'
    }
};


// Dynamic tier assignments - will store enemy types for each rank
let ENEMY_TIER_ASSIGNMENTS = {
    1: [], // Will hold enemy types assigned to rank 1
    2: [], // Will hold enemy types assigned to rank 2
    3: [], // Will hold enemy types assigned to rank 3
    4: [], // Will hold enemy types assigned to rank 4
    5: [], // Will hold enemy types assigned to rank 5
    6: []  // Will hold enemy types assigned to rank 6
};

// Initialize enemy tier assignments
function initializeEnemyTiers(tierCounts = { 1: 8, 2: 4, 3: 2, 4: 2, 5: 2, 6: 2 }) {
    // Reset assignments
    ENEMY_TIER_ASSIGNMENTS = {
        1: [], 2: [], 3: [], 4: [], 5: [], 6: []
    };

    // Get all enemy types
    const allEnemyTypes = Object.keys(ENEMY_TYPES);

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
function getEnemyData(enemyType) {
    // If enemy type doesn't exist, use a random one
    if (!ENEMY_TYPES[enemyType]) {
        const availableTypes = Object.keys(ENEMY_TYPES);
        enemyType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    }

    // Find which rank this enemy is assigned to
    let enemyRank = 1; // Default to rank 1 if not found
    for (let rank = 1; rank <= 6; rank++) {
        if (ENEMY_TIER_ASSIGNMENTS[rank].includes(enemyType)) {
            enemyRank = rank;
            break;
        }
    }

    // Get the defaults for this rank
    const rankDefaults = ENEMY_RANK_DEFAULTS[enemyRank] || ENEMY_RANK_DEFAULTS[1];

    // Merge rank defaults with specific enemy data
    return {
        ...rankDefaults,
        ...ENEMY_TYPES[enemyType],
        type: enemyType,
        rank: enemyRank // Include the assigned rank
    };
}

// Get all enemy types as an array
function getAllEnemyTypes() {
    return Object.keys(ENEMY_TYPES);
}

// Get enemy types by rank (from dynamic assignments)
function getEnemyTypesByRank(rank) {
    return ENEMY_TIER_ASSIGNMENTS[rank] || [];
}

// Choose a random enemy type
function getRandomEnemyType() {
    const types = getAllEnemyTypes();
    return types[Math.floor(Math.random() * types.length)];
}

// Choose a random enemy type of a specific rank
function getRandomEnemyTypeByRank(rank) {
    const types = getEnemyTypesByRank(rank);
    if (types.length === 0) return getRandomEnemyType(); // Fallback if no enemies of this rank
    return types[Math.floor(Math.random() * types.length)];
}