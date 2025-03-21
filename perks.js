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
    },

    // Food perks that increase max HP and heal the player
    // Add these to your PERKS object in perks.js

    "SUSHI": {
        kanji: "寿司",
        hiragana: "すし",
        romaji: "sushi",
        english: "Sushi",
        description: "Increases max health by 1 and fully heals",
        category: PERK_CATEGORIES.DEFENSIVE,
        color: "#FFFFFF",
        hoverColor: 0xE0E0E0,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },

    "RAMEN": {
        kanji: "拉麺",
        hiragana: "らーめん",
        romaji: "rāmen",
        english: "Ramen",
        description: "Increases max health by 1 and fully heals",
        category: PERK_CATEGORIES.DEFENSIVE,
        color: "#FFA07A",
        hoverColor: 0xDD8866,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },

    "ONIGIRI": {
        kanji: "御握",
        hiragana: "おにぎり",
        romaji: "onigiri",
        english: "Rice Ball",
        description: "Increases max health by 1 and fully heals",
        category: PERK_CATEGORIES.DEFENSIVE,
        color: "#F5F5DC",
        hoverColor: 0xE5E5CC,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },

    "MOCHI": {
        kanji: "餅",
        hiragana: "もち",
        romaji: "mochi",
        english: "Rice Cake",
        description: "Increases max health by 1 and fully heals",
        category: PERK_CATEGORIES.DEFENSIVE,
        color: "#FFE4E1",
        hoverColor: 0xEED4D1,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },

    "DANGO": {
        kanji: "団子",
        hiragana: "だんご",
        romaji: "dango",
        english: "Dumpling",
        description: "Increases max health by 1 and fully heals",
        category: PERK_CATEGORIES.DEFENSIVE,
        color: "#F0E68C",
        hoverColor: 0xE0D67C,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },

    "TEMPURA": {
        kanji: "天麩羅",
        hiragana: "てんぷら",
        romaji: "tempura",
        english: "Tempura",
        description: "Increases max health by 1 and fully heals",
        category: PERK_CATEGORIES.DEFENSIVE,
        color: "#FFD700",
        hoverColor: 0xEEC700,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },

    "UDON": {
        kanji: "饂飩",
        hiragana: "うどん",
        romaji: "udon",
        english: "Udon Noodles",
        description: "Increases max health by 1 and fully heals",
        category: PERK_CATEGORIES.DEFENSIVE,
        color: "#FAEBD7",
        hoverColor: 0xEADBc7,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },

    "YAKITORI": {
        kanji: "焼鳥",
        hiragana: "やきとり",
        romaji: "yakitori",
        english: "Grilled Chicken",
        description: "Increases max health by 1 and fully heals",
        category: PERK_CATEGORIES.DEFENSIVE,
        color: "#CD853F",
        hoverColor: 0xBD752F,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },

    "TAKOYAKI": {
        kanji: "蛸焼",
        hiragana: "たこやき",
        romaji: "takoyaki",
        english: "Octopus Balls",
        description: "Increases max health by 1 and fully heals",
        category: PERK_CATEGORIES.DEFENSIVE,
        color: "#8B4513",
        hoverColor: 0x7B3503,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },

    "GYOZA": {
        kanji: "餃子",
        hiragana: "ぎょうざ",
        romaji: "gyōza",
        english: "Dumplings",
        description: "Increases max health by 1 and fully heals",
        category: PERK_CATEGORIES.DEFENSIVE,
        color: "#D3D3D3",
        hoverColor: 0xC3C3C3,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },

    "TAIYAKI": {
        kanji: "鯛焼",
        hiragana: "たいやき",
        romaji: "taiyaki",
        english: "Fish-shaped Cake",
        description: "Increases max health by 1 and fully heals",
        category: PERK_CATEGORIES.DEFENSIVE,
        color: "#DEB887",
        hoverColor: 0xCEA877,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },

    "BENTO": {
        kanji: "弁当",
        hiragana: "べんとう",
        romaji: "bentō",
        english: "Lunch Box",
        description: "Increases max health by 1 and fully heals",
        category: PERK_CATEGORIES.DEFENSIVE,
        color: "#FF6347",
        hoverColor: 0xEF5337,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },

    // Update the existing Red Dragon perk and add new Red animal perks
    // Add these to your PERKS object in perks.js

    "RED_DRAGON": {
        kanji: "赤龍",
        hiragana: "あかりゅう",
        romaji: "akaryuu",
        english: "Red Dragon",
        description: "Increases damage by 2\nDecreases speed by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 2);
            window.modifyStat('speed', -1);
        }
    },

    "RED_TIGER": {
        kanji: "赤虎",
        hiragana: "あかとら",
        romaji: "akatora",
        english: "Red Tiger",
        description: "Increases damage by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 1);
        }
    },

    "RED_HAWK": {
        kanji: "赤鷹",
        hiragana: "あかたか",
        romaji: "akataka",
        english: "Red Hawk",
        description: "Increases damage by 1\nIncreases speed by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 1);
            window.modifyStat('speed', 1);
        }
    },

    "RED_BEAR": {
        kanji: "赤熊",
        hiragana: "あかくま",
        romaji: "akakuma",
        english: "Red Bear",
        description: "Increases damage by 2\nDecreases fire rate by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 2);
            window.modifyStat('fireRate', -1);
        }
    },

    "RED_SCORPION": {
        kanji: "赤蠍",
        hiragana: "あかさそり",
        romaji: "akasasori",
        english: "Red Scorpion",
        description: "Increases damage by 2\nDecreases luck by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 2);
            window.modifyStat('luck', -1);
        }
    },

    "RED_FOX": {
        kanji: "赤狐",
        hiragana: "あかきつね",
        romaji: "akakitsune",
        english: "Red Fox",
        description: "Increases damage by 1\nIncreases luck by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 1);
            window.modifyStat('luck', 1);
        }
    },

    "RED_WOLF": {
        kanji: "赤狼",
        hiragana: "あかおおかみ",
        romaji: "akaookami",
        english: "Red Wolf",
        description: "Increases damage by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 1);
        }
    },

    "RED_SNAKE": {
        kanji: "赤蛇",
        hiragana: "あかへび",
        romaji: "akahebi",
        english: "Red Snake",
        description: "Increases damage by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 1);
        }
    },

    "RED_MANTIS": {
        kanji: "赤螳螂",
        hiragana: "あかとうろう",
        romaji: "akatourou",
        english: "Red Mantis",
        description: "Increases damage by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 1);
        }
    },

    "RED_LION": {
        kanji: "赤獅子",
        hiragana: "あかしし",
        romaji: "akashishi",
        english: "Red Lion",
        description: "Increases damage by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 1);
        }
    },

    "RED_FALCON": {
        kanji: "赤隼",
        hiragana: "あかはやぶさ",
        romaji: "akahayabusa",
        english: "Red Falcon",
        description: "Increases damage by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 1);
        }
    },

    // Yellow animal perks focused on fire rate
    // Add these to your PERKS object in perks.js

    "YELLOW_CHEETAH": {
        kanji: "黄豹",
        hiragana: "きひょう",
        romaji: "kihyou",
        english: "Yellow Cheetah",
        description: "Increases fire rate by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },

    "YELLOW_HUMMINGBIRD": {
        kanji: "黄蜂鳥",
        hiragana: "きはちどり",
        romaji: "kihachidori",
        english: "Yellow Hummingbird",
        description: "Increases fire rate by 4\nDecreases damage by 2",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 4);
            window.modifyStat('damage', -2);
        }
    },

    "YELLOW_WASP": {
        kanji: "黄蜂",
        hiragana: "きばち",
        romaji: "kibachi",
        english: "Yellow Wasp",
        description: "Increases fire rate by 2\nDecreases health by 2",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 2);
            window.modifyStat('health', -2);
        }
    },

    "YELLOW_JACKAL": {
        kanji: "黄豺",
        hiragana: "きやまいぬ",
        romaji: "kiyamainu",
        english: "Yellow Jackal",
        description: "Increases fire rate by 3\nDecreases damage by 1\nDecreases speed by 1\nDecreases health by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 3);
            window.modifyStat('damage', -1);
            window.modifyStat('speed', -1);
            window.modifyStat('health', -1);
        }
    },

    "YELLOW_CANARY": {
        kanji: "黄鳥",
        hiragana: "きどり",
        romaji: "kidori",
        english: "Yellow Canary",
        description: "Increases fire rate by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },

    "YELLOW_HORNET": {
        kanji: "黄蜂",
        hiragana: "きすずめばち",
        romaji: "kisuzumebachi",
        english: "Yellow Hornet",
        description: "Increases fire rate by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },

    "YELLOW_BEE": {
        kanji: "黄蜜蜂",
        hiragana: "きみつばち",
        romaji: "kimitsubachi",
        english: "Yellow Bee",
        description: "Increases fire rate by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },

    "YELLOW_FINCH": {
        kanji: "黄雀",
        hiragana: "きひわ",
        romaji: "kihiwa",
        english: "Yellow Finch",
        description: "Increases fire rate by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },

    "YELLOW_MONGOOSE": {
        kanji: "黄鼬",
        hiragana: "きまんぐーす",
        romaji: "kimanguusu",
        english: "Yellow Mongoose",
        description: "Increases fire rate by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },

    "YELLOW_SQUIRREL": {
        kanji: "黄栗鼠",
        hiragana: "きりす",
        romaji: "kirisu",
        english: "Yellow Squirrel",
        description: "Increases fire rate by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },

    "YELLOW_CICADA": {
        kanji: "黄蝉",
        hiragana: "きせみ",
        romaji: "kisemi",
        english: "Yellow Cicada",
        description: "Increases fire rate by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },

    "YELLOW_CRICKET": {
        kanji: "黄蟋蟀",
        hiragana: "きこおろぎ",
        romaji: "kikohrogi",
        english: "Yellow Cricket",
        description: "Increases fire rate by 1",
        category: PERK_CATEGORIES.OFFENSIVE,
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
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