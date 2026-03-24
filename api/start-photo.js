export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if(req.method === "OPTIONS") return res.status(200).end();

  const key = process.env.NANOBANANA_API_KEY;
  const { postText, persona } = req.body || {};

  const ap = persona?.appearance || {};
  const hairColor = ap.hair === "#C45518" ? "copper red curly" : "natural";
  const preset = `${persona?.age || 30} year old Russian woman, ${hairColor} hair, blue eyes, light freckles, natural makeup, authentic lifestyle photography`;

  // Ask Claude to determine the best scene for the post
  let scene = "woman in a natural candid moment, authentic lifestyle";
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
        max_tokens: 150,
        messages: [{
          role: "user",
          content: `Прочитай этот пост от женщины-блогера и опиши одной строкой на английском — какую сцену/момент лучше всего сфотографировать чтобы визуально дополнить этот пост. Только сцена, без пояснений, максимум 20 слов.

Пост: "${postText}"

Примеры ответов:
- "woman sitting by window with coffee, looking outside thoughtfully"
- "woman packing a small backpack, minimal clothes on bed"
- "woman walking alone on city street, looking confident"
- "woman sitting on floor surrounded by clothes, deciding what to wear"`
        }]
      })
    });
    const sceneData = await sceneRes.json();
    scene = sceneData.content?.[0]?.text?.trim() || scene;
    console.log("Claude scene:", scene);
  } catch(e) {
    console.warn("Claude scene detection failed:", e.message);
  }

  // Phone camera aesthetic prompt
  const visualCode = persona?.soul?.visualCode || "";
  const photoStyle = visualCode
    ? `${visualCode}. Shot on iPhone, slight grain, candid moment, authentic.`
    : "shot on iPhone, slightly overexposed, natural candid moment, real person photo, slight grain and noise, imperfect framing, authentic lifestyle photography, no filters, raw and real, 4:5 vertical";

  const prompt = `${preset}. ${scene}. ${photoStyle}. No text, no watermarks.`;
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
