export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if(req.method === "OPTIONS") return res.status(200).end();

  const key = process.env.NANOBANANA_API_KEY;
  const { postText, persona } = req.body || {};

  const ap = persona?.appearance || {};
  const hairColor = ap.hair === "#C45518" ? "copper red curly" : "natural";
  const preset = `${persona?.age || 30} year old Russian woman, ${hairColor} hair, blue eyes, light freckles, natural makeup, authentic lifestyle photography`;

  // Detect scene from post text
  const t = (postText || "").toLowerCase();
  let scene = "woman in a cozy indoor space, sitting naturally";
  if(t.includes("кофе") || t.includes("утр") || t.includes("завтрак"))
    scene = "woman holding a cup of coffee by the window, morning light";
  else if(t.includes("стамбул") || t.includes("турци") || t.includes("город") || t.includes("улиц"))
    scene = "woman on a city street, urban background, walking";
  else if(t.includes("грузи") || t.includes("тбилис") || t.includes("гор"))
    scene = "woman in mountains or georgian streets, travel mood";
  else if(t.includes("гардероб") || t.includes("одежд") || t.includes("стиль") || t.includes("образ"))
    scene = "woman looking at clothes or getting dressed, lifestyle";
  else if(t.includes("мам") || t.includes("дом") || t.includes("семь"))
    scene = "woman sitting at home, thoughtful, natural indoor light";
  else if(t.includes("бег") || t.includes("спорт") || t.includes("трениров"))
    scene = "woman after workout, natural gym or outdoor setting";
  else if(t.includes("терапи") || t.includes("психолог") || t.includes("чувств"))
    scene = "woman in a quiet moment, introspective, soft natural light";
  else if(t.includes("путешеств") || t.includes("аэропорт") || t.includes("самолёт"))
    scene = "woman at airport or with luggage, travel vibes";

  // Phone camera aesthetic prompt
  const phoneStyle = "shot on iPhone, slightly overexposed, natural candid moment, real person photo, slight grain and noise, imperfect framing, authentic lifestyle photography, no filters, raw and real, 4:5 vertical";

  const prompt = `${preset}. ${scene}. ${phoneStyle}. No text, no watermarks.`;
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
