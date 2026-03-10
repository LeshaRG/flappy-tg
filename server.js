/**
 * server.js — Node.js бэкенд для Flappy TG.
 *
 * Стек: Express + better-sqlite3 (можно заменить на PostgreSQL/MySQL)
 * 
 * Установка:
 *   npm install express better-sqlite3 cors crypto
 *
 * Запуск:
 *   BOT_TOKEN=<твой_токен> node server.js
 */

const express    = require("express");
const Database   = require("better-sqlite3");
const crypto     = require("crypto");
const cors       = require("cors");

const app = express();
const db  = new Database("game.db");

const BOT_TOKEN = process.env.BOT_TOKEN ?? "";
const PORT      = process.env.PORT ?? 3000;

/* ─────────────────────────────────────────
   INIT DB
───────────────────────────────────────── */
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    username    TEXT NOT NULL DEFAULT 'Player',
    best_score  REAL NOT NULL DEFAULT 0,
    coins       INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS scores (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   TEXT NOT NULL REFERENCES users(id),
    score     REAL NOT NULL,
    coins     INTEGER NOT NULL DEFAULT 0,
    played_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id);
  CREATE INDEX IF NOT EXISTS idx_users_best  ON users(best_score DESC);
`);

/* ─────────────────────────────────────────
   MIDDLEWARE
───────────────────────────────────────── */
app.use(cors());
app.use(express.json());

/* ─────────────────────────────────────────
   TELEGRAM AUTH
───────────────────────────────────────── */

/**
 * Валидирует initData по алгоритму Telegram.
 * Возвращает объект user или null если подпись невалидна.
 */
function validateTelegramInitData(initData) {
  if (!BOT_TOKEN) {
    // Dev-режим без токена — пропускаем валидацию
    console.warn("[AUTH] BOT_TOKEN not set — skipping validation (dev mode)");
    const params = new URLSearchParams(initData);
    const userStr = params.get("user");
    return userStr ? JSON.parse(userStr) : { id: "dev_user", first_name: "Dev" };
  }

  const params   = new URLSearchParams(initData);
  const hash     = params.get("hash");
  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(BOT_TOKEN)
    .digest();

  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== hash) return null;

  const userStr = params.get("user");
  return userStr ? JSON.parse(userStr) : null;
}

/* ─────────────────────────────────────────
   ROUTES
───────────────────────────────────────── */

// POST /api/auth/telegram
app.post("/api/auth/telegram", (req, res) => {
  const { initData } = req.body ?? {};
  if (!initData) return res.status(400).json({ error: "initData required" });

  const tgUser = validateTelegramInitData(initData);
  if (!tgUser) return res.status(401).json({ error: "Invalid initData" });

  const userId   = String(tgUser.id);
  const username = tgUser.first_name ?? "Player";

  // Upsert пользователя
  db.prepare(`
    INSERT INTO users (id, username)
    VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET username = excluded.username
  `).run(userId, username);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);

  res.json({
    userId:    user.id,
    username:  user.username,
    bestScore: user.best_score,
    coins:     user.coins,
  });
});

// POST /api/scores
app.post("/api/scores", (req, res) => {
  const { userId, score, coins } = req.body ?? {};
  if (!userId || score == null) return res.status(400).json({ error: "userId and score required" });

  const s     = parseFloat(score);
  const c     = parseInt(coins, 10) || 0;

  // Сохраняем результат
  db.prepare("INSERT INTO scores (user_id, score, coins) VALUES (?, ?, ?)").run(userId, s, c);

  // Обновляем рекорд и монеты пользователя
  db.prepare(`
    UPDATE users
    SET best_score = MAX(best_score, ?),
        coins = coins + ?
    WHERE id = ?
  `).run(s, c, userId);

  // Возвращаем ранг
  const rank = db.prepare(`
    SELECT COUNT(*) + 1 AS rank FROM users WHERE best_score > ?
  `).get(s);

  res.json({ ok: true, rank: rank.rank });
});

// GET /api/leaderboard?limit=10
app.get("/api/leaderboard", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

  const rows = db.prepare(`
    SELECT id AS userId, username, best_score AS score
    FROM users
    ORDER BY best_score DESC
    LIMIT ?
  `).all(limit);

  res.json(rows);
});

// GET /api/leaderboard/rank/:userId
app.get("/api/leaderboard/rank/:userId", (req, res) => {
  const user = db.prepare("SELECT best_score FROM users WHERE id = ?").get(req.params.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const rank = db.prepare(`
    SELECT COUNT(*) + 1 AS rank FROM users WHERE best_score > ?
  `).get(user.best_score);

  res.json({ rank: rank.rank });
});

/* ─────────────────────────────────────────
   START
───────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`✅ Flappy TG server running on port ${PORT}`);
  console.log(`   BOT_TOKEN: ${BOT_TOKEN ? "set ✓" : "NOT SET (dev mode)"}`);
});
