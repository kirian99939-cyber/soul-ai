export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if(req.method === "OPTIONS") return res.status(200).end();

  // Проверяем размер тела запроса
  const bodySize = JSON.stringify(req.body).length;
  console.log("Request body size:", Math.round(bodySize/1024), "KB");

  if(bodySize > 4000000) {
    console.error("Request too large:", Math.round(bodySize/1024), "KB");
    return res.status(413).json({ error: "Request too large. Reduce number of outfit reference images." });
  }

  const key = process.env.NANOBANANA_API_KEY;
  const { postText, persona, season, city, narrativeBit, dayTitle, shotIndex, totalShots, personaCity, arcArchetype, outfitDescription, outfitRefImage, outfitImages, arcContext, photoIdea } = req.body || {};

  const ap = persona?.appearance || {};
  const hairHex = ap.hair || "#888888";
  const hairDesc = {
    "#C45518": "copper red curly",
    "#8B4513": "dark brown straight",
    "#D4A017": "golden blonde wavy",
    "#1C1C1C": "dark black straight",
    "#F5CBA7": "light blonde",
    "#A0522D": "chestnut brown curly",
  }[hairHex] || "natural";

  const eyeDesc = {
    "#7AAAD4": "blue",
    "#4A7C59": "green",
    "#8B6914": "brown",
    "#5B5B5B": "grey",
    "#2C1810": "dark brown",
  }[ap.eyes || "#7AAAD4"] || "light";

  const frecklesDesc = ap.freckles ? "light freckles," : "";
  const skinDesc = ap.skin === "#F5D0B0" ? "fair skin" : ap.skin === "#D4956A" ? "medium skin" : "light skin";
  const age = persona?.age || 28;
  const pCity = persona?.city || personaCity || "";
  const nationality = pCity.toLowerCase().includes("москв") || pCity.toLowerCase().includes("петербург") || pCity.toLowerCase().includes("екатерин") ? "Russian" : "European";

  const preset = `${age} year old ${nationality} woman, ${hairDesc} hair, ${eyeDesc} eyes, ${frecklesDesc} ${skinDesc}, natural makeup, authentic lifestyle photography`;

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
          content: `You are a master photographer writing a hyper-specific NanoBanana Pro prompt. Study these examples of PERFECT prompts and follow the exact same structure and level of detail.

CHARACTER: ${preset}
EVENT: ${dayTitle || ""}
NARRATIVE: ${narrativeBit || ""}
POST: "${postText}"
LOCATION: ${arcContext ? `Arc journey: ${arcContext}` : (city || personaCity || persona?.city || "unknown")}
SEASON: ${season}
SHOT NUMBER: ${(shotIndex||0)+1} of ${totalShots||3}
OUTFIT: ${outfitDescription || "match the activity"}
ARCHETYPE: ${arcArchetype || "lifestyle"}
${outfitImagesArr.length > 0 ? `OUTFIT REFERENCE IMAGES PROVIDED (${outfitImagesArr.length} photos) — study these images carefully and replicate EXACTLY: the colors, cut, fabric texture, and style of the clothing shown. This is the most important consistency requirement.` : ""}

${arcArchetype === "adventure" ? `
${photoIdea ? `
PHOTO IDEA (already conceived — build the prompt around THIS specific shot):
"${photoIdea}"

Expand this idea into a full NanoBanana prompt following the structure:
1. Reference instruction
2. Exact camera position (based on the idea above)
3. The split-second moment
4. Skin realism
5. Natural lighting
6. Technical imperfections
7. Format
` : ""}
ADVENTURE MODE — write a prompt following THIS EXACT STRUCTURE:

1. REFERENCE INSTRUCTION (always first):
"Using reference photo, preserve exact face features, copper red curly hair, blue eyes, freckles."

2. HOW THE PHONE GOT THERE (make it specific and creative):
Examples: "shot on iPhone — phone taped with electrical tape to zipline carabiner facing forward", "phone held between teeth of a local fisherman sitting on adjacent rock", "phone fell from hands and is floating face-up on water surface", "phone propped against a coconut on the beach tilted at 45 degrees", "phone handed to a monkey who ran off and accidentally shot this"
Write YOUR version matching the day's activity.

