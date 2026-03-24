export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if(req.method === "OPTIONS") return res.status(200).end();

  const key = process.env.NANOBANANA_API_KEY;
  const { postText, persona } = req.body || {};

  const ap = persona?.appearance || {};
  const hairColor = ap.hair === "#C45518" ? "copper red curly" : "natural";
  const preset = `${persona?.age || 30} year old Russian woman, ${hairColor} hair, blue eyes, light freckles, natural makeup, authentic lifestyle photography`;

  const t = (postText || "").toLowerCase();
  let photoType = "candid portrait, soft natural window light";
  if(t.includes("кофе") || t.includes("утр")) photoType = "hands holding coffee cup, cozy morning";
  if(t.includes("путешеств") || t.includes("город")) photoType = "woman in beautiful city street, travel";
  if(t.includes("гардероб") || t.includes("одежд")) photoType = "woman getting dressed, mirror reflection";
  if(t.includes("природ") || t.includes("гор")) photoType = "woman in nature, atmospheric";

  const prompt = `${preset}. ${photoType}. Instagram lifestyle, vertical 4:5, photorealistic, warm tones, no text.`;
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
