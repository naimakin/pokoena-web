# pokoena-web

Marketing site for POKO at **pokoena.com**. The SaaS app lives at **app.pokoena.com**.

Built with [Astro](https://astro.build) as a static site, hosted on Cloudflare Pages.
The demo request form is handled by a Cloudflare Pages Function (`functions/api/demo.js`)
that emails each request through [Resend](https://resend.com).

## Local development

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # output in dist/
```

The form endpoint only runs on Cloudflare. To test it locally:

```bash
npm run build
npx wrangler pages dev dist   # put RESEND_API_KEY in a .dev.vars file
```

## Deploy on Cloudflare Pages

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → `naimakin/pokoena-web`.
2. Framework preset: **Astro**. Build command `npm run build`, output directory `dist`.
3. Settings → Variables and secrets:
   - `RESEND_API_KEY` (secret)
   - `DEMO_TO_EMAIL` = `info@pokoena.com` (optional, this is the default)
   - `DEMO_FROM_EMAIL` = `POKO Website <website@pokoena.com>` (optional, this is the default)
4. Custom domains → add `pokoena.com` and `www.pokoena.com`.

## Demo form email (Resend)

1. Create a free Resend account and add the domain `pokoena.com`.
2. Add the DNS records Resend shows (SPF/DKIM) in Cloudflare DNS.
3. Create an API key and save it as `RESEND_API_KEY` in Cloudflare Pages.

Requests arrive at `info@pokoena.com` with Reply-To set to the visitor's email.
`info@pokoena.com` itself must be able to receive mail (for example via Cloudflare Email Routing).
