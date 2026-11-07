// Cloudflare Pages Function: accounts + cloud saves for The Quiet Outside 3D.
// Needs a KV namespace bound to this Pages project with the variable name SAVES.
const J = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});
const enc = new TextEncoder();
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
const token = () => { const a = new Uint8Array(24); crypto.getRandomValues(a); return hex(a); };
async function hashPw(pw, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100000 }, key, 256);
  return hex(bits);
}
function same(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function onRequest({ request, env, params }) {
  const KV = env.SAVES;
  if (!KV) return J({ error: 'Online saving is not set up on the server yet.' }, 503);
  const path = [].concat(params.path || []).join('/');
  const method = request.method;
  try {
    if (path === 'ping') return J({ ok: true });

    if ((path === 'signup' || path === 'login') && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const user = String(body.username || '').trim();
      const pw = String(body.password || '');
      if (!/^[A-Za-z0-9_]{3,20}$/.test(user)) return J({ error: 'Username must be 3–20 letters, numbers or _' }, 400);
      if (pw.length < 6 || pw.length > 100) return J({ error: 'Password must be at least 6 characters' }, 400);
      const key = 'user:' + user.toLowerCase();
      const existing = await KV.get(key, 'json');
      let name = user;
      if (path === 'signup') {
        if (existing) return J({ error: 'That username is already taken' }, 409);
        const salt = token();
        await KV.put(key, JSON.stringify({ name: user, salt, hash: await hashPw(pw, salt), created: Date.now() }));
      } else {
        if (!existing || !same(await hashPw(pw, existing.salt), existing.hash)) return J({ error: 'Wrong username or password' }, 401);
        name = existing.name;
      }
      const t = token();
      await KV.put('sess:' + t, user.toLowerCase(), { expirationTtl: 60 * 60 * 24 * 90 });
      return J({ user: name, token: t });
    }

    const auth = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const who = auth && /^[0-9a-f]{48}$/.test(auth) ? await KV.get('sess:' + auth) : null;
    if (!who) return J({ error: 'Your login has expired. Please log in again.' }, 401);

    if (path === 'save' && method === 'GET') return J({ save: await KV.get('save:' + who, 'json') });
    if (path === 'save' && method === 'PUT') {
      const txt = await request.text();
      if (txt.length > 400000) return J({ error: 'Save is too big' }, 413);
      JSON.parse(txt);
      await KV.put('save:' + who, txt);
      return J({ ok: true });
    }
    if (path === 'logout' && method === 'POST') { await KV.delete('sess:' + auth); return J({ ok: true }); }
    return J({ error: 'Not found' }, 404);
  } catch (e) {
    return J({ error: 'Something went wrong on the server' }, 500);
  }
}
