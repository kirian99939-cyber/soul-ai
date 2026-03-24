export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if(req.method === "OPTIONS") return res.status(200).end();

  const { taskId } = req.query;
  const key = process.env.NANOBANANA_API_KEY;
  if(!taskId) return res.status(400).json({ error: "taskId required" });

  try {
    const r = await fetch(`https://api.nanobananaapi.ai/api/v1/nanobanana/record-info?taskId=${taskId}`, {
      headers: { "Authorization": `Bearer ${key}` },
    });
    const d = await r.json();
    console.log("Record-info response:", JSON.stringify(d).slice(0, 500));

    const successFlag = d?.data?.successFlag;
    const imageUrl = d?.data?.response?.resultImageUrl || d?.data?.response?.originImageUrl;

    if(successFlag === 1 && imageUrl) {
      return res.status(200).json({ status: "success", imageUrl });
    }
    if(successFlag === 2 || successFlag === 3) {
      return res.status(200).json({ status: "failed", error: d?.data?.errorMessage });
    }
    return res.status(200).json({ status: "pending", successFlag });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
