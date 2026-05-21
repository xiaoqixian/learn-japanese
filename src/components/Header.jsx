import { useTheme } from '../context/ThemeContext'
import { Link, useLocation } from 'react-router-dom'
import './Header.css'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <header className="header">
      <div className="header-left">
        {!isHome && (
          <Link to="/" className="back-btn" aria-label="返回首页">
            ← 首页
          </Link>
        )}
      </div>
      <Link to="/" className="header-title">日语学习</Link>
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </header>
  )
}

