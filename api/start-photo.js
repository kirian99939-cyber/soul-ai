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
          content: `You are a friend shooting casual iPhone photos during a day in Japan. Write a photorealistic prompt for NanoBanana Pro.

CHARACTER: ${preset}
TODAY'S EVENT: ${dayTitle || ""}
NARRATIVE: ${narrativeBit || ""}
POST CONTEXT: "${postText}"
LOCATION: ${city || "Japan"}
SEASON: ${season}

OUTFIT LOCK — use EXACTLY this description in every prompt:
"${narrativeBit?.toLowerCase().includes("кимоно") || postText?.toLowerCase().includes("кимоно") || postText?.toLowerCase().includes("kimono") ? "wearing traditional Japanese kimono, specific pattern and colors consistent throughout" : "wearing her outfit from the day, same clothes in all shots"}"

SHOT №${(shotIndex||0)+1} of ${totalShots||3} — all shots same day, SAME outfit, SAME hair.

JAPAN AUTHENTICITY — include real Japan details like:
- Specific locations: narrow alley in Gion, konbini, torii gate, tatami room, ramen shop, Shinkansen platform, temple garden
- Real details: vending machines, noren curtains, paper lanterns, matcha, onigiri, street food stalls
- Japanese people around her as background
- Signs in Japanese visible

SHOT TYPE for №${(shotIndex||0)+1} — pick ONE:
1 → Action/movement: walking through torii gates, trying street food, laughing with locals
2 → Candid detail: hands holding matcha bowl, feet in wooden sandals, reflection in shop window
3 → Wide establishing: tiny figure in huge temple complex or busy Shibuya-style crossing
4 → Intimate backstage: fixing kimono in mirror, exhausted on train, eating alone at counter
5 → Surprise/reaction: tasting something unexpected, getting lost, discovering hidden alley

CAMERA STYLE — pick ONE randomly:
- "shot on iPhone 15 Pro, 24mm, slightly tilted, candid"
- "iPhone 14 snapshot, accidental zoom, imperfect framing"
- "phone camera, one-handed shot, motion blur on edges"

FILM LOOK — pick ONE:
- "Kodak Portra 400, warm grain, slight color bleed"
- "Fujifilm X100 aesthetic, punchy colors, real shadows"
- "digital noise, ISO 1600, authentic snapshot"

ALWAYS INCLUDE: natural light only, not posed, caught mid-moment, real skin texture, imperfect composition, RAW unedited look

NEVER: studio lighting, perfect pose, glamour, AI-smooth skin, oversaturated

Using reference photo — preserve exact face, copper red curly hair, blue eyes, freckles. Format 4:5.

Write only the prompt in English, no explanations. Be specific and sensory — what is happening THIS second.`
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
