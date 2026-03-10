const GameState = {
  score: 0,
  coins: 0,
  wallsPassed: 0,

  bestScore: 0,
  totalCoins: 0,

  userId: null,
  username: "Player",
  online: false,

  reset() {
    this.score = 0;
    this.coins = 0;
    this.wallsPassed = 0;
  },

  applyServerData(data) {
    if (!data) return;
    this.userId     = data.userId     ?? this.userId;
    this.username   = data.username   ?? this.username;
    this.bestScore  = parseInt(data.bestScore, 10) || 0;
    this.totalCoins = parseInt(data.coins,     10) || 0;
    this.online     = true;
  },

  // ИСПРАВЛЕНО: parseInt везде, никаких parseFloat
  loadLocal(storageConfig) {
    const b = localStorage.getItem(storageConfig.BEST_SCORE);
    const c = localStorage.getItem(storageConfig.COINS_TOTAL);
    if (b !== null) this.bestScore  = parseInt(b, 10) || 0;
    if (c !== null) this.totalCoins = parseInt(c, 10) || 0;
  },

  saveLocal(storageConfig) {
    localStorage.setItem(storageConfig.BEST_SCORE,  this.bestScore  | 0);
    localStorage.setItem(storageConfig.COINS_TOTAL, this.totalCoins | 0);
  },

  tryUpdateBest() {
    if ((this.score | 0) > (this.bestScore | 0)) {
      this.bestScore = this.score | 0;
      return true;
    }
    return false;
  },
};

export default GameState;