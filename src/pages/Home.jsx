import { Link } from 'react-router-dom'
import './Home.css'

export default function Home() {
  const modules = [
    {
      id: 'kana',
      title: '假名学习',
      subtitle: 'かな',
      description: '平假名 · 片假名 · 混合练习',
      icon: 'あ',
      path: '/quiz',
    },
  ]

  return (
    <div className="home">
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

