const BASE = "https://ensembledata.com/apis";

const KEYWORDS = [
  "путешествие",
  "гардероб",
  "терапия",
  "уверенность",
  "стиль",
];

async function searchThreads(keyword, token) {
  try {
    const url = `${BASE}/threads/keyword/search?name=${encodeURIComponent(keyword)}&depth=1&token=${token}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.data || [];
    return items.slice(0, 4).map(item => {
      const post = item?.node?.thread?.thread_items?.[0]?.post || item?.thread_items?.[0]?.post || {};
      const text = post?.caption?.text || post?.text || "";
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
    return [];
  }
}

function getFallback() {
  return [
    { id:"fb1", author:"@maria.travels", postUrl:"https://www.threads.net/@maria.travels", text:"Уехала в Португалию на месяц одна. Никого не знаю, языка не знаю. Первые три дня плакала. Потом что-то щёлкнуло. Теперь не могу объяснить что изменилось, но изменилось всё.", likes:4821, replies:312, keyword:"solo travel", viral:95, source:"example" },
    { id:"fb2", author:"@style.notes", postUrl:"https://www.threads.net/@style.notes", text:"Перестала покупать вещи на потом. Теперь только то, что надену завтра. Гардероб уменьшился втрое. Утром стало легче дышать.", likes:3240, replies:198, keyword:"гардероб", viral:92, source:"example" },
    { id:"fb3", author:"@psych.everyday", postUrl:"https://www.threads.net/@psych.everyday", text:"Терапевт спросила: а что бы ты сделала если бы точно знала что не осудят? Я не смогла ответить. Два года прошло. Теперь знаю.", likes:6102, replies:445, keyword:"терапия", viral:97, source:"example" },
    { id:"fb4", author:"@honest.fashion", postUrl:"https://www.threads.net/@honest.fashion", text:"Дорогая одежда не делает тебя увереннее. Проверено на себе. Уверенность — это когда ты знаешь зачем ты здесь, а не сколько стоит твоя куртка.", likes:2890, replies:221, keyword:"стиль", viral:88, source:"example" },
    { id:"fb5", author:"@life.after30", postUrl:"https://www.threads.net/@life.after30", text:"30 лет. Впервые в жизни не знаю что будет через год. Раньше это пугало до паники. Сейчас — это и есть жизнь.", likes:5510, replies:380, keyword:"жизнь после 30", viral:94, source:"example" },
    { id:"fb6", author:"@run.think", postUrl:"https://www.threads.net/@run.think", text:"Начала бегать не чтобы похудеть. Бегаю чтобы голова замолчала хотя бы на 40 минут. Работает лучше любого антидепрессанта.", likes:1980, replies:167, keyword:"бег", viral:86, source:"example" },
  ];
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const token = process.env.ENSEMBLEDATA_TOKEN;
  if (!token) return res.status(200).json({ posts: getFallback(), source: "fallback" });

  const keywords = KEYWORDS.sort(() => Math.random() - 0.5).slice(0, 2);
  const results = await Promise.allSettled(keywords.map(k => searchThreads(k, token)));
  const posts = results
    .flatMap(r => r.status === "fulfilled" ? r.value : [])
    .sort((a, b) => b.viral - a.viral)
    .slice(0, 12);

  return res.status(200).json({
    posts: posts.length > 0 ? posts : getFallback(),
    source: posts.length > 0 ? "threads_live" : "fallback",
    fetchedAt: new Date().toISOString(),
  });
}
