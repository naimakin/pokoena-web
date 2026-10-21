// Cloudflare Pages Function: POST /api/demo
// Sends demo requests by email through Resend (https://resend.com).
//
// Environment variables (Cloudflare Pages > Settings > Variables and secrets):
//   RESEND_API_KEY   secret, required
//   DEMO_TO_EMAIL    where requests go          (default: nakn@pokoena.com)
//   DEMO_FROM_EMAIL  verified sender in Resend  (default: POKO Website <website@pokoena.com>)

const MAX = { name: 120, email: 200, company: 160, role: 120, org_type: 80, message: 3000 };

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function onRequestPost({ request, env }) {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  const reply = (status, body) =>
    wantsJson
      ? Response.json(body, { status })
      : status === 200
        ? Response.redirect(new URL('/request-demo/thanks', request.url), 303)
        : new Response(body.error || 'Error', { status });

  let form;
  try {
    form = await request.formData();
  } catch {
    return reply(400, { error: 'Invalid form data' });
  }

  // Honeypot: bots fill hidden fields. Pretend success.
  if ((form.get('website') || '').toString().trim()) return reply(200, { ok: true });

  const data = {};
  for (const [key, max] of Object.entries(MAX)) {
    data[key] = (form.get(key) || '').toString().trim().slice(0, max);
  }

  if (!data.name || !data.company || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return reply(422, { error: 'Name, a valid work email and company are required' });
  }

  if (!env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return reply(500, { error: 'Email is not configured' });
  }

  const rows = [
    ['Name', data.name],
    ['Email', data.email],
    ['Company', data.company],
    ['Role', data.role],
    ['Organisation type', data.org_type],
    ['Message', data.message],
  ].filter(([, v]) => v);

  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
  const html =
    '<h2 style="font-family:sans-serif">New POKO demo request</h2><table style="font-family:sans-serif;border-collapse:collapse">' +
    rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top">${k}</td><td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`,
      )
      .join('') +
    '</table>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.DEMO_FROM_EMAIL || 'POKO Website <website@pokoena.com>',
      to: [env.DEMO_TO_EMAIL || 'nakn@pokoena.com'],
      reply_to: data.email,
      subject: `Demo request: ${data.company} (${data.name})`,
      text,
      html,
    }),
  });

  if (!res.ok) {
    console.error('Resend error', res.status, await res.text());
    return reply(502, { error: 'Could not send email' });
  }

  return reply(200, { ok: true });
}

export function onRequest() {
  return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
}
