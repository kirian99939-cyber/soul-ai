export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if(req.method === "OPTIONS") return res.status(200).end();
  if(req.method !== "POST") return res.status(405).end();

  const supabase = (await import("@supabase/supabase-js")).createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );
  const { data: tokenData } = await supabase
    .from("soul_store")
    .select("value")
    .eq("key", "threads_token")
    .single();
  const token = tokenData?.value || process.env.THREADS_ACCESS_TOKEN;
  const userId = process.env.THREADS_USER_ID;

  if(!token || !userId) {
    return res.status(200).json({
      success: false,
      mock: true,
      message: "THREADS_ACCESS_TOKEN not configured — post saved as published",
      postId: "mock_" + Date.now(),
    });
  }

  const { text, imageUrl } = req.body || {};
  if(!text) return res.status(400).json({ error: "text required" });

  try {
    // Step 1: Create container
    let containerBody = {
      media_type: imageUrl ? "IMAGE" : "TEXT",
      text,
    };
    if(imageUrl) containerBody.image_url = imageUrl;

    const containerRes = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(containerBody),
      }
    );
    const containerData = await containerRes.json();
    console.log("Container:", containerData);

    if(!containerData.id) {
      return res.status(500).json({ error: "Failed to create container", raw: containerData });
    }

    // Step 2: Wait 3s then publish
    await new Promise(r => setTimeout(r, 3000));

    const publishRes = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads_publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ creation_id: containerData.id }),
      }
    );
    const publishData = await publishRes.json();
    console.log("Publish:", publishData);

    if(!publishData.id) {
      return res.status(500).json({ error: "Failed to publish", raw: publishData });
    }

    return res.status(200).json({
      success: true,
      postId: publishData.id,
      url: `https://www.threads.net/post/${publishData.id}`,
    });

  } catch(e) {
    console.error("Publish error:", e);
    return res.status(500).json({ error: e.message });
  }
}
