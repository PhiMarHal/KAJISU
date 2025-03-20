// Base player stats
const BASE_STATS = {
    HEALTH: 4,
    SPEED: 4,
    DAMAGE: 4,
    LUCK: 4,
    FIRE_RATE: 4
};

// Perk categories
const PERK_CATEGORIES = {
    OFFENSIVE: "offensive",
    DEFENSIVE: "defensive",
    MOBILITY: "mobility",
    SPECIAL: "special"
};

// Map of all available perks
const PERKS = {
    // =========================================================================
    // BASIC STAT PERKS
    // =========================================================================
    "DAMAGE_UP": {
        kanji: "力",
        hiragana: "ちから",
        romaji: "chikara",
        english: "Power",
        description: "Increases damage by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ff5555",
        hoverColor: 0x662222,
        onAcquire: function () {
            window.modifyStat('damage', 1);
        }
    },
    "SPEED_UP": {
        kanji: "速",
        hiragana: "はや",
        romaji: "haya",
        english: "Speed",
        description: "Increases movement speed by 1",
        category: PERK_CATEGORIES.MOBILITY,
        color: "#55ff55",
        hoverColor: 0x226622,
        onAcquire: function () {
            window.modifyStat('speed', 1);
        }
    },
    "HEALTH_UP": {
        kanji: "命",
        hiragana: "いのち",
        romaji: "inochi",
        english: "Life",
        description: "Increases max health by 1",
        category: PERK_CATEGORIES.DEFENSIVE,
        color: "#5555ff",
        hoverColor: 0x222266,
        onAcquire: function () {
            window.modifyStat('health', 1);
        }
    },
    "LUCK_UP": {
        kanji: "運",
        hiragana: "うん",
        romaji: "un",
        english: "Luck",
        description: "Increases luck by 1",
        category: PERK_CATEGORIES.SPECIAL,
        color: "#ffff55",
        hoverColor: 0x666622,
        onAcquire: function () {
            window.modifyStat('luck', 1);
        }
    },
    "FIRE_RATE": {
        kanji: "射",
        hiragana: "しゃ",
        romaji: "sha",
        english: "Shoot",
        description: "Increases fire rate by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ffaa55",
        hoverColor: 0x885522,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },

    // =========================================================================
    // ANIMAL-COLOR PERKS (Template for future additions)
    // =========================================================================
    "RED_DRAGON": {
        kanji: "赤龍",
        hiragana: "あかりゅう",
        romaji: "akaryuu",
        english: "Red Dragon",
        description: "Increases damage by 2",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 2);
        }
    },
    "BLUE_WHALE": {
        kanji: "青鯨",
        hiragana: "あおくじら",
        romaji: "aokujira",
        english: "Blue Whale",
        description: "Creates a protective shield that absorbs one hit",
        category: PERK_CATEGORIES.DEFENSIVE,
        color: "#3498db",
        hoverColor: 0x2980b9,
        onAcquire: function () {
            window.activateShield();
        }
    },
    "TEAL_OCTOPUS": {
        kanji: "青緑蛸",
        hiragana: "せいりょくたこ",
        romaji: "seiryokutako",
        english: "Teal Octopus",
        description: "Gain orbiting projectiles",
        category: PERK_CATEGORIES.SPECIAL,
        color: "#008080",
        hoverColor: 0x005f5f,
        onAcquire: function () {
            window.activateOrbitingProjectile();
        }
    },
    "AMBER_BEETLE": {
        kanji: "琥珀甲",
        hiragana: "こはくこう",
        romaji: "kohakukou",
        english: "Amber Beetle",
        description: "Drops explosive mines that damage enemies",
        category: PERK_CATEGORIES.SPECIAL,
        color: "#ffbf00",
        hoverColor: 0xbb8c00,
        onAcquire: function () {
            window.activateLandmines();
        }
    }
};

// Helper functions for the perk system
const PerkSystem = {
    // Get all available perks
    getAllPerks: function () {
        return Object.keys(PERKS).map(key => ({
            id: key,
            ...PERKS[key]
        }));
    },

    // Get perks by category
    getPerksByCategory: function (category) {
        return Object.keys(PERKS)
            .filter(key => PERKS[key].category === category)
            .map(key => ({
                id: key,
                ...PERKS[key]
            }));
    },

    // Get a single perk by ID
    getPerkById: function (perkId) {
        if (!PERKS[perkId]) return null;
        return {
            id: perkId,
            ...PERKS[perkId]
        };
    },

    // Get random perks (avoiding duplicates)
    getRandomPerks: function (count, excludeIds = []) {
        const availablePerks = Object.keys(PERKS)
            .filter(key => !excludeIds.includes(key))
            .map(key => ({
                id: key,
                ...PERKS[key]
            }));

        // Shuffle the array
        for (let i = availablePerks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availablePerks[i], availablePerks[j]] = [availablePerks[j], availablePerks[i]];
        }

        return availablePerks.slice(0, count);
    },

    // Apply a perk to the game
    applyPerk: function (scene, perkId) {
        const perk = PERKS[perkId];
        if (!perk) return false;

        console.log("Applying perk:", perkId);

        // Call the onAcquire function
        perk.onAcquire();

        return true;
    }
};