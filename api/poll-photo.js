export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if(req.method === "OPTIONS") return res.status(200).end();

  const { taskId } = req.query;
  const key = process.env.NANOBANANA_API_KEY;

  if(!taskId) return res.status(400).json({ error: "taskId required" });

  try {
    const r = await fetch(`https://api.nanobananaapi.ai/api/v1/nanobanana/task-detail?taskId=${taskId}`, {
      headers: { "Authorization": `Bearer ${key}` },
    });
    const d = await r.json();
    console.log("Poll response:", JSON.stringify(d).slice(0, 500));

    const status = d?.data?.status || d?.status || "pending";
    const imageUrl = d?.data?.result_urls?.[0] || d?.data?.result_urls || d?.data?.imageUrl;

    return res.status(200).json({ status, imageUrl: imageUrl || null, raw: d?.data });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
