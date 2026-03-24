/**
 * SOUL AI — Photo Generation via NanoBanana API
 * Docs: https://docs.nanobananaapi.ai
 * Env: NANOBANANA_API_KEY
 */

const NB_BASE = "https://api.nanobananaapi.ai"; // уточним если другой

// Пресет внешности Леры
function buildPersonaPreset(persona) {
  const ap = persona?.appearance || {};
  const hairColor = ap.hair === "#C45518" ? "copper red" : ap.hair === "#2C1810" ? "dark brown" : ap.hair === "#F5C842" ? "blonde" : "natural";
  const hairType = ap.hairType === "curly" ? "curly" : ap.hairType === "wavy" ? "wavy" : "straight";
  const eyeColor = ap.eyes === "#7AAAD4" ? "blue" : ap.eyes === "#4A7C59" ? "green" : ap.eyes === "#8B4513" ? "brown" : "light";
  const freckles = ap.freckles ? "with light freckles," : "";
  return `${persona?.age || 30} year old Russian woman, ${hairColor} ${hairType} hair, ${eyeColor} eyes, ${freckles} natural minimal makeup, authentic candid lifestyle photography`;
}

// Тип фото по тексту поста
function detectPhotoType(postText) {
  const t = postText.toLowerCase();
  if(t.includes("кофе") || t.includes("завтрак") || t.includes("утр"))
    return "hands holding coffee cup, cozy morning, soft light, close up";
  if(t.includes("путешеств") || t.includes("аэропорт") || t.includes("самолёт") || t.includes("город"))
    return "woman with backpack in a beautiful city street, travel photography";
  if(t.includes("зеркал") || t.includes("образ") || t.includes("гардероб") || t.includes("одежд"))
    return "woman getting dressed, mirror reflection, fashion lifestyle";
  if(t.includes("природ") || t.includes("лес") || t.includes("гор") || t.includes("море"))
    return "woman in nature, mountains or forest, dreamy atmospheric";
  if(t.includes("работ") || t.includes("ноутбук") || t.includes("кафе"))
    return "woman working in a cozy cafe, laptop, candid shot";
  if(t.includes("книг") || t.includes("читал") || t.includes("думал"))
    return "woman reading a book, thoughtful expression, soft bokeh";
  // default — atmospheric portrait
  return "candid portrait, soft natural window light, film grain, authentic emotion";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if(req.method === "OPTIONS") return res.status(200).end();
  if(req.method !== "POST") return res.status(405).end();

  const key = process.env.NANOBANANA_API_KEY;
  if(!key) return res.status(400).json({ error: "No NANOBANANA_API_KEY" });

  const { postText, persona } = req.body || {};
  if(!postText) return res.status(400).json({ error: "postText required" });

  const preset   = buildPersonaPreset(persona);
  const photoType = detectPhotoType(postText);
  const prompt   = `${preset}. ${photoType}. Instagram lifestyle photography, vertical 4:5, no text, photorealistic, warm tones.`;

  try {
    // Step 1: submit generation task
    const submitRes = await fetch(`${NB_BASE}/api/v1/nanobanana/generate-pro`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        prompt,
        imageUrls: (persona?.referencePhotos || []).slice(0, 5),
        resolution: "2K",
        aspectRatio: "4:5"
      }),
    });

    if(!submitRes.ok) {
      const err = await submitRes.text();
      return res.status(500).json({ error: `Submit failed: ${submitRes.status}`, details: err });
    }

    const submitData = await submitRes.json();
    const taskId = submitData.task_id || submitData.id || submitData.taskId;

    if(!taskId) return res.status(500).json({ error: "No task_id returned", raw: submitData });

    // Step 2: poll for result (max 30s)
    for(let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000));

      const pollRes = await fetch(`${NB_BASE}/api/v1/nanobanana/task/${taskId}`, {
        headers: { "Authorization": `Bearer ${key}` },
      });

      if(!pollRes.ok) continue;
      const pollData = await pollRes.json();

      const status = pollData.status || pollData.state;
      if(status === "completed" || status === "done" || status === "success") {
        const imageUrl = pollData.image_url || pollData.output?.[0] || pollData.result?.image_url;
        if(imageUrl) return res.status(200).json({ imageUrl, prompt, photoType });
      }
      if(status === "failed" || status === "error") {
        return res.status(500).json({ error: "Generation failed", raw: pollData });
      }
    }

    return res.status(408).json({ error: "Timeout — task still processing", taskId });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
