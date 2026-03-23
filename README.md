# SOUL AI — Persona Content Engine

> Внутренний инструмент AINF · The Legend

## ⚡ Деплой за 10 минут

### 1. Клонируй и установи

```bash
git clone https://github.com/YOUR_ORG/soul-ai.git
cd soul-ai
npm install
```

### 2. Настрой переменные окружения

```bash
cp .env.example .env.local
# Открой .env.local и вставь ключи
```

**Получить ключи:**
- **Anthropic API Key** → https://console.anthropic.com → API Keys → Create Key
- **Supabase** (необязательно) → https://app.supabase.com → New Project → Settings → API

### 3. Supabase (если нужна синхронизация между устройствами)

```bash
# В Supabase: SQL Editor → вставь содержимое supabase-schema.sql → Run
```

Если Supabase не настроен — данные сохраняются в localStorage браузера.

### 4. Запуск локально

```bash
npm run dev
# → http://localhost:3000
```

### 5. Деплой на Vercel

```bash
# Вариант А — через CLI
npm i -g vercel
vercel

# Вариант Б — через GitHub
# 1. Запушь в GitHub
# 2. Зайди на vercel.com → New Project → Import репозиторий
# 3. Добавь Environment Variables (из .env.local)
# 4. Deploy
```

**Environment Variables в Vercel:**
```
VITE_ANTHROPIC_KEY     = sk-ant-...
VITE_SUPABASE_URL      = https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJ...
```

---

## 🏗 Структура проекта

```
soul-ai/
├── src/
│   ├── main.jsx        — точка входа React
│   ├── App.jsx         — весь SOUL AI (2000+ строк)
│   └── supabase.js     — storage layer (Supabase / localStorage)
├── index.html
├── vite.config.js
├── vercel.json
├── supabase-schema.sql — SQL для создания таблиц
└── .env.example        — шаблон переменных
```

---

## 🗺 Роадмап

**Фаза 1 — сейчас** ✅
- [x] Управление персонами
- [x] Редактор души (Mind Map созвездий)
- [x] Сознание (18 параметров + аура)
- [x] Нарративная арка (A→B)
- [x] Studio (генерация постов через Claude)
- [x] Библиотека контента

**Фаза 2 — фото** 🔜
- [ ] Интеграция Replicate / Midjourney
- [ ] Генерация фото под каждый пост
- [ ] Визуальный профиль персонажа

**Фаза 3 — тренды** 🔜
- [ ] Парсинг горячих тем (Threads, TikTok, Telegram)
- [ ] Автофильтрация через призму души персонажа
- [ ] Расписание публикаций

**Фаза 4 — мультибренд** 🔜
- [ ] Авторизация (Supabase Auth)
- [ ] Воркспейсы по брендам
- [ ] Биллинг (Stripe)

---

## 🔑 Безопасность

> Это внутренний инструмент без авторизации.  
> **Не публикуй URL публично** пока не добавишь auth.

Для закрытого доступа:
- Vercel → Settings → Password Protection (платный план)
- Или добавь базовый HTTP auth через middleware

---

## 📞 Контакт

Кирилл Мигурин · AINF · The Legend
