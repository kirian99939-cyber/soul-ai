export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if(req.method === "OPTIONS") return res.status(200).end();

  const secret = process.env.THREADS_APP_SECRET;
  const code = req.query.code;

  if(!code || !secret) {
    return res.status(500).json({ error: "Missing code or secret" });
  }

  try {
    // Step 1: code → short token
    const r1 = await fetch("https://graph.threads.net/oauth/access_token", {
      method: "POST",
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      body: new URLSearchParams({
        client_id: "2052099912033809",
        client_secret: secret,
        grant_type: "authorization_code",
        redirect_uri: "https://soul-ai-drab.vercel.app",
        code,
      })
    });
    const d1 = await r1.json();
    if(!d1.access_token) return res.status(500).json({ error: "Step 1 failed", raw: d1 });

    // Step 2: short → long token
    const r2 = await fetch(`https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${secret}&access_token=${d1.access_token}`);
    const d2 = await r2.json();
    if(!d2.access_token) {
      return res.status(200).json({ token: d1.access_token, user_id: String(d1.user_id), note: "short-lived only, 1hr" });
    }

    return res.status(200).json({ token: d2.access_token, expires_in: d2.expires_in, user_id: String(d1.user_id) });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
