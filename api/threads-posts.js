/**
 * SOUL AI — Threads Scraper
 * Provider: EnsembleData (ensembledata.com)
 * Env var: ENSEMBLEDATA_TOKEN
 */

const BASE = "https://ensembledata.com/apis";

const KEYWORDS = [
  "solo travel женщины",
  "капсульный гардероб",
  "терапия отношения",
  "жизнь после 30",
  "уверенность стиль",
  "путешествие одна",
  "базовый гардероб",
  "осознанность мода",
];

async function searchThreads(keyword, token) {
  try {
    const url = `${BASE}/threads/post/search?keyword=${encodeURIComponent(keyword)}&token=${token}&max_depth=1`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const posts = data?.data || data?.posts || [];
    return posts.slice(0, 4).map(p => {
      const text = p.caption?.text || p.text || "";
      const likes = p.like_count || 0;
      const replies = p.text_post_app_info?.direct_reply_count || 0;
      const postCode = p.code || p.shortcode || p.pk || p.id || "";
      const username = p.user?.username || "threads";
      return {
        id: p.pk || p.id || String(Date.now() + Math.random()),
        author: `@${username}`,
        postUrl: postCode ? `https://www.threads.net/@${username}/post/${postCode}` : `https://www.threads.net/@${username}`,
        text: text.trim(),
        likes,
        replies,
        keyword,
        viral: Math.min(99, 50 + Math.floor((likes / 100) * 10) + Math.floor(replies / 5)),
        source: "threads_live",
        fetchedAt: new Date().toISOString(),
      };
    }).filter(p => p.text.length > 30);
  } catch (e) {
    return [];
  }
}

function getFallback() {
  return [
    { id:"fb1", author:"@maria.travels", text:"Уехала в Португалию на месяц одна. Никого не знаю, языка не знаю. Первые три дня плакала. Потом что-то щёлкнуло. Теперь не могу объяснить что изменилось, но изменилось всё.", likes:4821, replies:312, keyword:"solo travel", viral:95, source:"example" },
    { id:"fb2", author:"@style.notes", text:"Перестала покупать вещи на потом. Теперь только то, что надену завтра. Гардероб уменьшился втрое. Утром стало легче дышать.", likes:3240, replies:198, keyword:"гардероб", viral:92, source:"example" },
    { id:"fb3", author:"@psych.everyday", text:"Терапевт спросила: а что бы ты сделала если бы точно знала что не осудят? Я не смогла ответить. Два года прошло. Теперь знаю.", likes:6102, replies:445, keyword:"терапия", viral:97, source:"example" },
    { id:"fb4", author:"@honest.fashion", text:"Дорогая одежда не делает тебя увереннее. Проверено на себе. Уверенность — это когда ты знаешь зачем ты здесь, а не сколько стоит твоя куртка.", likes:2890, replies:221, keyword:"стиль", viral:88, source:"example" },
    { id:"fb5", author:"@life.after30", text:"30 лет. Впервые в жизни не знаю что будет через год. Раньше это пугало до паники. Сейчас — это и есть жизнь.", likes:5510, replies:380, keyword:"жизнь после 30", viral:94, source:"example" },
    { id:"fb6", author:"@run.think", text:"Начала бегать не чтобы похудеть. Бегаю чтобы голова замолчала хотя бы на 40 минут. Работает лучше любого антидепрессанта.", likes:1980, replies:167, keyword:"бег", viral:86, source:"example" },
  ];
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  const token = process.env.ENSEMBLEDATA_TOKEN;
  if (!token) return res.status(200).json({ posts: getFallback(), source: "fallback" });
  const keywords = KEYWORDS.sort(() => Math.random() - 0.5).slice(0, 3);
  const results = await Promise.allSettled(keywords.map(k => searchThreads(k, token)));
  const posts = results.flatMap(r => r.status === "fulfilled" ? r.value : []).sort((a,b) => b.viral - a.viral).slice(0, 12);
  return res.status(200).json({ posts: posts.length ? posts : getFallback(), source: posts.length ? "threads_live" : "fallback", fetchedAt: new Date().toISOString() });
}
