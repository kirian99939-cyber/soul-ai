import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if(req.method === "OPTIONS") return res.status(200).end();

  const secret = process.env.THREADS_APP_SECRET;
  const code = req.query.code;

  if(!code || !secret) return res.status(500).json({ error: "Missing code or secret" });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  try {
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

    await supabase.from("soul_store").upsert({ key: "threads_token", value: d1.access_token });

    return res.status(200).json({ success: true, note: "token saved to supabase", user_id: String(d1.user_id) });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
