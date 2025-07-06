// Map of all available perks
const PERKS = {
    // =========================================================================
    // ANIMAL-COLOR PERKS
    // =========================================================================
    "RED_DRAGON": {
        kanji: "赤竜",
        kana: "あかりゅう",
        romaji: "akaryuu",
        english: "Red Dragon",
        description: "+2 POW / -1 AGI",
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 2);
            window.modifyStat('fireRate', -1);
        }
    },
    "BLUE_WHALE": {
        kanji: "青鯨",
        kana: "あおくじら",
        romaji: "aokujira",
        english: "Blue Whale",
        description: "Permanent Protection",
        color: "#3498db",
        hoverColor: 0x2980b9,
        onAcquire: function () {

        }
    },
    "FATED_SHIELD": {
        kanji: "運命の盾",
        kana: "うんめいのたて",
        romaji: "unmeinotate",
        english: "Fated Shield",
        description: "Auto Shield when at 1 HP",
        color: "#FF5555",
        hoverColor: 0xDD3333,
        onAcquire: function () {
            // The component is added through PlayerPerkRegistry
        }
    },
    "BLOOMING_FLOWER": {
        kanji: "花咲く",
        kana: "はなさく",
        romaji: "hanasaku",
        english: "Blooming Flower",
        description: "Flower attacks nearby enemies",
        color: "#FF66AA", // Pink color
        hoverColor: 0xDD4488,
        onAcquire: function () {
            window.activateBloomingFlower();
        }
    },
    "TEAL_OCTOPUS": {
        kanji: "青緑蛸",
        kana: "あおみどりたこ",
        romaji: "aomidoritako",
        english: "Teal Octopus",
        description: "Gain orbiting projectiles",
        color: "#008080",
        hoverColor: 0x005f5f,
        onAcquire: function () {
            window.activateOrbitingProjectile();
        }
    },
    "INVERTED_OCTOPUS": {
        kanji: "逆蛸",
        kana: "ぎゃくたこ",
        romaji: "gyakutako",
        english: "Inverted Octopus",
        description: "selitcejorp gnitibro niaG",
        color: "#FF55FF", // Pink color
        hoverColor: 0xDD33DD,
        onAcquire: function () {
            window.activateInvertedOctopus();
        }
    },
    "TENTACLE_GRASP": {
        kanji: "触手",
        kana: "しょくしゅ",
        romaji: "shokushu",
        english: "Tentacle Grasp",
        description: "Tentacles extend in all directions",
        color: "#8800AA", // Purple color
        hoverColor: 0x660088,
        onAcquire: function () {
            window.activateTentacleGrasp();
        }
    },
    "GLASS_CANNON": {
        kanji: "硝子砲",
        kana: "がらすほう",
        romaji: "garasuhou",
        english: "Glass Cannon",
        description: "+5 POW. Reduces END to 1",
        color: "#FF0000",
        hoverColor: 0xDD0000,
        onAcquire: function () {
            // Increase POW by 5
            window.modifyStat('damage', 5);

            // Simply use a large negative value, the minimum check will handle it
            window.modifyStat('health', -999);
        }
    },
    "DEATH_FINGER": {
        kanji: "死指",
        kana: "しゆび",
        romaji: "shiyubi",
        english: "Death Finger",
        description: "Point and deal damage",
        color: "#FF0000", // Red color
        hoverColor: 0xDD0000,
        onAcquire: function () {
            window.activateDeathFinger();
        }
    },
    "HEALING_FAIRY": {
        kanji: "癒精",
        kana: "いやせい",
        romaji: "iyasei",
        english: "Healing Fairy",
        description: "Stay close to her target",
        color: "#7FFF7F", // Light green color
        hoverColor: 0x5FDF5F,
        onAcquire: function () {
            window.activateHealingFairy();
        }
    },
    "WRECKING_BALL": {
        kanji: "破球",
        kana: "はきゅう",
        romaji: "hakyuu",
        english: "Wrecking Ball",
        description: "Orbits and explodes",
        color: "#777777", // Iron/steel gray color
        hoverColor: 0x555555,
        onAcquire: function () {
            window.activateWreckingBall();
        }
    },
    "GOLD_FORTRESS": {
        kanji: "金城",
        kana: "きんじょう",
        romaji: "kinjou",
        english: "Gold Fortress",
        description: "-1 POW / -1 AGI / -1 LUK / +4 END",
        color: "#FFD700",        // Gold
        hoverColor: 0xB8860B,     // DarkGoldenRod (or 0xCCA700 if you prefer that shade)
        onAcquire: function () {
            window.modifyStat('damage', -1);    // -1 POW
            window.modifyStat('fireRate', -1);  // -1 AGI
            window.modifyStat('luck', -1);      // -1 LUK
            window.modifyStat('health', 4);     // +4 END
        }
    },
    "LASER_CANNON": {
        kanji: "光線砲",
        kana: "こうせんほう",
        romaji: "kousenpou",
        english: "Laser Cannon",
        description: "Charges up and fires a devastating laser beam",
        color: "#00FFFF",
        hoverColor: 0x00DDDD,
        onAcquire: function () {
            window.activateLaserBlast();
        }
    },
    "EYE_BEAM": {
        kanji: "眼光線",
        kana: "がんこうせん",
        romaji: "gankousen",
        english: "Eye Beam",
        description: "Fast charging precision beam with devastating single strike",
        color: "#FF0000",
        hoverColor: 0xCC0000,
        onAcquire: function () {
            window.activateEyeBeam();
        }
    },
    "DENIAL_OF_FATE": {
        kanji: "運命否定",
        kana: "うんめいひてい",
        romaji: "unmeihitei",
        english: "Denial of Fate",
        description: "+2 POW / +2 AGI / -3 LUK",
        color: "#ff6600", // Orange-red color
        hoverColor: 0xdd4400,
        onAcquire: function () {
            window.modifyStat('damage', 2);
            window.modifyStat('fireRate', 2);
            window.modifyStat('luck', -3);
        }
    },
    "AMBER_BEETLE": {
        kanji: "琥珀甲虫",
        kana: "こはくこうちゅう",
        romaji: "kohakukouchuu",
        english: "Amber Beetle",
        description: "Drops projectiles that damage enemies",
        color: "#ffbf00",
        hoverColor: 0xbb8c00,
        onAcquire: function () {
            window.activateLandmines();
        }
    },
    "SNIPER_FAIRY": {
        kanji: "狙撃精", // Changed from "狙" to "狙撃精" (Sniper Fairy)
        kana: "そげきせい", // Changed from "ねらう" to "そげきせい"
        romaji: "sogeikisei", // Changed from "nerau" to "sogeikisei"
        english: "Sniper Fairy",
        description: "A fairy with slow but powerful long range shots",
        color: "#FF55AA",
        hoverColor: 0xDD3388,
        onAcquire: function () {
            window.activateSniperFairy();
        }
    },
    "WILD_FAIRY": {
        kanji: "野妖精",
        kana: "のようせい",
        romaji: "noyousei",
        english: "Wild Fairy",
        description: "Erratic fairy orbits at high speed and damages enemies",
        color: "#FF66CC", // Bright pink color
        hoverColor: 0xDD44AA,
        onAcquire: function () {
            window.activateWildFairy();
            window.modifyStat('luck', 1);
        }
    },
    "ANGEL_HONEY": {
        kanji: "天蜜",
        kana: "てんみつ",
        romaji: "tenmitsu",
        english: "Angel Honey",
        description: "Periodically spawns honey for a heal",
        color: "#00CC00", // Green color
        hoverColor: 0x00AA00,
        onAcquire: function () {
            // The component is added through PlayerPerkRegistry
        }
    },

    // Food perks that increase max HP and heal the player
    "SUSHI": {
        kanji: "寿司",
        kana: "すし",
        romaji: "sushi",
        english: "Sushi",
        description: "+1 END, full heal",
        color: "#FFFFFF",
        hoverColor: 0xE0E0E0,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },
    "RAMEN": {
        kanji: "拉麺",
        kana: "ラーメン",
        romaji: "raamen",
        english: "Ramen",
        description: "+1 END and temporary shield",
        color: "#FFA07A",
        hoverColor: 0xDD8866,
        onAcquire: function () {
            window.modifyStat('health', 1);
            ShieldSystem.activateShield();
        }
    },
    "ONIGIRI": {
        kanji: "御握り",
        kana: "おにぎり",
        romaji: "onigiri",
        english: "Rice Ball",
        description: "+1 END and fully heals",
        color: "#F5F5DC",
        hoverColor: 0xE5E5CC,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },
    "MOCHI": {
        kanji: "餅",
        kana: "もち",
        romaji: "mochi",
        english: "Rice Cake",
        description: "+1 END and fully heals",
        color: "#FFE4E1",
        hoverColor: 0xEED4D1,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },
    "DANGO": {
        kanji: "団子",
        kana: "だんご",
        romaji: "dango",
        english: "Dumpling",
        description: "+1 END and fully heals",
        color: "#F0E68C",
        hoverColor: 0xE0D67C,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },
    "TEMPURA": {
        kanji: "天ぷら",
        kana: "てんぷら",
        romaji: "tenpura",
        english: "Tempura",
        description: "+1 END and fully heals",
        color: "#FFD700",
        hoverColor: 0xEEC700,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },
    "UDON": {
        kanji: "饂飩",
        kana: "うどん",
        romaji: "udon",
        english: "Udon Noodles",
        description: "+1 END and fully heals",
        color: "#FAEBD7",
        hoverColor: 0xEADBc7,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },
    "YAKITORI": {
        kanji: "焼鳥",
        kana: "やきとり",
        romaji: "yakitori",
        english: "Grilled Chicken",
        description: "+1 END and fully heals",
        color: "#CD853F",
        hoverColor: 0xBD752F,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },
    "TAKOYAKI": {
        kanji: "蛸焼き",
        kana: "たこやき",
        romaji: "takoyaki",
        english: "Octopus Balls",
        description: "+1 END and fully heals",
        color: "#8B4513",
        hoverColor: 0x7B3503,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },
    "GYOZA": {
        kanji: "餃子",
        kana: "ぎょうざ",
        romaji: "gyouza",
        english: "Dumplings",
        description: "+1 END and fully heals",
        color: "#D3D3D3",
        hoverColor: 0xC3C3C3,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },
    "TAIYAKI": {
        kanji: "鯛焼き",
        kana: "たいやき",
        romaji: "taiyaki",
        english: "Fish-shaped Cake",
        description: "+1 END and fully heals",
        color: "#DEB887",
        hoverColor: 0xCEA877,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },
    "BENTO": {
        kanji: "弁当",
        kana: "べんとう",
        romaji: "bentou",
        english: "Lunch Box",
        description: "+1 END and fully heals",
        color: "#FF6347",
        hoverColor: 0xEF5337,
        onAcquire: function () {
            window.modifyStat('health', 1);
            window.fullHeal();
        }
    },
    "GREEN_VENOM": {
        kanji: "緑毒",
        kana: "みどりどく",
        romaji: "midoridoku",
        english: "Green Venom",
        description: "Poisonous projectiles deal damage over time",
        color: "#2aad27",
        hoverColor: 0x1a8d17,
        onAcquire: function () {
        }
    },
    "AZURE_FORK": {
        kanji: "蒼の叉",
        kana: "あおのまた",
        romaji: "aonomata",
        english: "Azure Fork",
        description: "Chance to split in two when hitting enemies",
        color: "#1E90FF",
        hoverColor: 0x0070DD,
        onAcquire: function () {
            //
        }
    },
    "POISON_FLOWER": {
        kanji: "毒花",
        kana: "どくばな",
        romaji: "dokubana",
        english: "Poison Flower",
        description: "Flower pulses poison, damaging enemies over time",
        color: "#2aad27", // Green color matching the poison effect
        hoverColor: 0x1a8d17,
        onAcquire: function () {
            window.activatePoisonFlower();
        }
    },
    "COLD_FLOWER": {
        kanji: "冷花",
        kana: "れいばな",
        romaji: "reibana",
        english: "Frost Flower",
        description: "Flower slows down enemies",
        color: "#00ffff", // Cyan color matching the slow effect
        hoverColor: 0x00dddd,
        onAcquire: function () {
            window.activateColdFlower();
        }
    },
    "BRIGHT_LANCE": {
        kanji: "光槍",
        kana: "こうそう",
        romaji: "kousou",
        english: "Bright Lance",
        description: "A glowing lance that follows your movement direction",
        color: "#FFFF33", // Bright yellow color
        hoverColor: 0xDDDD00,
        onAcquire: function () {
            window.activateBrightLance();
        }
    },
    "LAVA_FAIRIES": {
        kanji: "溶岩精",
        kana: "ようがんせい",
        romaji: "yougansei",
        english: "Lava Fairies",
        description: "On death, they drop magma that damages enemies",
        color: "#FF6600", // Orange-red color for lava
        hoverColor: 0xDD4400,
        onAcquire: function () {
            window.activateLavaFairies();
        }
    },
    "TOXIC_TRAIL": {
        kanji: "毒痕",
        kana: "どくあと",
        romaji: "dokuato",
        english: "Toxic Trail",
        description: "A path of shared sickness. -2 END",
        color: "#33cc33", // Green color for poison
        hoverColor: 0x22aa22, // Darker green for hover effect
        onAcquire: function () {
            window.activateToxicTrail();
            window.modifyStat('health', -2);
        }
    },
    "FINGER_OF_DECAY": {
        kanji: "朽指",
        kana: "くちゆび",
        romaji: "kuchiyubi",
        english: "Finger of Decay",
        description: "Point and deal poison",
        color: "#88AA22", // Sickly greenish-yellow color
        hoverColor: 0x668800,
        onAcquire: function () {
            window.activateFingerOfDecay();
        }
    },
    "STORM_CALLER": {
        kanji: "雷神",
        kana: "らいじん",
        romaji: "raijin",
        english: "Storm Caller",
        description: "Lightning strikes your enemies",
        color: "#FFDD00", // Bright yellow color
        hoverColor: 0xDDBB00,
        onAcquire: function () {
            window.activateStormCaller();
        }
    },
    "STORM_BRINGER": {
        kanji: "雷招",
        kana: "らいまねき",
        romaji: "raimaneki",
        english: "Storm Bringer",
        description: "Beacons bring down lightning",
        color: "#00DDFF", // Bright cyan color
        hoverColor: 0x00BBDD,
        onAcquire: function () {

        }
    },
    "STORM_VENGEANCE": {
        kanji: "雷怨",
        kana: "らいえん",
        romaji: "raien",
        english: "Storm Vengeance",
        description: "Lightning strikes back after a hit",
        color: "#FFAAFF", // Pinkish lightning color
        hoverColor: 0xDD88DD,
        onAcquire: function () {
            // The effect is handled by the OnHitEffectSystem
            // No additional implementation needed here
        }
    },
    "SCARLET_EMBER": {
        kanji: "緋炎",
        kana: "ひえん",
        romaji: "hien",
        english: "Scarlet Ember",
        description: "Fires burn enemies over time",
        color: "#FF4500",
        hoverColor: 0xCC3700,
        onAcquire: function () {
            //
        }
    },

    // Red animal perks (damage focused)
    "RED_TIGER": {
        kanji: "赤虎",
        kana: "あかとら",
        romaji: "akatora",
        english: "Red Tiger",
        description: "+1 POW",
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 1);
        }
    },
    "RED_HAWK": {
        kanji: "赤鷹",
        kana: "あかたか",
        romaji: "akataka",
        english: "Red Hawk",
        description: "+1 POW / +1 AGI",
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 1);
            window.modifyStat('fireRate', 1);
        }
    },
    "RED_BEAR": {
        kanji: "赤熊",
        kana: "あかくま",
        romaji: "akakuma",
        english: "Red Bear",
        description: "+2 POW / -1 AGI",
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 2);
            window.modifyStat('fireRate', -1);
        }
    },
    "RED_SCORPION": {
        kanji: "赤蠍",
        kana: "あかさそり",
        romaji: "akasasori",
        english: "Red Scorpion",
        description: "+2 POW / -1 LUK",
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 2);
            window.modifyStat('luck', -1);
        }
    },
    "RED_FOX": {
        kanji: "赤狐",
        kana: "あかきつね",
        romaji: "akakitsune",
        english: "Red Fox",
        description: "+1 POW / +1 LUK",
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 1);
            window.modifyStat('luck', 1);
        }
    },
    "RED_WOLF": {
        kanji: "赤狼",
        kana: "あかおおかみ",
        romaji: "akaookami",
        english: "Red Wolf",
        description: "+1 POW",
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 1);
        }
    },
    "RED_SNAKE": {
        kanji: "赤蛇",
        kana: "あかへび",
        romaji: "akahebi",
        english: "Red Snake",
        description: "+1 POW",
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 1);
        }
    },
    "RED_MANTIS": {
        kanji: "赤蟷螂",
        kana: "あかかまきり",
        romaji: "akakamakiri",
        english: "Red Mantis",
        description: "+1 POW",
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 1);
        }
    },
    "RED_LION": {
        kanji: "赤獅子",
        kana: "あかしし",
        romaji: "akashishi",
        english: "Red Lion",
        description: "+1 POW",
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 1);
        }
    },
    "RED_FALCON": {
        kanji: "赤隼",
        kana: "あかはやぶさ",
        romaji: "akahayabusa",
        english: "Red Falcon",
        description: "+1 POW",
        color: "#ff3333",
        hoverColor: 0xbb2222,
        onAcquire: function () {
            window.modifyStat('damage', 1);
        }
    },

    // Yellow animal perks (fire rate focused)
    "YELLOW_CHEETAH": {
        kanji: "黄豹",
        kana: "きひょう",
        romaji: "kihyou",
        english: "Yellow Cheetah",
        description: "+1 AGI",
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },
    "YELLOW_HUMMINGBIRD": {
        kanji: "黄蜂鳥",
        kana: "きはちどり",
        romaji: "kihachidori",
        english: "Yellow Hummingbird",
        description: "+4 AGI / -2 POW",
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 4);
            window.modifyStat('damage', -2);
        }
    },
    "YELLOW_WASP": {
        kanji: "黄蜂",
        kana: "きばち",
        romaji: "kibachi",
        english: "Yellow Wasp",
        description: "+3 AGI / -2 END",
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 3);
            window.modifyStat('health', -2);
        }
    },
    "YELLOW_JACKAL": {
        kanji: "黄豺",
        kana: "きやまいぬ",
        romaji: "kiyamainu",
        english: "Yellow Jackal",
        description: "+3 AGI / -1 POW / -1 END",
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 3);
            window.modifyStat('damage', -1);
            window.modifyStat('health', -1);
        }
    },
    "YELLOW_CANARY": {
        kanji: "黄鳥",
        kana: "きどり",
        romaji: "kidori",
        english: "Yellow Canary",
        description: "+1 AGI",
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },
    "YELLOW_HORNET": {
        kanji: "黄雀蜂",
        kana: "きすずめばち",
        romaji: "kisuzumebachi",
        english: "Yellow Hornet",
        description: "+1 AGI",
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },
    "YELLOW_BEE": {
        kanji: "黄蜜蜂",
        kana: "きみつばち",
        romaji: "kimitsubachi",
        english: "Yellow Bee",
        description: "+1 AGI",
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },
    "YELLOW_FINCH": {
        kanji: "黄雀",
        kana: "きひわ",
        romaji: "kihiwa",
        english: "Yellow Finch",
        description: "+1 AGI",
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },
    "YELLOW_SQUIRREL": {
        kanji: "黄栗鼠",
        kana: "きりす",
        romaji: "kirisu",
        english: "Yellow Squirrel",
        description: "+1 AGI",
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },
    "YELLOW_CICADA": {
        kanji: "黄蝉",
        kana: "きせみ",
        romaji: "kisemi",
        english: "Yellow Cicada",
        description: "+1 AGI",
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },
    "YELLOW_CRICKET": {
        kanji: "黄蟋蟀",
        kana: "きこおろぎ",
        romaji: "kikoorogi",
        english: "Yellow Cricket",
        description: "+1 AGI",
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },

    // Purple animal perks (luck focused)
    "PURPLE_MONKEY": {
        kanji: "紫猿",
        kana: "むらさきざる",
        romaji: "murasakizaru",
        english: "Purple Monkey",
        description: "+1 LUK",
        color: "#9370db",
        hoverColor: 0x7350bb,
        onAcquire: function () {
            window.modifyStat('luck', 1);
        }
    },
    "PURPLE_CAT": {
        kanji: "紫猫",
        kana: "むらさきねこ",
        romaji: "murasakineko",
        english: "Purple Cat",
        description: "+1 LUK",
        color: "#9370db",
        hoverColor: 0x7350bb,
        onAcquire: function () {
            window.modifyStat('luck', 1);
        }
    },
    "PURPLE_BUTTERFLY": {
        kanji: "紫蝶",
        kana: "むらさきちょう",
        romaji: "murasakichou",
        english: "Purple Butterfly",
        description: "+1 LUK",
        color: "#9370db",
        hoverColor: 0x7350bb,
        onAcquire: function () {
            window.modifyStat('luck', 1);
        }
    },
    "PURPLE_RABBIT": {
        kanji: "紫兎",
        kana: "むらさきうさぎ",
        romaji: "murasakiusagi",
        english: "Purple Rabbit",
        description: "+2 LUK / -1 END",
        color: "#9370db",
        hoverColor: 0x7350bb,
        onAcquire: function () {
            window.modifyStat('luck', 2);
            window.modifyStat('health', -1);
        }
    },
    "PURPLE_OWL": {
        kanji: "紫梟",
        kana: "むらさきふくろう",
        romaji: "murasakifukurou",
        english: "Purple Owl",
        description: "+1 LUK",
        color: "#9370db",
        hoverColor: 0x7350bb,
        onAcquire: function () {
            window.modifyStat('luck', 1);
        }
    },
    "PURPLE_FOX": {
        kanji: "紫狐",
        kana: "むらさききつね",
        romaji: "murasakikitsune",
        english: "Purple Fox",
        description: "+3 LUK / -1 POW / -1 AGI",
        color: "#9370db",
        hoverColor: 0x7350bb,
        onAcquire: function () {
            window.modifyStat('luck', 3);
            window.modifyStat('damage', -1);
            window.modifyStat('fireRate', -1);
        }
    },
    "PURPLE_LADYBUG": {
        kanji: "紫瓢虫",
        kana: "むらさきてんとうむし",
        romaji: "murasakitentoumushi",
        english: "Purple Ladybug",
        description: "+1 LUK",
        color: "#9370db",
        hoverColor: 0x7350bb,
        onAcquire: function () {
            window.modifyStat('luck', 1);
        }
    },
    "PURPLE_BAT": {
        kanji: "紫蝙蝠",
        kana: "むらさきこうもり",
        romaji: "murasakikoumori",
        english: "Purple Bat",
        description: "+1 LUK",
        color: "#9370db",
        hoverColor: 0x7350bb,
        onAcquire: function () {
            window.modifyStat('luck', 1);
        }
    },
    "PURPLE_HARE": {
        kanji: "紫野兎",
        kana: "むらさきのうさぎ",
        romaji: "murasakinousagi",
        english: "Purple Hare",
        description: "+1 LUK",
        color: "#9370db",
        hoverColor: 0x7350bb,
        onAcquire: function () {
            window.modifyStat('luck', 1);
        }
    },
    "PURPLE_MOTH": {
        kanji: "紫蛾",
        kana: "むらさきが",
        romaji: "murasakiga",
        english: "Purple Moth",
        description: "+1 LUK",
        color: "#9370db",
        hoverColor: 0x7350bb,
        onAcquire: function () {
            window.modifyStat('luck', 1);
        }
    },
    "PIERCING_SHOTS": {
        kanji: "貫通",
        kana: "かんつう",
        romaji: "kantsuu",
        english: "Piercing Shot",
        description: "Pierce through enemies",
        color: "#00ff88",
        hoverColor: 0x00cc66,
        onAcquire: function () {
        }
    },
    "YELLOW_BOOMERANG": {
        kanji: "黄回",
        kana: "きかい",
        romaji: "kikai",
        english: "Yellow Boomerang",
        description: "What goes around comes around",
        color: "#FFA500", // Orange color
        hoverColor: 0xDD8800,
        onAcquire: function () {
        }
    },
    "FINAL_CATASTROPHE": {
        kanji: "終焉",
        kana: "しゅうえん",
        romaji: "shuuen",
        english: "Final Catastrophe",
        description: "One-time massive damage to all enemies",
        color: "#FF3300", // Bright red-orange
        hoverColor: 0xCC2200,
        onAcquire: function () {
            window.triggerOneTimeEffect('shuuen');
        }
    },
    "PURPLE_CHAOS": {
        kanji: "紫混沌",
        kana: "むらさきこんとん",
        romaji: "murasakikonton",
        english: "Purple Chaos",
        description: "Randomly rearranges all your stats, then +2 LUK",
        color: "#9932cc",
        hoverColor: 0x8822bc,
        onAcquire: function () {
            window.triggerOneTimeEffect('purpleChaos');
        }
    },
    "ANGER_RISING": {
        kanji: "怒上昇",
        kana: "いかりじょうしょう",
        romaji: "ikarijoushou",
        english: "Anger Rising",
        description: "Get hit, deal more damage (+10%, up to +100%)",
        color: "#FF4500", // Orange-red
        hoverColor: 0xDD3300,
        onAcquire: function () {
            // The effect is handled by the OnHitEffectSystem
        }
    },
    "ALIEN_MUSHROOM": {
        kanji: "異菇",
        kana: "いきのこ",
        romaji: "ikinoko",
        english: "Alien Mushroom",
        description: "+1 to all stats and a brief time dilation",
        color: "#9966FF", // Purple-blue color
        hoverColor: 0x7744DD,
        onAcquire: function () {
            // +1 to all stats
            window.modifyStat('damage', 1);
            window.modifyStat('fireRate', 1);
            window.modifyStat('luck', 1);
            window.modifyStat('health', 1);

            // Activate time dilation once (if available)
            if (window.TimeDilationSystem && window.activateTimeDilation) {
                window.activateTimeDilation(2000); // 4 seconds of time dilation (2s / 50%)
            }
        }
    },
    "MAGMA_FLOOR": {
        kanji: "熔地",
        kana: "ようち",
        romaji: "youchi",
        english: "Magma Floor",
        description: "Creates pools of magma that damage enemies",
        color: "#FF4400", // Orange-red color
        hoverColor: 0xDD2200,
        onAcquire: function () {
            window.activateMagmaFloor();
        }
    },
    "FROST_SHRAPNEL": {
        kanji: "氷片",
        kana: "ひょうへん",
        romaji: "hyouhen",
        english: "Frost Shrapnel",
        description: "Regularly drops ice shards that damage and slow enemies",
        color: "#00FFFF", // Cyan color
        hoverColor: 0x00DDDD,
        onAcquire: function () {
            window.activateFrostShrapnel();
        }
    },
    "OBLIVION_BLOSSOM": {
        kanji: "忘却の花",
        kana: "ぼうきゃくのはな",
        romaji: "boukyakunohana",
        english: "Oblivion Blossom",
        description: "Sacrifice all your perks, +2 STAT from each memory lost",
        color: "#BBBBFF", // Light purple/blue color
        hoverColor: 0x9999DD,
        onAcquire: function () {
            window.triggerOneTimeEffect('oblivionBlossom');
        }
    },
    "COPY_FAIRY": {
        kanji: "写精",
        kana: "うつしせい",
        romaji: "utsushisei",
        english: "Copy Fairy",
        description: "Your biggest fan",
        color: "#55FFAA", // Greenish color
        hoverColor: 0x33DD88,
        onAcquire: function () {
            window.activateCopyFairy();
        }
    },
    "FUN_FAIRY": {
        kanji: "遊精",
        kana: "ゆうせい",
        romaji: "yuusei",
        english: "Fun Fairy",
        description: "Tricky friend",
        color: "#FF55FF", // Pink color
        hoverColor: 0xDD33DD,
        onAcquire: function () {
            window.activateFunFairy();
        }
    },
    "COLD_FAIRY": {
        kanji: "冷精",
        kana: "れいせい",
        romaji: "reisei",
        english: "Cold Fairy",
        description: "Friend with slow shots",
        color: "#00FFFF", // Cyan color
        hoverColor: 0x00DDDD,
        onAcquire: function () {
            window.activateColdFairy();
        }
    },
    "BERSERK_FAIRY": {
        kanji: "狂精",
        kana: "きょうせい",
        romaji: "kyousei",
        english: "Berserk Fairy",
        description: "Wild partner",
        color: "#FF5500", // Orange-red color
        hoverColor: 0xDD3300,
        onAcquire: function () {
            window.activateBerserkFairy();
        }
    },
    "FLAWLESS_FIGHT": {
        kanji: "完璧",
        kana: "かんぺき",
        romaji: "kanpeki",
        english: "Flawless Fight",
        description: "+POW/+AGI while not hit (+5%, up to +50%)",
        color: "#00FFFF", // Cyan color
        hoverColor: 0x00DDDD,
        onAcquire: function () {
            // The component is added through OnHitPerkRegistry
            // Nothing specific needed here as the registration is handled in onhit.js
        }
    },
    "COMET": {
        kanji: "彗星",
        kana: "すいせい",
        romaji: "suisei",
        english: "Comet",
        description: "Comets spiral outward, lifespan scales with LUK",
        color: "#ffff00", // Standard yellow color
        hoverColor: 0xdddd00,
        onAcquire: function () {
            window.activateComet();
        }
    },
    "INVERTED_COMET": {
        kanji: "逆彗星",
        kana: "ぎゃくすいせい",
        romaji: "gyakusuisei",
        english: "Inverted Comet",
        description: "Comets spiral outward counterclockwise, lifespan scales with LUK",
        color: "#ffff00", // Standard yellow color
        hoverColor: 0xdddd00,
        onAcquire: function () {
            window.activateInvertedComet();
        }
    },
    "SHOOTING_STAR": {
        kanji: "流星",
        kana: "りゅうせい",
        romaji: "ryuusei",
        english: "Shooting Star",
        description: "Periodically fires star projectiles in random directions",
        color: "#ffff00",
        hoverColor: 0xdddd00,
        onAcquire: function () {
            window.activateShootingStar();
        }
    },
    "METEOR": {
        kanji: "隕石",
        kana: "いんせき",
        romaji: "inseki",
        english: "Meteor",
        description: "Periodically fires powerful meteors in random directions",
        color: "#ffff00",
        hoverColor: 0xdddd00,
        onAcquire: function () {
            window.activateMeteor();
        }
    },
    "DECELERATING_BULLET": {
        kanji: "減速弾",
        kana: "げんそくだん",
        romaji: "gensokudan",
        english: "Decelerating Bullet",
        description: "Projectiles slow down over time, deal 2x damage",
        color: "#8A2BE2", // Blue-violet color
        hoverColor: 0x6A1BA2,
        onAcquire: function () {
            // Logic handled by ProjectilePerkRegistry
        }
    },
    "GOLDEN_AGE": {
        kanji: "全盛期",
        kana: "ぜんせいき",
        romaji: "zenseiki",
        english: "Golden Age",
        description: "Spawns a golden ball you can push into enemies",
        color: "#ffff00", // Gold/yellow color
        hoverColor: 0xdddd00,
        onAcquire: function () {
            window.activateGoldenAge();
        }
    },
    "GREEN_DEER": {
        kanji: "緑鹿",
        kana: "みどりしか",
        romaji: "midorishika",
        english: "Green Deer",
        description: "+2 END",
        color: "#00cc66",
        hoverColor: 0x00aa44,
        onAcquire: function () {
            window.modifyStat('health', 2);
        }
    },
    "GREEN_FROG": {
        kanji: "緑蛙",
        kana: "みどりかえる",
        romaji: "midorikaeru",
        english: "Green Frog",
        description: "+1 POW",
        color: "#00cc66",
        hoverColor: 0x00aa44,
        onAcquire: function () {
            window.modifyStat('damage', 1);
        }
    },
    "GREEN_GAZELLE": {
        kanji: "緑ガゼル",
        kana: "みどりガゼル",
        romaji: "midorigazeru",
        english: "Green Gazelle",
        description: "+2 AGI / -1 END",
        color: "#00cc66",
        hoverColor: 0x00aa44,
        onAcquire: function () {
            window.modifyStat('fireRate', 2);
            window.modifyStat('health', -1);
        }
    },
    "GREEN_HORSE": {
        kanji: "緑馬",
        kana: "みどりうま",
        romaji: "midoriuma",
        english: "Green Horse",
        description: "+3 AGI / -1 POW",
        color: "#00cc66",
        hoverColor: 0x00aa44,
        onAcquire: function () {
            window.modifyStat('fireRate', 3);
            window.modifyStat('damage', -1);
        }
    },
    "GREEN_CRICKET": {
        kanji: "緑蟋蟀",
        kana: "みどりこおろぎ",
        romaji: "midorikoorogi",
        english: "Green Cricket",
        description: "+1 LUK",
        color: "#00cc66",
        hoverColor: 0x00aa44,
        onAcquire: function () {
            window.modifyStat('luck', 1);
        }
    },
    "GREEN_RABBIT": {
        kanji: "緑兎",
        kana: "みどりうさぎ",
        romaji: "midoriusagi",
        english: "Green Rabbit",
        description: "+2 LUK / -1 AGI",
        color: "#00cc66",
        hoverColor: 0x00aa44,
        onAcquire: function () {
            window.modifyStat('luck', 2);
            window.modifyStat('fireRate', -1);
        }
    },
    "GREEN_LIZARD": {
        kanji: "緑蜥蜴",
        kana: "みどりとかげ",
        romaji: "midoritokage",
        english: "Green Lizard",
        description: "+1 AGI",
        color: "#00cc66",
        hoverColor: 0x00aa44,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },
    "GREEN_HUMMINGBIRD": {
        kanji: "緑蜂鳥",
        kana: "みどりはちどり",
        romaji: "midorihachidori",
        english: "Green Hummingbird",
        description: "+1 AGI / +1 POW",
        color: "#00cc66",
        hoverColor: 0x00aa44,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
            window.modifyStat('damage', 1);
        }
    },
    "GREEN_DOLPHIN": {
        kanji: "緑海豚",
        kana: "みどりいるか",
        romaji: "midoriiruka",
        english: "Green Dolphin",
        description: "+2 AGI / -1 END",
        color: "#00cc66",
        hoverColor: 0x00aa44,
        onAcquire: function () {
            window.modifyStat('fireRate', 2);
            window.modifyStat('health', -1);
        }
    },
    "GREEN_GRASSHOPPER": {
        kanji: "緑飛蝗",
        kana: "みどりばった",
        romaji: "midoribatta",
        english: "Green Grasshopper",
        description: "+1 AGI / +1 LUK",
        color: "#00cc66",
        hoverColor: 0x00aa44,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
            window.modifyStat('luck', 1);
        }
    },
    "GREEN_SNAKE": {
        kanji: "緑蛇",
        kana: "みどりへび",
        romaji: "midorihebi",
        english: "Green Snake",
        description: "+1 AGI",
        color: "#00cc66",
        hoverColor: 0x00aa44,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },
    "GREEN_DREAM": {
        kanji: "緑の夢",
        kana: "みどりのゆめ",
        romaji: "midorinoyume",
        english: "Green Dream",
        description: "Creates after-images that damage enemies",
        color: "#00cc66",
        hoverColor: 0x00aa44,
        onAcquire: function () {
            window.activateAfterImages();
        }
    },
    "PURPLE_OWL": {
        kanji: "紫梟",
        kana: "むらさきふくろう",
        romaji: "murasakifukurou",
        english: "Purple Owl",
        description: "Chance to fire a second projectile",
        color: "#9370db",
        hoverColor: 0x7350bb,
        onAcquire: function () {
            // logic in index.html
        }
    },
    "DOG_PYRAMID": {
        kanji: "犬金字塔",
        kana: "いぬきんじとう",
        romaji: "inukinjitou",
        english: "Dog Pyramid",
        description: "+2 POW / -4 AGI / +2 LUK / +2 END",
        color: "#FFD700",
        hoverColor: 0xB8860B,
        onAcquire: function () {
            window.modifyStat('damage', 2);
            window.modifyStat('fireRate', -4);
            window.modifyStat('luck', 2);
            window.modifyStat('health', 2);
        }
    },
    "CAT_PYRAMID": {
        kanji: "猫金字塔",
        kana: "ねこきんじとう",
        romaji: "nekokinjitou",
        english: "Cat Pyramid",
        description: "+2 POW / +2 AGI / +2 LUK / -4 END",
        color: "#FFD700",
        hoverColor: 0xB8860B,
        onAcquire: function () {
            window.modifyStat('damage', 2);
            window.modifyStat('fireRate', 2);
            window.modifyStat('luck', 2);
            window.modifyStat('health', -4);
        }
    },
    "BIRD_PYRAMID": {
        kanji: "鳥金字塔",
        kana: "とりきんじとう",
        romaji: "torikinjitou",
        english: "Bird Pyramid",
        description: "-4 POW / +2 AGI / +2 LUK / +2 END",
        color: "#FFD700",
        hoverColor: 0xB8860B,
        onAcquire: function () {
            window.modifyStat('damage', -4);
            window.modifyStat('fireRate', 2);
            window.modifyStat('luck', 2);
            window.modifyStat('health', 2);
        }
    },
    "FISH_PYRAMID": {
        kanji: "魚金字塔",
        kana: "さかなきんじとう",
        romaji: "sakanakinjitou",
        english: "Fish Pyramid",
        description: "+2 POW / +2 AGI / -4 LUK / +2 END",
        color: "#FFD700",
        hoverColor: 0xB8860B,
        onAcquire: function () {
            window.modifyStat('damage', 2);
            window.modifyStat('fireRate', 2);
            window.modifyStat('luck', -4);
            window.modifyStat('health', 2);
        }
    },
    "ALIEN_WORLD": {
        kanji: "異世界",
        kana: "いせかい",
        romaji: "isekai",
        english: "Alien World",
        description: "When hit, the streams of time shift",
        color: "#00ffff", // Cyan color
        hoverColor: 0x00dddd,
        onAcquire: function () {
            // The effect is handled by the OnHitEffectSystem
        }
    },
    "ALIEN_CLOCK": {
        kanji: "時の砂",
        kana: "ときのすな",
        romaji: "tokinosuna",
        english: "Alien Clock",
        description: "Time moves differently on pickup",
        color: "#00ffff", // Cyan color like ALIEN_WORLD
        hoverColor: 0x00dddd,
        onAcquire: function () {
        }
    },
    "PURPLE_HEDGEHOG": {
        kanji: "紫針鼠",
        kana: "むらさきはりねずみ",
        romaji: "murasakiharinezumi",
        english: "Purple Hedgehog",
        description: "Release projectiles in all directions when hit",
        color: "#9370db",
        hoverColor: 0x7350bb,
        onAcquire: function () {
            window.modifyStat('health', 1);
        }
    },
    "CRIMSON_SCATTER": {
        kanji: "紅散弾",
        kana: "べにさんだん",
        romaji: "benisandan",
        english: "Crimson Scatter",
        description: "Higher damage at short range, lower dmg at long rng",
        color: "#FF3030",
        hoverColor: 0xC02020,
        onAcquire: function () {
        }
    },
    "CRIMSON_FURY": {
        kanji: "紅の怒り",
        kana: "くれないのいかり",
        romaji: "kurenainoikari",
        english: "Crimson Fury",
        description: "Double damage when below 25% health",
        color: "#FF0000",
        hoverColor: 0xCC0000,
        onAcquire: function () {
            // The effect is handled by a state monitor system
            // We'll implement this in the update function
        }
    },
    "IMMORTAL_ARM": {
        kanji: "不死の腕",
        kana: "ふしのうで",
        romaji: "fushinoude",
        english: "Immortal Arm",
        description: "Summons an arm that orbits you and damages enemies",
        color: "#9932CC", // A deep purple color
        hoverColor: 0x7922BC,
        onAcquire: function () {
            window.activateImmortalArm();
        }
    },
    "IMMORTAL_HEAD": {
        kanji: "不死の頭",
        kana: "ふしのあたま",
        romaji: "fushinoatama",
        english: "Immortal Head",
        description: "Summons a head that orbits close to you and damages enemies",
        color: "#9932CC", // Deep purple color
        hoverColor: 0x7922BC,
        onAcquire: function () {
            window.activateImmortalHead();
        }
    },
    "IMMORTAL_LEG": {
        kanji: "不死の脚",
        kana: "ふしのあし",
        romaji: "fushinoashi",
        english: "Immortal Leg",
        description: "Summons a leg that orbits far from you and damages enemies",
        color: "#9932CC", // Deep purple color
        hoverColor: 0x7922BC,
        onAcquire: function () {
            window.activateImmortalLeg();
        }
    },
    "GOD_HAMMER": {
        kanji: "神の鎚",
        kana: "かみのつち",
        romaji: "kaminotsuchi",
        english: "God Hammer",
        description: "Periodically drops a divine hammer on enemies",
        color: "#FFD700",
        hoverColor: 0xDAA520,
        onAcquire: function () {
            // component added in hero.js
        }
    },
    "ETERNAL_RHYTHM": {
        kanji: "永遠の律動",
        kana: "えいえんのりつどう",
        romaji: "eiennoritsudou",
        english: "Eternal Rhythm",
        description: "While moving, gradually increases fire rate up to 2x",
        color: "#FFDD00",
        hoverColor: 0xDDBB00,
        onAcquire: function () {
            // The component is added by the PlayerPerkRegistry system
        }
    },
    "AMBER_NOVA": {
        kanji: "琥珀爆",
        kana: "こはくばく",
        romaji: "kohakubaku",
        english: "Amber Nova",
        description: "Projectiles explode on impact, damaging nearby enemies",
        color: "#FF9500", // Amber/orange color
        hoverColor: 0xDD7000,
        onAcquire: function () {
            // Logic is handled by the component system
        }
    },
    "TITAN_STOMP": {
        kanji: "巨踏",
        kana: "きょとう",
        romaji: "kyotou",
        english: "Titan Stomp",
        description: "Chance to create shockwaves around you when firing",
        color: "#8B4513", // Brown color
        hoverColor: 0x6B3503,
        onAcquire: function () {
            // The logic is handled by ProjectilePerkRegistry
        }
    },
    "AZURE_FROST": {
        kanji: "蒼霜",
        kana: "あおしも",
        romaji: "aoshimo",
        english: "Azure Frost",
        description: "Projectiles may slow enemies upon impact",
        color: "#00ffff", // Cyan color
        hoverColor: 0x00dddd,
        onAcquire: function () {
            // The SLOW_SHOT effect is already registered in ballistics.js
            // No additional implementation needed here
        }
    },
    "DIVINE_BEACON": {
        kanji: "天の標",
        kana: "てんのしるべ",
        romaji: "tennoshirube",
        english: "Divine Beacon",
        description: "Heavenly markers summon God Hammers when collected",
        color: "#FFD700",
        hoverColor: 0xDEB887,
        onAcquire: function () {
            // The component is added through PlayerPerkRegistry
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