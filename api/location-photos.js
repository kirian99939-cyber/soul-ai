export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if(req.method === "OPTIONS") return res.status(200).end();

  const { city } = req.query;
  const key = process.env.GOOGLE_API_KEY;
  if(!city || !key) return res.status(400).json({ error: "city and GOOGLE_API_KEY required" });

  try {
    // Step 1: Geocoding — city name → coordinates
    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${key}`
    );
    const geoData = await geoRes.json();

    if(!geoData.results?.length) {
      return res.status(200).json({ photos: [], city, error: "City not found" });
    }

    const { lat, lng } = geoData.results[0].geometry.location;
    const formattedCity = geoData.results[0].formatted_address;
    console.log("City found:", formattedCity, lat, lng);

    // Step 2: Street View — get 3 photos from different angles
    const angles = [0, 90, 180];
    const photoUrls = angles.map(heading =>
      `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${lat},${lng}&heading=${heading}&pitch=10&fov=80&key=${key}`
    );

    // Step 3: Convert to base64 for NanoBanana
    const photoBase64 = await Promise.all(photoUrls.map(async url => {
      try {
        const r = await fetch(url);
        if(!r.ok) return null;
        const buffer = await r.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const contentType = r.headers.get("content-type") || "image/jpeg";
        return `data:${contentType};base64,${base64}`;
      } catch(e) {
        return null;
      }
    }));

    const validPhotos = photoBase64.filter(Boolean);
    console.log("Street View photos fetched:", validPhotos.length);

    return res.status(200).json({
      photos: validPhotos,
      city: formattedCity,
      coordinates: { lat, lng },
    });

  } catch(e) {
    console.error("Location photos error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
