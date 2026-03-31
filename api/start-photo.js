export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if(req.method === "OPTIONS") return res.status(200).end();

  const key = process.env.NANOBANANA_API_KEY;
  const { postText, persona, season, city, narrativeBit, dayTitle, shotIndex, totalShots, personaCity, arcArchetype, outfitDescription, outfitRefImage, arcContext } = req.body || {};

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
          content: `You are analyzing a social media post to write a photorealistic image prompt.

STEP 1 — DETERMINE LOCATION (critical):
Arc journey: "${arcContext || ""}"
Day narrative: "${narrativeBit || ""}"
Post text: "${postText}"
Persona city: "${personaCity || persona?.city || ""}"

LOCATION RULES:
1. Extract the COUNTRY from arc context first — this is the primary location for ALL photos
2. If arc says "Thailand" → every photo background must look like Thailand (tropical, palm trees, thai architecture, thai people, thai aerodromes etc)
3. If arc says "Bali" → Bali backgrounds always
4. The specific day activity may differ but LOCATION/COUNTRY must stay consistent
5. For skydiving in Thailand → thai aerodrome, flat rice fields visible from above, tropical landscape
6. NEVER use generic/European/Russian backgrounds if arc specifies an exotic location

EXTRACTED LOCATION FOR THIS PHOTO: [determine from above, be specific: "Thai aerodrome with rice fields", "Bali beach", "Tokyo street" etc]

STEP 2 — WRITE PHOTO PROMPT for shot №${(shotIndex||0)+1} of ${totalShots||3}:

Rules:
- Location MUST match the narrative (if she's in India → India, if Japan → Japan, if Istanbul → Istanbul)
- Outfit MUST match what's described in narrative (if sari → sari, if kimono → kimono)
- All ${totalShots||3} shots: same location, same outfit, same hair, different moments of the day

CHARACTER: ${preset}
SEASON: ${season}
VISUAL DNA: ${persona?.soul?.visualCode || "authentic lifestyle, real emotions"}

SHOT TYPE for №${(shotIndex||0)+1} — pick ONE, bias heavily toward first-person and candid:

FIRST-PERSON / POV shots (use for shots 1, 3, 5):
- Classic selfie: she holds phone at arm's length slightly above, casual angle, natural expression caught mid-moment, not posed — slight camera shake, thumb visible on edge
- Selfie in car mirror or rearview mirror, window reflection with city outside
- Bathroom mirror selfie, phone held up, messy hair, real life background visible
- Selfie with someone else — friend, local stranger, laughing together, candid
- Selfie attempt gone wrong — slightly blurry, cut off, too close, but real
- POV looking down at her own hands holding something (coffee, phone, fabric, food)
- POV feet walking — her shoes on pavement, sand, floor, stairs
- POV from behind her shoulder — she's looking at something ahead
- Mirror selfie — she holds phone, sees herself, imperfect angle
- Shadow selfie — her shadow on ground/wall, she looks down at it
- Hand reaching into frame toward something
- She films herself walking, camera at arm's length, slightly shaky

THIRD-PERSON candid (use for shots 2, 4):
- Friend caught her mid-laugh from across the table
- Zoomed in from distance, she doesn't know she's being photographed
- Through a window or doorway, slice of life

DETAIL shots (use for shot 3):
- Extreme close-up: her hands, jewelry, texture of fabric, food she's eating
- Object she's holding or touching, her fingers in frame

NEVER: posed portrait facing camera directly, professional headshot angle, model pose

CAMERA: randomly pick one:
- "shot on iPhone 15 Pro, 24mm, candid, slightly tilted"
- "iPhone 14 snapshot, imperfect framing, one-handed"
- "phone camera, caught mid-movement, natural"

FILM LOOK — choose based on context:
- If this is a photoshoot/editorial context: "clean sharp colors, natural contrast, editorial quality, no grain, crisp details"
- If this is a casual everyday moment: "subtle digital noise, natural colors, no color grading, no filters, no yellow tint, no vintage look"
- NEVER use: yellow tint, warm filter, Kodak Portra color cast, oversaturated warm tones, vintage film look, heavy grain

REALISM RULES:
- Colors must be natural and accurate — no artificial warming or cooling
- Skin tones must be realistic — no orange, no yellow cast
- If outdoor daylight: cool natural light, accurate white balance
- If indoor: realistic indoor lighting, no fake warmth
- The photo should look like it came straight from an iPhone camera roll — unedited, no VSCO, no Lightroom presets

${arcArchetype ? `
ARC ARCHETYPE VISUAL RULES — this is the most important styling directive:

${arcArchetype === "trial" ? `
🔥 ИСПЫТАНИЕ — Visual language of struggle and triumph:
- Camera: handheld, slightly shaky, like someone is running to catch the moment
- Light: harsh, directional, no softness — sunlight cutting through, dramatic shadows
- Movement: always mid-action, hair flying, clothes in motion, sweat visible
- Expression: jaw set, eyes fierce or tearful with determination, never relaxed
- Color: high contrast, slightly desaturated except for one hot color (red, orange)
- Imperfections: motion blur on edges, dust particles, lens flare from direct sun
- Composition: diagonal lines, subject slightly off-center, tension in the frame` : ""}

