// Vercel serverless function — browser sirf isko call karta hai (/api/id)
// Apps Script URL aur secret Vercel ke Environment Variables mein rehte hain, code mein nahi.
//
// Vercel > Project > Settings > Environment Variables:
//   SCRIPT_URL  = Apps Script web app URL (.../exec)
//   API_SECRET  = wahi secret jo Code.gs mein API_SECRET hai
//   APP_PIN     = (optional) agar set karo to app use karne ke liye PIN lagega

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const { SCRIPT_URL, API_SECRET, APP_PIN } = process.env;
  if (!SCRIPT_URL || !API_SECRET) {
    return res.status(500).json({ ok: false, error: 'Server setup incomplete' });
  }

  // Optional PIN check
  if (APP_PIN && req.headers['x-pin'] !== APP_PIN) {
    return res.status(401).json({ ok: false, error: 'Galat PIN' });
  }

  let params;
  if (req.method === 'GET') {
    params = { action: 'recent' };
  } else if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const gender = String(body.gender || '').toUpperCase();
    const type = String(body.type || '').toUpperCase();
    if (!['M', 'F'].includes(gender) || !['I', 'L'].includes(type)) {
      return res.status(400).json({ ok: false, error: 'Invalid input' });
    }
    params = { gender, type, note: String(body.note || '').slice(0, 200) };
  } else {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const url = SCRIPT_URL + '?' + new URLSearchParams({ ...params, key: API_SECRET });
    const r = await fetch(url, { redirect: 'follow' });
    const data = await r.json();
    return res.status(data.ok ? 200 : 400).json(data);
  } catch (err) {
    return res.status(502).json({ ok: false, error: 'Google Sheet se connect nahi ho saka' });
  }
};
