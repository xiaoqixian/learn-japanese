import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Header from './components/Header'
import Home from './pages/Home'
import KanaQuiz from './pages/KanaQuiz'
import WordBook from './pages/WordBook'
import './App.css'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app">
          <Header />
          <main className="main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/quiz" element={<KanaQuiz />} />
              <Route path="/wordbook" element={<WordBook />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}

