# 日本語学習 (Learn Japanese Kana)

An interactive web application for learning Japanese Hiragana and Katakana characters through adaptive quizzes. Built with React and Vite.

## Features

- **Hiragana & Katakana Quizzes** — Practice all 46 basic kana characters in dedicated modes or a mixed challenge.
- **Two Answer Modes** — Type the romaji reading directly, or click on the interactive Gojūon (五十音) grid to match characters by sound.
- **Adaptive Difficulty** — Characters you struggle with appear more frequently using a weighted random selection algorithm, ensuring focused practice on weak spots.
- **Think-Time Tracking** — Slow responses increase the difficulty weight of that character, encouraging faster recall.
- **Group Filtering** — Filter kana by consonant group (a, ka, sa, ta, na, ha, ma, ya, ra, wa) to focus on specific rows of the Gojūon chart.
- **Dark / Light Theme** — Toggle between color schemes, with preference persisted across sessions.
- **Score & Streak Tracking** — Real-time feedback on correct and incorrect answers, with a streak counter for motivation.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 |
| Routing | React Router v6 |
| Build Tool | Vite 5 |
| Styling | CSS (custom properties for theming) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd learn-jap

# Install dependencies
npm install
```

### Development

Start the development server with hot-reload:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` by default.

### Build for Production

```bash
npm run build
```

The output will be generated in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## License

MIT

