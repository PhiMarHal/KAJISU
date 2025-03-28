// Default values for any unspecified properties
const ENEMY_DEFAULTS = {
    rank: 1,
    healthMultiplier: 1.0,
    speedMin: 25,
    speedMax: 100,
    damage: 1,
    color: '#ff5555',
    size: 32,
    expValue: 1
};

// The actual enemy definitions - using kanji characters with readings and translations
const ENEMY_TYPES = {
    '鬼': {
        rank: 1,
        hiragana: 'おに',
        romaji: 'oni',
        english: 'Demon/Ogre'
    },
    '幽': {
        rank: 1,
        hiragana: 'ゆう',
        romaji: 'yuu',
        english: 'Ghost'
    },
    '龍': {
        rank: 1,
        hiragana: 'りゅう',
        romaji: 'ryuu',
        english: 'Dragon'
    },
    '蛇': {
        rank: 1,
        hiragana: 'へび',
        romaji: 'hebi',
        english: 'Snake'
    },
    '魔': {
        rank: 1,
        hiragana: 'ま',
        romaji: 'ma',
        english: 'Devil'
    },
    '死': {
        rank: 1,
        hiragana: 'し',
        romaji: 'shi',
        english: 'Death'
    },
    '獣': {
        rank: 1,
        hiragana: 'けもの',
        romaji: 'kemono',
        english: 'Beast'
    },
    '骨': {
        rank: 1,
        hiragana: 'ほね',
        romaji: 'hone',
        english: 'Bone'
    },
    '影': {
        rank: 1,
        hiragana: 'かげ',
        romaji: 'kage',
        english: 'Shadow'
    },
    '鮫': {
        rank: 1,
        hiragana: 'さめ',
        romaji: 'same',
        english: 'Shark'
    },
    '妖': {
        rank: 1,
        hiragana: 'あやかし',
        romaji: 'ayakashi',
        english: 'Phantom'
    },
    '冥': {
        rank: 1,
        hiragana: 'めい',
        romaji: 'mei',
        english: 'Specter'
    },
    '霊': {
        rank: 1,
        hiragana: 'れい',
        romaji: 'rei',
        english: 'Spirit'
    },
    '怨': {
        rank: 1,
        hiragana: 'おん',
        romaji: 'on',
        english: 'Grudge'
    },
    '邪': {
        rank: 1,
        hiragana: 'じゃ',
        romaji: 'ja',
        english: 'Evil'
    },
    '呪': {
        rank: 1,
        hiragana: 'のろい',
        romaji: 'noroi',
        english: 'Curse'
    },
    '魂': {
        rank: 1,
        hiragana: 'たましい',
        romaji: 'tamashii',
        english: 'Soul'
    },
    '闇': {
        rank: 1,
        hiragana: 'やみ',
        romaji: 'yami',
        english: 'Darkness'
    },
    '妄': {
        rank: 1,
        hiragana: 'もう',
        romaji: 'mou',
        english: 'Delusion'
    },
    '憑': {
        rank: 1,
        hiragana: 'つき',
        romaji: 'tsuki',
        english: 'Possession'
    },
    '煉': {
        rank: 1,
        hiragana: 'れん',
        romaji: 'ren',
        english: 'Purgatory'
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

    // Merge defaults with specific enemy data
    return {
        ...ENEMY_DEFAULTS,
        ...ENEMY_TYPES[enemyType],
        type: enemyType
    };
}

// Get all enemy types as an array
function getAllEnemyTypes() {
    return Object.keys(ENEMY_TYPES);
}

// Choose a random enemy type
function getRandomEnemyType() {
    const types = getAllEnemyTypes();
    return types[Math.floor(Math.random() * types.length)];
}