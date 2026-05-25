import { useState, useEffect, useRef, useCallback } from 'react'
import {
  isDbReady,
  createDatabase,
  openDatabase,
  addWord,
  deleteWord,
  updateWord,
  getAllWords,
  getDbFileName,
} from '../data/db'
import './WordBook.css'

// ── File setup screen ──────────────────────────────────────────
function FileSetup({ onDbReady }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    try {
      const name = await createDatabase()
      if (name) onDbReady()
    } catch (err) {
      setError(err.message || '创建数据库失败')
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = async () => {
    setLoading(true)
    setError('')
    try {
      const name = await openDatabase()
      if (name) onDbReady()
    } catch (err) {
      setError(err.message || '打开数据库失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="wb-setup">
      <div className="wb-setup-card">
        <div className="wb-setup-icon">📖</div>
        <h2 className="wb-setup-title">单词本</h2>
        <p className="wb-setup-desc">
          需要先创建或选择一个 SQLite 数据库文件来存储单词数据。
        </p>
        <div className="wb-setup-buttons">
          <button
            className="wb-btn wb-btn-primary"
            onClick={handleCreate}
            disabled={loading}
          >
            ✨ 新建数据库
          </button>
          <button
            className="wb-btn wb-btn-secondary"
            onClick={handleOpen}
            disabled={loading}
          >
            📂 打开已有文件
          </button>
        </div>
        {error && <div className="wb-setup-error">{error}</div>}
        {loading && <div className="wb-setup-loading">处理中...</div>}
      </div>
    </div>
  )
}

// ── Add word form ──────────────────────────────────────────────
function AddWordForm({ onAdded }) {
  const [japanese, setJapanese] = useState('')
  const [chinese, setChinese] = useState('')
  const [saving, setSaving] = useState(false)
  const jpRef = useRef(null)

  useEffect(() => {
    jpRef.current?.focus()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const jp = japanese.trim()
    const cn = chinese.trim()
    if (!jp || !cn) return

    setSaving(true)
    try {
      await addWord(jp, cn)
      setJapanese('')
      setChinese('')
      jpRef.current?.focus()
      onAdded()
    } catch (err) {
      // silent
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="wb-add-form" onSubmit={handleSubmit}>
      <input
        ref={jpRef}
        className="wb-input"
        type="text"
        placeholder="日语单词..."
        value={japanese}
        onChange={(e) => setJapanese(e.target.value)}
      />
      <input
        className="wb-input"
        type="text"
        placeholder="中文释义..."
        value={chinese}
        onChange={(e) => setChinese(e.target.value)}
      />
      <button className="wb-btn wb-btn-primary" type="submit" disabled={saving}>
        {saving ? '添加中...' : '添加'}
      </button>
    </form>
  )
}

// ── Word list ──────────────────────────────────────────────────
function WordList({ words, onDelete }) {
  if (words.length === 0) {
    return <div className="wb-empty">还没有添加单词，快去添加吧！</div>
  }

  return (
    <div className="wb-list">
      {words.map((w) => (
        <div key={w.id} className="wb-word-item">
          <div className="wb-word-jp">{w.japanese}</div>
          <div className="wb-word-cn">{w.chinese}</div>
          <button
            className="wb-word-del"
            onClick={() => onDelete(w.id)}
            title="删除"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

// ── Quiz mode ──────────────────────────────────────────────────
function QuizMode({ words, onBack }) {
  const [quizWord, setQuizWord] = useState(null)
  const [showJapanese, setShowJapanese] = useState(true)
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null) // 'correct' | 'wrong' | null
  const [shaking, setShaking] = useState(false)
  const [score, setScore] = useState({ correct: 0, wrong: 0 })
  const [answerRevealed, setAnswerRevealed] = useState(false)
  const inputRef = useRef(null)

  // Pick a random word
  const pickWord = useCallback(() => {
    if (words.length === 0) return
    const idx = Math.floor(Math.random() * words.length)
    const word = words[idx]
    const showJp = Math.random() > 0.5
    setQuizWord(word)
    setShowJapanese(showJp)
    setInput('')
    setResult(null)
    setAnswerRevealed(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [words])

  useEffect(() => {
    pickWord()
  }, [pickWord])

  // Show answer when clicking the word itself
  const handleWordClick = () => {
    setAnswerRevealed(true)
  }

  const handleSubmit = () => {
    if (!quizWord || answerRevealed) return
    const trimmed = input.trim()
    if (!trimmed) return

    const correctAnswer = showJapanese ? quizWord.chinese : quizWord.japanese
    const isCorrect =
      trimmed.toLowerCase() === correctAnswer.toLowerCase()

    if (isCorrect) {
      setResult('correct')
      setScore((s) => ({ ...s, correct: s.correct + 1 }))
      setTimeout(() => pickWord(), 400)
    } else {
      setResult('wrong')
      setScore((s) => ({ ...s, wrong: s.wrong + 1 }))
      setShaking(true)
      setTimeout(() => {
        setShaking(false)
        setInput('')
        setResult(null)
        inputRef.current?.focus()
      }, 500)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  if (words.length === 0) {
    return (
      <div className="wb-quiz-empty">
        <p>还没有单词，请先添加单词再开始测试。</p>
        <button className="wb-btn wb-btn-secondary" onClick={onBack}>
          返回管理
        </button>
      </div>
    )
  }

  if (!quizWord) return null

  const promptText = showJapanese ? quizWord.japanese : quizWord.chinese
  const promptLabel = showJapanese ? '请输入对应的中文释义' : '请输入对应的日语单词'
  const correctAnswer = showJapanese ? quizWord.chinese : quizWord.japanese

  return (
    <div className="wb-quiz">
      {/* Score bar */}
      <div className="wb-quiz-score">
        <span className="wb-score-correct">✓ {score.correct}</span>
        <span className="wb-score-wrong">✗ {score.wrong}</span>
      </div>

      {/* Prompt card */}
      <div className={`wb-quiz-card ${shaking ? 'shake' : ''} ${result === 'correct' ? 'wb-card-correct' : ''}`}>
        <div className="wb-quiz-label">{promptLabel}</div>
        <div
          className="wb-quiz-prompt"
          onClick={handleWordClick}
          title="点击查看答案"
        >
          {promptText}
        </div>
      </div>

      {/* Answer reveal */}
      {answerRevealed && (
        <div className="wb-answer-reveal">
          <div className="wb-answer-label">答案：</div>
          <div className="wb-answer-text">{correctAnswer}</div>
          <button
            className="wb-btn wb-btn-primary"
            onClick={pickWord}
          >
            下一题 →
          </button>
        </div>
      )}

      {/* Input (hidden when answer revealed) */}
      {!answerRevealed && (
        <div className="wb-quiz-input-wrap">
          <input
            ref={inputRef}
            type="text"
            className={`wb-quiz-input ${result === 'correct' ? 'wb-input-correct' : ''} ${result === 'wrong' ? 'wb-input-wrong' : ''}`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={showJapanese ? '输入中文...' : '输入日语...'}
            autoComplete="off"
          />
        </div>
      )}

      {/* Back button */}
      <button className="wb-btn wb-btn-ghost" onClick={onBack} style={{ marginTop: 16 }}>
        ← 返回单词管理
      </button>
    </div>
  )
}

// ── Word Table Modal ───────────────────────────────────────────
function WordTableModal({ words, onClose, onDelete, onUpdate }) {
  const [editingId, setEditingId] = useState(null)
  const [editJp, setEditJp] = useState('')
  const [editCn, setEditCn] = useState('')
  const [saving, setSaving] = useState(false)

  const startEdit = (word) => {
    setEditingId(word.id)
    setEditJp(word.japanese)
    setEditCn(word.chinese)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditJp('')
    setEditCn('')
  }

  const handleSave = async () => {
    const jp = editJp.trim()
    const cn = editCn.trim()
    if (!jp || !cn || !editingId) return
    setSaving(true)
    try {
      await onUpdate(editingId, jp, cn)
      cancelEdit()
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  return (
    <div className="wb-modal-overlay" onClick={onClose}>
      <div className="wb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wb-modal-header">
          <h3 className="wb-modal-title">单词本</h3>
          <button className="wb-modal-close" onClick={onClose} title="关闭">
            ✕
          </button>
        </div>
        <div className="wb-modal-body">
          {words.length === 0 ? (
            <div className="wb-empty">还没有添加单词</div>
          ) : (
            <table className="wb-table">
              <thead>
                <tr>
                  <th>日语</th>
                  <th>中文</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {words.map((w) =>
                  editingId === w.id ? (
                    <tr key={w.id} className="wb-table-row-editing">
                      <td className="wb-table-jp">
                        <input
                          className="wb-table-input"
                          type="text"
                          value={editJp}
                          onChange={(e) => setEditJp(e.target.value)}
                          onKeyDown={handleKeyDown}
                          autoFocus
                        />
                      </td>
                      <td className="wb-table-cn">
                        <input
                          className="wb-table-input"
                          type="text"
                          value={editCn}
                          onChange={(e) => setEditCn(e.target.value)}
                          onKeyDown={handleKeyDown}
                        />
                      </td>
                      <td>
                        <button
                          className="wb-table-action wb-table-cancel"
                          onClick={cancelEdit}
                          title="取消"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={w.id}>
                      <td
                        className="wb-table-jp wb-table-cell-clickable"
                        onClick={() => startEdit(w)}
                        title="点击编辑"
                      >
                        {w.japanese}
                      </td>
                      <td
                        className="wb-table-cn wb-table-cell-clickable"
                        onClick={() => startEdit(w)}
                        title="点击编辑"
                      >
                        {w.chinese}
                      </td>
                      <td>
                        <button
                          className="wb-table-action wb-table-del"
                          onClick={() => onDelete(w.id)}
                          title="删除"
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}

          {/* Save button at bottom when editing */}
          {editingId && (
            <div className="wb-modal-footer">
              <button
                className="wb-btn wb-btn-secondary"
                onClick={cancelEdit}
                disabled={saving}
              >
                取消
              </button>
              <button
                className="wb-btn wb-btn-primary"
                onClick={handleSave}
                disabled={saving || !editJp.trim() || !editCn.trim()}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main WordBook Page ─────────────────────────────────────────
export default function WordBook() {
  const [dbReady, setDbReady] = useState(false)
  const [view, setView] = useState('manage') // 'manage' | 'quiz'
  const [showTable, setShowTable] = useState(false)
  const [words, setWords] = useState([])
  const [dbFileName, setDbFileName] = useState('')

  // Poll for file handle API support
  const hasFileApi =
    typeof window !== 'undefined' &&
    typeof window.showSaveFilePicker === 'function' &&
    typeof window.showOpenFilePicker === 'function'

  const refreshWords = useCallback(() => {
    if (isDbReady()) {
      setWords(getAllWords())
    }
  }, [])

  const handleDbReady = useCallback(() => {
    setDbReady(true)
    setDbFileName(getDbFileName() || '')
    refreshWords()
  }, [refreshWords])

  const handleDelete = useCallback(
    async (id) => {
      await deleteWord(id)
      refreshWords()
    },
    [refreshWords]
  )

  const handleUpdate = useCallback(
    async (id, japanese, chinese) => {
      await updateWord(id, japanese, chinese)
      refreshWords()
    },
    [refreshWords]
  )

  // If File System Access API is not available, show warning
  if (!hasFileApi) {
    return (
      <div className="wb-wrapper">
        <div className="wb-setup">
          <div className="wb-setup-card">
            <div className="wb-setup-icon">⚠️</div>
            <h2 className="wb-setup-title">浏览器不支持</h2>
            <p className="wb-setup-desc">
              您的浏览器不支持文件系统访问 API（File System Access API）。
              <br />
              请使用最新版 Chrome、Edge 或 Opera 浏览器。
            </p>
          </div>
        </div>
      </div>
    )
  }

  // First visit: show file setup
  if (!dbReady) {
    return (
      <div className="wb-wrapper">
        <FileSetup onDbReady={handleDbReady} />
      </div>
    )
  }

  return (
    <div className="wb-wrapper">
      <div className="wb-container">
        {/* Header */}
        <div className="wb-header">
          <h2 className="wb-title">单词本</h2>
          <span className="wb-db-name" title={dbFileName}>
            {dbFileName}
          </span>
          <div className="wb-tabs">
            <button
              className={`wb-tab ${view === 'manage' ? 'active' : ''}`}
              onClick={() => setView('manage')}
            >
              管理单词
            </button>
            <button
              className={`wb-tab ${view === 'quiz' ? 'active' : ''}`}
              onClick={() => setView('quiz')}
            >
              单词测试
            </button>
          </div>
        </div>

        {/* Content */}
        {view === 'manage' ? (
          <div className="wb-manage">
            <AddWordForm onAdded={refreshWords} />
            <button
              className="wb-btn wb-btn-secondary"
              style={{ marginTop: 16 }}
              onClick={() => setShowTable(true)}
            >
              📖 查看单词本
            </button>
          </div>
        ) : (
          <QuizMode
            words={words}
            onBack={() => {
              setView('manage')
              refreshWords()
            }}
          />
        )}

        {/* Word Table Modal */}
        {showTable && (
          <WordTableModal
            words={words}
            onClose={() => setShowTable(false)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  )
}

