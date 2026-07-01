# 🕹️ Tic Tac Toe

A retro-themed **Tic Tac Toe** game built with **React**, **TypeScript**, and **Vite**, featuring two AI algorithms and two game modes.

---

## 🚀 Getting Started

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

### Run Tests

```bash
npm test        # watch mode
npm run test:run # single run
```

### Lint

```bash
npm run lint
```

---

## 🧩 Features

- 🎮 Two game modes: **Classic** and **Vanish** (pieces disappear after 3 marks)
- 🤖 Two AI algorithms:
  - **Minimax with Alpha-Beta Pruning** — perfect play for Classic mode
  - **Monte Carlo Tree Search (MCTS)** — adaptive play for Vanish mode (runs in a Web Worker)
- 🎚️ Three difficulty levels: Easy, Medium, Hard
- 🔄 Choose who goes first and which symbol to play
- 👥 Player vs Computer or 2-Player local mode
- 📱 Responsive & mobile-friendly retro UI with scanline effects
- ♿ Accessible: keyboard navigation, ARIA labels, live regions
- 🖥️ MS-DOS style rules panel

---

## 🛠️ Tech Stack

| Layer     | Technologies                  |
|-----------|-------------------------------|
| UI        | React 19, TypeScript          |
| Build     | Vite 6                        |
| AI        | Alpha-Beta Pruning, MCTS      |
| Testing   | Vitest, Testing Library       |
| Linting   | ESLint, typescript-eslint     |
| Styling   | CSS (retro pixel art theme)   |

---

## 📁 Project Structure

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── App.css
    ├── hooks/
    │   └── useGameState.ts
    ├── ai/
    │   ├── types.ts
    │   ├── alphaBeta.ts
    │   ├── mcts.ts
    │   └── mcts.worker.ts
    ├── components/
    │   ├── Board.tsx
    │   ├── Cell.tsx
    │   └── ErrorBoundary.tsx
    └── __tests__/
        ├── gameLogic.test.ts
        └── alphaBeta.test.ts
```

---

## 🕹️ How to Play

1. Open the game in your browser.
2. Select **Classic** (standard rules) or **Vanish** (marks disappear after 3).
3. Choose difficulty and who goes first.
4. Place your mark — get 3 in a row to win!
5. In Vanish mode, watch for fading marks — they'll disappear on your next move.
6. Click **Restart** to play again!

---

## 🧠 AI Algorithms

### Classic Mode: Minimax + Alpha-Beta Pruning
- Solves the complete game tree
- Guarantees optimal play on Hard difficulty
- Instant response time

### Vanish Mode: Monte Carlo Tree Search (MCTS)
- Handles infinite game trees via random simulations
- Runs in a **Web Worker** to keep the UI responsive
- Uses UCB1 for exploration vs exploitation balance
- Difficulty scales with simulation count (100 / 500 / 2000 iterations)

---

## 🪪 License

This project is licensed under the [MIT License](LICENSE).

---

## 🧠 Author

**Rehan Khan**  
DevSecOps | MLOps | AI/ML/RL  
[GitHub](https://github.com/k2n-rehan) • [LinkedIn](https://www.linkedin.com/in/rehan-khan-devops/)