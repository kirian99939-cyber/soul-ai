export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if(req.method === "OPTIONS") return res.status(200).end();

  const key = process.env.NANOBANANA_API_KEY;
  const { postText, persona, season, city, narrativeBit, dayTitle, shotIndex, totalShots } = req.body || {};

  const ap = persona?.appearance || {};
  const hairColor = ap.hair === "#C45518" ? "copper red curly" : "natural";
  const preset = `${persona?.age || 30} year old Russian woman, ${hairColor} hair, blue eyes, light freckles, natural makeup, authentic lifestyle photography`;

  // Get real Street View photos for location
  let locationPhotos = [];
  if(city) {
    try {
      const baseUrl = process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3000";
      const locRes = await fetch(
        `${baseUrl}/api/location-photos?city=${encodeURIComponent(city)}`
      );
      const locData = await locRes.json();
      if(locData.photos?.length) {
        locationPhotos = locData.photos.slice(0, 2);
        console.log("Got location photos for:", locData.city);
      }
    } catch(e) {
      console.log("Location photos failed:", e.message);
    }
  }

  // Claude writes cinematic prompt
  const cinematicPromptRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.VITE_ANTHROPIC_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `Ты — кинематографический фотограф. Снимаешь фото №${(shotIndex||0)+1} из ${totalShots||3} — фотоотчёт одного дня.

ПЕРСОНАЖ: ${preset}
СОБЫТИЕ ДНЯ: ${dayTitle || ""}
НАРРАТИВНЫЙ БИТ: ${narrativeBit || ""}
ПОСТ: "${postText}"
ГОРОД: ${city || "неизвестно"}
СЕЗОН: ${season}
ВИЗУАЛЬНЫЙ КОД: ${persona?.soul?.visualCode || "экстремальный lifestyle, живые эмоции"}

ПРАВИЛО СЕРИИ: все ${totalShots||3} фото — один день, одна одежда, похожая локация.
Но каждое фото — другой момент дня, другая эмоция, другое действие.

Момент для фото №${(shotIndex||0)+1} — выбери один из подходящих:
- Ранний момент (готовится, едет, приходит на место)
- Главный момент события (кульминация)
- Бэкстейдж (закулисье, пауза между моментами)
- Живая пауза (кофе, смеётся, звонит, смотрит вдаль)
- Финал дня (уходит, смотрит на закат, довольная/усталая)

Напиши промпт на английском:
1. Using reference photo, preserve exact face features, hair color and texture
2. SAME outfit throughout the series
3. Конкретная точка съёмки и момент
4. Только естественный свет
5. iPhone grain и артефакты
6. Формат 4:5

ТОНАЛЬНОСТЬ ФОТО — выбери подходящую под контекст:
- Если это обычный день, прогулка, кофе, разговор → "candid iPhone snapshot, accidental beauty, not posed, caught in motion, imperfect framing, real life"
- Если это событие/фотосессия/мероприятие → можно "editorial lifestyle, natural light portrait, authentic moment"
- Если это экшн/спорт/экстрим → "action shot, motion blur, raw energy, caught mid-movement"

Никогда: studio lighting, perfect pose, professional photography, glamour, high fashion gloss.
Всегда: grain, slight overexposure or underexposure, human imperfection, real emotion.

Только промпт, без пояснений.`
        }]
      })
  });

  const cinematicData = await cinematicPromptRes.json();
  const prompt = cinematicData.content?.[0]?.text?.trim() || `${preset}. Shot on iPhone, authentic, photorealistic. Vertical 4:5.`;

  console.log("Cinematic prompt:", prompt);

  // Используй этот промпт для NanoBanana
  const referencePhotos = (persona?.referencePhotos || []).slice(0, 3);
  const allImageUrls = [...referencePhotos, ...locationPhotos].filter(Boolean).slice(0, 5);

  try {
    const submitRes = await fetch("https://api.nanobananaapi.ai/api/v1/nanobanana/generate-pro", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        prompt,
        imageUrls: allImageUrls,
        resolution: "2K",
        aspectRatio: "4:5",
      }),
    });
    const d = await submitRes.json();
    const taskId = d?.data?.taskId;
    if(!taskId) return res.status(500).json({ error: "No taskId", raw: d });
    return res.status(200).json({ taskId });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
