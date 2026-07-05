# E-mail instellen (Resend) — van test naar productie

Spoorwijs verstuurt twee transactionele mails: de **boekingsbevestiging** en de
**"verkoop geopend"-melding**. De code staat klaar; je hoeft alleen een sleutel
en (voor echte klanten) een geverifieerd domein toe te voegen. Er verandert
**niets** aan de code — alleen aan `.env` + DNS.

Seam in de code:
- `server/email-dev.mjs` — leest `RESEND_API_KEY` en `EMAIL_FROM` (server-side, nooit in de browser).
- `src/engine/email.ts` — rendert de HTML-mails en post ze naar `/api/email/send`.
- Zonder sleutel draait alles in **simulatiemodus** (mail wordt "klaargezet", niet bezorgd).

---

## Stap 0 — Snel testen (geen domein nodig)

1. Maak een gratis account op https://resend.com en meld je aan met **richard@vanbarneveld.com**.
2. Ga naar **API Keys → Create API Key**, kopieer de sleutel (`re_...`).
3. Zet in `spoorwijs/.env`:
   ```
   RESEND_API_KEY=re_jouw_sleutel
   EMAIL_FROM=Spoorwijs <onboarding@resend.dev>
   ```
4. Herstart de dev-server.

➡️ Nu verstuurt de app echte mails — **maar alleen naar richard@vanbarneveld.com**
(je aanmeldadres). Dat is genoeg om te testen. Voor mails naar wíllekeurige
reizigers ga je verder met domeinverificatie hieronder.

---

## Stap 1 — Kies een afzender-(sub)domein

Verstuur **niet** vanaf je kale hoofddomein. Gebruik een subdomein, zodat de
reputatie van je gewone e-mail (`@vanbarneveld.com`) gescheiden blijft van de
app-mails. Aanrader:

| Situatie | Afzender-subdomein | Voorbeeld-afzender |
|---|---|---|
| Eigen Spoorwijs-domein | `send.spoorwijs.app` | `Spoorwijs <reizen@send.spoorwijs.app>` |
| Voorlopig je eigen domein | `send.vanbarneveld.com` | `Spoorwijs <reizen@send.vanbarneveld.com>` |

Registreer eventueel eerst `spoorwijs.app` (of `.nl`) — dat is professioneler naar
reizigers toe dan `@vanbarneveld.com`.

---

## Stap 2 — Domein toevoegen in Resend

1. Resend → **Domains → Add Domain**.
2. Vul je (sub)domein in, bv. `send.spoorwijs.app`.
3. Kies de regio (EU — bv. Ierland — voor AVG/GDPR: houdt data in de EU).
4. Resend toont nu een lijst DNS-records die je moet toevoegen. **Sluit dit tabblad niet** —
   de exacte waarden zijn uniek voor jouw domein.

---

## Stap 3 — DNS-records plaatsen (bij je domeinregistrar)

Log in bij de partij waar het domein staat (TransIP, Cloudflare, Namecheap, …) en
voeg de records toe die Resend toont. Je krijgt doorgaans:

1. **MX** (voor het subdomein) — voor bounce-afhandeling
   - Host: `send` (of wat Resend aangeeft) · Type: `MX` · Waarde: `feedback-smtp.<regio>.amazonses.com` · Prioriteit: `10`
2. **SPF** (TXT) — geeft aan dat Amazon SES/Resend namens jou mag verzenden
   - Host: `send` · Type: `TXT` · Waarde: `v=spf1 include:amazonses.com ~all`
3. **DKIM** (3× CNAME, óf TXT) — ondertekent je mail zodat hij niet in spam belandt
   - Resend geeft 3 records als `resend._domainkey…` / `xxxx._domainkey…` — neem ze **exact** over.
4. **DMARC** (TXT, aanbevolen) — beleid voor authenticatie
   - Host: `_dmarc.send` · Type: `TXT` · Waarde: `v=DMARC1; p=none; rua=mailto:dmarc@vanbarneveld.com`
   - Begin met `p=none` (alleen monitoren); verscherp later naar `p=quarantine`/`p=reject`.

> Let op: sommige registrars vragen alleen het **subdeel** van de host (`send` i.p.v.
> `send.spoorwijs.app`). Kopieer de waarden 1-op-1 uit Resend en pas alleen de hostnotatie
> aan de conventie van je registrar aan.

---

## Stap 4 — Verifiëren

1. Terug in Resend → **Verify DNS Records**.
2. DNS-propagatie duurt meestal minuten, soms tot ~24 uur. Groen vinkje = klaar.
3. Zet in `spoorwijs/.env` de afzender op je geverifieerde adres:
   ```
   RESEND_API_KEY=re_jouw_sleutel
   EMAIL_FROM=Spoorwijs <reizen@send.spoorwijs.app>
   ```
4. Herstart de dev-server (of deploy).

➡️ Nu verstuurt de app echte mails naar **elke** reiziger.

---

## Stap 5 — Productie (later)

- **Backend i.p.v. dev-middleware:** in productie is er geen Vite-dev-server. Verhuis de
  drie `server/*.mjs`-seams (stripe, email, aggregator) naar serverless functies
  (Vercel/Netlify/Cloudflare) of een kleine Node-service. De frontend blijft identiek —
  hij praat met dezelfde `/api/...`-paden.
- **Webhooks:** Resend kan bezorg-/bounce-/klacht-events terugsturen. Handig om later een
  "mail bezorgd"-status in "Mijn reizen" te tonen.
- **Volume & warm-up:** bij groei het verzendvolume geleidelijk opbouwen (reputatie).
- **Afzender-naam consistent houden** met wat reizigers in de app zien (Spoorwijs).

---

## Checklist

- [ ] Resend-account (aangemeld met richard@vanbarneveld.com)
- [ ] `RESEND_API_KEY` in `.env` (test lukt naar eigen adres)
- [ ] Afzender-subdomein gekozen
- [ ] Domein toegevoegd in Resend
- [ ] MX + SPF + DKIM (+ DMARC) records geplaatst
- [ ] Domein groen geverifieerd
- [ ] `EMAIL_FROM` op geverifieerd adres, server herstart
- [ ] Testmail naar een ánder adres ontvangen
