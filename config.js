const CONFIG = {
  DEBUG: false,

  GAME: {
    WIDTH: 400,
    HEIGHT: 700,
  },

  PLAYER: {
    START_X: 80,
    START_Y: 300,
    SCALE: 0.3,
    HITBOX: { WIDTH: 100, HEIGHT: 100 },
    SPEED_Y: 260,
    ROTATION_UP: 0,
    ROTATION_DOWN: 0,
    ANIM_FPS: 10,
  },

  WALLS: {
    SPAWN_X: 420,
    GAP: 100,          // ИСПРАВЛЕНО: было 600 — это было причиной проблем
    SPAWN_DELAY: 1400,
    SPRITE: { WIDTH: 100, HEIGHT: 500 },
    HITBOX: { WIDTH: 10, HEIGHT: 500, OFFSET_X: 40, OFFSET_Y: 1 },
    PASS_X: 60,
  },

  COINS: {
    RADIUS: 10,
    COLOR: 0xFFD700,
    SPAWN_CHANCE: 0.6,
    ANIM_DURATION: 200,
    GAP_MARGIN: 20,
  },

  DIFFICULTY: {
    START_SPEED: 160,
    SPEED_INCREASE: 0.008,
    MAX_SPEED: 420,
  },

  PARALLAX: {
    FAR:  0.002,
    MID:  0.006,
    NEAR: 0.012,
  },

  SCORE: {
    WALL_BONUS: 1,
    COIN_BONUS: 1,
  },

  TUNNEL: {
    EVERY_N_WALLS: 7,
    COUNT_MIN: 3,
    COUNT_MAX: 4,
    GAP: 100,
    SPACING: 60,
    MOVE_AMPLITUDE: 20,
    MOVE_SPEED: 0.8,
  },

  AUDIO: {
    MUSIC_GAME:   0.05,   // фоновая музыка в игре
    MUSIC_MENU:   0.1,   // фоновая музыка в меню
    SFX_WALL:     0.6,   // пролёт стены
    SFX_COIN:     0.6,   // подбор монеты
    SFX_DEATH:    0.7,   // смерть
  },

  STORAGE: {
    BEST_SCORE: "flappy_best_score",
    COINS_TOTAL: "flappy_coins_total",
  },

  API: {
    BASE_URL: "https://api.tremor-brand.ru/api",
    TIMEOUT_MS: 5000,
  },
};

export default CONFIG;
