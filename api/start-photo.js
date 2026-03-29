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
          content: `Ты — кинематографический фотограф. Тебе нужно снять фото №${(shotIndex||0)+1} из ${totalShots||5} для одной истории.

ПЕРСОНАЖ: ${preset}
СОБЫТИЕ ДНЯ: ${dayTitle || ""}
НАРРАТИВНЫЙ БИТ: ${narrativeBit || ""}
ПОСТ: "${postText}"
ГОРОД: ${city || "неизвестно"}
СЕЗОН: ${season}
ВИЗУАЛЬНЫЙ КОД: ${persona?.soul?.visualCode || "экстремальный lifestyle, живые эмоции, кинематографичность"}

Это фото №${(shotIndex||0)+1} из ${totalShots||5} — фотоотчёт за один день.
Все фото: одна одежда, похожая локация или рядом, один день.
Но моменты разные — разные точки дня, разные эмоции, разные действия.

Идеи для разных моментов (выбери подходящий для номера ${(shotIndex||0)+1}):
- Ранний момент (готовится, едет, приходит)
- Главный момент события
- Бэкстейдж/закулисье
- Пауза (кофе, пауза, смотрит вдаль, звонит кому-то)
- Финал дня (усталая/довольная, уходит, смотрит на закат)

Напиши промпт на английском:
1. Using reference photo, preserve exact face features, hair color and texture
2. SAME outfit and location as other shots in the series
3. Конкретная точка съёмки
4. Конкретный момент действия
5. Только естественный свет
6. iPhone артефакты (grain, motion blur)
7. Формат 4:5

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
