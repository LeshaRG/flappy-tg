/**
 * api.js — клиент для Node.js бэкенда.
 * Все запросы идут через этот модуль.
 */
import CONFIG from "./config.js";

const BASE = CONFIG.API.BASE_URL;
const TIMEOUT = CONFIG.API.TIMEOUT_MS;

/**
 * Обёртка fetch с таймаутом.
 */
async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(BASE + path, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      ...options,
    });
    clearTimeout(tid);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(tid);
    console.warn("[API]", path, err.message);
    return null;           // null = сервер недоступен, играем оффлайн
  }
}

/* ─────────────────────────────────────────
   USER
───────────────────────────────────────── */

/**
 * Регистрация / авторизация через Telegram initData.
 * Сервер валидирует подпись и возвращает { userId, username, bestScore, coins }.
 */
export async function authTelegram(initData) {
  return apiFetch("/auth/telegram", {
    method: "POST",
    body: JSON.stringify({ initData }),
  });
}

/* ─────────────────────────────────────────
   SCORES
───────────────────────────────────────── */

/**
 * Отправить результат после игры.
 * @param {string} userId
 * @param {number} score
 * @param {number} coins  — монеты собранные за эту сессию
 */
export async function submitScore(userId, score, coins) {
  return apiFetch("/scores", {
    method: "POST",
    body: JSON.stringify({ userId, score, coins }),
  });
}

/**
 * Получить топ-N игроков.
 * @param {number} limit
 * @returns {Array<{ rank, username, score }>|null}
 */
export async function getLeaderboard(limit = 10) {
  return apiFetch(`/leaderboard?limit=${limit}`);
}

/**
 * Получить позицию конкретного игрока в таблице.
 * @param {string} userId
 */
export async function getPlayerRank(userId) {
  return apiFetch(`/leaderboard/rank/${userId}`);
}
