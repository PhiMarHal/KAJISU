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
        description: "Crimson flames rise\nStrength comes at the cost of speed\nDragon awakens",
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
        description: "Ocean's guardian\nShield of azure protects you\nEndless as the sea",
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
        description: "Death's door opens\nDestiny intervenes now\nOne last chance to live",
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
        description: "Petals unfurling\nDeadly blooms across the field\nBeauty hides sharp thorns",
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
        description: "Eight arms protect you\nGlowing orbs circle your form\nEndless spiraling",
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
        description: "Reverse the current\nContra-rotating stars\nOpposite yet same",
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
        description: "From depths they emerge\nReaching in all directions\nGrasping enemies",
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
        description: "Fragile as crystal\nYet power beyond measure\nBreath catches - one hit",
        color: "#FF0000",
        hoverColor: 0xDD0000,
        onAcquire: function () {
            // Increase POW by 5
            window.modifyStat('damage', 5);

            // Simply use a large negative value, the minimum check will handle it
            window.modifyStat('health', -999);
        }
    },
    "AMBER_BEETLE": {
        kanji: "琥珀甲虫",
        kana: "こはくこうちゅう",
        romaji: "kohakukouchuu",
        english: "Amber Beetle",
        description: "Ancient trapped in gold\nExplosive gifts deployed\nTime-frozen insects",
        color: "#ffbf00",
        hoverColor: 0xbb8c00,
        onAcquire: function () {
            window.activateLandmines();
        }
    },
    "SNIPER_FAIRY": {
        kanji: "狙",
        kana: "ねらう",
        romaji: "nerau",
        english: "Sniper Fairy",
        description: "Tiny marksman aims\nSharp-eyed companion shoots true\nNever misses prey",
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
        description: "Untamed forest sprite\nErratic, swift as the wind\nChaos in orbit",
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
        description: "Heavenly sweetness\nGolden drops heal mortal wounds\nNectar of the gods",
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
        description: "Ocean's gift, perfect\nRice and fish restore your strength\nVital force renewed",
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
        description: "Steaming noodle bowl\nWarm broth shields and restores you\nComfort in chaos",
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
        description: "Triangle of life\nSimple rice heals deepest wounds\nPortable power",
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
        description: "Soft and stretching white\nGlutinous healing sweetness\nStrength in chewy bites",
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
        description: "Three spheres on a stick\nSweet dumplings of restoration\nVitality grows",
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
        description: "Crispy golden clouds\nFried to light perfection now\nHealing in each bite",
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
        description: "Thick noodles swimming\nComforting broth restores strength\nSlurp to full vigor",
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
        description: "Skewered, smoky meat\nChicken grilled to perfection\nRestores lost vitals",
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
        description: "Savory round bites\nOctopus heart of each ball\nWarms and heals your core",
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
        description: "Crescent moon pockets\nFilled with healing energies\nRestores life's fullness",
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
        description: "Sweet fish-shaped pastry\nFilled with healing red bean paste\nSwims through your sorrow",
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
        description: "Compartments of life\nBalance in neat arrangement\nComplete nourishment",
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
        description: "Emerald droplets\nTime ravages foes slowly\nPoison's patient work",
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
        description: "One becomes two paths\nBlue lightning splits asunder\nDouble the damage",
        color: "#1E90FF",
        hoverColor: 0x0070DD,
        onAcquire: function () {
            // The logic for this is handled in the projectileHitEnemy function
        }
    },
    "POISON_FLOWER": {
        kanji: "毒花",
        kana: "どくばな",
        romaji: "dokubana",
        english: "Poison Flower",
        description: "Deadly petals bloom\nToxic pollen fills the air\nSlow pain consumes foes",
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
        description: "Ice blossoms open\nFrost slows enemies' movements\nWinter's cold embrace",
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
        description: "Shaft of pure sunlight\nFollows where your movement leads\nPiercing enemies",
        color: "#FFFF33", // Bright yellow color
        hoverColor: 0xDDDD00,
        onAcquire: function () {
            window.activateBrightLance();
        }
    },
    "TOXIC_TRAIL": {
        kanji: "毒痕",
        kana: "どくあと",
        romaji: "dokuato",
        english: "Toxic Trail",
        description: "Poison footprints left\nSickness spreads - you weaken too\nPain shared with your foes",
        color: "#33cc33", // Green color for poison
        hoverColor: 0x22aa22, // Darker green for hover effect
        onAcquire: function () {
            window.activateToxicTrail();
            window.modifyStat('health', -1);
            window.modifyStat('damage', -1);
            window.modifyStat('fireRate', -1);
            window.modifyStat('luck', -1);
        }
    },
    "STORM_CALLER": {
        kanji: "雷神",
        kana: "らいじん",
        romaji: "raijin",
        english: "Storm Caller",
        description: "Thunder god beckons\nLightning strikes from clear skies\nWrath from above falls",
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
        description: "Beacons call the storm\nGather clouds, invite lightning\nThunder's symphony",
        color: "#00DDFF", // Bright cyan color
        hoverColor: 0x00BBDD,
        onAcquire: function () {
            window.activateStormBringer();
        }
    },
    "STORM_VENGEANCE": {
        kanji: "雷怨",
        kana: "らいえん",
        romaji: "raien",
        english: "Storm Vengeance",
        description: "Pain invites lightning\nWhen struck, skies answer in rage\nRetribution falls",
        color: "#FFAAFF", // Pinkish lightning color
        hoverColor: 0xDD88DD,
        onAcquire: function () {
            // The effect is handled by the OnHitEffectSystem
            // No additional implementation needed here
        }
    },

    /*"AREA_PULSE": {
        kanji: "波動",
        kana: "はどう",
        romaji: "hadou",
        english: "Area Pulse",
        description: "Energy waves ripple\nExpanding rings of power\nEnemies wither",
        color: "#ff00ff", // Magenta color
        hoverColor: 0xdd00dd,
        onAcquire: function () {
            window.activateAreaPulse();
        }
    },*/
    "SCARLET_EMBER": {
        kanji: "緋炎",
        kana: "ひえん",
        romaji: "hien",
        english: "Scarlet Ember",
        description: "Crimson sparks alight\nBurning trails left in your wake\nFlames consume them all",
        color: "#FF4500",
        hoverColor: 0xCC3700,
        onAcquire: function () {
            // Logic handled in projectileHitEnemy
        }
    },

    // Red animal perks (damage focused)
    "RED_TIGER": {
        kanji: "赤虎",
        kana: "あかとら",
        romaji: "akatora",
        english: "Red Tiger",
        description: "Crimson striped fury\nClaws sharpen, strength increases\nPower awakens",
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
        description: "Scarlet wings beating\nSpeed and power in balance\nRaptor takes to sky",
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
        description: "Mighty paws of flame\nStrength outweighs agility\nPowerful yet slow",
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
        description: "Crimson stinger strikes\nVenom potent but luck fades\nBalance of cosmos",
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
        description: "Clever fire trickster\nCombines luck with raw power\nCunning predator",
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
        description: "Scarlet hunter howls\nStrength coursing through blood and bone\nDamage increases",
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
        description: "Ruby scales gleaming\nVenom coursing, power grows\nStrike with more fury",
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
        description: "Crimson prayer hands\nScythes that slice with more power\nPatient predator",
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
        description: "Scarlet king roars loud\nPride strengthens your striking power\nMane of fierce embers",
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
        description: "Crimson wings diving\nTalons sharpen with power\nPrey falls beneath you",
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
        description: "Golden blur racing\nSpeed increases with each step\nFaster than the wind",
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
        description: "Wings beat like lightning\nSpeed at cost of raw power\nBlurred golden dart",
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
        description: "Swift amber stinger\nRapid strikes cost endurance\nSpeed through fragile form",
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 2);
            window.modifyStat('health', -2);
        }
    },
    "YELLOW_JACKAL": {
        kanji: "黄豺",
        kana: "きやまいぬ",
        romaji: "kiyamainu",
        english: "Yellow Jackal",
        description: "Desert trickster howls\nSwift, yet weaker in body\nSpeed over all else",
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
        description: "Small bird sings quickly\nNotes flow faster than before\nWings blur with speed",
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
        description: "Buzzing crescendos\nDanger in each rapid strike\nSpeed of golden wings",
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
        description: "Golden pollen dance\nWings beat faster than before\nSwift honey maker",
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
        description: "Small gold songbird flies\nQuick movements, faster strikes\nNimble little wings",
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },
    "YELLOW_MONGOOSE": {
        kanji: "黄マングース",
        kana: "きマングース",
        romaji: "kimanguusu",
        english: "Yellow Mongoose",
        description: "Swift snake hunter moves\nBlinding speed of paws and teeth\nRate of fire grows",
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
        description: "Quick paws gathering\nDarting movements, faster now\nNuts stored for winter",
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
        description: "Summer's song quickens\nWings vibrate at higher pace\nCeaseless buzzing chant",
        color: "#ffd700",
        hoverColor: 0xcca700,
        onAcquire: function () {
            window.modifyStat('fireRate', 1);
        }
    },
    // Continuing from previous artifact
    "YELLOW_CRICKET": {
        kanji: "黄蟋蟀",
        kana: "きこおろぎ",
        romaji: "kikoorogi",
        english: "Yellow Cricket",
        description: "Night song quickens pace\nLegs rub faster, chirping grows\nRhythm accelerates",
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
        description: "Violet primate grins\nFortune follows playful leaps\nLuck in mischief grows",
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
        description: "Amethyst feline\nLucky whiskers, gleaming eyes\nFortune's silent steps",
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
        description: "Lilac wings flutter\nCarrying fortuitous winds\nLuck rides gentle draft",
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
        description: "Lucky rabbit hops\nBlessed paws, fragile body\nCost of fortune's gift",
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
        description: "Wise eyes see further\nFortune follows midnight flights\nDouble shot may fly",
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
        description: "Fortune's nine tails wave\nLuck soars as speed, strength falter\nCost of mystic gifts",
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
        description: "Spots of fortune shine\nTiny bearer of good luck\nViolet wings take flight",
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
        description: "Echo of fortune\nLilac wings cut through nighttime\nLucky shadows soar",
        color: "#9370db",
        hoverColor: 0x7350bb,
        onAcquire: function () {
            window.modifyStat('luck', 1);
        }
    },
    "PURPLE_CHAMELEON": {
        kanji: "紫カメレオン",
        kana: "むらさきカメレオン",
        romaji: "murasakikamereon",
        english: "Purple Chameleon",
        description: "Fortune shifts color\nSpeed sacrificed for luck's glow\nHidden blessings wait",
        color: "#9370db",
        hoverColor: 0x7350bb,
        onAcquire: function () {
            window.modifyStat('luck', 2);
            window.modifyStat('fireRate', -1);
        }
    },
    "PURPLE_HARE": {
        kanji: "紫野兎",
        kana: "むらさきのうさぎ",
        romaji: "murasakinousagi",
        english: "Purple Hare",
        description: "Wild luck runs swiftly\nAmethyst ears catch good winds\nFortune's grass rustles",
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
        description: "Luck's powder dusts air\nViolet wings drawn to fortune\nDancing in moonlight",
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
        description: "Arrows pierce through flesh\nOne shot finds multiple marks\nBarriers mean naught",
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
        description: "Gold arc flings away\nCompletes its destined circle\nReturns to your hand",
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
        description: "World's end unleashed now\nApocalypse in your hands\nAll foes swept away",
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
        description: "Stats dance, rearranged\nCosmic disorder reshapes\nLuck emerges, grows",
        color: "#9932cc",
        hoverColor: 0x8822bc,
        onAcquire: function () {
            window.triggerOneTimeEffect('purpleChaos');
        }
    },
    "ALIEN_MUSHROOM": {
        kanji: "異菇",
        kana: "いきのこ",
        romaji: "ikinoko",
        english: "Alien Mushroom",
        description: "Strange fungus consumed\nTime slows, all power grows\nCosmic enhancement",
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
        description: "Ground becomes molten\nEarth's blood burns those who tread it\nFiery trap awaits",
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
        description: "Ice shards scatter wide\nFreeze enemies' swift movements\nWinter's sharp embrace",
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
        description: "Memories fade like mist\nEach lost perk gives new power\nForget to grow strong",
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
        description: "Mirror sprite mimics\nWatching closest enemies\nShots echo your own",
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
        description: "Prankster sprite giggles\nUnpredictable magic\nChaos rains as gifts",
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
        description: "Ice spirit dances slow\nFrost coats enemies' movements\nWinter's sharp embrace",
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
        description: "Frenzied sprite screams wild\nDistant orbit, rapid fire\nMadness finds its mark",
        color: "#FF5500", // Orange-red color
        hoverColor: 0xDD3300,
        onAcquire: function () {
            window.activateBerserkFairy();
        }
    },

    // Green animal perks (converted to something else)
    "GREEN_DEER": {
        kanji: "緑鹿",
        kana: "みどりしか",
        romaji: "midorishika",
        english: "Green Deer",
        description: "Forest guardian\nVitality in emerald form\nEndurance doubles",
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
        description: "Small jade amphibian\nPower grows with each spring leap\nStrength in humble form",
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
        description: "Swift emerald runner\nSpeed at cost of vital force\nHurried but fragile",
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
        description: "Jade steed gallops fast\nSpeed surges but strength falters\nRapid yet weaker",
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
        description: "Emerald chirper sings\nFortune grows with each buzzing\nLuck in tiny form",
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
        description: "Verdant lucky hare\nBlessings grow but speed falters\nFortune's slow embrace",
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
        description: "Quick jade reptile moves\nSpeed grows with each darting step\nSwift emerald blur",
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
        description: "Emerald wings blur fast\nSpeed and power in balance\nDual gifts combined",
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
        description: "Jade ocean dancer\nSpeed increases, life lessens\nSwift but now fragile",
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
        description: "Spring legs, lucky leaps\nFortune and speed intertwined\nTwin gifts from nature",
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
        description: "Emerald coils slide\nQuick strikes with forked tongue dart\nSpeed in scales grows",
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
        description: "Fading emerald ghosts\nEchoes of your movements left\nDamage where you walked",
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
        description: "Two shots from one pull\nWisdom multiplies your force\nDouble your damage",
        color: "#9370db",
        hoverColor: 0x7350bb,
        onAcquire: function () {
            // logic in index.html
        }
    },
    "ALIEN_WORLD": {
        kanji: "異世界",
        kana: "いせかい",
        romaji: "isekai",
        english: "Alien World",
        description: "When struck, time slows down\nYou move through frozen moments\nWorld bends to your will",
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
        description: "Time beacons appear\nSand falls through strange hourglasses\nMoments stretch like taffy",
        color: "#00ffff", // Cyan color like ALIEN_WORLD
        hoverColor: 0x00dddd,
        onAcquire: function () {
            // The effect is handled by the PlayerComponentSystem
            window.activateAlienClock();
        }
    },
    "PURPLE_HEDGEHOG": {
        kanji: "紫針鼠",
        kana: "むらさきはりねずみ",
        romaji: "murasakiharinezumi",
        english: "Purple Hedgehog",
        description: "Spines fly when you're struck\nCounterattack in all ways\nPain becomes power",
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
        description: "Close range, deadly force\nDistance weakens crimson shots\nPower near your form",
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
        description: "Near death, rage ignites\nBleeding wounds fuel crimson strength\nDouble your damage",
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
        description: "Severed limb orbits\nDeath denied, still serving you\nEternal guardian",
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
        description: "Deathless skull still thinks\nCircles close, protecting you\nEternally aware",
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
        description: "Undying limb kicks\nWide orbit, distant guardian\nDances past death's reach",
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
        description: "Divine smith's weapon\nHeavy blows from heaven strike\nGods favor your cause",
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
        description: "Movement fuels your pace\nSpeed builds with each step you take\nDancing through battle",
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
        description: "Golden bursts appear\nExplosions where shots impact\nArea damage spreads",
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
        description: "Giant's footsteps shake\nEarth trembles beneath your shots\nShockwaves crush all foes",
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
        description: "Blue ice coats your shots\nEnemies move in slow motion\nFrozen in their tracks",
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
        description: "Heaven's markers shine\nCollect to call divine wrath\nFate guides your journey",
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