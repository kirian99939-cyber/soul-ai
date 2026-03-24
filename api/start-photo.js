export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if(req.method === "OPTIONS") return res.status(200).end();

  const key = process.env.NANOBANANA_API_KEY;
  const { postText, persona } = req.body || {};

  const ap = persona?.appearance || {};
  const hairColor = ap.hair === "#C45518" ? "copper red curly" : "natural";
  const preset = `${persona?.age || 30} year old Russian woman, ${hairColor} hair, blue eyes, light freckles, natural makeup, authentic lifestyle photography`;

  // Shot types — как в реальном Instagram
  const SHOT_TYPES = [
    "selfie close-up, woman taking photo of herself, slight angle, natural expression",
    "mirror selfie full body, casual outfit, authentic",
    "woman from behind walking, viewer follows her journey",
    "woman's legs and feet, interesting floor or ground, travel detail",
    "woman's hands doing something — holding food, coffee, phone, book",
    "travel detail shot — local food on plate, street sign, architecture detail",
    "landscape or cityscape, no people, atmospheric mood",
    "window view from inside cafe or room, dreamy",
    "close-up texture detail — fabric, wall, nature, food",
    "overhead flat lay — bag contents, outfit pieces, travel items",
    "two women laughing together, candid moment with friend",
    "crowded market or street scene, woman in background",
    "extreme action blur — motorcycle, jumping, running, movement",
    "woman at unusual location — rooftop, cliff edge, inside cave, market",
    "night shot with city lights, woman silhouette or portrait",
  ];

  const t = (postText || "").toLowerCase();
  let shotPool = [...SHOT_TYPES];

  if(t.includes("подруг") || t.includes("встреч") || t.includes("вместе"))
    shotPool.push(...Array(3).fill("two women laughing together, candid moment with friend"));
  if(t.includes("ед") || t.includes("кофе") || t.includes("рестор") || t.includes("кафе"))
    shotPool.push(...Array(3).fill("woman's hands holding food or coffee cup, close-up detail"));
  if(t.includes("дорог") || t.includes("путешеств") || t.includes("улиц") || t.includes("город"))
    shotPool.push(...Array(3).fill("woman from behind walking on interesting street, travel vibes"));
  if(t.includes("страх") || t.includes("прыж") || t.includes("адренал") || t.includes("безум"))
    shotPool.push(...Array(3).fill("extreme action shot, movement blur, woman doing something wild"));
  if(t.includes("природ") || t.includes("гор") || t.includes("лес") || t.includes("море"))
    shotPool.push(...Array(3).fill("woman in dramatic nature landscape, small figure big scenery"));
  if(t.includes("одна") || t.includes("соло") || t.includes("сама"))
    shotPool.push(...Array(2).fill("woman from behind alone, contemplative, solo travel mood"));
  if(t.includes("селф") || t.includes("зеркал"))
    shotPool.push(...Array(3).fill("selfie close-up, natural light, authentic expression"));

  const shotType = shotPool[Math.floor(Math.random() * shotPool.length)];

  // Ask Claude for specific scene
  let scene = shotType;
  try {
    const sceneRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.VITE_ANTHROPIC_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 100,
        messages: [{
          role: "user",
          content: `Пост: "${postText}"
Тип кадра: ${shotType}
ДНК аккаунта: жадная до жизни, каждый день как приключение, камерная эстетика.

Опиши конкретную сцену на английском — 1 предложение, максимум 20 слов. Только сцена.`
        }]
      })
    });
    const sceneData = await sceneRes.json();
    scene = sceneData.content?.[0]?.text?.trim() || shotType;
    console.log("Scene:", scene, "| Shot type:", shotType);
  } catch(e) {
    console.warn("Claude scene failed:", e.message);
  }

  const visualCode = persona?.soul?.visualCode || "";
  const phoneStyle = "shot on iPhone, slight grain and noise, natural imperfect light, candid authentic moment, no filters, real person";

  const prompt = `${preset}. ${scene}. ${phoneStyle}. ${visualCode ? visualCode + "." : ""} Vertical 4:5, photorealistic, no text.`;
  const referencePhotos = (persona?.referencePhotos || []).slice(0, 3);

  try {
    const r = await fetch("https://api.nanobananaapi.ai/api/v1/nanobanana/generate-pro", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({ prompt, imageUrls: referencePhotos, resolution: "1K", aspectRatio: "4:5" }),
    });
    const d = await r.json();
    const taskId = d?.data?.taskId;
    if(!taskId) return res.status(500).json({ error: "No taskId", raw: d });
    return res.status(200).json({ taskId });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
