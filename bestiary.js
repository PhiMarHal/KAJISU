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
    }
    // Future ranks can be added here following the pattern
};

// Rank names using kanji characters
const ENEMY_RANK_NAMES = {
    1: "壱", // Formal number 1 (ichi)
    2: "弐", // Formal number 2 (ni)
    3: "参", // Formal number 3 (san)
    4: "肆", // Formal number 4 (shi)
    5: "伍"  // Formal number 5 (go)
};

// The actual enemy definitions - using kanji characters with readings and translations
const ENEMY_TYPES = {
    // Rank 1 enemies
    '鬼': {
        rank: 1,
        kana: 'おに',
        romaji: 'oni',
        english: 'Demon/Ogre'
    },
    '幽': {
        rank: 1,
        kana: 'ゆう',
        romaji: 'yuu',
        english: 'Ghost'
    },
    '龍': {
        rank: 1,
        kana: 'りゅう',
        romaji: 'ryuu',
        english: 'Dragon'
    },
    '蛇': {
        rank: 1,
        kana: 'へび',
        romaji: 'hebi',
        english: 'Snake'
    },
    '魔': {
        rank: 1,
        kana: 'ま',
        romaji: 'ma',
        english: 'Devil'
    },
    '死': {
        rank: 1,
        kana: 'し',
        romaji: 'shi',
        english: 'Death'
    },
    '獣': {
        rank: 1,
        kana: 'けもの',
        romaji: 'kemono',
        english: 'Beast'
    },
    '骨': {
        rank: 1,
        kana: 'ほね',
        romaji: 'hone',
        english: 'Bone'
    },
    '影': {
        rank: 1,
        kana: 'かげ',
        romaji: 'kage',
        english: 'Shadow'
    },
    '鮫': {
        rank: 1,
        kana: 'さめ',
        romaji: 'same',
        english: 'Shark'
    },
    '妖': {
        rank: 1,
        kana: 'あやかし',
        romaji: 'ayakashi',
        english: 'Phantom'
    },
    '冥': {
        rank: 1,
        kana: 'めい',
        romaji: 'mei',
        english: 'Specter'
    },
    '霊': {
        rank: 1,
        kana: 'れい',
        romaji: 'rei',
        english: 'Spirit'
    },
    '怨': {
        rank: 1,
        kana: 'おん',
        romaji: 'on',
        english: 'Grudge'
    },
    '邪': {
        rank: 1,
        kana: 'じゃ',
        romaji: 'ja',
        english: 'Evil'
    },
    '呪': {
        rank: 1,
        kana: 'のろい',
        romaji: 'noroi',
        english: 'Curse'
    },
    '魂': {
        rank: 1,
        kana: 'たましい',
        romaji: 'tamashii',
        english: 'Soul'
    },
    '闇': {
        rank: 1,
        kana: 'やみ',
        romaji: 'yami',
        english: 'Darkness'
    },
    '妄': {
        rank: 1,
        kana: 'もう',
        romaji: 'mou',
        english: 'Delusion'
    },
    '憑': {
        rank: 1,
        kana: 'つき',
        romaji: 'tsuki',
        english: 'Possession'
    },
    '煉': {
        rank: 1,
        kana: 'れん',
        romaji: 'ren',
        english: 'Purgatory'
    },

    // Rank 2 enemies - more powerful variants
    '殺': {
        rank: 2,
        kana: 'さつ',
        romaji: 'satsu',
        english: 'Slayer'
    },
    '魘': {
        rank: 2,
        kana: 'えん',
        romaji: 'en',
        english: 'Nightmare'
    },
    '禍': {
        rank: 2,
        kana: 'わざわい',
        romaji: 'wazawai',
        english: 'Calamity'
    },
    '鬣': {
        rank: 2,
        kana: 'たてがみ',
        romaji: 'tategami',
        english: 'Mane'
    },
    '悪': {
        rank: 2,
        kana: 'あく',
        romaji: 'aku',
        english: 'Malice'
    },
    '屍': {
        rank: 2,
        kana: 'しかばね',
        romaji: 'shikabane',
        english: 'Corpse'
    },
    '凶': {
        rank: 2,
        kana: 'きょう',
        romaji: 'kyou',
        english: 'Doom'
    },
    '鵺': {
        rank: 2,
        kana: 'ぬえ',
        romaji: 'nue',
        english: 'Chimera'
    },
    '餓': {
        rank: 2,
        kana: 'うえ',
        romaji: 'ue',
        english: 'Hunger'
    },
    '狂': {
        rank: 2,
        kana: 'きょう',
        romaji: 'kyou',
        english: 'Madness'
    },
    '兇': {
        rank: 2,
        kana: 'きょう',
        romaji: 'kyou',
        english: 'Savage'
    },
    '鬧': {
        rank: 2,
        kana: 'かまびすし',
        romaji: 'kamabisushi',
        english: 'Uproar'
    }
};

const DEFEAT_SYNONYMS = [
    "defeated",
    "removed",
    "deleted",
    "relocated",
    "disentangled",
    "terminated",
    "vanquished",
    "eliminated",
    "dispatched",
    "neutralized",
    "subdued",
    "erased",
    "eradicated",
    "ousted",
    "banished",
    "dissolved",
    "pacified"
];

const LEGIBLE_COLORS = [
    '#ffffff', // white
    '#ffff00', // yellow
    '#00ffff', // cyan
    '#ff00ff', // magenta
    '#00ff88', // mint green
    '#ff8800', // orange
    '#88ff00', // lime
    '#00bbff', // sky blue
    '#ff88ff', // pink
    '#ffbb00', // gold
    '#00ffbb', // turquoise
    '#bbff00'  // chartreuse
];

// Helper function to get complete enemy data with defaults applied
function getEnemyData(enemyType) {
    // If enemy type doesn't exist, use a random one
    if (!ENEMY_TYPES[enemyType]) {
        const availableTypes = Object.keys(ENEMY_TYPES);
        enemyType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    }

    // Get the enemy's rank
    const enemyRank = ENEMY_TYPES[enemyType].rank || 1;

    // Get the defaults for this rank
    const rankDefaults = ENEMY_RANK_DEFAULTS[enemyRank] || ENEMY_RANK_DEFAULTS[1];

    // Merge rank defaults with specific enemy data
    return {
        ...rankDefaults,
        ...ENEMY_TYPES[enemyType],
        type: enemyType
    };
}

// Get all enemy types as an array
function getAllEnemyTypes() {
    return Object.keys(ENEMY_TYPES);
}

// Get enemy types by rank
function getEnemyTypesByRank(rank) {
    return Object.keys(ENEMY_TYPES).filter(key => ENEMY_TYPES[key].rank === rank);
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