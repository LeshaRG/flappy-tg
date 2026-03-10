import GameState    from "../GameState.js";
import AudioManager from "../AudioManager.js";
import { submitScore } from "../api.js";

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOverScene" });
    this._overlay = null;
  }

  init(data) {
    this._isNewRecord = data?.isNewRecord ?? false;
  }

  async create() {
    if (GameState.userId) {
      submitScore(GameState.userId, GameState.score | 0, GameState.coins | 0);
    }

    AudioManager.stopMusic();
    this._showOverlay();

    this.input.once("pointerdown", () => {
      this._removeOverlay();
      this.scene.start("GameScene");
    });
  }

  _showOverlay() {
    this._removeOverlay();

    const newRecordBadge = this._isNewRecord
      ? `<div class="go-new-record">🏆 NEW RECORD!</div>`
      : "";

    const div = document.createElement("div");
    div.id = "ui-gameover";
    div.innerHTML = `
      <div class="go-card">
        <div class="go-title">GAME OVER</div>

        ${newRecordBadge}

        <div class="go-video-wrap">
          <video id="go-video" src="assets/game_over_video.mp4"
            autoplay playsinline loop
            disablePictureInPicture disableRemotePlayback>
          </video>
        </div>

        <div class="go-stats">
          <div class="go-row">
            <span class="go-label">SCORE</span>
            <span class="go-val">${GameState.score | 0}</span>
          </div>
          <div class="go-row">
            <span class="go-label">BEST</span>
            <span class="go-val best">${GameState.bestScore | 0}</span>
          </div>
        </div>

        <div class="go-btns">
          <button class="go-btn primary" id="btn-restart">▶  PLAY AGAIN</button>
          <button class="go-btn" id="btn-leaders">🏆  LEADERBOARD</button>
          <button class="go-btn secondary" id="btn-menu">⬅  MENU</button>
        </div>

        <div class="go-hint">Tap anywhere to restart</div>
      </div>
    `;
    document.body.appendChild(div);
    this._overlay = div;

    div.querySelector("#btn-restart").addEventListener("click", e => {
      e.stopPropagation();
      this._removeOverlay();
      this.scene.start("GameScene");
    });

    div.querySelector("#btn-leaders").addEventListener("click", e => {
      e.stopPropagation();
      this._removeOverlay();
      this.scene.start("LeaderboardScene");
    });

    div.querySelector("#btn-menu").addEventListener("click", e => {
      e.stopPropagation();
      this._removeOverlay();
      this.scene.start("MenuScene");
    });
  }

  _removeOverlay() {
    if (this._overlay) { this._overlay.remove(); this._overlay = null; }
  }

  shutdown() { this._removeOverlay(); }
}