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
          content: `You are analyzing a social media post to write a photorealistic image prompt.

STEP 1 — EXTRACT FROM CONTEXT:
Read carefully and extract:
- WHERE is she? (city/country from the narrative, not from profile)
- WHAT is she wearing? (exact outfit described in narrative/post)
- WHAT is happening? (the specific event/activity)

NARRATIVE BIT: "${narrativeBit || ""}"
POST TEXT: "${postText}"
PROFILE CITY: ${city || "unknown"}

STEP 2 — WRITE PHOTO PROMPT for shot №${(shotIndex||0)+1} of ${totalShots||3}:

Rules:
- Location MUST match the narrative (if she's in India → India, if Japan → Japan, if Istanbul → Istanbul)
- Outfit MUST match what's described in narrative (if sari → sari, if kimono → kimono)
- All ${totalShots||3} shots: same location, same outfit, same hair, different moments of the day

CHARACTER: ${preset}
SEASON: ${season}
VISUAL DNA: ${persona?.soul?.visualCode || "authentic lifestyle, real emotions"}

SHOT TYPE for №${(shotIndex||0)+1}:
1 → Main action/emotion moment
2 → Candid detail (hands, texture, object)
3 → Wide shot with location context
4 → Backstage/pause moment
5 → Spontaneous reaction/surprise

CAMERA: randomly pick one:
- "shot on iPhone 15 Pro, 24mm, candid, slightly tilted"
- "iPhone 14 snapshot, imperfect framing, one-handed"
- "phone camera, caught mid-movement, natural"

FILM: randomly pick one:
- "Kodak Portra 400, warm grain"
- "Fujifilm aesthetic, punchy shadows"
- "ISO 1600 digital noise, raw snapshot"

ALWAYS: natural light, not posed, real skin texture, imperfect composition, RAW look
NEVER: studio lighting, perfect pose, AI-smooth skin, glamour

Using reference photo — preserve exact face features, copper red curly hair, blue eyes, freckles. Format 4:5.

Write ONLY the final prompt in English. No analysis, no explanations.`
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
