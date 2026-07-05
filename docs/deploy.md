# Productie-deploy (Vercel)

De drie backend-seams draaien in dev als Vite-middleware en in productie als
**serverless functies** — met exact dezelfde logica (`server/handlers.mjs`). Je
hoeft dus niets te herschrijven om live te gaan.

```
server/handlers.mjs        ← één bron van waarheid (stripe / email / aggregator)
  ├── server/*-dev.mjs      ← adapter voor `vite dev`  (lokaal)
  └── api/**/*.js           ← adapter voor Vercel        (productie, serverless)
```

De frontend praat in beide gevallen met dezelfde paden: `/api/stripe/*`,
`/api/email/*`, `/api/aggregator/*` en `/motis/*`.

## 1. Repo naar Vercel

1. Push de repo naar GitHub/GitLab.
2. Vercel → **Add New → Project** → importeer de repo.
3. Framework preset: **Vite** (autodetectie). Build command `npm run build`,
   output `dist` — staan al goed.
4. `vercel.json` (staat in de repo) regelt twee dingen:
   - `/motis/*` → proxy naar `https://api.transitous.org/*` (de open dienstregeling-API,
     same-origin zodat er geen CORS-probleem is);
   - SPA-fallback: alle overige niet-bestaande paden → `index.html` (deep links werken).
   - De functies in `/api/**` en de statische assets worden hier NIET door geraakt
     (Vercel serveert bestaande files/functies vóór de rewrite).

## 2. Environment variables in Vercel

Project → **Settings → Environment Variables**. Zet dezelfde sleutels als in je
lokale `.env` (allemaal optioneel — zonder draait alles in test/sim):

| Variabele | Waarvoor | Voorbeeld |
|---|---|---|
| `STRIPE_SECRET_KEY` | Betalen | `sk_test_…` (of `sk_live_…` bij echt geld) |
| `RESEND_API_KEY` | E-mail | `re_…` |
| `EMAIL_FROM` | Afzender | `Spoorwijs <onboarding@resend.dev>` (later je eigen domein) |
| `DISTRIBUSION_API_KEY` | Fase-2 aggregator | *(leeg tot er een contract is)* |

Zet ze voor **Production** (en desgewenst Preview). Redeploy na wijzigen.

> Serverless functies lezen deze via `process.env` — nooit in de browser. De
> frontend haalt alleen de *config* op (`{ stripe:true }` etc.), nooit de sleutel zelf.

## 3. Na deploy — checklist

- [ ] `https://<jouw-app>.vercel.app/api/email/config` geeft `{"email":…}` terug.
- [ ] Een reis zoeken werkt (live via `/motis`, anders lokale schatting).
- [ ] Deep link (bv. `/trips`) laadt direct (SPA-fallback werkt).
- [ ] Met Stripe-key: afrekenen redirect naar Stripe en terug naar `/checkout/success`.
- [ ] Met Resend-key + geverifieerd domein: bevestigings- en verkoopmail komen echt aan.

## Andere hosts

Werkt ook op **Netlify** (functions in `netlify/functions/` of via de Vite-plugin) of
**Cloudflare Pages** (Pages Functions in `functions/`). De logica in
`server/handlers.mjs` blijft identiek; alleen de dunne adapter-laag (`api/**`) en de
rewrite-config verschillen per host. Vercel is hier voorbereid; vraag me om een
Netlify-/Cloudflare-variant als je die host kiest.
