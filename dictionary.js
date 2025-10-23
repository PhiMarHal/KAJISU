// dictionary.js - Kanji Dictionary
// Pure data module for kanji characters used throughout the game
// Each kanji can be used as enemies, learning objectives, or other game elements

const KANJI_DICTIONARY = [
    { character: '鬼', kana: 'おに', romaji: 'oni', english: 'Demon' },
    { character: '龍', kana: 'りゅう', romaji: 'ryuu', english: 'Dragon' },
    { character: '蛇', kana: 'へび', romaji: 'hebi', english: 'Snake' },
    { character: '魔', kana: 'ま', romaji: 'ma', english: 'Demon' },
    { character: '死', kana: 'し', romaji: 'shi', english: 'Death' },
    { character: '獣', kana: 'けもの', romaji: 'kemono', english: 'Beast' },
    { character: '骨', kana: 'ほね', romaji: 'hone', english: 'Bone' },
    { character: '影', kana: 'かげ', romaji: 'kage', english: 'Shadow' },
    { character: '鮫', kana: 'さめ', romaji: 'same', english: 'Shark' },
    { character: '妖', kana: 'よう', romaji: 'you', english: 'Bewitching' },
    { character: '霊', kana: 'れい', romaji: 'rei', english: 'Spirit' },
    { character: '怨', kana: 'うらみ', romaji: 'urami', english: 'Grudge' },
    { character: '邪', kana: 'じゃ', romaji: 'ja', english: 'Evil' },
    { character: '呪', kana: 'のろい', romaji: 'noroi', english: 'Curse' },
    { character: '魂', kana: 'たましい', romaji: 'tamashii', english: 'Soul' },
    { character: '闇', kana: 'やみ', romaji: 'yami', english: 'Darkness' },
    { character: '煉', kana: 'れん', romaji: 'ren', english: 'Refine' },
    { character: '殺', kana: 'さつ', romaji: 'satsu', english: 'Kill' },
    { character: '禍', kana: 'わざわい', romaji: 'wazawai', english: 'Calamity' },
    { character: '悪', kana: 'あく', romaji: 'aku', english: 'Evil' },
    { character: '屍', kana: 'しかばね', romaji: 'shikabane', english: 'Corpse' },
    { character: '凶', kana: 'きょう', romaji: 'kyou', english: 'Misfortune' },
    { character: '餓', kana: 'が', romaji: 'ga', english: 'Hunger' },
    { character: '狂', kana: 'きょう', romaji: 'kyou', english: 'Madness' },
    { character: '災', kana: 'わざわい', romaji: 'wazawai', english: 'Disaster' },
    { character: '亡', kana: 'ぼう', romaji: 'bou', english: 'Death' },
    { character: '滅', kana: 'めつ', romaji: 'metsu', english: 'Destruction' },
    { character: '崩', kana: 'ほう', romaji: 'hou', english: 'Collapse' },
    { character: '破', kana: 'は', romaji: 'ha', english: 'Break' },
    { character: '裂', kana: 'れつ', romaji: 'retsu', english: 'Tear' },
    { character: '灰', kana: 'はい', romaji: 'hai', english: 'Ash' },
    { character: '焦', kana: 'しょう', romaji: 'shou', english: 'Scorch' },
    { character: '血', kana: 'ち', romaji: 'chi', english: 'Blood' },
    { character: '斬', kana: 'ざん', romaji: 'zan', english: 'Slash' },
    { character: '刺', kana: 'し', romaji: 'shi', english: 'Stab' },
    { character: '砕', kana: 'さい', romaji: 'sai', english: 'Crush' },
    { character: '毒', kana: 'どく', romaji: 'doku', english: 'Poison' },
    { character: '疫', kana: 'えき', romaji: 'eki', english: 'Plague' },
    { character: '病', kana: 'びょう', romaji: 'byou', english: 'Disease' },
    { character: '腐', kana: 'ふ', romaji: 'fu', english: 'Rot' },
    { character: '蝕', kana: 'しょく', romaji: 'shoku', english: 'Eclipse' },
    { character: '墓', kana: 'はか', romaji: 'haka', english: 'Tomb' },
    { character: '棺', kana: 'かん', romaji: 'kan', english: 'Coffin' },
    { character: '葬', kana: 'そう', romaji: 'sou', english: 'Burial' },
    { character: '鎖', kana: 'くさり', romaji: 'kusari', english: 'Chain' },
    { character: '縛', kana: 'ばく', romaji: 'baku', english: 'Bind' },
    { character: '罠', kana: 'わな', romaji: 'wana', english: 'Trap' },
    { character: '恐', kana: 'きょう', romaji: 'kyou', english: 'Fear' },
    { character: '脅', kana: 'きょう', romaji: 'kyou', english: 'Threaten' },
    { character: '絶', kana: 'ぜつ', romaji: 'zetsu', english: 'Sever' },
    { character: '終', kana: 'しゅう', romaji: 'shuu', english: 'End' },
    { character: '喪', kana: 'そう', romaji: 'sou', english: 'Mourning' },
    { character: '虚', kana: 'きょ', romaji: 'kyo', english: 'Void' },
    { character: '空', kana: 'くう', romaji: 'kuu', english: 'Empty' },
    { character: '虫', kana: 'むし', romaji: 'mushi', english: 'Insect' },
    { character: '蜘', kana: 'くも', romaji: 'kumo', english: 'Spider' },
    { character: '蛛', kana: 'くも', romaji: 'kumo', english: 'Spider' },
    { character: '蠍', kana: 'さそり', romaji: 'sasori', english: 'Scorpion' },
    { character: '蟹', kana: 'かに', romaji: 'kani', english: 'Crab' },
    { character: '蛾', kana: 'が', romaji: 'ga', english: 'Moth' },
    { character: '蝶', kana: 'ちょう', romaji: 'chou', english: 'Butterfly' },
    { character: '蜂', kana: 'はち', romaji: 'hachi', english: 'Bee' },
    { character: '蟻', kana: 'あり', romaji: 'ari', english: 'Ant' },
    { character: '蛭', kana: 'ひる', romaji: 'hiru', english: 'Leech' },
    { character: '蚊', kana: 'か', romaji: 'ka', english: 'Mosquito' },
    { character: '蠅', kana: 'はえ', romaji: 'hae', english: 'Fly' },
    { character: '蝙', kana: 'へん', romaji: 'hen', english: 'Bat' },
    { character: '蟲', kana: 'むし', romaji: 'mushi', english: 'Bug' },
    { character: '髑', kana: 'どく', romaji: 'doku', english: 'Skull' },
    { character: '髏', kana: 'ろ', romaji: 'ro', english: 'Skeleton' },
    { character: '怪', kana: 'かい', romaji: 'kai', english: 'Monster' },
    { character: '妄', kana: 'もう', romaji: 'mou', english: 'Delusion' },
    { character: '憑', kana: 'ひょう', romaji: 'hyou', english: 'Possession' },
    { character: '鵺', kana: 'ぬえ', romaji: 'nue', english: 'Nue' },
    { character: '魘', kana: 'えん', romaji: 'en', english: 'Nightmare' }
];

// Simple accessor functions

// Get kanji by character
function getKanji(character) {
    return KANJI_DICTIONARY.find(k => k.character === character) ?? null;
}

// Get kanji by index
function getKanjiAt(index) {
    return KANJI_DICTIONARY[index] ?? null;
}

// Get total count
function getKanjiCount() {
    return KANJI_DICTIONARY.length;
}

// Get random kanji
function getRandomKanji() {
    return KANJI_DICTIONARY[Math.floor(Math.random() * KANJI_DICTIONARY.length)];
}

// Get all characters as array (useful for enemy system)
function getAllKanjiCharacters() {
    return KANJI_DICTIONARY.map(k => k.character);
}