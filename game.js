/**
 * game.js — точка входа.
 * Только инициализация Phaser + регистрация сцен.
 */
import CONFIG          from "./config.js";
import BootScene       from "./scenes/BootScene.js";
import MenuScene       from "./scenes/MenuScene.js";
import GameScene       from "./scenes/GameScene.js";
import GameOverScene   from "./scenes/GameOverScene.js";
import LeaderboardScene from "./scenes/LeaderboardScene.js";

new Phaser.Game({
  type:   Phaser.AUTO,
  width:  CONFIG.GAME.WIDTH,
  height: CONFIG.GAME.HEIGHT,
  parent: "game",
  backgroundColor: "#1a1a2e",
  physics: {
    default: "arcade",
    arcade: { debug: CONFIG.DEBUG },
  },
  scene: [
    BootScene,
    MenuScene,
    GameScene,
    GameOverScene,
    LeaderboardScene,
  ],
});
