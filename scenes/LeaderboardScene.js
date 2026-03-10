/**
 * LeaderboardScene — таблица лидеров.
 * Загружает топ с сервера, показывает в UI.
 */
import GameState from "../GameState.js";
import { getLeaderboard, getPlayerRank } from "../api.js";

export default class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super({ key: "LeaderboardScene" });
    this._overlay = null;
  }

  async create() {
    this._showOverlay([]);   // сразу показываем скелет

    const [board, rankData] = await Promise.all([
      getLeaderboard(10),
      GameState.userId ? getPlayerRank(GameState.userId) : Promise.resolve(null),
    ]);

    this._updateOverlay(board ?? [], rankData?.rank ?? null);

    this.input.on("pointerdown", () => {
      // do nothing — кнопки обрабатывают клики
    });
  }

  _showOverlay(rows) {
    this._removeOverlay();

    const div = document.createElement("div");
    div.id = "ui-leaderboard";
    div.innerHTML = `
      <div class="lb-card">
        <div class="lb-title">🏆 LEADERBOARD</div>
        <div class="lb-your-rank" id="lb-your-rank"></div>
        <div class="lb-table" id="lb-table">
          <div class="lb-loading">Loading...</div>
        </div>
        <div class="lb-btns">
          <button class="lb-btn" id="btn-lb-back">⬅  BACK</button>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    this._overlay = div;

    div.querySelector("#btn-lb-back").addEventListener("click", e => {
      e.stopPropagation();
      this._removeOverlay();
      this.scene.start("MenuScene");
    });
  }

  _updateOverlay(rows, myRank) {
    if (!this._overlay) return;

    const table = this._overlay.querySelector("#lb-table");
    const rankEl = this._overlay.querySelector("#lb-your-rank");

    if (myRank) {
      rankEl.textContent = `Your rank: #${myRank}`;
    }

    if (!rows.length) {
      table.innerHTML = `<div class="lb-empty">No scores yet. Be the first!</div>`;
      return;
    }

    const medals = ["🥇","🥈","🥉"];

    table.innerHTML = rows.map((r, i) => {
      const isMe = r.userId === GameState.userId;
      const medal = medals[i] ?? `${i + 1}.`;
      return `
        <div class="lb-row ${isMe ? "lb-me" : ""}">
          <span class="lb-pos">${medal}</span>
          <span class="lb-name">${escapeHtml(r.username)}</span>
          <span class="lb-score">${Math.floor(r.score)}</span>
        </div>
      `;
    }).join("");
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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
