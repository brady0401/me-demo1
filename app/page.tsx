import Script from "next/script";

export default function Home() {
  return (
    <main className="game-shell">
      <div className="game-stage">
        <header className="hud">
          <p>
            Round <span id="round-value">1</span> <span>|</span> Score{" "}
            <span id="score-value">0</span>
          </p>
        </header>

        <section id="board" className="board" aria-label="matching board" />

        <footer className="game-footer">
          <button id="restart-btn" type="button">
            重新開始
          </button>
        </footer>
      </div>
      <Script src="/memory-game.js" strategy="afterInteractive" />
    </main>
  );
}
