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

  console.log("NANOBANANA_API_KEY exists:", !!process.env.NANOBANANA_API_KEY);
  console.log("Request body:", JSON.stringify(req.body).slice(0, 200));

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

    console.log("NanoBanana status:", submitRes.status);
    const submitData = await submitRes.json();
    console.log("NanoBanana response:", JSON.stringify(submitData).slice(0, 500));

    if(!submitRes.ok) {
      console.error("NanoBanana error:", JSON.stringify(submitData));
      return res.status(500).json({ error: "NanoBanana failed", details: submitData });
    }
    const taskId = submitData?.data?.taskId;
    console.log("TaskId:", taskId);

    if(!taskId) {
      return res.status(500).json({ error: "No taskId", raw: submitData });
    }

    // Poll for result
    for(let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 3000));

      const pollRes = await fetch(`https://api.nanobananaapi.ai/api/v1/nanobanana/task/${taskId}`, {
        headers: { "Authorization": `Bearer ${process.env.NANOBANANA_API_KEY}` }
      });

      console.log(`Poll ${i+1} status:`, pollRes.status);
      const pollData = await pollRes.json();
      console.log(`Poll ${i+1} response:`, JSON.stringify(pollData).slice(0, 300));

      const status = pollData?.data?.status || pollData?.status;
      const imageUrl = pollData?.data?.imageUrl || pollData?.data?.output || pollData?.data?.image_url;

      if(imageUrl) {
        console.log("Got image:", imageUrl);
        return res.status(200).json({ imageUrl });
      }

      if(status === "failed" || status === "error") {
        return res.status(500).json({ error: "Generation failed", raw: pollData });
      }

      console.log(`Poll ${i+1} status value:`, status, "- waiting...");
    }

    return res.status(408).json({ error: "Timeout", taskId });

  } catch(e) {
    console.error("generate-photo error:", e.message, e.stack);
    return res.status(500).json({ error: e.message });
  }
}
