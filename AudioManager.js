/**
 * AudioManager — синглтон управления звуком.
 *
 * Использование в любой сцене:
 *   import Audio from "../AudioManager.js";
 *   Audio.init(this);          // один раз при старте сцены
 *   Audio.playMusic("music_game");
 *   Audio.playSfx("sfx_coin");
 *
 * Регулировка громкости прямо в коде:
 *   Audio.setMusicVolume(0.2);
 *   Audio.setSfxVolume(0.5);
 *   Audio.muteAll(true/false);
 */
import CONFIG from "./config.js";

const AudioManager = {
  _scene:       null,
  _music:       null,   // текущий музыкальный трек
  _musicKey:    null,
  _sfxVolume:   1.0,
  _musicVolume: 1.0,
  _muted:       false,

  /** Вызови один раз в create() любой сцены */
  init(scene) {
    this._scene = scene;
  },

  /* ─── МУЗЫКА ───────────────────────────── */

  playMusic(key) {
    if (!this._scene) return;

    // Уже играет этот трек — не перезапускаем
    if (this._music && this._music.isPlaying && this._musicKey === key) return;

    // Стоп старый трек
    if (this._music) { this._music.stop(); this._music = null; }

    const vol = CONFIG.AUDIO[key.toUpperCase().replace("MUSIC_", "MUSIC_")] ?? 0.3;

    this._music    = this._scene.sound.add(key, { loop: true, volume: this._muted ? 0 : vol * this._musicVolume });
    this._musicKey = key;
    this._music.play();
  },

  stopMusic() {
    if (this._music) { this._music.stop(); this._music = null; this._musicKey = null; }
  },

  /* ─── SFX ──────────────────────────────── */

  playSfx(key) {
    if (!this._scene || this._muted) return;
    const cfgKey = key.toUpperCase();   // sfx_coin → SFX_COIN
    const vol = CONFIG.AUDIO[cfgKey] ?? 0.6;
    this._scene.sound.play(key, { volume: vol * this._sfxVolume });
  },

  /* ─── ГРОМКОСТЬ ────────────────────────── */

  /** Громкость музыки: 0.0 – 1.0 */
  setMusicVolume(v) {
    this._musicVolume = Math.max(0, Math.min(1, v));
    if (this._music) {
      const cfgKey = (this._musicKey ?? "music_game").toUpperCase();
      const base   = CONFIG.AUDIO[cfgKey] ?? 0.3;
      this._music.setVolume(this._muted ? 0 : base * this._musicVolume);
    }
  },

  /** Громкость эффектов: 0.0 – 1.0 */
  setSfxVolume(v) {
    this._sfxVolume = Math.max(0, Math.min(1, v));
  },

  /** Заглушить / включить всё */
  muteAll(state) {
    this._muted = state;
    if (this._music) this._music.setVolume(state ? 0 : (CONFIG.AUDIO.MUSIC_GAME ?? 0.3) * this._musicVolume);
  },

  isMuted() { return this._muted; },
};

export default AudioManager;
