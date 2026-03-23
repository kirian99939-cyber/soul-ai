/**
 * SOUL AI — Trends Aggregator
 * Vercel Serverless Function
 *
 * Sources:
 *   1. Google Trends RSS (Russia, no auth needed)
 *   2. Telegram public channels (t.me/s/)
 *   3. Fallback: curated static trends
 */

const TELEGRAM_CHANNELS = [
  "marketolog",        // маркетинг
  "fashionfeed",       // мода
  "trendstoday",       // тренды
  "the_trends",        // тренды
  "womenstyle_ru",     // женский стиль
  "therapynotes",      // психология
  "selfdevclub",       // саморазвитие
  "traveldiary_ru",    // путешествия
];

const GOOGLE_TRENDS_RSS =
  "https://trends.google.com/trending/rss?geo=RU";

// ── Fetch Google Trends ──────────────────────────────────
async function fetchGoogleTrends() {
  try {
    const res = await fetch(GOOGLE_TRENDS_RSS, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const xml = await res.text();
    const items = [...xml.matchAll(/<title><!\[CDATA\[(.+?)\]\]><\/title>/g)];
    return items
      .slice(1, 16) // skip feed title
      .map((m) => ({
        text: m[1],
        source: "google",
        score: Math.floor(Math.random() * 30) + 70,
      }));
  } catch (e) {
    console.error("Google Trends error:", e.message);
    return [];
  }
}

// ── Fetch Telegram public channel ───────────────────────
async function fetchTelegramChannel(channel) {
  try {
    const res = await fetch(`https://t.me/s/${channel}`, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/html",
      },
    });
    const html = await res.text();

    // Extract post texts
    const posts = [
      ...html.matchAll(
        /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g
      ),
    ]
      .slice(0, 5)
      .map((m) => {
        const text = m[1]
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 120);
        return text;
      })
      .filter((t) => t.length > 20);

    return posts.map((text) => ({
      text,
      source: `telegram:${channel}`,
      score: Math.floor(Math.random() * 25) + 60,
    }));
  } catch (e) {
    return [];
  }
}

// ── Fallback curated trends ──────────────────────────────
function getFallbackTrends() {
  const date = new Date();
  const month = date.getMonth();

  const seasonal = {
    // spring
    2: ["весенний гардероб", "детокс после зимы", "путешествия в апреле"],
    3: ["капсульный гардероб весна", "outdoor активность", "весенние тренды"],
    4: ["майские праздники", "летний гардероб планирование"],
    // summer
    5: ["летний стиль", "пляжный гардероб", "travel лето"],
    6: ["отпуск соло", "летние тренды 2025", "лёгкий гардероб"],
    7: ["август в городе", "конец лета стиль"],
    // autumn
    8: ["осенний гардероб", "базовый гардероб осень", "возвращение в ритм"],
    9: ["осенние тренды", "slow fashion", "уютный стиль"],
    10: ["ноябрьский гардероб", "тёплые образы"],
    // winter
    11: ["зимний стиль", "новогодние образы", "уютный декабрь"],
    0: ["новогодние планы", "зимний капсульный гардероб"],
    1: ["февральский стиль", "весна скоро"],
  };

  const evergreen = [
    "solo travel женщина",
    "капсульный гардероб 2025",
    "базовый гардероб без переплат",
    "осознанное потребление мода",
    "стиль после 30",
    "психология стиля",
    "терапия и саморазвитие",
    "границы в отношениях",
    "работа и жизнь баланс",
    "женская уверенность",
    "slow life тренд",
    "цифровой детокс",
  ];

  const seasonalTopics = seasonal[month] || [];

  return [...seasonalTopics, ...evergreen].map((text, i) => ({
    text,
    source: "curated",
    score: 85 - i * 2,
  }));
}

// ── Main handler ─────────────────────────────────────────
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { sources = "google,telegram,curated" } = req.query;
  const sourceList = sources.split(",");

  const results = [];

  // 1. Google Trends
  if (sourceList.includes("google")) {
    const google = await fetchGoogleTrends();
    results.push(...google);
  }

  // 2. Telegram (pick 3 random channels to avoid rate limits)
  if (sourceList.includes("telegram")) {
    const channels = TELEGRAM_CHANNELS.sort(() => Math.random() - 0.5).slice(
      0,
      3
    );
    const telegramResults = await Promise.allSettled(
      channels.map(fetchTelegramChannel)
    );
    telegramResults.forEach((r) => {
      if (r.status === "fulfilled") results.push(...r.value);
    });
  }

  // 3. Curated fallback (always included for stability)
  if (sourceList.includes("curated")) {
    results.push(...getFallbackTrends());
  }

  // Deduplicate and sort by score
  const seen = new Set();
  const unique = results
    .filter((t) => {
      const key = t.text.toLowerCase().slice(0, 30);
      if (seen.has(key)) return false;
      seen.add(key);
      return t.text.length > 5;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);

  return res.status(200).json({
    trends: unique,
    fetchedAt: new Date().toISOString(),
    sources: sourceList,
  });
}
