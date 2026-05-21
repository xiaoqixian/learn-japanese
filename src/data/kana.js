// All basic hiragana and katakana characters with their romaji readings
export const hiragana = [
  { kana: 'あ', romaji: 'a' },
  { kana: 'い', romaji: 'i' },
  { kana: 'う', romaji: 'u' },
  { kana: 'え', romaji: 'e' },
  { kana: 'お', romaji: 'o' },
  { kana: 'か', romaji: 'ka' },
  { kana: 'き', romaji: 'ki' },
  { kana: 'く', romaji: 'ku' },
  { kana: 'け', romaji: 'ke' },
  { kana: 'こ', romaji: 'ko' },
  { kana: 'さ', romaji: 'sa' },
  { kana: 'し', romaji: 'shi' },
  { kana: 'す', romaji: 'su' },
  { kana: 'せ', romaji: 'se' },
  { kana: 'そ', romaji: 'so' },
  { kana: 'た', romaji: 'ta' },
  { kana: 'ち', romaji: 'chi' },
  { kana: 'つ', romaji: 'tsu' },
  { kana: 'て', romaji: 'te' },
  { kana: 'と', romaji: 'to' },
  { kana: 'な', romaji: 'na' },
  { kana: 'に', romaji: 'ni' },
  { kana: 'ぬ', romaji: 'nu' },
  { kana: 'ね', romaji: 'ne' },
  { kana: 'の', romaji: 'no' },
  { kana: 'は', romaji: 'ha' },
  { kana: 'ひ', romaji: 'hi' },
  { kana: 'ふ', romaji: 'fu' },
  { kana: 'へ', romaji: 'he' },
  { kana: 'ほ', romaji: 'ho' },
  { kana: 'ま', romaji: 'ma' },
  { kana: 'み', romaji: 'mi' },
  { kana: 'む', romaji: 'mu' },
  { kana: 'め', romaji: 'me' },
  { kana: 'も', romaji: 'mo' },
  { kana: 'や', romaji: 'ya' },
  { kana: 'ゆ', romaji: 'yu' },
  { kana: 'よ', romaji: 'yo' },
  { kana: 'ら', romaji: 'ra' },
  { kana: 'り', romaji: 'ri' },
  { kana: 'る', romaji: 'ru' },
  { kana: 'れ', romaji: 're' },
  { kana: 'ろ', romaji: 'ro' },
  { kana: 'わ', romaji: 'wa' },
  { kana: 'を', romaji: 'wo' },
  { kana: 'ん', romaji: 'n' },
]

export const katakana = [
  { kana: 'ア', romaji: 'a' },
  { kana: 'イ', romaji: 'i' },
  { kana: 'ウ', romaji: 'u' },
  { kana: 'エ', romaji: 'e' },
  { kana: 'オ', romaji: 'o' },
  { kana: 'カ', romaji: 'ka' },
  { kana: 'キ', romaji: 'ki' },
  { kana: 'ク', romaji: 'ku' },
  { kana: 'ケ', romaji: 'ke' },
  { kana: 'コ', romaji: 'ko' },
  { kana: 'サ', romaji: 'sa' },
  { kana: 'シ', romaji: 'shi' },
  { kana: 'ス', romaji: 'su' },
  { kana: 'セ', romaji: 'se' },
  { kana: 'ソ', romaji: 'so' },
  { kana: 'タ', romaji: 'ta' },
  { kana: 'チ', romaji: 'chi' },
  { kana: 'ツ', romaji: 'tsu' },
  { kana: 'テ', romaji: 'te' },
  { kana: 'ト', romaji: 'to' },
  { kana: 'ナ', romaji: 'na' },
  { kana: 'ニ', romaji: 'ni' },
  { kana: 'ヌ', romaji: 'nu' },
  { kana: 'ネ', romaji: 'ne' },
  { kana: 'ノ', romaji: 'no' },
  { kana: 'ハ', romaji: 'ha' },
  { kana: 'ヒ', romaji: 'hi' },
  { kana: 'フ', romaji: 'fu' },
  { kana: 'ヘ', romaji: 'he' },
  { kana: 'ホ', romaji: 'ho' },
  { kana: 'マ', romaji: 'ma' },
  { kana: 'ミ', romaji: 'mi' },
  { kana: 'ム', romaji: 'mu' },
  { kana: 'メ', romaji: 'me' },
  { kana: 'モ', romaji: 'mo' },
  { kana: 'ヤ', romaji: 'ya' },
  { kana: 'ユ', romaji: 'yu' },
  { kana: 'ヨ', romaji: 'yo' },
  { kana: 'ラ', romaji: 'ra' },
  { kana: 'リ', romaji: 'ri' },
  { kana: 'ル', romaji: 'ru' },
  { kana: 'レ', romaji: 're' },
  { kana: 'ロ', romaji: 'ro' },
  { kana: 'ワ', romaji: 'wa' },
  { kana: 'ヲ', romaji: 'wo' },
  { kana: 'ン', romaji: 'n' },
]

