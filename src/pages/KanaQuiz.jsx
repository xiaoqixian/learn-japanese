import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  romajiMap,
  gojuonGrid,
  GOJUON_COLS,
  GOJUON_ROWS,
  gojuonExtra,
  allRomaji,
  kanaGroups,
} from '../data/kana'
import './KanaQuiz.css'

// ── Weighted random selection for error-driven repetition ──────────
const BASE_WEIGHT = 1
const DIFFICULTY_FACTOR = 0.5 // each difficulty point adds 0.5 to the weight
const MAX_WEIGHT = 4 // cap at 4× the base weight

// Difficulty score modifiers
const WRONG_PENALTY = 1.0 // added to score on wrong answer
const CORRECT_REWARD = 0.5 // subtracted from score on correct answer (floor 0)

// Think-time penalty (0-2s = no penalty, then linearly up to cap)
const THINK_THRESHOLD = 2 // seconds before penalty kicks in
const THINK_FACTOR = 0.3 // penalty per second beyond threshold
const THINK_MAX = 3.0 // maximum think-time penalty

function pickWeightedRomaji(romajiList, difficultyScores) {
  const weights = romajiList.map((romaji) => {
    const score = difficultyScores[romaji] || 0
    return Math.min(BASE_WEIGHT + score * DIFFICULTY_FACTOR, MAX_WEIGHT)
  })
  const total = weights.reduce((s, w) => s + w, 0)
  let rand = Math.random() * total
  for (let i = 0; i < romajiList.length; i++) {
    rand -= weights[i]
    if (rand <= 0) return romajiList[i]
  }
  return romajiList[romajiList.length - 1]
}

function getMeta(mode) {
  if (mode === 'hiragana')
    return { label: '平假名', sub: 'ひらがな' }
  if (mode === 'katakana')
    return { label: '片假名', sub: 'カタカナ' }
  return { label: '混合模式', sub: 'まぜモード' }
}

function generateQuestion(mode, quizPreference = 'mixed', difficultyScores = {}, availableRomaji = allRomaji) {
  const romaji = pickWeightedRomaji(availableRomaji, difficultyScores)
  const mapping = romajiMap[romaji]
  // Respect user's quiz preference:
  // 'type-only' → always type mode, 'grid-only' → always grid mode, 'mixed' → random
  const isTypeMode =
    quizPreference === 'type-only'
      ? true
      : quizPreference === 'grid-only'
        ? false
        : Math.random() > 0.5

  if (mode === 'hiragana') {
    return {
      quizMode: isTypeMode ? 'type' : 'grid',
      romaji,
      prompt: isTypeMode ? mapping.hiragana : romaji,
      answer: isTypeMode ? romaji : mapping.hiragana,
    }
  }
  if (mode === 'katakana') {
    return {
      quizMode: isTypeMode ? 'type' : 'grid',
      romaji,
      prompt: isTypeMode ? mapping.katakana : romaji,
      answer: isTypeMode ? romaji : mapping.katakana,
    }
  }
  // mixed
  const showHiragana = Math.random() > 0.5
  return {
    quizMode: isTypeMode ? 'type' : 'grid',
    romaji,
    prompt: isTypeMode
      ? showHiragana
        ? mapping.hiragana
        : mapping.katakana
      : romaji,
    answer: isTypeMode ? romaji : 'both',
    hiraganaAnswer: mapping.hiragana,
    katakanaAnswer: mapping.katakana,
  }
}

