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
          content: `Ты — друг который снимает на iPhone, не фотограф. Твоя задача написать промпт который выглядит как настоящее фото из жизни, а не постановочная съёмка.

ПЕРСОНАЖ: ${preset}
СОБЫТИЕ: ${dayTitle || ""}
НАРРАТИВНЫЙ БИТ: ${narrativeBit || ""}
ПОСТ: "${postText}"
ГОРОД: ${city || "неизвестно"}
СЕЗОН: ${season}
АТМОСФЕРА АККАУНТА: ${persona?.soul?.visualCode || "живые моменты, настоящие эмоции"}

ЭТО ФОТО №${(shotIndex||0)+1} ИЗ ${totalShots||3} — все фото одного дня, одна одежда, одна прическа.

Напиши промпт на английском. Обязательно включи:

КАМЕРА (выбери одно):
- "shot on iPhone 15 Pro, 26mm lens, f/1.8, natural HDR"
- "shot on iPhone 14, slightly overexposed, candid snapshot"
- "iPhone photo, accidental zoom, imperfect framing"

ПЛЕНОЧНАЯ ЭСТЕТИКА (выбери одно):
- "Kodak Portra 400 film grain, warm tones"
- "Fujifilm aesthetic, slight color shift"
- "digital noise, ISO 1600 look"

ЖИВОСТЬ (всегда включай):
- "candid, not posed, caught in the moment"
- "natural expression, mid-movement"
- "imperfect composition, slightly off-center"
- "RAW unedited look"

АРТЕФАКТЫ (выбери 1-2):
- "slight motion blur on hands"
- "lens flare from window light"
- "shallow depth of field, background slightly out of focus"
- "slight overexposure on highlights"
- "faint lens scratch artifact"

МОМЕНТ ДЛЯ ФОТО №${(shotIndex||0)+1} — выбери один из:
1 → главный момент события, живая эмоция
2 → бэкстейдж, закулисье, пауза между моментами
3 → деталь крупным планом (руки, одежда, предмет, текстура)
4 → широкий план, она в контексте места
5 → живая пауза (кофе, смеётся, звонит, смотрит вдаль)

ЗАПРЕЩЕНО: studio lighting, perfect pose, professional photography, glamour shot, high fashion, AI-generated look, plastic skin, oversaturated colors.

ОБЯЗАТЕЛЬНО: Using reference photo, preserve exact face features, hair color and texture. Format 4:5.

Только промпт, без пояснений. Пиши конкретно и сенсорно — что именно происходит в эту секунду.`
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
