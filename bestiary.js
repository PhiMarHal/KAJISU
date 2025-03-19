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
    }
};

// Hero kanji with readings and translation
const HERO_CHARACTER = '勇';
const HERO_HIRAGANA = 'ゆう';
const HERO_ROMAJI = 'yuu';
const HERO_ENGLISH = 'Brave';

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