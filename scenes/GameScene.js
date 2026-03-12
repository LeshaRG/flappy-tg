import CONFIG       from "../config.js";
import GameState    from "../GameState.js";
import AudioManager from "../AudioManager.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    GameState.reset();

    this._speed         = CONFIG.DIFFICULTY.START_SPEED;
    this._direction     = "up";
    this._alive         = true;
    this._passedPairIds = new Set();
    this._wallPairCount = 0;
    this._pairCounter = 0;  // уникальный ID для каждой пары стен
    this._inTunnel      = false;

    AudioManager.init(this);
    AudioManager.playMusic("music_game");

    this._setupScale();
    this._createBackground();
    this._createPlayer();
    this._obstacles = this.physics.add.group();
    this._coins     = this.physics.add.group();
    this._createHUD();
    this._createInput();
    this._startWallSpawner();
  }

  /* ─── АДАПТИВНЫЙ МАСШТАБ ─────────────────── */
  _setupScale() {
    const W = CONFIG.GAME.WIDTH;
    const H = CONFIG.GAME.HEIGHT;
    const scale  = Math.min(window.innerWidth / W, window.innerHeight / H);
    const canvas = this.sys.game.canvas;

    canvas.style.width    = Math.floor(W * scale) + "px";
    canvas.style.height   = Math.floor(H * scale) + "px";
    canvas.style.position = "absolute";
    canvas.style.left     = Math.floor((window.innerWidth  - W * scale) / 2) + "px";
    canvas.style.top      = Math.floor((window.innerHeight - H * scale) / 2) + "px";

    if (!this._resizeHandler) {
      this._resizeHandler = () => this._setupScale();
      window.addEventListener("resize", this._resizeHandler);
    }
  }

  /* ─── BACKGROUND ─────────────────────────── */
  _createBackground() {
    const W = CONFIG.GAME.WIDTH;
    const H = CONFIG.GAME.HEIGHT;
    const safe = k => this.textures.exists(k);
    this._bgFar  = safe("bg_far")  ? this.add.tileSprite(W/2, H/2, W, H, "bg_far").setDepth(-4)  : null;
    this._bgMid  = safe("bg_mid")  ? this.add.tileSprite(W/2, H/2, W, H, "bg_mid").setDepth(-3)  : null;
    this._bgNear = safe("bg_near") ? this.add.tileSprite(W/2, H/2, W, H, "bg_near").setDepth(-1) : null;
  }

  /* ─── PLAYER ─────────────────────────────── */
  _createPlayer() {
    const { START_X, START_Y, SCALE, HITBOX } = CONFIG.PLAYER;
    this._player = this.physics.add.sprite(START_X, START_Y, "chh1");
    this._player.setScale(SCALE);
    this._player.setCollideWorldBounds(false);
    this._player.body.allowGravity = false;
    this._player.body.setSize(HITBOX.WIDTH, HITBOX.HEIGHT, true);
    this._player.play("fly_up");
    this._player.setDepth(1);
  }

  /* ─── WALL SPAWNER ───────────────────────── */
  _startWallSpawner() {
    this._wallTimer = this.time.addEvent({
      delay: CONFIG.WALLS.SPAWN_DELAY,
      callback: this._onSpawnTick,
      callbackScope: this,
      loop: true,
    });
  }

  _onSpawnTick() {
    if (!this._alive || this._inTunnel) return;

    if (this._wallPairCount > 0 && this._wallPairCount % CONFIG.TUNNEL.EVERY_N_WALLS === 0) {
      this._spawnTunnel();
    } else {
      this._spawnNormalPair();
    }
  }

  /* ─── ОБЫЧНАЯ ПАРА ───────────────────────── */
  _spawnNormalPair() {
    if (!this.textures.exists("wall")) return;

    const H       = CONFIG.GAME.HEIGHT;
    const WALL_H  = CONFIG.WALLS.SPRITE.HEIGHT; // 500 — высота спрайта стены
    const gap     = CONFIG.WALLS.GAP;           // зазор между краями стен
    const margin  = 180;

    // gapCenterY — Y середины зазора (куда летит игрок)
    const gapCenterY = Phaser.Math.Between(gap / 2 + margin, H - gap / 2 - margin);

    // Верхняя стена: её НИЖНИЙ край = gapCenterY - gap/2
    // Центр спрайта = нижний край - половина высоты спрайта
    const topY    = (gapCenterY - gap / 2) - WALL_H / 2;

    // Нижняя стена: её ВЕРХНИЙ край = gapCenterY + gap/2
    // Центр спрайта = верхний край + половина высоты спрайта
    const bottomY = (gapCenterY + gap / 2) + WALL_H / 2;

    const top    = this._makeWall(CONFIG.WALLS.SPAWN_X, topY,    true).setDepth(-2);
    const bottom = this._makeWall(CONFIG.WALLS.SPAWN_X, bottomY, false).setDepth(-2);

    const pairId = ++this._pairCounter;  // уникальный счётчик
    top._pairId    = pairId;
    bottom._pairId = pairId;

    this._wallPairCount++;

    // Монета посередине между парами по X, внутри зазора по Y
    if (Math.random() < CONFIG.COINS.SPAWN_CHANCE) {
      const margin2 = CONFIG.COINS.GAP_MARGIN + CONFIG.COINS.RADIUS;
      const minY = gapCenterY - gap / 2 + margin2;
      const maxY = gapCenterY + gap / 2 - margin2;
      if (minY < maxY) {
        const coinY = Phaser.Math.Between(minY, maxY);
        this.time.delayedCall(CONFIG.WALLS.SPAWN_DELAY / 2, () => {
          if (this._alive) this._spawnCoin(CONFIG.WALLS.SPAWN_X, coinY);
        });
      }
    }
  }

  /* ─── ТУННЕЛЬ ────────────────────────────── */
  _spawnTunnel() {
    if (!this.textures.exists("wall")) return;
    this._inTunnel = true;

    const { COUNT_MIN, COUNT_MAX, GAP, SPACING, MOVE_AMPLITUDE, MOVE_SPEED } = CONFIG.TUNNEL;
    const WALL_H = CONFIG.WALLS.SPRITE.HEIGHT;
    const H      = CONFIG.GAME.HEIGHT;

    const count   = Phaser.Math.Between(COUNT_MIN, COUNT_MAX);
    const margin  = 80;
    const baseCY  = Phaser.Math.Between(GAP / 2 + margin, H - GAP / 2 - margin);
    const moveDur = Math.round(1000 / MOVE_SPEED);

    for (let i = 0; i < count; i++) {
      const x        = CONFIG.WALLS.SPAWN_X + i * SPACING;
      const jitter   = Phaser.Math.Between(-15, 15);
      const gapCY    = Phaser.Math.Clamp(baseCY + jitter, GAP / 2 + margin, H - GAP / 2 - margin);

      // Те же расчёты что в обычной паре
      const topY    = (gapCY - GAP / 2) - WALL_H / 2;
      const bottomY = (gapCY + GAP / 2) + WALL_H / 2;

      const top    = this._makeWall(x, topY,    true);
      const bottom = this._makeWall(x, bottomY, false);

      const pairId = ++this._pairCounter;  // уникальный счётчик
      top._pairId    = pairId;
      bottom._pairId = pairId;

      this._wallPairCount++;

      const dir = Math.random() < 0.5 ? 1 : -1;
      const dur = moveDur + Phaser.Math.Between(-150, 150);

      [top, bottom].forEach(w => {
        this.tweens.add({
          targets: w,
          y: w.y + MOVE_AMPLITUDE * dir,
          duration: dur,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
          onUpdate: () => {
            // Синхронизируем только Y тела, не трогая velocityX
            if (w.active && w.body) {
              w.body.y = w.y - w.body.halfHeight;
            }
          },
        });
      });
    }

    const unlockDelay = (count * SPACING / this._speed) * 1000 + CONFIG.WALLS.SPAWN_DELAY * 2;
    this.time.delayedCall(unlockDelay, () => { this._inTunnel = false; });
  }

  _makeWall(x, y, flipY) {
    const { HITBOX } = CONFIG.WALLS;
    const w = this._obstacles.create(x, y, "wall");
    w.setVelocityX(-this._speed);
    w.body.allowGravity = false;
    w.body.setSize(HITBOX.WIDTH, HITBOX.HEIGHT);
    w.body.setOffset(HITBOX.OFFSET_X, HITBOX.OFFSET_Y);
    w.setDepth(0);
    if (flipY) w.setFlipY(true);
    return w;
  }

  /* ─── МОНЕТЫ ─────────────────────────────── */
  _spawnCoin(x, y) {
    // Создаём текстуру монеты один раз
    if (!this.textures.exists("coin_tex")) {
      const r = CONFIG.COINS.RADIUS;
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(CONFIG.COINS.COLOR, 1);
      g.fillCircle(r, r, r);
      g.lineStyle(2, 0xFFAA00);
      g.strokeCircle(r, r, r);
      g.generateTexture("coin_tex", r * 2, r * 2);
      g.destroy();
    }

    const coin = this._coins.create(x, y, "coin_tex");
    coin.setVelocityX(-this._speed);
    coin.body.allowGravity = false;
    coin.setDepth(0.5);

    this.tweens.add({
      targets: coin,
      y: y + 8,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  /* ─── HUD ────────────────────────────────── */
  _createHUD() {
    const W = CONFIG.GAME.WIDTH;

    this._scoreText = this.add.text(W / 2, 30, "0", {
      fontSize: "36px",
      fill: "#ffffff",
      fontFamily: "monospace",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5, 0).setDepth(10);

    this._coinText = this.add.text(W - 16, 16, "🪙 0", {
      fontSize: "18px",
      fill: "#FFD700",
      fontFamily: "monospace",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(10);

    if (CONFIG.DEBUG) {
      this._debugText = this.add.text(10, 50, "", {
        fontSize: "12px", fill: "#00ff00", fontFamily: "monospace",
      }).setDepth(10);
    }
  }

  /* ─── INPUT ──────────────────────────────── */
  _createInput() {
    this.input.on("pointerdown", this._onTap, this);
    this._spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  _onTap() {
    if (!this._alive) return;
    this._direction = this._direction === "up" ? "down" : "up";
  }

  /* ─── UPDATE ─────────────────────────────── */
  update(time, delta) {
    if (!this._alive) return;

    if (Phaser.Input.Keyboard.JustDown(this._spaceKey)) this._onTap();

    const spd = this._speed;

    if (this._bgFar)  this._bgFar.tilePositionX  += spd * CONFIG.PARALLAX.FAR;
    if (this._bgMid)  this._bgMid.tilePositionX  += spd * CONFIG.PARALLAX.MID;
    if (this._bgNear) this._bgNear.tilePositionX += spd * CONFIG.PARALLAX.NEAR;

    this._speed = Math.min(spd + CONFIG.DIFFICULTY.SPEED_INCREASE, CONFIG.DIFFICULTY.MAX_SPEED);

    this._checkWallPass();

    // HUD — score всегда целое
    this._scoreText.setText(GameState.score | 0);
    this._coinText.setText("🪙 " + (GameState.coins | 0));

    this._movePlayer();

    if (this._player.y <= 0 || this._player.y >= CONFIG.GAME.HEIGHT) {
      this._die(); return;
    }

    this.physics.overlap(this._player, this._obstacles, this._die,         null, this);
    this.physics.overlap(this._player, this._coins,     this._collectCoin, null, this);

    this._cleanup();

    if (CONFIG.DEBUG && this._debugText) {
      this._debugText.setText(
        `spd:${spd.toFixed(1)} score:${GameState.score} pairs:${this._wallPairCount} tunnel:${this._inTunnel}`
      );
    }
  }

  _movePlayer() {
    const { SPEED_Y, ROTATION_UP, ROTATION_DOWN } = CONFIG.PLAYER;
    if (this._direction === "up") {
      this._player.setVelocityY(-SPEED_Y);
      this._player.setRotation(ROTATION_UP);
      this._player.play("fly_up", true);
    } else {
      this._player.setVelocityY(SPEED_Y);
      this._player.setRotation(ROTATION_DOWN);
      this._player.play("fly_down", true);
    }
  }

  /* ─── СЧЁТ — строго +1 целое за пару ────── */
  _checkWallPass() {
    const playerX = this._player.x;
    this._obstacles.getChildren().forEach(wall => {
      if (
        wall._pairId &&
        !this._passedPairIds.has(wall._pairId) &&
        wall.x < playerX
      ) {
        this._passedPairIds.add(wall._pairId);
        GameState.score = (GameState.score | 0) + 1;
        GameState.wallsPassed++;
        AudioManager.playSfx("sfx_wall");
        this._spawnFloatText(this._player.x + 30, this._player.y - 20, "+1");
      }
    });
  }

  _collectCoin(player, coin) {
    if (!coin.active) return;

    this.tweens.killTweensOf(coin);
    coin.destroy();

    GameState.score      = (GameState.score      | 0) + 1;
    GameState.coins      = (GameState.coins      | 0) + 1;
    GameState.totalCoins = (GameState.totalCoins | 0) + 1;

    AudioManager.playSfx("sfx_coin");
    this._spawnFloatText(player.x + 30, player.y - 20, "+1 🪙", "#FFD700");
  }

  _spawnFloatText(x, y, text, color = "#ffffff") {
    const t = this.add.text(x, y, text, {
      fontSize: "18px", fill: color,
      fontFamily: "monospace",
      stroke: "#000", strokeThickness: 3,
    }).setDepth(20).setOrigin(0.5);

    this.tweens.add({
      targets: t, y: y - 40, alpha: 0, duration: 700, ease: "Power2",
      onComplete: () => t.destroy(),
    });
  }

  /* ─── CLEANUP ────────────────────────────── */
  _cleanup() {
    const offLeft = -150;
    [...this._obstacles.getChildren()].forEach(w => {
      if (w.x < offLeft) { this.tweens.killTweensOf(w); w.destroy(); }
    });
    [...this._coins.getChildren()].forEach(c => {
      if (c.x < offLeft) { this.tweens.killTweensOf(c); c.destroy(); }
    });
  }

  /* ─── DIE ────────────────────────────────── */
  _die() {
    if (!this._alive) return;
    this._alive = false;

    this._player.setVelocity(0);
    this._wallTimer?.remove();
    AudioManager.playSfx("sfx_death");
    AudioManager.stopMusic();
    this._obstacles.getChildren().forEach(w => this.tweens.killTweensOf(w));
    this._obstacles.setVelocityX(0);
    this._coins.setVelocityX(0);

    this.tweens.add({
      targets: this._player, alpha: 0, duration: 100, yoyo: true, repeat: 4,
      onComplete: () => {
        const isNewRecord = GameState.tryUpdateBest();
        GameState.saveLocal(CONFIG.STORAGE);
        this.scene.start("GameOverScene", { isNewRecord });
      },
    });
  }

  /* ─── SHUTDOWN ───────────────────────────── */
  shutdown() {
    this.input.off("pointerdown", this._onTap, this);
    if (this._resizeHandler) {
      window.removeEventListener("resize", this._resizeHandler);
      this._resizeHandler = null;
    }
  }
}
