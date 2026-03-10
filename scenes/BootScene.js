/**
 * BootScene — первая сцена.
 * Загружает ассеты, авторизует пользователя, переходит в MenuScene.
 */
import CONFIG    from "../config.js";
import GameState from "../GameState.js";
import { authTelegram } from "../api.js";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    // ── Фоны ────────────────────────────────
    this.load.image("bg_far",  "assets/bg_far.png");
    this.load.image("bg_mid",  "assets/bg_mid.png");
    this.load.image("bg_near", "assets/bg_near2.png");

    // ── Стена ───────────────────────────────
    this.load.image("wall", "assets/wall.png");

    // ── Персонаж (вниз) ─────────────────────
    this.load.image("ch1",  "assets/ch1.png");
    this.load.image("ch2",  "assets/ch2.png");
    this.load.image("ch3",  "assets/ch3.png");
    this.load.image("ch4",  "assets/ch4.png");

    // ── Персонаж (вверх) ────────────────────
    this.load.image("chh1", "assets/chh1.png");
    this.load.image("chh2", "assets/chh2.png");
    this.load.image("chh3", "assets/chh3.png");
    this.load.image("chh4", "assets/chh4.png");

    // ── Аудио ───────────────────────────────
    this.load.audio("music_game",  "assets/sounds/music_game.mp3");
    this.load.audio("music_menu",  "assets/sounds/music_menu.mp3");
    this.load.audio("sfx_wall",    "assets/sounds/sfx_wall.mp3");
    this.load.audio("sfx_coin",    "assets/sounds/sfx_coin.mp3");
    this.load.audio("sfx_death",   "assets/sounds/sfx_death.mp3");

    // ── Видео game over ─────────────────────
    this.load.video("gameover_video", "assets/game_over_video.mp4", true);

    // ── Прогресс загрузки ───────────────────
    this._createLoadingBar();
  }

  _createLoadingBar() {
    const { WIDTH, HEIGHT } = CONFIG.GAME;
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;

    this.add.text(cx, cy - 40, "Loading...", {
      fontSize: "20px",
      fill: "#ffffff",
      fontFamily: "monospace",
    }).setOrigin(0.5);

    const barBg = this.add.rectangle(cx, cy, 260, 16, 0x333333).setOrigin(0.5);
    const bar   = this.add.rectangle(cx - 130, cy, 0, 12, 0xFFD700).setOrigin(0, 0.5);

    this.load.on("progress", v => {
      bar.width = 260 * v;
    });
  }

  async create() {
    // ── Анимации (создаём один раз в Boot) ──
    this._createAnims();

    // ── Загружаем локальный рекорд ───────────
    GameState.loadLocal(CONFIG.STORAGE);

    // ── Telegram auth ────────────────────────
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.expand();
      tg.ready();

      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        GameState.username = tgUser.first_name ?? "Player";
        GameState.userId   = String(tgUser.id);
      }

      const data = await authTelegram(tg.initData);
      GameState.applyServerData(data);
      GameState.saveLocal(CONFIG.STORAGE);
    }

    this.scene.start("MenuScene");
  }

  _createAnims() {
    const { ANIM_FPS } = CONFIG.PLAYER;

    this.anims.create({
      key: "fly_up",
      frames: ["chh1","chh2","chh3","chh4"].map(k => ({ key: k })),
      frameRate: ANIM_FPS,
      repeat: -1,
    });

    this.anims.create({
      key: "fly_down",
      frames: ["ch1","ch2","ch3","ch4"].map(k => ({ key: k })),
      frameRate: ANIM_FPS,
      repeat: -1,
    });
  }
}