${arcArchetype === "depth" ? `
🌊 ПОГРУЖЕНИЕ — Visual language of introspection:
- Camera: still, deliberate, as if time has stopped
- Light: soft diffused window light, no harsh shadows, misty or overcast outdoor
- Movement: none — she is completely still, or one slow gesture (hand to face, eyes closing)
- Expression: eyes downcast or gazing far away, slight frown, processing something
- Color: muted, desaturated, cool blues and grays, like a rainy day filter
- Imperfections: slight focus softness, minimal grain, quiet frame
- Composition: lots of negative space around her, she is small in the frame` : ""}

${arcArchetype === "break" ? `
💥 РАЗРЫВ — Visual language of rupture and release:
- Camera: wide angle slightly distorted, or extreme close-up — no middle ground
- Light: harsh overhead or backlight creating silhouette, or very low moody light
- Movement: collapse, turning away, head in hands, or frozen mid-breakdown
- Expression: raw emotion — tears, open mouth, eyes red, completely unguarded
- Color: desaturated almost black and white, or very cold blue tones
- Imperfections: heavy grain, underexposed, shadows eating the frame
- Composition: broken, asymmetric, something feels wrong about the framing intentionally` : ""}

${arcArchetype === "discovery" ? `
✨ ОТКРЫТИЕ — Visual language of wonder and awakening:
- Camera: wide, exploratory, like seeing everything for the first time
- Light: golden hour, magic hour, light coming from unexpected angles, lens flare welcome
- Movement: turning toward something, hand reaching out, face lifting up
- Expression: wide eyes, half-smile of surprise, genuine delight, mouth slightly open
- Color: warm golden tones, rich and saturated but natural, glowing
- Imperfections: beautiful lens flare, slight overexposure on highlights, dreamy edges
- Composition: she is discovering something in the frame — her gaze leads the eye` : ""}

${arcArchetype === "masquerade" ? `
🎭 МАСКАРАД — Visual language of play and identity:
- Camera: unusual angles — from below, from above, through objects, reflections
- Light: mixed artificial and natural, neon, interesting color casts, theatrical
- Movement: performative, aware of the camera but playing with it
- Expression: knowing smirk, one eyebrow raised, caught between masks
- Color: unexpected color combinations, pops of saturated color
- Imperfections: reflection in glass, double exposure feel, something slightly surreal
- Composition: mirrors, windows, shadows that create a second version of her` : ""}

${arcArchetype === "chaos" ? `
🌀 ОТРЫВ — Visual language of pure unhinged energy:
- Camera: shaking, tilted 15-20 degrees, like thrown into the moment
- Light: night, neon, strobe-like flash, unpredictable mixed sources
- Movement: maximum — spinning, running, jumping, blurred limbs everywhere
- Expression: mouth open laughing or screaming, eyes wild, completely gone
- Color: oversaturated, blown highlights, colors bleeding into each other
- Imperfections: heavy motion blur, ISO noise cranked up, accidental double exposure
- Composition: rules completely broken — subject half out of frame, horizon tilted, chaos` : ""}

${arcArchetype === "adventure" ? `
🚀 ПРИКЛЮЧЕНЧЕСКИЙ РЕЖИМ — Visual language of pure adrenaline:
- Camera: extreme angles only — fisheye distortion, dutch tilt 25-35 degrees, from below looking up
- ALWAYS mid-action: jumping, running, spinning, climbing, hanging — never standing still
- Motion blur on background and limbs, face stays sharp
- Unexpected locations: rooftops, moving vehicles, market crowds, cliffs, doorways, fire escapes
- Expression: mouth open laughing or screaming, eyes wild, completely unhinged joy, zero self-consciousness
- Someone in background always looks shocked at what she's doing
- Multiple light sources clashing: neon + sunlight + shadow all in one frame
- Imperfections: tilted horizon, slight finger in frame, accidental flare, blown highlights
- Color: high contrast, punchy, oversaturated in a real-life way — not filtered
- Format 4:5 but composition feels like it wants to burst out of the frame
- NEVER: standing posed, calm expression, empty background, clean composition` : ""}
` : ""}

ALWAYS: natural light, not posed, real skin texture, imperfect composition, RAW look
NEVER: studio lighting, perfect pose, AI-smooth skin, glamour

Using reference photo — preserve exact face features, copper red curly hair, blue eyes, freckles. Format 4:5.

OUTFIT LOCK — use EXACTLY this in every shot, do not deviate:
"${outfitDescription || "same consistent outfit throughout all shots"}"
This outfit must be identical across all photos in this series.

ACTIVITY CHECK: If the narrative involves water/surfing/swimming → the outfit MUST be a swimsuit, wetsuit, or bikini. No regular clothes, no sneakers near water. If hiking → hiking boots and outdoor gear. Match the outfit to the physical activity described.
${outfitRefImage ? "REFERENCE OUTFIT IMAGE PROVIDED — use the exact clothing from the outfit reference image (image included in imageUrls). Replicate the exact colors, cut, fabric, and style of this outfit on the character." : ""}

Write ONLY the final prompt in English. No analysis, no explanations.`
        }]
      })
  });

  const cinematicData = await cinematicPromptRes.json();
  const prompt = cinematicData.content?.[0]?.text?.trim() || `${preset}. Shot on iPhone, authentic, photorealistic. Vertical 4:5.`;

  console.log("Cinematic prompt:", prompt);

  // Используй этот промпт для NanoBanana
  const referencePhotos = (persona?.referencePhotos || []).slice(0, 3);
  const outfitImages = outfitRefImage ? [outfitRefImage] : [];
  const allImageUrls = [...referencePhotos, ...outfitImages, ...locationPhotos].filter(Boolean).slice(0, 6);

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