// ── Gojuon Grid sub-component ──────────────────────────────────────
function GojuonGrid({
  gridType,
  label,
  found,
  selected,
  onCellClick,
}) {
  const getCellClass = (cell, rowIdx, colIdx) => {
    if (!cell) return 'grid-cell empty'

    const isSelected =
      selected &&
      selected.row === rowIdx &&
      selected.col === colIdx

    if (found && isSelected) return 'grid-cell correct'
    return 'grid-cell'
  }

  const getChar = (cell) => {
    if (!cell) return ''
    return gridType === 'hiragana' ? cell.hiragana : cell.katakana
  }

  const isExtraSelected =
    selected && selected.row === -1 && selected.col === 4
  const extraClass = found && isExtraSelected ? 'grid-cell correct' : 'grid-cell'

  return (
    <div className="grid-container">
      <div className="grid-label">{label}</div>
      <div className="gojuon-table">
        {/* Column headers */}
        <div className="grid-row grid-row-header">
          <div className="grid-cell header-cell" />
          {GOJUON_COLS.map((col) => (
            <div key={col} className="grid-cell header-cell">
              {col}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {gojuonGrid.map((row, rowIdx) => (
          <div key={rowIdx} className="grid-row">
            <div className="grid-cell row-label">
              {GOJUON_ROWS[rowIdx]}
            </div>
            {row.map((cell, colIdx) => {
              if (!cell) {
                return <div key={colIdx} className="grid-cell empty" />
              }
              return (
                <div
                  key={colIdx}
                  className={getCellClass(cell, rowIdx, colIdx)}
                  onClick={() => onCellClick(rowIdx, colIdx, cell, gridType)}
                >
                  {getChar(cell)}
                </div>
              )
            })}
          </div>
        ))}

        {/* Extra row: ん／ン */}
        <div className="grid-row">
          <div className="grid-cell row-label" />
          <div className="grid-cell empty" />
          <div className="grid-cell empty" />
          <div className="grid-cell empty" />
          <div className="grid-cell empty" />
          <div
            className={extraClass}
            onClick={() =>
              onCellClick(-1, 4, gojuonExtra, gridType)
            }
          >
            {gridType === 'hiragana'
              ? gojuonExtra.hiragana
              : gojuonExtra.katakana}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Quiz Component ────────────────────────────────────────────
export default function KanaQuiz() {
  const [kanaMode, setKanaMode] = useState('hiragana')
  const isMixed = kanaMode === 'mixed'

  const [quizPreference, setQuizPreference] = useState('mixed') // 'mixed' | 'type-only' | 'grid-only'
  const [question, setQuestion] = useState(() => generateQuestion(kanaMode, quizPreference))
  const [input, setInput] = useState('')
  const [shaking, setShaking] = useState(false)
  const [result, setResult] = useState(null) // 'correct' | 'wrong' | null
  const [score, setScore] = useState({ correct: 0, wrong: 0, streak: 0 })
  const inputRef = useRef(null)

  // Difficulty scores per romaji (float), persisted to localStorage.
  // Higher = more frequently selected. Decremented on correct answers,
  // incremented on wrong answers and long think times.
  const [difficultyScores, setDifficultyScores] = useState(() => {
    try {
      const stored = localStorage.getItem('kana-difficulty-scores')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  // Track question start time for think-time analysis
  const questionStartRef = useRef(Date.now())

  // Persist difficulty scores whenever they change
  useEffect(() => {
    localStorage.setItem('kana-difficulty-scores', JSON.stringify(difficultyScores))
  }, [difficultyScores])

  // Calculate elapsed think time in seconds
  const getElapsed = () => (Date.now() - questionStartRef.current) / 1000

  // Compute extra penalty from think time
  const thinkTimePenalty = (elapsed) => {
    if (elapsed <= THINK_THRESHOLD) return 0
    return Math.min((elapsed - THINK_THRESHOLD) * THINK_FACTOR, THINK_MAX)
  }

  // Record a wrong answer: increase difficulty score
  const recordWrong = useCallback((romaji) => {
    setDifficultyScores((prev) => ({
      ...prev,
      [romaji]: (prev[romaji] || 0) + WRONG_PENALTY,
    }))
  }, [])

  // Record a correct answer: decrease difficulty score (floor 0)
  const recordCorrect = useCallback((romaji) => {
    setDifficultyScores((prev) => ({
      ...prev,
      [romaji]: Math.max(0, (prev[romaji] || 0) - CORRECT_REWARD),
    }))
  }, [])

  // Apply think-time penalty regardless of correct/wrong
  const applyThinkPenalty = useCallback((romaji) => {
    const elapsed = getElapsed()
    const penalty = thinkTimePenalty(elapsed)
    if (penalty > 0) {
      setDifficultyScores((prev) => ({
        ...prev,
        [romaji]: (prev[romaji] || 0) + penalty,
      }))
    }
  }, [])

  // ── Group selection ──────────────────────────────────────────
  const ALL_GROUP_KEYS = kanaGroups.map((g) => g.key)
  const [selectedGroups, setSelectedGroups] = useState(ALL_GROUP_KEYS)

  const allSelected = selectedGroups.length === ALL_GROUP_KEYS.length

  // Compute available romaji based on selected groups (+ always include ん)
  const availableRomaji = useMemo(() => {
    const set = new Set()
    for (const key of selectedGroups) {
      const group = kanaGroups.find((g) => g.key === key)
      if (group) group.romaji.forEach((r) => set.add(r))
    }
    set.add('n') // ん always included
    return [...set]
  }, [selectedGroups])

  const toggleAll = () => {
    setSelectedGroups(allSelected ? [] : ALL_GROUP_KEYS)
  }

  const toggleGroup = (key) => {
    setSelectedGroups((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
    )
  }

  // Grid-mode selection state
  const [gridState, setGridState] = useState({
    selected: { hiragana: null, katakana: null },
    found: { hiragana: false, katakana: false },
  })

  const advance = useCallback(() => {
    questionStartRef.current = Date.now()
    setQuestion(generateQuestion(kanaMode, quizPreference, difficultyScores, availableRomaji))
    setInput('')
    setResult(null)
    setGridState({
      selected: { hiragana: null, katakana: null },
      found: { hiragana: false, katakana: false },
    })
  }, [kanaMode, quizPreference, difficultyScores, availableRomaji])

  // Auto-focus input in type mode
  useEffect(() => {
    if (question.quizMode === 'type') {
      inputRef.current?.focus()
    }
  }, [question])

  // ── Type mode: submit input ────────────────────────────────────
  const handleTypeSubmit = () => {
    const trimmed = input.trim().toLowerCase()
    if (!trimmed) return

    if (trimmed === question.answer.toLowerCase()) {
      setResult('correct')
      setScore((s) => ({
        correct: s.correct + 1,
        wrong: s.wrong,
        streak: s.streak + 1,
      }))
      recordCorrect(question.romaji)
      applyThinkPenalty(question.romaji)
      setTimeout(() => advance(), 300)
    } else {
      recordWrong(question.romaji)
      setResult('wrong')
      setScore((s) => ({ ...s, wrong: s.wrong + 1, streak: 0 }))
      setShaking(true)
      setTimeout(() => {
        setShaking(false)
        setInput('')
        setResult(null)
        inputRef.current?.focus()
      }, 500)
    }
  }

  // ── Grid mode: cell click ──────────────────────────────────────
  const handleGridClick = (rowIdx, colIdx, cell, gridType) => {
    if (!cell) return
    if (gridState.found[gridType]) return // already found

    const isCorrect = cell.romaji === question.romaji

    if (isCorrect) {
      const newFound = { ...gridState.found, [gridType]: true }
      const newSelected = {
        ...gridState.selected,
        [gridType]: { row: rowIdx, col: colIdx },
      }
      setGridState({ selected: newSelected, found: newFound })

      const needsBoth = isMixed && question.quizMode === 'grid'
      if (!needsBoth || (newFound.hiragana && newFound.katakana)) {
        setResult('correct')
        setScore((s) => ({
          correct: s.correct + 1,
          wrong: s.wrong,
          streak: s.streak + 1,
        }))
        recordCorrect(question.romaji)
        applyThinkPenalty(question.romaji)
        setTimeout(() => advance(), 400)
      }
    } else {
      recordWrong(question.romaji)
      setResult('wrong')
      setScore((s) => ({ ...s, wrong: s.wrong + 1, streak: 0 }))
      setShaking(true)
      setTimeout(() => {
        setShaking(false)
        setGridState({
          selected: { hiragana: null, katakana: null },
          found: { hiragana: false, katakana: false },
        })
      }, 500)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && question.quizMode === 'type') {
      handleTypeSubmit()
    }
  }

  // ── Derived booleans ───────────────────────────────────────────
  const isTypeMode = question.quizMode === 'type'
  const isGridMode = question.quizMode === 'grid'
  const showHiraganaGrid =
    isGridMode && (kanaMode === 'hiragana' || isMixed)
  const showKatakanaGrid =
    isGridMode && (kanaMode === 'katakana' || isMixed)
  const needsBothInGrid = isMixed && isGridMode

  // ── Prompt label text ──────────────────────────────────────────
  let promptLabel
  if (isTypeMode) {
    promptLabel = '请输入对应的罗马音'
  } else if (needsBothInGrid) {
    promptLabel = '请分别点击对应的平假名和片假名'
  } else {
    promptLabel = `请点击对应的${kanaMode === 'hiragana' ? '平假名' : '片假名'}`
  }

  return (
    <div className="quiz-wrapper">
      <div className="quiz">
        {/* Kana mode tabs */}
        <div className="kana-mode-tabs">
          <button
            className={`kana-mode-tab ${kanaMode === 'hiragana' ? 'active' : ''}`}
            onClick={() => setKanaMode('hiragana')}
          >
            平假名
          </button>
          <button
            className={`kana-mode-tab ${kanaMode === 'katakana' ? 'active' : ''}`}
            onClick={() => setKanaMode('katakana')}
          >
            片假名
          </button>
          <button
            className={`kana-mode-tab ${kanaMode === 'mixed' ? 'active' : ''}`}
            onClick={() => setKanaMode('mixed')}
          >
            混合
          </button>
        </div>

        {/* Score bar */}
        <div className="score-bar">
          <div className="score-item correct-score">
            ✓ {score.correct}
          </div>
          <div className="score-item wrong-score">
            ✗ {score.wrong}
          </div>
          {score.streak >= 3 && (
            <div className="score-item streak">
              🔥 {score.streak}连击!
            </div>
          )}
        </div>

        {/* Mode selector */}
        <div className="mode-selector">
          <button
            className={`mode-btn ${quizPreference === 'mixed' ? 'active' : ''}`}
            onClick={() => setQuizPreference('mixed')}
          >
            混合
          </button>
          <button
            className={`mode-btn ${quizPreference === 'type-only' ? 'active' : ''}`}
            onClick={() => setQuizPreference('type-only')}
          >
            只发送假名
          </button>
          <button
            className={`mode-btn ${quizPreference === 'grid-only' ? 'active' : ''}`}
            onClick={() => setQuizPreference('grid-only')}
          >
            只发送发音
          </button>
        </div>

        {/* Prompt card */}
        <div
          className={`quiz-card ${shaking ? 'shake' : ''} ${
            result === 'correct' ? 'card-correct' : ''
          }`}
        >
          <div className="quiz-prompt-label">{promptLabel}</div>
          <div className="quiz-prompt">{question.prompt}</div>
        </div>

        {/* Type mode: textual input */}
        {isTypeMode && (
          <div className="input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className={`quiz-input ${
                result === 'correct' ? 'input-correct' : ''
              } ${result === 'wrong' ? 'input-wrong' : ''}`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入罗马音..."
              autoComplete="off"
              autoFocus
            />
          </div>
        )}

        {/* Grid mode: gojuon chart click */}
        {isGridMode && (
          <div className="grids-wrapper">
            {showHiraganaGrid && (
              <GojuonGrid
                gridType="hiragana"
                label="平假名"
                found={gridState.found.hiragana}
                selected={gridState.selected.hiragana}
                onCellClick={handleGridClick}
              />
            )}
            {showKatakanaGrid && (
              <GojuonGrid
                gridType="katakana"
                label="片假名"
                found={gridState.found.katakana}
                selected={gridState.selected.katakana}
                onCellClick={handleGridClick}
              />
            )}
          </div>
        )}
      </div>

      {/* Sidebar: group selection */}
      <div className="quiz-sidebar">
        <div className="sidebar-label">假名分组</div>
        <button
          className={`sidebar-btn sidebar-btn-all ${allSelected ? 'active' : ''}`}
          onClick={toggleAll}
        >
          all
        </button>
        <div className="group-grid">
          {kanaGroups.map((g) => (
            <button
              key={g.key}
              className={`sidebar-btn ${selectedGroups.includes(g.key) ? 'active' : ''}`}
              onClick={() => toggleGroup(g.key)}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

