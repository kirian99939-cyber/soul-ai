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
    const url = `${BASE}/threads/keyword/search?name=${encodeURIComponent(keyword)}&depth=1&token=${token}`;
    console.log("Fetching:", url.replace(token, "TOKEN_HIDDEN"));

    const res = await fetch(url);
    console.log("Response status:", res.status);

    if (!res.ok) {
      const errText = await res.text();
      console.log("Error body:", errText);
      return [];
    }

    const data = await res.json();
    console.log("Data keys:", Object.keys(data));
    console.log("Posts count:", (data?.data || []).length);

    const posts = data?.data || [];

    return posts.slice(0, 4).map(p => {
      const text = p.thread_items?.[0]?.post?.caption?.text || p.caption?.text || p.text || "";
      const post = p.thread_items?.[0]?.post || p;
      const username = post?.user?.username || "threads";
      const code = post?.code || "";
      return {
        id: post?.pk || String(Date.now() + Math.random()),
        author: `@${username}`,
        postUrl: code ? `https://www.threads.net/@${username}/post/${code}` : `https://www.threads.net/@${username}`,
        text: text.trim(),
        likes: post?.like_count || 0,
        replies: post?.text_post_app_info?.direct_reply_count || 0,
        keyword,
        viral: Math.min(99, 60 + Math.floor((post?.like_count || 0) / 100)),
        source: "threads_live",
      };
    }).filter(p => p.text.length > 30);

  } catch (e) {
    console.log("Fetch exception:", e.message);
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
  console.log("ENSEMBLEDATA_TOKEN exists:", !!process.env.ENSEMBLEDATA_TOKEN);
  console.log("Token value:", process.env.ENSEMBLEDATA_TOKEN?.slice(0, 8) + "...");
  console.log("Testing EnsembleData endpoint...");

  // TEST: direct EnsembleData call
  const testUrl = `https://ensembledata.com/apis/threads/keyword/search?name=travel&depth=1&token=${process.env.ENSEMBLEDATA_TOKEN}`;
  console.log("Test URL:", testUrl.replace(process.env.ENSEMBLEDATA_TOKEN, "HIDDEN"));
  const testRes = await fetch(testUrl);
  console.log("Test status:", testRes.status);
  const testData = await testRes.json();
  console.log("Test response:", JSON.stringify(testData).slice(0, 300));

  const token = process.env.ENSEMBLEDATA_TOKEN;
  if (!token) return res.status(200).json({ posts: getFallback(), source: "fallback" });
  const keywords = KEYWORDS.sort(() => Math.random() - 0.5).slice(0, 3);
  const results = await Promise.allSettled(keywords.map(k => searchThreads(k, token)));
  const posts = results.flatMap(r => r.status === "fulfilled" ? r.value : []).sort((a,b) => b.viral - a.viral).slice(0, 12);
  return res.status(200).json({ posts: posts.length ? posts : getFallback(), source: posts.length ? "threads_live" : "fallback", fetchedAt: new Date().toISOString() });
}
