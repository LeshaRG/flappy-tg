/**
 * MenuScene — главное меню.
 * Показывает имя игрока, рекорд, монеты и кнопку Play.
 * UI рисуется HTML-оверлеем (div#ui-menu) поверх canvas.
 */
import GameState    from "../GameState.js";
import AudioManager from "../AudioManager.js";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
    this._overlay = null;
  }

  create() {
    AudioManager.init(this);
    AudioManager.playMusic("music_menu");
    this._showOverlay();

    // Клик / тап в любом месте → старт
    this.input.once("pointerdown", () => this._startGame());
  }

  _startGame() {
    this._removeOverlay();
    this.scene.start("GameScene");
  }

  _showOverlay() {
    this._removeOverlay();

    const div = document.createElement("div");
    div.id = "ui-menu";
    div.innerHTML = `
      <div class="menu-card">
        <div class="menu-title">FLAPPY</div>
        <div class="menu-sub">TG EDITION</div>

        <div class="menu-player">👤 ${GameState.username}</div>

        <div class="menu-stats">
          <div class="stat">
            <span class="stat-label">BEST</span>
            <span class="stat-val" id="menu-best">${Math.floor(GameState.bestScore)}</span>
          </div>
          <div class="stat">
            <span class="stat-label">COINS</span>
            <span class="stat-val" id="menu-coins">🪙 ${GameState.totalCoins}</span>
          </div>
        </div>

        <button class="menu-btn" id="btn-play">▶  PLAY</button>
        <button class="menu-btn secondary" id="btn-leaders">🏆  LEADERBOARD</button>

        <div class="menu-hint">Tap anywhere to start</div>
      </div>
    `;
    document.body.appendChild(div);
    this._overlay = div;

    // Кнопки
    div.querySelector("#btn-play").addEventListener("click", e => {
      e.stopPropagation();
      this._startGame();
    });

    div.querySelector("#btn-leaders").addEventListener("click", e => {
      e.stopPropagation();
      this._removeOverlay();
      this.scene.start("LeaderboardScene");
    });
  }

  _removeOverlay() {
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
    }
  }

  shutdown() {
    this._removeOverlay();
  }
}