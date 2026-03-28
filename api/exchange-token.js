export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if(req.method === "OPTIONS") return res.status(200).end();

  const token = req.query.token || process.env.THREADS_ACCESS_TOKEN;
  const secret = process.env.THREADS_APP_SECRET;

  if(!token || !secret) {
    return res.status(500).json({ error: "Missing env vars" });
  }

  try {
    const r = await fetch(
      `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${secret}&access_token=${token}`
    );
    const data = await r.json();
    return res.status(200).json(data);
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