// Build reverse mapping: romaji → { hiragana, katakana }
export const romajiMap = {}
hiragana.forEach((h) => {
  romajiMap[h.romaji] = { ...romajiMap[h.romaji], hiragana: h.kana }
})
katakana.forEach((k) => {
  romajiMap[k.romaji] = { ...romajiMap[k.romaji], katakana: k.kana }
})

// All unique romaji values (46 basic sounds)
export const allRomaji = [...new Set(hiragana.map((h) => h.romaji))]

// Column headers for gojuon
export const GOJUON_COLS = ['a', 'i', 'u', 'e', 'o']

// Row labels for gojuon
export const GOJUON_ROWS = ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ']

// Gojuon grid: 10 rows × 5 columns, some cells are null (irregular slots)
// Each non-null cell: { hiragana, katakana, romaji }
export const gojuonGrid = [
  [
    { hiragana: 'あ', katakana: 'ア', romaji: 'a' },
    { hiragana: 'い', katakana: 'イ', romaji: 'i' },
    { hiragana: 'う', katakana: 'ウ', romaji: 'u' },
    { hiragana: 'え', katakana: 'エ', romaji: 'e' },
    { hiragana: 'お', katakana: 'オ', romaji: 'o' },
  ],
  [
    { hiragana: 'か', katakana: 'カ', romaji: 'ka' },
    { hiragana: 'き', katakana: 'キ', romaji: 'ki' },
    { hiragana: 'く', katakana: 'ク', romaji: 'ku' },
    { hiragana: 'け', katakana: 'ケ', romaji: 'ke' },
    { hiragana: 'こ', katakana: 'コ', romaji: 'ko' },
  ],
  [
    { hiragana: 'さ', katakana: 'サ', romaji: 'sa' },
    { hiragana: 'し', katakana: 'シ', romaji: 'shi' },
    { hiragana: 'す', katakana: 'ス', romaji: 'su' },
    { hiragana: 'せ', katakana: 'セ', romaji: 'se' },
    { hiragana: 'そ', katakana: 'ソ', romaji: 'so' },
  ],
  [
    { hiragana: 'た', katakana: 'タ', romaji: 'ta' },
    { hiragana: 'ち', katakana: 'チ', romaji: 'chi' },
    { hiragana: 'つ', katakana: 'ツ', romaji: 'tsu' },
    { hiragana: 'て', katakana: 'テ', romaji: 'te' },
    { hiragana: 'と', katakana: 'ト', romaji: 'to' },
  ],
  [
    { hiragana: 'な', katakana: 'ナ', romaji: 'na' },
    { hiragana: 'に', katakana: 'ニ', romaji: 'ni' },
    { hiragana: 'ぬ', katakana: 'ヌ', romaji: 'nu' },
    { hiragana: 'ね', katakana: 'ネ', romaji: 'ne' },
    { hiragana: 'の', katakana: 'ノ', romaji: 'no' },
  ],
  [
    { hiragana: 'は', katakana: 'ハ', romaji: 'ha' },
    { hiragana: 'ひ', katakana: 'ヒ', romaji: 'hi' },
    { hiragana: 'ふ', katakana: 'フ', romaji: 'fu' },
    { hiragana: 'へ', katakana: 'ヘ', romaji: 'he' },
    { hiragana: 'ほ', katakana: 'ホ', romaji: 'ho' },
  ],
  [
    { hiragana: 'ま', katakana: 'マ', romaji: 'ma' },
    { hiragana: 'み', katakana: 'ミ', romaji: 'mi' },
    { hiragana: 'む', katakana: 'ム', romaji: 'mu' },
    { hiragana: 'め', katakana: 'メ', romaji: 'me' },
    { hiragana: 'も', katakana: 'モ', romaji: 'mo' },
  ],
  [
    { hiragana: 'や', katakana: 'ヤ', romaji: 'ya' },
    null,
    { hiragana: 'ゆ', katakana: 'ユ', romaji: 'yu' },
    null,
    { hiragana: 'よ', katakana: 'ヨ', romaji: 'yo' },
  ],
  [
    { hiragana: 'ら', katakana: 'ラ', romaji: 'ra' },
    { hiragana: 'り', katakana: 'リ', romaji: 'ri' },
    { hiragana: 'る', katakana: 'ル', romaji: 'ru' },
    { hiragana: 'れ', katakana: 'レ', romaji: 're' },
    { hiragana: 'ろ', katakana: 'ロ', romaji: 'ro' },
  ],
  [
    { hiragana: 'わ', katakana: 'ワ', romaji: 'wa' },
    null,
    null,
    null,
    { hiragana: 'を', katakana: 'ヲ', romaji: 'wo' },
  ],
]

// The standalone ん／ン at the bottom (not part of the main 10-row grid)
export const gojuonExtra = { hiragana: 'ん', katakana: 'ン', romaji: 'n' }

