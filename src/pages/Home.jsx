import { Link } from 'react-router-dom'
import './Home.css'

export default function Home() {
  const modules = [
    {
      id: 'hiragana',
      title: '平假名',
      subtitle: 'ひらがな',
      description: '学习基础平假名字符',
      icon: 'あ',
      path: '/kana/hiragana',
    },
    {
      id: 'katakana',
      title: '片假名',
      subtitle: 'カタカナ',
      description: '学习基础片假名字符',
      icon: 'ア',
      path: '/kana/katakana',
    },
    {
      id: 'mixed',
      title: '混合模式',
      subtitle: 'まぜモード',
      description: '平假名和片假名混合练习',
      icon: 'あア',
      path: '/kana/mixed',
    },
  ]

  return (
    <div className="home">
      <div className="hero">
        <h1 className="hero-title">日语假名学习</h1>
        <p className="hero-subtitle">通过交互式测验，轻松掌握平假名与片假名</p>
      </div>
      <div className="module-grid">
        {modules.map((mod) => (
          <Link to={mod.path} key={mod.id} className="module-card">
            <div className="module-icon">{mod.icon}</div>
            <div className="module-info">
              <h2 className="module-title">{mod.title}</h2>
              <span className="module-subtitle">{mod.subtitle}</span>
              <p className="module-desc">{mod.description}</p>
            </div>
            <span className="module-arrow">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

