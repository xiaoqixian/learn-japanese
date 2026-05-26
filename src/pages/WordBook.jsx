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

// ── Utility ─────────────────────────────────────────────────────
function splitJp(japanese) {
  return japanese ? japanese.split('/') : []
}

// ── Tag Input ──────────────────────────────────────────────────
function TagInput({ tags, onTagsChange, placeholder, autoFocus }) {
  const [text, setText] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const addTag = (val) => {
    const v = val.trim()
    if (!v) return
    onTagsChange([...tags, v])
    setText('')
  }

  const removeTag = (i) => {
    onTagsChange(tags.filter((_, idx) => idx !== i))
  }

  const handleKeyDown = (e) => {
    if (e.key === ' ') {
      e.preventDefault()
      addTag(inputRef.current?.value || '')
    } else if (e.key === 'Backspace' && !inputRef.current?.value && tags.length > 0) {
      removeTag(tags.length - 1)
    }
  }

  return (
    <div className="wb-tag-input" onClick={() => inputRef.current?.focus()}>
      {tags.map((t, i) => (
        <span key={i} className="wb-tag">
          {t}
          <button
            className="wb-tag-x"
            onClick={(e) => {
              e.stopPropagation()
              removeTag(i)
            }}
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        className="wb-tag-input-text"
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        autoFocus={autoFocus}
        autoComplete="off"
      />
    </div>
  )
}

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
  const [jpTags, setJpTags] = useState([])
  const [chinese, setChinese] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const jp = jpTags.join('/')
    const cn = chinese.trim()
    if (!jp || !cn) return

    setSaving(true)
    try {
      await addWord(jp, cn)
      setJpTags([])
      setChinese('')
      onAdded()
    } catch (err) {
      // silent
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="wb-add-form" onSubmit={handleSubmit}>
      <TagInput
        tags={jpTags}
        onTagsChange={setJpTags}
        placeholder="日语单词（回车添加多种写法）..."
        autoFocus
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
          <div className="wb-word-jp">
            {splitJp(w.japanese).map((v, i) => (
              <span key={i} className="wb-variant">
                {v}
              </span>
            ))}
          </div>
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
  const [jpVariant, setJpVariant] = useState('')
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [shaking, setShaking] = useState(false)
  const [score, setScore] = useState({ correct: 0, wrong: 0 })
  const [answerRevealed, setAnswerRevealed] = useState(false)
  const inputRef = useRef(null)

  const pickWord = useCallback(() => {
    if (words.length === 0) return
    const idx = Math.floor(Math.random() * words.length)
    const word = words[idx]
    const showJp = Math.random() > 0.5
    setQuizWord(word)
    setShowJapanese(showJp)

    // Pick a random Japanese variant
    const variants = splitJp(word.japanese)
    setJpVariant(variants[Math.floor(Math.random() * variants.length)] || word.japanese)

    setInput('')
    setResult(null)
    setAnswerRevealed(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [words])

  useEffect(() => {
    pickWord()
  }, [pickWord])

  const handleWordClick = () => {
    setAnswerRevealed(true)
  }

  const handleSubmit = () => {
    if (!quizWord || answerRevealed) return
    const trimmed = input.trim()
    if (!trimmed) return

    // Accept any of the Japanese variants as correct
    const variants = splitJp(quizWord.japanese)
    const correctAnswer = showJapanese ? quizWord.chinese : variants
    const isCorrect = showJapanese
      ? trimmed.toLowerCase() === correctAnswer.toLowerCase()
      : variants.some((v) => v.toLowerCase() === trimmed.toLowerCase())

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

  const promptText = showJapanese ? jpVariant : quizWord.chinese
  const promptLabel = showJapanese ? '请输入对应的中文释义' : '请输入对应的日语单词'
  const allVariants = splitJp(quizWord.japanese)

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
          <div className="wb-answer-text">
            {showJapanese ? quizWord.chinese : allVariants.join(' / ')}
          </div>
          <button className="wb-btn wb-btn-primary" onClick={pickWord}>
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
  const [editJpTags, setEditJpTags] = useState([])
  const [editCn, setEditCn] = useState('')
  const [saving, setSaving] = useState(false)
  const [pendingVariant, setPendingVariant] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const variantInputRef = useRef(null)

  const startEdit = (word) => {
    setDeletingId(null)
    setEditingId(word.id)
    setEditJpTags(splitJp(word.japanese))
    setEditCn(word.chinese)
    setPendingVariant('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditJpTags([])
    setEditCn('')
    setPendingVariant('')
  }

  const handleSave = async () => {
    // Include pending variant if any
    const allTags = pendingVariant.trim()
      ? [...editJpTags, pendingVariant.trim()]
      : editJpTags
    if (allTags.length === 0) return
    const jp = allTags.join('/')
    const cn = editCn.trim()
    if (!cn || !editingId) return
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

  // Mark a word for deletion
  const startDelete = (id) => {
    setEditingId(null)
    setDeletingId(id)
  }

  // Cancel deletion
  const cancelDelete = () => {
    setDeletingId(null)
  }

  // Confirm deletion
  const confirmDelete = async () => {
    if (!deletingId) return
    setSaving(true)
    try {
      await onDelete(deletingId)
      cancelDelete()
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  // Update a specific variant
  const updateVariant = (idx, value) => {
    const next = [...editJpTags]
    next[idx] = value
    setEditJpTags(next)
  }

  // Remove a specific variant
  const removeVariant = (idx) => {
    setEditJpTags(editJpTags.filter((_, i) => i !== idx))
  }

  // Add pending variant
  const addVariant = () => {
    const v = pendingVariant.trim()
    if (!v) return
    setEditJpTags([...editJpTags, v])
    setPendingVariant('')
    setTimeout(() => variantInputRef.current?.focus(), 0)
  }

  const handleVariantKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addVariant()
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
                        <div className="wb-variant-list">
                          {editJpTags.map((v, i) => (
                            <span key={i} className="wb-variant-edit">
                              <input
                                className="wb-variant-input"
                                type="text"
                                value={v}
                                onChange={(e) => updateVariant(i, e.target.value)}
                              />
                              <button
                                className="wb-variant-del"
                                onClick={() => removeVariant(i)}
                                title="删除此写法"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <span className="wb-variant-edit wb-variant-new">
                            <input
                              ref={variantInputRef}
                              className="wb-variant-input"
                              type="text"
                              value={pendingVariant}
                              onChange={(e) => setPendingVariant(e.target.value)}
                              onKeyDown={handleVariantKeyDown}
                              placeholder="新写法..."
                            />
                          </span>
                        </div>
                      </td>
                      <td className="wb-table-cn">
                        <input
                          className="wb-table-input"
                          type="text"
                          value={editCn}
                          onChange={(e) => setEditCn(e.target.value)}
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
                    <tr key={w.id} className={deletingId === w.id ? 'wb-table-row-deleting' : ''}>
                      <td
                        className="wb-table-jp wb-table-cell-clickable"
                        onClick={() => startEdit(w)}
                        title="点击编辑"
                      >
                        {splitJp(w.japanese).map((v, i) => (
                          <span key={i} className="wb-variant">
                            {v}
                          </span>
                        ))}
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
                          onClick={() => startDelete(w.id)}
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

          {/* Footer: Save/Cancel when editing or deleting */}
          {(editingId || deletingId) && (
            <div className="wb-modal-footer">
              <button
                className="wb-btn wb-btn-secondary"
                onClick={editingId ? cancelEdit : cancelDelete}
                disabled={saving}
              >
                取消
              </button>
              <button
                className={`wb-btn ${editingId ? 'wb-btn-primary' : 'wb-btn-danger'}`}
                onClick={editingId ? handleSave : confirmDelete}
                disabled={
                  saving ||
                  (editingId && (editJpTags.length === 0 || !editCn.trim()))
                }
              >
                {saving ? '保存中...' : editingId ? '保存' : '确认删除'}
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
            onUpdate={handleUpdate}
          />
        )}
      </div>
    </div>
  )
}

