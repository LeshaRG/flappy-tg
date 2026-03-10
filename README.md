# Flappy TG — Setup Guide

## Структура файлов

```
├── index.html
├── game.js              ← точка входа Phaser
├── config.js            ← все константы
├── api.js               ← клиент для бэкенда
├── GameState.js         ← синглтон состояния
├── scenes/
│   ├── BootScene.js     ← загрузка ассетов + TG авторизация
│   ├── MenuScene.js     ← главное меню
│   ├── GameScene.js     ← игровой процесс
│   ├── GameOverScene.js ← экран конца
│   └── LeaderboardScene.js ← таблица лидеров
├── server.js            ← Node.js бэкенд
├── assets/              ← твои картинки (bg_far, wall, ch1..4 и т.д.)
└── phaser.min.js
```

---

## Запуск фронтенда

Нужен любой локальный HTTP-сервер (из-за ES modules):
```bash
npx serve .
# или
python3 -m http.server 8080
```

---

## Запуск бэкенда (Node.js)

```bash
npm install express better-sqlite3 cors
BOT_TOKEN=<твой_бот_токен> node server.js
```

> Без `BOT_TOKEN` сервер работает в dev-режиме — валидация Telegram отключена.

### Эндпоинты

| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/auth/telegram` | Авторизация через Telegram initData |
| POST | `/api/scores` | Сохранить результат игры |
| GET  | `/api/leaderboard?limit=10` | Топ игроков |
| GET  | `/api/leaderboard/rank/:userId` | Ранг игрока |

---

## Подключение бэкенда к игре

В `config.js` поменяй:
```js
API: {
  BASE_URL: "https://your-server.com/api", // ← твой адрес
}
```

---

## Деплой бэкенда

Простые варианты:
- **Railway** — `railway up` (бесплатно)
- **Render** — бесплатный tier
- **VPS** + nginx reverse proxy

---

## Этап 2 (следующий)

Что будем делать дальше:
- [ ] Анимации перехода между сценами
- [ ] Эффекты частиц при смерти / монетах
- [ ] Разные скины персонажа (за монеты)
- [ ] Уровни сложности