3. CAMERA ANGLE (specific degrees and position):
Examples: "from directly below looking up at 90 degrees", "side angle 30 degrees upward", "strict bird's eye straight down", "from water surface level, horizontal", "from inside the cave looking toward the bright exit"
Write the angle that creates the most dramatic shot for THIS activity.

4. THE SPLIT-SECOND ACTION:
Describe the EXACT millisecond captured. She must be mid-action, never static.
Examples: "one foot still on rock, other already in air, body at point of no return", "whale shark filling entire upper frame, her eyes through mask plate showing pure shock", "falling horizontally above camera, paddle in one hand, board already gone sideways"
Include: what she's doing, her exact expression, what's happening around her.

5. SKIN AND PHYSICAL REALISM (always include):
"Skin alive: [specific details matching days of travel — pores, tan lines, specific mark from today's activity, sweat, salt water, dust, mascara situation, hair state from activity]"

6. LIGHTING (always natural only):
"Natural light only — [specific description: early morning Krabi sun hitting from the side creating long shadows on rock, underwater rays filtering from surface, single bare bulb above boxing ring, neon signs only, last rays of sunset through palm leaves]"
"No flash. Never."

7. TECHNICAL IMPERFECTIONS (make them specific):
"[Specific artifact visible: electrical tape in corner of frame, grain from night ISO, motion blur on everything except face, horizon tilted, chromatic aberration underwater, phone screen reflection visible, water drops on lens, bat blurred in motion in upper corner]"

8. FORMAT: based on activity — 4:5 for portrait moments, 9:16 for vertical action, 16:9 for horizontal scenes

LOCATION LOCK: Every visual detail must scream ${arcContext?.includes("Таиланд") || arcContext?.includes("Thailand") ? "THAILAND — limestone cliffs, emerald water, tuk-tuks, thai script signs, local thai people, tropical vegetation, thai architecture" : arcContext?.includes("Япон") || arcContext?.includes("Japan") ? "JAPAN — torii gates, japanese street signs, locals in traditional clothes, cherry blossoms or urban neon" : (city || personaCity || "the specific location from the narrative")}

Write ONLY the final prompt in English. Be as specific as these examples. No explanations.
` : `
Write a photorealistic iPhone photo prompt following this structure:
1. "Using reference photo, preserve exact face features, copper red curly hair, blue eyes, freckles."
2. How/where phone is positioned (creative, specific)
3. Exact camera angle with degrees
4. Split-second action description
5. Skin realism details
6. Natural lighting only (specific)
7. Technical imperfections
8. Format 4:5

Location must be: ${city || personaCity || persona?.city || "extract from narrative"}
Activity/outfit must match: ${narrativeBit || postText}
Shot ${(shotIndex||0)+1} of ${totalShots||3} — vary the angle and moment from other shots.

Write ONLY the prompt in English.
`}`
        }]
      })
  });

  const cinematicData = await cinematicPromptRes.json();
  const prompt = cinematicData.content?.[0]?.text?.trim() || `${preset}. Shot on iPhone, authentic, photorealistic. Vertical 4:5.`;

  console.log("Cinematic prompt:", prompt);

  // Используй этот промпт для NanoBanana
  const referencePhotos = (persona?.referencePhotos || []).slice(0, 3);
  const outfitImagesArr = Array.isArray(outfitImages) ? outfitImages : (outfitRefImage ? [outfitRefImage] : []);
  console.log("Outfit images count:", outfitImagesArr.length, "sizes:", outfitImagesArr.map(img => img ? Math.round(img.length/1024) + "KB" : "null"));

  // Обрезаем base64 если слишком большие — берём только первые 2 и resize
  const safeOutfitImages = outfitImagesArr.filter(Boolean).slice(0, 2);
  const allImageUrls = [...referencePhotos, ...safeOutfitImages, ...locationPhotos].filter(Boolean).slice(0, 8);

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
